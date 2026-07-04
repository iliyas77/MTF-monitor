/**
 * MTF Profit Tracker — reusable UI components (tags, amounts, buttons).
 * Load before the main app script in main.html; exposes MTFComponents on window.
 */
(function (global) {
    'use strict';

    // ---------- TAGS ----------
    const APP_TAG_CLASSES = {
        default: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium bg-base-200/30 border border-base-200/60 text-base-content/80',
        accent: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-semibold bg-primary/10 border border-primary/30 text-primary',
        success: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium bg-success/15 border border-success/25 text-success',
        error: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium bg-error/15 border border-error/25 text-error',
        warning: 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium bg-warning/10 border border-warning/30 text-warning'
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

    // ---------- FORMAT HELPERS (used by amount component) ----------
    function fmt(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(1) + 'Cr';
        if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + 'L';
        return sign + '₹' + abs.toFixed(0);
    }

    function fmtINR(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.round(Math.abs(n));
        return sign + '₹' + abs.toLocaleString('en-IN');
    }

    function fmtDec(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0.00';
        return '₹' + n.toFixed(2);
    }

    function amountInWords(num) {
        if (num === undefined || num === null || isNaN(num)) return 'Zero Rupees';
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const spellBelow100 = (n) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        const spellBelow1000 = (n) => {
            if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + spellBelow100(n % 100) : '');
            return spellBelow100(n);
        };
        let n = Math.round(Math.abs(num));
        if (n === 0) return 'Zero Rupees';
        const parts = [];
        const crore = Math.floor(n / 10000000);
        n %= 10000000;
        const lakh = Math.floor(n / 100000);
        n %= 100000;
        const thousand = Math.floor(n / 1000);
        n %= 1000;
        if (crore) parts.push(spellBelow100(crore) + ' Crore');
        if (lakh) parts.push(spellBelow100(lakh) + ' Lakh');
        if (thousand) parts.push(spellBelow100(thousand) + ' Thousand');
        if (n) parts.push(spellBelow1000(n));
        const text = parts.join(' ');
        const label = Math.round(Math.abs(num)) === 1 ? 'Rupee' : 'Rupees';
        return (num < 0 ? 'Minus ' : '') + text + ' ' + label;
    }

    // ---------- AMOUNT COMPONENT ----------
    const AMOUNT_SIZES = {
        xs: { shell: 'px-2 py-0.5 rounded-lg', value: 'text-xs font-semibold', words: 'text-[0.65rem] mt-0.5' },
        sm: { shell: 'px-2 py-0.5 rounded-lg', value: 'text-sm font-semibold', words: 'text-[0.65rem] mt-0.5' },
        md: { shell: 'px-2.5 py-1 rounded-xl', value: 'text-base font-semibold', words: 'text-xs mt-0.5' },
        lg: { shell: 'px-3 py-1.5 rounded-2xl', value: 'text-3xl font-bold leading-none', words: 'text-xs mt-1' },
        xl: { shell: 'px-3 py-1.5 rounded-2xl', value: 'text-2xl font-bold leading-tight', words: 'text-xs mt-1' },
        hero: { shell: 'px-4 py-2 rounded-2xl mb-3', value: 'text-6xl font-bold leading-none', words: 'text-xs mt-1.5' }
    };

    const AMOUNT_TONE_SHELL = {
        positive: 'bg-success/15 text-success',
        negative: 'bg-error/15 text-error',
        neutral: 'bg-base-200/50 text-base-content/85',
        warning: 'bg-warning/15 text-warning'
    };

    const AMOUNT_TONE_TEXT = {
        positive: 'text-success',
        negative: 'text-error',
        neutral: 'text-base-content/80',
        warning: 'text-warning'
    };

    function resolveAmountTone(amount, tone = 'auto') {
        if (tone === 'positive' || tone === 'deposit') return 'positive';
        if (tone === 'negative' || tone === 'withdraw') return 'negative';
        if (tone === 'neutral') return 'neutral';
        if (tone === 'warning') return 'warning';
        return (Number(amount) || 0) >= 0 ? 'positive' : 'negative';
    }

    function formatAmountNumber(amount, opts = {}) {
        const { decimals = false, compact = false, showSign = false } = opts;
        const n = Number(amount) || 0;
        if (decimals) return fmtDec(n);
        if (compact) {
            const base = fmt(n);
            if (showSign && n > 0 && !base.startsWith('+')) return '+' + base;
            return base;
        }
        if (showSign && n > 0) return '+' + fmtINR(n);
        return fmtINR(n);
    }

    /**
     * Reusable amount display — number on top, optional words on second row.
     */
    function renderAmount(amount, opts = {}) {
        const {
            size = 'md',
            tone = 'auto',
            words = false,
            decimals = false,
            compact = false,
            showSign = false,
            pill = true,
            align = 'inherit',
            id = '',
            className = '',
            icon = '',
            iconSize = 'sm'
        } = opts;

        const resolvedTone = resolveAmountTone(amount, tone);
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const shellTone = pill ? AMOUNT_TONE_SHELL[resolvedTone] : AMOUNT_TONE_TEXT[resolvedTone];
        const alignMap = {
            left: 'text-left items-start',
            center: 'text-center items-center',
            right: 'text-right items-end',
            inherit: ''
        };
        const iconSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
        const formatted = formatAmountNumber(amount, { decimals, compact, showSign });
        const iconHtml = icon
            ? `<span class="amount-display__icon ${iconSizes[iconSize] || iconSizes.sm} opacity-80 mb-0.5"><i class="fas ${icon}"></i></span>`
            : '';
        const wordsHtml = words
            ? `<span class="amount-display__words block ${cfg.words}">${amountInWords(amount)}</span>`
            : '';
        const idAttr = id ? ` id="${id}"` : '';

        return `<span class="amount-display tabular-nums ${alignMap[align] || ''} ${shellTone} ${cfg.shell} ${className}"${idAttr}>${iconHtml}<span class="amount-display__value ${cfg.value} whitespace-nowrap">${formatted}</span>${wordsHtml}</span>`;
    }

    function paintAmount(el, amount, opts = {}) {
        if (!el) return null;
        const html = renderAmount(amount, { ...opts, id: el.id || opts.id });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    function fmtMoneyRich(n, opts = {}) {
        return renderAmount(n, { words: true, size: 'md', align: 'right', ...opts });
    }

    function pnlToneClass(n, size = 'md') {
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const tone = resolveAmountTone(n, 'auto');
        return `amount-display tabular-nums ${AMOUNT_TONE_SHELL[tone]} ${cfg.shell} ${cfg.value}`;
    }

    // ---------- BUTTON COMPONENT ----------
    const APP_BUTTON_VARIANTS = {
        cancel: 'app-btn--cancel',
        action: 'app-btn--action',
        danger: 'app-btn--danger'
    };

    function resolveAppButtonVariant(variantOrLegacy = 'action') {
        const v = String(variantOrLegacy || 'action').toLowerCase();
        if (v.includes('error') || v.includes('danger')) return 'danger';
        if (v.includes('cancel') || v.includes('ghost')) return 'cancel';
        return 'action';
    }

    /**
     * Reusable app button — cancel (light), action (dark blue), or danger (red).
     */
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
        const iconHtml = icon ? `<i class="fas ${icon} mr-1"></i>` : '';
        const inner = labelHtml || `${iconHtml}${label}`;
        const idAttr = id ? ` id="${id}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        const disabledAttr = disabled ? ' disabled' : '';
        const sizeClass = size === 'sm' ? 'app-btn--sm' : '';
        return `<button type="${btnType}" class="app-btn ${APP_BUTTON_VARIANTS[resolved]} ${sizeClass} ${flex ? 'flex-1' : ''} ${fullWidth ? 'w-full' : ''} ${className}"${idAttr}${onclickAttr}${disabledAttr}>${inner}</button>`;
    }

    /** Cancel + action/danger button row for modals and sheets. */
    function renderAppButtonRow(cancelLabel, actionLabel, opts = {}) {
        const {
            cancelOnClick = '',
            actionOnClick = '',
            actionId = '',
            actionVariant = 'action',
            actionIcon = '',
            actionLabelHtml = '',
            cancelInForm = true,
            rowClass = ''
        } = opts;
        const cancelBtn = renderAppButton(cancelLabel, {
            variant: 'cancel',
            flex: true,
            fullWidth: true,
            submit: cancelInForm && !cancelOnClick,
            onclick: cancelOnClick || undefined
        });
        const cancelHtml = cancelInForm && !cancelOnClick
            ? `<form method="dialog" class="flex-1 min-w-0">${cancelBtn}</form>`
            : cancelBtn;
        const actionBtn = renderAppButton(actionLabel, {
            variant: actionVariant,
            id: actionId,
            onclick: actionOnClick || undefined,
            icon: actionIcon,
            labelHtml: actionLabelHtml,
            flex: true
        });
        return `<div class="app-btn-row ${rowClass}">${cancelHtml}${actionBtn}</div>`;
    }

    function paintAppButton(el, label, opts = {}) {
        if (!el) return null;
        const html = renderAppButton(label, { ...opts, id: el.id || opts.id, flex: opts.flex ?? el.classList.contains('flex-1') });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    const MTFComponents = {
        appTag,
        setAppTagElement,
        fmt,
        fmtINR,
        fmtDec,
        amountInWords,
        renderAmount,
        paintAmount,
        fmtMoneyRich,
        pnlToneClass,
        renderAppButton,
        renderAppButtonRow,
        paintAppButton,
        resolveAppButtonVariant
    };

    global.MTFComponents = MTFComponents;
    Object.assign(global, MTFComponents);
})(typeof window !== 'undefined' ? window : globalThis);
