/**
 * Trade list UI — meta, items, rows, list renderers
 * Merged for maintainability — each section keeps its original IIFE + MTFRegister.
 */

/* ========== Trade list meta ========== */
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

/* ========== Trade list detail values ========== */
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
        const sizeClass = /\bfs-/.test(valueClass) ? '' : 'fs-6';
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

/* ========== Trade list details ========== */
/**
 * M13 — Trade list details table molecule.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        fmtDateShort,
        renderTradeSellDetailValue,
        renderTradeInterestDetailValue,
        renderTradeDetailCell
    } = global.MTFComponents;

    function renderTradeMetricsTable(rowsHtml, label, wrapperAttrs = '', labelLoadingHtml = null) {
        if (!rowsHtml) return '';
        const loadingSlot = labelLoadingHtml !== null
            ? `<span data-live-loading class="d-inline-flex align-items-center">${labelLoadingHtml || ''}</span>`
            : '';
        const heading = label
            ? `<div class="small text-muted text-uppercase mb-1 d-inline-flex align-items-center gap-1">${label}${loadingSlot}</div>`
            : '';
        return `
            <div${wrapperAttrs}>
                ${heading}
                <div class="trade-metrics-panel">
                    <table class="table table-sm trade-metrics-table">
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderTradeListItemDetailRows(t) {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { sellPrice: 0, interest: 0, charges: 0 };
        const isOpen = (t.status || 'closed') === 'open';
        const buy = fmtDec(t.buyPrice || 0);
        const sellHtml = renderTradeSellDetailValue(t.buyPrice, metrics.sellPrice);
        const interestHtml = renderTradeInterestDetailValue(t, metrics.interest);
        const charges = fmtDec(metrics.charges);
        const buyDate = t.buyDate ? fmtDateShort(t.buyDate) : '—';
        const sellDate = t.sellDate ? fmtDateShort(t.sellDate) : '—';
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(t) : 0;
        const holdLabel = daysHeld === 1 ? '1 day' : `${daysHeld} days`;
        const soldHtml = t.sellDate
            ? `<span class="d-inline-flex align-items-center gap-1 flex-wrap">
                    <span>${sellDate}</span>
                    <span class="badge rounded-pill border bg-transparent text-body-secondary">${holdLabel}</span>
               </span>`
            : '—';
        const isPast = !isOpen;
        const buyOnclick = isPast ? `openBuyPriceModal('${t.id}')` : '';
        const sellOnclick = `openTargetModal('${t.id}')`;

        return `
            <tr>
                ${renderTradeDetailCell('Buy', buy, 'text-info', buyOnclick, 'fa-tag', 'bg-transparent', 'text-info')}
                ${renderTradeDetailCell('Target', sellHtml, 'fs-6', sellOnclick, 'fa-bullseye', 'bg-transparent', 'text-danger')}
            </tr>
            <tr>
                ${renderTradeDetailCell('Interest', interestHtml, '', `openInterestModal('${t.id}')`, 'fa-percent', 'bg-transparent', 'text-warning')}
                ${renderTradeDetailCell('Charges', charges, 'text-danger', `openChargesModal('${t.id}')`, 'fa-receipt', 'bg-transparent', 'text-danger')}
            </tr>
            <tr>
                ${renderTradeDetailCell('Bought', buyDate, 'text-body-secondary', `openHoldModal('${t.id}')`, 'fa-calendar-plus', 'bg-transparent', 'text-primary')}
                ${renderTradeDetailCell('Sold', soldHtml, 'text-body-secondary', `openHoldModal('${t.id}')`, 'fa-calendar-check', 'bg-transparent', 'text-primary')}
            </tr>
        `;
    }

    function renderTradeListItemDetails(t) {
        return renderTradeMetricsTable(
            renderTradeListItemDetailRows(t),
            'Already purchased'
        );
    }

    global.MTFRegister({
        renderTradeMetricsTable,
        renderTradeListItemDetailRows,
        renderTradeListItemDetails
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade list actions ========== */
/**
 * M16 — Trade list action buttons molecule (Bootstrap only).
 */
