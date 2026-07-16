/**
 * Watchlist Feature Service.
 */
(function (global) {
    'use strict';

    function getWatchlistQuotes() {
        const helpers = global.MTFAppHelpers || {};
        const marketPages = helpers.marketPages || {};
        return typeof marketPages.getMarketQuotes === 'function' ? marketPages.getMarketQuotes() : [];
    }

    function getWatchlistFeed(queryConfig = {}, options = {}) {
        const db = global.MTFDb || {};
        if (typeof db.getFeed === 'function') {
            return db.getFeed(queryConfig, options);
        }
        return Promise.resolve([]);
    }

    function updateWatchlistItem(symbol, updates) {
        const db = global.MTFDb || {};
        if (typeof db.getStorage === 'function' && typeof db.saveStorage === 'function') {
            const data = db.getStorage();
            if (Array.isArray(data.marketWatchlist)) {
                const idx = data.marketWatchlist.findIndex(item => (item.s || item.symbol) === symbol);
                if (idx !== -1) {
                    data.marketWatchlist[idx] = { ...data.marketWatchlist[idx], ...updates };
                    return db.saveStorage(data);
                }
            }
        }
        return Promise.resolve(false);
    }

    function deleteWatchlistItem(symbol) {
        console.log("[DB] deleteWatchlistItem: soft-deleting watchlist item:", symbol);
        return updateWatchlistItem(symbol, { isDeleted: true });
    }

    global.MTFAppHelpers = global.MTFAppHelpers || {};
    global.MTFAppHelpers.watchlistPages = {
        getWatchlistQuotes,
        getWatchlistFeed,
        updateWatchlistItem,
        deleteWatchlistItem
    };

    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ watchlistService: global.MTFAppHelpers.watchlistPages });
    }
})(typeof window !== 'undefined' ? window : globalThis);
