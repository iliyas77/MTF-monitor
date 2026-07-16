/**
 * MTF DB Cloud Sync service.
 */
(function (global) {
    'use strict';

    const db = new Proxy({}, {
        get(target, prop) {
            return (global.MTFDb || {})[prop];
        }
    });

    let fbDb = null;
    let syncCode = null;
    let syncUnsub = null;
    let closedTradesUnsub = null;
    let closedTradesCache = [];
    let syncStatus = 'off';
    let syncPushPending = 0;
    let localDataVersion = parseInt(localStorage.getItem('mtf_data_version') || '0', 10);

    function getClosedTradesCache() {
        return closedTradesCache;
    }

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
        const config = db().FIREBASE_CONFIG;
        return config &&
            config.apiKey &&
            config.apiKey.indexOf('YOUR_') === -1 &&
            config.projectId &&
            config.projectId.indexOf('YOUR_') === -1;
    }

    function initFirebase() {
        if (fbDb) return true;
        if (!isFirebaseConfigured()) return false;
        if (typeof firebase === 'undefined' || !firebase.initializeApp) return false;
        try {
            if (!firebase.apps || !firebase.apps.length) {
                firebase.initializeApp(db().FIREBASE_CONFIG);
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
        console.log("[DB] cloudPush: pushing data to Firestore document:", syncCode, data);
        if (!fbDb || !syncCode) return Promise.resolve(false);
        syncPushPending++;
        hooks.showLoading();
        const payload = db.ensureMoneyData(data || db.getStorage());
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

    async function archiveTradeToCloud(tx) {
        console.log("[DB] archiveTradeToCloud: archiving closed trade transaction to Firestore:", tx);
        if (!fbDb || !syncCode) return Promise.reject(new Error('sync_required'));
        const id = tx.id;
        hooks.showLoading();
        try {
            if (typeof db.createDocument === 'function') {
                const res = await db.createDocument(`syncs/${syncCode}/closed_trades`, {
                    ...tx,
                    archivedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, id);
                if (!res.success) throw res.error;
            } else {
                throw new Error('Database core unavailable');
            }
            
            const localData = db.getStorage();
            if (localData && localData.transactions) {
                localData.transactions = localData.transactions.filter(t => t.id !== id);
                db.saveStorageLocal(localData);
                bumpLocalVersionAndPush(localData);
            }
            return true;
        } catch (err) {
            console.error('Failed to archive trade:', err);
            return false;
        } finally {
            hooks.hideLoading();
        }
    }

    async function fetchClosedTradesFromCloud() {
        console.log("[DB] fetchClosedTradesFromCloud: fetching closed trades collection from Firestore document:", syncCode);
        if (!fbDb || !syncCode) return [];
        try {
            if (typeof db.getCollection === 'function') {
                const res = await db.getCollection(`syncs/${syncCode}/closed_trades`, {}, { limit: 20 });
                return res.success ? res.data : [];
            }
            return [];
        } catch (err) {
            console.error('Failed to fetch closed trades:', err);
            return [];
        }
    }

    async function deleteClosedTradeFromCloud(id) {
        const tx = closedTradesCache.find(t => t.id === id) || null;
        console.log("[DB] deleteClosedTradeFromCloud: deleting closed trade from Firestore:", tx);
        if (!fbDb || !syncCode) return Promise.reject(new Error('sync_required'));
        try {
            if (typeof db.deleteDocument === 'function') {
                const res = await db.deleteDocument(`syncs/${syncCode}/closed_trades`, id);
                return res.success;
            }
            return false;
        } catch (err) {
            console.error('Failed to delete closed trade:', err);
            return false;
        }
    }

    function mergeTransactions(localTxs, remoteTxs) {
        const byId = {};
        (localTxs || []).forEach(t => { if (t && t.id) byId[t.id] = t; });
        (remoteTxs || []).forEach(t => { if (t && t.id) byId[t.id] = t; });
        return Object.keys(byId).map(k => byId[k]);
    }

    function mergeMarketWatchlist(localList, remoteList) {
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

    const parseQueryConfig = (config = {}) => {
        const filters = [];
        
        // 1. Equality (where)
        if (config.where) {
            Object.entries(config.where).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    filters.push({ field, operator: '==', value });
                }
            });
        }
        
        // 2. Range (min / max on a single field)
        if (config.range) {
            const { field, min, max } = config.range;
            if (!field) throw new Error('Range config must specify a "field"');
            if (min !== undefined && min !== null) {
                filters.push({ field, operator: '>=', value: min });
            }
            if (max !== undefined && max !== null) {
                filters.push({ field, operator: '<=', value: max });
            }
        }
        
        // 3. Array contains
        if (config.arrayContains) {
            const { field, value } = config.arrayContains;
            if (value !== undefined && value !== null) {
                filters.push({ field, operator: 'array-contains', value });
            }
        }
        
        // 4. Raw custom filters
        if (config.filters && Array.isArray(config.filters)) {
            filters.push(...config.filters);
        }
        
        return filters;
    };

    async function getFeed(queryConfig = {}, options = {}) {
        console.log("[DB] getFeed: fetching data feed with queryConfig:", queryConfig, "options:", options);
        
        const limitVal = Number(options.limit) || 20;
        const filters = parseQueryConfig(queryConfig);
        
        const statusFilter = filters.find(f => f.field === 'status' && f.operator === '==');
        const status = statusFilter ? statusFilter.value : 'all';
        
        if (status === 'open') {
            let openTxs = (db.getStorage().transactions || []).filter(t => (t.status || 'open') !== 'closed');
            filters.forEach(({ field, operator, value }) => {
                if (field === 'status') return;
                if (operator === '==') {
                    openTxs = openTxs.filter(t => t[field] === value);
                }
            });
            return Promise.resolve(openTxs.slice(0, limitVal));
        }
        
        if (status === 'closed' || status === 'cancelled') {
            if (!fbDb || !syncCode) {
                let closedLocal = (db.getStorage().transactions || []).filter(t => t.status === status);
                filters.forEach(({ field, operator, value }) => {
                    if (field === 'status') return;
                    if (operator === '==') {
                        closedLocal = closedLocal.filter(t => t[field] === value);
                    }
                });
                return Promise.resolve(closedLocal.slice(0, limitVal));
            }
            
            try {
                if (typeof db.getCollection === 'function') {
                    const res = await db.getCollection(`syncs/${syncCode}/closed_trades`, queryConfig, { limit: limitVal });
                    return res.success ? res.data : [];
                }
                return [];
            } catch (err) {
                console.error('getFeed Firestore query failed:', err);
                return [];
            }
        }
        
        const openTxs = (db.getStorage().transactions || []).filter(t => (t.status || 'open') !== 'closed');
        let closedTxs = [];
        if (fbDb && syncCode) {
            try {
                if (typeof db.getCollection === 'function') {
                    const res = await db.getCollection(`syncs/${syncCode}/closed_trades`, queryConfig, { limit: limitVal });
                    if (res.success) closedTxs = res.data;
                }
            } catch (err) {
                console.error('getFeed default closed query failed:', err);
            }
        } else {
            closedTxs = (db.getStorage().transactions || []).filter(t => t.status === 'closed');
        }
        
        const combined = [...openTxs, ...closedTxs].slice(0, limitVal);
        return combined;
    }

    function syncClosedTradesListener() {
        if (!fbDb || !syncCode) return;
        
        const helpers = global.MTFAppHelpers || {};
        const tradePages = helpers.tradePages || {};
        const viewMode = typeof tradePages.getTradesViewMode === 'function' ? tradePages.getTradesViewMode() : 'trade';
        
        if (viewMode !== 'past') {
            if (closedTradesUnsub) {
                console.log("[DB] syncClosedTradesListener: view mode is not 'past', unsubscribing from closed trades.");
                try { closedTradesUnsub(); } catch (_) {}
                closedTradesUnsub = null;
            }
            closedTradesCache = [];
            return;
        }
        
        const statusVal = typeof tradePages.getTradeCancelledOnly === 'function' && tradePages.getTradeCancelledOnly() ? 'cancelled' : 'closed';
        const fromDate = typeof tradePages.getPastFrom === 'function' ? tradePages.getPastFrom() : null;
        const toDate = typeof tradePages.getPastTo === 'function' ? tradePages.getPastTo() : null;
        const pnlFilter = typeof tradePages.getPastPnlFilter === 'function' ? tradePages.getPastPnlFilter() : 'all';
        
        const queryConfig = {
            where: { status: statusVal },
            range: (fromDate || toDate) ? { field: 'sellDate', min: fromDate || undefined, max: toDate || undefined } : undefined
        };
        
        if (pnlFilter === 'verified') {
            queryConfig.where.verified = true;
        } else if (pnlFilter === 'profit') {
            queryConfig.filters = [{ field: 'netProfit', operator: '>', value: 0 }];
        } else if (pnlFilter === 'loss') {
            queryConfig.filters = [{ field: 'netProfit', operator: '<', value: 0 }];
        }
        
        const queryKey = `${statusVal}_${fromDate}_${toDate}_${pnlFilter}`;
        if (global.__lastClosedQueryKey === queryKey && closedTradesUnsub) {
            return;
        }
        
        global.__lastClosedQueryKey = queryKey;
        if (closedTradesUnsub) {
            try { closedTradesUnsub(); } catch (_) {}
            closedTradesUnsub = null;
        }
        
        console.log(`[DB] syncClosedTradesListener: subscribing with query key: ${queryKey}`);
        if (typeof db.listenToCollection === 'function') {
            closedTradesUnsub = db.listenToCollection(
                `syncs/${syncCode}/closed_trades`,
                (res) => {
                    if (res.success) {
                        closedTradesCache = res.data;
                        console.log("[DB] onSnapshot: received filtered closed trades collection from Firestore (limited to 20):", closedTradesCache);
                        hooks.refreshAllViews();
                    }
                },
                queryConfig,
                { limit: 20 }
            );
        }
    }

    function startSyncListener() {
        if (!fbDb || !syncCode) return;
        
        if (syncUnsub) { try { syncUnsub(); } catch (_) {} }
        syncUnsub = fbDb.collection('syncs').doc(syncCode).onSnapshot(snap => {
            syncStatus = 'connected';
            noteDb('read', 'onSnapshot');
            const snapData = snap.data() || {};
            console.log("[DB] onSnapshot: received sync document data from Firestore:", snapData);
            if (!snap.exists || !snapData || !snapData.data) {
                hooks.renderSettings();
                return;
            }
            if (syncPushPending > 0) {
                hooks.renderSettings();
                return;
            }
            const remoteVersion = snapData.dataVersion || 0;
            if (remoteVersion < localDataVersion) {
                hooks.renderSettings();
                return;
            }
            const remoteData = snapData.data;
            hydrateCallLogFromData(remoteData);
            db.applyRemoteStorage(remoteData, remoteVersion);
            hooks.refreshAllViews();
            hooks.renderSettings();
        }, err => {
            console.warn('sync listener error', err);
            syncStatus = 'error';
            hooks.renderSettings();
        });

        syncClosedTradesListener();
    }

    function disconnectSync() {
        if (syncUnsub) { try { syncUnsub(); } catch (_) {} syncUnsub = null; }
        if (closedTradesUnsub) { try { closedTradesUnsub(); } catch (_) {} closedTradesUnsub = null; }
        closedTradesCache = [];
        
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
        const saved = localStorage.getItem('mtf_sync_code') || db().DEFAULT_SYNC_CODE;
        if (saved) connectSync(saved, { silent: true });
    }

    global.MTFDbRegister({
        hooks,
        setSyncHooks,
        isFirebaseConfigured,
        initFirebase,
        cloudPush,
        archiveTradeToCloud,
        fetchClosedTradesFromCloud,
        getClosedTradesCache,
        getFeed,
        syncClosedTradesListener,
        deleteClosedTradeFromCloud,
        bumpLocalVersionAndPush,
        applyRemoteVersion,
        getLocalDataVersion,
        getSyncCode,
        getFirebaseDb: () => fbDb,
        getSyncStatus,
        isSyncConnected,
        getSyncNote,
        connectSync,
        disconnectSync,
        initSyncOnLoad
    });

    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ syncService: {} });
    }
})(typeof window !== 'undefined' ? window : globalThis);
