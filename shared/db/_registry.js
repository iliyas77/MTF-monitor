/**
 * MTF DB registry — storage/sync services register into window.MTFDb.
 */
(function (global) {
    'use strict';

    const MTFDb = global.MTFDb || {};
    global.MTFDb = MTFDb;

    global.MTFDbRegister = function register(exports) {
        if (global.MTFLogger && global.MTFLogger.trace) {
            exports = global.MTFLogger.trace(exports, 'db');
        }
        Object.assign(MTFDb, exports);
        Object.assign(global, exports);
    };
})(typeof window !== 'undefined' ? window : globalThis);
