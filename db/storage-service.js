/**
 * Local storage service — localStorage CRUD for trades, money accounts/entries.
 * Cloud push is delegated to MTFDb.cloudPush (registered by sync-service).
 */
(function (global) {
    'use strict';

    function normalizeMoneyAccount(acc) {
        return {
            id: acc.id,
            name: acc.name || 'Unnamed',
            holderName: acc.holderName || '',
            broker: acc.broker || 'None',
            openingBalance: Number(acc.openingBalance) || 0
        };
    }

    function normalizeMoneyEntry(entry) {
        return {
            id: entry.id,
            accountId: entry.accountId,
            type: entry.type,
            amount: entry.amount,
            date: entry.date || '',
            time: entry.time || '',
            note: entry.note || ''
        };
    }

    function ensureMoneyData(data) {
        if (!Array.isArray(data.moneyAccounts)) data.moneyAccounts = [];
        data.moneyAccounts = data.moneyAccounts.map(normalizeMoneyAccount);
        if (!Array.isArray(data.moneyEntries)) data.moneyEntries = [];
        data.moneyEntries = data.moneyEntries.map(normalizeMoneyEntry);
        if (!Array.isArray(data.marketWatchlist)) data.marketWatchlist = [];
        // Watchlist rows: company identity + optional last quote snapshot from feed refresh.
        data.marketWatchlist = data.marketWatchlist
            .map((item) => {
                const s = String((item && (item.s || item.symbol)) || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
                const n = String((item && (item.n || item.name || item.company)) || '').trim();
                if (!s) return null;
                const out = { s, n: n || s };
                const price = Number(item && item.price);
                if (isFinite(price) && price > 0) {
                    out.price = price;
                    const prev = Number(item.previousClose);
                    const change = Number(item.change);
                    const changePct = Number(item.changePct);
                    if (isFinite(prev)) out.previousClose = prev;
                    if (isFinite(change)) out.change = change;
                    if (isFinite(changePct)) out.changePct = changePct;
                    if (item.updatedAt) out.updatedAt = String(item.updatedAt);
                }
                return out;
            })
            .filter(Boolean);
        // Plan mode removed — promote leftover planned rows into Open.
        if (Array.isArray(data.transactions)) {
            data.transactions = data.transactions.map((t) => {
                if (!t || typeof t !== 'object') return t;
                if (t.executed === false) return { ...t, executed: true };
                return t;
            });
        }
        return data;
    }

    function smokeTradesAllowed() {
        try {
            if (global.__MTF_ALLOW_SMOKE_TRADES__) return true;
            return localStorage.getItem('mtf_allow_smoke_trades') === '1';
        } catch (_) {
            return false;
        }
    }

    function isSmokeTrade(t) {
        if (!t || typeof t !== 'object') return false;
        if (String(t.id || '').startsWith('smoke-')) return true;
        if (/^Smoke\s+(Open|Plan|Win|Loss)\s+Ltd$/i.test(String(t.company || '').trim())) return true;
        if (/^SMOKE[OPWL]$/i.test(String(t.symbol || '').trim())) return true;
        return false;
    }

    function withoutSmokeTrades(transactions) {
        return (Array.isArray(transactions) ? transactions : []).filter((t) => !isSmokeTrade(t));
    }

    function stripSmokeTradesFromData(data) {
        if (!data || typeof data !== 'object') return data;
        if (!Array.isArray(data.transactions)) return data;
        if (smokeTradesAllowed()) return data;
        const cleaned = withoutSmokeTrades(data.transactions);
        if (cleaned.length !== data.transactions.length) {
            data.transactions = cleaned;
        }
        return data;
    }

    function getStorage() {
        try {
            const raw = localStorage.getItem('mtf_tracker_data');
            if (raw) {
                const data = ensureMoneyData(JSON.parse(raw));
                if (Array.isArray(data.transactions)) {
                    if (!smokeTradesAllowed()) {
                        const before = data.transactions.length;
                        stripSmokeTradesFromData(data);
                        // Persist the purge so smoke demo rows do not keep coming back.
                        if (data.transactions.length !== before) {
                            localStorage.setItem('mtf_tracker_data', JSON.stringify(data));
                        }
                    }
                    return data;
                }
            }
        } catch (_) { /* ignore */ }
        return ensureMoneyData({ transactions: [] });
    }

    // Write only to the local cache (used by the cloud listener to avoid echo loops).
    function saveStorageLocal(data) {
        const payload = ensureMoneyData(data || { transactions: [] });
        stripSmokeTradesFromData(payload);
        localStorage.setItem('mtf_tracker_data', JSON.stringify(payload));
    }

    // Persist locally AND sync to Firestore when Cloud Sync is connected.
    function saveStorage(data) {
        const payload = ensureMoneyData(data || { transactions: [] });
        stripSmokeTradesFromData(payload);
        saveStorageLocal(payload);
        const db = global.MTFDb;
        if (db && typeof db.bumpLocalVersionAndPush === 'function') {
            return db.bumpLocalVersionAndPush(payload);
        }
        return Promise.resolve(false);
    }

    function applyRemoteStorage(remoteData, remoteVersion) {
        const db = global.MTFDb;
        if (db && typeof db.applyRemoteVersion === 'function') {
            db.applyRemoteVersion(remoteVersion);
        }
        const payload = ensureMoneyData({ transactions: [], ...remoteData });
        stripSmokeTradesFromData(payload);
        saveStorageLocal(payload);
        if (db && db.hooks && typeof db.hooks.onRemoteApplied === 'function') {
            try { db.hooks.onRemoteApplied(); } catch (_) {}
        }
    }

    function getTransactions() { return getStorage().transactions || []; }
    function setTransactions(txs) {
        const data = getStorage();
        data.transactions = txs;
        return saveStorage(data);
    }
    function addTransaction(tx) {
        const txs = getTransactions();
        tx.id = Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        txs.push(tx);
        return setTransactions(txs).then(() => tx);
    }
    function updateTransaction(id, updated) {
        const txs = getTransactions();
        const idx = txs.findIndex(t => t.id === id);
        if (idx === -1) return Promise.resolve(null);
        txs[idx] = { ...txs[idx], ...updated };
        return setTransactions(txs).then(() => txs[idx]);
    }
    function deleteTransaction(id) {
        let txs = getTransactions();
        txs = txs.filter(t => t.id !== id);
        return setTransactions(txs);
    }
    function getTransaction(id) {
        return getTransactions().find(t => t.id === id) || null;
    }

    function getMoneyAccounts() { return getStorage().moneyAccounts || []; }
    function getMoneyEntries() { return getStorage().moneyEntries || []; }

    function addMoneyAccount(acc) {
        const data = getStorage();
        const newAcc = normalizeMoneyAccount({
            ...acc,
            id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
        });
        data.moneyAccounts.push(newAcc);
        return saveStorage(data).then(() => newAcc);
    }
    function updateMoneyAccount(id, updates) {
        const data = getStorage();
        const idx = data.moneyAccounts.findIndex(a => a.id === id);
        if (idx === -1) return Promise.resolve(null);
        data.moneyAccounts[idx] = normalizeMoneyAccount({ ...data.moneyAccounts[idx], ...updates });
        return saveStorage(data).then(() => data.moneyAccounts[idx]);
    }
    function deleteMoneyAccount(id) {
        const data = getStorage();
        data.moneyAccounts = data.moneyAccounts.filter(a => a.id !== id);
        data.moneyEntries = data.moneyEntries.filter(e => e.accountId !== id);
        return saveStorage(data);
    }
    function addMoneyEntry(entry) {
        const data = getStorage();
        entry.id = Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        data.moneyEntries.push(entry);
        return saveStorage(data).then(() => entry);
    }
    function deleteMoneyEntry(id) {
        const data = getStorage();
        data.moneyEntries = data.moneyEntries.filter(e => e.id !== id);
        return saveStorage(data);
    }
    function updateMoneyEntry(id, updates) {
        const data = getStorage();
        const idx = data.moneyEntries.findIndex(e => e.id === id);
        if (idx === -1) return Promise.resolve(null);
        data.moneyEntries[idx] = { ...data.moneyEntries[idx], ...updates };
        return saveStorage(data).then(() => data.moneyEntries[idx]);
    }
    function getMoneyEntry(id) {
        return getMoneyEntries().find(e => e.id === id) || null;
    }

    global.MTFDbRegister({
        normalizeMoneyAccount,
        normalizeMoneyEntry,
        ensureMoneyData,
        smokeTradesAllowed,
        isSmokeTrade,
        withoutSmokeTrades,
        getStorage,
        saveStorageLocal,
        saveStorage,
        applyRemoteStorage,
        getTransactions,
        setTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransaction,
        getMoneyAccounts,
        getMoneyEntries,
        addMoneyAccount,
        updateMoneyAccount,
        deleteMoneyAccount,
        addMoneyEntry,
        deleteMoneyEntry,
        updateMoneyEntry,
        getMoneyEntry
    });
})(typeof window !== 'undefined' ? window : globalThis);
