/**
 * M38 — Money filter list item molecule.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        fmtDateDisplay,
        renderDateChip,
        renderAmount,
        renderMoneyAmountWords,
        formatMoneyEntryTimeDisplay
    } = global.MTFComponents;

    function renderMoneyFilterListItem(e, showAccount, hideTypeBadge, accounts) {
        const isDeposit = e.type === 'deposit';
        const typeBadge = hideTypeBadge ? '' : (isDeposit
            ? appTag('Invest', 'secondary')
            : appTag('Withdraw', 'error'));
        const acc = accounts.find((a) => a.id === e.accountId);
        const accountChip = showAccount && acc
            ? appTag(`<i class="fas fa-university mr-1"></i>${acc.name}`)
            : '';
        const topRow = (accountChip || typeBadge)
            ? `<div class="flex flex-wrap gap-1.5 mb-1">${accountChip}${typeBadge}</div>`
            : '';
        return `
            <div class="flex justify-between items-start gap-3 py-3 border-b border-base-200 last:border-0">
                <div class="min-w-0 flex-1">
                    ${topRow}
                    <div class="text-sm text-base-content/60 app-datetime-row">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span class="app-datetime-sep">·</span><span class="app-datetime-time"><i class="far fa-clock mr-1"></i>${formatMoneyEntryTimeDisplay(e.time)}</span></div>
                </div>
                <div class="money-value-block money-value-block--right shrink-0 max-w-[58%]">
                    <div class="money-stat-amount money-stat-amount--right">${renderAmount(e.amount, { size: 'md', tone: isDeposit ? 'deposit' : 'withdraw', align: 'right' })}</div>
                    ${renderMoneyAmountWords(e.amount, 'right')}
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderMoneyFilterListItem });
})(typeof window !== 'undefined' ? window : globalThis);
