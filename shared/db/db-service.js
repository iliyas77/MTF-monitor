/**
 * MTF DB service — single module for all local CRUD and cloud operations.
 *
 * Sections (order matters — later sections override overlapping MTFDb APIs):
 *   1. Call log
 *   2. Local storage / trades / watchlist
 *   3. Cloud sync
 *   4. Money ledger (Firestore SoT for broker wallets)
 *
 * Requires: shared/db/_registry.js, shared/db/firebase-config.js
 */

/* ========================================================================== */
/* 1. Call log                                                                */
/* ========================================================================== */

(function (global) {
    'use strict';

    const LOCAL_KEY = 'mtf_db_call_log';

    function todayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function emptyDay() {
        return { reads: 0, writes: 0, total: 0 };
    }

    function emptyLog() {
        return {
            version: 1,
            days: {},
            totalReads: 0,
            totalWrites: 0,
            total: 0,
            lastFlushedAt: null,
            lastHydratedAt: null,
            dirty: false
        };
    }

    function recomputeTotals(log) {
        let reads = 0;
        let writes = 0;
        Object.keys(log.days || {}).forEach((key) => {
            const day = log.days[key] || emptyDay();
            day.reads = Math.max(0, Number(day.reads) || 0);
            day.writes = Math.max(0, Number(day.writes) || 0);
            day.total = day.reads + day.writes;
            log.days[key] = day;
            reads += day.reads;
            writes += day.writes;
        });
        log.totalReads = reads;
        log.totalWrites = writes;
        log.total = reads + writes;
        return log;
    }

    function normalizeDbCallLog(raw) {
        const base = emptyLog();
        if (!raw || typeof raw !== 'object') return base;
        const days = {};
        const srcDays = raw.days && typeof raw.days === 'object' ? raw.days : {};
        Object.keys(srcDays).forEach((key) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
            const d = srcDays[key] || {};
            const reads = Math.max(0, Number(d.reads) || 0);
            const writes = Math.max(0, Number(d.writes) || 0);
            days[key] = { reads, writes, total: reads + writes };
        });
        base.days = days;
        base.lastFlushedAt = raw.lastFlushedAt ? String(raw.lastFlushedAt) : null;
        base.lastHydratedAt = raw.lastHydratedAt ? String(raw.lastHydratedAt) : null;
        base.dirty = !!raw.dirty;
        return recomputeTotals(base);
    }

    function readLocalLog() {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            if (!raw) return emptyLog();
            return normalizeDbCallLog(JSON.parse(raw));
        } catch (_) {
            return emptyLog();
        }
    }

    function writeLocalLog(log) {
        const normalized = recomputeTotals(normalizeDbCallLog(log));
        try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
        } catch (_) { /* ignore quota */ }
        return normalized;
    }

    function ensureTodayBucket(log) {
        const key = todayKey();
        if (!log.days[key]) log.days[key] = emptyDay();
        return key;
    }

    let suppressDbCallNotes = 0;

    /** Increment local-only counters. Never writes to Firestore. */
    function noteDbCall(kind, reason) {
        if (suppressDbCallNotes > 0) return readLocalLog();
        const log = readLocalLog();
        const key = ensureTodayBucket(log);
        const day = log.days[key];
        if (kind === 'read') day.reads += 1;
        else day.writes += 1;
        day.total = day.reads + day.writes;
        log.dirty = true;
        log.lastReason = reason ? String(reason) : kind;
        log.lastCallAt = new Date().toISOString();
        return writeLocalLog(log);
    }

    function mergeDbCallLogs(a, b) {
        const left = normalizeDbCallLog(a);
        const right = normalizeDbCallLog(b);
        const keys = new Set([].concat(Object.keys(left.days), Object.keys(right.days)));
        const days = {};
        keys.forEach((key) => {
            const l = left.days[key] || emptyDay();
            const r = right.days[key] || emptyDay();
            // Keep the higher counts per day so unflushed local progress is not lost.
            const reads = Math.max(l.reads, r.reads);
            const writes = Math.max(l.writes, r.writes);
            days[key] = { reads, writes, total: reads + writes };
        });
        const out = emptyLog();
        out.days = days;
        out.lastFlushedAt = [left.lastFlushedAt, right.lastFlushedAt]
            .filter(Boolean)
            .sort()
            .pop() || null;
        out.lastHydratedAt = new Date().toISOString();
        out.dirty = !!(left.dirty || right.dirty);
        return recomputeTotals(out);
    }

    /** Pull the synced property into the local working log. */
    function hydrateDbCallLogFromRemote(remoteLog) {
        const merged = mergeDbCallLogs(readLocalLog(), remoteLog);
        merged.lastHydratedAt = new Date().toISOString();
        // After hydrate, dirty only if local still ahead of remote for any day.
        const remote = normalizeDbCallLog(remoteLog);
        merged.dirty = Object.keys(merged.days).some((key) => {
            const l = merged.days[key];
            const r = remote.days[key] || emptyDay();
            return l.reads > r.reads || l.writes > r.writes;
        });
        return writeLocalLog(merged);
    }

    function getDbCallLogSnapshot() {
        return normalizeDbCallLog(readLocalLog());
    }

    function getDbCallLogSummary() {
        const log = readLocalLog();
        const key = todayKey();
        const today = log.days[key] || emptyDay();
        const dayKeys = Object.keys(log.days).sort();
        return {
            todayKey: key,
            todayReads: today.reads,
            todayWrites: today.writes,
            todayTotal: today.total,
            totalReads: log.totalReads,
            totalWrites: log.totalWrites,
            total: log.total,
            dayCount: dayKeys.length,
            dirty: !!log.dirty,
            lastFlushedAt: log.lastFlushedAt,
            lastHydratedAt: log.lastHydratedAt,
            lastCallAt: log.lastCallAt || null,
            lastReason: log.lastReason || '',
            days: log.days
        };
    }

    /**
     * Copy local log into storage.dbCallLog and persist via saveStorage (one cloud write).
     * Call only when the user explicitly asks to keep the log in the database.
     */
    function flushDbCallLogToDatabase() {
        const db = global.MTFDb;
        if (!db || typeof db.getStorage !== 'function' || typeof db.saveStorage !== 'function') {
            return Promise.reject(new Error('Storage unavailable'));
        }
        // Include this flush write in the snapshot so cloud matches local after save.
        const snapshot = getDbCallLogSnapshot();
        const key = todayKey();
        if (!snapshot.days[key]) snapshot.days[key] = emptyDay();
        snapshot.days[key].writes += 1;
        snapshot.days[key].total = snapshot.days[key].reads + snapshot.days[key].writes;
        recomputeTotals(snapshot);
        snapshot.lastFlushedAt = new Date().toISOString();
        snapshot.dirty = false;
        writeLocalLog(snapshot);

        const data = db.getStorage();
        data.dbCallLog = {
            version: 1,
            days: snapshot.days,
            totalReads: snapshot.totalReads,
            totalWrites: snapshot.totalWrites,
            total: snapshot.total,
            lastFlushedAt: snapshot.lastFlushedAt,
            updatedAt: snapshot.lastFlushedAt
        };
        suppressDbCallNotes += 1;
        return db.saveStorage(data).then((ok) => ({
            ok: !!ok,
            log: getDbCallLogSummary()
        })).finally(() => {
            suppressDbCallNotes = Math.max(0, suppressDbCallNotes - 1);
        });
    }

    global.MTFDbRegister({
        LOCAL_DB_CALL_LOG_KEY: LOCAL_KEY,
        noteDbCall,
        readLocalDbCallLog: readLocalLog,
        getDbCallLogSnapshot,
        getDbCallLogSummary,
        hydrateDbCallLogFromRemote,
        mergeDbCallLogs,
        normalizeDbCallLog,
        flushDbCallLogToDatabase
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========================================================================== */
/* 2. Local storage / trades / watchlist                                      */
/* ========================================================================== */

(function (global) {
    'use strict';

    // Money normalize/CRUD live in section 4 (Firestore SoT).
    // Keep thin fallbacks here until that module registers and overrides them.
    function normalizeMoneyAccount(acc) {
        const name = (acc && acc.name) || 'Unnamed';
        return {
            id: acc && acc.id,
            name: name,
            holderName: (acc && acc.holderName) || '',
            broker: (acc && acc.broker) || 'None',
            openingBalance: Number(acc && acc.openingBalance) || 0,
            createdAt: (acc && acc.createdAt) || '',
            updatedAt: (acc && acc.updatedAt) || ''
        };
    }

    function normalizeMoneyEntry(entry) {
        let type = (entry && entry.type) || 'deposit';
        if (type === 'withdrawal') type = 'withdraw';
        return {
            id: entry && entry.id,
            accountId: entry && entry.accountId,
            type: type,
            amount: entry && entry.amount,
            date: (entry && entry.date) || '',
            time: (entry && entry.time) || '',
            note: (entry && entry.note) || '',
            transferGroupId: (entry && entry.transferGroupId) || '',
            transferLeg: (entry && entry.transferLeg) || '',
            transferPeerAccountId: (entry && entry.transferPeerAccountId) || '',
            adjustmentSign: Number(entry && entry.adjustmentSign) === -1 ? -1 : 1,
            createdAt: (entry && entry.createdAt) || '',
            updatedAt: (entry && entry.updatedAt) || ''
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

/* ========================================================================== */
/* 3. Cloud sync                                                              */
/* ========================================================================== */

(function (global) {
    'use strict';

    const db = global.MTFDb;
    const FIREBASE_CONFIG = db.FIREBASE_CONFIG;
    const DEFAULT_SYNC_CODE = db.DEFAULT_SYNC_CODE;

    let fbDb = null;
    let syncCode = null;
    let syncUnsub = null;
    let syncStatus = 'off';
    let syncPushPending = 0;
    let localDataVersion = parseInt(localStorage.getItem('mtf_data_version') || '0', 10);

    const hooks = {
        showToast: function () {},
        showLoading: function () {},
        hideLoading: function () {},
        renderSettings: function () {},
        refreshAllViews: function () {},
        onRemoteApplied: function () {},
        migrateTradeCompanySymbols: function () {}
    };

    function setSyncHooks(next) {
        if (!next || typeof next !== 'object') return;
        Object.keys(next).forEach((key) => {
            if (typeof next[key] === 'function') hooks[key] = next[key];
        });
    }

    function isFirebaseConfigured() {
        return FIREBASE_CONFIG &&
            FIREBASE_CONFIG.apiKey &&
            FIREBASE_CONFIG.apiKey.indexOf('YOUR_') === -1 &&
            FIREBASE_CONFIG.projectId &&
            FIREBASE_CONFIG.projectId.indexOf('YOUR_') === -1;
    }

    function initFirebase() {
        if (fbDb) return true;
        if (!isFirebaseConfigured()) return false;
        if (typeof firebase === 'undefined' || !firebase.initializeApp) return false;
        try {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            fbDb = firebase.firestore();
            return true;
        } catch (e) {
            console.warn('Firebase init failed', e);
            return false;
        }
    }

    function normalizeCode(code) {
        return (code || '').trim().toLowerCase().replace(/\s+/g, '-');
    }

    function getLocalDataVersion() {
        return localDataVersion;
    }

    function getSyncCode() {
        return syncCode;
    }

    function getSyncStatus() {
        return syncStatus;
    }

    function isSyncConnected() {
        return !!(syncCode && fbDb);
    }

    function getSyncNote() {
        return isSyncConnected() ? ' and synced' : '';
    }

    function applyRemoteVersion(remoteVersion) {
        if (remoteVersion > localDataVersion) {
            localDataVersion = remoteVersion;
            try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
        }
    }

    function noteDb(kind, reason) {
        try {
            if (typeof db.noteDbCall === 'function') db.noteDbCall(kind, reason);
        } catch (_) { /* ignore */ }
    }

    function hydrateCallLogFromData(data) {
        try {
            if (data && data.dbCallLog && typeof db.hydrateDbCallLogFromRemote === 'function') {
                db.hydrateDbCallLogFromRemote(data.dbCallLog);
            }
        } catch (_) { /* ignore */ }
    }

    function bumpLocalVersionAndPush(payload) {
        localDataVersion++;
        try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
        return cloudPush(payload, localDataVersion);
    }

    function cloudPush(data, version) {
        if (!fbDb || !syncCode) return Promise.resolve(false);
        syncPushPending++;
        hooks.showLoading();
        const payload = db.ensureMoneyData(data || db.getStorage());
        // Broker wallets live in Firestore subcollections — never dual-write into the blob.
        if (typeof db.stripMoneyFromBlobData === 'function') {
            db.stripMoneyFromBlobData(payload);
        } else {
            payload.moneyAccounts = [];
            payload.moneyEntries = [];
        }
        const ver = version || localDataVersion;
        noteDb('write', 'cloudPush');
        return fbDb.collection('syncs').doc(syncCode).set({
            data: payload,
            dataVersion: ver,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => true).catch(err => {
            console.warn('Cloud push failed', err);
            hooks.showToast('Cloud sync failed. Saved locally — try reconnecting sync.', 'warning');
            return false;
        }).finally(() => { syncPushPending--; hooks.hideLoading(); });
    }

    function mergeTransactions(localTxs, remoteTxs) {
        const byId = {};
        (localTxs || []).forEach(t => { if (t && t.id) byId[t.id] = t; });
        (remoteTxs || []).forEach(t => { if (t && t.id) byId[t.id] = t; });
        return Object.keys(byId).map(k => byId[k]);
    }

    function mergeMoneyEntries(localEntries, remoteEntries) {
        const byId = {};
        (localEntries || []).forEach(e => { if (e && e.id) byId[e.id] = e; });
        (remoteEntries || []).forEach(e => { if (e && e.id) byId[e.id] = e; });
        return Object.keys(byId).map(k => byId[k]);
    }

    function mergeMoneyAccounts(localAccounts, remoteAccounts) {
        const byId = {};
        (localAccounts || []).forEach(a => { if (a && a.id) byId[a.id] = db.normalizeMoneyAccount(a); });
        (remoteAccounts || []).forEach(a => {
            if (a && a.id) byId[a.id] = db.normalizeMoneyAccount({ ...byId[a.id], ...a });
        });
        return Object.keys(byId).map(k => byId[k]);
    }

    function mergeMarketWatchlist(localList, remoteList) {
        // Identity only. Local deletions win via tombstones; remote-only symbols are added.
        const bySym = Object.create(null);
        function ingest(list) {
            (Array.isArray(list) ? list : []).forEach((item) => {
                if (!item) return;
                const s = String(item.s || item.symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
                if (!s) return;
                if (typeof db.isWatchlistTombstoned === 'function' && db.isWatchlistTombstoned(s)) return;
                const n = String(item.n || item.name || (bySym[s] && bySym[s].n) || s).trim() || s;
                bySym[s] = { s, n };
            });
        }
        ingest(remoteList);
        ingest(localList);
        if (typeof db.stripWatchlistTombstones === 'function') {
            return db.stripWatchlistTombstones(Object.keys(bySym).map((k) => bySym[k]));
        }
        return Object.keys(bySym).map((k) => bySym[k]);
    }

    function mergeStorageData(local, remote) {
        // Money ledger is owned by subcollections — keep blob arrays empty.
        const merged = {
            transactions: mergeTransactions(local.transactions, remote.transactions),
            moneyAccounts: [],
            moneyEntries: [],
            marketWatchlist: mergeMarketWatchlist(local.marketWatchlist, remote.marketWatchlist)
        };
        if (typeof db.mergeDbCallLogs === 'function') {
            merged.dbCallLog = db.mergeDbCallLogs(local.dbCallLog, remote.dbCallLog);
        } else if (remote.dbCallLog) {
            merged.dbCallLog = remote.dbCallLog;
        } else if (local.dbCallLog) {
            merged.dbCallLog = local.dbCallLog;
        }
        return merged;
    }

    function connectSync(rawCode, opts) {
        opts = opts || {};
        if (!initFirebase()) {
            if (!opts.silent) hooks.showToast('Cloud sync is not configured yet.', 'warning');
            return;
        }
        const code = normalizeCode(rawCode);
        if (!code || code.length < 4) {
            if (!opts.silent) hooks.showToast('Please enter a sync code (at least 4 characters).', 'warning');
            return;
        }

        if (syncUnsub) { try { syncUnsub(); } catch (_) {} syncUnsub = null; }
        syncCode = code;
        syncStatus = 'connecting';
        localStorage.setItem('mtf_sync_code', code);
        hooks.renderSettings();

        const docRef = fbDb.collection('syncs').doc(code);
        if (!opts.silent) hooks.showLoading();
        let connectLoadingActive = !opts.silent;
        const endConnectLoading = () => {
            if (connectLoadingActive) { connectLoadingActive = false; hooks.hideLoading(); }
        };
        docRef.get().then(snap => {
            noteDb('read', 'connectGet');
            const local = db.getStorage();
            const legacyMoney = {
                moneyAccounts: Array.isArray(local.moneyAccounts) ? local.moneyAccounts.slice() : [],
                moneyEntries: Array.isArray(local.moneyEntries) ? local.moneyEntries.slice() : []
            };
            if (snap.exists && snap.data() && snap.data().data) {
                const remote = db.ensureMoneyData({ transactions: [], ...snap.data().data });
                if (!legacyMoney.moneyAccounts.length && Array.isArray(remote.moneyAccounts)) {
                    legacyMoney.moneyAccounts = remote.moneyAccounts.slice();
                }
                if (!legacyMoney.moneyEntries.length && Array.isArray(remote.moneyEntries)) {
                    legacyMoney.moneyEntries = remote.moneyEntries.slice();
                }
                hydrateCallLogFromData(remote);
                const remoteVersion = snap.data().dataVersion || 0;
                const merged = mergeStorageData(local, remote);
                hydrateCallLogFromData(merged);
                localDataVersion = Math.max(localDataVersion, remoteVersion) + 1;
                try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
                db.saveStorageLocal(merged);
                syncPushPending++;
                noteDb('write', 'connectMergePush');
                docRef.set({
                    data: merged,
                    dataVersion: localDataVersion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).finally(() => { syncPushPending--; });
            } else {
                localDataVersion++;
                try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
                const initial = { ...local };
                if (typeof db.stripMoneyFromBlobData === 'function') db.stripMoneyFromBlobData(initial);
                else { initial.moneyAccounts = []; initial.moneyEntries = []; }
                db.saveStorageLocal(initial);
                syncPushPending++;
                noteDb('write', 'connectInitialPush');
                docRef.set({
                    data: initial,
                    dataVersion: localDataVersion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).finally(() => { syncPushPending--; });
            }
            try { hooks.migrateTradeCompanySymbols({ force: true }); } catch (_) {}
            startSyncListener();
            if (typeof db.onMoneySyncConnected === 'function') {
                Promise.resolve(db.onMoneySyncConnected(legacyMoney)).catch((err) => {
                    console.warn('money ledger connect failed', err);
                }).finally(() => {
                    if (!opts.silent) hooks.showToast('Cloud sync connected!', 'success');
                    hooks.refreshAllViews();
                    endConnectLoading();
                });
            } else {
                if (!opts.silent) hooks.showToast('Cloud sync connected!', 'success');
                hooks.refreshAllViews();
                endConnectLoading();
            }
        }).catch(err => {
            console.warn('connectSync failed', err);
            syncStatus = 'error';
            if (!opts.silent) {
                hooks.showToast('Sync failed: ' + (err && err.message ? err.message : 'unknown error'), 'danger');
            }
            hooks.renderSettings();
            endConnectLoading();
        });
    }

    function startSyncListener() {
        if (!fbDb || !syncCode) return;
        if (syncUnsub) { try { syncUnsub(); } catch (_) {} }
        syncUnsub = fbDb.collection('syncs').doc(syncCode).onSnapshot(snap => {
            syncStatus = 'connected';
            noteDb('read', 'onSnapshot');
            if (!snap.exists || !snap.data() || !snap.data().data) {
                hooks.renderSettings();
                return;
            }
            if (syncPushPending > 0) {
                hooks.renderSettings();
                return;
            }
            const remoteVersion = snap.data().dataVersion || 0;
            if (remoteVersion < localDataVersion) {
                hooks.renderSettings();
                return;
            }
            const remoteData = snap.data().data;
            hydrateCallLogFromData(remoteData);
            db.applyRemoteStorage(remoteData, remoteVersion);
            hooks.refreshAllViews();
            hooks.renderSettings();
        }, err => {
            console.warn('sync listener error', err);
            syncStatus = 'error';
            hooks.renderSettings();
        });
    }

    function disconnectSync() {
        if (syncUnsub) { try { syncUnsub(); } catch (_) {} syncUnsub = null; }
        if (typeof db.onMoneySyncDisconnected === 'function') {
            try { db.onMoneySyncDisconnected(); } catch (_) {}
        }
        syncCode = null;
        syncStatus = 'off';
        localStorage.removeItem('mtf_sync_code');
        hooks.showToast('Cloud sync disconnected. Data stays on this device.', 'info');
        hooks.renderSettings();
    }

    function initSyncOnLoad() {
        if (!initFirebase()) return;
        const saved = localStorage.getItem('mtf_sync_code') || DEFAULT_SYNC_CODE;
        if (saved) connectSync(saved, { silent: true });
    }

    global.MTFDbRegister({
        hooks,
        setSyncHooks,
        isFirebaseConfigured,
        initFirebase,
        cloudPush,
        bumpLocalVersionAndPush,
        applyRemoteVersion,
        getLocalDataVersion,
        getSyncCode,
        getSyncStatus,
        isSyncConnected,
        getSyncNote,
        connectSync,
        disconnectSync,
        initSyncOnLoad,
        DEFAULT_SYNC_CODE,
        FIREBASE_CONFIG
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========================================================================== */
/* 4. Money ledger (Firestore SoT)                                            */
/* ========================================================================== */

(function (global) {
    'use strict';

    const CACHE_KEY = 'mtf_money_ledger_cache';
    const MIGRATED_KEY = 'mtf_money_ledger_migrated';

    const KNOWN_BROKERS = ['Zerodha', 'Dhan', 'Groww', 'Angel One'];

    let accountsCache = [];
    let entriesCache = [];
    let ledgerUnsub = null;
    let migratePromise = null;
    let applyingRemote = false;
    let ledgerHydrated = false;

    function db() {
        return global.MTFDb || {};
    }

    function hooks() {
        return db().hooks || {};
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function newId(prefix) {
        return (prefix || '') + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    function normalizeMoneyAccount(acc) {
        if (!acc || typeof acc !== 'object') {
            return {
                id: '',
                name: 'Unnamed',
                holderName: '',
                broker: 'None',
                openingBalance: 0,
                createdAt: '',
                updatedAt: ''
            };
        }
        const name = String(acc.name || '').trim() || 'Unnamed';
        let broker = String(acc.broker || '').trim();
        if (!broker || broker === 'None') {
            const known = KNOWN_BROKERS.find((b) => b.toLowerCase() === name.toLowerCase());
            broker = known || name;
        }
        return {
            id: acc.id || '',
            name: name,
            holderName: String(acc.holderName || ''),
            broker: broker,
            openingBalance: Number(acc.openingBalance) || 0,
            createdAt: acc.createdAt || '',
            updatedAt: acc.updatedAt || ''
        };
    }

    function normalizeMoneyEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return {
                id: '',
                accountId: '',
                type: 'deposit',
                amount: 0,
                date: '',
                time: '',
                note: '',
                transferGroupId: '',
                transferLeg: '',
                transferPeerAccountId: '',
                adjustmentSign: 1,
                createdAt: '',
                updatedAt: ''
            };
        }
        let type = String(entry.type || 'deposit').toLowerCase();
        if (type === 'withdrawal') type = 'withdraw';
        if (!['deposit', 'withdraw', 'adjustment', 'transfer'].includes(type)) type = 'deposit';
        let adjustmentSign = Number(entry.adjustmentSign);
        if (adjustmentSign !== -1 && adjustmentSign !== 1) adjustmentSign = 1;
        return {
            id: entry.id || '',
            accountId: entry.accountId || '',
            type: type,
            amount: Number(entry.amount) || 0,
            date: entry.date || '',
            time: entry.time || '',
            note: entry.note || '',
            transferGroupId: entry.transferGroupId || '',
            transferLeg: entry.transferLeg === 'in' || entry.transferLeg === 'out' ? entry.transferLeg : '',
            transferPeerAccountId: entry.transferPeerAccountId || '',
            adjustmentSign: adjustmentSign,
            createdAt: entry.createdAt || '',
            updatedAt: entry.updatedAt || ''
        };
    }

    function entrySignedDelta(entry) {
        const amt = Number(entry.amount) || 0;
        if (entry.type === 'deposit') return amt;
        if (entry.type === 'withdraw') return -amt;
        if (entry.type === 'adjustment') return amt * (entry.adjustmentSign === -1 ? -1 : 1);
        if (entry.type === 'transfer') {
            if (entry.transferLeg === 'in') return amt;
            return -amt;
        }
        return 0;
    }

    function entryIsInflow(entry) {
        return entrySignedDelta(entry) > 0;
    }

    function mapToList(map, normalize) {
        if (!map || typeof map !== 'object' || Array.isArray(map)) return [];
        return Object.keys(map).map((id) => normalize({ ...map[id], id })).filter((row) => row.id);
    }

    function listToMap(list) {
        const map = {};
        (list || []).forEach((row) => {
            if (row && row.id) map[row.id] = row;
        });
        return map;
    }

    function loadCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            accountsCache = Array.isArray(parsed.accounts)
                ? parsed.accounts.map(normalizeMoneyAccount).filter((a) => a.id)
                : [];
            entriesCache = Array.isArray(parsed.entries)
                ? parsed.entries.map(normalizeMoneyEntry).filter((e) => e.id)
                : [];
        } catch (_) {
            accountsCache = [];
            entriesCache = [];
        }
    }

    function saveCache() {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                accounts: accountsCache,
                entries: entriesCache,
                updatedAt: nowIso()
            }));
        } catch (_) { /* ignore quota */ }
    }

    function notifyMoneyChanged() {
        if (applyingRemote) return;
        const h = hooks();
        if (typeof h.onMoneyLedgerChanged === 'function') {
            try { h.onMoneyLedgerChanged(); } catch (_) {}
        }
    }

    function requireSync() {
        const d = db();
        if (!d.isSyncConnected || !d.isSyncConnected()) {
            if (typeof hooks().showToast === 'function') {
                hooks().showToast('Connect Cloud Sync to manage broker wallets.', 'warning');
            }
            return false;
        }
        return true;
    }

    function syncDocRef() {
        const d = db();
        if (!d.isSyncConnected || !d.isSyncConnected()) return null;
        const code = d.getSyncCode && d.getSyncCode();
        if (!code || typeof firebase === 'undefined' || !firebase.firestore) return null;
        try {
            return firebase.firestore().collection('syncs').doc(code);
        } catch (_) {
            return null;
        }
    }

    function noteDb(kind, reason) {
        try {
            if (typeof db().noteDbCall === 'function') db().noteDbCall(kind, reason);
        } catch (_) { /* ignore */ }
    }

    function getMoneyAccounts() {
        return accountsCache.slice();
    }

    function getMoneyEntries() {
        return entriesCache.slice();
    }

    function getMoneyEntry(id) {
        return entriesCache.find((e) => e.id === id) || null;
    }

    function setAccountsFromRemote(list) {
        accountsCache = (list || []).map(normalizeMoneyAccount).filter((a) => a.id);
        saveCache();
    }

    function setEntriesFromRemote(list) {
        entriesCache = (list || []).map(normalizeMoneyEntry).filter((e) => e.id);
        saveCache();
    }

    function applyLedgerFromDocData(docData) {
        // A sync doc without moneyLedger must not wipe the local cache (common right
        // after refresh before the first ledger write / snapshot settles).
        if (!docData || !Object.prototype.hasOwnProperty.call(docData, 'moneyLedger')) {
            ledgerHydrated = true;
            return;
        }
        const ledger = docData.moneyLedger || {};
        setAccountsFromRemote(mapToList(ledger.accounts, normalizeMoneyAccount));
        setEntriesFromRemote(mapToList(ledger.entries, normalizeMoneyEntry));
        ledgerHydrated = true;
    }

    function isMoneyLedgerReady() {
        return ledgerHydrated || accountsCache.length > 0 || entriesCache.length > 0;
    }

    function upsertAccountLocal(acc) {
        const n = normalizeMoneyAccount(acc);
        const idx = accountsCache.findIndex((a) => a.id === n.id);
        if (idx === -1) accountsCache.push(n);
        else accountsCache[idx] = n;
        saveCache();
        return n;
    }

    function removeAccountLocal(id) {
        accountsCache = accountsCache.filter((a) => a.id !== id);
        entriesCache = entriesCache.filter((e) => e.accountId !== id);
        saveCache();
    }

    function upsertEntryLocal(entry) {
        const n = normalizeMoneyEntry(entry);
        const idx = entriesCache.findIndex((e) => e.id === n.id);
        if (idx === -1) entriesCache.push(n);
        else entriesCache[idx] = n;
        saveCache();
        return n;
    }

    function removeEntryLocal(id) {
        entriesCache = entriesCache.filter((e) => e.id !== id);
        saveCache();
    }

    function removeEntriesByGroupLocal(groupId) {
        if (!groupId) return;
        entriesCache = entriesCache.filter((e) => e.transferGroupId !== groupId);
        saveCache();
    }

    function firestoreErrorMessage(err) {
        if (!err) return 'Unknown error';
        const code = err.code ? String(err.code) : '';
        const msg = err.message ? String(err.message) : String(err);
        if (code === 'permission-denied' || /permission/i.test(msg)) {
            return 'Cloud permission denied. Check Firestore rules for syncs/{code}.';
        }
        if (code === 'unavailable' || /offline/i.test(msg)) {
            return 'Cloud unavailable. Check your network.';
        }
        return msg.slice(0, 160);
    }

    async function patchLedgerFields(fields) {
        const ref = syncDocRef();
        if (!ref) throw new Error('sync_required');
        noteDb('write', 'moneyLedgerPatch');
        try {
            await ref.update(fields);
        } catch (err) {
            // First wallet write: parent sync doc may not have moneyLedger yet, or doc missing.
            const code = err && err.code;
            if (code === 'not-found' || /no document to update/i.test(String(err && err.message || ''))) {
                await ref.set({ moneyLedger: { accounts: {}, entries: {} } }, { merge: true });
                await ref.update(fields);
                return;
            }
            throw err;
        }
    }

    async function addMoneyAccount(acc) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const ts = nowIso();
        const newAcc = normalizeMoneyAccount({
            ...acc,
            id: acc.id || newId('acc_'),
            createdAt: ts,
            updatedAt: ts
        });
        await patchLedgerFields({
            [`moneyLedger.accounts.${newAcc.id}`]: newAcc
        });
        upsertAccountLocal(newAcc);
        notifyMoneyChanged();
        return newAcc;
    }

    async function updateMoneyAccount(id, updates) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const existing = accountsCache.find((a) => a.id === id);
        if (!existing) return null;
        const next = normalizeMoneyAccount({
            ...existing,
            ...updates,
            id,
            updatedAt: nowIso()
        });
        await patchLedgerFields({
            [`moneyLedger.accounts.${id}`]: next
        });
        upsertAccountLocal(next);
        notifyMoneyChanged();
        return next;
    }

    async function deleteMoneyAccount(id) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const del = firebase.firestore.FieldValue.delete();
        const fields = {
            [`moneyLedger.accounts.${id}`]: del
        };
        entriesCache.filter((e) => e.accountId === id).forEach((e) => {
            fields[`moneyLedger.entries.${e.id}`] = del;
        });
        await patchLedgerFields(fields);
        removeAccountLocal(id);
        notifyMoneyChanged();
    }

    async function addMoneyEntry(entry) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const ts = nowIso();
        const newEntry = normalizeMoneyEntry({
            ...entry,
            id: entry.id || newId(''),
            createdAt: ts,
            updatedAt: ts
        });
        await patchLedgerFields({
            [`moneyLedger.entries.${newEntry.id}`]: newEntry
        });
        upsertEntryLocal(newEntry);
        notifyMoneyChanged();
        return newEntry;
    }

    async function updateMoneyEntry(id, updates) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const existing = getMoneyEntry(id);
        if (!existing) return null;

        if (existing.type === 'transfer' && existing.transferGroupId) {
            const peers = entriesCache.filter((e) => e.transferGroupId === existing.transferGroupId);
            const ts = nowIso();
            const fields = {};
            const updated = [];
            peers.forEach((peer) => {
                const next = normalizeMoneyEntry({
                    ...peer,
                    amount: updates.amount != null ? updates.amount : peer.amount,
                    date: updates.date != null ? updates.date : peer.date,
                    time: updates.time != null ? updates.time : peer.time,
                    note: updates.note != null ? updates.note : peer.note,
                    updatedAt: ts
                });
                fields[`moneyLedger.entries.${next.id}`] = next;
                updated.push(next);
            });
            await patchLedgerFields(fields);
            updated.forEach(upsertEntryLocal);
            notifyMoneyChanged();
            return updated.find((e) => e.id === id) || null;
        }

        const next = normalizeMoneyEntry({
            ...existing,
            ...updates,
            id,
            updatedAt: nowIso()
        });
        await patchLedgerFields({
            [`moneyLedger.entries.${id}`]: next
        });
        upsertEntryLocal(next);
        notifyMoneyChanged();
        return next;
    }

    async function deleteMoneyEntry(id) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        const existing = getMoneyEntry(id);
        if (!existing) return;
        const del = firebase.firestore.FieldValue.delete();

        if (existing.type === 'transfer' && existing.transferGroupId) {
            const peers = entriesCache.filter((e) => e.transferGroupId === existing.transferGroupId);
            const fields = {};
            peers.forEach((e) => {
                fields[`moneyLedger.entries.${e.id}`] = del;
            });
            await patchLedgerFields(fields);
            removeEntriesByGroupLocal(existing.transferGroupId);
            notifyMoneyChanged();
            return;
        }

        await patchLedgerFields({
            [`moneyLedger.entries.${id}`]: del
        });
        removeEntryLocal(id);
        notifyMoneyChanged();
    }

    async function addMoneyTransfer({ fromAccountId, toAccountId, amount, date, time, note }) {
        if (!requireSync()) return Promise.reject(new Error('sync_required'));
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            return Promise.reject(new Error('invalid_transfer'));
        }
        const amt = Number(amount) || 0;
        if (amt <= 0) return Promise.reject(new Error('invalid_amount'));

        const ts = nowIso();
        const groupId = newId('xfer_');
        const outId = newId('');
        const inId = newId('');
        const outEntry = normalizeMoneyEntry({
            id: outId,
            accountId: fromAccountId,
            type: 'transfer',
            amount: amt,
            date: date || '',
            time: time || '',
            note: note || '',
            transferGroupId: groupId,
            transferLeg: 'out',
            transferPeerAccountId: toAccountId,
            createdAt: ts,
            updatedAt: ts
        });
        const inEntry = normalizeMoneyEntry({
            id: inId,
            accountId: toAccountId,
            type: 'transfer',
            amount: amt,
            date: date || '',
            time: time || '',
            note: note || '',
            transferGroupId: groupId,
            transferLeg: 'in',
            transferPeerAccountId: fromAccountId,
            createdAt: ts,
            updatedAt: ts
        });

        await patchLedgerFields({
            [`moneyLedger.entries.${outId}`]: outEntry,
            [`moneyLedger.entries.${inId}`]: inEntry
        });
        upsertEntryLocal(outEntry);
        upsertEntryLocal(inEntry);
        notifyMoneyChanged();
        return { outEntry, inEntry, transferGroupId: groupId };
    }

    function stopMoneyLedgerListeners() {
        if (ledgerUnsub) { try { ledgerUnsub(); } catch (_) {} ledgerUnsub = null; }
    }

    function startMoneyLedgerListeners() {
        stopMoneyLedgerListeners();
        const ref = syncDocRef();
        if (!ref) return;

        ledgerUnsub = ref.onSnapshot((snap) => {
            noteDb('read', 'moneyLedgerSnapshot');
            if (!snap.exists) return;
            applyingRemote = true;
            try {
                applyLedgerFromDocData(snap.data() || {});
            } finally {
                applyingRemote = false;
            }
            notifyMoneyChanged();
        }, (err) => console.warn('moneyLedger listener', err));
    }

    function migratedFlagKey(code) {
        return MIGRATED_KEY + ':' + (code || '');
    }

    function isMigrated(code) {
        try {
            return localStorage.getItem(migratedFlagKey(code)) === '1';
        } catch (_) {
            return false;
        }
    }

    function markMigrated(code) {
        try { localStorage.setItem(migratedFlagKey(code), '1'); } catch (_) {}
    }

    /**
     * One-time copy of blob moneyAccounts/moneyEntries into moneyLedger maps.
     */
    async function migrateMoneyLedgerFromBlob(blobData) {
        const d = db();
        const code = d.getSyncCode && d.getSyncCode();
        if (!code || !d.isSyncConnected || !d.isSyncConnected()) return false;
        if (isMigrated(code)) return false;

        const ref = syncDocRef();
        if (!ref) return false;

        if (migratePromise) return migratePromise;

        migratePromise = (async () => {
            try {
                noteDb('read', 'moneyMigrateCheck');
                const snap = await ref.get();
                const remoteLedger = (snap.exists && snap.data() && snap.data().moneyLedger) || {};
                const remoteHasData =
                    (remoteLedger.accounts && Object.keys(remoteLedger.accounts).length) ||
                    (remoteLedger.entries && Object.keys(remoteLedger.entries).length);

                const blobAccounts = (blobData && blobData.moneyAccounts) || [];
                const blobEntries = (blobData && blobData.moneyEntries) || [];

                if (!remoteHasData && (blobAccounts.length || blobEntries.length)) {
                    const fields = {};
                    blobAccounts.forEach((raw) => {
                        const acc = normalizeMoneyAccount(raw);
                        if (!acc.id) return;
                        if (!acc.createdAt) acc.createdAt = nowIso();
                        if (!acc.updatedAt) acc.updatedAt = acc.createdAt;
                        fields[`moneyLedger.accounts.${acc.id}`] = acc;
                    });
                    blobEntries.forEach((raw) => {
                        const entry = normalizeMoneyEntry(raw);
                        if (!entry.id) return;
                        if (!entry.createdAt) entry.createdAt = nowIso();
                        if (!entry.updatedAt) entry.updatedAt = entry.createdAt;
                        fields[`moneyLedger.entries.${entry.id}`] = entry;
                    });
                    if (Object.keys(fields).length) {
                        noteDb('write', 'moneyMigratePatch');
                        await ref.update(fields);
                    }
                } else if (snap.exists) {
                    applyLedgerFromDocData(snap.data() || {});
                }

                const storage = d.getStorage ? d.getStorage() : (blobData || {});
                const cleaned = {
                    ...storage,
                    moneyAccounts: [],
                    moneyEntries: []
                };
                if (typeof d.saveStorageLocal === 'function') d.saveStorageLocal(cleaned);
                if (typeof d.bumpLocalVersionAndPush === 'function') {
                    await d.bumpLocalVersionAndPush(cleaned);
                }

                markMigrated(code);
                return true;
            } catch (err) {
                console.warn('money ledger migrate failed', err);
                return false;
            } finally {
                migratePromise = null;
            }
        })();

        return migratePromise;
    }

    async function onMoneySyncConnected(blobData) {
        loadCache();
        if (!accountsCache.length && !entriesCache.length && blobData) {
            if (Array.isArray(blobData.moneyAccounts) && blobData.moneyAccounts.length) {
                setAccountsFromRemote(blobData.moneyAccounts);
            }
            if (Array.isArray(blobData.moneyEntries) && blobData.moneyEntries.length) {
                setEntriesFromRemote(blobData.moneyEntries);
            }
        }
        await migrateMoneyLedgerFromBlob(blobData || (db().getStorage && db().getStorage()));
        startMoneyLedgerListeners();
    }

    function onMoneySyncDisconnected() {
        stopMoneyLedgerListeners();
    }

    function stripMoneyFromBlobData(data) {
        if (!data || typeof data !== 'object') return data;
        data.moneyAccounts = [];
        data.moneyEntries = [];
        return data;
    }

    loadCache();
    if (accountsCache.length || entriesCache.length) {
        ledgerHydrated = true;
    }

    global.MTFDbRegister({
        KNOWN_BROKERS,
        normalizeMoneyAccount,
        normalizeMoneyEntry,
        entrySignedDelta,
        entryIsInflow,
        getMoneyAccounts,
        getMoneyEntries,
        getMoneyEntry,
        isMoneyLedgerReady,
        addMoneyAccount,
        updateMoneyAccount,
        deleteMoneyAccount,
        addMoneyEntry,
        updateMoneyEntry,
        deleteMoneyEntry,
        addMoneyTransfer,
        startMoneyLedgerListeners,
        stopMoneyLedgerListeners,
        migrateMoneyLedgerFromBlob,
        onMoneySyncConnected,
        onMoneySyncDisconnected,
        stripMoneyFromBlobData,
        firestoreErrorMessage,
        MONEY_LEDGER_CACHE_KEY: CACHE_KEY
    });
})(typeof window !== 'undefined' ? window : globalThis);
