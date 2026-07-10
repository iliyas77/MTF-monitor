/**
 * O11–O12 — Trade list and date-group organisms.
 */
(function (global) {
    'use strict';

    const { fmtDateDisplay, renderDateChip, renderAmount, appTag } = global.MTFComponents;

    function tradeDateKey(t, field = 'buyDate') {
        const d = t[field];
        if (!d) return 'unknown';
        return new Date(d).toISOString().split('T')[0];
    }

    function groupTradesByDate(trades, dateField = 'buyDate') {
        const groups = new Map();
        trades.forEach((t) => {
            const key = tradeDateKey(t, dateField);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(t);
        });
        return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }

    function renderTradesList(trades, renderItem) {
        return `<div class="d-flex flex-column gap-3 w-100">${trades.map((item, i) => renderItem(item, i + 1)).join('')}</div>`;
    }

    function renderFlatTradesList(trades, renderItem) {
        return renderTradesList(trades, renderItem);
    }

    function renderDateGroupHeader(dateKey, items, opts = {}) {
        const { expanded = false } = opts;
        const count = items.length;
        const net = items.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0);
        const label = dateKey === 'unknown' ? 'No date' : fmtDateDisplay(dateKey);
        const tradeLabel = count === 1 ? '1 trade' : `${count} trades`;
        const dateLabel = dateKey === 'unknown'
            ? `<span class="fw-semibold text-body-secondary">${label}</span>`
            : renderDateChip(label, { size: 'sm' });
        return `
            <button type="button" class="btn btn-link text-decoration-none text-body p-0 w-100 text-start" onclick="toggleTradeDateGroupExpand(this)" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} trades for ${label}">
                <div class="d-flex justify-content-between align-items-center gap-2">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                        <span data-trade-date-expand-icon class="d-inline-flex">${global.MTFComponents.renderIcon('fa-chevron-down', { className: `text-muted${expanded ? ' fa-rotate-180' : ''}` })}</span>
                        ${dateLabel}
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-shrink-0">
                        ${renderAmount(net, { size: 'sm', compact: true, showSign: true, align: 'right', pill: false })}
                        ${appTag(tradeLabel)}
                    </div>
                </div>
            </button>
        `;
    }

    function renderGroupedTrades(trades, renderItem, dateField = 'buyDate', opts = {}) {
        const { wrapInCard = false, defaultExpanded = false } = opts;
        return groupTradesByDate(trades, dateField).map(([dateKey, items], idx) => {
            const expanded = defaultExpanded;
            const header = renderDateGroupHeader(dateKey, items, { expanded });
            const itemsHtml = renderTradesList(items, renderItem);
            if (wrapInCard) {
                return `
                    <section data-trade-date-group class="${expanded ? '' : ''}">
                        <div class="card bg-body rounded">
                            <div class="card-body p-3">
                                ${header}
                                <div data-trade-date-list class="${expanded ? '' : 'd-none'}">${itemsHtml}</div>
                            </div>
                        </div>
                    </section>
                `;
            }
            return `
                <section class="${idx ? 'mt-4' : ''}" data-trade-date-group>
                    ${header}
                    <div data-trade-date-list class="${expanded ? '' : 'd-none'}">${itemsHtml}</div>
                </section>
            `;
        }).join('');
    }

    global.MTFRegister({
        tradeDateKey,
        groupTradesByDate,
        renderTradesList,
        renderFlatTradesList,
        renderDateGroupHeader,
        renderGroupedTrades
    });
})(typeof window !== 'undefined' ? window : globalThis);
