/**
 * Firebase / cloud sync configuration.
 */
(function (global) {
    'use strict';

    // ======================================================================
    //  FIREBASE CLOUD SYNC CONFIG
    //  1) Create a free project at https://console.firebase.google.com
    //  2) Add a Web App, copy its config, and paste the values below.
    //  3) In Firestore, create the database and set the security rules.
    //  Until you paste a real config, the app keeps working offline
    //  (localStorage only) and the Cloud Sync card shows "Not configured".
    // ======================================================================
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCD3GpPPNnGPb3y6VeVcEgKSsorVxVtgWI",
        authDomain: "mtf-monitor.firebaseapp.com",
        projectId: "mtf-monitor",
        storageBucket: "mtf-monitor.firebasestorage.app",
        messagingSenderId: "500531310641",
        appId: "1:500531310641:web:d627217a012bff9570e510",
        measurementId: "G-S90EJWTKVS"
    };

    // Default sync code pre-filled in the field so you don't have to remember it.
    const DEFAULT_SYNC_CODE = 'iliyas-mtf-9f3k2x7q';

    global.MTFDbRegister({
        FIREBASE_CONFIG,
        DEFAULT_SYNC_CODE
    });
})(typeof window !== 'undefined' ? window : globalThis);
