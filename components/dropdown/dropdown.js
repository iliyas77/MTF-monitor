/**
 * M3–M5 — Dropdown trigger, menu, and item molecules.
 */
(function (global) {
    'use strict';

    const { appTag } = global.MTFComponents;

    const DROPDOWN_CLASSES = {
        menu: 'dropdown-content menu app-dropdown-menu bg-base-100 border border-base-200 rounded-box z-50 p-2 min-w-[11.5rem]',
        menuFull: 'dropdown-content menu app-dropdown-menu bg-base-100 border border-base-200 rounded-box z-50 p-2 w-full',
        itemActive: 'app-dropdown-item--active',
        selectTrigger:
            'btn btn-ghost border border-base-200 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-xs font-medium h-10 min-h-10 max-w-[11rem] bg-base-100 focus:outline-none text-base-content/75',
        selectLabel: 'truncate max-w-[5.5rem]',
        selectChevron: 'fas fa-chevron-down text-[0.6rem] opacity-50 ml-auto'
    };

    const MENU_ICON_STYLES = {
        deposit: 'deposit-menu-icon',
        withdraw: 'bg-error/15 text-error',
        history: 'bg-base-200 text-base-content/60',
        view: 'bg-base-200 text-base-content/60',
        edit: 'bg-base-200 text-base-content/55',
        copy: 'bg-base-200 text-base-content/55',
        muted: 'bg-base-200 text-base-content/55',
        charges: 'bg-base-200 text-base-content/60',
        interest: 'bg-warning/20 text-warning',
        delete: 'bg-error/20 text-error',
        account: 'bg-base-200 text-base-content/60',
        broker: 'app-menu-icon--broker'
    };

    function menuIconClass(variant = 'muted') {
        return `inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs shrink-0 ${MENU_ICON_STYLES[variant] || MENU_ICON_STYLES.muted}`;
    }

    function renderMenuIcon(icon, variant = 'muted') {
        const { renderIcon } = global.MTFComponents;
        return `<span class="${menuIconClass(variant)}">${renderIcon(icon)}</span>`;
    }

    function renderActionDropdownItem(icon, variant, label, onclick, opts = {}) {
        const { danger = false, badge = '' } = opts;
        return `<li><button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200${danger ? ' text-error' : ''}" onclick="${onclick}">
            ${renderMenuIcon(icon, variant)}<span class="flex-1 text-left">${label}</span>${badge}</button></li>`;
    }

    function renderDropdownMenu(itemsHtml, opts = {}) {
        const { fullWidth = false, className = '' } = opts;
        const menuClass = fullWidth ? DROPDOWN_CLASSES.menuFull : DROPDOWN_CLASSES.menu;
        return `<ul class="${menuClass}${className ? ` ${className}` : ''}">${itemsHtml}</ul>`;
    }

    function renderSelect(opts = {}) {
        const {
            id = '',
            value = '',
            onchange = '',
            className = '',
            ariaLabel = '',
            options = [],
            fullWidth = false
        } = opts;

        if (!options.length) return '';

        const idAttr = id ? ` id="${id}"` : '';
        const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
        const changeAttr = onchange ? ` onchange="${onchange}"` : '';
        const baseClass = 'select select-bordered h-10 min-h-10 rounded-xl bg-base-100 focus:outline-none focus:border-primary';
        const widthClass = fullWidth ? ' w-full' : ' shrink-0';
        const paddingClass = ' px-4';
        const textCenterClass = ' text-center';
        const finalClass = `${baseClass}${widthClass}${paddingClass}${textCenterClass}${className ? ` ${className}` : ''}`;

        const optionsHtml = options.map(o => {
            const selected = o.value === value ? ' selected' : '';
            return `<option value="${escapeHtml(String(o.value))}"${selected}>${escapeHtml(o.label)}</option>`;
        }).join('');

        return `<select class="${finalClass}"${idAttr}${changeAttr}${ariaAttr}>${optionsHtml}</select>`;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"');
    }

    function renderDropdownTrigger(opts = {}) {
        const {
            id = '',
            labelId = '',
            iconId = '',
            label = 'Select',
            icon = 'fa-layer-group',
            iconVariant = 'muted',
            ariaLabel = '',
            fullWidth = false,
            className = ''
        } = opts;
        const triggerClass = `${DROPDOWN_CLASSES.selectTrigger}${fullWidth ? ' w-full max-w-none' : ''}${className ? ` ${className}` : ''}`;
        const idAttr = id ? ` id="${id}"` : '';
        const labelIdAttr = labelId ? ` id="${labelId}"` : '';
        const iconIdAttr = iconId ? ` id="${iconId}"` : '';
        const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
        const { renderIcon } = global.MTFComponents;
        const chevronClasses = DROPDOWN_CLASSES.selectChevron.replace(/^fas\s+fa-chevron-down\s*/, '');
        return `<button type="button" class="${triggerClass}"${idAttr} tabindex="0" role="button" aria-expanded="false"${ariaAttr}>
            <span class="${menuIconClass(iconVariant)}"${iconIdAttr}>${renderIcon(icon)}</span>
            <span class="${DROPDOWN_CLASSES.selectLabel}"${labelIdAttr}>${label}</span>
            ${renderIcon('fa-chevron-down', { className: chevronClasses })}
        </button>`;
    }

    function buildAppDropdownItems(options, selectedValue, selectHandler, escapeValues) {
        return options.map((o) => {
            const active = o.value === selectedValue ? ` ${DROPDOWN_CLASSES.itemActive}` : '';
            const danger = o.danger ? ' text-error' : '';
            const badge = o.badge ? appTag(o.badge, 'accent') : '';
            const arg = escapeValues
                ? `decodeURIComponent('${encodeURIComponent(o.value)}')`
                : `'${String(o.value).replace(/'/g, "\\'")}'`;
            return `<li><button type="button" class="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-base-200${active}${danger}" onclick="${selectHandler}(${arg})">
                ${renderMenuIcon(o.icon, o.variant || 'muted')}
                <span class="flex-1 text-left">${o.label}</span>${badge}
            </button></li>`;
        }).join('');
    }

    function syncAppSelectDropdown({ options, selectedValue, labelId, iconId, menuId, selectHandler, escapeValues }) {
        const selected = options.find((o) => o.value === selectedValue) || options[0];
        const labelEl = document.getElementById(labelId);
        const iconEl = document.getElementById(iconId);
        const menuEl = document.getElementById(menuId);
        if (labelEl) labelEl.textContent = selected.label;
        if (iconEl) {
            iconEl.className = menuIconClass(selected.variant || 'muted');
            iconEl.innerHTML = global.MTFComponents.renderIcon(selected.icon);
        }
        if (menuEl) menuEl.innerHTML = buildAppDropdownItems(options, selectedValue, selectHandler, escapeValues);
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
        buildAppDropdownItems,
        syncAppSelectDropdown
    });
})(typeof window !== 'undefined' ? window : globalThis);
