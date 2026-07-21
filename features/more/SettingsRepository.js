/**
 * Settings Repository
 * Manages the 'settings/{uid}' document.
 */
(function (global) {
    'use strict';

    class SettingsRepository extends global.BaseRepository {
        constructor() {
            super('settings');
        }

        getDocRef() {
            const db = this.getDb();
            const uid = this.getUid();
            if (!db || !uid) return null;
            return db.collection(this.collectionName).doc(uid);
        }

        async fetch() {
            if (this.cache.has('settings')) {
                return this.cache.get('settings');
            }

            const ref = this.getDocRef();
            if (!ref) return {};

            try {
                const snapshot = await ref.get();
                if (snapshot.exists) {
                    const data = snapshot.data();
                    this.cache.set('settings', data);
                    return data;
                }
                return {};
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('SettingsRepository fetch failed', e);
                return {};
            }
        }

        async save(settingsData) {
            const ref = this.getDocRef();
            if (!ref) return false;

            try {
                this.cache.set('settings', settingsData);
                await ref.set({ 
                    ...settingsData, 
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
                }, { merge: true });
                return true;
            } catch (e) {
                if (global.MTFLogger) global.MTFLogger.warn('SettingsRepository save failed', e);
                return false;
            }
        }
    }

    global.SettingsRepository = SettingsRepository;

})(typeof window !== 'undefined' ? window : globalThis);
