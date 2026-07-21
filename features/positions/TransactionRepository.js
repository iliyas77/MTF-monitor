/**
 * Transaction Repository
 * Manages the flat 'positions' collection for user trades to align with Firestore rules.
 */
(function (global) {
    'use strict';

    class TransactionRepository extends global.BaseRepository {
        constructor() {
            super('positions');
        }

        getCollectionRef() {
            const db = this.getDb();
            if (!db) return null;
            return db.collection(this.collectionName);
        }

        async add(item) {
            const ref = this.getCollectionRef();
            const ownerUid = this.getOwnerUid();
            const syncCode = this.getSyncCode();
            if (!ref || !ownerUid) throw new Error('Database connection or authentication failed.');

            const payloadItem = {
                ...item,
                ownerUid: ownerUid,
                syncCode: syncCode || ownerUid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = item.id ? ref.doc(String(item.id)) : ref.doc();
            
            console.warn(`[DB-DEBUG] TransactionRepository targeting path: ${docRef.path}`);
            console.warn(`[DB-DEBUG] Payload ownerUid: ${payloadItem.ownerUid}, syncCode: ${payloadItem.syncCode}`);
            if (global.MTFLogger) {
                global.MTFLogger.log(`[DB-DEBUG] TransactionRepository writing to path: ${docRef.path}`, payloadItem);
            }
            
            this.cache.set(docRef.id, { ...payloadItem, docId: docRef.id });
            await docRef.set(payloadItem, { merge: true });
            
            return { ...payloadItem, id: docRef.id };
        }
    }

    global.TransactionRepository = TransactionRepository;

})(typeof window !== 'undefined' ? window : globalThis);
