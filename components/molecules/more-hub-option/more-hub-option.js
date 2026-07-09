/**
 * M18 — More hub option molecule.
 */
(function (global) {
    'use strict';

    function renderMoreHubOption(label, icon, iconVariant, onclick) {
        return `<button type="button" class="more-hub-option" onclick="${onclick}">
            <span class="more-hub-option__icon more-hub-option__icon--${iconVariant}"><i class="fas ${icon}"></i></span>
            <span class="more-hub-option__label">${label}</span>
            <i class="fas fa-chevron-right more-hub-option__chevron"></i>
        </button>`;
    }

    global.MTFRegister({ renderMoreHubOption });
})(typeof window !== 'undefined' ? window : globalThis);
