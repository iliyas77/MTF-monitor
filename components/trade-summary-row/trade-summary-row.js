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

    function renderTwoItemSummaryRow(net, count, countLabel) {
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        const pnlToneClass = n >= 0 ? 'text-success' : 'text-error';
        return `<div class="flex items-center justify-between gap-4 w-full">
            <div class="flex-1 min-w-0 text-left">
                <div class="text-xs uppercase tracking-wide font-medium text-base-content/60 mb-1">P&L</div>
                <div class="text-xl ${pnlToneClass} truncate">${pnlFormatted}</div>
            </div>
            <div class="flex-1 min-w-0 text-right">
                <div class="text-xs uppercase tracking-wide font-medium text-base-content/60 mb-1">${countLabel}</div>
                <div class="text-xl text-base-content/80 truncate">${count}</div>
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
