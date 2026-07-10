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
        return `${sign}${num}%`;
    }

    function renderTradeSellDetailValue(buyPrice, sellPrice) {
        const sell = fmtDec(sellPrice);
        const pctLabel = formatSellGainPctLabel(buyPrice, sellPrice);
        const priceHtml = `<span class="fw-normal text-danger bg-danger-subtle rounded px-1">${sell}</span>`;
        if (!pctLabel) {
            return priceHtml;
        }
        return `
            <span class="d-inline-flex align-items-center gap-1 flex-wrap">
                ${priceHtml}
                <span class="badge rounded-pill border bg-transparent text-body-secondary">${pctLabel}</span>
            </span>
        `;
    }

    function renderTradeInterestDetailValue(t, interestAmount) {
        const interestDetails = (global.MTFAppHelpers || {}).interestDetails;
        const interest = fmtDec(interestAmount);
        const d = interestDetails ? interestDetails(t) : { perDayInterest: 0, days: 0 };
        if (d.perDayInterest <= 0 || d.days <= 0) {
            return `<span class="text-warning">${interest}</span>`;
        }
        const breakdown = `${fmtDec(d.perDayInterest)} × ${d.days}d`;
        return `
            <span class="d-inline-flex align-items-center gap-1 flex-wrap">
                <span class="text-warning">${interest}</span>
                <span class="badge rounded-pill border bg-transparent text-body-secondary">${breakdown}</span>
            </span>
        `;
    }

    function renderTradeDetailCell(label, value, valueClass = '', onclick = '', icon = '', cellClass = 'bg-transparent', iconClass = 'text-muted') {
        const { renderIcon } = global.MTFComponents;
        const iconHtml = icon
            ? `${renderIcon(icon, { className: iconClass, size: 'xs' })}`
            : '';
        const sizeClass = /\bfs-/.test(valueClass) ? '' : 'small';
        const content = `
            <span class="small text-muted text-uppercase d-inline-flex align-items-center gap-1">${iconHtml}${label}</span>
            <span class="${sizeClass} fw-normal ${valueClass} d-block mt-1">${value}</span>
        `;
        const tdClass = `p-2 align-top w-50 ${cellClass || 'bg-transparent'}`;
        if (onclick) {
            return `
                <td class="${tdClass}">
                    <button type="button" class="btn border-0 bg-transparent text-start p-0 w-100 shadow-none" onclick="${onclick}">
                        ${content}
                    </button>
                </td>
            `;
        }
        return `<td class="${tdClass}">${content}</td>`;
    }

    global.MTFRegister({
        formatSellGainPctLabel,
        renderTradeSellDetailValue,
        renderTradeInterestDetailValue,
        renderTradeDetailCell
    });
})(typeof window !== 'undefined' ? window : globalThis);
