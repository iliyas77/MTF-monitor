/**
 * Past trades page — list + summary (filters live in the shared filter sheet).
 */
(function (global) {
    'use strict';

    const {
        paintPastTradeSummary,
        aggregatePortfolioSummary,
        renderFlatTradesList,
        renderPastTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    const PAST_PNL_OPTIONS = [
        { value: 'all', label: 'All' },
        { value: 'profit', label: 'Profit' },
        { value: 'loss', label: 'Loss' },
        { value: 'verified', label: 'Verified' }
    ];

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderPastTrades() {
        const {
            getPastFiltered,
            getPastSearchQuery = () => ''
        } = tradePages();

        const filtered = getPastFiltered ? getPastFiltered() : [];
        const pastQuery = getPastSearchQuery().trim().toLowerCase();
        const listContainer = document.getElementById('pastTradesList');

        let net = 0;
        filtered.forEach((t) => { net += t.netProfit || 0; });
        const summary = aggregatePortfolioSummary
            ? aggregatePortfolioSummary(filtered)
            : { net, invested: 0, holdings: filtered.length, mtfUsed: 0 };
        paintPastTradeSummary(summary);

        if (!listContainer) return;

        if (filtered.length === 0) {
            listContainer.innerHTML = pastQuery
                ? renderPageEmptyCard('fa-search', `No past trades match "${getPastSearchQuery().trim()}"`, 'Try a different company name or clear the search.')
                : renderPageEmptyCard('fa-history', 'No past trades in this period', '');
            return;
        }

        listContainer.innerHTML = renderFlatTradesList(filtered, renderPastTradeListItem, 'past');
    }

    global.MTFRegister({ renderPastTrades, PAST_PNL_OPTIONS });
})(typeof window !== 'undefined' ? window : globalThis);
