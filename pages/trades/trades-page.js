/**
 * O14 — Trades page render organism (open / planned / past view).
 */
(function (global) {
    'use strict';

    const {
        paintTradeRangeSummary,
        aggregatePortfolioSummary,
        renderFlatTradesList,
        renderPlanTradeListItem,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function applyPnlBucket(trades, pnlFilter, resolveTradeMetrics, matchesPerfFilters) {
        if (typeof matchesPerfFilters === 'function') {
            return trades.filter((t) => matchesPerfFilters(t));
        }
        if (pnlFilter === 'profit') {
            return trades.filter((t) => (resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : (t.netProfit || 0)) >= 0);
        }
        if (pnlFilter === 'loss') {
            return trades.filter((t) => (resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : (t.netProfit || 0)) < 0);
        }
        if (pnlFilter === 'verified') {
            return trades.filter((t) => !!t.verified);
        }
        return trades;
    }

    function renderCurrentView() {
        const {
            getTransactions,
            isPlannedTrade,
            isActiveOpenTrade,
            sortTradesByHoldDays,
            sortTradesList,
            matchesHoldDaysFilter,
            matchesPerfFilters,
            resolveTradeMetrics,
            getTradeSearchQuery = () => '',
            getTradesViewMode = () => 'trade',
            getPastFiltered,
            ensureSharedTradeRange,
            getPastFrom = () => null,
            getPastTo = () => null,
            getPastPnlFilter = () => 'all',
            parseDateKey
        } = tradePages();

        if (ensureSharedTradeRange) ensureSharedTradeRange();

        const tradesViewMode = getTradesViewMode();
        const isPlan = tradesViewMode === 'plan';
        const isPast = tradesViewMode === 'past';
        const isAll = tradesViewMode === 'all';
        const container = document.getElementById('transactionList');
        const pastFrom = getPastFrom();
        const pastTo = getPastTo();
        const pnlFilter = getPastPnlFilter();
        const sortFn = sortTradesList || sortTradesByHoldDays;

        if (isPast) {
            const filtered = getPastFiltered ? getPastFiltered() : [];

            const summary = aggregatePortfolioSummary
                ? aggregatePortfolioSummary(filtered, resolveTradeMetrics)
                : { net: 0, invested: 0, holdings: filtered.length, mtfUsed: 0 };

            paintTradeRangeSummary({
                containerId: 'summaryOpenStats',
                wordsId: 'summaryNetWords',
                ...summary,
                usePortfolioLayout: true
            });

            if (!container) return;
            if (filtered.length === 0) {
                container.innerHTML = renderPageEmptyCard('fa-history', 'No past trades in this period', 'Try another date range.');
                return;
            }
            container.innerHTML = renderFlatTradesList(filtered, renderPastTradeListItem, 'past');
            return;
        }

        const txs = getTransactions ? getTransactions() : [];
        let filtered;
        if (isAll) {
            filtered = txs.filter((t) => (t.status || '') !== 'cancelled');
        } else {
            filtered = txs.filter(isPlan ? isPlannedTrade : isActiveOpenTrade);
        }

        if (pastFrom && pastTo) {
            const fromDate = new Date(pastFrom + 'T00:00:00');
            const toDate = new Date(pastTo + 'T23:59:59');
            filtered = filtered.filter((t) => {
                const key = parseDateKey ? parseDateKey(t.buyDate) : String(t.buyDate || '').slice(0, 10);
                if (!key) return false;
                const d = new Date(key + 'T12:00:00');
                return d >= fromDate && d <= toDate;
            });
        }

        const tradeQuery = getTradeSearchQuery().trim().toLowerCase();
        if (tradeQuery) {
            filtered = filtered.filter((t) => (t.company || '').toLowerCase().includes(tradeQuery));
        }

        if (matchesHoldDaysFilter) {
            filtered = filtered.filter((t) => matchesHoldDaysFilter(t));
        }
        filtered = applyPnlBucket(filtered, pnlFilter, resolveTradeMetrics, matchesPerfFilters);
        if (sortFn) filtered = sortFn(filtered);

        const summary = aggregatePortfolioSummary
            ? aggregatePortfolioSummary(filtered, resolveTradeMetrics)
            : { net: 0, invested: 0, holdings: filtered.length, mtfUsed: 0 };

        paintTradeRangeSummary({
            containerId: 'summaryOpenStats',
            wordsId: 'summaryNetWords',
            ...summary,
            usePortfolioLayout: true
        });

        if (!container) return;

        if (filtered.length === 0) {
            if (tradeQuery) {
                const label = isAll ? 'trades' : (isPlan ? 'planned trades' : 'open trades');
                container.innerHTML = renderPageEmptyCard(
                    'fa-search',
                    `No ${label} match "${getTradeSearchQuery().trim()}"`,
                    'Try a different company name or clear the search.'
                );
                return;
            }
            container.innerHTML = isAll
                ? renderPageEmptyCard('fa-inbox', 'No trades in this range.', 'Try another date range, or tap + to add a trade.')
                : (isPlan
                    ? renderPageEmptyCard('fa-clipboard-list', 'No planned trades in this range.', 'Try another date range, or tap + to plan a trade.')
                    : renderPageEmptyCard('fa-inbox', 'No open trades in this range.', 'Try another date range, or tap + to add a trade.'));
            return;
        }

        if (isAll) {
            container.innerHTML = filtered.map((t, i) => {
                if (isPlannedTrade && isPlannedTrade(t)) return renderPlanTradeListItem(t, i + 1);
                if (isActiveOpenTrade && isActiveOpenTrade(t)) return renderOpenTradeListItem(t, i + 1);
                return renderPastTradeListItem(t, i + 1);
            }).join('');
            return;
        }

        container.innerHTML = renderFlatTradesList(
            filtered,
            isPlan ? renderPlanTradeListItem : renderOpenTradeListItem,
            isPlan ? 'plan' : 'open'
        );
    }

    global.MTFRegister({ renderCurrentView });
})(typeof window !== 'undefined' ? window : globalThis);
