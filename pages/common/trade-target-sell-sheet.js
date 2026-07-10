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
            ? `${global.MTFComponents.renderIcon('fa-bullseye', { className: 'me-2 text-danger' })}${tx.company}`
            : `${global.MTFComponents.renderIcon('fa-tag', { className: 'me-2 text-danger' })}${tx.company} Sell`;
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
