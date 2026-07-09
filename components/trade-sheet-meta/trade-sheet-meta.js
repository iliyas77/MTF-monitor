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
            appTag(tx.broker || '—'),
            appTag(levDisplay, 'accent'),
            appTag(`<i class="far fa-clock mr-1 opacity-70"></i>${holdLabel}`)
        ].concat(extras);
        return `<div class="flex flex-wrap gap-1.5 justify-center mb-3">${tags.join('')}</div>`;
    }

    function interestSheetRow(label, value, valueClass = '') {
        return `
            <div class="interest-sheet__row">
                <span class="interest-sheet__row-label">${label}</span>
                <span class="interest-sheet__row-value ${valueClass}">${value}</span>
            </div>
        `;
    }

    global.MTFRegister({ buildTradeMetaTags, interestSheetRow });
})(typeof window !== 'undefined' ? window : globalThis);
