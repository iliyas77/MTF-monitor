/**
 * Positions/Trades Service.
 */
(function (global) {
    'use strict';

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
        const db = global.MTFDb;
        if (db && typeof db.normalizeMoneyAccount === 'function') {
            if (!Array.isArray(data.moneyAccounts)) data.moneyAccounts = [];
            data.moneyAccounts = data.moneyAccounts.map(db.normalizeMoneyAccount);
        }
        if (db && typeof db.normalizeMoneyEntry === 'function') {
            if (!Array.isArray(data.moneyEntries)) data.moneyEntries = [];
            data.moneyEntries = data.moneyEntries.map(db.normalizeMoneyEntry);
        }
        if (!Array.isArray(data.marketWatchlist)) data.marketWatchlist = [];
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
        if (Array.isArray(data.transactions)) {
            data.transactions = data.transactions.map((t) => {
                if (!t || typeof t !== 'object') return t;
                if (t.executed === false) return { ...t, executed: true };
                return t;
            });
        }
        if (data.dbCallLog && typeof data.dbCallLog === 'object') {
            const normalize = db && db.normalizeDbCallLog;
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

    // ----- getStorage render-frame cache -----
    // Prevents repeated JSON.parse of localStorage within the same synchronous
    // render cycle. Invalidated automatically via queueMicrotask after the
    // current call stack completes, and explicitly on save operations.
    let _storageCached = null;
    let _storageCachePending = false;

    function invalidateStorageCache() {
        _storageCached = null;
        _storageCachePending = false;
    }

    function getStorage() {
        if (window.AppPermissions?.localDbEnabled === false) {
            return ensureMoneyData({ transactions: [], marketWatchlist: [] });
        }
        if (_storageCached) return _storageCached;
        try {
            const raw = localStorage.getItem('mtf_tracker_data');
            const rawTxs = localStorage.getItem('mtf_transactions');
            const rawWatchlist = localStorage.getItem('mtf_watchlist');
            
            if (raw || rawTxs || rawWatchlist) {
                let data = ensureMoneyData(raw ? JSON.parse(raw) : {});
                
                // Legacy Migration: Port embedded transactions to decoupled store
                if (Array.isArray(data.transactions) && data.transactions.length > 0 && !rawTxs) {
                    try { localStorage.setItem('mtf_transactions', JSON.stringify(data.transactions)); } catch (_) {}
                    const migrated = { ...data };
                    delete migrated.transactions;
                    try { localStorage.setItem('mtf_tracker_data', JSON.stringify(migrated)); } catch (_) {}
                } else if (rawTxs) {
                    try { data.transactions = JSON.parse(rawTxs); } catch (_) { data.transactions = []; }
                }

                // Legacy Migration: Port embedded marketWatchlist to decoupled store
                if (Array.isArray(data.marketWatchlist) && data.marketWatchlist.length > 0 && !rawWatchlist) {
                    try { localStorage.setItem('mtf_watchlist', JSON.stringify(data.marketWatchlist)); } catch (_) {}
                    const migrated = { ...data };
                    delete migrated.marketWatchlist;
                    try { localStorage.setItem('mtf_tracker_data', JSON.stringify(migrated)); } catch (_) {}
                } else if (rawWatchlist) {
                    try { data.marketWatchlist = JSON.parse(rawWatchlist); } catch (_) { data.marketWatchlist = []; }
                }

                if (Array.isArray(data.transactions)) {
                    if (!smokeTradesAllowed()) {
                        const before = data.transactions.length;
                        stripSmokeTradesFromData(data);
                        if (data.transactions.length !== before) {
                            try { localStorage.setItem('mtf_transactions', JSON.stringify(data.transactions)); } catch (_) {}
                        }
                    }
                    _storageCached = data;
                    if (!_storageCachePending) {
                        _storageCachePending = true;
                        queueMicrotask(invalidateStorageCache);
                    }
                    return data;
                }
            }
        } catch (_) { /* ignore */ }
        return ensureMoneyData({ transactions: [], marketWatchlist: [] });
    }

    function saveStorageLocal(data) {
        if (window.AppPermissions?.localDbEnabled === false) {
            return;
        }
        invalidateStorageCache();
        const payload = ensureMoneyData(data || { transactions: [], marketWatchlist: [] });
        stripSmokeTradesFromData(payload);
        
        // Decouple Transactions Persistence
        const transactions = payload.transactions || [];
        try { localStorage.setItem('mtf_transactions', JSON.stringify(transactions)); } catch (_) {}
        
        // Decouple Watchlist Persistence
        const marketWatchlist = payload.marketWatchlist || [];
        try { localStorage.setItem('mtf_watchlist', JSON.stringify(marketWatchlist)); } catch (_) {}
        
        const mainPayload = { ...payload };
        delete mainPayload.transactions;
        delete mainPayload.marketWatchlist;
        
        localStorage.setItem('mtf_tracker_data', JSON.stringify(mainPayload));
    }

    function saveStorage(data) {
        if (window.AppPermissions?.localDbEnabled === false) {
            return Promise.resolve(true);
        }
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
        if (window.AppPermissions?.localDbEnabled === false) {
            return;
        }
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

    function getOpenTransactions() { 
        return (getStorage().transactions || []).filter(t => (t.status || 'open') !== 'closed' && t.isDeleted !== true); 
    }
    
    function getClosedTransactions() {
        const db = global.MTFDb;
        // NOTE: syncClosedTradesListener() is NOT called here anymore.
        // It is only triggered at proper lifecycle points (connectSync, view-mode switch)
        // to avoid re-subscribing to Firestore on every render/scroll.
        const closedFromCloud = (db && typeof db.getClosedTradesCache === 'function') ? db.getClosedTradesCache() : [];
        const closedFromLocal = (getStorage().transactions || []).filter(t => t.status === 'closed' && t.isDeleted !== true);
        return [...closedFromLocal, ...closedFromCloud].filter(t => t.isDeleted !== true);
    }
    
    function getTransactions() { return [...getOpenTransactions(), ...getClosedTransactions()]; }
    
    function setTransactions(txs) {
        const data = getStorage();
        data.transactions = txs;
        return saveStorage(data);
    }
    
    function setOpenTransactions(openTxs) {
        const data = getStorage();
        const existingClosed = (data.transactions || []).filter(t => t.status === 'closed');
        data.transactions = [...openTxs, ...existingClosed];
        return saveStorage(data);
    }
    
    function addTransaction(tx) {
        console.log("[DB] addTransaction: adding trade transaction:", tx);
        const data = getStorage();
        if (!data.transactions) data.transactions = [];
        tx.id = Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        data.transactions.push(tx);
        return saveStorage(data).then(() => tx);
    }
    
    function updateTransaction(id, updated) {
        console.log("[DB] updateTransaction: updating trade transaction ID:", id, "with updates:", updated);
        const data = getStorage();
        if (!data.transactions) data.transactions = [];
        
        const idx = data.transactions.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) {
            data.transactions[idx] = { ...data.transactions[idx], ...updated };
            return saveStorage(data).then(() => data.transactions[idx]);
        }
        
        // If not in main transactions array, it might be an older trade loaded from the cloud cache
        const closedTxs = getClosedTransactions();
        const closedIdx = closedTxs.findIndex(t => String(t.id) === String(id));
        if (closedIdx !== -1) {
            const updatedTx = { ...closedTxs[closedIdx], ...updated };
            data.transactions.push(updatedTx); // Bring it into the main array
            return saveStorage(data).then(() => updatedTx);
        }
        
        return Promise.resolve(null);
    }
    
    function deleteTransaction(id) {
        console.log("[DB] deleteTransaction: soft-deleting trade transaction ID:", id);
        return updateTransaction(id, { isDeleted: true });
    }
    
    function getTransaction(id) {
        const tx = getTransactions().find(t => String(t.id) === String(id)) || null;
        console.log("[DB] getTransaction: fetched trade transaction:", tx);
        return tx;
    }

    function getPositionsFeed(queryConfig = {}, options = {}) {
        const db = global.MTFDb || {};
        if (typeof db.getFeed === 'function') {
            const nextOptions = { ...options, status: 'open' };
            return db.getFeed(queryConfig, nextOptions).then(res => {
                if (res && res.length) {
                    MTFLogger.log('Received positions feed from DB:', res);
                }
                return res;
            });
        }
        return Promise.resolve([]);
    }

    function updatePositionsItem(id, updated) {
        return updateTransaction(id, updated);
    }


    function deletePositionsItem(id) {
        return deleteTransaction(id);
    }

    global.MTFDbRegister({
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
        getOpenTransactions,
        getClosedTransactions,
        setTransactions,
        setOpenTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransaction,
        getPositionsFeed,
        updatePositionsItem,
        deletePositionsItem
    });

    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ positionsService: {} });
    }
})(typeof window !== 'undefined' ? window : globalThis);
