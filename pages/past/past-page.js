/**
 * Past trades page — Bootstrap filter bar + list.
 */
(function (global) {
    'use strict';

    const {
        fmtDateShort,
        paintPastTradeSummary,
        countTradePnlBuckets,
        renderFlatTradesList,
        renderPastTradeListItem,
        renderPageEmptyCard,
        renderIcon
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

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderPastFilterBar(from, to, pnlFilter) {
        const rangeLabel = (from && to) ? `${fmtDateShort(from)} – ${fmtDateShort(to)}` : 'All';
        const selected = PAST_PNL_OPTIONS.find((o) => o.value === pnlFilter) || PAST_PNL_OPTIONS[0];
        const items = PAST_PNL_OPTIONS.map((o) => {
            const active = o.value === selected.value ? ' active' : '';
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
                    aria-label="Filter by profit, loss, or verified">${escapeHtml(selected.label)}</button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" id="pastPnlFilterMenu">${items}</ul>
            </div>
        </div>`;
    }

    function renderPastTrades() {
        const {
            getPastFiltered,
            getPastSearchQuery = () => '',
            getPastFrom = () => '',
            getPastTo = () => '',
            getPastPnlFilter = () => 'all'
        } = tradePages();

        const filtered = getPastFiltered ? getPastFiltered() : [];
        const pastQuery = getPastSearchQuery().trim().toLowerCase();
        const listContainer = document.getElementById('pastTradesList');

        const filterBar = document.getElementById('pastFilterBar');
        if (filterBar) {
            filterBar.innerHTML = renderPastFilterBar(getPastFrom(), getPastTo(), getPastPnlFilter());
        }

        let net = 0;
        filtered.forEach((t) => { net += t.netProfit || 0; });
        const buckets = countTradePnlBuckets ? countTradePnlBuckets(filtered) : { profit: 0, loss: 0 };
        paintPastTradeSummary(net, filtered.length, buckets.profit, buckets.loss);

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
