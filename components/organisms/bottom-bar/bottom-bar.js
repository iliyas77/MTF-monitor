/**
 * O5 — Bottom navigation bar + FAB organism.
 */
(function (global) {
    'use strict';

    const BOTTOM_BAR_ITEMS = [
        { id: 'trades', label: 'Trades', icon: 'fa-list-ul' },
        { id: 'past', label: 'Past Trades', icon: 'fa-history' },
        { id: 'market', label: 'Market', icon: 'fa-chart-line' },
        { id: 'more', label: 'More', icon: 'fa-ellipsis-h' }
    ];

    function renderBottomBarItem(item) {
        return `<button type="button" class="bottom-bar__item" data-page="${item.id}" aria-label="${item.label}">
            <i class="fas ${item.icon} bottom-bar__icon" aria-hidden="true"></i>
            <span class="bottom-bar__label">${item.label}</span>
        </button>`;
    }

    function renderBottomBar(items = BOTTOM_BAR_ITEMS, fabLabel = 'Add trade') {
        const cols = items.length || 4;
        return `<div class="bottom-bar" id="bottomBar">
            <div class="bottom-bar__frame">
                <button type="button" class="bottom-bar__fab" id="bottomBarFab" aria-label="${fabLabel}">
                    <i class="fas fa-plus bottom-bar__fab-icon" aria-hidden="true"></i>
                </button>
                <nav class="bottom-bar__nav" id="bottomBarNav" aria-label="Main navigation" style="--bottom-bar-cols: ${cols}">
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
                el.classList.toggle('bottom-bar__item--active', !!page && el.dataset.page === page);
            });
        },

        setBarVisible(visible) {
            const bar = document.getElementById('bottomBar');
            if (bar) bar.style.display = visible ? '' : 'none';
        },

        setFabVisible(visible) {
            const fab = document.getElementById('bottomBarFab');
            if (!fab) return;
            if (visible) fab.removeAttribute('hidden');
            else fab.setAttribute('hidden', '');
        }
    };

    global.MTFRegister({ BottomBar, BOTTOM_BAR_ITEMS, renderBottomBar });
})(typeof window !== 'undefined' ? window : globalThis);
