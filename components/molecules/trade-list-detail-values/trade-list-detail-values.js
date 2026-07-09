/**
 * M14–M15 — Trade list detail value molecules (sell price, interest).
 */
(function (global) {
    'use strict';

    const { fmtDec } = global.MTFComponents;

    function formatSellGainPctLabel(buyPrice, sellPrice) {
        const buy = Number(buyPrice) || 0;
        const sell = Number(sellPrice) || 0;
        if (buy <= 0 || sell <= 0) return null;
        const pct = ((sell - buy) / buy) * 100;
        const sign = pct >= 0 ? '+' : '-';
        const num = Math.abs(pct).toFixed(2);
        return `(${sign}${num}%)`;
    }

    function renderTradeSellDetailValue(buyPrice, sellPrice) {
        const sell = fmtDec(sellPrice);
        const pctLabel = formatSellGainPctLabel(buyPrice, sellPrice);
        if (!pctLabel) {
            return `<span class="trade-list-item__detail-value--sell">${sell}</span>`;
        }
        return `
            <span class="trade-list-item__detail-value--sell">${sell}</span>
            <span class="trade-list-item__sell-pct-tag">${pctLabel}</span>
        `;
    }

    function renderTradeInterestDetailValue(t, interestAmount) {
        const interestDetails = (global.MTFAppHelpers || {}).interestDetails;
        const interest = fmtDec(interestAmount);
        const d = interestDetails ? interestDetails(t) : { perDayInterest: 0, days: 0 };
        if (d.perDayInterest <= 0 || d.days <= 0) {
            return `<span class="trade-list-item__detail-value--interest">${interest}</span>`;
        }
        const breakdown = `(${fmtDec(d.perDayInterest)} × ${d.days}d)`;
        return `
            <span class="trade-list-item__detail-value--interest">${interest}</span>
            <span class="trade-list-item__detail-breakdown-tag">${breakdown}</span>
        `;
    }

    function renderTradeDetailCell(label, value, valueClass = '', onclick = '') {
        const Tag = onclick ? 'button' : 'div';
        const attrs = onclick
            ? ` type="button" class="trade-list-item__detail-cell trade-list-item__detail-cell--clickable" onclick="${onclick}"`
            : ` class="trade-list-item__detail-cell"`;
        return `
            <${Tag}${attrs}>
                <span class="trade-list-item__detail-label">${label}</span>
                <span class="trade-list-item__detail-value ${valueClass}">${value}</span>
            </${Tag}>
        `;
    }

    global.MTFRegister({
        formatSellGainPctLabel,
        renderTradeSellDetailValue,
        renderTradeInterestDetailValue,
        renderTradeDetailCell
    });
})(typeof window !== 'undefined' ? window : globalThis);
