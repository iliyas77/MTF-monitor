/**
 * Shared empty-state card used across trade and list pages.
 */
(function (global) {
    'use strict';

    function renderPageEmptyCard(icon, title, message, opts = {}) {
        const { padded = true, actionHtml = '' } = opts;
        const action = actionHtml ? `<div class="mt-2">${actionHtml}</div>` : '';
        const { renderIcon } = global.MTFComponents;
        return `<div class="text-center text-base-content/60 card bg-base-100 rounded-2xl ${padded ? 'p-4' : 'py-4'}">
            ${renderIcon(icon, { className: 'mb-3' })}
            <h6>${title}</h6>
            <p class="text-sm text-base-content/60 mb-0">${message}</p>${action}
        </div>`;
    }

    global.MTFRegister({ renderPageEmptyCard });
})(typeof window !== 'undefined' ? window : globalThis);
