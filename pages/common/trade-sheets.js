/**
 * Trade detail/edit sheets — view, charges, interest, target, buy, leverage, hold
 * Merged for maintainability — each section keeps its original IIFE + MTFRegister.
 */

/* ========== Trade view details ========== */
/**
 * M42 — Trade view sheet detail list molecules.
 */
(function (global) {
    'use strict';

    const { renderTradeDetailRow } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function renderTradeDetailsList(t) {
        const { resolveTradeForDisplay, getDaysHeld } = tradeSheets();
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(t) : t;
        const bd = tx.breakdown || {};
        const totalInv = tx.totalInvestment || (tx.quantity * tx.buyPrice) || 0;
        const ownMargin = tx.ownMargin || totalInv;
        const mtfAmt = tx.mtfAmount || 0;
        const gross = tx.grossProfit || 0;
        const lev = tx.leverage || 1;
        const levDisplay = lev > 1 ? `${parseFloat(lev.toFixed(2))}x` : '1x';
        const daysHeld = getDaysHeld ? getDaysHeld(tx) : 0;
        const rows = [
            { label: 'Buy', amount: tx.buyPrice, tone: 'secondary', decimals: true },
            { label: 'Sell', amount: tx.sellPrice, tone: 'positive', decimals: true },
            { label: 'Qty', amount: tx.quantity, quantity: true },
            { label: 'Broker', amount: tx.broker || '—', tag: 'broker' },
            { label: 'Leverage', amount: levDisplay, tag: 'accent' },
            { label: 'Hold', amount: `${global.MTFComponents.renderIcon('fa-clock', { className: 'me-1 opacity-75' })}${daysHeld}d`, tag: 'default' },
            { label: 'Total Investment', amount: totalInv, tone: 'neutral', compact: true },
            { label: 'Your Margin', amount: ownMargin, tone: 'neutral', compact: true },
            { label: 'MTF Funded', amount: mtfAmt, tone: mtfAmt > 0 ? 'secondary' : 'neutral', compact: true },
            { label: 'Gross Profit', amount: gross, tone: gross >= 0 ? 'positive' : 'negative', compact: true },
            { label: 'MTF Interest', amount: tx.interest || 0, tone: 'warning', decimals: true },
            { label: 'Total Charges', amount: tx.charges || 0, tone: 'negative', decimals: true }
        ];
        const chargeItems = [
            { key: 'brokerage', label: 'Brokerage' },
            { key: 'stt', label: 'STT' },
            { key: 'exchange', label: 'Exchange' },
            { key: 'sebi', label: 'SEBI' },
            { key: 'stamp', label: 'Stamp Duty' },
            { key: 'gst', label: 'GST' },
            { key: 'pledge', label: 'Pledge' },
            { key: 'unpledge', label: 'Unpledge' },
            { key: 'dp', label: 'DP Charges' }
        ].filter((i) => (bd[i.key] || 0) > 0);
        chargeItems.forEach((i) => {
            rows.push({ label: i.label, amount: bd[i.key], tone: 'negative', decimals: true });
        });
        return `<div class="border rounded p-2">${rows.map(renderTradeDetailRow).join('')}</div>`;
    }

    function renderTradeViewPnLSummary(t) {
        const { resolveTradeForDisplay } = tradeSheets();
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(t) : t;
        const gross = tx.grossProfit || 0;
        const interest = tx.interest || 0;
        const charges = tx.charges || 0;
        const totalCost = charges + interest;
        const net = tx.netProfit || 0;
        const rows = [
            { label: 'Gross Profit', amount: gross, tone: gross >= 0 ? 'positive' : 'negative', compact: true },
            { label: 'MTF Interest', amount: interest, tone: 'warning', decimals: true },
            { label: 'Total Charges', amount: charges, tone: 'negative', decimals: true },
            { label: 'Total Cost', amount: totalCost, tone: 'negative', decimals: true },
            { label: 'P&L', amount: net, tone: net >= 0 ? 'positive' : 'negative', compact: true }
        ];
        const { renderIcon } = global.MTFComponents;
        return `
            <div class="mt-4">
                <div class="small text-muted text-uppercase fw-medium mb-2">${renderIcon('fa-calculator', { className: 'me-2' })}P&L Summary</div>
                <div class="border rounded p-2">${rows.map(renderTradeDetailRow).join('')}</div>
            </div>
        `;
    }

    global.MTFRegister({ renderTradeDetailsList, renderTradeViewPnLSummary });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade sheet meta ========== */
/**
 * M40 — Trade sheet meta tags and interest row molecules.
 */
(function (global) {
    'use strict';

    const { appTag } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function buildTradeMetaTags(tx, extras = []) {
        const { calcInterestDays, getDaysHeld } = tradeSheets();
        const lev = tx.leverage || 1;
        const levDisplay = lev > 1 ? `${parseFloat(Number(lev).toFixed(2))}x` : '1x';
        const daysHeld = (tx.buyDate && tx.sellDate && calcInterestDays)
            ? calcInterestDays(tx.buyDate, tx.sellDate)
            : (getDaysHeld ? getDaysHeld(tx) : 0);
        const holdLabel = daysHeld === 1 ? '1d hold' : `${daysHeld}d hold`;
        const tags = [
            appTag(tx.broker || '—', 'broker'),
            appTag(levDisplay, 'accent'),
            appTag(`<i class="far fa-clock me-1 opacity-75"></i>${holdLabel}`)
        ].concat(extras);
        return `<div class="d-flex flex-wrap gap-2 justify-content-center mb-3">${tags.join('')}</div>`;
    }

    function interestSheetRow(label, value, valueClass = '') {
        return `
            <tr>
                <td class="p-2 align-middle">
                    <span class="small text-muted fw-normal">${label}</span>
                </td>
                <td class="p-2 align-middle text-end">
                    <span class="fs-6 fw-normal ${valueClass}">${value}</span>
                </td>
            </tr>
        `;
    }

    global.MTFRegister({ buildTradeMetaTags, interestSheetRow });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Charges table ========== */
/**
 * M41 — Charges breakdown table molecule.
 */
(function (global) {
    'use strict';

    const { fmtDec } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function chargeSides(t) {
        const { getChargeConfig, calcOrderBrokerage, getEffectiveSellPrice } = tradeSheets();
        const chargeCfg = getChargeConfig(t.broker, t.buyDate, t.sellDate);
        const qty = t.quantity || 0;
        const buyVal = (t.buyPrice || 0) * qty;
        const sellVal = (getEffectiveSellPrice ? getEffectiveSellPrice(t) : t.sellPrice || 0) * qty;

        const buy = {
            orderValue: buyVal,
            brokerage: calcOrderBrokerage(buyVal, chargeCfg),
            stt: buyVal * chargeCfg.sttBuyPct,
            exchange: buyVal * chargeCfg.exchangePct,
            sebi: buyVal * chargeCfg.sebiPct,
            stamp: buyVal * chargeCfg.stampPct,
            pledge: chargeCfg.pledgeCharge || 0,
            unpledge: 0,
            dp: 0
        };
        buy.gst = (buy.brokerage + buy.exchange + buy.sebi + buy.pledge) * chargeCfg.gstPct;
        buy.total = buy.brokerage + buy.stt + buy.exchange + buy.sebi + buy.stamp + buy.pledge + buy.gst;

        const sell = {
            orderValue: sellVal,
            brokerage: calcOrderBrokerage(sellVal, chargeCfg),
            stt: sellVal * chargeCfg.sttSellPct,
            exchange: sellVal * chargeCfg.exchangePct,
            sebi: sellVal * chargeCfg.sebiPct,
            stamp: 0,
            pledge: 0,
            unpledge: chargeCfg.unpledgeCharge || 0,
            dp: chargeCfg.dpCharge || 0
        };
        sell.gst = (sell.brokerage + sell.exchange + sell.sebi + sell.unpledge + sell.dp) * chargeCfg.gstPct;
        sell.total = sell.brokerage + sell.stt + sell.exchange + sell.sebi + sell.unpledge + sell.dp + sell.gst;

        return { buy, sell, tradeType: chargeCfg.tradeType };
    }

    function chargesTable(buy, sell) {
        const { renderIcon } = global.MTFComponents;
        const rows = [
            ['Brokerage', buy.brokerage, sell.brokerage],
            ['STT', buy.stt, sell.stt],
            ['Exchange / Txn', buy.exchange, sell.exchange],
            ['SEBI', buy.sebi, sell.sebi],
            ['Stamp Duty', buy.stamp, sell.stamp],
            ['Pledge', buy.pledge, sell.pledge],
            ['Unpledge', buy.unpledge, sell.unpledge],
            ['DP Charges', buy.dp, sell.dp],
            ['GST (18%)', buy.gst, sell.gst]
        ].filter(([, b, s]) => (b + s) > 0);
        const body = rows.map(([l, b, s]) => `
            <tr>
                <td class="text-muted">${l}</td>
                <td class="text-end text-primary fs-6">${fmtDec(b)}</td>
                <td class="text-end fs-6">${fmtDec(s)}</td>
                <td class="text-end fw-semibold fs-6">${fmtDec(b + s)}</td>
            </tr>`).join('');
        return `
            <div class="table-responsive">
                <table class="table w-100">
                    <thead class="table-light">
                        <tr>
                            <th>Charge</th>
                            <th class="text-end">${renderIcon('fa-arrow-down', { className: 'me-1' })}Buy</th>
                            <th class="text-end">${renderIcon('fa-arrow-up', { colour: 'text-danger', className: 'me-1' })}Sell</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="text-muted">Order Value</td>
                            <td class="text-end text-primary fs-6">${fmtDec(buy.orderValue)}</td>
                            <td class="text-end fs-6">${fmtDec(sell.orderValue)}</td>
                            <td class="text-end fw-semibold fs-6">${fmtDec(buy.orderValue + sell.orderValue)}</td>
                        </tr>
                        ${body}
                        <tr class="fw-medium text-body-secondary border-top">
                            <td>Total Charges</td>
                            <td class="text-end text-primary fs-6">${fmtDec(buy.total)}</td>
                            <td class="text-end fs-6">${fmtDec(sell.total)}</td>
                            <td class="text-end text-muted fs-6">${fmtDec(buy.total + sell.total)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    global.MTFRegister({ chargeSides, chargesTable });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade view sheet ========== */
/**
 * O33 — Trade view detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        renderTradeCardPnl,
        renderTradeDetailsList,
        renderTradeViewPnLSummary,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openViewModal(id) {
        if (typeof global.openTradeDetail === 'function') {
            global.openTradeDetail(id);
            return;
        }
        const { getTransaction, resolveTradeForDisplay } = tradeSheets();
        const raw = getTransaction ? getTransaction(id) : null;
        if (!raw) { showToast('Transaction not found.', 'danger'); return; }
        const tx = resolveTradeForDisplay ? resolveTradeForDisplay(raw) : raw;

        const isOpen = (tx.status || 'closed') === 'open';
        const statusLabel = isOpen ? appTag('Open', 'warning') : appTag('Closed');
        const notesBlock = tx.notes
            ? `<div class="mt-4 pt-3 border-top">
                <div class="small fw-medium text-muted mb-1">Notes</div>
                <p class="small text-muted mb-0">${tx.notes}</p>
               </div>`
            : '';

        const html = `
            <div>
                <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div class="min-w-0">
                        <div class="fw-semibold text-truncate">${tx.company}</div>
                        ${isOpen ? `<div class="mt-1">${statusLabel}</div>` : ''}
                    </div>
                    <div class="flex-shrink-0">
                        ${renderTradeCardPnl(tx.netProfit, { size: 'md', compact: true })}
                    </div>
                </div>
                ${renderTradeDetailsList(tx)}
                ${renderTradeViewPnLSummary(tx)}
                ${notesBlock}
                <div class="small text-muted mt-3 text-center">ID: ${tx.id}</div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-eye', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company}</span>`, html, '');
    }

    global.MTFRegister({ openViewModal });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade charges sheet ========== */
/**
 * O34 — Trade charges detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        fmtDec,
        buildTradeMetaTags,
        chargeSides,
        chargesTable,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openChargesModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const { buy, sell, tradeType } = chargeSides(tx);
        const grand = buy.total + sell.total;
        const intraNote = tradeType === 'intraday'
            ? `<div class="alert alert-info py-2 small mb-2">${global.MTFComponents.renderIcon('fa-bolt', { className: 'me-1' })}Same-day ${tx.broker} trade — <strong>intraday charges</strong> apply (STT 0.025% on sell only, stamp 0.003% on buy; no pledge, unpledge or DP).</div>`
            : '';

        const chargesHtml = `
            ${buildTradeMetaTags(tx, tradeType === 'intraday' ? [appTag('Intraday', 'warning')] : [])}
            ${intraNote}
            ${chargesTable(buy, sell)}
            <div class="row g-2 text-center mt-3">
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-primary">Buy Side</div><div class="fs-6 fw-semibold text-primary">${fmtDec(buy.total)}</div></div></div>
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-muted">Sell Side</div><div class="fs-6 fw-medium text-body-secondary">${fmtDec(sell.total)}</div></div></div>
                <div class="col-4"><div class="bg-light rounded p-2"><div class="small text-muted">Total</div><div class="fs-6 fw-medium text-body">${fmtDec(grand)}</div></div></div>
            </div>
        `;

        Sheet.open(`${global.MTFComponents.renderIcon('fa-receipt', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Charges</span>`, chargesHtml, '');
    }

    global.MTFRegister({ openChargesModal });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade interest sheet ========== */
/**
 * O35 — Trade interest detail sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        interestSheetRow,
        appTag,
        showToast,
        Sheet
    } = global.MTFComponents;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openInterestModal(id) {
        const { getTransaction, interestDetails } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const d = interestDetails ? interestDetails(tx) : {};
        const lev = Number(tx.leverage) || 1;
        const levDisplay = lev > 1 ? `${parseFloat(lev.toFixed(2))}x` : '1x';
        const broker = tx.broker || '—';
        const noLeverage = d.mtf <= 0;
        const sameDayNote = d.sameDay
            ? '<p class="small text-muted mb-0">Same-day trade — no MTF interest. Broker charges use intraday rates.</p>'
            : '';
        const noLevNote = noLeverage && !d.sameDay
            ? '<p class="small text-muted mb-0">No leverage on this trade — broker funded amount is zero, so no MTF interest applies.</p>'
            : '';

        Sheet.open(`${global.MTFComponents.renderIcon('fa-percent', { className: 'text-info flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company}</span>${appTag(broker, 'broker')}`, `
            <div>
                <div class="trade-metrics-panel mb-3">
                    <table class="table table-sm trade-metrics-table">
                        <tbody>
                            ${interestSheetRow('Total interest', fmtDec(d.interest), 'text-warning')}
                            ${interestSheetRow('Total investment', fmtDec(d.totalInvestment))}
                            ${interestSheetRow('Your margin', fmtDec(d.ownMargin))}
                            ${interestSheetRow('Leverage', levDisplay, 'text-primary')}
                            ${interestSheetRow('Broker funded', fmtDec(d.mtf))}
                            ${interestSheetRow('Days financed', d.sameDay ? '0 day(s)' : `${d.days} day(s)`)}
                            ${interestSheetRow('Interest per day', fmtDec(d.perDayInterest), 'text-warning')}
                            ${interestSheetRow('Rate per day', `${(d.dailyRate * 100).toFixed(4)}%`)}
                            ${interestSheetRow('Rate per year', `${(d.annualRate * 100).toFixed(2)}%`)}
                        </tbody>
                    </table>
                </div>
                ${sameDayNote}
                ${noLevNote}
            </div>
        `, '');
    }

    global.MTFRegister({ openInterestModal });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade target sell sheet ========== */
/**
 * O36 — Target sell price sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        renderAppButtonRow,
        getCalcSellPctPresets,
        saveCalcSellPctPresets,
        fmtCalcPctLabel,
        showToast,
        Sheet
    } = global.MTFComponents;

    let targetModalTradeId = null;
    let targetActiveSellPct = null;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function renderTargetSellPctChips() {
        const wrap = document.getElementById('targetSellPctChips');
        if (!wrap) return;
        const presets = getCalcSellPctPresets();
        wrap.innerHTML = presets.map((p) => {
            const active = targetActiveSellPct != null && Math.abs(targetActiveSellPct - p) < 0.0001;
            const cls = active ? 'btn-success' : 'btn-outline-success';
            return `<button type="button" class="btn btn-sm ${cls} rounded-pill flex-fill px-3" onclick="setTargetSellPct(${p})" aria-pressed="${active}">${fmtCalcPctLabel(p)}</button>`;
        }).join('');
    }

    function updateTargetModalPreview() {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(targetModalTradeId) : null;
        if (!tx) return;
        const buy = Number(tx.buyPrice) || 0;
        const sell = parseFloat(document.getElementById('targetSellPrice')?.value) || 0;
        const previewEl = document.getElementById('targetSellPreview');
        const gainEl = document.getElementById('targetGainPreview');
        if (previewEl) previewEl.textContent = sell > 0 ? fmtDec(sell) : '—';
        if (!gainEl) return;
        if (buy > 0 && sell > 0) {
            const pct = ((sell - buy) / buy) * 100;
            const diff = sell - buy;
            const sign = pct >= 0 ? '+' : '';
            const tone = pct >= 0 ? 'text-success' : 'text-danger';
            gainEl.className = `small ${tone}`;
            gainEl.innerHTML = `${sign}${pct.toFixed(2)}% <span class="text-muted">·</span> ${sign}${fmtDec(Math.abs(diff))} per share`;
        } else {
            gainEl.className = 'small text-muted';
            const tx2 = getTransaction(targetModalTradeId);
            const isOpen = (tx2?.status || 'closed') === 'open';
            gainEl.textContent = isOpen ? 'Set a target sell price' : 'Set a sell price';
        }
    }

    function setTargetSellPct(pct) {
        const { getTransaction } = tradeSheets();
        targetActiveSellPct = pct;
        const tx = getTransaction ? getTransaction(targetModalTradeId) : null;
        const buy = Number(tx?.buyPrice) || 0;
        if (buy <= 0) {
            showToast('Buy price missing on this trade.', 'warning');
            return;
        }
        const el = document.getElementById('targetSellPrice');
        if (el) el.value = (buy * (1 + pct / 100)).toFixed(2);
        renderTargetSellPctChips();
        updateTargetModalPreview();
    }

    function applyTargetSellPctCustom() {
        const el = document.getElementById('targetSellPctCustom');
        const pct = parseFloat(el?.value);
        if (!pct || pct <= 0) {
            showToast('Enter a valid percentage.', 'warning');
            return;
        }
        const presets = getCalcSellPctPresets();
        if (!presets.some((p) => Math.abs(p - pct) < 0.0001)) {
            presets.push(pct);
            presets.sort((a, b) => a - b);
            saveCalcSellPctPresets(presets);
        }
        if (el) el.value = '';
        setTargetSellPct(pct);
    }

    function onTargetSellPriceInput() {
        targetActiveSellPct = null;
        renderTargetSellPctChips();
        updateTargetModalPreview();
    }

    function openTargetModal(id) {
        const { getTransaction, getEffectiveSellPrice } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        targetModalTradeId = id;
        targetActiveSellPct = null;
        const isOpen = (tx.status || 'closed') === 'open';
        const buy = Number(tx.buyPrice) || 0;
        const sellVal = tx.sellPrice || (getEffectiveSellPrice ? getEffectiveSellPrice(tx) : '') || '';
        const sellLabel = isOpen ? 'Target sell' : 'Sell';
        const gainPlaceholder = isOpen ? 'Set a target sell price' : 'Set a sell price';
        const sheetTitle = isOpen
            ? `${global.MTFComponents.renderIcon('fa-bullseye', { className: 'me-1 text-danger flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company}</span>`
            : `${global.MTFComponents.renderIcon('fa-tag', { className: 'me-1 text-danger flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Sell</span>`;
        const actionLabel = isOpen ? 'Update Sell' : 'Update Sell Price';
        Sheet.open(sheetTitle, `
            <div class="d-flex flex-column gap-3">
                <div class="border rounded-3 p-3 bg-white">
                    <div class="row align-items-center g-2 text-center">
                        <div class="col">
                            <div class="small text-muted text-uppercase mb-1">Buy</div>
                            <div class="fs-5 text-info">${fmtDec(buy)}</div>
                        </div>
                        <div class="col-auto text-muted px-1" aria-hidden="true">
                            ${global.MTFComponents.renderIcon('fa-arrow-right')}
                        </div>
                        <div class="col">
                            <div class="small text-muted text-uppercase mb-1">${sellLabel}</div>
                            <div class="fs-5 text-danger" id="targetSellPreview">—</div>
                        </div>
                    </div>
                    <div class="text-center mt-2" id="targetGainPreview">${gainPlaceholder}</div>
                </div>

                <section>
                    <label class="form-label small text-muted text-uppercase mb-2">Quick target %</label>
                    <div class="d-flex flex-wrap gap-2 mb-2" id="targetSellPctChips" role="group" aria-label="Target percentage presets"></div>
                    <div class="input-group">
                        <input type="number" class="form-control" id="targetSellPctCustom" min="0.01" step="0.1" placeholder="Custom % e.g. 1.3" inputmode="decimal" />
                        <button type="button" class="btn btn-outline-secondary" onclick="applyTargetSellPctCustom()">Add</button>
                    </div>
                </section>

                <section>
                    <label class="form-label small text-muted text-uppercase mb-2" for="targetSellPrice">Sell price</label>
                    <div class="input-group">
                        <span class="input-group-text bg-white">₹</span>
                        <input type="number" class="form-control" id="targetSellPrice" min="0.01" step="0.01" value="${sellVal}" oninput="onTargetSellPriceInput()" inputmode="decimal" />
                    </div>
                    <div class="form-text mb-0">${isOpen ? 'Tap a % above or enter your target sell price manually.' : 'Tap a % above or enter the sell price manually.'}</div>
                </section>
            </div>
        `, renderAppButtonRow('Cancel', actionLabel, {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveTargetSellPrice()',
            actionIcon: 'fa-check'
        }));
        renderTargetSellPctChips();
        updateTargetModalPreview();
    }

    async function saveTargetSellPrice() {
        const {
            getTransaction,
            updateTransaction,
            applyVerifiedReset,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = targetModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const sellPrice = parseFloat(document.getElementById('targetSellPrice')?.value);
        if (!sellPrice || sellPrice <= 0) {
            showToast('Enter a valid sell price.', 'warning');
            return;
        }
        const calc = calculateTrade({ ...tx, sellPrice });
        const saved = await updateTransaction(id, applyVerifiedReset(tx, {
            sellPrice,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        }));
        if (saved) {
            showToast('Sell price updated.', 'success');
            targetModalTradeId = null;
            targetActiveSellPct = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating sell price.', 'danger');
        }
    }

    global.MTFRegister({
        openTargetModal,
        setTargetSellPct,
        applyTargetSellPctCustom,
        onTargetSellPriceInput,
        saveTargetSellPrice
    });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade buy price sheet ========== */
/**
 * O37 — Buy price edit sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        renderAppButtonRow,
        showToast,
        Sheet
    } = global.MTFComponents;

    let buyPriceModalTradeId = null;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function openBuyPriceModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        buyPriceModalTradeId = id;
        const bp = Number(tx.buyPrice) || 0;
        Sheet.open(`${global.MTFComponents.renderIcon('fa-tag', { className: 'me-1 text-primary flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Buy</span>`, `
            <p class="small text-muted mb-3">Update buy price. Margin, charges, and P&L will recalculate.</p>
            <div class="mb-3">
                <label class="form-label small text-primary mb-1">Buy Price</label>
                <input type="number" class="form-control w-100" id="buyPriceModalInput" min="0.01" step="0.01" value="${bp}" inputmode="decimal" />
            </div>
        `, renderAppButtonRow('Cancel', 'Update Buy Price', {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveBuyPrice()',
            actionIcon: 'fa-check'
        }));
    }

    async function saveBuyPrice() {
        const {
            getTransaction,
            getEffectiveSellPrice,
            updateTransaction,
            applyVerifiedReset,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = buyPriceModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const buyPrice = parseFloat(document.getElementById('buyPriceModalInput')?.value);
        if (!buyPrice || buyPrice <= 0) {
            showToast('Enter a valid buy price.', 'warning');
            return;
        }
        const sellPrice = getEffectiveSellPrice ? getEffectiveSellPrice(tx) : tx.sellPrice;
        const calc = calculateTrade({ ...tx, buyPrice, sellPrice });
        const saved = await updateTransaction(id, applyVerifiedReset(tx, {
            buyPrice,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        }));
        if (saved) {
            showToast('Buy price updated.', 'success');
            buyPriceModalTradeId = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating buy price.', 'danger');
        }
    }

    global.MTFRegister({ openBuyPriceModal, saveBuyPrice });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade leverage sheet ========== */
/**
 * O38 — Leverage edit sheet organism.
 */
(function (global) {
    'use strict';

    const {
        fmtDec,
        renderAppButtonRow,
        showToast,
        Sheet
    } = global.MTFComponents;

    let leverageModalTradeId = null;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function leverageModalBreakdownHtml(tx, leverage) {
        const lev = Math.max(1, Number(leverage) || 1);
        const qty = Number(tx.quantity) || 0;
        const bp = Number(tx.buyPrice) || 0;
        const totalInv = bp * qty;
        const ownMargin = lev > 1 ? totalInv / lev : totalInv;
        const mtfAmt = lev > 1 ? totalInv * (1 - 1 / lev) : 0;
        return `
            <div class="fs-6">Total investment: ${fmtDec(totalInv)}</div>
            <div class="fs-6">Your margin: ${fmtDec(ownMargin)}</div>
            <div class="fs-6">Broker funded: ${fmtDec(mtfAmt)}</div>
        `;
    }

    function onLeverageModalInput() {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(leverageModalTradeId) : null;
        if (!tx) return;
        const lev = parseFloat(document.getElementById('levModalInput')?.value) || 1;
        const el = document.getElementById('levModalBreakdown');
        if (el) el.innerHTML = leverageModalBreakdownHtml(tx, lev);
    }

    function openLeverageModal(id) {
        const { getTransaction } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        leverageModalTradeId = id;
        const lev = Number(tx.leverage) || 1;
        Sheet.open(`${global.MTFComponents.renderIcon('fa-layer-group', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Leverage</span>`, `
            <p class="small text-muted mb-3">Update leverage only. Margin, interest, and P&L will recalculate.</p>
            <div class="mb-3">
                <label class="form-label small text-muted mb-1">Leverage (X)</label>
                <input type="number" class="form-control w-100" id="levModalInput" min="1" step="0.1" value="${lev}" oninput="onLeverageModalInput()" />
                <p class="form-text mb-0">Your margin = total investment ÷ leverage. Broker funds the rest.</p>
            </div>
            <div class="small text-muted" id="levModalBreakdown">
                ${leverageModalBreakdownHtml(tx, lev)}
            </div>
        `, renderAppButtonRow('Cancel', 'Update Leverage', {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveLeverage()',
            actionIcon: 'fa-check'
        }));
    }

    async function saveLeverage() {
        const {
            getTransaction,
            getEffectiveSellPrice,
            updateTransaction,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = leverageModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const leverage = parseFloat(document.getElementById('levModalInput')?.value);
        if (!leverage || leverage < 1) {
            showToast('Enter leverage of 1 or higher.', 'warning');
            return;
        }
        const sellPrice = getEffectiveSellPrice ? getEffectiveSellPrice(tx) : tx.sellPrice;
        const calc = calculateTrade({ ...tx, leverage, sellPrice });
        const saved = await updateTransaction(id, {
            leverage,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        });
        if (saved) {
            showToast('Leverage updated.', 'success');
            leverageModalTradeId = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating leverage.', 'danger');
        }
    }

    global.MTFRegister({ openLeverageModal, onLeverageModalInput, saveLeverage });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Trade hold sheet ========== */
/**
 * O39 — Hold dates edit sheet organism.
 */
(function (global) {
    'use strict';

    const {
        renderAppButtonRow,
        setDateInputValue,
        showToast,
        Sheet
    } = global.MTFComponents;

    let holdModalTradeId = null;
    let holdModalSyncing = false;

    function tradeSheets() {
        return (global.MTFAppHelpers || {}).tradeSheets || {};
    }

    function addDaysToDateKey(dateKey, days) {
        const { parseDateKey } = tradeSheets();
        const key = parseDateKey ? parseDateKey(dateKey) : dateKey;
        if (!key) return '';
        const d = new Date(key + 'T12:00:00');
        d.setDate(d.getDate() + Math.round(days));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function syncHoldModalDaysFromDates() {
        const { calcInterestDays } = tradeSheets();
        if (holdModalSyncing) return;
        const buyEl = document.getElementById('holdBuyDate');
        const sellEl = document.getElementById('holdSellDate');
        const daysEl = document.getElementById('holdDays');
        if (!buyEl || !sellEl || !daysEl) return;
        const buy = buyEl.value;
        const sell = sellEl.value;
        if (!buy || !sell) {
            daysEl.value = '';
            return;
        }
        holdModalSyncing = true;
        daysEl.value = String(calcInterestDays ? calcInterestDays(buy, sell) : 0);
        holdModalSyncing = false;
    }

    function onHoldModalDaysInput() {
        if (holdModalSyncing) return;
        const buyEl = document.getElementById('holdBuyDate');
        const sellEl = document.getElementById('holdSellDate');
        const daysEl = document.getElementById('holdDays');
        if (!buyEl || !sellEl || !daysEl) return;
        const buy = buyEl.value;
        const days = parseInt(daysEl.value, 10);
        if (!buy || Number.isNaN(days) || days < 0) return;
        holdModalSyncing = true;
        if (days === 0) {
            setDateInputValue(sellEl, buy);
        } else {
            setDateInputValue(sellEl, addDaysToDateKey(buy, days - 1));
        }
        holdModalSyncing = false;
    }

    function onHoldModalDateInput() {
        syncHoldModalDaysFromDates();
    }

    function setHoldModalSameDay() {
        const buyEl = document.getElementById('holdBuyDate');
        const sellEl = document.getElementById('holdSellDate');
        if (!buyEl?.value) return;
        holdModalSyncing = true;
        setDateInputValue(sellEl, buyEl.value);
        const daysEl = document.getElementById('holdDays');
        if (daysEl) daysEl.value = '0';
        holdModalSyncing = false;
    }

    function setHoldModalTodayPair() {
        const { calcInterestDays } = tradeSheets();
        const buyEl = document.getElementById('holdBuyDate');
        const sellEl = document.getElementById('holdSellDate');
        if (!buyEl || !sellEl) return;
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        holdModalSyncing = true;
        setDateInputValue(buyEl, today.toISOString().split('T')[0]);
        setDateInputValue(sellEl, tomorrow.toISOString().split('T')[0]);
        const daysEl = document.getElementById('holdDays');
        if (daysEl) daysEl.value = String(calcInterestDays ? calcInterestDays(buyEl.value, sellEl.value) : 1);
        holdModalSyncing = false;
    }

    function setHoldModalSellDateToday() {
        const buyEl = document.getElementById('holdBuyDate');
        const sellEl = document.getElementById('holdSellDate');
        if (!sellEl) return;
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (buyEl?.value && today < buyEl.value) {
            showToast('Sell date cannot be before buy date.', 'warning');
            return;
        }
        holdModalSyncing = true;
        setDateInputValue(sellEl, today);
        holdModalSyncing = false;
        syncHoldModalDaysFromDates();
    }

    function openHoldModal(id) {
        const { getTransaction, parseDateKey, calcInterestDays, getDaysHeld } = tradeSheets();
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        holdModalTradeId = id;
        const isOpen = (tx.status || 'closed') === 'open';
        const buyDate = parseDateKey ? parseDateKey(tx.buyDate) || '' : (tx.buyDate || '');
        const sellDate = parseDateKey ? parseDateKey(tx.sellDate) || '' : (tx.sellDate || '');
        const holdDays = buyDate && sellDate && calcInterestDays
            ? calcInterestDays(buyDate, sellDate)
            : (getDaysHeld ? getDaysHeld(tx) : 0);
        const openNote = isOpen
            ? '<p class="small text-muted mb-3">Open trade — dates below drive interest and charge estimates.</p>'
            : '';

        Sheet.open(`${global.MTFComponents.renderIcon('fa-clock', { className: 'me-1 flex-shrink-0' })}<span class="text-truncate min-w-0 flex-grow-1">${tx.company} Holding</span>`, `
            ${openNote}
            <div class="row g-2 mb-3">
                <div class="col-6">
                    <label class="form-label small text-primary mb-1" for="holdBuyDate">Buy Date</label>
                    <input type="date" class="form-control w-100" id="holdBuyDate" value="${buyDate}" oninput="onHoldModalDateInput()" onchange="onHoldModalDateInput()" />
                </div>
                <div class="col-6">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <label class="form-label small text-muted mb-0" for="holdSellDate">Sell Date</label>
                        <button type="button"
                            class="btn btn-sm btn-outline-secondary rounded-circle d-inline-flex align-items-center justify-content-center p-0"
                            style="width:1.75rem;height:1.75rem"
                            onclick="setHoldModalSellDateToday()"
                            title="Set sell date to today"
                            aria-label="Set sell date to today">
                            ${global.MTFComponents.renderIcon('fa-sync-alt', { size: 'xs' })}
                        </button>
                    </div>
                    <input type="date" class="form-control w-100" id="holdSellDate" value="${sellDate}" oninput="onHoldModalDateInput()" onchange="onHoldModalDateInput()" />
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label small text-muted mb-1" for="holdDays">Financed days</label>
                <input type="number" class="form-control w-100" id="holdDays" min="0" step="1" value="${holdDays}" oninput="onHoldModalDaysInput()" />
                <p class="form-text mb-0">Includes buy and sell days (matches broker interest). Change days to shift sell date, or edit dates directly.</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setHoldModalSameDay()">Same day</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setHoldModalTodayPair()">Today → Tomorrow</button>
            </div>
        `, renderAppButtonRow('Cancel', 'Update Dates', {
            cancelOnClick: 'closeSheet()',
            actionOnClick: 'saveHoldDates()',
            actionIcon: 'fa-check'
        }));
    }

    async function saveHoldDates() {
        const {
            getTransaction,
            getEffectiveSellPrice,
            updateTransaction,
            calculateTrade,
            refreshTradeListViews,
            refreshActiveMoreView
        } = tradeSheets();

        const id = holdModalTradeId;
        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const buyDate = document.getElementById('holdBuyDate')?.value;
        const sellDate = document.getElementById('holdSellDate')?.value;
        if (!buyDate || !sellDate) {
            showToast('Please select both buy and sell dates.', 'warning');
            return;
        }
        if (new Date(sellDate + 'T12:00:00') < new Date(buyDate + 'T12:00:00')) {
            showToast('Sell date cannot be before buy date.', 'warning');
            return;
        }
        const sellPrice = getEffectiveSellPrice ? getEffectiveSellPrice(tx) : tx.sellPrice;
        const calc = calculateTrade({ ...tx, buyDate, sellDate, sellPrice });
        const saved = await updateTransaction(id, {
            buyDate,
            sellDate,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        });
        if (saved) {
            showToast('Dates updated.', 'success');
            holdModalTradeId = null;
            Sheet.close();
            if (refreshTradeListViews) refreshTradeListViews();
            if (refreshActiveMoreView) refreshActiveMoreView();
        } else {
            showToast('Error updating dates.', 'danger');
        }
    }

        global.MTFRegister({
        openHoldModal,
        onHoldModalDateInput,
        onHoldModalDaysInput,
        setHoldModalSameDay,
        setHoldModalTodayPair,
        setHoldModalSellDateToday,
        saveHoldDates
    });
})(typeof window !== 'undefined' ? window : globalThis);
