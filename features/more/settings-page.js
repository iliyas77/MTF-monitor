/**
 * O18 — Settings page render organism (sync status stays in app).
 */
(function (global) {
    'use strict';

    function settingsPages() {
        return (global.MTFAppHelpers || {}).settingsPages || {};
    }

    function renderSettings() {
        const { getTransactions, renderSyncStatus } = settingsPages();
        const txs = getTransactions ? getTransactions() : [];
        const countEl = document.getElementById('totalTxCount');
        const badgeEl = document.getElementById('totalTxBadge');
        if (countEl) countEl.textContent = txs.length + ' records';
        if (badgeEl) badgeEl.textContent = txs.length;
        if (renderSyncStatus) renderSyncStatus();
    }

    global.MTFRegister({ renderSettings });
})(typeof window !== 'undefined' ? window : globalThis);
