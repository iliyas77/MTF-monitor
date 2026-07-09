/**
 * A23 — Range quick button atom (All / 1W / 1M preset buttons).
 */
(function (global) {
    'use strict';

    function renderRangeQuickButton(label, opts = {}) {
        const {
            active = false,
            dataRange = '',
            onclick = '',
            className = '',
            flex = true
        } = opts;
        const btnClass = active
            ? 'btn btn-outline btn-primary btn-sm'
            : 'btn btn-outline btn-neutral btn-sm';
        const flexClass = flex ? ' flex-1' : '';
        const rangeAttr = dataRange !== '' && dataRange !== undefined ? ` data-range="${dataRange}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        return `<button type="button" class="${btnClass}${flexClass}${className ? ` ${className}` : ''}"${rangeAttr}${onclickAttr}>${label}</button>`;
    }

    function renderRangeQuickGroup(buttons, opts = {}) {
        const { className = '', id = '' } = opts;
        const idAttr = id ? ` id="${id}"` : '';
        const html = Array.isArray(buttons) ? buttons.join('') : buttons;
        return `<div class="range-quick flex flex-wrap gap-2${className ? ` ${className}` : ''}"${idAttr}>${html}</div>`;
    }

    global.MTFRegister({
        renderRangeQuickButton,
        renderRangeQuickGroup
    });
})(typeof window !== 'undefined' ? window : globalThis);
