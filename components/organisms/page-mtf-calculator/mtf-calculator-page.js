/**
 * O21 — MTF Calculator page organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        setAppTagElement,
        fmtDec,
        renderAmount,
        renderTotalAmountCard,
        amountInWords,
        shouldShowAmountInWords,
        setDateInputValue,
        showToast,
        Sheet
    } = global.MTFComponents;

    const CALC_SELL_PCT_KEY = 'mtf_calc_sell_pct_presets';
    const DEFAULT_CALC_SELL_PCTS = [0.5, 1, 1.3, 1.5, 2, 3];
    let calcActiveSellPct = null;
    let calcSellPriceProgrammatic = false;

    function calculator() {
        return (global.MTFAppHelpers || {}).calculator || {};
    }

    function getCalcSellPctPresets() {
        try {
            const saved = JSON.parse(localStorage.getItem(CALC_SELL_PCT_KEY));
            if (Array.isArray(saved) && saved.length) {
                return [...new Set(saved.map((p) => parseFloat(p)).filter((p) => p > 0))].sort((a, b) => a - b);
            }
        } catch (_) {}
        return [...DEFAULT_CALC_SELL_PCTS];
    }

    function saveCalcSellPctPresets(presets) {
        localStorage.setItem(CALC_SELL_PCT_KEY, JSON.stringify(presets));
    }

    function fmtCalcPctLabel(pct) {
        const n = parseFloat(pct);
        if (!Number.isFinite(n)) return '';
        return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')) + '%';
    }

    function setCalcSellPriceValue(val) {
        calcSellPriceProgrammatic = true;
        document.getElementById('calcSellPrice').value = val;
        calcSellPriceProgrammatic = false;
    }

    function applyCalcSellFromPct(pct) {
        const buy = parseFloat(document.getElementById('calcBuyPrice').value) || 0;
        if (buy <= 0) return false;
        setCalcSellPriceValue((buy * (1 + pct / 100)).toFixed(2));
        return true;
    }

    function renderCalcSellPctChips() {
        const wrap = document.getElementById('calcSellPctChips');
        if (!wrap) return;
        const presets = getCalcSellPctPresets();
        wrap.innerHTML = presets.map((p) => {
            const active = calcActiveSellPct != null && Math.abs(calcActiveSellPct - p) < 0.0001;
            return `<button type="button" class="btn btn-sm ${active ? 'btn-outline btn-primary' : 'btn-outline btn-neutral'} rounded-full min-h-0 h-8 px-3" onclick="setCalcSellPct(${p})">${fmtCalcPctLabel(p)}</button>`;
        }).join('');
    }

    function setCalcSellPct(pct) {
        calcActiveSellPct = pct;
        if (!applyCalcSellFromPct(pct)) {
            showToast('Enter buy price first.', 'warning');
        }
        renderCalcSellPctChips();
        updateMtfCalculator();
    }

    function onCalcBuyPriceInput() {
        if (calcActiveSellPct != null) applyCalcSellFromPct(calcActiveSellPct);
        updateMtfCalculator();
    }

    function onCalcSellPriceInput() {
        if (!calcSellPriceProgrammatic) calcActiveSellPct = null;
        renderCalcSellPctChips();
        updateMtfCalculator();
    }

    function addCalcSellPctPreset() {
        const el = document.getElementById('calcSellPctCustom');
        const pct = parseFloat(el.value);
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
        el.value = '';
        setCalcSellPct(pct);
    }

    function getCalcInputs() {
        return {
            company: 'Calculator',
            broker: 'Zerodha',
            buyDate: document.getElementById('calcBuyDate').value,
            sellDate: document.getElementById('calcSellDate').value,
            quantity: parseFloat(document.getElementById('calcQty').value) || 0,
            buyPrice: parseFloat(document.getElementById('calcBuyPrice').value) || 0,
            sellPrice: parseFloat(document.getElementById('calcSellPrice').value) || 0,
            leverage: parseFloat(document.getElementById('calcLeverage').value) || 1
        };
    }

    function calcInputsValid(inp) {
        return inp.buyDate && inp.sellDate && inp.quantity > 0 && inp.buyPrice > 0 && inp.sellPrice > 0;
    }

    function renderBrokerRatesPanel(broker, mtfAmount, buyDate, sellDate) {
        const calc = calculator();
        const BROKER_CONFIG = calc.BROKER_CONFIG || {};
        const getChargeConfig = calc.getChargeConfig || (() => ({}));
        const getDhanInterestRate = calc.getDhanInterestRate || (() => 0);

        const cfg = BROKER_CONFIG[broker] || BROKER_CONFIG.Zerodha || {};
        const chargeCfg = getChargeConfig(broker, buyDate, sellDate);
        const isIntraday = chargeCfg.tradeType === 'intraday';
        let interestLine;
        if (broker === 'Dhan') {
            if (mtfAmount > 0) {
                const daily = getDhanInterestRate(mtfAmount);
                interestLine = `Slab: ${(daily * 365 * 100).toFixed(2)}% p.a. (${(daily * 100).toFixed(4)}% / day)`;
            } else {
                interestLine = 'Slab-based (set leverage &amp; prices to see rate)';
            }
        } else {
            interestLine = `${(cfg.interestRatePerDay * 100).toFixed(4)}% / day (${(cfg.interestRatePerDay * 365 * 100).toFixed(2)}% p.a.)`;
        }
        const brkPct = chargeCfg.brokeragePct;
        const brkCap = chargeCfg.brokerageCap;
        const capLabel = brkCap === Infinity ? 'No cap' : (brkCap > 0 ? fmtDec(brkCap) : '₹0');
        const brkLabel = isIntraday
            ? `Intraday: ${(brkPct * 100).toFixed(4)}% or ${capLabel}/order`
            : (brkPct > 0 ? `${(brkPct * 100).toFixed(4)}%` : '₹0 (delivery)');
        const sttLabel = isIntraday ? '0.025% sell only' : `${(chargeCfg.sttSellPct * 100).toFixed(4)}% buy &amp; sell`;
        const stampLabel = isIntraday ? '0.003% buy only' : `${(chargeCfg.stampPct * 100).toFixed(4)}% buy`;
        const typeBadge = isIntraday ? appTag('Intraday', 'warning') : appTag('MTF');
        const { renderIcon } = global.MTFComponents;
        return `
            <h6 class="font-semibold text-base-content/80 mb-2 flex flex-wrap items-center gap-1.5">${renderIcon('fa-info-circle', { className: 'mr-1' })}${cfg.label} Broker Rates ${typeBadge}</h6>
            <table class="table table-sm w-full w-full">
                <tbody>
                    <tr><td class="text-base-content/60">Interest</td><td class="text-end text-sm">${isIntraday ? 'None (same-day)' : interestLine}</td></tr>
                    <tr><td class="text-base-content/60">Brokerage</td><td class="text-end text-sm">${brkLabel}</td></tr>
                    <tr><td class="text-base-content/60">Pledge</td><td class="text-end">${fmtDec(chargeCfg.pledgeCharge || 0)}</td></tr>
                    <tr><td class="text-base-content/60">Unpledge</td><td class="text-end">${fmtDec(chargeCfg.unpledgeCharge || 0)}</td></tr>
                    <tr><td class="text-base-content/60">DP charges</td><td class="text-end">${fmtDec(chargeCfg.dpCharge || 0)}</td></tr>
                    <tr><td class="text-base-content/60">STT</td><td class="text-end text-sm">${sttLabel}</td></tr>
                    <tr><td class="text-base-content/60">Exchange</td><td class="text-end">${(cfg.exchangePct * 100).toFixed(6)}%</td></tr>
                    <tr><td class="text-base-content/60">SEBI</td><td class="text-end">${(cfg.sebiPct * 100).toFixed(6)}%</td></tr>
                    <tr><td class="text-base-content/60">Stamp duty</td><td class="text-end text-sm">${stampLabel}</td></tr>
                    <tr><td class="text-base-content/60">GST</td><td class="text-end">${(cfg.gstPct * 100).toFixed(0)}%</td></tr>
                </tbody>
            </table>
        `;
    }

    function renderMtfCalculator() {
        const buyEl = document.getElementById('calcBuyDate');
        const sellEl = document.getElementById('calcSellDate');
        if (buyEl && !buyEl.value) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            setDateInputValue(buyEl, yesterday);
            setDateInputValue(sellEl, today);
        }
        renderCalcSellPctChips();
    }

    function onCalcDateInput() {
        updateMtfCalculator();
    }

    function setCalcSameDay() {
        const buyEl = document.getElementById('calcBuyDate');
        const sellEl = document.getElementById('calcSellDate');
        const day = buyEl.value || new Date().toISOString().split('T')[0];
        setDateInputValue(buyEl, day);
        setDateInputValue(sellEl, day);
        updateMtfCalculator();
    }

    function setCalcTodayPair() {
        const buyEl = document.getElementById('calcBuyDate');
        const sellEl = document.getElementById('calcSellDate');
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 86400000);
        setDateInputValue(buyEl, today.toISOString().split('T')[0]);
        setDateInputValue(sellEl, tomorrow.toISOString().split('T')[0]);
        updateMtfCalculator();
    }

    function renderCalcChargeMode(inp) {
        const calc = calculator();
        const isSameDayTrade = calc.isSameDayTrade || (() => false);

        const badge = document.getElementById('calcModeBadge');
        const banner = document.getElementById('calcIntradayBanner');
        if (!badge || !banner) return;
        const sameDay = isSameDayTrade(inp.buyDate, inp.sellDate);
        if (sameDay && calcInputsValid(inp)) {
            setAppTagElement(badge, 'Intraday', 'warning');
            badge.classList.remove('hidden');
            banner.className = 'alert alert-info py-2 text-sm mb-3';
            banner.innerHTML = `${global.MTFComponents.renderIcon('fa-bolt', { className: 'mr-1' })}<strong>Same-day trade</strong> — charges use <strong>intraday rates</strong> for all brokers (STT 0.025% on sell only, stamp 0.003% on buy; no MTF interest, pledge, unpledge or DP).`;
        } else if (inp.buyDate && inp.sellDate && calcInputsValid(inp)) {
            setAppTagElement(badge, 'MTF / Delivery', 'default');
            badge.classList.remove('hidden');
            banner.className = 'hidden';
            banner.innerHTML = '';
        } else {
            badge.classList.add('hidden');
            banner.className = 'hidden';
            banner.innerHTML = '';
        }
    }

    function buildCalcBreakdownHtml(broker, inp) {
        const calc = calculator();
        const { chargeSides, chargesTable } = global.MTFComponents;
        const calculateTrade = calc.calculateTrade || (() => ({}));
        const interestDetails = calc.interestDetails || (() => ({}));

        const calcInp = { ...inp, broker };
        const result = calculateTrade(calcInp);
        const mockTx = {
            ...calcInp,
            mtfAmount: result.mtfAmount,
            holdingDays: result.holdingDays,
            interest: result.interest,
            charges: result.totalCharges,
            totalInvestment: result.totalInvestment,
            ownMargin: result.ownMargin,
            leverage: result.leverage
        };
        const intDet = interestDetails(mockTx);
        const { buy, sell, tradeType } = chargeSides(mockTx);
        const levDisplay = result.leverage > 1 ? `${result.leverage}x` : '1x';
        const isIntraday = tradeType === 'intraday' || result.tradeType === 'intraday';
        const sameDayNote = intDet.sameDay
            ? `<div class="alert alert-info py-2 text-sm mb-3">${global.MTFComponents.renderIcon('fa-bolt', { className: 'mr-1' })}Same-day trade — <strong>intraday charges</strong> for ${broker} (no MTF interest; STT 0.025% sell only; stamp 0.003% buy; no pledge/DP).</div>`
            : '';

        return `
            ${sameDayNote}
            ${renderBrokerRatesPanel(broker, result.mtfAmount, inp.buyDate, inp.sellDate)}
            <hr class="my-3" />
            <div class="section-title">${global.MTFComponents.renderIcon('fa-hand-holding-usd', { className: 'mr-2' })}Funding</div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Total Investment</span><span class="text-sm font-semibold text-right">${fmtDec(result.totalInvestment)}</span></div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Your Margin</span><span class="text-sm font-semibold text-right">${fmtDec(result.ownMargin)}</span></div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Broker Funded</span><span class="text-sm font-semibold text-right">${fmtDec(result.mtfAmount)}</span></div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Leverage</span><span class="text-sm font-semibold text-right">${levDisplay}</span></div>
            <div class="section-title">${global.MTFComponents.renderIcon('fa-clock', { className: 'mr-2' })}Holding</div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">${isIntraday ? 'Trade type' : 'Days Financed'}</span><span class="text-sm font-semibold text-right">${isIntraday ? 'Same day (intraday)' : result.holdingDays + ' day(s)'}</span></div>
            <div class="section-title">${global.MTFComponents.renderIcon('fa-calculator', { className: 'mr-2' })}P&L</div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Gross Profit</span>${renderAmount(result.grossProfit, { size: 'sm', decimals: true, tone: 'positive', align: 'right' })}</div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">MTF Interest</span><span class="text-sm font-semibold text-right text-warning">- ${fmtDec(result.interest)}</span></div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Total Charges</span>${renderAmount(result.totalCharges, { size: 'sm', decimals: true, tone: 'negative', align: 'right', showSign: false })}</div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200 font-medium text-base-content/80 border-t border-base-200 pt-2 mt-1"><span class="text-sm text-base-content/60">Net Profit</span>${renderAmount(result.netProfit, { size: 'sm', decimals: true, align: 'right' })}</div>
            <div class="section-title mt-3">${global.MTFComponents.renderIcon('fa-percent', { className: 'mr-2' })}Interest Detail</div>
            <div class="bg-base-200 rounded-xl p-2 my-2 text-sm text-center">
                ${intDet.sameDay ? 'No interest (0 days)' : `${fmtDec(intDet.mtf)} &times; ${(intDet.dailyRate * 100).toFixed(4)}% &times; ${intDet.days}`}
            </div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Rate / day</span><span class="text-sm font-semibold text-right">${(intDet.dailyRate * 100).toFixed(4)}%</span></div>
            <div class="flex justify-between gap-4 py-2 border-b border-base-200"><span class="text-sm text-base-content/60">Rate / year</span><span class="text-sm font-semibold text-right">${(intDet.annualRate * 100).toFixed(2)}%</span></div>
            <div class="section-title mt-3">${global.MTFComponents.renderIcon('fa-receipt', { className: 'mr-2' })}Charges Breakdown</div>
            ${chargesTable(buy, sell)}
        `;
    }

    function openCalcBreakdownSheet(broker) {
        const inp = getCalcInputs();
        if (!calcInputsValid(inp)) {
            showToast('Please fill in all calculator fields first.', 'warning');
            return;
        }
        const b = broker || inp.broker;
        Sheet.open(`${global.MTFComponents.renderIcon('fa-calculator', { className: 'mr-2' })}${b} Breakdown`, buildCalcBreakdownHtml(b, inp), '');
    }

    function updateMtfCalculator() {
        const calc = calculator();
        const calculateTrade = calc.calculateTrade || (() => ({}));
        const isSameDayTrade = calc.isSameDayTrade || (() => false);

        const inp = getCalcInputs();
        const comparePanel = document.getElementById('calcComparePanel');
        const totalHost = document.getElementById('calcTotalAmountHost');
        renderCalcChargeMode(inp);

        if (!calcInputsValid(inp)) {
            if (totalHost) totalHost.innerHTML = '';
            if (comparePanel) {
                comparePanel.innerHTML = '<p class="text-base-content/60 text-sm mb-0">Fill in all fields to compare brokers.</p>';
            }
            return;
        }

        const preview = calculateTrade({ ...inp, broker: 'Zerodha' });
        const totalAmount = preview.totalInvestment + preview.totalCharges + preview.interest;
        if (totalHost) {
            totalHost.innerHTML = renderTotalAmountCard(totalAmount, {
                label: 'Total Amount',
                note: shouldShowAmountInWords(totalAmount) ? amountInWords(totalAmount) : '',
                size: 'hero',
                decimals: true,
                tone: 'positive'
            });
        }

        const sameDay = isSameDayTrade(inp.buyDate, inp.sellDate);
        const brokers = ['Zerodha', 'Dhan', 'Groww'];
        const rows = brokers.map((b) => {
            const r = calculateTrade({ ...inp, broker: b });
            const typeBadge = r.tradeType === 'intraday' ? appTag('Intraday', 'warning') : '';
            return `
                <tr>
                    <td class="font-semibold"><span class="inline-flex flex-wrap items-center gap-1.5">${b}${typeBadge}</span></td>
                    <td class="text-end">${fmtDec(r.interest)}</td>
                    <td class="text-end">${renderAmount(r.totalCharges, { size: 'xs', decimals: true, tone: 'negative', align: 'right' })}</td>
                    <td class="text-end font-semibold">${renderAmount(r.netProfit, { size: 'xs', decimals: true, align: 'right' })}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-circle btn-ghost" onclick="openCalcBreakdownSheet('${b}')" title="View breakdown" aria-label="View ${b} breakdown">
                            ${global.MTFComponents.renderIcon('fa-circle-info', { colour: 'text-primary' })}
                        </button>
                    </td>
                </tr>`;
        }).join('');
        const footnote = sameDay
            ? `${global.MTFComponents.renderIcon('fa-bolt', { className: 'mr-1' })}Same-day dates — all brokers use intraday charge rules. Tap info for full breakdown.`
            : `${global.MTFComponents.renderIcon('fa-circle-info', { className: 'mr-1' })}Overnight hold — MTF/delivery charges apply. Tap info for full breakdown.`;
        if (comparePanel) {
            comparePanel.innerHTML = `
                <table class="table table-sm w-full w-full">
                    <thead class="bg-base-200">
                        <tr>
                            <th>Broker</th>
                            <th class="text-end">Interest</th>
                            <th class="text-end">Charges</th>
                            <th class="text-end">Net Profit</th>
                            <th class="text-end w-10"></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <p class="text-base-content/60 text-sm mt-2 mb-0">${footnote}</p>
            `;
        }
    }

    global.MTFRegister({
        renderMtfCalculator,
        updateMtfCalculator,
        renderCalcSellPctChips,
        setCalcSellPct,
        onCalcBuyPriceInput,
        onCalcSellPriceInput,
        addCalcSellPctPreset,
        onCalcDateInput,
        setCalcSameDay,
        setCalcTodayPair,
        openCalcBreakdownSheet,
        getCalcSellPctPresets,
        saveCalcSellPctPresets,
        fmtCalcPctLabel
    });
})(typeof window !== 'undefined' ? window : globalThis);
