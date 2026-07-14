/**
 * Trade detail — full-height bottom sheet with position card content.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        fmtDateShort,
        renderIcon,
        renderPageEmptyCard,
        formatTradeLeverageLabel,
        createAppPane,
        Sheet
    } = global.MTFComponents;

    let detailPane = null;
    let dismissQuiet = false;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function getDetailPane() {
        if (!detailPane) {
            detailPane = createAppPane('#tradeDetailSheet', {
                fullHeight: true,
                heightRatio: 0.9,
                topperOverflow: false,
                onDismiss: () => {
                    if (dismissQuiet) {
                        dismissQuiet = false;
                        return;
                    }
                    if (typeof global.backFromTradeDetail === 'function') {
                        global.backFromTradeDetail({ fromPane: true });
                    }
                }
            });
        }
        return detailPane;
    }

    const TradeDetailSheet = {
        present() {
            if (Sheet?.isOpen?.()) Sheet.close();
            if (global.MTFComponents.TradeSheet?.isOpen?.()) {
                global.MTFComponents.TradeSheet.close();
            }
            const body = document.getElementById('tradeDetailContent');
            if (body) {
                body.removeAttribute('overflow-y');
                body.style.height = '';
                body.style.maxHeight = '';
                body.classList.add('trade-detail-scroll');
                body.scrollTop = 0;
            }
            getDetailPane().present();
        },
        close({ quiet = false } = {}) {
            dismissQuiet = !!quiet;
            getDetailPane().close();
        },
        isOpen() {
            return getDetailPane().isOpen();
        }
    };

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function tradeVariant(tx) {
        if (!tx) return 'open';
        if (tx.executed === false) return 'plan';
        if ((tx.status || 'closed') === 'open') return 'open';
        return 'past';
    }

    function companyInitial(company) {
        const s = String(company || '').trim();
        if (!s) return '•';
        return s.charAt(0).toUpperCase();
    }

    function hashCompanyTone(company) {
        const s = String(company || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h) % 6;
    }

    function todayDateKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatLivePrice(price) {
        if (price == null || isNaN(Number(price))) return '—';
        return '₹' + Number(price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

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
        if (n < 0) return Math.min(100, Math.abs(n));
        return Math.max(0, Math.min(100, n));
    }

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

    function remainingToTargetParts(livePrice, targetPrice) {
        const live = Number(livePrice);
        const target = Number(targetPrice);
        if (!(live > 0) || !(target > 0)) return null;
        const gap = target - live;
        const abs = Math.abs(gap);
        const pct = Math.abs((gap / live) * 100);
        const money = abs.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        if (Math.abs(gap) < 0.005) {
            return { label: 'At target', money: null, pct: null, tone: 'neutral' };
        }
        if (gap > 0) {
            return { label: 'Remaining', money: `₹${money}`, pct: `${pct.toFixed(2)}%`, tone: 'remain' };
        }
        return { label: 'Above target', money: `₹${money}`, pct: `${pct.toFixed(2)}%`, tone: 'above' };
    }

    function formatDayChangeParts(quote) {
        if (!quote || quote.price == null || isNaN(Number(quote.price))) return null;
        const change = Number(quote.change);
        const changePct = Number(quote.changePct);
        if (isNaN(change)) return null;
        const pctText = !isNaN(changePct)
            ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
            : '';
        const abs = Math.abs(change).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const absText = `${change >= 0 ? '+₹' : '-₹'}${abs} Today`;
        return {
            up: change >= 0,
            pctText,
            absText: pctText ? `(${absText})` : absText
        };
    }

    function getTargetPrice(t) {
        const helpers = tradePages();
        if (helpers.getEffectiveSellPrice) {
            const sp = Number(helpers.getEffectiveSellPrice(t));
            if (sp > 0) return sp;
        }
        const sell = Number(t && t.sellPrice);
        if (sell > 0) return sell;
        const buy = Number(t && t.buyPrice);
        return buy > 0 ? buy : null;
    }

    function runSellCalc(tx, sellPrice) {
        const calculateTrade = (global.MTFAppHelpers || {}).calculator?.calculateTrade;
        if (!calculateTrade || !(Number(sellPrice) > 0) || !tx.buyDate || !tx.quantity || !tx.buyPrice) {
            return null;
        }
        try {
            return calculateTrade({
                ...tx,
                sellPrice: Number(sellPrice),
                sellDate: tx.sellDate || todayDateKey(),
                status: 'closed'
            });
        } catch (_) {
            return null;
        }
    }

    function signedMoney(amount, { compact = false } = {}) {
        const n = Number(amount) || 0;
        const abs = Math.abs(n).toLocaleString('en-IN', {
            minimumFractionDigits: compact ? 0 : 2,
            maximumFractionDigits: compact ? 0 : 2
        });
        if (n > 0) return `+₹${abs}`;
        if (n < 0) return `−₹${abs}`;
        return `₹${abs}`;
    }

    function signedPct(pct) {
        if (pct == null || isNaN(Number(pct))) return '—';
        const n = Number(pct);
        const abs = Math.abs(n).toFixed(2);
        if (n > 0) return `+${abs}%`;
        if (n < 0) return `−${abs}%`;
        return `${abs}%`;
    }

    function toneClass(amount) {
        const n = Number(amount) || 0;
        if (Math.abs(n) < 0.005) return 'text-body-secondary';
        return n >= 0 ? 'text-success' : 'text-danger';
    }

    function renderHeader(tx, variant, pnlAmount, pnlPct) {
        const { appTag } = global.MTFComponents || {};
        const company = tx.company || 'Trade';
        const qty = Number(tx.quantity) || 0;
        const leverage = formatTradeLeverageLabel(tx);
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(tx) : 0;
        const daysLabel = daysHeld === 1 ? '1D' : `${daysHeld}D`;
        const tone = hashCompanyTone(company);
        const pnlTone = toneClass(pnlAmount);
        const isOpen = variant === 'open' || (variant !== 'past' && (tx.status || 'closed') === 'open');
        const statusLabel = isOpen ? 'Open' : 'Closed';
        const statusVariant = isOpen ? 'open' : 'secondary';
        const broker = String(tx.broker || '').trim();
        const showBroker = broker && !/^none$/i.test(broker);
        const tagsHtml = typeof appTag === 'function'
            ? `<div class="trade-position-tags">
                    ${appTag(escapeHtml(statusLabel), statusVariant)}
                    ${showBroker ? appTag(escapeHtml(broker), 'broker') : ''}
               </div>`
            : '';

        return `
            <div class="trade-detail-header">
                <span class="trade-detail-avatar trade-position-avatar--${tone}" aria-hidden="true">${escapeHtml(companyInitial(company))}</span>
                <div class="trade-detail-header-main min-w-0">
                    <div class="trade-position-title-row">
                        <div class="trade-detail-name text-truncate" title="${escapeHtml(company)}">${escapeHtml(company)}</div>
                        ${tagsHtml}
                    </div>
                    <div class="trade-detail-meta">
                        <span>Qty <span class="trade-detail-meta-em">${qty}</span></span>
                        <span class="trade-position-meta-sep" aria-hidden="true">•</span>
                        <span class="trade-detail-meta-item">${renderIcon('fa-hand-holding-usd', { className: 'trade-detail-meta-icon' })}<span class="trade-detail-meta-em">${escapeHtml(leverage)}</span> MTF</span>
                        <span class="trade-position-meta-sep" aria-hidden="true">•</span>
                        <span class="trade-detail-meta-item">${renderIcon('fa-clock', { className: 'trade-detail-meta-icon' })}Hold <span class="trade-detail-meta-em">${escapeHtml(daysLabel)}</span></span>
                    </div>
                </div>
                <div class="trade-detail-aside flex-shrink-0">
                    <div class="trade-detail-pnl d-flex flex-column align-items-end gap-1">
                        <div class="trade-detail-pnl-value ${pnlTone}">${escapeHtml(signedMoney(pnlAmount, { compact: true }))}</div>
                        ${pnlPct != null ? `<span class="badge rounded-pill ${pnlTone === 'text-success' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} px-2 py-1" style="font-size: 0.65rem; font-weight: 600;">${escapeHtml(signedPct(pnlPct))}</span>` : ''}
                    </div>
                    <button type="button" class="trade-detail-close-btn"
                        onclick="backFromTradeDetail()" aria-label="Close">
                        ${renderIcon('fa-times')}
                    </button>
                </div>
            </div>
        `;
    }



    function renderPriceInputs(tx, targetPrice) {
        const id = escapeHtml(tx.id || '');
        const buy = Number(tx.buyPrice) || 0;
        const qty = Number(tx.quantity) || 0;
        const targetGainPct = (buy > 0 && targetPrice > 0) ? ((targetPrice - buy) / buy) * 100 : null;
        const targetGainHtml = targetGainPct != null
            ? `<span class="trade-detail-price-badge trade-detail-price-badge--success">+${escapeHtml(targetGainPct.toFixed(2))}%</span>`
            : '';

        return `
            <section class="trade-detail-prices">
                <div class="trade-detail-price-cell d-flex flex-row align-items-center justify-content-start p-0 gap-3">
                    <span class="d-inline-flex align-items-center justify-content-center text-success rounded" style="width: 2.25rem; height: 2.25rem; background-color: var(--gr-accent-soft); flex-shrink: 0;">
                        ${renderIcon('fa-cube', { style: 'font-size: 1.15rem;' })}
                    </span>
                    <div class="d-flex flex-column align-items-start justify-content-center">
                        <span class="trade-detail-price-label" style="line-height: 1;">Quantity</span>
                        <span class="trade-detail-price-value text-body" style="font-size: 1.25rem; line-height: 1.1; margin: 0.4rem 0;">${qty}</span>
                        <span class="small text-muted" style="font-size: 0.75rem; font-weight: 500; line-height: 1;">Shares</span>
                    </div>
                </div>
                <span class="trade-detail-price-divider"></span>
                <button type="button" class="trade-detail-price-cell btn border-0 bg-transparent text-start shadow-none p-0 d-flex flex-row align-items-center justify-content-center gap-3"
                    onclick="openBuyPriceModal('${id}')" aria-label="Edit buy price">
                    <span class="d-inline-flex align-items-center justify-content-center rounded" style="width: 2.25rem; height: 2.25rem; background-color: var(--blue500-soft, rgba(10, 132, 255, 0.12)); color: var(--blue500, #0a84ff); flex-shrink: 0;">
                        ${renderIcon('fa-wallet', { style: 'font-size: 1.15rem;' })}
                    </span>
                    <div class="d-flex flex-column align-items-start justify-content-center min-w-0">
                        <span class="trade-detail-price-label" style="line-height: 1;">Buy Price</span>
                        <span class="trade-detail-price-value trade-detail-price-value--buy" style="font-size: 1.25rem; line-height: 1.1; margin: 0.4rem 0;">${fmtDec(buy)}</span>
                        <span class="trade-detail-price-badge trade-detail-price-badge--info mt-0">Avg. Entry</span>
                    </div>
                </button>
                <span class="trade-detail-price-divider"></span>
                <button type="button" class="trade-detail-price-cell btn border-0 bg-transparent text-start shadow-none p-0 d-flex flex-row align-items-center justify-content-end gap-3"
                    onclick="openTargetModal('${id}')" aria-label="Edit target price">
                    <span class="d-inline-flex align-items-center justify-content-center text-danger rounded" style="width: 2.25rem; height: 2.25rem; background-color: var(--gr-danger-soft, rgba(239, 68, 68, 0.1)); flex-shrink: 0;">
                        ${renderIcon('fa-bullseye', { style: 'font-size: 1.15rem;' })}
                    </span>
                    <div class="d-flex flex-column align-items-start justify-content-center min-w-0">
                        <span class="trade-detail-price-label" style="line-height: 1;">Target Price</span>
                        <span class="trade-detail-price-value trade-detail-price-value--target" style="font-size: 1.25rem; line-height: 1.1; margin: 0.4rem 0;">${targetPrice != null ? fmtDec(targetPrice) : '—'}</span>
                        ${targetGainHtml ? targetGainHtml.replace('mt-1', 'mt-0') : ''}
                    </div>
                </button>
            </section>
        `;
    }

    function renderIfSoldNow(tx, sellPrice, calc, variant, hasLiveQuote, quote, livePrice) {
        const qty = Number(tx.quantity) || 0;
        const price = Number(sellPrice) || 0;
        const sellValue = price > 0 ? price * qty : 0;
        const interest = calc ? Number(calc.interest) || 0 : Number(tx.interest) || 0;
        const charges = calc ? Number(calc.totalCharges) || 0 : Number(tx.charges) || 0;
        const totalCost = interest + charges;
        const net = calc ? Number(calc.netProfit) || 0 : Number(tx.netProfit) || 0;
        const investment = calc
            ? Number(calc.totalInvestment) || 0
            : (Number(tx.buyPrice) || 0) * qty;
        const netPct = investment > 0 ? (net / investment) * 100 : null;
        const title = 'IF SOLD NOW';
        const subtitle = '(At Current Market Price)';
        
        const changeParts = formatDayChangeParts(quote);
        const dayTone = !changeParts ? 'text-body-secondary' : changeParts.up ? 'text-success' : 'text-danger';
        const dayChangeHtml = changeParts
            ? `<span class="${dayTone}">${escapeHtml(changeParts.pctText)}</span> <span class="text-muted">${escapeHtml(changeParts.absText)}</span>`
            : '';
            
        const cmpHtml = `
            <div class="trade-detail-ifsold-col">
                <span class="trade-detail-ifsold-label">Current Market Price</span>
                <span class="trade-detail-ifsold-value">${livePrice != null ? fmtDec(livePrice) : fmtDec(sellPrice)}</span>
                ${dayChangeHtml ? `<div class="mt-1 text-center" style="font-size: 0.75rem; font-weight: 500; white-space: nowrap;">${dayChangeHtml}</div>` : ''}
            </div>
        `;

        return `
            <section class="trade-detail-ifsold">
                <div class="trade-detail-ifsold-title">
                    <span class="trade-detail-ifsold-title-icon-wrap">
                        ${renderIcon('fa-chart-line', { className: 'trade-detail-ifsold-title-icon' })}
                    </span>
                    <span class="trade-detail-ifsold-title-text">${escapeHtml(title)}</span>
                    <span class="trade-detail-ifsold-title-sub">${escapeHtml(subtitle)}</span>
                </div>
                <div class="trade-detail-ifsold-grid">
                    ${cmpHtml}
                    <span class="trade-detail-ifsold-vline" aria-hidden="true"></span>
                    <div class="trade-detail-ifsold-col">
                        <span class="trade-detail-ifsold-label">Sell Value</span>
                        <span class="trade-detail-ifsold-value text-body">${fmtDec(sellValue)}</span>
                    </div>
                    <span class="trade-detail-ifsold-vline" aria-hidden="true"></span>
                    <div class="trade-detail-ifsold-col">
                        <span class="trade-detail-ifsold-label">Net P&amp;L</span>
                        <span class="trade-detail-ifsold-value ${toneClass(net)}">${escapeHtml(signedMoney(net))}</span>
                    </div>
                    <span class="trade-detail-ifsold-vline" aria-hidden="true"></span>
                    <div class="trade-detail-ifsold-col trade-detail-ifsold-col--pct">
                        <span class="trade-detail-ifsold-label">Net P&amp;L %</span>
                        <span class="trade-detail-ifsold-value ${toneClass(netPct)}">${escapeHtml(signedPct(netPct))}</span>
                    </div>
                </div>
            </section>
        `;
    }

    function renderCostCards(tx, calc) {
        const interestDetails = (global.MTFAppHelpers || {}).interestDetails;
        const interest = calc ? Number(calc.interest) || 0 : Number(tx.interest) || 0;
        const charges = calc ? Number(calc.totalCharges) || 0 : Number(tx.charges) || 0;
        const totalCost = interest + charges;
        const d = interestDetails ? interestDetails(tx) : { perDayInterest: 0, days: 0 };
        const days = calc ? (Number(calc.holdingDays) || d.days || 0) : (d.days || 0);
        const perDay = (calc && days > 0)
            ? Math.round((interest / days) * 100) / 100
            : (d.perDayInterest || 0);
        const interestBadge = perDay > 0 && days > 0
            ? `${fmtDec(perDay)} × ${days}D`
            : (days > 0 ? `${days}D` : '—');

        return `
            <section class="trade-detail-costs">
                <button type="button" class="trade-detail-cost-card trade-detail-cost-card--interest"
                    onclick="openInterestModal('${escapeHtml(tx.id)}')" aria-label="Interest details">
                    <span class="trade-detail-cost-head">
                        <span class="trade-detail-cost-icon-box">${renderIcon('fa-percent', { className: 'trade-detail-cost-icon' })}</span>
                        <span class="trade-detail-cost-label">Interest</span>
                    </span>
                    <span class="trade-detail-cost-body">
                        <span class="trade-detail-cost-value">${fmtDec(interest)}</span>
                        <span class="trade-detail-cost-meta">${interestBadge}</span>
                    </span>
                </button>
                <button type="button" class="trade-detail-cost-card trade-detail-cost-card--charges"
                    onclick="openChargesModal('${escapeHtml(tx.id)}')" aria-label="Charges details">
                    <span class="trade-detail-cost-head">
                        <span class="trade-detail-cost-icon-box">${renderIcon('fa-receipt', { className: 'trade-detail-cost-icon' })}</span>
                        <span class="trade-detail-cost-label">Charges</span>
                    </span>
                    <span class="trade-detail-cost-body">
                        <span class="trade-detail-cost-value">${fmtDec(charges)}</span>
                        <span class="trade-detail-cost-meta">One-time</span>
                    </span>
                </button>
                <div class="trade-detail-cost-card trade-detail-cost-card--total" role="group" aria-label="Total cost">
                    <span class="trade-detail-cost-head">
                        <span class="trade-detail-cost-icon-box">${renderIcon('fa-wallet', { className: 'trade-detail-cost-icon' })}</span>
                        <span class="trade-detail-cost-label">Total</span>
                    </span>
                    <span class="trade-detail-cost-body">
                        <span class="trade-detail-cost-value">${fmtDec(totalCost)}</span>
                        <span class="trade-detail-cost-meta">Interest + Charges</span>
                    </span>
                </div>
            </section>
        `;
    }

    function renderTimeline(tx, variant) {
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(tx) : 0;
        const holdLabel = daysHeld === 1 ? '1 Day' : `${daysHeld} Days`;
        const buyDate = tx.buyDate ? fmtDateShort(tx.buyDate) : '—';
        const exitLabel = variant === 'past' ? 'Sold On' : 'Expected Exit';
        const exitDate = tx.sellDate ? fmtDateShort(tx.sellDate) : '—';
        const id = escapeHtml(tx.id || '');

        return `
            <section class="trade-detail-timeline-wrap">
                <div class="trade-detail-timeline">
                    <button type="button" class="trade-detail-timeline-step btn border-0 bg-transparent shadow-none p-0"
                        onclick="openHoldModal('${id}')" aria-label="Edit bought date">
                        <span class="trade-detail-timeline-icon-wrap">
                            ${renderIcon('fa-calendar-plus', { className: 'trade-detail-timeline-icon trade-detail-timeline-icon--buy' })}
                        </span>
                        <span class="trade-detail-timeline-copy">
                            <span class="trade-detail-timeline-label">Bought On</span>
                            <span class="trade-detail-timeline-value">${escapeHtml(buyDate)}</span>
                        </span>
                    </button>
                    <span class="trade-detail-timeline-sep" aria-hidden="true">
                        <span class="trade-detail-timeline-arrow">${renderIcon('fa-arrow-right')}</span>
                        <span class="trade-detail-timeline-vline"></span>
                    </span>
                    <button type="button" class="trade-detail-timeline-step btn border-0 bg-transparent shadow-none p-0"
                        onclick="openHoldModal('${id}')" aria-label="Edit holding period">
                        <span class="trade-detail-timeline-icon-wrap">
                            ${renderIcon('fa-hourglass-half', { className: 'trade-detail-timeline-icon trade-detail-timeline-icon--hold' })}
                        </span>
                        <span class="trade-detail-timeline-copy">
                            <span class="trade-detail-timeline-label">Holding</span>
                            <span class="badge rounded-pill trade-detail-hold-badge">${escapeHtml(holdLabel)}</span>
                        </span>
                    </button>
                    <span class="trade-detail-timeline-sep" aria-hidden="true">
                        <span class="trade-detail-timeline-arrow">${renderIcon('fa-arrow-right')}</span>
                        <span class="trade-detail-timeline-vline"></span>
                    </span>
                    <button type="button" class="trade-detail-timeline-step btn border-0 bg-transparent shadow-none p-0"
                        onclick="openHoldModal('${id}')" aria-label="Edit exit date">
                        <span class="trade-detail-timeline-icon-wrap">
                            ${renderIcon('fa-calendar-check', { className: 'trade-detail-timeline-icon trade-detail-timeline-icon--exit' })}
                        </span>
                        <span class="trade-detail-timeline-copy">
                            <span class="trade-detail-timeline-label">${escapeHtml(exitLabel)}</span>
                            <span class="trade-detail-timeline-value">${escapeHtml(exitDate)}</span>
                        </span>
                    </button>
                </div>
                <p class="trade-detail-timeline-hint mb-0">Tap dates to update buy or sell</p>
            </section>
        `;
    }

    function renderPrimaryActions(tx, variant) {
        const id = escapeHtml(tx.id || '');
        const actionBtn = (label, onclick, kind, icon) => `
            <button type="button" class="trade-detail-action-btn trade-detail-action-btn--${kind}"
                onclick="${onclick}">
                ${renderIcon(icon, { className: 'trade-detail-action-icon' })}
                <span>${label}</span>
            </button>
        `;

        const buttons = [];
        if (variant === 'open') {
            buttons.push(actionBtn('Done', `confirmCloseTrade('${id}')`, 'done', 'fa-check-circle'));
        }
        if (variant === 'plan') {
            buttons.push(actionBtn('Executed', `confirmExecuteTrade('${id}')`, 'done', 'fa-play'));
        }
        if (variant === 'past') {
            buttons.push(actionBtn('Copy', `confirmCopy('${id}')`, 'edit', 'fa-copy'));
            if (!tx.verified) {
                buttons.push(actionBtn('Verified', `confirmVerifyTrade('${id}')`, 'edit', 'fa-check-circle'));
            }
        }
        buttons.push(actionBtn('Edit', `openEditModal('${id}')`, 'edit', 'fa-pen-to-square'));
        buttons.push(actionBtn('Delete', `confirmDelete('${id}')`, 'delete', 'fa-trash-alt'));

        return `<div class="trade-detail-actions">${buttons.join('')}</div>`;
    }

    function renderTradeDetailPage() {
        const {
            getTradeDetailId = () => null,
            getTransaction,
            resolveTradeForDisplay,
            resolveTradeLiveSymbol,
            getTradeLiveQuote,
            estimateLiveSellReturn
        } = tradePages();

        const container = document.getElementById('tradeDetailContent');
        const headerEl = document.getElementById('tradeDetailHeader');
        const footerEl = document.getElementById('tradeDetailFooter');
        if (!container) return;

        const id = getTradeDetailId();
        const raw = id && getTransaction ? getTransaction(id) : null;
        if (!raw) {
            if (headerEl) {
                headerEl.innerHTML = `
                    <div class="d-flex justify-content-end mb-1">
                        <button type="button" class="trade-detail-close-btn" onclick="backFromTradeDetail()" aria-label="Close">
                            ${renderIcon('fa-times')}
                        </button>
                    </div>
                `;
            }
            container.innerHTML = renderPageEmptyCard(
                'fa-inbox',
                'Trade not found',
                'It may have been deleted. Tap close to return to the list.'
            );
            if (footerEl) footerEl.innerHTML = '';
            return;
        }

        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(raw) : raw;
        const variant = tradeVariant(tx);
        const symbol = resolveTradeLiveSymbol ? resolveTradeLiveSymbol(tx) : '';
        const quote = symbol && getTradeLiveQuote ? getTradeLiveQuote(symbol) : null;
        const livePrice = quote && quote.price != null && !isNaN(Number(quote.price))
            ? Number(quote.price)
            : null;
        const targetPrice = getTargetPrice(tx);

        const sellPriceForCalc = variant === 'past'
            ? (Number(tx.sellPrice) || targetPrice)
            : (livePrice != null ? livePrice : targetPrice);
        const calc = runSellCalc(tx, sellPriceForCalc);

        const useLivePnl = variant !== 'past' && livePrice != null && estimateLiveSellReturn;
        const liveReturn = useLivePnl ? estimateLiveSellReturn(tx, livePrice) : null;
        const pnlAmount = liveReturn != null && !isNaN(Number(liveReturn))
            ? liveReturn
            : (calc ? calc.netProfit : (tx.netProfit || 0));

        const notesBlock = tx.notes
            ? `<div class="trade-detail-notes">
                <div class="small fw-medium text-muted mb-1">Notes</div>
                <p class="small text-body mb-0">${escapeHtml(tx.notes)}</p>
               </div>`
            : '';

        const investment = calc
            ? Number(calc.totalInvestment) || 0
            : (Number(tx.buyPrice) || 0) * (Number(tx.quantity) || 0);
        const pnlPct = investment > 0 ? (pnlAmount / investment) * 100 : null;

        if (headerEl) headerEl.innerHTML = renderHeader(tx, variant, pnlAmount, pnlPct);
        container.innerHTML = `
            <div class="trade-detail-card w-100 d-flex flex-column gap-3">
                <hr class="trade-detail-divider my-0">
                ${renderPriceInputs(tx, targetPrice)}
                ${renderIfSoldNow(tx, sellPriceForCalc, calc, variant, livePrice != null, quote, livePrice)}
                ${renderCostCards(tx, calc)}
                ${renderTimeline(tx, variant)}
                ${notesBlock}
            </div>
        `;
        if (footerEl) footerEl.innerHTML = renderPrimaryActions(tx, variant);
    }

    global.MTFRegister({ renderTradeDetailPage, TradeDetailSheet });
})(typeof window !== 'undefined' ? window : globalThis);
