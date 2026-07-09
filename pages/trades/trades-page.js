/**
 * O14 — Trades page render organism (open / planned view).
 */
(function (global) {
    'use strict';

    const {
        paintTradeRangeSummary,
        renderFlatTradesList,
        renderPlanTradeListItem,
        renderOpenTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderCurrentView() {
        const {
            getTransactions,
            isPlannedTrade,
            isActiveOpenTrade,
            sortTradesByHoldDays,
            resolveTradeMetrics,
            getTradeSearchQuery = () => '',
            getTradesViewMode = () => 'trade'
        } = tradePages();

        const tradesViewMode = getTradesViewMode();
        const isPlan = tradesViewMode === 'plan';
        const txs = getTransactions ? getTransactions() : [];
        let filtered = txs.filter(isPlan ? isPlannedTrade : isActiveOpenTrade);

        const tradeQuery = getTradeSearchQuery().trim().toLowerCase();
        if (tradeQuery) {
            filtered = filtered.filter((t) => (t.company || '').toLowerCase().includes(tradeQuery));
        }

        if (sortTradesByHoldDays) filtered = sortTradesByHoldDays(filtered);

        let net = 0;
        filtered.forEach((t) => {
            net += resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : 0;
        });

        paintTradeRangeSummary({
            containerId: 'summaryOpenStats',
            wordsId: 'summaryNetWords',
            net,
            count: filtered.length,
            countLabel: isPlan ? 'Planned' : 'Open'
        });

        const container = document.getElementById('transactionList');
        if (!container) return;

        if (filtered.length === 0) {
            if (tradeQuery) {
                const label = isPlan ? 'planned trades' : 'open trades';
                container.innerHTML = renderPageEmptyCard(
                    'fa-search',
                    `No ${label} match "${getTradeSearchQuery().trim()}"`,
                    'Try a different company name or clear the search.'
                );
                return;
            }
            container.innerHTML = isPlan
                ? renderPageEmptyCard('fa-clipboard-list', 'No trades planned yet.', 'Tap the + button to plan a trade. Tap Executed after you buy.')
                : renderPageEmptyCard('fa-inbox', 'No open trades yet.', 'Tap the + button to add a trade. Closed trades appear under Past Trades.');
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, isPlan ? renderPlanTradeListItem : renderOpenTradeListItem);
    }

    global.MTFRegister({ renderCurrentView });
})(typeof window !== 'undefined' ? window : globalThis);
