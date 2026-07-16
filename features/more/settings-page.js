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
        
        // Developer Options: Activity Log settings
        const masterSwitch = document.getElementById('settingActivityLogMaster');
        const dbSwitch = document.getElementById('settingActivityLogDB');
        const appSwitch = document.getElementById('settingActivityLogApp');

        if (masterSwitch) {
            masterSwitch.checked = localStorage.getItem('activityLog_master') !== 'false';
            masterSwitch.onchange = (e) => {
                localStorage.setItem('activityLog_master', String(e.target.checked));
                if (global.MTFLogger && typeof global.MTFLogger.updateConfig === 'function') {
                    global.MTFLogger.updateConfig();
                }
            };
        }
        if (dbSwitch) {
            dbSwitch.checked = localStorage.getItem('activityLog_db') !== 'false';
            dbSwitch.onchange = (e) => {
                localStorage.setItem('activityLog_db', String(e.target.checked));
                if (global.MTFLogger && typeof global.MTFLogger.updateConfig === 'function') {
                    global.MTFLogger.updateConfig();
                }
            };
        }
        if (appSwitch) {
            appSwitch.checked = localStorage.getItem('activityLog_app') !== 'false';
            appSwitch.onchange = (e) => {
                localStorage.setItem('activityLog_app', String(e.target.checked));
                if (global.MTFLogger && typeof global.MTFLogger.updateConfig === 'function') {
                    global.MTFLogger.updateConfig();
                }
            };
        }
    }

    global.MTFRegister({ renderSettings });
})(typeof window !== 'undefined' ? window : globalThis);
