/**
 * MTF Profit Tracker — re-export all MTFComponents on window after manifest scripts load,
 * then run the app.
 */
(function (global) {
    'use strict';
    if (global.MTFComponents) {
        Object.assign(global, global.MTFComponents);
    }
})(typeof window !== 'undefined' ? window : globalThis);

// ======================================================================
//  MTF PROFIT TRACKER – FINAL REFINED VERSION
// ======================================================================

(function (global) {
    'use strict';

    const {
        appTag,
        setAppTagElement,
        fmt,
        fmtINR,
        fmtDec,
        fmtDateDisplay,
        fmtDateShort,
        renderDateChip,
        renderDateRangeChip,
        paintDateChip,
        syncDateFieldDisplay,
        wireDateField,
        setDateInputValue,
        initDateFields,
        amountInWords,
        shouldShowAmountInWords,
        renderAmount,
        paintAmount,
        renderTotalAmountCard,
        paintTotalAmountCard,
        renderTradesCountCard,
        paintTradesCountCard,
        renderMoneyAmountWords,
        paintMoneyAmountWords,
        toggleMoneyAccountExpand,
        toggleTradeDateGroupExpand,
        fmtMoneyRich,
        pnlToneClass,
        renderAppButton,
        renderAppButtonRow,
        paintAppButton,
        resolveAppButtonVariant,
        BottomBar,
        LABEL_CLASSES,
        ICON_BUTTON_CLASSES,
        renderEmptyState,
        showToast,
        renderSearchBar,
        DROPDOWN_CLASSES,
        menuIconClass,
        renderActionDropdownItem,
        renderDropdownMenu,
        buildAppDropdownItems,
        syncAppSelectDropdown,
        renderMoneyValueBlock,
        paintTradeRangeSummary,
        renderTradeDetailRow,
        renderFormField,
        renderDetailRow,
        renderOpenTradeListItem,
        renderPastTradeListItem,
        renderPlanTradeListItem,
        renderTradesList,
        renderGroupedTrades,
        groupTradesByDate,
        renderDateGroupHeader,
        Sheet,
        AppDialog,
        closeSheet,
        closeDialog,
        confirmAction,
        showLoading,
        hideLoading,
        showBlockingProgress,
        hideBlockingProgress,
        hideModal,
        showModal,
        updateAppHeader,
        renderCurrentView,
        renderPastTrades,
        renderMarketPage,
        renderCalendarPage,
        shiftCalendarMonth,
        openCalendarMonthPicker,
        shiftCalendarPickerYear,
        jumpCalendarMonth,
        jumpCalendarToTodayMonth,
        openCalendarDaySheet,
        openCalendarMonthReport,
        renderSearchResults,
        renderTradeDetailPage,
        TradeDetailSheet,
        renderSettings,
        formatMoneyEntryTimeDisplay,
        sortMoneyEntries,
        renderMoney,
        renderAccountHistorySheet,

        openChargesModal,
        openInterestModal,
        openCompanyInfoSheet,
        openTargetModal,
        setTargetSellPct,
        applyTargetSellPctCustom,
        onTargetSellPriceInput,
        saveTargetSellPrice,
        openBuyPriceModal,
        saveBuyPrice,
        openLeverageModal,
        onLeverageModalInput,
        saveLeverage,
        openHoldModal,
        onHoldModalDateInput,
        onHoldModalDaysInput,
        setHoldModalSameDay,
        setHoldModalTodayPair,
        setHoldModalSellDateToday,
        saveHoldDates,
        renderTxModalFooter,
        setTxModalMode,
        closeTradeModal,
        openViewFromEditor,
        deleteTradeFromEditor,
        onTxStatusChange,
        setTxFormStatus,
        syncTxLeverageDisplay,
        onTxLeverageInput,
        updatePreview,
        openAddModal,
        openEditModal,
        saveTransaction,
        initTradeModal,
        renderMoneyEntryFooter,
        openMoneyEntryModal,
        openEditMoneyEntryModal,
        saveMoneyEntry,
        onMoneyEntryTypePick,
        setMoneyEntryType,
        toggleMoneyEntryDateTimeEdit,
        onMoneyEntryDateTimeChange,
        updateMoneyEntryAmountPreview,
        onMoneyEntryAmountInput,
        applyMoneyEntryAmountChip,
        focusMoneyEntryAmountCustom,
        onMoneyEntryNoteInput,
        applyMoneyEntryRemarkChip,
        focusMoneyEntryRemarkCustom,
        onMoneyEntryBrokerSelectChange,
        toggleMoneyEntryBalanceVisibility,
        pickMoneyEntryWallet,
        focusMoneyEntryBrokerPicker,
        refreshMoneyEntryWalletSelects,
        chargeSides,
        chargesTable
    } = window.MTFComponents;

    const {
        FIREBASE_CONFIG,
        DEFAULT_SYNC_CODE,
        ensureMoneyData,
        getStorage,
        saveStorageLocal,
        saveStorage,
        applyRemoteStorage,
        getTransactions,
        setTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransaction,
        getMoneyAccounts,
        getMoneyEntries,
        addMoneyAccount,
        updateMoneyAccount,
        deleteMoneyAccount,
        addMoneyEntry,
        deleteMoneyEntry,
        updateMoneyEntry,
        getMoneyEntry,
        addMoneyTransfer,
        isFirebaseConfigured,
        cloudPush,
        connectSync,
        disconnectSync,
        initSyncOnLoad,
        setSyncHooks,
        getSyncCode,
        getSyncStatus,
        isSyncConnected,
        getSyncNote
    } = window.MTFDb || {};


    // ---------- UI HELPERS ----------
    const UI = {
        card: 'card bg-body rounded-3',
        statLabel: LABEL_CLASSES.stat,
        sheetLabel: LABEL_CLASSES.sheet,
        heroValue: 'fw-bold display-6 lh-1 mb-3',
        iconBtn: ICON_BUTTON_CLASSES.default,
        toolbarRow: 'd-flex align-items-center gap-2 mb-3',
        toolbarInput: 'form-control border w-100 rounded-pill bg-body text-body-secondary',
        toolbarIconBtn: 'btn btn-outline-secondary rounded-3 text-muted p-0',
        actionBtn: 'btn btn-sm rounded-3 p-0 d-flex align-items-center justify-content-center',
        actionBtnSm: 'btn btn-sm rounded-3 p-0 d-flex align-items-center justify-content-center',
        tradeStatBox: 'flex-fill bg-light border rounded-3 p-2 text-center min-w-0',
        tradeStatLabel: LABEL_CLASSES.tradeStat,
        tradeStatValue: 'fs-6 fw-normal text-body text-nowrap mt-1',
        tradeStatValueSuccess: 'fs-6 fw-normal text-success text-nowrap mt-1 d-inline-block rounded-3 px-2 py-1 bg-success-subtle',
        tradeStatValueError: 'fs-6 fw-normal text-danger text-nowrap mt-1 d-inline-block rounded-3 px-2 py-1 bg-danger-subtle',
        moneyTonePositive: 'bg-success-subtle text-success',
        moneyToneNegative: 'bg-danger-subtle text-danger',
        moneyActionDeposit: 'bg-success-subtle text-success border-0',
        moneyActionWithdraw: 'bg-danger-subtle text-danger border-0',
        selectTrigger: DROPDOWN_CLASSES.selectTrigger,
        selectLabel: DROPDOWN_CLASSES.selectLabel,
        selectChevron: DROPDOWN_CLASSES.selectChevron,
        dropdownItemActive: DROPDOWN_CLASSES.itemActive,
        dropdownMenu: DROPDOWN_CLASSES.menu,
        menuIcon: menuIconClass,
        summaryCard(heroIcon, heroLabel, heroId, stats, cardId) {
            const cols = stats.length === 2 ? 'row-cols-2' : 'row-cols-3';
            const statHtml = stats.map(s => `
                        <div class="col"><div class="${UI.statLabel}">${s.icon ? `<i class="fas ${s.icon} me-1"></i>` : ''}${s.label}</div>
                        <div class="fw-medium ${s.cls || 'text-body-secondary'}" ${s.id ? `id="${s.id}"` : ''}>${s.value ?? '0'}</div></div>`).join('');
            return `<div class="${UI.card} mb-3" ${cardId ? `id="${cardId}"` : ''}>
                        <div class="card-body text-center py-4">
                            <div class="${UI.statLabel}"><i class="fas ${heroIcon} me-1"></i>${heroLabel}</div>
                            <div class="${UI.heroValue} ${heroId.includes('Net') || heroId.includes('Value') ? 'text-success' : 'text-body-secondary'}" id="${heroId}">₹0</div>
                            <div class="row g-2 ${cols}">${statHtml}</div>
                        </div></div>`;
        },
        searchBar(inputId, clearId, placeholder, onInput, onClear, extraClass = '') {
            return renderSearchBar({ inputId, clearId, placeholder, onInput, onClear, extraClass });
        },
        subHeader(title, backFn, icon = '') {
            return `<div class="d-flex align-items-center gap-3 mb-4">
                        <button type="button" class="${UI.iconBtn}" style="width:2.25rem;height:2.25rem" onclick="${backFn}()" aria-label="Back"><i class="fas fa-arrow-left"></i></button>
                        <h6 class="fw-semibold text-body-secondary mb-0">${icon ? `<i class="fas ${icon} me-2"></i>` : ''}${title}</h6></div>`;
        },
        detailRow(label, value, extra = '') {
            return renderDetailRow(label, value, extra);
        },
        emptyState(icon, msg) {
            return renderEmptyState(icon, msg);
        },
        actionDropdown(items) {
            return renderDropdownMenu(items);
        },
        dropdownItem(icon, variant, label, onclick, danger = false) {
            return renderActionDropdownItem(icon, variant, label, onclick, { danger });
        }
    };

    // ---------- BROKER CONFIG ----------
    const BROKER_CONFIG = {
        Zerodha: {
            label: 'Zerodha',
            interestRatePerDay: 0.0004,
            brokeragePct: 0.003,
            brokerageCap: 20,
            pledgeCharge: 15,
            unpledgeCharge: 15,
            dpCharge: 15.93,
            sttPct: 0.001,
            exchangePct: 0.0000322,
            sebiPct: 0.000001,
            stampPct: 0.00015,
            gstPct: 0.18,
        },
        Groww: {
            label: 'Groww',
            interestRatePerDay: 0.00041,
            brokeragePct: 0.001,
            brokerageCap: Infinity,
            pledgeCharge: 20,
            unpledgeCharge: 20,
            dpCharge: 0,
            sttPct: 0.001,
            exchangePct: 0.0000322,
            sebiPct: 0.000001,
            stampPct: 0.00015,
            gstPct: 0.18,
        },
        Dhan: {
            label: 'Dhan',
            interestRatePerDay: null,
            brokeragePct: 0.0003,
            brokerageCap: 20,
            pledgeCharge: 15,
            unpledgeCharge: 15,
            dpCharge: 12.5,
            sttPct: 0.001,
            exchangePct: 0.0000322,
            sebiPct: 0.000001,
            stampPct: 0.00015,
            gstPct: 0.18,
        }
    };

    function getDhanInterestRate(mtfAmount) {
        if (mtfAmount <= 500000) return 0.1249 / 365;
        if (mtfAmount <= 1000000) return 0.1349 / 365;
        if (mtfAmount <= 2500000) return 0.1449 / 365;
        if (mtfAmount <= 5000000) return 0.1549 / 365;
        return 0.1649 / 365;
    }

    function applyVerifiedReset(tx, updates) {
        const buyChanged = updates.buyPrice !== undefined && Number(updates.buyPrice) !== Number(tx.buyPrice);
        const sellChanged = updates.sellPrice !== undefined && Number(updates.sellPrice) !== Number(tx.sellPrice);
        if ((buyChanged || sellChanged) && tx.verified) {
            return { ...updates, verified: false };
        }
        return updates;
    }

    // ---------- STOCK SEARCH (live from NSE + Yahoo) ----------
    const STOCK_CACHE_KEY = 'mtf_nse_symbols_live_v2';
    const NSE_EQUITY_CSV_URL = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv';
    const JINA_PROXY = 'https://r.jina.ai/';
    const YAHOO_SEARCH_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';
    const appNetworkStats = {
        startedAt: Date.now(),
        jinaCalls: 0,
        quoteFetches: 0,
        catalogFetches: 0,
        lastCallAt: null,
        lastCallLabel: ''
    };

    function shortNetworkLabel(url) {
        try {
            const u = String(url || '');
            if (/chart\//i.test(u)) {
                const m = u.match(/chart\/([^?/]+)/i);
                return m ? ('quote ' + decodeURIComponent(m[1])) : 'quote';
            }
            if (/EQUITY_L\.csv/i.test(u)) return 'NSE catalog';
            if (/finance\/search/i.test(u)) return 'symbol search';
            return u.length > 48 ? u.slice(0, 48) + '…' : u;
        } catch (_) {
            return 'network';
        }
    }

    function noteNetworkCall(kind, labelOrUrl) {
        const label = shortNetworkLabel(labelOrUrl);
        if (kind === 'jina') appNetworkStats.jinaCalls += 1;
        else if (kind === 'quote') appNetworkStats.quoteFetches += 1;
        else if (kind === 'catalog') appNetworkStats.catalogFetches += 1;
        appNetworkStats.lastCallAt = Date.now();
        appNetworkStats.lastCallLabel = label;
    }

    let stockSymbols = [];
    let stockCatalogLoading = false;
    let stockCatalogLoaded = false;
    let stockAcResults = [];
    let stockAcActiveIdx = -1;
    let stockAcBlurTimer = null;
    let stockSearchTimer = null;
    let stockSearchSeq = 0;
    let selectedStockMeta = null;

    function extractJinaBody(text) {
        const marker = 'Markdown Content:';
        const idx = text.indexOf(marker);
        return (idx >= 0 ? text.slice(idx + marker.length) : text).trim();
    }

    function parseJinaJson(text) {
        const body = extractJinaBody(text);
        const start = body.indexOf('{');
        const end = body.lastIndexOf('}');
        if (start < 0 || end <= start) throw new Error('No JSON in response');
        return JSON.parse(body.slice(start, end + 1));
    }

    function parseCSVLine(line) {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; continue; }
            cur += ch;
        }
        result.push(cur.trim());
        return result;
    }

    function parseNseEquityCsv(text) {
        const lines = text.trim().split(/\r?\n/);
        const out = [];
        const seen = new Set();
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('SYMBOL,') || line.startsWith('Title:') || line.startsWith('URL Source:')) continue;
            const row = parseCSVLine(line);
            if (row.length < 7) continue;
            const sym = row[0].trim();
            const name = row[1].trim();
            const series = row[2].trim();
            const isin = (row[6] || '').trim();
            if (!sym || !name) continue;
            if (!['EQ', 'BE', 'BZ', 'SM', 'ST'].includes(series)) continue;
            const key = sym.toUpperCase();
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ s: sym, n: name, i: isin, e: 'NSE' });
        }
        out.sort((a, b) => a.s.localeCompare(b.s));
        return out;
    }

    function saveStockCatalogCache(symbols, source) {
        try {
            localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify({
                updated: new Date().toISOString().slice(0, 10),
                source: source || 'NSE',
                count: symbols.length,
                symbols
            }));
        } catch (_) { }
    }

    function loadStockCatalogCache() {
        try {
            const raw = localStorage.getItem(STOCK_CACHE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (Array.isArray(data.symbols) && data.symbols.length > 100) return data.symbols;
        } catch (_) { }
        return null;
    }

    function setStockCatalogStatus(msg) {
        const el = document.getElementById('txCompanyCatalogStatus');
        if (el) el.textContent = msg || '';
    }

    function applyStockCatalog(symbols, source) {
        if (!Array.isArray(symbols) || symbols.length < 100) return false;
        stockSymbols = symbols;
        stockCatalogLoaded = true;
        saveStockCatalogCache(symbols, source);
        setStockCatalogStatus(`${symbols.length.toLocaleString()} NSE stocks loaded live`);
        return true;
    }

    async function fetchViaJina(targetUrl) {
        noteNetworkCall('jina', targetUrl);
        const res = await fetch(JINA_PROXY + targetUrl, {
            headers: { Accept: 'text/plain' }
        });
        if (res.status === 429) throw new Error('HTTP 429');
        if (!res.ok) throw new Error('Proxy fetch failed ' + res.status);
        return res.text();
    }

    let lastJinaRequestAt = 0;
    const JINA_MIN_GAP_MS = 900;

    async function fetchViaJinaThrottled(targetUrl) {
        const wait = lastJinaRequestAt + JINA_MIN_GAP_MS - Date.now();
        if (wait > 0) {
            await new Promise((resolve) => setTimeout(resolve, wait));
        }
        lastJinaRequestAt = Date.now();
        return fetchViaJina(targetUrl);
    }

    async function fetchNseEquityCsvText() {
        // Direct fetch triggers red CORS errors in console which are alarming.
        // We use a free CORS proxy to cleanly fetch the CSV without console spam.
        const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(NSE_EQUITY_CSV_URL);
        try {
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const text = await res.text();
                if (text.includes('SYMBOL,NAME OF COMPANY')) {
                    return { text, source: 'NSE via proxy' };
                }
            }
        } catch (_) { }
        
        // Fallback to Jina if corsproxy fails
        const proxied = await fetchViaJina(NSE_EQUITY_CSV_URL);
        return { text: proxied, source: 'NSE via Jina' };
    }

    async function loadStockCatalogFromInternet() {
        if (stockCatalogLoading || stockCatalogLoaded) return stockCatalogLoaded;
        stockCatalogLoading = true;
        noteNetworkCall('catalog', NSE_EQUITY_CSV_URL);
        setStockCatalogStatus('Fetching NSE stock list from internet…');
        try {
            const { text, source } = await fetchNseEquityCsvText();
            const parsed = parseNseEquityCsv(text);
            if (parsed.length > 500) {
                applyStockCatalog(parsed, source);
                return true;
            }
        } catch (e) {
            MTFLogger.warn('NSE catalog fetch failed', e);
        } finally {
            stockCatalogLoading = false;
        }
        if (!stockCatalogLoaded) {
            setStockCatalogStatus('Type 2+ letters — live search from market data');
        }
        return stockCatalogLoaded;
    }

    function mapYahooQuote(q) {
        const raw = q.symbol || '';
        const isNse = q.exchange === 'NSI' || raw.endsWith('.NS');
        const isBse = q.exchange === 'BSE' || raw.endsWith('.BO');
        if (!isNse && !isBse) return null;
        const s = raw.replace(/\.(NS|BO)$/i, '');
        return {
            s,
            n: q.longname || q.shortname || s,
            i: '',
            e: isBse ? 'BSE' : 'NSE',
            sector: q.sector || q.sectorDisp || '',
            industry: q.industry || q.industryDisp || ''
        };
    }

    async function fetchYahooStockSearch(query) {
        const url = `${YAHOO_SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=25&newsCount=0&listsCount=0&enableFuzzyQuery=true`;
        // Always use Jina — direct Yahoo search is blocked by CORS in browsers
        // and still dumps red console errors even when a catch/fallback exists.
        const proxied = await fetchViaJina(url);
        const data = parseJinaJson(proxied);
        return extractYahooQuotes(data);
    }

    function extractYahooQuotes(data) {
        const seen = new Set();
        const out = [];
        (data.quotes || []).forEach(q => {
            if (q.quoteType !== 'EQUITY') return;
            const item = mapYahooQuote(q);
            if (!item) return;
            const key = item.s.toUpperCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out;
    }

    function searchStockSymbolsLocal(query, limit) {
        const max = limit || 12;
        const q = (query || '').trim().toUpperCase();
        if (q.length < 1 || !stockSymbols.length) return [];
        const scored = [];
        for (let i = 0; i < stockSymbols.length; i++) {
            const item = stockSymbols[i];
            const sym = item.s.toUpperCase();
            const nameUp = item.n.toUpperCase();
            let score = 0;
            if (sym === q) score = 200;
            else if (sym.startsWith(q)) score = 150 - (sym.length - q.length);
            else if (nameUp.startsWith(q)) score = 120;
            else if (sym.includes(q)) score = 90;
            else if (nameUp.includes(q)) score = 70;
            else {
                const words = nameUp.split(/\s+/);
                for (let w = 0; w < words.length; w++) {
                    if (words[w].startsWith(q)) { score = 100; break; }
                }
            }
            if (!score) continue;
            scored.push({ item, score });
        }
        scored.sort((a, b) => b.score - a.score || a.item.s.localeCompare(b.item.s));
        return scored.slice(0, max).map(x => x.item);
    }

    function mergeStockResults(local, remote) {
        const seen = new Set();
        const out = [];
        [...local, ...remote].forEach(item => {
            const key = item.s.toUpperCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out.slice(0, 12);
    }

    function showCompanyAcLoading(msg) {
        const list = document.getElementById('txCompanyAcList');
        if (!list) return;
        list.innerHTML = `<div class="px-3 py-2 small text-muted"><i class="fas fa-spinner fa-spin me-1"></i>${escapeHtml(msg || 'Searching…')}</div>`;
        list.classList.remove('d-none');
    }

    async function runStockSearch(query) {
        const q = (query || '').trim();
        const seq = ++stockSearchSeq;
        if (q.length < 1) {
            hideCompanyAcList();
            return;
        }

        showCompanyAcLoading(stockCatalogLoaded ? 'Searching…' : 'Fetching live market data…');
        loadStockCatalogFromInternet();

        let results = stockCatalogLoaded ? searchStockSymbolsLocal(q, 12) : [];

        if (results.length) {
            if (seq === stockSearchSeq) renderCompanyAcList(results);
        }

        if (q.length >= 2) {
            try {
                const remote = await fetchYahooStockSearch(q);
                if (seq !== stockSearchSeq) return;
                if (stockCatalogLoaded) {
                    results = mergeStockResults(searchStockSymbolsLocal(q, 12), remote);
                } else {
                    results = remote.length ? remote : results;
                }
                renderCompanyAcList(results);
            } catch (_) {
                if (seq !== stockSearchSeq) return;
                if (stockCatalogLoaded) {
                    results = searchStockSymbolsLocal(q, 12);
                    renderCompanyAcList(results);
                } else if (!results.length) {
                    const list = document.getElementById('txCompanyAcList');
                    if (list) {
                        list.innerHTML = `<div class="px-3 py-2 small text-muted">Could not reach market data. Check internet and try again, or type the name manually.</div>`;
                        list.classList.remove('d-none');
                    }
                }
            }
        } else if (stockCatalogLoaded) {
            results = searchStockSymbolsLocal(q, 12);
            if (seq === stockSearchSeq) renderCompanyAcList(results);
        } else {
            await loadStockCatalogFromInternet();
            if (seq !== stockSearchSeq) return;
            results = searchStockSymbolsLocal(q, 12);
            renderCompanyAcList(results);
        }
    }

    function hideCompanyAcList() {
        const list = document.getElementById('txCompanyAcList');
        if (list) {
            list.classList.add('d-none');
            list.innerHTML = '';
        }
        stockAcResults = [];
        stockAcActiveIdx = -1;
    }

    function renderCompanyAcList(items) {
        const list = document.getElementById('txCompanyAcList');
        const input = document.getElementById('txCompany');
        if (!list || !input) return;
        stockAcResults = items || [];
        stockAcActiveIdx = stockAcResults.length ? 0 : -1;

        if (!stockAcResults.length) {
            const q = (input.value || '').trim();
            list.innerHTML = q.length
                ? `<div class="px-3 py-2 small text-muted">No match for “${escapeHtml(q)}”. You can still type any name.</div>`
                : '';
            list.classList.toggle('d-none', q.length < 1);
            return;
        }

        list.innerHTML = stockAcResults.map((it, idx) => {
            const meta = it.sector
                ? `${escapeHtml(it.sector)}${it.industry ? ' · ' + escapeHtml(it.industry) : ''} · ${escapeHtml(it.e || 'NSE')}`
                : (it.i ? `${escapeHtml(it.i)} · ${escapeHtml(it.e || 'NSE')}` : escapeHtml(it.e || 'NSE'));
            const activeCls = idx === stockAcActiveIdx ? ' bg-light' : '';
            return `
                    <div class="list-group-item list-group-item-action border-0 border-bottom rounded-0${activeCls}" role="option" data-idx="${idx}" onmousedown="selectStockSymbol(${idx})">
                        <div class="fw-medium text-body-secondary small">${escapeHtml(it.s)}</div>
                        <div class="small">${escapeHtml(it.n)}</div>
                        <div class="small text-muted">${meta}</div>
                    </div>`;
        }).join('');
        list.classList.remove('d-none');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatTxLivePrice(n) {
        const v = Number(n);
        if (!isFinite(v) || v <= 0) return '—';
        return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function setTxCompanyLiveCardVisible(show) {
        /* Company header is always visible in the detail-style form. */
    }

    function setTxCompanySearchLocked(locked, meta) {
        const searchWrap = document.getElementById('txCompanySearchWrap');
        const lockedWrap = document.getElementById('txCompanyLocked');
        const nameEl = document.getElementById('txCompanyLockedName');
        const metaEl = document.getElementById('txCompanyLockedMeta');
        const avatarEl = document.getElementById('txCompanyLockedAvatar');
        const companyInput = document.getElementById('txCompany');
        if (searchWrap) searchWrap.classList.toggle('d-none', !!locked);
        if (lockedWrap) lockedWrap.classList.toggle('d-none', !locked);
        const selectedWrap = document.getElementById('txCompanySelected');
        if (selectedWrap && locked) selectedWrap.classList.add('d-none');
        if (!locked) {
            if (companyInput) companyInput.required = true;
            return;
        }
        if (companyInput) companyInput.required = false;
        const company = (meta && (meta.n || meta.s)) || companyInput?.value || 'Company';
        const symbol = (meta && meta.s) || '';
        const exchange = (meta && meta.e) || 'NSE';
        if (nameEl) {
            nameEl.textContent = company;
            nameEl.title = company;
        }
        if (metaEl) metaEl.textContent = symbol ? `${symbol} · ${exchange}` : exchange;
        if (avatarEl) {
            const initial = String(company).trim().charAt(0).toUpperCase() || '—';
            let h = 0;
            for (let i = 0; i < company.length; i++) h = ((h << 5) - h) + company.charCodeAt(i);
            avatarEl.textContent = initial;
            avatarEl.className = `trade-detail-avatar trade-position-avatar--${Math.abs(h) % 6}`;
        }
    }

    function setTxCompanyMeta(meta) {
        selectedStockMeta = meta;
        const selectedWrap = document.getElementById('txCompanySelected');
        const selectedSymbol = document.getElementById('txCompanySelectedSymbol');
        const liveEl = document.getElementById('txLivePrice');
        const noteEl = document.getElementById('txLivePriceNote');
        if (!meta) {
            if (selectedWrap) selectedWrap.classList.add('d-none');
            if (selectedSymbol) selectedSymbol.textContent = '';
            if (liveEl) {
                liveEl.textContent = '—';
                delete liveEl.dataset.hasQuote;
                delete liveEl.dataset.price;
            }
            if (noteEl) {
                noteEl.textContent = '';
                noteEl.className = 'small text-muted mt-1';
            }
            if (typeof global.updatePreview === 'function') {
                try { global.updatePreview(); } catch (_) { }
            }
            return;
        }
        const symbol = meta.s || '';
        const exchange = meta.e || 'NSE';
        if (selectedWrap) selectedWrap.classList.remove('d-none');
        if (selectedSymbol) selectedSymbol.textContent = symbol ? `${symbol} · ${exchange}` : exchange;
        if (typeof global.updatePreview === 'function') {
            try { global.updatePreview(); } catch (_) { }
        }
    }

    function setTxLivePriceStatus(msg, isError) {
        const noteEl = document.getElementById('txLivePriceNote');
        if (!noteEl) return;
        noteEl.className = isError ? 'small text-danger mt-1' : 'small text-muted mt-1';
        noteEl.innerHTML = msg || '';
    }

    function setTxLivePriceValue(price) {
        const liveEl = document.getElementById('txLivePrice');
        if (!liveEl) return;
        liveEl.textContent = formatTxLivePrice(price);
        if (price != null && Number(price) > 0) {
            liveEl.dataset.hasQuote = '1';
            liveEl.dataset.price = String(Number(price));
        } else {
            delete liveEl.dataset.hasQuote;
            delete liveEl.dataset.price;
        }
    }

    /** Same-day target +1%; overnight / multi-day target +1.3%. */
    const TX_SELL_PCT_SAME_DAY = 0.01;
    const TX_SELL_PCT_OVERNIGHT = 0.013;
    /** Default investment budget used to suggest quantity (~₹1 lakh). */
    const TX_DEFAULT_BUDGET = 100000;
    let txSellPriceAuto = false;
    let txQtyAuto = false;
    let txLivePriceSeq = 0;

    function roundTradePrice(n) {
        const v = Number(n);
        if (!v || isNaN(v) || v <= 0) return '';
        return Math.round(v * 100) / 100;
    }

    function isSameDayTradeDates(buyDate, sellDate) {
        return !!(buyDate && sellDate && buyDate === sellDate);
    }

    function suggestedSellPriceFromBuy(buyPrice, buyDate, sellDate) {
        const buy = Number(buyPrice);
        if (!buy || isNaN(buy) || buy <= 0) return '';
        const pct = isSameDayTradeDates(buyDate, sellDate) ? TX_SELL_PCT_SAME_DAY : TX_SELL_PCT_OVERNIGHT;
        return roundTradePrice(buy * (1 + pct));
    }

    function suggestedQtyFromBuyPrice(buyPrice) {
        const buy = Number(buyPrice);
        if (!buy || isNaN(buy) || buy <= 0) return '';
        return String(Math.max(1, Math.floor(TX_DEFAULT_BUDGET / buy)));
    }

    function markTxSellPriceManual() {
        txSellPriceAuto = false;
    }

    function markTxQtyManual() {
        txQtyAuto = false;
    }

    function resetTxPriceAutoFlags() {
        txSellPriceAuto = false;
        txQtyAuto = false;
    }

    function applySuggestedSellPrice(opts) {
        const force = !!(opts && opts.force);
        if (!force && !txSellPriceAuto) return false;
        const buyEl = document.getElementById('txBuyPrice');
        const sellEl = document.getElementById('txSellPrice');
        const buyDateEl = document.getElementById('txBuyDate');
        const sellDateEl = document.getElementById('txSellDate');
        if (!buyEl || !sellEl) return false;
        const suggested = suggestedSellPriceFromBuy(
            buyEl.value,
            buyDateEl && buyDateEl.value,
            sellDateEl && sellDateEl.value
        );
        if (suggested === '') return false;
        sellEl.value = suggested;
        txSellPriceAuto = true;
        return true;
    }

    function applySuggestedQty(opts) {
        const force = !!(opts && opts.force);
        if (!force && !txQtyAuto) return false;
        const qtyEl = document.getElementById('txQty');
        const buyEl = document.getElementById('txBuyPrice');
        if (!qtyEl || !buyEl) return false;
        const qty = suggestedQtyFromBuyPrice(buyEl.value);
        if (qty === '') return false;
        qtyEl.value = qty;
        txQtyAuto = true;
        return true;
    }

    function setTxLivePriceBtnBusy(busy) {
        const btn = document.getElementById('txBuyPriceLiveBtn');
        if (!btn) return;
        btn.disabled = !!busy;
        btn.innerHTML = busy
            ? '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>'
            : '<i class="fas fa-sync-alt trade-detail-bullseye" aria-hidden="true"></i>';
    }

    async function fillTradeFormFromLivePrice(itemOrNull) {
        const item = (itemOrNull && itemOrNull.s)
            ? itemOrNull
            : (selectedStockMeta || findStockMetaForCompany(
                (document.getElementById('txCompany') && document.getElementById('txCompany').value) || ''
            ));
        if (!item || !item.s) {
            showToast('Select a company from the list first.', 'warning');
            return null;
        }

        const seq = ++txLivePriceSeq;
        setTxLivePriceBtnBusy(true);
        setTxLivePriceStatus('<i class="fas fa-spinner fa-spin me-1"></i>Fetching live price…', false);

        let quote = getTradeLiveQuote(item.s);
        if (!isFreshMarketQuote(quote)) {
            quote = await fetchOneMarketQuote(item);
            cacheMarketQuote(quote);
        }

        if (seq !== txLivePriceSeq) return null;
        setTxLivePriceBtnBusy(false);

        if (!isValidMarketQuote(quote)) {
            setTxLivePriceValue(null);
            setTxLivePriceStatus('Live price unavailable — enter buy manually', true);
            showToast('Could not fetch live price. Enter buy price manually.', 'warning');
            return null;
        }

        const buy = roundTradePrice(quote.price);
        const buyEl = document.getElementById('txBuyPrice');
        if (buyEl) buyEl.value = buy;
        applySuggestedSellPrice({ force: true });
        applySuggestedQty({ force: true });

        const buyDate = document.getElementById('txBuyDate')?.value;
        const sellDate = document.getElementById('txSellDate')?.value;
        const pctLabel = isSameDayTradeDates(buyDate, sellDate) ? '+1% same-day' : '+1.3% overnight';
        const sellVal = document.getElementById('txSellPrice')?.value;
        const qtyVal = document.getElementById('txQty')?.value;
        setTxLivePriceValue(buy);
        setTxLivePriceStatus(`Qty ${qtyVal} · Target ${pctLabel} ₹${sellVal}`, false);
        showToast(`Buy ₹${buy} · Qty ${qtyVal} · Sell ${pctLabel}`, 'success');

        try {
            if (typeof updatePreview === 'function') updatePreview();
            if (typeof window.MTFComponents?.updateLeverageBreakdown === 'function') {
                window.MTFComponents.updateLeverageBreakdown();
            }
        } catch (_) { }

        return quote;
    }

    function onTxBuyPriceInputForSuggest() {
        if (txSellPriceAuto) applySuggestedSellPrice();
        const qtyEl = document.getElementById('txQty');
        if (txQtyAuto) {
            applySuggestedQty();
        } else if (qtyEl && !String(qtyEl.value || '').trim()) {
            applySuggestedQty({ force: true });
        }
    }

    function onTxQtyInputManual() {
        markTxQtyManual();
    }

    function onTxSellPriceInputManual() {
        markTxSellPriceManual();
    }

    function onTxTradeDatesChangeForSuggest() {
        if (!txSellPriceAuto) return;
        applySuggestedSellPrice();
        const buy = document.getElementById('txBuyPrice')?.value;
        const sell = document.getElementById('txSellPrice')?.value;
        const buyDate = document.getElementById('txBuyDate')?.value;
        const sellDate = document.getElementById('txSellDate')?.value;
        if (selectedStockMeta && buy && sell) {
            const pctLabel = isSameDayTradeDates(buyDate, sellDate) ? '+1% same-day' : '+1.3% overnight';
            setTxLivePriceStatus(`Sell target ${pctLabel} ₹${sell}`, false);
        }
    }

    async function selectStockSymbol(idx) {
        const item = stockAcResults[idx];
        if (!item) return;
        await selectStockSymbolFromMeta(item);
    }

    async function selectStockSymbolFromMeta(item) {
        if (!item) return;
        if (stockAcBlurTimer) clearTimeout(stockAcBlurTimer);
        const companyEl = document.getElementById('txCompany');
        if (companyEl) companyEl.value = item.n || item.s || '';
        setTxCompanyMeta(item);
        hideCompanyAcList();
        await fillTradeFormFromLivePrice(item);
    }

    function onTxCompanyInput() {
        setTxCompanyMeta(null);
        const liveEl = document.getElementById('txLivePrice');
        if (liveEl) delete liveEl.dataset.hasQuote;
        const q = (document.getElementById('txCompany').value || '').trim();
        if (q.length < 1) {
            hideCompanyAcList();
            return;
        }
        clearTimeout(stockSearchTimer);
        stockSearchTimer = setTimeout(() => runStockSearch(q), 300);
    }

    function onTxCompanyFocus() {
        const q = (document.getElementById('txCompany').value || '').trim();
        loadStockCatalogFromInternet();
        if (q.length >= 1) {
            clearTimeout(stockSearchTimer);
            stockSearchTimer = setTimeout(() => runStockSearch(q), 120);
        }
    }

    function onTxCompanyBlur() {
        stockAcBlurTimer = setTimeout(hideCompanyAcList, 150);
    }

    function onTxCompanyKeydown(e) {
        const list = document.getElementById('txCompanyAcList');
        if (!list || list.classList.contains('d-none') || !stockAcResults.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            stockAcActiveIdx = Math.min(stockAcActiveIdx + 1, stockAcResults.length - 1);
            highlightCompanyAcItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            stockAcActiveIdx = Math.max(stockAcActiveIdx - 1, 0);
            highlightCompanyAcItem();
        } else if (e.key === 'Enter' && stockAcActiveIdx >= 0) {
            e.preventDefault();
            selectStockSymbol(stockAcActiveIdx);
        } else if (e.key === 'Escape') {
            hideCompanyAcList();
        }
    }

    function highlightCompanyAcItem() {
        const list = document.getElementById('txCompanyAcList');
        if (!list) return;
        list.querySelectorAll('[role="option"]').forEach((el, i) => {
            el.classList.toggle('bg-primary-subtle', i === stockAcActiveIdx);
            if (i === stockAcActiveIdx) el.scrollIntoView({ block: 'nearest' });
        });
    }

    // ---------- MTF CALCULATOR company search (live quote → ₹1L qty + 1.35% sell) ----------
    const CALC_DEFAULT_BUDGET = 100000;
    const CALC_SELL_PCT = 1.35; // +1.35% of buy
    let calcSelectedMeta = null;
    let calcStockAcResults = [];
    let calcStockAcActiveIdx = -1;
    let calcStockSearchSeq = 0;
    let calcStockSearchTimer = null;
    let calcStockAcBlurTimer = null;
    let calcLivePriceSeq = 0;

    function setCalcCompanyLiveNote(msg, isError) {
        const note = document.getElementById('calcCompanyLiveNote');
        if (!note) return;
        note.className = isError ? 'small text-danger mb-0 mt-1' : 'small text-muted mb-0 mt-1';
        note.innerHTML = msg || '';
    }

    function hideCalcCompanyAcList() {
        const list = document.getElementById('calcCompanyAcList');
        if (list) {
            list.classList.add('d-none');
            list.innerHTML = '';
        }
        calcStockAcResults = [];
        calcStockAcActiveIdx = -1;
    }

    function renderCalcCompanyAcList(items) {
        const list = document.getElementById('calcCompanyAcList');
        const input = document.getElementById('calcCompany');
        if (!list || !input) return;
        calcStockAcResults = items || [];
        calcStockAcActiveIdx = calcStockAcResults.length ? 0 : -1;

        if (!calcStockAcResults.length) {
            const q = (input.value || '').trim();
            list.innerHTML = q.length
                ? `<div class="px-3 py-2 small text-muted">No match for “${escapeHtml(q)}”.</div>`
                : '';
            list.classList.toggle('d-none', q.length < 1);
            return;
        }

        list.innerHTML = calcStockAcResults.map((it, idx) => {
            const meta = it.sector
                ? `${escapeHtml(it.sector)}${it.industry ? ' · ' + escapeHtml(it.industry) : ''} · ${escapeHtml(it.e || 'NSE')}`
                : (it.i ? `${escapeHtml(it.i)} · ${escapeHtml(it.e || 'NSE')}` : escapeHtml(it.e || 'NSE'));
            const activeCls = idx === calcStockAcActiveIdx ? ' bg-light' : '';
            return `
                    <div class="list-group-item list-group-item-action border-0 border-bottom rounded-0${activeCls}" role="option" data-idx="${idx}" onmousedown="selectCalcStockSymbol(${idx})">
                        <div class="fw-medium text-body-secondary small">${escapeHtml(it.s)}</div>
                        <div class="small">${escapeHtml(it.n)}</div>
                        <div class="small text-muted">${meta}</div>
                    </div>`;
        }).join('');
        list.classList.remove('d-none');
    }

    function showCalcCompanyAcLoading(msg) {
        const list = document.getElementById('calcCompanyAcList');
        if (!list) return;
        list.innerHTML = `<div class="px-3 py-2 small text-muted"><i class="fas fa-spinner fa-spin me-1"></i>${escapeHtml(msg || 'Searching…')}</div>`;
        list.classList.remove('d-none');
    }

    async function runCalcStockSearch(query) {
        const q = (query || '').trim();
        const seq = ++calcStockSearchSeq;
        if (q.length < 1) {
            hideCalcCompanyAcList();
            return;
        }

        showCalcCompanyAcLoading(stockCatalogLoaded ? 'Searching…' : 'Fetching live market data…');
        loadStockCatalogFromInternet();

        let results = stockCatalogLoaded ? searchStockSymbolsLocal(q, 12) : [];
        if (results.length && seq === calcStockSearchSeq) renderCalcCompanyAcList(results);

        if (q.length >= 2) {
            try {
                const remote = await fetchYahooStockSearch(q);
                if (seq !== calcStockSearchSeq) return;
                results = mergeStockResults(results, remote);
                renderCalcCompanyAcList(results);
            } catch (_) {
                if (seq === calcStockSearchSeq && !results.length && stockCatalogLoaded) {
                    renderCalcCompanyAcList(results);
                }
            }
        } else if (stockCatalogLoaded) {
            results = searchStockSymbolsLocal(q, 12);
            if (seq === calcStockSearchSeq) renderCalcCompanyAcList(results);
        } else {
            await loadStockCatalogFromInternet();
            if (seq !== calcStockSearchSeq) return;
            results = searchStockSymbolsLocal(q, 12);
            renderCalcCompanyAcList(results);
        }
    }

    async function fillCalcFromLivePrice(item) {
        if (!item || !item.s) {
            showToast('Select a company from the list first.', 'warning');
            return null;
        }

        const seq = ++calcLivePriceSeq;
        setCalcCompanyLiveNote('<i class="fas fa-spinner fa-spin me-1"></i>Fetching live price…', false);

        let quote = getTradeLiveQuote(item.s);
        if (!isFreshMarketQuote(quote)) {
            quote = await fetchOneMarketQuote(item);
            cacheMarketQuote(quote);
        }
        if (seq !== calcLivePriceSeq) return null;

        if (!isValidMarketQuote(quote)) {
            setCalcCompanyLiveNote('Live price unavailable — enter buy manually.', true);
            showToast('Could not fetch live price. Enter buy price manually.', 'warning');
            return null;
        }

        const buy = roundTradePrice(quote.price);
        const qty = Math.max(1, Math.floor(CALC_DEFAULT_BUDGET / Number(buy)));
        const sell = roundTradePrice(Number(buy) * (1 + CALC_SELL_PCT / 100));

        const buyEl = document.getElementById('calcBuyPrice');
        const qtyEl = document.getElementById('calcQty');
        if (buyEl) buyEl.value = buy;
        if (qtyEl) qtyEl.value = String(qty);

        // Sync sell-% chips to +1.35% (sets sell from live buy).
        if (typeof setCalcSellPct === 'function') setCalcSellPct(CALC_SELL_PCT);
        else {
            const sellEl = document.getElementById('calcSellPrice');
            if (sellEl) sellEl.value = sell;

        }

        const sellShown = document.getElementById('calcSellPrice')?.value || sell;
        setCalcCompanyLiveNote(
            `${escapeHtml(item.s)} · Live ₹${buy} · Qty ${qty} (₹1L) · Sell +1.35% ₹${sellShown}`,
            false
        );
        showToast(`Filled ${item.s}: Buy ₹${buy} · Qty ${qty} · Sell +1.35%`, 'success');
        return quote;
    }

    async function selectCalcStockSymbol(idx) {
        const item = calcStockAcResults[idx];
        if (!item) return;
        await selectCalcStockFromMeta(item);
    }

    async function selectCalcStockFromMeta(item) {
        if (!item) return;
        if (calcStockAcBlurTimer) clearTimeout(calcStockAcBlurTimer);
        calcSelectedMeta = item;
        const input = document.getElementById('calcCompany');
        if (input) {
            input.value = item.n || item.s || '';
            input.dataset.symbol = item.s || '';
        }
        const pick = document.querySelector('#page-mtf-calc .calc-company-pick');
        if (pick) pick.dataset.symbol = item.s || '';
        hideCalcCompanyAcList();
        const quote = await fillCalcFromLivePrice(item);
        if (typeof paintCalcCompanyHeader === 'function') paintCalcCompanyHeader();
        if (typeof paintCalcLiveQuote === 'function') paintCalcLiveQuote(quote);

    }

    function onCalcCompanyInput() {
        calcSelectedMeta = null;
        const q = (document.getElementById('calcCompany')?.value || '').trim();
        if (q.length < 1) {
            hideCalcCompanyAcList();
            setCalcCompanyLiveNote('Search a stock to fill qty (₹1L), buy (live), and sell (+1.35%).', false);
            return;
        }
        clearTimeout(calcStockSearchTimer);
        calcStockSearchTimer = setTimeout(() => runCalcStockSearch(q), 300);
    }

    function onCalcCompanyFocus() {
        const q = (document.getElementById('calcCompany')?.value || '').trim();
        loadStockCatalogFromInternet();
        if (q.length >= 1) {
            clearTimeout(calcStockSearchTimer);
            calcStockSearchTimer = setTimeout(() => runCalcStockSearch(q), 120);
        }
    }

    function onCalcCompanyBlur() {
        calcStockAcBlurTimer = setTimeout(hideCalcCompanyAcList, 150);
    }

    function onCalcCompanyKeydown(e) {
        const list = document.getElementById('calcCompanyAcList');
        if (!list || list.classList.contains('d-none') || !calcStockAcResults.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            calcStockAcActiveIdx = Math.min(calcStockAcActiveIdx + 1, calcStockAcResults.length - 1);
            highlightCalcCompanyAcItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            calcStockAcActiveIdx = Math.max(calcStockAcActiveIdx - 1, 0);
            highlightCalcCompanyAcItem();
        } else if (e.key === 'Enter' && calcStockAcActiveIdx >= 0) {
            e.preventDefault();
            selectCalcStockSymbol(calcStockAcActiveIdx);
        } else if (e.key === 'Escape') {
            hideCalcCompanyAcList();
        }
    }

    function highlightCalcCompanyAcItem() {
        const list = document.getElementById('calcCompanyAcList');
        if (!list) return;
        list.querySelectorAll('[role="option"]').forEach((el, i) => {
            el.classList.toggle('bg-primary-subtle', i === calcStockAcActiveIdx);
            el.classList.toggle('bg-light', i === calcStockAcActiveIdx);
            if (i === calcStockAcActiveIdx) el.scrollIntoView({ block: 'nearest' });
        });
    }

    function initCompanyAutocomplete() {
        const cached = loadStockCatalogCache();
        if (cached) applyStockCatalog(cached, 'cached');
        else setStockCatalogStatus('Live search — type 1–2 letters (loads NSE list from internet)');
        loadStockCatalogFromInternet();
    }

    function resetCompanyAutocomplete() {
        hideCompanyAcList();
        setTxCompanyMeta(null);
        setTxCompanySearchLocked(false);
        clearTimeout(stockSearchTimer);
        setTxLivePriceBtnBusy(false);
    }

    async function openBuyTradeFromMarket(symbol, name) {
        const sym = String(symbol || '').trim().toUpperCase();
        if (!sym) {
            showToast('Missing company symbol.', 'warning');
            return;
        }
        const meta = findStockMetaForSymbol(sym) || {
            s: sym,
            n: String(name || sym).trim() || sym,
            e: 'NSE'
        };
        // Refresh this company before opening the trade form.
        try {
            await enqueueQuoteFetch(meta, { force: true });
            try { persistMarketQuoteCacheLocal(); } catch (_) { }
            try { paintAfterQuoteUpdate(); } catch (_) { }
        } catch (err) {
            MTFLogger.warn('Company quote refresh failed', err);
        }
        const openForm = (typeof window.openAddModal === 'function')
            ? window.openAddModal
            : openAddModal;
        if (typeof openForm !== 'function') {
            showToast('Trade form is not ready yet.', 'danger');
            return;
        }
        try {
            await openForm(meta);
        } catch (err) {
            MTFLogger.error('openBuyTradeFromMarket', err);
            showToast('Could not open trade form.', 'danger');
        }
    }

    function onMarketQuotesListClick(e) {
        const target = e.target && e.target.closest ? e.target : null;
        if (!target || typeof target.closest !== 'function') return;

        const removeBtn = target.closest('.market-remove-btn');
        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const sym = removeBtn.getAttribute('data-remove-symbol') || '';
            removeMarketWatchlistSymbol(sym);
            return;
        }

        const buyBtn = target.closest('.market-buy-btn');
        if (!buyBtn) return;
        e.preventDefault();
        e.stopPropagation();
        const sym = buyBtn.getAttribute('data-buy-symbol') || '';
        const name = buyBtn.getAttribute('data-buy-name') || '';
        openBuyTradeFromMarket(sym, name);
    }

    function findStockMetaForSymbol(symbol) {
        const key = (symbol || '').trim().toUpperCase();
        if (!key) return null;
        return stockSymbols.find(s => s.s.toUpperCase() === key) || null;
    }

    function findStockMetaForCompany(value) {
        const key = (value || '').trim();
        if (!key) return null;
        const bySymbol = findStockMetaForSymbol(key);
        if (bySymbol) return bySymbol;
        const keyUp = key.toUpperCase();
        return stockSymbols.find(s => s.n.toUpperCase() === keyUp) || null;
    }

    function resolveCompanyName(raw) {
        const trimmed = (raw || '').trim();
        if (!trimmed) return '';
        const meta = selectedStockMeta || findStockMetaForCompany(trimmed);
        if (meta && trimmed.toUpperCase() === meta.s.toUpperCase()) return meta.n;
        return trimmed;
    }

    function resolveCompanySymbol(raw) {
        const meta = selectedStockMeta || findStockMetaForCompany((raw || '').trim());
        if (meta && meta.s) return normalizeMarketSymbol(meta.s);
        const rawUp = String(raw || '').trim().toUpperCase();
        if (/^[A-Z0-9&.-]{1,20}$/.test(rawUp)) return normalizeMarketSymbol(rawUp);
        return '';
    }

    const TRADE_COMPANY_FEED_MAP = {
        'Angel One Limited': { company: 'Angel One Limited', symbol: 'ANGELONE' },
        'Anthem Biosciences Limited': { company: 'Anthem Biosciences Limited', symbol: 'ANTHEM' },
        'Aravinda smart': { company: 'Arvind SmartSpaces Limited', symbol: 'ARVSMART' },
        'Bajaj Auto Limited': { company: 'Bajaj Auto Limited', symbol: 'BAJAJ-AUTO' },
        'Crompton Greaves': { company: 'Crompton Greaves Consumer Electricals Limited', symbol: 'CROMPTON' },
        'Crompton Greaves Consumer Electricals Limited': { company: 'Crompton Greaves Consumer Electricals Limited', symbol: 'CROMPTON' },
        'Genus Power Infrastructures Limited': { company: 'Genus Power Infrastructures Limited', symbol: 'GENUSPOWER' },
        'International Gemological Institute Limited': { company: 'International Gemological Institute Limited', symbol: 'IGIL' },
        'Max Healthcare': { company: 'Max Healthcare Institute Limited', symbol: 'MAXHEALTH' },
        'Mcx': { company: 'Multi Commodity Exchange of India Limited', symbol: 'MCX' },
        'MCX': { company: 'Multi Commodity Exchange of India Limited', symbol: 'MCX' },
        'Metropolitic': { company: 'Metropolis Healthcare Limited', symbol: 'METROPOLIS' },
        'NLC India Limited': { company: 'NLC India Limited', symbol: 'NLCINDIA' },
        'Nestlé': { company: 'Nestlé India Limited', symbol: 'NESTLEIND' },
        'Nestle': { company: 'Nestlé India Limited', symbol: 'NESTLEIND' },
        'Tata Chemicals Limited': { company: 'Tata Chemicals Limited', symbol: 'TATACHEM' },
        'Usha Martin': { company: 'Usha Martin Limited', symbol: 'USHAMART' },
        'Usha Martin Limited': { company: 'Usha Martin Limited', symbol: 'USHAMART' },
        'V2 Retail Limited': { company: 'V2 Retail Limited', symbol: 'V2RETAIL' }
    };
    const TRADE_SYMBOL_MIGRATE_KEY = 'mtf_trade_symbol_migrate_v1';

    function lookupTradeFeedMapping(company) {
        const key = String(company || '').trim();
        if (!key) return null;
        if (TRADE_COMPANY_FEED_MAP[key]) return TRADE_COMPANY_FEED_MAP[key];
        const lower = key.toLowerCase();
        const hit = Object.keys(TRADE_COMPANY_FEED_MAP).find((k) => k.toLowerCase() === lower);
        if (hit) return TRADE_COMPANY_FEED_MAP[hit];
        if (/^nestl/i.test(key)) return TRADE_COMPANY_FEED_MAP['Nestlé'];
        if (/^mcx$/i.test(key)) return TRADE_COMPANY_FEED_MAP['Mcx'];
        if (/^metropol/i.test(key)) return TRADE_COMPANY_FEED_MAP['Metropolitic'];
        if (/^aravinda|^arvind\s*smart/i.test(key)) return TRADE_COMPANY_FEED_MAP['Aravinda smart'];
        if (/^crompton\s*greaves$/i.test(key)) return TRADE_COMPANY_FEED_MAP['Crompton Greaves'];
        if (/^max\s*health/i.test(key) && !/institute/i.test(key)) return TRADE_COMPANY_FEED_MAP['Max Healthcare'];
        if (/^usha\s*martin$/i.test(key)) return TRADE_COMPANY_FEED_MAP['Usha Martin'];
        return null;
    }

    function migrateTradeCompanySymbols(opts) {
        const force = !!(opts && opts.force);
        try {
            if (!force && localStorage.getItem(TRADE_SYMBOL_MIGRATE_KEY) === '1') {
                // Still fill any missing symbols from map/catalog without renaming again.
            }
        } catch (_) { }

        const data = getStorage();
        const txs = Array.isArray(data.transactions) ? data.transactions : [];
        let changed = 0;
        const next = txs.map((t) => {
            if (!t) return t;
            const mapped = lookupTradeFeedMapping(t.company);
            const catalog = findStockMetaForCompany(t.company || '');
            let company = t.company || '';
            let symbol = normalizeMarketSymbol(t.symbol || '');

            if (mapped) {
                if (company !== mapped.company || symbol !== mapped.symbol) {
                    company = mapped.company;
                    symbol = mapped.symbol;
                }
            } else if (!symbol && catalog && catalog.s) {
                symbol = normalizeMarketSymbol(catalog.s);
                if (catalog.n) company = catalog.n;
            }

            if (company === (t.company || '') && symbol === normalizeMarketSymbol(t.symbol || '')) {
                return t;
            }
            changed += 1;
            return { ...t, company, symbol };
        });

        if (changed > 0) {
            data.transactions = next;
            saveStorage(data);
            try { localStorage.setItem(TRADE_SYMBOL_MIGRATE_KEY, '1'); } catch (_) { }
            console.info(`Migrated company/symbol on ${changed} trade(s)`);
            try { refreshTradeListViews(); } catch (_) { }
        } else {
            try { localStorage.setItem(TRADE_SYMBOL_MIGRATE_KEY, '1'); } catch (_) { }
        }
        return changed;
    }

    // ---------- MARKET QUOTES (live Yahoo chart via Jina fallback) ----------
    const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
    const MARKET_REFRESH_MS = 5 * 60 * 1000; // auto-refresh every 5 minutes

    let marketQuoteCache = {};
    let marketUpdatedAt = null;
    let marketLoading = false;
    let marketError = '';
    let marketFilterQuery = '';
    let marketSubTab = 'watchlist';
    let marketRefreshTimer = null;
    let marketSearchTimer = null;
    let marketSearchSeq = 0;
    let marketAcResults = [];
    let marketAcActiveIdx = -1;
    let marketAcBlurTimer = null;

    function yahooSymbolForNse(symbol) {
        const s = String(symbol || '').trim().toUpperCase();
        if (!s) return '';
        if (s.endsWith('.NS') || s.endsWith('.BO')) return s;
        return s + '.NS';
    }

    function normalizeMarketSymbol(symbol) {
        return String(symbol || '').trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
    }

    function getMarketWatchlist() {
        let list = [];
        if (window.watchlistRepo && window.watchlistRepo.cache.size > 0) {
            list = Array.from(window.watchlistRepo.cache.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        } else {
            // Fallback for legacy initialization before fetch completes
            list = getStorage().marketWatchlist || [];
        }
        return list.map((item) => ({
            s: normalizeMarketSymbol(item.s),
            n: String(item.n || item.s || '').trim() || normalizeMarketSymbol(item.s),
            extra: true
        })).filter((item) => item.s);
    }

    function normalizeWatchlistEntry(item) {
        const s = normalizeMarketSymbol(item && (item.s || item.symbol));
        if (!s) return null;
        const n = String((item && (item.n || item.name)) || s).trim() || s;
        // Identity only — live quotes stay in a separate localStorage cache.
        return { s, n };
    }

    function tombstoneWatchlistSymbol(symbol) {
        const db = window.MTFDb;
        if (db && typeof db.tombstoneWatchlistSymbol === 'function') {
            db.tombstoneWatchlistSymbol(symbol);
        }
    }

    function clearWatchlistTombstone(symbol) {
        const db = window.MTFDb;
        if (db && typeof db.clearWatchlistTombstone === 'function') {
            db.clearWatchlistTombstone(symbol);
        }
    }

    function stripWatchlistTombstones(list) {
        const db = window.MTFDb;
        if (db && typeof db.stripWatchlistTombstones === 'function') {
            return db.stripWatchlistTombstones(list)
                .map((raw) => normalizeWatchlistEntry(raw))
                .filter(Boolean);
        }
        return (Array.isArray(list) ? list : [])
            .map((raw) => normalizeWatchlistEntry(raw))
            .filter(Boolean);
    }

    function readQuoteCacheMap() {
        const db = window.MTFDb;
        if (db && typeof db.readMarketQuoteCacheMap === 'function') {
            return db.readMarketQuoteCacheMap() || {};
        }
        try {
            const raw = localStorage.getItem('mtf_market_quote_cache');
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writeQuoteCacheMap(map) {
        const db = window.MTFDb;
        if (db && typeof db.writeMarketQuoteCacheMap === 'function') {
            db.writeMarketQuoteCacheMap(map || {});
            return;
        }
        try {
            localStorage.setItem('mtf_market_quote_cache', JSON.stringify(map || {}));
        } catch (_) { /* ignore */ }
    }

    function hydrateMarketQuoteCacheFromLocal() {
        const map = readQuoteCacheMap();
        let newest = null;
        Object.keys(map).forEach((key) => {
            const snap = map[key];
            const s = normalizeMarketSymbol((snap && snap.symbol) || key);
            if (!s) return;
            const price = Number(snap && snap.price);
            if (!isFinite(price) || price <= 0) return;
            const existing = marketQuoteCache[s];
            if (isValidMarketQuote(existing) && !existing.fromLocalCache) return;
            const previousClose = Number(snap.previousClose);
            const change = Number(snap.change);
            const changePct = Number(snap.changePct);
            marketQuoteCache[s] = {
                symbol: s,
                name: String((snap && snap.name) || s).trim() || s,
                price,
                previousClose: isFinite(previousClose) ? previousClose : null,
                change: isFinite(change) ? change : null,
                changePct: isFinite(changePct) ? changePct : null,
                updatedAt: snap.updatedAt ? String(snap.updatedAt) : null,
                fromLocalCache: true,
                error: false
            };
            if (snap.updatedAt) {
                const t = Date.parse(snap.updatedAt);
                if (!isNaN(t) && (newest == null || t > newest)) newest = t;
            }
        });
        if (newest != null && !marketUpdatedAt) {
            marketUpdatedAt = new Date(newest).toISOString();
        }
    }

    /** Persist quotes to localStorage only — never via saveStorage / Firestore. */
    function persistMarketQuoteCacheLocal() {
        const map = readQuoteCacheMap();
        Object.keys(marketQuoteCache).forEach((key) => {
            const q = marketQuoteCache[key];
            if (!isValidMarketQuote(q)) return;
            const s = normalizeMarketSymbol(q.symbol || key);
            if (!s) return;
            map[s] = {
                symbol: s,
                name: String(q.name || s).trim() || s,
                price: Number(q.price),
                previousClose: q.previousClose != null && isFinite(Number(q.previousClose))
                    ? Number(q.previousClose)
                    : null,
                change: q.change != null && isFinite(Number(q.change))
                    ? Number(q.change)
                    : null,
                changePct: q.changePct != null && isFinite(Number(q.changePct))
                    ? Number(q.changePct)
                    : null,
                updatedAt: q.updatedAt || new Date().toISOString()
            };
        });
        writeQuoteCacheMap(map);
    }

    let quoteCachePersistTimer = null;
    function schedulePersistMarketQuoteCache() {
        if (quoteCachePersistTimer) clearTimeout(quoteCachePersistTimer);
        quoteCachePersistTimer = setTimeout(() => {
            quoteCachePersistTimer = null;
            try { persistMarketQuoteCacheLocal(); } catch (_) { }
        }, 250);
    }

    function addToMarketWatchlist(item) {
        const entry = normalizeWatchlistEntry(item);
        if (!entry) return Promise.resolve(null);
        clearWatchlistTombstone(entry.s);
        
        if (window.watchlistRepo) {
            return window.watchlistRepo.add(entry).then(() => {
                refreshAllViews();
                return { s: entry.s, n: entry.n };
            }).catch(err => {
                showToast('Failed to add to watchlist. Please try again.', 'danger');
                if (window.MTFLogger) window.MTFLogger.error('addToMarketWatchlist failed', err);
                return null;
            });
        } else {
            // Fallback for legacy
            const data = getStorage();
            const list = stripWatchlistTombstones(
                Array.isArray(data.marketWatchlist) ? data.marketWatchlist : []
            );
            const existing = list.find((x) => x.s === entry.s);
            if (existing) {
                existing.n = entry.n;
            } else {
                list.unshift(entry);
            }
            data.marketWatchlist = list;
            return saveStorage(data).then(() => ({ s: entry.s, n: entry.n }));
        }
    }

    function removeFromMarketWatchlist(symbol) {
        const key = normalizeMarketSymbol(symbol);
        if (!key) return Promise.resolve(null);
        tombstoneWatchlistSymbol(key);
        
        delete marketQuoteCache[key];
        const map = readQuoteCacheMap();
        if (map[key]) {
            delete map[key];
            writeQuoteCacheMap(map);
        }

        if (window.watchlistRepo) {
            return window.watchlistRepo.remove(key).then(() => {
                refreshAllViews();
            }).catch(err => {
                showToast('Failed to remove from watchlist.', 'danger');
                if (window.MTFLogger) window.MTFLogger.error('removeFromMarketWatchlist failed', err);
            });
        } else {
            const data = getStorage();
            data.marketWatchlist = stripWatchlistTombstones(data.marketWatchlist || [])
                .filter((id) => id && id.s !== key);
            return saveStorage(data);
        }
    }

    function removeMarketWatchlistSymbol(symbol) {
        const key = normalizeMarketSymbol(symbol);
        if (!key) {
            showToast('Could not remove — missing symbol.', 'warning');
            return Promise.resolve(null);
        }
        const entry = getMarketWatchlist().find((item) => item.s === key);
        const label = (entry && entry.n && entry.n !== key)
            ? `${key} (${entry.n})`
            : key;

        confirmAction({
            title: '<i class="fas fa-trash-alt me-2"></i>Remove from watchlist?',
            titleClass: 'text-danger',
            message: `Remove ${label} from your watchlist?`,
            confirmLabel: '<i class="fas fa-trash-alt me-1"></i> Remove',
            confirmClass: 'danger',
            onConfirm: () => {
                // Optimistic UI: drop the card immediately.
                try {
                    const cards = document.querySelectorAll('#marketQuotesList [data-quote-symbol]');
                    cards.forEach((card) => {
                        const sym = (card.getAttribute('data-quote-symbol') || '').toUpperCase();
                        if (sym === key) card.remove();
                    });
                } catch (_) { /* ignore */ }

                return removeFromMarketWatchlist(key).then(() => {
                    try { renderMarketPage(); } catch (_) { }
                    showToast(key + ' removed from watchlist', 'success');
                    return true;
                }).catch((err) => {
                    MTFLogger.warn('removeMarketWatchlistSymbol failed', err);
                    showToast('Could not remove from watchlist.', 'danger');
                    try { renderMarketPage(); } catch (_) { }
                    return false;
                });
            }
        });
        return Promise.resolve(null);
    }

    function getMarketUniverse() {
        return getMarketWatchlist().map((item) => {
            const catalog = findStockMetaForSymbol(item.s);
            return {
                s: item.s,
                n: item.n || (catalog && catalog.n) || item.s,
                pinned: false,
                extra: true,
                removable: true
            };
        });
    }

    function syncMarketSubTabUI() {
        /* Watchlist search lives in the header search screen. */
    }

    function setMarketSubTab() {
        marketSubTab = 'watchlist';
        marketFilterQuery = '';
        try { renderMarketPage(); } catch (_) { }
        refreshMarketQuotes();
    }

    function parseYahooChartQuote(data, fallbackSymbol, fallbackName) {
        const result = data && data.chart && data.chart.result && data.chart.result[0];
        if (!result || !result.meta) return null;
        const meta = result.meta;
        const price = Number(meta.regularMarketPrice);
        if (isNaN(price)) return null;
        const prev = Number(
            meta.chartPreviousClose != null ? meta.chartPreviousClose : meta.previousClose
        );
        const change = !isNaN(prev) ? price - prev : NaN;
        const changePct = !isNaN(prev) && prev !== 0 ? (change / prev) * 100 : NaN;
        const sym = normalizeMarketSymbol(
            (meta.symbol || fallbackSymbol || '').replace(/\.(NS|BO)$/i, '')
        );
        return {
            symbol: sym,
            name: fallbackName || meta.shortName || meta.longName || sym,
            price,
            previousClose: isNaN(prev) ? null : prev,
            change: isNaN(change) ? null : change,
            changePct: isNaN(changePct) ? null : changePct,
            updatedAt: new Date().toISOString()
        };
    }

    async function fetchYahooChartJson(yahooSymbol) {
        const url = `${YAHOO_CHART_BASE}${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
        // Always use Jina — direct Yahoo chart fetch is blocked by CORS in browsers.
        // Throttle so we do not trip Jina's 429 rate limit.
        const proxied = await fetchViaJinaThrottled(url);
        return parseJinaJson(proxied);
    }

    /**
     * Parse a Yahoo abbreviated market-cap string (e.g. "17.497T", "2.3B",
     * "500M") into an absolute number. Returns null if it cannot be parsed.
     */
    function parseYahooMarketCapText(text) {
        if (!text) return null;
        const m = String(text).trim().match(/([\d,.]+)\s*([TBMK]?)/i);
        if (!m) return null;
        const num = parseFloat(m[1].replace(/,/g, ''));
        if (isNaN(num)) return null;
        const suffix = (m[2] || '').toUpperCase();
        const mult = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 }[suffix] || 1;
        return num * mult;
    }

    /**
     * Fetch the Yahoo quote page HTML via Jina and extract the market cap.
     * The chart API does not include marketCap, so we scrape the quote page.
     * Returns an absolute number (in the quote currency) or null.
     */
    async function fetchYahooMarketCap(yahooSymbol) {
        const url = `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/`;
        const html = await fetchViaJinaThrottled(url);
        // Jina returns markdown; the market cap line looks like:
        //   "Market Cap (intraday) 17.497T"  or  "Market Cap\n\n17.55T"
        const match = html.match(/Market\s*Cap(?:\s*\(intraday\))?\s*[:\n]*\s*([\d.,]+\s*[TBMK]?)/i);
        if (!match) return null;
        return parseYahooMarketCapText(match[1]);
    }

    /**
     * Richer parser for the company-info sheet — pulls extra meta fields
     * (exchange, currency, 52-week range, volume) on top of the live quote.
     */
    function parseYahooCompanyInfo(data, fallbackSymbol, fallbackName) {
        const result = data && data.chart && data.chart.result && data.chart.result[0];
        if (!result || !result.meta) return null;
        const meta = result.meta;
        const price = Number(meta.regularMarketPrice);
        const prev = Number(
            meta.chartPreviousClose != null ? meta.chartPreviousClose : meta.previousClose
        );
        const change = !isNaN(prev) ? price - prev : NaN;
        const changePct = !isNaN(prev) && prev !== 0 ? (change / prev) * 100 : NaN;
        const sym = normalizeMarketSymbol(
            (meta.symbol || fallbackSymbol || '').replace(/\.(NS|BO)$/i, '')
        );
        const num = (v) => {
            const n = Number(v);
            return isNaN(n) ? null : n;
        };
        // The chart meta does not include "open"; it lives in the indicators
        // quote array. Day high/low are in meta as regularMarketDayHigh/Low.
        const quoteInd = result.indicators && result.indicators.quote
            ? result.indicators.quote[0] : null;
        const firstVal = (arr) => {
            if (!Array.isArray(arr) || arr.length === 0) return null;
            return num(arr[0]);
        };
        return {
            symbol: sym,
            name: fallbackName || meta.longName || meta.shortName || sym,
            shortName: meta.shortName || '',
            longName: meta.longName || '',
            exchange: meta.exchangeName || meta.fullExchangeName || '',
            currency: meta.currency || '',
            price: isNaN(price) ? null : price,
            previousClose: isNaN(prev) ? null : prev,
            open: firstVal(quoteInd && quoteInd.open),
            dayHigh: num(meta.regularMarketDayHigh) || firstVal(quoteInd && quoteInd.high),
            dayLow: num(meta.regularMarketDayLow) || firstVal(quoteInd && quoteInd.low),
            change: isNaN(change) ? null : change,
            changePct: isNaN(changePct) ? null : changePct,
            fiftyTwoWeekHigh: num(meta.fiftyTwoWeekHigh),
            fiftyTwoWeekLow: num(meta.fiftyTwoWeekLow),
            regularMarketVolume: num(meta.regularMarketVolume),
            regularMarketTime: num(meta.regularMarketTime),
            marketCap: num(meta.marketCap),
            updatedAt: new Date().toISOString()
        };
    }

    // ---------- Company info cache (stale-while-revalidate) ----------
    // Caches rich company-info objects by normalized symbol so the info
    // sheet can render instantly on repeat opens instead of waiting for a
    // fresh Yahoo fetch every time.
    const companyInfoCache = {};
    const COMPANY_INFO_FRESH_MS = 5 * 60 * 1000; // treat cached info as fresh for 5 min

    /**
     * Build a partial company-info object from an already-fetched live quote
     * (the on-card CMP). This lets the info sheet show the current price +
     * day change instantly while the full Yahoo fetch completes in the
     * background. Returns null when no usable quote is available.
     */
    function buildCompanyInfoFromQuote(tradeOrCompany) {
        const sym = resolveTradeLiveSymbol(tradeOrCompany);
        if (!sym) return null;
        const companyName = (tradeOrCompany && typeof tradeOrCompany === 'object')
            ? (tradeOrCompany.company || '')
            : String(tradeOrCompany || '');
        const quote = getTradeLiveQuote(sym);
        if (!quote || !isValidMarketQuote(quote)) return null;
        return {
            symbol: normalizeMarketSymbol(sym),
            name: companyName || sym,
            shortName: '',
            longName: companyName || '',
            exchange: '',
            currency: 'INR',
            price: Number(quote.price),
            previousClose: quote.previousClose != null ? Number(quote.previousClose) : null,
            open: null,
            dayHigh: null,
            dayLow: null,
            change: quote.change != null ? Number(quote.change) : null,
            changePct: quote.changePct != null ? Number(quote.changePct) : null,
            fiftyTwoWeekHigh: null,
            fiftyTwoWeekLow: null,
            regularMarketVolume: null,
            regularMarketTime: null,
            marketCap: null,
            updatedAt: quote.updatedAt || new Date().toISOString(),
            yahooSymbol: '',
            _partial: true
        };
    }

    /**
     * Return the best available company info for instant display: a cached
     * entry (fresh or stale) or a partial built from the live quote. Returns
     * null only when nothing is available at all. The `freshOut` object, when
     * provided, is updated with `.value = true` when the cached entry is still
     * fresh (no background refetch needed).
     */
    function getTradeCompanyInfoCached(tradeOrCompany, freshOut) {
        const sym = resolveTradeLiveSymbol(tradeOrCompany);
        if (!sym) {
            if (freshOut) freshOut.value = false;
            return null;
        }
        const entry = companyInfoCache[sym];
        if (entry && entry.info) {
            if (freshOut) freshOut.value = (Date.now() - (entry.cachedAt || 0)) < COMPANY_INFO_FRESH_MS;
            return entry.info;
        }
        if (freshOut) freshOut.value = false;
        return buildCompanyInfoFromQuote(tradeOrCompany);
    }

    /**
     * Resolve a trade/company to a Yahoo symbol, fetch its chart meta, and
     * return a rich company-info object (or { error }) for the info sheet.
     * Reuses the same Jina-throttled path + .NS/.BO fallback as market quotes.
     */
    async function fetchTradeCompanyInfo(tradeOrCompany) {
        const sym = resolveTradeLiveSymbol(tradeOrCompany);
        if (!sym) return { error: 'Could not resolve a stock symbol for this company.' };
        const companyName = (tradeOrCompany && typeof tradeOrCompany === 'object')
            ? (tradeOrCompany.company || '')
            : String(tradeOrCompany || '');
        const remembered = yahooSuffixBySymbol[sym];
        const primary = remembered ? (sym + remembered) : yahooSymbolForNse(sym);

        async function attempt(yahooSym) {
            const data = await fetchYahooChartJson(yahooSym);
            const info = parseYahooCompanyInfo(data, sym, companyName);
            if (!info) throw new Error('No data');
            info.yahooSymbol = yahooSym;
            // The chart API does not return marketCap — scrape it from the
            // Yahoo quote page. Best-effort: failures just leave it null.
            if (info.marketCap == null) {
                try {
                    info.marketCap = await fetchYahooMarketCap(yahooSym);
                } catch (_) { /* ignore — market cap is optional */ }
            }
            return info;
        }

        try {
            const info = await attempt(primary);
            yahooSuffixBySymbol[sym] = primary.endsWith('.BO') ? '.BO' : '.NS';
            companyInfoCache[sym] = { info, cachedAt: Date.now() };
            return info;
        } catch (e) {
            if (isRateLimitError(e)) {
                return { error: 'Yahoo rate limit reached. Please try again in a moment.' };
            }
            if (!remembered && primary.endsWith('.NS')) {
                try {
                    const info = await attempt(sym + '.BO');
                    yahooSuffixBySymbol[sym] = '.BO';
                    companyInfoCache[sym] = { info, cachedAt: Date.now() };
                    return info;
                } catch (_) { /* fall through to generic error */ }
            }
            return { error: 'Could not fetch company details from Yahoo Finance.' };
        }
    }

    function isValidMarketQuote(quote) {
        return !!(quote && quote.symbol && quote.price != null && !isNaN(Number(quote.price)) && !quote.error);
    }

    function isFreshMarketQuote(quote, maxAgeMs) {
        if (!isValidMarketQuote(quote)) return false;
        const t = Date.parse(quote.updatedAt || '');
        if (isNaN(t)) return false;
        return (Date.now() - t) < (maxAgeMs == null ? QUOTE_FRESH_MS : maxAgeMs);
    }

    function isRateLimitError(errOrMsg) {
        return /HTTP 429|429|rate.?limit|Proxy fetch failed 429/i.test(String(
            (errOrMsg && errOrMsg.message) || errOrMsg || ''
        ));
    }

    // ---------- Viewport quote queue (fetch only on-screen symbols) ----------
    const QUOTE_QUEUE_CONCURRENCY = 1;
    const QUOTE_FRESH_MS = 5 * 60 * 1000; // treat quotes as fresh for 5 minutes
    const QUOTE_BACKOFF_BASE_MS = 5000;
    const QUOTE_BACKOFF_MAX_MS = 60000;
    const QUOTE_ROOT_MARGIN = '120px 0px';

    let quoteQueue = [];
    let quoteQueuedKeys = new Set();
    let quoteInFlight = 0;
    let quoteBackoffUntil = 0;
    let quoteBackoffMs = QUOTE_BACKOFF_BASE_MS;
    let quoteDrainTimer = null;
    let quoteVisibilityObserver = null;
    const visibleQuoteSymbols = new Set();
    const observedQuoteEls = new WeakSet();
    // Remember which Yahoo suffix worked ('.NS' or '.BO') so we do not double-fetch.
    const yahooSuffixBySymbol = {};

    function getQuoteSymbolFromEl(el) {
        if (!el || !el.dataset) return '';
        return normalizeMarketSymbol(
            el.dataset.quoteSymbol || el.dataset.liveSymbol || el.dataset.symbol || ''
        );
    }

    function resolveQuoteItem(sym) {
        const key = normalizeMarketSymbol(sym);
        if (!key) return null;
        const fromMarket = getMarketUniverse().find((u) => u.s === key);
        if (fromMarket) return fromMarket;
        const fromTrade = getVisibleTradeLiveSymbols().find((u) => u.s === key);
        if (fromTrade) return fromTrade;
        const meta = findStockMetaForSymbol(key);
        return { s: key, n: (meta && meta.n) || key };
    }

    function isQuoteRowOnActivePage(el) {
        if (!el) return false;
        const page = el.closest('[id^="page-"]');
        if (page && page.classList.contains('d-none')) return false;
        return true;
    }

    function getDomVisibleQuoteItems() {
        const items = [];
        const seen = new Set();
        const vh = window.innerHeight || document.documentElement.clientHeight || 0;
        const pad = 200;
        document.querySelectorAll('[data-quote-symbol], [data-live-symbol]').forEach((el) => {
            if (!isQuoteRowOnActivePage(el)) return;
            const sym = getQuoteSymbolFromEl(el);
            if (!sym || seen.has(sym)) return;
            const rect = el.getBoundingClientRect();
            if (rect.bottom < -pad || rect.top > vh + pad) return;
            seen.add(sym);
            const item = resolveQuoteItem(sym);
            if (item) items.push(item);
        });
        return items;
    }

    function getVisibleQuoteItems() {
        const mounted = new Set();
        document.querySelectorAll('[data-quote-symbol], [data-live-symbol]').forEach((el) => {
            if (!isQuoteRowOnActivePage(el)) return;
            const sym = getQuoteSymbolFromEl(el);
            if (sym) mounted.add(sym);
        });

        const items = [];
        const seen = new Set();
        visibleQuoteSymbols.forEach((sym) => {
            if (!sym || !mounted.has(sym) || seen.has(sym)) return;
            seen.add(sym);
            const item = resolveQuoteItem(sym);
            if (item) items.push(item);
        });
        if (items.length) return items;
        return getDomVisibleQuoteItems();
    }

    function paintAfterQuoteUpdate() {
        if (isMarketPageVisible()) {
            try { paintMarketQuotes(); } catch (_) { }
        }
        if (isTradeLivePageVisible() && tradeDisplayedDirty) {
            tradeDisplayedDirty = false;
            try { paintTradeLivePrices(); } catch (_) { }
        }
    }

    function paintMarketQuotes() {
        if (!isMarketPageVisible()) return;
        const formatChangePct = (window.MTFComponents && window.MTFComponents.formatChangePct) || null;
        const formatChangeAbs = (window.MTFComponents && window.MTFComponents.formatChangeAbs) || null;
        const changeToneClass = (tone) => {
            if (tone === 'up') return 'text-success';
            if (tone === 'down') return 'text-danger';
            return 'text-muted';
        };
        const formatPrice = (n) => {
            if (n == null || isNaN(Number(n))) return '—';
            return '₹' + Number(n).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };
        document.querySelectorAll('[data-quote-symbol]').forEach((el) => {
            const sym = getQuoteSymbolFromEl(el);
            const q = marketQuoteCache[sym];
            if (!q) return;
            const change = Number(q.change);
            const changePct = Number(q.changePct);
            const hasChange = !isNaN(change);
            const tone = !hasChange ? 'neutral' : change >= 0 ? 'up' : 'down';
            const toneCls = changeToneClass(tone);
            const priceEl = el.querySelector('[data-quote-price]');
            const changeEl = el.querySelector('[data-quote-change]');
            const changeAbsEl = el.querySelector('[data-quote-change-abs]');
            const changePctEl = el.querySelector('[data-quote-change-pct]');
            const prevEl = el.querySelector('[data-quote-prev]');
            if (priceEl) priceEl.textContent = formatPrice(q.price);
            const absText = hasChange && formatChangeAbs ? formatChangeAbs(change) : '—';
            const pctText = hasChange && formatChangePct ? formatChangePct(changePct) : '—';
            const combo = hasChange ? `${absText} (${pctText})` : '—';
            if (changeEl) {
                changeEl.textContent = combo;
                changeEl.classList.remove('text-success', 'text-danger', 'text-muted');
                changeEl.classList.add(toneCls);
            }
            if (changeAbsEl) {
                changeAbsEl.textContent = absText;
                changeAbsEl.classList.remove('text-success', 'text-danger', 'text-muted');
                changeAbsEl.classList.add(toneCls);
            }
            if (changePctEl) {
                changePctEl.textContent = pctText;
                changePctEl.classList.remove('text-success', 'text-danger', 'text-muted');
                changePctEl.classList.add(toneCls);
            }
            if (prevEl) {
                prevEl.textContent = formatPrice(q.previousClose);
            }
        });
    }

    function enqueueQuoteFetch(item, opts) {
        const force = !!(opts && opts.force);
        const sym = normalizeMarketSymbol(item && item.s);
        if (!sym) return Promise.resolve(null);
        const cached = marketQuoteCache[sym];
        if (!force && isFreshMarketQuote(cached)) return Promise.resolve(cached);
        if (quoteQueuedKeys.has(sym)) return Promise.resolve(cached || null);

        quoteQueuedKeys.add(sym);
        return new Promise((resolve) => {
            quoteQueue.push({
                item: Object.assign({}, item, { s: sym }),
                force,
                resolve
            });
            drainQuoteQueue();
        });
    }

    function drainQuoteQueue() {
        if (quoteDrainTimer) return;
        const now = Date.now();
        if (now < quoteBackoffUntil) {
            quoteDrainTimer = setTimeout(() => {
                quoteDrainTimer = null;
                drainQuoteQueue();
            }, quoteBackoffUntil - now);
            return;
        }

        while (quoteInFlight < QUOTE_QUEUE_CONCURRENCY && quoteQueue.length) {
            const job = quoteQueue.shift();
            quoteInFlight += 1;
            (async () => {
                try {
                    if (!job.force && isFreshMarketQuote(marketQuoteCache[job.item.s])) {
                        job.resolve(marketQuoteCache[job.item.s]);
                        return;
                    }
                    const quote = await fetchOneMarketQuote(job.item, { attempts: 1 });
                    cacheMarketQuote(quote);
                    if (isValidMarketQuote(quote)) {
                        quoteBackoffMs = QUOTE_BACKOFF_BASE_MS;
                    } else if (isRateLimitError(quote && quote.lastError)) {
                        quoteBackoffMs = Math.min(QUOTE_BACKOFF_MAX_MS, Math.max(QUOTE_BACKOFF_BASE_MS, quoteBackoffMs * 2));
                        quoteBackoffUntil = Date.now() + quoteBackoffMs;
                    }
                    marketUpdatedAt = new Date().toISOString();
                    schedulePersistMarketQuoteCache();
                    paintAfterQuoteUpdate();
                    job.resolve(quote);
                } catch (e) {
                    if (isRateLimitError(e)) {
                        quoteBackoffMs = Math.min(QUOTE_BACKOFF_MAX_MS, quoteBackoffMs * 2);
                        quoteBackoffUntil = Date.now() + quoteBackoffMs;
                    }
                    job.resolve(null);
                } finally {
                    quoteQueuedKeys.delete(job.item.s);
                    quoteInFlight -= 1;
                    drainQuoteQueue();
                }
            })();
        }
    }

    function ensureQuoteVisibilityObserver() {
        if (quoteVisibilityObserver) return quoteVisibilityObserver;
        quoteVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const sym = getQuoteSymbolFromEl(entry.target);
                if (!sym) return;
                if (entry.isIntersecting && isQuoteRowOnActivePage(entry.target)) {
                    visibleQuoteSymbols.add(sym);
                    const item = resolveQuoteItem(sym);
                    if (item) enqueueQuoteFetch(item, { force: false });
                } else {
                    visibleQuoteSymbols.delete(sym);
                }
            });
        }, { root: null, rootMargin: QUOTE_ROOT_MARGIN, threshold: 0.01 });
        return quoteVisibilityObserver;
    }

    function observeQuoteRows() {
        if (typeof IntersectionObserver === 'undefined') {
            getDomVisibleQuoteItems().forEach((item) => enqueueQuoteFetch(item, { force: false }));
            return;
        }
        const obs = ensureQuoteVisibilityObserver();
        document.querySelectorAll('[data-quote-symbol], [data-live-symbol]').forEach((el) => {
            if (observedQuoteEls.has(el)) return;
            observedQuoteEls.add(el);
            obs.observe(el);
        });
    }

    async function fetchOneMarketQuote(item, opts) {
        const sym = normalizeMarketSymbol(item.s);
        noteNetworkCall('quote', sym);
        const remembered = yahooSuffixBySymbol[sym];
        // Prefer the exchange that worked before. Default to NSE only —
        // blindly also hitting .BO doubled Jina calls and caused 429s.
        const primary = remembered ? (sym + remembered) : yahooSymbolForNse(sym);

        async function tryOne(yahooSym) {
            const data = await fetchYahooChartJson(yahooSym);
            const quote = parseYahooChartQuote(data, sym, item.n);
            if (!quote || quote.price == null || isNaN(Number(quote.price))) {
                throw new Error('No quote data');
            }
            yahooSuffixBySymbol[sym] = yahooSym.endsWith('.BO') ? '.BO' : '.NS';
            quote.pinned = !!item.pinned;
            quote.extra = !!item.extra;
            quote.removable = !!item.removable;
            quote.error = false;
            return quote;
        }

        function failQuote(err) {
            return {
                symbol: sym,
                name: item.n || sym,
                price: null,
                previousClose: null,
                change: null,
                changePct: null,
                pinned: !!item.pinned,
                extra: !!item.extra,
                removable: !!item.removable,
                error: true,
                updatedAt: new Date().toISOString(),
                lastError: err ? String(err.message || err) : ''
            };
        }

        try {
            return await tryOne(primary);
        } catch (e) {
            if (isRateLimitError(e)) return failQuote(e);
            // BSE fallback only when NSE had no data (not on 429), and only once.
            if (!remembered && primary.endsWith('.NS')) {
                try {
                    return await tryOne(sym + '.BO');
                } catch (e2) {
                    return failQuote(e2);
                }
            }
            return failQuote(e);
        }
    }

    function cacheMarketQuote(quote) {
        if (!quote || !quote.symbol) return false;
        const key = normalizeMarketSymbol(quote.symbol);
        const existing = marketQuoteCache[key];
        // Never replace a good cached price with a failed/empty result.
        if (!isValidMarketQuote(quote) && isValidMarketQuote(existing)) return false;
        marketQuoteCache[key] = { ...quote, fromLocalCache: false };
        return adoptDisplayedTradeQuote(quote);
    }

    function getMarketQuotes() {
        hydrateMarketQuoteCacheFromLocal();
        const universe = getMarketUniverse();
        return universe.map((item) => {
            const cached = marketQuoteCache[item.s];
            if (cached) {
                return {
                    ...cached,
                    name: cached.name || item.n,
                    pinned: !!item.pinned,
                    extra: !!item.extra,
                    removable: !!item.removable
                };
            }
            return {
                symbol: item.s,
                name: item.n,
                price: null,
                change: null,
                changePct: null,
                pinned: !!item.pinned,
                extra: !!item.extra,
                removable: !!item.removable
            };
        });
    }

    function setMarketHeaderRefreshBusy(busy) {
        const btn = document.getElementById('appHeaderRefreshBtn');
        if (!btn) return;
        btn.disabled = !!busy;
        btn.setAttribute('aria-busy', busy ? 'true' : 'false');
        const icon = btn.querySelector('i');
        if (icon) icon.classList.toggle('fa-spin', !!busy);
    }

    async function refreshMarketQuotes(opts) {
        const silent = !!(opts && opts.silent);
        const notify = !!(opts && opts.notify);
        const force = !silent || !!(opts && opts.force);
        if (marketLoading) {
            if (notify) showToast('Refresh already in progress…', 'info');
            return;
        }
        marketLoading = true;
        marketError = '';
        setMarketHeaderRefreshBusy(true);
        if (notify) showToast('Request sent…', 'info');
        hydrateMarketQuoteCacheFromLocal();
        // Keep the list mounted — never swap to a "Refreshing…" label.
        // First paint uses cached prices; pool updates rows one-by-one.
        if (!silent) {
            try { renderMarketPage(); } catch (_) { }
            observeQuoteRows();
        }
        let refreshedOk = false;
        try {
            loadStockCatalogFromInternet();
            // Full watchlist pool — fetch one-by-one (QUOTE_QUEUE_CONCURRENCY = 1).
            const items = getMarketWatchlist();
            if (!items.length) {
                marketUpdatedAt = new Date().toISOString();
                marketError = '';
                refreshedOk = true;
                return;
            }
            await Promise.all(items.map((item) => enqueueQuoteFetch(item, { force })));
            marketUpdatedAt = new Date().toISOString();
            const failed = items.filter((u) => {
                const q = marketQuoteCache[u.s];
                return !q || q.price == null || q.error;
            }).length;
            if (failed === items.length && items.length) {
                marketError = 'Could not reach market data. Check internet and try again.';
                refreshedOk = false;
            } else {
                marketError = '';
                refreshedOk = true;
            }
            if (refreshedOk) {
                try { persistMarketQuoteCacheLocal(); } catch (e) {
                    MTFLogger.warn('Could not save watchlist quotes to localStorage', e);
                }
            }
        } catch (e) {
            marketError = 'Could not reach market data. Check internet and try again.';
            refreshedOk = false;
            MTFLogger.warn('Market quote refresh failed', e);
        } finally {
            marketLoading = false;
            setMarketHeaderRefreshBusy(false);
            try { paintAfterQuoteUpdate(); } catch (_) { }
            if (!silent) {
                observeQuoteRows();
            }
            if (notify) {
                if (refreshedOk) showToast('Request successful', 'success');
                else showToast(marketError || 'Could not refresh data.', 'danger');
            }
        }
    }

    function onMarketRefreshClick() {
        refreshMarketQuotes({ force: true, notify: true });
    }

    function onAppHeaderRefreshClick() {
        if (isTradeLivePageVisible()) {
            refreshTradeLivePrices({ force: true, manual: true });
            return;
        }
        const goldPage = document.getElementById('page-gold');
        if (goldPage && !goldPage.classList.contains('d-none')) {
            if (typeof window.refreshGoldPageData === 'function') {
                window.refreshGoldPageData(true);
            }
            return;
        }
        onMarketRefreshClick();
    }

    function stopMarketRefresh() {
        if (marketRefreshTimer) {
            clearInterval(marketRefreshTimer);
            marketRefreshTimer = null;
        }
    }

    function startMarketRefresh() {
        stopMarketRefresh();
        hydrateMarketQuoteCacheFromLocal();
        syncMarketSubTabUI();
        try { renderMarketPage(); } catch (_) { }
        observeQuoteRows();
        // Pool-fetch whole watchlist on open; then every 5 minutes in place.
        refreshMarketQuotes({ force: true });
        marketRefreshTimer = setInterval(() => {
            const page = document.getElementById('page-market');
            if (!page || page.classList.contains('d-none')) {
                stopMarketRefresh();
                return;
            }
            refreshMarketQuotes({ silent: true, force: true });
        }, MARKET_REFRESH_MS);
    }

    let tradeLiveRefreshTimer = null;
    let tradeLiveRetryTimer = null;
    let tradeLiveRefreshing = false;
    let tradeLiveRetryPending = false;
    let tradeLiveRefreshSeq = 0;
    const DISPLAYED_CMP_KEY = 'mtf_displayed_cmp';
    let tradeDisplayedQuotes = {};
    let tradeDisplayedDirty = false;

    function loadDisplayedTradeQuotes() {
        try {
            const raw = JSON.parse(localStorage.getItem(DISPLAYED_CMP_KEY));
            tradeDisplayedQuotes = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch (_) {
            tradeDisplayedQuotes = {};
        }
    }

    function saveDisplayedTradeQuotes() {
        try {
            localStorage.setItem(DISPLAYED_CMP_KEY, JSON.stringify(tradeDisplayedQuotes));
        } catch (_) { /* ignore quota / private mode */ }
    }

    function quoteDisplayFingerprint(quote) {
        if (!isValidMarketQuote(quote)) return '';
        const price = Number(quote.price).toFixed(2);
        const change = quote.change == null || isNaN(Number(quote.change))
            ? ''
            : Number(quote.change).toFixed(2);
        const changePct = quote.changePct == null || isNaN(Number(quote.changePct))
            ? ''
            : Number(quote.changePct).toFixed(2);
        return `${price}|${change}|${changePct}`;
    }

    /** Keep a stable on-screen CMP per symbol; only replace when the value actually changes. */
    function adoptDisplayedTradeQuote(quote) {
        if (!isValidMarketQuote(quote)) return false;
        const key = normalizeMarketSymbol(quote.symbol);
        if (!key) return false;
        const next = {
            symbol: key,
            name: quote.name || key,
            price: Number(quote.price),
            change: quote.change == null || isNaN(Number(quote.change)) ? null : Number(quote.change),
            changePct: quote.changePct == null || isNaN(Number(quote.changePct)) ? null : Number(quote.changePct),
            previousClose: quote.previousClose == null || isNaN(Number(quote.previousClose))
                ? null
                : Number(quote.previousClose),
            updatedAt: quote.updatedAt || new Date().toISOString()
        };
        const prev = tradeDisplayedQuotes[key];
        if (prev && quoteDisplayFingerprint(prev) === quoteDisplayFingerprint(next)) {
            return false;
        }
        tradeDisplayedQuotes[key] = next;
        tradeDisplayedDirty = true;
        saveDisplayedTradeQuotes();
        return true;
    }

    function syncDisplayedQuotesFromMarket(symbols) {
        let changed = false;
        const keys = Array.isArray(symbols) && symbols.length
            ? symbols.map((s) => normalizeMarketSymbol(typeof s === 'string' ? s : s.s)).filter(Boolean)
            : Object.keys(marketQuoteCache);
        keys.forEach((key) => {
            if (adoptDisplayedTradeQuote(marketQuoteCache[key])) changed = true;
        });
        return changed;
    }

    loadDisplayedTradeQuotes();

    function resolveTradeLiveSymbol(tradeOrCompany) {
        if (tradeOrCompany && typeof tradeOrCompany === 'object') {
            const fromTx = normalizeMarketSymbol(tradeOrCompany.symbol || '');
            if (fromTx) return fromTx;
            const mapped = lookupTradeFeedMapping(tradeOrCompany.company || '');
            if (mapped && mapped.symbol) return mapped.symbol;
            return resolveTradeLiveSymbol(tradeOrCompany.company || '');
        }
        const company = tradeOrCompany || '';
        const mapped = lookupTradeFeedMapping(company);
        if (mapped && mapped.symbol) return mapped.symbol;
        const meta = findStockMetaForCompany(company);
        if (meta && meta.s) return normalizeMarketSymbol(meta.s);
        const raw = String(company || '').trim().toUpperCase();
        if (/^[A-Z0-9&.-]{1,20}$/.test(raw)) return normalizeMarketSymbol(raw);
        return '';
    }

    /** Prefer the last committed on-screen CMP so the card stays stable between fetches. */
    function getTradeLiveQuote(symbol) {
        const key = normalizeMarketSymbol(symbol);
        if (!key) return null;
        return tradeDisplayedQuotes[key] || marketQuoteCache[key] || null;
    }

    function setTradeLiveStatus(show) {
        document.querySelectorAll('[data-live-status]').forEach((slot) => {
            slot.classList.toggle('is-hidden', !show);
        });
    }

    function isTradeLiveRefreshing() {
        if (!(tradeLiveRefreshing || tradeLiveRetryPending)) return false;
        // Only show loading when we have no local CMP to display yet.
        try {
            const items = getVisibleQuoteItems();
            if (!items.length) return true;
            return items.some((item) => !isValidMarketQuote(tradeDisplayedQuotes[item.s]));
        } catch (_) {
            return true;
        }
    }

    function formatTradeLivePriceText(quote) {
        if (!isValidMarketQuote(quote)) return '—';
        return '₹' + Number(quote.price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function estimateLiveSellReturn(tx, livePrice) {
        const price = Number(livePrice);
        if (!tx || !(price > 0)) return null;
        if (!tx.buyDate || !tx.quantity || !tx.buyPrice) return null;
        try {
            const sellDate = tx.sellDate || localDateStr(new Date());
            const calc = calculateTrade({
                ...tx,
                sellPrice: price,
                sellDate,
                status: 'closed'
            });
            return Number(calc.netProfit);
        } catch (_) {
            return null;
        }
    }

    function formatTradeLiveReturnText(amount) {
        if (amount == null || isNaN(Number(amount))) return '—';
        const n = Number(amount);
        const abs = Math.abs(n).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        if (n > 0) return '+₹' + abs;
        if (n < 0) return '−₹' + abs;
        return '₹' + abs;
    }

    function paintTradeLivePrices() {
        const toneText = (tone) => {
            if (tone === 'up') return 'text-success';
            if (tone === 'down') return 'text-danger';
            return 'text-body-secondary';
        };
        const setToneClasses = (el, tone) => {
            if (!el) return;
            el.classList.remove('text-success', 'text-danger', 'text-body-secondary', 'text-progress-mid');
            el.classList.add(toneText(tone));
        };
        const progressBand = (pct) => {
            if (pct == null || isNaN(Number(pct))) return 'neutral';
            const n = Number(pct);
            if (n < 0) return 'neg';
            if (n > 60) return 'high';
            if (n >= 30) return 'mid';
            return 'low';
        };
        const progressBandTextClass = (band) => {
            if (band === 'high') return 'text-success';
            if (band === 'mid') return 'text-progress-mid';
            if (band === 'neg' || band === 'low') return 'text-danger';
            return 'text-body-secondary';
        };
        const progressBandBarClass = (band) => {
            if (band === 'high') return 'bg-success';
            if (band === 'mid') return 'bg-progress-mid';
            if (band === 'neg' || band === 'low') return 'bg-danger';
            return 'bg-secondary';
        };
        const clampProgressFill = (pct) => {
            if (pct == null || isNaN(pct)) return 0;
            const n = Number(pct);
            if (n < 0) return Math.min(100, Math.abs(n));
            return Math.max(0, Math.min(100, n));
        };
        const spinnerHtml = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
        const formatDayChange = (quote, hasPrice) => {
            if (!hasPrice) return '—';
            const change = Number(quote.change);
            const changePct = Number(quote.changePct);
            if (isNaN(change)) return '—';
            const arrow = change >= 0 ? '▲' : '▼';
            const pctText = !isNaN(changePct)
                ? `${arrow}${changePct.toFixed(2)}%`
                : '';
            const abs = Math.abs(change).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const absText = `${change >= 0 ? '+₹' : '-₹'}${abs}`;
            return pctText ? `${pctText} (${absText})` : absText;
        };
        const targetProgressPct = (livePrice, targetPrice, buyPrice) => {
            const live = Number(livePrice);
            const target = Number(targetPrice);
            const buy = Number(buyPrice);
            if (!(live > 0) || !(target > 0) || !(buy > 0)) return null;
            // (Current − Buy) / (Target − Buy) × 100
            const span = target - buy;
            if (Math.abs(span) < 1e-9) return live >= target ? 100 : 0;
            return ((live - buy) / span) * 100;
        };

        document.querySelectorAll('[data-live-symbol]').forEach((el) => {
            const symbol = el.dataset.liveSymbol || '';
            const tradeId = el.dataset.tradeId || '';
            const quote = getTradeLiveQuote(symbol);
            const priceBtn = el.querySelector('[data-live-field="price"]');
            const changeEl = el.querySelector('[data-live-change]');
            const valueEl = priceBtn && priceBtn.querySelector('[data-live-value]');
            const loadingSlot = el.querySelector('[data-live-loading]');
            const statusSlot = el.querySelector('[data-live-status]');
            const hasPrice = isValidMarketQuote(quote);
            const livePrice = hasPrice ? Number(quote.price) : null;
            const change = hasPrice ? Number(quote.change) : NaN;
            const tone = !hasPrice || isNaN(change)
                ? 'neutral'
                : change >= 0 ? 'up' : 'down';
            const targetPrice = Number(el.dataset.targetPrice);
            const buyPrice = Number(el.dataset.buyPrice);
            const tx = tradeId ? getTransaction(tradeId) : null;
            const variant = el.dataset.tradeVariant || '';
            const liveReturn = hasPrice && tx ? estimateLiveSellReturn(tx, livePrice) : null;
            // Track highest price seen during open trade
            const status = el.dataset.tradeStatus || 'open';
            const targetReachedBeforeClose = el.dataset.targetReachedBeforeClose === 'true';
            if (hasPrice && tx && status === 'open') {
                const currentHighest = Number(tx.highestPrice) || 0;
                if (livePrice > currentHighest) {
                    tx.highestPrice = livePrice;
                    updateTransaction(tx.id, { highestPrice: livePrice });
                }
            }

            // Spinner only when this symbol has no local CMP yet.
            const showSpinner = !hasPrice && !!(tradeLiveRefreshing || tradeLiveRetryPending);
            const priceText = formatTradeLivePriceText(quote);
            const changeText = formatDayChange(quote, hasPrice);

            setToneClasses(priceBtn, tone);
            setToneClasses(changeEl, tone);
            if (loadingSlot) loadingSlot.innerHTML = showSpinner ? spinnerHtml : '';
            if (statusSlot) {
                const updating = !!(tradeLiveRefreshing || tradeLiveRetryPending);
                statusSlot.classList.toggle('is-hidden', !updating);
            }
            if (valueEl && valueEl.textContent !== priceText) valueEl.textContent = priceText;
            if (changeEl && changeEl.textContent !== changeText) changeEl.textContent = changeText;

            // Update Target Status
            const targetStatusHost = el.querySelector('.trade-position-cell--target-status');
            if (targetStatusHost) {
                const baseRef = targetStatusHost.getAttribute('data-ref');
                if (status === 'open' && hasPrice && targetPrice > 0) {
                    const targetStatus = global.MTFComponents.TargetStatus(livePrice, targetPrice, status, targetReachedBeforeClose, baseRef);
 
                    const wasReached = targetStatusHost.querySelector('[data-target-status][data-reached="true"]') !== null;
                    const isReached = targetStatus.isTargetReached;
 
                    if (wasReached !== isReached) {
                        targetStatusHost.style.transition = 'opacity 200ms ease, transform 200ms ease';
                        targetStatusHost.style.opacity = '0';
                        targetStatusHost.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            targetStatusHost.innerHTML = targetStatus.html;
                            targetStatusHost.style.opacity = '1';
                            targetStatusHost.style.transform = 'scale(1)';
                        }, 200);
                    } else {
                        const leftEl = targetStatusHost.querySelector('[data-target-left]');
                        const pctEl = targetStatusHost.querySelector('[data-target-pct-left]');
                        const diffPctEl = targetStatusHost.querySelector('[data-target-pct-diff]');
 
                        if (isReached) {
                            if (diffPctEl) {
                                const diffPct = ((livePrice - targetPrice) / targetPrice) * 100;
                                const newDiffText = `+${diffPct.toFixed(2)}%`;
                                if (diffPctEl.textContent !== newDiffText) diffPctEl.textContent = newDiffText;
                            } else {
                                targetStatusHost.innerHTML = targetStatus.html;
                            }
                        } else {
                            if (leftEl) {
                                const newLeftText = `₹${targetStatus.remainingAmount.toFixed(2)} Left`;
                                if (leftEl.textContent !== newLeftText) leftEl.textContent = newLeftText;
                            }
                            if (pctEl) {
                                const newPctText = `${targetStatus.remainingPercentage.toFixed(2)}% to target`;
                                if (pctEl.textContent !== newPctText) pctEl.textContent = newPctText;
                            }
                            if (!leftEl && !pctEl) {
                                targetStatusHost.innerHTML = targetStatus.html;
                            }
                        }
                    }
                } else if (status === 'closed') {
                    const targetStatus = global.MTFComponents.TargetStatus(null, targetPrice, status, targetReachedBeforeClose, baseRef);
                    if (targetStatusHost.innerHTML !== targetStatus.html) {
                        targetStatusHost.innerHTML = targetStatus.html;
                    }
                } else if (!hasPrice || !(targetPrice > 0)) {
                    const targetStatus = global.MTFComponents.TargetStatus(null, targetPrice, status, targetReachedBeforeClose, baseRef);
                    if (targetStatusHost.innerHTML !== targetStatus.html) {
                        targetStatusHost.innerHTML = targetStatus.html;
                    }
                }
            }

            if (variant !== 'past' && liveReturn != null && tradeId) {
                const card = el.closest('[data-trade-card]');
                const pnlHost = card && card.querySelector('[data-trade-card-pnl]');
                if (pnlHost && global.MTFComponents && global.MTFComponents.renderAmount) {
                    const nextPnl = global.MTFComponents.renderAmount(liveReturn, {
                        size: 'sm',
                        compact: true,
                        showSign: true,
                        align: 'right',
                        pill: false,
                        fs: 'fs-6',
                        weight: 'fw-bold',
                        className: 'pf-pnl-val-wrapper'
                    });
                    const pnlAmountEl = pnlHost.querySelector('.d-inline-flex.flex-column');
                    if (pnlAmountEl && pnlAmountEl.outerHTML !== nextPnl) {
                        pnlAmountEl.outerHTML = nextPnl;
                    }
                    // Update pnl percentage badge
                    const investment = tx ? (Number(tx.totalInvestment) || 0) : 0;
                    const pctBadge = pnlHost.querySelector('[data-trade-card-pnl-pct]');
                    if (investment > 0) {
                        const pct = (Number(liveReturn) / investment) * 100;
                        const sign = pct >= 0 ? '+' : '';
                        const tone = pct >= 0 ? 'positive' : 'negative';
                        const nextText = `${sign}${pct.toFixed(2)}%`;
                        if (pctBadge) {
                            if (pctBadge.textContent !== nextText) pctBadge.textContent = nextText;
                            pctBadge.className = `trade-position-pnl-pct trade-position-pnl-pct--${tone}`;
                        } else {
                            const badgeHtml = `<span class="trade-position-pnl-pct trade-position-pnl-pct--${tone}" data-trade-card-pnl-pct>${nextText}</span>`;
                            pnlHost.insertAdjacentHTML('beforeend', badgeHtml);
                        }
                    }
                }
            }
        });
    }

    function isTradesPageVisible() {
        const page = document.getElementById('page-trades');
        return !!(page && !page.classList.contains('d-none'));
    }

    function isPastPageVisible() {
        if (isTradesPageVisible() && tradesViewMode === 'past') return true;
        const page = document.getElementById('page-past');
        return !!(page && !page.classList.contains('d-none'));
    }

    function isMarketPageVisible() {
        const page = document.getElementById('page-market');
        return !!(page && !page.classList.contains('d-none'));
    }

    function isTradeLivePageVisible() {
        return isTradesPageVisible() || isPastPageVisible();
    }

    function ensureLiveFeedsForVisiblePage() {
        if (isTradeLivePageVisible()) {
            startTradeLiveRefresh();
        } else if (isMarketPageVisible()) {
            startMarketRefresh();
        }
    }

    function getVisibleTradeLiveSymbols() {
        const seen = new Set();
        const out = [];
        const pushTrade = (t) => {
            const key = resolveTradeLiveSymbol(t);
            if (!key || seen.has(key)) return;
            seen.add(key);
            const meta = findStockMetaForSymbol(key) || findStockMetaForCompany(t.company || '');
            out.push({ s: key, n: (meta && meta.n) || t.company || key });
        };

        if (isPastPageVisible()) {
            (getPastFiltered() || []).forEach(pushTrade);
            return out;
        }

        const txs = getOpenTransactions();
        const isPlan = tradesViewMode === 'plan';
        txs.forEach((t) => {
            if (isPlan ? !isPlannedTrade(t) : !isActiveOpenTrade(t)) return;
            pushTrade(t);
        });
        return out;
    }

    function getMissingTradeLiveSymbols(universe) {
        return (universe || []).filter((item) => !isValidMarketQuote(marketQuoteCache[item.s]));
    }

    async function refreshTradeLivePrices(opts) {
        const force = !!(opts && opts.force);
        if (!isTradeLivePageVisible()) return;
        if (tradeLiveRefreshing) return;

        observeQuoteRows();
        const items = getVisibleQuoteItems();
        if (!items.length) {
            tradeLiveRefreshing = false;
            tradeLiveRetryPending = false;
            return;
        }

        const seq = ++tradeLiveRefreshSeq;
        tradeLiveRefreshing = true;
        tradeDisplayedDirty = false;
        // Paint only when some symbols still have no local CMP (first load).
        if (isTradeLiveRefreshing()) paintTradeLivePrices();

        try {
            loadStockCatalogFromInternet();
            if (seq !== tradeLiveRefreshSeq) return;
            const pending = force
                ? items.slice()
                : items.filter((item) => !isFreshMarketQuote(marketQuoteCache[item.s]));
            if (pending.length) {
                tradeLiveRetryPending = true;
                await Promise.all(pending.map((item) => enqueueQuoteFetch(item, { force })));
            } else {
                // Fresh network cache may still need to seed the displayed store.
                syncDisplayedQuotesFromMarket(items);
            }
        } catch (e) {
            MTFLogger.warn('Trade live price refresh failed', e);
        } finally {
            if (seq === tradeLiveRefreshSeq) {
                tradeLiveRefreshing = false;
                const stillMissing = items.filter((item) => !isValidMarketQuote(marketQuoteCache[item.s]));
                tradeLiveRetryPending = stillMissing.length > 0;
                syncDisplayedQuotesFromMarket(items);
                // Update the screen only when a committed CMP value changed (or first paint needed).
                if (tradeDisplayedDirty || stillMissing.some((item) => !isValidMarketQuote(tradeDisplayedQuotes[item.s]))) {
                    tradeDisplayedDirty = false;
                    paintTradeLivePrices();
                } else {
                    // Clear any leftover spinner without rewriting prices.
                    document.querySelectorAll('[data-live-loading]').forEach((slot) => {
                        if (slot.innerHTML) slot.innerHTML = '';
                    });
                }
                setTradeLiveStatus(true);
                setTimeout(() => setTradeLiveStatus(false), 2000);
                observeQuoteRows();
                if (stillMissing.length) scheduleTradeLiveRetry();
                else clearTradeLiveRetry();
            }
        }
    }

    function clearTradeLiveRetry() {
        if (tradeLiveRetryTimer) {
            clearTimeout(tradeLiveRetryTimer);
            tradeLiveRetryTimer = null;
        }
        tradeLiveRetryPending = false;
    }

    function scheduleTradeLiveRetry() {
        clearTradeLiveRetry();
        tradeLiveRetryPending = true;
        if (isTradeLiveRefreshing()) paintTradeLivePrices();
        tradeLiveRetryTimer = setTimeout(() => {
            tradeLiveRetryTimer = null;
            if (!isTradeLivePageVisible()) {
                tradeLiveRetryPending = false;
                return;
            }
            refreshTradeLivePrices({ silent: true, force: false });
        }, 15000);
    }

    function stopTradeLiveRefresh() {
        tradeLiveRefreshSeq += 1;
        if (tradeLiveRefreshTimer) {
            clearInterval(tradeLiveRefreshTimer);
            tradeLiveRefreshTimer = null;
        }
        clearTradeLiveRetry();
        tradeLiveRefreshing = false;
    }

    function startTradeLiveRefresh() {
        stopTradeLiveRefresh();
        if (!isTradeLivePageVisible()) return;
        observeQuoteRows();
        refreshTradeLivePrices({ force: false });
        tradeLiveRefreshTimer = setInterval(() => {
            if (!isTradeLivePageVisible()) {
                stopTradeLiveRefresh();
                return;
            }
            observeQuoteRows();
            refreshTradeLivePrices({ silent: true, force: false });
        }, MARKET_REFRESH_MS);
    }

    function refreshTradeLivePricesNow(symbol) {
        if (!isTradeLivePageVisible()) return;
        // Cancel any in-flight refresh so a manual tap always restarts.
        tradeLiveRefreshSeq += 1;
        tradeLiveRefreshing = false;
        clearTradeLiveRetry();
        observeQuoteRows();

        const key = normalizeMarketSymbol(symbol || '');
        if (key) {
            const item = resolveQuoteItem(key);
            if (item) {
                const seq = ++tradeLiveRefreshSeq;
                tradeLiveRefreshing = true;
                tradeDisplayedDirty = false;
                // Spinner only if this symbol has no local CMP yet.
                if (!isValidMarketQuote(tradeDisplayedQuotes[key])) paintTradeLivePrices();
                // Drop any stale queue lock so a manual tap always re-fetches.
                quoteQueuedKeys.delete(key);
                enqueueQuoteFetch(item, { force: true }).finally(() => {
                    if (seq !== tradeLiveRefreshSeq) return;
                    tradeLiveRefreshing = false;
                    tradeLiveRetryPending = !isValidMarketQuote(marketQuoteCache[key]);
                    syncDisplayedQuotesFromMarket([key]);
                    if (tradeDisplayedDirty || !isValidMarketQuote(tradeDisplayedQuotes[key])) {
                        tradeDisplayedDirty = false;
                        paintTradeLivePrices();
                    } else {
                        document.querySelectorAll('[data-live-loading]').forEach((slot) => {
                            if (slot.innerHTML) slot.innerHTML = '';
                        });
                    }
                    if (tradeLiveRetryPending) scheduleTradeLiveRetry();
                });
                return;
            }
        }
        refreshTradeLivePrices({ force: true });
    }

    function isWatchlistSearchOpen() {
        return searchContext === 'watchlist';
    }

    function getMarketSearchInput() {
        return document.getElementById('searchPageInput');
    }

    function getMarketAcListEl() {
        return document.getElementById('searchPageList');
    }

    function hideMarketAcList() {
        const list = getMarketAcListEl();
        if (list) {
            list.innerHTML = isWatchlistSearchOpen()
                ? `<div class="px-3 py-4 text-center text-muted small">Type a company name or symbol to add.</div>`
                : '';
        }
        marketAcResults = [];
        marketAcActiveIdx = -1;
    }

    function showMarketAcLoading(msg) {
        const list = getMarketAcListEl();
        if (!list) return;
        list.innerHTML = `<div class="px-3 py-3 small text-muted"><i class="fas fa-spinner fa-spin me-1"></i>${escapeHtml(msg || 'Searching…')}</div>`;
    }

    function renderMarketAcList(items) {
        const list = getMarketAcListEl();
        const input = getMarketSearchInput();
        if (!list || !input) return;
        marketAcResults = items || [];
        marketAcActiveIdx = marketAcResults.length ? 0 : -1;

        if (!marketAcResults.length) {
            const q = (input.value || '').trim();
            list.innerHTML = q.length
                ? `<div class="px-3 py-3 small text-muted">No match for “${escapeHtml(q)}”.</div>`
                : `<div class="px-3 py-4 text-center text-muted small">Type a company name or symbol to add.</div>`;
            return;
        }

        list.innerHTML = `<div class="list-group list-group-flush">${marketAcResults.map((it, idx) => {
            const meta = it.sector
                ? `${escapeHtml(it.sector)}${it.industry ? ' · ' + escapeHtml(it.industry) : ''} · ${escapeHtml(it.e || 'NSE')}`
                : escapeHtml(it.e || 'NSE');
            const activeCls = idx === marketAcActiveIdx ? ' active' : '';
            const name = it.n || '';
            return `
                    <button type="button" class="list-group-item list-group-item-action py-3${activeCls}" role="option" data-idx="${idx}" onclick="selectMarketSymbol(${idx})">
                        <div class="fw-semibold text-truncate">${escapeHtml(it.s)}</div>
                        <div class="small text-body-secondary text-truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
                        <div class="small text-muted text-truncate">${meta}</div>
                    </button>`;
        }).join('')}</div>`;
    }

    async function runMarketStockSearch(query) {
        const q = (query || '').trim();
        const seq = ++marketSearchSeq;
        if (q.length < 1) {
            hideMarketAcList();
            return;
        }

        showMarketAcLoading(stockCatalogLoaded ? 'Searching…' : 'Fetching live market data…');
        loadStockCatalogFromInternet();

        let results = stockCatalogLoaded ? searchStockSymbolsLocal(q, 12) : [];
        if (results.length && seq === marketSearchSeq) renderMarketAcList(results);

        if (q.length >= 2) {
            try {
                const remote = await fetchYahooStockSearch(q);
                if (seq !== marketSearchSeq) return;
                if (stockCatalogLoaded) {
                    results = mergeStockResults(searchStockSymbolsLocal(q, 12), remote);
                } else {
                    results = remote.length ? remote : results;
                }
                renderMarketAcList(results);
            } catch (_) {
                if (seq !== marketSearchSeq) return;
                if (stockCatalogLoaded) {
                    renderMarketAcList(searchStockSymbolsLocal(q, 12));
                } else if (!results.length) {
                    const list = getMarketAcListEl();
                    if (list) {
                        list.innerHTML = `<div class="px-3 py-3 small text-muted">Could not reach market data. Check internet and try again.</div>`;
                    }
                }
            }
        } else if (stockCatalogLoaded) {
            if (seq === marketSearchSeq) renderMarketAcList(searchStockSymbolsLocal(q, 12));
        }
    }

    function onMarketSearchInput() {
        const input = getMarketSearchInput();
        const q = (input && input.value || '').trim();
        toggleClearBtn('searchPageClear', !!q);

        clearTimeout(marketSearchTimer);
        if (q.length < 1) {
            hideMarketAcList();
            return;
        }
        marketSearchTimer = setTimeout(() => runMarketStockSearch(q), 300);
    }

    function onMarketSearchFocus() {
        const input = getMarketSearchInput();
        const q = (input && input.value || '').trim();
        if (q.length >= 1) runMarketStockSearch(q);
    }

    function onMarketSearchBlur() {
        /* Full-screen watchlist search keeps results visible. */
    }

    function onMarketSearchKeydown(e) {
        if (!marketAcResults.length) {
            if (e.key === 'Escape') closeSearchPage();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            marketAcActiveIdx = Math.min(marketAcActiveIdx + 1, marketAcResults.length - 1);
            renderMarketAcList(marketAcResults);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            marketAcActiveIdx = Math.max(marketAcActiveIdx - 1, 0);
            renderMarketAcList(marketAcResults);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (marketAcActiveIdx >= 0) selectMarketSymbol(marketAcActiveIdx);
        } else if (e.key === 'Escape') {
            closeSearchPage();
        }
    }

    function selectMarketSymbol(idx) {
        const item = marketAcResults[idx];
        if (!item) return;
        if (marketAcBlurTimer) clearTimeout(marketAcBlurTimer);

        if (searchContext === 'tx-company') {
            closeSearchPage();
            selectStockSymbolFromMeta(item);
            return;
        }
        if (searchContext === 'calc-company') {
            closeSearchPage();
            selectCalcStockFromMeta(item);
            return;
        }

        // UX: Optimistic State Management - Show spinner on the clicked button
        const list = getMarketAcListEl();
        let btn = null;
        if (list) {
            btn = list.querySelector(`[data-idx="${idx}"]`);
            if (btn) {
                // Disable button to prevent overlapping requests
                btn.disabled = true;
                const originalHtml = btn.innerHTML;
                btn.innerHTML = `<div class="d-flex align-items-center justify-content-between w-100">
                                    <div class="min-w-0 flex-grow-1">${originalHtml}</div>
                                    <div class="spinner-border spinner-border-sm text-primary ms-2 flex-shrink-0" role="status">
                                        <span class="visually-hidden">Adding...</span>
                                    </div>
                                 </div>`;
                btn.setAttribute('aria-pressed', 'true');
            }
        }

        addToMarketWatchlist(item).then((res) => {
            if (!res) {
                // Revert optimistic UI on soft failure
                if (btn) {
                    btn.disabled = false;
                    btn.setAttribute('aria-pressed', 'false');
                    // We don't restore original HTML here because the user usually stays on page to retry,
                    // but since toast shows error, it's fine. We'll just hide spinner.
                    const spinner = btn.querySelector('.spinner-border');
                    if (spinner) spinner.remove();
                }
                return;
            }
            showToast(`Added ${item.s || item.n || 'stock'} to watchlist`, 'success');
            closeSearchPage();
            try { renderMarketPage(); } catch (_) { }
            return refreshMarketQuotes();
        }).catch(err => {
            // Hard failure caught by addToMarketWatchlist already, but just in case
            if (btn) {
                btn.disabled = false;
                btn.setAttribute('aria-pressed', 'false');
                const spinner = btn.querySelector('.spinner-border');
                if (spinner) spinner.remove();
            }
        });
    }

    function clearMarketSearch() {
        const input = getMarketSearchInput();
        if (input) {
            input.value = '';
            input.focus();
        }
        toggleClearBtn('searchPageClear', false);
        hideMarketAcList();
    }

    function refreshAllViews() {
        try { renderCurrentView(); } catch (_) { }
        try { renderPastTrades(); } catch (_) { }
        try { renderMoney(); } catch (_) { }
        try { renderSettings(); } catch (_) { }
        try { refreshActiveMoreView(); } catch (_) { }
        ensureLiveFeedsForVisiblePage();
    }

    function refreshTradeListViews() {
        try { renderCurrentView(); } catch (_) { }
        try { renderPastTrades(); } catch (_) { }
        try { refreshTradeDetailIfVisible(); } catch (_) { }
        if (isTradeLivePageVisible()) {
            paintTradeLivePrices();
            observeQuoteRows();
            // Re-kick feed after list re-render (sync / edits) so mobile
            // does not stay on empty placeholders until a manual tap.
            if (!tradeLiveRefreshing && !tradeLiveRefreshTimer) {
                startTradeLiveRefresh();
            }
        }
    }

    function refreshTradeDetailIfVisible() {
        if (tradeDetailId && TradeDetailSheet && TradeDetailSheet.isOpen()) {
            renderTradeDetailPage();
        }
    }

    function refreshActiveMoreView() {

    }

    // ---------- CALCULATION ENGINE ----------
    function parseDateKey(d) {
        if (!d) return '';
        return String(d).split('T')[0];
    }

    function calcHoldingDays(buyDate, sellDate) {
        const buyKey = parseDateKey(buyDate);
        const sellKey = parseDateKey(sellDate);
        if (!buyKey || !sellKey) return 0;
        const bd = new Date(buyKey + 'T12:00:00');
        const sd = new Date(sellKey + 'T12:00:00');
        return Math.max(0, Math.round((sd - bd) / (1000 * 60 * 60 * 24)));
    }

    /**
     * MTF interest days — inclusive of buy and sell calendar days (broker style).
     * e.g. buy 2 Jul + sell 6 Jul → 5 financed days (2, 3, 4, 5, 6).
     * Same calendar day → 0 (intraday, no MTF interest).
     */
    function calcInterestDays(buyDate, sellDate) {
        const buyKey = parseDateKey(buyDate);
        const sellKey = parseDateKey(sellDate);
        if (!buyKey || !sellKey || buyKey === sellKey) return 0;
        return calcHoldingDays(buyDate, sellDate) + 1;
    }

    function isSameDayTrade(buyDate, sellDate) {
        const buyKey = parseDateKey(buyDate);
        const sellKey = parseDateKey(sellDate);
        return !!buyKey && buyKey === sellKey;
    }

    /** Equity intraday statutory charges (NSE) — same calendar-day buy & sell for all brokers. */
    const INTRADAY_STATUTORY = {
        sttBuyPct: 0,
        sttSellPct: 0.00025,
        stampPct: 0.00003,
        pledgeCharge: 0,
        unpledgeCharge: 0,
        dpCharge: 0,
    };

    /**
     * Same-day square-off = intraday product (Zerodha MIS, Dhan intraday, Groww intraday).
     * Brokerage: ₹20 or % per executed order (whichever is lower) on buy + sell.
     * Sources: zerodha.com/charges, dhan.co/pricing, groww.in/help
     */
    const BROKER_INTRADAY_PROFILE = {
        Zerodha: { brokeragePct: 0.0003, brokerageCap: 20 },
        Dhan: { brokeragePct: 0.0003, brokerageCap: 20 },
        Groww: { brokeragePct: 0.001, brokerageCap: 20 },
    };

    const CHARGE_LOGIC_VERSION = 4;

    function getChargeConfig(broker, buyDate, sellDate) {
        const base = BROKER_CONFIG[broker] || BROKER_CONFIG['Zerodha'];
        if (!isSameDayTrade(buyDate, sellDate)) {
            return {
                ...base,
                sttBuyPct: base.sttPct,
                sttSellPct: base.sttPct,
                tradeType: 'mtf',
            };
        }
        const intraBrk = BROKER_INTRADAY_PROFILE[broker] || {
            brokeragePct: base.brokeragePct,
            brokerageCap: base.brokerageCap,
        };
        return {
            ...base,
            ...intraBrk,
            ...INTRADAY_STATUTORY,
            tradeType: 'intraday',
        };
    }

    function calcOrderBrokerage(amount, chargeCfg) {
        let brk = amount * chargeCfg.brokeragePct;
        if (chargeCfg.brokerageCap !== Infinity && brk > chargeCfg.brokerageCap) {
            brk = chargeCfg.brokerageCap;
        }
        return brk;
    }

    function recalculateStoredTrades() {
        const txs = getTransactions();
        let changed = false;
        const updated = txs.map(tx => {
            if (!tx.buyDate || !tx.quantity || !tx.buyPrice) return tx;
            const isOpen = (tx.status || 'closed') === 'open';
            const effectiveSellPrice = tx.sellPrice || (isOpen ? tx.buyPrice : 0);
            if (!effectiveSellPrice) return tx;
            const effectiveSellDate = tx.sellDate || new Date().toISOString().split('T')[0];
            const calc = calculateTrade({ ...tx, sellPrice: effectiveSellPrice, sellDate: effectiveSellDate });
            const newTx = {
                ...tx,
                grossProfit: calc.grossProfit,
                interest: calc.interest,
                charges: calc.totalCharges,
                netProfit: calc.netProfit,
                holdingDays: calc.holdingDays,
                mtfAmount: calc.mtfAmount,
                ownMargin: calc.ownMargin,
                totalInvestment: calc.totalInvestment,
                breakdown: calc.breakdown,
            };
            if (
                newTx.charges !== tx.charges ||
                newTx.netProfit !== tx.netProfit ||
                newTx.interest !== tx.interest ||
                (tx.breakdown && tx.breakdown.tradeType) !== calc.tradeType
            ) {
                changed = true;
            }
            return newTx;
        });
        if (changed) setTransactions(updated);
    }

    function migrateChargeLogic() {
        const key = 'mtf_charge_logic_version';
        const stored = parseInt(localStorage.getItem(key) || '0', 10);
        if (stored < CHARGE_LOGIC_VERSION) {
            recalculateStoredTrades();
            localStorage.setItem(key, String(CHARGE_LOGIC_VERSION));
        }
    }

    function calculateTrade(tx) {
        const { company, broker, quantity, buyPrice, sellPrice, buyDate, sellDate, leverage = 1 } = tx;
        const qty = Number(quantity) || 0;
        const bp = Number(buyPrice) || 0;
        const sp = Number(sellPrice) || 0;
        const lev = Number(leverage) || 1;

        const totalInvestment = bp * qty;
        let mtfAmount = 0;
        let ownMargin = totalInvestment;
        if (lev > 1) {
            mtfAmount = totalInvestment * (1 - 1 / lev);
            ownMargin = totalInvestment / lev;
        }

        const grossProfit = (sp - bp) * qty;
        const interestDays = calcInterestDays(buyDate, sellDate);

        const cfg = BROKER_CONFIG[broker] || BROKER_CONFIG['Zerodha'];
        const chargeCfg = getChargeConfig(broker, buyDate, sellDate);

        let dailyRate = cfg.interestRatePerDay;
        if (broker === 'Dhan' && mtfAmount > 0) {
            dailyRate = getDhanInterestRate(mtfAmount);
        } else if (broker !== 'Dhan' && cfg.interestRatePerDay !== null) {
            dailyRate = cfg.interestRatePerDay;
        } else {
            dailyRate = 0;
        }

        let interest = 0;
        if (mtfAmount > 0 && interestDays > 0 && dailyRate > 0) {
            interest = mtfAmount * dailyRate * interestDays;
        }

        const buyOrderValue = bp * qty;
        const sellOrderValue = sp * qty;
        const turnover = buyOrderValue + sellOrderValue;

        const brokerage = calcOrderBrokerage(buyOrderValue, chargeCfg) + calcOrderBrokerage(sellOrderValue, chargeCfg);

        const stt = buyOrderValue * chargeCfg.sttBuyPct + sellOrderValue * chargeCfg.sttSellPct;
        const exchange = turnover * chargeCfg.exchangePct;
        const sebi = turnover * chargeCfg.sebiPct;
        const stamp = buyOrderValue * chargeCfg.stampPct;
        const pledge = chargeCfg.pledgeCharge || 0;
        const unpledge = chargeCfg.unpledgeCharge || 0;
        const dp = chargeCfg.dpCharge || 0;

        const gstBase = brokerage + exchange + sebi + pledge + unpledge + dp;
        const gst = gstBase * chargeCfg.gstPct;

        const totalCharges = brokerage + stt + exchange + sebi + stamp + pledge + unpledge + dp + gst;
        const netProfit = grossProfit - interest - totalCharges;

        const breakdown = {
            brokerage: Math.round(brokerage * 100) / 100,
            stt: Math.round(stt * 100) / 100,
            exchange: Math.round(exchange * 100) / 100,
            sebi: Math.round(sebi * 100) / 100,
            stamp: Math.round(stamp * 100) / 100,
            pledge: Math.round(pledge * 100) / 100,
            unpledge: Math.round(unpledge * 100) / 100,
            dp: Math.round(dp * 100) / 100,
            gst: Math.round(gst * 100) / 100,
            interest: Math.round(interest * 100) / 100,
            tradeType: chargeCfg.tradeType,
        };

        return {
            grossProfit: Math.round(grossProfit * 100) / 100,
            holdingDays: interestDays,
            interest: Math.round(interest * 100) / 100,
            totalCharges: Math.round(totalCharges * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            mtfAmount: Math.round(mtfAmount * 100) / 100,
            ownMargin: Math.round(ownMargin * 100) / 100,
            totalInvestment: Math.round(totalInvestment * 100) / 100,
            leverage: lev,
            tradeType: chargeCfg.tradeType,
            breakdown: breakdown,
        };
    }

    function getEffectiveSellPrice(tx) {
        const sp = Number(tx.sellPrice) || 0;
        const bp = Number(tx.buyPrice) || 0;
        if (sp > 0) return sp;
        if ((tx.status || 'closed') === 'open' && bp > 0) return bp;
        return 0;
    }

    /** Live P&L metrics from current trade fields (dates, leverage, prices). */
    function resolveTradeMetrics(tx) {
        const sellPrice = getEffectiveSellPrice(tx);
        const fallback = {
            sellPrice,
            interest: Number(tx.interest) || 0,
            charges: Number(tx.charges) || 0,
            netProfit: Number(tx.netProfit) || 0,
            grossProfit: Number(tx.grossProfit) || 0,
            holdingDays: tx.holdingDays || 0,
            mtfAmount: Number(tx.mtfAmount) || 0,
            breakdown: tx.breakdown || {},
            ownMargin: Number(tx.ownMargin) || 0,
            totalInvestment: Number(tx.totalInvestment) || 0,
        };
        if (!tx.buyDate || !tx.quantity || !tx.buyPrice || !sellPrice) {
            return fallback;
        }
        const effectiveSellDate = tx.sellDate || new Date().toISOString().split('T')[0];
        const calc = calculateTrade({ ...tx, sellPrice, sellDate: effectiveSellDate });
        return {
            sellPrice,
            interest: calc.interest,
            charges: calc.totalCharges,
            netProfit: calc.netProfit,
            grossProfit: calc.grossProfit,
            holdingDays: calc.holdingDays,
            mtfAmount: calc.mtfAmount,
            breakdown: calc.breakdown,
            ownMargin: calc.ownMargin,
            totalInvestment: calc.totalInvestment,
        };
    }

    function resolveTradeForDisplay(tx) {
        const metrics = resolveTradeMetrics(tx);
        return { ...tx, ...metrics };
    }

    // ---------- APP BUTTON WIRING ----------
    // trade modal → features/common/trade-modal.js
    function renderSyncConnectRow() {
        const row = document.getElementById('syncConnectRow');
        if (!row) return;
        row.className = 'd-flex gap-2';
        row.innerHTML =
            renderAppButton('Connect', { id: 'syncConnectBtn', variant: 'action', onclick: 'connectSyncFromInput()', icon: 'fa-plug', flex: true }) +
            renderAppButton('Disconnect', { id: 'syncDisconnectBtn', variant: 'cancel', onclick: 'disconnectSync()', icon: 'fa-unlink', flex: true, className: 'd-none' });
    }

    function updateFabVisibility(page) {
        BottomBar.setFabVisible(false);
        BottomBar._onFabClick = openAddModal;
    }


    function paintSettingsActionButtons() {
        const feedHost = document.getElementById('settingsMarketFeedBtnHost');
        if (feedHost) {
            feedHost.innerHTML = renderAppButton('Check Feed', {
                id: 'settingsMarketFeedBtn',
                variant: 'action',
                onclick: 'checkMarketFeed()',
                icon: 'fa-satellite-dish',
                fullWidth: true
            });
        }
        /*
        // TEMP DISABLED:
        // Permanent Delete is temporarily disabled.
        // Retained for future implementation.
        // Currently replaced by Soft Delete.
        const resetHost = document.getElementById('settingsResetBtnHost');
        if (resetHost) {
            resetHost.innerHTML = renderAppButton('Reset', {
                variant: 'danger',
                onclick: 'resetData()',
                icon: 'fa-trash-alt',
                size: 'sm'
            });
        }
        */
    }

    let marketFeedChecking = false;

    function setMarketFeedStatusUI(state, detailHtml) {
        const badge = document.getElementById('marketFeedStatusBadge');
        const result = document.getElementById('marketFeedCheckResult');
        const btn = document.getElementById('settingsMarketFeedBtn');
        if (badge) {
            if (state === 'ok') setAppTagElement(badge, 'Live', 'success');
            else if (state === 'error') setAppTagElement(badge, 'Unavailable', 'error');
            else if (state === 'checking') setAppTagElement(badge, 'Checking…', 'warning');
            else setAppTagElement(badge, 'Not checked', 'default');
        }
        if (result) {
            result.innerHTML = detailHtml || 'Tap Check Feed to verify real-time market data.';
        }
        if (btn) {
            btn.disabled = !!marketFeedChecking;
            const icon = btn.querySelector('i');
            if (icon) icon.classList.toggle('fa-spin', !!marketFeedChecking);
        }
    }

    async function checkMarketFeed() {
        if (marketFeedChecking) return;
        marketFeedChecking = true;
        setMarketFeedStatusUI('checking', '<i class="fas fa-spinner fa-spin me-1"></i>Fetching live quote for RELIANCE…');
        try {
            const quote = await fetchOneMarketQuote({
                s: 'RELIANCE',
                n: 'Reliance Industries'
            });
            if (!quote || quote.error || quote.price == null || isNaN(Number(quote.price))) {
                throw new Error('No price returned');
            }
            const priceText = '₹' + Number(quote.price).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const change = Number(quote.change);
            const changePct = Number(quote.changePct);
            const hasChange = !isNaN(change);
            const changeText = hasChange
                ? `${change >= 0 ? '+' : '−'}₹${Math.abs(change).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`
                : '—';
            const checkedAt = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            setMarketFeedStatusUI(
                'ok',
                `<span class="text-success fw-medium">Yes — real-time market data is coming through.</span><br>` +
                `<span class="text-body-secondary"><strong>RELIANCE</strong> ${priceText}` +
                (hasChange ? ` · ${changeText}` : '') +
                `</span><br><span class="text-muted">Checked at ${checkedAt}</span>`
            );
            try { showToast('Yes — we are getting real-time market data.', 'success'); } catch (_) { }
        } catch (e) {
            MTFLogger.warn('Market feed check failed', e);
            setMarketFeedStatusUI(
                'error',
                '<span class="text-danger fw-medium">Could not reach live market data.</span><br>' +
                '<span class="text-muted">Check your internet connection and try again.</span>'
            );
            try { showToast('Market feed unavailable. Check your internet and try again.', 'danger'); } catch (_) { }
        } finally {
            marketFeedChecking = false;
            const btn = document.getElementById('settingsMarketFeedBtn');
            if (btn) {
                btn.disabled = false;
                const icon = btn.querySelector('i');
                if (icon) icon.classList.remove('fa-spin');
            }
        }
    }

    function initAppButtons() {
        setTxModalMode(false);
        renderSyncConnectRow();
        paintSettingsActionButtons();
        const calcAdd = document.getElementById('calcAddPctBtnHost');
        if (calcAdd) {
            calcAdd.innerHTML = renderAppButton('Add', {
                variant: 'action',
                onclick: 'addCalcSellPctPreset()',
                size: 'sm',
                className: 'text-nowrap'
            });
        }
    }

    function initModals() {
        initAppButtons();
        initTradeModal();
    }

    // ---------- FORMAT HELPERS ----------
    function fmtDate(d) {
        if (!d) return '-';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    function fmtDateFull(d) {
        return fmtDateDisplay(d);
    }
    function getNowTime() {
        const d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    function fmtDateTime(date, time) {
        if (!date) return '-';
        const dateStr = fmtDate(date);
        if (!time) return dateStr;
        const parts = time.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isNaN(h) || isNaN(m)) return dateStr;
        const dt = new Date();
        dt.setHours(h, m, 0, 0);
        const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        return dateStr + ' · ' + timeStr;
    }
    function fmtPct(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        const sign = n >= 0 ? '+' : '';
        return sign + n.toFixed(2) + '%';
    }
    function pnlClass(n) {
        return (n || 0) >= 0
            ? 'text-success bg-success-subtle rounded px-2 py-1'
            : 'text-danger bg-danger-subtle rounded px-2 py-1';
    }

    // ---------- FILTER SHEET ----------
    let tradeFilterPane = null;

    function getTradeFilterPane() {
        if (!tradeFilterPane) {
            const createPane = window.MTFComponents?.createAppPane;
            if (typeof createPane !== 'function') return null;
            tradeFilterPane = createPane('#tradeFilterSheet', {
                fullHeight: true,
                heightRatio: 0.9,
                // Pin Cancel / Apply via CSS flex — don't let Cupertino
                // size the middle panel to full viewport height.
                topperOverflow: false
            });
        }
        return tradeFilterPane;
    }

    function statusFromViewMode(mode) {
        if (mode === 'past') return tradeCancelledOnly ? 'cancelled' : 'closed';
        if (mode === 'all') return 'all';
        return 'open';
    }

    function viewModeFromStatus(status) {
        if (status === 'plan') return 'trade';
        if (status === 'closed' || status === 'cancelled') return 'past';
        if (status === 'all') return 'all';
        return 'trade';
    }

    function formatFilterRangeSummary() {
        const fromEl = document.getElementById('pastFrom');
        const toEl = document.getElementById('pastTo');
        const from = fromEl?.value || pastFrom;
        const to = toEl?.value || pastTo;
        if (!from && !to) return 'All dates';
        if (pastRangeDays === 'today') return 'Today';
        if (pastRangeDays === 'yesterday') return 'Yesterday';
        if (pastRangeDays === 'this-week') return 'This week';
        if (pastRangeDays === 'last-week') return 'Last week';
        if (pastRangeDays === 'work-20') return '20 WD';
        if (pastRangeDays === 'work-30') return '30 WD';
        if (from && to) {
            try {
                return `${fmtDateShort(from)} – ${fmtDateShort(to)}`;
            } catch (_) {
                return `${from} – ${to}`;
            }
        }
        return 'Custom dates';
    }

    let tradeFilterCategory = 'status';

    function setTradeFilterCategory(cat) {
        tradeFilterCategory = cat || 'status';
        document.querySelectorAll('#panelPastFilter .trade-filter-nav-item').forEach((btn) => {
            btn.classList.toggle('is-active', btn.getAttribute('data-filter-cat') === tradeFilterCategory);
        });
        document.querySelectorAll('#panelPastFilter .trade-filter-panel').forEach((panel) => {
            const active = panel.getAttribute('data-filter-panel') === tradeFilterCategory;
            panel.classList.toggle('is-active', active);
            if (active) panel.removeAttribute('hidden');
            else panel.setAttribute('hidden', '');
        });
    }

    function tradeFilterStatusLabel(status) {
        return ({ all: 'All', open: 'Open', closed: 'Closed', cancelled: 'Cancelled' })[status] || 'Open';
    }

    function tradeFilterHoldLabel(holdDays) {
        return ({ '1-3': '1–3 days', '4-7': '4–7 days', '8+': '8+ days' })[holdDays] || holdDays;
    }

    function tradeFilterSortLabel(sortBy) {
        return ({
            company: 'Company',
            holding: 'Holding days',
            buyDate: 'Buy date',
            sellDate: 'Sell date',
            pnl: 'P&L',
            return: 'Current return'
        })[sortBy] || 'Holding days';
    }

    function tradeFilterPerfLabel(key) {
        return ({
            profit: 'Profit',
            loss: 'Loss',
            near_target: 'Near target',
            target_hit: 'Target hit',
            verified: 'Verified'
        })[key] || key;
    }

    function buildTradeFilterChips(draft) {
        const chips = [
            { key: 'status', label: `Status: ${tradeFilterStatusLabel(draft.status)}` }
        ];
        if (draft.holdDays && draft.holdDays !== 'all') {
            chips.push({ key: 'holding', label: `Holding: ${tradeFilterHoldLabel(draft.holdDays)}` });
        }
        draft.perf.forEach((key) => {
            chips.push({ key: `perf:${key}`, label: `Performance: ${tradeFilterPerfLabel(key)}` });
        });
        chips.push({ key: 'sort', label: `Sort: ${tradeFilterSortLabel(draft.sortBy)}` });
        const rangeLabel = formatFilterRangeSummary();
        if (rangeLabel && rangeLabel !== 'All dates') {
            chips.push({ key: 'dates', label: rangeLabel });
        }
        return chips;
    }

    function clearTradeFilterChip(key) {
        if (key === 'status') {
            const el = document.getElementById('tradeFilterStatus-open');
            if (el) el.checked = true;
        } else if (key === 'holding') {
            const el = document.getElementById('tradeFilterHold-all');
            if (el) el.checked = true;
        } else if (key === 'sort') {
            const el = document.getElementById('tradeFilterSort-holding');
            if (el) el.checked = true;
        } else if (key === 'dates') {
            draftPastRange('all');
            return;
        } else if (String(key).startsWith('perf:')) {
            const perfKey = String(key).slice(5);
            const idMap = {
                profit: 'tradeFilterPerf-profit',
                loss: 'tradeFilterPerf-loss',
                near_target: 'tradeFilterPerf-near',
                target_hit: 'tradeFilterPerf-hit',
                verified: 'tradeFilterPerf-verified'
            };
            const el = document.getElementById(idMap[perfKey]);
            if (el) el.checked = false;
        }
        updateTradeFilterSummary();
    }

    function clearAllTradeFilterChips() {
        resetTradeFilterSheet();
    }

    function updateTradeFilterSummary() {
        const draft = readTradeFilterSheetDraft();
        const chips = buildTradeFilterChips(draft);

        const chipsEl = document.getElementById('tradeFilterChips');
        if (chipsEl) {
            chipsEl.innerHTML = chips.map((chip) => (
                `<span class="trade-filter-chip">` +
                `<span class="trade-filter-chip-label">${escapeHtml(chip.label)}</span>` +
                `<button type="button" class="trade-filter-chip-remove" aria-label="Remove ${escapeHtml(chip.label)}" onclick="clearTradeFilterChip('${chip.key}')">` +
                `<i class="fas fa-times" aria-hidden="true"></i></button></span>`
            )).join('');
        }

        const clearAll = document.getElementById('tradeFilterClearAll');
        if (clearAll) clearAll.classList.toggle('d-none', chips.length === 0);

        const applyBtn = document.getElementById('tradeFilterApplyBtn');
        if (applyBtn) {
            applyBtn.textContent = chips.length
                ? `Apply filters (${chips.length})`
                : 'Apply filters';
        }

        const statusHint = document.getElementById('tradeFilterStatusHint');
        if (statusHint) {
            const hintText = ({
                all: 'Showing all trades',
                open: 'Showing only open trades',
                closed: 'Showing only closed trades',
                cancelled: 'Showing only cancelled trades'
            })[draft.status] || 'Showing only open trades';
            const span = statusHint.querySelector('span');
            if (span) span.textContent = hintText;
            else statusHint.textContent = hintText;
        }

        const setBadge = (cat, count) => {
            const badge = document.querySelector(`#panelPastFilter [data-filter-badge="${cat}"]`);
            if (!badge) return;
            if (count > 0) {
                badge.textContent = String(count);
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        };
        setBadge('status', 1);
        setBadge('holding', draft.holdDays !== 'all' ? 1 : 0);
        setBadge('performance', draft.perf.size);
        setBadge('sort', 1);

        const datesMeta = document.querySelector('#panelPastFilter [data-filter-meta="dates"]');
        if (datesMeta) datesMeta.textContent = formatFilterRangeSummary();
    }

    function syncTradeFilterSheetControls() {
        ensureSharedTradeRange();
        const status = statusFromViewMode(tradesViewMode);
        const statusInput = document.querySelector(`input[name="tradeFilterStatus"][value="${status}"]`);
        if (statusInput) statusInput.checked = true;

        const holdInput = document.querySelector(`input[name="tradeFilterHoldDays"][value="${tradeHoldDaysFilter}"]`);
        if (holdInput) holdInput.checked = true;

        const sortInput = document.querySelector(`input[name="tradeFilterSort"][value="${tradeSortBy}"]`);
        if (sortInput) sortInput.checked = true;

        const idMap = {
            profit: 'tradeFilterPerf-profit',
            loss: 'tradeFilterPerf-loss',
            near_target: 'tradeFilterPerf-near',
            target_hit: 'tradeFilterPerf-hit',
            verified: 'tradeFilterPerf-verified'
        };
        Object.keys(idMap).forEach((key) => {
            const el = document.getElementById(idMap[key]);
            if (el) el.checked = tradePerfFilters.has(key);
        });

        setDateInputValue(document.getElementById('pastFrom'), pastFrom);
        setDateInputValue(document.getElementById('pastTo'), pastTo);
        if (pastRangeDays != null && pastRangeDays !== '') {
            setRangeButtonsActive('#pastRangeButtons', pastRangeDays);
        } else {
            clearRangeButtonsActive('#pastRangeButtons');
        }
        updateTradeFilterSummary();
    }

    function openFilterSheet() {
        if (Sheet?.isOpen?.()) Sheet.close();
        if (TradeDetailSheet?.isOpen?.()) TradeDetailSheet.close({ quiet: true });
        if (window.MTFComponents?.TradeSheet?.isOpen?.()) {
            window.MTFComponents.TradeSheet.close();
        }
        syncTradeFilterSheetControls();
        setTradeFilterCategory('status');
        const body = document.getElementById('tradeFilterContent');
        if (body) {
            // Do not mark overflow-y here — Cupertino would size this middle
            // panel to nearly full pane height and clip Cancel / Apply.
            body.removeAttribute('overflow-y');
            body.style.height = '';
            body.style.maxHeight = '';
            body.scrollTop = 0;
        }
        const pane = getTradeFilterPane();
        if (pane) {
            pane.present()?.then?.(() => {
                if (body) {
                    body.style.height = '';
                    body.style.maxHeight = '';
                }
            });
        }
    }

    function openTradeFilterSheet() {
        Sheet.mountPanel('<i class="fas fa-tune me-2 text-primary"></i>Filter Trades', 'panelTradeFilter',
            renderAppButtonRow('Close', 'Apply', { cancelOnClick: 'closeSheet()', actionOnClick: 'applyTradeRangeFilter()', actionIcon: 'fa-check' }));
        setDateInputValue(document.getElementById('tradeFrom'), tradeFrom);
        setDateInputValue(document.getElementById('tradeTo'), tradeTo);
        if (tradeRangeDays != null && tradeRangeDays !== '') {
            setRangeButtonsActive('#tradeRangeButtons', tradeRangeDays);
        } else {
            clearRangeButtonsActive('#tradeRangeButtons');
        }
    }

    function closeFilterSheet() {
        const pane = getTradeFilterPane();
        if (pane?.isOpen?.()) pane.close();
        if (Sheet?.isOpen?.()) Sheet.close();
    }

    let settingsReturnPage = 'trades';
    let settingsReturnMoreFeature = null;
    let tradeDetailId = null;

    function getCurrentAppPage() {
        // Pages use Bootstrap `d-none` (not legacy `.hidden`).
        const active = Array.from(document.querySelectorAll('section[id^="page-"]')).find(
            (el) => !el.classList.contains('d-none')
        );
        if (!active) return { page: 'trades', moreFeature: null };
        const id = active.id;
        if (id === 'page-trades') {
            if (tradesViewMode === 'past') return { page: 'past', moreFeature: null };
            return { page: 'trades', moreFeature: null };
        }
        if (id === 'page-past') return { page: 'past', moreFeature: null };
        if (id === 'page-market') return { page: 'market', moreFeature: null };
        if (id === 'page-calendar') return { page: 'calendar', moreFeature: null };
        if (id === 'page-more') return { page: 'more', moreFeature: null };
        if (id === 'page-settings') return { page: 'settings', moreFeature: null };

        return { page: 'trades', moreFeature: null };
    }

    const NAV_STATE_KEY = 'mtf_nav_state';

    function saveNavState() {
        const current = getCurrentAppPage();
        const payload = {
            page: current.page,
            moreFeature: current.moreFeature
        };
        if (current.page === 'settings') {
            payload.settingsReturnPage = settingsReturnPage;
            payload.settingsReturnMoreFeature = settingsReturnMoreFeature;
        }
        try { sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(payload)); } catch (_) { }
    }

    function getSavedNavState() {
        try {
            const raw = sessionStorage.getItem(NAV_STATE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function isNavStateMismatch(saved) {
        if (!saved || !saved.page) return false;
        if (saved.page === 'settings') {
            return document.getElementById('page-settings')?.classList.contains('d-none');
        }
        if (saved.moreFeature) {
            const featPage = moreFeatureMap[saved.moreFeature];
            return document.getElementById(featPage)?.classList.contains('d-none');
        }
        const expected = pageMap[saved.page];
        return expected ? document.getElementById(expected)?.classList.contains('d-none') : false;
    }

    function restoreNavState() {
        const saved = getSavedNavState();
        if (!saved || !saved.page) return false;
        if (saved.page === 'settings') {
            settingsReturnPage = saved.settingsReturnPage || 'trades';
            settingsReturnMoreFeature = saved.settingsReturnMoreFeature || null;
            renderSettings();
            showPage('page-settings');
            BottomBar.setActive(null);
            BottomBar.setFabVisible(false);
            return true;
        }
        if (saved.moreFeature) {
            if (!moreFeatureMap[saved.moreFeature]) {
                navigateTo('more');
                return true;
            }
            openMoreFeature(saved.moreFeature);
            return true;
        }

        // Legacy / mistaken "plan" nav → always land on current open trades.
        if (saved.page === 'plan') {
            navigateTo('trades');
            return true;
        }
        if (pageMap[saved.page]) {
            navigateTo(saved.page);
            return true;
        }
        return false;
    }

    function restoreNavStateIfNeeded() {
        const saved = getSavedNavState();
        if (!saved || !isNavStateMismatch(saved)) return;
        restoreNavState();
    }

    function openSettingsPage() {
        const current = getCurrentAppPage();
        if (current.page !== 'settings') {
            settingsReturnPage = current.page === 'settings' ? settingsReturnPage : current.page;
            settingsReturnMoreFeature = current.moreFeature;
        }
        stopMarketRefresh();
        stopTradeLiveRefresh();
        renderSettings();
        showPage('page-settings');
        setBottomNavActive(null);
        updateFabVisibility('settings');
        saveNavState();
    }

    function backFromSettings() {
        if (settingsReturnMoreFeature) {
            openMoreFeature(settingsReturnMoreFeature);
        } else {
            navigateTo(settingsReturnPage || 'trades');
        }
    }

    function openTradeDetail(id) {
        const tradeId = String(id || '');
        if (!tradeId) return;
        if (getSearchSheetPane()?.isOpen?.()) closeSearchPage();
        tradeDetailId = tradeId;
        stopMarketRefresh();
        renderTradeDetailPage();
        if (TradeDetailSheet) TradeDetailSheet.present();
        BottomBar.setFabVisible(false);
    }

    function openPositionBySymbol(symbol, name) {
        const sym = normalizeMarketSymbol(symbol);
        if (!sym) return;
        openBuyTradeFromMarket(sym, name || sym);
    }

    function backFromTradeDetail(opts = {}) {
        const { fromPane = false } = opts || {};
        tradeDetailId = null;
        if (!fromPane && TradeDetailSheet && TradeDetailSheet.isOpen()) {
            TradeDetailSheet.close({ quiet: true });
        }
        BottomBar.setBarVisible(true);
        const current = getCurrentAppPage();
        updateFabVisibility(current.page === 'past' ? 'trades' : current.page);
    }

    // ---------- NAVIGATION ----------
    const pageMap = { trades: 'page-trades', past: 'page-past', market: 'page-market', gold: 'page-gold', calendar: 'page-calendar', more: 'page-more' };
    const moreFeatureMap = { };
    let activeMoreFeature = null;

    function showPage(pageId) {
        document.querySelectorAll('section[id^="page-"]').forEach(el => el.classList.add('d-none'));
        const target = document.getElementById(pageId);
        if (target) target.classList.remove('d-none');
        updateAppHeader(pageId);
    }

    function setBottomNavActive(page) {
        BottomBar.setActive(page);
    }



    function renderAppPage(page) {
        if (page === 'plan') {
            navigateTo('trades');
            return;
        }
        activeMoreFeature = null;
        showPage(pageMap[page]);
        setBottomNavActive(page);
        if (page !== 'market') stopMarketRefresh();
        if (page !== 'trades' && page !== 'past') stopTradeLiveRefresh();
        if (page !== 'gold') {
            try { if (typeof window.stopGoldPageRefresh === 'function') window.stopGoldPageRefresh(); } catch (_) {}
        }

        if (page === 'market') {
            try { renderMarketPage(); } catch (_) { }
            startMarketRefresh();
        } else if (page === 'gold') {
            try { if (typeof window.renderGoldPage === 'function') window.renderGoldPage(); } catch (_) {}
        } else if (page === 'calendar') {
            try { renderCalendarPage(); } catch (_) { }
        } else if (page === 'trades') {
            // Trades tab always opens current open trades (not Plan/Past).
            setTradesViewMode('trade');
            startTradeLiveRefresh();
        } else if (page === 'past') {
            // Past lives under Trades dropdown — no separate bottom tab.
            activeMoreFeature = null;
            showPage(pageMap['trades']);
            setBottomNavActive('trades');
            setTradesViewMode('past');
            updateFabVisibility('trades');
            startTradeLiveRefresh();
            saveNavState();
            return;
        }
        updateFabVisibility(page);
        saveNavState();
    }

    function navigateTo(pageId) {
        if (typeof window.page === 'function') {
            window.page('/' + pageId);
        } else {
            renderAppPage(pageId);
        }
    }

    function openMoreFeature(feature) {
        stopMarketRefresh();
        stopTradeLiveRefresh();
        if (!moreFeatureMap[feature]) {
            navigateTo('more');
            return;
        }
        activeMoreFeature = feature;
        showPage(moreFeatureMap[feature]);
        setBottomNavActive('more');
        updateFabVisibility('more');
        saveNavState();
    }

    function backToMoreHub() {
        activeMoreFeature = null;
        showPage('page-more');
        setBottomNavActive('more');
        updateFabVisibility('more');
        saveNavState();
    }

    // ---------- STATE ----------
    let pastRangeDays = 'all';
    let pastFrom = null;
    let pastTo = null;
    let tradeRangeDays = 'all';
    let tradeFrom = null;
    let tradeTo = null;
    let tradeSearchQuery = '';
    let pastSearchQuery = '';
    let planSearchQuery = '';
    let tradesViewMode = 'trade';
    let pastPnlFilter = 'all';
    let tradeHoldDaysFilter = 'all';
    let tradeSortBy = 'holding';
    let tradePerfFilters = new Set();
    let tradeCancelledOnly = false;
    /** Per Trade / Plan / Past date-range memory (shared filter sheet). */
    let tradeListRanges = {
        trade: { key: 'all', from: null, to: null },
        plan: { key: 'all', from: null, to: null },
        past: { key: 'this-week', from: null, to: null }
    };
    let searchContext = 'trades';
    let searchQuery = '';
    let txModalContext = 'trades';


    const APP_BROKER_OPTIONS = [
        { value: '', label: 'Select Broker', icon: 'fa-building', variant: 'muted' },
        { value: 'Zerodha', label: 'Zerodha', icon: 'fa-chart-line', variant: 'broker' },
        { value: 'Dhan', label: 'Dhan', icon: 'fa-chart-line', variant: 'broker' },
        { value: 'Groww', label: 'Groww', icon: 'fa-chart-line', variant: 'broker' },
        { value: 'Angel One', label: 'Angel One', icon: 'fa-chart-line', variant: 'broker' }
    ];


    function setFilterBtnHighlight(btn, active) {
        if (!btn) return;
        btn.classList.remove('btn-primary');
        btn.classList.toggle('border', active);
        btn.classList.toggle('bg-light', active);
        btn.classList.toggle('text-body', active);
        btn.classList.toggle('border', !active);
        const icon = btn.querySelector('i');
        if (icon) icon.classList.toggle('text-muted', active);
        if (icon) icon.classList.toggle('text-muted', !active);
    }

    function setRangeButtonsActive(containerSelector, activeRange) {
        const key = activeRange != null && activeRange !== '' ? String(activeRange) : '';
        document.querySelectorAll(`${containerSelector} .btn-check[data-range]`).forEach((input) => {
            input.checked = key !== '' && input.dataset.range === key;
        });
    }

    function clearRangeButtonsActive(containerSelector) {
        setRangeButtonsActive(containerSelector, '');
    }



    function setTxBroker(value) {
        const hidden = document.getElementById('txBroker');
        if (!hidden) return;
        hidden.value = value || '';
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
        const host = document.getElementById('txBrokerHost');
        if (!host) return;
        const { renderAppSelectDropdown } = global.MTFComponents;
        if (!renderAppSelectDropdown) return;
        host.innerHTML = renderAppSelectDropdown({
            id: 'txBrokerTrigger',
            value: value || '',
            options: APP_BROKER_OPTIONS,
            selectHandler: 'setTxBroker',
            ariaLabel: 'Select Broker',
            fullWidth: true,
            size: '',
            className: 'w-100 text-start d-flex align-items-center justify-content-between tx-broker-trigger'
        });
        if (typeof updatePreview === 'function') { try { updatePreview(); } catch (_) { } }
        try { global.MTFComponents.hideOpenDropdowns?.(document.getElementById('txModal')); } catch (_) { }
    }



    // ---------- RANGE HELPERS ----------
    function localDateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getDateRange(days) {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        return { from: localDateStr(from), to: localDateStr(to) };
    }

    /** Monday–Friday of the calendar week containing today (local time). */
    function getThisWeekMonFriRange() {
        const now = new Date();
        const day = now.getDay(); // 0 Sun … 6 Sat
        const daysFromMonday = day === 0 ? 6 : day - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        return { from: localDateStr(monday), to: localDateStr(friday) };
    }

    /** Previous Mon–Fri trading week (before the current week). */
    function getLastWeekMonFriRange() {
        const thisWeek = getThisWeekMonFriRange();
        const monday = new Date(thisWeek.from + 'T12:00:00');
        monday.setDate(monday.getDate() - 7);
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        return { from: localDateStr(monday), to: localDateStr(friday) };
    }

    /** NSE/BSE session days: Mon–Fri (weekends excluded). */
    function isMarketWorkingDay(d) {
        const day = d.getDay();
        return day >= 1 && day <= 5;
    }

    function getLastMarketWorkingDay(fromDate = new Date()) {
        const d = new Date(fromDate);
        d.setHours(12, 0, 0, 0);
        while (!isMarketWorkingDay(d)) {
            d.setDate(d.getDate() - 1);
        }
        return d;
    }

    /** Inclusive range covering the last N market working days ending on the latest session day. */
    function getWorkingDayRange(workingDays) {
        const n = Math.max(1, Math.round(Number(workingDays) || 1));
        const to = getLastMarketWorkingDay(new Date());
        const from = new Date(to);
        let left = n - 1;
        while (left > 0) {
            from.setDate(from.getDate() - 1);
            if (isMarketWorkingDay(from)) left -= 1;
        }
        return { from: localDateStr(from), to: localDateStr(to) };
    }

    function defaultTradeListRange(mode) {
        if (mode === 'past') {
            const range = getThisWeekMonFriRange();
            return { key: 'this-week', from: range.from, to: range.to };
        }
        return { key: 'all', from: null, to: null };
    }

    function syncPastRangeInputs() {
        setDateInputValue(document.getElementById('pastFrom'), pastFrom || '');
        setDateInputValue(document.getElementById('pastTo'), pastTo || '');
        if (pastRangeDays != null && pastRangeDays !== '') {
            setRangeButtonsActive('#pastRangeButtons', pastRangeDays);
        } else {
            clearRangeButtonsActive('#pastRangeButtons');
        }
    }

    function saveTradeListRangeForMode(mode) {
        const key = mode === 'plan' ? 'plan' : (mode === 'past' ? 'past' : 'trade');
        tradeListRanges[key] = {
            key: pastRangeDays,
            from: pastFrom,
            to: pastTo
        };
    }

    function loadTradeListRangeForMode(mode) {
        const key = mode === 'plan' ? 'plan' : (mode === 'past' ? 'past' : 'trade');
        let state = tradeListRanges[key];
        if (!state || (state.key !== 'all' && (!state.from || !state.to))) {
            state = defaultTradeListRange(key);
            tradeListRanges[key] = state;
        } else if (state.key === 'this-week') {
            // Keep "this week" current when revisiting Past
            const range = getThisWeekMonFriRange();
            state = { key: 'this-week', from: range.from, to: range.to };
            tradeListRanges[key] = state;
        }
        pastRangeDays = state.key;
        pastFrom = state.from;
        pastTo = state.to;
        syncPastRangeInputs();
    }

    function computePastRangeValues(daysOrKey) {
        if (daysOrKey === 'all') {
            return { from: null, to: null };
        }
        if (daysOrKey === 'today') {
            const date = localDateStr(new Date());
            return { from: date, to: date };
        }
        if (daysOrKey === 'yesterday') {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            const date = localDateStr(y);
            return { from: date, to: date };
        }
        if (daysOrKey === 'this-week') {
            return getThisWeekMonFriRange();
        }
        if (daysOrKey === 'last-week') {
            return getLastWeekMonFriRange();
        }
        if (daysOrKey === 'work-20') {
            return getWorkingDayRange(20);
        }
        if (daysOrKey === 'work-30') {
            return getWorkingDayRange(30);
        }
        return getDateRange(daysOrKey);
    }

    function draftPastRange(daysOrKey) {
        pastRangeDays = daysOrKey;
        const range = computePastRangeValues(daysOrKey);
        pastFrom = range.from;
        pastTo = range.to;
        syncPastRangeInputs();
        updateTradeFilterSummary();
    }

    function setPastRange(daysOrKey) {
        draftPastRange(daysOrKey);
        saveTradeListRangeForMode(tradesViewMode);
        if (isTradesPageVisible()) {
            renderCurrentView();
        } else {
            renderPastTrades();
        }
        if (isPastPageVisible()) startTradeLiveRefresh();
        closeFilterSheet();
    }

    function onPastFilterDateChange() {
        pastRangeDays = null;
        clearRangeButtonsActive('#pastRangeButtons');
        updateTradeFilterSummary();
    }

    function readTradeFilterSheetDraft() {
        const statusEl = document.querySelector('input[name="tradeFilterStatus"]:checked');
        const holdEl = document.querySelector('input[name="tradeFilterHoldDays"]:checked');
        const sortEl = document.querySelector('input[name="tradeFilterSort"]:checked');
        const perf = new Set();
        document.querySelectorAll('#panelPastFilter .trade-filters-checks input[type="checkbox"]:checked').forEach((el) => {
            if (el.value) perf.add(el.value);
        });
        return {
            status: statusEl ? statusEl.value : 'open',
            holdDays: holdEl ? holdEl.value : 'all',
            sortBy: sortEl ? sortEl.value : 'holding',
            perf
        };
    }

    function applyTradeFilters() {
        const fromEl = document.getElementById('pastFrom');
        const toEl = document.getElementById('pastTo');
        const from = fromEl ? fromEl.value : '';
        const to = toEl ? toEl.value : '';
        if (from && to) {
            if (from > to) { showToast('From date must be before To date.', 'warning'); return; }
            pastFrom = from;
            pastTo = to;
            if (pastRangeDays == null || pastRangeDays === '') {
                clearRangeButtonsActive('#pastRangeButtons');
            }
        } else if (!from && !to) {
            pastFrom = null;
            pastTo = null;
            pastRangeDays = 'all';
            setRangeButtonsActive('#pastRangeButtons', 'all');
        } else {
            showToast('Please select both dates.', 'warning');
            return;
        }

        const draft = readTradeFilterSheetDraft();
        tradeHoldDaysFilter = draft.holdDays;
        tradeSortBy = draft.sortBy;
        tradePerfFilters = draft.perf;
        tradeCancelledOnly = draft.status === 'cancelled';

        if (draft.perf.has('verified') && draft.perf.size === 1) {
            pastPnlFilter = 'verified';
        } else if (draft.perf.has('profit') && !draft.perf.has('loss') && draft.perf.size === 1) {
            pastPnlFilter = 'profit';
        } else if (draft.perf.has('loss') && !draft.perf.has('profit') && draft.perf.size === 1) {
            pastPnlFilter = 'loss';
        } else if (draft.perf.size === 0) {
            pastPnlFilter = 'all';
        } else {
            pastPnlFilter = 'custom';
        }

        const nextMode = viewModeFromStatus(draft.status);
        if (nextMode !== tradesViewMode) {
            saveTradeListRangeForMode(tradesViewMode);
            tradesViewMode = nextMode;
        }
        saveTradeListRangeForMode(tradesViewMode);

        if (isTradesPageVisible()) {
            renderCurrentView();
            updateAppHeader('page-trades');
            updateFabVisibility('trades');
            startTradeLiveRefresh();
        } else {
            renderPastTrades();
            if (isPastPageVisible()) startTradeLiveRefresh();
        }
        closeFilterSheet();
        showToast('Filters applied.', 'success');
    }

    function applyPastRangeFilter() {
        applyTradeFilters();
    }

    function resetTradeFilterSheet() {
        const statusVal = tradesViewMode === 'past' ? 'closed' : 'open';
        const st = document.querySelector(`input[name="tradeFilterStatus"][value="${statusVal}"]`);
        if (st) st.checked = true;
        const holdAll = document.getElementById('tradeFilterHold-all');
        if (holdAll) holdAll.checked = true;
        const sortHolding = document.getElementById('tradeFilterSort-holding');
        if (sortHolding) sortHolding.checked = true;
        document.querySelectorAll('#panelPastFilter .trade-filters-checks input[type="checkbox"]').forEach((el) => {
            el.checked = false;
        });
        draftPastRange(tradesViewMode === 'past' ? 'this-week' : 'all');
        setTradeFilterCategory('status');
        updateTradeFilterSummary();
    }

    function resetTradeFilters() {
        tradeHoldDaysFilter = 'all';
        tradeSortBy = 'holding';
        tradePerfFilters = new Set();
        tradeCancelledOnly = false;
        pastPnlFilter = 'all';
        if (tradesViewMode === 'past') {
            setPastRange('this-week');
        } else {
            setPastRange('all');
            clearTradeSearch();
        }
        showToast('Filters reset.', 'success');
    }

    function setTradeRange(daysOrKey) {
        tradeRangeDays = daysOrKey;
        if (daysOrKey === 'all') {
            tradeFrom = null;
            tradeTo = null;
            setDateInputValue(document.getElementById('tradeFrom'), '');
            setDateInputValue(document.getElementById('tradeTo'), '');
        } else if (daysOrKey === 'today') {
            const date = localDateStr(new Date());
            tradeFrom = date;
            tradeTo = date;
        } else if (daysOrKey === 'yesterday') {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            const date = localDateStr(y);
            tradeFrom = date;
            tradeTo = date;
        } else if (daysOrKey === 'this-week') {
            const range = getThisWeekMonFriRange();
            tradeFrom = range.from;
            tradeTo = range.to;
        } else if (daysOrKey === 'last-week') {
            const range = getLastWeekMonFriRange();
            tradeFrom = range.from;
            tradeTo = range.to;
        } else if (daysOrKey === 'work-20') {
            const range = getWorkingDayRange(20);
            tradeFrom = range.from;
            tradeTo = range.to;
        } else if (daysOrKey === 'work-30') {
            const range = getWorkingDayRange(30);
            tradeFrom = range.from;
            tradeTo = range.to;
        } else {
            const range = getDateRange(daysOrKey);
            tradeFrom = range.from;
            tradeTo = range.to;
        }
        if (daysOrKey !== 'all') {
            setDateInputValue(document.getElementById('tradeFrom'), tradeFrom);
            setDateInputValue(document.getElementById('tradeTo'), tradeTo);
        }
        setRangeButtonsActive('#tradeRangeButtons', daysOrKey);
        renderCurrentView();
        if (isTradesPageVisible()) startTradeLiveRefresh();
        closeFilterSheet();
    }

    function onTradeFilterDateChange() {
        tradeRangeDays = null;
        clearRangeButtonsActive('#tradeRangeButtons');
    }

    function applyTradeRangeFilter() {
        const from = document.getElementById('tradeFrom').value;
        const to = document.getElementById('tradeTo').value;
        if (!from || !to) { showToast('Please select both dates.', 'warning'); return; }
        if (from > to) { showToast('From date must be before To date.', 'warning'); return; }
        tradeFrom = from;
        tradeTo = to;
        tradeRangeDays = null;
        clearRangeButtonsActive('#tradeRangeButtons');
        renderCurrentView();
        if (isTradesPageVisible()) startTradeLiveRefresh();
        closeFilterSheet();
        showToast('Range applied.', 'success');
    }

    // ---------- SHARED TRADE CARD ----------
    function getDaysHeld(t) {
        if (t.buyDate && t.sellDate) {
            return calcInterestDays(t.buyDate, t.sellDate);
        }
        const isOpen = (t.status || 'closed') === 'open';
        if (isOpen && t.buyDate) {
            const buyKey = parseDateKey(t.buyDate);
            if (!buyKey) return t.holdingDays || 0;
            const buyDt = new Date(buyKey + 'T12:00:00');
            return Math.max(0, Math.ceil((new Date() - buyDt) / (1000 * 60 * 60 * 24)));
        }
        return t.holdingDays || 0;
    }

    function matchesHoldDaysFilter(t, holdFilter = tradeHoldDaysFilter) {
        if (!holdFilter || holdFilter === 'all') return true;
        const days = getDaysHeld(t);
        if (holdFilter === '1-3') return days >= 1 && days <= 3;
        if (holdFilter === '4-7') return days >= 4 && days <= 7;
        if (holdFilter === '8+') return days >= 8;
        return true;
    }

    function tradeTargetPrice(t) {
        const n = Number(t && t.targetPrice);
        return n > 0 ? n : null;
    }

    function tradeProgressPct(t) {
        const target = tradeTargetPrice(t);
        const buy = Number(t && t.buyPrice);
        if (!(target > 0) || !(buy > 0)) return null;
        let live = null;
        if ((t.status || 'closed') === 'closed') {
            live = Number(t.sellPrice);
        } else {
            const sym = resolveTradeLiveSymbol(t);
            const quote = sym ? getTradeLiveQuote(sym) : null;
            live = quote && Number(quote.price) > 0 ? Number(quote.price) : null;
        }
        if (!(live > 0)) return null;
        const span = target - buy;
        if (Math.abs(span) < 1e-9) return live >= target ? 100 : 0;
        return ((live - buy) / span) * 100;
    }

    function tradeCurrentReturn(t) {
        if ((t.status || 'closed') === 'closed') {
            return resolveTradeMetrics(t).netProfit;
        }
        const sym = resolveTradeLiveSymbol(t);
        const quote = sym ? getTradeLiveQuote(sym) : null;
        const live = quote && Number(quote.price) > 0 ? Number(quote.price) : null;
        if (live == null) return resolveTradeMetrics(t).netProfit;
        const est = estimateLiveSellReturn(t, live);
        return est != null ? est : resolveTradeMetrics(t).netProfit;
    }

    function matchesPerfFilters(t, perfSet = tradePerfFilters) {
        if (!perfSet || perfSet.size === 0) {
            if (pastPnlFilter === 'profit') return resolveTradeMetrics(t).netProfit >= 0;
            if (pastPnlFilter === 'loss') return resolveTradeMetrics(t).netProfit < 0;
            if (pastPnlFilter === 'verified') return !!t.verified;
            return true;
        }
        const pnl = tradeCurrentReturn(t);
        const progress = tradeProgressPct(t);
        return [...perfSet].some((key) => {
            if (key === 'profit') return pnl >= 0;
            if (key === 'loss') return pnl < 0;
            if (key === 'verified') return !!t.verified;
            if (key === 'near_target') return progress != null && progress >= 70 && progress < 100;
            if (key === 'target_hit') return progress != null && progress >= 100;
            return false;
        });
    }

    function sortTradesList(trades, sortBy = tradeSortBy) {
        const list = [...trades];
        const cmpId = (a, b) => (a.id < b.id ? 1 : -1);
        list.sort((a, b) => {
            if (sortBy === 'company') {
                const c = String(a.company || '').localeCompare(String(b.company || ''), undefined, { sensitivity: 'base' });
                return c !== 0 ? c : cmpId(a, b);
            }
            if (sortBy === 'buyDate') {
                const ak = parseDateKey(a.buyDate) || '';
                const bk = parseDateKey(b.buyDate) || '';
                if (ak !== bk) return ak < bk ? 1 : -1;
                return cmpId(a, b);
            }
            if (sortBy === 'sellDate') {
                const ak = parseDateKey(a.sellDate) || '';
                const bk = parseDateKey(b.sellDate) || '';
                if (ak && bk) {
                    if (ak !== bk) return ak < bk ? 1 : -1;
                } else if (ak || bk) {
                    return ak ? -1 : 1;
                }
                const abuy = parseDateKey(a.buyDate) || '';
                const bbuy = parseDateKey(b.buyDate) || '';
                if (abuy !== bbuy) return abuy < bbuy ? 1 : -1;
                return cmpId(a, b);
            }
            if (sortBy === 'pnl' || sortBy === 'return') {
                const av = tradeCurrentReturn(a);
                const bv = tradeCurrentReturn(b);
                if (av !== bv) return bv - av;
                return cmpId(a, b);
            }
            const dayDiff = getDaysHeld(a) - getDaysHeld(b);
            if (dayDiff !== 0) return dayDiff;
            return cmpId(a, b);
        });
        return list;
    }

    function sortTradesByHoldDays(trades) {
        return sortTradesList(trades, 'holding');
    }

    function paintOpenTradeSummary(net, openCount, profitCount, lossCount, invested) {
        paintTradeRangeSummary({
            containerId: 'summaryOpenStats',
            wordsId: 'summaryNetWords',
            net,
            invested: invested != null ? invested : 0,
            holdings: openCount,
            usePortfolioLayout: true
        });
    }

    function isPlannedTrade(t) {
        return t.executed === false;
    }

    function isActiveOpenTrade(t) {
        return (t.status || 'closed') === 'open' && t.executed !== false;
    }

    function getTomorrowDateKey() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    // ---------- RENDER PLAN TRADES (removed — Watchlist replaces Plan) ----------

    // ---------- SEARCH SHEET (trades / watchlist / company pickers) ----------
    let searchSheetPane = null;
    let companySearchCooldownUntil = 0;

    function getSearchSheetPane() {
        if (!searchSheetPane) {
            const createPane = window.MTFComponents?.createAppPane;
            if (typeof createPane !== 'function') return null;
            searchSheetPane = createPane('#searchSheet', {
                // Higher stack than trade/app sheets so the search field
                // is not covered by the sheet underneath's drag handle.
                cssClass: 'app-sheet-pane app-sheet-pane--search',
                fullHeight: true,
                heightRatio: 1,
                topperOverflow: false
            });
        }
        return searchSheetPane;
    }

    function setSearchSheetTitle(title) {
        const el = document.getElementById('searchSheetTitle');
        if (el) el.textContent = title || 'Search';
    }

    function presentSearchSheet() {
        const pane = getSearchSheetPane();
        if (pane?.present) pane.present();
    }

    function openSearchPage() {
        const current = getCurrentAppPage().page;
        if (current === 'market') {
            openStockSearchSheet('watchlist');
            return;
        }
        stopTradeLiveRefresh();
        searchContext = current === 'past' || tradesViewMode === 'past' ? 'past' : 'trades';
        searchQuery = '';
        setSearchSheetTitle(searchContext === 'past' ? 'Search closed trades' : 'Search open trades');
        const input = document.getElementById('searchPageInput');
        if (input) {
            input.value = '';
            input.placeholder = 'Search by company name...';
            input.removeAttribute('readonly');
            input.oninput = null;
            input.setAttribute('oninput', 'runSearchPage(this.value)');
            input.onkeydown = null;
        }
        toggleClearBtn('searchPageClear', false);
        hideMarketAcList();
        presentSearchSheet();
        renderSearchResults();
        setTimeout(() => document.getElementById('searchPageInput')?.focus(), 80);
    }

    function openStockSearchSheet(mode) {
        searchContext = mode; // watchlist | tx-company | calc-company
        searchQuery = '';
        const titles = {
            watchlist: 'Add to watchlist',
            'tx-company': 'Select company',
            'calc-company': 'Select company'
        };
        setSearchSheetTitle(titles[mode] || 'Search stocks');
        if (mode === 'watchlist') stopMarketRefresh();
        loadStockCatalogFromInternet();

        const input = document.getElementById('searchPageInput');
        if (input) {
            input.value = '';
            input.placeholder = mode === 'watchlist'
                ? 'Search NSE stock to add…'
                : 'Search company name or symbol…';
            input.removeAttribute('readonly');
            // removeAttribute('oninput') clears the IDL handler — strip first, then assign.
            input.removeAttribute('oninput');
            input.oninput = () => onMarketSearchInput();
            input.onkeydown = (e) => onMarketSearchKeydown(e);
        }
        toggleClearBtn('searchPageClear', false);
        hideMarketAcList();
        const list = getMarketAcListEl();
        if (list) {
            list.innerHTML = `<div class="px-3 py-4 text-center text-muted small">Type a company name or symbol to search.</div>`;
        }
        presentSearchSheet();
        setTimeout(() => document.getElementById('searchPageInput')?.focus(), 80);
    }

    function openCompanySearchSheet(which) {
        if (Date.now() < companySearchCooldownUntil) return;
        const mode = which === 'calc' ? 'calc-company' : 'tx-company';
        // Avoid re-opening while the sheet is already up.
        if (getSearchSheetPane()?.isOpen?.() && (searchContext === 'tx-company' || searchContext === 'calc-company')) {
            document.getElementById('searchPageInput')?.focus();
            return;
        }
        openStockSearchSheet(mode);
    }

    function openMarketSearch() {
        openStockSearchSheet('watchlist');
    }
    window.openMarketSearch = openMarketSearch;

    function closeSearchPage() {
        const pane = getSearchSheetPane();
        if (pane?.isOpen?.()) pane.close();
        companySearchCooldownUntil = Date.now() + 450;
        try {
            document.getElementById('txCompany')?.blur();
            document.getElementById('calcCompany')?.blur();
        } catch (_) { }
        const input = document.getElementById('searchPageInput');
        if (input) {
            input.oninput = null;
            input.setAttribute('oninput', 'runSearchPage(this.value)');
            input.onkeydown = null;
            input.placeholder = 'Search by company name...';
            input.value = '';
        }
        hideMarketAcList();
        searchQuery = '';
        toggleClearBtn('searchPageClear', false);
        if (searchContext === 'watchlist') {
            try { startMarketRefresh(); } catch (_) { }
        } else if (searchContext === 'trades' || searchContext === 'past') {
            try { startTradeLiveRefresh(); } catch (_) { }
        }
    }

    function runSearchPage(value) {
        if (searchContext === 'watchlist' || searchContext === 'tx-company' || searchContext === 'calc-company') {
            onMarketSearchInput();
            return;
        }
        searchQuery = value || '';
        toggleClearBtn('searchPageClear', searchQuery.trim());
        renderSearchResults();
    }

    function clearSearchPage() {
        if (searchContext === 'watchlist' || searchContext === 'tx-company' || searchContext === 'calc-company') {
            clearMarketSearch();
            return;
        }
        searchQuery = '';
        const input = document.getElementById('searchPageInput');
        if (input) { input.value = ''; input.focus(); }
        toggleClearBtn('searchPageClear', false);
        renderSearchResults();
    }

    // renderSearchResults → features/common/search-page.js

    // ---------- TRADES VIEW MODE (Open / Closed) ----------
    function setTradesViewMode(mode) {
        // Plan removed — Watchlist replaces it. Remap legacy 'plan' → open.
        const next = mode === 'plan' ? 'trade'
            : (mode === 'past' ? 'past'
                : (mode === 'all' ? 'all'
                    : (mode === 'cancelled' ? 'cancelled' : 'trade')));
        if (next === 'cancelled') {
            tradeCancelledOnly = true;
            if (tradesViewMode !== 'past') {
                saveTradeListRangeForMode(tradesViewMode);
                tradesViewMode = 'past';
                loadTradeListRangeForMode(tradesViewMode);
            } else {
                tradesViewMode = 'past';
            }
        } else {
            tradeCancelledOnly = false;
            if (next !== tradesViewMode) {
                saveTradeListRangeForMode(tradesViewMode);
                tradesViewMode = next;
                loadTradeListRangeForMode(tradesViewMode);
            } else {
                tradesViewMode = next;
            }
        }
        renderCurrentView();
        const tradesPage = document.getElementById('page-trades');
        if (tradesPage && !tradesPage.classList.contains('d-none')) {
            updateAppHeader('page-trades');
            updateFabVisibility('trades');
            startTradeLiveRefresh();
        }
        
        // Update new compact header switch UI states
        const openBtn = document.getElementById('headerSwitchOpenBtn');
        const closeBtn = document.getElementById('headerSwitchCloseBtn');
        if (openBtn && closeBtn) {
            const isPast = tradesViewMode === 'past';
            
            // Open btn styles
            openBtn.classList.toggle('active', !isPast);
            openBtn.classList.toggle('text-body-secondary', isPast);
            openBtn.style.backgroundColor = isPast ? 'transparent' : 'var(--bs-body-bg)';
            openBtn.style.color = isPast ? '' : 'var(--bs-body-color)';
            openBtn.style.borderColor = isPast ? 'transparent' : 'var(--bs-border-color)';
            
            // Close btn styles
            closeBtn.classList.toggle('active', isPast);
            closeBtn.classList.toggle('text-body-secondary', !isPast);
            closeBtn.style.backgroundColor = isPast ? 'var(--bs-body-bg)' : 'transparent';
            closeBtn.style.color = isPast ? 'var(--bs-body-color)' : '';
            closeBtn.style.borderColor = isPast ? 'var(--bs-border-color)' : 'transparent';
        }
    }

    // renderCurrentView → features/positions/trades-page.js

    // ---------- PAST TRADES (LIST + DETAIL) ----------
    function ensureSharedTradeRange() {
        if (pastRangeDays === 'all') return;
        if (!pastFrom || !pastTo) {
            const state = defaultTradeListRange(tradesViewMode);
            pastRangeDays = state.key;
            pastFrom = state.from;
            pastTo = state.to;
            tradeListRanges[tradesViewMode === 'plan' ? 'plan' : (tradesViewMode === 'past' ? 'past' : 'trade')] = state;
            syncPastRangeInputs();
        }
    }

    function getPastFiltered() {
        const txs = getClosedTransactions();
        ensureSharedTradeRange();

        let filtered = txs.filter((t) => {
            if (tradeCancelledOnly) return (t.status || '') === 'cancelled';
            return (t.status || 'closed') === 'closed' && t.executed !== false;
        });

        if (pastFrom && pastTo) {
            const fromDate = new Date(pastFrom);
            const toDate = new Date(pastTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => {
                const key = parseDateKey(t.sellDate) || parseDateKey(t.buyDate);
                if (!key) return false;
                const d = new Date(key + 'T12:00:00');
                return d >= fromDate && d <= toDate;
            });
        }

        const pastQuery = pastSearchQuery.trim().toLowerCase();
        if (pastQuery) {
            filtered = filtered.filter(t => (t.company || '').toLowerCase().includes(pastQuery));
        }

        filtered = filtered.filter((t) => matchesHoldDaysFilter(t));
        filtered = filtered.filter((t) => matchesPerfFilters(t));
        filtered = sortTradesList(filtered);
        return filtered;
    }

    function setPastPnlFilter(value) {
        if (value === 'profit' || value === 'loss' || value === 'verified') {
            pastPnlFilter = value;
            tradePerfFilters = new Set([value]);
        } else {
            pastPnlFilter = 'all';
            tradePerfFilters = new Set();
        }
        if (isTradesPageVisible()) {
            renderCurrentView();
        } else {
            renderPastTrades();
        }
        if (isPastPageVisible()) startTradeLiveRefresh();
    }

    // renderPastTrades → features/positions/past-page.js





    // MTF Calculator → features/more/mtf-calculator-page.js

    // ---------- COPY TRANSACTION ----------
    async function copyTransaction(id) {
        const original = getTransaction(id);
        if (!original) { showToast('Transaction not found.', 'danger'); return; }
        const copyData = { ...original };
        delete copyData.id;
        delete copyData.verified;
        copyData.executed = true;
        const newTx = await addTransaction(copyData);
        showToast(`Copied trade: ${newTx.company}`, 'success');
        refreshTradeListViews();
        refreshTradeListViews();
        refreshActiveMoreView();
    }

    // ---------- SEARCH ----------
    function toggleClearBtn(btnId, hasValue) {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.toggle('d-none', !hasValue);
    }
    function setTradeSearch(value) {
        tradeSearchQuery = value || '';
        toggleClearBtn('tradeSearchClear', tradeSearchQuery.trim());
        renderCurrentView();
    }
    function clearTradeSearch() {
        tradeSearchQuery = '';
        const input = document.getElementById('tradeSearch');
        if (input) { input.value = ''; input.focus(); }
        toggleClearBtn('tradeSearchClear', false);
        renderCurrentView();
    }
    function setPastSearch(value) {
        pastSearchQuery = value || '';
        toggleClearBtn('pastSearchClear', pastSearchQuery.trim());
        renderPastTrades();
        if (isPastPageVisible()) startTradeLiveRefresh();
    }
    function clearPastSearch() {
        pastSearchQuery = '';
        const input = document.getElementById('pastSearch');
        if (input) { input.value = ''; input.focus(); }
        toggleClearBtn('pastSearchClear', false);
        renderPastTrades();
        if (isPastPageVisible()) startTradeLiveRefresh();
    }
    function setPlanSearch() { /* Plan removed */ }
    function clearPlanSearch() { /* Plan removed */ }

    // trade detail sheets → features/common/trade-*-sheet.js
    // ---------- INTEREST BREAKDOWN ----------
    function interestDetails(t) {
        const sellPrice = getEffectiveSellPrice(t);
        const calc = calculateTrade({ ...t, sellPrice });
        const cfg = BROKER_CONFIG[t.broker] || BROKER_CONFIG['Zerodha'];
        const mtf = calc.mtfAmount;
        const days = calcInterestDays(t.buyDate, t.sellDate);
        let dailyRate;
        if (t.broker === 'Dhan' && mtf > 0) {
            dailyRate = getDhanInterestRate(mtf);
        } else if (cfg.interestRatePerDay !== null && cfg.interestRatePerDay !== undefined) {
            dailyRate = cfg.interestRatePerDay;
        } else {
            dailyRate = 0;
        }
        return {
            mtf,
            days,
            dailyRate,
            annualRate: dailyRate * 365,
            perDayInterest: (mtf > 0 && dailyRate > 0)
                ? Math.round(mtf * dailyRate * 100) / 100
                : 0,
            interest: calc.interest,
            totalInvestment: calc.totalInvestment,
            ownMargin: calc.ownMargin,
            sameDay: parseDateKey(t.buyDate) === parseDateKey(t.sellDate) && !!t.buyDate
        };
    }


    // ---------- CONFIRMATION DIALOG (copy / edit / delete) ----------

    function confirmDelete(id) {
        const tx = getTransaction(id);
        const name = tx ? tx.company : 'this trade';
        confirmAction({
            title: '<i class="fas fa-exclamation-triangle me-2"></i>Delete Trade?',
            titleClass: 'text-danger',
            message: `Delete "${name}"? This action cannot be undone.`,
            confirmLabel: '<i class="fas fa-trash-alt me-1"></i> Delete',
            confirmClass: 'btn-error',
            onConfirm: async () => {
                await deleteTransaction(id);
                closeTradeModal();
                if (tradeDetailId && String(tradeDetailId) === String(id)) {
                    backFromTradeDetail();
                }
                refreshTradeListViews();
                renderMoney();
                refreshActiveMoreView();
                showToast(isSyncConnected() ? 'Trade deleted and synced.' : 'Trade deleted.', 'danger');
            }
        });
    }

    function confirmCopy(id) {
        const tx = getTransaction(id);
        const name = tx ? tx.company : 'this trade';
        confirmAction({
            title: '<i class="fas fa-copy me-2"></i>Copy Trade?',
            titleClass: 'text-success',
            message: `Create a duplicate of "${name}"?`,
            confirmLabel: '<i class="fas fa-copy me-1"></i> Copy',
            confirmClass: 'btn-success',
            onConfirm: () => copyTransaction(id)
        });
    }

    function confirmVerifyTrade(id) {
        const tx = getTransaction(id);
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const name = tx.company || 'this trade';
        const broker = tx.broker || 'broker';
        confirmAction({
            title: '<i class="fas fa-check-circle me-2"></i>Verify Trade?',
            titleClass: 'text-success',
            message: `Confirm that the P&L shown for "${name}" matches your ${broker} statement?`,
            confirmLabel: '<i class="fas fa-check-circle me-1"></i> Verified',
            confirmClass: 'btn-success',
            onConfirm: async () => {
                const saved = await updateTransaction(id, { verified: true });
                if (saved) {
                    showToast('Trade verified.', 'success');
                    renderPastTrades();
                } else {
                    showToast('Error verifying trade.', 'danger');
                }
            }
        });
    }

    function confirmExecuteTrade(id) {
        const tx = getTransaction(id);
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const name = tx.company || 'this trade';
        confirmAction({
            title: '<i class="fas fa-play me-2"></i>Execute Trade?',
            titleClass: 'text-success',
            message: `Move "${name}" from Plan to active Trades? This marks it as executed.`,
            confirmLabel: '<i class="fas fa-play me-1"></i> Executed',
            confirmClass: 'btn-success',
            onConfirm: async () => {
                const saved = await updateTransaction(id, { executed: true, status: 'open' });
                if (saved) {
                    showToast('Trade moved to Trades.', 'success');
                    refreshTradeListViews();
                } else {
                    showToast('Error executing trade.', 'danger');
                }
            }
        });
    }

    function confirmCloseTrade(id) {
        const tx = getTransaction(id);
        if (!tx) { showToast('Transaction not found.', 'danger'); return; }
        const name = tx.company || 'this trade';
        confirmAction({
            title: '<i class="fas fa-check-circle me-2"></i>Close Trade?',
            titleClass: 'text-success',
            message: `Move "${name}" to Past Trades? This will mark the trade as closed.`,
            confirmLabel: '<i class="fas fa-check me-1"></i> Move to Past',
            confirmClass: 'btn-success',
            onConfirm: async () => {
                const sellPrice = getEffectiveSellPrice(tx);
                const calc = calculateTrade({ ...tx, sellPrice, status: 'closed' });
                const targetPrice = Number(tx.sellPrice) || Number(tx.buyPrice) || 0;
                const quote = getTradeLiveQuote(tx.symbol || '');
                const livePrice = quote && quote.price != null ? Number(quote.price) : 0;

                const highestPriceDuringTrade = Math.max(
                    Number(tx.highestPrice) || 0,
                    Number(tx.buyPrice) || 0,
                    sellPrice || 0,
                    livePrice
                );
                const targetReachedBeforeClose = targetPrice > 0 && highestPriceDuringTrade >= targetPrice;

                const closedTx = {
                    ...tx,
                    status: 'closed',
                    sellPrice,
                    targetReachedBeforeClose,
                    highestPrice: highestPriceDuringTrade,
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
                
                const pb = document.createElement('div');
                pb.innerHTML = `<div class="progress" style="height: 4px; position: fixed; top: 0; left: 0; width: 100%; z-index: 1055;"><div class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width: 100%"></div></div>`;
                document.body.appendChild(pb);
                
                const db = global.MTFDb;
                let saved = false;
                try {
                    saved = await updateTransaction(id, closedTx);
                } catch (err) {
                    MTFLogger.error('Failed to close trade:', err);
                    saved = false;
                } finally {
                    if (pb.parentNode) pb.parentNode.removeChild(pb);
                }

                if (saved) {
                    showToast('Update is happened successfully in the database.', 'success');
                    backFromTradeDetail();
                    refreshTradeListViews();
                    renderMoney();
                    refreshActiveMoreView();
                } else {
                    showToast('Error closing trade.', 'danger');
                }
            }
        });
    }

    // ---------- MODAL HELPERS ----------
    // Dropdowns use Bootstrap data-bs-toggle (no custom init needed).

    // trade modal → features/common/trade-modal.js
    // ---------- SETTINGS ----------
    // renderSettings → features/more/settings-page.js

    function renderSyncStatus() {
        const statusEl = document.getElementById('cloudSyncStatus');
        const hintEl = document.getElementById('cloudSyncHint');
        const connectBtn = document.getElementById('syncConnectBtn');
        const disconnectBtn = document.getElementById('syncDisconnectBtn');
        const input = document.getElementById('syncCodeInput');
        if (!statusEl) return;

        if (!isFirebaseConfigured()) {
            setAppTagElement(statusEl, 'Not configured', 'default');
            if (hintEl) hintEl.textContent = 'Paste your Firebase config in shared/db/firebase-config.js to enable cloud sync. The app works offline until then.';
            if (connectBtn) connectBtn.disabled = true;
            if (disconnectBtn) disconnectBtn.classList.add('d-none');
            return;
        }
        if (connectBtn) connectBtn.disabled = false;

        const map = {
            connected: ['success', 'Connected'],
            connecting: ['warning', 'Connecting...'],
            error: ['error', 'Error'],
            off: ['default', 'Off']
        };
        const currentStatus = getSyncStatus();
        const currentCode = getSyncCode();
        const [variant, label] = map[currentStatus] || map.off;
        setAppTagElement(statusEl, label, variant);

        if (currentCode) {
            if (input && document.activeElement !== input) input.value = currentCode;
            if (disconnectBtn) disconnectBtn.classList.remove('d-none');
            if (hintEl) hintEl.textContent = 'Synced under code "' + currentCode + '". Use the same code on your other device.';
        } else {
            if (input && document.activeElement !== input && !input.value.trim()) {
                input.value = DEFAULT_SYNC_CODE;
            }
            if (disconnectBtn) disconnectBtn.classList.add('d-none');
            if (hintEl) hintEl.textContent = 'Default code is pre-filled. Just tap Connect (or change it if you use a different one).';
        }
    }

    function connectSyncFromInput() {
        const input = document.getElementById('syncCodeInput');
        connectSync(input ? input.value : '');
    }

    // TEMP DISABLED:
    // Permanent Delete is temporarily disabled.
    // Retained for future implementation.
    // Currently replaced by Soft Delete.
    /*
    function resetData() {
        const syncNote = getSyncCode() ? '<p class="small text-muted mb-2"><i class="fas fa-cloud me-1"></i>You are connected to Cloud Sync, so this will also delete the data on <span class="fw-medium text-body-secondary">all synced devices</span>.</p>' : '';
        AppDialog.open(
            '<span class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Reset All Data?</span>',
            `<p class="mb-2 fw-semibold text-body-secondary">This will permanently delete ALL your transactions.</p>
                    <p class="small text-muted mb-2">This action <span class="text-danger fw-semibold">cannot be undone</span>.</p>${syncNote}`,
            renderAppButtonRow('Cancel', 'Delete Everything', {
                cancelOnClick: 'closeDialog()',
                actionOnClick: 'performReset()',
                actionVariant: 'danger',
                actionLabelHtml: '<i class="fas fa-trash-alt me-1"></i> Delete Everything',
                cancelInForm: false
            })
        );
    }

    function performReset() {
        saveStorage({
            transactions: []
        });
        AppDialog.close();
        showToast('All data permanently deleted.', 'danger');
        refreshTradeListViews();
        renderSettings();
        refreshActiveMoreView();
    }
    */

    function resetData() {
        if (typeof hooks === 'function' && hooks().showToast) {
            hooks().showToast('Permanent reset is currently disabled.', 'warning');
        } else if (typeof showToast === 'function') {
            showToast('Permanent reset is currently disabled.', 'warning');
        }
    }

    function performReset() {}


    // ---------- INIT ----------
    function initApp() {
        BottomBar.mount(document.getElementById('bottomBarMount'), {
            onNavigate: navigateTo,
            onFabClick: openAddModal
        });
        BottomBar.setFabVisible(false);

        const marketQuotesList = document.getElementById('marketQuotesList');
        if (marketQuotesList && !marketQuotesList.dataset.buyBound) {
            marketQuotesList.dataset.buyBound = '1';
            marketQuotesList.addEventListener('click', onMarketQuotesListClick);
        }

        initModals();
        initCompanyAutocomplete();
        migrateChargeLogic();
        migrateTradeCompanySymbols();
        initDateFields();

        const pastDefault = defaultTradeListRange('past');
        tradeListRanges = {
            trade: { key: 'all', from: null, to: null },
            plan: { key: 'all', from: null, to: null },
            past: pastDefault
        };
        // Trades tab opens on Trade view — default range is All
        tradesViewMode = 'trade';
        loadTradeListRangeForMode('trade');

        tradeRangeDays = 'all';
        tradeFrom = null;
        tradeTo = null;
        setDateInputValue(document.getElementById('tradeFrom'), '');
        setDateInputValue(document.getElementById('tradeTo'), '');
        clearRangeButtonsActive('#tradeRangeButtons');

        if (!restoreNavState()) {
            navigateTo('trades');
            startTradeLiveRefresh();
        }

        setTxBroker('');

        setSyncHooks({
            showToast,
            showLoading,
            hideLoading,
            renderSettings,
            refreshAllViews,

            onRemoteApplied: () => {
                try { migrateTradeCompanySymbols(); } catch (_) { }
                try {
                    const data = getStorage();
                } catch (_) { }
            },
            migrateTradeCompanySymbols
        });
        try {
            const data = getStorage();
        } catch (_) { }
        initSyncOnLoad();

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                restoreNavStateIfNeeded();
                ensureLiveFeedsForVisiblePage();
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveNavState();
                return;
            }
            restoreNavStateIfNeeded();
            if (!document.getElementById('page-trades').classList.contains('d-none')) {
                renderCurrentView();
            }
            if (!document.getElementById('page-past').classList.contains('d-none')) {
                renderPastTrades();
            }
            if (!document.getElementById('page-market').classList.contains('d-none')) {
                try { renderMarketPage(); } catch (_) { }
            }

            refreshActiveMoreView();
            // iOS often suspends timers while backgrounded — restart feeds.
            ensureLiveFeedsForVisiblePage();
        });
    }

    async function fetchAppPermissions() {
        const defaultPerms = {
            localDbEnabled: true,
            activityLogMaster: true,
            activityLogDb: false,
            activityLogApp: true,
            activityLogTrace: false
        };
        
        let loadedPerms = null;
        try {
            const localRaw = localStorage.getItem('mtf_permissions');
            if (localRaw) {
                loadedPerms = JSON.parse(localRaw);
            }
        } catch (e) {
            // Ignore parse errors
        }
        
        window.AppPermissions = loadedPerms || defaultPerms;

        try {
            if (global.MTFDb && global.MTFDb.initFirebase()) {
                const fbDb = global.MTFDb.getFirebaseDb();
                const syncCode = localStorage.getItem('mtf_sync_code');
                if (fbDb && syncCode) {
                    const doc = await fbDb.collection('syncs').doc(syncCode).get();
                    if (doc.exists) {
                        const data = doc.data();
                        if (data && data.permissions && typeof data.permissions === 'object') {
                            window.AppPermissions = {
                                localDbEnabled: data.permissions.localDbEnabled ?? true,
                                activityLogMaster: data.permissions.activityLogMaster ?? true,
                                activityLogDb: data.permissions.activityLogDb ?? false,
                                activityLogApp: data.permissions.activityLogApp ?? true,
                                activityLogTrace: data.permissions.activityLogTrace ?? false
                            };
                            localStorage.setItem('mtf_permissions', JSON.stringify(window.AppPermissions));
                        }
                    }
                }
            }
        } catch (e) {
            if (global.MTFLogger && global.MTFLogger.warn) {
                global.MTFLogger.warn('Failed to fetch global permissions from Firestore:', e);
            }
            const bootText = document.getElementById('appBootLoaderText');
            if (bootText) {
                bootText.textContent = 'Offline/Error. Using secure defaults.';
                bootText.classList.replace('text-gr1', 'text-danger');
            }
            await new Promise(r => setTimeout(r, 1500));
        }

        const bootLoader = document.getElementById('appBootLoader');
        if (bootLoader) bootLoader.classList.add('d-none');
    }

    document.addEventListener('DOMContentLoaded', async function () {
        await fetchAppPermissions();
        initApp();
    });

    // Expose global functions
    global.MTFAppHelpers = {
        getDaysHeld,
        resolveTradeMetrics,
        interestDetails,
        ui: {
            statLabel: UI.statLabel,
            actionBtnSm: UI.actionBtnSm
        },
        appHeader: {
            moreFeatureMap: {  },
            moreFeatureTitles: {
            }
        },
        tradePages: {
            getTransactions,
            getOpenTransactions,
            getClosedTransactions,
            getFeed: (...args) => (window.MTFDb && window.MTFDb.getFeed ? window.MTFDb.getFeed(...args) : Promise.resolve([])),
            isPlannedTrade,
            isActiveOpenTrade,
            sortTradesByHoldDays,
            sortTradesList,
            matchesHoldDaysFilter,
            matchesPerfFilters,
            resolveTradeMetrics,
            getPastFiltered,
            ensureSharedTradeRange,
            getPlanSearchQuery: () => planSearchQuery,
            getTradeSearchQuery: () => tradeSearchQuery,
            getPastSearchQuery: () => pastSearchQuery,
            getSearchQuery: () => searchQuery,
            getSearchContext: () => searchContext,
            getTradeDetailId: () => tradeDetailId,
            getTransaction,
            resolveTradeForDisplay,
            getTradesViewMode: () => tradesViewMode,
            getTradeFrom: () => tradeFrom,
            getTradeTo: () => tradeTo,
            getPastFrom: () => pastFrom,
            getPastTo: () => pastTo,
            getPastPnlFilter: () => pastPnlFilter,
            getTradeCancelledOnly: () => tradeCancelledOnly,
            parseDateKey,
            resolveTradeLiveSymbol,
            getTradeLiveQuote,
            isTradeLiveRefreshing,
            getEffectiveSellPrice,
            estimateLiveSellReturn,
            fetchTradeCompanyInfo,
            getTradeCompanyInfoCached
        },
        marketPages: {
            getMarketQuotes,
            getMarketFilterQuery: () => marketFilterQuery,
            getMarketUpdatedAt: () => marketUpdatedAt,
            getMarketLoading: () => marketLoading,
            getMarketError: () => marketError,
            getMarketSubTab: () => marketSubTab,
            syncMarketSubTabUI
        },
        settingsPages: {
            getTransactions,
            renderSyncStatus
        },


        tradeSheets: {
            getTransaction,
            resolveTradeForDisplay,
            getEffectiveSellPrice,
            interestDetails,
            getChargeConfig,
            calcOrderBrokerage,
            calcInterestDays,
            getDaysHeld,
            parseDateKey,
            calculateTrade,
            updateTransaction,
            applyVerifiedReset,
            refreshTradeListViews,
            refreshActiveMoreView
        },
        tradeModal: {
            getTxModalContext: () => txModalContext,
            setTxModalContext: (v) => { txModalContext = v; },
            getTransaction,
            addTransaction,
            updateTransaction,
            calculateTrade,
            applyVerifiedReset,
            isPlannedTrade,
            getCurrentAppPage,
            getTradesViewMode: () => tradesViewMode,
            setTxBroker,
            resetCompanyAutocomplete,
            findStockMetaForCompany,
            setTxCompanyMeta,
            setTxCompanySearchLocked,
            resolveCompanyName,
            resolveCompanySymbol,
            getTomorrowDateKey,
            resetTxPriceAutoFlags,
            applySuggestedSellPrice,
            applySuggestedQty,
            fillTradeFormFromLivePrice,
            onTxBuyPriceInputForSuggest,
            onTxSellPriceInputManual,
            onTxQtyInputManual,
            onTxTradeDatesChangeForSuggest,
            getSyncNote: () => (isSyncConnected() ? ' and synced' : ''),
            refreshTradeListViews,
            refreshActiveMoreView,
            confirmDelete
        }
    };
    window.closeSheet = closeSheet;
    window.closeTradeModal = closeTradeModal;
    window.closeDialog = closeDialog;

    window.navigateTo = navigateTo;
    window.renderAppPage = renderAppPage;
    window.openTradeDetail = openTradeDetail;
    window.openPositionBySymbol = openPositionBySymbol;
    window.backFromTradeDetail = backFromTradeDetail;
    window.openMoreFeature = openMoreFeature;
    window.backToMoreHub = backToMoreHub;
    window.openAddModal = openAddModal;
    window.openBuyTradeFromMarket = openBuyTradeFromMarket;
    window.onTxStatusChange = onTxStatusChange;
    window.setTxFormStatus = setTxFormStatus;
    window.onTxLeverageInput = onTxLeverageInput;
    window.syncTxLeverageDisplay = syncTxLeverageDisplay;
    window.onTxCompanyInput = onTxCompanyInput;
    window.onTxCompanyKeydown = onTxCompanyKeydown;
    window.onTxCompanyFocus = onTxCompanyFocus;
    window.onTxCompanyBlur = onTxCompanyBlur;
    window.selectStockSymbol = selectStockSymbol;
    window.fillTradeFormFromLivePrice = fillTradeFormFromLivePrice;
    window.openEditModal = openEditModal;
    window.openViewModal = openTradeDetail;
    window.openViewFromEditor = openViewFromEditor;
    window.copyTransaction = copyTransaction;
    window.confirmCopy = confirmCopy;
    window.confirmVerifyTrade = confirmVerifyTrade;
    window.confirmExecuteTrade = confirmExecuteTrade;
    window.confirmCloseTrade = confirmCloseTrade;
    window.confirmDelete = confirmDelete;
    window.deleteTradeFromEditor = deleteTradeFromEditor;
    window.saveTransaction = saveTransaction;
    window.checkMarketFeed = checkMarketFeed;
    window.openSettingsPage = openSettingsPage;
    window.backFromSettings = backFromSettings;
    window.resetData = resetData;
    window.performReset = performReset;
    window.openTargetModal = openTargetModal;
    window.openBuyPriceModal = openBuyPriceModal;
    window.saveBuyPrice = saveBuyPrice;
    window.setTargetSellPct = setTargetSellPct;
    window.applyTargetSellPctCustom = applyTargetSellPctCustom;
    window.onTargetSellPriceInput = onTargetSellPriceInput;
    window.saveTargetSellPrice = saveTargetSellPrice;
    window.openHoldModal = openHoldModal;
    window.openLeverageModal = openLeverageModal;
    window.onLeverageModalInput = onLeverageModalInput;
    window.saveLeverage = saveLeverage;
    window.onHoldModalDateInput = onHoldModalDateInput;
    window.onHoldModalDaysInput = onHoldModalDaysInput;
    window.setHoldModalSameDay = setHoldModalSameDay;
    window.setHoldModalTodayPair = setHoldModalTodayPair;
    window.setHoldModalSellDateToday = setHoldModalSellDateToday;
    window.saveHoldDates = saveHoldDates;
    window.openChargesModal = openChargesModal;
    window.openInterestModal = openInterestModal;
    window.openCompanyInfoSheet = openCompanyInfoSheet;
    window.renderCurrentView = renderCurrentView;
    window.renderPastTrades = renderPastTrades;
    window.renderMarketPage = renderMarketPage;
    window.renderCalendarPage = renderCalendarPage;
    window.shiftCalendarMonth = shiftCalendarMonth;
    window.openCalendarMonthPicker = openCalendarMonthPicker;
    window.shiftCalendarPickerYear = shiftCalendarPickerYear;
    window.jumpCalendarMonth = jumpCalendarMonth;
    window.jumpCalendarToTodayMonth = jumpCalendarToTodayMonth;
    window.openCalendarDaySheet = openCalendarDaySheet;
    window.openCalendarMonthReport = openCalendarMonthReport;
    window.refreshMarketQuotes = refreshMarketQuotes;
    window.onMarketRefreshClick = onMarketRefreshClick;
    window.onAppHeaderRefreshClick = onAppHeaderRefreshClick;
    window.refreshTradeLivePricesNow = refreshTradeLivePricesNow;
    window.observeQuoteRows = observeQuoteRows;
    window.setMarketSubTab = setMarketSubTab;
    window.removeMarketWatchlistSymbol = removeMarketWatchlistSymbol;
    window.onMarketSearchInput = onMarketSearchInput;
    window.onMarketSearchKeydown = onMarketSearchKeydown;
    window.onMarketSearchFocus = onMarketSearchFocus;
    window.onMarketSearchBlur = onMarketSearchBlur;
    window.selectMarketSymbol = selectMarketSymbol;
    window.clearMarketSearch = clearMarketSearch;

    window.renderSettings = renderSettings;
    window.setTradeSearch = setTradeSearch;
    window.setTradesViewMode = setTradesViewMode;
    window.openSearchPage = openSearchPage;
    window.closeSearchPage = closeSearchPage;
    window.openCompanySearchSheet = openCompanySearchSheet;
    window.runSearchPage = runSearchPage;
    window.clearSearchPage = clearSearchPage;
    window.clearTradeSearch = clearTradeSearch;
    window.setPastSearch = setPastSearch;
    window.clearPastSearch = clearPastSearch;
    window.setPlanSearch = setPlanSearch;
    window.clearPlanSearch = clearPlanSearch;
    window.applyPastRangeFilter = applyPastRangeFilter;
    window.applyTradeFilters = applyTradeFilters;
    window.draftPastRange = draftPastRange;
    window.resetTradeFilterSheet = resetTradeFilterSheet;
    window.updateTradeFilterSummary = updateTradeFilterSummary;
    window.setTradeFilterCategory = setTradeFilterCategory;
    window.clearTradeFilterChip = clearTradeFilterChip;
    window.clearAllTradeFilterChips = clearAllTradeFilterChips;
    window.setPastRange = setPastRange;
    window.onPastFilterDateChange = onPastFilterDateChange;
    window.openFilterSheet = openFilterSheet;
    window.closeFilterSheet = closeFilterSheet;
    window.openTradeFilterSheet = openTradeFilterSheet;
    window.applyTradeRangeFilter = applyTradeRangeFilter;
    window.setTradeRange = setTradeRange;
    window.resetTradeFilters = resetTradeFilters;
    window.onTradeFilterDateChange = onTradeFilterDateChange;
    window.setPastPnlFilter = setPastPnlFilter;
    window.updatePreview = updatePreview;
    window.connectSyncFromInput = connectSyncFromInput;
    window.disconnectSync = disconnectSync;


})(typeof window !== 'undefined' ? window : globalThis);
