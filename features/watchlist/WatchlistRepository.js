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
            if (!db || !uid) return null;
            return db.collection(this.collectionName).doc(uid).collection('items');
        }

        async fetch() {
            if (this.cache.size > 0) {
                return Array.from(this.cache.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            }

            const ref = this.getCollectionRef();
            if (!ref) return [];

            try {
                const snapshot = await ref.get();
                const items = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.cache.set(data.s || doc.id, data);
                    items.push(data);
                });
                return items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('WatchlistRepository fetch failed', e);
                return [];
            }
        }

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
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('WatchlistRepository save failed', e);
                return false;
            }
        }
    }

    global.WatchlistRepository = WatchlistRepository;

})(typeof window !== 'undefined' ? window : globalThis);
