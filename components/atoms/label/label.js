/**
 * A2 — Label atom (unified field, stat, sheet, section labels).
 */
(function (global) {
    'use strict';

    const LABEL_CLASSES = {
        stat: 'text-xs uppercase text-base-content/50 font-medium tracking-wide',
        sheet: 'block text-xs uppercase text-base-content/50 font-medium tracking-wide mb-1.5',
        field: 'label-text font-normal text-base-content/65',
        section: 'past-filter-section__label',
        tradeStat: 'text-[0.65rem] uppercase text-base-content/45 font-medium leading-tight',
        overline: 'text-base-content/60 text-xs uppercase tracking-wide font-medium',
        deposit: 'deposit-label',
        quantity: 'quantity-label',
        buyPrice: 'buy-price-label'
    };

    function renderLabel(text, variant = 'field', opts = {}) {
        const {
            icon = '',
            className = '',
            tag = 'span',
            html = '',
            forId = ''
        } = opts;
        const cls = LABEL_CLASSES[variant] || LABEL_CLASSES.field;
        const forAttr = forId ? ` for="${forId}"` : '';
        const { renderIcon } = global.MTFComponents;
        const content = html || (icon ? `${renderIcon(icon, { className: 'mr-1' })}${text}` : text);
        return `<${tag} class="${cls}${className ? ` ${className}` : ''}"${forAttr}>${content}</${tag}>`;
    }

    global.MTFRegister({
        LABEL_CLASSES,
        renderLabel
    });
})(typeof window !== 'undefined' ? window : globalThis);
