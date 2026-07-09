/**
 * A11 — Date field atom (chip-style native date picker).
 */
(function (global) {
    'use strict';

    const { fmtDateDisplay } = global.MTFComponents;

    function syncDateFieldDisplay(input) {
        if (!input) return;
        const wrap = input.closest('.app-date-field');
        if (!wrap) return;
        const textEl = wrap.querySelector('.app-date-field__text');
        if (!textEl) return;
        const val = input.value;
        textEl.textContent = val ? fmtDateDisplay(val) : 'Select date';
        wrap.classList.toggle('app-date-field--empty', !val);
    }

    function wireDateField(input) {
        if (!input || input.type !== 'date' || input.dataset.dateFieldWired === '1') return input;
        input.dataset.dateFieldWired = '1';

        const isSm = input.classList.contains('input-sm');
        const useInputStyle = input.classList.contains('input');
        const wrap = document.createElement('div');
        wrap.className = 'app-date-field' + (isSm ? ' app-date-field--sm' : '');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'app-date-field__trigger app-date-chip app-date-chip--clickable';
        if (useInputStyle) {
            trigger.classList.add('input', 'input-bordered', 'w-full');
            if (isSm) trigger.classList.add('input-sm');
            if (input.classList.contains('rounded-xl')) trigger.classList.add('rounded-xl');
        }
        const labelText = input.getAttribute('aria-label')
            || input.closest('div')?.querySelector('label')?.textContent?.replace(/\*/g, '').trim()
            || 'Select date';
        trigger.setAttribute('aria-label', labelText);
        trigger.innerHTML =
            '<i class="far fa-calendar app-date-chip__icon" aria-hidden="true"></i>' +
            '<span class="app-date-chip__text app-date-field__text">Select date</span>';

        const parent = input.parentNode;
        parent.insertBefore(wrap, input);
        wrap.appendChild(trigger);
        wrap.appendChild(input);

        input.className = 'app-date-field__input';
        input.setAttribute('tabindex', '-1');

        const openPicker = () => {
            try {
                input.focus({ preventScroll: true });
                if (typeof input.showPicker === 'function') input.showPicker();
                else input.click();
            } catch (_) {
                input.click();
            }
        };

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            openPicker();
        });
        wrap.addEventListener('click', () => openPicker());
        input.addEventListener('input', () => syncDateFieldDisplay(input));
        input.addEventListener('change', () => syncDateFieldDisplay(input));
        syncDateFieldDisplay(input);
        return input;
    }

    function setDateInputValue(input, value) {
        if (!input) return;
        input.value = value || '';
        syncDateFieldDisplay(input);
    }

    function initDateFields(root) {
        const scope = root || document;
        scope.querySelectorAll('input[type="date"]:not([data-date-field-wired="1"])').forEach(wireDateField);
    }

    global.MTFRegister({
        syncDateFieldDisplay,
        wireDateField,
        setDateInputValue,
        initDateFields
    });
})(typeof window !== 'undefined' ? window : globalThis);
