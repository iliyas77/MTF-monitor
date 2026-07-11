/**
 * O25 — Trade add/edit sheet organism (Cupertino Pane).
 */
(function (global) {
    'use strict';

    const {
        renderAppButton,
        renderAppButtonRow,
        fmtDec,
        fmtDateShort,
        showToast,
        createAppPane,
        Sheet
    } = global.MTFComponents;

    let tradePane = null;
    let onHiddenReset = null;

    function tradeModal() {
        return (global.MTFAppHelpers || {}).tradeModal || {};
    }

    function getTradePane() {
        if (!tradePane) {
            tradePane = createAppPane('#txModal', {
                fullHeight: true,
                heightRatio: 0.9,
                topperOverflow: false,
                onDismiss: () => {
                    if (typeof onHiddenReset === 'function') onHiddenReset();
                }
            });
        }
        return tradePane;
    }

    const TradeSheet = {
        present() {
            if (Sheet?.isOpen?.()) Sheet.close();
            getTradePane().present();
        },
        close() {
            getTradePane().close();
        },
        isOpen() {
            return getTradePane().isOpen();
        }
    };

    function closeTradeModal() {
        TradeSheet.close();
    }

    function setTxModalTitle(isEdit = false) {
        const title = document.getElementById('txModalTitle');
        if (title) title.value = isEdit ? 'Update Trade' : 'New Trade';
        const modal = document.getElementById('txModal');
        if (modal) modal.setAttribute('aria-label', isEdit ? 'Update Trade' : 'New Trade');
        const company = document.getElementById('txCompany');
        if (company && !company.value) {
            company.placeholder = isEdit ? 'Search company name or symbol' : 'Search company name or symbol';
        }
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
            cancelOnClick: 'closeTradeModal()',
            rowClass: 'tx-modal-actions'
        })}${deleteBtn}`;
    }

    function setTxModalMode(isEdit = false) {
        setTxModalTitle(isEdit);
        renderTxModalFooter(isEdit);
        const viewBtn = document.getElementById('txViewBtn');
        if (viewBtn) viewBtn.classList.toggle('d-none', !isEdit);
    }

    function setTxSaveBtnLabel(isEdit) {
        renderTxModalFooter(isEdit);
    }

    function openViewFromEditor() {
        const id = document.getElementById('txEditId')?.value;
        if (!id) return;
        closeTradeModal();
        if (typeof global.openTradeDetail === 'function') {
            global.openTradeDetail(id);
            return;
        }
        const { openViewModal } = global.MTFComponents;
        if (openViewModal) openViewModal(id);
    }

    function deleteTradeFromEditor() {
        const { confirmDelete } = tradeModal();
        const id = document.getElementById('txEditId')?.value;
        if (!id) return;
        if (confirmDelete) confirmDelete(id);
    }

    function normalizeTxStatus(status) {
        if (status === 'closed') return 'closed';
        return 'open';
    }

    function getTxFormStatus() {
        return normalizeTxStatus(document.getElementById('txStatus')?.value);
    }

    function syncTxLeverageDisplay() {
        const el = document.getElementById('txLeverage');
        if (!el) return;
        const raw = String(el.value || '').trim();
        if (raw === '') return;
        let lev = parseFloat(raw);
        if (!isFinite(lev) || lev < 1) lev = 1;
        el.value = String(Math.round(lev * 10) / 10);
    }

    function onTxLeverageInput() {
        updateLeverageBreakdown();
        updatePreview();
    }

    function getTxLeverageValue() {
        const el = document.getElementById('txLeverage');
        const lev = parseFloat(el && el.value);
        return (isFinite(lev) && lev >= 1) ? lev : 1;
    }

    function setTxFormStatus(status) {
        const next = normalizeTxStatus(status);
        const el = document.getElementById('txStatus');
        if (el) el.value = next;
        onTxStatusChange();
    }

    function syncTxModalStatusField() {
        /* Status chips removed — Open/Closed via Positions Done only. */
    }

    function syncTxSellDateField() {
        /* Dates are edited on the trade detail timeline (hold sheet). */
    }

    function syncTxSellPriceField() {
        const isClosed = getTxFormStatus() === 'closed';
        const sellEl = document.getElementById('txSellPrice');
        if (sellEl) {
            sellEl.required = isClosed;
            sellEl.placeholder = '0.00';
        }
    }

    function onTxStatusChange() {
        syncTxSellPriceField();
        updatePreview();
    }

    function todayDateStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function setTxFormDates(buyDate, sellDate) {
        const buyEl = document.getElementById('txBuyDate');
        const sellEl = document.getElementById('txSellDate');
        if (buyEl) buyEl.value = buyDate || '';
        if (sellEl) sellEl.value = sellDate || buyDate || '';
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function toneClass(n) {
        const v = Number(n);
        if (!isFinite(v) || Math.abs(v) < 0.005) return 'text-body-secondary';
        return v >= 0 ? 'text-success' : 'text-danger';
    }

    function signedMoney(n) {
        const v = Number(n) || 0;
        if (Math.abs(v) < 0.005) return fmtDec(0);
        return (v > 0 ? '+' : '-') + fmtDec(Math.abs(v));
    }

    function signedPct(n) {
        const v = Number(n);
        if (!isFinite(v)) return '0%';
        const abs = Math.abs(v).toFixed(2) + '%';
        if (Math.abs(v) < 0.005) return '0%';
        return (v > 0 ? '+' : '-') + abs;
    }

    function getLivePriceFromForm() {
        const liveEl = document.getElementById('txLivePrice');
        const fromData = liveEl && liveEl.dataset.price != null ? Number(liveEl.dataset.price) : NaN;
        if (isFinite(fromData) && fromData > 0) return fromData;
        return null;
    }

    function updateLeverageBreakdown() {
        const qty = parseFloat(document.getElementById('txQty').value) || 0;
        const bp = parseFloat(document.getElementById('txBuyPrice').value) || 0;
        const lev = getTxLeverageValue();
        const totalInv = qty * bp;
        let ownMargin = totalInv;
        let mtfAmt = 0;
        if (lev > 1 && totalInv > 0) {
            ownMargin = totalInv / lev;
            mtfAmt = totalInv - ownMargin;
        }
        const totalEl = document.getElementById('previewTotalInv');
        const marginEl = document.getElementById('previewOwnMargin');
        const mtfEl = document.getElementById('previewMtfAmt');
        if (totalEl) totalEl.textContent = fmtDec(totalInv);
        if (marginEl) marginEl.textContent = fmtDec(ownMargin);
        if (mtfEl) mtfEl.textContent = fmtDec(mtfAmt);
    }

    function clearPreview() {
        updateLeverageBreakdown();
        setFormPnl(null);

        setText('txCostInterest', '₹0.00');
        setText('txCostInterestMeta', '0D');
        setText('txCostCharges', '₹0.00');
        setText('txCostTotal', '₹0.00');

        const buyDate = document.getElementById('txBuyDate')?.value || todayDateStr();
        const sellDate = document.getElementById('txSellDate')?.value || buyDate;
        const shortFn = typeof fmtDateShort === 'function' ? fmtDateShort : (d) => d || '—';
        setText('txTimelineBuy', shortFn(buyDate));
        setText('txTimelineExit', shortFn(sellDate));
        setText('txTimelineHold', '0 Days');
    }

    function setFormPnl(net) {
        const valueEl = document.getElementById('txFormPnlValue');
        const badgeEl = document.getElementById('txFormPnlBadge');
        if (!valueEl) return;
        if (net == null || !isFinite(Number(net))) {
            valueEl.textContent = '—';
            valueEl.className = 'trade-detail-pnl-value text-body-secondary';
            if (badgeEl) badgeEl.className = 'badge rounded-pill border trade-detail-pnl-badge text-body-secondary';
            return;
        }
        const v = Number(net);
        const tone = toneClass(v);
        valueEl.textContent = signedMoney(v);
        valueEl.className = `trade-detail-pnl-value ${tone}`;
        if (badgeEl) badgeEl.className = `badge rounded-pill border trade-detail-pnl-badge ${tone}`;
    }

    function updatePreview() {
        updateLeverageBreakdown();
        const qty = parseFloat(document.getElementById('txQty').value) || 0;
        const bp = parseFloat(document.getElementById('txBuyPrice').value) || 0;
        const target = parseFloat(document.getElementById('txSellPrice').value) || 0;
        const broker = document.getElementById('txBroker')?.value || '';
        const leverage = getTxLeverageValue();
        let buyDate = document.getElementById('txBuyDate')?.value || '';
        let sellDate = document.getElementById('txSellDate')?.value || '';
        if (!buyDate) {
            buyDate = todayDateStr();
            setTxFormDates(buyDate, sellDate || buyDate);
            sellDate = document.getElementById('txSellDate')?.value || buyDate;
        }
        if (!sellDate) sellDate = buyDate;

        const shortFn = typeof fmtDateShort === 'function' ? fmtDateShort : (d) => d || '—';
        setText('txTimelineBuy', shortFn(buyDate));
        setText('txTimelineExit', shortFn(sellDate));

        const livePrice = getLivePriceFromForm();
        const hasLive = livePrice != null && livePrice > 0;
        // Form P&L is planned result at Target (not “if sold now” at live).
        // Live often equals Buy after auto-fill, which made P&L look like only charges.
        const sellForCalc = target > 0 ? target : (hasLive ? livePrice : bp);

        if (qty <= 0 || bp <= 0 || sellForCalc <= 0) {
            clearPreview();
            return;
        }

        const { calculateTrade } = tradeModal();
        if (typeof calculateTrade !== 'function') {
            clearPreview();
            return;
        }

        const calc = calculateTrade({
            company: document.getElementById('txCompany')?.value || '',
            broker: broker || 'Zerodha',
            quantity: qty,
            buyPrice: bp,
            sellPrice: sellForCalc,
            buyDate,
            sellDate,
            leverage
        });

        const days = Number(calc.holdingDays) || 0;
        setText('txTimelineHold', days === 1 ? '1 Day' : `${days} Days`);

        const interest = Number(calc.interest) || 0;
        const charges = Number(calc.totalCharges) || 0;
        const totalCost = interest + charges;
        const net = Number(calc.netProfit) || 0;
        setFormPnl(net);

        setText('txCostInterest', fmtDec(interest));
        const perDay = days > 0 ? Math.round((interest / days) * 100) / 100 : 0;
        setText('txCostInterestMeta', perDay > 0 && days > 0 ? `${fmtDec(perDay)} × ${days}D` : (days > 0 ? `${days}D` : '0D'));
        setText('txCostCharges', fmtDec(charges));
        setText('txCostTotal', fmtDec(totalCost));
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
        const levEl = document.getElementById('txLeverage');
        if (levEl) {
            levEl.removeEventListener('input', updateLeverageBreakdown);
            levEl.addEventListener('input', updateLeverageBreakdown);
        }
        document.getElementById('txBuyPrice')?.addEventListener('input', updateLeverageBreakdown);
        document.getElementById('txQty')?.addEventListener('input', updateLeverageBreakdown);

        const { onTxBuyPriceInputForSuggest, onTxSellPriceInputManual, onTxQtyInputManual, onTxTradeDatesChangeForSuggest } = tradeModal();
        const buyEl = document.getElementById('txBuyPrice');
        const sellEl = document.getElementById('txSellPrice');
        const qtyEl = document.getElementById('txQty');
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
        if (qtyEl && onTxQtyInputManual) {
            qtyEl.removeEventListener('input', onTxQtyInputManual);
            qtyEl.addEventListener('input', onTxQtyInputManual);
        }
        [buyDateEl, sellDateEl].forEach((el) => {
            if (!el || !onTxTradeDatesChangeForSuggest) return;
            el.removeEventListener('change', onTxTradeDatesChangeForSuggest);
            el.addEventListener('change', onTxTradeDatesChangeForSuggest);
        });
    }

    function defaultStatusForContext() {
        return 'open';
    }

    async function openAddModal(preselectedMeta) {
        const {
            setTxModalContext,
            setTxBroker,
            resetCompanyAutocomplete,
            setTxCompanyMeta,
            setTxCompanySearchLocked,
            fillTradeFormFromLivePrice,
            findStockMetaForCompany
        } = tradeModal();

        if (setTxModalContext) setTxModalContext('trades');

        document.getElementById('txEditId').value = '';
        setTxSaveBtnLabel(false);
        setTxModalMode(false);
        document.getElementById('txForm').reset();
        document.getElementById('txLeverage').value = 1;
        document.getElementById('txQty').value = 0;
        if (setTxBroker) setTxBroker('');
        const today = todayDateStr();
        setTxFormDates(today, today);
        if (resetCompanyAutocomplete) resetCompanyAutocomplete();
        if (tradeModal().resetTxPriceAutoFlags) tradeModal().resetTxPriceAutoFlags();
        clearPreview();
        setTxFormStatus('open');
        syncTxLeverageDisplay();

        const meta = preselectedMeta && preselectedMeta.s
            ? preselectedMeta
            : null;
        if (meta) {
            const resolved = (findStockMetaForCompany && (findStockMetaForCompany(meta.s) || findStockMetaForCompany(meta.n || ''))) || meta;
            document.getElementById('txCompany').value = resolved.n || resolved.s || '';
            if (setTxCompanyMeta) setTxCompanyMeta(resolved);
            if (setTxCompanySearchLocked) setTxCompanySearchLocked(true, resolved);
        } else if (setTxCompanySearchLocked) {
            setTxCompanySearchLocked(false);
        }

        TradeSheet.present();
        attachCalcListeners();
        updateLeverageBreakdown();
        updatePreview();

        if (meta && fillTradeFormFromLivePrice) {
            try { await fillTradeFormFromLivePrice(meta); } catch (_) {}
            updatePreview();
        }
    }

    function openEditModal(id) {
        const {
            getTransaction,
            setTxModalContext,
            resetCompanyAutocomplete,
            findStockMetaForCompany,
            setTxCompanyMeta,
            setTxBroker,
            resetTxPriceAutoFlags
        } = tradeModal();

        const tx = getTransaction ? getTransaction(id) : null;
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const ctx = ((tx.status || 'closed') === 'open' ? 'trades' : 'past');
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
        const lockedMeta = editMatch || (tx.symbol ? { s: tx.symbol, n: tx.company || tx.symbol, e: 'NSE' } : null);
        if (tradeModal().setTxCompanySearchLocked) {
            tradeModal().setTxCompanySearchLocked(!!lockedMeta, lockedMeta);
        }
        if (setTxBroker) setTxBroker(tx.broker || '');
        const buyDate = tx.buyDate || todayDateStr();
        setTxFormDates(buyDate, tx.sellDate || buyDate);
        document.getElementById('txQty').value = tx.quantity || 0;
        document.getElementById('txBuyPrice').value = tx.buyPrice || '';
        document.getElementById('txSellPrice').value = tx.sellPrice || '';
        document.getElementById('txLeverage').value = tx.leverage || 1;
        setTxFormStatus((tx.status || 'closed') === 'closed' ? 'closed' : 'open');

        syncTxLeverageDisplay();
        updatePreview();
        updateLeverageBreakdown();
        attachCalcListeners();
        TradeSheet.present();
    }

    async function saveTransaction() {
        const {
            getTransaction,
            addTransaction,
            updateTransaction,
            calculateTrade,
            applyVerifiedReset,
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
        const buyDate = document.getElementById('txBuyDate').value || todayDateStr();
        let sellDate = document.getElementById('txSellDate').value || buyDate;
        const quantity = parseFloat(document.getElementById('txQty').value);
        const buyPrice = parseFloat(document.getElementById('txBuyPrice').value);
        let sellPrice = parseFloat(document.getElementById('txSellPrice').value);
        const leverage = getTxLeverageValue();
        document.getElementById('txLeverage').value = String(leverage);
        const existing = editId && getTransaction ? getTransaction(editId) : null;
        const notes = existing?.notes || '';
        // New trades are always Open. Closed only via Done on the position.
        const status = existing && (existing.status || '') === 'closed' ? 'closed' : 'open';
        const isClosed = status === 'closed';
        const executed = true;

        if (!company) { showToast('Please enter company name.', 'warning'); return; }
        if (!broker) { showToast('Please select a broker.', 'warning'); return; }
        if (!quantity || quantity <= 0) { showToast('Please enter a valid quantity.', 'warning'); return; }
        if (!buyPrice || buyPrice <= 0) { showToast('Please enter a valid buy price.', 'warning'); return; }
        if (!isClosed) {
            if (!sellPrice || sellPrice <= 0) sellPrice = buyPrice;
        } else if (!sellPrice || sellPrice <= 0) {
            showToast('Please enter a valid sell price.', 'warning');
            return;
        }
        if (!sellDate) sellDate = buyDate;

        const txData = {
            company,
            broker,
            buyDate,
            sellDate,
            quantity,
            buyPrice,
            sellPrice,
            leverage,
            notes,
            status,
            executed
        };
        if (symbol) txData.symbol = symbol;
        const calc = calculateTrade(txData);
        const finalTx = {
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
            const existingTx = getTransaction(editId);
            const updates = existingTx && applyVerifiedReset ? applyVerifiedReset(existingTx, finalTx) : finalTx;
            const saved = await updateTransaction(editId, updates);
            if (saved) showToast(`Trade updated${synced}!`, 'success');
            else showToast('Error updating trade.', 'danger');
        } else {
            await addTransaction(finalTx);
            showToast(`Trade saved${synced}!`, 'success');
        }
        TradeSheet.close();
        if (refreshTradeListViews) refreshTradeListViews();
        if (renderMoney) renderMoney();
        if (refreshActiveMoreView) refreshActiveMoreView();
    }

    function initTradeModal() {
        const { setTxBroker, resetCompanyAutocomplete } = tradeModal();
        if (!document.getElementById('txModal')) return;
        onHiddenReset = () => {
            document.getElementById('txEditId').value = '';
            document.getElementById('txForm').reset();
            setTxSaveBtnLabel(false);
            setTxModalTitle(false);
            setTxFormStatus('open');
            document.getElementById('txLeverage').value = 1;
            syncTxLeverageDisplay();
            if (setTxBroker) setTxBroker('');
            if (resetCompanyAutocomplete) resetCompanyAutocomplete();
            clearPreview();
        };
    }

    global.MTFRegister({
        TradeSheet,
        closeTradeModal,
        renderTxModalFooter,
        setTxModalMode,
        setTxSaveBtnLabel,
        openViewFromEditor,
        deleteTradeFromEditor,
        getTxFormStatus,
        setTxFormStatus,
        syncTxSellPriceField,
        syncTxModalStatusField,
        onTxStatusChange,
        syncTxLeverageDisplay,
        onTxLeverageInput,
        getTxLeverageValue,
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
