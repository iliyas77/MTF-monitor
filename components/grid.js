(function (global) {
    'use strict';

    const MetricsGrid = {
        /**
         * Convert an attributes object to a safe HTML string.
         */
        _buildAttrs(attrs = {}) {
            let result = '';
            for ( const [key, value] of Object.entries(attrs) ) {
                const safe = String(value).replace(/"/g, '&quot;');
                result += ` ${key}="${safe}"`;
            }
            return result;
        },

        /**
         * Build a pure CSS grid with explicit rows and columns.
         *
         * @param {Object} params
         * @param {number} params.rows            – number of rows
         * @param {number} params.cols            – number of columns per row
         * @param {Array}  params.items           – flat array of content strings (rows * cols)
         * @param {string} [params.order='row']   – 'row' (row‑major) or 'column' (column‑major)
         * @param {string} [params.gap='1rem']    – CSS gap value (e.g. '0.5rem', '16px')
         * @param {string} [params.style]         – additional inline styles
         * @param {Object} [params.attrs]         – custom attributes for the container
         * @param {Object} [params.cellAttrs]     – custom attributes for every cell
         * @returns {string} HTML string
         */
        build({
            rows,
            cols,
            items = [],
            order = 'row',
            gap = '1rem',
            style = '',
            attrs = {},
            cellAttrs = {}
        }) {
            const total = rows * cols;

            // Pad items if too few are provided
            if (items.length < total) {
                items = items.concat(new Array(total - items.length).fill(''));
            }

            // Arrange items according to fill order
            let cellContents = [];
            if (order === 'column') {
                // Column‑major: fill down each column
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const idx = r + c * rows;
                        cellContents.push(items[idx] || '');
                    }
                }
            } else {
                // Row‑major: fill across each row (default)
                cellContents = items.slice(0, total);
            }

            // Build the grid container styles
            const gridStyle =
                `display: grid; ` +
                `grid-template-columns: repeat(${cols}, 1fr); ` +
                `grid-template-rows: repeat(${rows}, auto); ` +
                `gap: ${gap}; ` +
                `${style}`;

            // Build each cell
            const cellHtml = cellContents
                .map((content) => {
                    const attrStr = this._buildAttrs(cellAttrs);
                    return `<div${attrStr}>${content}</div>`;
                })
                .join('');

            // Build the container
            const containerClass = `grid`;
            const attrStr = this._buildAttrs(attrs);

            return `<div data-component="grid" class="${containerClass}" style="${gridStyle}"${attrStr}>${cellHtml}</div>`;
        },

        // ------------------------------------------------------------------
        // Legacy helper methods (also pure grid, no Bootstrap)
        // ------------------------------------------------------------------

        /**
         * Create a single row (flex or grid – now uses build for consistency).
         */
        row(children = '', opts = {}) {
            // If children is a string of multiple columns, we wrap them
            // For simplicity, we treat this as a 1‑row grid with items
            // passing children as a single item is legacy – we keep it simple.
            const { gap = '1rem', attrs = {} } = opts;
            // If children contains multiple divs, we can't easily split them.
            // Best to use build() directly. Keep row as a flex container for legacy.
            // But since user wants "only grid", we use grid with auto columns.
            const style = `display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${gap};`;
            const cls = `grid-row`;
            const attrStr = this._buildAttrs(attrs);
            return `<div data-component="grid" class="${cls}" style="${style}"${attrStr}>${children}</div>`;
        },

        /**
         * Create a grid cell.
         */
        col(content = '', opts = {}) {
            const { attrs = {} } = opts;
            const cls = `grid-cell`;
            const attrStr = this._buildAttrs(attrs);
            return `<div data-component="grid-col" class="${cls}"${attrStr}>${content}</div>`;
        },

        /**
         * Legacy grid shortcut – creates one row with all items as columns.
         */
        grid(items = [], opts = {}) {
            const { colSize, ...rest } = opts; // colSize is irrelevant for CSS grid
            return this.build({
                rows: 1,
                cols: items.length,
                items,
                ...rest
            });
        }
    };

    // Register or expose globally
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ MetricsGrid });
    } else {
        global.MetricsGrid = MetricsGrid;
    }

})(typeof window !== 'undefined' ? window : globalThis);