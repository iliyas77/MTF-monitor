/**
 * O5 — Bottom navigation bar + FAB organism (Bootstrap).
 */
(function (global) {
    'use strict';

    const BOTTOM_BAR_ITEMS = [
        { id: 'trades', label: 'Trades', icon: 'fa-list-ul' },
        { id: 'market', label: 'Market', icon: 'fa-chart-line' },
        { id: 'more', label: 'More', icon: 'fa-ellipsis-h' }
    ];

    function renderBottomBarItem(item) {
        const { renderIcon } = global.MTFComponents;
        return `<button type="button" class="btn btn-link text-decoration-none text-muted flex-fill py-2" data-page="${item.id}" aria-label="${item.label}">
            <div class="d-flex flex-column align-items-center gap-1">
                ${renderIcon(item.icon, { className: 'fs-5' })}
                <span class="small">${item.label}</span>
            </div>
        </button>`;
    }

    function renderBottomBar(items = BOTTOM_BAR_ITEMS, fabLabel = 'Add trade') {
        return `<div class="position-fixed bottom-0 border-top bg-body" id="bottomBar" style="z-index:1030">
            <div class="position-relative">
                <button type="button" class="btn btn-primary rounded-circle position-absolute shadow d-flex align-items-center justify-content-center" id="bottomBarFab" aria-label="${fabLabel}" style="bottom:calc(100% + 0.75rem);width:3.5rem;height:3.5rem;z-index:1">
                    ${global.MTFComponents.renderIcon('fa-plus')}
                </button>
                <nav class="d-flex py-2" id="bottomBarNav" aria-label="Main navigation">
                    ${items.map(renderBottomBarItem).join('')}
                </nav>
            </div>
        </div>`;
    }

    const BottomBar = {
        _syncInset: null,

        mount(container, opts = {}) {
            if (!container) return;
            const items = Array.isArray(opts.items) && opts.items.length
                ? opts.items
                : BOTTOM_BAR_ITEMS;
            const fabLabel = opts.fabLabel || 'Add trade';
            container.innerHTML = renderBottomBar(items, fabLabel);
            this._onNavigate = opts.onNavigate || null;
            this._onFabClick = opts.onFabClick || null;

            const bar = document.getElementById('bottomBar');
            if (bar) document.body.appendChild(bar);
            container.remove();

            document.getElementById('bottomBarNav')?.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-page]');
                if (!btn || !this._onNavigate) return;
                this._onNavigate(btn.dataset.page);
            });

            document.getElementById('bottomBarFab')?.addEventListener('click', () => {
                this._onFabClick?.();
            });

            this._syncInset = () => {
                const el = document.getElementById('bottomBar');
                if (!el) return;
                const vv = window.visualViewport;
                if (!vv) {
                    el.style.bottom = '0px';
                    return;
                }
                const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
                el.style.bottom = `${inset}px`;
            };

            this._syncInset();
            window.visualViewport?.addEventListener('resize', this._syncInset);
            window.visualViewport?.addEventListener('scroll', this._syncInset);
            window.addEventListener('resize', this._syncInset);
            window.addEventListener('orientationchange', this._syncInset);
        },

        setActive(page) {
            document.querySelectorAll('#bottomBarNav [data-page]').forEach((el) => {
                const active = !!page && el.dataset.page === page;
                el.classList.toggle('text-primary', active);
                el.classList.toggle('text-muted', !active);
            });
        },

        setBarVisible(visible) {
            const bar = document.getElementById('bottomBar');
            if (bar) bar.classList.toggle('d-none', !visible);
        },

        setFabVisible(visible) {
            const fab = document.getElementById('bottomBarFab');
            if (!fab) return;
            fab.classList.toggle('d-none', !visible);
        }
    };

    global.MTFRegister({ BottomBar, BOTTOM_BAR_ITEMS, renderBottomBar });
})(typeof window !== 'undefined' ? window : globalThis);
