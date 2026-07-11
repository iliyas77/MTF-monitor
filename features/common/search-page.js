/**
 * O16 — Search page render organism.
 */
(function (global) {
    'use strict';

    const {
        renderFlatTradesList,
        renderPastTradeListItem,
        renderOpenTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderSearchResults() {
        const {
            getSearchContext = () => 'trades',
            getSearchQuery = () => '',
            getPastFiltered,
            getTransactions,
            isActiveOpenTrade,
            sortTradesByHoldDays
        } = tradePages();

        const container = document.getElementById('searchPageList');
        if (!container) return;

        const searchContext = getSearchContext();
        const isPast = searchContext === 'past';

        let dataset;
        if (isPast) {
            dataset = getPastFiltered ? getPastFiltered() : [];
        } else {
            dataset = (getTransactions ? getTransactions() : []).filter(isActiveOpenTrade || (() => false));
        }

        const q = getSearchQuery().trim().toLowerCase();
        let filtered = q
            ? dataset.filter((t) => (t.company || '').toLowerCase().includes(q))
            : dataset;
        if (sortTradesByHoldDays) filtered = sortTradesByHoldDays(filtered);

        const renderer = isPast ? renderPastTradeListItem : renderOpenTradeListItem;

        if (filtered.length === 0) {
            const noun = isPast ? 'past trades' : 'open trades';
            container.innerHTML = q
                ? `<div class="px-3">${renderPageEmptyCard('fa-search', `No ${noun} match "${getSearchQuery().trim()}"`, 'Try a different company name.')}</div>`
                : `<div class="px-3">${renderPageEmptyCard('fa-keyboard', `Search ${noun}`, 'Start typing a company name.')}</div>`;
            return;
        }

        container.innerHTML = `<div class="px-3">${renderFlatTradesList(filtered, renderer, isPast ? 'past' : 'open')}</div>`;
    }

    global.MTFRegister({ renderSearchResults });
})(typeof window !== 'undefined' ? window : globalThis);
