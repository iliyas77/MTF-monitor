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

        Sheet.open(`${global.MTFComponents.renderIcon('fa-clock', { className: 'me-2' })}${tx.company} Holding`, `
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
