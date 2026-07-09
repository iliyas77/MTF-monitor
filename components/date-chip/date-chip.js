/**
 * A10 — Date chip atom.
 */
(function (global) {
    'use strict';

    const { fmtDateDisplay } = global.MTFComponents;

    function renderDateChip(text, opts = {}) {
        const {
            onclick = '',
            id = '',
            className = '',
            clickable = false,
            size = ''
        } = opts;
        const tag = (clickable || onclick) ? 'button' : 'span';
        const typeAttr = tag === 'button' ? ' type="button"' : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        const idAttr = id ? ` id="${id}"` : '';
        const clickClass = (clickable || onclick) ? ' app-date-chip--clickable' : '';
        const sizeClass = size === 'sm' ? ' app-date-chip--sm' : '';
        return `<${tag}${typeAttr} class="app-date-chip${clickClass}${sizeClass}${className ? ` ${className}` : ''}"${idAttr}${onclickAttr}>` +
            `<i class="far fa-calendar app-date-chip__icon" aria-hidden="true"></i>` +
            `<span class="app-date-chip__text">${text}</span>` +
            `</${tag}>`;
    }

    function renderDateRangeChip(from, to, opts = {}) {
        const fromText = fmtDateDisplay(from);
        const toText = fmtDateDisplay(to);
        const text = from && to && from !== to ? `${fromText} – ${toText}` : fromText;
        return renderDateChip(text, opts);
    }

    function paintDateChip(el, text, opts = {}) {
        if (!el) return null;
        const html = renderDateChip(text, { ...opts, id: el.id || opts.id });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    global.MTFRegister({
        renderDateChip,
        renderDateRangeChip,
        paintDateChip
    });
})(typeof window !== 'undefined' ? window : globalThis);
