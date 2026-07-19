/**
 * MTF DB Money Ledger (Local Mock Implementation)
 */
(function (global) {
    'use strict';

    const CACHE_KEY = 'mtf_money_ledger_cache_mock';
    const KNOWN_BROKERS = ['Zerodha', 'Dhan', 'Groww', 'Angel One'];

    let accountsCache = [];
    let entriesCache = [];

    function db() { return global.MTFDb || {}; }
    function hooks() { return db().hooks || {}; }
    function nowIso() { return new Date().toISOString(); }
    function newId(prefix) { return (prefix || '') + Date.now() + '_' + Math.random().toString(36).substring(2, 8); }

    function normalizeMoneyAccount(acc) {
        if (!acc || typeof acc !== 'object') {
            return { id: '', name: 'Unnamed', holderName: '', broker: 'None', openingBalance: 0, createdAt: '', updatedAt: '' };
        }
        const name = String(acc.name || '').trim() || 'Unnamed';
        let broker = String(acc.broker || '').trim();
        if (!broker || broker === 'None') broker = name;
        return {
            id: acc.id || '', name: name, holderName: String(acc.holderName || ''), broker: broker,
            openingBalance: Number(acc.openingBalance) || 0, createdAt: acc.createdAt || '', updatedAt: acc.updatedAt || ''
        };
    }

    function normalizeMoneyEntry(entry) {
        if (!entry || typeof entry !== 'object') {
            return { id: '', accountId: '', type: 'deposit', amount: 0, date: '', time: '', note: '', transferGroupId: '', transferLeg: '', transferPeerAccountId: '', adjustmentSign: 1, createdAt: '', updatedAt: '' };
        }
        return {
            id: entry.id || '', accountId: entry.accountId || '', type: entry.type || 'deposit',
            amount: Number(entry.amount) || 0, date: entry.date || '', time: entry.time || '', note: entry.note || '',
            transferGroupId: entry.transferGroupId || '', transferLeg: entry.transferLeg || '',
            transferPeerAccountId: entry.transferPeerAccountId || '', adjustmentSign: entry.adjustmentSign || 1,
            createdAt: entry.createdAt || '', updatedAt: entry.updatedAt || ''
        };
    }

    function entrySignedDelta(entry) {
        const amt = Number(entry.amount) || 0;
        if (entry.type === 'deposit') return amt;
        if (entry.type === 'withdraw') return -amt;
        if (entry.type === 'adjustment') return amt * (entry.adjustmentSign === -1 ? -1 : 1);
        if (entry.type === 'transfer') return entry.transferLeg === 'in' ? amt : -amt;
        return 0;
    }

    function entryIsInflow(entry) { return entrySignedDelta(entry) > 0; }

    function loadCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            accountsCache = Array.isArray(parsed.accounts) ? parsed.accounts.map(normalizeMoneyAccount) : [];
            entriesCache = Array.isArray(parsed.entries) ? parsed.entries.map(normalizeMoneyEntry) : [];
        } catch (_) { accountsCache = []; entriesCache = []; }
    }

    function saveCache() {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ accounts: accountsCache, entries: entriesCache, updatedAt: nowIso() })); } catch (_) {}
    }

    function notifyMoneyChanged() {
        if (typeof hooks().onMoneyLedgerChanged === 'function') {
            try { hooks().onMoneyLedgerChanged(); } catch (_) {}
        }
    }

    function getMoneyAccounts() { return accountsCache.filter(a => a.isDeleted !== true); }
    function getMoneyEntries() { return entriesCache.filter(e => e.isDeleted !== true); }
    function getMoneyEntry(id) { return entriesCache.find((e) => e.id === id) || null; }
    function isMoneyLedgerReady() { return true; }

    async function addMoneyAccount(acc) {
        const ts = nowIso();
        const newAcc = normalizeMoneyAccount({ ...acc, id: acc.id || newId('acc_'), createdAt: ts, updatedAt: ts });
        accountsCache.push(newAcc);
        saveCache();
        notifyMoneyChanged();
        return newAcc;
    }

    async function updateMoneyAccount(id, updates) {
        const idx = accountsCache.findIndex((a) => a.id === id);
        if (idx === -1) return null;
        accountsCache[idx] = normalizeMoneyAccount({ ...accountsCache[idx], ...updates, id, updatedAt: nowIso() });
        saveCache();
        notifyMoneyChanged();
        return accountsCache[idx];
    }

    async function deleteMoneyAccount(id) {
        const idx = accountsCache.findIndex(a => a.id === id);
        if (idx !== -1) {
            accountsCache[idx].isDeleted = true;
            accountsCache[idx].updatedAt = nowIso();
        }
        entriesCache.filter((e) => e.accountId === id).forEach((e) => {
            e.isDeleted = true;
            e.updatedAt = nowIso();
        });
        saveCache();
        notifyMoneyChanged();
    }

    async function addMoneyEntry(entry) {
        const ts = nowIso();
        const newEntry = normalizeMoneyEntry({ ...entry, id: entry.id || newId(''), createdAt: ts, updatedAt: ts });
        entriesCache.push(newEntry);
        saveCache();
        notifyMoneyChanged();
        return newEntry;
    }

    async function updateMoneyEntry(id, updates) {
        const idx = entriesCache.findIndex((e) => e.id === id);
        if (idx === -1) return null;
        entriesCache[idx] = normalizeMoneyEntry({ ...entriesCache[idx], ...updates, id, updatedAt: nowIso() });
        saveCache();
        notifyMoneyChanged();
        return entriesCache[idx];
    }

    async function deleteMoneyEntry(id) {
        const existing = getMoneyEntry(id);
        if (!existing) return;
        const now = nowIso();
        if (existing.type === 'transfer' && existing.transferGroupId) {
            entriesCache.filter((e) => e.transferGroupId === existing.transferGroupId).forEach((e) => {
                e.isDeleted = true;
                e.updatedAt = now;
            });
        } else {
            const idx = entriesCache.findIndex((e) => e.id === id);
            if (idx !== -1) {
                entriesCache[idx].isDeleted = true;
                entriesCache[idx].updatedAt = now;
            }
        }
        saveCache();
        notifyMoneyChanged();
    }

    async function addMoneyTransfer({ fromAccountId, toAccountId, amount, date, time, note }) {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return Promise.reject(new Error('invalid_transfer'));
        const amt = Number(amount) || 0;
        const ts = nowIso();
        const groupId = newId('xfer_');
        const outEntry = normalizeMoneyEntry({
            id: newId(''), accountId: fromAccountId, type: 'transfer', amount: amt, date: date || '', time: time || '',
            note: note || '', transferGroupId: groupId, transferLeg: 'out', transferPeerAccountId: toAccountId,
            createdAt: ts, updatedAt: ts
        });
        const inEntry = normalizeMoneyEntry({
            id: newId(''), accountId: toAccountId, type: 'transfer', amount: amt, date: date || '', time: time || '',
            note: note || '', transferGroupId: groupId, transferLeg: 'in', transferPeerAccountId: fromAccountId,
            createdAt: ts, updatedAt: ts
        });
        entriesCache.push(outEntry);
        entriesCache.push(inEntry);
        saveCache();
        notifyMoneyChanged();
        return { outEntry, inEntry, transferGroupId: groupId };
    }

    function updateMoneyItem(id, updates) {
        if (String(id).startsWith('acc_')) return updateMoneyAccount(id, updates);
        return updateMoneyEntry(id, updates);
    }

    function getMoneyFeed() { return Promise.resolve([]); }

    // Stubs for cloud
    function startMoneyLedgerListeners() {}
    function stopMoneyLedgerListeners() {}
    async function migrateMoneyLedgerFromBlob() { return false; }
    async function onMoneySyncConnected() {}
    function onMoneySyncDisconnected() {}
    function stripMoneyFromBlobData(data) { return data; }
    function firestoreErrorMessage() { return 'Mock implementation.'; }
    function applyLedgerFromDocData() {}

    loadCache();

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
        updateMoneyItem,
        applyLedgerFromDocData
    });

    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ moneyService: {} });
    }
})(typeof window !== 'undefined' ? window : globalThis);
