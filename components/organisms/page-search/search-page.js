/**
 * O16 — Search page render organism.
 */
(function (global) {
    'use strict';

    const {
        renderFlatTradesList,
        renderPastTradeListItem,
        renderPlanTradeListItem,
        renderOpenTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderSearchResults() {
        const {
            getSearchContext = () => 'trades',
            getTradesViewMode = () => 'trade',
            getSearchQuery = () => '',
            getPastFiltered,
            getTransactions,
            isPlannedTrade,
            isActiveOpenTrade,
            sortTradesByHoldDays
        } = tradePages();

        const container = document.getElementById('searchPageList');
        if (!container) return;

        const searchContext = getSearchContext();
        const isPast = searchContext === 'past';
        const isPlan = !isPast && getTradesViewMode() === 'plan';

        let dataset;
        if (isPast) {
            dataset = getPastFiltered ? getPastFiltered() : [];
        } else if (isPlan) {
            dataset = (getTransactions ? getTransactions() : []).filter(isPlannedTrade || (() => false));
        } else {
            dataset = (getTransactions ? getTransactions() : []).filter(isActiveOpenTrade || (() => false));
        }

        const q = getSearchQuery().trim().toLowerCase();
        let filtered = q
            ? dataset.filter((t) => (t.company || '').toLowerCase().includes(q))
            : dataset;
        if (sortTradesByHoldDays) filtered = sortTradesByHoldDays(filtered);

        const renderer = isPast ? renderPastTradeListItem : (isPlan ? renderPlanTradeListItem : renderOpenTradeListItem);

        if (filtered.length === 0) {
            const noun = isPast ? 'past trades' : (isPlan ? 'planned trades' : 'open trades');
            container.innerHTML = q
                ? renderPageEmptyCard('fa-search', `No ${noun} match "${getSearchQuery().trim()}"`, 'Try a different company name.')
                : renderPageEmptyCard('fa-keyboard', `Search ${noun}`, 'Start typing a company name.');
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, renderer);
    }

    global.MTFRegister({ renderSearchResults });
})(typeof window !== 'undefined' ? window : globalThis);
