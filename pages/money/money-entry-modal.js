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
        confirmAction
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
        el.innerHTML = `${renderDateChip(fmtDateDisplay(date), { size: 'sm' })}<span class="app-datetime-sep">·</span><span class="app-datetime-time"><i class="far fa-clock mr-1"></i>${formatMoneyEntryTimeDisplay(time)}</span>`;
    }

    function setMoneyEntryDateTimeEditing(editing) {
        moneyEntryDateTimeEditing = editing;
        const row = document.getElementById('moneyEntryDateTimeRow');
        const fields = document.getElementById('moneyEntryDateTimeFields');
        const btn = document.getElementById('moneyEntryDateTimeEditBtn');
        if (row) row.classList.toggle('hidden', editing);
        if (fields) {
            fields.classList.toggle('hidden', !editing);
            fields.classList.toggle('flex', editing);
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
            header.classList.remove(
                'bg-success', 'text-success-content', 'bg-error', 'text-error-content',
                'bg-success/15', 'bg-error/15', 'text-success', 'text-error',
                'border-success/20', 'border-error/20', 'deposit-entry-header'
            );
            header.classList.add(
                isWithdraw ? 'bg-error/15 text-error border-error/20' : 'deposit-entry-header',
                'border-b'
            );
        }
        const toggle = document.getElementById('moneyEntryTypeToggle');
        if (toggle) toggle.checked = isWithdraw;
        const previewEl = document.getElementById('moneyEntryAmountPreview');
        if (previewEl) {
            previewEl.classList.remove('bg-success/15', 'bg-error/15', 'text-success', 'text-error', 'p-2', 'rounded-xl', 'font-semibold');
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
            previewEl.classList.add('hidden');
            return;
        }
        previewEl.innerHTML = `<div class="money-value-block money-value-block--left">${renderAmount(amount, {
            size: 'md',
            tone: document.getElementById('moneyEntryType')?.value === 'withdraw' ? 'withdraw' : 'deposit',
            align: 'left'
        })}${renderMoneyAmountWords(amount, 'left')}</div>`;
        previewEl.classList.remove('hidden');
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
        document.getElementById('moneyEntryModal').showModal();
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
        document.getElementById('moneyEntryModal').showModal();
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
            document.getElementById('moneyEntryModal')?.close();
            if (setMoneyHistorySheetAccountId) setMoneyHistorySheetAccountId(accountId);
            if (renderMoney) renderMoney();
            if (refreshMoneyHistorySheetIfOpen) refreshMoneyHistorySheetIfOpen();
        };

        if (editId) {
            confirmAction({
                title: '<i class="fas fa-pen mr-2"></i>Update Entry?',
                titleClass: 'text-primary',
                message: `Save changes to this ${typeLabel} of ${fmtINR(amount)}?`,
                confirmLabel: '<i class="fas fa-save mr-1"></i> Update',
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
