(function (global) {
    'use strict';

    const Card = {
        /**
         * Safely convert an attributes object to an HTML string.
         * @param {Object} attrs - Key-value pairs.
         * @returns {string} e.g. ' id="myId" data-ref="ref"'
         */
        _buildAttrs(attrs = {}) {
            let result = '';
            for (const [key, value] of Object.entries(attrs)) {
                if (value == null) continue;
                const safe = String(value).replace(/"/g, '&quot;');
                result += ` ${key}="${safe}"`;
            }
            return result;
        },

        /**
         * Build a Bootstrap card component.
         *
         * @param {Object} params
         * @param {string} [params.header]       - HTML for card header
         * @param {string} [params.body]         - HTML for card body (wrapped in .card-body)
         * @param {string} [params.content]      - Raw HTML inside card (not wrapped in .card-body)
         * @param {string} [params.footer]       - HTML for card footer
         * @param {string} [params.className]    - Extra classes for the .card
         * @param {string} [params.headerClass]  - Extra classes for .card-header
         * @param {string} [params.bodyClass]    - Extra classes for .card-body
         * @param {string} [params.footerClass]  - Extra classes for .card-footer
         * @param {Object} [params.attrs]        - Additional HTML attributes for the .card (e.g., data-ref)
         * @returns {string} HTML string
         */
        build(params = {}) {
            const {
                header = '',
                body = '',
                content = '',
                footer = '',
                className = '',
                headerClass = '',
                bodyClass = '',
                footerClass = '',
                attrs = {}
            } = params;

            // Ensure data-component="card" per rule
            const finalAttrs = {
                ...attrs,
                'data-component': 'card'
            };

            const attrStr = this._buildAttrs(finalAttrs);
            
            const cardClasses = `card ${className}`.trim();
            
            let html = `<div class="${cardClasses}"${attrStr}>`;
            
            if (header) {
                const hClass = `card-header ${headerClass}`.trim();
                html += `\n    <div class="${hClass}">\n        ${header}\n    </div>`;
            }
            
            if (body) {
                const bClass = `card-body ${bodyClass}`.trim();
                html += `\n    <div class="${bClass}">\n        ${body}\n    </div>`;
            }
            
            if (content) {
                html += `\n    ${content}`;
            }
            
            if (footer) {
                const fClass = `card-footer ${footerClass}`.trim();
                html += `\n    <div class="${fClass}">\n        ${footer}\n    </div>`;
            }
            
            html += `\n</div>`;
            
            return html;
        }
    };

    // Register globally
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ Card });
    } else {
        global.MTFComponents = global.MTFComponents || {};
        global.MTFComponents.Card = Card;
    }

})(typeof window !== 'undefined' ? window : globalThis);
