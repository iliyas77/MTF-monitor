/**
 * Shared format helpers + Bootstrap amount display (not a UI component system).
 */
(function (global) {
    'use strict';

    function fmt(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(1) + 'Cr';
        if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + 'L';
        return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
    }

    function fmtINR(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.round(Math.abs(n));
        return sign + '₹' + abs.toLocaleString('en-IN');
    }

    function fmtDec(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0.00';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + '₹' + abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function parseDateInput(d) {
        if (!d) return null;
        const s = String(d).trim();
        if (!s) return null;
        const dt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
        return isNaN(dt.getTime()) ? null : dt;
    }

    function fmtDateDisplay(d) {
        const dt = parseDateInput(d);
        if (!dt) return '—';
        return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function fmtDateShort(d) {
        const dt = parseDateInput(d);
        if (!dt) return '—';
        return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
    }

    function fa(icon, className = '') {
        const name = String(icon || '').replace(/^fas\s+/, '').replace(/^fa-/, '');
        return `<i class="fas fa-${name}${className ? ` ${className}` : ''}" aria-hidden="true"></i>`;
    }

    const AMOUNT_WORDS_THRESHOLD = 1000000;

    function shouldShowAmountInWords(amount) {
        return Math.abs(Number(amount) || 0) > AMOUNT_WORDS_THRESHOLD;
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
        const label = Math.round(Math.abs(num)) === 1 ? 'Rupee' : 'Rupees';
        return (num < 0 ? 'Minus ' : '') + parts.join(' ') + ' ' + label;
    }

    const AMOUNT_SIZES = {
        xs: { shell: 'px-2 py-1 rounded', value: 'fw-normal', words: 'small mt-1' },
        sm: { shell: 'px-2 py-1 rounded', value: 'fs-6 fw-normal', words: 'small mt-1' },
        md: { shell: 'px-2 py-1 rounded', value: 'fs-6 fw-normal', words: 'small mt-1' },
        lg: { shell: 'px-3 py-2 rounded', value: 'fs-3 fw-normal lh-1', words: 'small mt-1' },
        xl: { shell: 'px-3 py-2 rounded', value: 'fs-4 fw-normal', words: 'small mt-1' },
        hero: { shell: 'px-4 py-2 rounded', value: 'display-3 fw-normal lh-1', words: 'small mt-2' }
    };

    const AMOUNT_TONE_SHELL = {
        positive: 'bg-success-subtle text-success',
        negative: 'bg-danger-subtle text-danger',
        neutral: 'bg-light text-body-secondary',
        secondary: 'bg-primary bg-opacity-10 text-primary',
        quantity: 'bg-info bg-opacity-10 text-info',
        warning: 'bg-warning bg-opacity-25 text-warning-emphasis'
    };

    const AMOUNT_TONE_TEXT = {
        positive: 'text-success',
        negative: 'text-danger',
        neutral: 'text-body-secondary',
        secondary: 'text-primary',
        quantity: 'text-info',
        warning: 'text-warning'
    };

    function resolveAmountTone(amount, tone = 'auto') {
        if (tone === 'positive') return 'positive';
        if (tone === 'deposit') return 'secondary';
        if (tone === 'negative' || tone === 'withdraw') return 'negative';
        if (tone === 'neutral') return 'neutral';
        if (tone === 'secondary' || tone === 'buy') return 'secondary';
        if (tone === 'quantity' || tone === 'qty') return 'quantity';
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

    function renderAmount(amount, opts = {}) {
        const {
            size = 'md', tone = 'auto', words = false, decimals = false, compact = false,
            showSign = false, pill = true, align = 'inherit', id = '', className = '', icon = ''
        } = opts;
        const resolvedTone = resolveAmountTone(amount, tone);
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const shellTone = pill ? AMOUNT_TONE_SHELL[resolvedTone] : AMOUNT_TONE_TEXT[resolvedTone];
        const alignMap = { left: 'text-start align-items-start', center: 'text-center align-items-center', right: 'text-end align-items-end', inherit: '' };
        const formatted = formatAmountNumber(amount, { decimals, compact, showSign });
        const iconHtml = icon ? `<span class="small opacity-75 mb-1">${fa(icon)}</span>` : '';
        const valueHtml = `<span class="${cfg.value} text-nowrap">${formatted}</span>`;
        const pillHtml = pill
            ? `<span class="d-inline-flex flex-column ${shellTone} ${cfg.shell}">${iconHtml}${valueHtml}</span>`
            : `<span class="d-inline-flex flex-column ${shellTone}">${iconHtml}${valueHtml}</span>`;
        const wordsHtml = words && shouldShowAmountInWords(amount)
            ? `<span class="d-block ${cfg.words} text-muted fw-normal">${amountInWords(amount)}</span>` : '';
        const idAttr = id ? ` id="${id}"` : '';
        const outerMb = size === 'hero' ? 'mb-3' : '';
        return `<span class="d-inline-flex flex-column ${alignMap[align] || ''} ${outerMb} ${className}"${idAttr}>${pillHtml}${wordsHtml}</span>`;
    }

    function paintAmount(el, amount, opts = {}) {
        if (!el) return null;
        el.outerHTML = renderAmount(amount, { ...opts, id: el.id || opts.id });
        return el.id ? document.getElementById(el.id) : null;
    }

    function renderQuantity(value, opts = {}) {
        const { size = 'sm', align = 'inherit', pill = true, id = '', className = '' } = opts;
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const shellTone = pill ? AMOUNT_TONE_SHELL.quantity : AMOUNT_TONE_TEXT.quantity;
        const alignMap = { left: 'text-start align-items-start', center: 'text-center align-items-center', right: 'text-end align-items-end', inherit: '' };
        const valueHtml = `<span class="${cfg.value} text-nowrap">${String(value ?? '0')}</span>`;
        const pillHtml = pill ? `<span class="d-inline-flex flex-column ${shellTone} ${cfg.shell}">${valueHtml}</span>` : valueHtml;
        const idAttr = id ? ` id="${id}"` : '';
        return `<span class="d-inline-flex flex-column ${alignMap[align] || ''} ${className}"${idAttr}>${pillHtml}</span>`;
    }

    function renderTotalAmountCard(amount, opts = {}) {
        const { label = 'Total Amount', note = '', size = 'md', decimals = false, tone = 'positive', plain = false, id = '', className = '' } = opts;
        const n = Number(amount) || 0;
        const resolvedTone = resolveAmountTone(amount, tone);
        const formatted = plain ? String(Math.round(n)) : formatAmountNumber(amount, { decimals });
        const sizeClass = size === 'hero' ? ' p-4' : (size === 'sm' ? ' p-2' : ' p-3');
        const amountToneClass = resolvedTone === 'negative' ? 'text-danger'
            : (resolvedTone === 'neutral' ? 'text-body-secondary'
                : (resolvedTone === 'secondary' ? 'text-primary' : 'text-success'));
        const amountSizeClass = size === 'hero' ? 'display-3' : (size === 'sm' ? 'fs-5' : 'fs-4');
        const labelOut = opts.labelHtml ? opts.labelHtml : (label ? `<span class="small text-muted d-block mb-1">${label}</span>` : '');
        const noteHtml = note ? `<span class="small text-muted d-block mt-1">${note}</span>` : '';
        const idAttr = id ? ` id="${id}"` : '';
        return `<div class="text-center bg-light rounded${sizeClass} ${className}"${idAttr}>${labelOut}<span class="${amountSizeClass} fw-bold ${amountToneClass}">${formatted}</span>${noteHtml}</div>`;
    }

    function renderTradesCountCard(count, opts = {}) {
        return renderTotalAmountCard(count, {
            labelHtml: `<span class="small text-muted d-block mb-1">${fa('fa-exchange-alt', 'me-1')}Trades</span>`,
            size: 'sm', tone: 'neutral', plain: true, ...opts
        });
    }

    function paintTradesCountCard(el, count, opts = {}) {
        if (!el) return null;
        el.outerHTML = renderTradesCountCard(count, { ...opts, id: el.id || opts.id });
        return el.id ? document.getElementById(el.id) : null;
    }

    function paintTotalAmountCard(el, amount, opts = {}) {
        if (!el) return null;
        el.outerHTML = renderTotalAmountCard(amount, { ...opts, id: el.id || opts.id });
        return el.id ? document.getElementById(el.id) : null;
    }

    function renderMoneyAmountWords(amount, align = 'center', opts = {}) {
        if (!shouldShowAmountInWords(amount)) return '';
        const { collapsible = false } = opts;
        const alignMap = { left: 'text-start', center: 'text-center', right: 'text-end' };
        return `<div class="small text-muted ${alignMap[align] || 'text-center'}${collapsible ? ' d-none' : ''}">${amountInWords(amount)}</div>`;
    }

    function paintMoneyAmountWords(el, amount, align = 'center') {
        if (!el) return null;
        const alignMap = { left: 'text-start', center: 'text-center', right: 'text-end' };
        if (!shouldShowAmountInWords(amount)) {
            el.textContent = '';
            el.className = 'small text-muted d-none';
            return el;
        }
        el.className = `small text-muted ${alignMap[align] || 'text-center'}`;
        el.textContent = amountInWords(amount);
        return el;
    }

    function getCollapse(el) {
        if (!el || !global.bootstrap?.Collapse) return null;
        return global.bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
    }

    function syncMoneyExpandBtn(btn, expanded) {
        if (!btn) return;
        btn.setAttribute('aria-expanded', String(expanded));
        const labelEl = btn.querySelector('[data-money-expand-label]');
        if (labelEl) labelEl.textContent = expanded ? 'Collapse details' : 'Expand details';
    }

    function toggleMoneyAccountExpand(btn) {
        const card = btn.closest('[data-money-account-card]');
        if (!card) return;
        const details = card.querySelector('[data-money-account-details]');
        if (!details) return;
        const inst = getCollapse(details);
        const willShow = !details.classList.contains('show');
        const done = () => syncMoneyExpandBtn(btn, willShow);
        if (!inst) {
            details.classList.toggle('show', willShow);
            done();
            return;
        }
        details.addEventListener(willShow ? 'shown.bs.collapse' : 'hidden.bs.collapse', done, { once: true });
        if (willShow) inst.show();
        else inst.hide();
    }

    function syncTradeDateGroupExpand(btn, expanded) {
        if (!btn) return;
        btn.setAttribute('aria-expanded', String(expanded));
        const icon = btn.querySelector('[data-trade-date-expand-icon] i');
        if (icon) icon.classList.toggle('fa-rotate-180', expanded);
    }

    function toggleTradeDateGroupExpand(btn) {
        const group = btn.closest('[data-trade-date-group]');
        if (!group) return;
        const list = group.querySelector('[data-trade-date-list]');
        if (!list) return;
        const inst = getCollapse(list);
        const willShow = !list.classList.contains('show');
        const done = () => syncTradeDateGroupExpand(btn, willShow);
        if (!inst) {
            list.classList.toggle('show', willShow);
            done();
            return;
        }
        list.addEventListener(willShow ? 'shown.bs.collapse' : 'hidden.bs.collapse', done, { once: true });
        if (willShow) inst.show();
        else inst.hide();
    }

    function fmtMoneyRich(n, opts = {}) {
        return renderAmount(n, { size: 'md', align: 'right', ...opts });
    }

    function pnlToneClass(n, size = 'md') {
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const tone = resolveAmountTone(n, 'auto');
        return `d-inline-flex flex-column  ${AMOUNT_TONE_SHELL[tone]} ${cfg.shell} ${cfg.value}`;
    }

    function renderDateChip(label, opts = {}) {
        const { size = 'md', className = '', onclick = '', clickable = false } = opts;
        const sizeClass = size === 'sm' ? 'small' : '';
        const classes = `badge rounded-pill text-bg-light border ${sizeClass} ${className}`.trim();
        if (clickable || onclick) {
            return `<button type="button" class="${classes}"${onclick ? ` onclick="${onclick}"` : ''}>${label}</button>`;
        }
        return `<span class="${classes}">${label}</span>`;
    }

    function renderDateRangeChip(from, to, opts = {}) {
        return renderDateChip(`${fmtDateShort(from)} – ${fmtDateShort(to)}`, opts);
    }

    function paintDateChip(el, label, opts = {}) {
        if (!el) return null;
        el.outerHTML = renderDateChip(label, { ...opts, className: (opts.className || '') + (el.id ? '' : '') });
        return el;
    }

    function renderMoneyValueBlock(amountHtml, wordsHtml = '', opts = {}) {
        const { align = 'center', className = '' } = opts;
        const alignClass = align === 'left' ? 'text-start' : (align === 'right' ? 'text-end' : 'text-center');
        return `<div class="${alignClass} ${className}">${amountHtml}${wordsHtml || ''}</div>`;
    }

    const CALC_SELL_PCT_KEY = 'mtf_calc_sell_pct_presets';
    const DEFAULT_CALC_SELL_PCTS = [1, 1.35, 1.5, 2, 3, 5];

    function getCalcSellPctPresets() {
        try {
            const saved = JSON.parse(localStorage.getItem(CALC_SELL_PCT_KEY));
            if (Array.isArray(saved) && saved.length) {
                return [...new Set(saved.map((p) => parseFloat(p)).filter((p) => p > 0))].sort((a, b) => a - b);
            }
        } catch (_) {}
        return [...DEFAULT_CALC_SELL_PCTS];
    }

    function saveCalcSellPctPresets(presets) {
        localStorage.setItem(CALC_SELL_PCT_KEY, JSON.stringify(presets));
    }

    function fmtCalcPctLabel(pct) {
        const n = parseFloat(pct);
        if (!Number.isFinite(n)) return '';
        return (Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)))) + '%';
    }

    global.MTFRegister({
        fmt, fmtINR, fmtDec, parseDateInput, fmtDateDisplay, fmtDateShort, fa,
        amountInWords, shouldShowAmountInWords, renderAmount, paintAmount, renderQuantity,
        renderTotalAmountCard, paintTotalAmountCard, renderTradesCountCard, paintTradesCountCard,
        renderMoneyAmountWords, paintMoneyAmountWords, toggleMoneyAccountExpand, toggleTradeDateGroupExpand,
        fmtMoneyRich, pnlToneClass, resolveAmountTone, formatAmountNumber,
        renderDateChip, renderDateRangeChip, paintDateChip, renderMoneyValueBlock,
        getCalcSellPctPresets, saveCalcSellPctPresets, fmtCalcPctLabel,
        renderIcon: (icon, opts = {}) => fa(icon, opts.className || '')
    });
})(typeof window !== 'undefined' ? window : globalThis);
