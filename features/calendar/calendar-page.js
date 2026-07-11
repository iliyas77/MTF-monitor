/**
 * Calendar feature — month grid with daily net P&L; tap a day for closed trades sheet.
 */
(function (global) {
    'use strict';

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let viewYear = null;
    let viewMonth = null; // 0–11
    let pickerYear = null;

    function tradePages() {
        return (global.MTFAppHelpers || {}).tradePages || {};
    }

    function ensureViewMonth() {
        if (viewYear == null || viewMonth == null) {
            const now = new Date();
            viewYear = now.getFullYear();
            viewMonth = now.getMonth();
        }
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function dateKey(y, m, d) {
        return `${y}-${pad2(m + 1)}-${pad2(d)}`;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDayPnl(amount) {
        const n = Number(amount) || 0;
        if (Math.abs(n) < 0.005) return '—';
        const fmtINR = global.MTFComponents?.fmtINR;
        const body = typeof fmtINR === 'function'
            ? fmtINR(Math.abs(n)).replace(/^₹/, '')
            : Math.round(Math.abs(n)).toLocaleString('en-IN');
        return `${n < 0 ? '−' : '+'}₹${body}`;
    }

    function isClosedTrade(t) {
        if ((t.status || 'closed') === 'open') return false;
        if ((t.status || '') === 'cancelled') return false;
        return true;
    }

    /** Closed trades for a sell-date key (YYYY-MM-DD), newest company first. */
    function getClosedTradesForSellDate(sellKey) {
        const key = String(sellKey || '').slice(0, 10);
        if (!key) return [];
        const helpers = tradePages();
        const txs = typeof helpers.getTransactions === 'function' ? helpers.getTransactions() : [];
        return txs
            .filter((t) => isClosedTrade(t) && String(t.sellDate || '').slice(0, 10) === key)
            .sort((a, b) => String(b.company || '').localeCompare(String(a.company || '')));
    }

    /** Closed trades keyed by sell date → { net, count }. */
    function buildDailyNetMap(year, month) {
        const helpers = tradePages();
        const txs = typeof helpers.getTransactions === 'function' ? helpers.getTransactions() : [];
        const prefix = `${year}-${pad2(month + 1)}-`;
        const map = Object.create(null);

        txs.forEach((t) => {
            if (!isClosedTrade(t)) return;
            const sell = t.sellDate || '';
            if (!sell || sell.slice(0, 7) !== prefix.slice(0, 7)) return;
            if (!map[sell]) map[sell] = { net: 0, count: 0 };
            map[sell].net += Number(t.netProfit) || 0;
            map[sell].count += 1;
        });

        Object.keys(map).forEach((k) => {
            map[k].net = Math.round(map[k].net * 100) / 100;
        });
        return map;
    }

    /** Month totals for closed trades in viewYear/viewMonth. */
    function buildMonthSummary(year, month) {
        const helpers = tradePages();
        const txs = typeof helpers.getTransactions === 'function' ? helpers.getTransactions() : [];
        const prefix = `${year}-${pad2(month + 1)}-`;
        let trades = 0;
        let wins = 0;
        let losses = 0;
        let net = 0;
        const activeDays = new Set();
        const byBroker = Object.create(null);

        txs.forEach((t) => {
            if (!isClosedTrade(t)) return;
            const sell = String(t.sellDate || '');
            if (!sell || sell.slice(0, 7) !== prefix.slice(0, 7)) return;
            const pnl = Number(t.netProfit) || 0;
            const brokerRaw = String(t.broker || '').trim();
            const broker = brokerRaw && !/^none$/i.test(brokerRaw) ? brokerRaw : 'Other';
            trades += 1;
            net += pnl;
            activeDays.add(sell.slice(0, 10));
            if (pnl >= 0) wins += 1;
            else losses += 1;
            if (!byBroker[broker]) {
                byBroker[broker] = { broker, trades: 0, wins: 0, losses: 0, net: 0 };
            }
            byBroker[broker].trades += 1;
            byBroker[broker].net += pnl;
            if (pnl >= 0) byBroker[broker].wins += 1;
            else byBroker[broker].losses += 1;
        });

        const brokers = Object.keys(byBroker)
            .map((key) => {
                const row = byBroker[key];
                row.net = Math.round(row.net * 100) / 100;
                return row;
            })
            .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.trades - a.trades || a.broker.localeCompare(b.broker));

        return {
            trades,
            wins,
            losses,
            activeDays: activeDays.size,
            net: Math.round(net * 100) / 100,
            brokers
        };
    }

    function pnlToneClass(amount, hasTrades) {
        if (!hasTrades || Math.abs(Number(amount) || 0) < 0.005) return 'text-muted';
        return Number(amount) >= 0 ? 'text-success' : 'text-danger';
    }

    function paintMonthSummary(year, month) {
        const summary = buildMonthSummary(year, month);
        const labelEl = document.getElementById('calendarMonthSummaryLabel');
        const tradesEl = document.getElementById('calSummaryTrades');
        const winLossEl = document.getElementById('calSummaryWinLoss');
        const daysEl = document.getElementById('calSummaryDays');
        const pnlEl = document.getElementById('calSummaryPnl');
        const brokerListEl = document.getElementById('calSummaryBrokerList');

        if (labelEl) {
            labelEl.textContent = `${MONTH_NAMES[month]} ${year}`;
        }
        if (tradesEl) tradesEl.textContent = String(summary.trades);
        if (winLossEl) winLossEl.textContent = `${summary.wins} / ${summary.losses}`;
        if (daysEl) daysEl.textContent = String(summary.activeDays);
        if (pnlEl) {
            pnlEl.textContent = summary.trades ? formatDayPnl(summary.net) : '—';
            pnlEl.classList.remove('text-success', 'text-danger', 'text-muted');
            pnlEl.classList.add(pnlToneClass(summary.net, summary.trades > 0));
        }
        if (brokerListEl) {
            if (!summary.brokers.length) {
                brokerListEl.innerHTML = '<p class="small text-muted mb-0">No closed trades this month.</p>';
            } else {
                brokerListEl.innerHTML = summary.brokers.map((row) => {
                    const tone = pnlToneClass(row.net, row.trades > 0);
                    const pnlText = formatDayPnl(row.net);
                    return `
                        <div class="cal-summary-broker-row">
                            <div class="min-w-0">
                                <div class="cal-summary-broker-name text-truncate">${escapeHtml(row.broker)}</div>
                                <div class="cal-summary-broker-meta">${row.trades} trade${row.trades === 1 ? '' : 's'} · ${row.wins}W / ${row.losses}L</div>
                            </div>
                            <div class="cal-summary-broker-pnl ${tone}">${escapeHtml(pnlText)}</div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    function shiftCalendarMonth(delta) {
        ensureViewMonth();
        const d = new Date(viewYear, viewMonth + Number(delta) || 0, 1);
        viewYear = d.getFullYear();
        viewMonth = d.getMonth();
        renderCalendarPage();
    }

    function jumpCalendarMonth(year, month) {
        const y = Number(year);
        const m = Number(month);
        if (!isFinite(y) || !isFinite(m) || m < 0 || m > 11) return;
        viewYear = y;
        viewMonth = m;
        const { Sheet, closeSheet } = global.MTFComponents || {};
        if (typeof closeSheet === 'function') closeSheet();
        else if (Sheet && typeof Sheet.close === 'function') Sheet.close();
        renderCalendarPage();
    }

    function shiftCalendarPickerYear(delta) {
        if (pickerYear == null) {
            ensureViewMonth();
            pickerYear = viewYear;
        }
        pickerYear += Number(delta) || 0;
        paintCalendarMonthPicker();
    }

    function jumpCalendarToTodayMonth() {
        const now = new Date();
        jumpCalendarMonth(now.getFullYear(), now.getMonth());
    }

    function buildMonthPickerBody() {
        ensureViewMonth();
        if (pickerYear == null) pickerYear = viewYear;
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();
        const months = MONTH_NAMES.map((name, idx) => {
            const selected = pickerYear === viewYear && idx === viewMonth;
            const current = pickerYear === thisYear && idx === thisMonth;
            const classes = [
                'cal-month-pick-btn',
                selected ? 'is-selected' : '',
                !selected && current ? 'is-current' : ''
            ].filter(Boolean).join(' ');
            return `<button type="button" class="${classes}" onclick="jumpCalendarMonth(${pickerYear},${idx})">${escapeHtml(name.slice(0, 3))}</button>`;
        }).join('');

        return `
            <div class="cal-month-picker px-1 pb-2">
                <div class="cal-month-picker-year">
                    <button type="button" class="btn btn-outline-secondary btn-sm rounded-circle" style="width:2.25rem;height:2.25rem" onclick="shiftCalendarPickerYear(-1)" aria-label="Previous year">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div class="cal-month-picker-year-label" id="calendarPickerYearLabel">${pickerYear}</div>
                    <button type="button" class="btn btn-outline-secondary btn-sm rounded-circle" style="width:2.25rem;height:2.25rem" onclick="shiftCalendarPickerYear(1)" aria-label="Next year">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="cal-month-picker-grid" role="listbox" aria-label="Months">${months}</div>
            </div>
        `;
    }

    function paintCalendarMonthPicker() {
        const { Sheet, renderIcon, renderAppButton, showToast } = global.MTFComponents || {};
        if (!Sheet || typeof Sheet.open !== 'function') {
            if (showToast) showToast('Month picker unavailable.', 'warning');
            return;
        }
        const titleIcon = typeof renderIcon === 'function'
            ? renderIcon('fa-calendar-alt', { className: 'me-1 flex-shrink-0 text-primary' })
            : '';
        const footer = typeof renderAppButton === 'function'
            ? renderAppButton('This month', {
                variant: 'cancel',
                onclick: 'jumpCalendarToTodayMonth()',
                icon: 'fa-crosshairs',
                fullWidth: true
            })
            : '';
        Sheet.open(
            `${titleIcon}<span class="text-truncate min-w-0 flex-grow-1">Jump to month</span>`,
            buildMonthPickerBody(),
            footer
        );
    }

    function openCalendarMonthPicker() {
        ensureViewMonth();
        pickerYear = viewYear;
        paintCalendarMonthPicker();
    }

    function openCalendarDaySheet(sellDate) {
        const key = String(sellDate || '').slice(0, 10);
        if (!key) return;

        const {
            Sheet,
            renderFlatTradesList,
            renderPastTradeListItem,
            fmtDateDisplay,
            renderIcon,
            renderPageEmptyCard,
            showToast
        } = global.MTFComponents || {};

        if (!Sheet || typeof Sheet.open !== 'function') {
            if (showToast) showToast('Sheet unavailable.', 'warning');
            return;
        }

        const trades = getClosedTradesForSellDate(key);
        const dateLabel = typeof fmtDateDisplay === 'function' ? fmtDateDisplay(key) : key;
        const net = trades.reduce((sum, t) => sum + (Number(t.netProfit) || 0), 0);
        const countLabel = trades.length === 1 ? '1 closed trade' : `${trades.length} closed trades`;
        const netTone = net > 0 ? 'text-success' : (net < 0 ? 'text-danger' : 'text-muted');

        let body;
        if (!trades.length) {
            body = typeof renderPageEmptyCard === 'function'
                ? renderPageEmptyCard('fa-calendar-day', 'No closed trades', 'Nothing closed on this day.')
                : '<p class="small text-muted mb-0">No closed trades on this day.</p>';
        } else {
            const listHtml = typeof renderFlatTradesList === 'function' && typeof renderPastTradeListItem === 'function'
                ? renderFlatTradesList(trades, renderPastTradeListItem, 'past')
                : '';
            body = `
                <div class="d-flex justify-content-between align-items-baseline gap-2 mb-3 px-1">
                    <span class="small text-muted">${escapeHtml(countLabel)}</span>
                    <span class="fw-semibold ${netTone}">${escapeHtml(formatDayPnl(net))}</span>
                </div>
                ${listHtml}
            `;
        }

        const titleIcon = typeof renderIcon === 'function'
            ? renderIcon('fa-calendar-day', { className: 'me-1 flex-shrink-0 text-primary' })
            : '';
        Sheet.open(
            `${titleIcon}<span class="text-truncate min-w-0 flex-grow-1">${escapeHtml(dateLabel)}</span>`,
            body,
            ''
        );
    }

    function renderCalendarPage() {
        ensureViewMonth();
        const titleEl = document.getElementById('calendarMonthTitle');
        const gridEl = document.getElementById('calendarGrid');
        if (!gridEl) return;

        if (titleEl) titleEl.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

        const daily = buildDailyNetMap(viewYear, viewMonth);
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        // Monday-first: JS getDay() Sun=0 → Mon=0 … Sun=6
        const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
        const todayKey = (() => {
            const n = new Date();
            return dateKey(n.getFullYear(), n.getMonth(), n.getDate());
        })();

        const cells = [];
        for (let i = 0; i < firstDow; i++) {
            cells.push('<div class="cal-cell cal-cell--pad" aria-hidden="true"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const key = dateKey(viewYear, viewMonth, day);
            const entry = daily[key];
            const net = entry ? entry.net : 0;
            const count = entry ? entry.count : 0;
            const isToday = key === todayKey;
            let tone = 'flat';
            if (count > 0) tone = net >= 0 ? 'pos' : 'neg';
            const pnlLabel = count ? formatDayPnl(net) : '';
            const countLabel = count > 1 ? `${count} trades` : (count === 1 ? '1 trade' : '');
            const clickable = count > 0;
            const clickAttrs = clickable
                ? ` role="button" tabindex="0" onclick="openCalendarDaySheet('${escapeHtml(key)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openCalendarDaySheet('${escapeHtml(key)}');}"`
                : ' role="gridcell"';
            cells.push(`
                <div class="cal-cell cal-cell--${tone}${isToday ? ' cal-cell--today' : ''}${clickable ? ' cal-cell--clickable' : ''}" data-date="${escapeHtml(key)}" aria-label="${escapeHtml(key)}${count ? `, net ${pnlLabel}` : ''}"${clickAttrs}>
                    <span class="cal-day">${day}</span>
                    <span class="cal-pnl">${escapeHtml(pnlLabel)}</span>
                    ${countLabel ? `<span class="cal-count">${escapeHtml(countLabel)}</span>` : ''}
                </div>
            `);
        }

        gridEl.innerHTML = cells.join('');
        paintMonthSummary(viewYear, viewMonth);
    }

    global.MTFRegister({
        renderCalendarPage,
        shiftCalendarMonth,
        openCalendarMonthPicker,
        shiftCalendarPickerYear,
        jumpCalendarMonth,
        jumpCalendarToTodayMonth,
        openCalendarDaySheet,
        getClosedTradesForSellDate,
        buildMonthSummary
    });
})(typeof window !== 'undefined' ? window : globalThis);
