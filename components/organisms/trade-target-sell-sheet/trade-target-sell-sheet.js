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
            return `<button type="button" class="md-filter-chip${active ? ' md-filter-chip--selected' : ''}" onclick="setTargetSellPct(${p})" aria-pressed="${active}">${fmtCalcPctLabel(p)}</button>`;
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
            const tone = pct >= 0 ? 'target-sheet__gain--up' : 'target-sheet__gain--down';
            gainEl.className = `target-sheet__gain ${tone}`;
            gainEl.innerHTML = `<span>${sign}${pct.toFixed(2)}%</span><span class="target-sheet__gain-dot" aria-hidden="true">·</span><span>${sign}${fmtDec(Math.abs(diff))} per share</span>`;
        } else {
            gainEl.className = 'target-sheet__gain target-sheet__gain--neutral';
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
            ? `<i class="fas fa-bullseye mr-2 text-[var(--gr-accent)]"></i>${tx.company}`
            : `<i class="fas fa-tag mr-2 text-[var(--gr-danger)]"></i>${tx.company} Sell`;
        const actionLabel = isOpen ? 'Update Sell' : 'Update Sell Price';
        Sheet.open(sheetTitle, `
            <div class="target-sheet">
                <div class="target-sheet__hero">
                    <div class="target-sheet__price-col">
                        <span class="target-sheet__price-label">Buy</span>
                        <span class="target-sheet__price-value target-sheet__price-value--buy">${fmtDec(buy)}</span>
                    </div>
                    <div class="target-sheet__arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></div>
                    <div class="target-sheet__price-col target-sheet__price-col--sell">
                        <span class="target-sheet__price-label">${sellLabel}</span>
                        <span class="target-sheet__price-value target-sheet__price-value--sell" id="targetSellPreview">—</span>
                    </div>
                </div>
                <div class="target-sheet__gain target-sheet__gain--neutral" id="targetGainPreview">${gainPlaceholder}</div>
                <section class="target-sheet__section">
                    <h4 class="target-sheet__section-label">Quick target %</h4>
                    <div class="md-chip-group md-chip-group--filter target-sheet__chips" id="targetSellPctChips"></div>
                    <div class="target-sheet__custom-pct">
                        <input type="number" class="target-sheet__custom-pct-input" id="targetSellPctCustom" min="0.01" step="0.1" placeholder="Custom % e.g. 1.3" />
                        <button type="button" class="md-filter-chip target-sheet__custom-pct-btn" onclick="applyTargetSellPctCustom()">Add</button>
                    </div>
                </section>
                <section class="target-sheet__section">
                    <h4 class="target-sheet__section-label">Sell price</h4>
                    <div class="target-sheet__sell-input-wrap">
                        <span class="target-sheet__sell-currency" aria-hidden="true">₹</span>
                        <input type="number" class="target-sheet__sell-input" id="targetSellPrice" min="0.01" step="0.01" value="${sellVal}" oninput="onTargetSellPriceInput()" inputmode="decimal" />
                    </div>
                    <p class="target-sheet__hint">${isOpen ? 'Tap a % above or enter your target sell price manually.' : 'Tap a % above or enter the sell price manually.'}</p>
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
