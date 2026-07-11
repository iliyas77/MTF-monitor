/**
 * M40 — Trade sheet meta tags and interest row molecules.
 */
(function (global) {
    'use strict';

    const { appTag } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function buildTradeMetaTags(tx, extras = []) {
        const { calcInterestDays, getDaysHeld } = tradeSheets();
        const lev = tx.leverage || 1;
        const levDisplay = lev > 1 ? `${parseFloat(Number(lev).toFixed(2))}x` : '1x';
        const daysHeld = (tx.buyDate && tx.sellDate && calcInterestDays)
            ? calcInterestDays(tx.buyDate, tx.sellDate)
            : (getDaysHeld ? getDaysHeld(tx) : 0);
        const holdLabel = daysHeld === 1 ? '1d hold' : `${daysHeld}d hold`;
        const tags = [
            appTag(tx.broker || '—', 'broker'),
            appTag(levDisplay, 'accent'),
            appTag(`<i class="far fa-clock me-1 opacity-75"></i>${holdLabel}`)
        ].concat(extras);
        return `<div class="d-flex flex-wrap gap-2 justify-content-center mb-3">${tags.join('')}</div>`;
    }

    function interestSheetRow(label, value, valueClass = '') {
        return `
            <tr>
                <td class="p-2 align-middle">
                    <span class="small text-muted fw-normal">${label}</span>
                </td>
                <td class="p-2 align-middle text-end">
                    <span class="fs-6 fw-normal ${valueClass}">${value}</span>
                </td>
            </tr>
        `;
    }

    global.MTFRegister({ buildTradeMetaTags, interestSheetRow });
})(typeof window !== 'undefined' ? window : globalThis);
