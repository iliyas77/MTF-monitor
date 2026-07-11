/**
 * A37 — Money entry time display formatter.
 */
(function (global) {
    'use strict';

    function formatMoneyEntryTimeDisplay(time) {
        if (!time) return '-';
        const parts = time.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        if (isNaN(h)) return time;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        return `${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    global.MTFRegister({ formatMoneyEntryTimeDisplay });
})(typeof window !== 'undefined' ? window : globalThis);

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
        const { renderIcon } = global.MTFComponents;
        const accountChip = showAccount && acc
            ? appTag(`${renderIcon('fa-university', { className: 'me-1' })}${acc.name}`)
            : '';
        const topRow = (accountChip || typeBadge)
            ? `<div class="d-flex flex-wrap gap-2 mb-1">${accountChip}${typeBadge}</div>`
            : '';
        return `
            <div class="d-flex justify-content-between align-items-start gap-3 py-3 border-bottom">
                <div class="min-w-0 flex-fill">
                    ${topRow}
                    <div class="small text-muted d-flex flex-wrap align-items-center gap-1">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span>·</span><span>${renderIcon('fa-clock', { className: 'me-1' })}${formatMoneyEntryTimeDisplay(e.time)}</span></div>
                </div>
                <div class="d-flex flex-column align-items-end text-end flex-shrink-0 min-w-0">
                    ${renderAmount(e.amount, { size: 'md', tone: isDeposit ? 'deposit' : 'withdraw', align: 'right' })}
                    ${renderMoneyAmountWords(e.amount, 'right')}
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderMoneyFilterListItem });
})(typeof window !== 'undefined' ? window : globalThis);

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
        const actionBtnSm = ui().actionBtnSm || 'btn btn-sm rounded-3 p-0 d-flex align-items-center justify-content-center';
        const row = (label, amount, extra = '', tone = 'positive') =>
            `<div class="py-2 border-bottom ${extra}">
                <div class="d-flex justify-content-between align-items-start gap-4">
                    <span class="small flex-shrink-0 pt-1 ${tone === 'deposit' ? 'text-primary' : 'text-muted'}">${label}</span>
                    <div class="d-flex flex-column align-items-end text-end min-w-0">
                        ${renderAmount(amount, { size: 'md', tone, align: 'right', pill: false })}
                        ${renderMoneyAmountWords(amount, 'right')}
                    </div>
                </div>
            </div>`;
        return `
            <div class="card bg-body rounded" data-money-account-card>
                <div class="card-body p-0">
                    <div class="px-4 pt-4 pb-3">
                        <div class="d-flex justify-content-between align-items-start gap-2">
                            <div class="min-w-0">
                                <div class="fw-semibold text-truncate">${acc.name}</div>
                                ${holderLine}
                            </div>
                            <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                ${renderAmount(stats.totalValue, { size: 'md', align: 'right', tone: 'positive', pill: false })}
                                <div class="dropdown">
                                    <button type="button" class="${actionBtnSm} btn-outline-secondary bg-light border" style="width:2rem;height:2rem" data-bs-toggle="dropdown" aria-expanded="false" title="More" aria-label="More">
                                        ${global.MTFComponents.renderIcon('fa-ellipsis-v', { size: 'sm' })}
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                        <li>
                                            <button type="button" class="dropdown-item d-flex align-items-center" onclick="toggleMoneyAccountExpand(this)" aria-expanded="false">
                                                <span class="flex-fill text-start" data-money-expand-label>Expand details</span>
                                            </button>
                                        </li>
                                        <li><hr class="dropdown-divider my-0"></li>
                                        <li>
                                            <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyEntryModal('${acc.id}', 'deposit')">
                                                <span class="${menuIconClass('deposit')}">${global.MTFComponents.renderIcon('fa-plus')}</span>
                                                <span class="flex-fill text-start">Deposit</span>
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyEntryModal('${acc.id}', 'withdraw')">
                                                <span class="${menuIconClass('withdraw')}">${global.MTFComponents.renderIcon('fa-minus')}</span>
                                                <span class="flex-fill text-start">Withdraw</span>
                                            </button>
                                        </li>
                                        <li><hr class="dropdown-divider my-0"></li>
                                        <li>
                                            <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openAccountHistorySheet('${acc.id}')">
                                                <span class="${menuIconClass('history')}">${global.MTFComponents.renderIcon('fa-history')}</span>
                                                <span class="flex-fill text-start">History</span>
                                                ${historyCount ? appTag(String(historyCount), 'accent') : ''}
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyAccountModal('${acc.id}')">
                                                <span class="${menuIconClass('edit')}">${global.MTFComponents.renderIcon('fa-pen')}</span>
                                                <span class="flex-fill text-start">Edit account</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-money-account-details class="collapse px-4 pb-4">
                        ${row('Deposited', stats.deposited, '', 'deposit')}
                        ${row('Withdrawn', stats.withdrawn, '', 'withdraw')}
                        ${row('<span class="fw-medium text-body-secondary">Total Value</span>', stats.totalValue, 'border-bottom-0 pt-2 mt-1', 'positive')}
                    </div>
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderMoneyAccountCard });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * O26 — Money entry modal organism.
 */
(function (global) {
    'use strict';

    const {
        renderAppButton,
        renderAmount,
        renderMoneyAmountWords,
        renderDateChip,
        fmtDateDisplay,
        fmtINR,
        formatMoneyEntryTimeDisplay,
        setDateInputValue,
        showToast,
        confirmAction,
        showModal,
        hideModal
    } = global.MTFComponents;

    let moneyEntryIsEdit = false;
    let moneyEntryDateTimeEditing = false;

    function moneyModal() {
        return (global.MTFAppHelpers || {}).moneyModal || {};
    }

    function renderMoneyEntryFooter(label, icon = 'fa-plus') {
        const footer = document.getElementById('moneyEntryFooter');
        if (!footer) return;
        footer.innerHTML = renderAppButton(label, {
            variant: 'action',
            id: 'moneyEntrySaveBtn',
            onclick: 'saveMoneyEntry()',
            icon,
            fullWidth: true
        });
    }

    function getMoneyEntryType() {
        return document.getElementById('moneyEntryType')?.value || 'deposit';
    }

    function updateMoneyEntryDateTimeDisplay() {
        const date = document.getElementById('moneyEntryDate')?.value || '';
        const time = document.getElementById('moneyEntryTime')?.value || '';
        const el = document.getElementById('moneyEntryDateTimeDisplay');
        if (!el) return;
        if (!date) {
            el.textContent = '—';
            return;
        }
        el.innerHTML = `${renderDateChip(fmtDateDisplay(date), { size: 'sm' })}<span class="text-muted">·</span><span><i class="far fa-clock me-1"></i>${formatMoneyEntryTimeDisplay(time)}</span>`;
    }

    function setMoneyEntryDateTimeEditing(editing) {
        moneyEntryDateTimeEditing = editing;
        const row = document.getElementById('moneyEntryDateTimeRow');
        const fields = document.getElementById('moneyEntryDateTimeFields');
        const btn = document.getElementById('moneyEntryDateTimeEditBtn');
        if (row) row.classList.toggle('d-none', editing);
        if (fields) {
            fields.classList.toggle('d-none', !editing);
            fields.classList.toggle('d-flex', editing);
        }
        if (btn) {
            btn.innerHTML = editing ? '<i class="fas fa-check"></i>' : '<i class="fas fa-pen"></i>';
            btn.title = editing ? 'Done' : 'Edit date & time';
        }
        if (!editing) updateMoneyEntryDateTimeDisplay();
    }

    function toggleMoneyEntryDateTimeEdit() {
        setMoneyEntryDateTimeEditing(!moneyEntryDateTimeEditing);
    }

    function onMoneyEntryDateTimeChange() {
        updateMoneyEntryDateTimeDisplay();
    }

    function setMoneyEntryType(type) {
        const entryType = type === 'withdraw' ? 'withdraw' : 'deposit';
        const isWithdraw = entryType === 'withdraw';
        const typeEl = document.getElementById('moneyEntryType');
        if (typeEl) typeEl.value = entryType;
        const header = document.getElementById('moneyEntryHeader');
        if (header) {
            header.classList.remove('bg-success', 'text-white', 'bg-danger', 'text-white', 'border-success', 'border-danger');
            header.classList.add(isWithdraw ? 'bg-danger-subtle text-danger border-danger' : 'bg-success-subtle text-success border-success', 'border-bottom');
        }
        const toggle = document.getElementById('moneyEntryTypeToggle');
        if (toggle) toggle.checked = isWithdraw;
        const previewEl = document.getElementById('moneyEntryAmountPreview');
        if (previewEl) {
            previewEl.classList.remove('bg-success-subtle', 'bg-danger-subtle', 'text-success', 'text-danger', 'p-2', 'rounded-3', 'fw-semibold');
        }
        setMoneyEntryModalMode(moneyEntryIsEdit, entryType);
    }

    function onMoneyEntryTypeToggle(isWithdraw) {
        setMoneyEntryType(isWithdraw ? 'withdraw' : 'deposit');
    }

    function applyMoneyEntryForm(accountId, type, isEdit) {
        const { getMoneyAccounts } = moneyModal();
        moneyEntryIsEdit = !!isEdit;
        const acc = (getMoneyAccounts ? getMoneyAccounts() : []).find((a) => a.id === accountId);
        const accountIdEl = document.getElementById('moneyEntryAccountId');
        if (accountIdEl) accountIdEl.value = accountId || '';
        const titleEl = document.getElementById('moneyEntryAccountTitle');
        if (titleEl) titleEl.textContent = acc ? acc.name : 'Account';
        setMoneyEntryType(type || 'deposit');
        setMoneyEntryDateTimeEditing(false);
        updateMoneyEntryDateTimeDisplay();
    }

    function setMoneyEntryModalMode(isEdit, type) {
        const isWithdraw = type === 'withdraw';
        if (isEdit) {
            renderMoneyEntryFooter('Update', 'fa-save');
        } else {
            renderMoneyEntryFooter(isWithdraw ? 'Record Withdrawal' : 'Add Deposit', isWithdraw ? 'fa-minus' : 'fa-plus');
        }
    }

    function updateMoneyEntryAmountPreview() {
        const previewEl = document.getElementById('moneyEntryAmountPreview');
        const inputEl = document.getElementById('moneyEntryAmount');
        if (!previewEl || !inputEl) return;
        const amount = parseFloat(inputEl.value);
        if (!amount || amount <= 0 || isNaN(amount)) {
            previewEl.innerHTML = '';
            previewEl.classList.add('d-none');
            return;
        }
        previewEl.innerHTML = `<div>${renderAmount(amount, {
            size: 'md',
            tone: document.getElementById('moneyEntryType')?.value === 'withdraw' ? 'withdraw' : 'deposit',
            align: 'left'
        })}${renderMoneyAmountWords(amount, 'left')}</div>`;
        previewEl.classList.remove('d-none');
    }

    function openMoneyEntryModal(accountId, type) {
        const { getMoneyAccounts, getNowTime } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        if (!accounts.length) {
            showToast('Add an account first.', 'warning');
            return;
        }
        const resolvedAccountId = accountId || accounts[0]?.id;
        document.getElementById('moneyEntryEditId').value = '';
        document.getElementById('moneyEntryAmount').value = '';
        setDateInputValue(document.getElementById('moneyEntryDate'), new Date().toISOString().split('T')[0]);
        document.getElementById('moneyEntryTime').value = getNowTime ? getNowTime() : '12:00';
        applyMoneyEntryForm(resolvedAccountId, type || 'deposit', false);
        updateMoneyEntryAmountPreview();
        document.getElementById('moneyEntryModal') && showModal(document.getElementById('moneyEntryModal'));
    }

    function openEditMoneyEntryModal(entryId) {
        const { getMoneyEntry, getNowTime } = moneyModal();
        const entry = getMoneyEntry ? getMoneyEntry(entryId) : null;
        if (!entry) { showToast('Entry not found.', 'danger'); return; }
        document.getElementById('moneyEntryEditId').value = entry.id;
        document.getElementById('moneyEntryAmount').value = entry.amount || '';
        setDateInputValue(document.getElementById('moneyEntryDate'), entry.date || '');
        document.getElementById('moneyEntryTime').value = entry.time || (getNowTime ? getNowTime() : '12:00');
        applyMoneyEntryForm(entry.accountId, entry.type || 'deposit', true);
        updateMoneyEntryAmountPreview();
        document.getElementById('moneyEntryModal') && showModal(document.getElementById('moneyEntryModal'));
    }

    function saveMoneyEntry() {
        const {
            addMoneyEntry,
            updateMoneyEntry,
            setMoneyHistorySheetAccountId,
            renderMoney,
            refreshMoneyHistorySheetIfOpen,
            getSyncNote
        } = moneyModal();

        const editId = document.getElementById('moneyEntryEditId').value;
        const accountId = document.getElementById('moneyEntryAccountId').value;
        const type = getMoneyEntryType();
        const amount = parseFloat(document.getElementById('moneyEntryAmount').value);
        const date = document.getElementById('moneyEntryDate').value;
        const time = document.getElementById('moneyEntryTime').value;
        const note = '';

        if (!accountId) { showToast('Please select an account.', 'warning'); return; }
        if (!amount || amount <= 0) { showToast('Please enter a valid amount.', 'warning'); return; }
        if (!date) { showToast('Please select a date.', 'warning'); return; }
        if (!time) { showToast('Please select a time.', 'warning'); return; }

        const payload = { accountId, type, amount, date, time, note };
        const typeLabel = type === 'withdraw' ? 'withdrawal' : 'deposit';
        const synced = getSyncNote ? getSyncNote() : '';

        const finish = async () => {
            if (editId) {
                await updateMoneyEntry(editId, payload);
                showToast(`Entry updated${synced}!`, 'success');
            } else {
                await addMoneyEntry(payload);
                showToast(type === 'withdraw' ? `Withdrawal recorded${synced}!` : `Deposit added${synced}!`, 'success');
            }
            hideModal(document.getElementById('moneyEntryModal'));
            if (setMoneyHistorySheetAccountId) setMoneyHistorySheetAccountId(accountId);
            if (renderMoney) renderMoney();
            if (refreshMoneyHistorySheetIfOpen) refreshMoneyHistorySheetIfOpen();
        };

        if (editId) {
            confirmAction({
                title: '<i class="fas fa-pen me-2"></i>Update Entry?',
                titleClass: 'text-primary',
                message: `Save changes to this ${typeLabel} of ${fmtINR(amount)}?`,
                confirmLabel: '<i class="fas fa-save me-1"></i> Update',
                confirmClass: 'btn-primary',
                onConfirm: finish
            });
        } else {
            finish();
        }
    }

    global.MTFRegister({
        renderMoneyEntryFooter,
        getMoneyEntryType,
        updateMoneyEntryDateTimeDisplay,
        setMoneyEntryDateTimeEditing,
        toggleMoneyEntryDateTimeEdit,
        onMoneyEntryDateTimeChange,
        onMoneyEntryTypeToggle,
        setMoneyEntryType,
        applyMoneyEntryForm,
        setMoneyEntryModalMode,
        updateMoneyEntryAmountPreview,
        openMoneyEntryModal,
        openEditMoneyEntryModal,
        saveMoneyEntry
    });
})(typeof window !== 'undefined' ? window : globalThis);

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

        if (document.getElementById('moneyPageFilterTypeHost')) syncMoneyTypeDropdowns();

        if (isWithdrawOnly) {
            summaryEl.innerHTML = `
                <div class="${statLabel()}">Total Withdrawn</div>
                <div class="d-flex flex-column align-items-center text-center mx-auto">
                    <div>
                        ${renderAmount(displayPortfolio.withdrawn, { size: 'lg', tone: 'withdraw', align: 'center' })}
                    </div>
                    ${renderMoneyAmountWords(displayPortfolio.withdrawn, 'center')}
                </div>
                <div class="small text-muted mt-2">${displayPortfolio.withdrawCount} withdrawal${displayPortfolio.withdrawCount === 1 ? '' : 's'}</div>
            `;
        } else if (isDepositOnly) {
            summaryEl.innerHTML = `
                <div class="${statLabel()} text-primary">Total Deposited</div>
                <div class="d-flex flex-column align-items-center text-center mx-auto">
                    <div>
                        ${renderAmount(displayPortfolio.deposited, { size: 'lg', tone: 'deposit', align: 'center' })}
                    </div>
                    ${renderMoneyAmountWords(displayPortfolio.deposited, 'center')}
                </div>
                <div class="small text-muted mt-2">${displayPortfolio.depositCount} deposit${displayPortfolio.depositCount === 1 ? '' : 's'}</div>
            `;
        } else {
            summaryEl.innerHTML = `
                <div class="row g-2 text-center">
                    <div class="col-6 d-flex flex-column align-items-center">
                        <div class="${statLabel()} text-primary">Deposited</div>
                        <div>
                            ${renderAmount(displayPortfolio.deposited, { size: 'md', tone: 'deposit', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(displayPortfolio.deposited, 'center')}
                        <div class="small text-muted mt-1">${displayPortfolio.depositCount} deposit${displayPortfolio.depositCount === 1 ? '' : 's'}</div>
                    </div>
                    <div class="col-6 d-flex flex-column align-items-center">
                        <div class="${statLabel()}">Withdrawn</div>
                        <div>
                            ${renderAmount(displayPortfolio.withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(displayPortfolio.withdrawn, 'center')}
                        <div class="small text-muted mt-1">${displayPortfolio.withdrawCount} withdrawal${displayPortfolio.withdrawCount === 1 ? '' : 's'}</div>
                    </div>
                </div>
            `;
        }

        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-2">No entries match your filter.</p><button type="button" class="btn btn-sm btn-outline-secondary" onclick="openMoneyPageFilterSheet()">Change filter</button></div>`;
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
            metaEl.classList.toggle('text-primary', moneyHistoryFiltersActive());
        }

        const historyDateChipHost = document.getElementById('moneyHistoryDateChipHost');
        if (historyDateChipHost) {
            historyDateChipHost.innerHTML = moneyHistoryDateFilterActive()
                ? renderDateRangeChip(getMoneyHistoryFrom(), getMoneyHistoryTo(), { size: 'sm', onclick: 'openMoneyHistoryRangeSheet()', clickable: true })
                : '';
        }

        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="row g-2 text-center">
                    <div class="col-6 d-flex flex-column align-items-center">
                        <div class="${statLabel()} text-primary">Deposited</div>
                        <div>
                            ${renderAmount(deposited, { size: 'md', tone: 'deposit', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(deposited, 'center')}
                    </div>
                    <div class="col-6 d-flex flex-column align-items-center">
                        <div class="${statLabel()}">Withdrawn</div>
                        <div>
                            ${renderAmount(withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}
                        </div>
                        ${renderMoneyAmountWords(withdrawn, 'center')}
                    </div>
                </div>
            `;
        }

        if (allEntries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4">${global.MTFComponents.renderIcon('fa-inbox', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-0">No deposits or withdrawals yet.</p></div>`;
            return;
        }

        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-0">No entries match your filters.</p><button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="clearMoneyHistoryFilters()">Clear filters</button></div>`;
            return;
        }

        listEl.innerHTML = entries.map((e) => {
            const isDeposit = e.type === 'deposit';
            const typeBadge = isDeposit ? appTag('Deposit', 'secondary') : appTag('Withdraw', 'error');
            const note = e.note ? `<div class="small text-muted mt-1.5">${e.note}</div>` : '';
            return `
                <div class="border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>${typeBadge}</div>
                        <div class="d-flex align-items-start gap-2">
                            <div class="d-flex flex-column align-items-end text-end">
                                ${renderAmount(e.amount, { size: 'md', tone: isDeposit ? 'deposit' : 'withdraw', align: 'right' })}
                                ${renderMoneyAmountWords(e.amount, 'right')}
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle" onclick="openEditMoneyEntryModal('${e.id}')" title="Edit" aria-label="Edit entry">${global.MTFComponents.renderIcon('fa-pen', { colour: 'text-muted' })}</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle text-danger" onclick="confirmDeleteMoneyEntry('${e.id}')" title="Delete" aria-label="Delete entry">${global.MTFComponents.renderIcon('fa-trash-alt')}</button>
                        </div>
                    </div>
                    <div class="small text-muted d-flex flex-wrap align-items-center gap-1">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span>·</span><span>${global.MTFComponents.renderIcon('fa-clock', { className: 'me-1' })}${formatMoneyEntryTimeDisplay(e.time)}</span></div>
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
            if (defaultView) defaultView.classList.add('d-none');
            if (filterView) filterView.classList.remove('d-none');
            renderMoneyFilterView(displayPortfolio);
            return;
        }

        if (defaultView) defaultView.classList.remove('d-none');
        if (filterView) filterView.classList.add('d-none');

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

        const filterHost = document.getElementById('moneyAccountFilterHost');
        if (filterHost) {
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
                accountList.innerHTML = `
                    <div class="text-center text-muted py-5 px-2">
                        ${global.MTFComponents.renderIcon('fa-university', { size: 'lg', className: 'mb-3 opacity-50' })}
                        <h6 class="text-body-secondary">No accounts yet</h6>
                        <p class="small text-muted mb-3">Add a trading account to track deposits and withdrawals.</p>
                        <button type="button" class="btn btn-primary rounded-3 px-3" onclick="openAddMoneyAccountModal()">
                            <i class="fas fa-plus me-1"></i>Add Account
                        </button>
                    </div>`;
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
