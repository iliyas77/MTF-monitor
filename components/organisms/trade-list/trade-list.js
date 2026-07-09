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
        return `<div class="trade-list">${trades.map((item, i) => renderItem(item, i + 1)).join('')}</div>`;
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
            ? `<span class="font-semibold text-base text-base-content/80">${label}</span>`
            : renderDateChip(label, { size: 'sm' });
        return `
            <button type="button" class="trade-date-group__header trade-date-group__header--toggle" onclick="toggleTradeDateGroupExpand(this)" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} trades for ${label}">
                <div class="flex justify-between items-center gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        ${global.MTFComponents.renderIcon('fa-chevron-down', { className: `trade-date-group__expand-icon${expanded ? ' trade-date-group__expand-icon--expanded' : ''}` })}
                        ${dateLabel}
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        ${renderAmount(net, { size: 'sm', compact: true, showSign: true, align: 'right', pill: false, className: 'trade-date-group__day-pnl' })}
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
                    <section class="trade-date-group${expanded ? ' trade-date-group--expanded' : ''}">
                        <div class="card bg-base-100 rounded-2xl">
                            <div class="card-body p-3">
                                ${header}
                                <div class="trade-date-group__list${expanded ? '' : ' trade-date-group__list--hidden'}">${itemsHtml}</div>
                            </div>
                        </div>
                    </section>
                `;
            }
            return `
                <section class="${idx ? 'mt-4' : ''}">
                    ${header}
                    ${itemsHtml}
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
