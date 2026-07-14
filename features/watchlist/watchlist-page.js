/**
 * Watchlist page — live NSE quotes for stocks you pick, matching the new Minimal Redesign.
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
        const sign = n > 0 ? '+' : '';
        return sign + Number(n).toFixed(2) + '%';
    }

    function formatChangeAbs(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        const sign = n > 0 ? '+' : (n < 0 ? '−' : '');
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
        const tones = ['red', 'blue', 'green', 'purple'];
        return tones[Math.abs(h) % 4];
    }

    function getSparklineSVG(isPositive) {
        const color = isPositive ? '#16A34A' : '#DC2626';
        const path = isPositive 
            ? 'M0,15 L10,12 L20,14 L30,8 L40,10 L50,2' 
            : 'M0,2 L10,5 L20,3 L30,12 L40,10 L50,15';
        return `
            <svg class="wl-sparkline" viewBox="0 0 50 20" preserveAspectRatio="none">
                <path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    function renderMarketSummaryCarousel() {
        const indices = [
            { name: 'NIFTY 50', price: 24197.30, change: 245.15, changePct: 1.02 },
            { name: 'SENSEX', price: 79255.18, change: 775.19, changePct: 0.99 },
            { name: 'BANK NIFTY', price: 51659.80, change: 326.55, changePct: 0.64 },
            { name: 'INDIA VIX', price: 12.18, change: -0.24, changePct: -1.93 }
        ];

        return indices.map(idx => {
            const isPositive = idx.change >= 0;
            const sign = isPositive ? '+' : '';
            const toneClass = isPositive ? 'text-positive' : 'text-negative';
            const priceText = Number(idx.price).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            const changeText = sign + Number(idx.change).toFixed(2);
            const pctText = sign + Number(idx.changePct).toFixed(2) + '%';
            
            return `
                <div class="wl-carousel-card">
                    <div class="wl-carousel-title">${escapeHtml(idx.name)}</div>
                    <div class="wl-carousel-val">${priceText}</div>
                    <div class="wl-carousel-change ${toneClass}">${changeText} (${pctText})</div>
                    ${getSparklineSVG(isPositive)}
                </div>
            `;
        }).join('');
    }

    function renderMarketQuoteRow(quote) {
        const q = quote || {};
        const change = Number(q.change);
        const changePct = Number(q.changePct);
        const hasChange = !isNaN(change);
        const isPositive = change >= 0;
        
        const priceText = formatPrice(q.price);
        const changeAbsText = hasChange ? formatChangeAbs(change) : '—';
        const changePctText = hasChange ? formatChangePct(changePct) : '—';
        const toneClass = hasChange ? (isPositive ? 'text-positive' : 'text-negative') : 'text-muted';
        
        const name = q.name || q.symbol || '';
        const sym = q.symbol || '—';
        const avatarTone = hashSymbolTone(sym);
        
        // Mock day range calculations
        const currentPrice = Number(q.price) || 0;
        // fallback range if we don't have real data
        const low = currentPrice * 0.95;
        const high = currentPrice * 1.05;
        const rangePct = 50; // mock marker in the middle

        return `
            <div class="wl-cell" data-quote-symbol="${escapeHtml(q.symbol || '')}" data-ref="market.quote-row">
                <!-- Left: Avatar + Company -->
                <div class="wl-avatar wl-avatar-${avatarTone}">${escapeHtml(symbolInitial(sym))}</div>
                <div class="wl-meta">
                    <div class="wl-symbol">${escapeHtml(sym)}</div>
                    <div class="wl-name">${escapeHtml(name)}</div>
                </div>
                
                <!-- Price / Abs Change -->
                <div class="wl-price-col">
                    <div class="wl-price" data-quote-price>${priceText}</div>
                    <div class="wl-change ${toneClass}" data-quote-change-abs>${escapeHtml(changeAbsText)}</div>
                </div>

                <!-- Pct Change / Sparkline -->
                <div class="wl-pct-col">
                    <div class="wl-pct ${toneClass}" data-quote-change-pct>${escapeHtml(changePctText)}</div>
                    ${hasChange ? getSparklineSVG(isPositive) : ''}
                </div>

                <!-- Day Range -->
                <div class="wl-range-col">
                    <div class="wl-range-labels">
                        <span>₹${low.toFixed(2)}</span>
                        <span>₹${high.toFixed(2)}</span>
                    </div>
                    <div class="wl-range-bar">
                        <div class="wl-range-fill ${!isPositive ? 'is-red' : ''}" style="left: 20%; right: 20%;"></div>
                        <div class="wl-range-marker" style="left: ${rangePct}%;"></div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="wl-action-col">
                    <button class="wl-btn" aria-label="Notify"><i class="far fa-bell"></i></button>
                    <button class="wl-btn" aria-label="More" ${q.removable ? `data-remove-symbol="${escapeHtml(q.symbol || '')}"` : ''}><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </div>
        `;
    }

    function marketPages() {
        return (global.MTFAppHelpers || {}).marketPages || {};
    }

    function comps() {
        return global.MTFComponents || {};
    }

    function renderMarketPage() {
        const { renderPageEmptyCard } = comps();
        const {
            getMarketQuotes = () => [],
            getMarketError = () => '',
            syncMarketSubTabUI
        } = marketPages();

        if (typeof syncMarketSubTabUI === 'function') syncMarketSubTabUI();

        const listContainer = document.getElementById('marketQuotesList');
        const carouselContainer = document.getElementById('marketSummaryCarousel');
        const countContainer = document.getElementById('marketStockCount');
        const updatedContainer = document.getElementById('marketLastUpdated');
        
        const error = getMarketError() || '';
        const quotes = getMarketQuotes() || [];

        // 1. Update Carousel
        if (carouselContainer) {
            carouselContainer.innerHTML = renderMarketSummaryCarousel();
        }

        // 2. Update Footer Stats
        if (countContainer) {
            countContainer.textContent = `${quotes.length} / 50 stocks`;
        }
        if (updatedContainer) {
            updatedContainer.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        // 3. Update List
        if (!listContainer) return;
        if (typeof renderPageEmptyCard !== 'function') {
            listContainer.innerHTML = '';
            return;
        }

        if (quotes.length === 0) {
            listContainer.innerHTML = renderPageEmptyCard(
                error ? 'fa-wifi' : 'fa-star',
                error ? 'Could not load prices' : 'Watchlist is empty',
                error || 'Tap Add Stock to build your watchlist.'
            );
            return;
        }

        listContainer.innerHTML = quotes.map(renderMarketQuoteRow).join('');
        
        if (typeof global.observeQuoteRows === 'function') {
            global.observeQuoteRows();
        }
    }

    global.MTFRegister({ renderMarketQuoteRow, formatChangePct, formatChangeAbs, renderMarketPage });
})(typeof window !== 'undefined' ? window : globalThis);
