/**
 * M13 — Trade list details table molecule.
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

    function renderTradeMetricsTable(rowsHtml, label, wrapperAttrs = '', labelLoadingHtml = null) {
        if (!rowsHtml) return '';
        const loadingSlot = labelLoadingHtml !== null
            ? `<span data-live-loading class="d-inline-flex align-items-center">${labelLoadingHtml || ''}</span>`
            : '';
        const heading = label
            ? `<div class="small text-muted text-uppercase mb-1 d-inline-flex align-items-center gap-1">${label}${loadingSlot}</div>`
            : '';
        return `
            <div${wrapperAttrs}>
                ${heading}
                <div class="trade-metrics-panel">
                    <table class="table table-sm trade-metrics-table">
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderTradeListItemDetailRows(t) {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { sellPrice: 0, interest: 0, charges: 0 };
        const isOpen = (t.status || 'closed') === 'open';
        const buy = fmtDec(t.buyPrice || 0);
        const sellHtml = renderTradeSellDetailValue(t.buyPrice, metrics.sellPrice);
        const interestHtml = renderTradeInterestDetailValue(t, metrics.interest);
        const charges = fmtDec(metrics.charges);
        const buyDate = t.buyDate ? fmtDateShort(t.buyDate) : '—';
        const sellDate = t.sellDate ? fmtDateShort(t.sellDate) : '—';
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(t) : 0;
        const holdLabel = daysHeld === 1 ? '1 day' : `${daysHeld} days`;
        const soldHtml = t.sellDate
            ? `<span class="d-inline-flex align-items-center gap-1 flex-wrap">
                    <span>${sellDate}</span>
                    <span class="badge rounded-pill border bg-transparent text-body-secondary">${holdLabel}</span>
               </span>`
            : '—';
        const isPast = !isOpen;
        const buyOnclick = isPast ? `openBuyPriceModal('${t.id}')` : '';
        const sellOnclick = `openTargetModal('${t.id}')`;

        return `
            <tr>
                ${renderTradeDetailCell('Buy', buy, 'text-info', buyOnclick, 'fa-tag', 'bg-transparent', 'text-info')}
                ${renderTradeDetailCell('Target', sellHtml, 'fs-6', sellOnclick, 'fa-bullseye', 'bg-transparent', 'text-danger')}
            </tr>
            <tr>
                ${renderTradeDetailCell('Interest', interestHtml, '', `openInterestModal('${t.id}')`, 'fa-percent', 'bg-transparent', 'text-warning')}
                ${renderTradeDetailCell('Charges', charges, 'text-danger', `openChargesModal('${t.id}')`, 'fa-receipt', 'bg-transparent', 'text-danger')}
            </tr>
            <tr>
                ${renderTradeDetailCell('Bought', buyDate, 'text-body-secondary', `openHoldModal('${t.id}')`, 'fa-calendar-plus', 'bg-transparent', 'text-primary')}
                ${renderTradeDetailCell('Sold', soldHtml, 'text-body-secondary', `openHoldModal('${t.id}')`, 'fa-calendar-check', 'bg-transparent', 'text-primary')}
            </tr>
        `;
    }

    function renderTradeListItemDetails(t) {
        return renderTradeMetricsTable(
            renderTradeListItemDetailRows(t),
            'Already purchased'
        );
    }

    global.MTFRegister({
        renderTradeMetricsTable,
        renderTradeListItemDetailRows,
        renderTradeListItemDetails
    });
})(typeof window !== 'undefined' ? window : globalThis);
