/**
 * Cloud sync service — Firebase Firestore sync-code based sync.
 * UI callbacks (toast, loading, refresh, settings) are provided via MTFDb.hooks.
 */
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
        const merged = {
            transactions: mergeTransactions(local.transactions, remote.transactions),
            moneyAccounts: mergeMoneyAccounts(local.moneyAccounts, remote.moneyAccounts),
            moneyEntries: mergeMoneyEntries(local.moneyEntries, remote.moneyEntries),
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
            if (snap.exists && snap.data() && snap.data().data) {
                const remote = db.ensureMoneyData({ transactions: [], ...snap.data().data });
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
                db.saveStorageLocal(local);
                syncPushPending++;
                noteDb('write', 'connectInitialPush');
                docRef.set({
                    data: local,
                    dataVersion: localDataVersion,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true }).finally(() => { syncPushPending--; });
            }
            try { hooks.migrateTradeCompanySymbols({ force: true }); } catch (_) {}
            startSyncListener();
            if (!opts.silent) hooks.showToast('Cloud sync connected!', 'success');
            hooks.refreshAllViews();
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
