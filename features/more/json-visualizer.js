/**
 * Backup JSON visualizer — summary counts + collapsible tree for paste/backup data.
 */
(function (global) {
    'use strict';

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatBytes(n) {
        const bytes = Number(n) || 0;
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function summarizeBackupJson(data, extras) {
        const txs = Array.isArray(data && data.transactions) ? data.transactions : [];
        let open = 0;
        let closed = 0;
        let planned = 0;
        txs.forEach((t) => {
            if (!t || typeof t !== 'object') return;
            if (t.executed === false) {
                planned += 1;
                return;
            }
            if ((t.status || 'closed') === 'open') open += 1;
            else closed += 1;
        });
        const accounts = Array.isArray(data && data.moneyAccounts) ? data.moneyAccounts.length : 0;
        const entries = Array.isArray(data && data.moneyEntries) ? data.moneyEntries.length : 0;
        const watchlist = Array.isArray(data && data.marketWatchlist) ? data.marketWatchlist.length : 0;
        const topKeys = data && typeof data === 'object' && !Array.isArray(data)
            ? Object.keys(data).length
            : 0;
        const quoteCache = extras && extras.quoteCacheCount != null ? Number(extras.quoteCacheCount) : 0;
        const rawChars = extras && extras.rawChars != null ? Number(extras.rawChars) : 0;
        return {
            trades: txs.length,
            open,
            closed,
            planned,
            accounts,
            entries,
            watchlist,
            quoteCache,
            topKeys,
            rawChars,
            rawSize: formatBytes(rawChars)
        };
    }

    function renderStatPill(label, value, tone) {
        const toneClass = tone === 'success'
            ? 'text-success'
            : tone === 'warning'
                ? 'text-warning'
                : tone === 'danger'
                    ? 'text-danger'
                    : 'text-body';
        return `<div class="json-viz-stat">
            <div class="json-viz-stat-value ${toneClass}">${escapeHtml(String(value))}</div>
            <div class="json-viz-stat-label">${escapeHtml(label)}</div>
        </div>`;
    }

    function renderBackupSummaryHtml(summary, callStats, dbCallSummary) {
        const s = summary || {};
        const calls = callStats || {};
        const db = dbCallSummary || {};
        const sessionMins = calls.startedAt
            ? Math.max(0, Math.round((Date.now() - calls.startedAt) / 60000))
            : 0;
        const lastLabel = calls.lastCallLabel
            ? escapeHtml(calls.lastCallLabel)
            : '—';
        const lastAt = calls.lastCallAt
            ? new Date(calls.lastCallAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })
            : '—';
        const flushedAt = db.lastFlushedAt
            ? new Date(db.lastFlushedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
            : 'Never';
        const dirtyLabel = db.dirty ? 'Local ahead — tap Save log to cloud' : 'In sync with last cloud save';

        return `
            <div class="json-viz-block mb-3">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <p class="small text-uppercase text-muted fw-medium mb-0">Data overview</p>
                    <span class="small text-muted">${escapeHtml(s.rawSize || '0 B')}</span>
                </div>
                <div class="json-viz-stats">
                    ${renderStatPill('Trades', s.trades || 0)}
                    ${renderStatPill('Open', s.open || 0, 'warning')}
                    ${renderStatPill('Closed', s.closed || 0, 'success')}
                    ${renderStatPill('Watchlist', s.watchlist || 0)}
                    ${renderStatPill('Accounts', s.accounts || 0)}
                    ${renderStatPill('Money rows', s.entries || 0)}
                    ${renderStatPill('Quote cache', s.quoteCache || 0)}
                    ${renderStatPill('Top keys', s.topKeys || 0)}
                </div>
            </div>
            <div class="json-viz-block mb-3">
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <p class="small text-uppercase text-muted fw-medium mb-0">Database calls</p>
                    <span class="small ${db.dirty ? 'text-warning' : 'text-muted'}">${escapeHtml(db.dirty ? 'Unsaved' : 'Saved')}</span>
                </div>
                <div class="json-viz-stats">
                    ${renderStatPill('Today', db.todayTotal || 0, 'warning')}
                    ${renderStatPill('Today R/W', `${db.todayReads || 0}/${db.todayWrites || 0}`)}
                    ${renderStatPill('All-time', db.total || 0)}
                    ${renderStatPill('Days', db.dayCount || 0)}
                </div>
                <p class="small text-muted mb-2 mt-2">Live counts stay on this device (local). One <code>dbCallLog</code> property is written to the cloud only when you save.</p>
                <p class="small text-muted mb-2">Last cloud save: <span class="text-body">${escapeHtml(flushedAt)}</span> · ${escapeHtml(dirtyLabel)}</p>
                <div id="backupDbCallFlushHost"></div>
            </div>
            <div class="json-viz-block mb-3">
                <p class="small text-uppercase text-muted fw-medium mb-2">Network calls (this session)</p>
                <div class="json-viz-stats">
                    ${renderStatPill('Proxy calls', calls.jinaCalls || 0)}
                    ${renderStatPill('Quote fetches', calls.quoteFetches || 0)}
                    ${renderStatPill('Catalog', calls.catalogFetches || 0)}
                    ${renderStatPill('Session min', sessionMins)}
                </div>
                <p class="small text-muted mb-0 mt-2">Last call: <span class="text-body">${lastLabel}</span> · ${escapeHtml(lastAt)}</p>
            </div>
        `;
    }

    function valuePreview(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        const t = typeof value;
        if (t === 'string') {
            const s = value.length > 80 ? value.slice(0, 80) + '…' : value;
            return JSON.stringify(s);
        }
        if (t === 'number' || t === 'boolean') return String(value);
        if (Array.isArray(value)) return `Array(${value.length})`;
        if (t === 'object') return `{${Object.keys(value).length} keys}`;
        return String(value);
    }

    function renderJsonTreeNode(key, value, depth, path) {
        const maxDepth = 8;
        const isExpandable = value !== null && typeof value === 'object';
        const label = key == null ? 'root' : String(key);
        const id = 'jv_' + String(path || 'root').replace(/[^a-zA-Z0-9_]/g, '_');

        if (!isExpandable || depth >= maxDepth) {
            const typeClass = value === null
                ? 'json-viz-null'
                : typeof value === 'string'
                    ? 'json-viz-string'
                    : typeof value === 'number'
                        ? 'json-viz-number'
                        : typeof value === 'boolean'
                            ? 'json-viz-bool'
                            : 'json-viz-other';
            return `<div class="json-viz-leaf" style="padding-left:${depth * 0.85}rem">
                <span class="json-viz-key">${escapeHtml(label)}</span>
                <span class="json-viz-sep">:</span>
                <span class="${typeClass}">${escapeHtml(valuePreview(value))}</span>
            </div>`;
        }

        const entries = Array.isArray(value)
            ? value.map((v, i) => [String(i), v])
            : Object.keys(value).map((k) => [k, value[k]]);
        const openAttr = depth < 2 ? ' open' : '';
        const children = entries.map(([k, v]) =>
            renderJsonTreeNode(k, v, depth + 1, (path || 'root') + '.' + k)
        ).join('');

        return `<details class="json-viz-node"${openAttr} style="padding-left:${depth * 0.85}rem">
            <summary class="json-viz-summary">
                <span class="json-viz-key">${escapeHtml(label)}</span>
                <span class="json-viz-hint">${escapeHtml(valuePreview(value))}</span>
            </summary>
            <div class="json-viz-children" id="${escapeHtml(id)}">${children || '<div class="json-viz-leaf text-muted">(empty)</div>'}</div>
        </details>`;
    }

    function renderJsonTreeHtml(data) {
        if (data === undefined) {
            return '<p class="small text-muted mb-0">Paste or load JSON to explore structure.</p>';
        }
        return `<div class="json-viz-tree">${renderJsonTreeNode('data', data, 0, 'data')}</div>`;
    }

    function renderBackupVisualizer(data, extras, callStats, dbCallSummary) {
        const summary = summarizeBackupJson(data || {}, extras || {});
        return {
            summaryHtml: renderBackupSummaryHtml(summary, callStats, dbCallSummary),
            treeHtml: renderJsonTreeHtml(data),
            summary
        };
    }

    function parseBackupText(text) {
        const raw = String(text || '').trim();
        if (!raw) return { ok: false, error: 'Empty', data: null, rawChars: 0 };
        try {
            return { ok: true, error: '', data: JSON.parse(raw), rawChars: raw.length };
        } catch (e) {
            return {
                ok: false,
                error: (e && e.message) || 'Invalid JSON',
                data: null,
                rawChars: raw.length
            };
        }
    }

    global.MTFRegister({
        summarizeBackupJson,
        renderBackupVisualizer,
        renderJsonTreeHtml,
        parseBackupText,
        formatBytes
    });
})(typeof window !== 'undefined' ? window : globalThis);
