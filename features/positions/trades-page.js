/**
 * O14 — Trades page render organism (open / past view).
 */
(function (global) {
    'use strict';

    const {
        paintTradeRangeSummary,
        aggregatePortfolioSummary,
        renderFlatTradesList,
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
            parseDateKey,
            getTransactions
        } = tradePages();

        if (ensureSharedTradeRange) ensureSharedTradeRange();

        const tradesViewMode = getTradesViewMode();
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
                : { net: 0, invested: 0, holdings: filtered.length };

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
            filtered = txs.filter(isActiveOpenTrade || (() => false));
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
            : { net: 0, invested: 0, holdings: filtered.length };

        paintTradeRangeSummary({
            containerId: 'summaryOpenStats',
            wordsId: 'summaryNetWords',
            ...summary,
            usePortfolioLayout: true
        });

        if (!container) return;

        if (filtered.length === 0) {
            if (tradeQuery) {
                const label = isAll ? 'trades' : 'open trades';
                container.innerHTML = renderPageEmptyCard(
                    'fa-search',
                    `No ${label} match "${getTradeSearchQuery().trim()}"`,
                    'Try a different company name or clear the search.'
                );
                return;
            }
            container.innerHTML = isAll
                ? renderPageEmptyCard('fa-inbox', 'No trades in this range.', 'Try another date range, or add a trade from Watchlist.')
                : renderPageEmptyCard('fa-inbox', 'No open trades in this range.', 'Try another date range, or add a trade from Watchlist.');
            return;
        }

        if (isAll) {
            const listHtml = filtered.map((t, i) => {
                if (isActiveOpenTrade && isActiveOpenTrade(t)) return renderOpenTradeListItem(t, i + 1);
                return renderPastTradeListItem(t, i + 1);
            }).join('');
            container.innerHTML = `<div class="trade-cards-stack d-flex flex-column w-100">${listHtml}</div>`;
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, renderOpenTradeListItem, 'open');
    }

    global.MTFRegister({ renderCurrentView });
})(typeof window !== 'undefined' ? window : globalThis);
