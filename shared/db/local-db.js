/**
 * MTFLocalDB - IndexedDB wrapper for local caching mimicking backend structure
 */
(function (global) {
    'use strict';
    
    const DB_NAME = 'MTFLocalDB';
    const DB_VERSION = 1;
    const STORE_TRANSACTIONS = 'transactions';

    function openDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                return reject(new Error("IndexedDB not supported"));
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (e) => reject(request.error || e);
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                    db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
                }
            };
        });
    }

    async function saveTransactions(txs) {
        if (!txs || !txs.length) return;
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(tx.error || e);
            const store = tx.objectStore(STORE_TRANSACTIONS);
            txs.forEach(t => store.put(t));
        });
    }

    async function clearTransactions() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(tx.error || e);
            tx.objectStore(STORE_TRANSACTIONS).clear();
        });
    }

    async function getTransactions() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
            const request = tx.objectStore(STORE_TRANSACTIONS).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(request.error || e);
        });
    }

    global.MTFLocalDB = {
        saveTransactions,
        clearTransactions,
        getTransactions
    };

})(typeof window !== 'undefined' ? window : globalThis);
