/**
 * O35 — Trade interest detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        interestSheetRow,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openInterestModal(id) {
        const { getTransaction, interestDetails } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const d = interestDetails ? interestDetails(tx) : {};
        const lev = Number(tx.leverage) || 1;
        const levDisplay = lev > 1 ? `${parseFloat(lev.toFixed(2))}x` : '1x';
        const broker = tx.broker || '—';
        const noLeverage = d.mtf <= 0;
        const sameDayNote = d.sameDay
            ? '<p class="interest-sheet__note">Same-day trade — no MTF interest. Broker charges use intraday rates.</p>'
            : '';
        const noLevNote = noLeverage && !d.sameDay
            ? '<p class="interest-sheet__note">No leverage on this trade — broker funded amount is zero, so no MTF interest applies.</p>'
            : '';

        Sheet.open(`<i class="fas fa-percent mr-2 text-[var(--content-accent-quantity)]"></i><span class="interest-sheet__title-name">${tx.company}</span><span class="interest-sheet__title-broker">${broker}</span>`, `
            <div class="interest-sheet">
                <div class="interest-sheet__card">
                    ${interestSheetRow('Total interest', fmtDec(d.interest), 'interest-sheet__row-value--interest interest-sheet__row-value--total')}
                    ${interestSheetRow('Total investment', fmtDec(d.totalInvestment))}
                    ${interestSheetRow('Your margin', fmtDec(d.ownMargin))}
                    ${interestSheetRow('Leverage', levDisplay, 'interest-sheet__row-value--lev')}
                    ${interestSheetRow('Broker funded', fmtDec(d.mtf), 'interest-sheet__row-value--strong')}
                    ${interestSheetRow('Days financed', d.sameDay ? '0 day(s)' : `${d.days} day(s)`, 'interest-sheet__row-value--days')}
                    ${interestSheetRow('Interest per day', fmtDec(d.perDayInterest), 'interest-sheet__row-value--interest')}
                    ${interestSheetRow('Rate per day', `${(d.dailyRate * 100).toFixed(4)}%`)}
                    ${interestSheetRow('Rate per year', `${(d.annualRate * 100).toFixed(2)}%`)}
                </div>
                ${sameDayNote}
                ${noLevNote}
            </div>
        `, '');
    }

    global.MTFRegister({ openInterestModal });
})(typeof window !== 'undefined' ? window : globalThis);
