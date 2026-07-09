/**
 * O33 — Trade view detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        renderTradeCardPnl,
        renderTradeDetailsList,
        renderTradeViewPnLSummary,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openViewModal(id) {
        const { getTransaction, resolveTradeForDisplay } = tradeSheets();
        const raw = getTransaction ? getTransaction(id) : null;
        if (!raw) { showToast('Transaction not found.', 'danger'); return; }
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(raw) : raw;

        const isOpen = (tx.status || 'closed') === 'open';
        const statusLabel = isOpen ? appTag('Open', 'warning') : appTag('Closed');
        const notesBlock = tx.notes
            ? `<div class="trade-view-sheet__notes mt-4 pt-4 border-t border-base-200">
                <div class="text-sm font-medium text-base-content/70 mb-1">Notes</div>
                <p class="text-sm text-base-content/60 mb-0">${tx.notes}</p>
               </div>`
            : '';

        const html = `
            <div class="trade-view-sheet">
                <div class="trade-card-header mb-3">
                    <div class="min-w-0">
                        <div class="trade-card-header__title">${tx.company}</div>
                        ${isOpen ? `<div class="mt-1.5">${statusLabel}</div>` : ''}
                    </div>
                    <div class="trade-card-header__actions">
                        ${renderTradeCardPnl(tx.netProfit, { size: 'md', compact: true, className: 'trade-card-header__pnl', groupClass: 'trade-card-header__pnl-group' })}
                    </div>
                </div>
                ${renderTradeDetailsList(tx)}
                ${renderTradeViewPnLSummary(tx)}
                ${notesBlock}
                <div class="text-xs text-base-content/45 mt-3 text-center">ID: ${tx.id}</div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-eye', { className: 'mr-2' })}${tx.company}`, html, '');
    }

    global.MTFRegister({ openViewModal });
})(typeof window !== 'undefined' ? window : globalThis);
