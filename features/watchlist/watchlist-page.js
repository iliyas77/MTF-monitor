/**
 * Market quote card — matches Positions trade-position-card layout.
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

    function formatPrice(n) {
        if (n === null || n === undefined || isNaN(Number(n))) return '—';
        return '₹' + Number(n).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function symbolInitial(symbol) {
        const s = String(symbol || '').trim();
        if (!s) return '•';
        return s.charAt(0).toUpperCase();
    }

    function hashSymbolTone(symbol) {
        const s = String(symbol || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h) % 6;
    }

    function renderMarketQuoteRow(quote) {
        const q = quote || {};
        const change = Number(q.change);
        const changePct = Number(q.changePct);
        const hasChange = !isNaN(change);
        const tone = !hasChange ? 'neutral' : change >= 0 ? 'up' : 'down';
        const priceText = formatPrice(q.price);
        const changeAbsText = hasChange ? formatChangeAbs(change) : '—';
        const changePctText = hasChange ? formatChangePct(changePct) : '—';
        const changeCombo = hasChange ? `${changeAbsText} (${changePctText})` : '—';
        const changeToneClass = tone === 'up' ? 'text-success' : tone === 'down' ? 'text-danger' : 'text-muted';
        const name = q.name || q.symbol || '';
        const sym = q.symbol || '—';
        const avatarTone = hashSymbolTone(sym);
        const prevClose = q.previousClose != null && !isNaN(Number(q.previousClose))
            ? formatPrice(q.previousClose)
            : '—';

        const removeBtn = q.removable
            ? `<button type="button" class="btn btn-sm btn-outline-secondary rounded-3 flex-fill market-remove-btn" data-remove-symbol="${escapeHtml(q.symbol || '')}" aria-label="Remove from watchlist"><i class="fas fa-trash-alt me-1" aria-hidden="true"></i>Remove</button>`
            : '';
        const buyBtn = `<button type="button" class="btn btn-sm btn-primary rounded-3 flex-fill market-buy-btn" data-buy-symbol="${escapeHtml(q.symbol || '')}" data-buy-name="${escapeHtml(name)}" aria-label="Buy ${escapeHtml(q.symbol || name || 'stock')}"><i class="fas fa-plus me-1" aria-hidden="true"></i>Buy</button>`;

        return `
            <article class="card bg-body border rounded w-100 trade-position-card market-quote-card"
                data-quote-symbol="${escapeHtml(q.symbol || '')}"
                data-symbol="${escapeHtml(q.symbol || '')}"
                role="listitem"
                aria-label="${escapeHtml(sym)}">
                <div class="card-body p-3 d-flex flex-column gap-3 min-w-0">
                    <div class="d-flex align-items-start gap-2 w-100 min-w-0">
                        <span class="trade-position-avatar trade-position-avatar--${avatarTone} flex-shrink-0" data-quote-icon aria-hidden="true">${escapeHtml(symbolInitial(sym))}</span>
                        <div class="min-w-0 flex-grow-1 overflow-hidden">
                            <div class="trade-position-name" title="${escapeHtml(sym)}">${escapeHtml(sym)}</div>
                            <div class="trade-position-meta">
                                <span class="text-truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                            </div>
                        </div>
                        <div class="trade-position-pnl flex-shrink-0 text-end">
                            <div class="fw-semibold text-nowrap" data-quote-price>${priceText}</div>
                            <div class="small text-truncate ${changeToneClass}" data-quote-change title="${escapeHtml(changeCombo)}">${escapeHtml(changeCombo)}</div>
                        </div>
                    </div>
                    <div class="trade-position-metrics">
                        <div class="trade-position-grid">
                            <div class="trade-position-cell">
                                <span class="trade-position-label">Day chg</span>
                                <span class="trade-position-value text-truncate ${changeToneClass}" data-quote-change-abs>${escapeHtml(changeAbsText)}</span>
                            </div>
                            <div class="trade-position-cell">
                                <span class="trade-position-label">Day %</span>
                                <span class="trade-position-value text-truncate ${changeToneClass}" data-quote-change-pct>${escapeHtml(changePctText)}</span>
                            </div>
                            <div class="trade-position-cell">
                                <span class="trade-position-label">Prev close</span>
                                <span class="trade-position-value text-truncate" data-quote-prev>${escapeHtml(prevClose)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-2 w-100">
                        ${buyBtn}
                        ${removeBtn}
                    </div>
                </div>
            </article>
        `;
    }

    global.MTFRegister({ renderMarketQuoteRow, formatChangePct, formatChangeAbs });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * Watchlist page — live NSE quotes for stocks you pick.
 */
(function (global) {
    'use strict';

    function marketPages() {
        return (global.MTFAppHelpers || {}).marketPages || {};
    }

    function comps() {
        return global.MTFComponents || {};
    }

    function renderMarketPage() {
        const {
            renderMarketQuoteRow,
            renderPageEmptyCard
        } = comps();

        const {
            getMarketQuotes = () => [],
            getMarketError = () => '',
            syncMarketSubTabUI
        } = marketPages();

        if (typeof syncMarketSubTabUI === 'function') syncMarketSubTabUI();

        const listContainer = document.getElementById('marketQuotesList');
        const error = getMarketError() || '';
        const quotes = getMarketQuotes() || [];

        if (!listContainer) return;
        if (typeof renderPageEmptyCard !== 'function' || typeof renderMarketQuoteRow !== 'function') {
            listContainer.innerHTML = '';
            return;
        }

        // Prefer the list (even with placeholder prices) over a "Refreshing…" label —
        // header refresh icon spins while the pool fetches one-by-one.
        if (quotes.length === 0) {
            listContainer.innerHTML = renderPageEmptyCard(
                error ? 'fa-wifi' : 'fa-star',
                error ? 'Could not load prices' : 'Watchlist is empty',
                error || 'Tap search in the header to add stocks.'
            );
            return;
        }

        listContainer.innerHTML = `<div class="trade-cards-stack d-flex flex-column w-100" role="list">${quotes.map(renderMarketQuoteRow).join('')}</div>`;
        if (typeof global.observeQuoteRows === 'function') {
            global.observeQuoteRows();
        }
    }

    global.MTFRegister({ renderMarketPage });
})(typeof window !== 'undefined' ? window : globalThis);
