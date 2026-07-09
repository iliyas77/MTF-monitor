/**
 * MTF Profit Tracker — re-export all MTFComponents on window after manifest scripts load.
 */
(function (global) {
    'use strict';
    if (global.MTFComponents) {
        Object.assign(global, global.MTFComponents);
    }
})(typeof window !== 'undefined' ? window : globalThis);
