/**
 * Bootstrap helpers: Modal/Toast/loading + thin Bootstrap HTML builders.
 * Not a component system — just shared strings and API wrappers.
 */
/**
 * Bootstrap JS API helpers — Modal, Toast.
 */
(function (global) {
    'use strict';

    const bs = () => global.bootstrap;

    function getModal(el) {
        if (!el || !bs()) return null;
        return bs().Modal.getOrCreateInstance(el);
    }

    function showModal(el) {
        const inst = getModal(el);
        if (inst) inst.show();
    }

    function hideModal(el) {
        const inst = getModal(el);
        if (inst) inst.hide();
    }

    function onModalHidden(el, fn) {
        if (!el || typeof fn !== 'function') return;
        el.addEventListener('hidden.bs.modal', fn);
    }

    function showBootstrapToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container || !bs()) return;
        const bgClass = type === 'danger' ? 'text-bg-danger'
            : type === 'warning' ? 'text-bg-warning'
            : type === 'info' ? 'text-bg-info'
            : 'text-bg-success';
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center ${bgClass} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
        container.appendChild(toastEl);
        // `new bs().Toast(...)` parses as `(new bs()).Toast(...)` and throws.
        const Toast = bs().Toast;
        const toast = Toast.getOrCreateInstance(toastEl, { delay: 3500 });
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        toast.show();
    }

    global.MTFRegister({
        getModal,
        showModal,
        hideModal,
        onModalHidden,
        showBootstrapToast
    });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A35 — Toast atom (Bootstrap).
 */
