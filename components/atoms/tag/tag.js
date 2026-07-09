/**
 * A3 — Badge / tag atom.
 */
(function (global) {
    'use strict';

    const APP_TAG_CLASSES = {
        default: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium bg-base-200/30 border border-base-200/60 text-base-content/80',
        accent: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-semibold app-tag--accent',
        secondary: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-semibold app-tag--secondary',
        success: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium app-tag--success',
        error: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium app-tag--error',
        warning: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium app-tag--warning'
    };

    function appTag(content, variant = 'default') {
        const cls = APP_TAG_CLASSES[variant] || APP_TAG_CLASSES.default;
        return `<span class="${cls}">${content}</span>`;
    }

    function setAppTagElement(el, text, variant = 'default') {
        if (!el) return;
        el.className = APP_TAG_CLASSES[variant] || APP_TAG_CLASSES.default;
        el.textContent = text;
    }

    global.MTFRegister({ appTag, setAppTagElement, APP_TAG_CLASSES });
})(typeof window !== 'undefined' ? window : globalThis);
