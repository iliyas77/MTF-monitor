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

    function moneyEntryTypeLabel(entry) {
        if (!entry) return 'Entry';
        if (entry.type === 'deposit') return 'Deposit';
        if (entry.type === 'withdraw') return 'Withdrawal';
        if (entry.type === 'adjustment') {
            return entry.adjustmentSign === -1 ? 'Adjustment (−)' : 'Adjustment (+)';
        }
        if (entry.type === 'transfer') {
            return entry.transferLeg === 'in' ? 'Transfer in' : 'Transfer out';
        }
        return entry.type || 'Entry';
    }

    function moneyEntryTone(entry) {
        const db = global.MTFDb || {};
        if (typeof db.entryIsInflow === 'function') {
            return db.entryIsInflow(entry) ? 'deposit' : 'withdraw';
        }
        if (entry.type === 'deposit') return 'deposit';
        if (entry.type === 'withdraw') return 'withdraw';
        if (entry.type === 'adjustment') return entry.adjustmentSign === -1 ? 'withdraw' : 'deposit';
        if (entry.type === 'transfer') return entry.transferLeg === 'in' ? 'deposit' : 'withdraw';
        return 'deposit';
    }

    global.MTFRegister({ formatMoneyEntryTimeDisplay, moneyEntryTypeLabel, moneyEntryTone });
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
        formatMoneyEntryTimeDisplay,
        moneyEntryTypeLabel,
        moneyEntryTone
    } = global.MTFComponents;

    function renderMoneyFilterListItem(e, showAccount, hideTypeBadge, accounts) {
        const tone = moneyEntryTone(e);
        const typeBadge = hideTypeBadge ? '' : appTag(moneyEntryTypeLabel(e), tone === 'deposit' ? 'secondary' : 'error');
        const acc = accounts.find((a) => a.id === e.accountId);
        const { renderIcon } = global.MTFComponents;
        const accountChip = showAccount && acc
            ? appTag(`${renderIcon('fa-university', { className: 'me-1' })}${acc.name}`)
            : '';
        const baseRef = 'page.money.list.item';
        const noteLine = e.note ? `<div class="small text-muted text-truncate mt-1" data-ref="${baseRef}.note">${e.note}</div>` : '';
        const topRow = (accountChip || typeBadge)
            ? `<div class="d-flex flex-wrap gap-2 mb-1" data-ref="${baseRef}.top-row">${accountChip}${typeBadge}</div>`
            : '';
        return `
            <button type="button" class="btn btn-link text-decoration-none text-body text-start w-100 p-0" onclick="openEditMoneyEntryModal('${e.id}')" data-ref="${baseRef}">
                <div class="d-flex justify-content-between align-items-start gap-3 py-3 border-bottom" data-ref="${baseRef}.inner">
                    <div class="min-w-0 flex-fill" data-ref="${baseRef}.left">
                        ${topRow}
                        <div class="small text-muted d-flex flex-wrap align-items-center gap-1" data-ref="${baseRef}.details">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span>·</span><span>${renderIcon('fa-clock', { className: 'me-1' })}${formatMoneyEntryTimeDisplay(e.time)}</span></div>
                        ${noteLine}
                    </div>
                    <div class="d-flex flex-column align-items-end text-end flex-shrink-0 min-w-0" data-ref="${baseRef}.right">
                        ${renderAmount(e.amount, { size: 'md', tone, align: 'right' })}
                        ${renderMoneyAmountWords(e.amount, 'right')}
                    </div>
                </div>
            </button>
        `;
    }

    global.MTFRegister({ renderMoneyFilterListItem });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * M39 — Broker wallet card molecule.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        renderAmount,
        menuIconClass,
        escapeHtml,
        renderBrokerLogo,
        normalizeBrokerKey
    } = global.MTFComponents;

    function ui() {
        return (global.MTFAppHelpers || {}).ui || {};
    }

    function walletAvatarTone(name) {
        const s = String(name || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
        return Math.abs(h) % 6;
    }

    function walletInitial(name) {
        const raw = String(name || '').trim();
        if (!raw) return 'W';
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return raw.slice(0, 2).toUpperCase();
    }

    function esc(value) {
        if (typeof escapeHtml === 'function') return escapeHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderMoneyAccountCard(stats, historyCount) {
        const acc = stats.account;
        const name = acc.name || 'Wallet';
        const broker = (acc.broker && acc.broker !== name) ? acc.broker : '';
        const holder = acc.holderName || '';
        const metaBits = [broker, holder].filter(Boolean);
        const baseRef = 'page.money.wallet-card';
        const metaLine = metaBits.length
            ? `<div class="money-wallet-meta text-truncate" title="${esc(metaBits.join(' · '))}" data-ref="${baseRef}.meta">${esc(metaBits.join(' · '))}</div>`
            : `<div class="money-wallet-meta text-muted" data-ref="${baseRef}.meta">Broker wallet</div>`;
        const tone = walletAvatarTone(name);
        const initial = esc(walletInitial(name));
        const safeName = esc(name);
        const logoKey = (normalizeBrokerKey && (normalizeBrokerKey(acc.broker) || normalizeBrokerKey(name))) || name;
        const logoHtml = typeof renderBrokerLogo === 'function'
            ? renderBrokerLogo(logoKey, { size: 'md', className: 'money-wallet-avatar flex-shrink-0', dataRef: `${baseRef}.avatar` })
            : `<span class="trade-position-avatar trade-position-avatar--${tone} money-wallet-avatar flex-shrink-0" aria-hidden="true" data-ref="${baseRef}.avatar">${initial}</span>`;
        const cashTone = (Number(stats.totalValue) || 0) >= 0 ? 'positive' : 'negative';
        const actionBtnSm = ui().actionBtnSm || 'btn btn-sm rounded-3 p-0 d-flex align-items-center justify-content-center';
        const txLabel = historyCount === 1 ? '1 txn' : `${historyCount || 0} txns`;
 
        return `
            <article class="card money-wallet-card border-0 shadow-sm" data-money-account-card role="listitem" aria-label="${safeName}" data-ref="${baseRef}">
                <div class="card-body p-0" data-ref="${baseRef}.body">
                    <div class="money-wallet-top" data-ref="${baseRef}.top">
                        <button type="button" class="money-wallet-open btn btn-link text-decoration-none text-body text-start p-0 min-w-0 flex-fill" onclick="openAccountHistorySheet('${acc.id}')" data-ref="${baseRef}.open-btn">
                            ${logoHtml}
                            <span class="money-wallet-identity min-w-0" data-ref="${baseRef}.identity">
                                <span class="money-wallet-name text-truncate" title="${safeName}" data-ref="${baseRef}.name">${safeName}</span>
                                ${metaLine}
                            </span>
                        </button>
                        <div class="money-wallet-balance flex-shrink-0 text-end" data-ref="${baseRef}.balance">
                            <button type="button" class="btn btn-link text-decoration-none p-0" onclick="openAccountHistorySheet('${acc.id}')" aria-label="Cash in ${safeName}" data-ref="${baseRef}.balance.btn">
                                ${renderAmount(stats.totalValue, { size: 'md', align: 'right', tone: cashTone, pill: false })}
                            </button>
                            <div class="money-wallet-balance-label" data-ref="${baseRef}.balance.label">Available</div>
                        </div>
                        <div class="dropdown flex-shrink-0" data-ref="${baseRef}.dropdown">
                            <button type="button" class="${actionBtnSm} money-wallet-more btn-outline-secondary" style="width:2rem;height:2rem" data-bs-toggle="dropdown" aria-expanded="false" title="More" aria-label="More for ${safeName}" data-ref="${baseRef}.dropdown.toggle">
                                ${global.MTFComponents.renderIcon('fa-ellipsis-v', { size: 'sm' })}
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm" data-ref="${baseRef}.dropdown.menu">
                                <li>
                                    <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyEntryModal('${acc.id}', 'deposit')" data-ref="${baseRef}.dropdown.menu.deposit">
                                        <span class="${menuIconClass('deposit')}" data-ref="${baseRef}.dropdown.menu.deposit.icon">${global.MTFComponents.renderIcon('fa-plus')}</span>
                                        <span class="flex-fill text-start" data-ref="${baseRef}.dropdown.menu.deposit.text">Deposit</span>
                                    </button>
                                </li>
                                <li>
                                    <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyEntryModal('${acc.id}', 'withdraw')" data-ref="${baseRef}.dropdown.menu.withdraw">
                                        <span class="${menuIconClass('withdraw')}" data-ref="${baseRef}.dropdown.menu.withdraw.icon">${global.MTFComponents.renderIcon('fa-minus')}</span>
                                        <span class="flex-fill text-start" data-ref="${baseRef}.dropdown.menu.withdraw.text">Withdrawal</span>
                                    </button>
                                </li>
                                <li>
                                    <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyEntryModal('${acc.id}', 'transfer')" data-ref="${baseRef}.dropdown.menu.transfer">
                                        <span class="${menuIconClass('history')}" data-ref="${baseRef}.dropdown.menu.transfer.icon">${global.MTFComponents.renderIcon('fa-exchange-alt')}</span>
                                        <span class="flex-fill text-start" data-ref="${baseRef}.dropdown.menu.transfer.text">Transfer</span>
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider my-0"></li>
                                <li>
                                    <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openAccountHistorySheet('${acc.id}')" data-ref="${baseRef}.dropdown.menu.history">
                                        <span class="${menuIconClass('history')}" data-ref="${baseRef}.dropdown.menu.history.icon">${global.MTFComponents.renderIcon('fa-history')}</span>
                                        <span class="flex-fill text-start" data-ref="${baseRef}.dropdown.menu.history.text">History</span>
                                        ${historyCount ? appTag(String(historyCount), 'accent') : ''}
                                    </button>
                                </li>
                                <li>
                                    <button type="button" class="dropdown-item d-flex align-items-center gap-3" onclick="openMoneyAccountModal('${acc.id}')" data-ref="${baseRef}.dropdown.menu.edit">
                                        <span class="${menuIconClass('edit')}" data-ref="${baseRef}.dropdown.menu.edit.icon">${global.MTFComponents.renderIcon('fa-pen')}</span>
                                        <span class="flex-fill text-start" data-ref="${baseRef}.dropdown.menu.edit.text">Edit wallet</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="money-wallet-metrics" aria-label="Wallet summary" data-ref="${baseRef}.metrics">
                        <div class="money-wallet-metric" data-ref="${baseRef}.metrics.deposited">
                            <span class="money-wallet-metric-label" data-ref="${baseRef}.metrics.deposited.label">Deposited</span>
                            <span class="money-wallet-metric-value text-primary" data-ref="${baseRef}.metrics.deposited.value">${global.MTFComponents.fmtINR(stats.deposited)}</span>
                        </div>
                        <div class="money-wallet-metric" data-ref="${baseRef}.metrics.withdrawn">
                            <span class="money-wallet-metric-label" data-ref="${baseRef}.metrics.withdrawn.label">Withdrawn</span>
                            <span class="money-wallet-metric-value text-danger" data-ref="${baseRef}.metrics.withdrawn.value">${global.MTFComponents.fmtINR(stats.withdrawn)}</span>
                        </div>
                        <div class="money-wallet-metric" data-ref="${baseRef}.metrics.activity">
                            <span class="money-wallet-metric-label" data-ref="${baseRef}.metrics.activity.label">Activity</span>
                            <span class="money-wallet-metric-value" data-ref="${baseRef}.metrics.activity.value">${txLabel}</span>
                        </div>
                    </div>
                    <div class="money-wallet-actions" data-ref="${baseRef}.actions">
                        <button type="button" class="btn btn-sm btn-primary rounded-3 flex-fill" onclick="openMoneyEntryModal('${acc.id}', 'deposit')" data-ref="${baseRef}.actions.deposit">
                            <i class="fas fa-plus me-1" aria-hidden="true"></i>Deposit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary rounded-3 flex-fill" onclick="openMoneyEntryModal('${acc.id}', 'withdraw')" data-ref="${baseRef}.actions.withdraw">
                            <i class="fas fa-minus me-1" aria-hidden="true"></i>Withdraw
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary rounded-3 flex-fill" onclick="openAccountHistorySheet('${acc.id}')" data-ref="${baseRef}.actions.history">
                            <i class="fas fa-history me-1" aria-hidden="true"></i>History
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    global.MTFRegister({ renderMoneyAccountCard });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * O26 — Money entry page organism.
 */
(function (global) {
    'use strict';

    const {
        renderAppButtonRow,
        renderAmount,
        renderMoneyAmountWords,
        fmtDateDisplay,
        fmtDec,
        fmtINR,
        formatMoneyEntryTimeDisplay,
        setDateInputValue,
        showToast,
        confirmAction,
        renderBrokerLogo,
        getBrokerLogoSrc,
        normalizeBrokerKey
    } = global.MTFComponents;

    let moneyEntryIsEdit = false;
    let moneyEntryDateTimeEditing = false;
    let moneyEntryBalanceHidden = false;

    const TYPE_META = {
        deposit: { label: 'Deposit', icon: 'fa-chart-line', tone: 'success' },
        withdraw: { label: 'Withdrawal', icon: 'fa-arrow-up', tone: 'danger' },
        transfer: { label: 'Transfer', icon: 'fa-exchange-alt', tone: 'danger' },
        adjustment: { label: 'Adjustment', icon: 'fa-sliders-h', tone: 'warning' }
    };

    function moneyModal() {
        return (global.MTFAppHelpers || {}).moneyModal || {};
    }

    function moneyEntryTypeLabel(type) {
        return (TYPE_META[type] || TYPE_META.deposit).label;
    }

    function formatMoneyEntryBalance(amount) {
        if (moneyEntryBalanceHidden) return '••••••';
        return fmtDec(amount);
    }

    function resolveMoneyEntryAccountId() {
        const type = getMoneyEntryType();
        if (type === 'transfer') {
            return document.getElementById('moneyEntryFromAccount')?.value
                || document.getElementById('moneyEntryAccountId')?.value
                || '';
        }
        const broker = document.getElementById('moneyEntryBrokerSelect')?.value;
        if (broker && broker !== '__add_wallet__') return broker;
        return document.getElementById('moneyEntryAccountId')?.value || '';
    }

    function getMoneyEntryWalletBalance(accountId) {
        const { getMoneyAccounts, getMoneyEntries } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const entries = getMoneyEntries ? getMoneyEntries() : [];
        const acc = accounts.find((a) => a.id === accountId);
        if (!acc) return 0;
        const compute = global.MTFComponents.computeAccountTotalValue;
        if (typeof compute === 'function') return compute(acc, entries);
        return Number(acc.openingBalance) || 0;
    }

    function signedMoneyEntryDelta(amount, type) {
        const n = Number(amount) || 0;
        if (!n) return 0;
        if (type === 'withdraw' || type === 'transfer') return -n;
        if (type === 'adjustment') {
            return Number(document.getElementById('moneyEntryAdjustSign')?.value) === -1 ? -n : n;
        }
        return n;
    }

    function renderMoneyEntryFooter(label, icon = 'fa-lock') {
        const footer = document.getElementById('moneyEntryFooter');
        if (!footer) return;
        footer.innerHTML = renderAppButtonRow('Cancel', label, {
            cancelOnClick: 'closeMoneyEntryPage()',
            actionOnClick: 'saveMoneyEntry()',
            actionId: 'moneyEntrySaveBtn',
            actionIcon: icon,
            rowClass: 'money-entry-actions-row'
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
        const dateText = fmtDateDisplay(date);
        const timeText = formatMoneyEntryTimeDisplay(time);
        el.innerHTML = `<span class="money-entry-status-date" data-ref="page.money-entry.form.datetime-display.date">${dateText}</span><span class="money-entry-status-time" data-ref="page.money-entry.form.datetime-display.time">${timeText}</span>`;
        const previewDt = document.getElementById('moneyEntryPreviewDateTime');
        if (previewDt) previewDt.textContent = `${dateText}, ${timeText}`;
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
        updateMoneyEntryLivePreview();
    }

    function toggleMoneyEntryBalanceVisibility() {
        moneyEntryBalanceHidden = !moneyEntryBalanceHidden;
        const btn = document.getElementById('moneyEntryBalanceEyeBtn');
        if (btn) {
            btn.innerHTML = moneyEntryBalanceHidden
                ? '<i class="far fa-eye-slash"></i>'
                : '<i class="far fa-eye"></i>';
            btn.setAttribute('aria-label', moneyEntryBalanceHidden ? 'Show balance' : 'Hide balance');
            btn.title = moneyEntryBalanceHidden ? 'Show balance' : 'Hide balance';
        }
        refreshMoneyEntryBalances();
    }

    function syncMoneyEntryTypeUI(type) {
        const entryType = ['deposit', 'withdraw', 'adjustment', 'transfer'].includes(type) ? type : 'deposit';
        const typeEl = document.getElementById('moneyEntryType');
        if (typeEl) typeEl.value = entryType;
        const meta = TYPE_META[entryType] || TYPE_META.deposit;

        document.querySelectorAll('[data-money-entry-type]').forEach((btn) => {
            const active = btn.getAttribute('data-money-entry-type') === entryType;
            btn.classList.remove('is-active', 'is-success', 'is-danger', 'is-warning');
            if (active) btn.classList.add('is-active');
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        const transferFields = document.getElementById('moneyEntryTransferFields');
        const adjustFields = document.getElementById('moneyEntryAdjustFields');
        const accountFields = document.getElementById('moneyEntryAccountFields');
        if (transferFields) transferFields.classList.toggle('d-none', entryType !== 'transfer');
        if (adjustFields) adjustFields.classList.toggle('d-none', entryType !== 'adjustment');
        if (accountFields) accountFields.classList.toggle('d-none', entryType === 'transfer');

        const statusType = document.getElementById('moneyEntryStatusType');
        if (statusType) {
            statusType.textContent = meta.label;
            statusType.className = `money-entry-status-value text-${meta.tone === 'warning' ? 'warning' : (meta.tone === 'danger' ? 'danger' : 'success')}`;
        }
        const statusIcon = document.getElementById('moneyEntryStatusTypeIcon');
        if (statusIcon) {
            statusIcon.className = `money-entry-status-icon money-entry-status-icon--type is-${meta.tone}`;
            statusIcon.innerHTML = `<i class="fas ${meta.icon}"></i>`;
        }

        const header = document.getElementById('moneyEntryHeader');
        if (header) {
            header.classList.remove('is-deposit', 'is-withdraw', 'is-transfer', 'is-adjustment');
            header.classList.add(`is-${entryType}`);
        }

        setMoneyEntryModalMode(moneyEntryIsEdit, entryType);
        refreshMoneyEntryBalances();
        updateMoneyEntryLivePreview();
    }

    function setMoneyEntryType(type) {
        syncMoneyEntryTypeUI(type);
        syncMoneyEntryPageTitle(moneyEntryIsEdit, type);
    }

    function onMoneyEntryTypePick(type) {
        if (moneyEntryIsEdit && getMoneyEntryType() === 'transfer' && type !== 'transfer') {
            showToast('Transfer type cannot be changed. Edit amount, date, or remarks.', 'info');
            return;
        }
        setMoneyEntryType(type);
        updateMoneyEntryAmountPreview();
    }

    function brokerLogoLabelForAccount(acc) {
        if (!acc) return '';
        return normalizeBrokerKey(acc.broker) || normalizeBrokerKey(acc.name) || acc.name || '';
    }

    function renderMoneyEntryPickerCards(accounts, selectedId, target, disabled) {
        const cards = (accounts || []).map((a) => {
            const logoLabel = brokerLogoLabelForAccount(a);
            const baseRef = `page.money-entry.form.picker.${target}.card`;
            const logo = renderBrokerLogo(logoLabel || a.name, { size: 'md', className: 'money-entry-broker-logo', dataRef: `${baseRef}.logo` });
            const active = a.id === selectedId ? ' is-selected' : '';
            const dis = disabled ? ' disabled' : '';
            return `<button type="button" class="money-entry-broker-card${active}" role="option" aria-selected="${a.id === selectedId ? 'true' : 'false'}" ${dis}
                onclick="pickMoneyEntryWallet('${a.id}', '${target}')" data-ref="${baseRef}">
                ${logo}
                <span class="money-entry-broker-card-name text-truncate" data-ref="${baseRef}.name">${a.name}</span>
            </button>`;
        }).join('');
        const addCard = disabled ? '' : `<button type="button" class="money-entry-broker-card money-entry-broker-card--add" role="option" aria-selected="false"
            onclick="pickMoneyEntryWallet('__add_wallet__', '${target}')" data-ref="page.money-entry.form.picker.${target}.add-card">
            <span class="broker-logo broker-logo--fallback broker-logo--md money-entry-broker-logo" aria-hidden="true" data-ref="page.money-entry.form.picker.${target}.add-card.icon"><i class="fas fa-plus"></i></span>
            <span class="money-entry-broker-card-name" data-ref="page.money-entry.form.picker.${target}.add-card.name">Add wallet</span>
        </button>`;
        return cards + addCard;
    }

    function renderMoneyEntryBrokerPickers() {
        const { getMoneyAccounts } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const brokerSelect = document.getElementById('moneyEntryBrokerSelect');
        const fromSelect = document.getElementById('moneyEntryFromAccount');
        const toSelect = document.getElementById('moneyEntryToAccount');
        const brokerPicker = document.getElementById('moneyEntryBrokerPicker');
        const fromPicker = document.getElementById('moneyEntryFromPicker');
        const toPicker = document.getElementById('moneyEntryToPicker');
        if (brokerPicker) {
            brokerPicker.innerHTML = renderMoneyEntryPickerCards(
                accounts,
                brokerSelect?.value || '',
                'broker',
                !!brokerSelect?.disabled
            );
        }
        if (fromPicker) {
            fromPicker.innerHTML = renderMoneyEntryPickerCards(
                accounts,
                fromSelect?.value || '',
                'from',
                !!fromSelect?.disabled
            );
        }
        if (toPicker) {
            toPicker.innerHTML = renderMoneyEntryPickerCards(
                accounts,
                toSelect?.value || '',
                'to',
                !!toSelect?.disabled
            );
        }
    }

    function pickMoneyEntryWallet(accountId, target) {
        const selectId = target === 'from'
            ? 'moneyEntryFromAccount'
            : (target === 'to' ? 'moneyEntryToAccount' : 'moneyEntryBrokerSelect');
        const select = document.getElementById(selectId);
        if (!select || select.disabled) return;
        select.value = accountId;
        onMoneyEntryBrokerSelectChange(select);
        renderMoneyEntryBrokerPickers();
        syncMoneyEntryBrandHeader();
    }

    function focusMoneyEntryBrokerPicker() {
        const type = getMoneyEntryType();
        const el = document.getElementById(type === 'transfer' ? 'moneyEntryTransferFields' : 'moneyEntryAccountFields');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function fillMoneyEntryWalletSelects(accounts, accountId) {
        const addOpt = '<option value="__add_wallet__">+ Add new wallet…</option>';
        const brokerSelect = document.getElementById('moneyEntryBrokerSelect');
        if (brokerSelect) {
            brokerSelect.innerHTML = accounts.map((a) =>
                `<option value="${a.id}" ${a.id === accountId ? 'selected' : ''}>${a.name}</option>`
            ).join('') + addOpt;
        }
        const fromSelect = document.getElementById('moneyEntryFromAccount');
        const toSelect = document.getElementById('moneyEntryToAccount');
        if (fromSelect) {
            fromSelect.innerHTML = accounts.map((a) =>
                `<option value="${a.id}" ${a.id === accountId ? 'selected' : ''}>${a.name}</option>`
            ).join('') + addOpt;
        }
        if (toSelect) {
            const other = accounts.find((a) => a.id !== accountId) || accounts.find((a) => a.id !== (fromSelect && fromSelect.value)) || accounts[0];
            toSelect.innerHTML = accounts.map((a) =>
                `<option value="${a.id}" ${other && a.id === other.id ? 'selected' : ''}>${a.name}</option>`
            ).join('') + addOpt;
        }
        const accountIdEl = document.getElementById('moneyEntryAccountId');
        if (accountIdEl && accountId) accountIdEl.value = accountId;
        const titleEl = document.getElementById('moneyEntryAccountTitle');
        if (titleEl && accountId) {
            const acc = accounts.find((a) => a.id === accountId);
            const type = document.getElementById('moneyEntryType')?.value;
            if (type !== 'transfer' && acc) titleEl.textContent = acc.name;
        }
        renderMoneyEntryBrokerPickers();
        refreshMoneyEntryBalances();
        updateMoneyEntryLivePreview();
        syncMoneyEntryBrandHeader();
    }

    function refreshMoneyEntryWalletSelects(selectedAccountId) {
        const { getMoneyAccounts } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const preferred = selectedAccountId || accounts[0]?.id || '';
        fillMoneyEntryWalletSelects(accounts, preferred);
    }

    function refreshMoneyEntryBalances() {
        const accountId = resolveMoneyEntryAccountId();
        const balance = getMoneyEntryWalletBalance(accountId);
        const formatted = formatMoneyEntryBalance(balance);
        const statusBal = document.getElementById('moneyEntryStatusBalance');
        if (statusBal) {
            statusBal.textContent = formatted;
            statusBal.classList.toggle('text-success', !moneyEntryBalanceHidden && balance >= 0);
            statusBal.classList.toggle('text-danger', !moneyEntryBalanceHidden && balance < 0);
            statusBal.classList.toggle('text-muted', moneyEntryBalanceHidden);
        }
        const hintVal = document.getElementById('moneyEntryWalletBalanceValue');
        if (hintVal) {
            hintVal.textContent = formatted;
            hintVal.classList.toggle('text-success', !moneyEntryBalanceHidden);
            hintVal.classList.toggle('text-muted', moneyEntryBalanceHidden);
        }
        const previewCurrent = document.getElementById('moneyEntryPreviewCurrent');
        if (previewCurrent) previewCurrent.textContent = formatted;
        return balance;
    }

    function updateMoneyEntryLivePreview() {
        const type = getMoneyEntryType();
        const meta = TYPE_META[type] || TYPE_META.deposit;
        const amount = parseFloat(document.getElementById('moneyEntryAmount')?.value) || 0;
        const { getMoneyAccounts } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const accountId = resolveMoneyEntryAccountId();
        const acc = accounts.find((a) => a.id === accountId);
        const current = refreshMoneyEntryBalances();
        const after = current + signedMoneyEntryDelta(amount, type);

        const previewType = document.getElementById('moneyEntryPreviewType');
        if (previewType) {
            previewType.textContent = meta.label;
            previewType.className = `money-entry-preview-value text-${meta.tone === 'warning' ? 'warning' : (meta.tone === 'danger' ? 'danger' : 'success')}`;
        }

        const previewBroker = document.getElementById('moneyEntryPreviewBroker');
        if (previewBroker) {
            if (type === 'transfer') {
                const fromId = document.getElementById('moneyEntryFromAccount')?.value;
                const toId = document.getElementById('moneyEntryToAccount')?.value;
                const from = accounts.find((a) => a.id === fromId);
                const to = accounts.find((a) => a.id === toId);
                previewBroker.textContent = from && to ? `${from.name} → ${to.name}` : (from?.name || '—');
            } else {
                previewBroker.textContent = acc?.name || '—';
            }
        }

        const previewAmount = document.getElementById('moneyEntryPreviewAmount');
        if (previewAmount) {
            previewAmount.textContent = fmtDec(amount);
            const toneClass = type === 'withdraw' || type === 'transfer' || (type === 'adjustment' && Number(document.getElementById('moneyEntryAdjustSign')?.value) === -1)
                ? 'text-danger'
                : 'text-success';
            previewAmount.className = `money-entry-preview-value ${toneClass}`;
        }

        const previewAfter = document.getElementById('moneyEntryPreviewAfter');
        if (previewAfter) {
            previewAfter.textContent = moneyEntryBalanceHidden ? '••••••' : fmtDec(after);
            previewAfter.classList.toggle('text-success', !moneyEntryBalanceHidden && after >= 0);
            previewAfter.classList.toggle('text-danger', !moneyEntryBalanceHidden && after < 0);
        }

        updateMoneyEntryDateTimeDisplay();
    }

    function applyMoneyEntryForm(accountId, type, isEdit) {
        const { getMoneyAccounts } = moneyModal();
        moneyEntryIsEdit = !!isEdit;
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const acc = accounts.find((a) => a.id === accountId);
        const accountIdEl = document.getElementById('moneyEntryAccountId');
        if (accountIdEl) accountIdEl.value = accountId || '';
        const titleEl = document.getElementById('moneyEntryAccountTitle');
        if (titleEl) {
            if (type === 'transfer') titleEl.textContent = isEdit ? 'Edit Transfer' : 'Transfer';
            else titleEl.textContent = acc ? acc.name : 'Broker Wallet';
        }

        fillMoneyEntryWalletSelects(accounts, accountId);

        const typeButtons = document.getElementById('moneyEntryTypeButtons');
        if (typeButtons) typeButtons.classList.toggle('d-none', !!isEdit && type === 'transfer');

        setMoneyEntryType(type || 'deposit');
        setMoneyEntryDateTimeEditing(false);
        updateMoneyEntryDateTimeDisplay();
        onMoneyEntryNoteInput();
        updateMoneyEntryLivePreview();
    }

    function setMoneyEntryModalMode(isEdit, type) {
        if (isEdit) {
            renderMoneyEntryFooter('Update Transaction', 'fa-save');
            return;
        }
        renderMoneyEntryFooter('Save Transaction', 'fa-lock');
    }

    function updateMoneyEntryAmountPreview() {
        const previewEl = document.getElementById('moneyEntryAmountPreview');
        const inputEl = document.getElementById('moneyEntryAmount');
        if (previewEl && inputEl) {
            const amount = parseFloat(inputEl.value);
            if (!amount || amount <= 0 || isNaN(amount)) {
                previewEl.innerHTML = '';
                previewEl.classList.add('d-none');
            } else {
                const type = getMoneyEntryType();
                let tone = 'deposit';
                if (type === 'withdraw' || type === 'transfer') tone = 'withdraw';
                if (type === 'adjustment') {
                    const sign = document.getElementById('moneyEntryAdjustSign')?.value;
                    tone = sign === '-1' ? 'withdraw' : 'deposit';
                }
                previewEl.innerHTML = `<div>${renderAmount(amount, {
                    size: 'md',
                    tone,
                    align: 'left'
                })}${renderMoneyAmountWords(amount, 'left')}</div>`;
                previewEl.classList.remove('d-none');
            }
        }
        updateMoneyEntryLivePreview();
    }

    function onMoneyEntryAmountInput() {
        updateMoneyEntryAmountPreview();
    }

    function applyMoneyEntryAmountChip(addAmount) {
        const input = document.getElementById('moneyEntryAmount');
        if (!input) return;
        const current = parseFloat(input.value) || 0;
        input.value = String(Math.round(current + Number(addAmount)));
        updateMoneyEntryAmountPreview();
        input.focus();
    }

    function focusMoneyEntryAmountCustom() {
        const input = document.getElementById('moneyEntryAmount');
        if (!input) return;
        input.focus();
        input.select();
    }

    function onMoneyEntryNoteInput() {
        const noteEl = document.getElementById('moneyEntryNote');
        const countEl = document.getElementById('moneyEntryNoteCount');
        if (!noteEl || !countEl) return;
        const len = (noteEl.value || '').length;
        const max = Number(noteEl.getAttribute('maxlength')) || 100;
        countEl.textContent = `${len} / ${max}`;
    }

    function applyMoneyEntryRemarkChip(text) {
        const noteEl = document.getElementById('moneyEntryNote');
        if (!noteEl) return;
        noteEl.value = String(text || '').slice(0, Number(noteEl.getAttribute('maxlength')) || 100);
        onMoneyEntryNoteInput();
        noteEl.focus();
    }

    function focusMoneyEntryRemarkCustom() {
        const noteEl = document.getElementById('moneyEntryNote');
        if (!noteEl) return;
        noteEl.focus();
        noteEl.select();
    }

    function onMoneyEntryBrokerSelectChange(selectEl) {
        if (typeof global.onMoneyEntryBrokerChange === 'function') {
            global.onMoneyEntryBrokerChange(selectEl);
        }
        if (selectEl && selectEl.value && selectEl.value !== '__add_wallet__') {
            const accountIdEl = document.getElementById('moneyEntryAccountId');
            if (accountIdEl && selectEl.id === 'moneyEntryBrokerSelect') {
                accountIdEl.value = selectEl.value;
            }
        }
        refreshMoneyEntryBalances();
        updateMoneyEntryLivePreview();
        syncMoneyEntryBrandHeader();
    }

    function showMoneyEntryPage() {
        const { showMoneyEntryPage: showPage } = moneyModal();
        if (typeof showPage === 'function') showPage();
    }

    function closeMoneyEntryPage() {
        const { closeMoneyEntryPage: closePage } = moneyModal();
        if (typeof closePage === 'function') closePage();
    }

    function syncMoneyEntryBrandHeader() {
        const { getMoneyAccounts } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const type = getMoneyEntryType();
        const accountId = resolveMoneyEntryAccountId();
        const nameEl = document.getElementById('moneyEntryBrandName');
        const avatarEl = document.getElementById('moneyEntryBrandAvatar');
        const brandEl = document.getElementById('moneyEntryBrand');

        let label = 'Select broker';
        let logoSource = '';
        if (type === 'transfer') {
            const fromId = document.getElementById('moneyEntryFromAccount')?.value;
            const toId = document.getElementById('moneyEntryToAccount')?.value;
            const from = accounts.find((a) => a.id === fromId);
            const to = accounts.find((a) => a.id === toId);
            if (from && to) label = `${from.name} → ${to.name}`;
            else if (from) label = from.name;
            logoSource = brokerLogoLabelForAccount(from) || from?.name || '';
        } else {
            const acc = accounts.find((a) => a.id === accountId);
            if (acc) {
                label = acc.name || acc.broker || 'Broker';
                logoSource = brokerLogoLabelForAccount(acc) || label;
            }
        }

        if (nameEl) nameEl.textContent = label;
        if (avatarEl) {
            const src = getBrokerLogoSrc ? getBrokerLogoSrc(logoSource || label) : '';
            if (src) {
                avatarEl.className = 'money-entry-brand-avatar money-entry-brand-avatar--img';
                avatarEl.innerHTML = `<img src="${src}" alt="" width="44" height="44" />`;
            } else {
                avatarEl.className = 'money-entry-brand-avatar';
                const initialSource = logoSource || label;
                avatarEl.textContent = String(initialSource || '?').trim().charAt(0).toUpperCase() || '?';
            }
        }
        if (brandEl) brandEl.setAttribute('title', label);
        const hiddenTitle = document.getElementById('moneyEntryAccountTitle');
        if (hiddenTitle) hiddenTitle.textContent = label;
    }

    function syncMoneyEntryPageTitle(isEdit, type) {
        const labels = {
            deposit: 'Add Deposit',
            withdraw: 'Add Withdrawal',
            adjustment: 'Add Adjustment',
            transfer: 'Transfer'
        };
        const title = isEdit ? 'Edit Transaction' : (labels[type] || 'Add Transaction');
        const titleEl = document.getElementById('appHeaderSubpageTitle');
        if (titleEl) titleEl.textContent = title;
        const topbar = document.getElementById('moneyEntryTopbarTitle');
        if (topbar) topbar.textContent = title;
        syncMoneyEntryBrandHeader();
    }

    function openMoneyEntryModal(accountId, type) {
        const { getMoneyAccounts, getNowTime } = moneyModal();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const resolvedAccountId = accountId || accounts[0]?.id || '';
        moneyEntryBalanceHidden = false;
        const eyeBtn = document.getElementById('moneyEntryBalanceEyeBtn');
        if (eyeBtn) {
            eyeBtn.innerHTML = '<i class="far fa-eye"></i>';
            eyeBtn.setAttribute('aria-label', 'Hide balance');
        }
        document.getElementById('moneyEntryEditId').value = '';
        document.getElementById('moneyEntryAmount').value = '';
        const noteEl = document.getElementById('moneyEntryNote');
        if (noteEl) noteEl.value = '';
        const adjustSign = document.getElementById('moneyEntryAdjustSign');
        if (adjustSign) adjustSign.value = '1';
        setDateInputValue(document.getElementById('moneyEntryDate'), new Date().toISOString().split('T')[0]);
        document.getElementById('moneyEntryTime').value = getNowTime ? getNowTime() : '12:00';
        applyMoneyEntryForm(resolvedAccountId, type || 'deposit', false);
        updateMoneyEntryAmountPreview();
        if (!accounts.length) {
            showToast('No wallet yet — choose “Add new wallet…” under Broker.', 'info');
        }
        showMoneyEntryPage();
        syncMoneyEntryPageTitle(false, type || 'deposit');
    }

    function openEditMoneyEntryModal(entryId) {
        const { getMoneyEntry, getNowTime, getMoneyAccounts } = moneyModal();
        const entry = getMoneyEntry ? getMoneyEntry(entryId) : null;
        if (!entry) { showToast('Entry not found.', 'danger'); return; }
        moneyEntryBalanceHidden = false;
        document.getElementById('moneyEntryEditId').value = entry.id;
        document.getElementById('moneyEntryAmount').value = entry.amount || '';
        const noteEl = document.getElementById('moneyEntryNote');
        if (noteEl) noteEl.value = (entry.note || '').slice(0, 100);
        const adjustSign = document.getElementById('moneyEntryAdjustSign');
        if (adjustSign) adjustSign.value = String(entry.adjustmentSign === -1 ? -1 : 1);
        setDateInputValue(document.getElementById('moneyEntryDate'), entry.date || '');
        document.getElementById('moneyEntryTime').value = entry.time || (getNowTime ? getNowTime() : '12:00');
        applyMoneyEntryForm(entry.accountId, entry.type || 'deposit', true);

        if (entry.type === 'transfer') {
            const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
            const fromId = entry.transferLeg === 'out' ? entry.accountId : entry.transferPeerAccountId;
            const toId = entry.transferLeg === 'in' ? entry.accountId : entry.transferPeerAccountId;
            const fromSelect = document.getElementById('moneyEntryFromAccount');
            const toSelect = document.getElementById('moneyEntryToAccount');
            if (fromSelect) {
                fromSelect.innerHTML = accounts.map((a) =>
                    `<option value="${a.id}" ${a.id === fromId ? 'selected' : ''}>${a.name}</option>`
                ).join('');
                fromSelect.disabled = true;
            }
            if (toSelect) {
                toSelect.innerHTML = accounts.map((a) =>
                    `<option value="${a.id}" ${a.id === toId ? 'selected' : ''}>${a.name}</option>`
                ).join('');
                toSelect.disabled = true;
            }
            renderMoneyEntryBrokerPickers();
            syncMoneyEntryBrandHeader();
        } else {
            const fromSelect = document.getElementById('moneyEntryFromAccount');
            const toSelect = document.getElementById('moneyEntryToAccount');
            if (fromSelect) fromSelect.disabled = false;
            if (toSelect) toSelect.disabled = false;
            renderMoneyEntryBrokerPickers();
        }

        updateMoneyEntryAmountPreview();
        showMoneyEntryPage();
        syncMoneyEntryPageTitle(true, entry.type || 'deposit');
    }

    function saveMoneyEntry() {
        const {
            addMoneyEntry,
            updateMoneyEntry,
            addMoneyTransfer,
            setMoneyHistorySheetAccountId,
            renderMoney,
            refreshMoneyHistorySheetIfOpen,
            getSyncNote,
            isSyncConnected
        } = moneyModal();

        if (isSyncConnected && !isSyncConnected()) {
            showToast('Connect Cloud Sync to save wallet transactions.', 'warning');
            return;
        }

        const editId = document.getElementById('moneyEntryEditId').value;
        let accountId = document.getElementById('moneyEntryAccountId').value;
        const brokerSelect = document.getElementById('moneyEntryBrokerSelect');
        if (brokerSelect && brokerSelect.value) accountId = brokerSelect.value;
        const type = getMoneyEntryType();
        const amount = parseFloat(document.getElementById('moneyEntryAmount').value);
        const date = document.getElementById('moneyEntryDate').value;
        const time = document.getElementById('moneyEntryTime').value;
        const note = (document.getElementById('moneyEntryNote')?.value || '').trim();
        const adjustmentSign = Number(document.getElementById('moneyEntryAdjustSign')?.value) === -1 ? -1 : 1;

        if (!amount || amount <= 0) { showToast('Please enter a valid amount.', 'warning'); return; }
        if (!date) { showToast('Please select a date.', 'warning'); return; }
        if (!time) { showToast('Please select a time.', 'warning'); return; }

        const synced = getSyncNote ? getSyncNote() : '';

        const finish = async () => {
            try {
                if (editId) {
                    const updates = { amount, date, time, note };
                    if (type === 'adjustment') updates.adjustmentSign = adjustmentSign;
                    if (type !== 'transfer') {
                        updates.accountId = accountId;
                        updates.type = type;
                    }
                    await updateMoneyEntry(editId, updates);
                    showToast(`Entry updated${synced}!`, 'success');
                } else if (type === 'transfer') {
                    const fromAccountId = document.getElementById('moneyEntryFromAccount')?.value;
                    const toAccountId = document.getElementById('moneyEntryToAccount')?.value;
                    if (!fromAccountId || !toAccountId) {
                        showToast('Select From and To wallets.', 'warning');
                        return;
                    }
                    if (fromAccountId === toAccountId) {
                        showToast('Choose two different wallets.', 'warning');
                        return;
                    }
                    await addMoneyTransfer({ fromAccountId, toAccountId, amount, date, time, note });
                    showToast(`Transfer recorded${synced}!`, 'success');
                    accountId = fromAccountId;
                } else {
                    if (!accountId) { showToast('Please select a broker wallet.', 'warning'); return; }
                    await addMoneyEntry({
                        accountId,
                        type,
                        amount,
                        date,
                        time,
                        note,
                        adjustmentSign: type === 'adjustment' ? adjustmentSign : 1
                    });
                    const labels = {
                        deposit: 'Deposit added',
                        withdraw: 'Withdrawal recorded',
                        adjustment: 'Adjustment saved'
                    };
                    showToast(`${labels[type] || 'Entry saved'}${synced}!`, 'success');
                }
                closeMoneyEntryPage();
                if (setMoneyHistorySheetAccountId) setMoneyHistorySheetAccountId(accountId);
                if (renderMoney) renderMoney();
                if (refreshMoneyHistorySheetIfOpen) refreshMoneyHistorySheetIfOpen();
            } catch (err) {
                if (err && err.message === 'sync_required') return;
                MTFLogger.warn('saveMoneyEntry', err);
                showToast('Could not save transaction.', 'danger');
            }
        };

        if (editId) {
            confirmAction({
                title: '<i class="fas fa-pen me-2"></i>Update Entry?',
                titleClass: 'text-primary',
                message: type === 'transfer'
                    ? `Update both sides of this transfer (${fmtINR(amount)})?`
                    : `Save changes to this ${type} of ${fmtINR(amount)}?`,
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
        onMoneyEntryTypePick,
        setMoneyEntryType,
        applyMoneyEntryForm,
        setMoneyEntryModalMode,
        updateMoneyEntryAmountPreview,
        onMoneyEntryAmountInput,
        applyMoneyEntryAmountChip,
        focusMoneyEntryAmountCustom,
        onMoneyEntryNoteInput,
        applyMoneyEntryRemarkChip,
        focusMoneyEntryRemarkCustom,
        onMoneyEntryBrokerSelectChange,
        toggleMoneyEntryBalanceVisibility,
        pickMoneyEntryWallet,
        focusMoneyEntryBrokerPicker,
        closeMoneyEntryPage,
        openMoneyEntryModal,
        openEditMoneyEntryModal,
        saveMoneyEntry,
        refreshMoneyEntryWalletSelects
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
        paintMoneyAmountWords,
        renderMoneyFilterListItem,
        renderMoneyAccountCard,
        formatMoneyEntryTimeDisplay,
        moneyEntryTypeLabel,
        moneyEntryTone,
        renderDateChip,
        appTag,
        Sheet,
        LABEL_CLASSES
    } = global.MTFComponents;

    function moneyPages() {
        return (global.MTFAppHelpers || {}).moneyPages || {};
    }

    function dbApi() {
        return global.MTFDb || {};
    }

    function statLabel() {
        return LABEL_CLASSES.stat;
    }

    function sortMoneyEntries(entries, sortKey) {
        const key = sortKey || 'newest';
        const list = [...entries];
        list.sort((a, b) => {
            if (key === 'highest') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
            if (key === 'lowest') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
            const da = (a.date || '') + 'T' + (a.time || '00:00');
            const db = (b.date || '') + 'T' + (b.time || '00:00');
            if (key === 'oldest') {
                if (da !== db) return da.localeCompare(db);
                return (a.id < b.id ? -1 : 1);
            }
            if (db !== da) return db.localeCompare(da);
            return (a.id < b.id ? 1 : -1);
        });
        return list;
    }

    function computeAccountTotalValue(acc, entries) {
        let total = Number(acc.openingBalance) || 0;
        const delta = dbApi().entrySignedDelta;
        entries.filter((e) => e.accountId === acc.id).forEach((e) => {
            total += typeof delta === 'function' ? delta(e) : (
                e.type === 'deposit' ? (Number(e.amount) || 0) :
                e.type === 'withdraw' ? -(Number(e.amount) || 0) : 0
            );
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
            const delta = typeof dbApi().entrySignedDelta === 'function'
                ? dbApi().entrySignedDelta(e)
                : (e.type === 'deposit' ? amt : e.type === 'withdraw' ? -amt : 0);
            if (delta > 0) { deposited += delta; depositCount++; }
            else if (delta < 0) { withdrawn += Math.abs(delta); withdrawCount++; }
        });
        return { deposited, withdrawn, depositCount, withdrawCount };
    }

    function buildRunningBalances(acc, entriesChronologicalAsc) {
        let bal = Number(acc.openingBalance) || 0;
        const map = {};
        entriesChronologicalAsc.forEach((e) => {
            const delta = typeof dbApi().entrySignedDelta === 'function'
                ? dbApi().entrySignedDelta(e)
                : 0;
            bal += delta;
            map[e.id] = bal;
        });
        return map;
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
        const portfolio = {
            deposited: 0,
            withdrawn: 0,
            totalValue: 0,
            depositCount: 0,
            withdrawCount: 0,
            txCount: allEntries.length
        };

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

            return { account: acc, ...summary, totalValue, txCount: acctAll.length };
        });

        return { perAccount, portfolio };
    }

    function monthKeyFromDate(dateStr) {
        return (dateStr || '').slice(0, 7);
    }

    function renderMoneyMonthChart(entries, monthKey) {
        const host = document.getElementById('moneyMonthChart');
        if (!host) return;
        const key = monthKey || new Date().toISOString().slice(0, 7);
        const monthEntries = entries.filter((e) => monthKeyFromDate(e.date) === key);
        const summary = summarizeMoneyEntries(monthEntries);
        const max = Math.max(summary.deposited, summary.withdrawn, 1);
        const depPct = Math.max(4, Math.round((summary.deposited / max) * 100));
        const wdrPct = Math.max(4, Math.round((summary.withdrawn / max) * 100));
        const hasFlow = summary.deposited > 0 || summary.withdrawn > 0;
        const [y, m] = key.split('-').map(Number);
        const label = new Date(y, (m || 1) - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        const net = summary.deposited - summary.withdrawn;
        const netTone = net > 0 ? 'positive' : net < 0 ? 'negative' : 'muted';
        const netClass = netTone === 'positive' ? 'text-success' : netTone === 'negative' ? 'text-danger' : 'text-body';
        const netSign = net > 0 ? '+' : '';
        const txCount = monthEntries.length;
        const txLabel = txCount === 1 ? '1 txn' : `${txCount} txns`;
        const { fmtINR } = global.MTFComponents;

        const baseRef = 'page.money.month-flow';
        host.innerHTML = `
            <div class="money-month-hero" data-ref="${baseRef}.hero">
                <div class="money-month-nav" data-ref="${baseRef}.nav">
                    <button type="button" class="btn money-month-nav-btn" onclick="shiftMoneyMonthChart(-1)" aria-label="Previous month" data-ref="${baseRef}.nav.prev-btn">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div class="money-month-label-wrap" data-ref="${baseRef}.nav.label-wrap">
                        <label class="money-month-picker-label" for="moneyMonthPicker" data-ref="${baseRef}.nav.picker-label">
                            <span class="money-month-kicker" data-ref="${baseRef}.nav.kicker">Monthly flow</span>
                            <span class="money-month-label" data-ref="${baseRef}.nav.label">
                                <span>${label}</span>
                                <i class="fas fa-chevron-down money-month-label-caret" aria-hidden="true"></i>
                            </span>
                            <input type="month" class="money-month-picker" id="moneyMonthPicker" value="${key}" onchange="setMoneyMonthKey(this.value)" aria-label="Jump to month" data-ref="${baseRef}.nav.picker-input" />
                        </label>
                    </div>
                    <button type="button" class="btn money-month-nav-btn" onclick="shiftMoneyMonthChart(1)" aria-label="Next month" data-ref="${baseRef}.nav.next-btn">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="money-month-net" data-ref="${baseRef}.net-wrapper">
                    <div class="money-month-net-label" data-ref="${baseRef}.net-label">Net this month</div>
                    <div class="money-month-net-value ${netClass}" data-ref="${baseRef}.net-value">${netSign}${fmtINR(net)}</div>
                    <div class="money-month-net-meta" data-ref="${baseRef}.net-meta">${txLabel}</div>
                </div>
            </div>
            <div class="money-month-metrics" role="group" aria-label="Month cash flow" data-ref="${baseRef}.metrics">
                <div class="money-month-metric" data-ref="${baseRef}.metrics.deposited">
                    <span class="money-month-metric-label" data-ref="${baseRef}.metrics.deposited.label">Deposited</span>
                    <span class="money-month-metric-value text-primary" data-ref="${baseRef}.metrics.deposited.value">${fmtINR(summary.deposited)}</span>
                </div>
                <div class="money-month-metric" data-ref="${baseRef}.metrics.withdrawn">
                    <span class="money-month-metric-label" data-ref="${baseRef}.metrics.withdrawn.label">Withdrawn</span>
                    <span class="money-month-metric-value text-danger" data-ref="${baseRef}.metrics.withdrawn.value">${fmtINR(summary.withdrawn)}</span>
                </div>
                <div class="money-month-metric" data-ref="${baseRef}.metrics.activity">
                    <span class="money-month-metric-label" data-ref="${baseRef}.metrics.activity.label">Activity</span>
                    <span class="money-month-metric-value" data-ref="${baseRef}.metrics.activity.value">${txCount}</span>
                </div>
            </div>
            <div class="money-month-bars ${hasFlow ? '' : 'money-month-bars--empty'}" data-ref="${baseRef}.bars">
                <div class="money-month-bar-row" data-ref="${baseRef}.bars.in">
                    <span class="money-month-bar-dot money-month-bar-dot--in" aria-hidden="true" data-ref="${baseRef}.bars.in.dot"></span>
                    <span class="money-month-bar-name" data-ref="${baseRef}.bars.in.name">In</span>
                    <div class="money-month-bar-track" aria-hidden="true" data-ref="${baseRef}.bars.in.track">
                        <div class="money-month-bar-fill money-month-bar-fill--in" style="width:${hasFlow ? depPct : 0}%" data-ref="${baseRef}.bars.in.fill"></div>
                    </div>
                </div>
                <div class="money-month-bar-row" data-ref="${baseRef}.bars.out">
                    <span class="money-month-bar-dot money-month-bar-dot--out" aria-hidden="true" data-ref="${baseRef}.bars.out.dot"></span>
                    <span class="money-month-bar-name" data-ref="${baseRef}.bars.out.name">Out</span>
                    <div class="money-month-bar-track" aria-hidden="true" data-ref="${baseRef}.bars.out.track">
                        <div class="money-month-bar-fill money-month-bar-fill--out" style="width:${hasFlow ? wdrPct : 0}%" data-ref="${baseRef}.bars.out.fill"></div>
                    </div>
                </div>
                ${hasFlow ? '' : `<div class="money-month-empty-hint" data-ref="${baseRef}.empty-hint">No cash movement this month</div>`}
            </div>
        `;
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
            const quickLabels = {
                today: 'Today',
                yesterday: 'Yesterday',
                week: 'This week',
                month: 'This month',
                lastMonth: 'Last month',
                yesterday_legacy: 'Yesterday',
                7: 'Last 1 week',
                30: 'Last 1 month',
                90: 'Last 3 months'
            };
            const prefix = quickLabels[getMoneyPageRangeKey()] || '';
            if (prefix) parts.push(prefix);
            metaEl.textContent = parts.join(' · ') || 'All wallets · All time';
        }

        const dateChipHost = document.getElementById('moneyPageFilterDateChipHost');
        if (dateChipHost) {
            dateChipHost.innerHTML = moneyPageDateFilterActive()
                ? renderDateRangeChip(getMoneyPageFrom(), getMoneyPageTo(), { size: 'sm', onclick: 'openMoneyPageFilterSheet()', clickable: true })
                : '';
        }

        if (document.getElementById('moneyPageFilterTypeHost')) syncMoneyTypeDropdowns();

        const baseRef = 'page.money.filter-summary';
        summaryEl.innerHTML = `
            <div class="row g-2 text-center" data-ref="${baseRef}.grid">
                <div class="col-6 d-flex flex-column align-items-center" data-ref="${baseRef}.deposits-col">
                    <div class="${statLabel()} text-primary" data-ref="${baseRef}.deposits-label">Deposits</div>
                    <div data-ref="${baseRef}.deposits-value">${renderAmount(displayPortfolio.deposited, { size: 'md', tone: 'deposit', align: 'center' })}</div>
                    ${renderMoneyAmountWords(displayPortfolio.deposited, 'center')}
                </div>
                <div class="col-6 d-flex flex-column align-items-center" data-ref="${baseRef}.withdrawals-col">
                    <div class="${statLabel()}" data-ref="${baseRef}.withdrawals-label">Withdrawals</div>
                    <div data-ref="${baseRef}.withdrawals-value">${renderAmount(displayPortfolio.withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}</div>
                    ${renderMoneyAmountWords(displayPortfolio.withdrawn, 'center')}
                </div>
            </div>
            <div class="small text-muted mt-2" data-ref="${baseRef}.count">${entries.length} transaction${entries.length === 1 ? '' : 's'}</div>
        `;
 
        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4" data-ref="${baseRef}.empty">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-2" data-ref="${baseRef}.empty.hint">No entries match your filter.</p><button type="button" class="btn btn-sm btn-outline-secondary" onclick="openMoneyPageFilterSheet()" data-ref="${baseRef}.empty.change-filter-btn">Change filter</button></div>`;
            return;
        }

        listEl.innerHTML = entries.map((e) => renderMoneyFilterListItem(e, showAccount, isWithdrawOnly || isDepositOnly, accounts)).join('');
    }

    function renderAccountHistorySheet() {
        const mp = moneyPages();
        const getMoneyAccounts = mp.getMoneyAccounts || (() => []);
        const getMoneyEntries = mp.getMoneyEntries || (() => []);
        const getMoneyHistorySheetAccountId = mp.getMoneyHistorySheetAccountId || (() => null);
        const getMoneyHistorySheetTitle = mp.getMoneyHistorySheetTitle || (() => 'Wallet History');
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

        const allEntries = sortMoneyEntries(getMoneyEntries().filter((e) => e.accountId === acc.id), 'newest');
        const entries = filterMoneyHistoryEntries(allEntries);
        const asc = sortMoneyEntries(allEntries, 'oldest');
        const running = buildRunningBalances(acc, asc);
        const balance = computeAccountTotalValue(acc, allEntries);
        const summary = summarizeMoneyEntries(entries);

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
                <div class="text-center mb-3" data-ref="sheet.wallet-history.summary.balance">
                    <div class="${statLabel()}" data-ref="sheet.wallet-history.summary.balance.label">Current Balance</div>
                    <div data-ref="sheet.wallet-history.summary.balance.value">${renderAmount(balance, { size: 'lg', tone: 'positive', align: 'center' })}</div>
                    ${renderMoneyAmountWords(balance, 'center')}
                </div>
                <div class="row g-2 text-center" data-ref="sheet.wallet-history.summary.grid">
                    <div class="col-6 d-flex flex-column align-items-center" data-ref="sheet.wallet-history.summary.deposited-col">
                        <div class="${statLabel()} text-primary" data-ref="sheet.wallet-history.summary.deposited-label">Deposited</div>
                        <div>${renderAmount(summary.deposited, { size: 'md', tone: 'deposit', align: 'center' })}</div>
                    </div>
                    <div class="col-6 d-flex flex-column align-items-center" data-ref="sheet.wallet-history.summary.withdrawn-col">
                        <div class="${statLabel()}" data-ref="sheet.wallet-history.summary.withdrawn-label">Withdrawn</div>
                        <div>${renderAmount(summary.withdrawn, { size: 'md', tone: 'withdraw', align: 'center' })}</div>
                    </div>
                </div>
            `;
        }
 
        if (allEntries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4" data-ref="sheet.wallet-history.list.empty">${global.MTFComponents.renderIcon('fa-inbox', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-0" data-ref="sheet.wallet-history.list.empty.hint">No transactions yet.</p></div>`;
            return;
        }
 
        if (entries.length === 0) {
            listEl.innerHTML = `<div class="text-center text-muted py-4" data-ref="sheet.wallet-history.list.empty-filtered">${global.MTFComponents.renderIcon('fa-filter', { className: 'mb-2 opacity-25' })}<p class="small text-muted mb-0" data-ref="sheet.wallet-history.list.empty-filtered.hint">No entries match your filters.</p><button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="clearMoneyHistoryFilters()" data-ref="sheet.wallet-history.list.empty-filtered.clear-btn">Clear filters</button></div>`;
            return;
        }
 
        const accounts = getMoneyAccounts();
        const baseRef = 'sheet.wallet-history.list.item';
        listEl.innerHTML = entries.map((e) => {
            const tone = moneyEntryTone(e);
            const typeBadge = appTag(moneyEntryTypeLabel(e), tone === 'deposit' ? 'secondary' : 'error');
            const note = e.note ? `<div class="small text-muted mt-1" data-ref="${baseRef}.note">${e.note}</div>` : '';
            let peer = '';
            if (e.type === 'transfer' && e.transferPeerAccountId) {
                const p = accounts.find((a) => a.id === e.transferPeerAccountId);
                if (p) peer = `<div class="small text-muted mt-1" data-ref="${baseRef}.peer">${e.transferLeg === 'out' ? 'To' : 'From'} ${p.name}</div>`;
            }
            const balAfter = running[e.id];
            const balLine = balAfter != null
                ? `<div class="small text-muted mt-1" data-ref="${baseRef}.running-balance">Balance ${global.MTFComponents.fmtINR(balAfter)}</div>`
                : '';
            return `
                <div class="border-bottom pb-3 mb-3" data-ref="${baseRef}">
                    <div class="d-flex justify-content-between align-items-start gap-2 mb-2" data-ref="${baseRef}.inner">
                        <button type="button" class="btn btn-link text-decoration-none text-body text-start p-0 flex-fill" onclick="openEditMoneyEntryModal('${e.id}')" data-ref="${baseRef}.edit-btn">
                            <div>${typeBadge}</div>
                            <div class="small text-muted d-flex flex-wrap align-items-center gap-1 mt-2" data-ref="${baseRef}.details">${renderDateChip(fmtDateDisplay(e.date), { size: 'sm' })}<span>·</span><span>${global.MTFComponents.renderIcon('fa-clock', { className: 'me-1' })}${formatMoneyEntryTimeDisplay(e.time)}</span></div>
                            ${note}${peer}${balLine}
                        </button>
                        <div class="d-flex align-items-start gap-2" data-ref="${baseRef}.actions">
                            <div class="d-flex flex-column align-items-end text-end" data-ref="${baseRef}.amount-wrapper">
                                ${renderAmount(e.amount, { size: 'md', tone, align: 'right' })}
                                ${renderMoneyAmountWords(e.amount, 'right')}
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle text-danger" onclick="confirmDeleteMoneyEntry('${e.id}')" title="Delete" aria-label="Delete entry" data-ref="${baseRef}.delete-btn">${global.MTFComponents.renderIcon('fa-trash-alt')}</button>
                        </div>
                    </div>
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
        const getMoneySearchQuery = mp.getMoneySearchQuery || (() => '');
        const getMoneyMonthKey = mp.getMoneyMonthKey || (() => new Date().toISOString().slice(0, 7));

        const page = document.getElementById('page-money');
        if (!page) return;

        const { perAccount, portfolio } = computeMoneyStats();
        const accounts = getMoneyAccounts();
        const allEntries = getMoneyEntries();
        const filterActive = moneyPageFiltersActive();
        const searchQ = String(getMoneySearchQuery() || '').trim().toLowerCase();
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
                    totalValue: one.totalValue,
                    txCount: one.txCount
                };
            }
        }

        syncMoneyPageFilterUI();

        if (filterActive || searchQ) {
            if (defaultView) defaultView.classList.add('d-none');
            if (filterView) filterView.classList.remove('d-none');
            renderMoneyFilterView(displayPortfolio);
            return;
        }

        if (defaultView) defaultView.classList.remove('d-none');
        if (filterView) filterView.classList.add('d-none');

        const { fmtINR } = global.MTFComponents;
        const cash = Number(displayPortfolio.totalValue) || 0;
        const deposited = Number(displayPortfolio.deposited) || 0;
        const withdrawn = Number(displayPortfolio.withdrawn) || 0;
        const txCount = Number(displayPortfolio.txCount) || 0;

        const heroEl = document.getElementById('moneyTotalValueHero');
        if (heroEl) {
            heroEl.textContent = fmtINR(cash);
            heroEl.classList.toggle('text-success', cash >= 0);
            heroEl.classList.toggle('text-danger', cash < 0);
        }
        paintMoneyAmountWords(document.getElementById('moneyTotalValueWords'), cash, 'center');

        const depEl = document.getElementById('moneyTotalDeposited');
        if (depEl) depEl.textContent = fmtINR(deposited);
        const witEl = document.getElementById('moneyTotalWithdrawn');
        if (witEl) witEl.textContent = fmtINR(withdrawn);
        const txEl = document.getElementById('moneyTotalTxCount');
        if (txEl) txEl.textContent = String(txCount);

        renderMoneyMonthChart(allEntries, getMoneyMonthKey());

        const filterHost = document.getElementById('moneyAccountFilterHost');
        if (filterHost) {
            if (moneyAccountFilter !== 'all' && !accounts.find((a) => a.id === moneyAccountFilter)) {
                if (mp.setMoneyAccountFilter) mp.setMoneyAccountFilter('all');
                moneyAccountFilter = 'all';
            }
            syncMoneyAccountFilterDropdown(accounts);
        }

        const searchInput = document.getElementById('moneySearchInput');
        if (searchInput && searchInput.value !== getMoneySearchQuery()) {
            // keep user typing; only sync if empty host was reset
        }

        const accountList = document.getElementById('moneyAccountList');
        if (accountList) {
            if (visibleAccounts.length === 0) {
                accountList.innerHTML = `
                    <div class="money-wallet-empty text-center py-5 px-3" data-ref="page.money.wallet-list.empty">
                        <div class="money-wallet-empty-icon" aria-hidden="true" data-ref="page.money.wallet-list.empty.icon">
                            ${global.MTFComponents.renderIcon('fa-university', { size: 'lg' })}
                        </div>
                        <h6 class="fw-semibold text-body mb-1" data-ref="page.money.wallet-list.empty.title">No broker wallets yet</h6>
                        <p class="small text-muted mb-3" data-ref="page.money.wallet-list.empty.desc">Add Zerodha, Dhan, Groww, or any custom broker to start tracking cash.</p>
                        <button type="button" class="btn btn-primary rounded-3 px-3" onclick="openAddMoneyAccountModal()" data-ref="page.money.wallet-list.empty.add-btn">
                            <i class="fas fa-plus me-1"></i>Add Wallet
                        </button>
                    </div>`;
            } else {
                accountList.innerHTML = visibleAccounts.map((stats) => {
                    const historyCount = allEntries.filter((e) => e.accountId === stats.account.id).length;
                    return renderMoneyAccountCard(stats, historyCount);
                }).join('');
            }
        }

        if (mp.paintAddMoneyAccountBtn) mp.paintAddMoneyAccountBtn();
        if (mp.updateMoneyFabVisibility) mp.updateMoneyFabVisibility();
    }

    global.MTFRegister({
        renderMoney,
        renderMoneyFilterView,
        renderAccountHistorySheet,
        computeMoneyStats,
        sortMoneyEntries,
        computeAccountTotalValue,
        summarizeMoneyEntries,
        buildRunningBalances,
        renderMoneyMonthChart
    });
})(typeof window !== 'undefined' ? window : globalThis);
