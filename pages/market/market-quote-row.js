/**
 * Market quote list row — icon + symbol/name left, price + day change right.
 * Visual language matches more-hub option rows.
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
            ? `<button type="button" class="market-quote-row__remove" onclick="removeMarketWatchlistSymbol('${escapeHtml(q.symbol || '')}')" aria-label="Remove from watchlist">${global.MTFComponents.renderIcon('fa-times', { size: 'sm' })}</button>`
            : '';

        return `<div class="market-quote-row" data-symbol="${escapeHtml(q.symbol || '')}" role="listitem">
            <span class="market-quote-row__icon market-quote-row__icon--${tone}" aria-hidden="true">${escapeHtml(symbolInitial(q.symbol))}</span>
            <div class="market-quote-row__left">
                <div class="market-quote-row__symbol">${escapeHtml(q.symbol || '—')}</div>
                <div class="market-quote-row__name">${escapeHtml(q.name || q.symbol || '')}</div>
            </div>
            <div class="market-quote-row__right">
                <div class="market-quote-row__price tabular-nums">${priceText}</div>
                <div class="market-quote-row__change market-quote-row__change--${tone} tabular-nums">${changeText}</div>
            </div>
            ${removeBtn}
        </div>`;
    }

    global.MTFRegister({ renderMarketQuoteRow, formatChangePct, formatChangeAbs });
})(typeof window !== 'undefined' ? window : globalThis);
