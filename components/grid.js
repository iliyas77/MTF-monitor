/**
 * Grid — reusable grid container component for the MTF-monitor design system.
 *
 * Provides preset-based and custom grid layouts that wrap cell components
 * (renderMetricsCell) in the appropriate CSS grid/flex containers.
 *
 * Presets mirror the CSS classes defined in shared/css/_variables.css:
 *   - metrics:       .trade-position-metrics > .trade-position-grid (flex KPI strip)
 *   - ci:            .ci-grid (2→3→4 col responsive)
 *   - pl-cards:      .cal-pl-cards (2 col)
 *   - type-grid:     .money-entry-type-grid (4 col)
 *   - prices:        .trade-detail-prices (3 col + dividers)
 *   - market:        .trade-detail-market (2 col + dividers)
 *   - wallet-metrics:.money-wallet-metrics (3 col)
 *   - quick-grid:    .calc-quick-grid (2→4 col responsive)
 *   - costs:         .trade-detail-costs (3 col)
 *   - status-group:  .tx-status-group (3 col)
 *   - summary-cards: .tx-summary-cards (3 col)
 *
 * Registration: global.MTFComponents.renderGrid, global.MTFComponents.GRID_PRESETS
 * Dependencies: global.MTFComponents.renderMetricsCell, global.MTFComponents.escapeHtml
 *
 * Usage:
 *   const { renderGrid, renderMetricsCell } = global.MTFComponents;
 *
 *   // Preset-based grid
 *   const html = renderGrid({
 *       preset: 'metrics',
 *       cells: [
 *           { label: 'Buy', value: '₹100', icon: 'fa-arrow-up', iconTone: 'green' },
 *           { label: 'Current', value: '₹120', icon: 'fa-chart-line', iconTone: 'blue' }
 *       ]
 *   });
 *
 *   // Custom grid with dividers
 *   const html = renderGrid({
 *       columns: 3,
 *       divider: true,
 *       cells: [cell1, cell2, cell3]
 *   });
 */
