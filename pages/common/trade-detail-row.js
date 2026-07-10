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
            valueHtml = `<span class="fw-semibold">${amount}</span>`;
        } else if (quantity) {
            valueHtml = renderQuantity(amount, { size: 'sm', align: 'right', pill: true });
        } else {
            valueHtml = renderAmount(amount, { size: 'sm', tone, decimals, compact, align: 'right', pill: true });
        }
        return `<div class="d-flex justify-content-between align-items-center gap-3 py-2 border-bottom">
            <span class="small text-muted ${labelClass}">${label}</span>
            <div class="text-end">${valueHtml}</div>
        </div>`;
    }

    global.MTFRegister({ renderTradeDetailRow });
})(typeof window !== 'undefined' ? window : globalThis);
