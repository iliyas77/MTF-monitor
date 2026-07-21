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
            if (!db) return null;
            return db.collection('positions'); // Flat collection
        }

        async fetch() {
            if (this.cache.size > 0) {
                return Array.from(this.cache.values());
            }

            const ref = this.getCollectionRef();
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) return [];

            try {
                const targetCode = syncCode || ownerUid;
                if (global.MTFLogger) global.MTFLogger.log(`[DB-DEBUG] PositionRepository.fetch() querying 'positions' where syncCode == ${targetCode}`);
                const snapshot = await ref.where('syncCode', '==', targetCode).get();
                if (global.MTFLogger) global.MTFLogger.log(`[DB-DEBUG] PositionRepository.fetch() received ${snapshot.size} documents.`);
                const items = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Merge doc.id in case we need to reference flat collection doc ids
                    const item = { docId: doc.id, ...data };
                    this.cache.set(data.id, item); // Assuming transaction 'id' is unique
                    items.push(item);
                });
                return items;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.error(`[DB-DEBUG] PositionRepository fetch failed:`, e);
                return [];
            }
        }

        async save(items) {
            const ref = this.getCollectionRef();
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) return false;

            try {
                const batch = this.getDb().batch();
                items.forEach(item => {
                    if (!item.id) return;
                    
                    const payloadItem = {
                        ...item,
                        ownerUid: ownerUid,
                        syncCode: syncCode || ownerUid,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // We can use the transaction `id` as the docId to prevent duplicates 
                    // or let Firestore auto generate. Since transactions have unique IDs, use them.
                    // To avoid cross-user collisions on simple IDs, we prefix it.
                    const safeDocId = `${ownerUid}_${item.id}`;
                    const docRef = ref.doc(safeDocId);
                    
                    this.cache.set(item.id, { ...payloadItem, docId: safeDocId });
                    batch.set(docRef, payloadItem, { merge: true });
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