(function (global) {
    'use strict';

    const ACTION_BTN = {
        copy: 'btn-outline-secondary',
        verify: 'btn-outline-secondary',
        execute: 'btn-outline-secondary',
        done: 'btn-outline-secondary',
        edit: 'btn-outline-secondary'
    };

    function renderTradeListItemActions(t, variant = 'open') {
        const isPast = variant === 'past';
        const btn = (label, onclick, tone, icon) => {
            const toneClass = ACTION_BTN[tone] || ACTION_BTN.edit;
            const iconHtml = icon ? `<i class="fas ${icon} me-1" aria-hidden="true"></i>` : '';
            return `<button type="button" class="btn btn-sm ${toneClass} flex-fill" onclick="${onclick}">${iconHtml}${label}</button>`;
        };
        const copyBtn = isPast ? btn('Copy', `confirmCopy('${t.id}')`, 'copy', 'fa-copy') : '';
        const verifyBtn = isPast && !t.verified
            ? btn('Verified', `confirmVerifyTrade('${t.id}')`, 'verify', 'fa-check-circle')
            : '';
        const executeBtn = variant === 'plan'
            ? btn('Executed', `confirmExecuteTrade('${t.id}')`, 'execute', 'fa-play')
            : '';
        const doneBtn = variant === 'open'
            ? btn('Done', `confirmCloseTrade('${t.id}')`, 'done', 'fa-check')
            : '';
        return `
            <div class="d-flex gap-2 w-100">
                ${copyBtn}
                ${verifyBtn}
                ${executeBtn}
                ${doneBtn}
                ${btn('Edit', `openEditModal('${t.id}')`, 'edit', 'fa-edit')}
            </div>
        `;
    }

    global.MTFRegister({ renderTradeListItemActions });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade list item ========== */
/**
 * O10 — Trade list item organism (full + compact/collapsed card).
 */
(function (global) {
    'use strict';

    const {
        renderTradeCardPnl,
        renderTradeListItemLeverageMeta,
        renderTradeListItemDetails,
        renderTradeListItemActions,
        appTag,
        fmtDec,
        renderAmount,
        renderIcon
    } = global.MTFComponents;

    const COLLAPSED_TRADES_KEY = 'mtf_collapsed_trade_cards';
    const COMPACT_MODE_KEY = 'mtf_trade_cards_compact_mode';

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function companyInitial(company) {
        const s = String(company || '').trim();
        if (!s) return '•';
        return s.charAt(0).toUpperCase();
    }

    function isCompactMode() {
        try {
            return localStorage.getItem(COMPACT_MODE_KEY) === '1';
        } catch (_) {
            return false;
        }
    }

    function setCompactMode(on) {
        try {
            localStorage.setItem(COMPACT_MODE_KEY, on ? '1' : '0');
            // Drop legacy per-card collapse keys — collapse is all-or-nothing now.
            localStorage.removeItem(COLLAPSED_TRADES_KEY);
        } catch (_) { /* ignore quota / private mode */ }
    }

    function refreshTradeCardsView() {
        const render = (global.MTFComponents || {}).renderCurrentView;
        if (typeof render !== 'function') return false;
        try {
            render();
            return true;
        } catch (_) {
            return false;
        }
    }

    function setAllVisibleTradeCardsCollapsed(collapsed) {
        setCompactMode(collapsed);
        if (refreshTradeCardsView()) return;
        syncTradeCardsCollapseAllButton();
    }

    function toggleAllTradeCardsCollapse() {
        setAllVisibleTradeCardsCollapsed(!isCompactMode());
    }

    function syncTradeCardsCollapseAllButton() {
        const btn = document.getElementById('tradesCollapseAllBtn');
        if (!btn) return;
        const collapsed = isCompactMode();
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-compress-alt', !collapsed);
            icon.classList.toggle('fa-expand-alt', collapsed);
        }
        btn.setAttribute('aria-label', collapsed ? 'Expand all cards' : 'Collapse all cards');
        btn.setAttribute('title', collapsed ? 'Expand all cards' : 'Collapse all cards');
        btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    }

    function getTradeTargetPrice(t) {
        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        if (helpers.getEffectiveSellPrice) {
            const sp = Number(helpers.getEffectiveSellPrice(t));
            if (sp > 0) return sp;
        }
        const sell = Number(t && t.sellPrice);
        if (sell > 0) return sell;
        const buy = Number(t && t.buyPrice);
        return buy > 0 ? buy : null;
    }

    function formatLivePrice(price) {
        if (price == null || isNaN(Number(price))) return '—';
        return '₹' + Number(price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatTargetGapLabel(livePrice, targetPrice) {
        const live = Number(livePrice);
        const target = Number(targetPrice);
        if (!(live > 0) || !(target > 0)) return '—';
        const signed = target - live;
        const diff = Math.abs(signed);
        const pct = Math.abs((signed / live) * 100);
        const diffText = diff.toLocaleString('en-IN', {
            minimumFractionDigits: diff % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2
        });
        const overshootSign = signed < -0.005 ? '+' : '';
        return `${pct.toFixed(2)}% <span class="text-muted" aria-hidden="true">|</span> <span class="badge rounded-pill border bg-transparent text-body-secondary">${overshootSign}₹${diffText}</span>`;
    }

    function targetGapTone(livePrice, targetPrice) {
        const live = Number(livePrice);
        const target = Number(targetPrice);
        if (!(live > 0) || !(target > 0)) return 'neutral';
        const pct = ((target - live) / live) * 100;
        if (Math.abs(pct) < 0.005) return 'neutral';
        return pct > 0 ? 'down' : 'up';
    }

    function formatLiveReturn(amount) {
        if (amount == null || isNaN(Number(amount))) return '—';
        const n = Number(amount);
        const abs = Math.abs(n).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        if (n > 0) return '+₹' + abs;
        if (n < 0) return '−₹' + abs;
        return '₹' + abs;
    }

    function liveReturnTone(amount) {
        if (amount == null || isNaN(Number(amount))) return 'neutral';
        const n = Number(amount);
        if (Math.abs(n) < 0.005) return 'neutral';
        return n >= 0 ? 'up' : 'down';
    }

    function estimateLiveReturn(t, livePrice) {
        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        if (helpers.estimateLiveSellReturn) {
            return helpers.estimateLiveSellReturn(t, livePrice);
        }
        return null;
    }

    function liveToneClass(tone) {
        if (tone === 'up') return 'text-success';
        if (tone === 'down') return 'text-danger';
        return 'text-body-secondary';
    }

    function renderTradeLiveMetricsRow(t, variant) {
        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        const resolveSymbol = helpers.resolveTradeLiveSymbol;
        const getQuote = helpers.getTradeLiveQuote;
        const isRefreshing = helpers.isTradeLiveRefreshing;
        if (!resolveSymbol) return '';

        const symbol = resolveSymbol(t);
        if (!symbol) return '';

        const quote = getQuote ? getQuote(symbol) : null;
        const loading = isRefreshing ? !!isRefreshing() : false;
        const price = quote && quote.price != null && !isNaN(Number(quote.price))
            ? Number(quote.price)
            : null;
        const change = quote ? Number(quote.change) : NaN;
        const tone = price == null || isNaN(change)
            ? 'neutral'
            : change >= 0 ? 'up' : 'down';
        const targetPrice = getTradeTargetPrice(t);
        const gapTone = targetGapTone(price, targetPrice);
        const gapText = formatTargetGapLabel(price, targetPrice);
        const liveReturn = price != null ? estimateLiveReturn(t, price) : null;
        const returnTone = liveReturnTone(liveReturn);
        const returnText = formatLiveReturn(liveReturn);
        const targetAttr = targetPrice != null && !isNaN(Number(targetPrice))
            ? String(Number(targetPrice))
            : '';
        const tradeId = escapeHtml(t.id || '');

        const priceHtml = escapeHtml(formatLivePrice(price));
        const gapHtml = price != null ? gapText : '—';
        const returnHtml = escapeHtml(returnText);

        const spinnerHtml = loading
            ? renderIcon('fa-spinner', { className: 'fa-spin', size: 'xs' })
            : '';

        const liveCell = (field, label, icon, valueHtml, toneKey, iconClass) => `
            <td class="p-2 align-top bg-transparent" style="width:33.333%">
                <button type="button" class="btn border-0 bg-transparent text-start p-0 w-100 shadow-none ${liveToneClass(toneKey)}"
                    data-live-field="${field}"
                    onclick="refreshTradeLivePricesNow('${escapeHtml(symbol)}')"
                    title="Tap to refresh live price">
                    <span class="small text-muted d-inline-flex align-items-center gap-1 text-truncate w-100">
                        ${renderIcon(icon, { className: iconClass, size: 'xs' })}
                        ${label}
                    </span>
                    <span class="fs-6 fw-normal d-block mt-1 text-break" data-live-value>${valueHtml}</span>
                </button>
            </td>`;

        const { renderTradeMetricsTable } = global.MTFComponents;
        const rows = `
            <tr>
                ${liveCell('price', 'Price', 'fa-chart-line', priceHtml, tone, 'text-primary')}
                ${liveCell('target', 'Target', 'fa-bullseye', gapHtml, gapTone, 'text-warning')}
                ${liveCell('return', 'If Sold Now', 'fa-hand-holding-usd', returnHtml, returnTone, 'text-info')}
            </tr>`;
        const attrs = `
            data-live-symbol="${escapeHtml(symbol)}"
            data-quote-symbol="${escapeHtml(symbol)}"
            data-target-price="${escapeHtml(targetAttr)}"
            data-trade-id="${tradeId}"`;

        return renderTradeMetricsTable(rows, 'Current Market', attrs, spinnerHtml);
    }

    function renderTradesCompactTable(trades) {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const rows = (trades || []).map((t) => {
            const metrics = resolveTradeMetrics
                ? resolveTradeMetrics(t)
                : { netProfit: 0, sellPrice: t.sellPrice || 0, charges: 0 };
            const company = t.company || 'trade';
            const tradeId = escapeHtml(t.id || '');
            const qty = Number(t.quantity) || 0;
            const buy = fmtDec(t.buyPrice || 0);
            const sell = fmtDec(metrics.sellPrice != null ? metrics.sellPrice : (t.sellPrice || 0));
            return `
                <tr data-trade-card data-trade-id="${tradeId}" data-collapsed="true">
                    <td class="trades-compact-company" title="${escapeHtml(company)} · Qty ${qty}">
                        <div class="d-flex align-items-baseline justify-content-between gap-1 min-w-0 w-100">
                            <span class="text-truncate min-w-0 flex-grow-1">${escapeHtml(company)}</span>
                            <span class="flex-shrink-0 small text-body-secondary text-nowrap">(Qty ${qty})</span>
                        </div>
                    </td>
                    <td class="text-nowrap small trades-compact-prices">
                        <span class="text-info">${buy}</span>
                        <span class="text-muted mx-1">/</span>
                        <span class="text-danger">${sell}</span>
                    </td>
                    <td class="text-end text-nowrap trades-compact-pnl">
                        ${renderAmount(metrics.netProfit, { size: 'sm', compact: true, showSign: true, align: 'right', pill: false })}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="bg-body" data-trades-compact-table>
                <table class="table table-sm align-middle mb-0 trades-compact-table">
                    <thead class="table-light">
                        <tr>
                            <th scope="col" class="trades-compact-company">Company (Qty)</th>
                            <th scope="col" class="trades-compact-prices">Buy / Sell</th>
                            <th scope="col" class="text-end trades-compact-pnl">P&amp;L</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    function renderTradeListItem(t, serialNo, variant = 'open') {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics
            ? resolveTradeMetrics(t)
            : { netProfit: 0, sellPrice: t.sellPrice || 0, charges: 0 };
        const qty = Number(t.quantity) || 0;
        const company = t.company || 'trade';
        const tradeId = escapeHtml(t.id || '');
        const brokerLabel = (variant === 'past' || variant === 'plan') && t.broker
            ? appTag(t.broker, 'broker')
            : '';
        const verifiedLabel = variant === 'past' && t.verified
            ? `<span class="badge rounded-pill text-bg-success">Verified</span>`
            : '';
        const liveMetrics = renderTradeLiveMetricsRow(t, variant);
        const details = renderTradeListItemDetails(t);

        return `
            <article class="card bg-body border rounded w-100" data-trade-card data-trade-id="${tradeId}">
                <div class="card-body p-3 d-flex flex-column gap-3">
                    <div class="d-flex justify-content-between align-items-center gap-2 min-w-0">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="d-inline-flex align-items-center gap-1">
                                <span class="small text-muted text-uppercase">Qty</span>
                                <span class="fs-6 fw-semibold text-info">${qty}</span>
                            </span>
                        </div>
                        <div>${renderTradeCardPnl(metrics.netProfit)}</div>
                    </div>
                    <hr class="m-0">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                        <span class="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 bg-primary bg-opacity-10 text-primary fw-semibold" style="width:2rem;height:2rem" aria-hidden="true">${escapeHtml(companyInitial(company))}</span>
                        <span class="text-truncate">${escapeHtml(company)}</span>
                        ${renderTradeListItemLeverageMeta(t)}
                        ${brokerLabel}
                        ${verifiedLabel}
                    </div>
                    ${liveMetrics}
                    ${details}
                    <hr class="m-0">
                    ${renderTradeListItemActions(t, variant)}
                </div>
            </article>
        `;
    }

    function renderOpenTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'open');
    }

    function renderPastTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'past');
    }

    function renderPlanTradeListItem(t, serialNo) {
        return renderTradeListItem(t, serialNo, 'plan');
    }

    global.MTFRegister({
        renderTradeListItem,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPlanTradeListItem,
        renderTradesCompactTable,
        toggleAllTradeCardsCollapse,
        syncTradeCardsCollapseAllButton,
        isCompactMode
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade list ========== */
/**
 * O11–O12 — Trade list and date-group organisms.
 */
(function (global) {
    'use strict';

    const { fmtDateDisplay, renderDateChip, renderAmount, appTag } = global.MTFComponents;

    function tradeDateKey(t, field = 'buyDate') {
        const d = t[field];
        if (!d) return 'unknown';
        return new Date(d).toISOString().split('T')[0];
    }

    function groupTradesByDate(trades, dateField = 'buyDate') {
        const groups = new Map();
        trades.forEach((t) => {
            const key = tradeDateKey(t, dateField);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(t);
        });
        return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }

    function renderTradesList(trades, renderItem) {
        return `<div class="d-flex flex-column gap-3 w-100">${trades.map((item, i) => renderItem(item, i + 1)).join('')}</div>`;
    }

    function renderFlatTradesList(trades, renderItem, variant = 'open') {
        const comps = global.MTFComponents || {};
        if (typeof comps.isCompactMode === 'function'
            && comps.isCompactMode()
            && typeof comps.renderTradesCompactTable === 'function') {
            return comps.renderTradesCompactTable(trades, variant);
        }
        return renderTradesList(trades, renderItem);
    }

    function renderDateGroupHeader(dateKey, items, opts = {}) {
        const { expanded = false } = opts;
        const count = items.length;
        const net = items.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0);
        const label = dateKey === 'unknown' ? 'No date' : fmtDateDisplay(dateKey);
        const tradeLabel = count === 1 ? '1 trade' : `${count} trades`;
        const dateLabel = dateKey === 'unknown'
            ? `<span class="fw-semibold text-body-secondary">${label}</span>`
            : renderDateChip(label, { size: 'sm' });
        return `
            <button type="button" class="btn btn-link text-decoration-none text-body p-0 w-100 text-start" onclick="toggleTradeDateGroupExpand(this)" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} trades for ${label}">
                <div class="d-flex justify-content-between align-items-center gap-2">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                        <span data-trade-date-expand-icon class="d-inline-flex">${global.MTFComponents.renderIcon('fa-chevron-down', { className: `text-muted${expanded ? ' fa-rotate-180' : ''}` })}</span>
                        ${dateLabel}
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-shrink-0">
                        ${renderAmount(net, { size: 'sm', compact: true, showSign: true, align: 'right', pill: false })}
                        ${appTag(tradeLabel)}
                    </div>
                </div>
            </button>
        `;
    }

    function renderGroupedTrades(trades, renderItem, dateField = 'buyDate', opts = {}) {
        const { wrapInCard = false, defaultExpanded = false } = opts;
        return groupTradesByDate(trades, dateField).map(([dateKey, items], idx) => {
            const expanded = defaultExpanded;
            const header = renderDateGroupHeader(dateKey, items, { expanded });
            const itemsHtml = renderTradesList(items, renderItem);
            if (wrapInCard) {
                return `
                    <section data-trade-date-group class="${expanded ? '' : ''}">
                        <div class="card bg-body rounded">
                            <div class="card-body p-3">
                                ${header}
                                <div data-trade-date-list class="collapse${expanded ? ' show' : ''}">${itemsHtml}</div>
                            </div>
                        </div>
                    </section>
                `;
            }
            return `
                <section class="${idx ? 'mt-4' : ''}" data-trade-date-group>
                    ${header}
                    <div data-trade-date-list class="collapse${expanded ? ' show' : ''}">${itemsHtml}</div>
                </section>
            `;
        }).join('');
    }

    global.MTFRegister({
        tradeDateKey,
        groupTradesByDate,
        renderTradesList,
        renderFlatTradesList,
        renderDateGroupHeader,
        renderGroupedTrades
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade summary row ========== */
/**
 * M7 — Trade summary row molecule (P&L + profit/loss counts + total).
 */
(function (global) {
    'use strict';

    const { fmt, paintMoneyAmountWords } = global.MTFComponents;

    function renderTradeSummaryRow(net, count, countLabel) {
        const toneClass = net >= 0 ? 'text-success' : 'text-danger';
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        return `<div class="d-flex justify-content-between align-items-center gap-2 w-100">
            <div class="d-flex flex-column min-w-0">
                <span class="small text-muted text-uppercase fw-normal">P&L</span>
                <span class="fs-5 fw-normal text-truncate ${toneClass}">${pnlFormatted}</span>
            </div>
            <div class="d-flex flex-column min-w-0 text-end">
                <span class="small text-muted text-uppercase fw-normal">${countLabel}</span>
                <span class="fs-5 fw-normal text-body-secondary text-truncate">${count}</span>
            </div>
        </div>`;
    }

    function renderTwoItemSummaryRow(net, count, countLabel, profitCount, lossCount) {
        const n = Number(net) || 0;
        const pnlFormatted = n > 0 ? '+' + fmt(n) : fmt(n);
        const pnlToneClass = n >= 0 ? 'text-success' : 'text-danger';
        const hasBuckets = profitCount != null && lossCount != null;
        const profit = Number(profitCount) || 0;
        const loss = Number(lossCount) || 0;
        const countsHtml = hasBuckets
            ? `<div class="d-flex align-items-center flex-shrink-0">
                <div class="text-center px-2">
                    <div class="small text-uppercase fw-normal text-success">Profit</div>
                    <div class="fs-5 fw-normal text-success">${profit}</div>
                </div>
                <div class="align-self-stretch border-start border" aria-hidden="true"></div>
                <div class="text-center px-2">
                    <div class="small text-uppercase fw-normal text-danger">Loss</div>
                    <div class="fs-5 fw-normal text-danger">${loss}</div>
                </div>
                <div class="align-self-stretch border-start border" aria-hidden="true"></div>
                <div class="text-center px-2">
                    <div class="small text-uppercase fw-normal text-muted">${countLabel}</div>
                    <div class="fs-5 fw-normal text-body-secondary">${count}</div>
                </div>
            </div>`
            : `<div class="text-end flex-shrink-0">
                <div class="small text-uppercase fw-normal text-muted">${countLabel}</div>
                <div class="fs-5 fw-normal text-body-secondary">${count}</div>
            </div>`;
        return `<div class="d-flex align-items-center justify-content-between gap-3 w-100">
            <div class="min-w-0 text-start">
                <div class="small text-uppercase fw-normal text-muted">P&L</div>
                <div class="fs-5 fw-normal ${pnlToneClass} text-truncate">${pnlFormatted}</div>
            </div>
            ${countsHtml}
        </div>`;
    }

    function countTradePnlBuckets(trades, resolveTradeMetrics) {
        let profit = 0;
        let loss = 0;
        (trades || []).forEach((t) => {
            const net = resolveTradeMetrics
                ? Number(resolveTradeMetrics(t).netProfit) || 0
                : Number(t.netProfit) || 0;
            if (net >= 0) profit += 1;
            else loss += 1;
        });
        return { profit, loss };
    }

    function paintTradeRangeSummary({ containerId, wordsId, net, count, countLabel, useTwoItemLayout, profitCount, lossCount }) {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (useTwoItemLayout) {
            el.innerHTML = renderTwoItemSummaryRow(net, count, countLabel, profitCount, lossCount);
        } else {
            el.innerHTML = renderTradeSummaryRow(net, count, countLabel);
        }
        if (wordsId) paintMoneyAmountWords(document.getElementById(wordsId), net, 'center');
    }

    function paintPastTradeSummary(net, tradeCount, profitCount, lossCount) {
        paintTradeRangeSummary({
            containerId: 'pastSummaryStats',
            wordsId: 'pastSummaryNetWords',
            net,
            count: tradeCount,
            countLabel: 'Closed',
            useTwoItemLayout: true,
            profitCount,
            lossCount
        });
    }

    function paintPlanTradeSummary(net, planCount, profitCount, lossCount) {
        paintTradeRangeSummary({
            containerId: 'planSummaryStats',
            wordsId: 'planSummaryNetWords',
            net,
            count: planCount,
            countLabel: 'Plan',
            useTwoItemLayout: true,
            profitCount,
            lossCount
        });
    }

    global.MTFRegister({
        renderTradeSummaryRow,
        renderTwoItemSummaryRow,
        countTradePnlBuckets,
        paintTradeRangeSummary,
        paintPastTradeSummary,
        paintPlanTradeSummary
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade detail row ========== */
/**
 * M9 — Trade detail row molecule (label + amount/tag/qty value).
 */
(function (global) {
    'use strict';

    const { appTag, renderAmount, renderQuantity } = global.MTFComponents;

    function renderTradeDetailRow(opts) {
        const {
            label,
            amount,
            tone = 'neutral',
            decimals = false,
            compact = false,
            plain = false,
            quantity = false,
            tag = false,
            labelClass = ''
        } = opts;
        let valueHtml;
        if (tag) {
            valueHtml = appTag(amount, tag === true ? 'default' : tag);
        } else if (plain) {
            valueHtml = `<span class="fw-semibold">${amount}</span>`;
        } else if (quantity) {
            valueHtml = renderQuantity(amount, { size: 'sm', align: 'right', pill: true });
        } else {
            valueHtml = renderAmount(amount, { size: 'sm', tone, decimals, compact, align: 'right', pill: true });
        }
        return `<div class="d-flex justify-content-between align-items-center gap-3 py-2 border-bottom">
            <span class="small text-muted ${labelClass}">${label}</span>
            <div class="text-end">${valueHtml}</div>
        </div>`;
    }

    global.MTFRegister({ renderTradeDetailRow });
})(typeof window !== 'undefined' ? window : globalThis);
