/**
 * M18 — More hub option molecule (single table row).
 */
(function (global) {
    'use strict';

    function renderMoreHubOption(label, icon, iconVariant, onclick) {
        const { renderIcon } = global.MTFComponents;
        return `<button type="button" class="more-hub-option" onclick="${onclick}">
            <span class="more-hub-option__icon more-hub-option__icon--${iconVariant}">${renderIcon(icon)}</span>
            <span class="more-hub-option__label">${label}</span>
            ${renderIcon('fa-chevron-right', { className: 'more-hub-option__chevron' })}
        </button>`;
    }

    global.MTFRegister({ renderMoreHubOption });
})(typeof window !== 'undefined' ? window : globalThis);
