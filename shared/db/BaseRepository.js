/**
 * Generic Base Repository.
 * Provides caching, generic Firestore handlers, and lifecycle cleanup.
 */
(function (global) {
    'use strict';

    class BaseRepository {
        constructor(collectionName) {
            this.collectionName = collectionName;
            this.cache = new Map();
            this.unsub = null;
        }

        getOwnerUid() {
            if (global.MTFAuth && typeof global.MTFAuth.getUid === 'function') {
                const uid = global.MTFAuth.getUid();
                if (uid) return uid;
            }
            // If no true auth exists yet, return the legacy syncCode to act as the owner temporarily
            return this.getSyncCode();
        }

        getSyncCode() {
            if (global.MTFDb && typeof global.MTFDb.getSyncCode === 'function') {
                return global.MTFDb.getSyncCode();
            }
            return null;
        }

        getUid() {
            // Deprecated: Use getOwnerUid() or getSyncCode() directly
            return this.getOwnerUid();
        }

        getCollectionPath() {
            const uid = this.getUid();
            if (!uid) throw new Error('Unauthenticated user cannot access repositories.');
            // Implementation specific: Positions use collectionName/{uid}/items, Settings use collectionName/{uid}
            return this.collectionName;
        }

        clearCache() {
            this.cache.clear();
        }

        stopListen() {
            if (this.unsub) {
                this.unsub();
                this.unsub = null;
            }
        }

        getDb() {
            if (!global.MTFDb) return null;
            return global.MTFDb.fbDb || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
        }

        // Generic fetch is abstract, implemented by subclasses
        async fetch() {
            throw new Error('fetch() must be implemented by subclass');
        }

        // Generic save is abstract, implemented by subclasses
        async save(data) {
            throw new Error('save() must be implemented by subclass');
        }
    }

    global.BaseRepository = BaseRepository;

})(typeof window !== 'undefined' ? window : globalThis);
