/**
 * O10 — Trade list item organism.
 */
(function (global) {
    'use strict';

    const {
        renderTradeCardPnl,
        renderTradeListItemLeverageMeta,
        renderTradeListItemDetails,
        renderTradeListItemActions
    } = global.MTFComponents;

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

        const { renderIcon } = global.MTFComponents;
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
                    <span class="small fw-normal d-block mt-1 text-break" data-live-value>${valueHtml}</span>
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

    function renderTradeListItem(t, serialNo, variant = 'open') {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { netProfit: 0 };
        const qty = Number(t.quantity) || 0;
        const company = t.company || 'trade';
        const brokerLabel = (variant === 'past' || variant === 'plan') && t.broker
            ? `<span class="badge rounded-pill text-bg-light border">${t.broker}</span>`
            : '';
        const verifiedLabel = variant === 'past' && t.verified
            ? `<span class="badge rounded-pill text-bg-success">Verified</span>`
            : '';
        const liveMetrics = renderTradeLiveMetricsRow(t, variant);
        const details = renderTradeListItemDetails(t);

        return `
            <article class="card bg-body border rounded w-100">
                <div class="card-body p-3 d-flex flex-column gap-3">
                    <div class="d-flex justify-content-between align-items-center gap-2">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                            <span class="d-inline-flex align-items-center gap-1">
                                <span class="small text-muted text-uppercase">Qty</span>
                                <span class="small fw-semibold text-info">${qty}</span>
                            </span>
                        </div>
                        <div>${renderTradeCardPnl(metrics.netProfit)}</div>
                    </div>
                    <hr class="m-0">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                        <span class="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 bg-primary bg-opacity-10 text-primary fw-semibold" style="width:2rem;height:2rem" aria-hidden="true">${escapeHtml(companyInitial(company))}</span>
                        <span class="text-truncate">${company}</span>
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
        renderPlanTradeListItem
    });
})(typeof window !== 'undefined' ? window : globalThis);
