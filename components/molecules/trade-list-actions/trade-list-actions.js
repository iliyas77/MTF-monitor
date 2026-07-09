/**
 * M16 — Trade list action buttons molecule.
 */
(function (global) {
    'use strict';

    const { renderAppButton } = global.MTFComponents;

    function renderTradeListItemActions(t, variant = 'open') {
        const isPast = variant === 'past';
        const btn = (label, onclick, btnVariant = 'tonal', icon = '', className = 'trade-list-item__action-btn') =>
            renderAppButton(label, { variant: btnVariant, size: 'sm', onclick, icon, className });
        const copyBtn = isPast ? btn('Copy', `confirmCopy('${t.id}')`, 'tonal', 'fa-copy') : '';
        const verifyBtn = isPast && !t.verified
            ? btn('Verified', `confirmVerifyTrade('${t.id}')`, 'tonal', 'fa-check-circle')
            : '';
        const executeBtn = variant === 'plan'
            ? btn('Executed', `confirmExecuteTrade('${t.id}')`, 'tonal', 'fa-play')
            : '';
        const doneBtn = variant === 'open'
            ? btn('Done', `confirmCloseTrade('${t.id}')`, 'tonal', 'fa-check')
            : '';
        return `
            <div class="trade-list-item__actions">
                <div class="trade-list-item__actions-main">
                    ${copyBtn}
                    ${verifyBtn}
                    ${executeBtn}
                    ${doneBtn}
                    ${btn('Edit', `openEditModal('${t.id}')`, 'tonal', 'fa-edit')}
                </div>
            </div>
        `;
    }

    global.MTFRegister({ renderTradeListItemActions });
})(typeof window !== 'undefined' ? window : globalThis);
