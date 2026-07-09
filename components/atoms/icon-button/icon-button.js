/**
 * A15 — Icon button atom (circle ghost buttons).
 */
(function (global) {
    'use strict';

    const ICON_BUTTON_CLASSES = {
        default: 'btn btn-ghost btn-circle border border-base-200 shrink-0 focus:outline-none text-base-content/55',
        sm: 'btn btn-ghost btn-circle btn-sm border border-base-200 w-10 h-10 min-h-0 shrink-0',
        xs: 'btn btn-ghost btn-circle btn-xs shrink-0 opacity-90',
        toolbar: 'btn btn-ghost border border-base-200 h-10 w-10 min-h-0 bg-base-100 rounded-xl focus:outline-none text-base-content/55 p-0',
        sub: 'btn btn-ghost btn-circle border border-base-200 shrink-0 w-9 h-9 min-h-0'
    };

    function renderIconButton(opts = {}) {
        const {
            onclick = '',
            ariaLabel = '',
            icon = 'fa-arrow-left',
            variant = 'default',
            className = '',
            id = '',
            title = '',
            type = 'button',
            disabled = false
        } = opts;
        const base = ICON_BUTTON_CLASSES[variant] || ICON_BUTTON_CLASSES.default;
        const idAttr = id ? ` id="${id}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        const titleAttr = title ? ` title="${title}"` : '';
        const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
        const disabledAttr = disabled ? ' disabled' : '';
        return `<button type="${type}" class="${base}${className ? ` ${className}` : ''}"${idAttr}${onclickAttr}${titleAttr}${ariaAttr}${disabledAttr}><i class="fas ${icon}"></i></button>`;
    }

    global.MTFRegister({
        ICON_BUTTON_CLASSES,
        renderIconButton
    });
})(typeof window !== 'undefined' ? window : globalThis);
