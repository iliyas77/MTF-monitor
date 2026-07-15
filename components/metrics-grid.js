/**
 * MetricsGrid — reusable KPI strip built on the `trade-position-cell` design system.
 *
 * Encapsulates the three-layer layout used across the app:
 *   .trade-position-metrics > .trade-position-grid > .trade-position-cell
 *
 * Supports every feature found in the existing usages:
 *   - Rich cells (tinted icon box + label + value + optional subtitle pill)
 *   - Simple cells (label + value only)
 *   - Alignment variants (start / center)
 *   - Modifier variants: `progress` (thin progress bar) and `target-status` (host slot)
 *   - Live-update data attributes (data-live-field / data-live-value / data-quote-*, etc.)
 *   - Scoped grid typography overrides (label 13px, value 18px bold, subtitle 14px)
 *
 * Registration: global.MTFComponents.renderMetricsGrid / renderMetricsCell
 * Dependencies: global.MTFComponents.renderIcon, global.MTFComponents.escapeHtml
 *
 * Usage:
 *   const { renderMetricsGrid } = global.MTFComponents;
 *   renderMetricsGrid([
 *     { label: 'Current Price', value: '₹123.45', icon: 'fa-arrow-trend-up', iconTone: 'green',
 *       subtitle: '+2.3%', subtitleTone: 'green', live: { field: 'price' } },
 *     { label: 'Quantity', value: '100', icon: 'fa-cube', iconTone: 'orange',
 *       subtitle: 'Shares', subtitleTone: 'orange', align: 'center' },
 *     { label: 'Day %', value: '+1.2%', valueClass: 'text-success' }
 *   ], { gridAttrs: { 'data-live-symbol': 'RELIANCE' } });
 */
