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

        (function(global) {
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
                updateAppHeader,
                renderPlanTrades,
                renderCurrentView,
                renderPastTrades,
                renderMarketPage,
                renderSearchResults,
                renderTransactions,
                renderSettings,
                renderSettingsMoneyAccounts,
                formatMoneyEntryTimeDisplay,
                sortMoneyEntries,
                renderMoney,
                renderAccountHistorySheet,
                renderMtfCalculator,
                updateMtfCalculator,
                setCalcSellPct,
                onCalcBuyPriceInput,
                onCalcSellPriceInput,
                addCalcSellPctPreset,
                onCalcDateInput,
                setCalcSameDay,
                setCalcTodayPair,
                openCalcBreakdownSheet,
                openViewModal,
                openChargesModal,
                openInterestModal,
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
                saveHoldDates,
                renderTxModalFooter,
                setTxModalMode,
                openViewFromEditor,
                deleteTradeFromEditor,
                onTxStatusChange,
                updatePreview,
                openAddModal,
                openEditModal,
                saveTransaction,
                initTradeModal,
                renderMoneyEntryFooter,
                openMoneyEntryModal,
                openEditMoneyEntryModal,
                saveMoneyEntry,
                onMoneyEntryTypeToggle,
                setMoneyEntryType,
                toggleMoneyEntryDateTimeEdit,
                onMoneyEntryDateTimeChange,
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
                card: 'card bg-base-100 rounded-2xl',
                statLabel: LABEL_CLASSES.stat,
                sheetLabel: LABEL_CLASSES.sheet,
                heroValue: 'font-bold text-6xl leading-none mb-3',
                iconBtn: ICON_BUTTON_CLASSES.default,
                toolbarRow: 'flex items-center gap-2 mb-3',
                toolbarInput: 'input input-bordered border-base-200 w-full rounded-full pl-10 pr-10 h-10 min-h-10 bg-base-100 focus:outline-none focus:border-primary/50 text-base-content/80 placeholder:text-base-content/40',
                toolbarIconBtn: 'btn btn-ghost border border-base-200 h-10 w-10 min-h-0 bg-base-100 rounded-xl focus:outline-none text-base-content/55 p-0',
                actionBtn: 'btn btn-sm min-h-0 h-9 w-9 rounded-xl p-0 flex items-center justify-center',
                actionBtnSm: 'btn btn-sm min-h-0 h-8 w-8 rounded-lg p-0 flex items-center justify-center',
                tradeStatBox: 'flex-1 bg-base-200/25 border border-base-200/60 rounded-xl p-2.5 text-center min-w-0',
                tradeStatLabel: LABEL_CLASSES.tradeStat,
                tradeStatValue: 'text-base font-semibold text-base-content/90 whitespace-nowrap tabular-nums tracking-tight mt-0.5',
                tradeStatValueSuccess: 'text-base font-semibold text-success whitespace-nowrap tabular-nums tracking-tight mt-0.5 inline-block rounded-lg px-1.5 py-0.5 bg-success/15',
                tradeStatValueError: 'text-base font-semibold text-error whitespace-nowrap tabular-nums tracking-tight mt-0.5 inline-block rounded-lg px-1.5 py-0.5 bg-error/15 gr-danger-soft-text',
                moneyTonePositive: 'bg-success/15 text-success',
                moneyToneNegative: 'bg-error/15 text-error',
                moneyActionDeposit: 'deposit-action-btn',
                moneyActionWithdraw: 'bg-error/15 text-error border-0 hover:bg-error/25',
                selectTrigger: DROPDOWN_CLASSES.selectTrigger,
                selectLabel: DROPDOWN_CLASSES.selectLabel,
                selectChevron: DROPDOWN_CLASSES.selectChevron,
                dropdownItemActive: DROPDOWN_CLASSES.itemActive,
                dropdownMenu: DROPDOWN_CLASSES.menu,
                menuIcon: menuIconClass,
                summaryCard(heroIcon, heroLabel, heroId, stats, cardId) {
                    const cols = stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
                    const statHtml = stats.map(s => `
                        <div><div class="${UI.statLabel}">${s.icon ? `<i class="fas ${s.icon} mr-1"></i>` : ''}${s.label}</div>
                        <div class="font-medium ${s.cls || 'text-base-content/80'}" ${s.id ? `id="${s.id}"` : ''}>${s.value ?? '0'}</div></div>`).join('');
                    return `<div class="${UI.card} mb-3" ${cardId ? `id="${cardId}"` : ''}>
                        <div class="card-body text-center py-4">
                            <div class="${UI.statLabel}"><i class="fas ${heroIcon} mr-1"></i>${heroLabel}</div>
                            <div class="${UI.heroValue} ${heroId.includes('Net') || heroId.includes('Value') ? 'text-success' : 'text-base-content/85'}" id="${heroId}">₹0</div>
                            <div class="grid ${cols} gap-2">${statHtml}</div>
                        </div></div>`;
                },
                searchBar(inputId, clearId, placeholder, onInput, onClear, extraClass = '') {
                    return renderSearchBar({ inputId, clearId, placeholder, onInput, onClear, extraClass });
                },
                subHeader(title, backFn, icon = '') {
                    return `<div class="flex items-center gap-3 mb-4">
                        <button type="button" class="${UI.iconBtn} w-9 h-9 min-h-0" onclick="${backFn}()" aria-label="Back"><i class="fas fa-arrow-left"></i></button>
                        <h6 class="font-semibold text-base-content/80 mb-0">${icon ? `<i class="fas ${icon} mr-2"></i>` : ''}${title}</h6></div>`;
                },
                detailRow(label, value, extra = '') {
                    return renderDetailRow(label, value, extra);
                },
                emptyState(icon, msg) {
                    return renderEmptyState(icon, msg);
                },
                sheetDialog: 'modal modal-bottom justify-items-center items-end fixed inset-0 w-full max-w-none h-full m-0 p-0',
                sheetBox: 'modal-box w-full max-w-[480px] !max-w-[480px] p-0 rounded-t-3xl bg-base-100 border border-base-200',
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
                    brokeragePct: 0,
                    brokerageCap: 0,
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
                } catch (_) {}
            }

            function loadStockCatalogCache() {
                try {
                    const raw = localStorage.getItem(STOCK_CACHE_KEY);
                    if (!raw) return null;
                    const data = JSON.parse(raw);
                    if (Array.isArray(data.symbols) && data.symbols.length > 100) return data.symbols;
                } catch (_) {}
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
                setStockCatalogStatus(`${symbols.length.toLocaleString()} NSE stocks loaded live — type to search`);
                return true;
            }

            async function fetchViaJina(targetUrl) {
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
                try {
                    const res = await fetch(NSE_EQUITY_CSV_URL, {
                        headers: { Accept: 'text/csv,*/*' },
                        mode: 'cors'
                    });
                    if (res.ok) {
                        const text = await res.text();
                        if (text.includes('SYMBOL,NAME OF COMPANY')) return { text, source: 'NSE direct' };
                    }
                } catch (_) {}
                const proxied = await fetchViaJina(NSE_EQUITY_CSV_URL);
                return { text: proxied, source: 'NSE via internet' };
            }

            async function loadStockCatalogFromInternet() {
                if (stockCatalogLoading || stockCatalogLoaded) return stockCatalogLoaded;
                stockCatalogLoading = true;
                setStockCatalogStatus('Fetching NSE stock list from internet…');
                try {
                    const { text, source } = await fetchNseEquityCsvText();
                    const parsed = parseNseEquityCsv(text);
                    if (parsed.length > 500) {
                        applyStockCatalog(parsed, source);
                        return true;
                    }
                } catch (e) {
                    console.warn('NSE catalog fetch failed', e);
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
                list.innerHTML = `<div class="px-3 py-2 text-sm text-base-content/60"><i class="fas fa-spinner fa-spin mr-1"></i>${escapeHtml(msg || 'Searching…')}</div>`;
                list.classList.remove('hidden');
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
                                list.innerHTML = `<div class="px-3 py-2 text-sm text-base-content/60">Could not reach market data. Check internet and try again, or type the name manually.</div>`;
                                list.classList.remove('hidden');
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
                    list.classList.add('hidden');
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
                        ? `<div class="px-3 py-2 text-sm text-base-content/60">No match for “${escapeHtml(q)}”. You can still type any name.</div>`
                        : '';
                    list.classList.toggle('hidden', q.length < 1);
                    return;
                }

                list.innerHTML = stockAcResults.map((it, idx) => {
                    const meta = it.sector
                        ? `${escapeHtml(it.sector)}${it.industry ? ' · ' + escapeHtml(it.industry) : ''} · ${escapeHtml(it.e || 'NSE')}`
                        : (it.i ? `${escapeHtml(it.i)} · ${escapeHtml(it.e || 'NSE')}` : escapeHtml(it.e || 'NSE'));
                    const activeCls = idx === stockAcActiveIdx ? ' bg-base-200' : '';
                    return `
                    <div class="px-3 py-2 cursor-pointer hover:bg-base-200 border-b border-base-200 last:border-0${activeCls}" role="option" data-idx="${idx}" onmousedown="selectStockSymbol(${idx})">
                        <div class="font-medium text-base-content/80 text-sm">${escapeHtml(it.s)}</div>
                        <div class="text-sm">${escapeHtml(it.n)}</div>
                        <div class="text-xs text-base-content/60">${meta}</div>
                    </div>`;
                }).join('');
                list.classList.remove('hidden');
            }

            function escapeHtml(str) {
                return String(str || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function setTxCompanyMeta(meta) {
                selectedStockMeta = meta;
                const el = document.getElementById('txCompanyMeta');
                if (!el) return;
                if (!meta) {
                    el.classList.add('hidden');
                    el.textContent = '';
                    return;
                }
                el.classList.remove('hidden');
                const extra = meta.sector ? ` · ${meta.sector}` : (meta.i ? ` · ${meta.i}` : '');
                el.textContent = `${meta.s} · ${meta.e || 'NSE'}${extra}`;
            }

            function selectStockSymbol(idx) {
                const item = stockAcResults[idx];
                if (!item) return;
                if (stockAcBlurTimer) clearTimeout(stockAcBlurTimer);
                document.getElementById('txCompany').value = item.n;
                setTxCompanyMeta(item);
                hideCompanyAcList();
            }

            function onTxCompanyInput() {
                setTxCompanyMeta(null);
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
                if (!list || list.classList.contains('hidden') || !stockAcResults.length) return;
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
                    el.classList.toggle('bg-primary/10', i === stockAcActiveIdx);
                    if (i === stockAcActiveIdx) el.scrollIntoView({ block: 'nearest' });
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
                clearTimeout(stockSearchTimer);
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
                } catch (_) {}

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
                    try { localStorage.setItem(TRADE_SYMBOL_MIGRATE_KEY, '1'); } catch (_) {}
                    console.info(`Migrated company/symbol on ${changed} trade(s)`);
                    try { refreshTradeListViews(); } catch (_) {}
                } else {
                    try { localStorage.setItem(TRADE_SYMBOL_MIGRATE_KEY, '1'); } catch (_) {}
                }
                return changed;
            }

            // ---------- MARKET QUOTES (live Yahoo chart via Jina fallback) ----------
            const YAHOO_CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
            const MARKET_REFRESH_MS = 60000;

            let marketQuoteCache = {};
            let marketUpdatedAt = null;
            let marketLoading = false;
            let marketError = '';
            let marketFilterQuery = '';
            let marketSubTab = 'in-trade';
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
                const list = getStorage().marketWatchlist || [];
                return list.map((item) => ({
                    s: normalizeMarketSymbol(item.s),
                    n: item.n || item.s,
                    extra: true
                })).filter((item) => item.s);
            }

            function addToMarketWatchlist(item) {
                if (!item || !item.s) return Promise.resolve(null);
                const key = normalizeMarketSymbol(item.s);
                if (!key) return Promise.resolve(null);
                const data = getStorage();
                const list = Array.isArray(data.marketWatchlist) ? data.marketWatchlist.slice() : [];
                const existing = list.find((x) => normalizeMarketSymbol(x.s) === key);
                if (existing) {
                    existing.n = item.n || existing.n || key;
                } else {
                    list.unshift({ s: key, n: item.n || key });
                }
                data.marketWatchlist = list;
                return saveStorage(data).then(() => ({ s: key, n: item.n || key }));
            }

            function removeFromMarketWatchlist(symbol) {
                const key = normalizeMarketSymbol(symbol);
                if (!key) return Promise.resolve(null);
                const data = getStorage();
                data.marketWatchlist = (data.marketWatchlist || []).filter(
                    (x) => normalizeMarketSymbol(x.s) !== key
                );
                return saveStorage(data);
            }

            function removeMarketWatchlistSymbol(symbol) {
                return removeFromMarketWatchlist(symbol).then(() => {
                    try { renderMarketPage(); } catch (_) {}
                    return refreshMarketQuotes();
                });
            }

            function getPortfolioMarketSymbols() {
                const txs = getTransactions();
                const out = [];
                const seen = new Set();
                txs.forEach((t) => {
                    if (!isActiveOpenTrade(t) && !isPlannedTrade(t)) return;
                    let sym = normalizeMarketSymbol(t.symbol || '');
                    let name = t.company || '';
                    if (!sym) {
                        const mapped = lookupTradeFeedMapping(t.company || '');
                        if (mapped) {
                            sym = mapped.symbol;
                            name = mapped.company;
                        }
                    }
                    if (!sym) {
                        const meta = findStockMetaForCompany(t.company || '');
                        sym = meta ? meta.s : '';
                        name = meta ? meta.n : (t.company || '');
                    }
                    if (!sym) {
                        const raw = String(t.company || '').trim().toUpperCase();
                        if (/^[A-Z0-9&.-]{1,20}$/.test(raw)) {
                            sym = raw;
                            name = t.company || raw;
                        }
                    }
                    if (!sym) return;
                    const key = normalizeMarketSymbol(sym);
                    if (seen.has(key)) return;
                    seen.add(key);
                    out.push({ s: key, n: name, pinned: true });
                });
                return out;
            }

            function getMarketUniverse() {
                if (marketSubTab === 'watchlist') {
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
                return getPortfolioMarketSymbols().map((item) => {
                    const catalog = findStockMetaForSymbol(item.s);
                    return {
                        s: item.s,
                        n: item.n || (catalog && catalog.n) || item.s,
                        pinned: true,
                        extra: false,
                        removable: false
                    };
                });
            }

            function syncMarketSubTabUI() {
                document.querySelectorAll('[data-market-tab]').forEach((btn) => {
                    const active = btn.dataset.marketTab === marketSubTab;
                    btn.classList.toggle('market-subtabs__btn--active', active);
                    btn.setAttribute('aria-selected', active ? 'true' : 'false');
                });
                const input = document.getElementById('marketSearchInput');
                if (input) {
                    input.placeholder = marketSubTab === 'watchlist'
                        ? 'Search NSE stock to add…'
                        : 'Filter by name or symbol…';
                }
            }

            function setMarketSubTab(tab) {
                marketSubTab = tab === 'watchlist' ? 'watchlist' : 'in-trade';
                marketFilterQuery = '';
                hideMarketAcList();
                const input = document.getElementById('marketSearchInput');
                if (input) input.value = '';
                const clearBtn = document.getElementById('marketSearchClear');
                if (clearBtn) clearBtn.classList.add('hidden');
                syncMarketSubTabUI();
                try { renderMarketPage(); } catch (_) {}
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
            const QUOTE_FRESH_MS = 60000;
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
                if (page && page.classList.contains('hidden')) return false;
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
                    try { paintMarketQuotes(); } catch (_) {}
                }
                if (isTradeLivePageVisible()) {
                    try { paintTradeLivePrices(); } catch (_) {}
                }
            }

            function paintMarketQuotes() {
                if (!isMarketPageVisible()) return;
                const formatChangePct = (window.MTFComponents && window.MTFComponents.formatChangePct) || null;
                const formatChangeAbs = (window.MTFComponents && window.MTFComponents.formatChangeAbs) || null;
                document.querySelectorAll('.market-quote-row[data-quote-symbol]').forEach((el) => {
                    const sym = getQuoteSymbolFromEl(el);
                    const q = marketQuoteCache[sym];
                    if (!q) return;
                    const change = Number(q.change);
                    const changePct = Number(q.changePct);
                    const hasChange = !isNaN(change);
                    const tone = !hasChange ? 'neutral' : change >= 0 ? 'up' : 'down';
                    const priceEl = el.querySelector('.market-quote-row__price');
                    const changeEl = el.querySelector('.market-quote-row__change');
                    const iconEl = el.querySelector('.market-quote-row__icon');
                    if (priceEl) {
                        priceEl.textContent = q.price == null || isNaN(Number(q.price))
                            ? '—'
                            : '₹' + Number(q.price).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                    }
                    if (changeEl) {
                        changeEl.textContent = hasChange && formatChangeAbs && formatChangePct
                            ? `${formatChangeAbs(change)} (${formatChangePct(changePct)})`
                            : '—';
                        changeEl.classList.remove(
                            'market-quote-row__change--up',
                            'market-quote-row__change--down',
                            'market-quote-row__change--neutral'
                        );
                        changeEl.classList.add(`market-quote-row__change--${tone}`);
                    }
                    if (iconEl) {
                        iconEl.classList.remove(
                            'market-quote-row__icon--up',
                            'market-quote-row__icon--down',
                            'market-quote-row__icon--neutral'
                        );
                        iconEl.classList.add(`market-quote-row__icon--${tone}`);
                    }
                });
                const statusEl = document.getElementById('marketUpdatedAt');
                if (statusEl && marketUpdatedAt && !marketLoading) {
                    try {
                        const d = new Date(marketUpdatedAt);
                        if (!isNaN(d.getTime())) {
                            statusEl.textContent = 'Updated ' + d.toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                            });
                        }
                    } catch (_) {}
                }
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
                if (!quote || !quote.symbol) return;
                const key = normalizeMarketSymbol(quote.symbol);
                const existing = marketQuoteCache[key];
                // Never replace a good cached price with a failed/empty result.
                if (!isValidMarketQuote(quote) && isValidMarketQuote(existing)) return;
                marketQuoteCache[key] = quote;
            }

            function getMarketQuotes() {
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

            async function refreshMarketQuotes(opts) {
                const silent = opts && opts.silent;
                const force = !(opts && opts.silent) || !!(opts && opts.force);
                if (marketLoading) return;
                marketLoading = true;
                marketError = '';
                if (!silent) {
                    try { renderMarketPage(); } catch (_) {}
                    observeQuoteRows();
                }
                try {
                    loadStockCatalogFromInternet();
                    observeQuoteRows();
                    const items = getVisibleQuoteItems();
                    if (!items.length) {
                        marketUpdatedAt = marketUpdatedAt || new Date().toISOString();
                        marketError = '';
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
                    } else {
                        marketError = '';
                    }
                } catch (e) {
                    marketError = 'Could not reach market data. Check internet and try again.';
                    console.warn('Market quote refresh failed', e);
                } finally {
                    marketLoading = false;
                    try { renderMarketPage(); } catch (_) {}
                    observeQuoteRows();
                }
            }

            function stopMarketRefresh() {
                if (marketRefreshTimer) {
                    clearInterval(marketRefreshTimer);
                    marketRefreshTimer = null;
                }
            }

            function startMarketRefresh() {
                stopMarketRefresh();
                syncMarketSubTabUI();
                try { renderMarketPage(); } catch (_) {}
                observeQuoteRows();
                refreshMarketQuotes();
                marketRefreshTimer = setInterval(() => {
                    const page = document.getElementById('page-market');
                    if (!page || page.classList.contains('hidden')) {
                        stopMarketRefresh();
                        return;
                    }
                    observeQuoteRows();
                    refreshMarketQuotes({ silent: true, force: false });
                }, MARKET_REFRESH_MS);
            }

            let tradeLiveRefreshTimer = null;
            let tradeLiveRetryTimer = null;
            let tradeLiveRefreshing = false;
            let tradeLiveRetryPending = false;
            let tradeLiveRefreshSeq = 0;

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

            function getTradeLiveQuote(symbol) {
                const key = normalizeMarketSymbol(symbol);
                return key ? (marketQuoteCache[key] || null) : null;
            }

            function isTradeLiveRefreshing() {
                return !!(tradeLiveRefreshing || tradeLiveRetryPending);
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
                document.querySelectorAll('[data-live-symbol]').forEach((el) => {
                    const symbol = el.dataset.liveSymbol || '';
                    const tradeId = el.dataset.tradeId || '';
                    const quote = getTradeLiveQuote(symbol);
                    const priceEl = el.querySelector('.trade-list-item__live-price');
                    const valueEl = el.querySelector('.trade-list-item__live-price-value');
                    const targetEl = el.querySelector('.trade-list-item__live-target');
                    const targetValueEl = el.querySelector('.trade-list-item__live-target-value');
                    const returnEl = el.querySelector('.trade-list-item__live-return');
                    const returnValueEl = el.querySelector('.trade-list-item__live-return-value');
                    const hasPrice = isValidMarketQuote(quote);
                    const livePrice = hasPrice ? Number(quote.price) : null;
                    const change = hasPrice ? Number(quote.change) : NaN;
                    const tone = !hasPrice || isNaN(change)
                        ? 'neutral'
                        : change >= 0 ? 'up' : 'down';
                    const targetPrice = Number(el.dataset.targetPrice);
                    const hasTarget = targetPrice > 0;
                    let gapTone = 'neutral';
                    let gapHtml = '—';
                    if (hasPrice && hasTarget) {
                        const signedDiff = targetPrice - livePrice;
                        const signedPct = (signedDiff / livePrice) * 100;
                        const diff = Math.abs(signedDiff);
                        const pct = Math.abs(signedPct);
                        const diffText = diff.toLocaleString('en-IN', {
                            minimumFractionDigits: diff % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2
                        });
                        // Percentage plain; ₹ difference in orange pill
                        const overshootSign = signedDiff < -0.005 ? '+' : '';
                        gapHtml = `${pct.toFixed(2)}% <span class="trade-list-item__live-target-pipe" aria-hidden="true">|</span> <span class="trade-list-item__live-target-diff">${overshootSign}₹${diffText}</span>`;
                        // Still below target (distance remaining) → down; already at/above target → up
                        if (Math.abs(signedPct) >= 0.005) gapTone = signedPct > 0 ? 'down' : 'up';
                    }

                    const tx = tradeId ? getTransaction(tradeId) : null;
                    const liveReturn = hasPrice && tx ? estimateLiveSellReturn(tx, livePrice) : null;
                    let returnTone = 'neutral';
                    if (liveReturn != null && !isNaN(Number(liveReturn)) && Math.abs(Number(liveReturn)) >= 0.005) {
                        returnTone = Number(liveReturn) >= 0 ? 'up' : 'down';
                    }
                    const returnText = formatTradeLiveReturnText(liveReturn);

                    const refreshing = !!(tradeLiveRefreshing || tradeLiveRetryPending);

                    if (priceEl) {
                        priceEl.classList.remove(
                            'trade-list-item__live-price--up',
                            'trade-list-item__live-price--down',
                            'trade-list-item__live-price--neutral',
                            'trade-list-item__live-price--loading'
                        );
                        priceEl.classList.add(`trade-list-item__live-price--${tone}`);
                    }
                    if (targetEl) {
                        targetEl.classList.remove(
                            'trade-list-item__live-target--up',
                            'trade-list-item__live-target--down',
                            'trade-list-item__live-target--neutral',
                            'trade-list-item__live-target--loading'
                        );
                        targetEl.classList.add(`trade-list-item__live-target--${gapTone}`);
                    }
                    if (returnEl) {
                        returnEl.classList.remove(
                            'trade-list-item__live-return--up',
                            'trade-list-item__live-return--down',
                            'trade-list-item__live-return--neutral',
                            'trade-list-item__live-return--loading'
                        );
                        returnEl.classList.add(`trade-list-item__live-return--${returnTone}`);
                    }

                    // Always show a visible refresh indicator while fetching.
                    if (refreshing) {
                        if (priceEl) priceEl.classList.add('trade-list-item__live-price--loading');
                        if (targetEl) targetEl.classList.add('trade-list-item__live-target--loading');
                        if (returnEl) returnEl.classList.add('trade-list-item__live-return--loading');
                        if (valueEl) {
                            valueEl.innerHTML = hasPrice
                                ? `${formatTradeLivePriceText(quote)} <i class="fas fa-spinner fa-spin trade-list-item__live-refresh-icon" aria-hidden="true"></i>`
                                : '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
                        }
                        if (targetValueEl) {
                            targetValueEl.innerHTML = hasPrice
                                ? `${gapHtml} <i class="fas fa-spinner fa-spin trade-list-item__live-refresh-icon" aria-hidden="true"></i>`
                                : '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
                        }
                        if (returnValueEl) {
                            returnValueEl.innerHTML = hasPrice && liveReturn != null
                                ? `${returnText} <i class="fas fa-spinner fa-spin trade-list-item__live-refresh-icon" aria-hidden="true"></i>`
                                : '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i>';
                        }
                        return;
                    }

                    if (valueEl) valueEl.textContent = formatTradeLivePriceText(quote);
                    if (targetValueEl) targetValueEl.innerHTML = hasPrice ? gapHtml : '—';
                    if (returnValueEl) returnValueEl.textContent = hasPrice ? returnText : '—';
                });
            }

            function isTradesPageVisible() {
                const page = document.getElementById('page-trades');
                return !!(page && !page.classList.contains('hidden'));
            }

            function isPastPageVisible() {
                const page = document.getElementById('page-past');
                return !!(page && !page.classList.contains('hidden'));
            }

            function isMarketPageVisible() {
                const page = document.getElementById('page-market');
                return !!(page && !page.classList.contains('hidden'));
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

                const txs = getTransactions();
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
                    paintTradeLivePrices();
                    return;
                }

                const seq = ++tradeLiveRefreshSeq;
                tradeLiveRefreshing = true;
                paintTradeLivePrices();

                try {
                    loadStockCatalogFromInternet();
                    if (seq !== tradeLiveRefreshSeq) return;
                    const pending = force
                        ? items.slice()
                        : items.filter((item) => !isFreshMarketQuote(marketQuoteCache[item.s]));
                    if (pending.length) {
                        tradeLiveRetryPending = true;
                        await Promise.all(pending.map((item) => enqueueQuoteFetch(item, { force })));
                    }
                } catch (e) {
                    console.warn('Trade live price refresh failed', e);
                } finally {
                    if (seq === tradeLiveRefreshSeq) {
                        tradeLiveRefreshing = false;
                        const stillMissing = items.filter((item) => !isValidMarketQuote(marketQuoteCache[item.s]));
                        tradeLiveRetryPending = stillMissing.length > 0;
                        paintTradeLivePrices();
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
                paintTradeLivePrices();
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

            function refreshTradeLivePricesNow() {
                if (!isTradeLivePageVisible()) return;
                // Cancel any in-flight refresh so a manual tap always restarts.
                tradeLiveRefreshSeq += 1;
                tradeLiveRefreshing = false;
                clearTradeLiveRetry();
                observeQuoteRows();
                refreshTradeLivePrices({ force: true });
            }

            function hideMarketAcList() {
                const list = document.getElementById('marketAcList');
                if (list) {
                    list.classList.add('hidden');
                    list.innerHTML = '';
                }
                marketAcResults = [];
                marketAcActiveIdx = -1;
            }

            function showMarketAcLoading(msg) {
                const list = document.getElementById('marketAcList');
                if (!list) return;
                list.innerHTML = `<div class="px-3 py-2 text-sm text-base-content/60"><i class="fas fa-spinner fa-spin mr-1"></i>${escapeHtml(msg || 'Searching…')}</div>`;
                list.classList.remove('hidden');
            }

            function renderMarketAcList(items) {
                const list = document.getElementById('marketAcList');
                const input = document.getElementById('marketSearchInput');
                if (!list || !input) return;
                marketAcResults = items || [];
                marketAcActiveIdx = marketAcResults.length ? 0 : -1;

                if (!marketAcResults.length) {
                    const q = (input.value || '').trim();
                    list.innerHTML = q.length
                        ? `<div class="px-3 py-2 text-sm text-base-content/60">No match for “${escapeHtml(q)}”.</div>`
                        : '';
                    list.classList.toggle('hidden', q.length < 1);
                    return;
                }

                list.innerHTML = marketAcResults.map((it, idx) => {
                    const meta = it.sector
                        ? `${escapeHtml(it.sector)}${it.industry ? ' · ' + escapeHtml(it.industry) : ''} · ${escapeHtml(it.e || 'NSE')}`
                        : escapeHtml(it.e || 'NSE');
                    const activeCls = idx === marketAcActiveIdx ? ' bg-base-200' : '';
                    return `
                    <div class="px-3 py-2 cursor-pointer hover:bg-base-200 border-b border-base-200 last:border-0${activeCls}" role="option" data-idx="${idx}" onmousedown="selectMarketSymbol(${idx})">
                        <div class="font-medium text-base-content/80 text-sm">${escapeHtml(it.s)}</div>
                        <div class="text-sm">${escapeHtml(it.n)}</div>
                        <div class="text-xs text-base-content/60">${meta}</div>
                    </div>`;
                }).join('');
                list.classList.remove('hidden');
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
                            const list = document.getElementById('marketAcList');
                            if (list) {
                                list.innerHTML = `<div class="px-3 py-2 text-sm text-base-content/60">Could not reach market data. Check internet and try again.</div>`;
                                list.classList.remove('hidden');
                            }
                        }
                    }
                } else if (stockCatalogLoaded) {
                    if (seq === marketSearchSeq) renderMarketAcList(searchStockSymbolsLocal(q, 12));
                }
            }

            function onMarketSearchInput() {
                const input = document.getElementById('marketSearchInput');
                const q = (input && input.value || '').trim();
                const clearBtn = document.getElementById('marketSearchClear');
                if (clearBtn) clearBtn.classList.toggle('hidden', !q);

                if (marketSubTab === 'in-trade') {
                    marketFilterQuery = (input && input.value) || '';
                    hideMarketAcList();
                    try { renderMarketPage(); } catch (_) {}
                    return;
                }

                clearTimeout(marketSearchTimer);
                if (q.length < 1) {
                    hideMarketAcList();
                    return;
                }
                marketSearchTimer = setTimeout(() => runMarketStockSearch(q), 300);
            }

            function onMarketSearchFocus() {
                if (marketSubTab !== 'watchlist') return;
                const input = document.getElementById('marketSearchInput');
                const q = (input && input.value || '').trim();
                if (q.length >= 1) runMarketStockSearch(q);
            }

            function onMarketSearchBlur() {
                marketAcBlurTimer = setTimeout(() => hideMarketAcList(), 150);
            }

            function onMarketSearchKeydown(e) {
                if (marketSubTab !== 'watchlist') {
                    if (e.key === 'Escape') {
                        clearMarketSearch();
                    }
                    return;
                }
                const list = document.getElementById('marketAcList');
                if (!list || list.classList.contains('hidden') || !marketAcResults.length) {
                    if (e.key === 'Escape') hideMarketAcList();
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
                    hideMarketAcList();
                }
            }

            function selectMarketSymbol(idx) {
                if (marketSubTab !== 'watchlist') return;
                const item = marketAcResults[idx];
                if (!item) return;
                if (marketAcBlurTimer) clearTimeout(marketAcBlurTimer);
                hideMarketAcList();
                const input = document.getElementById('marketSearchInput');
                if (input) input.value = '';
                const clearBtn = document.getElementById('marketSearchClear');
                if (clearBtn) clearBtn.classList.add('hidden');
                addToMarketWatchlist(item).then(() => {
                    try { renderMarketPage(); } catch (_) {}
                    return refreshMarketQuotes();
                });
            }

            function clearMarketSearch() {
                const input = document.getElementById('marketSearchInput');
                if (input) {
                    input.value = '';
                    input.focus();
                }
                const clearBtn = document.getElementById('marketSearchClear');
                if (clearBtn) clearBtn.classList.add('hidden');
                hideMarketAcList();
                if (marketSubTab === 'in-trade') {
                    marketFilterQuery = '';
                    try { renderMarketPage(); } catch (_) {}
                }
            }

            function refreshAllViews() {
                try { renderPlanTrades(); } catch (_) {}
                try { renderCurrentView(); } catch (_) {}
                try { renderPastTrades(); } catch (_) {}
                try { renderMoney(); } catch (_) {}
                try { renderSettings(); } catch (_) {}
                try { refreshActiveMoreView(); } catch (_) {}
                ensureLiveFeedsForVisiblePage();
            }

            function refreshTradeListViews() {
                try { renderPlanTrades(); } catch (_) {}
                try { renderCurrentView(); } catch (_) {}
                try { renderPastTrades(); } catch (_) {}
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

            function refreshActiveMoreView() {
                const txPage = document.getElementById('page-transactions');
                const calcPage = document.getElementById('page-mtf-calc');
                if (txPage && !txPage.classList.contains('hidden') && txPage.offsetParent !== null) renderTransactions();
                if (calcPage && !calcPage.classList.contains('hidden') && calcPage.offsetParent !== null) updateMtfCalculator();
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

            const CHARGE_LOGIC_VERSION = 3;

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
                    if (!tx.buyDate || !tx.sellDate || !tx.quantity || !tx.buyPrice) return tx;
                    const isOpen = (tx.status || 'closed') === 'open';
                    const effectiveSellPrice = tx.sellPrice || (isOpen ? tx.buyPrice : 0);
                    if (!effectiveSellPrice) return tx;
                    const calc = calculateTrade({ ...tx, sellPrice: effectiveSellPrice });
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
                if (!tx.buyDate || !tx.sellDate || !tx.quantity || !tx.buyPrice || !sellPrice) {
                    return fallback;
                }
                const calc = calculateTrade({ ...tx, sellPrice });
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
            // trade modal → components/trade-modal/trade-modal.js
            function renderSyncConnectRow() {
                const row = document.getElementById('syncConnectRow');
                if (!row) return;
                row.className = 'flex gap-2';
                row.innerHTML =
                    renderAppButton('Connect', { id: 'syncConnectBtn', variant: 'action', onclick: 'connectSyncFromInput()', icon: 'fa-plug', flex: true }) +
                    renderAppButton('Disconnect', { id: 'syncDisconnectBtn', variant: 'cancel', onclick: 'disconnectSync()', icon: 'fa-unlink', flex: true, className: 'hidden' });
            }

            function paintAddMoneyAccountBtn() {
                const host = document.getElementById('addMoneyAccountBtnHost');
                if (!host) return;
                host.innerHTML = renderAppButton('Add Account', {
                    variant: 'action',
                    onclick: 'openAddMoneyAccountModal()',
                    icon: 'fa-plus',
                    fullWidth: true
                });
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
                const backupHost = document.getElementById('settingsBackupBtnHost');
                if (backupHost) {
                    backupHost.innerHTML = renderAppButton('Copy / Paste', {
                        variant: 'action',
                        onclick: 'openBackupTextModal()',
                        icon: 'fa-copy',
                        size: 'sm'
                    });
                }
                const resetHost = document.getElementById('settingsResetBtnHost');
                if (resetHost) {
                    resetHost.innerHTML = renderAppButton('Reset', {
                        variant: 'danger',
                        onclick: 'resetData()',
                        icon: 'fa-trash-alt',
                        size: 'sm'
                    });
                }
            }

            let marketFeedChecking = false;

            function setMarketFeedStatusUI(state, detailHtml) {
                const badge = document.getElementById('marketFeedStatusBadge');
                const result = document.getElementById('marketFeedCheckResult');
                const btn = document.getElementById('settingsMarketFeedBtn');
                if (badge) {
                    badge.className = 'inline-flex items-center badge badge-sm rounded-full px-2.5 py-1.5 min-h-0 h-auto text-xs font-medium border';
                    if (state === 'ok') {
                        badge.className += ' bg-success/15 border-success/20 text-success';
                        badge.textContent = 'Live';
                    } else if (state === 'error') {
                        badge.className += ' bg-error/15 border-error/20 text-error';
                        badge.textContent = 'Unavailable';
                    } else if (state === 'checking') {
                        badge.className += ' bg-base-200/30 border-base-200/60 text-base-content/80';
                        badge.textContent = 'Checking…';
                    } else {
                        badge.className += ' bg-base-200/30 border-base-200/60 text-base-content/80';
                        badge.textContent = 'Not checked';
                    }
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
                setMarketFeedStatusUI('checking', '<i class="fas fa-spinner fa-spin mr-1"></i>Fetching live quote for RELIANCE…');
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
                        `<span class="text-success font-medium">Yes — real-time market data is coming through.</span><br>` +
                        `<span class="text-base-content/80"><strong>RELIANCE</strong> ${priceText}` +
                        (hasChange ? ` · ${changeText}` : '') +
                        `</span><br><span class="text-base-content/60">Checked at ${checkedAt}</span>`
                    );
                    showToast('Yes — we are getting real-time market data.', 'success');
                } catch (e) {
                    console.warn('Market feed check failed', e);
                    setMarketFeedStatusUI(
                        'error',
                        '<span class="text-error font-medium">Could not reach live market data.</span><br>' +
                        '<span class="text-base-content/60">Check your internet connection and try again.</span>'
                    );
                    showToast('Market feed unavailable. Check your internet and try again.', 'danger');
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
                renderMoneyEntryFooter('Add Deposit', 'fa-plus');
                renderSyncConnectRow();
                paintAddMoneyAccountBtn();
                paintSettingsActionButtons();
                const calcAdd = document.getElementById('calcAddPctBtnHost');
                if (calcAdd) {
                    calcAdd.innerHTML = renderAppButton('Add', {
                        variant: 'action',
                        onclick: 'addCalcSellPctPreset()',
                        size: 'sm',
                        className: 'whitespace-nowrap'
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
                    ? 'text-success bg-success/15 rounded-lg px-1.5 py-0.5'
                    : 'text-error bg-error/15 gr-danger-soft-text rounded-lg px-1.5 py-0.5';
            }

            // ---------- FILTER SHEET ----------
            function openFilterSheet() {
                Sheet.mountPanel('<i class="fas fa-tune mr-2 text-[var(--gr-accent)]"></i>Filter Past Trades', 'panelPastFilter',
                    renderAppButtonRow('Close', 'Apply', { cancelOnClick: 'closeSheet()', actionOnClick: 'applyPastRangeFilter()', actionIcon: 'fa-check' }));
                setDateInputValue(document.getElementById('pastFrom'), pastFrom);
                setDateInputValue(document.getElementById('pastTo'), pastTo);
                if (pastRangeDays != null && pastRangeDays !== '') {
                    setRangeButtonsActive('#pastRangeButtons', pastRangeDays);
                }
            }
            function closeFilterSheet() { Sheet.close(); }

            let settingsReturnPage = 'trades';
            let settingsReturnMoreFeature = null;

            function getCurrentAppPage() {
                const active = document.querySelector('.page-section:not(.hidden)');
                if (!active) return { page: 'trades', moreFeature: null };
                const id = active.id;
                if (id === 'page-search') return { page: searchContext === 'past' ? 'past' : 'trades', moreFeature: null };
                if (id === 'page-plan') return { page: 'plan', moreFeature: null };
                if (id === 'page-trades') return { page: 'trades', moreFeature: null };
                if (id === 'page-past') return { page: 'past', moreFeature: null };
                if (id === 'page-market') return { page: 'market', moreFeature: null };
                if (id === 'page-money') return { page: 'more', moreFeature: 'money' };
                if (id === 'page-more') return { page: 'more', moreFeature: null };
                if (id === 'page-settings') return { page: 'settings', moreFeature: null };
                if (id === 'page-transactions') return { page: 'more', moreFeature: 'transactions' };
                if (id === 'page-mtf-calc') return { page: 'more', moreFeature: 'mtf-calc' };
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
                try { sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(payload)); } catch (_) {}
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
                    return document.getElementById('page-settings')?.classList.contains('hidden');
                }
                if (saved.moreFeature) {
                    const featPage = moreFeatureMap[saved.moreFeature];
                    return document.getElementById(featPage)?.classList.contains('hidden');
                }
                const expected = pageMap[saved.page];
                return expected ? document.getElementById(expected)?.classList.contains('hidden') : false;
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
                    openMoreFeature(saved.moreFeature);
                    return true;
                }
                if (saved.page === 'money') {
                    openMoreFeature('money');
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

            // ---------- NAVIGATION ----------
            const pageMap = { plan: 'page-plan', trades: 'page-trades', past: 'page-past', market: 'page-market', more: 'page-more' };
            const moreFeatureMap = { money: 'page-money', transactions: 'page-transactions', 'mtf-calc': 'page-mtf-calc' };
            let activeMoreFeature = null;

            function showPage(pageId) {
                document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
                const target = document.getElementById(pageId);
                if (target) target.classList.remove('hidden');
                updateAppHeader(pageId);
            }

            function setBottomNavActive(page) {
                BottomBar.setActive(page);
            }

            function updateFabVisibility(page) {
                BottomBar.setFabVisible(page === 'plan' || page === 'trades' || page === 'past');
            }

            function navigateTo(page) {
                if (page === 'money') {
                    openMoreFeature('money');
                    return;
                }
                if (page === 'plan') {
                    stopMarketRefresh();
                    activeMoreFeature = null;
                    showPage(pageMap['trades']);
                    setBottomNavActive('trades');
                    setTradesViewMode('plan');
                    updateFabVisibility('trades');
                    startTradeLiveRefresh();
                    saveNavState();
                    return;
                }
                activeMoreFeature = null;
                showPage(pageMap[page]);
                setBottomNavActive(page);
                if (page === 'market') {
                    stopTradeLiveRefresh();
                    try { renderMarketPage(); } catch (_) {}
                    startMarketRefresh();
                } else if (page === 'trades') {
                    stopMarketRefresh();
                    renderCurrentView();
                    startTradeLiveRefresh();
                } else if (page === 'past') {
                    stopMarketRefresh();
                    renderPastTrades();
                    startTradeLiveRefresh();
                } else {
                    stopMarketRefresh();
                    stopTradeLiveRefresh();
                }
                updateFabVisibility(page);
                saveNavState();
            }

            function openMoreFeature(feature) {
                stopMarketRefresh();
                stopTradeLiveRefresh();
                activeMoreFeature = feature;
                showPage(moreFeatureMap[feature]);
                setBottomNavActive('more');
                updateFabVisibility('more');
                if (feature === 'money') renderMoney();
                if (feature === 'transactions') renderTransactions();
                if (feature === 'mtf-calc') {
                    renderMtfCalculator();
                    updateMtfCalculator();
                }
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
            let pastRangeDays = 'this-week';
            let pastFrom = null;
            let pastTo = null;
            let tradeSearchQuery = '';
            let pastSearchQuery = '';
            let planSearchQuery = '';
            let tradesViewMode = 'trade';
            let pastPnlFilter = 'all';
            let searchContext = 'trades';
            let searchQuery = '';
            let txModalContext = 'trades';
            let moneyAccountFilter = 'all';
            let moneyPageTypeFilter = 'all';
            let moneyPageFrom = null;
            let moneyPageTo = null;
            let moneyPageRangeKey = 'all';
            let moneyHistorySheetAccountId = null;
            let moneyHistoryTypeFilter = 'all';
            let moneyHistoryFrom = null;
            let moneyHistoryTo = null;
            let moneyHistoryRangeKey = 'all';

            const APP_MONEY_TYPE_OPTIONS = [
                { value: 'all', label: 'All', icon: 'fa-layer-group', variant: 'muted' },
                { value: 'withdraw', label: 'Withdraw', icon: 'fa-minus', variant: 'withdraw' },
                { value: 'deposit', label: 'Invest', icon: 'fa-plus', variant: 'deposit' }
            ];
            const APP_MONEY_TYPE_FILTER_OPTIONS = [
                { value: 'all', label: 'All', icon: 'fa-layer-group', variant: 'muted' },
                { value: 'deposit', label: 'Invest only', icon: 'fa-plus', variant: 'deposit' },
                { value: 'withdraw', label: 'Withdrawals only', icon: 'fa-minus', variant: 'withdraw' }
            ];
            const APP_BROKER_OPTIONS = [
                { value: '', label: 'Select Broker', icon: 'fa-building', variant: 'muted' },
                { value: 'Zerodha', label: 'Zerodha', icon: 'fa-chart-line', variant: 'broker' },
                { value: 'Dhan', label: 'Dhan', icon: 'fa-chart-line', variant: 'broker' },
                { value: 'Groww', label: 'Groww', icon: 'fa-chart-line', variant: 'broker' }
            ];

            function setFilterBtnHighlight(btn, active) {
                if (!btn) return;
                btn.classList.remove('btn-primary');
                btn.classList.toggle('border-base-300', active);
                btn.classList.toggle('bg-base-200', active);
                btn.classList.toggle('text-base-content', active);
                btn.classList.toggle('border-base-200', !active);
                const icon = btn.querySelector('i');
                if (icon) icon.classList.toggle('text-base-content/70', active);
                if (icon) icon.classList.toggle('text-base-content/55', !active);
            }

            function setRangeButtonsActive(containerSelector, activeRange) {
                document.querySelectorAll(`${containerSelector} [data-range]`).forEach(b => {
                    const on = activeRange != null && activeRange !== '' && b.dataset.range === String(activeRange);
                    if (b.classList.contains('md-filter-chip')) {
                        b.classList.toggle('md-filter-chip--selected', on);
                        b.setAttribute('aria-pressed', on ? 'true' : 'false');
                        return;
                    }
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline', 'btn-sm');
                    b.classList.toggle('btn-primary', on);
                    b.classList.toggle('btn-neutral', !on);
                });
            }

            function clearRangeButtonsActive(containerSelector) {
                setRangeButtonsActive(containerSelector, '');
            }

            function syncMoneyTypeDropdowns() {
                syncAppSelectDropdown({
                    options: APP_MONEY_TYPE_OPTIONS,
                    selectedValue: moneyPageTypeFilter,
                    labelId: 'moneyPageFilterTypeLabel',
                    iconId: 'moneyPageFilterTypeIcon',
                    menuId: 'moneyPageFilterTypeMenu',
                    selectHandler: 'setMoneyPageTypeFilter'
                });
                syncAppSelectDropdown({
                    options: APP_MONEY_TYPE_FILTER_OPTIONS,
                    selectedValue: moneyPageTypeFilter,
                    labelId: 'moneyPageTypeFilterLabel',
                    iconId: 'moneyPageTypeFilterIcon',
                    menuId: 'moneyPageTypeFilterMenu',
                    selectHandler: 'pickMoneyPageTypeFilter'
                });
                const hiddenType = document.getElementById('moneyPageTypeFilter');
                if (hiddenType) hiddenType.value = moneyPageTypeFilter;
            }

            function syncMoneyHistoryTypeDropdown() {
                syncAppSelectDropdown({
                    options: APP_MONEY_TYPE_OPTIONS,
                    selectedValue: moneyHistoryTypeFilter,
                    labelId: 'moneyHistoryTypeLabel',
                    iconId: 'moneyHistoryTypeIcon',
                    menuId: 'moneyHistoryTypeMenu',
                    selectHandler: 'setMoneyHistoryTypeFilter'
                });
            }

            function syncMoneyAccountFilterDropdown(accounts) {
                const options = [
                    { value: 'all', label: 'All', icon: 'fa-layer-group', variant: 'muted' },
                    ...accounts.map(a => ({ value: a.id, label: a.name, icon: 'fa-university', variant: 'account' }))
                ];
                syncAppSelectDropdown({
                    options,
                    selectedValue: moneyAccountFilter,
                    labelId: 'moneyAccountFilterLabel',
                    iconId: 'moneyAccountFilterIcon',
                    menuId: 'moneyAccountFilterMenu',
                    selectHandler: 'setMoneyAccountFilter',
                    escapeValues: true
                });
            }

            function setTxBroker(value) {
                const hidden = document.getElementById('txBroker');
                if (!hidden) return;
                hidden.value = value || '';
                hidden.dispatchEvent(new Event('change', { bubbles: true }));
                const host = document.getElementById('txBrokerHost');
                if (!host) return;
                const { renderDropdownTrigger, renderDropdownMenu, buildAppDropdownItems } = global.MTFComponents;
                if (!renderDropdownTrigger || !renderDropdownMenu) return;
                const selected = (APP_BROKER_OPTIONS.find(o => o.value === (value || '')) || APP_BROKER_OPTIONS[0]);
                host.innerHTML = `<div class="dropdown dropdown-end w-full">` +
                    renderDropdownTrigger({
                        id: 'txBrokerTrigger',
                        labelId: 'txBrokerLabel',
                        iconId: 'txBrokerIcon',
                        label: selected.label,
                        icon: selected.icon,
                        iconVariant: selected.variant || 'muted',
                        ariaLabel: 'Select Broker',
                        fullWidth: true
                    }) + renderDropdownMenu(buildAppDropdownItems(APP_BROKER_OPTIONS, value || '', 'setTxBroker'), { fullWidth: true }) +
                    `</div>`;
                if (typeof updatePreview === 'function') { try { updatePreview(); } catch (_) {} }
            }

            function pickMoneyPageTypeFilter(value) {
                moneyPageTypeFilter = value || 'all';
                const hiddenType = document.getElementById('moneyPageTypeFilter');
                if (hiddenType) hiddenType.value = moneyPageTypeFilter;
                syncMoneyTypeDropdowns();
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

            function setPastRange(daysOrKey) {
                pastRangeDays = daysOrKey;
                if (daysOrKey === 'today') {
                    const date = localDateStr(new Date());
                    pastFrom = date;
                    pastTo = date;
                } else if (daysOrKey === 'yesterday') {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    const date = localDateStr(y);
                    pastFrom = date;
                    pastTo = date;
                } else if (daysOrKey === 'this-week') {
                    const range = getThisWeekMonFriRange();
                    pastFrom = range.from;
                    pastTo = range.to;
                } else {
                    const range = getDateRange(daysOrKey);
                    pastFrom = range.from;
                    pastTo = range.to;
                }
                setDateInputValue(document.getElementById('pastFrom'), pastFrom);
                setDateInputValue(document.getElementById('pastTo'), pastTo);
                setRangeButtonsActive('#pastRangeButtons', daysOrKey);
                renderPastTrades();
                if (isPastPageVisible()) startTradeLiveRefresh();
                closeFilterSheet();
            }

            function onPastFilterDateChange() {
                pastRangeDays = null;
                clearRangeButtonsActive('#pastRangeButtons');
            }

            function applyPastRangeFilter() {
                const from = document.getElementById('pastFrom').value;
                const to = document.getElementById('pastTo').value;
                if (!from || !to) { showToast('Please select both dates.', 'warning'); return; }
                if (from > to) { showToast('From date must be before To date.', 'warning'); return; }
                pastFrom = from;
                pastTo = to;
                pastRangeDays = null;
                clearRangeButtonsActive('#pastRangeButtons');
                renderPastTrades();
                if (isPastPageVisible()) startTradeLiveRefresh();
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

            function sortTradesByHoldDays(trades) {
                return [...trades].sort((a, b) => {
                    const dayDiff = getDaysHeld(a) - getDaysHeld(b);
                    if (dayDiff !== 0) return dayDiff;
                    return a.id < b.id ? 1 : -1;
                });
            }

            function paintOpenTradeSummary(net, openCount) {
                paintTradeRangeSummary({
                    containerId: 'summaryOpenStats',
                    wordsId: 'summaryNetWords',
                    net,
                    count: openCount,
                    countLabel: 'Open',
                    useTwoItemLayout: true
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

            // ---------- RENDER PLAN TRADES (O13) ----------
            // renderPlanTrades → pages/plan/plan-page.js

            // ---------- FULL-SCREEN SEARCH ----------
            function openSearchPage() {
                const current = getCurrentAppPage().page;
                if (current === 'market') {
                    const input = document.getElementById('marketSearchInput');
                    if (input) {
                        input.focus();
                        input.select();
                    }
                    return;
                }
                stopTradeLiveRefresh();
                searchContext = current === 'past' ? 'past' : 'trades';
                searchQuery = '';
                showPage('page-search');
                BottomBar.setBarVisible(false);
                BottomBar.setFabVisible(false);
                const input = document.getElementById('searchPageInput');
                if (input) {
                    input.value = '';
                    setTimeout(() => input.focus(), 50);
                }
                toggleClearBtn('searchPageClear', false);
                renderSearchResults();
            }

            function closeSearchPage() {
                BottomBar.setBarVisible(true);
                if (searchContext === 'past') {
                    navigateTo('past');
                } else if (tradesViewMode === 'plan') {
                    navigateTo('plan');
                } else {
                    navigateTo('trades');
                }
            }

            function runSearchPage(value) {
                searchQuery = value || '';
                toggleClearBtn('searchPageClear', searchQuery.trim());
                renderSearchResults();
            }

            function clearSearchPage() {
                searchQuery = '';
                const input = document.getElementById('searchPageInput');
                if (input) { input.value = ''; input.focus(); }
                toggleClearBtn('searchPageClear', false);
                renderSearchResults();
            }

            // renderSearchResults → pages/search/search-page.js

            // ---------- TRADES VIEW MODE (Trade / Plan switch) ----------
            function setTradesViewMode(mode) {
                tradesViewMode = mode === 'plan' ? 'plan' : 'trade';
                const sel = document.getElementById('tradesViewMode');
                if (sel && sel.value !== tradesViewMode) sel.value = tradesViewMode;
                renderCurrentView();
                const tradesPage = document.getElementById('page-trades');
                if (tradesPage && !tradesPage.classList.contains('hidden')) {
                    startTradeLiveRefresh();
                }
            }

            // renderCurrentView → pages/trades/trades-page.js

            // ---------- PAST TRADES (LIST + DETAIL) ----------
            function getPastFiltered() {
                const txs = getTransactions();
                if (!pastFrom || !pastTo) {
                    const range = getThisWeekMonFriRange();
                    pastFrom = range.from;
                    pastTo = range.to;
                    pastRangeDays = 'this-week';
                    setDateInputValue(document.getElementById('pastFrom'), pastFrom);
                    setDateInputValue(document.getElementById('pastTo'), pastTo);
                }
                const fromDate = new Date(pastFrom);
                const toDate = new Date(pastTo);
                toDate.setHours(23, 59, 59, 999);

                let filtered = txs
                    .filter(t => (t.status || 'closed') === 'closed')
                    .filter(t => t.executed !== false)
                    .filter(t => {
                        const key = parseDateKey(t.sellDate) || parseDateKey(t.buyDate);
                        if (!key) return false;
                        const d = new Date(key + 'T12:00:00');
                        return d >= fromDate && d <= toDate;
                    });

                const pastQuery = pastSearchQuery.trim().toLowerCase();
                if (pastQuery) {
                    filtered = filtered.filter(t => (t.company || '').toLowerCase().includes(pastQuery));
                }

                if (pastPnlFilter === 'profit') {
                    filtered = filtered.filter(t => resolveTradeMetrics(t).netProfit >= 0);
                } else if (pastPnlFilter === 'loss') {
                    filtered = filtered.filter(t => resolveTradeMetrics(t).netProfit < 0);
                } else if (pastPnlFilter === 'verified') {
                    filtered = filtered.filter(t => !!t.verified);
                }

                filtered = sortTradesByHoldDays(filtered);
                return filtered;
            }

            function setPastPnlFilter(value) {
                pastPnlFilter = (value === 'profit' || value === 'loss' || value === 'verified') ? value : 'all';
                const sel = document.getElementById('pastPnlFilter');
                if (sel && sel.value !== pastPnlFilter) sel.value = pastPnlFilter;
                renderPastTrades();
                if (isPastPageVisible()) startTradeLiveRefresh();
            }

            // renderPastTrades → pages/past/past-page.js

            // ---------- MONEY TRACKER ----------
            // renderMoney, renderAccountHistorySheet → pages/money/money-page.js

            function moneyPageDateFilterActive() {
                return moneyPageRangeKey !== 'all' && (moneyPageFrom || moneyPageTo);
            }

            function moneyPageFiltersActive() {
                return moneyPageTypeFilter !== 'all' || moneyPageDateFilterActive();
            }

            function matchesMoneyPageEntryFilter(e) {
                if (moneyPageTypeFilter !== 'all' && e.type !== moneyPageTypeFilter) return false;
                if (moneyPageDateFilterActive()) {
                    const d = e.date || '';
                    if (!d) return false;
                    if (moneyPageFrom && d < moneyPageFrom) return false;
                    if (moneyPageTo && d > moneyPageTo) return false;
                }
                return true;
            }

            function getMoneyPageFilterViewTitle() {
                const titles = { deposit: 'Investments', withdraw: 'Withdrawals' };
                return titles[moneyPageTypeFilter] || 'Transactions';
            }

            function getMoneyPageFilteredEntries() {
                let entries = getMoneyEntries().filter(matchesMoneyPageEntryFilter);
                if (moneyAccountFilter !== 'all') {
                    entries = entries.filter(e => e.accountId === moneyAccountFilter);
                }
                return sortMoneyEntries(entries);
            }

            function syncMoneyPageFilterUI() {
                syncMoneyTypeDropdowns();
                const fromEl = document.getElementById('moneyPageFrom');
                const toEl = document.getElementById('moneyPageTo');
                if (fromEl) setDateInputValue(fromEl, moneyPageFrom || '');
                if (toEl) setDateInputValue(toEl, moneyPageTo || '');
                setRangeButtonsActive('#moneyPageRangeButtons', moneyPageRangeKey);
                const filterBtn = document.getElementById('moneyPageFilterBtn');
                setFilterBtnHighlight(filterBtn, moneyPageFiltersActive());
                const filterBtnActive = document.getElementById('moneyPageFilterBtnActive');
                setFilterBtnHighlight(filterBtnActive, moneyPageFiltersActive());
            }

            function openMoneyPageFilterSheet() {
                syncMoneyPageFilterUI();
                Sheet.mountPanel('<i class="fas fa-filter mr-2"></i>Filter Money', 'panelMoneyPageFilter',
                    renderAppButtonRow('Clear', 'Apply', { cancelOnClick: 'clearMoneyPageFilters()', actionOnClick: 'applyMoneyPageFilter()', actionIcon: 'fa-check' }));
            }

            function closeMoneyPageFilterSheet() {
                Sheet.close();
            }

            function setMoneyPageRangeInForm(daysOrKey) {
                moneyPageRangeKey = String(daysOrKey);
                if (daysOrKey === 'all') {
                    moneyPageFrom = null;
                    moneyPageTo = null;
                } else if (daysOrKey === 'yesterday') {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    const date = localDateStr(y);
                    moneyPageFrom = date;
                    moneyPageTo = date;
                } else {
                    const range = getDateRange(daysOrKey);
                    moneyPageFrom = range.from;
                    moneyPageTo = range.to;
                }
                syncMoneyPageFilterUI();
            }

            function applyMoneyPageFilter() {
                moneyPageTypeFilter = document.getElementById('moneyPageTypeFilter')?.value || moneyPageTypeFilter || 'all';
                let from = document.getElementById('moneyPageFrom')?.value || '';
                let to = document.getElementById('moneyPageTo')?.value || '';
                if (!from && !to && moneyPageFrom && moneyPageTo) {
                    from = moneyPageFrom;
                    to = moneyPageTo;
                }
                if ((from && !to) || (!from && to)) {
                    showToast('Please select both From and To dates.', 'warning');
                    return;
                }
                if (from && to && from > to) {
                    showToast('From date must be before To date.', 'warning');
                    return;
                }
                if (!from && !to && moneyPageRangeKey === 'custom') {
                    moneyPageRangeKey = 'all';
                }
                if (from && to) {
                    moneyPageFrom = from;
                    moneyPageTo = to;
                    if (!document.querySelector(`#moneyPageRangeButtons .btn[data-range="${moneyPageRangeKey}"]`)?.classList.contains('btn-primary')) {
                        moneyPageRangeKey = 'custom';
                    }
                } else {
                    moneyPageFrom = null;
                    moneyPageTo = null;
                }
                closeMoneyPageFilterSheet();
                renderMoney();
                if (moneyPageFiltersActive()) showToast('Filter applied.', 'success');
            }

            function onMoneyPageDateInputChange() {
                moneyPageRangeKey = 'custom';
                document.querySelectorAll('#moneyPageRangeButtons .btn').forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline', 'btn-neutral', 'btn-sm');
                });
            }

            function setMoneyPageTypeFilter(value) {
                moneyPageTypeFilter = value || 'all';
                const hiddenType = document.getElementById('moneyPageTypeFilter');
                if (hiddenType) hiddenType.value = moneyPageTypeFilter;
                syncMoneyTypeDropdowns();
                renderMoney();
            }

            function clearMoneyPageFilters() {
                moneyPageTypeFilter = 'all';
                moneyPageFrom = null;
                moneyPageTo = null;
                moneyPageRangeKey = 'all';
                closeMoneyPageFilterSheet();
                renderMoney();
            }

            function getMoneyHistorySheetTitle() {
                const acc = getMoneyAccounts().find(a => a.id === moneyHistorySheetAccountId);
                if (!acc) return 'Account History';
                const holder = acc.holderName ? ` · ${acc.holderName}` : '';
                return `${acc.name}${holder}`;
            }

            function openAccountHistorySheet(accountId) {
                moneyHistorySheetAccountId = accountId;
                resetMoneyHistoryFilters();
                renderAccountHistorySheet();
                Sheet.mountPanel(getMoneyHistorySheetTitle(), 'panelMoneyHistory', '');
            }

            function resetMoneyHistoryFilters() {
                moneyHistoryTypeFilter = 'all';
                moneyHistoryFrom = null;
                moneyHistoryTo = null;
                moneyHistoryRangeKey = 'all';
            }

            function moneyHistoryDateFilterActive() {
                return moneyHistoryRangeKey !== 'all' && (moneyHistoryFrom || moneyHistoryTo);
            }

            function getMoneyHistoryRangeLabel() {
                if (!moneyHistoryDateFilterActive()) return 'All time';
                const quickLabels = {
                    yesterday: 'Yesterday',
                    7: 'Last 1 week',
                    30: 'Last 1 month',
                    90: 'Last 3 months'
                };
                const prefix = quickLabels[moneyHistoryRangeKey] || '';
                if (moneyHistoryFrom && moneyHistoryTo) {
                    if (moneyHistoryFrom === moneyHistoryTo) {
                        return prefix ? `${prefix} · ${fmtDate(moneyHistoryFrom)}` : fmtDate(moneyHistoryFrom);
                    }
                    const range = `${fmtDate(moneyHistoryFrom)} – ${fmtDate(moneyHistoryTo)}`;
                    return prefix ? `${prefix} · ${range}` : range;
                }
                return prefix || 'Custom range';
            }

            function getMoneyHistoryActiveFilterLabel() {
                const typeLabels = { deposit: 'Deposit', withdraw: 'Withdraw' };
                const typePart = typeLabels[moneyHistoryTypeFilter] || '';
                const rangePart = getMoneyHistoryRangeLabel();
                if (typePart && rangePart !== 'All time') return `${typePart} · ${rangePart}`;
                if (typePart) return typePart;
                return rangePart;
            }

            function syncMoneyHistoryRangeSheetUI() {
                const fromEl = document.getElementById('moneyHistoryFrom');
                const toEl = document.getElementById('moneyHistoryTo');
                if (fromEl) setDateInputValue(fromEl, moneyHistoryFrom || '');
                if (toEl) setDateInputValue(toEl, moneyHistoryTo || '');
                setRangeButtonsActive('#moneyHistoryRangeButtons', moneyHistoryRangeKey);
            }

            function syncMoneyHistoryFilterUI() {
                syncMoneyHistoryTypeDropdown();
                const filterBtn = document.getElementById('moneyHistoryRangeFilterBtn');
                setFilterBtnHighlight(filterBtn, moneyHistoryDateFilterActive());
            }

            function openMoneyHistoryRangeSheet() {
                syncMoneyHistoryRangeSheetUI();
                Sheet.mountPanel('<i class="fas fa-calendar-alt mr-2"></i>Date Range', 'panelMoneyHistoryRange',
                    renderAppButtonRow('Close', 'Apply', { cancelOnClick: 'closeMoneyHistoryRangeSheet()', actionOnClick: 'applyMoneyHistoryDateRange()', actionIcon: 'fa-check' }));
            }

            function closeMoneyHistoryRangeSheet() {
                if (moneyHistorySheetAccountId) {
                    renderAccountHistorySheet();
                    Sheet.mountPanel(getMoneyHistorySheetTitle(), 'panelMoneyHistory', '');
                    return;
                }
                Sheet.close();
            }

            function setMoneyHistoryTypeFilter(value) {
                moneyHistoryTypeFilter = value || 'all';
                renderAccountHistorySheet();
            }

            function setMoneyHistoryRange(daysOrKey) {
                moneyHistoryRangeKey = String(daysOrKey);
                if (daysOrKey === 'all') {
                    moneyHistoryFrom = null;
                    moneyHistoryTo = null;
                } else if (daysOrKey === 'yesterday') {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    const date = y.toISOString().split('T')[0];
                    moneyHistoryFrom = date;
                    moneyHistoryTo = date;
                } else {
                    const range = getDateRange(daysOrKey);
                    moneyHistoryFrom = range.from;
                    moneyHistoryTo = range.to;
                }
                syncMoneyHistoryRangeSheetUI();
                closeMoneyHistoryRangeSheet();
            }

            function applyMoneyHistoryDateRange() {
                const from = document.getElementById('moneyHistoryFrom')?.value || '';
                const to = document.getElementById('moneyHistoryTo')?.value || '';
                if (!from && !to) {
                    moneyHistoryFrom = null;
                    moneyHistoryTo = null;
                    moneyHistoryRangeKey = 'all';
                    closeMoneyHistoryRangeSheet();
                    return;
                }
                if (!from || !to) { showToast('Please select both From and To dates.', 'warning'); return; }
                if (from > to) { showToast('From date must be before To date.', 'warning'); return; }
                moneyHistoryFrom = from;
                moneyHistoryTo = to;
                moneyHistoryRangeKey = 'custom';
                closeMoneyHistoryRangeSheet();
                showToast('Date range applied.', 'success');
            }

            function clearMoneyHistoryFilters() {
                resetMoneyHistoryFilters();
                renderAccountHistorySheet();
            }

            function filterMoneyHistoryEntries(entries) {
                return entries.filter(e => {
                    if (moneyHistoryTypeFilter !== 'all' && e.type !== moneyHistoryTypeFilter) return false;
                    if (moneyHistoryFrom || moneyHistoryTo) {
                        const d = e.date || '';
                        if (!d) return false;
                        if (moneyHistoryFrom && d < moneyHistoryFrom) return false;
                        if (moneyHistoryTo && d > moneyHistoryTo) return false;
                    }
                    return true;
                });
            }

            function moneyHistoryFiltersActive() {
                return moneyHistoryTypeFilter !== 'all' || moneyHistoryDateFilterActive();
            }

            function refreshMoneyHistorySheetIfOpen() {
                if (moneyHistorySheetAccountId) renderAccountHistorySheet();
            }

            function setMoneyAccountFilter(value) {
                moneyAccountFilter = value || 'all';
                renderMoney();
            }

            // money entry modal → pages/money/money-entry-modal.js
            function setMoneyAccountModalMode(isEdit) {
                const title = isEdit ? '<i class="fas fa-pen mr-2"></i>Edit Account' : '<i class="fas fa-plus mr-2"></i>Add Account';
                const footer = `<div class="app-sheet__footer-actions w-full">${renderAppButtonRow('Cancel', 'Save', { cancelOnClick: 'closeSheet()', actionOnClick: 'saveMoneyAccount()', actionIcon: 'fa-save' })}
                    ${isEdit ? renderAppButton('Delete Account', { variant: 'danger', onclick: 'confirmDeleteMoneyAccount()', icon: 'fa-trash-alt', fullWidth: true }) : ''}</div>`;
                Sheet.mountPanel(title, 'panelMoneyAccount', footer);
            }

            function showMoneyAccountModal() { /* panel mounted by setMoneyAccountModalMode */ }

            function updateMoneyAccountOpeningPreview() {
                const previewEl = document.getElementById('moneyAccountOpeningPreview');
                const inputEl = document.getElementById('moneyAccountOpeningBalance');
                if (!previewEl || !inputEl) return;
                const amount = parseFloat(inputEl.value);
                if (!amount || amount <= 0 || isNaN(amount)) {
                    previewEl.innerHTML = '';
                    previewEl.classList.add('hidden');
                    return;
                }
                previewEl.innerHTML = renderAmount(amount, {
                    size: 'md',
                    tone: 'positive',
                    align: 'left'
                });
                previewEl.classList.remove('hidden');
            }

            function openAddMoneyAccountModal() {
                document.getElementById('moneyAccountEditId').value = '';
                document.getElementById('moneyAccountName').value = '';
                document.getElementById('moneyAccountHolderName').value = '';
                document.getElementById('moneyAccountOpeningBalance').value = '';
                updateMoneyAccountOpeningPreview();
                setMoneyAccountModalMode(false);
                showMoneyAccountModal();
            }

            function openMoneyAccountModal(accountId) {
                const acc = getMoneyAccounts().find(a => a.id === accountId);
                if (!acc) return;
                document.getElementById('moneyAccountEditId').value = acc.id;
                document.getElementById('moneyAccountName').value = acc.name;
                document.getElementById('moneyAccountHolderName').value = acc.holderName || '';
                document.getElementById('moneyAccountOpeningBalance').value = acc.openingBalance || '';
                updateMoneyAccountOpeningPreview();
                setMoneyAccountModalMode(true);
                showMoneyAccountModal();
            }

            function saveMoneyAccount() {
                const id = document.getElementById('moneyAccountEditId').value;
                const name = document.getElementById('moneyAccountName').value.trim();
                const holderName = document.getElementById('moneyAccountHolderName').value.trim();
                const openingBalance = parseFloat(document.getElementById('moneyAccountOpeningBalance').value) || 0;
                if (!name) { showToast('Please enter an account name.', 'warning'); return; }

                const isEdit = !!id;
                const existing = isEdit ? getMoneyAccounts().find(a => a.id === id) : null;
                confirmAction({
                    title: isEdit
                        ? '<i class="fas fa-pen mr-2"></i>Save Account?'
                        : '<i class="fas fa-plus-circle mr-2"></i>Add Account?',
                    titleClass: 'text-primary',
                    message: isEdit
                        ? `Save changes to "${name}"?`
                        : `Add account "${name}"?`,
                    confirmLabel: isEdit
                        ? '<i class="fas fa-save mr-1"></i> Save'
                        : '<i class="fas fa-plus mr-1"></i> Add',
                    confirmClass: 'btn-primary',
                    onConfirm: async () => {
                        if (isEdit) {
                            await updateMoneyAccount(id, { name, holderName, broker: existing?.broker || 'None', openingBalance });
                            showToast(isSyncConnected() ? 'Account updated and synced!' : 'Account updated!', 'success');
                        } else {
                            await addMoneyAccount({ name, holderName, broker: 'None', openingBalance });
                            showToast(isSyncConnected() ? 'Account added and synced!' : 'Account added!', 'success');
                        }
                        Sheet.close();
                        renderMoney();
                        renderSettings();
                    }
                });
            }

            function confirmDeleteMoneyAccount() {
                const id = document.getElementById('moneyAccountEditId').value;
                if (!id) return;
                const acc = getMoneyAccounts().find(a => a.id === id);
                const name = acc ? acc.name : 'this account';
                const entryCount = getMoneyEntries().filter(e => e.accountId === id).length;
                const extra = entryCount ? ` This will also remove ${entryCount} deposit/withdrawal record(s).` : '';
                confirmAction({
                    title: '<i class="fas fa-exclamation-triangle mr-2"></i>Delete Account?',
                    titleClass: 'text-error',
                    message: `Delete "${name}"?${extra} This cannot be undone.`,
                    confirmLabel: '<i class="fas fa-trash-alt mr-1"></i> Delete',
                    confirmClass: 'btn-error',
                    onConfirm: async () => {
                        await deleteMoneyAccount(id);
                        if (moneyAccountFilter === id) moneyAccountFilter = 'all';
                        if (moneyHistorySheetAccountId === id) {
                            moneyHistorySheetAccountId = null;
                            Sheet.close();
                        }
                        Sheet.close();
                        renderMoney();
                        renderSettings();
                        showToast(isSyncConnected() ? 'Account deleted and synced.' : 'Account deleted.', 'danger');
                    }
                });
            }

            function confirmDeleteMoneyEntry(id) {
                const entry = getMoneyEntry(id);
                const amt = entry ? fmtINR(entry.amount) : 'this entry';
                const typeLabel = entry?.type === 'deposit' ? 'deposit' : 'withdrawal';
                confirmAction({
                    title: '<i class="fas fa-exclamation-triangle mr-2"></i>Delete Entry?',
                    titleClass: 'text-error',
                    message: `Delete this ${typeLabel} of ${amt}? This cannot be undone.`,
                    confirmLabel: '<i class="fas fa-trash-alt mr-1"></i> Delete',
                    confirmClass: 'btn-error',
                    onConfirm: async () => {
                        await deleteMoneyEntry(id);
                        document.getElementById('moneyEntryModal')?.close();
                        renderMoney();
                        refreshMoneyHistorySheetIfOpen();
                        showToast(isSyncConnected() ? 'Entry deleted and synced.' : 'Entry deleted.', 'danger');
                    }
                });
            }

            // ---------- TOTAL TRANSACTIONS (MORE) ----------
            function getTransactionStats(txs) {
                const stats = {
                    total: txs.length,
                    open: 0,
                    closed: 0,
                    successful: 0,
                    net: 0,
                    gross: 0,
                    charges: 0,
                    byBroker: {}
                };
                ['Zerodha', 'Dhan', 'Groww'].forEach(b => {
                    stats.byBroker[b] = { total: 0, open: 0, closed: 0, successful: 0, net: 0 };
                });
                txs.forEach(t => {
                    const isOpen = (t.status || 'closed') === 'open';
                    if (isOpen) stats.open++;
                    else stats.closed++;
                    if (!isOpen && (t.netProfit || 0) >= 0) stats.successful++;
                    stats.net += t.netProfit || 0;
                    stats.gross += t.grossProfit || 0;
                    stats.charges += t.charges || 0;
                    const b = t.broker || 'Zerodha';
                    if (!stats.byBroker[b]) {
                        stats.byBroker[b] = { total: 0, open: 0, closed: 0, successful: 0, net: 0 };
                    }
                    stats.byBroker[b].total++;
                    if (isOpen) stats.byBroker[b].open++;
                    else stats.byBroker[b].closed++;
                    if (!isOpen && (t.netProfit || 0) >= 0) stats.byBroker[b].successful++;
                    stats.byBroker[b].net += t.netProfit || 0;
                });
                return stats;
            }

            // renderTransactions → pages/transactions/transactions-page.js

            // MTF Calculator → pages/mtf-calculator/mtf-calculator-page.js

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
                renderMoney();
                refreshActiveMoreView();
            }

            // ---------- SEARCH ----------
            function toggleClearBtn(btnId, hasValue) {
                const btn = document.getElementById(btnId);
                if (btn) btn.classList.toggle('hidden', !hasValue);
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
            function setPlanSearch(value) {
                planSearchQuery = value || '';
                toggleClearBtn('planSearchClear', planSearchQuery.trim());
                renderPlanTrades();
            }
            function clearPlanSearch() {
                planSearchQuery = '';
                const input = document.getElementById('planSearch');
                if (input) { input.value = ''; input.focus(); }
                toggleClearBtn('planSearchClear', false);
                renderPlanTrades();
            }

            // trade detail sheets → components/trade-*-sheet/
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
                    title: '<i class="fas fa-exclamation-triangle mr-2"></i>Delete Trade?',
                    titleClass: 'text-error',
                    message: `Delete "${name}"? This action cannot be undone.`,
                    confirmLabel: '<i class="fas fa-trash-alt mr-1"></i> Delete',
                    confirmClass: 'btn-error',
                    onConfirm: async () => {
                        await deleteTransaction(id);
                        const txModal = document.getElementById('txModal');
                        if (txModal?.open) txModal.close();
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
                    title: '<i class="fas fa-copy mr-2"></i>Copy Trade?',
                    titleClass: 'text-success',
                    message: `Create a duplicate of "${name}"?`,
                    confirmLabel: '<i class="fas fa-copy mr-1"></i> Copy',
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
                    title: '<i class="fas fa-check-circle mr-2"></i>Verify Trade?',
                    titleClass: 'text-success',
                    message: `Confirm that the P&L shown for "${name}" matches your ${broker} statement?`,
                    confirmLabel: '<i class="fas fa-check-circle mr-1"></i> Verified',
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
                    title: '<i class="fas fa-play mr-2"></i>Execute Trade?',
                    titleClass: 'text-success',
                    message: `Move "${name}" from Plan to active Trades? This marks it as executed.`,
                    confirmLabel: '<i class="fas fa-play mr-1"></i> Executed',
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
                    title: '<i class="fas fa-check-circle mr-2"></i>Close Trade?',
                    titleClass: 'text-success',
                    message: `Move "${name}" to Past Trades? This will mark the trade as closed.`,
                    confirmLabel: '<i class="fas fa-check mr-1"></i> Move to Past',
                    confirmClass: 'btn-success',
                    onConfirm: async () => {
                        const sellPrice = getEffectiveSellPrice(tx);
                        const calc = calculateTrade({ ...tx, sellPrice, status: 'closed' });
                        const saved = await updateTransaction(id, {
                            status: 'closed',
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
                        });
                        if (saved) {
                            showToast('Trade moved to Past Trades.', 'success');
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
            function initDropdowns() {
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.dropdown-content button, .dropdown-content a, .dropdown-content li button')) {
                        document.querySelectorAll('.dropdown.dropdown-open').forEach(d => d.classList.remove('dropdown-open'));
                        return;
                    }
                    const trigger = e.target.closest('.dropdown > button, .dropdown > [tabindex="0"]');
                    if (trigger && trigger.closest('.dropdown')) {
                        e.stopPropagation();
                        const dd = trigger.closest('.dropdown');
                        const wasOpen = dd.classList.contains('dropdown-open');
                        document.querySelectorAll('.dropdown.dropdown-open').forEach(d => d.classList.remove('dropdown-open'));
                        if (!wasOpen) dd.classList.add('dropdown-open');
                        return;
                    }
                    document.querySelectorAll('.dropdown.dropdown-open').forEach(d => d.classList.remove('dropdown-open'));
                });
            }

            // trade modal → components/trade-modal/trade-modal.js
            // ---------- SETTINGS ----------
            // renderSettings, renderSettingsMoneyAccounts → pages/settings/settings-page.js

            function renderSyncStatus() {
                const statusEl = document.getElementById('cloudSyncStatus');
                const hintEl = document.getElementById('cloudSyncHint');
                const connectBtn = document.getElementById('syncConnectBtn');
                const disconnectBtn = document.getElementById('syncDisconnectBtn');
                const input = document.getElementById('syncCodeInput');
                if (!statusEl) return;

                if (!isFirebaseConfigured()) {
                    setAppTagElement(statusEl, 'Not configured', 'default');
                    if (hintEl) hintEl.textContent = 'Paste your Firebase config in db/firebase-config.js to enable cloud sync. The app works offline until then.';
                    if (connectBtn) connectBtn.disabled = true;
                    if (disconnectBtn) disconnectBtn.classList.add('hidden');
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
                    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
                    if (hintEl) hintEl.textContent = 'Synced under code "' + currentCode + '". Use the same code on your other device.';
                } else {
                    if (input && document.activeElement !== input && !input.value.trim()) {
                        input.value = DEFAULT_SYNC_CODE;
                    }
                    if (disconnectBtn) disconnectBtn.classList.add('hidden');
                    if (hintEl) hintEl.textContent = 'Default code is pre-filled. Just tap Connect (or change it if you use a different one).';
                }
            }

            function connectSyncFromInput() {
                const input = document.getElementById('syncCodeInput');
                connectSync(input ? input.value : '');
            }

            // ---------- BACKUP AS TEXT (COPY / PASTE) ----------
            function openBackupTextModal() {
                try {
                    const data = getStorage();
                    const ta = document.getElementById('backupTextArea');
                    if (!ta) {
                        showToast('Backup panel unavailable.', 'danger');
                        return;
                    }
                    ta.value = JSON.stringify(data, null, 2);
                    Sheet.mountPanel('<i class="fas fa-clipboard mr-2"></i>Backup as Text', 'panelBackup',
                        `<div class="app-btn-row">${renderAppButton('Restore', { variant: 'danger', onclick: 'restoreFromText()', icon: 'fa-file-import', flex: true })}${renderAppButton('Copy', { variant: 'action', onclick: 'copyBackupText()', icon: 'fa-copy', flex: true })}</div>`);
                } catch (_) {
                    showToast('Could not open backup.', 'danger');
                }
            }

            async function copyBackupText() {
                const ta = document.getElementById('backupTextArea');
                if (!ta) {
                    showToast('Backup area not found.', 'danger');
                    return;
                }
                const text = ta.value;
                if (!text) {
                    showToast('Nothing to copy.', 'warning');
                    return;
                }
                try {
                    if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(text);
                        showToast('Backup copied to clipboard!', 'success');
                        return;
                    }
                } catch (_) { /* fall through to manual copy */ }
                ta.focus({ preventScroll: true });
                ta.select();
                ta.setSelectionRange(0, text.length);
                let copied = false;
                try { copied = document.execCommand('copy'); } catch (_) {}
                showToast(
                    copied ? 'Backup copied to clipboard!' : 'Text selected — use your keyboard Copy button.',
                    copied ? 'success' : 'info'
                );
            }

            function restoreFromText() {
                const text = document.getElementById('backupTextArea').value.trim();
                if (!text) { showToast('Paste your backup text first.', 'warning'); return; }
                let data;
                try {
                    data = JSON.parse(text);
                } catch (_) {
                    showToast('Invalid backup text. Check for missing/extra characters.', 'danger');
                    return;
                }
                if (!data || !Array.isArray(data.transactions)) {
                    showToast('Invalid backup format. Expected a "transactions" list.', 'danger');
                    return;
                }
                data = ensureMoneyData(data);
                if (!confirm('This will REPLACE all current data with the pasted backup. Continue?')) return;
                saveStorage(data);
                showToast('Data restored successfully!', 'success');
                Sheet.close();
                refreshTradeListViews();
                renderMoney();
                renderSettings();
                refreshActiveMoreView();
            }

            function resetData() {
                const syncNote = getSyncCode() ? '<p class="text-sm text-base-content/60 mb-2"><i class="fas fa-cloud mr-1"></i>You are connected to Cloud Sync, so this will also delete the data on <span class="font-medium text-base-content/80">all synced devices</span>.</p>' : '';
                AppDialog.open(
                    '<span class="text-error"><i class="fas fa-exclamation-triangle mr-2"></i>Reset All Data?</span>',
                    `<p class="mb-2 font-semibold text-base-content/80">This will permanently delete ALL your transactions.</p>
                    <p class="text-sm text-base-content/60 mb-2">This action <span class="text-error font-semibold">cannot be undone</span>.</p>${syncNote}
                    <p class="text-sm text-base-content/60 mb-0">Tip: use <span class="font-medium text-base-content/80">Backup as Text</span> first.</p>`,
                    renderAppButtonRow('Cancel', 'Delete Everything', {
                        cancelOnClick: 'closeDialog()',
                        actionOnClick: 'performReset()',
                        actionVariant: 'danger',
                        actionLabelHtml: '<i class="fas fa-trash-alt mr-1"></i> Delete Everything',
                        cancelInForm: false
                    })
                );
            }

            function performReset() {
                saveStorage({
                    transactions: [],
                    moneyAccounts: [],
                    moneyEntries: []
                });
                AppDialog.close();
                moneyAccountFilter = 'all';
                moneyPageTypeFilter = 'all';
                moneyPageFrom = null;
                moneyPageTo = null;
                moneyPageRangeKey = 'all';
                showToast('All data permanently deleted.', 'danger');
                refreshTradeListViews();
                renderMoney();
                renderSettings();
                refreshActiveMoreView();
            }

            // ---------- INIT ----------
            document.addEventListener('DOMContentLoaded', function() {
                BottomBar.mount(document.getElementById('bottomBarMount'), {
                    onNavigate: navigateTo,
                    onFabClick: openAddModal
                });

                initModals();
                initDropdowns();
                initCompanyAutocomplete();
                migrateChargeLogic();
                migrateTradeCompanySymbols();
                initDateFields();

                const range = getThisWeekMonFriRange();
                pastRangeDays = 'this-week';
                pastFrom = range.from;
                pastTo = range.to;
                setDateInputValue(document.getElementById('pastFrom'), pastFrom);
                setDateInputValue(document.getElementById('pastTo'), pastTo);
                setRangeButtonsActive('#pastRangeButtons', 'this-week');

                if (!restoreNavState()) {
                    navigateTo('trades');
                    startTradeLiveRefresh();
                }

                setTxBroker('');
                syncMoneyTypeDropdowns();
                syncMoneyHistoryTypeDropdown();
                syncMoneyAccountFilterDropdown(getMoneyAccounts());

                setSyncHooks({
                    showToast,
                    showLoading,
                    hideLoading,
                    renderSettings,
                    refreshAllViews,
                    onRemoteApplied: () => {
                        try { migrateTradeCompanySymbols(); } catch (_) {}
                    },
                    migrateTradeCompanySymbols
                });
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
                    if (!document.getElementById('page-plan').classList.contains('hidden')) {
                        renderPlanTrades();
                    }
                    if (!document.getElementById('page-trades').classList.contains('hidden')) {
                        renderCurrentView();
                    }
                    if (!document.getElementById('page-past').classList.contains('hidden')) {
                        renderPastTrades();
                    }
                    if (!document.getElementById('page-market').classList.contains('hidden')) {
                        try { renderMarketPage(); } catch (_) {}
                    }
                    if (!document.getElementById('page-money').classList.contains('hidden')) {
                        renderMoney();
                    }
                    refreshActiveMoreView();
                    // iOS often suspends timers while backgrounded — restart feeds.
                    ensureLiveFeedsForVisiblePage();
                });
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
                    moreFeatureMap: { money: 'page-money', transactions: 'page-transactions', 'mtf-calc': 'page-mtf-calc' },
                    moreFeatureTitles: {
                        money: '<i class="fas fa-coins mr-2"></i>Money',
                        transactions: '<i class="fas fa-database mr-2"></i>Total Transactions',
                        'mtf-calc': '<i class="fas fa-calculator mr-2"></i>MTF Calculator'
                    }
                },
                tradePages: {
                    getTransactions,
                    isPlannedTrade,
                    isActiveOpenTrade,
                    sortTradesByHoldDays,
                    resolveTradeMetrics,
                    getPastFiltered,
                    getTransactionStats,
                    getPlanSearchQuery: () => planSearchQuery,
                    getTradeSearchQuery: () => tradeSearchQuery,
                    getPastSearchQuery: () => pastSearchQuery,
                    getSearchQuery: () => searchQuery,
                    getSearchContext: () => searchContext,
                    getTradesViewMode: () => tradesViewMode,
                    getPastFrom: () => pastFrom,
                    getPastTo: () => pastTo,
                    resolveTradeLiveSymbol,
                    getTradeLiveQuote,
                    isTradeLiveRefreshing,
                    getEffectiveSellPrice,
                    estimateLiveSellReturn
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
                    getMoneyAccounts,
                    renderSyncStatus
                },
                moneyPages: {
                    getMoneyAccounts,
                    getMoneyEntries,
                    moneyPageFiltersActive,
                    moneyPageDateFilterActive,
                    matchesMoneyPageEntryFilter,
                    getMoneyPageFilterViewTitle,
                    getMoneyPageFilteredEntries,
                    syncMoneyPageFilterUI,
                    syncMoneyTypeDropdowns,
                    syncMoneyAccountFilterDropdown,
                    getMoneyAccountFilter: () => moneyAccountFilter,
                    getMoneyPageTypeFilter: () => moneyPageTypeFilter,
                    getMoneyPageFrom: () => moneyPageFrom,
                    getMoneyPageTo: () => moneyPageTo,
                    getMoneyPageRangeKey: () => moneyPageRangeKey,
                    setMoneyAccountFilter,
                    getMoneyHistorySheetAccountId: () => moneyHistorySheetAccountId,
                    getMoneyHistorySheetTitle,
                    syncMoneyHistoryFilterUI,
                    filterMoneyHistoryEntries,
                    getMoneyHistoryActiveFilterLabel,
                    moneyHistoryFiltersActive,
                    moneyHistoryDateFilterActive,
                    getMoneyHistoryFrom: () => moneyHistoryFrom,
                    getMoneyHistoryTo: () => moneyHistoryTo
                },
                calculator: {
                    BROKER_CONFIG,
                    getChargeConfig,
                    getDhanInterestRate,
                    calculateTrade,
                    isSameDayTrade,
                    interestDetails
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
                    resolveCompanyName,
                    resolveCompanySymbol,
                    getTomorrowDateKey,
                    getSyncNote: () => (isSyncConnected() ? ' and synced' : ''),
                    refreshTradeListViews,
                    renderMoney,
                    refreshActiveMoreView,
                    confirmDelete
                },
                moneyModal: {
                    getMoneyAccounts,
                    getMoneyEntry,
                    getNowTime,
                    addMoneyEntry,
                    updateMoneyEntry,
                    setMoneyHistorySheetAccountId: (id) => { moneyHistorySheetAccountId = id; },
                    renderMoney,
                    refreshMoneyHistorySheetIfOpen,
                    getSyncNote: () => (isSyncConnected() ? ' and synced' : '')
                }
            };

            window.closeSheet = closeSheet;
            window.closeDialog = closeDialog;

            window.navigateTo = navigateTo;
            window.openMoreFeature = openMoreFeature;
            window.backToMoreHub = backToMoreHub;
            window.openAddModal = openAddModal;
            window.onTxStatusChange = onTxStatusChange;
            window.onTxCompanyInput = onTxCompanyInput;
            window.onTxCompanyKeydown = onTxCompanyKeydown;
            window.onTxCompanyFocus = onTxCompanyFocus;
            window.onTxCompanyBlur = onTxCompanyBlur;
            window.selectStockSymbol = selectStockSymbol;
            window.openEditModal = openEditModal;
            window.openViewModal = openViewModal;
            window.openViewFromEditor = openViewFromEditor;
            window.copyTransaction = copyTransaction;
            window.confirmCopy = confirmCopy;
            window.confirmVerifyTrade = confirmVerifyTrade;
            window.confirmExecuteTrade = confirmExecuteTrade;
            window.confirmCloseTrade = confirmCloseTrade;
            window.confirmDelete = confirmDelete;
            window.deleteTradeFromEditor = deleteTradeFromEditor;
            window.saveTransaction = saveTransaction;
            window.openBackupTextModal = openBackupTextModal;
            window.checkMarketFeed = checkMarketFeed;
            window.openSettingsPage = openSettingsPage;
            window.backFromSettings = backFromSettings;
            window.copyBackupText = copyBackupText;
            window.restoreFromText = restoreFromText;
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
            window.saveHoldDates = saveHoldDates;
            window.openChargesModal = openChargesModal;
            window.openInterestModal = openInterestModal;
            window.renderCurrentView = renderCurrentView;
            window.renderPastTrades = renderPastTrades;
            window.renderMarketPage = renderMarketPage;
            window.refreshMarketQuotes = refreshMarketQuotes;
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
            window.renderTransactions = renderTransactions;
            window.updateMtfCalculator = updateMtfCalculator;
            window.openCalcBreakdownSheet = openCalcBreakdownSheet;
            window.onCalcDateInput = onCalcDateInput;
            window.setCalcSameDay = setCalcSameDay;
            window.setCalcTodayPair = setCalcTodayPair;
            window.setCalcSellPct = setCalcSellPct;
            window.onCalcBuyPriceInput = onCalcBuyPriceInput;
            window.onCalcSellPriceInput = onCalcSellPriceInput;
            window.addCalcSellPctPreset = addCalcSellPctPreset;
            window.renderSettings = renderSettings;
            window.setTradeSearch = setTradeSearch;
            window.setTradesViewMode = setTradesViewMode;
            window.openSearchPage = openSearchPage;
            window.closeSearchPage = closeSearchPage;
            window.runSearchPage = runSearchPage;
            window.clearSearchPage = clearSearchPage;
            window.clearTradeSearch = clearTradeSearch;
            window.setPastSearch = setPastSearch;
            window.clearPastSearch = clearPastSearch;
            window.setPlanSearch = setPlanSearch;
            window.clearPlanSearch = clearPlanSearch;
            window.applyPastRangeFilter = applyPastRangeFilter;
            window.setPastRange = setPastRange;
            window.onPastFilterDateChange = onPastFilterDateChange;
            window.openFilterSheet = openFilterSheet;
            window.setPastPnlFilter = setPastPnlFilter;
            window.updatePreview = updatePreview;
            window.connectSyncFromInput = connectSyncFromInput;
            window.disconnectSync = disconnectSync;
            window.renderMoney = renderMoney;
            window.toggleMoneyAccountExpand = toggleMoneyAccountExpand;
            window.toggleTradeDateGroupExpand = toggleTradeDateGroupExpand;
            window.setMoneyAccountFilter = setMoneyAccountFilter;
            window.openAccountHistorySheet = openAccountHistorySheet;
            window.setMoneyHistoryTypeFilter = setMoneyHistoryTypeFilter;
            window.setMoneyHistoryRange = setMoneyHistoryRange;
            window.applyMoneyHistoryDateRange = applyMoneyHistoryDateRange;
            window.openMoneyHistoryRangeSheet = openMoneyHistoryRangeSheet;
            window.openMoneyPageFilterSheet = openMoneyPageFilterSheet;
            window.setMoneyPageTypeFilter = setMoneyPageTypeFilter;
            window.pickMoneyPageTypeFilter = pickMoneyPageTypeFilter;
            window.setTxBroker = setTxBroker;
            window.setMoneyPageRangeInForm = setMoneyPageRangeInForm;
            window.applyMoneyPageFilter = applyMoneyPageFilter;
            window.clearMoneyPageFilters = clearMoneyPageFilters;
            window.onMoneyPageDateInputChange = onMoneyPageDateInputChange;
            window.clearMoneyHistoryFilters = clearMoneyHistoryFilters;
            window.onMoneyEntryTypeToggle = onMoneyEntryTypeToggle;
            window.setMoneyEntryType = setMoneyEntryType;
            window.toggleMoneyEntryDateTimeEdit = toggleMoneyEntryDateTimeEdit;
            window.onMoneyEntryDateTimeChange = onMoneyEntryDateTimeChange;
            window.openMoneyEntryModal = openMoneyEntryModal;
            window.updateMoneyEntryAmountPreview = updateMoneyEntryAmountPreview;
            window.openEditMoneyEntryModal = openEditMoneyEntryModal;
            window.saveMoneyEntry = saveMoneyEntry;
            window.openAddMoneyAccountModal = openAddMoneyAccountModal;
            window.updateMoneyAccountOpeningPreview = updateMoneyAccountOpeningPreview;
            window.openMoneyAccountModal = openMoneyAccountModal;
            window.saveMoneyAccount = saveMoneyAccount;
            window.confirmDeleteMoneyAccount = confirmDeleteMoneyAccount;
            window.confirmDeleteMoneyEntry = confirmDeleteMoneyEntry;

        })(typeof window !== 'undefined' ? window : globalThis);
