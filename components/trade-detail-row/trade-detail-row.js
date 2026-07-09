/**
 * M9 — Trade detail row molecule (label + amount/tag/qty value).
 */
(function (global) {
    'use strict';

    const { appTag, renderAmount, renderQuantity } = global.MTFComponents;

    function renderTradeDetailRow(opts) {
        const {
            label,
            amount,
            tone = 'neutral',
            decimals = false,
            compact = false,
            plain = false,
            quantity = false,
            tag = false,
            labelClass = ''
        } = opts;
        let valueHtml;
        if (tag) {
            valueHtml = appTag(amount, tag === true ? 'default' : tag);
        } else if (plain) {
            valueHtml = `<span class="trade-detail-row__plain tabular-nums">${amount}</span>`;
        } else if (quantity) {
            valueHtml = renderQuantity(amount, { size: 'sm', align: 'right', pill: true });
        } else {
            valueHtml = renderAmount(amount, { size: 'sm', tone, decimals, compact, align: 'right', pill: true });
        }
        return `<div class="trade-detail-row">
            <span class="trade-detail-row__label ${labelClass}">${label}</span>
            <div class="trade-detail-row__value">${valueHtml}</div>
        </div>`;
    }

    global.MTFRegister({ renderTradeDetailRow });
})(typeof window !== 'undefined' ? window : globalThis);
