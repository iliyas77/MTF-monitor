/**
 * O14 — Trades page render organism (open / planned / past view).
 */
(function (global) {
    'use strict';

    const {
        fmtDateShort,
        paintTradeRangeSummary,
        renderFlatTradesList,
        renderPlanTradeListItem,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPageEmptyCard,
        renderIcon,
        PAST_PNL_OPTIONS
    } = global.MTFComponents;

    const TRADES_VIEW_OPTIONS = [
        { value: 'trade', label: 'Trade' },
        { value: 'plan', label: 'Plan' },
        { value: 'past', label: 'Past' }
    ];

    const PNL_OPTIONS = PAST_PNL_OPTIONS || [
        { value: 'all', label: 'All' },
        { value: 'profit', label: 'Profit' },
        { value: 'loss', label: 'Loss' },
        { value: 'verified', label: 'Verified' }
    ];

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderTradesFilterBar(from, to, viewMode, pnlFilter) {
        const rangeLabel = `${fmtDateShort(from)} – ${fmtDateShort(to)}`;
        const selected = TRADES_VIEW_OPTIONS.find((o) => o.value === viewMode) || TRADES_VIEW_OPTIONS[0];
        const items = TRADES_VIEW_OPTIONS.map((o) => {
            const active = o.value === selected.value ? ' active' : '';
            return `<li><button type="button" class="dropdown-item${active}" onclick="setTradesViewMode('${o.value}');event.stopPropagation();">${escapeHtml(o.label)}</button></li>`;
        }).join('');

        const pnlSelected = PNL_OPTIONS.find((o) => o.value === pnlFilter) || PNL_OPTIONS[0];
        const pnlItems = PNL_OPTIONS.map((o) => {
            const active = o.value === pnlSelected.value ? ' active' : '';
            return `<li><button type="button" class="dropdown-item${active}" onclick="setPastPnlFilter('${o.value}');event.stopPropagation();">${escapeHtml(o.label)}</button></li>`;
        }).join('');

        return `<div class="d-flex w-100 gap-2 align-items-stretch">
            <button type="button"
                class="btn btn-outline-secondary d-flex align-items-center gap-2 flex-grow-1 min-w-0 text-start"
                onclick="openFilterSheet()"
                aria-label="Change date range">
                ${renderIcon('fa-calendar-alt', { className: 'flex-shrink-0 text-primary' })}
                <span class="text-truncate">${rangeLabel}</span>
            </button>
            <div class="dropdown flex-shrink-0">
                <button type="button"
                    id="pastPnlFilter"
                    class="btn btn-outline-secondary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Filter by profit, loss, or verified">${escapeHtml(pnlSelected.label)}</button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">${pnlItems}</ul>
            </div>
            <div class="dropdown flex-shrink-0">
                <button type="button"
                    id="tradesViewMode"
                    class="btn btn-outline-secondary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Switch between Trade, Plan, and Past">${escapeHtml(selected.label)}</button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" id="tradesViewModeMenu">${items}</ul>
            </div>
        </div>`;
    }

    function applyPnlBucket(trades, pnlFilter, resolveTradeMetrics) {
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
        const filterBar = document.getElementById('tradesFilterBar');
        const container = document.getElementById('transactionList');
        const pastFrom = getPastFrom();
        const pastTo = getPastTo();
        const pnlFilter = getPastPnlFilter();

        if (filterBar) {
            filterBar.innerHTML = renderTradesFilterBar(pastFrom, pastTo, tradesViewMode, pnlFilter);
        }

        if (isPast) {
            const filtered = getPastFiltered ? getPastFiltered() : [];

            let net = 0;
            filtered.forEach((t) => {
                net += resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : (t.netProfit || 0);
            });

            paintTradeRangeSummary({
                containerId: 'summaryOpenStats',
                wordsId: 'summaryNetWords',
                net,
                count: filtered.length,
                countLabel: 'Past',
                useTwoItemLayout: true
            });

            if (!container) return;
            if (filtered.length === 0) {
                container.innerHTML = renderPageEmptyCard('fa-history', 'No past trades in this period', 'Try another date range.');
                return;
            }
            container.innerHTML = renderFlatTradesList(filtered, renderPastTradeListItem);
            return;
        }

        const txs = getTransactions ? getTransactions() : [];
        let filtered = txs.filter(isPlan ? isPlannedTrade : isActiveOpenTrade);

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

        filtered = applyPnlBucket(filtered, pnlFilter, resolveTradeMetrics);
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
            countLabel: isPlan ? 'Planned' : 'Open',
            useTwoItemLayout: true
        });

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
                ? renderPageEmptyCard('fa-clipboard-list', 'No trades planned in this range.', 'Try another date range, or tap + to plan a trade.')
                : renderPageEmptyCard('fa-inbox', 'No open trades in this range.', 'Try another date range, or tap + to add a trade.');
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, isPlan ? renderPlanTradeListItem : renderOpenTradeListItem);
    }

    global.MTFRegister({ renderCurrentView, TRADES_VIEW_OPTIONS });
})(typeof window !== 'undefined' ? window : globalThis);
