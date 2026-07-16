/**
 * App shell — bottom bar, sheets, dialog, header
 * Merged for maintainability — each section keeps its original IIFE + MTFRegister.
 */

/* ========== Bottom bar ========== */
/**
 * O5 — Bottom navigation bar + FAB organism (Bootstrap).
 */
(function (global) {
    'use strict';

    const BOTTOM_BAR_ITEMS = [
        { id: 'trades', label: 'Positions', icon: 'fa-briefcase' },
        { id: 'market', label: 'Watchlist', icon: 'fa-star' },
        { id: 'gold', label: 'Gold', icon: 'fa-coins' },
        { id: 'calendar', label: 'Calendar', icon: 'fa-calendar-alt' },
        { id: 'more', label: 'More', icon: 'fa-ellipsis-h' }
    ];

    function renderBottomBarItem(item) {
        const { renderIcon } = global.MTFComponents;
        return `<button type="button" class="btn btn-link text-decoration-none text-muted flex-fill py-2" data-page="${item.id}" aria-label="${item.label}" data-ref="bottom-bar.nav.item.${item.id}">
            <div class="d-flex flex-column align-items-center gap-1" data-ref="bottom-bar.nav.item.${item.id}.body">
                ${renderIcon(item.icon, { className: 'fs-5' })}
                <span class="small" data-ref="bottom-bar.nav.item.${item.id}.label">${item.label}</span>
            </div>
        </button>`;
    }

    function renderBottomBar(items = BOTTOM_BAR_ITEMS, fabLabel = 'Add trade') {
        return `<div class="position-fixed bottom-0 border-top bg-body" id="bottomBar" style="z-index:1030" data-ref="bottom-bar.bar">
            <div class="position-relative" data-ref="bottom-bar.bar.inner">
                <button type="button" class="btn btn-primary rounded-circle position-absolute shadow d-flex align-items-center justify-content-center" id="bottomBarFab" aria-label="${fabLabel}" style="bottom:calc(100% + 0.75rem);width:3.5rem;height:3.5rem;z-index:1" data-ref="bottom-bar.fab">
                    ${global.MTFComponents.renderIcon('fa-plus')}
                </button>
                <nav class="d-flex py-2" id="bottomBarNav" aria-label="Main navigation" data-ref="bottom-bar.nav">
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

/* ========== Sheet (Cupertino Pane) ========== */
/**
 * O22 — Cupertino Pane adapters for app bottom sheets.
 * Pane behavior (drag, backdrop, dismiss) comes from the plugin;
 * hosts only manage content + parking the shell in #sheetPanels.
 */
(function (global) {
    'use strict';

    const { initDateFields } = global.MTFComponents;

    /**
     * Shared Cupertino Pane controller for a persistent DOM shell.
     * @param {string} selector
     * @param {{ cssClass?: string, homeId?: string, maxFitRatio?: number, fullHeight?: boolean, heightRatio?: number, onDismiss?: Function }} opts
     */
    function createAppPane(selector, opts = {}) {
        const {
            cssClass = 'app-sheet-pane',
            homeId = 'sheetPanels',
            maxFitRatio = 0.9,
            fullHeight = false,
            heightRatio = 1,
            topperOverflow = true,
            topperOverflowOffset = 24,
            onDismiss = null
        } = opts;
        const sheetHeightRatio = Math.min(1, Math.max(0.5, Number(heightRatio) || 1));

        const host = {
            _pane: null,
            _open: false,
            _closing: false,

            el: () => document.querySelector(selector),
            _home: () => document.getElementById(homeId),

            _park() {
                const el = host.el();
                const home = host._home();
                if (el && home && el.parentElement !== home) {
                    home.appendChild(el);
                }
            },

            _create() {
                const CupertinoPane = global.CupertinoPane;
                if (typeof CupertinoPane !== 'function') {
                    MTFLogger.error('CupertinoPane is not loaded');
                    return null;
                }
                const vh = host._sheetHeight();
                const base = {
                    parentElement: 'body',
                    cssClass,
                    backdrop: true,
                    backdropOpacity: 0.45,
                    bottomClose: true,
                    fastSwipeClose: true,
                    buttonDestroy: false,
                    showDraggable: true,
                    initialBreak: 'top',
                    events: {
                        onDidPresent: () => {
                            host._open = true;
                            host._closing = false;
                            host._syncViewportSize();
                        },
                        onDidDismiss: () => {
                            host._open = false;
                            host._closing = false;
                            if (typeof onDismiss === 'function') onDismiss();
                            host._park();
                        },
                        onBackdropTap: () => host.close()
                    }
                };
                if (fullHeight) {
                    // Drag only from the top grip so inner content can scroll.
                    // Sheets with a pinned footer should pass topperOverflow: false
                    // and scroll via CSS flex (otherwise Cupertino sizes the middle
                    // to nearly full viewport and clips Cancel / Apply).
                    return new CupertinoPane(selector, {
                        ...base,
                        fitHeight: false,
                        fitScreenHeight: false,
                        draggableOver: false,
                        dragBy: ['.draggable'],
                        topperOverflow,
                        topperOverflowOffset,
                        breaks: {
                            top: { enabled: true, height: vh },
                            middle: { enabled: false },
                            bottom: { enabled: false }
                        }
                    });
                }
                return new CupertinoPane(selector, {
                    ...base,
                    fitHeight: true,
                    maxFitHeight: Math.round(host._viewportHeight() * maxFitRatio),
                    fitScreenHeight: true,
                    draggableOver: true
                });
            },

            _fullHeightBreaks(vh) {
                return {
                    top: { enabled: true, height: vh },
                    middle: { enabled: false },
                    bottom: { enabled: false }
                };
            },

            _viewportHeight() {
                return Math.round(window.visualViewport?.height || window.innerHeight || 0);
            },

            _sheetHeight() {
                return Math.round(host._viewportHeight() * sheetHeightRatio);
            },

            /** Keep full-height sheets filling the screen after Fold unfold / rotate. */
            _syncViewportSize() {
                const pane = host._pane;
                if (!pane || !fullHeight || !host._open) return;
                const vh = host._sheetHeight();
                if (!vh) return;
                try {
                    pane.updateScreenHeights?.();
                    if (typeof pane.setBreakpoints === 'function') {
                        pane.setBreakpoints(host._fullHeightBreaks(vh));
                    }
                    pane.moveToBreak?.('top');
                } catch (_) { /* ignore */ }
            },

            _bindViewportSync() {
                if (host._viewportBound || !fullHeight) return;
                host._viewportBound = true;
                let timer = null;
                host._onViewportChange = () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => host._syncViewportSize(), 80);
                };
                window.addEventListener('resize', host._onViewportChange);
                window.addEventListener('orientationchange', host._onViewportChange);
                window.visualViewport?.addEventListener('resize', host._onViewportChange);
            },

            _getPane() {
                if (!host._pane) host._pane = host._create();
                host._bindViewportSync();
                return host._pane;
            },

            present() {
                const pane = host._getPane();
                if (!pane) return;
                if (host._open && !host._closing) {
                    if (fullHeight) host._syncViewportSize();
                    else pane.calcFitHeight?.(true);
                    return Promise.resolve();
                }
                host._closing = false;
                host._open = true;
                if (fullHeight) {
                    const vh = host._sheetHeight();
                    try {
                        pane.updateScreenHeights?.();
                        pane.setBreakpoints?.(host._fullHeightBreaks(vh));
                    } catch (_) { /* ignore */ }
                }
                return pane.present({ animate: true }).then(() => {
                    if (fullHeight) host._syncViewportSize();
                    else pane.calcFitHeight?.(true);
                }).catch(() => {
                    host._open = false;
                });
            },

            close() {
                const pane = host._pane;
                if (!pane || host._closing) {
                    if (!pane) host._park();
                    return;
                }
                host._closing = true;
                host._open = false;
                pane.destroy({ animate: true }).then(() => {
                    host._pane = null;
                }).catch(() => {
                    host._closing = false;
                    host._open = false;
                    host._pane = null;
                    if (typeof onDismiss === 'function') onDismiss();
                    host._park();
                });
            },

            isOpen() {
                return host._open && !host._closing;
            }
        };

        return host;
    }

    const Sheet = {
        el: () => document.getElementById('appSheet'),
        titleEl: () => document.getElementById('appSheetTitle'),
        bodyEl: () => document.getElementById('appSheetBody'),
        footerEl: () => document.getElementById('appSheetFooter'),
        _home: () => document.getElementById('sheetPanels'),
        _activePanel: null,
        _paneHost: null,

        _host() {
            if (!Sheet._paneHost) {
                Sheet._paneHost = createAppPane('#appSheet', {
                    fullHeight: true,
                    heightRatio: 0.9,
                    topperOverflow: false,
                    onDismiss: () => Sheet._restoreActivePanel()
                });
            }
            return Sheet._paneHost;
        },

        _restoreActivePanel() {
            const panel = Sheet._activePanel;
            const home = Sheet._home();
            if (panel && home && panel.parentElement !== home) {
                home.appendChild(panel);
            }
            Sheet._activePanel = null;
            const footer = Sheet.footerEl();
            if (footer) {
                footer.innerHTML = '';
                footer.classList.add('d-none');
            }
        },

        open(title, content, footerHtml = '') {
            if (global.MTFComponents.TradeSheet?.isOpen?.()) {
                global.MTFComponents.TradeSheet.close();
            }
            const body = Sheet.bodyEl();
            const footer = Sheet.footerEl();
            if (Sheet.titleEl()) {
                Sheet.titleEl().innerHTML = `<span class="d-flex align-items-center min-w-0 gap-2 overflow-hidden w-100">${title || ''}</span>`;
            }
            if (Sheet._activePanel) {
                Sheet._home()?.appendChild(Sheet._activePanel);
                Sheet._activePanel = null;
            }
            if (body) body.innerHTML = '';
            if (typeof content === 'string' && body) {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement && body) {
                body.appendChild(content);
                Sheet._activePanel = content;
            }
            if (footer) {
                footer.innerHTML = footerHtml || '';
                footer.classList.toggle('d-none', !footerHtml);
            }
            if (body) initDateFields(body);
            Sheet._host().present();
        },

        mountPanel(title, panelId, footerHtml) {
            const panel = document.getElementById(panelId);
            if (panel) Sheet.open(title, panel, footerHtml);
        },

        close() {
            const host = Sheet._paneHost;
            if (!host) {
                Sheet._restoreActivePanel();
                return;
            }
            host.close();
        },

        isOpen() {
            return !!Sheet._paneHost?.isOpen?.();
        }
    };

    function closeSheet() {
        Sheet.close();
    }

    global.MTFRegister({ createAppPane, Sheet, closeSheet });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== Dialog ========== */
/**
 * O23 — Generic center dialog organism + confirmAction helper (Bootstrap Modal).
 */
(function (global) {
    'use strict';

    const { initDateFields, renderAppButtonRow, resolveAppButtonVariant, showModal, hideModal, onModalHidden } = global.MTFComponents;

    let confirmPending = null;
    let confirmRun = false;

    const AppDialog = {
        el: () => document.getElementById('appDialog'),
        titleEl: () => document.getElementById('appDialogTitle'),
        bodyEl: () => document.getElementById('appDialogBody'),
        footerEl: () => document.getElementById('appDialogFooter'),

        open(title, bodyHtml, footerHtml) {
            if (AppDialog.titleEl()) AppDialog.titleEl().innerHTML = title;
            if (AppDialog.bodyEl()) AppDialog.bodyEl().innerHTML = bodyHtml;
            if (AppDialog.footerEl()) AppDialog.footerEl().innerHTML = footerHtml || '';
            if (AppDialog.bodyEl()) initDateFields(AppDialog.bodyEl());
            showModal(AppDialog.el());
        },

        close() {
            hideModal(AppDialog.el());
        },

        hide() {
            AppDialog.close();
        }
    };

    function closeDialog() {
        AppDialog.close();
    }

    function getConfirmModal() {
        const el = AppDialog.el();
        if (!el) return null;
        if (!el._confirmInit) {
            el._confirmInit = true;
            onModalHidden(el, () => {
                const cb = confirmPending;
                const run = confirmRun;
                confirmPending = null;
                confirmRun = false;
                if (run && typeof cb === 'function') {
                    Promise.resolve(cb()).catch((err) => MTFLogger.warn('confirm action failed', err));
                }
            });
        }
        return el;
    }

    function confirmAction({ title, titleClass = '', message, confirmLabel, confirmClass = 'action', onConfirm }) {
        getConfirmModal();
        confirmPending = onConfirm;
        confirmRun = false;
        if (AppDialog.titleEl()) {
            AppDialog.titleEl().innerHTML = title;
            AppDialog.titleEl().className = 'modal-title fw-semibold ' + titleClass;
        }
        if (AppDialog.bodyEl()) AppDialog.bodyEl().textContent = message;
        const variant = resolveAppButtonVariant(confirmClass);
        if (AppDialog.footerEl()) {
            AppDialog.footerEl().innerHTML = renderAppButtonRow('Cancel', 'Confirm', {
                cancelOnClick: 'closeDialog()',
                actionId: 'confirmModalConfirmBtn',
                actionVariant: variant,
                actionLabelHtml: confirmLabel,
                cancelInForm: false
            });
        }
        document.getElementById('confirmModalConfirmBtn')?.addEventListener('click', () => {
            confirmRun = true;
            AppDialog.close();
        }, { once: true });
        showModal(AppDialog.el());
    }

    global.MTFRegister({ AppDialog, closeDialog, confirmAction });
})(typeof window !== 'undefined' ? window : globalThis);

/* ========== App header ========== */
/**
 * O3 — App header organism (mode switching for default / settings / subpage).
 */
(function (global) {
    'use strict';

    const { renderIcon } = global.MTFComponents;

    const DEFAULT_MORE_FEATURE_TITLES = {
        money: 'Money',
        'mtf-calc': 'MTF Calculator'
    };

    const PAGE_TITLES = {
        trades: 'My Positions',
        trade: 'My Positions',
        plan: 'My Positions',
        past: 'My Positions',
        market: 'Watchlist',
        gold: 'Gold Market',
        calendar: 'Calendar',
        more: 'More'
    };

    const TRADES_MORE_OPTIONS = [
        { value: 'trade', label: 'Open', icon: 'fa-folder-open', colorClass: 'text-info' },
        { value: 'past', label: 'Closed', icon: 'fa-lock', colorClass: 'text-danger' }
    ];

    function getHeaderConfig() {
        return (global.MTFAppHelpers || {}).appHeader || {};
    }

    function getTradesViewMode() {
        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        return typeof helpers.getTradesViewMode === 'function' ? helpers.getTradesViewMode() : 'trade';
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderDefaultTitle(pageId) {
        let key = 'trades';
        if (pageId === 'page-market') key = 'market';
        else if (pageId === 'page-gold') key = 'gold';
        else if (pageId === 'page-calendar') key = 'calendar';
        else if (pageId === 'page-more') key = 'more';
        else if (pageId === 'page-trades' || pageId === 'page-plan' || pageId === 'page-past') {
            key = 'trades';
        }
        return PAGE_TITLES[key] || PAGE_TITLES.trades;
    }

    function renderHeaderMoreMenu() {
        const mode = getTradesViewMode();
        return TRADES_MORE_OPTIONS.map((o) => {
            const active = o.value === mode ? ' active' : '';
            const icon = renderIcon(o.icon, { className: `me-2 ${o.colorClass}` });
            return `<li data-ref="header.default.more-menu.item.${o.value}"><button type="button" class="dropdown-item d-flex align-items-center${active}" onclick="setTradesViewMode('${o.value}')" data-ref="header.default.more-menu.item.${o.value}.btn">${icon}<span class="${o.colorClass}" data-ref="header.default.more-menu.item.${o.value}.label">${escapeHtml(o.label)}</span></button></li>`;
        }).join('');
    }

    function updateAppHeader(pageId) {
        const appHeader = document.getElementById('appHeader');
        const def = document.getElementById('appHeaderDefault');
        const settings = document.getElementById('appHeaderSettings');
        const subpage = document.getElementById('appHeaderSubpage');
        const subpageTitle = document.getElementById('appHeaderSubpageTitle');
        const defaultTitle = document.getElementById('appHeaderDefaultTitle');
        if (!def || !settings) return;

        const { moreFeatureMap = {}, moreFeatureTitles = DEFAULT_MORE_FEATURE_TITLES } = getHeaderConfig();
        const onSettings = pageId === 'page-settings';
        const moreFeature = Object.entries(moreFeatureMap).find(([, id]) => id === pageId)?.[0];
        const onSubpage = !!moreFeature;
        const onTrades = pageId === 'page-trades' || pageId === 'page-past' || pageId === 'page-plan';
        const onMarket = pageId === 'page-market';
        const onGold = pageId === 'page-gold';
        const onCalendar = pageId === 'page-calendar';
        const hideDefault = onSettings || onSubpage;

        const hideChrome = pageId === 'page-money-entry';
        if (appHeader) appHeader.classList.toggle('d-none', hideChrome);
        if (hideChrome) return;

        def.classList.toggle('d-none', hideDefault);
        settings.classList.toggle('d-none', !onSettings);
        if (subpage) {
            subpage.classList.toggle('d-none', !onSubpage);
            subpage.classList.toggle('d-flex', onSubpage);
        }
        if (subpageTitle && moreFeature) {
            subpageTitle.textContent = moreFeatureTitles[moreFeature] || '';
        }
        if (defaultTitle && !hideDefault) {
            defaultTitle.textContent = renderDefaultTitle(pageId);
        }

        const moneySearch = document.getElementById('appHeaderMoneySearch');
        if (moneySearch) moneySearch.classList.toggle('d-none', moreFeature !== 'money');
        const moneySubtitle = document.getElementById('appHeaderMoneySubtitle');
        if (moneySubtitle) moneySubtitle.classList.toggle('d-none', moreFeature !== 'money');
        const moneyTools = document.getElementById('appHeaderMoneyTools');
        if (moneyTools) {
            moneyTools.classList.toggle('d-none', moreFeature !== 'money');
            moneyTools.classList.toggle('d-flex', moreFeature === 'money');
        }

        const searchBtn = document.getElementById('appHeaderSearchBtn');
        const refreshBtn = document.getElementById('appHeaderRefreshBtn');
        const reportBtn = document.getElementById('appHeaderReportBtn');
        const filterBtn = document.getElementById('appHeaderFilterBtn');
        const moreBtn = document.getElementById('appHeaderMoreBtn');
        const moreMenu = document.getElementById('appHeaderMoreMenu');
        const menuBtn = document.getElementById('appHeaderMenuBtn');

        if (searchBtn) searchBtn.classList.toggle('d-none', !(onTrades || onMarket));
        if (refreshBtn) refreshBtn.classList.remove('d-none');
        if (reportBtn) reportBtn.classList.toggle('d-none', !onCalendar);
        if (filterBtn) filterBtn.classList.toggle('d-none', !onTrades);
        if (moreBtn) moreBtn.classList.toggle('d-none', !onTrades);
        if (moreMenu && onTrades) moreMenu.innerHTML = renderHeaderMoreMenu();
        if (menuBtn) menuBtn.classList.toggle('d-none', hideDefault);

        try {
            if (typeof global.MTFComponents?.placeSyncIndicator === 'function') {
                global.MTFComponents.placeSyncIndicator();
            }
        } catch (_) { }
    }

    global.MTFRegister({
        DEFAULT_MORE_FEATURE_TITLES,
        updateAppHeader
    });
})(typeof window !== 'undefined' ? window : globalThis);
