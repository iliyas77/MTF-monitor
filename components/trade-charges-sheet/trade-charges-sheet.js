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
            ? `<div class="alert alert-info py-2 text-sm mb-2">${global.MTFComponents.renderIcon('fa-bolt', { className: 'mr-1' })}Same-day ${tx.broker} trade — <strong>intraday charges</strong> apply (STT 0.025% on sell only, stamp 0.003% on buy; no pledge, unpledge or DP).</div>`
            : '';

        const chargesHtml = `
            ${buildTradeMetaTags(tx, tradeType === 'intraday' ? [appTag('Intraday', 'warning')] : [])}
            ${intraNote}
            ${chargesTable(buy, sell)}
            <div class="grid grid-cols-3 gap-2 text-center mt-3">
                <div class=""><div class="bg-base-200 rounded-xl p-2"><div class="text-sm buy-price-label">Buy Side</div><div class="buy-side-value">${fmtDec(buy.total)}</div></div></div>
                <div class=""><div class="bg-base-200 rounded-xl p-2"><div class="text-sm text-base-content/60">Sell Side</div><div class="font-medium text-base-content/80">${fmtDec(sell.total)}</div></div></div>
                <div class=""><div class="bg-base-200 rounded-xl p-2"><div class="text-sm text-base-content/55">Total</div><div class="font-medium text-base-content/75">${fmtDec(grand)}</div></div></div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-receipt', { className: 'mr-2' })}${tx.company} Charges`, chargesHtml, '');
    }

    global.MTFRegister({ openChargesModal });
})(typeof window !== 'undefined' ? window : globalThis);
