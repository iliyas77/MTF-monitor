/**
 * O14 — Trades page render organism (open / planned view).
 */
(function (global) {
    'use strict';

    const {
        fmtDateShort,
        paintTradeRangeSummary,
        renderFlatTradesList,
        renderPlanTradeListItem,
        renderOpenTradeListItem,
        renderPageEmptyCard,
        renderIcon
    } = global.MTFComponents;

    const TRADES_VIEW_OPTIONS = [
        { value: 'trade', label: 'Trade' },
        { value: 'plan', label: 'Plan' }
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

    function renderTradesFilterBar(from, to, viewMode) {
        const rangeLabel = (!from || !to)
            ? 'All dates'
            : `${fmtDateShort(from)} – ${fmtDateShort(to)}`;
        const selected = TRADES_VIEW_OPTIONS.find((o) => o.value === viewMode) || TRADES_VIEW_OPTIONS[0];
        const items = TRADES_VIEW_OPTIONS.map((o) => {
            const active = o.value === selected.value ? ' active' : '';
            return `<li><button type="button" class="dropdown-item${active}" onclick="setTradesViewMode('${o.value}');event.stopPropagation();">${escapeHtml(o.label)}</button></li>`;
        }).join('');

        return `<div class="d-flex w-100 gap-2 align-items-stretch">
            <button type="button"
                class="btn btn-outline-secondary d-flex align-items-center gap-2 flex-grow-1 min-w-0 text-start"
                onclick="openTradeFilterSheet()"
                aria-label="Change date range">
                ${renderIcon('fa-calendar-alt', { className: 'flex-shrink-0 text-primary' })}
                <span class="text-truncate">${rangeLabel}</span>
            </button>
            <button type="button"
                class="btn btn-outline-secondary flex-shrink-0"
                onclick="resetTradeFilters()"
                aria-label="Reset filters"
                title="Reset filters">
                ${renderIcon('fa-undo', { className: 'me-1' })}Reset
            </button>
            <div class="dropdown flex-shrink-0">
                <button type="button"
                    id="tradesViewMode"
                    class="btn btn-outline-secondary dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Switch between Trade and Plan">${escapeHtml(selected.label)}</button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" id="tradesViewModeMenu">${items}</ul>
            </div>
        </div>`;
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
            getTradeFrom = () => null,
            getTradeTo = () => null,
            parseDateKey
        } = tradePages();

        const tradesViewMode = getTradesViewMode();
        const isPlan = tradesViewMode === 'plan';
        const tradeFrom = getTradeFrom();
        const tradeTo = getTradeTo();
        const txs = getTransactions ? getTransactions() : [];
        let filtered = txs.filter(isPlan ? isPlannedTrade : isActiveOpenTrade);

        if (tradeFrom && tradeTo) {
            filtered = filtered.filter((t) => {
                const key = parseDateKey ? parseDateKey(t.buyDate) : String(t.buyDate || '').slice(0, 10);
                if (!key) return false;
                const d = new Date(key + 'T12:00:00');
                return d >= new Date(tradeFrom + 'T00:00:00') && d <= new Date(tradeTo + 'T23:59:59');
            });
        }

        const tradeQuery = getTradeSearchQuery().trim().toLowerCase();
        if (tradeQuery) {
            filtered = filtered.filter((t) => (t.company || '').toLowerCase().includes(tradeQuery));
        }

        if (sortTradesByHoldDays) filtered = sortTradesByHoldDays(filtered);

        let net = 0;
        filtered.forEach((t) => {
            net += resolveTradeMetrics ? resolveTradeMetrics(t).netProfit : 0;
        });

        const filterBar = document.getElementById('tradesFilterBar');
        if (filterBar) {
            filterBar.innerHTML = renderTradesFilterBar(tradeFrom, tradeTo, tradesViewMode);
        }

        paintTradeRangeSummary({
            containerId: 'summaryOpenStats',
            wordsId: 'summaryNetWords',
            net,
            count: filtered.length,
            countLabel: isPlan ? 'Planned' : 'Open',
            useTwoItemLayout: true
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
                ? renderPageEmptyCard('fa-clipboard-list', 'No trades planned in this range.', 'Try another date range, or tap + to plan a trade.')
                : renderPageEmptyCard('fa-inbox', 'No open trades in this range.', 'Try another date range, or tap + to add a trade.');
            return;
        }

        container.innerHTML = renderFlatTradesList(filtered, isPlan ? renderPlanTradeListItem : renderOpenTradeListItem);
    }

    global.MTFRegister({ renderCurrentView, TRADES_VIEW_OPTIONS });
})(typeof window !== 'undefined' ? window : globalThis);
