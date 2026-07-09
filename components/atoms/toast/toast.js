/**
 * A35 — Toast atom.
 */
(function (global) {
    'use strict';

    const TOAST_COLORS = {
        success: 'alert-success',
        danger: 'alert-error',
        warning: 'alert-warning',
        info: 'alert-info'
    };

    function showToast(msg, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `alert ${TOAST_COLORS[type] || TOAST_COLORS.info} mb-2 text-center rounded-2xl`;
        div.innerHTML = msg;
        container.appendChild(div);
        setTimeout(() => { if (div.parentNode) div.remove(); }, 3500);
    }

    global.MTFRegister({ showToast, TOAST_COLORS });
})(typeof window !== 'undefined' ? window : globalThis);
