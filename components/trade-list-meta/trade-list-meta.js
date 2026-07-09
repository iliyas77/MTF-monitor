/**
 * M10–M12 — Trade list meta molecules (P&L, hold, leverage).
 */
(function (global) {
    'use strict';

    const { renderAmount } = global.MTFComponents;

    function formatTradeLeverageLabel(t) {
        const lev = Number(t.leverage) || 1;
        return lev > 1 ? `${parseFloat(lev.toFixed(2))}x` : '1x';
    }

    function renderTradeCardPnl(amount, opts = {}) {
        const {
            size = 'sm',
            compact = false,
            className = 'trade-list-item__pnl',
            groupClass = 'trade-list-item__pnl-group'
        } = opts;
        return `
            <span class="trade-list-item__meta-group ${groupClass}">
                <span class="trade-list-item__meta-label">P&L</span>
                ${renderAmount(amount, { size, compact, showSign: true, align: 'right', pill: false, className })}
            </span>
        `;
    }

    function renderTradeListItemHoldMeta(t) {
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(t) : 0;
        const holdText = daysHeld === 1 ? '1 day' : `${daysHeld} days`;
        return `
            <button type="button" class="trade-list-item__meta-group trade-list-item__hold-meta" onclick="openHoldModal('${t.id}')" aria-label="Edit holding period">
                <span class="trade-list-item__meta-label">Hold</span>
                <span class="trade-list-item__meta-value trade-list-item__meta-value--hold">${holdText}</span>
            </button>
        `;
    }

    function renderTradeListItemLeverageMeta(t) {
        const leverage = formatTradeLeverageLabel(t);
        return `
            <button type="button" class="trade-list-item__meta-group trade-list-item__lev-meta" onclick="openLeverageModal('${t.id}')" aria-label="Edit leverage">
                <span class="trade-list-item__meta-label">Lev</span>
                <span class="trade-list-item__meta-value trade-list-item__meta-value--lev">${leverage}</span>
            </button>
        `;
    }

    global.MTFRegister({
        formatTradeLeverageLabel,
        renderTradeCardPnl,
        renderTradeListItemHoldMeta,
        renderTradeListItemLeverageMeta
    });
})(typeof window !== 'undefined' ? window : globalThis);