(function (global) {
    'use strict';

    const comps = () => global.MTFComponents || {};
    const icon = (name, className) => {
        const r = comps().renderIcon;
        return typeof r === 'function' ? r(name, { className }) : '';
    };
    const esc = (val) => {
        const e = comps().escapeHtml;
        return typeof e === 'function' ? e(val) : String(val == null ? '' : val);
    };

    /* ---------- tone color maps (mirror shared/css/_variables.css) ---------- */

    const ICON_TONES = {
        green: { bg: 'var(--gr-accent-soft, rgba(21, 155, 90, 0.12))', color: 'var(--gr-accent, #159b5a)' },
        blue: { bg: 'var(--blue50-soft, rgba(10, 132, 255, 0.12))', color: 'var(--blue500, #0a84ff)' },
        orange: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        purple: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' },
        red: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--gr-danger, #ef4444)' }
    };

    const SUBTITLE_TONES = {
        green: { bg: 'var(--gr-accent-soft, rgba(21, 155, 90, 0.12))', color: 'var(--gr-accent, #159b5a)' },
        blue: { bg: 'var(--blue50-soft, rgba(10, 132, 255, 0.12))', color: 'var(--blue500, #0a84ff)' },
        orange: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        purple: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' },
        red: { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--gr-danger, #ef4444)' }
    };

    /* ---------- helpers ---------- */

    function attrsToString(attrs) {
        if (!attrs || typeof attrs !== 'object') return '';
        return Object.keys(attrs)
            .map((k) => ` ${esc(k)}="${esc(attrs[k])}"`)
            .join('');
    }

    function iconBoxHtml(iconName, tone) {
        if (!iconName) return '';
        const t = ICON_TONES[tone] || ICON_TONES.green;
        return `<div class="trade-position-icon-box trade-position-icon-box--${tone || 'green'}" style="background-color:${t.bg};color:${t.color}">${icon(iconName)}</div>`;
    }

    function subtitleHtml(text, tone, extraClass) {
        if (text == null || text === '') return '';
        const t = SUBTITLE_TONES[tone] || SUBTITLE_TONES.green;
        return `<span class="trade-position-subtitle px-2 py-1 rounded ${extraClass || ''}" style="background-color:${t.bg};color:${t.color};display:inline-block">${esc(text)}</span>`;
    }

    function progressHtml(pct, tone) {
        const safePct = Math.max(0, Math.min(100, Number(pct) || 0));
        const neg = tone === 'neg';
        const trackClass = `trade-position-progress${neg ? ' trade-position-progress--neg' : ''}`;
        const barTone = neg ? 'bg-danger' : 'bg-success';
        return `<div class="${trackClass}"><div class="progress-bar ${barTone}" style="width:${safePct}%"></div></div>`;
    }

    /* ---------- cell renderer ---------- */

    /**
     * Render a single metrics cell.
     * @param {Object} cell
     * @param {string} [cell.label]            - small caption (trade-position-label)
     * @param {string} [cell.value]            - main figure (trade-position-value / -price)
     * @param {string} [cell.valueClass]       - extra classes for the value span
     * @param {string} [cell.valueKind]        - 'value' (default) or 'price'
     * @param {string} [cell.icon]             - FontAwesome icon name (e.g. 'fa-arrow-trend-up')
     * @param {string} [cell.iconTone]         - green|blue|orange|purple|red
     * @param {string} [cell.subtitle]        - optional pill text under the value
     * @param {string} [cell.subtitleTone]    - green|blue|orange|purple|red
     * @param {string} [cell.align]            - 'start' (default) | 'center'
     * @param {string} [cell.variant]         - '' | 'progress' | 'target-status'
     * @param {string} [cell.cellClass]       - extra classes on the cell wrapper
     * @param {Object} [cell.data]             - data-* attributes for the cell
     * @param {Object} [cell.live]             - { field, value } -> data-live-field / data-live-value
     * @param {Object} [cell.progress]        - { pct, tone } for the 'progress' variant
     * @param {string} [cell.hostHtml]        - inner HTML for 'target-status' host slot
     * @param {string} [cell.onclick]         - onclick handler; renders the cell as a <button> when set
     * @param {string} [cell.ariaLabel]       - accessible label for clickable cells
     * @returns {string}
     */
    function renderMetricsCell(cell) {
        cell = cell || {};
        const align = cell.align === 'center' ? 'center' : 'start';
        const isCenter = align === 'center';

        const variant = cell.variant || '';
        const variantClass = variant ? ` trade-position-cell--${variant}` : '';
        const extraClass = cell.cellClass ? ` ${cell.cellClass}` : '';
        const alignClass = isCenter ? ' justify-content-center' : '';

        // data attributes
        const dataStr = attrsToString(cell.data);
        const liveField = cell.live && cell.live.field ? ` data-live-field="${esc(cell.live.field)}"` : '';
        const liveValue = cell.live && cell.live.value != null ? ` data-live-value` : '';

        const valueKindClass = cell.valueKind === 'price' ? 'trade-position-price' : 'trade-position-value';
        const valueClass = `${valueKindClass} text-truncate ${cell.valueClass || ''}`.trim();

        // Clickable cells render as a <button> (semantically correct + accessible).
        const isClickable = !!cell.onclick;
        const tag = isClickable ? 'button' : 'div';
        const clickableClass = isClickable ? ' trade-position-cell--btn' : '';
        const typeAttr = isClickable ? ' type="button"' : '';
        const onclickAttr = isClickable ? ` onclick="${esc(cell.onclick)}"` : '';
        const ariaAttr = isClickable && cell.ariaLabel ? ` aria-label="${esc(cell.ariaLabel)}"` : '';

        // ---- target-status host slot (content injected/updated externally) ----
        if (variant === 'target-status') {
            return `<${tag} class="trade-position-cell${variantClass}${clickableClass}${extraClass}"${typeAttr}${dataStr}${liveField}${onclickAttr}${ariaAttr}>${cell.hostHtml || ''}</${tag}>`;
        }

        // ---- progress variant ----
        if (variant === 'progress') {
            const p = cell.progress || {};
            const pctText = p.pct != null ? `${Number(p.pct).toFixed(p.pctDecimals == null ? 0 : p.pctDecimals)}%` : '';
            return `<${tag} class="trade-position-cell${variantClass}${clickableClass}${extraClass}"${typeAttr}${dataStr}${liveField}${onclickAttr}${ariaAttr}>
                <div class="d-flex flex-column align-items-start gap-1 min-w-0 w-100">
                    ${cell.label ? `<span class="trade-position-label text-secondary">${esc(cell.label)}</span>` : ''}
                    ${pctText ? `<span class="trade-position-progress-pct">${esc(pctText)}</span>` : ''}
                    ${progressHtml(p.pct, p.tone)}
                </div>
            </${tag}>`;
        }

        // ---- rich / simple cell ----
        const iconHtml = cell.icon ? iconBoxHtml(cell.icon, cell.iconTone) : '';
        const bodyAlign = isCenter ? 'align-items-center text-center' : 'align-items-start';
        const refreshHtml = cell.refresh ? ` ${icon('fa-redo-alt', 'pf-refresh-icon ms-1 text-secondary')}` : '';
        const bodyHtml = `
            <div class="d-flex flex-column ${bodyAlign} gap-1 min-w-0">
                ${cell.label ? `<span class="trade-position-label text-secondary">${esc(cell.label)}</span>` : ''}
                <div class="d-flex align-items-center">
                    ${cell.value != null ? `<span class="${valueClass}"${liveValue}>${esc(cell.value)}</span>` : ''}
                    ${refreshHtml}
                </div>
                ${subtitleHtml(cell.subtitle, cell.subtitleTone, cell.subtitleClass)}
            </div>
        `;

        return `<${tag} class="trade-position-cell${variantClass}${alignClass}${clickableClass}${extraClass}"${typeAttr}${dataStr}${liveField}${onclickAttr}${ariaAttr}>${iconHtml}${bodyHtml}</${tag}>`;
    }

    /* ---------- grid renderer ---------- */

    /**
     * Render a complete metrics grid (metrics + grid wrapper + cells).
     * @param {Array<Object>} cells   - array of cell configs (see renderMetricsCell)
     * @param {Object} [opts]
     * @param {Object} [opts.gridAttrs]   - data-* attributes for the grid wrapper
     * @param {Object} [opts.metricsAttrs] - data-* attributes for the metrics wrapper
     * @param {string} [opts.gridClass]   - extra classes on the grid
     * @param {string} [opts.metricsClass]- extra classes on the metrics wrapper
     * @returns {string}
     */
    function renderMetricsGrid(cells, opts) {
        cells = Array.isArray(cells) ? cells : [];
        opts = opts || {};

        const metricsAttrs = attrsToString(opts.metricsAttrs);
        const gridAttrs = attrsToString(opts.gridAttrs);
        const metricsClass = `trade-position-metrics${opts.metricsClass ? ` ${opts.metricsClass}` : ''}`;
        const gridClass = `trade-position-grid${opts.gridClass ? ` ${opts.gridClass}` : ''}`;

        const cellsHtml = cells.map(renderMetricsCell).join('');

        return `<div class="${metricsClass}"${metricsAttrs}><div class="${gridClass}"${gridAttrs}>${cellsHtml}</div></div>`;
    }

    /* ---------- live-update helper ---------- */

    /**
     * Patch a live field inside a grid without full re-render.
     * Mirrors the in-place update strategy used in main.js (only write on change).
     * @param {HTMLElement} gridEl - the .trade-position-grid element
     * @param {string} field      - the data-live-field value to match
     * @param {string} value      - new text content
     * @param {string} [toneClass]- optional tone class to set on the value span
     */
    function updateLiveField(gridEl, field, value, toneClass) {
        if (!gridEl || !field) return;
        const host = gridEl.querySelector(`[data-live-field="${field}"] [data-live-value]`);
        if (!host) return;
        const text = String(value == null ? '' : value);
        if (host.textContent !== text) host.textContent = text;
        if (toneClass != null) {
            host.className = host.className.replace(/text-(success|danger|body|secondary|muted)/g, '').replace(/\s+/g, ' ').trim();
            if (toneClass) host.classList.add(toneClass);
        }
    }

    global.MTFRegister({
        renderMetricsGrid,
        renderMetricsCell,
        updateLiveField,
        METRICS_ICON_TONES: ICON_TONES,
        METRICS_SUBTITLE_TONES: SUBTITLE_TONES
    });
})(typeof window !== 'undefined' ? window : globalThis);
