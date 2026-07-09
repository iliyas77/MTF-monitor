/**
 * O17 — Money page render organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDateDisplay,
        renderDateRangeChip,
        renderAmount,
        renderMoneyAmountWords,
        paintTotalAmountCard,
        paintMoneyAmountWords,
        renderMoneyFilterListItem,
        renderMoneyAccountCard,
        formatMoneyEntryTimeDisplay,
        renderDateChip,
        appTag,
        Sheet,
        LABEL_CLASSES
    } = global.MTFComponents;

    function moneyPages() {
        return (global.MTFAppHelpers || {}).moneyPages || {};
    }

    function statLabel() {
        return LABEL_CLASSES.stat;
    }

    function sortMoneyEntries(entries) {
        return [...entries].sort((a, b) => {
            const da = (a.date || '') + 'T' + (a.time || '00:00');
            const db = (b.date || '') + 'T' + (b.time || '00:00');
            if (db !== da) return db.localeCompare(da);
            return (a.id < b.id ? 1 : -1);
        });
    }

    function computeAccountTotalValue(acc, entries) {
        let total = Number(acc.openingBalance) || 0;
        entries.filter((e) => e.accountId === acc.id).forEach((e) => {
            const amt = Number(e.amount) || 0;
            if (e.type === 'deposit') total += amt;
            else if (e.type === 'withdraw') total -= amt;
        });
        return total;
    }

    function summarizeMoneyEntries(entries) {
        let deposited = 0;
        let withdrawn = 0;
        let depositCount = 0;
        let withdrawCount = 0;
        entries.forEach((e) => {
            const amt = Number(e.amount) || 0;
            if (e.type === 'deposit') { deposited += amt; depositCount++; }
            else if (e.type === 'withdraw') { withdrawn += amt; withdrawCount++; }
        });
        return { deposited, withdrawn, depositCount, withdrawCount };
    }

    function computeMoneyStats() {
        const mp = moneyPages();
        const getMoneyAccounts = mp.getMoneyAccounts || (() => []);
        const getMoneyEntries = mp.getMoneyEntries || (() => []);
        const moneyPageFiltersActive = mp.moneyPageFiltersActive || (() => false);
        const matchesMoneyPageEntryFilter = mp.matchesMoneyPageEntryFilter || (() => true);

        const accounts = getMoneyAccounts();
        const allEntries = getMoneyEntries();
        const pageFiltered = moneyPageFiltersActive()
            ? allEntries.filter(matchesMoneyPageEntryFilter)
            : allEntries;
        const portfolio = { deposited: 0, withdrawn: 0, totalValue: 0, depositCount: 0, withdrawCount: 0 };

        const perAccount = accounts.map((acc) => {
            const acctAll = allEntries.filter((e) => e.accountId === acc.id);
            const acctDisplay = moneyPageFiltersActive()
                ? pageFiltered.filter((e) => e.accountId === acc.id)
                : acctAll;
            const summary = summarizeMoneyEntries(acctDisplay);
            const totalValue = computeAccountTotalValue(acc, allEntries);

            portfolio.deposited += summary.deposited;
            portfolio.withdrawn += summary.withdrawn;
            portfolio.depositCount += summary.depositCount;
            portfolio.withdrawCount += summary.withdrawCount;
            portfolio.totalValue += totalValue;

            return { account: acc, ...summary, totalValue };
        });

        return { perAccount, portfolio };
    }

    function renderMoneyFilterView(displayPortfolio) {
        const mp = moneyPages();
        const getMoneyAccounts = mp.getMoneyAccounts || (() => []);
        const getMoneyPageFilteredEntries = mp.getMoneyPageFilteredEntries || (() => []);
        const getMoneyPageFilterViewTitle = mp.getMoneyPageFilterViewTitle || (() => 'Transactions');
        const getMoneyAccountFilter = mp.getMoneyAccountFilter || (() => 'all');
        const getMoneyPageTypeFilter = mp.getMoneyPageTypeFilter || (() => 'all');
        const getMoneyPageRangeKey = mp.getMoneyPageRangeKey || (() => 'all');
        const moneyPageDateFilterActive = mp.moneyPageDateFilterActive || (() => false);
        const getMoneyPageFrom = mp.getMoneyPageFrom || (() => null);
        const getMoneyPageTo = mp.getMoneyPageTo || (() => null);
        const syncMoneyTypeDropdowns = mp.syncMoneyTypeDropdowns || (() => {});

        const titleEl = document.getElementById('moneyPageFilterViewTitle');
        const metaEl = document.getElementById('moneyPageFilterViewMeta');
        const summaryEl = document.getElementById('moneyPageFilterSummary');
        const listEl = document.getElementById('moneyPageFilterList');
        if (!titleEl || !summaryEl || !listEl) return;

        const entries = getMoneyPageFilteredEntries();
        const moneyAccountFilter = getMoneyAccountFilter();
        const moneyPageTypeFilter = getMoneyPageTypeFilter();
        const showAccount = moneyAccountFilter === 'all';
        const isWithdrawOnly = moneyPageTypeFilter === 'withdraw';
        const isDepositOnly = moneyPageTypeFilter === 'deposit';
        const accounts = getMoneyAccounts();

        titleEl.textContent = getMoneyPageFilterViewTitle();
        if (metaEl) {
            const parts = [];
            if (moneyAccountFilter !== 'all') {
                const acc = accounts.find((a) => a.id === moneyAccountFilter);
                if (acc) parts.push(acc.name);
            }
            const quickLabels = { yesterday: 'Yesterday', 7: 'Last 1 week', 30: 'Last 1 month', 90: 'Last 3 months' };
            const prefix = quickLabels[getMoneyPageRangeKey()] || '';
            if (prefix) parts.push(prefix);
            metaEl.textContent = parts.join(' · ') || 'All accounts · All time';
        }

        const dateChipHost = document.getElementById('moneyPageFilterDateChipHost');
        if (dateChipHost) {
            dateChipHost.innerHTML = moneyPageDateFilterActive()
                ? renderDateRangeChip(getMoneyPageFrom(), getMoneyPageTo(), { size: 'sm', onclick: 'openMoneyPageFilterSheet()', clickable: true })
                : '';
        }

        if (document.getElementById('moneyPageFilterTypeLabel')) syncMoneyTypeDropdowns();

        if (isWithdrawOnly) {
            summaryEl.innerHTML = `
                <div class="${statLabel()}">Total Withdrawn</div>
                <div class="money-value-block money-value-block--center mx-auto">
                    <div class="money-stat-amount money-stat-amount--center">
                        ${renderAmount(displayPortfolio.withdrawn, { size: 'lg', tone: 'withdraw', align: 'center' })}
                    </div>
                    ${renderMoneyAmountWords(displayPortfolio.withdrawn, 'center')}
                </div>
                <div class="text-xs text-base-content/60 mt-2">${displayPortfolio.withdrawCount} withdrawal${displayPortfolio.withdrawCount === 1 ? '' : 's'}</div>
            `;
        } else if (isDepositOnly) {
            summaryEl.innerHTML = `
                <div class="${statLabel()} deposit-label">Total Deposited</div>
                <div class="money-value-block money-value-block--center mx-auto">
                    <div class="money-stat-amount money-stat-amount--center">
                        ${renderAmount(displayPortfolio.deposited, { size: 'lg', tone: 'deposit', align: 'center' })}
                    </div>
                    ${renderMoneyAmountWords(displayPortfolio.deposited, 'center')}
                </div>
                <div class="text-xs text-base-content/60 mt-2">${displayPortfolio.depositCount} deposit${displayPortfolio.depositCount === 1 ? '' : 's'}</div>
            `;
        } else {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="money-value-block money-value-block--center">
                        <div class="${statLabel()} deposit-label">Deposited</div>
                        <div class="money-stat-amount money-stat-amount--center">
                            ${renderAmount(displayPortfolio.deposited, { size: 'md', tone: 'deposit', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(displayPortfolio.deposited, 'center')}
                        <div class="text-xs text-base-content/60 mt-1">${displayPortfolio.depositCount} deposit${displayPortfolio.depositCount === 1 ? '' : 's'}</div>
                    </div>
                    <div class="money-value-block money-value-block--center">
                        <div class="${statLabel()}">Withdrawn</div>
                        <div class="money-stat-amount money-stat-amount--center">
                            ${renderAmount(displayPortfolio.withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(displayPortfolio.withdrawn, 'center')}
                        <div class="text-xs text-base-content/60 mt-1">${displayPortfolio.withdrawCount} withdrawal${displayPortfolio.withdrawCount === 1 ? '' : 's'}</div>
                    </div>
                </div>
            `;
        }

        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-base-content/60 py-4">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="text-sm text-base-content/60 mb-2">No entries match your filter.</p><button type="button" class="btn btn-sm btn-ghost" onclick="openMoneyPageFilterSheet()">Change filter</button></div>`;
            return;
        }

        listEl.innerHTML = entries.map((e) => renderMoneyFilterListItem(e, showAccount, isWithdrawOnly || isDepositOnly, accounts)).join('');
    }

    function renderAccountHistorySheet() {
        const mp = moneyPages();
        const getMoneyAccounts = mp.getMoneyAccounts || (() => []);
        const getMoneyEntries = mp.getMoneyEntries || (() => []);
        const getMoneyHistorySheetAccountId = mp.getMoneyHistorySheetAccountId || (() => null);
        const getMoneyHistorySheetTitle = mp.getMoneyHistorySheetTitle || (() => 'Account History');
        const syncMoneyHistoryFilterUI = mp.syncMoneyHistoryFilterUI || (() => {});
        const filterMoneyHistoryEntries = mp.filterMoneyHistoryEntries || ((e) => e);
        const getMoneyHistoryActiveFilterLabel = mp.getMoneyHistoryActiveFilterLabel || (() => 'All time');
        const moneyHistoryFiltersActive = mp.moneyHistoryFiltersActive || (() => false);
        const moneyHistoryDateFilterActive = mp.moneyHistoryDateFilterActive || (() => false);
        const getMoneyHistoryFrom = mp.getMoneyHistoryFrom || (() => null);
        const getMoneyHistoryTo = mp.getMoneyHistoryTo || (() => null);

        const acc = getMoneyAccounts().find((a) => a.id === getMoneyHistorySheetAccountId());
        const metaEl = document.getElementById('moneyHistoryMeta');
        const summaryEl = document.getElementById('moneyHistorySheetSummary');
        const listEl = document.getElementById('moneyHistorySheetList');
        if (!acc || !listEl) return;

        if (Sheet._activePanel?.id === 'panelMoneyHistory' && Sheet.titleEl()) {
            Sheet.titleEl().textContent = getMoneyHistorySheetTitle();
        }

        syncMoneyHistoryFilterUI();

        const allEntries = sortMoneyEntries(getMoneyEntries().filter((e) => e.accountId === acc.id));
        const entries = filterMoneyHistoryEntries(allEntries);
        let deposited = 0;
        let withdrawn = 0;
        entries.forEach((e) => {
            const amt = Number(e.amount) || 0;
            if (e.type === 'deposit') deposited += amt;
            else if (e.type === 'withdraw') withdrawn += amt;
        });

        if (metaEl) {
            let meta = getMoneyHistoryActiveFilterLabel();
            if (moneyHistoryFiltersActive()) meta += ` · ${entries.length} of ${allEntries.length}`;
            metaEl.textContent = meta;
            metaEl.classList.toggle('is-filtered', moneyHistoryFiltersActive());
        }

        const historyDateChipHost = document.getElementById('moneyHistoryDateChipHost');
        if (historyDateChipHost) {
            historyDateChipHost.innerHTML = moneyHistoryDateFilterActive()
                ? renderDateRangeChip(getMoneyHistoryFrom(), getMoneyHistoryTo(), { size: 'sm', onclick: 'openMoneyHistoryRangeSheet()', clickable: true })
                : '';
        }

        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="money-value-block money-value-block--center">
                        <div class="${statLabel()} deposit-label">Deposited</div>
                        <div class="money-stat-amount money-stat-amount--center">
                            ${renderAmount(deposited, { size: 'md', tone: 'deposit', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(deposited, 'center')}
                    </div>
                    <div class="money-value-block money-value-block--center">
                        <div class="${statLabel()}">Withdrawn</div>
                        <div class="money-stat-amount money-stat-amount--center">
                            ${renderAmount(withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(withdrawn, 'center')}
                    </div>
                </div>
            `;
        }

        if (allEntries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-base-content/60 py-4">${global.MTFComponents.renderIcon('fa-inbox', { className: 'mb-2 opacity-25' })}<p class="text-sm text-base-content/60 mb-0">No deposits or withdrawals yet.</p></div>`;
            return;
        }

        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-base-content/60 py-4">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="text-sm text-base-content/60 mb-0">No entries match your filters.</p><button type="button" class="btn btn-sm btn-ghost mt-2" onclick="clearMoneyHistoryFilters()">Clear filters</button></div>`;
            return;
        }

        listEl.innerHTML = entries.map((e) => {
            const isDeposit = e.type === 'deposit';
            const typeBadge = isDeposit ? appTag('Deposit', 'secondary') : appTag('Withdraw', 'error');
            const note = e.note ? `<div class="text-sm text-base-content/60 mt-1.5">${e.note}</div>` : '';
            return `
                <div class="money-history-item">
                    <div class="money-history-item__top">
                        <div class="money-history-item__badge">${typeBadge}</div>
                        <div class="money-history-item__actions">
                            <div class="money-value-block money-value-block--right shrink-0 max-w-[58%]">
                                <div class="money-stat-amount money-stat-amount--right">${renderAmount(e.amount, { size: 'md', tone: isDeposit ? 'deposit' : 'withdraw', align: 'right' })}</div>
                                ${renderMoneyAmountWords(e.amount, 'right')}
                            </div>
                            <button type="button" class="btn btn-sm btn-ghost btn-circle min-h-0 h-8 w-8" onclick="openEditMoneyEntryModal('${e.id}')" title="Edit" aria-label="Edit entry">${global.MTFComponents.renderIcon('fa-pen', { colour: 'text-base-content/55' })}</button>
                            <button type="button" class="btn btn-sm btn-ghost btn-circle min-h-0 h-8 w-8 text-error" onclick="confirmDeleteMoneyEntry('${e.id}')" title="Delete" aria-label="Delete entry">${global.MTFComponents.renderIcon('fa-trash-alt')}</button>
                        </div>
                    </div>
                    <div class="app-datetime-row">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span class="app-datetime-sep">·</span><span class="app-datetime-time">${global.MTFComponents.renderIcon('fa-clock', { className: 'mr-1' })}${formatMoneyEntryTimeDisplay(e.time)}</span></div>
                    ${note}
                </div>
            `;
        }).join('');
    }

    function renderMoney() {
        const mp = moneyPages();
        const getMoneyAccounts = mp.getMoneyAccounts || (() => []);
        const getMoneyEntries = mp.getMoneyEntries || (() => []);
        const moneyPageFiltersActive = mp.moneyPageFiltersActive || (() => false);
        const getMoneyAccountFilter = mp.getMoneyAccountFilter || (() => 'all');
        const syncMoneyPageFilterUI = mp.syncMoneyPageFilterUI || (() => {});
        const syncMoneyAccountFilterDropdown = mp.syncMoneyAccountFilterDropdown || (() => {});

        const page = document.getElementById('page-money');
        if (!page) return;

        const { perAccount, portfolio } = computeMoneyStats();
        const accounts = getMoneyAccounts();
        const filterActive = moneyPageFiltersActive();
        const defaultView = document.getElementById('moneyPageDefaultView');
        const filterView = document.getElementById('moneyPageFilterView');

        let moneyAccountFilter = getMoneyAccountFilter();
        let visibleAccounts = perAccount;
        if (moneyAccountFilter !== 'all') {
            visibleAccounts = perAccount.filter((s) => s.account.id === moneyAccountFilter);
        }

        let displayPortfolio = portfolio;
        if (moneyAccountFilter !== 'all') {
            const one = perAccount.find((s) => s.account.id === moneyAccountFilter);
            if (one) {
                displayPortfolio = {
                    deposited: one.deposited,
                    withdrawn: one.withdrawn,
                    depositCount: one.depositCount,
                    withdrawCount: one.withdrawCount,
                    totalValue: one.totalValue
                };
            }
        }

        syncMoneyPageFilterUI();

        if (filterActive) {
            if (defaultView) defaultView.classList.add('hidden');
            if (filterView) filterView.classList.remove('hidden');
            renderMoneyFilterView(displayPortfolio);
            return;
        }

        if (defaultView) defaultView.classList.remove('hidden');
        if (filterView) filterView.classList.add('hidden');

        const heroEl = document.getElementById('moneyTotalValueHero');
        if (heroEl) {
            paintTotalAmountCard(heroEl, displayPortfolio.totalValue, {
                label: 'Total Value',
                size: 'hero',
                tone: 'positive'
            });
        }
        paintMoneyAmountWords(document.getElementById('moneyTotalValueWords'), displayPortfolio.totalValue, 'center');
        paintTotalAmountCard(document.getElementById('moneyTotalDeposited'), displayPortfolio.deposited, {
            label: 'Deposited',
            size: 'sm',
            tone: 'deposit'
        });
        paintMoneyAmountWords(document.getElementById('moneyTotalDepositedWords'), displayPortfolio.deposited, 'center');
        paintTotalAmountCard(document.getElementById('moneyTotalWithdrawn'), displayPortfolio.withdrawn, {
            label: 'Withdrawn',
            size: 'sm',
            tone: 'withdraw'
        });
        paintMoneyAmountWords(document.getElementById('moneyTotalWithdrawnWords'), displayPortfolio.withdrawn, 'center');

        const filterEl = document.getElementById('moneyAccountFilterMenu');
        if (filterEl) {
            if (moneyAccountFilter !== 'all' && !accounts.find((a) => a.id === moneyAccountFilter)) {
                if (mp.setMoneyAccountFilter) mp.setMoneyAccountFilter('all');
                moneyAccountFilter = 'all';
            }
            syncMoneyAccountFilterDropdown(accounts);
        }

        const accountList = document.getElementById('moneyAccountList');
        if (accountList) {
            const allEntries = getMoneyEntries();
            if (visibleAccounts.length === 0) {
                accountList.innerHTML = `<div class="text-center text-base-content/60 py-6">${global.MTFComponents.renderIcon('fa-university', { size: 'lg', className: 'mb-3 opacity-40' })}<h6>No accounts yet</h6><p class="text-sm text-base-content/60 mb-0">Go to <span class="font-semibold">Settings</span> and tap <span class="font-semibold">Add Account</span> to create your first trading account.</p></div>`;
            } else {
                accountList.innerHTML = visibleAccounts.map((stats) => {
                    const historyCount = allEntries.filter((e) => e.accountId === stats.account.id).length;
                    return renderMoneyAccountCard(stats, historyCount);
                }).join('');
            }
        }
    }

    global.MTFRegister({
        renderMoney,
        renderMoneyFilterView,
        renderAccountHistorySheet,
        computeMoneyStats,
        sortMoneyEntries
    });
})(typeof window !== 'undefined' ? window : globalThis);
