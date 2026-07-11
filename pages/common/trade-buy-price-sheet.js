/**
 * O37 — Buy price edit sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        renderAppButtonRow,
        showToast,
        Sheet
    } = global.MTFComponents;

    let buyPriceModalTradeId = null;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openBuyPriceModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        buyPriceModalTradeId = id;
        const bp = Number(tx.buyPrice) || 0;
        Sheet.open(`${global.MTFComponents.renderIcon('fa-tag', { className: 'me-1 text-primary flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Buy</span>`, `
            <p class="small text-muted mb-3">Update buy price. Margin, charges, and P&L will recalculate.</p>
            <div class="mb-3">
                <label class="form-label small text-primary mb-1">Buy Price</label>
                <input type="number" class="form-control w-100" id="buyPriceModalInput" min="0.01" step="0.01" value="${bp}" inputmode="decimal" />
            </div>
        `, renderAppButtonRow('Cancel', 'Update Buy Price', {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveBuyPrice()',
            actionIcon: 'fa-check'
        }));
    }

    async function saveBuyPrice() {
        const {
            getTransaction,
            getEffectiveSellPrice,
            updateTransaction,
            applyVerifiedReset,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = buyPriceModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const buyPrice = parseFloat(document.getElementById('buyPriceModalInput')?.value);
        if (!buyPrice || buyPrice <= 0) {
            showToast('Enter a valid buy price.', 'warning');
            return;
        }
        const sellPrice = getEffectiveSellPrice ? getEffectiveSellPrice(tx) : tx.sellPrice;
        const calc = calculateTrade({ ...tx, buyPrice, sellPrice });
        const saved = await updateTransaction(id, applyVerifiedReset(tx, {
            buyPrice,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        }));
        if (saved) {
            showToast('Buy price updated.', 'success');
            buyPriceModalTradeId = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating buy price.', 'danger');
        }
    }

    global.MTFRegister({ openBuyPriceModal, saveBuyPrice });
})(typeof window !== 'undefined' ? window : globalThis);
