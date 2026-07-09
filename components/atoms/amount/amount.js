/**
 * A4–A7 — Amount, quantity, words, total amount card.
 */
(function (global) {
    'use strict';

    const { fmt, fmtINR, fmtDec } = global.MTFComponents;

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
        const text = parts.join(' ');
        const label = Math.round(Math.abs(num)) === 1 ? 'Rupee' : 'Rupees';
        return (num < 0 ? 'Minus ' : '') + text + ' ' + label;
    }

    const AMOUNT_SIZES = {
        xs: { shell: 'px-2 py-0.5 rounded-lg', value: 'text-xs font-semibold', words: 'text-[0.65rem] mt-1' },
        sm: { shell: 'px-2 py-0.5 rounded-lg', value: 'text-sm font-semibold', words: 'text-[0.65rem] mt-1' },
        md: { shell: 'px-2.5 py-1 rounded-xl', value: 'text-base font-semibold', words: 'text-xs mt-1' },
        lg: { shell: 'px-3 py-1.5 rounded-2xl', value: 'text-3xl font-bold leading-none', words: 'text-xs mt-1' },
        xl: { shell: 'px-3 py-1.5 rounded-2xl', value: 'text-2xl font-bold leading-tight', words: 'text-xs mt-1' },
        hero: { shell: 'px-4 py-2 rounded-2xl', value: 'text-6xl font-bold leading-none', words: 'text-xs mt-1.5' }
    };

    const AMOUNT_TONE_SHELL = {
        positive: 'amount-tone--positive',
        negative: 'amount-tone--negative',
        neutral: 'amount-tone--neutral',
        secondary: 'amount-tone--secondary',
        quantity: 'amount-tone--quantity',
        warning: 'amount-tone--warning'
    };

    const AMOUNT_TONE_TEXT = {
        positive: 'amount-tone-text--positive',
        negative: 'amount-tone-text--negative',
        neutral: 'amount-tone-text--neutral',
        secondary: 'amount-tone-text--secondary',
        quantity: 'amount-tone-text--quantity',
        warning: 'amount-tone-text--warning'
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
        const valueHtml = `<span class="amount-display__value ${cfg.value} whitespace-nowrap">${formatted}</span>`;
        const pillHtml = pill
            ? `<span class="amount-display__pill inline-flex flex-col ${shellTone} ${cfg.shell}">${iconHtml}${valueHtml}</span>`
            : `<span class="amount-display__pill inline-flex flex-col ${shellTone}">${iconHtml}${valueHtml}</span>`;
        const wordsHtml = words && shouldShowAmountInWords(amount)
            ? `<span class="amount-display__words block ${cfg.words} text-base-content/55 font-normal">${amountInWords(amount)}</span>`
            : '';
        const idAttr = id ? ` id="${id}"` : '';
        const outerMb = size === 'hero' ? 'mb-3' : '';

        return `<span class="amount-display tabular-nums ${alignMap[align] || ''} ${outerMb} ${className}"${idAttr}>${pillHtml}${wordsHtml}</span>`;
    }

    function paintAmount(el, amount, opts = {}) {
        if (!el) return null;
        const html = renderAmount(amount, { ...opts, id: el.id || opts.id });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    function renderQuantity(value, opts = {}) {
        const {
            size = 'sm',
            align = 'inherit',
            pill = true,
            id = '',
            className = ''
        } = opts;
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const shellTone = pill ? AMOUNT_TONE_SHELL.quantity : AMOUNT_TONE_TEXT.quantity;
        const alignMap = {
            left: 'text-left items-start',
            center: 'text-center items-center',
            right: 'text-right items-end',
            inherit: ''
        };
        const formatted = String(value ?? '0');
        const valueHtml = `<span class="amount-display__value ${cfg.value} whitespace-nowrap">${formatted}</span>`;
        const pillHtml = pill
            ? `<span class="amount-display__pill inline-flex flex-col ${shellTone} ${cfg.shell}">${valueHtml}</span>`
            : valueHtml;
        const idAttr = id ? ` id="${id}"` : '';
        return `<span class="amount-display amount-display--quantity tabular-nums ${alignMap[align] || ''} ${className}"${idAttr}>${pillHtml}</span>`;
    }

    function renderTotalAmountCard(amount, opts = {}) {
        const {
            label = 'Total Amount',
            note = '',
            size = 'md',
            decimals = false,
            tone = 'positive',
            plain = false,
            id = '',
            className = ''
        } = opts;
        const n = Number(amount) || 0;
        const resolvedTone = resolveAmountTone(amount, tone);
        const formatted = plain
            ? String(Math.round(n))
            : formatAmountNumber(amount, { decimals });
        const sizeClass = size === 'hero' ? ' gr-total-card--hero' : (size === 'sm' ? ' gr-total-card--sm' : '');
        const toneClass = resolvedTone === 'negative'
            ? ' gr-total-card--danger'
            : (resolvedTone === 'secondary' ? ' gr-total-card--secondary' : '');
        const amountClass = resolvedTone === 'negative'
            ? 'gr-total-card__amount gr-total-card__amount--down'
            : (resolvedTone === 'neutral'
                ? 'gr-total-card__amount gr-total-card__amount--neutral'
                : (resolvedTone === 'secondary'
                    ? 'gr-total-card__amount gr-total-card__amount--secondary'
                    : 'gr-total-card__amount'));
        const labelClass = tone === 'deposit' || resolvedTone === 'secondary'
            ? 'gr-total-card__label deposit-label'
            : 'gr-total-card__label';
        const labelOut = opts.labelHtml
            ? opts.labelHtml
            : (label ? `<span class="${labelClass}">${label}</span>` : '');
        const noteHtml = note ? `<span class="gr-total-card__note">${note}</span>` : '';
        const idAttr = id ? ` id="${id}"` : '';
        return `<div class="gr-total-card tabular-nums${sizeClass}${toneClass} ${className}"${idAttr}>${labelOut}<span class="${amountClass}">${formatted}</span>${noteHtml}</div>`;
    }

    function renderTradesCountCard(count, opts = {}) {
        return renderTotalAmountCard(count, {
            labelHtml: '<span class="gr-total-card__label"><i class="fas fa-exchange-alt mr-1"></i>Trades</span>',
            size: 'sm',
            tone: 'neutral',
            plain: true,
            ...opts
        });
    }

    function paintTradesCountCard(el, count, opts = {}) {
        if (!el) return null;
        const html = renderTradesCountCard(count, { ...opts, id: el.id || opts.id });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    function paintTotalAmountCard(el, amount, opts = {}) {
        if (!el) return null;
        const html = renderTotalAmountCard(amount, { ...opts, id: el.id || opts.id });
        el.outerHTML = html;
        return el.id ? document.getElementById(el.id) : null;
    }

    function renderMoneyAmountWords(amount, align = 'center', opts = {}) {
        if (!shouldShowAmountInWords(amount)) return '';
        const { collapsible = false } = opts;
        const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' };
        const collapseClass = collapsible ? ' money-value-block__expandable money-value-block__expandable--collapsed' : '';
        return `<div class="money-amount-words ${alignMap[align] || 'text-center'}${collapseClass}">${amountInWords(amount)}</div>`;
    }

    function paintMoneyAmountWords(el, amount, align = 'center') {
        if (!el) return null;
        const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' };
        if (!shouldShowAmountInWords(amount)) {
            el.textContent = '';
            el.className = 'money-amount-words money-amount-words--hidden';
            return el;
        }
        el.className = `money-amount-words ${alignMap[align] || 'text-center'}`;
        el.textContent = amountInWords(amount);
        return el;
    }

    function syncMoneyExpandBtn(btn, expanded) {
        if (!btn) return;
        btn.setAttribute('aria-expanded', String(expanded));
        const labelEl = btn.querySelector('.money-account-expand-toggle__label');
        if (labelEl) labelEl.textContent = expanded ? 'Collapse details' : 'Expand details';
    }

    function toggleMoneyAccountExpand(btn) {
        const card = btn.closest('.money-account-card');
        if (!card) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        syncMoneyExpandBtn(btn, next);
        const details = card.querySelector('.trade-card-details');
        if (details) details.classList.toggle('trade-card-details--hidden', !next);
    }

    function syncTradeDateGroupExpand(btn, expanded) {
        if (!btn) return;
        btn.setAttribute('aria-expanded', String(expanded));
        const icon = btn.querySelector('.trade-date-group__expand-icon');
        if (icon) icon.classList.toggle('trade-date-group__expand-icon--expanded', expanded);
    }

    function toggleTradeDateGroupExpand(btn) {
        const group = btn.closest('.trade-date-group');
        if (!group) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        syncTradeDateGroupExpand(btn, next);
        group.classList.toggle('trade-date-group--expanded', next);
        const list = group.querySelector('.trade-date-group__list');
        if (list) list.classList.toggle('trade-date-group__list--hidden', !next);
    }

    function fmtMoneyRich(n, opts = {}) {
        return renderAmount(n, { size: 'md', align: 'right', ...opts });
    }

    function pnlToneClass(n, size = 'md') {
        const cfg = AMOUNT_SIZES[size] || AMOUNT_SIZES.md;
        const tone = resolveAmountTone(n, 'auto');
        return `amount-display__pill inline-flex flex-col tabular-nums ${AMOUNT_TONE_SHELL[tone]} ${cfg.shell} ${cfg.value}`;
    }

    global.MTFRegister({
        amountInWords,
        shouldShowAmountInWords,
        renderAmount,
        paintAmount,
        renderQuantity,
        renderTotalAmountCard,
        paintTotalAmountCard,
        renderTradesCountCard,
        paintTradesCountCard,
        renderMoneyAmountWords,
        paintMoneyAmountWords,
        toggleMoneyAccountExpand,
        toggleTradeDateGroupExpand,
        fmtMoneyRich,
        pnlToneClass,
        resolveAmountTone,
        formatAmountNumber
    });
})(typeof window !== 'undefined' ? window : globalThis);
