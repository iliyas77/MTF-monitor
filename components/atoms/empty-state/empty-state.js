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
            iconSize = 'text-4xl'
        } = opts;
        const py = padded ? 'py-5' : 'py-4';
        const titleHtml = title ? `<h6 class="mb-1">${title}</h6>` : '';
        const action = actionHtml ? `<div class="mt-2">${actionHtml}</div>` : '';
        const { renderIcon } = global.MTFComponents;
        return `<div class="text-center text-base-content/50 ${py}${className ? ` ${className}` : ''}">` +
            `${renderIcon(icon, { className: `${iconSize} opacity-25 block mb-2` })}` +
            `${titleHtml}<p class="mb-0 text-sm text-base-content/60">${message}</p>${action}</div>`;
    }

    global.MTFRegister({ renderEmptyState });
})(typeof window !== 'undefined' ? window : globalThis);
