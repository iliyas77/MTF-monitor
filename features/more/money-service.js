/**
 * MTF DB Money Ledger (Firestore SoT) service.
 */
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
        return accountsCache.filter(a => a.isDeleted !== true);
    }

    function getMoneyEntries() {
        return entriesCache.filter(e => e.isDeleted !== true);
    }

    function getMoneyEntry(id) {
        const entry = entriesCache.find((e) => e.id === id) || null;
        console.log("[DB] getMoneyEntry: fetched money ledger entry:", entry);
        return entry;
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
        const d = db();
        const code = d.getSyncCode && d.getSyncCode();
        if (!code) throw new Error('sync_required');
        noteDb('write', 'moneyLedgerPatch');
        try {
            if (typeof d.updateDocument === 'function' && typeof d.createDocument === 'function') {
                const res = await d.updateDocument('syncs', code, fields);
                if (!res.success) {
                    const err = res.error;
                    const codeErr = err && err.code;
                    if (codeErr === 'not-found' || /no document to update/i.test(String(err && err.message || ''))) {
                        await d.createDocument('syncs', { moneyLedger: { accounts: {}, entries: {} } }, code);
                        await d.updateDocument('syncs', code, fields);
                        return;
                    }
                    throw err;
                }
            } else {
                throw new Error('Database core unavailable');
            }
        } catch (err) {
            throw err;
        }
    }

    async function addMoneyAccount(acc) {
        console.log("[DB] addMoneyAccount: adding money account:", acc);
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
        console.log("[DB] updateMoneyAccount: updating money account ID:", id, "with updates:", updates);
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
        const acc = accountsCache.find(a => a.id === id) || null;
        console.log("[DB] deleteMoneyAccount: deleting money account:", acc);
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
        console.log("[DB] addMoneyEntry: adding money ledger entry:", entry);
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
        console.log("[DB] updateMoneyEntry: updating money ledger entry ID:", id, "with updates:", updates);
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
        const entry = getMoneyEntry(id);
        console.log("[DB] deleteMoneyEntry: deleting money ledger entry:", entry);
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
        const d = db();
        const code = d.getSyncCode && d.getSyncCode();
        if (!code) return;

        if (typeof d.listenToDocument === 'function') {
            ledgerUnsub = d.listenToDocument('syncs', code, (res) => {
                noteDb('read', 'moneyLedgerSnapshot');
                if (res.success && res.data) {
                    console.log("[DB] onSnapshot: received moneyLedger document data from Firestore:", res.data);
                    applyingRemote = true;
                    try {
                        applyLedgerFromDocData(res.data);
                    } finally {
                        applyingRemote = false;
                    }
                    notifyMoneyChanged();
                }
            });
        }
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

    async function migrateMoneyLedgerFromBlob(blobData) {
        const d = db();
        const code = d.getSyncCode && d.getSyncCode();
        if (!code || !d.isSyncConnected || !d.isSyncConnected()) return false;
        if (isMigrated(code)) return false;

        if (migratePromise) return migratePromise;

        migratePromise = (async () => {
            try {
                noteDb('read', 'moneyMigrateCheck');
                if (typeof d.getDocument !== 'function' || typeof d.updateDocument !== 'function') {
                    return false;
                }
                const res = await d.getDocument('syncs', code);
                const remoteLedger = (res.success && res.data && res.data.moneyLedger) || {};
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
                        await d.updateDocument('syncs', code, fields);
                    }
                } else if (res.success && res.data) {
                    applyLedgerFromDocData(res.data);
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

    function getMoneyFeed(queryConfig = {}, options = {}) {
        const db = global.MTFDb || {};
        if (typeof db.getFeed === 'function') {
            return db.getFeed(queryConfig, options);
        }
        return Promise.resolve([]);
    }

    function updateMoneyItem(id, updates) {
        if (String(id).startsWith('acc_')) {
            return updateMoneyAccount(id, updates);
        }
        return updateMoneyEntry(id, updates);
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
        MONEY_LEDGER_CACHE_KEY: CACHE_KEY,
        getMoneyFeed,
        updateMoneyItem
    });

    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ moneyService: {} });
    }
})(typeof window !== 'undefined' ? window : globalThis);
