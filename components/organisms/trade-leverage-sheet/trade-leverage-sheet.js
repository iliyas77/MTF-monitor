/**
 * O38 — Leverage edit sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        renderAppButtonRow,
        showToast,
        Sheet
    } = global.MTFComponents;

    let leverageModalTradeId = null;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function leverageModalBreakdownHtml(tx, leverage) {
        const lev = Math.max(1, Number(leverage) || 1);
        const qty = Number(tx.quantity) || 0;
        const bp = Number(tx.buyPrice) || 0;
        const totalInv = bp * qty;
        const ownMargin = lev > 1 ? totalInv / lev : totalInv;
        const mtfAmt = lev > 1 ? totalInv * (1 - 1 / lev) : 0;
        return `
            <div>Total investment: ${fmtDec(totalInv)}</div>
            <div>Your margin: ${fmtDec(ownMargin)}</div>
            <div>Broker funded: ${fmtDec(mtfAmt)}</div>
        `;
    }

    function onLeverageModalInput() {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(leverageModalTradeId) : null;
        if (!tx) return;
        const lev = parseFloat(document.getElementById('levModalInput')?.value) || 1;
        const el = document.getElementById('levModalBreakdown');
        if (el) el.innerHTML = leverageModalBreakdownHtml(tx, lev);
    }

    function openLeverageModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        leverageModalTradeId = id;
        const lev = Number(tx.leverage) || 1;
        Sheet.open(`<i class="fas fa-layer-group mr-2"></i>${tx.company} Leverage`, `
            <p class="text-sm text-base-content/60 mb-3">Update leverage only. Margin, interest, and P&L will recalculate.</p>
            <div class="mb-3">
                <label class="label-text font-normal text-base-content/65 mb-1">Leverage (X)</label>
                <input type="number" class="input input-bordered w-full" id="levModalInput" min="1" step="0.1" value="${lev}" oninput="onLeverageModalInput()" />
                <p class="label-text-alt mt-1 mb-0">Your margin = total investment ÷ leverage. Broker funds the rest.</p>
            </div>
            <div class="text-sm text-base-content/60 space-y-1" id="levModalBreakdown">
                ${leverageModalBreakdownHtml(tx, lev)}
            </div>
        `, renderAppButtonRow('Cancel', 'Update Leverage', {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveLeverage()',
            actionIcon: 'fa-check'
        }));
    }

    async function saveLeverage() {
        const {
            getTransaction,
            getEffectiveSellPrice,
            updateTransaction,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = leverageModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const leverage = parseFloat(document.getElementById('levModalInput')?.value);
        if (!leverage || leverage < 1) {
            showToast('Enter leverage of 1 or higher.', 'warning');
            return;
        }
        const sellPrice = getEffectiveSellPrice ? getEffectiveSellPrice(tx) : tx.sellPrice;
        const calc = calculateTrade({ ...tx, leverage, sellPrice });
        const saved = await updateTransaction(id, {
            leverage,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        });
        if (saved) {
            showToast('Leverage updated.', 'success');
            leverageModalTradeId = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating leverage.', 'danger');
        }
    }

    global.MTFRegister({ openLeverageModal, onLeverageModalInput, saveLeverage });
})(typeof window !== 'undefined' ? window : globalThis);
