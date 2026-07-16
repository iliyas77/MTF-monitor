/**
 * Database core functions — application-specific and generic CRUD Firestore operations.
 */
(function (global) {
    'use strict';

    function db() {
        return global.MTFDb || {};
    }

    // ----- Cloud Sync & Firestore State Variables -----
    let fbDb = null;
    let syncCode = null;
    let syncUnsub = null;
    let closedTradesUnsub = null;
    let closedTradesCache = [];
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

    function firestore() {
        if (fbDb) return fbDb;
        initFirebase();
        return fbDb;
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
        // No-op diagnostics logging helper
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
        const payload = db().ensureMoneyData(data || db().getStorage());
        delete payload.dbCallLog;
        if (typeof db().stripMoneyFromBlobData === 'function') {
            db().stripMoneyFromBlobData(payload);
        } else {
            payload.moneyAccounts = [];
            payload.moneyEntries = [];
        }
        const ver = version || localDataVersion;
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
            await createDocument(`syncs/${syncCode}/closed_trades`, {
                ...tx,
                archivedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, id);
            
            const localData = db().getStorage();
            if (localData && localData.transactions) {
                localData.transactions = localData.transactions.filter(t => t.id !== id);
                db().saveStorageLocal(localData);
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
            const res = await getCollection(`syncs/${syncCode}/closed_trades`, {}, { limit: 20 });
            return res.success ? res.data : [];
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
            const res = await deleteDocument(`syncs/${syncCode}/closed_trades`, id);
            return res.success;
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
                if (typeof db().isWatchlistTombstoned === 'function' && db().isWatchlistTombstoned(s)) return;
                const n = String(item.n || item.name || (bySym[s] && bySym[s].n) || s).trim() || s;
                bySym[s] = { s, n };
            });
        }
        ingest(remoteList);
        ingest(localList);
        if (typeof db().stripWatchlistTombstones === 'function') {
            return db().stripWatchlistTombstones(Object.keys(bySym).map((k) => bySym[k]));
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
        merged.dbCallLog = local.dbCallLog || {};
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

        syncCode = code;
        syncStatus = 'connected';
        localStorage.setItem('mtf_sync_code', code);
        hooks.renderSettings();

        const docRef = fbDb.collection('syncs').doc(code);
        if (!opts.silent) hooks.showLoading();
        let connectLoadingActive = !opts.silent;
        const endConnectLoading = () => {
            if (connectLoadingActive) { connectLoadingActive = false; hooks.hideLoading(); }
        };

        docRef.get().then(snap => {
            const local = db().getStorage();
            const legacyMoney = {
                moneyAccounts: Array.isArray(local.moneyAccounts) ? local.moneyAccounts.slice() : [],
                moneyEntries: Array.isArray(local.moneyEntries) ? local.moneyEntries.slice() : []
            };

            const snapData = snap.data() || {};
            if (snapData.data && snapData.data.dbCallLog) delete snapData.data.dbCallLog;
            if (snapData.dbCallLog) delete snapData.dbCallLog;

            if (snap.exists && snapData.data) {
                const remote = db().ensureMoneyData({ transactions: [], ...snapData.data });
                if (!legacyMoney.moneyAccounts.length && Array.isArray(remote.moneyAccounts)) {
                    legacyMoney.moneyAccounts = remote.moneyAccounts.slice();
                }
                if (!legacyMoney.moneyEntries.length && Array.isArray(remote.moneyEntries)) {
                    legacyMoney.moneyEntries = remote.moneyEntries.slice();
                }
                const remoteVersion = snapData.dataVersion || 0;
                const merged = mergeStorageData(local, remote);
                localDataVersion = Math.max(localDataVersion, remoteVersion) + 1;
                try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
                db().saveStorageLocal(merged);
                
                syncPushPending++;
                const cloudMerged = { ...merged };
                delete cloudMerged.dbCallLog;
                docRef.set({
                    data: cloudMerged,
                    dataVersion: localDataVersion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).finally(() => { syncPushPending--; });
            } else {
                localDataVersion++;
                try { localStorage.setItem('mtf_data_version', String(localDataVersion)); } catch (_) {}
                const initial = { ...local };
                if (typeof db().stripMoneyFromBlobData === 'function') db().stripMoneyFromBlobData(initial);
                db().saveStorageLocal(initial);
                
                syncPushPending++;
                const cloudInitial = { ...initial };
                delete cloudInitial.dbCallLog;
                docRef.set({
                    data: cloudInitial,
                    dataVersion: localDataVersion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).finally(() => { syncPushPending--; });
            }

            try { hooks.migrateTradeCompanySymbols({ force: true }); } catch (_) {}
            syncClosedTradesListener();
            if (typeof db().onMoneySyncConnected === 'function') {
                Promise.resolve(db().onMoneySyncConnected(legacyMoney)).catch(() => {});
            }
            if (typeof db().applyLedgerFromDocData === 'function') {
                try { db().applyLedgerFromDocData(snapData); } catch (_) {}
            }
            if (!opts.silent) hooks.showToast('Cloud sync connected!', 'success');
            hooks.refreshAllViews();
            hooks.renderSettings();
            endConnectLoading();
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

    function disconnectSync() {
        if (syncUnsub) { try { syncUnsub(); } catch (_) {} syncUnsub = null; }
        if (closedTradesUnsub) { try { closedTradesUnsub(); } catch (_) {} closedTradesUnsub = null; }
        closedTradesCache = [];
        
        if (typeof db().onMoneySyncDisconnected === 'function') {
            try { db().onMoneySyncDisconnected(); } catch (_) {}
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

    function getClosedTradesCache() {
        return closedTradesCache;
    }

    // ----- Core Query Config & Feed Fetching -----
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
            let openTxs = (db().getStorage().transactions || []).filter(t => (t.status || 'open') !== 'closed');
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
                let closedLocal = (db().getStorage().transactions || []).filter(t => t.status === status);
                filters.forEach(({ field, operator, value }) => {
                    if (field === 'status') return;
                    if (operator === '==') {
                        closedLocal = closedLocal.filter(t => t[field] === value);
                    }
                });
                return Promise.resolve(closedLocal.slice(0, limitVal));
            }
            
            try {
                const res = await getCollection(`syncs/${syncCode}/closed_trades`, queryConfig, { limit: limitVal });
                return res.success ? res.data : [];
            } catch (err) {
                console.error('getFeed Firestore query failed:', err);
                return [];
            }
        }
        
        const openTxs = (db().getStorage().transactions || []).filter(t => (t.status || 'open') !== 'closed');
        let closedTxs = [];
        if (fbDb && syncCode) {
            try {
                const res = await getCollection(`syncs/${syncCode}/closed_trades`, queryConfig, { limit: limitVal });
                if (res.success) closedTxs = res.data;
            } catch (err) {
                console.error('getFeed default closed query failed:', err);
            }
        } else {
            closedTxs = (db().getStorage().transactions || []).filter(t => t.status === 'closed');
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
        closedTradesUnsub = listenToCollection(
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

    // ----- Core CRUD operations (v8 compat style) -----
    function getCallerName() {
        try {
            const stack = new Error().stack;
            if (!stack) return 'general | unknown';
            const lines = stack.split('\n');
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('db-service.js')) continue;
                
                let callerName = 'unknown';
                let track = 'general';

                const funcMatch = line.match(/at\s+([a-zA-Z0-9_$$.]+)\s+\(/);
                if (funcMatch && funcMatch[1]) {
                    const parts = funcMatch[1].split('.');
                    callerName = parts[parts.length - 1];
                } else {
                    const anonMatch = line.match(/at\s+(.+:\d+:\d+)/);
                    if (anonMatch && anonMatch[1]) {
                        const cleanPath = anonMatch[1].replace(/.*\//, '');
                        callerName = `anonymous (${cleanPath})`;
                    }
                }

                const searchStr = (line + ' ' + callerName).toLowerCase();
                if (searchStr.includes('positions') || searchStr.includes('trade') || searchStr.includes('transaction') || searchStr.includes('past')) {
                    track = 'positions';
                } else if (searchStr.includes('watchlist') || searchStr.includes('market') || searchStr.includes('quote')) {
                    track = 'watchlist';
                } else if (searchStr.includes('money') || searchStr.includes('ledger') || searchStr.includes('wallet') || searchStr.includes('account') || searchStr.includes('entry') || searchStr.includes('transfer')) {
                    track = 'money';
                } else if (searchStr.includes('calendar')) {
                    track = 'calendar';
                } else if (searchStr.includes('sync') || searchStr.includes('push') || searchStr.includes('cloud') || searchStr.includes('firebase')) {
                    track = 'sync';
                }

                return `${track} | ${callerName}`;
            }
        } catch (_) {}
        return 'general | unknown';
    }

    async function createDocument(collectionPath, data, docId = null) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: createDocument | Collection: ${collectionPath} | docId: ${docId}`, JSON.stringify(data, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | createDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const col = fb.collection(collectionPath);
            const ref = docId ? col.doc(docId) : col.doc();
            const finalData = { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.set(finalData, { merge: true });
            console.log(`[DB Core] Caller: ${getCallerName()} | createDocument success | Created ID: ${ref.id}`);
            return { success: true, id: ref.id };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | createDocument error:`, error);
            return { success: false, error };
        }
    }

    async function getDocument(collectionPath, docId) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: getDocument | Collection: ${collectionPath} | docId: ${docId}`);
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | getDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const snapshot = await ref.get();
            if (!snapshot.exists) {
                console.log(`[DB Core] Caller: ${getCallerName()} | getDocument: Document not found at ${collectionPath}/${docId}`);
                return { success: false, error: 'Document not found' };
            }
            const docData = snapshot.data();
            if (docData && docData.isDeleted === true) {
                console.log(`[DB Core] Caller: ${getCallerName()} | getDocument: Document is soft-deleted at ${collectionPath}/${docId}`);
                return { success: false, error: 'Document not found' };
            }
            console.log(`[DB Core] Caller: ${getCallerName()} | getDocument success | Data:`, JSON.stringify(docData, null, 2));
            return { success: true, data: { id: snapshot.id, ...docData } };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | getDocument error:`, error);
            return { success: false, error };
        }
    }

    async function updateDocument(collectionPath, docId, data) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: updateDocument | Collection: ${collectionPath} | docId: ${docId}`, JSON.stringify(data, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | updateDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const finalData = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.update(finalData);
            console.log(`[DB Core] Caller: ${getCallerName()} | updateDocument success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | updateDocument error:`, error);
            return { success: false, error };
        }
    }

    async function deleteDocument(collectionPath, docId) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: deleteDocument (Soft-Delete) | Collection: ${collectionPath} | docId: ${docId}`);
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | deleteDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const finalData = { isDeleted: true, deletedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.update(finalData);
            console.log(`[DB Core] Caller: ${getCallerName()} | deleteDocument (Soft-Delete) success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | deleteDocument error:`, error);
            return { success: false, error };
        }
    }

    async function getCollection(collectionPath, queryConfig = {}, options = {}) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: getCollection | Collection: ${collectionPath} | QueryConfig:`, JSON.stringify(queryConfig, null, 2), `| Options:`, JSON.stringify(options, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | getCollection failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const filters = parseQueryConfig(queryConfig);
            let q = fb.collection(collectionPath);

            filters.forEach(({ field, operator, value }) => {
                q = q.where(field, operator, value);
            });

            if (options.orderByField) {
                q = q.orderBy(options.orderByField, options.orderDirection || 'asc');
            }
            if (options.limit) {
                q = q.limit(options.limit);
            }

            const snapshot = await q.get();
            const data = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.isDeleted !== true);
            console.log(`[DB Core] Caller: ${getCallerName()} | getCollection success | Result Feed (${data.length} items):`, JSON.stringify(data, null, 2));
            return { success: true, data };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | getCollection error:`, error);
            return { success: false, error };
        }
    }

    function listenToCollection(collectionPath, callback, queryConfig = {}, options = {}) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: listenToCollection | Collection: ${collectionPath} | QueryConfig:`, JSON.stringify(queryConfig, null, 2), `| Options:`, JSON.stringify(options, null, 2));
        const fb = firestore();
        if (!fb) {
            console.warn(`[DB Core] Caller: ${getCallerName()} | listenToCollection failed: Database offline`);
            callback({ success: false, error: 'Database offline' });
            return () => {};
        }
        const filters = parseQueryConfig(queryConfig);
        let q = fb.collection(collectionPath);

        filters.forEach(({ field, operator, value }) => {
            q = q.where(field, operator, value);
        });

        if (options.orderByField) {
            q = q.orderBy(options.orderByField, options.orderDirection || 'asc');
        }
        if (options.limit) {
            q = q.limit(options.limit);
        }

        const unsubscribe = q.onSnapshot(
            (snapshot) => {
                const data = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter(item => item.isDeleted !== true);
                console.log(`[DB Core] Caller: ${getCallerName()} | listenToCollection snapshot trigger | Feed (${data.length} items):`, JSON.stringify(data, null, 2));
                callback({ success: true, data });
            },
            (error) => {
                console.error(`[DB Core] Caller: ${getCallerName()} | listenToCollection error:`, error);
                callback({ success: false, error });
            }
        );
        return unsubscribe;
    }

    function listenToDocument(collectionPath, docId, callback) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: listenToDocument | Collection: ${collectionPath} | docId: ${docId}`);
        const fb = firestore();
        if (!fb) {
            console.warn(`[DB Core] Caller: ${getCallerName()} | listenToDocument failed: Database offline`);
            callback({ success: false, error: 'Database offline' });
            return () => {};
        }
        const ref = fb.collection(collectionPath).doc(docId);
        const unsubscribe = ref.onSnapshot(
            (snapshot) => {
                if (snapshot.exists) {
                    const docData = snapshot.data();
                    if (docData) {
                        if (docData.data && docData.data.dbCallLog) delete docData.data.dbCallLog;
                        if (docData.dbCallLog) delete docData.dbCallLog;
                    }
                    if (docData && docData.isDeleted === true) {
                        console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger: Document is soft-deleted at ${collectionPath}/${docId}`);
                        callback({ success: false, error: 'Document not found' });
                        return;
                    }
                    console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger | docId: ${snapshot.id} | Data:`, JSON.stringify(docData, null, 2));
                    callback({ success: true, data: { id: snapshot.id, ...docData } });
                } else {
                    console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger: Document not found at ${collectionPath}/${docId}`);
                    callback({ success: false, error: 'Document not found' });
                }
            },
            (error) => {
                console.error(`[DB Core] Caller: ${getCallerName()} | listenToDocument error:`, error);
                callback({ success: false, error });
            }
        );
        return unsubscribe;
    }

    async function batchWrite(operations) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: batchWrite | Operations:`, JSON.stringify(operations, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | batchWrite failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const batch = fb.batch();
            operations.forEach((op) => {
                const ref = fb.collection(op.path).doc(op.docId);
                switch (op.type) {
                    case 'set':
                        batch.set(ref, op.data);
                        break;
                    case 'update':
                        batch.update(ref, op.data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                    default:
                        throw new Error(`Unsupported batch operation: ${op.type}`);
                }
            });
            await batch.commit();
            console.log(`[DB Core] Caller: ${getCallerName()} | batchWrite success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | batchWrite error:`, error);
            return { success: false, error };
        }
    }

    // Register all database core, CRUD, and synchronization functions
    global.MTFDbRegister({
        parseQueryConfig,
        createDocument,
        getDocument,
        updateDocument,
        deleteDocument,
        getCollection,
        listenToCollection,
        listenToDocument,
        batchWrite,
        // Sync management APIs
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
        initSyncOnLoad,
        // Dummy call-log APIs to satisfy smoke test and main.js after deleting call-log-service
        noteDbCall: () => {},
        hydrateDbCallLogFromRemote: () => {},
        mergeDbCallLogs: (a) => a || {},
        normalizeDbCallLog: (a) => a || {},
        flushDbCallLogToDatabase: () => Promise.resolve({ ok: true, log: {} })
    });
})(typeof window !== 'undefined' ? window : globalThis);
