/**
 * Watchlist Repository
 * Manages the 'watchlists/{uid}/items' sub-collection.
 */
(function (global) {
    'use strict';

    class WatchlistRepository extends global.BaseRepository {
        constructor() {
            super('watchlists');
        }

        getCollectionRef() {
            const db = this.getDb();
            const uid = this.getUid();
            if (!db || !uid) {
                if (global.MTFLogger) global.MTFLogger.warn('[WatchlistRepository] Missing db or uid context.');
                return null;
            }
            return db.collection(this.collectionName).doc(uid).collection('items');
        }

        async fetch() {
            if (global.MTFLogger) global.MTFLogger.log('[WatchlistRepository] Initiating fetch...');
            if (this.cache.size > 0) {
                if (global.MTFLogger) global.MTFLogger.log('[WatchlistRepository] Returning cached items.');
                return Array.from(this.cache.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            }

            const ref = this.getCollectionRef();
            if (!ref) {
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Fetch failed: Cannot resolve collection path (auth required).');
                return [];
            }

            try {
                const snapshot = await ref.get();
                const items = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.cache.set(data.s || doc.id, data);
                    items.push(data);
                });
                const sortedItems = items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Fetch success: Retrieved ${items.length} items.`);
                return sortedItems;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Fetch execution failed explicitly', e);
                return [];
            }
        }

        async add(item) {
            if (!item || !item.s) {
                const err = new Error('Invalid item payload');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Add failed: Missing symbol', err);
                throw err;
            }

            if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Initiating add for: ${item.s}`);
            
            // Optimistic Check
            if (this.cache.has(item.s)) {
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Item ${item.s} already exists in cache, bypassing network loop.`);
                return true;
            }

            const ref = this.getCollectionRef();
            if (!ref) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Add failed: Missing auth session', err);
                throw err;
            }

            try {
                const orderIndex = this.cache.size; // Simple ordering
                const payload = {
                    ...item,
                    orderIndex: orderIndex,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                const safeSymbol = String(item.s).replace(/[^a-zA-Z0-9_-]/g, '_');
                
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Writing payload to watchlists/{uid}/items/${safeSymbol}...`);
                
                await ref.doc(safeSymbol).set(payload, { merge: true });
                
                // Update Cache immediately
                this.cache.set(item.s, { ...item, orderIndex: orderIndex });
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Write success. Cache updated for ${item.s}.`);
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error(`[WatchlistRepository] Write transaction failed for ${item.s}`, e);
                throw e; // Explicitly throw so UI can catch and show error alert
            }
        }

        async remove(symbol) {
            if (!symbol) return false;
            if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Initiating remove for: ${symbol}`);
            
            const ref = this.getCollectionRef();
            if (!ref) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Remove failed: Missing auth session', err);
                throw err;
            }

            try {
                const safeSymbol = String(symbol).replace(/[^a-zA-Z0-9_-]/g, '_');
                await ref.doc(safeSymbol).delete();
                
                this.cache.delete(symbol);
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Remove success for ${symbol}.`);
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error(`[WatchlistRepository] Remove transaction failed for ${symbol}`, e);
                throw e;
            }
        }

        // Keep save for bulk operations if needed
        async save(items) {
            const ref = this.getCollectionRef();
            if (!ref) return false;

            try {
                const batch = this.getDb().batch();
                items.forEach((item, index) => {
                    if (!item.s) return;
                    this.cache.set(item.s, { ...item, orderIndex: index });
                    
                    const safeSymbol = String(item.s).replace(/[^a-zA-Z0-9_-]/g, '_');
                    const docRef = ref.doc(safeSymbol);
                    batch.set(docRef, { 
                        ...item, 
                        orderIndex: index,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                await batch.commit();
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Bulk save success for ${items.length} items.`);
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Bulk save failed', e);
                throw e;
            }
        }
    }

    // Singleton instantiation pattern for global access (similar to db-service)
    global.watchlistRepo = new WatchlistRepository();
    // Expose class for legacy/testing just in case
    global.WatchlistRepository = WatchlistRepository;

})(typeof window !== 'undefined' ? window : globalThis);
