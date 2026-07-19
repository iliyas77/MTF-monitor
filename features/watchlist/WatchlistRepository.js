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
            if (!db) {
                if (global.MTFLogger) global.MTFLogger.warn('[WatchlistRepository] Missing db context.');
                return null;
            }
            return db.collection('watchlist');
        }

        async fetch() {
            if (global.MTFLogger) global.MTFLogger.log('[WatchlistRepository] Initiating fetch...');
            if (this.cache.size > 0) {
                if (global.MTFLogger) global.MTFLogger.log('[WatchlistRepository] Returning cached items.');
                return Array.from(this.cache.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            }

            const ref = this.getCollectionRef();
            const uid = this.getUid();
            if (!ref || !uid) {
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Fetch failed: Cannot resolve collection path (auth required).');
                return [];
            }

            try {
                const docSnap = await ref.doc(uid).get();
                const items = [];
                if (docSnap.exists) {
                    const data = docSnap.data();
                    if (Array.isArray(data.items)) {
                        data.items.forEach(item => items.push(item));
                    }
                }
                
                this.cache.clear();
                items.forEach(item => this.cache.set(item.s, item));
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
            const uid = this.getUid();
            if (!ref || !uid) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Add failed: Missing auth session', err);
                throw err;
            }

            try {
                const orderIndex = this.cache.size; // Simple ordering
                const payloadItem = {
                    ...item,
                    orderIndex: orderIndex,
                    updatedAt: Date.now()
                };

                // Update Cache immediately
                this.cache.set(item.s, payloadItem);
                
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Writing payload array to watchlist/${uid}...`);
                
                await ref.doc(uid).set({ items: Array.from(this.cache.values()) }, { merge: true });
                
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Write success. Cache updated for ${item.s}.`);
                return true;
            } catch (e) {
                // Rollback cache on failure
                this.cache.delete(item.s);
                if (global.MTFLogger) global.MTFLogger.error(`[WatchlistRepository] Write transaction failed for ${item.s}`, e);
                throw e; // Explicitly throw so UI can catch and show error alert
            }
        }

        async remove(symbol) {
            if (!symbol) return false;
            if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Initiating remove for: ${symbol}`);
            
            const ref = this.getCollectionRef();
            const uid = this.getUid();
            if (!ref || !uid) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Remove failed: Missing auth session', err);
                throw err;
            }

            try {
                // Keep backup for rollback
                const backup = this.cache.get(symbol);
                this.cache.delete(symbol);
                
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Deleting ${symbol} and rewriting array to watchlist/${uid}`);
                
                await ref.doc(uid).set({ items: Array.from(this.cache.values()) }, { merge: true });
                
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
            const uid = this.getUid();
            if (!ref || !uid) return false;

            try {
                this.cache.clear();
                items.forEach((item, index) => {
                    if (!item.s) return;
                    this.cache.set(item.s, { ...item, orderIndex: index, updatedAt: Date.now() });
                });
                
                await ref.doc(uid).set({ items: Array.from(this.cache.values()) }, { merge: true });
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
