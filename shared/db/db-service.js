/**
 * Database core functions — application-specific and generic CRUD Firestore operations.
 */
(function (global) {
    'use strict';

    function db() {
        return global.MTFDb || {};
    }

    function firestore() {
        const getDb = db().getFirebaseDb;
        return typeof getDb === 'function' ? getDb() : null;
    }

    /**
     * Helper to convert a user-friendly query config into Firestore filter arrays.
     */
    const parseQueryConfig = (config = {}) => {
        const filters = [];

        // 1. Equality (where)
        if (config.where) {
            Object.entries(config.where).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    filters.push({ field, operator: '==', value });
                }
            });
        }

        // 2. Range (min / max on a single field)
        if (config.range) {
            const { field, min, max } = config.range;
            if (!field) throw new Error('Range config must specify a "field"');
            if (min !== undefined && min !== null) {
                filters.push({ field, operator: '>=', value: min });
            }
            if (max !== undefined && max !== null) {
                filters.push({ field, operator: '<=', value: max });
            }
        }

        // 3. Array contains
        if (config.arrayContains) {
            const { field, value } = config.arrayContains;
            if (value !== undefined && value !== null) {
                filters.push({ field, operator: 'array-contains', value });
            }
        }

        // 4. Raw custom filters
        if (config.filters && Array.isArray(config.filters)) {
            filters.push(...config.filters);
        }

        return filters;
    };

    // ----- Core CRUD operations (v8 compat style) -----
    
    function getCallerName() {
        try {
            const stack = new Error().stack;
            if (!stack) return 'unknown';
            const lines = stack.split('\n');
            if (lines.length > 3) {
                const callerLine = lines[3];
                const match = callerLine.match(/at\s+([^\s(]+)/);
                if (match && match[1]) {
                    const parts = match[1].split('.');
                    return parts[parts.length - 1];
                }
                return callerLine.trim();
            }
        } catch (_) {}
        return 'unknown';
    }

    async function createDocument(collectionPath, data, docId = null) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: createDocument | Collection: ${collectionPath} | docId: ${docId}`, JSON.stringify(data, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | createDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const col = fb.collection(collectionPath);
            const ref = docId ? col.doc(docId) : col.doc();
            const finalData = { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.set(finalData, { merge: true });
            console.log(`[DB Core] Caller: ${getCallerName()} | createDocument success | Created ID: ${ref.id}`);
            return { success: true, id: ref.id };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | createDocument error:`, error);
            return { success: false, error };
        }
    }

    async function getDocument(collectionPath, docId) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: getDocument | Collection: ${collectionPath} | docId: ${docId}`);
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | getDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const snapshot = await ref.get();
            if (!snapshot.exists) {
                console.log(`[DB Core] Caller: ${getCallerName()} | getDocument: Document not found at ${collectionPath}/${docId}`);
                return { success: false, error: 'Document not found' };
            }
            const docData = snapshot.data();
            if (docData && docData.isDeleted === true) {
                console.log(`[DB Core] Caller: ${getCallerName()} | getDocument: Document is soft-deleted at ${collectionPath}/${docId}`);
                return { success: false, error: 'Document not found' };
            }
            console.log(`[DB Core] Caller: ${getCallerName()} | getDocument success | Data:`, JSON.stringify(docData, null, 2));
            return { success: true, data: { id: snapshot.id, ...docData } };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | getDocument error:`, error);
            return { success: false, error };
        }
    }

    async function updateDocument(collectionPath, docId, data) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: updateDocument | Collection: ${collectionPath} | docId: ${docId}`, JSON.stringify(data, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | updateDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const finalData = { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.update(finalData);
            console.log(`[DB Core] Caller: ${getCallerName()} | updateDocument success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | updateDocument error:`, error);
            return { success: false, error };
        }
    }

    async function deleteDocument(collectionPath, docId) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: deleteDocument (Soft-Delete) | Collection: ${collectionPath} | docId: ${docId}`);
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | deleteDocument failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const ref = fb.collection(collectionPath).doc(docId);
            const finalData = { isDeleted: true, deletedAt: firebase.firestore.FieldValue.serverTimestamp() };
            await ref.update(finalData);
            console.log(`[DB Core] Caller: ${getCallerName()} | deleteDocument (Soft-Delete) success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | deleteDocument error:`, error);
            return { success: false, error };
        }
    }

    async function getCollection(collectionPath, queryConfig = {}, options = {}) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: getCollection | Collection: ${collectionPath} | QueryConfig:`, JSON.stringify(queryConfig, null, 2), `| Options:`, JSON.stringify(options, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | getCollection failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const filters = parseQueryConfig(queryConfig);
            let q = fb.collection(collectionPath);

            filters.forEach(({ field, operator, value }) => {
                q = q.where(field, operator, value);
            });

            if (options.orderByField) {
                q = q.orderBy(options.orderByField, options.orderDirection || 'asc');
            }
            if (options.limit) {
                q = q.limit(options.limit);
            }

            const snapshot = await q.get();
            const data = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.isDeleted !== true);
            console.log(`[DB Core] Caller: ${getCallerName()} | getCollection success | Result Feed (${data.length} items):`, JSON.stringify(data, null, 2));
            return { success: true, data };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | getCollection error:`, error);
            return { success: false, error };
        }
    }

    function listenToCollection(collectionPath, callback, queryConfig = {}, options = {}) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: listenToCollection | Collection: ${collectionPath} | QueryConfig:`, JSON.stringify(queryConfig, null, 2), `| Options:`, JSON.stringify(options, null, 2));
        const fb = firestore();
        if (!fb) {
            console.warn(`[DB Core] Caller: ${getCallerName()} | listenToCollection failed: Database offline`);
            callback({ success: false, error: 'Database offline' });
            return () => {};
        }
        const filters = parseQueryConfig(queryConfig);
        let q = fb.collection(collectionPath);

        filters.forEach(({ field, operator, value }) => {
            q = q.where(field, operator, value);
        });

        if (options.orderByField) {
            q = q.orderBy(options.orderByField, options.orderDirection || 'asc');
        }
        if (options.limit) {
            q = q.limit(options.limit);
        }

        const unsubscribe = q.onSnapshot(
            (snapshot) => {
                const data = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter(item => item.isDeleted !== true);
                console.log(`[DB Core] Caller: ${getCallerName()} | listenToCollection snapshot trigger | Feed (${data.length} items):`, JSON.stringify(data, null, 2));
                callback({ success: true, data });
            },
            (error) => {
                console.error(`[DB Core] Caller: ${getCallerName()} | listenToCollection error:`, error);
                callback({ success: false, error });
            }
        );
        return unsubscribe;
    }

    function listenToDocument(collectionPath, docId, callback) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: listenToDocument | Collection: ${collectionPath} | docId: ${docId}`);
        const fb = firestore();
        if (!fb) {
            console.warn(`[DB Core] Caller: ${getCallerName()} | listenToDocument failed: Database offline`);
            callback({ success: false, error: 'Database offline' });
            return () => {};
        }
        const ref = fb.collection(collectionPath).doc(docId);
        const unsubscribe = ref.onSnapshot(
            (snapshot) => {
                if (snapshot.exists) {
                    const docData = snapshot.data();
                    if (docData && docData.isDeleted === true) {
                        console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger: Document is soft-deleted at ${collectionPath}/${docId}`);
                        callback({ success: false, error: 'Document not found' });
                        return;
                    }
                    console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger | docId: ${snapshot.id} | Data:`, JSON.stringify(docData, null, 2));
                    callback({ success: true, data: { id: snapshot.id, ...docData } });
                } else {
                    console.log(`[DB Core] Caller: ${getCallerName()} | listenToDocument snapshot trigger: Document not found at ${collectionPath}/${docId}`);
                    callback({ success: false, error: 'Document not found' });
                }
            },
            (error) => {
                console.error(`[DB Core] Caller: ${getCallerName()} | listenToDocument error:`, error);
                callback({ success: false, error });
            }
        );
        return unsubscribe;
    }

    async function batchWrite(operations) {
        console.log(`[DB Core] Caller: ${getCallerName()} | Action: batchWrite | Operations:`, JSON.stringify(operations, null, 2));
        try {
            const fb = firestore();
            if (!fb) {
                console.warn(`[DB Core] Caller: ${getCallerName()} | batchWrite failed: Database offline`);
                return { success: false, error: 'Database offline' };
            }
            const batch = fb.batch();
            operations.forEach((op) => {
                const ref = fb.collection(op.path).doc(op.docId);
                switch (op.type) {
                    case 'set':
                        batch.set(ref, op.data);
                        break;
                    case 'update':
                        batch.update(ref, op.data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                    default:
                        throw new Error(`Unsupported batch operation: ${op.type}`);
                }
            });
            await batch.commit();
            console.log(`[DB Core] Caller: ${getCallerName()} | batchWrite success`);
            return { success: true };
        } catch (error) {
            console.error(`[DB Core] Caller: ${getCallerName()} | batchWrite error:`, error);
            return { success: false, error };
        }
    }

    // Register all database core and CRUD functions
    global.MTFDbRegister({
        parseQueryConfig,
        createDocument,
        getDocument,
        updateDocument,
        deleteDocument,
        getCollection,
        listenToCollection,
        listenToDocument,
        batchWrite
    });
})(typeof window !== 'undefined' ? window : globalThis);
