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

    const MARKET_QUOTE_CACHE_KEY = 'mtf_market_quote_cache';
    const WATCHLIST_TOMBSTONE_KEY = 'mtf_watchlist_removed';
    const WATCHLIST_TOMBSTONE_MS = 7 * 24 * 60 * 60 * 1000;

    function normalizeWatchlistSymbol(symbol) {
        return String(symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
    }

    function readWatchlistTombstones() {
        try {
            const raw = localStorage.getItem(WATCHLIST_TOMBSTONE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            const now = Date.now();
            let changed = false;
            Object.keys(parsed).forEach((key) => {
                const t = Date.parse(parsed[key] || '');
                if (isNaN(t) || (now - t) > WATCHLIST_TOMBSTONE_MS) {
                    delete parsed[key];
                    changed = true;
                }
            });
            if (changed) {
                try { localStorage.setItem(WATCHLIST_TOMBSTONE_KEY, JSON.stringify(parsed)); } catch (_) {}
            }
            return parsed;
        } catch (_) {
            return {};
        }
    }

    function writeWatchlistTombstones(map) {
        try {
            localStorage.setItem(WATCHLIST_TOMBSTONE_KEY, JSON.stringify(map || {}));
        } catch (_) { /* ignore */ }
    }

    function isWatchlistTombstoned(symbol) {
        const key = normalizeWatchlistSymbol(symbol);
        if (!key) return false;
        return !!readWatchlistTombstones()[key];
    }

    function tombstoneWatchlistSymbol(symbol) {
        const key = normalizeWatchlistSymbol(symbol);
        if (!key) return;
        const map = readWatchlistTombstones();
        map[key] = new Date().toISOString();
        writeWatchlistTombstones(map);
    }

    function clearWatchlistTombstone(symbol) {
        const key = normalizeWatchlistSymbol(symbol);
        if (!key) return;
        const map = readWatchlistTombstones();
        if (!map[key]) return;
        delete map[key];
        writeWatchlistTombstones(map);
    }

    function stripWatchlistTombstones(list) {
        return (Array.isArray(list) ? list : []).filter((item) => {
            const s = normalizeWatchlistSymbol(item && (item.s || item.symbol));
            return s && !isWatchlistTombstoned(s);
        });
    }

    function readMarketQuoteCacheMap() {
        try {
            const raw = localStorage.getItem(MARKET_QUOTE_CACHE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writeMarketQuoteCacheMap(map) {
        try {
            localStorage.setItem(MARKET_QUOTE_CACHE_KEY, JSON.stringify(map || {}));
        } catch (_) { /* ignore quota */ }
    }

    /** Move legacy quote snapshots off the synced watchlist into a local-only cache. */
    function migrateWatchlistQuotesToLocalCache(list) {
        if (!Array.isArray(list) || !list.length) return;
        const quoteMap = readMarketQuoteCacheMap();
        let changed = false;
        list.forEach((item) => {
            if (!item) return;
            const s = String(item.s || item.symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
            if (!s) return;
            const price = Number(item.price);
            if (!isFinite(price) || price <= 0) return;
            const n = String(item.n || item.name || s).trim() || s;
            const updatedAt = item.updatedAt ? String(item.updatedAt) : null;
            const prev = quoteMap[s];
            const prevT = prev && prev.updatedAt ? Date.parse(prev.updatedAt) : NaN;
            const nextT = updatedAt ? Date.parse(updatedAt) : NaN;
            if (prev && isFinite(prevT) && isFinite(nextT) && prevT >= nextT) return;
            const previousClose = Number(item.previousClose);
            const change = Number(item.change);
            const changePct = Number(item.changePct);
            quoteMap[s] = {
                symbol: s,
                name: n,
                price,
                previousClose: isFinite(previousClose) ? previousClose : null,
                change: isFinite(change) ? change : null,
                changePct: isFinite(changePct) ? changePct : null,
                updatedAt: updatedAt || new Date().toISOString()
            };
            changed = true;
        });
        if (changed) writeMarketQuoteCacheMap(quoteMap);
    }

    function ensureMoneyData(data) {
        if (!Array.isArray(data.moneyAccounts)) data.moneyAccounts = [];
        data.moneyAccounts = data.moneyAccounts.map(normalizeMoneyAccount);
        if (!Array.isArray(data.moneyEntries)) data.moneyEntries = [];
        data.moneyEntries = data.moneyEntries.map(normalizeMoneyEntry);
        if (!Array.isArray(data.marketWatchlist)) data.marketWatchlist = [];
        // Watchlist rows are identity only ({s, n}). Live quotes live in a separate
        // localStorage cache so refresh does not inflate Firestore read/write cost.
        migrateWatchlistQuotesToLocalCache(data.marketWatchlist);
        data.marketWatchlist = data.marketWatchlist
            .map((item) => {
                const s = String((item && (item.s || item.symbol)) || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
                const n = String((item && (item.n || item.name || item.company)) || '').trim();
                if (!s) return null;
                return { s, n: n || s };
            })
            .filter(Boolean);
        data.marketWatchlist = stripWatchlistTombstones(data.marketWatchlist);
        // Plan mode removed — promote leftover planned rows into Open.
        if (Array.isArray(data.transactions)) {
            data.transactions = data.transactions.map((t) => {
                if (!t || typeof t !== 'object') return t;
                if (t.executed === false) return { ...t, executed: true };
                return t;
            });
        }
        // Synced DB-call log (written only on manual flush — live counters stay in localStorage).
        if (data.dbCallLog && typeof data.dbCallLog === 'object') {
            const normalize = global.MTFDb && global.MTFDb.normalizeDbCallLog;
            data.dbCallLog = typeof normalize === 'function'
                ? normalize(data.dbCallLog)
                : data.dbCallLog;
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
                let hadWatchlistQuotes = false;
                try {
                    const peek = JSON.parse(raw);
                    if (Array.isArray(peek.marketWatchlist)) {
                        hadWatchlistQuotes = peek.marketWatchlist.some((item) => {
                            const price = Number(item && item.price);
                            return isFinite(price) && price > 0;
                        });
                    }
                } catch (_) { /* ignore */ }
                const data = ensureMoneyData(JSON.parse(raw));
                if (hadWatchlistQuotes) {
                    // Persist identity-only watchlist locally (no cloud push) after migrating quotes.
                    try {
                        localStorage.setItem('mtf_tracker_data', JSON.stringify(data));
                    } catch (_) { /* ignore */ }
                }
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
        MARKET_QUOTE_CACHE_KEY,
        readMarketQuoteCacheMap,
        writeMarketQuoteCacheMap,
        readWatchlistTombstones,
        isWatchlistTombstoned,
        tombstoneWatchlistSymbol,
        clearWatchlistTombstone,
        stripWatchlistTombstones,
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
