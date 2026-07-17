/**
 * MTF component registry — each component calls MTFRegister({ ... }).
 */
(function (global) {
    'use strict';

    const MTFComponents = global.MTFComponents || {};
    global.MTFComponents = MTFComponents;

    global.MTFRegister = function register(exports) {
        if (global.MTFLogger && global.MTFLogger.trace) {
            exports = global.MTFLogger.trace(exports, 'app');
        }
        Object.assign(MTFComponents, exports);
    };
})(typeof window !== 'undefined' ? window : globalThis);
