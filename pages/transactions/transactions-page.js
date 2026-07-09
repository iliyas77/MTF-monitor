/**
 * O20 — Total transactions page render organism.
 */
(function (global) {
    'use strict';

    const {
        appTag,
        fmtDateDisplay,
        renderDateChip,
        renderAmount,
        paintAmount,
        groupTradesByDate,
        renderTradesList,
        renderTradeListItem,
        renderPageEmptyCard,
        LABEL_CLASSES
    } = global.MTFComponents;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function renderTransactionsDateGroupHeader(dateKey, items) {
        const label = dateKey === 'unknown' ? 'No date' : fmtDateDisplay(dateKey);
        const tradeLabel = items.length === 1 ? '1 trade' : `${items.length} trades`;
        const counts = {};
        items.forEach((t) => {
            const b = t.broker || 'Other';
            counts[b] = (counts[b] || 0) + 1;
        });
        const chips = Object.entries(counts).map(([b, n]) => appTag(`${b} ${n}`)).join('');
        return `
            <div class="mb-2">
                <div class="flex justify-between items-center">
                    ${dateKey === 'unknown' ? `<span class="font-semibold text-base-content">${label}</span>` : renderDateChip(label, { size: 'sm' })}
                    ${appTag(tradeLabel)}
                </div>
                ${chips ? `<div class="flex flex-wrap gap-1.5 mt-1">${chips}</div>` : ''}
            </div>
        `;
    }

    function renderGroupedTradesWithChips(trades, renderItem) {
        return groupTradesByDate(trades).map(([dateKey, items], idx) => `
            <section class="${idx ? 'mt-4' : ''}">
                ${renderTransactionsDateGroupHeader(dateKey, items)}
                ${renderTradesList(items, renderItem)}
            </section>
        `).join('');
    }

    function renderBrokerBreakdown(byBroker) {
        const tradeStatLabel = LABEL_CLASSES.tradeStat;
        const brokers = ['Zerodha', 'Dhan', 'Groww'];
        const html = brokers.map((b) => {
            const s = byBroker[b];
            if (!s || s.total === 0) return '';
            return `
                <div class="bg-base-200 rounded-xl p-3 mb-2">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold">${b}</span>
                        ${appTag(`${s.total} trades`)}
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-center">
                        <div><div class="${tradeStatLabel}">Open</div><div class="font-semibold text-warning">${s.open}</div></div>
                        <div><div class="${tradeStatLabel}">Closed</div><div class="font-semibold">${s.closed}</div></div>
                        <div><div class="${tradeStatLabel}">Success</div><div class="inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 font-semibold bg-success/15 text-success">${s.successful}</div></div>
                        <div><div class="${tradeStatLabel}">Net</div>${renderAmount(s.net, { size: 'sm', compact: true, align: 'center' })}</div>
                    </div>
                </div>
            `;
        }).join('');
        return html || '<p class="text-base-content/60 text-sm mb-0">No trades yet.</p>';
    }

    function renderTransactions() {
        const { getTransactionStats, isPlannedTrade } = tradePages();
        const getTransactions = tradePages().getTransactions;
        const txs = getTransactions ? getTransactions().slice().sort((a, b) => (a.id < b.id ? 1 : -1)) : [];
        const stats = getTransactionStats ? getTransactionStats(txs) : { total: 0, open: 0, closed: 0, successful: 0, net: 0, gross: 0, charges: 0, byBroker: {} };

        document.getElementById('txHistTotal').textContent = stats.total;
        document.getElementById('txHistOpen').textContent = stats.open;
        document.getElementById('txHistClosed').textContent = stats.closed;
        document.getElementById('txHistSuccessful').textContent = stats.successful;

        const netEl = document.getElementById('txHistNet');
        if (netEl) paintAmount(netEl, stats.net, { size: 'sm', compact: true, align: 'center' });
        paintAmount(document.getElementById('txHistGross'), stats.gross, { size: 'sm', compact: true, tone: 'neutral', align: 'center' });
        paintAmount(document.getElementById('txHistCharges'), stats.charges, { size: 'sm', compact: true, tone: 'negative', align: 'center' });

        document.getElementById('txHistBrokerBreakdown').innerHTML = renderBrokerBreakdown(stats.byBroker);

        const listEl = document.getElementById('txHistList');
        if (!listEl) return;
        if (txs.length === 0) {
            listEl.innerHTML = renderPageEmptyCard('fa-inbox', 'No transactions yet', 'Add trades from the Trades tab.');
            return;
        }
        listEl.innerHTML = renderGroupedTradesWithChips(txs, (t, i) => {
            if (isPlannedTrade && isPlannedTrade(t)) return renderTradeListItem(t, i, 'plan');
            return renderTradeListItem(t, i, (t.status || 'closed') === 'open' ? 'open' : 'past');
        });
    }

    global.MTFRegister({
        renderTransactions,
        renderBrokerBreakdown,
        renderTransactionsDateGroupHeader,
        renderGroupedTradesWithChips
    });
})(typeof window !== 'undefined' ? window : globalThis);