(function (global) {
    'use strict';

    const comps = () => global.MTFComponents || {};
    const esc = (val) => {
        const e = comps().escapeHtml;
        return typeof e === 'function' ? e(val) : String(val == null ? '' : val);
    };
    const renderCell = (cell) => {
        const r = comps().renderMetricsCell;
        return typeof r === 'function' ? r(cell) : '';
    };

    /* ---------- helpers ---------- */

    function attrsToString(attrs, excludeKeys) {
        if (!attrs || typeof attrs !== 'object') return '';
        const exclude = excludeKeys || [];
        return Object.keys(attrs)
            .filter((k) => !exclude.includes(k))
            .map((k) => ` ${esc(k)}="${esc(attrs[k])}"`)
            .join('');
    }

    /**
     * Render a 1px divider column for grids with visual separators.
     * @returns {string}
     */
    function renderGridDivider() {
        return '<div class="bg-gr-border" style="width: 1px;"></div>';
    }

    /**
     * Build the inner cells HTML, inserting dividers if needed.
     * @param {Array} cells - cell definition objects
     * @param {boolean} divider - whether to insert 1px dividers between cells
     * @returns {string}
     */
    function buildCellsHtml(cells, divider) {
        if (!Array.isArray(cells) || !cells.length) return '';
        const renderFn = renderCell;
        const parts = [];
        for (let i = 0; i < cells.length; i++) {
            if (divider && i > 0) {
                parts.push(renderGridDivider());
            }
            parts.push(renderFn(cells[i]));
        }
        return parts.join('');
    }

    /* ---------- main renderer ---------- */

    /**
     * Render a grid container with cells.
     *
     * @param {Object} opts
     * @param {number} [opts.columns]         - custom column count (for CSS grid)
     * @param {string} [opts.gridClass]       - custom grid CSS class
     * @param {string} [opts.wrapperClass]    - optional outer wrapper class
     * @param {string} [opts.className]       - extra classes on the grid element
     * @param {string} [opts.id]              - id attribute on the grid element
     * @param {boolean} [opts.divider]        - insert 1px dividers between cells
     * @param {string} [opts.gap]             - CSS gap value (e.g., '0.5rem')
     * @param {string} [opts.style]           - inline style string
     * @param {Array}  [opts.cells]           - cell definition objects (passed to renderMetricsCell)
     * @param {string} [opts.innerHTML]       - raw inner HTML (alternative to cells)
     * @param {Object} [opts.data]            - data-* attributes
     * @param {string} [opts.dataRef]         - data-ref attribute
     * @param {string} [opts.type]            - 'flex' or 'css'
     * @returns {string}
     */
    function renderGrid(opts) {
        opts = opts || {};

        const isFlex = opts.type === 'flex';
        const useDivider = !!opts.divider;

        /* grid CSS class */
        let gridClass = opts.gridClass || '';

        /* wrapper class */
        let wrapperClass = opts.wrapperClass || '';

        /* extra classes */
        const extraClass = opts.className ? ` ${opts.className}` : '';

        /* id */
        const idAttr = opts.id ? ` id="${esc(opts.id)}"` : '';

        /* data attributes */
        const dataStr = attrsToString(opts.data, ['ref', 'data-ref']);
        const refAttr = opts.dataRef ? ` data-ref="${esc(opts.dataRef)}"` : '';

        /* gap */
        const gapStyle = opts.gap ? `gap: ${opts.gap};` : '';

        /* inline style */
        const styleAttr = (opts.style || gapStyle)
            ? ` style="${esc((opts.style || '') + gapStyle)}"` : '';

        /* build inner HTML */
        let innerHtml;
        if (opts.innerHTML != null) {
            innerHtml = opts.innerHTML;
        } else if (Array.isArray(opts.cells)) {
            innerHtml = buildCellsHtml(opts.cells, useDivider);
        } else {
            innerHtml = '';
        }

        /* assemble grid element */
        const gridTag = isFlex ? 'div' : 'div';
        const componentAttr = wrapperClass ? '' : ' data-component="grid"';
        
        const cssClasses = [gridClass, extraClass].filter(Boolean).join(' ').trim();
        const classAttr = cssClasses ? ` class="${cssClasses}"` : '';
        
        const gridHtml = `<${gridTag}${componentAttr}${classAttr}${idAttr}${dataStr}${refAttr}${styleAttr}>${innerHtml}</${gridTag}>`;

        /* wrap if needed */
        if (wrapperClass) {
            return `<div class="${wrapperClass}" data-component="grid">${gridHtml}</div>`;
        }

        return gridHtml;
    }

    /* ---------- batch renderer ---------- */

    /**
     * Render multiple grids in sequence.
     * @param {Array<Object>} grids - array of renderGrid options
     * @returns {string}
     */
    function renderGrids(grids) {
        if (!Array.isArray(grids)) return '';
        return grids.map(renderGrid).join('');
    }

    /* ---------- live-update helpers ---------- */

    /**
     * Patch a live field inside any grid without full re-render.
     * Checks for data-live-field and optionally delegates to a generic metric updater if needed.
     *
     * @param {HTMLElement} gridEl - the grid container element
     * @param {string} field      - the data-live-field value to match
     * @param {string} value      - new text content
     * @param {string} [toneClass]- optional tone class
     */
    function updateGridLiveField(gridEl, field, value, toneClass) {
        if (!gridEl || !field) return;

        const updateFn = comps().updateLiveField;
        
        // Ensure we pass the element containing the [data-live-field] to updateLiveField
        // (the cell component's root handles its own fields).
        if (typeof updateFn === 'function') {
            // First check if the gridEl itself is the target
            if (gridEl.querySelector(`[data-live-field="${field}"]`)) {
                updateFn(gridEl, field, value, toneClass);
                return;
            }
        }

        /* fallback: direct DOM query */
        const host = gridEl.querySelector(`[data-live-field="${field}"] [data-live-value]`);
        if (!host) return;
        const text = String(value == null ? '' : value);
        if (host.textContent !== text) host.textContent = text;
        if (toneClass != null) {
            host.className = host.className.replace(/text-(success|danger|body|secondary|muted)/g, '').replace(/\s+/g, ' ').trim();
            if (toneClass) host.classList.add(toneClass);
        }
    }

    /* ---------- registration ---------- */

    global.MTFRegister({
        renderGrid,
        renderGrids,
        renderGridDivider,
        updateGridLiveField
    });

})(typeof window !== 'undefined' ? window : globalThis);

/**
 * MetricsGrid – Pure Bootstrap grid builder for vanilla JS.
 * Provides .row(), .col(), and .grid() methods.
 * Supports custom HTML attributes via the 'attrs' option.
 */
