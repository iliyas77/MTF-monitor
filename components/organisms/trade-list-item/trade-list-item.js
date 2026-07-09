/**
 * O10 — Trade list item organism.
 */
(function (global) {
    'use strict';

    const {
        renderTradeCardPnl,
        renderTradeListItemHoldMeta,
        renderTradeListItemLeverageMeta,
        renderTradeListItemDetails,
        renderTradeListItemActions
    } = global.MTFComponents;

    function renderTradeListItem(t, serialNo, variant = 'open') {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { netProfit: 0 };
        const qty = Number(t.quantity) || 0;
        const company = t.company || 'trade';
        const brokerLabel = (variant === 'past' || variant === 'plan') && t.broker
            ? `<span class="trade-list-item__broker-label">${t.broker}</span>`
            : '';
        const verifiedLabel = variant === 'past' && t.verified
            ? `<span class="trade-list-item__verified-label">Verified</span>`
            : '';

        return `
            <article class="trade-list-item">
                <div class="trade-list-item__row trade-list-item__row--buy">
                    <div class="trade-list-item__buy">
                        <span class="trade-list-item__meta-group trade-list-item__qty-group">
                            <span class="trade-list-item__meta-label quantity-label">Qty</span>
                            <span class="trade-list-item__meta-value qty-value">${qty}</span>
                        </span>
                        <span class="trade-list-item__meta-pipe" aria-hidden="true">|</span>
                        ${renderTradeListItemLeverageMeta(t)}
                        <span class="trade-list-item__meta-pipe" aria-hidden="true">|</span>
                        ${renderTradeListItemHoldMeta(t)}
                    </div>
                    <div class="trade-list-item__pnl-wrap">${renderTradeCardPnl(metrics.netProfit)}</div>
                </div>
                <div class="trade-list-item__row trade-list-item__row--title">
                    <div class="trade-list-item__title">
                        <span class="trade-list-item__company-group">
                            <i class="fas fa-chart-line trade-list-item__company-icon" aria-hidden="true"></i>
                            <span class="trade-list-item__company-name">${company}</span>
                            ${brokerLabel}
                            ${verifiedLabel}
                        </span>
                    </div>
                </div>
                ${renderTradeListItemDetails(t)}
                <div class="trade-list-item__row trade-list-item__row--actions">
                    ${renderTradeListItemActions(t, variant)}
                </div>
            </article>
        `;
    }

    function renderOpenTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'open');
    }

    function renderPastTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'past');
    }

    function renderPlanTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'plan');
    }

    global.MTFRegister({
        renderTradeListItem,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPlanTradeListItem
    });
})(typeof window !== 'undefined' ? window : globalThis);
