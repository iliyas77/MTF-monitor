/**
 * O18 — Settings page render organism (sync status stays in app).
 */
(function (global) {
    'use strict';

    function settingsPages() {
        return (global.MTFAppHelpers || {}).settingsPages || {};
    }

    let saveTimeout = null;

    function setCloudBadgeStatus(status, type = 'muted') {
        const badge = document.getElementById('cloudSyncStatusBadge');
        if (!badge) return;
        badge.className = `badge bg-body-secondary text-${type}`;
        
        if (status === 'Updating...') {
            badge.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Updating...';
        } else {
            badge.textContent = status;
        }
    }

    async function executeSave() {
        setCloudBadgeStatus('Updating...', 'primary');
        try {
            localStorage.setItem('mtf_permissions', JSON.stringify(window.AppPermissions));
            
            if (global.MTFDb) {
                const fbDb = global.MTFDb.getFirebaseDb();
                const syncCode = global.MTFDb.getSyncCode ? global.MTFDb.getSyncCode() : null;
                if (fbDb && syncCode) {
                    await fbDb.collection('settings').doc(syncCode).set(
                        { permissions: window.AppPermissions }, 
                        { merge: true }
                    );
                }
            }
            setCloudBadgeStatus('Cloud Synchronized', 'success');
            if (global.MTFAppHelpers?.showToast) {
                global.MTFAppHelpers.showToast('Settings saved successfully', 'success');
            }
            return true;
        } catch (e) {
            MTFLogger.warn('Failed to save permissions to Firestore', e);
        }
        setCloudBadgeStatus('Sync Failed', 'danger');
        if (global.MTFAppHelpers?.showToast) {
            global.MTFAppHelpers.showToast('Failed to save settings to cloud', 'danger');
        }
        return false;
    }

    function scheduleSave() {
        setCloudBadgeStatus('Pending...', 'warning');
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            executeSave();
        }, 500);
    }

    function evaluateDependencies() {
        const masterSwitch = document.getElementById('settingActivityLogMaster');
        const dependents = [
            document.getElementById('settingActivityLogDB'),
            document.getElementById('settingActivityLogApp'),
            document.getElementById('settingActivityLogTrace')
        ];
        
        if (!masterSwitch) return;
        
        const isMasterOff = !masterSwitch.checked;
        
        dependents.forEach(input => {
            if (!input) return;
            const row = input.closest('.settings-data-row');
            
            if (isMasterOff) {
                input.disabled = true;
                input.setAttribute('aria-disabled', 'true');
                if (row) {
                    row.classList.add('opacity-75', 'bg-body-secondary');
                }
            } else {
                input.disabled = false;
                input.setAttribute('aria-disabled', 'false');
                if (row) {
                    row.classList.remove('opacity-75', 'bg-body-secondary');
                }
            }
        });
    }

    function attachDelegatedListeners() {
        const container = document.querySelector('[data-ref="page.settings.dev-card.list"]');
        if (!container) return;
        
        // Remove old listener if exists
        const clone = container.cloneNode(true);
        container.parentNode.replaceChild(clone, container);
        
        clone.addEventListener('change', (e) => {
            const target = e.target;
            const perms = window.AppPermissions || {};
            
            if (target.id === 'settingActivityLogMaster') {
                perms.activityLogMaster = target.checked;
                evaluateDependencies();
                scheduleSave();
            } else if (target.id === 'settingActivityLogDB') {
                perms.activityLogDb = target.checked;
                scheduleSave();
            } else if (target.id === 'settingActivityLogApp') {
                perms.activityLogApp = target.checked;
                scheduleSave();
            } else if (target.id === 'settingActivityLogTrace') {
                perms.activityLogTrace = target.checked;
                scheduleSave();
            }
            
            if (global.MTFLogger && typeof global.MTFLogger.updateConfig === 'function') {
                global.MTFLogger.updateConfig();
            }
        });

        // Handle DB disable logic separately since it has a modal confirmation flow
        const disableLocalDbToggle = document.getElementById('disableLocalDbToggle');
        if (disableLocalDbToggle) {
            disableLocalDbToggle.onclick = (e) => {
                e.preventDefault(); // intercept the change
                const perms = window.AppPermissions || {};
                const isLocalDbCurrentlyDisabled = !(perms.localDbEnabled ?? true);
                const wantsToDisable = !isLocalDbCurrentlyDisabled;

                if (wantsToDisable) {
                    if (global.MTFComponents && global.MTFComponents.confirmAction) {
                        global.MTFComponents.confirmAction({
                            title: 'Disable Local Database?',
                            titleClass: 'text-gr1',
                            message: 'Turning off the local database will permanently delete all locally cached data on this device to ensure data security. Your data will still be safe in the cloud (if synced), but offline access will be completely disabled. Are you sure you want to proceed?',
                            confirmLabel: 'Yes, Delete Local Data',
                            confirmClass: 'danger',
                            onConfirm: async () => {
                                setCloudBadgeStatus('Deleting...', 'primary');
                                try {
                                    if (global.MTFDb && global.MTFDb.purgeLocalDatabase) {
                                        await global.MTFDb.purgeLocalDatabase();
                                    }
                                    perms.localDbEnabled = false;
                                    const success = await executeSave();
                                    if (success) {
                                        disableLocalDbToggle.checked = true;
                                        document.dispatchEvent(new CustomEvent('localDbStateChanged', { detail: { disabled: true } }));
                                    } else {
                                        perms.localDbEnabled = true;
                                    }
                                } catch (e) {
                                    MTFLogger.warn('purge error', e);
                                    perms.localDbEnabled = true;
                                }
                            }
                        });
                    }
                } else {
                    (async () => {
                        perms.localDbEnabled = true;
                        const success = await executeSave();
                        if (success) {
                            disableLocalDbToggle.checked = false;
                            document.dispatchEvent(new CustomEvent('localDbStateChanged', { detail: { disabled: false } }));
                        } else {
                            perms.localDbEnabled = false;
                        }
                    })();
                }
            };
        }
    }

    function renderSettings() {
        const { getTransactions, renderSyncStatus } = settingsPages();
        const txs = getTransactions ? getTransactions() : [];
        const countEl = document.getElementById('totalTxCount');
        const badgeEl = document.getElementById('totalTxBadge');
        if (countEl) countEl.textContent = txs.length + ' records';
        if (badgeEl) badgeEl.textContent = txs.length;
        if (renderSyncStatus) renderSyncStatus();
        
        const perms = window.AppPermissions || {};

        // Sync initial state to UI
        const masterSwitch = document.getElementById('settingActivityLogMaster');
        const dbSwitch = document.getElementById('settingActivityLogDB');
        const appSwitch = document.getElementById('settingActivityLogApp');
        const traceSwitch = document.getElementById('settingActivityLogTrace');
        const disableLocalDbToggle = document.getElementById('disableLocalDbToggle');

        if (masterSwitch) masterSwitch.checked = !!perms.activityLogMaster;
        if (dbSwitch) dbSwitch.checked = !!perms.activityLogDb;
        if (appSwitch) appSwitch.checked = !!perms.activityLogApp;
        if (traceSwitch) traceSwitch.checked = !!perms.activityLogTrace;
        if (disableLocalDbToggle) disableLocalDbToggle.checked = !(perms.localDbEnabled ?? true);

        // Apply dependencies on load
        evaluateDependencies();
        
        // Setup listeners
        attachDelegatedListeners();
    }

    global.MTFRegister({ renderSettings });
})(typeof window !== 'undefined' ? window : globalThis);
