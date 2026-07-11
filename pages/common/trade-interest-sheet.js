/**
 * O35 — Trade interest detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        interestSheetRow,
        appTag,
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
            ? '<p class="small text-muted mb-0">Same-day trade — no MTF interest. Broker charges use intraday rates.</p>'
            : '';
        const noLevNote = noLeverage && !d.sameDay
            ? '<p class="small text-muted mb-0">No leverage on this trade — broker funded amount is zero, so no MTF interest applies.</p>'
            : '';

        Sheet.open(`${global.MTFComponents.renderIcon('fa-percent', { className: 'text-info flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company}</span>${appTag(broker, 'broker')}`, `
            <div>
                <div class="trade-metrics-panel mb-3">
                    <table class="table table-sm trade-metrics-table">
                        <tbody>
                            ${interestSheetRow('Total interest', fmtDec(d.interest), 'text-warning')}
                            ${interestSheetRow('Total investment', fmtDec(d.totalInvestment))}
                            ${interestSheetRow('Your margin', fmtDec(d.ownMargin))}
                            ${interestSheetRow('Leverage', levDisplay, 'text-primary')}
                            ${interestSheetRow('Broker funded', fmtDec(d.mtf))}
                            ${interestSheetRow('Days financed', d.sameDay ? '0 day(s)' : `${d.days} day(s)`)}
                            ${interestSheetRow('Interest per day', fmtDec(d.perDayInterest), 'text-warning')}
                            ${interestSheetRow('Rate per day', `${(d.dailyRate * 100).toFixed(4)}%`)}
                            ${interestSheetRow('Rate per year', `${(d.annualRate * 100).toFixed(2)}%`)}
                        </tbody>
                    </table>
                </div>
                ${sameDayNote}
                ${noLevNote}
            </div>
        `, '');
    }

    global.MTFRegister({ openInterestModal });
})(typeof window !== 'undefined' ? window : globalThis);
