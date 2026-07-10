/**
 * M7 — Trade summary row molecule (P&L + count for page summaries).
 */
(function (global) {
    'use strict';

    const { fmt, paintMoneyAmountWords } = global.MTFComponents;

    function renderTradeSummaryRow(net, count, countLabel) {
        const toneClass = net >= 0 ? 'text-success' : 'text-danger';
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        return `<div class="d-flex justify-content-between align-items-center gap-2 w-100">
            <div class="d-flex flex-column min-w-0">
                <span class="small text-muted text-uppercase fw-normal">P&L</span>
                <span class="fs-5 fw-normal text-truncate ${toneClass}">${pnlFormatted}</span>
            </div>
            <div class="d-flex flex-column min-w-0 text-end">
                <span class="small text-muted text-uppercase fw-normal">${countLabel}</span>
                <span class="fs-5 fw-normal text-body-secondary text-truncate">${count}</span>
            </div>
        </div>`;
    }

    function renderTwoItemSummaryRow(net, count, countLabel) {
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        const pnlToneClass = n >= 0 ? 'text-success' : 'text-danger';
        return `<div class="d-flex align-items-center justify-content-between gap-2 w-100">
            <div class="flex-fill min-w-0 text-start">
                <div class="small text-uppercase fw-normal text-muted">P&L</div>
                <div class="fs-5 fw-normal ${pnlToneClass} text-truncate">${pnlFormatted}</div>
            </div>
            <div class="flex-fill min-w-0 text-end">
                <div class="small text-uppercase fw-normal text-muted">${countLabel}</div>
                <div class="fs-5 fw-normal text-body-secondary text-truncate">${count}</div>
            </div>
        </div>`;
    }

    function paintTradeRangeSummary({ containerId, wordsId, net, count, countLabel, useTwoItemLayout }) {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (useTwoItemLayout) {
            el.innerHTML = renderTwoItemSummaryRow(net, count, countLabel);
        } else {
            el.innerHTML = renderTradeSummaryRow(net, count, countLabel);
        }
        if (wordsId) paintMoneyAmountWords(document.getElementById(wordsId), net, 'center');
    }

    function paintPastTradeSummary(net, tradeCount) {
        paintTradeRangeSummary({
            containerId: 'pastSummaryStats',
            wordsId: 'pastSummaryNetWords',
            net,
            count: tradeCount,
            countLabel: 'Trades',
            useTwoItemLayout: true
        });
    }

    function paintPlanTradeSummary(net, planCount) {
        paintTradeRangeSummary({
            containerId: 'planSummaryStats',
            wordsId: 'planSummaryNetWords',
            net,
            count: planCount,
            countLabel: 'Planned',
            useTwoItemLayout: true
        });
    }

    global.MTFRegister({
        renderTradeSummaryRow,
        renderTwoItemSummaryRow,
        paintTradeRangeSummary,
        paintPastTradeSummary,
        paintPlanTradeSummary
    });
})(typeof window !== 'undefined' ? window : globalThis);
