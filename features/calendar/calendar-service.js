/**
 * Calendar Feature Service.
 */
(function (global) {
    'use strict';

    function getTransactionsForCalendar() {
        const db = global.MTFDb || {};
        return typeof db.getTransactions === 'function' ? db.getTransactions() : [];
    }

    function getCalendarFeed(queryConfig = {}, options = {}) {
        const db = global.MTFDb || {};
        if (typeof db.getFeed === 'function') {
            return db.getFeed(queryConfig, options).then(res => {
                if (res && res.length) {
                    MTFLogger.log('Received calendar feed from DB:', res);
                }
                return res;
            });
        }
        return Promise.resolve([]);
    }

    global.MTFAppHelpers = global.MTFAppHelpers || {};
    global.MTFAppHelpers.calendarPages = {
        getTransactionsForCalendar,
        getCalendarFeed
    };
    
    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ calendarService: global.MTFAppHelpers.calendarPages });
    }
})(typeof window !== 'undefined' ? window : globalThis);
