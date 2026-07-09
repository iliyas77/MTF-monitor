/**
 * O15 — Past trades page render organism.
 */
(function (global) {
    'use strict';

    const {
        renderDateRangeChip,
        paintPastTradeSummary,
        renderFlatTradesList,
        renderPastTradeListItem,
        renderPageEmptyCard,
        renderSelect
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderPastTrades() {
        const {
            getPastFiltered,
            getPastSearchQuery = () => '',
            getPastFrom = () => '',
            getPastTo = () => ''
        } = tradePages();

        const filtered = getPastFiltered ? getPastFiltered() : [];
        const pastQuery = getPastSearchQuery().trim().toLowerCase();
        const listContainer = document.getElementById('pastTradesList');

        const rangeHost = document.getElementById('pastRangeChipHost');
        if (rangeHost) {
            rangeHost.innerHTML = renderDateRangeChip(getPastFrom(), getPastTo(), {
                onclick: 'openFilterSheet()',
                clickable: true
            });
        }

        const pnlFilterHost = document.getElementById('pastPnlFilterHost');
        if (pnlFilterHost && renderSelect) {
            pnlFilterHost.innerHTML = renderSelect({
                id: 'pastPnlFilter',
                value: 'all',
                onchange: 'setPastPnlFilter(this.value)',
                ariaLabel: 'Filter by profit, loss, or verified',
                options: [
                    { value: 'all', label: 'All' },
                    { value: 'profit', label: 'Profit' },
                    { value: 'loss', label: 'Loss' },
                    { value: 'verified', label: 'Verified' }
                ],
                fullWidth: false
            });
        }

        let net = 0;
        filtered.forEach((t) => { net += t.netProfit || 0; });
        paintPastTradeSummary(net, filtered.length);

        if (!listContainer) return;

        if (filtered.length === 0) {
            listContainer.innerHTML = pastQuery
                ? renderPageEmptyCard('fa-search', `No past trades match "${getPastSearchQuery().trim()}"`, 'Try a different company name or clear the search.')
                : renderPageEmptyCard('fa-history', 'No past trades in this period', '');
            return;
        }

        listContainer.innerHTML = renderFlatTradesList(filtered, renderPastTradeListItem);
    }

    global.MTFRegister({ renderPastTrades });
})(typeof window !== 'undefined' ? window : globalThis);
