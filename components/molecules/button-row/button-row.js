/**
 * M1 — Cancel + action button row molecule.
 */
(function (global) {
    'use strict';

    const { renderAppButton } = global.MTFComponents;

    function renderAppButtonRow(cancelLabel, actionLabel, opts = {}) {
        const {
            cancelOnClick = '',
            actionOnClick = '',
            actionId = '',
            actionVariant = 'action',
            actionIcon = '',
            actionLabelHtml = '',
            cancelInForm = true,
            rowClass = ''
        } = opts;
        const cancelBtn = renderAppButton(cancelLabel, {
            variant: 'cancel',
            flex: true,
            fullWidth: true,
            submit: cancelInForm && !cancelOnClick,
            onclick: cancelOnClick || undefined
        });
        const cancelHtml = cancelInForm && !cancelOnClick
            ? `<form method="dialog" class="flex-1 min-w-0">${cancelBtn}</form>`
            : cancelBtn;
        const actionBtn = renderAppButton(actionLabel, {
            variant: actionVariant,
            id: actionId,
            onclick: actionOnClick || undefined,
            icon: actionIcon,
            labelHtml: actionLabelHtml,
            flex: true
        });
        return `<div class="app-btn-row ${rowClass}">${cancelHtml}${actionBtn}</div>`;
    }

    global.MTFRegister({ renderAppButtonRow });
})(typeof window !== 'undefined' ? window : globalThis);
