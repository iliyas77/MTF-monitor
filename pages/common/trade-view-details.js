/**
 * M42 — Trade view sheet detail list molecules.
 */
(function (global) {
    'use strict';

    const { renderTradeDetailRow } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function renderTradeDetailsList(t) {
        const { resolveTradeForDisplay, getDaysHeld } = tradeSheets();
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(t) : t;
        const bd = tx.breakdown || {};
        const totalInv = tx.totalInvestment || (tx.quantity * tx.buyPrice) || 0;
        const ownMargin = tx.ownMargin || totalInv;
        const mtfAmt = tx.mtfAmount || 0;
        const gross = tx.grossProfit || 0;
        const lev = tx.leverage || 1;
        const levDisplay = lev > 1 ? `${parseFloat(lev.toFixed(2))}x` : '1x';
        const daysHeld = getDaysHeld ? getDaysHeld(tx) : 0;
        const rows = [
            { label: 'Buy', amount: tx.buyPrice, tone: 'secondary', decimals: true },
            { label: 'Sell', amount: tx.sellPrice, tone: 'positive', decimals: true },
            { label: 'Qty', amount: tx.quantity, quantity: true },
            { label: 'Broker', amount: tx.broker || '—', tag: 'broker' },
            { label: 'Leverage', amount: levDisplay, tag: 'accent' },
            { label: 'Hold', amount: `${global.MTFComponents.renderIcon('fa-clock', { className: 'me-1 opacity-75' })}${daysHeld}d`, tag: 'default' },
            { label: 'Total Investment', amount: totalInv, tone: 'neutral', compact: true },
            { label: 'Your Margin', amount: ownMargin, tone: 'neutral', compact: true },
            { label: 'MTF Funded', amount: mtfAmt, tone: mtfAmt > 0 ? 'secondary' : 'neutral', compact: true },
            { label: 'Gross Profit', amount: gross, tone: gross >= 0 ? 'positive' : 'negative', compact: true },
            { label: 'MTF Interest', amount: tx.interest || 0, tone: 'warning', decimals: true },
            { label: 'Total Charges', amount: tx.charges || 0, tone: 'negative', decimals: true }
        ];
        const chargeItems = [
            { key: 'brokerage', label: 'Brokerage' },
            { key: 'stt', label: 'STT' },
            { key: 'exchange', label: 'Exchange' },
            { key: 'sebi', label: 'SEBI' },
            { key: 'stamp', label: 'Stamp Duty' },
            { key: 'gst', label: 'GST' },
            { key: 'pledge', label: 'Pledge' },
            { key: 'unpledge', label: 'Unpledge' },
            { key: 'dp', label: 'DP Charges' }
        ].filter((i) => (bd[i.key] || 0) > 0);
        chargeItems.forEach((i) => {
            rows.push({ label: i.label, amount: bd[i.key], tone: 'negative', decimals: true });
        });
        return `<div class="border rounded p-2">${rows.map(renderTradeDetailRow).join('')}</div>`;
    }

    function renderTradeViewPnLSummary(t) {
        const { resolveTradeForDisplay } = tradeSheets();
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(t) : t;
        const gross = tx.grossProfit || 0;
        const interest = tx.interest || 0;
        const charges = tx.charges || 0;
        const totalCost = charges + interest;
        const net = tx.netProfit || 0;
        const rows = [
            { label: 'Gross Profit', amount: gross, tone: gross >= 0 ? 'positive' : 'negative', compact: true },
            { label: 'MTF Interest', amount: interest, tone: 'warning', decimals: true },
            { label: 'Total Charges', amount: charges, tone: 'negative', decimals: true },
            { label: 'Total Cost', amount: totalCost, tone: 'negative', decimals: true },
            { label: 'P&L', amount: net, tone: net >= 0 ? 'positive' : 'negative', compact: true }
        ];
        const { renderIcon } = global.MTFComponents;
        return `
            <div class="mt-4">
                <div class="small text-muted text-uppercase fw-medium mb-2">${renderIcon('fa-calculator', { className: 'me-2' })}P&L Summary</div>
                <div class="border rounded p-2">${rows.map(renderTradeDetailRow).join('')}</div>
            </div>
        `;
    }

    global.MTFRegister({ renderTradeDetailsList, renderTradeViewPnLSummary });
})(typeof window !== 'undefined' ? window : globalThis);
