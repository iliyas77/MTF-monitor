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
        data.marketWatchlist = data.marketWatchlist
            .map((item) => ({
                s: String((item && (item.s || item.symbol)) || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, ''),
                n: String((item && (item.n || item.name)) || '').trim()
            }))
            .filter((item) => item.s)
            .map((item) => ({ s: item.s, n: item.n || item.s }));
        return data;
    }

    function getStorage() {
        try {
            const raw = localStorage.getItem('mtf_tracker_data');
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data.transactions)) return ensureMoneyData(data);
            }
        } catch (_) { /* ignore */ }
        return ensureMoneyData({ transactions: [] });
    }

    // Write only to the local cache (used by the cloud listener to avoid echo loops).
    function saveStorageLocal(data) {
        localStorage.setItem('mtf_tracker_data', JSON.stringify(ensureMoneyData(data)));
    }

    // Persist locally AND sync to Firestore when Cloud Sync is connected.
    function saveStorage(data) {
        const payload = ensureMoneyData(data);
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
        saveStorageLocal(ensureMoneyData({ transactions: [], ...remoteData }));
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
