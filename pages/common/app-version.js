/**
 * App version + build stamp shown on the More page.
 * Updated by `npm run ship` (or `node build-production.js --bump`).
 */
(function (global) {
    'use strict';

    const APP_VERSION = "1.0.4";
    const APP_BUILT_AT = "11 Jul 2026 · 1:22 am";

    function paintMoreHubBuildMeta() {
        const el = document.getElementById('more-hub-build-meta');
        if (!el) return;
        el.innerHTML = `<span class="text-muted small">Version ${APP_VERSION}</span>` +
            `<span class="text-muted small">${APP_BUILT_AT}</span>`;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', paintMoreHubBuildMeta);
    } else {
        paintMoreHubBuildMeta();
    }

    global.MTFRegister({
        APP_VERSION,
        APP_BUILT_AT,
        paintMoreHubBuildMeta
    });
})(typeof window !== 'undefined' ? window : globalThis);
