/**
 * M7 — Trade summary row molecule (P&L + count for page summaries).
 */
(function (global) {
    'use strict';

    const { fmt, paintMoneyAmountWords } = global.MTFComponents;

    function renderTradeSummaryRow(net, count, countLabel) {
        const toneClass = net >= 0
            ? 'trade-summary-card__meta-value--positive'
            : 'trade-summary-card__meta-value--negative';
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        return `<div class="trade-summary-card__row">
            <span class="trade-summary-card__meta-group trade-summary-card__meta-group--start">
                <span class="trade-summary-card__meta-label">P&L</span>
                <span class="trade-summary-card__meta-value trade-summary-card__meta-value--pnl ${toneClass}">${pnlFormatted}</span>
            </span>
            <span class="trade-summary-card__meta-group trade-summary-card__meta-group--end">
                <span class="trade-summary-card__meta-label">${countLabel}</span>
                <span class="trade-summary-card__meta-value trade-summary-card__meta-value--count">${count}</span>
            </span>
        </div>`;
    }

    function paintTradeRangeSummary({ containerId, wordsId, net, count, countLabel }) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = renderTradeSummaryRow(net, count, countLabel);
        if (wordsId) paintMoneyAmountWords(document.getElementById(wordsId), net, 'center');
    }

    function paintPastTradeSummary(net, tradeCount) {
        paintTradeRangeSummary({
            containerId: 'pastSummaryStats',
            wordsId: 'pastSummaryNetWords',
            net,
            count: tradeCount,
            countLabel: 'Trades'
        });
    }

    function paintPlanTradeSummary(net, planCount) {
        paintTradeRangeSummary({
            containerId: 'planSummaryStats',
            wordsId: 'planSummaryNetWords',
            net,
            count: planCount,
            countLabel: 'Planned'
        });
    }

    global.MTFRegister({
        renderTradeSummaryRow,
        paintTradeRangeSummary,
        paintPastTradeSummary,
        paintPlanTradeSummary
    });
})(typeof window !== 'undefined' ? window : globalThis);
