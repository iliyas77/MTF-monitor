/**
 * A22 — Filter chip atom (Material-style pill buttons).
 */
(function (global) {
    'use strict';

    function renderFilterChip(label, opts = {}) {
        const {
            selected = false,
            dataRange = '',
            onclick = '',
            className = '',
            ariaPressed
        } = opts;
        const pressed = ariaPressed !== undefined ? ariaPressed : selected;
        const rangeAttr = dataRange !== '' && dataRange !== undefined ? ` data-range="${dataRange}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        return `<button type="button" class="md-filter-chip${selected ? ' md-filter-chip--selected' : ''}${className ? ` ${className}` : ''}"${rangeAttr}${onclickAttr} aria-pressed="${pressed}">${label}</button>`;
    }

    function renderFilterChipGroup(chips, opts = {}) {
        const {
            groupClass = 'md-chip-group md-chip-group--filter',
            ariaLabel = '',
            id = ''
        } = opts;
        const idAttr = id ? ` id="${id}"` : '';
        const ariaAttr = ariaLabel ? ` role="group" aria-label="${ariaLabel}"` : '';
        const html = Array.isArray(chips) ? chips.join('') : chips;
        return `<div class="${groupClass}"${idAttr}${ariaAttr}>${html}</div>`;
    }

    global.MTFRegister({
        renderFilterChip,
        renderFilterChipGroup
    });
})(typeof window !== 'undefined' ? window : globalThis);
