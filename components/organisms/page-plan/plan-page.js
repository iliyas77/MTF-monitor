/**
 * O13 — Plan trades page render organism.
 */
(function (global) {
    'use strict';

    const {
        paintPlanTradeSummary,
        renderFlatTradesList,
        renderPlanTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderPlanTrades() {
        const {
            getTransactions,
            isPlannedTrade,
            sortTradesByHoldDays,
            resolveTradeMetrics,
            getPlanSearchQuery = () => ''
        } = tradePages();

        const txs = getTransactions ? getTransactions() : [];
        let filtered = txs.filter(isPlannedTrade || (() => false));

        const planQuery = getPlanSearchQuery().trim().toLowerCase();
        if (planQuery) {
            filtered = filtered.filter((t) => (t.company || '').toLowerCase().includes(planQuery));
        }

        if (sortTradesByHoldDays) filtered = sortTradesByHoldDays(filtered);

        let net = 0;
        filtered.forEach((t) => {
            net += resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : 0;
        });

        paintPlanTradeSummary(net, filtered.length);

        const container = document.getElementById('planTradesList');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = planQuery
                ? renderPageEmptyCard('fa-search', `No planned trades match "${getPlanSearchQuery().trim()}"`, 'Try a different company name or clear the search.')
                : renderPageEmptyCard('fa-clipboard-list', 'No trades planned yet.', 'Tap the + button to add companies for tomorrow. Tap Executed after you buy.');
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, renderPlanTradeListItem);
    }

    global.MTFRegister({ renderPlanTrades });
})(typeof window !== 'undefined' ? window : globalThis);
