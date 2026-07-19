/**
 * Position Repository
 * Manages the 'positions/{uid}/items' sub-collection for transactions and positions.
 */
(function (global) {
    'use strict';

    class PositionRepository extends global.BaseRepository {
        constructor() {
            super('positions');
        }

        getCollectionRef() {
            const db = this.getDb();
            const uid = this.getUid();
            if (!db || !uid) return null;
            return db.collection(this.collectionName).doc(uid).collection('items');
        }

        async fetch() {
            if (this.cache.size > 0) {
                return Array.from(this.cache.values());
            }

            const ref = this.getCollectionRef();
            if (!ref) return [];

            try {
                const snapshot = await ref.get();
                const items = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.cache.set(data.id, data);
                    items.push(data);
                });
                return items;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('PositionRepository fetch failed', e);
                return [];
            }
        }

        async save(items) {
            const ref = this.getCollectionRef();
            if (!ref) return false;

            try {
                const batch = this.getDb().batch();
                items.forEach(item => {
                    if (!item.id) return;
                    this.cache.set(item.id, item);
                    const docId = String(item.id);
                    const docRef = ref.doc(docId);
                    batch.set(docRef, { 
                        ...item, 
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
                    }, { merge: true });
                });
                await batch.commit();
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('PositionRepository save failed', e);
                return false;
            }
        }
    }

    global.PositionRepository = PositionRepository;

})(typeof window !== 'undefined' ? window : globalThis);
