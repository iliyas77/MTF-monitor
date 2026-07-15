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

    function TargetStatus(currentPrice, targetPrice, status, targetReachedBeforeClose) {
        const isClosed = status === 'closed';

        if (isClosed) {
            const reached = !!targetReachedBeforeClose;
            return {
                remainingAmount: 0,
                remainingPercentage: 0,
                isTargetReached: reached,
                html: `
                    <div class="target-status-container" data-target-status data-reached="${reached}">
                        <span class="trade-position-label ${reached ? 'text-success' : 'text-danger'}">Target</span>
                        <span class="trade-position-value ${reached ? 'text-success' : 'text-danger'} fw-bold">${reached ? '✅ Reached' : '❌ Not Reached'}</span>
                    </div>
                `
            };
        }

        const cp = currentPrice != null ? Number(currentPrice) : null;
        const tp = targetPrice != null ? Number(targetPrice) : null;

        if (cp == null || isNaN(cp) || cp <= 0 || tp == null || isNaN(tp) || tp <= 0) {
            return {
                remainingAmount: 0,
                remainingPercentage: 0,
                isTargetReached: false,
                html: `
                    <div class="target-status-container" data-target-status>
                        <span class="trade-position-label text-secondary">Target</span>
                        <span class="trade-position-value text-body">—</span>
                    </div>
                `
            };
        }

        const isTargetReached = cp >= tp;
        const remainingAmount = tp - cp;
        const remainingPercentage = (remainingAmount / tp) * 100;
        const differencePercentage = ((cp - tp) / tp) * 100;
        const { renderIcon } = global.MTFComponents;

        let html = '';
        if (isTargetReached) {
            html = `
                <div class="target-status-container" data-target-status data-reached="true">
                    <span class="trade-position-label text-success">Target</span>
                    <span class="trade-position-value text-success fw-bold">✅ Reached</span>
                    <span class="trade-position-subtitle text-success mt-1" data-target-pct-diff>+${differencePercentage.toFixed(2)}%</span>
                </div>
            `;
        } else {
            const iconHtml = typeof renderIcon === 'function' ? renderIcon('fa-bullseye', { className: 'text-target-purple me-1' }) : '';
            html = `
                <div class="target-status-container" data-target-status data-reached="false">
                    <span class="trade-position-label text-target-purple d-flex align-items-center gap-1">${iconHtml}Target</span>
                    <span class="trade-position-value text-target-purple fw-bold" data-target-left>₹${remainingAmount.toFixed(2)} Left</span>
                    <span class="trade-position-subtitle text-target-purple mt-1" data-target-pct-left>${remainingPercentage.toFixed(2)}% to target</span>
                </div>
            `;
        }

        return {
            remainingAmount,
            remainingPercentage,
            isTargetReached,
            html
        };
    }

    global.MTFRegister({
        formatTradeLeverageLabel,
        renderTradeCardPnl,
        renderTradeListItemHoldMeta,
        renderTradeListItemLeverageMeta,
        TargetStatus
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
 * O10 — Trade list item organism (full + per-card collapse).
 */
(function (global) {
    'use strict';

    const {
        formatTradeLeverageLabel,
        fmtDec,
        renderAmount,
        renderIcon
    } = global.MTFComponents;

    const EXPANDED_TRADES_KEY = 'mtf_expanded_trade_cards';
    const LEGACY_COLLAPSED_TRADES_KEY = 'mtf_collapsed_trade_cards';
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

    function readExpandedTradeIds() {
        try {
            const raw = JSON.parse(localStorage.getItem(EXPANDED_TRADES_KEY));
            return new Set(Array.isArray(raw) ? raw.map(String) : []);
        } catch (_) {
            return new Set();
        }
    }

    function writeExpandedTradeIds(ids) {
        try {
            localStorage.setItem(EXPANDED_TRADES_KEY, JSON.stringify([...ids]));
            localStorage.removeItem(LEGACY_COLLAPSED_TRADES_KEY);
            localStorage.removeItem(COMPACT_MODE_KEY);
        } catch (_) { /* ignore quota / private mode */ }
    }

    /** Cards are collapsed by default; only explicitly expanded IDs stay open. */
    function isTradeCardCollapsed(tradeId) {
        if (!tradeId) return true;
        return !readExpandedTradeIds().has(String(tradeId));
    }

    function setTradeCardCollapsed(tradeId, collapsed) {
        if (!tradeId) return;
        const ids = readExpandedTradeIds();
        const key = String(tradeId);
        if (collapsed) ids.delete(key);
        else ids.add(key);
        writeExpandedTradeIds(ids);
    }

    function syncTradeCardCollapseUi(card, collapsed) {
        if (!card) return;
        const full = card.querySelector('[data-trade-card-full]');
        if (full) {
            // Toggle class directly so UI stays in sync (Bootstrap Collapse animates async).
            const inst = global.bootstrap?.Collapse
                ? global.bootstrap.Collapse.getInstance(full)
                : null;
            if (inst) inst.dispose();
            full.classList.remove('collapsing');
            full.classList.toggle('show', !collapsed);
            full.style.height = '';
            full.style.overflow = '';
        }
        card.dataset.collapsed = collapsed ? 'true' : 'false';
        card.classList.toggle('trade-position-card--expanded', !collapsed);
        const btn = card.querySelector('[data-trade-collapse-btn]');
        if (btn) btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        const chevronWrap = card.querySelector('[data-trade-collapse-chevron]');
        if (chevronWrap) {
            const icon = chevronWrap.matches('i.fas') ? chevronWrap : chevronWrap.querySelector('i.fas');
            if (icon) icon.classList.toggle('fa-rotate-180', collapsed);
        }
    }

    function toggleTradeCardCollapse(tradeId) {
        const id = String(tradeId || '');
        if (!id) return;
        const esc = (typeof CSS !== 'undefined' && CSS.escape)
            ? CSS.escape(id)
            : id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const card = document.querySelector(`[data-trade-card][data-trade-id="${esc}"]`);
        const next = !isTradeCardCollapsed(id);
        setTradeCardCollapsed(id, next);
        if (card) syncTradeCardCollapseUi(card, next);
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

    function hashCompanyTone(company) {
        const s = String(company || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h) % 6;
    }

    function formatDayChangeLabel(quote) {
        if (!quote || quote.price == null || isNaN(Number(quote.price))) return '—';
        const change = Number(quote.change);
        const changePct = Number(quote.changePct);
        if (isNaN(change)) return '—';
        const arrow = change >= 0 ? '▲' : '▼';
        const pctText = !isNaN(changePct)
            ? `${arrow}${changePct.toFixed(2)}%`
            : '';
        const abs = Math.abs(change).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const absText = `${change >= 0 ? '+₹' : '-₹'}${abs}`;
        return pctText ? `${pctText} (${absText})` : absText;
    }

    /**
     * Progress from buy → target:
     * (Current − Buy) / (Target − Buy) × 100
     * Reaches 100% when CMP hits the target.
     */
    function targetProgressPct(livePrice, targetPrice, buyPrice) {
        const live = Number(livePrice);
        const target = Number(targetPrice);
        const buy = Number(buyPrice);
        if (!(live > 0) || !(target > 0) || !(buy > 0)) return null;
        const span = target - buy;
        if (Math.abs(span) < 1e-9) return live >= target ? 100 : 0;
        return ((live - buy) / span) * 100;
    }

    function clampProgressFill(pct) {
        if (pct == null || isNaN(pct)) return 0;
        const n = Number(pct);
        // Negative progress: show magnitude in red so the bar is visible.
        if (n < 0) return Math.min(100, Math.abs(n));
        return Math.max(0, Math.min(100, n));
    }

    /** Negative → red · >60% green · 30–60% orange · 0–30% red */
    function progressBand(pct) {
        if (pct == null || isNaN(Number(pct))) return 'neutral';
        const n = Number(pct);
        if (n < 0) return 'neg';
        if (n > 60) return 'high';
        if (n >= 30) return 'mid';
        return 'low';
    }

    function progressBandTextClass(band) {
        if (band === 'high') return 'text-success';
        if (band === 'mid') return 'text-progress-mid';
        if (band === 'neg' || band === 'low') return 'text-danger';
        return 'text-body-secondary';
    }

    function progressBandBarClass(band) {
        if (band === 'high') return 'bg-success';
        if (band === 'mid') return 'bg-progress-mid';
        if (band === 'neg' || band === 'low') return 'bg-danger';
        return 'bg-secondary';
    }

    function getCompanyAvatarStyle(company) {
        const hash = hashCompanyTone(company);
        switch (hash % 4) {
            case 0: return { bg: '#E8F4FF', color: '#1677FF' }; // Blue
            case 1: return { bg: '#E9F9EF', color: '#16A34A' }; // Green
            case 2: return { bg: '#FFF7E8', color: '#F59E0B' }; // Orange
            case 3: default: return { bg: '#FDECEC', color: '#EF4444' }; // Red
        }
    }

    function getBrokerAvatarStyle(broker) {
        const name = String(broker || '').toLowerCase().trim();
        if (/dhan/.test(name)) {
            return { bg: '#E9F9EF', color: '#16A34A' };
        }
        if (/groww/.test(name)) {
            return { bg: '#E5FAF5', color: '#00D09C' };
        }
        if (/zerodha|kite/.test(name)) {
            return { bg: '#FFF0EC', color: '#E64A19' };
        }
        if (/upstox/.test(name)) {
            return { bg: '#F3E8FF', color: '#7C3AED' };
        }
        if (/angel/.test(name)) {
            return { bg: '#E6F0FF', color: '#0052CC' };
        }
        return null;
    }



    function tradeStripeClass(variant, t) {
        if (variant === 'open') return 'trade-position-card--pnl-open';
        if (variant === 'past') return 'trade-position-card--pnl-closed';
        return 'trade-position-card--pnl-neutral';
    }

    function renderTradeListItem(t, serialNo, variant = 'open') {
        const resolveTradeMetrics = (global.MTFAppHelpers || {}).resolveTradeMetrics;
        const metrics = resolveTradeMetrics
            ? resolveTradeMetrics(t)
            : { netProfit: 0, sellPrice: t.sellPrice || 0, charges: 0 };
        const company = t.company || 'trade';
        const tradeId = escapeHtml(t.id || '');
        const status = t.status || 'open';
        const isClosed = variant === 'past' || status === 'closed';
        const statusClass = isClosed ? 'is-closed' : (variant === 'plan' ? 'is-plan' : 'is-open');

        const { appTag, renderIcon, renderAmount } = global.MTFComponents || {};
        const qty = Number(t.quantity) || 0;
        const leverage = formatTradeLeverageLabel(t);
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(t) : 0;
        const daysLabel = daysHeld === 1 ? '1 Day' : `${daysHeld} Days`;
        const initial = escapeHtml(companyInitial(company));

        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        const resolveSymbol = helpers.resolveTradeLiveSymbol;
        const getQuote = helpers.getTradeLiveQuote;
        const symbol = resolveSymbol ? resolveSymbol(t) : '';
        const quote = symbol && getQuote ? getQuote(symbol) : null;
        const livePrice = quote && quote.price != null && !isNaN(Number(quote.price)) ? Number(quote.price) : null;

        const useLivePnl = !isClosed && livePrice != null;
        const liveReturn = useLivePnl ? estimateLiveReturn(t, livePrice) : null;
        const pnlAmount = liveReturn != null && !isNaN(Number(liveReturn)) ? liveReturn : metrics.netProfit;

        const investment = Number(t.totalInvestment) || 0;
        const pnlPct = investment > 0 ? (pnlAmount / investment) * 100 : 0;
        const isPositive = pnlPct >= 0;

        const broker = String(t.broker || '').trim();
        const showBroker = broker && !/^none$/i.test(broker);

        const buyPrice = Number(t.buyPrice) || 0;
        const targetPrice = getTradeTargetPrice(t);

        const livePriceValue = isClosed
            ? (Number(metrics.sellPrice) || Number(t.sellPrice) || 0)
            : (livePrice != null ? livePrice : (quote && quote.price != null ? Number(quote.price) : 0));

        let leftAmount = 0;
        let targetBadgeText = '';
        let targetBadgeTone = 'green';
        if (targetPrice > 0 && livePriceValue > 0) {
            leftAmount = targetPrice - livePriceValue;
            if (leftAmount > 0) {
                targetBadgeText = `₹${leftAmount.toFixed(2)} below Target`;
                targetBadgeTone = 'green';
            } else if (leftAmount < 0) {
                targetBadgeText = `₹${Math.abs(leftAmount).toFixed(2)} above Target`;
                targetBadgeTone = 'red';
            } else {
                targetBadgeText = 'Target Reached';
                targetBadgeTone = 'green';
            }
        }

        let targetPctText = '';
        if (targetPrice > 0 && livePriceValue > 0) {
            const targetPct = ((targetPrice - livePriceValue) / livePriceValue) * 100;
            targetPctText = `Need +${targetPct.toFixed(2)}%`;
        }

        let avgEntryText = '';
        if (targetPrice > 0 && buyPrice > 0) {
            const diffPct = ((targetPrice - buyPrice) / buyPrice) * 100;
            avgEntryText = `Target ${diffPct > 0 ? '+' : ''}${diffPct.toFixed(2)}%`;
        }

        const updatedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const brokerAvatarStyle = showBroker ? getBrokerAvatarStyle(broker) : null;
        const avatarStyle = brokerAvatarStyle || getCompanyAvatarStyle(company);

        // Required attribute payload for live-updating scripts & smoke tests
        const symbolAttr = escapeHtml(symbol || '');
        const buyAttr = buyPrice > 0 ? String(buyPrice) : '';
        const targetAttr = targetPrice != null && !isNaN(Number(targetPrice)) ? String(Number(targetPrice)) : '';
        let targetReachedBeforeClose = !!t.targetReachedBeforeClose;
        if (t.targetReachedBeforeClose === undefined && isClosed) {
            targetReachedBeforeClose = (Number(t.netProfit) || 0) > 0;
        }
        const { renderMetricsGrid } = global.MTFComponents || {};
        const cells = [
            {
                label: 'Current Price',
                value: livePriceValue > 0 ? `₹${livePriceValue.toFixed(2)}` : '—',
                valueKind: 'price',
                icon: 'fa-arrow-trend-up',
                iconTone: 'green',
                subtitle: targetBadgeText,
                subtitleTone: targetBadgeTone,
                live: { field: 'price', value: true },
                refresh: !isClosed
            },
            {
                label: 'Quantity',
                value: qty,
                icon: 'fa-cube',
                iconTone: 'orange',
                subtitle: 'Shares',
                subtitleTone: 'orange',
                align: 'center'
            },
            {
                label: 'Buy Price',
                value: buyPrice > 0 ? `₹${buyPrice.toFixed(2)}` : '—',
                icon: 'fa-tag',
                iconTone: 'blue',
                subtitle: avgEntryText || '',
                subtitleTone: 'blue',
                align: 'center'
            },
            {
                label: 'Target Price',
                value: targetPrice > 0 ? `₹${targetPrice.toFixed(2)}` : '—',
                icon: 'fa-bullseye',
                iconTone: 'red',
                subtitle: targetPctText || '',
                subtitleTone: 'red'
            }
        ];

        const gridAttrs = {
            'data-live-symbol': symbolAttr,
            'data-quote-symbol': symbolAttr,
            'data-buy-price': buyAttr,
            'data-target-price': targetAttr,
            'data-trade-id': tradeId,
            'data-trade-status': status,
            'data-target-reached-before-close': String(targetReachedBeforeClose),
            'data-trade-variant': variant
        };

        const metricsGridHtml = renderMetricsGrid ? renderMetricsGrid(cells, { gridAttrs }) : '';

        return `
            <article class="pf-card ${statusClass}"
                data-trade-card data-trade-id="${tradeId}" data-trade-open-detail
                role="button" tabindex="0"
                onclick="openTradeDetail('${tradeId}')"
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTradeDetail('${tradeId}');}">
                
                <div class="pf-header">
                    <div class="pf-header-left">
                        <div class="pf-avatar trade-position-avatar" style="background-color: ${avatarStyle.bg}; color: ${avatarStyle.color}">${initial}</div>
                        <div class="pf-title-area">
                            <div class="pf-symbol-row">
                                <span class="pf-symbol">${escapeHtml(symbol || company)}</span>
                                ${isClosed ? `
                                    <span class="pf-live-badge text-secondary" style="font-size: 11px; padding: 2px 6px; background: #F3F4F6; border-radius: 4px; font-weight: 700;">
                                        CLOSED
                                    </span>
                                ` : `
                                    <span class="pf-live-badge" style="font-size: 11px; padding: 2px 6px; background: #EAF8EF; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: #16A34A;">
                                        <span class="pf-live-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #16A34A; display: inline-block;"></span> LIVE
                                    </span>
                                `}
                                ${showBroker ? `<span class="trade-position-tags d-none">${escapeHtml(broker)}</span>` : ''}
                            </div>
                            <span class="pf-name">${escapeHtml(company)}</span>
                            <div class="pf-meta trade-position-meta">
                                <span>NSE</span>
                                <span class="pf-bullet">•</span>
                                <span>${escapeHtml(leverage)}</span>
                                <span class="pf-bullet">•</span>
                                <span>${escapeHtml(daysLabel)}</span>
                                <span class="pf-bullet">•</span>
                                <span>${isClosed ? `Sold ${t.sellDate ? new Date(t.sellDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}` : updatedTime}</span>
                            </div>
                        </div>
                    </div>
                    <div class="pf-header-right" data-trade-card-pnl>
                        <span class="pf-pnl-label">Overall P&L</span>
                        ${renderAmount(pnlAmount, { size: 'sm', compact: true, showSign: true, align: 'right', pill: false, className: 'pf-pnl-val-wrapper', fs: 'fs-6', weight: 'fw-bold' })}
                        <div class="pf-pct-badge ${isPositive ? 'is-pos' : 'is-neg'}" data-trade-card-pnl-pct>
                            ${isPositive ? '▲' : '▼'} ${isPositive ? '+' : '-'}${Math.abs(pnlPct).toFixed(2)}%
                        </div>
                    </div>
                </div>

                <div class="pf-h-divider"></div>

                ${metricsGridHtml}
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
        tradeStripeClass,
        toggleTradeCardCollapse,
        isTradeCardCollapsed,
        setTradeCardCollapsed,
        syncTradeCardCollapseUi
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
        return `<div class="trade-cards-stack d-flex flex-column w-100">${trades.map((item, i) => renderItem(item, i + 1)).join('')}</div>`;
    }

    function renderFlatTradesList(trades, renderItem, variant = 'open') {
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
 * M7 — Trade summary: three portfolio metric cards (P&L / Invested / Holdings).
 */
(function (global) {
    'use strict';

    const { fmt, fmtINR, paintMoneyAmountWords } = global.MTFComponents;

    function aggregatePortfolioSummary(trades, resolveTradeMetrics) {
        let net = 0;
        let invested = 0;
        (trades || []).forEach((t) => {
            const m = resolveTradeMetrics ? resolveTradeMetrics(t) : t;
            net += Number(m.netProfit) || 0;
            invested += Number(m.totalInvestment) || 0;
        });
        const holdings = (trades || []).length;
        return { net, invested, holdings };
    }

    function renderPortfolioStatCard(label, valueHtml, valueClass) {
        return `<div class="portfolio-stat-card">
            <div class="portfolio-stat-label">${label}</div>
            <div class="portfolio-stat-value text-truncate ${valueClass || ''}">${valueHtml}</div>
        </div>`;
    }

    function renderPortfolioSummaryCards({ net, invested, holdings }) {
        const n = Number(net) || 0;
        const inv = Number(invested) || 0;
        const count = Number(holdings) || 0;

        // P&L Formatted
        const pnlFormatted = n > 0 ? '+' + fmtINR(n) : fmtINR(n);
        const pnlToneClass = n > 0 ? 'text-success' : (n < 0 ? 'text-danger' : 'text-body');
        const pnlBgClass = n > 0 ? 'bg-success-subtle' : (n < 0 ? 'bg-danger-subtle' : 'bg-light');
        const pnlIconClass = n >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        const pnlIconColor = n > 0 ? 'text-success' : (n < 0 ? 'text-danger' : 'text-secondary');

        // Percentage for P&L
        const pct = inv > 0 ? (n / inv) * 100 : 0;
        const pctFormatted = pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
        const pctClass = n > 0 ? 'text-success' : (n < 0 ? 'text-danger' : 'text-muted');

        // Determine view mode for positions list header text
        const viewMode = (global.MTFAppHelpers?.tradePages?.getTradesViewMode?.() || 'trade');
        let section2Title = `Active Positions (${count})`;
        let section2Subtitle = 'Live market updates';
        let section2Icon = 'fa-chart-line';
        let section2IconBg = 'bg-info-subtle text-info';

        if (viewMode === 'past') {
            section2Title = `Past Positions (${count})`;
            section2Subtitle = 'Closed trade history';
            section2Icon = 'fa-history';
            section2IconBg = 'bg-secondary-subtle text-secondary';
        } else if (viewMode === 'all') {
            section2Title = `All Positions (${count})`;
            section2Subtitle = 'Open & closed history';
            section2Icon = 'fa-database';
            section2IconBg = 'bg-primary-subtle text-primary';
        }

        // Register window-level sort helper
        if (typeof window !== 'undefined' && !window.openSortSheet) {
            window.openSortSheet = function () {
                if (typeof window.openFilterSheet === 'function') {
                    window.openFilterSheet();
                    if (typeof window.setTradeFilterCategory === 'function') {
                        window.setTradeFilterCategory('sort');
                    }
                }
            };
        }

        return `
        <!-- Section 1 Title -->
        <div class="d-flex align-items-center mb-2 px-1" style="font-size: 18px; font-weight: 600; color: #1f2937;">
            <span class="rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success me-2 flex-shrink-0" style="width: 28px; height: 28px;">
                <i class="fas fa-chart-simple" style="font-size: 14px;"></i>
            </span>
            <span>Portfolio Summary</span>
        </div>
        
        <!-- ONE White Summary Card -->
        <div class="card bg-white border shadow-none p-3 mb-2" style="border-radius: 18px; border-color: #E8E8E8 !important; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02) !important;">
            <div class="portfolio-summary-cards row align-items-center w-100 g-0">
                <!-- Total P&L -->
                <div class="portfolio-stat-card col d-flex align-items-center gap-2 ps-1">
                    <div class="rounded-circle d-flex align-items-center justify-content-center ${pnlBgClass} flex-shrink-0" style="width: 40px; height: 40px;">
                        <i class="fas ${pnlIconClass} ${pnlIconColor}" style="font-size: 16px;"></i>
                    </div>
                    <div class="d-flex flex-column min-w-0 align-items-start">
                        <span class="portfolio-stat-label text-muted text-truncate" style="font-size: 11px; font-weight: 500; line-height: 1.2;">Total P&L</span>
                        <strong class="portfolio-stat-value ${pnlToneClass} text-truncate" style="font-size: 15px; font-weight: 700; line-height: 1.2;">${pnlFormatted}</strong>
                        <span class="${pctClass} text-truncate" style="font-size: 10px; font-weight: 500; line-height: 1.2;">(${pctFormatted})</span>
                    </div>
                </div>
                <!-- Vertical Separator -->
                <div class="col-auto border-start" style="height: 48px; border-color: #E8E8E8 !important;"></div>
                <!-- Total Invested -->
                <div class="portfolio-stat-card col d-flex align-items-center gap-2 px-2">
                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-info-subtle flex-shrink-0" style="width: 40px; height: 40px; background-color: rgba(30, 64, 175, 0.08) !important;">
                        <i class="fas fa-wallet text-info" style="font-size: 16px; color: #1e40af !important;"></i>
                    </div>
                    <div class="d-flex flex-column min-w-0 align-items-start">
                        <span class="portfolio-stat-label text-muted text-truncate" style="font-size: 11px; font-weight: 500; line-height: 1.2;">Total Invested</span>
                        <strong class="portfolio-stat-value text-dark text-truncate" style="font-size: 15px; font-weight: 700; line-height: 1.2;">${fmtINR(inv)}</strong>
                        <span class="text-muted text-truncate" style="font-size: 10px; font-weight: 500; line-height: 1.2;">(100.00%)</span>
                    </div>
                </div>
                <!-- Vertical Separator -->
                <div class="col-auto border-start" style="height: 48px; border-color: #E8E8E8 !important;"></div>
                <!-- Total Holdings -->
                <div class="portfolio-stat-card col d-flex align-items-center gap-2 pe-1">
                    <div class="rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle flex-shrink-0" style="width: 40px; height: 40px; background-color: rgba(202, 138, 4, 0.08) !important;">
                        <i class="fas fa-briefcase text-warning" style="font-size: 16px; color: #ca8a04 !important;"></i>
                    </div>
                    <div class="d-flex flex-column min-w-0 align-items-start">
                        <span class="portfolio-stat-label text-muted text-truncate" style="font-size: 11px; font-weight: 500; line-height: 1.2;">Total Holdings</span>
                        <strong class="portfolio-stat-value text-dark text-truncate" style="font-size: 15px; font-weight: 700; line-height: 1.2;">${count}</strong>
                        <span class="text-muted text-truncate" style="font-size: 10px; font-weight: 500; line-height: 1.2;">(100.00%)</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 32px Empty Space -->
        <div style="height: 30px;"></div>
        
        <!-- Section 2 Title + Subtitle and Sort/Filter Buttons -->
        <div class="d-flex align-items-center justify-content-between mb-3 px-1">
            <div class="d-flex align-items-center gap-2">
                <span class="rounded-circle d-flex align-items-center justify-content-center ${section2IconBg} flex-shrink-0" style="width: 32px; height: 32px;">
                    <i class="fas ${section2Icon}" style="font-size: 14px;"></i>
                </span>
                <div class="d-flex flex-column">
                    <h2 class="fs-6 fw-bold text-dark mb-0">${section2Title}</h2>
                    <span class="text-muted" style="font-size: 11px;">${section2Subtitle}</span>
                </div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1" onclick="window.openSortSheet()" style="font-size: 12px; font-weight: 500;">
                    <i class="fas fa-arrow-down-wide-short text-muted" style="font-size: 11px;"></i> Sort <i class="fas fa-chevron-down text-muted" style="font-size: 9px;"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1" onclick="window.openFilterSheet()" style="font-size: 12px; font-weight: 500;">
                    <i class="fas fa-filter text-muted" style="font-size: 11px;"></i> Filter <i class="fas fa-chevron-down text-muted" style="font-size: 9px;"></i>
                </button>
            </div>
        </div>
        `;
    }

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

    function renderTwoItemSummaryRow(net, count) {
        return renderPortfolioSummaryCards({
            net,
            invested: 0,
            holdings: count
        });
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

    function paintTradeRangeSummary({
        containerId,
        wordsId,
        net,
        invested,
        holdings,
        count,
        countLabel,
        useTwoItemLayout,
        profitCount,
        lossCount,
        usePortfolioLayout
    }) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const portfolio = usePortfolioLayout
            || invested != null
            || holdings != null
            || useTwoItemLayout;
        if (portfolio) {
            el.innerHTML = renderPortfolioSummaryCards({
                net,
                invested: invested != null ? invested : 0,
                holdings: holdings != null ? holdings : count
            });
        } else {
            el.innerHTML = renderTradeSummaryRow(net, count, countLabel);
        }
        if (wordsId) paintMoneyAmountWords(document.getElementById(wordsId), net, 'center');
    }

    function paintPastTradeSummary(summary) {
        paintTradeRangeSummary({
            containerId: 'pastSummaryStats',
            wordsId: 'pastSummaryNetWords',
            net: summary.net,
            invested: summary.invested,
            holdings: summary.holdings,
            usePortfolioLayout: true
        });
    }

    function paintPlanTradeSummary(summary) {
        paintTradeRangeSummary({
            containerId: 'planSummaryStats',
            wordsId: 'planSummaryNetWords',
            net: summary.net,
            invested: summary.invested,
            holdings: summary.holdings,
            usePortfolioLayout: true
        });
    }

    global.MTFRegister({
        aggregatePortfolioSummary,
        renderPortfolioSummaryCards,
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
