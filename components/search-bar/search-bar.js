/**
 * M2 — Search bar molecule (icon + input + clear button).
 */
(function (global) {
    'use strict';

    const SEARCH_BAR_INPUT_CLASS = 'search-bar__input';

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
            ? `<button class="search-bar__clear hidden" type="button" id="${clearId}"${onClear ? ` onclick="${onClear}()"` : ''} title="Clear">${renderIcon('fa-times', { size: 'xs' })}</button>`
            : '';
        const capAttr = autocapitalize ? ` autocapitalize="${autocapitalize}"` : '';
        const spellAttr = spellcheck !== '' ? ` spellcheck="${spellcheck}"` : '';
        return `<div class="search-bar ${extraClass}">
            ${renderIcon('fa-search', { className: 'search-bar__icon' })}
            <input type="text" class="${inputClass}" id="${inputId}" placeholder="${placeholder}"${onInputAttr} autocomplete="off"${capAttr}${spellAttr} />
            ${clearBtn}
        </div>`;
    }

    global.MTFRegister({ renderSearchBar, SEARCH_BAR_INPUT_CLASS });
})(typeof window !== 'undefined' ? window : globalThis);