(function (global) {
    'use strict';

    const TOAST_COLORS = {
        success: 'text-bg-success',
        danger: 'text-bg-danger',
        warning: 'text-bg-warning',
        info: 'text-bg-info'
    };

    function showToast(msg, type = 'success') {
        const { showBootstrapToast } = global.MTFComponents;
        if (showBootstrapToast) showBootstrapToast(msg, type);
    }

    global.MTFRegister({ showToast, TOAST_COLORS });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * O24 — Loading overlay organism (Bootstrap).
 */
(function (global) {
    'use strict';

    let loadingCount = 0;

    function showLoading(label) {
        loadingCount++;
        if (loadingCount === 1) {
            const el = document.getElementById('appLoading');
            if (el) {
                if (label) {
                    const labelEl = el.querySelector('#appLoadingLabel');
                    if (labelEl) labelEl.textContent = label;
                }
                el.classList.remove('d-none');
                el.classList.add('d-flex');
                el.setAttribute('aria-busy', 'true');
            }
        }
    }

    function hideLoading() {
        loadingCount = Math.max(0, loadingCount - 1);
        if (loadingCount === 0) {
            const el = document.getElementById('appLoading');
            if (el) {
                el.classList.add('d-none');
                el.classList.remove('d-flex');
                el.setAttribute('aria-busy', 'false');
            }
        }
    }

    global.MTFRegister({ showLoading, hideLoading });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A11 — Date field atom (chip-style native date picker).
 */
(function (global) {
    'use strict';

    const { fmtDateDisplay } = global.MTFComponents;

    function syncDateFieldDisplay(input) {
        if (!input) return;
        const wrap = input.closest('[data-date-field]');
        if (!wrap) return;
        const textEl = wrap.querySelector('[data-date-field-text]');
        if (!textEl) return;
        const val = input.value;
        textEl.textContent = val ? fmtDateDisplay(val) : 'Select date';
        wrap.classList.toggle('text-muted', !val);
    }

    function wireDateField(input) {
        if (!input || input.type !== 'date' || input.dataset.dateFieldWired === '1') return input;
        input.dataset.dateFieldWired = '1';

        const isSm = input.classList.contains('form-control-sm');
        const wrap = document.createElement('div');
        wrap.className = 'position-relative' + (isSm ? ' small' : '');
        wrap.setAttribute('data-date-field', '');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'btn btn-outline-secondary w-100 text-start d-flex align-items-center gap-2';
        if (isSm) trigger.classList.add('btn-sm');
        const labelText = input.getAttribute('aria-label')
            || input.closest('div')?.querySelector('label')?.textContent?.replace(/\*/g, '').trim()
            || 'Select date';
        trigger.setAttribute('aria-label', labelText);
        trigger.innerHTML =
            '<i class="far fa-calendar me-1 text-primary" aria-hidden="true"></i>' +
            '<span data-date-field-text>Select date</span>';

        const parent = input.parentNode;
        parent.insertBefore(wrap, input);
        wrap.appendChild(trigger);
        wrap.appendChild(input);

        input.className = 'form-control visually-hidden';
        if (isSm) input.classList.add('form-control-sm');
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
/**
 * A14 — App button atom (Bootstrap).
 */
(function (global) {
    'use strict';

    const APP_BUTTON_VARIANTS = {
        cancel: 'btn-outline-secondary',
        action: 'btn-primary',
        danger: 'btn-danger',
        tonal: 'btn-light',
        'primary-tonal': 'btn-primary',
        'tonal-danger': 'btn-outline-danger'
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
            disabled = false,
            dismiss = ''
        } = opts;
        const resolved = resolveAppButtonVariant(variant);
        const btnType = submit ? 'submit' : type;
        const iconHtml = icon ? `<i class="fas ${icon} me-1" aria-hidden="true"></i>` : '';
        const inner = labelHtml || `${iconHtml}${label}`;
        const idAttr = id ? ` id="${id}"` : '';
        const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
        const disabledAttr = disabled ? ' disabled' : '';
        const dismissAttr = dismiss ? ` data-bs-dismiss="${dismiss}"` : '';
        const sizeClass = size === 'sm' ? 'btn-sm' : '';
        const widthClass = fullWidth ? 'w-100' : '';
        const flexClass = flex ? 'flex-fill' : '';
        const classes = ['btn', APP_BUTTON_VARIANTS[resolved], sizeClass, widthClass, flexClass, className].filter(Boolean).join(' ');
        return `<button type="${btnType}" class="${classes}"${idAttr}${onclickAttr}${dismissAttr}${disabledAttr}>${inner}</button>`;
    }

    function paintAppButton(el, label, opts = {}) {
        if (!el) return null;
        const html = renderAppButton(label, { ...opts, id: el.id || opts.id, flex: opts.flex ?? el.classList.contains('flex-fill') });
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
/**
 * M1 — Cancel + action button row molecule (Bootstrap).
 */
(function (global) {
    'use strict';

    const { renderAppButton } = global.MTFComponents;

    function renderAppButtonRow(cancelLabel, actionLabel, opts = {}) {
        const {
            cancelOnClick = '',
            actionOnClick = '',
            actionId = '',
            actionVariant = 'action',
            actionIcon = '',
            actionLabelHtml = '',
            cancelDismiss = '',
            rowClass = ''
        } = opts;
        const cancelBtn = renderAppButton(cancelLabel, {
            variant: 'cancel',
            flex: true,
            className: 'text-nowrap',
            onclick: cancelOnClick || undefined,
            dismiss: cancelDismiss || undefined
        });
        const actionBtn = renderAppButton(actionLabel, {
            variant: actionVariant,
            id: actionId,
            onclick: actionOnClick || undefined,
            icon: actionIcon,
            labelHtml: actionLabelHtml,
            flex: true,
            className: 'text-nowrap'
        });
        return `<div class="d-flex align-items-stretch gap-2 w-100 ${rowClass}">${cancelBtn}${actionBtn}</div>`;
    }

    global.MTFRegister({ renderAppButtonRow });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A3 — Badge / tag atom (Bootstrap).
 */
(function (global) {
    'use strict';

    const APP_TAG_CLASSES = {
        default: 'badge rounded-pill text-bg-light border',
        accent: 'badge rounded-pill text-bg-primary',
        secondary: 'badge rounded-pill text-bg-secondary',
        success: 'badge rounded-pill text-bg-success',
        broker: 'badge rounded-pill text-bg-success flex-shrink-0',
        error: 'badge rounded-pill text-bg-danger',
        warning: 'badge rounded-pill text-bg-warning'
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

    global.MTFRegister({ appTag, setAppTagElement, APP_TAG_CLASSES });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A2 — Label atom (Bootstrap).
 */
(function (global) {
    'use strict';

    const LABEL_CLASSES = {
        stat: 'small text-muted text-uppercase fw-medium',
        sheet: 'form-label small text-muted text-uppercase',
        field: 'form-label',
        section: 'small text-muted text-uppercase fw-medium mb-2',
        tradeStat: 'small text-muted text-uppercase fw-medium',
        overline: 'small text-muted text-uppercase fw-medium',
        deposit: 'form-label',
        quantity: 'form-label',
        buyPrice: 'form-label'
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
        const content = html || (icon ? `${renderIcon(icon, { className: 'me-1' })}${text}` : text);
        return `<${tag} class="${cls}${className ? ` ${className}` : ''}"${forAttr}>${content}</${tag}>`;
    }

    global.MTFRegister({
        LABEL_CLASSES,
        renderLabel
    });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A15 — Icon button atom (circle ghost buttons).
 */
(function (global) {
    'use strict';

    const ICON_BUTTON_CLASSES = {
        default: 'btn btn-outline-secondary btn-sm rounded-circle flex-shrink-0 text-muted p-0',
        sm: 'btn btn-outline-secondary btn-sm rounded-circle flex-shrink-0 p-0',
        xs: 'btn btn-outline-secondary btn-sm rounded-circle flex-shrink-0 opacity-75 p-0',
        toolbar: 'btn btn-outline-secondary btn-sm rounded-circle bg-body text-muted p-0',
        sub: 'btn btn-outline-secondary btn-sm rounded-circle flex-shrink-0 p-0'
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
        const { renderIcon } = global.MTFComponents;
        return `<button type="${type}" class="${base}${className ? ` ${className}` : ''}" style="width:2.25rem;height:2.25rem"${idAttr}${onclickAttr}${titleAttr}${ariaAttr}${disabledAttr}>${renderIcon(icon, { size: 'sm' })}</button>`;
    }

    global.MTFRegister({
        ICON_BUTTON_CLASSES,
        renderIconButton
    });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * A36 — Empty state atom.
 */
(function (global) {
    'use strict';

    function renderEmptyState(icon, message, opts = {}) {
        const {
            title = '',
            className = '',
            actionHtml = '',
            padded = true,
            iconSize = 'fs-1'
        } = opts;
        const py = padded ? 'py-5' : 'py-4';
        const titleHtml = title ? `<h6 class="mb-1">${title}</h6>` : '';
        const action = actionHtml ? `<div class="mt-2">${actionHtml}</div>` : '';
        const { renderIcon } = global.MTFComponents;
        return `<div class="text-center text-muted ${py}${className ? ` ${className}` : ''}">` +
            `${renderIcon(icon, { className: `${iconSize} opacity-25 d-block mb-2` })}` +
            `${titleHtml}<p class="mb-0 small text-muted">${message}</p>${action}</div>`;
    }

    global.MTFRegister({ renderEmptyState });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * Shared empty-state card used across trade and list pages.
 */
(function (global) {
    'use strict';

    function renderPageEmptyCard(icon, title, message, opts = {}) {
        const { padded = true, actionHtml = '' } = opts;
        const action = actionHtml ? `<div class="mt-2">${actionHtml}</div>` : '';
        const { renderIcon } = global.MTFComponents;
        return `<div class="text-center text-muted ${padded ? 'p-4' : 'py-4'}">
            ${renderIcon(icon, { className: 'mb-3 opacity-50' })}
            <h6 class="mb-1">${title}</h6>
            <p class="small text-muted mb-0">${message}</p>${action}
        </div>`;
    }

    global.MTFRegister({ renderPageEmptyCard });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * M2 — Search bar molecule (icon + input + clear button).
 */
(function (global) {
    'use strict';

    const SEARCH_BAR_INPUT_CLASS = 'form-control border-0 bg-transparent shadow-none px-0';

    function renderSearchBar(opts = {}) {
        const {
            inputId,
            clearId = '',
            placeholder = 'Search...',
            onInput = '',
            onClear = '',
            extraClass = '',
            inputClass = SEARCH_BAR_INPUT_CLASS,
            autocapitalize = '',
            spellcheck = ''
        } = opts;

        const { renderIcon } = global.MTFComponents;

        const onInputAttr = onInput ? ` oninput="${onInput}(this.value)"` : '';
        const clearBtn = clearId
            ? `<button type="button" class="btn btn-sm border-0 rounded-circle text-secondary d-none flex-shrink-0 p-1" id="${clearId}"${onClear ? ` onclick="${onClear}()"` : ''} title="Clear" aria-label="Clear">${renderIcon('fa-times', { size: 'xs' })}</button>`
            : '';
        const capAttr = autocapitalize ? ` autocapitalize="${autocapitalize}"` : '';
        const spellAttr = spellcheck !== '' ? ` spellcheck="${spellcheck}"` : '';
        return `<div class="d-flex align-items-center gap-2 bg-body-secondary rounded-pill px-3 py-1 ${extraClass}">
            <span class="text-secondary flex-shrink-0" aria-hidden="true">${renderIcon('fa-search')}</span>
            <div class="flex-grow-1 min-w-0">
                <input type="text" class="${inputClass}" id="${inputId}" placeholder="${placeholder}"${onInputAttr} autocomplete="off"${capAttr}${spellAttr} />
            </div>
            ${clearBtn}
        </div>`;
    }

    global.MTFRegister({ renderSearchBar, SEARCH_BAR_INPUT_CLASS });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * M3–M5 — Dropdown trigger, menu, and item molecules (Bootstrap).
 */
(function (global) {
    'use strict';

    const DROPDOWN_CLASSES = {
        menu: 'dropdown-menu dropdown-menu-end shadow-sm',
        menuFull: 'dropdown-menu w-100 shadow-sm',
        itemActive: 'active',
        selectTrigger: 'btn btn-outline-secondary btn-sm dropdown-toggle',
        selectLabel: '',
        selectChevron: ''
    };

    const MENU_ICON_STYLES = {
        deposit: 'bg-success-subtle text-success',
        withdraw: 'bg-danger-subtle text-danger',
        history: 'bg-light text-muted',
        view: 'bg-light text-muted',
        edit: 'bg-light text-muted',
        copy: 'bg-light text-muted',
        muted: 'bg-light text-muted',
        charges: 'bg-light text-muted',
        interest: 'bg-warning-subtle text-warning',
        delete: 'bg-danger-subtle text-danger',
        account: 'bg-light text-muted',
        broker: 'bg-light text-muted'
    };

    function menuIconClass(variant = 'muted') {
        return `d-inline-flex align-items-center justify-content-center rounded ${MENU_ICON_STYLES[variant] || MENU_ICON_STYLES.muted}`;
    }

    function renderMenuIcon(icon, variant = 'muted') {
        const { renderIcon } = global.MTFComponents;
        return `<span class="${menuIconClass(variant)}" style="width:2rem;height:2rem;font-size:0.75rem">${renderIcon(icon)}</span>`;
    }

    function renderActionDropdownItem(icon, variant, label, onclick, opts = {}) {
        const { danger = false, badge = '' } = opts;
        return `<li><button type="button" class="dropdown-item d-flex align-items-center gap-2${danger ? ' text-danger' : ''}" onclick="${onclick}">
            ${renderMenuIcon(icon, variant)}<span class="flex-fill text-start">${label}</span>${badge}</button></li>`;
    }

    function renderDropdownMenu(itemsHtml, opts = {}) {
        const { fullWidth = false, className = '' } = opts;
        const menuClass = fullWidth ? DROPDOWN_CLASSES.menuFull : DROPDOWN_CLASSES.menu;
        return `<ul class="${menuClass}${className ? ` ${className}` : ''}">${itemsHtml}</ul>`;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function dropdownValueArg(value, escapeValues) {
        if (escapeValues) return `decodeURIComponent('${encodeURIComponent(value)}')`;
        return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    /** Bootstrap select dropdown — same pattern as Past PnL (toggle shows selected label). */
    function renderAppSelectDropdown(opts = {}) {
        const {
            id = '',
            value = '',
            options = [],
            selectHandler = '',
            onchange = '',
            ariaLabel = '',
            fullWidth = false,
            menuEnd = true,
            escapeValues = false,
            className = '',
            size = 'sm'
        } = opts;

        if (!options.length) return '';

        const handler = selectHandler || (onchange
            ? String(onchange).replace(/\(this\.value\)\s*$/, '').replace(/\(\)$/, '')
            : '');
        const selected = options.find((o) => o.value === value) || options[0];
        const sizeClass = size === 'sm' ? ' btn-sm' : '';
        const triggerClass = `btn btn-outline-secondary${sizeClass} dropdown-toggle${fullWidth ? ' w-100' : ''}${className ? ` ${className}` : ''}`;
        const menuClass = fullWidth
            ? DROPDOWN_CLASSES.menuFull
            : (menuEnd ? DROPDOWN_CLASSES.menu : 'dropdown-menu shadow-sm');
        const idAttr = id ? ` id="${id}"` : '';
        const menuIdAttr = id ? ` id="${id}Menu"` : '';
        const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
        const displayAttr = fullWidth ? ' data-bs-display="static"' : '';

        const items = options.map((o) => {
            const active = o.value === selected.value ? ` ${DROPDOWN_CLASSES.itemActive}` : '';
            const danger = o.danger ? ' text-danger' : '';
            const click = handler
                ? ` onclick="${handler}(${dropdownValueArg(o.value, escapeValues)});event.stopPropagation();"`
                : '';
            return `<li><button type="button" class="dropdown-item${active}${danger}"${click}>${escapeHtml(o.label)}</button></li>`;
        }).join('');

        return `<div class="dropdown${fullWidth ? ' w-100' : ''}"${displayAttr}>
            <button type="button" class="${triggerClass}"${idAttr} data-bs-toggle="dropdown" aria-expanded="false"${ariaAttr}>${escapeHtml(selected.label)}</button>
            <ul class="${menuClass}"${menuIdAttr}>${items}</ul>
        </div>`;
    }

    function renderSelect(opts = {}) {
        return renderAppSelectDropdown(opts);
    }

    function renderDropdownTrigger(opts = {}) {
        const {
            id = '',
            label = 'Select',
            ariaLabel = '',
            fullWidth = false,
            className = ''
        } = opts;
        const triggerClass = `${DROPDOWN_CLASSES.selectTrigger}${fullWidth ? ' w-100' : ''}${className ? ` ${className}` : ''}`;
        const idAttr = id ? ` id="${id}"` : '';
        const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
        return `<button type="button" class="${triggerClass}"${idAttr} data-bs-toggle="dropdown" aria-expanded="false"${ariaAttr}>${escapeHtml(label)}</button>`;
    }

    function buildAppDropdownItems(options, selectedValue, selectHandler, escapeValues) {
        return options.map((o) => {
            const active = o.value === selectedValue ? ` ${DROPDOWN_CLASSES.itemActive}` : '';
            const danger = o.danger ? ' text-danger' : '';
            return `<li><button type="button" class="dropdown-item${active}${danger}" onclick="${selectHandler}(${dropdownValueArg(o.value, escapeValues)});event.stopPropagation();">${escapeHtml(o.label)}</button></li>`;
        }).join('');
    }

    function syncAppSelectDropdown({
        options,
        selectedValue,
        hostId,
        id = '',
        selectHandler,
        escapeValues,
        ariaLabel = '',
        fullWidth = false,
        menuEnd = true,
        labelId,
        menuId
    }) {
        const host = hostId ? document.getElementById(hostId) : null;
        if (host) {
            host.innerHTML = renderAppSelectDropdown({
                id,
                value: selectedValue,
                options,
                selectHandler,
                escapeValues,
                ariaLabel,
                fullWidth,
                menuEnd
            });
            return;
        }
        const selected = options.find((o) => o.value === selectedValue) || options[0];
        const labelEl = labelId ? document.getElementById(labelId) : null;
        const menuEl = menuId ? document.getElementById(menuId) : null;
        if (labelEl) labelEl.textContent = selected ? selected.label : '';
        if (menuEl) {
            if (!menuEl.classList.contains('dropdown-menu')) {
                menuEl.className = fullWidth ? DROPDOWN_CLASSES.menuFull : DROPDOWN_CLASSES.menu;
            }
            menuEl.innerHTML = buildAppDropdownItems(options, selectedValue, selectHandler, escapeValues);
            const trigger = menuEl.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"]');
            if (trigger && global.bootstrap?.Dropdown) {
                const inst = global.bootstrap.Dropdown.getInstance(trigger);
                if (inst) inst.hide();
            }
        }
    }

    function hideOpenDropdowns(root) {
        const scope = root || document;
        scope.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((trigger) => {
            const inst = global.bootstrap?.Dropdown?.getInstance(trigger);
            if (inst) inst.hide();
        });
    }

    global.MTFRegister({
        DROPDOWN_CLASSES,
        MENU_ICON_STYLES,
        menuIconClass,
        renderMenuIcon,
        renderActionDropdownItem,
        renderDropdownMenu,
        renderDropdownTrigger,
        renderSelect,
        renderAppSelectDropdown,
        buildAppDropdownItems,
        syncAppSelectDropdown,
        hideOpenDropdowns
    });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * M34 — Form field group molecule (Bootstrap).
 */
(function (global) {
    'use strict';

    const { LABEL_CLASSES } = global.MTFComponents;

    function renderDetailRow(label, value, extra = '') {
        return `<div class="d-flex justify-content-between gap-3 py-2 border-bottom ${extra}"><span class="small text-muted">${label}</span><span class="fs-6 fw-medium text-end">${value}</span></div>`;
    }

    function renderFormField(label, controlHtml, opts = {}) {
        const {
            required = false,
            hint = '',
            className = 'mb-3',
            labelVariant = 'field',
            labelClass = '',
            forId = ''
        } = opts;
        const req = required ? ' <span class="text-danger">*</span>' : '';
        const hintHtml = hint ? `<div class="form-text">${hint}</div>` : '';
        const cls = LABEL_CLASSES[labelVariant] || LABEL_CLASSES.field;
        const forAttr = forId ? ` for="${forId}"` : '';
        return `<div class="${className}">
            <label class="${cls}${labelClass ? ` ${labelClass}` : ''}"${forAttr}>${label}${req}</label>
            ${controlHtml}
            ${hintHtml}
        </div>`;
    }

    global.MTFRegister({ renderFormField, renderDetailRow });
})(typeof window !== 'undefined' ? window : globalThis);
/**
 * M6 — Money value block molecule (amount + optional words wrapper).
 */
(function (global) {
    'use strict';

    const { renderMoneyAmountWords, paintMoneyAmountWords } = global.MTFComponents;

    const MONEY_VALUE_ALIGN = {
        left: 'align-items-start text-start',
        center: 'align-items-center text-center',
        right: 'align-items-end text-end'
    };

    function renderMoneyValueBlock(contentHtml, opts = {}) {
        const { align = 'center', className = '', id = '' } = opts;
        const alignClass = MONEY_VALUE_ALIGN[align] || MONEY_VALUE_ALIGN.center;
        const idAttr = id ? ` id="${id}"` : '';
        return `<div class="d-flex flex-column min-w-0 ${alignClass}${className ? ` ${className}` : ''}"${idAttr}>${contentHtml}</div>`;
    }

    function renderMoneyValueBlockWithWords(amountHtml, amount, opts = {}) {
        const { align = 'center', wordsAlign = align, collapsible = false, ...blockOpts } = opts;
        const wordsHtml = renderMoneyAmountWords(amount, wordsAlign, { collapsible });
        return renderMoneyValueBlock(`${amountHtml}${wordsHtml}`, { align, ...blockOpts });
    }

    function paintMoneyValueBlockWords(wordsEl, amount, align = 'center') {
        return paintMoneyAmountWords(wordsEl, amount, align);
    }

    global.MTFRegister({
        MONEY_VALUE_ALIGN,
        renderMoneyValueBlock,
        renderMoneyValueBlockWithWords,
        paintMoneyValueBlockWords
    });
})(typeof window !== 'undefined' ? window : globalThis);
