/**
 * M39 — Money account card molecule.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        renderAmount,
        renderMoneyAmountWords,
        menuIconClass
    } = global.MTFComponents;

    function ui() {
        return (global.MTFAppHelpers || {}).ui || {};
    }

    function renderMoneyAccountCard(stats, historyCount) {
        const acc = stats.account;
        const holderLine = acc.holderName ? appTag(acc.holderName) : '';
        const actionBtnSm = ui().actionBtnSm || 'btn btn-sm min-h-0 h-8 w-8 rounded-lg p-0 flex items-center justify-center';
        const row = (label, amount, extra = '', tone = 'positive') =>
            `<div class="py-2 border-b border-base-200 ${extra}">
                <div class="flex justify-between items-start gap-4">
                    <span class="text-sm shrink-0 pt-1 ${tone === 'deposit' ? 'deposit-label' : 'text-base-content/60'}">${label}</span>
                    <div class="money-value-block money-value-block--right min-w-0 max-w-[62%]">
                        <div class="money-stat-amount money-stat-amount--right">${renderAmount(amount, { size: 'md', tone, align: 'right', pill: false })}</div>
                        ${renderMoneyAmountWords(amount, 'right')}
                    </div>
                </div>
            </div>`;
        return `
            <div class="card bg-base-100 rounded-2xl money-account-card">
                <div class="card-body p-0">
                    <div class="px-4 pt-4 pb-3">
                        <div class="trade-card-header items-start">
                            <div class="money-account-card__title-row min-w-0">
                                <div class="trade-card-header__title">${acc.name}</div>
                                ${holderLine}
                            </div>
                            <div class="trade-card-header__actions">
                                ${renderAmount(stats.totalValue, { size: 'md', align: 'right', tone: 'positive', pill: false, className: 'trade-card-header__pnl' })}
                                <div class="dropdown dropdown-end trade-row-dropdown">
                                    <button type="button" class="${actionBtnSm} btn-ghost bg-base-200 border border-base-200" tabindex="0" role="button" aria-expanded="false" title="More" aria-label="More">
                                        <i class="fas fa-ellipsis-v text-sm"></i>
                                    </button>
                                    <ul class="dropdown-content menu app-dropdown-menu bg-base-100 border border-base-200 rounded-box z-50 p-2 min-w-[11.5rem]">
                                        <li>
                                            <button type="button" class="flex items-center w-full px-2 py-2 rounded-lg hover:bg-base-200 money-account-expand-toggle" onclick="toggleMoneyAccountExpand(this)" aria-expanded="false">
                                                <span class="flex-1 text-left money-account-expand-toggle__label">Expand details</span>
                                            </button>
                                        </li>
                                        <li class="menu-title p-0"><hr class="my-0 opacity-20"></li>
                                        <li>
                                            <button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200" onclick="openMoneyEntryModal('${acc.id}', 'deposit')">
                                                <span class="${menuIconClass('deposit')}"><i class="fas fa-plus"></i></span>
                                                <span class="flex-1 text-left">Deposit</span>
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200" onclick="openMoneyEntryModal('${acc.id}', 'withdraw')">
                                                <span class="${menuIconClass('withdraw')}"><i class="fas fa-minus"></i></span>
                                                <span class="flex-1 text-left">Withdraw</span>
                                            </button>
                                        </li>
                                        <li class="menu-title p-0"><hr class="my-0 opacity-20"></li>
                                        <li>
                                            <button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200" onclick="openAccountHistorySheet('${acc.id}')">
                                                <span class="${menuIconClass('history')}"><i class="fas fa-history"></i></span>
                                                <span class="flex-1 text-left">History</span>
                                                ${historyCount ? appTag(String(historyCount), 'accent') : ''}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200" onclick="openMoneyAccountModal('${acc.id}')">
                                                <span class="${menuIconClass('edit')}"><i class="fas fa-pen"></i></span>
                                                <span class="flex-1 text-left">Edit account</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="trade-card-details trade-card-details--hidden px-4 pb-4">
                        ${row('Deposited', stats.deposited, '', 'deposit')}
                        ${row('Withdrawn', stats.withdrawn, '', 'withdraw')}
                        ${row('<span class="font-medium text-base-content/80">Total Value</span>', stats.totalValue, 'border-b-0 pt-2 mt-1', 'positive')}
                    </div>
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderMoneyAccountCard });
})(typeof window !== 'undefined' ? window : globalThis);
