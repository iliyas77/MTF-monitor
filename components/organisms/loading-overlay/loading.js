/**
 * O24 — Loading overlay organism (blocking spinner during sync).
 */
(function (global) {
    'use strict';

    let loadingCount = 0;
    let loadingCancelInit = false;

    function showLoading(label) {
        loadingCount++;
        if (loadingCount === 1) {
            const el = document.getElementById('appLoading');
            if (el) {
                if (!loadingCancelInit) {
                    loadingCancelInit = true;
                    el.addEventListener('cancel', (e) => e.preventDefault());
                }
                if (label) {
                    const labelEl = el.querySelector('.app-loading__label');
                    if (labelEl) labelEl.textContent = label;
                }
                if (!el.open) el.showModal();
            }
        }
    }

    function hideLoading() {
        loadingCount = Math.max(0, loadingCount - 1);
        if (loadingCount === 0) {
            const el = document.getElementById('appLoading');
            if (el && el.open) el.close();
        }
    }

    global.MTFRegister({ showLoading, hideLoading });
})(typeof window !== 'undefined' ? window : globalThis);
