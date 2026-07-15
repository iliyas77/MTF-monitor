/**
 * Gold & Silver Price Lookup Tool
 */
(function (global) {
    'use strict';

    // Global states
    let activeTab = 'gold'; // 'gold' or 'silver'
    let selectedCity = 'Hyderabad';
    let selectedDateStr = '';
    let countdownInterval = null;
    let secondsLeft = 60;
    
    // Loaded Prices caches
    let currentGoldRates = null;
    let currentSilverRates = null;
    let historicalGoldRates = [];
    let historicalSilverRates = [];

    // ==========================================
    // STYLING & FORMATTING HELPERS
    // ==========================================
    function formatUSD(value, fractionDigits = 2) {
        if (value == null || isNaN(value)) return '—';
        return '$' + Number(value).toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        });
    }

    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    function getFormattedDisplayDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // ==========================================
    // FILTERS INITIALIZATION & BINDING
    // ==========================================
    function initializeFilters() {
        const citySelect = document.getElementById('goldLookCity');
        const dateInput = document.getElementById('goldLookDate');
        const refreshBtn = document.getElementById('btnGoldLookRefresh');
        const retryBtn = document.getElementById('btnGoldLookRetry');

        if (citySelect) {
            citySelect.value = selectedCity;
            if (!citySelect.dataset.bound) {
                citySelect.dataset.bound = 'true';
                citySelect.addEventListener('change', (e) => {
                    selectedCity = e.target.value;
                    updateUI();
                });
            }
        }

        if (dateInput) {
            if (!selectedDateStr) {
                selectedDateStr = formatDate(new Date());
            }
            dateInput.value = selectedDateStr;
            dateInput.max = formatDate(new Date());

            if (!dateInput.dataset.bound) {
                dateInput.dataset.bound = 'true';
                dateInput.addEventListener('change', (e) => {
                    selectedDateStr = e.target.value;
                    updateUI();
                });
            }
        }

        if (refreshBtn && !refreshBtn.dataset.bound) {
            refreshBtn.dataset.bound = 'true';
            refreshBtn.addEventListener('click', () => {
                triggerManualRefresh();
            });
        }

        if (retryBtn && !retryBtn.dataset.bound) {
            retryBtn.dataset.bound = 'true';
            retryBtn.addEventListener('click', () => {
                updateUI();
            });
        }

        // Calculator Bindings
        const calcPurity = document.getElementById('calcLookPurity');
        const calcUnit = document.getElementById('calcLookUnit');
        const calcWeight = document.getElementById('calcLookWeight');

        const bindCalcChange = el => {
            if (el && !el.dataset.bound) {
                el.dataset.bound = 'true';
                el.addEventListener('input', calculateValue);
                el.addEventListener('change', calculateValue);
            }
        };
        bindCalcChange(calcPurity);
        bindCalcChange(calcUnit);
        bindCalcChange(calcWeight);

        // Tab Navigation Bindings
        const tabs = document.querySelectorAll('#goldSilverNavTabs button');
        tabs.forEach(tab => {
            if (!tab.dataset.bound) {
                tab.dataset.bound = 'true';
                tab.addEventListener('click', (e) => {
                    tabs.forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                    activeTab = tab.dataset.tab;

                    adaptCalculatorOptions();
                    updateUI();
                });
            }
        });
    }

    // ==========================================
    // VIEW CONTROLLER & RENDERERS
    // ==========================================
    function showSkeleton(show) {
        const loader = document.getElementById('goldLookLoadingState');
        const grid = document.getElementById('goldLookCardsGrid');
        if (loader && grid) {
            if (show) {
                loader.classList.remove('d-none');
                grid.classList.add('d-none');
            } else {
                loader.classList.add('d-none');
                grid.classList.remove('d-none');
            }
        }
    }

    function renderSummaryCards(goldRates, silverRates, todayGold, todaySilver, isComparisonActive) {
        const host = document.getElementById('goldLookSummaryHost');
        if (!host) return;

        let html = '';
        if (activeTab === 'gold') {
            const cardMarkup = (karat, selectedVal, todayVal) => {
                const diff = todayVal - selectedVal;
                let badge = '';
                if (isComparisonActive && diff !== 0) {
                    const diffText = diff > 0 ? `+${diff.toFixed(2)}` : `${diff.toFixed(2)}`;
                    const badgeClass = diff < 0 ? 'text-success' : 'text-danger';
                    badge = `<span class="${badgeClass} fw-bold small ms-2" style="font-size: 11px;">(${diffText})</span>`;
                }
                return `
                    <div class="col-4">
                        <div class="card border rounded-3 p-3 text-center bg-body h-100">
                            <span class="text-muted small fw-semibold d-block">${karat}</span>
                            <strong class="fs-6 text-dark d-block mt-1">${formatUSD(selectedVal, 2)}</strong>
                            <div class="d-flex align-items-center justify-content-center mt-1">
                                <span class="text-secondary" style="font-size: 10px;">USD / g</span>
                                ${badge}
                            </div>
                        </div>
                    </div>
                `;
            };

            html += cardMarkup('24K Gold', goldRates.p24, todayGold.p24);
            html += cardMarkup('22K Gold', goldRates.p22, todayGold.p22);
            html += cardMarkup('18K Gold', goldRates.p18, todayGold.p18);
        } else {
            const cardMarkup = (unit, selectedVal, todayVal, displayUnit) => {
                const diff = todayVal - selectedVal;
                let badge = '';
                if (isComparisonActive && diff !== 0) {
                    const diffText = diff > 0 ? `+${diff.toFixed(2)}` : `${diff.toFixed(2)}`;
                    const badgeClass = diff < 0 ? 'text-success' : 'text-danger';
                    badge = `<span class="${badgeClass} fw-bold small ms-2" style="font-size: 11px;">(${diffText})</span>`;
                }
                return `
                    <div class="col-6">
                        <div class="card border rounded-3 p-3 text-center bg-body h-100">
                            <span class="text-muted small fw-semibold d-block">Silver (${unit})</span>
                            <strong class="fs-6 text-dark d-block mt-1">${formatUSD(selectedVal, 2)}</strong>
                            <div class="d-flex align-items-center justify-content-center mt-1">
                                <span class="text-secondary" style="font-size: 10px;">USD / ${displayUnit}</span>
                                ${badge}
                            </div>
                        </div>
                    </div>
                `;
            };

            html += cardMarkup('per Gram', silverRates.sGram, todaySilver.sGram, 'g');
            html += cardMarkup('per Kilogram', silverRates.sKg, todaySilver.sKg, 'kg');
        }

        host.innerHTML = html;
    }

    function renderHistoricalTable() {
        const header = document.getElementById('historicalPricesHeader');
        const body = document.getElementById('historicalPricesBody');
        if (!header || !body) return;

        if (activeTab === 'gold') {
            header.innerHTML = `
                <th scope="col" class="py-2 px-3 text-start">Date</th>
                <th scope="col" class="py-2 text-center">24K</th>
                <th scope="col" class="py-2 text-center">22K</th>
                <th scope="col" class="py-2 text-center">18K</th>
            `;

            const rows = [];
            for (let i = 0; i < historicalGoldRates.length; i++) {
                const rates = historicalGoldRates[i];
                const prevRates = historicalGoldRates[i + 1];
                const isSelectedRow = (rates.date === selectedDateStr);
                const highlightClass = isSelectedRow ? 'table-warning fw-bold' : '';

                let diff24Text = '';
                let diff22Text = '';
                let diff18Text = '';

                if (prevRates) {
                    const diff24 = rates.p24 - prevRates.p24;
                    const diff22 = rates.p22 - prevRates.p22;
                    const diff18 = rates.p18 - prevRates.p18;

                    const formatDiff = (diff) => {
                        if (diff > 0) return `<span class="text-success ms-1" style="font-size: 10px; font-weight: 700;">(+${diff.toFixed(2)})</span>`;
                        if (diff < 0) return `<span class="text-danger ms-1" style="font-size: 10px; font-weight: 700;">(${diff.toFixed(2)})</span>`;
                        return `<span class="text-secondary ms-1" style="font-size: 10px; font-weight: 600;">(0.00)</span>`;
                    };

                    diff24Text = formatDiff(diff24);
                    diff22Text = formatDiff(diff22);
                    diff18Text = formatDiff(diff18);
                }

                rows.push(`
                    <tr class="${highlightClass}">
                        <td class="py-2 px-3 text-start">${getFormattedDisplayDate(rates.date)}</td>
                        <td class="py-2 text-center">${formatUSD(rates.p24, 2)}${diff24Text}</td>
                        <td class="py-2 text-center">${formatUSD(rates.p22, 2)}${diff22Text}</td>
                        <td class="py-2 text-center">${formatUSD(rates.p18, 2)}${diff18Text}</td>
                    </tr>
                `);
            }
            body.innerHTML = rows.join('');
        } else {
            header.innerHTML = `
                <th scope="col" class="py-2 px-3 text-start">Date</th>
                <th scope="col" class="py-2 text-center">Silver / Gram</th>
                <th scope="col" class="py-2 text-center">Silver / Kg</th>
            `;

            const rows = [];
            for (let i = 0; i < historicalSilverRates.length; i++) {
                const rates = historicalSilverRates[i];
                const prevRates = historicalSilverRates[i + 1];
                const isSelectedRow = (rates.date === selectedDateStr);
                const highlightClass = isSelectedRow ? 'table-warning fw-bold' : '';

                let diffGramText = '';
                let diffKgText = '';

                if (prevRates) {
                    const diffGram = Number((rates.sGram - prevRates.sGram).toFixed(2));
                    const diffKg = Number((rates.sKg - prevRates.sKg).toFixed(2));

                    const formatDiffGram = (diff) => {
                        if (diff > 0) return `<span class="text-success ms-1" style="font-size: 10px; font-weight: 700;">(+${diff.toFixed(2)})</span>`;
                        if (diff < 0) return `<span class="text-danger ms-1" style="font-size: 10px; font-weight: 700;">(${diff.toFixed(2)})</span>`;
                        return `<span class="text-secondary ms-1" style="font-size: 10px; font-weight: 600;">(0.00)</span>`;
                    };

                    const formatDiffKg = (diff) => {
                        if (diff > 0) return `<span class="text-success ms-1" style="font-size: 10px; font-weight: 700;">(+${diff.toFixed(2)})</span>`;
                        if (diff < 0) return `<span class="text-danger ms-1" style="font-size: 10px; font-weight: 700;">(${diff.toFixed(2)})</span>`;
                        return `<span class="text-secondary ms-1" style="font-size: 10px; font-weight: 600;">(0.00)</span>`;
                    };

                    diffGramText = formatDiffGram(diffGram);
                    diffKgText = formatDiffKg(diffKg);
                }

                rows.push(`
                    <tr class="${highlightClass}">
                        <td class="py-2 px-3 text-start">${getFormattedDisplayDate(rates.date)}</td>
                        <td class="py-2 text-center">${formatUSD(rates.sGram, 2)}${diffGramText}</td>
                        <td class="py-2 text-center">${formatUSD(rates.sKg, 2)}${diffKgText}</td>
                    </tr>
                `);
            }
            body.innerHTML = rows.join('');
        }
    }

    async function updateUI() {
        showSkeleton(true);
        const errorView = document.getElementById('goldLookErrorState');
        if (errorView) errorView.classList.add('d-none');

        try {
            // 1. Fetch current pricing data from services
            const [goldRates, silverRates] = await Promise.all([
                global.GoldPriceService.getPrice(selectedCity, selectedDateStr),
                global.SilverPriceService.getPrice(selectedCity, selectedDateStr)
            ]);

            if (!goldRates || !silverRates) {
                throw new Error('No pricing data available for the selected date.');
            }

            // 2. Fetch 30-day history ending with selected date
            const [goldHistory, silverHistory] = await Promise.all([
                global.GoldPriceService.getHistory(selectedCity, selectedDateStr, 30),
                global.SilverPriceService.getHistory(selectedCity, selectedDateStr, 30)
            ]);

            currentGoldRates = goldRates;
            currentSilverRates = silverRates;
            historicalGoldRates = goldHistory;
            historicalSilverRates = silverHistory;

            // 3. Fetch today's rate for comparison changes
            const todayStr = formatDate(new Date());
            const [todayGold, todaySilver] = await Promise.all([
                global.GoldPriceService.getPrice(selectedCity, todayStr),
                global.SilverPriceService.getPrice(selectedCity, todayStr)
            ]);

            const comparisonGold = todayGold || goldRates;
            const comparisonSilver = todaySilver || silverRates;
            const isComparisonActive = (selectedDateStr !== todayStr);

            // 4. Render Layout Panels
            renderSummaryCards(goldRates, silverRates, comparisonGold, comparisonSilver, isComparisonActive);
            renderHistoricalTable();
            calculateValue();

            showSkeleton(false);
        } catch (err) {
            console.error('Update UI error:', err);
            showSkeleton(false);
            
            if (errorView) {
                const errorMessageEl = errorView.querySelector('p');
                if (errorMessageEl) {
                    errorMessageEl.textContent = err.message || "Failed to fetch prices.";
                }
                errorView.classList.remove('d-none');
            }
        }
    }

    // ==========================================
    // CALCULATOR CONTROLLER
    // ==========================================
    function adaptCalculatorOptions() {
        const calcPurity = document.getElementById('calcLookPurity');
        const calcUnit = document.getElementById('calcLookUnit');

        if (!calcPurity || !calcUnit) return;

        if (activeTab === 'gold') {
            calcPurity.innerHTML = `
                <option value="24K">24K Gold</option>
                <option value="22K">22K Gold</option>
                <option value="18K">18K Gold</option>
            `;
            calcUnit.style.display = 'block';
        } else {
            calcPurity.innerHTML = `
                <option value="Gram">Silver / Gram</option>
                <option value="Kg">Silver / Kg</option>
            `;
            calcUnit.style.display = 'none';
        }
    }

    function calculateValue() {
        const purityVal = document.getElementById('calcLookPurity')?.value || '24K';
        const weightInput = document.getElementById('calcLookWeight');
        const weight = parseFloat(weightInput?.value || 0);
        const resultDisplay = document.getElementById('calcLookResult');

        if (!resultDisplay) return;

        if (isNaN(weight) || weight <= 0) {
            resultDisplay.textContent = formatUSD(0, 2);
            return;
        }

        let total = 0;
        if (activeTab === 'gold') {
            if (!currentGoldRates) {
                resultDisplay.textContent = formatUSD(0, 2);
                return;
            }
            const unitMultiplier = parseFloat(document.getElementById('calcLookUnit')?.value || 1);
            let ratePerGram = currentGoldRates.p24;
            if (purityVal === '22K') ratePerGram = currentGoldRates.p22;
            else if (purityVal === '18K') ratePerGram = currentGoldRates.p18;

            total = ratePerGram * unitMultiplier * weight;
        } else {
            if (!currentSilverRates) {
                resultDisplay.textContent = formatUSD(0, 2);
                return;
            }
            if (purityVal === 'Gram') {
                total = currentSilverRates.sGram * weight;
            } else {
                total = currentSilverRates.sKg * weight;
            }
        }

        resultDisplay.textContent = formatUSD(total, 2);
    }

    // ==========================================
    // COUNTDOWN TIMERS
    // ==========================================
    function updateCountdownBadge() {
        const badge = document.getElementById('goldCountdownBadge');
        if (badge) badge.textContent = `${secondsLeft}s`;
    }

    function startCountdown() {
        stopCountdown();
        secondsLeft = 60;
        updateCountdownBadge();
        countdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                secondsLeft = 60;
                triggerAutoRefresh();
            }
            updateCountdownBadge();
        }, 1000);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }

    async function triggerManualRefresh() {
        const refreshBtn = document.getElementById('btnGoldLookRefresh');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
        }

        // Clear local cache to simulate force refetching from endpoint API
        if (global.GoldPriceService?.clearCache) {
            global.GoldPriceService.clearCache();
        }
        if (global.SilverPriceService?.clearCache) {
            global.SilverPriceService.clearCache();
        }

        await updateUI();
        resetTimer();

        if (refreshBtn) {
            refreshBtn.disabled = false;
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.remove('fa-spin');
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Rates refreshed successfully.', 'success');
        }
    }

    async function triggerAutoRefresh() {
        await updateUI();
    }

    function resetTimer() {
        secondsLeft = 60;
        updateCountdownBadge();
    }

    // ==========================================
    // MOUNT / TEARDOWN LIFE ACTIONS
    // ==========================================
    function renderGoldPage() {
        initializeFilters();
        adaptCalculatorOptions();
        updateUI();
        startCountdown();
    }

    function stopGoldPageRefresh() {
        stopCountdown();
    }

    // Export module
    global.MTFRegister({
        renderGoldPage,
        stopGoldPageRefresh
    });
})(typeof window !== 'undefined' ? window : globalThis);
