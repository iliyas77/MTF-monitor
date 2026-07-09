/**
 * O10 — Trade list item organism.
 */
(function (global) {
    'use strict';

    const {
        renderTradeCardPnl,
        renderTradeListItemHoldMeta,
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
        // Percentage plain; ₹ difference in orange pill
        const overshootSign = signed < -0.005 ? '+' : '';
        return `${pct.toFixed(2)}% <span class="trade-list-item__live-target-pipe" aria-hidden="true">|</span> <span class="trade-list-item__live-target-diff">${overshootSign}₹${diffText}</span>`;
    }

    function targetGapTone(livePrice, targetPrice) {
        const live = Number(livePrice);
        const target = Number(targetPrice);
        if (!(live > 0) || !(target > 0)) return 'neutral';
        const pct = ((target - live) / live) * 100;
        if (Math.abs(pct) < 0.005) return 'neutral';
        // Still below target (distance remaining) → red; already at/above target → green
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

    function withRefreshIcon(html, loading, hasValue) {
        if (!loading) return html;
        if (!hasValue) return '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        return `${html} <i class="fas fa-spinner fa-spin trade-list-item__live-refresh-icon" aria-hidden="true"></i>`;
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

        const priceHtml = withRefreshIcon(escapeHtml(formatLivePrice(price)), loading, price != null);
        const gapHtml = withRefreshIcon(gapText, loading, price != null);
        const returnHtml = withRefreshIcon(escapeHtml(returnText), loading, price != null && liveReturn != null);

        return `<div class="trade-list-item__row trade-list-item__row--live">
            <div class="trade-list-item__live-grid"
                data-live-symbol="${escapeHtml(symbol)}"
                data-target-price="${escapeHtml(targetAttr)}"
                data-trade-id="${tradeId}">
                <button type="button" class="trade-list-item__live-cell trade-list-item__live-cell--clickable trade-list-item__live-price trade-list-item__live-price--${tone}${loading ? ' trade-list-item__live-price--loading' : ''}"
                    onclick="refreshTradeLivePricesNow()"
                    aria-label="Refresh current market price"
                    title="Tap to refresh live prices">
                    <span class="trade-list-item__live-label">
                        <i class="fas fa-chart-line trade-list-item__live-label-icon trade-list-item__live-price-icon" aria-hidden="true"></i>
                        Current Market
                    </span>
                    <span class="trade-list-item__live-price-value">${priceHtml}</span>
                </button>
                <button type="button" class="trade-list-item__live-cell trade-list-item__live-cell--clickable trade-list-item__live-target trade-list-item__live-target--${gapTone}${loading ? ' trade-list-item__live-target--loading' : ''}"
                    onclick="refreshTradeLivePricesNow()"
                    aria-label="Refresh distance to target"
                    title="Tap to refresh live prices">
                    <span class="trade-list-item__live-label">
                        <i class="fas fa-bullseye trade-list-item__live-label-icon trade-list-item__live-target-icon" aria-hidden="true"></i>
                        Target
                    </span>
                    <span class="trade-list-item__live-target-value">${gapHtml}</span>
                </button>
                <button type="button" class="trade-list-item__live-cell trade-list-item__live-cell--clickable trade-list-item__live-return trade-list-item__live-return--${returnTone}${loading ? ' trade-list-item__live-return--loading' : ''}"
                    onclick="refreshTradeLivePricesNow()"
                    aria-label="Refresh return if sold now"
                    title="Tap to refresh live prices">
                    <span class="trade-list-item__live-label">
                        <i class="fas fa-hand-holding-usd trade-list-item__live-label-icon trade-list-item__live-return-icon" aria-hidden="true"></i>
                        If Sold Now
                    </span>
                    <span class="trade-list-item__live-return-value">${returnHtml}</span>
                </button>
            </div>
        </div>`;
    }

    function renderTradeListItem(t, serialNo, variant = 'open') {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics ? resolveTradeMetrics(t) : { netProfit: 0 };
        const qty = Number(t.quantity) || 0;
        const company = t.company || 'trade';
        const brokerLabel = (variant === 'past' || variant === 'plan') && t.broker
            ? `<span class="trade-list-item__broker-label">${t.broker}</span>`
            : '';
        const verifiedLabel = variant === 'past' && t.verified
            ? `<span class="trade-list-item__verified-label">Verified</span>`
            : '';

        return `
            <article class="trade-list-item">
                <div class="trade-list-item__row trade-list-item__row--buy">
                    <div class="trade-list-item__buy">
                        <span class="trade-list-item__meta-group trade-list-item__qty-group">
                            <span class="trade-list-item__meta-label quantity-label">Qty</span>
                            <span class="trade-list-item__meta-value qty-value">${qty}</span>
                        </span>
                        <span class="trade-list-item__meta-pipe" aria-hidden="true">|</span>
                        ${renderTradeListItemLeverageMeta(t)}
                        <span class="trade-list-item__meta-pipe" aria-hidden="true">|</span>
                        ${renderTradeListItemHoldMeta(t)}
                    </div>
                    <div class="trade-list-item__pnl-wrap">${renderTradeCardPnl(metrics.netProfit)}</div>
                </div>
                <div class="trade-list-item__row trade-list-item__row--title">
                    <div class="trade-list-item__title">
                        <span class="trade-list-item__company-group">
                            <i class="fas fa-chart-line trade-list-item__company-icon" aria-hidden="true"></i>
                            <span class="trade-list-item__company-name">${company}</span>
                            ${brokerLabel}
                            ${verifiedLabel}
                        </span>
                    </div>
                </div>
                ${renderTradeLiveMetricsRow(t, variant)}
                ${renderTradeListItemDetails(t)}
                <div class="trade-list-item__row trade-list-item__row--actions">
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
