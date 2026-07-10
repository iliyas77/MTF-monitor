/**
 * Market quote list row — icon + symbol/name left, price + day change right.
 * Long names truncate with ellipsis so the price column stays visible.
 */
(function (global) {
    'use strict';

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatChangePct(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        const sign = n >= 0 ? '+' : '';
        return sign + Number(n).toFixed(2) + '%';
    }

    function formatChangeAbs(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        const sign = n >= 0 ? '+' : '−';
        return sign + '₹' + Number(Math.abs(n)).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function symbolInitial(symbol) {
        const s = String(symbol || '').trim();
        if (!s) return '•';
        return s.charAt(0).toUpperCase();
    }

    function toneClass(tone) {
        if (tone === 'up') return 'text-success bg-success-subtle';
        if (tone === 'down') return 'text-danger bg-danger-subtle';
        return 'text-body-secondary bg-light';
    }

    function renderMarketQuoteRow(quote) {
        const q = quote || {};
        const change = Number(q.change);
        const changePct = Number(q.changePct);
        const hasChange = !isNaN(change);
        const tone = !hasChange ? 'neutral' : change >= 0 ? 'up' : 'down';
        const priceText = q.price == null || isNaN(Number(q.price))
            ? '—'
            : '₹' + Number(q.price).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        const changeText = hasChange
            ? `${formatChangeAbs(change)} (${formatChangePct(changePct)})`
            : '—';
        const removeBtn = q.removable
            ? `<button type="button" class="btn btn-sm btn-outline-secondary rounded-circle flex-shrink-0 ms-1" onclick="removeMarketWatchlistSymbol('${escapeHtml(q.symbol || '')}')" aria-label="Remove from watchlist">${global.MTFComponents.renderIcon('fa-times', { size: 'sm' })}</button>`
            : '';

        const changeToneClass = tone === 'up' ? 'text-success' : tone === 'down' ? 'text-danger' : 'text-muted';
        const name = q.name || q.symbol || '';
        return `<div class="list-group-item px-3 py-3" data-quote-symbol="${escapeHtml(q.symbol || '')}" data-symbol="${escapeHtml(q.symbol || '')}" role="listitem">
            <div class="d-flex align-items-center gap-2 w-100 min-w-0">
                <span class="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 fw-semibold ${toneClass(tone)}" style="width:2rem;height:2rem" data-quote-icon aria-hidden="true">${escapeHtml(symbolInitial(q.symbol))}</span>
                <div class="flex-grow-1 min-w-0 overflow-hidden">
                    <div class="fw-semibold text-truncate">${escapeHtml(q.symbol || '—')}</div>
                    <div class="small text-muted text-truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
                </div>
                <div class="text-end flex-shrink-0" style="max-width:42%">
                    <div class="fw-semibold text-nowrap" data-quote-price>${priceText}</div>
                    <div class="small text-truncate ${changeToneClass}" data-quote-change title="${escapeHtml(changeText)}">${changeText}</div>
                </div>
                ${removeBtn}
            </div>
        </div>`;
    }

    global.MTFRegister({ renderMarketQuoteRow, formatChangePct, formatChangeAbs });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Market page — live NSE quotes for In Trade / Watchlist.
 */
(function (global) {
    'use strict';

    function marketPages() {
        return (global.MTFAppHelpers || {}).marketPages || {};
    }

    function comps() {
        return global.MTFComponents || {};
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
            renderMarketQuoteRow,
            renderPageEmptyCard
        } = comps();

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
            const icon = refreshBtn.querySelector('i');
            if (icon) icon.classList.toggle('fa-spin', !!loading);
        }

        if (!listContainer) return;
        if (typeof renderPageEmptyCard !== 'function' || typeof renderMarketQuoteRow !== 'function') {
            listContainer.innerHTML = '';
            return;
        }

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

        listContainer.innerHTML = `<div class="list-group list-group-flush" role="list">${quotes.map(renderMarketQuoteRow).join('')}</div>`;
        if (typeof global.observeQuoteRows === 'function') {
            global.observeQuoteRows();
        }
    }

    global.MTFRegister({ renderMarketPage });
})(typeof window !== 'undefined' ? window : globalThis);
