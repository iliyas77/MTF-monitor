/**
 * O25 — Trade add/edit modal organism.
 */
(function (global) {
    'use strict';

    const {
        renderAppButton,
        renderAppButtonRow,
        paintAmount,
        fmtDec,
        setDateInputValue,
        initDateFields,
        showToast,
        showOffcanvas,
        hideOffcanvas,
        onOffcanvasHidden
    } = global.MTFComponents;

    function tradeModal() {
        return (global.MTFAppHelpers || {}).tradeModal || {};
    }

    function renderTxModalFooter(isEdit = false) {
        const footer = document.getElementById('txModalFooter');
        if (!footer) return;
        const deleteBtn = isEdit
            ? `<div class="mt-2">${renderAppButton('Delete Trade', { variant: 'danger', onclick: 'deleteTradeFromEditor()', icon: 'fa-trash-alt', fullWidth: true })}</div>`
            : '';
        footer.innerHTML = `${renderAppButtonRow('Cancel', isEdit ? 'Update Trade' : 'Save Trade', {
            actionId: 'txSaveBtn',
            actionOnClick: 'saveTransaction()',
            cancelDismiss: 'offcanvas'
        })}${deleteBtn}`;
    }

    function setTxModalMode(isEdit = false) {
        renderTxModalFooter(isEdit);
        const viewBtn = document.getElementById('txViewBtn');
        if (viewBtn) viewBtn.classList.toggle('d-none', !isEdit);
    }

    function setTxSaveBtnLabel(isEdit) {
        renderTxModalFooter(isEdit);
    }

    function openViewFromEditor() {
        const { openViewModal } = global.MTFComponents;
        const id = document.getElementById('txEditId')?.value;
        if (!id) return;
        if (openViewModal) openViewModal(id);
    }

    function deleteTradeFromEditor() {
        const { confirmDelete } = tradeModal();
        const id = document.getElementById('txEditId')?.value;
        if (!id) return;
        if (confirmDelete) confirmDelete(id);
    }

    function getTxFormStatus() {
        return document.querySelector('input[name="status"]:checked')?.value || 'closed';
    }

    function syncTxSellPriceField() {
        const isOpen = getTxFormStatus() === 'open';
        const sellEl = document.getElementById('txSellPrice');
        const reqMark = document.getElementById('txSellPriceRequired');
        const hint = document.getElementById('txSellPriceHint');
        if (sellEl) {
            sellEl.required = !isOpen;
            sellEl.placeholder = isOpen ? 'Same as buy' : '0.00';
        }
        if (reqMark) reqMark.classList.toggle('d-none', isOpen);
        if (hint) hint.classList.toggle('d-none', !isOpen);
    }

    function syncTxModalStatusField() {
        const { getTxModalContext, isPlannedTrade, getTransaction } = tradeModal();
        const row = document.getElementById('txStatusRow');
        const brokerCol = document.getElementById('txBrokerCol');
        const editId = document.getElementById('txEditId')?.value;
        const editingPlan = editId && isPlannedTrade && isPlannedTrade(getTransaction(editId) || {});
        const hideStatus = (getTxModalContext ? getTxModalContext() : 'trades') === 'plan' || editingPlan;
        if (row) row.classList.toggle('d-none', hideStatus);
        if (brokerCol) {
            brokerCol.classList.toggle('col-6', !hideStatus);
            brokerCol.classList.toggle('col-12', hideStatus);
        }
    }

    function onTxStatusChange() {
        syncTxSellPriceField();
        updatePreview();
    }

    function updateLeverageBreakdown() {
        const qty = parseFloat(document.getElementById('txQty').value) || 0;
        const bp = parseFloat(document.getElementById('txBuyPrice').value) || 0;
        const lev = parseFloat(document.getElementById('txLeverage').value) || 1;
        const totalInv = qty * bp;
        let ownMargin = totalInv;
        let mtfAmt = 0;
        if (lev > 1 && totalInv > 0) {
            ownMargin = totalInv / lev;
            mtfAmt = totalInv - ownMargin;
        }
        document.getElementById('previewTotalInv').textContent = fmtDec(totalInv);
        document.getElementById('previewOwnMargin').textContent = fmtDec(ownMargin);
        document.getElementById('previewMtfAmt').textContent = fmtDec(mtfAmt);
    }

    function clearPreview() {
        document.getElementById('previewDays').textContent = '0';
        paintAmount(document.getElementById('previewGross'), 0, { size: 'sm', decimals: true, tone: 'positive', align: 'right' });
        paintAmount(document.getElementById('previewInterest'), 0, { size: 'sm', decimals: true, tone: 'warning', align: 'right' });
        paintAmount(document.getElementById('previewCharges'), 0, { size: 'sm', decimals: true, tone: 'negative', align: 'right' });
        paintAmount(document.getElementById('previewNet'), 0, { size: 'sm', decimals: true, tone: 'positive', align: 'right' });
        document.getElementById('previewTotalInv').textContent = '₹0';
        document.getElementById('previewOwnMargin').textContent = '₹0';
        document.getElementById('previewMtfAmt').textContent = '₹0';
    }

    function updatePreview() {
        const { calculateTrade } = tradeModal();
        const company = document.getElementById('txCompany').value || 'Preview';
        const broker = document.getElementById('txBroker').value || 'Zerodha';
        const qty = parseFloat(document.getElementById('txQty').value) || 0;
        const bp = parseFloat(document.getElementById('txBuyPrice').value) || 0;
        let sp = parseFloat(document.getElementById('txSellPrice').value) || 0;
        const buyDate = document.getElementById('txBuyDate').value;
        const sellDate = document.getElementById('txSellDate').value;
        const leverage = parseFloat(document.getElementById('txLeverage').value) || 1;
        const status = getTxFormStatus();

        if (status === 'open' && sp <= 0 && bp > 0) sp = bp;

        if (!buyDate || !sellDate || qty <= 0 || bp <= 0 || sp <= 0) {
            clearPreview();
            return;
        }

        const result = calculateTrade({ company, broker, quantity: qty, buyPrice: bp, sellPrice: sp, buyDate, sellDate, leverage });
        document.getElementById('previewDays').textContent = result.holdingDays;
        paintAmount(document.getElementById('previewGross'), result.grossProfit, { size: 'sm', decimals: true, tone: 'positive', align: 'right' });
        paintAmount(document.getElementById('previewInterest'), result.interest, { size: 'sm', decimals: true, tone: 'warning', align: 'right' });
        paintAmount(document.getElementById('previewCharges'), result.totalCharges, { size: 'sm', decimals: true, tone: 'negative', align: 'right' });
        paintAmount(document.getElementById('previewNet'), result.netProfit, { size: 'sm', decimals: true, align: 'right' });
        updateLeverageBreakdown();
    }

    function attachCalcListeners() {
        const fields = ['txQty', 'txBuyPrice', 'txSellPrice', 'txBuyDate', 'txSellDate', 'txLeverage', 'txBroker'];
        fields.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.removeEventListener('input', updatePreview);
                el.removeEventListener('change', updatePreview);
                el.addEventListener('input', updatePreview);
                el.addEventListener('change', updatePreview);
            }
        });
        document.getElementById('txLeverage').addEventListener('input', updateLeverageBreakdown);
        document.getElementById('txBuyPrice').addEventListener('input', updateLeverageBreakdown);
        document.getElementById('txQty').addEventListener('input', updateLeverageBreakdown);

        const { onTxBuyPriceInputForSuggest, onTxSellPriceInputManual, onTxTradeDatesChangeForSuggest } = tradeModal();
        const buyEl = document.getElementById('txBuyPrice');
        const sellEl = document.getElementById('txSellPrice');
        const buyDateEl = document.getElementById('txBuyDate');
        const sellDateEl = document.getElementById('txSellDate');
        if (buyEl && onTxBuyPriceInputForSuggest) {
            buyEl.removeEventListener('input', onTxBuyPriceInputForSuggest);
            buyEl.addEventListener('input', onTxBuyPriceInputForSuggest);
        }
        if (sellEl && onTxSellPriceInputManual) {
            sellEl.removeEventListener('input', onTxSellPriceInputManual);
            sellEl.addEventListener('input', onTxSellPriceInputManual);
        }
        [buyDateEl, sellDateEl].forEach((el) => {
            if (!el || !onTxTradeDatesChangeForSuggest) return;
            el.removeEventListener('change', onTxTradeDatesChangeForSuggest);
            el.addEventListener('change', onTxTradeDatesChangeForSuggest);
        });
    }

    function openAddModal() {
        const {
            getCurrentAppPage,
            getTradesViewMode,
            setTxModalContext,
            setTxBroker,
            resetCompanyAutocomplete,
            getTomorrowDateKey
        } = tradeModal();

        const currentPage = getCurrentAppPage ? getCurrentAppPage().page : 'trades';
        const tradesViewMode = getTradesViewMode ? getTradesViewMode() : 'trade';
        const ctx = currentPage === 'plan' ? 'plan'
            : currentPage === 'past' ? 'past'
            : (currentPage === 'trades' && tradesViewMode === 'plan') ? 'plan'
            : 'trades';
        if (setTxModalContext) setTxModalContext(ctx);

        document.getElementById('txEditId').value = '';
        setTxSaveBtnLabel(false);
        setTxModalMode(false);
        document.getElementById('txForm').reset();
        document.getElementById('txLeverage').value = 1;
        if (setTxBroker) setTxBroker('');
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const tomorrow = getTomorrowDateKey ? getTomorrowDateKey() : today;
        if (ctx === 'plan') {
            document.getElementById('statusOpen').checked = true;
            setDateInputValue(document.getElementById('txBuyDate'), tomorrow);
            setDateInputValue(document.getElementById('txSellDate'), tomorrow);
        } else {
            document.getElementById('statusClosed').checked = true;
            setDateInputValue(document.getElementById('txBuyDate'), yesterday);
            setDateInputValue(document.getElementById('txSellDate'), today);
        }
        if (resetCompanyAutocomplete) resetCompanyAutocomplete();
        if (tradeModal().resetTxPriceAutoFlags) tradeModal().resetTxPriceAutoFlags();
        clearPreview();
        syncTxModalStatusField();
        syncTxSellPriceField();
        initDateFields(document.getElementById('txModal'));
        showOffcanvas(document.getElementById('txModal'));
        attachCalcListeners();
        updateLeverageBreakdown();
    }

    function openEditModal(id) {
        const {
            getTransaction,
            isPlannedTrade,
            setTxModalContext,
            resetCompanyAutocomplete,
            findStockMetaForCompany,
            setTxCompanyMeta,
            setTxBroker,
            resetTxPriceAutoFlags
        } = tradeModal();

        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const ctx = isPlannedTrade(tx) ? 'plan' : ((tx.status || 'closed') === 'open' ? 'trades' : 'past');
        if (setTxModalContext) setTxModalContext(ctx);

        document.getElementById('txEditId').value = id;
        setTxSaveBtnLabel(true);
        setTxModalMode(true);

        if (resetCompanyAutocomplete) resetCompanyAutocomplete();
        if (resetTxPriceAutoFlags) resetTxPriceAutoFlags();
        const editMatch = (tx.symbol && findStockMetaForCompany)
            ? (findStockMetaForCompany(tx.symbol) || findStockMetaForCompany(tx.company || ''))
            : (findStockMetaForCompany ? findStockMetaForCompany(tx.company || '') : null);
        document.getElementById('txCompany').value = editMatch ? editMatch.n : (tx.company || '');
        if (editMatch && setTxCompanyMeta) setTxCompanyMeta(editMatch);
        else if (tx.symbol && setTxCompanyMeta) setTxCompanyMeta({ s: tx.symbol, n: tx.company || tx.symbol, e: 'NSE' });
        if (setTxBroker) setTxBroker(tx.broker || '');
        setDateInputValue(document.getElementById('txBuyDate'), tx.buyDate || '');
        setDateInputValue(document.getElementById('txSellDate'), tx.sellDate || '');
        document.getElementById('txQty').value = tx.quantity || '';
        document.getElementById('txBuyPrice').value = tx.buyPrice || '';
        document.getElementById('txSellPrice').value = tx.sellPrice || '';
        document.getElementById('txLeverage').value = tx.leverage || 1;
        document.getElementById('txNotes').value = tx.notes || '';

        const status = tx.status || 'closed';
        document.querySelector(`input[name="status"][value="${status}"]`).checked = true;

        syncTxModalStatusField();
        syncTxSellPriceField();
        updatePreview();
        updateLeverageBreakdown();
        attachCalcListeners();
        initDateFields(document.getElementById('txModal'));
        showOffcanvas(document.getElementById('txModal'));
    }

    async function saveTransaction() {
        const {
            getTransaction,
            addTransaction,
            updateTransaction,
            calculateTrade,
            applyVerifiedReset,
            isPlannedTrade,
            getTxModalContext,
            resolveCompanyName,
            resolveCompanySymbol,
            getSyncNote,
            refreshTradeListViews,
            renderMoney,
            refreshActiveMoreView
        } = tradeModal();

        const editId = document.getElementById('txEditId').value;
        const company = resolveCompanyName ? resolveCompanyName(document.getElementById('txCompany').value) : document.getElementById('txCompany').value;
        const symbol = resolveCompanySymbol
            ? resolveCompanySymbol(document.getElementById('txCompany').value)
            : '';
        const broker = document.getElementById('txBroker').value;
        const buyDate = document.getElementById('txBuyDate').value;
        const sellDate = document.getElementById('txSellDate').value;
        const quantity = parseFloat(document.getElementById('txQty').value);
        const buyPrice = parseFloat(document.getElementById('txBuyPrice').value);
        let sellPrice = parseFloat(document.getElementById('txSellPrice').value);
        const leverage = parseFloat(document.getElementById('txLeverage').value) || 1;
        const notes = document.getElementById('txNotes').value.trim();
        const status = getTxFormStatus();

        if (!company) { showToast('Please enter company name.', 'warning'); return; }
        if (!broker) { showToast('Please select a broker.', 'warning'); return; }
        if (!buyDate || !sellDate) { showToast('Please select both dates.', 'warning'); return; }
        if (!quantity || quantity <= 0) { showToast('Please enter a valid quantity.', 'warning'); return; }
        if (!buyPrice || buyPrice <= 0) { showToast('Please enter a valid buy price.', 'warning'); return; }
        if (status === 'open') {
            if (!sellPrice || sellPrice <= 0) sellPrice = buyPrice;
        } else if (!sellPrice || sellPrice <= 0) {
            showToast('Please enter a valid sell price.', 'warning');
            return;
        }

        const txData = { company, broker, buyDate, sellDate, quantity, buyPrice, sellPrice, leverage, notes, status };
        if (symbol) txData.symbol = symbol;
        const calc = calculateTrade(txData);
        let finalTx = {
            ...txData,
            grossProfit: calc.grossProfit,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
            breakdown: calc.breakdown
        };

        const synced = getSyncNote ? getSyncNote() : '';
        if (editId) {
            const existing = getTransaction(editId);
            let updates = existing && applyVerifiedReset ? applyVerifiedReset(existing, finalTx) : finalTx;
            if (existing && isPlannedTrade && isPlannedTrade(existing)) {
                updates = { ...updates, executed: false, status: 'open' };
            }
            const saved = await updateTransaction(editId, updates);
            if (saved) showToast(`Trade updated${synced}!`, 'success');
            else showToast('Error updating trade.', 'danger');
        } else {
            const ctx = getTxModalContext ? getTxModalContext() : 'trades';
            if (ctx === 'plan') {
                finalTx = { ...finalTx, executed: false, status: 'open' };
            } else {
                finalTx = { ...finalTx, executed: true };
            }
            await addTransaction(finalTx);
            showToast(`Trade saved${synced}!`, 'success');
        }
        hideOffcanvas(document.getElementById('txModal'));
        if (refreshTradeListViews) refreshTradeListViews();
        if (renderMoney) renderMoney();
        if (refreshActiveMoreView) refreshActiveMoreView();
    }

    function initTradeModal() {
        const { setTxBroker, resetCompanyAutocomplete } = tradeModal();
        const txEl = document.getElementById('txModal');
        if (!txEl) return;
        onOffcanvasHidden(txEl, () => {
            document.getElementById('txEditId').value = '';
            document.getElementById('txForm').reset();
            setTxSaveBtnLabel(false);
            document.getElementById('statusClosed').checked = true;
            document.getElementById('txLeverage').value = 1;
            if (setTxBroker) setTxBroker('');
            if (resetCompanyAutocomplete) resetCompanyAutocomplete();
            clearPreview();
        });
    }

    global.MTFRegister({
        renderTxModalFooter,
        setTxModalMode,
        setTxSaveBtnLabel,
        openViewFromEditor,
        deleteTradeFromEditor,
        getTxFormStatus,
        syncTxSellPriceField,
        syncTxModalStatusField,
        onTxStatusChange,
        updatePreview,
        clearPreview,
        attachCalcListeners,
        updateLeverageBreakdown,
        openAddModal,
        openEditModal,
        saveTransaction,
        initTradeModal
    });
})(typeof window !== 'undefined' ? window : globalThis);
