/**
 * M2 — Search bar molecule (icon + input + clear button).
 */
(function (global) {
    'use strict';

    const SEARCH_BAR_INPUT_CLASS =
        'input input-bordered w-full rounded-full pl-10 pr-10 h-10 min-h-10 bg-base-100 focus:outline-none focus:border-primary';

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
            ? `<button class="btn btn-ghost btn-circle btn-xs absolute right-1 top-1/2 -translate-y-1/2 hidden" type="button" id="${clearId}"${onClear ? ` onclick="${onClear}()"` : ''} title="Clear">${renderIcon('fa-times', { size: 'xs' })}</button>`
            : '';
        const capAttr = autocapitalize ? ` autocapitalize="${autocapitalize}"` : '';
        const spellAttr = spellcheck !== '' ? ` spellcheck="${spellcheck}"` : '';
        return `<div class="relative mb-3 ${extraClass}">
            ${renderIcon('fa-search', { className: 'absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none' })}
            <input type="text" class="${inputClass}" id="${inputId}" placeholder="${placeholder}"${onInputAttr} autocomplete="off"${capAttr}${spellAttr} />
            ${clearBtn}
        </div>`;
    }

    global.MTFRegister({ renderSearchBar, SEARCH_BAR_INPUT_CLASS });
})(typeof window !== 'undefined' ? window : globalThis);
