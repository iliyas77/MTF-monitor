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
            className = '',
            groupClass = ''
        } = opts;
        return `
            <span class="d-inline-flex align-items-center gap-1 ${groupClass}">
                <span class="small text-muted text-uppercase">P&L</span>
                ${renderAmount(amount, { size, compact, showSign: true, align: 'right', pill: false, className })}
            </span>
        `;
    }

    function renderTradeListItemHoldMeta(t) {
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(t) : 0;
        const holdText = daysHeld === 1 ? '1 day' : `${daysHeld} days`;
        return `
            <button type="button" class="btn btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1" onclick="openHoldModal('${t.id}')" aria-label="Edit holding period">
                <span class="small text-muted text-uppercase">Hold</span>
                <span class="small fw-normal text-info">${holdText}</span>
            </button>
        `;
    }

    function renderTradeListItemLeverageMeta(t) {
        const { appTag } = global.MTFComponents;
        const leverage = formatTradeLeverageLabel(t);
        return `
            <button type="button" class="btn border-0 bg-transparent p-0 flex-shrink-0" onclick="openLeverageModal('${t.id}')" aria-label="Edit leverage ${leverage}">
                ${appTag(leverage, 'accent')}
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
