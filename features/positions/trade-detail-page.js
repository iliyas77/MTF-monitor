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
        Sheet,
        renderMetricsGrid
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
            <div class="trade-detail-header" data-ref="trade-detail.header">
                <span class="trade-detail-avatar trade-position-avatar--${tone}" aria-hidden="true" data-ref="trade-detail.header.avatar">${escapeHtml(companyInitial(company))}</span>
                <div class="trade-detail-header-main min-w-0" data-ref="trade-detail.header.main">
                    <div class="trade-position-title-row" data-ref="trade-detail.header.title-row">
                        <div class="trade-detail-name text-truncate" title="${escapeHtml(company)}" data-ref="trade-detail.header.name">${escapeHtml(company)}</div>
                        ${tagsHtml}
                    </div>
                    <div class="trade-detail-meta" data-ref="trade-detail.header.meta">
                        <span>Qty <span class="trade-detail-meta-em">${qty}</span></span>
                        <span class="trade-position-meta-sep" aria-hidden="true">•</span>
                        <span class="trade-detail-meta-item">${renderIcon('fa-hand-holding-usd', { className: 'trade-detail-meta-icon' })}<span class="trade-detail-meta-em">${escapeHtml(leverage)}</span> MTF</span>
                        <span class="trade-position-meta-sep" aria-hidden="true">•</span>
                        <span class="trade-detail-meta-item">${renderIcon('fa-clock', { className: 'trade-detail-meta-icon' })}Hold <span class="trade-detail-meta-em">${escapeHtml(daysLabel)}</span></span>
                    </div>
                </div>
                <div class="trade-detail-aside flex-shrink-0" data-ref="trade-detail.header.aside">
                    <div class="trade-detail-pnl d-flex flex-column align-items-end gap-1" data-ref="trade-detail.header.pnl">
                        <div class="trade-detail-pnl-value ${pnlTone}" data-ref="trade-detail.header.pnl.value">${escapeHtml(signedMoney(pnlAmount, { compact: true }))}</div>
                        ${pnlPct != null ? `<span class="badge rounded-pill ${pnlTone === 'text-success' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} px-2 py-1" style="font-size: 0.65rem; font-weight: 600;" data-ref="trade-detail.header.pnl.pct">${escapeHtml(signedPct(pnlPct))}</span>` : ''}
                    </div>
                    <button type="button" class="trade-detail-close-btn"
                        onclick="backFromTradeDetail()" aria-label="Close" data-ref="trade-detail.header.close-btn">
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
        const targetGainLabel = targetGainPct != null ? `+${targetGainPct.toFixed(2)}%` : '';

        // Build the three price cells via the shared MetricsGrid component so the
        // detail page reuses the exact same cell design system as the list cards.
        // Buy Price and Target Price are clickable (open their edit modals); the
        // pencil affordance is shown via the [data-editable] hover state in CSS.
        const cells = [
            {
                label: 'Quantity',
                value: String(qty),
                icon: 'fa-cube',
                iconTone: 'green',
                subtitle: 'Shares',
                subtitleTone: 'green',
                align: 'center',
                data: { ref: 'trade-detail.prices.qty' }
            },
            {
                label: 'Buy Price',
                value: fmtDec(buy),
                valueClass: 'trade-detail-price-value--buy',
                icon: 'fa-wallet',
                iconTone: 'blue',
                subtitle: 'Avg. Entry',
                subtitleTone: 'blue',
                align: 'center',
                onclick: `openBuyPriceModal('${id}')`,
                ariaLabel: 'Edit buy price',
                data: { ref: 'trade-detail.prices.buy', editable: '' }
            },
            {
                label: 'Target Price',
                value: targetPrice != null ? fmtDec(targetPrice) : '—',
                valueClass: 'trade-detail-price-value--target',
                icon: 'fa-bullseye',
                iconTone: 'red',
                subtitle: targetGainLabel,
                subtitleTone: 'green',
                align: 'center',
                onclick: `openTargetModal('${id}')`,
                ariaLabel: 'Edit target price',
                data: { ref: 'trade-detail.prices.target', editable: '' }
            }
        ];

        const gridHtml = renderMetricsGrid
            ? renderMetricsGrid(cells, {
                gridClass: 'trade-detail-prices-grid',
                gridAttrs: { 'data-ref': 'trade-detail.prices' }
            })
            : '';

        return `<section class="trade-detail-prices-section" data-ref="trade-detail.prices.section">${gridHtml}</section>`;
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
            <div class="trade-detail-ifsold-col" data-ref="trade-detail.ifsold.cmp">
                <span class="trade-detail-ifsold-label" data-ref="trade-detail.ifsold.cmp.label">Current Market Price</span>
                <span class="trade-detail-ifsold-value" data-ref="trade-detail.ifsold.cmp.value">${livePrice != null ? fmtDec(livePrice) : fmtDec(sellPrice)}</span>
                ${dayChangeHtml ? `<div class="mt-1 text-center" style="font-size: 0.75rem; font-weight: 500; white-space: nowrap;" data-ref="trade-detail.ifsold.cmp.day-change">${dayChangeHtml}</div>` : ''}
            </div>
        `;

        return `
            <section class="trade-detail-ifsold" data-ref="trade-detail.ifsold">
                <div class="trade-detail-ifsold-grid" data-ref="trade-detail.ifsold.grid">
                    ${cmpHtml}
                    <span class="trade-detail-ifsold-vline" aria-hidden="true" data-ref="trade-detail.ifsold.vline"></span>
                    <div class="trade-detail-ifsold-col" data-ref="trade-detail.ifsold.net">
                        <span class="trade-detail-ifsold-label">Net P&amp;L</span>
                        <span class="trade-detail-ifsold-value ${toneClass(net)}" data-ref="trade-detail.ifsold.net.value">${escapeHtml(signedMoney(net))}</span>
                        <span class="trade-detail-ifsold-value ${toneClass(netPct)} ms-2" data-ref="trade-detail.ifsold.net.pct">${escapeHtml(signedPct(netPct))}</span>
                    </div>
                </div>
            </section>
        `;
    }

    function renderCostCards(tx, calc) {
        const id = escapeHtml(tx.id || '');
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

        // Build the three cost cells via the shared MetricsGrid component so the
        // detail page reuses the same cell design system. Interest and Charges
        // are clickable (open their detail modals); Total is a static cell.
        const cells = [
            {
                label: 'Interest',
                value: fmtDec(interest),
                icon: 'fa-percent',
                iconTone: 'orange',
                subtitle: interestBadge,
                subtitleTone: 'orange',
                align: 'center',
                onclick: `openInterestModal('${id}')`,
                ariaLabel: 'Interest details',
                data: { ref: 'trade-detail.costs.interest', editable: '' }
            },
            {
                label: 'Charges',
                value: fmtDec(charges),
                icon: 'fa-receipt',
                iconTone: 'red',
                subtitle: 'One-time',
                subtitleTone: 'red',
                align: 'center',
                onclick: `openChargesModal('${id}')`,
                ariaLabel: 'Charges details',
                data: { ref: 'trade-detail.costs.charges', editable: '' }
            },
            {
                label: 'Total',
                value: fmtDec(totalCost),
                icon: 'fa-wallet',
                iconTone: 'purple',
                subtitle: 'Interest + Charges',
                subtitleTone: 'purple',
                align: 'center',
                data: { ref: 'trade-detail.costs.total' }
            }
        ];

        const gridHtml = renderMetricsGrid
            ? renderMetricsGrid(cells, {
                gridClass: 'trade-detail-costs-grid',
                gridAttrs: { 'data-ref': 'trade-detail.costs' }
            })
            : '';

        return `<section class="trade-detail-costs-section" data-ref="trade-detail.costs.section">${gridHtml}</section>`;
    }

    function renderTimeline(tx, variant) {
        const getDaysHeld = (global.MTFAppHelpers || {}).getDaysHeld;
        const daysHeld = getDaysHeld ? getDaysHeld(tx) : 0;
        const holdLabel = daysHeld === 1 ? '1 Day' : `${daysHeld} Days`;
        const buyDate = tx.buyDate ? fmtDateShort(tx.buyDate) : '—';
        const exitLabel = variant === 'past' ? 'Sold On' : 'Expected Exit';
        const exitDate = tx.sellDate ? fmtDateShort(tx.sellDate) : '—';
        const id = escapeHtml(tx.id || '');

        // Build the three timeline cells via the shared MetricsGrid component so
        // the detail page reuses the same cell design system. Each step is
        // clickable (opens the hold/edit modal); the middle step shows the
        // holding-days badge as its subtitle.
        const cells = [
            {
                label: 'Bought On',
                value: buyDate,
                icon: 'fa-calendar-plus',
                iconTone: 'blue',
                align: 'center',
                onclick: `openHoldModal('${id}')`,
                ariaLabel: 'Edit bought date',
                data: { ref: 'trade-detail.timeline.buy', editable: '' }
            },
            {
                label: 'Holding',
                value: holdLabel,
                valueClass: 'trade-detail-hold-badge',
                icon: 'fa-hourglass-half',
                iconTone: 'blue',
                align: 'center',
                onclick: `openHoldModal('${id}')`,
                ariaLabel: 'Edit holding period',
                data: { ref: 'trade-detail.timeline.hold', editable: '' }
            },
            {
                label: exitLabel,
                value: exitDate,
                icon: 'fa-calendar-check',
                iconTone: 'purple',
                align: 'center',
                onclick: `openHoldModal('${id}')`,
                ariaLabel: 'Edit exit date',
                data: { ref: 'trade-detail.timeline.exit', editable: '' }
            }
        ];

        const gridHtml = renderMetricsGrid
            ? renderMetricsGrid(cells, {
                gridClass: 'trade-detail-timeline-grid',
                gridAttrs: { 'data-ref': 'trade-detail.timeline.track' }
            })
            : '';

        return `<section class="trade-detail-timeline-section" data-ref="trade-detail.timeline">${gridHtml}<p class="trade-detail-timeline-hint mb-0" data-ref="trade-detail.timeline.hint">Tap dates to update buy or sell</p></section>`;
    }

    function renderPrimaryActions(tx, variant) {
        const id = escapeHtml(tx.id || '');
        const actionBtn = (label, onclick, kind, icon) => `
            <button type="button" class="trade-detail-action-btn trade-detail-action-btn--${kind}"
                onclick="${onclick}" data-ref="trade-detail.actions.btn-${kind}">
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

        return `<div class="trade-detail-actions" data-ref="trade-detail.actions">${buttons.join('')}</div>`;
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
                    <div class="d-flex justify-content-end mb-1" data-ref="trade-detail.not-found.header">
                        <button type="button" class="trade-detail-close-btn" onclick="backFromTradeDetail()" aria-label="Close" data-ref="trade-detail.not-found.close-btn">
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
            ? `<div class="trade-detail-notes" data-ref="trade-detail.notes">
                <div class="small fw-medium text-muted mb-1" data-ref="trade-detail.notes.label">Notes</div>
                <p class="small text-body mb-0" data-ref="trade-detail.notes.body">${escapeHtml(tx.notes)}</p>
               </div>`
            : '';

        const investment = calc
            ? Number(calc.totalInvestment) || 0
            : (Number(tx.buyPrice) || 0) * (Number(tx.quantity) || 0);
        const pnlPct = investment > 0 ? (pnlAmount / investment) * 100 : null;

        if (headerEl) headerEl.innerHTML = renderHeader(tx, variant, pnlAmount, pnlPct);
        container.innerHTML = `
            <div class="trade-detail-card w-100 d-flex flex-column gap-3" data-ref="trade-detail.card">
                <hr class="trade-detail-divider my-0" data-ref="trade-detail.divider">
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
