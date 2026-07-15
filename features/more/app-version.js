/**
 * App version + build stamp shown on the More page.
 * Bumped automatically by `npm run build -- --bump` / `npm run save`.
 */
(function (global) {
    'use strict';

    const APP_VERSION = "1.0.363";
    const APP_BUILT_AT = "16 Jul 2026 · 12:21 am";

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
