/**
 * O18 — Settings page render organism (sync status stays in app).
 */
(function (global) {
    'use strict';

    function settingsPages() {
        return (global.MTFAppHelpers || {}).settingsPages || {};
    }

    async function saveAppPermissions() {
        try {
            if (global.MTFDb) {
                const fbDb = global.MTFDb.getFirebaseDb();
                if (fbDb) {
                    await fbDb.collection('app_config').doc('global').set(
                        { permissions: window.AppPermissions }, 
                        { merge: true }
                    );
                    return true;
                }
            }
        } catch (e) {
            MTFLogger.warn('Failed to save permissions to Firestore', e);
        }
        return false;
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
        const traceSwitch = document.getElementById('settingActivityLogTrace');

        const perms = window.AppPermissions || {};

        const attachToggle = (el, key, onChangeEffect) => {
            if (!el) return;
            el.checked = !!perms[key];
            el.onchange = async (e) => {
                const val = e.target.checked;
                perms[key] = val;
                const success = await saveAppPermissions();
                if (!success) {
                    e.target.checked = !val;
                    perms[key] = !val;
                    if (global.MTFAppHelpers?.showToast) {
                        global.MTFAppHelpers.showToast('Failed to save setting to cloud.');
                    }
                    return;
                }
                if (onChangeEffect) onChangeEffect();
            };
        };

        const updateLogger = () => {
            if (global.MTFLogger && typeof global.MTFLogger.updateConfig === 'function') {
                global.MTFLogger.updateConfig();
            }
        };

        attachToggle(masterSwitch, 'activityLogMaster', updateLogger);
        attachToggle(dbSwitch, 'activityLogDb', updateLogger);
        attachToggle(appSwitch, 'activityLogApp', updateLogger);
        attachToggle(traceSwitch, 'activityLogTrace', updateLogger);

        const disableLocalDbToggle = document.getElementById('disableLocalDbToggle');
        if (disableLocalDbToggle) {
            const isLocalDbCurrentlyDisabled = !(perms.localDbEnabled ?? true);
            disableLocalDbToggle.checked = isLocalDbCurrentlyDisabled;

            disableLocalDbToggle.onclick = (e) => {
                e.preventDefault();
                const wantsToDisable = !isLocalDbCurrentlyDisabled;

                if (wantsToDisable) {
                    const modalEl = document.getElementById('dbDisableConfirmModal');
                    if (modalEl) {
                        const modal = new bootstrap.Modal(modalEl);
                        
                        const confirmBtn = document.getElementById('dbDisableConfirmBtn');
                        const cancelBtn = document.getElementById('dbDisableCancelBtn');
                        
                        const cleanup = () => {
                            confirmBtn.onclick = null;
                            cancelBtn.onclick = null;
                            modal.hide();
                        };

                        cancelBtn.onclick = () => {
                            cleanup();
                        };

                        confirmBtn.onclick = async () => {
                            confirmBtn.disabled = true;
                            cancelBtn.disabled = true;
                            confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';

                            try {
                                if (global.MTFDb && global.MTFDb.purgeLocalDatabase) {
                                    await global.MTFDb.purgeLocalDatabase();
                                }
                                
                                perms.localDbEnabled = false;
                                const success = await saveAppPermissions();
                                
                                if (success) {
                                    disableLocalDbToggle.checked = true;
                                    document.dispatchEvent(new CustomEvent('localDbStateChanged', { detail: { disabled: true } }));
                                } else {
                                    perms.localDbEnabled = true;
                                    if (global.MTFAppHelpers?.showToast) global.MTFAppHelpers.showToast('Failed to save to cloud.');
                                }
                            } finally {
                                confirmBtn.disabled = false;
                                cancelBtn.disabled = false;
                                confirmBtn.innerHTML = 'Yes, Delete Local Data';
                                cleanup();
                            }
                        };
                        
                        modal.show();
                    }
                } else {
                    (async () => {
                        perms.localDbEnabled = true;
                        const success = await saveAppPermissions();
                        if (success) {
                            disableLocalDbToggle.checked = false;
                            document.dispatchEvent(new CustomEvent('localDbStateChanged', { detail: { disabled: false } }));
                        } else {
                            perms.localDbEnabled = false;
                            if (global.MTFAppHelpers?.showToast) global.MTFAppHelpers.showToast('Failed to save to cloud.');
                        }
                    })();
                }
            };
        }
    }

    global.MTFRegister({ renderSettings });
})(typeof window !== 'undefined' ? window : globalThis);
