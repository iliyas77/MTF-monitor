/**
 * Firebase Authentication Service.
 * Handles Google Sign-In and user session state.
 */
(function (global) {
    'use strict';

    let fbAuth = null;
    let currentUser = null;
    let authStateListeners = [];

    function initAuth() {
        if (fbAuth) return true;
        if (typeof firebase === 'undefined' || !firebase.auth) return false;
        
        try {
            fbAuth = firebase.auth();
            fbAuth.onAuthStateChanged((user) => {
                currentUser = user;
                authStateListeners.forEach(listener => listener(user));
                
                // If user just logged in, refresh
                if (user && global.MTFDb && typeof global.MTFDb.refreshAllViews === 'function') {
                    global.MTFDb.refreshAllViews();
                }
            });
            return true;
        } catch (e) {
            if (global.MTFLogger) global.MTFLogger.warn('Firebase Auth init failed', e);
            return false;
        }
    }

    function onAuthStateChanged(listener) {
        authStateListeners.push(listener);
        if (fbAuth) {
            listener(currentUser);
        }
    }

    function getUid() {
        return currentUser ? currentUser.uid : null;
    }

    function signInWithGoogle() {
        if (!initAuth()) return Promise.reject(new Error('Firebase Auth not initialized'));
        const provider = new firebase.auth.GoogleAuthProvider();
        return fbAuth.signInWithPopup(provider).then((result) => {
            if (global.MTFLogger) global.MTFLogger.log('Signed in as', result.user.email);
            return result.user;
        });
    }

    function signOut() {
        if (!fbAuth) return Promise.resolve();
        return fbAuth.signOut().then(() => {
            if (global.MTFLogger) global.MTFLogger.log('Signed out');
            if (global.MTFDb && typeof global.MTFDb.clearAllCaches === 'function') {
                global.MTFDb.clearAllCaches();
            }
        });
    }

    global.MTFAuth = {
        init: initAuth,
        getUid: getUid,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        onAuthStateChanged: onAuthStateChanged
    };

})(typeof window !== 'undefined' ? window : globalThis);
