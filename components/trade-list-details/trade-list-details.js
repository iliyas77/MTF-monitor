/**
 * M13 — Trade list details grid molecule.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        fmtDateShort,
        renderTradeSellDetailValue,
        renderTradeInterestDetailValue,
        renderTradeDetailCell
    } = global.MTFComponents;

    function renderTradeListItemDetails(t) {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { sellPrice: 0, interest: 0, charges: 0 };
        const isOpen = (t.status || 'closed') === 'open';
        const buy = fmtDec(t.buyPrice || 0);
        const sellHtml = renderTradeSellDetailValue(t.buyPrice, metrics.sellPrice);
        const interestHtml = renderTradeInterestDetailValue(t, metrics.interest);
        const charges = fmtDec(metrics.charges);
        const buyDate = t.buyDate ? fmtDateShort(t.buyDate) : '—';
        const sellDate = t.sellDate ? fmtDateShort(t.sellDate) : '—';
        const isPast = !isOpen;
        const buyOnclick = isPast ? `openBuyPriceModal('${t.id}')` : '';
        const sellOnclick = `openTargetModal('${t.id}')`;

        return `
            <div class="trade-list-item__details">
                <div class="trade-list-item__details-grid">
                    ${renderTradeDetailCell('Buy', buy, 'trade-list-item__detail-value--buy', buyOnclick, 'fa-tag')}
                    ${renderTradeDetailCell('Target', sellHtml, 'trade-list-item__detail-value--sell-wrap', sellOnclick, 'fa-bullseye')}
                    ${renderTradeDetailCell('Interest', interestHtml, 'trade-list-item__detail-value--interest-wrap', `openInterestModal('${t.id}')`, 'fa-percent')}
                    ${renderTradeDetailCell('Charges', charges, 'trade-list-item__detail-value--charges', `openChargesModal('${t.id}')`, 'fa-receipt')}
                    ${renderTradeDetailCell('Bought', buyDate, 'trade-list-item__detail-value--date', `openHoldModal('${t.id}')`, 'fa-calendar-plus')}
                    ${renderTradeDetailCell('Sold', sellDate, 'trade-list-item__detail-value--date', `openHoldModal('${t.id}')`, 'fa-calendar-check')}
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderTradeListItemDetails });
})(typeof window !== 'undefined' ? window : globalThis);