(function (global) {
    'use strict';

    class MetricsGrid {
        /**
         * Helper to convert an attributes object to an HTML string.
         * @param {Object} attrs - Key-value pairs of attributes.
         * @returns {string} e.g. ' id="myId" data-type="grid"'
         */
        static _buildAttrs(attrs = {}) {
            let result = '';
            for (const [key, value] of Object.entries(attrs)) {
                // Escape double quotes to prevent XSS/breakage
                const safeValue = String(value).replace(/"/g, '&quot;');
                result += ` ${key}="${safeValue}"`;
            }
            return result;
        }

        /**
         * Creates a Bootstrap row.
         * @param {string} children - Inner HTML content.
         * @param {Object} opts
         * @param {number} opts.columns - 1–6 → adds `row-cols-*`.
         * @param {string} opts.gap - 'sm' | 'md' | 'lg' → adds `g-*`.
         * @param {string} opts.align - 'start' | 'center' | 'end' | 'stretch'.
         * @param {string} opts.justify - 'start' | 'center' | 'end' | 'around' | 'between'.
         * @param {boolean} opts.responsive - If true (default), uses responsive `row-cols-*`.
         * @param {string} opts.className - Extra CSS classes for the row.
         * @param {Object} opts.attrs - Custom HTML attributes (id, data-*, aria-*, etc.).
         * @returns {string} HTML string.
         */
        static row(children = '', opts = {}) {
            const {
                columns = null,
                gap = 'md',
                align = 'stretch',
                justify = 'start',
                responsive = true,
                className = '',
                attrs = {},
            } = opts;

            let classes = 'row';

            // Gap
            const gapMap = { sm: 'g-2', md: 'g-3', lg: 'g-4' };
            if (gapMap[gap]) classes += ` ${gapMap[gap]}`;

            // Columns (row-cols-*)
            if (columns) {
                if (responsive) {
                    const colMap = {
                        1: 'row-cols-1',
                        2: 'row-cols-1 row-cols-md-2',
                        3: 'row-cols-1 row-cols-md-2 row-cols-lg-3',
                        4: 'row-cols-1 row-cols-md-2 row-cols-lg-4',
                        5: 'row-cols-1 row-cols-md-3 row-cols-lg-5',
                        6: 'row-cols-1 row-cols-md-3 row-cols-lg-6',
                    };
                    classes += ` ${colMap[columns] || colMap[3]}`;
                } else {
                    classes += ` row-cols-${columns}`;
                }
            }

            // Alignment
            if (align) classes += ` align-items-${align}`;
            if (justify) classes += ` justify-content-${justify}`;
            if (className) classes += ` ${className}`;

            const attrString = this._buildAttrs(attrs);
            return `<div class="${classes}"${attrString}>${children}</div>`;
        }

        /**
         * Creates a Bootstrap column.
         * @param {string} content - Inner HTML content.
         * @param {Object} opts
         * @param {string|number} opts.size - 'auto' | 1–12 | e.g. 'col-4'.
         * @param {number} opts.offset - offset number (1–11).
         * @param {number} opts.order - order number (1–12).
         * @param {string} opts.className - Extra CSS classes for the column.
         * @param {Object} opts.attrs - Custom HTML attributes (id, data-*, aria-*, etc.).
         * @returns {string} HTML string.
         */
        static col(content = '', opts = {}) {
            const { size = null, offset = null, order = null, className = '', attrs = {} } = opts;

            let classes = 'col';

            // Size
            if (size) {
                if (size === 'auto') {
                    classes += ' col-auto';
                } else if (typeof size === 'string' && size.startsWith('col-')) {
                    classes += ` ${size}`;
                } else {
                    classes += ` col-${size}`;
                }
            }

            if (offset) classes += ` offset-${offset}`;
            if (order) classes += ` order-${order}`;
            if (className) classes += ` ${className}`;

            const attrString = this._buildAttrs(attrs);
            return `<div class="${classes}"${attrString}>${content}</div>`;
        }

        /**
         * Shortcut: creates a row and automatically wraps each item in a column.
         * @param {Array} items - Array of content strings.
         * @param {Object} opts - Same as .row() options + extra:
         * @param {string|number} opts.colSize - Size for each column (e.g. 4, 'auto').
         * @param {Object} opts.colAttrs - Attributes applied to every column.
         * @param {Object} opts.rowAttrs - Attributes applied to the row.
         * @returns {string} HTML string.
         */
        static grid(items = [], opts = {}) {
            if (!Array.isArray(items)) items = [items];

            const { colSize = null, colAttrs = {}, rowAttrs = {}, ...rowOpts } = opts;

            const colsHtml = items
                .map((item) => {
                    return MetricsGrid.col(item, { size: colSize, attrs: colAttrs });
                })
                .join('');

            // Merge rowAttrs into the row options
            return MetricsGrid.row(colsHtml, { ...rowOpts, attrs: rowAttrs });
        }
    }

    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ MetricsGrid });
    } else {
        global.MetricsGrid = MetricsGrid;
    }

})(typeof window !== 'undefined' ? window : globalThis);
