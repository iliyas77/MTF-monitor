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

    /** Whole-rupee P&L for header cards / bar (matches mock). */
    function formatWholePnl(amount, { signed = true, abs = false } = {}) {
        const n = Number(amount) || 0;
        if (Math.abs(n) < 0.005 && !abs) return '—';
        const value = abs ? Math.abs(n) : n;
        const rounded = Math.round(Math.abs(value));
        const body = rounded.toLocaleString('en-IN');
        if (!signed) return `₹${body}`;
        if (abs) return `${n < 0 ? '−' : '+'}₹${body}`;
        return `${value < 0 ? '−' : '+'}₹${body}`;
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

    function hashNameTone(name) {
        const s = String(name || '');
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h) % 6;
    }

    function nameInitial(name) {
        const s = String(name || '').trim();
        if (!s) return '•';
        return s.charAt(0).toUpperCase();
    }

    function brokerAvatarHtml(name) {
        const tone = hashNameTone(name);
        const letter = escapeHtml(nameInitial(name));
        return `<span class="trade-position-avatar trade-position-avatar--${tone} flex-shrink-0" aria-hidden="true">${letter}</span>`;
    }

    function brokerKey(raw) {
        const name = String(raw || '').trim();
        return name && !/^none$/i.test(name) ? name : 'Other';
    }

    function emptyMonthBucket() {
        return {
            trades: 0,
            wins: 0,
            losses: 0,
            activeDays: new Set(),
            net: 0,
            grossProfit: 0,
            grossLoss: 0,
            byBroker: Object.create(null),
            dayNets: Object.create(null)
        };
    }

    function accumulateClosedMonth(txs, year, month) {
        const prefix = `${year}-${pad2(month + 1)}`;
        const bucket = emptyMonthBucket();
        txs.forEach((t) => {
            if (!isClosedTrade(t)) return;
            const sell = String(t.sellDate || '');
            if (!sell || sell.slice(0, 7) !== prefix) return;
            const pnl = Number(t.netProfit) || 0;
            const day = sell.slice(0, 10);
            const broker = brokerKey(t.broker);
            bucket.trades += 1;
            bucket.net += pnl;
            if (pnl >= 0) {
                bucket.wins += 1;
                bucket.grossProfit += pnl;
            } else {
                bucket.losses += 1;
                bucket.grossLoss += Math.abs(pnl);
            }
            bucket.activeDays.add(day);
            bucket.dayNets[day] = (bucket.dayNets[day] || 0) + pnl;
            if (!bucket.byBroker[broker]) {
                bucket.byBroker[broker] = {
                    broker,
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    net: 0,
                    dayNets: Object.create(null)
                };
            }
            const row = bucket.byBroker[broker];
            row.trades += 1;
            row.net += pnl;
            row.dayNets[day] = (row.dayNets[day] || 0) + pnl;
            if (pnl >= 0) row.wins += 1;
            else row.losses += 1;
        });
        return bucket;
    }

    function seriesFromDayNets(dayNets) {
        return Object.keys(dayNets || {})
            .sort()
            .map((key) => Math.round((Number(dayNets[key]) || 0) * 100) / 100);
    }

    function finalizeMonthBucket(bucket) {
        const brokers = Object.keys(bucket.byBroker)
            .map((key) => {
                const row = bucket.byBroker[key];
                return {
                    broker: row.broker,
                    trades: row.trades,
                    wins: row.wins,
                    losses: row.losses,
                    net: Math.round(row.net * 100) / 100,
                    series: seriesFromDayNets(row.dayNets)
                };
            })
            .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.trades - a.trades || a.broker.localeCompare(b.broker));
        return {
            trades: bucket.trades,
            wins: bucket.wins,
            losses: bucket.losses,
            activeDays: bucket.activeDays.size,
            net: Math.round(bucket.net * 100) / 100,
            grossProfit: Math.round(bucket.grossProfit * 100) / 100,
            grossLoss: Math.round(bucket.grossLoss * 100) / 100,
            brokers,
            series: seriesFromDayNets(bucket.dayNets)
        };
    }

    /** Month totals for closed trades in viewYear/viewMonth (+ previous month for MoM). */
    function buildMonthSummary(year, month) {
        const helpers = tradePages();
        const txs = typeof helpers.getTransactions === 'function' ? helpers.getTransactions() : [];
        const current = finalizeMonthBucket(accumulateClosedMonth(txs, year, month));
        const prevDate = new Date(year, month - 1, 1);
        const previous = finalizeMonthBucket(
            accumulateClosedMonth(txs, prevDate.getFullYear(), prevDate.getMonth())
        );
        const prevBrokers = Object.create(null);
        previous.brokers.forEach((row) => {
            prevBrokers[row.broker] = row;
        });
        current.brokers = current.brokers.map((row) => {
            const prev = prevBrokers[row.broker];
            return {
                ...row,
                prevNet: prev ? prev.net : 0,
                prevTrades: prev ? prev.trades : 0
            };
        });
        return {
            ...current,
            previous,
            prevMonthLabel: `${MONTH_NAMES[prevDate.getMonth()].slice(0, 3)} ${prevDate.getFullYear()}`
        };
    }

    function pnlToneClass(amount, hasTrades) {
        if (!hasTrades || Math.abs(Number(amount) || 0) < 0.005) return 'text-muted';
        return Number(amount) >= 0 ? 'text-success' : 'text-danger';
    }

    function formatCompactPnl(amount) {
        const n = Number(amount) || 0;
        if (Math.abs(n) < 0.005) return '—';
        const fmtINR = global.MTFComponents?.fmtINR;
        const abs = Math.abs(n);
        const body = typeof fmtINR === 'function'
            ? fmtINR(abs).replace(/^₹/, '')
            : Math.round(abs).toLocaleString('en-IN');
        const whole = body.includes('.') ? body.replace(/\.00$/, '') : body;
        return `${n >= 0 ? '+' : '−'}₹${whole}`;
    }

    function formatPct(value) {
        const n = Number(value);
        if (!isFinite(n)) return null;
        const abs = Math.abs(n);
        const text = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
        return `${text}%`;
    }

    function pctChange(curr, prev) {
        const c = Number(curr) || 0;
        const p = Number(prev) || 0;
        if (Math.abs(p) < 0.005) return null;
        return ((c - p) / Math.abs(p)) * 100;
    }

    function momFootHtml(deltaPct, prevLabel, opts = {}) {
        const { absoluteDelta = null, preferAbsolute = false } = opts;
        if (preferAbsolute && absoluteDelta != null && absoluteDelta !== 0) {
            const up = absoluteDelta > 0;
            const cls = up ? 'is-up' : 'is-down';
            const arrow = up ? '↗' : '↘';
            return `<span class="cal-mom ${cls}">${arrow} ${Math.abs(absoluteDelta)} vs ${escapeHtml(prevLabel)}</span>`;
        }
        if (deltaPct == null) {
            return `<span class="cal-mom is-flat">vs ${escapeHtml(prevLabel)}</span>`;
        }
        const up = deltaPct >= 0;
        const cls = Math.abs(deltaPct) < 0.05 ? 'is-flat' : (up ? 'is-up' : 'is-down');
        const arrow = Math.abs(deltaPct) < 0.05 ? '→' : (up ? '↗' : '↘');
        const pct = formatPct(deltaPct) || '0%';
        return `<span class="cal-mom ${cls}">${arrow} ${pct} vs ${escapeHtml(prevLabel)}</span>`;
    }

    function sparklineSvg(series, positive) {
        const pts = (Array.isArray(series) ? series : []).map((n) => Number(n) || 0);
        if (!pts.length) {
            return '<svg class="cal-spark" viewBox="0 0 64 24" aria-hidden="true"><path d="M2 12 H62" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.25"/></svg>';
        }
        const w = 64;
        const h = 24;
        const pad = 2;
        let min = Math.min(...pts, 0);
        let max = Math.max(...pts, 0);
        if (Math.abs(max - min) < 0.001) {
            max = min + 1;
        }
        const coords = pts.map((v, i) => {
            const x = pad + (pts.length === 1 ? (w - pad * 2) / 2 : (i / (pts.length - 1)) * (w - pad * 2));
            const y = pad + (1 - ((v - min) / (max - min))) * (h - pad * 2);
            return [x, y];
        });
        const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ');
        const fill = `${line} L${coords[coords.length - 1][0].toFixed(1)} ${h} L${coords[0][0].toFixed(1)} ${h} Z`;
        const stroke = positive ? 'var(--gr-accent)' : 'var(--gr-danger)';
        const fillColor = positive ? 'rgba(21,155,90,0.14)' : 'rgba(239,68,68,0.12)';
        return `<svg class="cal-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${fill}" fill="${fillColor}"/><path d="${line}" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    function buildBrokerRowsHtml(summary) {
        if (!summary.brokers.length) {
            return '<p class="small text-muted mb-0 px-1">No closed trades this month.</p>';
        }
        return summary.brokers.map((row) => {
            const positive = row.net >= 0;
            const toneCls = pnlToneClass(row.net, row.trades > 0);
            const mom = pctChange(row.net, row.prevNet);
            let momHtml;
            if (mom == null) {
                const shareBase = Math.abs(summary.net) < 0.005 ? 0 : Math.abs(summary.net);
                const share = shareBase ? (Math.abs(row.net) / shareBase) * 100 : null;
                momHtml = share == null
                    ? '<span class="cal-mom is-flat">—</span>'
                    : `<span class="cal-mom ${positive ? 'is-up' : 'is-down'}">${positive ? '↗' : '↘'} ${formatPct(share)}</span>`;
            } else {
                const up = mom >= 0;
                momHtml = `<span class="cal-mom ${up ? 'is-up' : 'is-down'}">${up ? '↗' : '↘'} ${formatPct(mom)}</span>`;
            }
            return `
                <div class="cal-summary-broker-row">
                    ${brokerAvatarHtml(row.broker)}
                    <div class="cal-summary-broker-main min-w-0">
                        <div class="cal-summary-broker-name text-truncate">${escapeHtml(row.broker)}</div>
                        <div class="cal-summary-broker-meta">${row.trades} trade${row.trades === 1 ? '' : 's'} · ${row.wins}W / ${row.losses}L</div>
                    </div>
                    <div class="cal-summary-broker-spark">${sparklineSvg(row.series, positive)}</div>
                    <div class="cal-summary-broker-stats">
                        <div class="cal-summary-broker-pnl ${toneCls}">${escapeHtml(formatDayPnl(row.net))}</div>
                        ${momHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    function buildMonthReportHtml(year, month) {
        const summary = buildMonthSummary(year, month);
        const prev = summary.previous;
        const prevLabel = summary.prevMonthLabel;
        const hasTrades = summary.trades > 0;
        const monthTitle = `${MONTH_NAMES[month]} ${year}`;
        const pnlText = hasTrades ? formatDayPnl(summary.net) : '—';
        const tone = pnlToneClass(summary.net, hasTrades);
        const up = hasTrades && summary.net >= 0;
        const accentCls = hasTrades ? (summary.net >= 0 ? 'is-up' : 'is-down') : '';
        const trendCls = hasTrades ? (up ? 'is-up' : 'is-down') : 'is-flat';
        const trendIcon = hasTrades
            ? `<i class="fas ${up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i>`
            : '';
        const winLossValue = hasTrades
            ? `<span class="cal-wl-win">${summary.wins}</span> / <span class="cal-wl-loss">${summary.losses}</span>`
            : '0 / 0';
        const decided = summary.wins + summary.losses;
        const winRateFoot = !decided
            ? '<span class="cal-mom is-flat">No closed trades</span>'
            : `<span class="cal-mom is-up">${formatPct((summary.wins / decided) * 100)} Win Rate</span>`;

        return `
            <div class="cal-month-report">
                <div class="cal-report-head">
                    <div class="cal-report-head-main min-w-0">
                        <p class="cal-report-month-label mb-1">${escapeHtml(monthTitle)}</p>
                        <div class="cal-summary-net-row">
                            <div class="cal-summary-net ${tone}">${escapeHtml(pnlText)}</div>
                            <span class="cal-summary-trend-icon ${trendCls}" aria-hidden="true">${trendIcon}</span>
                        </div>
                        <p class="cal-summary-net-label mb-0">
                            Net P&amp;L (closed)
                            <i class="fas fa-info-circle cal-summary-info" title="P&amp;L is calculated for closed trades only" aria-hidden="true"></i>
                        </p>
                    </div>
                </div>
                <div class="cal-summary-accent ${accentCls}" aria-hidden="true"></div>
                <div class="cal-summary-metrics" aria-label="Month metrics">
                    <div class="cal-summary-metric">
                        <span class="cal-summary-metric-icon cal-summary-metric-icon--trades" aria-hidden="true"><i class="fas fa-chart-bar"></i></span>
                        <div class="cal-summary-metric-body">
                            <div class="cal-summary-metric-value">${summary.trades}</div>
                            <div class="cal-summary-metric-label">Total Trades</div>
                            <div class="cal-summary-metric-foot">${momFootHtml(pctChange(summary.trades, prev.trades), prevLabel)}</div>
                        </div>
                    </div>
                    <div class="cal-summary-metric">
                        <span class="cal-summary-metric-icon cal-summary-metric-icon--wl" aria-hidden="true"><i class="fas fa-balance-scale"></i></span>
                        <div class="cal-summary-metric-body">
                            <div class="cal-summary-metric-value">${winLossValue}</div>
                            <div class="cal-summary-metric-label">Win / Loss</div>
                            <div class="cal-summary-metric-foot">${winRateFoot}</div>
                        </div>
                    </div>
                    <div class="cal-summary-metric">
                        <span class="cal-summary-metric-icon cal-summary-metric-icon--days" aria-hidden="true"><i class="far fa-calendar"></i></span>
                        <div class="cal-summary-metric-body">
                            <div class="cal-summary-metric-value">${summary.activeDays}</div>
                            <div class="cal-summary-metric-label">Active Days</div>
                            <div class="cal-summary-metric-foot">${momFootHtml(null, prevLabel, {
                                preferAbsolute: true,
                                absoluteDelta: summary.activeDays - prev.activeDays
                            })}</div>
                        </div>
                    </div>
                    <div class="cal-summary-metric">
                        <span class="cal-summary-metric-icon cal-summary-metric-icon--pnl" aria-hidden="true"><i class="fas fa-chart-pie"></i></span>
                        <div class="cal-summary-metric-body">
                            <div class="cal-summary-metric-value ${tone}">${escapeHtml(hasTrades ? formatCompactPnl(summary.net) : '—')}</div>
                            <div class="cal-summary-metric-label">Net P&amp;L</div>
                            <div class="cal-summary-metric-foot">${momFootHtml(pctChange(summary.net, prev.net), prevLabel)}</div>
                        </div>
                    </div>
                </div>
                <div class="cal-summary-brokers">
                    <p class="cal-summary-brokers-title">By broker</p>
                    <div class="cal-summary-broker-list">${buildBrokerRowsHtml(summary)}</div>
                </div>
                <p class="cal-summary-footnote mb-0">
                    <i class="fas fa-info-circle" aria-hidden="true"></i>
                    W = Win · L = Loss · P&amp;L is calculated for closed trades only
                </p>
            </div>
        `;
    }

    function openCalendarMonthReport() {
        ensureViewMonth();
        const { Sheet, renderIcon, showToast } = global.MTFComponents || {};
        if (!Sheet || typeof Sheet.open !== 'function') {
            if (showToast) showToast('Report unavailable.', 'warning');
            return;
        }
        const titleIcon = typeof renderIcon === 'function'
            ? renderIcon('fa-file-alt', { className: 'me-1 flex-shrink-0 text-primary' })
            : '';
        const monthTitle = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
        Sheet.open(
            `${titleIcon}<span class="text-truncate min-w-0 flex-grow-1">Monthly report · ${escapeHtml(monthTitle)}</span>`,
            buildMonthReportHtml(viewYear, viewMonth),
            ''
        );
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

    function paintCalendarHeaderStats(year, month) {
        const summary = buildMonthSummary(year, month);
        const profitEl = document.getElementById('calTotalProfit');
        const lossEl = document.getElementById('calTotalLoss');
        const barProfit = document.getElementById('calNetBarProfit');
        const barLoss = document.getElementById('calNetBarLoss');
        const barLabel = document.getElementById('calNetBarLabel');
        const bar = document.getElementById('calNetBar');
        const hasActivity = summary.grossProfit > 0.005 || summary.grossLoss > 0.005;

        if (profitEl) {
            profitEl.textContent = hasActivity || summary.trades
                ? formatWholePnl(summary.grossProfit, { signed: true })
                : '—';
        }
        if (lossEl) {
            lossEl.textContent = hasActivity || summary.trades
                ? (summary.grossLoss > 0.005 ? formatWholePnl(-summary.grossLoss, { signed: true }) : '₹0')
                : '—';
        }

        const total = summary.grossProfit + summary.grossLoss;
        let profitPct = 50;
        let lossPct = 50;
        if (total > 0.005) {
            profitPct = (summary.grossProfit / total) * 100;
            lossPct = (summary.grossLoss / total) * 100;
            if (profitPct > 0 && profitPct < 8) profitPct = 8;
            if (lossPct > 0 && lossPct < 8) lossPct = 8;
            const scale = 100 / (profitPct + lossPct);
            profitPct *= scale;
            lossPct *= scale;
        } else if (!hasActivity) {
            profitPct = 100;
            lossPct = 0;
        }

        if (barProfit) barProfit.style.width = `${profitPct}%`;
        if (barLoss) barLoss.style.width = `${lossPct}%`;
        if (barLabel) {
            if (hasActivity || summary.trades) {
                const rounded = Math.round(Math.abs(summary.net)).toLocaleString('en-IN');
                barLabel.textContent = `${summary.net < 0 ? '−' : ''}₹${rounded}`;
            } else {
                barLabel.textContent = '—';
            }
        }
        if (bar) {
            bar.classList.toggle('is-empty', !hasActivity && !summary.trades);
            bar.classList.toggle('is-profit-only', summary.grossLoss < 0.005 && summary.grossProfit > 0.005);
            bar.classList.toggle('is-loss-only', summary.grossProfit < 0.005 && summary.grossLoss > 0.005);
        }
    }

    function renderCalendarPage() {
        ensureViewMonth();
        const titleEl = document.getElementById('calendarMonthTitle');
        const gridEl = document.getElementById('calendarGrid');
        if (!gridEl) return;

        if (titleEl) titleEl.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
        paintCalendarHeaderStats(viewYear, viewMonth);

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
            const todayBadge = isToday
                ? '<span class="cal-today-badge">Today</span>'
                : '';
            cells.push(`
                <div class="cal-cell cal-cell--${tone}${isToday ? ' cal-cell--today' : ''}${clickable ? ' cal-cell--clickable' : ''}${isToday && !count ? ' cal-cell--today-empty' : ''}" data-date="${escapeHtml(key)}" aria-label="${escapeHtml(key)}${count ? `, net ${pnlLabel}` : ''}${isToday ? ', today' : ''}"${clickAttrs}>
                    ${todayBadge}
                    <span class="cal-day">${day}</span>
                    <span class="cal-pnl">${escapeHtml(pnlLabel)}</span>
                    ${countLabel ? `<span class="cal-count">${escapeHtml(countLabel)}</span>` : ''}
                </div>
            `);
        }

        gridEl.innerHTML = cells.join('');
    }

    global.MTFRegister({
        renderCalendarPage,
        shiftCalendarMonth,
        openCalendarMonthPicker,
        shiftCalendarPickerYear,
        jumpCalendarMonth,
        jumpCalendarToTodayMonth,
        openCalendarDaySheet,
        openCalendarMonthReport,
        getClosedTradesForSellDate,
        buildMonthSummary
    });
})(typeof window !== 'undefined' ? window : globalThis);
