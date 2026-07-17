/**
 * O14 — Trades page render organism (open / past view).
 * Supports batch pagination: renders 20 items initially, appends more on "Load More".
 */
(function (global) {
    'use strict';

    const {
        paintTradeRangeSummary,
        aggregatePortfolioSummary,
        renderFlatTradesList,
        renderTradesListItems,
        renderLoadMoreButton,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPageEmptyCard
    } = global.MTFComponents;

    const PAGE_SIZE = 20;

    // ----- Pagination State -----
    // Tracks the current page (number of batches loaded) per view mode.
    // Reset whenever filters, search, or view mode change.
    const tradeListPages = { trade: 1, past: 1, all: 1 };

    // Stores the last filtered array so "Load More" can append without re-filtering.
    let _lastFilteredTrades = [];
    let _lastVariant = 'open';
    let _lastRenderItem = null;
    let _lastIsAllMode = false;

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

    /**
     * Returns the pagination key for the current view mode.
     */
    function getPageKey(tradesViewMode) {
        if (tradesViewMode === 'past') return 'past';
        if (tradesViewMode === 'all') return 'all';
        return 'trade';
    }

    function setPaginationState(variant, trades, isAllMode, renderItem) {
        _lastVariant = variant;
        _lastFilteredTrades = trades;
        _lastIsAllMode = isAllMode;
        _lastRenderItem = renderItem;
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
            getOpenTransactions
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
        const pageKey = getPageKey(tradesViewMode);

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

            // Store for "Load More" append
            setPaginationState('past', filtered, false, renderPastTradeListItem);

            container.innerHTML = renderFlatTradesList(filtered, renderPastTradeListItem, 'past', {
                pageSize: PAGE_SIZE,
                currentPage: tradeListPages[pageKey]
            });
            return;
        }

        const txs = getOpenTransactions ? getOpenTransactions() : [];
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
            setPaginationState('all', filtered, true, null);

            const currentPage = tradeListPages[pageKey];
            const visibleCount = PAGE_SIZE * currentPage;
            const visible = filtered.slice(0, visibleCount);
            const remaining = filtered.length - visible.length;

            const listHtml = visible.map((t, i) => {
                if (isActiveOpenTrade && isActiveOpenTrade(t)) return renderOpenTradeListItem(t, i + 1);
                return renderPastTradeListItem(t, i + 1);
            }).join('');

            let html = `<div class="trade-cards-stack d-flex flex-column w-100" data-ref="page.trades.all-list" data-trade-list-stack>${listHtml}</div>`;
            if (remaining > 0) {
                html += renderLoadMoreButton('all', remaining, visibleCount);
            }
            html += `<div id="tradeListLiveRegion-all" class="visually-hidden" aria-live="polite" aria-atomic="true" role="status" data-ref="page.all.live-region"></div>`;
            container.innerHTML = html;
            return;
        }

        setPaginationState('open', filtered, false, renderOpenTradeListItem);

        container.innerHTML = renderFlatTradesList(filtered, renderOpenTradeListItem, 'open', {
            pageSize: PAGE_SIZE,
            currentPage: tradeListPages[pageKey]
        });
    }

    /**
     * Resets pagination for all view modes (called on filter/search changes).
     */
    function resetTradeListPages() {
        tradeListPages.trade = 1;
        tradeListPages.past = 1;
        tradeListPages.all = 1;
    }

    /**
     * Global handler for "Load More" button clicks.
     * Appends the next batch of items to the existing DOM list (no full re-render).
     */
    global.loadMoreTrades = function loadMoreTrades(variant) {
        const { isActiveOpenTrade } = tradePages();
        const pageKey = variant === 'past' ? 'past' : (variant === 'all' ? 'all' : 'trade');
        const currentPage = tradeListPages[pageKey];
        const startIndex = PAGE_SIZE * currentPage;
        const nextBatch = _lastFilteredTrades.slice(startIndex, startIndex + PAGE_SIZE);

        if (!nextBatch.length) return;

        // Increment page counter
        tradeListPages[pageKey] = currentPage + 1;

        // Find the list stack container and append new items
        const stack = document.querySelector('[data-trade-list-stack]');
        if (!stack) return;

        let newItemsHtml;
        if (_lastIsAllMode) {
            // All mode uses mixed renderer
            newItemsHtml = nextBatch.map((t, i) => {
                if (isActiveOpenTrade && isActiveOpenTrade(t)) return renderOpenTradeListItem(t, startIndex + i + 1);
                return renderPastTradeListItem(t, startIndex + i + 1);
            }).join('');
        } else {
            newItemsHtml = renderTradesListItems(nextBatch, _lastRenderItem, startIndex);
        }

        // Mark the first new item so we can focus it for VoiceOver
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newItemsHtml;
        const firstNewCard = tempDiv.querySelector('[data-trade-card]');
        if (firstNewCard) {
            firstNewCard.setAttribute('data-trade-new-batch', 'true');
            firstNewCard.setAttribute('tabindex', '-1');
        }

        // Append new items to the stack (preserving existing DOM)
        stack.insertAdjacentHTML('beforeend', tempDiv.innerHTML);

        // Remove old "Load More" button
        const oldLoadMore = document.querySelector('[data-trade-load-more]');
        if (oldLoadMore) oldLoadMore.remove();

        // Add new "Load More" button if there are still more items
        const newVisibleCount = startIndex + nextBatch.length;
        const remaining = _lastFilteredTrades.length - newVisibleCount;
        if (remaining > 0) {
            stack.insertAdjacentHTML('afterend', renderLoadMoreButton(variant, remaining, newVisibleCount));
        }

        // VoiceOver: announce loaded count
        const liveRegion = document.getElementById(`tradeListLiveRegion-${variant}`);
        if (liveRegion) {
            liveRegion.textContent = `${nextBatch.length} more trades loaded. ${remaining > 0 ? remaining + ' remaining.' : 'All trades loaded.'}`;
        }

        // Focus the first newly added card for VoiceOver navigation
        requestAnimationFrame(() => {
            const newCard = document.querySelector('[data-trade-new-batch]');
            if (newCard) {
                newCard.focus();
                newCard.removeAttribute('data-trade-new-batch');
            }
        });
    };

    global.MTFRegister({ renderCurrentView, resetTradeListPages, tradeListPages, setPaginationState });
})(typeof window !== 'undefined' ? window : globalThis);
