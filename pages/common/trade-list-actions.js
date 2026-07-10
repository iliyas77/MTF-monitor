/**
 * M16 — Trade list action buttons molecule (Bootstrap only).
 */
(function (global) {
    'use strict';

    const ACTION_BTN = {
        copy: 'btn-outline-secondary',
        verify: 'btn-outline-secondary',
        execute: 'btn-outline-secondary',
        done: 'btn-outline-secondary',
        edit: 'btn-outline-secondary'
    };

    function renderTradeListItemActions(t, variant = 'open') {
        const isPast = variant === 'past';
        const btn = (label, onclick, tone, icon) => {
            const toneClass = ACTION_BTN[tone] || ACTION_BTN.edit;
            const iconHtml = icon ? `<i class="fas ${icon} me-1" aria-hidden="true"></i>` : '';
            return `<button type="button" class="btn btn-sm ${toneClass} flex-fill" onclick="${onclick}">${iconHtml}${label}</button>`;
        };
        const copyBtn = isPast ? btn('Copy', `confirmCopy('${t.id}')`, 'copy', 'fa-copy') : '';
        const verifyBtn = isPast && !t.verified
            ? btn('Verified', `confirmVerifyTrade('${t.id}')`, 'verify', 'fa-check-circle')
            : '';
        const executeBtn = variant === 'plan'
            ? btn('Executed', `confirmExecuteTrade('${t.id}')`, 'execute', 'fa-play')
            : '';
        const doneBtn = variant === 'open'
            ? btn('Done', `confirmCloseTrade('${t.id}')`, 'done', 'fa-check')
            : '';
        return `
            <div class="d-flex gap-2 w-100">
                ${copyBtn}
                ${verifyBtn}
                ${executeBtn}
                ${doneBtn}
                ${btn('Edit', `openEditModal('${t.id}')`, 'edit', 'fa-edit')}
            </div>
        `;
    }

    global.MTFRegister({ renderTradeListItemActions });
})(typeof window !== 'undefined' ? window : globalThis);
