/**
 * M34 — Form field group molecule (label + control + optional hint).
 */
(function (global) {
    'use strict';

    const { LABEL_CLASSES } = global.MTFComponents;

    function renderDetailRow(label, value, extra = '') {
        return `<div class="flex justify-between gap-4 py-2 border-b border-base-200 ${extra}"><span class="text-sm text-base-content/55">${label}</span><span class="text-sm font-medium text-base-content/80 text-right">${value}</span></div>`;
    }

    function renderFormField(label, controlHtml, opts = {}) {
        const {
            required = false,
            hint = '',
            className = 'mb-3',
            labelVariant = 'field',
            labelClass = '',
            forId = ''
        } = opts;
        const req = required ? ' <span class="text-error">*</span>' : '';
        const hintHtml = hint ? `<div class="label-text-alt">${hint}</div>` : '';
        const cls = LABEL_CLASSES[labelVariant] || LABEL_CLASSES.field;
        const forAttr = forId ? ` for="${forId}"` : '';
        return `<div class="${className}">
            <label class="${cls}${labelClass ? ` ${labelClass}` : ''}"${forAttr}>${label}${req}</label>
            ${controlHtml}
            ${hintHtml}
        </div>`;
    }

    global.MTFRegister({ renderFormField, renderDetailRow });
})(typeof window !== 'undefined' ? window : globalThis);
