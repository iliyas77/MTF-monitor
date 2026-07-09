/**
 * A14 — App button atom.
 */
(function (global) {
    'use strict';

    const APP_BUTTON_VARIANTS = {
        cancel: 'app-btn--cancel',
        action: 'app-btn--action',
        danger: 'app-btn--danger',
        tonal: 'app-btn--tonal',
        'primary-tonal': 'app-btn--primary-tonal',
        'tonal-danger': 'app-btn--tonal-danger'
    };

    function resolveAppButtonVariant(variantOrLegacy = 'action') {
        const v = String(variantOrLegacy || 'action').toLowerCase();
        if (v === 'tonal-danger') return 'tonal-danger';
        if (v === 'tonal') return 'tonal';
        if (v === 'primary-tonal' || v === 'primary_tonal') return 'primary-tonal';
        if (v.includes('error') || v.includes('danger')) return 'danger';
        if (v.includes('cancel') || v.includes('ghost')) return 'cancel';
        return 'action';
    }

    function renderAppButton(label, opts = {}) {
        const {
            variant = 'action',
            id = '',
            onclick = '',
            icon = '',
            labelHtml = '',
            fullWidth = false,
            flex = false,
            submit = false,
            type = 'button',
            className = '',
            size = '',
            disabled = false
        } = opts;
        const resolved = resolveAppButtonVariant(variant);
        const btnType = submit ? 'submit' : type;
        const iconHtml = icon ? `<i class="fas ${icon} app-btn__icon" aria-hidden="true"></i>` : '';
        const inner = labelHtml || `<span class="app-btn__content">${iconHtml}<span class="app-btn__label">${label}</span></span>`;
        const idAttr = id ? ` id="${id}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        const disabledAttr = disabled ? ' disabled' : '';
        const sizeClass = size === 'sm' ? 'app-btn--sm' : '';
        return `<button type="${btnType}" class="app-btn ${APP_BUTTON_VARIANTS[resolved]} ${sizeClass} ${flex ? 'flex-1' : ''} ${fullWidth ? 'w-full' : ''} ${className}"${idAttr}${onclickAttr}${disabledAttr}>${inner}</button>`;
    }

    function paintAppButton(el, label, opts = {}) {
        if (!el) return null;
        const html = renderAppButton(label, { ...opts, id: el.id || opts.id, flex: opts.flex ?? el.classList.contains('flex-1') });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    global.MTFRegister({
        renderAppButton,
        paintAppButton,
        resolveAppButtonVariant,
        APP_BUTTON_VARIANTS
    });
})(typeof window !== 'undefined' ? window : globalThis);
