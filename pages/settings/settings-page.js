/**
 * O18 — Settings page render organism (accounts list; sync status stays in app).
 */
(function (global) {
    'use strict';

    function settingsPages() {
        return (global.MTFAppHelpers || {}).settingsPages || {};
    }

    function renderSettingsMoneyAccounts() {
        const { getMoneyAccounts } = settingsPages();
        const accounts = getMoneyAccounts ? getMoneyAccounts() : [];
        const countEl = document.getElementById('settingsMoneyAccountCount');
        const badgeEl = document.getElementById('settingsMoneyAccountBadge');
        const listEl = document.getElementById('settingsMoneyAccountList');
        if (countEl) countEl.textContent = accounts.length === 1 ? '1 account' : `${accounts.length} accounts`;
        if (badgeEl) badgeEl.textContent = accounts.length;
        if (!listEl) return;
        if (!accounts.length) {
            listEl.innerHTML = '<p class="text-sm text-base-content/60 mb-0">No accounts yet. Tap Add Account above to create one.</p>';
            return;
        }
        listEl.innerHTML = accounts.map((a) => {
            const holder = a.holderName ? `<div class="text-sm text-base-content/60">${a.holderName}</div>` : '';
            return `
                <button type="button" class="btn btn-ghost border border-base-200 w-full text-start mb-2 rounded-xl" onclick="openMoneyAccountModal('${a.id}')">
                    <div class="font-semibold">${a.name}</div>
                    ${holder}
                </button>
            `;
        }).join('');
    }

    function renderSettings() {
        const { getTransactions, renderSyncStatus } = settingsPages();
        const txs = getTransactions ? getTransactions() : [];
        document.getElementById('totalTxCount').textContent = txs.length + ' records';
        document.getElementById('totalTxBadge').textContent = txs.length;
        renderSettingsMoneyAccounts();
        if (renderSyncStatus) renderSyncStatus();
    }

    global.MTFRegister({ renderSettings, renderSettingsMoneyAccounts });
})(typeof window !== 'undefined' ? window : globalThis);
