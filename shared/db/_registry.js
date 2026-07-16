/**
 * MTF DB registry — storage/sync services register into window.MTFDb.
 */
(function (global) {
    'use strict';

    const MTFDb = global.MTFDb || {};
    global.MTFDb = MTFDb;

    global.MTFDbRegister = function register(exports) {
        Object.assign(MTFDb, exports);
        Object.assign(global, exports);
    };
})(typeof window !== 'undefined' ? window : globalThis);
