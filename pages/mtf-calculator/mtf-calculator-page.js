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
        Sheet,
        getCalcSellPctPresets,
        saveCalcSellPctPresets,
        fmtCalcPctLabel
    } = global.MTFComponents;

    let calcActiveSellPct = null;
    let calcSellPriceProgrammatic = false;

    function calculator() {
        return (global.MTFAppHelpers || {}).calculator || {};
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
            return `<button type="button" class="btn btn-sm ${active ? 'btn-outline-primary' : 'btn-outline-secondary'} rounded-pill px-3" onclick="setCalcSellPct(${p})">${fmtCalcPctLabel(p)}</button>`;
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
            <h6 class="fw-semibold text-body-secondary mb-2 d-flex flex-wrap align-items-center gap-2">${renderIcon('fa-info-circle', { className: 'me-1' })}${cfg.label} Broker Rates ${typeBadge}</h6>
            <table class="table table-sm w-100">
                <tbody>
                    <tr><td class="text-muted">Interest</td><td class="text-end small">${isIntraday ? 'None (same-day)' : interestLine}</td></tr>
                    <tr><td class="text-muted">Brokerage</td><td class="text-end small">${brkLabel}</td></tr>
                    <tr><td class="text-muted">Pledge</td><td class="text-end">${fmtDec(chargeCfg.pledgeCharge || 0)}</td></tr>
                    <tr><td class="text-muted">Unpledge</td><td class="text-end">${fmtDec(chargeCfg.unpledgeCharge || 0)}</td></tr>
                    <tr><td class="text-muted">DP charges</td><td class="text-end">${fmtDec(chargeCfg.dpCharge || 0)}</td></tr>
                    <tr><td class="text-muted">STT</td><td class="text-end small">${sttLabel}</td></tr>
                    <tr><td class="text-muted">Exchange</td><td class="text-end">${(cfg.exchangePct * 100).toFixed(6)}%</td></tr>
                    <tr><td class="text-muted">SEBI</td><td class="text-end">${(cfg.sebiPct * 100).toFixed(6)}%</td></tr>
                    <tr><td class="text-muted">Stamp duty</td><td class="text-end small">${stampLabel}</td></tr>
                    <tr><td class="text-muted">GST</td><td class="text-end">${(cfg.gstPct * 100).toFixed(0)}%</td></tr>
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
            badge.classList.remove('d-none');
            banner.className = 'alert alert-info py-2 small mb-3';
            banner.innerHTML = `${global.MTFComponents.renderIcon('fa-bolt', { className: 'me-1' })}<strong>Same-day trade</strong> — charges use <strong>intraday rates</strong> for all brokers (STT 0.025% on sell only, stamp 0.003% on buy; no MTF interest, pledge, unpledge or DP).`;
        } else if (inp.buyDate && inp.sellDate && calcInputsValid(inp)) {
            setAppTagElement(badge, 'MTF / Delivery', 'default');
            badge.classList.remove('d-none');
            banner.className = 'd-none';
            banner.innerHTML = '';
        } else {
            badge.classList.add('d-none');
            banner.className = 'd-none';
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
            ? `<div class="alert alert-info py-2 small mb-3">${global.MTFComponents.renderIcon('fa-bolt', { className: 'me-1' })}Same-day trade — <strong>intraday charges</strong> for ${broker} (no MTF interest; STT 0.025% sell only; stamp 0.003% buy; no pledge/DP).</div>`
            : '';

        return `
            ${sameDayNote}
            ${renderBrokerRatesPanel(broker, result.mtfAmount, inp.buyDate, inp.sellDate)}
            <hr class="my-3" />
            <div class="small text-uppercase fw-medium text-muted mb-2">${global.MTFComponents.renderIcon('fa-hand-holding-usd', { className: 'me-2' })}Funding</div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Total Investment</span><span class="small fw-semibold text-end">${fmtDec(result.totalInvestment)}</span></div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Your Margin</span><span class="small fw-semibold text-end">${fmtDec(result.ownMargin)}</span></div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Broker Funded</span><span class="small fw-semibold text-end">${fmtDec(result.mtfAmount)}</span></div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Leverage</span><span class="small fw-semibold text-end">${levDisplay}</span></div>
            <div class="small text-uppercase fw-medium text-muted mb-2">${global.MTFComponents.renderIcon('fa-clock', { className: 'me-2' })}Holding</div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">${isIntraday ? 'Trade type' : 'Days Financed'}</span><span class="small fw-semibold text-end">${isIntraday ? 'Same day (intraday)' : result.holdingDays + ' day(s)'}</span></div>
            <div class="small text-uppercase fw-medium text-muted mb-2">${global.MTFComponents.renderIcon('fa-calculator', { className: 'me-2' })}P&L</div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Gross Profit</span>${renderAmount(result.grossProfit, { size: 'sm', decimals: true, tone: 'positive', align: 'right' })}</div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">MTF Interest</span><span class="small fw-semibold text-end text-warning">- ${fmtDec(result.interest)}</span></div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Total Charges</span>${renderAmount(result.totalCharges, { size: 'sm', decimals: true, tone: 'negative', align: 'right', showSign: false })}</div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom border-top fw-medium text-body-secondary pt-2 mt-1"><span class="small text-muted">Net Profit</span>${renderAmount(result.netProfit, { size: 'sm', decimals: true, align: 'right' })}</div>
            <div class="small text-uppercase fw-medium text-muted mb-2 mt-3">${global.MTFComponents.renderIcon('fa-percent', { className: 'me-2' })}Interest Detail</div>
            <div class="bg-light rounded-3 p-2 my-2 small text-center">
                ${intDet.sameDay ? 'No interest (0 days)' : `${fmtDec(intDet.mtf)} &times; ${(intDet.dailyRate * 100).toFixed(4)}% &times; ${intDet.days}`}
            </div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Rate / day</span><span class="small fw-semibold text-end">${(intDet.dailyRate * 100).toFixed(4)}%</span></div>
            <div class="d-flex justify-content-between gap-4 py-2 border-bottom"><span class="small text-muted">Rate / year</span><span class="small fw-semibold text-end">${(intDet.annualRate * 100).toFixed(2)}%</span></div>
            <div class="small text-uppercase fw-medium text-muted mb-2 mt-3">${global.MTFComponents.renderIcon('fa-receipt', { className: 'me-2' })}Charges Breakdown</div>
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
        Sheet.open(`${global.MTFComponents.renderIcon('fa-calculator', { className: 'me-2' })}${b} Breakdown`, buildCalcBreakdownHtml(b, inp), '');
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
                comparePanel.innerHTML = '<p class="text-muted small mb-0">Fill in all fields to compare brokers.</p>';
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
                    <td class="fw-semibold"><span class="d-inline-flex flex-wrap align-items-center gap-2">${b}${typeBadge}</span></td>
                    <td class="text-end">${fmtDec(r.interest)}</td>
                    <td class="text-end">${renderAmount(r.totalCharges, { size: 'xs', decimals: true, tone: 'negative', align: 'right' })}</td>
                    <td class="text-end fw-semibold">${renderAmount(r.netProfit, { size: 'xs', decimals: true, align: 'right' })}</td>
                    <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle" onclick="openCalcBreakdownSheet('${b}')" title="View breakdown" aria-label="View ${b} breakdown">
                            ${global.MTFComponents.renderIcon('fa-circle-info', { colour: 'text-primary' })}
                        </button>
                    </td>
                </tr>`;
        }).join('');
        const footnote = sameDay
            ? `${global.MTFComponents.renderIcon('fa-bolt', { className: 'me-1' })}Same-day dates — all brokers use intraday charge rules. Tap info for full breakdown.`
            : `${global.MTFComponents.renderIcon('fa-circle-info', { className: 'me-1' })}Overnight hold — MTF/delivery charges apply. Tap info for full breakdown.`;
        if (comparePanel) {
            comparePanel.innerHTML = `
                <table class="table table-sm w-100">
                    <thead class="bg-light">
                        <tr>
                            <th>Broker</th>
                            <th class="text-end">Interest</th>
                            <th class="text-end">Charges</th>
                            <th class="text-end">Net Profit</th>
                            <th class="text-end"></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <p class="text-muted small mt-2 mb-0">${footnote}</p>
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
        openCalcBreakdownSheet
    });
})(typeof window !== 'undefined' ? window : globalThis);
