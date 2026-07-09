/**
 * M6 — Money value block molecule (amount + optional words wrapper).
 */
(function (global) {
    'use strict';

    const { renderMoneyAmountWords, paintMoneyAmountWords } = global.MTFComponents;

    const MONEY_VALUE_ALIGN = {
        left: 'money-value-block--left',
        center: 'money-value-block--center',
        right: 'money-value-block--right'
    };

    function renderMoneyValueBlock(contentHtml, opts = {}) {
        const { align = 'center', className = '', id = '' } = opts;
        const alignClass = MONEY_VALUE_ALIGN[align] || MONEY_VALUE_ALIGN.center;
        const idAttr = id ? ` id="${id}"` : '';
        return `<div class="money-value-block ${alignClass}${className ? ` ${className}` : ''}"${idAttr}>${contentHtml}</div>`;
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
