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
            ? `<div class="mt-4 pt-3 border-top">
                <div class="small fw-medium text-muted mb-1">Notes</div>
                <p class="small text-muted mb-0">${tx.notes}</p>
               </div>`
            : '';

        const html = `
            <div>
                <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div class="min-w-0">
                        <div class="fw-semibold text-truncate">${tx.company}</div>
                        ${isOpen ? `<div class="mt-1">${statusLabel}</div>` : ''}
                    </div>
                    <div class="flex-shrink-0">
                        ${renderTradeCardPnl(tx.netProfit, { size: 'md', compact: true })}
                    </div>
                </div>
                ${renderTradeDetailsList(tx)}
                ${renderTradeViewPnLSummary(tx)}
                ${notesBlock}
                <div class="small text-muted mt-3 text-center">ID: ${tx.id}</div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-eye', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company}</span>`, html, '');
    }

    global.MTFRegister({ openViewModal });
})(typeof window !== 'undefined' ? window : globalThis);
