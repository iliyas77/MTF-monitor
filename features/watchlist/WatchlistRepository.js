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
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) return [];

            try {
                // We fetch by syncCode since it identifies the logical business dataset, regardless of true auth ownership
                const targetCode = syncCode || ownerUid;
                const snapshot = await ref.where('syncCode', '==', targetCode).get();
                const items = [];
                
                this.cache.clear();
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Store the autoDocId inside the data so we can delete it later if needed
                    const item = { id: doc.id, ...data };
                    this.cache.set(data.symbol || data.s, item);
                    items.push(item);
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
            if (!item || (!item.s && !item.symbol)) {
                const err = new Error('Invalid item payload');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Add failed: Missing symbol', err);
                throw err;
            }

            const symbol = item.s || item.symbol;
            if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Initiating add for: ${symbol}`);
            
            // Optimistic Check
            if (this.cache.has(symbol)) {
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Item ${symbol} already exists in cache, bypassing network loop.`);
                return true;
            }

            const ref = this.getCollectionRef();
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Add failed: Missing auth session', err);
                throw err;
            }

            try {
                const orderIndex = this.cache.size; // Simple ordering
                const payloadItem = {
                    ...item,
                    symbol: symbol,
                    ownerUid: ownerUid,
                    syncCode: syncCode || ownerUid,
                    orderIndex: orderIndex,
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Writing payload to flat watchlist collection...`);
                
                // Firestore automatically generates UUIDs
                const docRef = await ref.add(payloadItem);
                
                // Update Cache immediately with the generated doc id
                this.cache.set(symbol, { ...payloadItem, id: docRef.id });
                
                if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Write success. Cache updated for ${symbol} with ID ${docRef.id}.`);
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error(`[WatchlistRepository] Write transaction failed for ${symbol}`, e);
                throw e; // Explicitly throw so UI can catch and show error alert
            }
        }

        async remove(symbol) {
            if (!symbol) return false;
            if (global.MTFLogger) global.MTFLogger.log(`[WatchlistRepository] Initiating remove for: ${symbol}`);
            
            const ref = this.getCollectionRef();
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) {
                const err = new Error('Authentication required');
                if (global.MTFLogger) global.MTFLogger.error('[WatchlistRepository] Remove failed: Missing auth session', err);
                throw err;
            }

            try {
                // To delete a flat collection document, we need its autoDocId
                const cachedItem = this.cache.get(symbol);
                if (cachedItem && cachedItem.id) {
                    await ref.doc(cachedItem.id).delete();
                } else {
                    // Fallback: query by syncCode and symbol to find the document to delete
                    const targetCode = syncCode || ownerUid;
                    const snapshot = await ref.where('syncCode', '==', targetCode).where('symbol', '==', symbol).get();
                    if (!snapshot.empty) {
                        const batch = this.getDb().batch();
                        snapshot.docs.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                    }
                }
                
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
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) return false;

            try {
                const batch = this.getDb().batch();
                this.cache.clear();
                items.forEach((item, index) => {
                    const symbol = item.s || item.symbol;
                    if (!symbol) return;
                    
                    const payloadItem = {
                        ...item,
                        symbol: symbol,
                        ownerUid: ownerUid,
                        syncCode: syncCode || ownerUid,
                        orderIndex: index,
                        addedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // For bulk save without IDs, we generate new ones
                    const docRef = ref.doc();
                    batch.set(docRef, payloadItem);
                    
                    this.cache.set(symbol, { ...payloadItem, id: docRef.id });
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
