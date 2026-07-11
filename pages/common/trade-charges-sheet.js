/**
 * O34 — Trade charges detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        fmtDec,
        buildTradeMetaTags,
        chargeSides,
        chargesTable,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openChargesModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const { buy, sell, tradeType } = chargeSides(tx);
        const grand = buy.total + sell.total;
        const intraNote = tradeType === 'intraday'
            ? `<div class="alert alert-info py-2 small mb-2">${global.MTFComponents.renderIcon('fa-bolt', { className: 'me-1' })}Same-day ${tx.broker} trade — <strong>intraday charges</strong> apply (STT 0.025% on sell only, stamp 0.003% on buy; no pledge, unpledge or DP).</div>`
            : '';

        const chargesHtml = `
            ${buildTradeMetaTags(tx, tradeType === 'intraday' ? [appTag('Intraday', 'warning')] : [])}
            ${intraNote}
            ${chargesTable(buy, sell)}
            <div class="row g-2 text-center mt-3">
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-primary">Buy Side</div><div class="fs-6 fw-semibold text-primary">${fmtDec(buy.total)}</div></div></div>
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-muted">Sell Side</div><div class="fs-6 fw-medium text-body-secondary">${fmtDec(sell.total)}</div></div></div>
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-muted">Total</div><div class="fs-6 fw-medium text-body">${fmtDec(grand)}</div></div></div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-receipt', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Charges</span>`, chargesHtml, '');
    }

    global.MTFRegister({ openChargesModal });
})(typeof window !== 'undefined' ? window : globalThis);
