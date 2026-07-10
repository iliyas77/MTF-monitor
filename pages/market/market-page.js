/**
 * Market page — live NSE quotes for In Trade / Watchlist.
 */
(function (global) {
    'use strict';

    const {
        renderMarketQuoteRow,
        renderPageEmptyCard
    } = global.MTFComponents;

    function marketPages() {
        return (global.MTFAppHelpers || {}).marketPages || {};
    }

    function formatUpdatedAt(iso) {
        if (!iso) return 'Not updated yet';
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return 'Not updated yet';
            return 'Updated ' + d.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (_) {
            return 'Not updated yet';
        }
    }

    function renderMarketPage() {
        const {
            getMarketQuotes = () => [],
            getMarketFilterQuery = () => '',
            getMarketUpdatedAt = () => null,
            getMarketLoading = () => false,
            getMarketError = () => '',
            getMarketSubTab = () => 'in-trade',
            syncMarketSubTabUI
        } = marketPages();

        if (typeof syncMarketSubTabUI === 'function') syncMarketSubTabUI();

        const statusEl = document.getElementById('marketUpdatedAt');
        const refreshBtn = document.getElementById('marketRefreshBtn');
        const listContainer = document.getElementById('marketQuotesList');
        const loading = getMarketLoading();
        const error = getMarketError() || '';
        const subTab = getMarketSubTab() === 'watchlist' ? 'watchlist' : 'in-trade';
        const filter = (getMarketFilterQuery() || '').trim().toLowerCase();
        let quotes = getMarketQuotes() || [];

        const sectionLabel = document.getElementById('marketSectionLabel');
        if (sectionLabel) {
            sectionLabel.textContent = subTab === 'watchlist' ? 'Watchlist' : 'Live market';
        }

        if (statusEl) {
            statusEl.textContent = loading
                ? 'Refreshing prices…'
                : formatUpdatedAt(getMarketUpdatedAt());
        }
        if (refreshBtn) {
            refreshBtn.disabled = !!loading;
            refreshBtn.classList.toggle('loading', !!loading);
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.toggle('fa-spin', !!loading);
        }

        if (!listContainer) return;

        if (subTab === 'in-trade' && filter) {
            quotes = quotes.filter((q) => {
                const sym = (q.symbol || '').toLowerCase();
                const name = (q.name || '').toLowerCase();
                return sym.includes(filter) || name.includes(filter);
            });
        }

        if (loading && quotes.length === 0) {
            listContainer.innerHTML = renderPageEmptyCard(
                'fa-spinner fa-spin',
                'Loading market prices',
                'Fetching live quotes from the internet…'
            );
            return;
        }

        if (error && quotes.length === 0) {
            listContainer.innerHTML = renderPageEmptyCard(
                'fa-wifi',
                'Could not load prices',
                error || 'Check your internet connection and tap Refresh.'
            );
            return;
        }

        if (quotes.length === 0) {
            if (subTab === 'watchlist') {
                listContainer.innerHTML = renderPageEmptyCard(
                    'fa-star',
                    'Watchlist is empty',
                    'Search to add stocks to your watchlist.'
                );
            } else if (filter) {
                listContainer.innerHTML = renderPageEmptyCard(
                    'fa-search',
                    `No quotes match “${filter}”`,
                    'Try another symbol or clear the search.'
                );
            } else {
                listContainer.innerHTML = renderPageEmptyCard(
                    'fa-briefcase',
                    'No open or planned trades',
                    'Companies from your open and planned trades will show here.'
                );
            }
            return;
        }

        listContainer.innerHTML = `<div class="market-quote-list" role="list">${quotes.map(renderMarketQuoteRow).join('')}</div>`;
        if (typeof global.observeQuoteRows === 'function') {
            global.observeQuoteRows();
        }
    }

    global.MTFRegister({ renderMarketPage });
})(typeof window !== 'undefined' ? window : globalThis);
