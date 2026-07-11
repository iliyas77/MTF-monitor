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
     * @param {{ cssClass?: string, homeId?: string, maxFitRatio?: number, onDismiss?: Function }} opts
     */
    function createAppPane(selector, opts = {}) {
        const {
            cssClass = 'app-sheet-pane',
            homeId = 'sheetPanels',
            maxFitRatio = 0.9,
            onDismiss = null
        } = opts;

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
                    console.error('CupertinoPane is not loaded');
                    return null;
                }
                return new CupertinoPane(selector, {
                    parentElement: 'body',
                    cssClass,
                    fitHeight: true,
                    maxFitHeight: Math.round(window.innerHeight * maxFitRatio),
                    fitScreenHeight: true,
                    initialBreak: 'top',
                    backdrop: true,
                    backdropOpacity: 0.45,
                    bottomClose: true,
                    fastSwipeClose: true,
                    buttonDestroy: false,
                    showDraggable: true,
                    draggableOver: true,
                    events: {
                        onDidPresent: () => {
                            host._open = true;
                            host._closing = false;
                        },
                        onDidDismiss: () => {
                            host._open = false;
                            host._closing = false;
                            if (typeof onDismiss === 'function') onDismiss();
                            host._park();
                        },
                        onBackdropTap: () => host.close()
                    }
                });
            },

            _getPane() {
                if (!host._pane) host._pane = host._create();
                return host._pane;
            },

            present() {
                const pane = host._getPane();
                if (!pane) return;
                if (host._open && !host._closing) {
                    pane.calcFitHeight?.(true);
                    return;
                }
                host._closing = false;
                pane.present({ animate: true }).then(() => {
                    pane.calcFitHeight?.(true);
                }).catch(() => {});
            },

            close() {
                const pane = host._pane;
                if (!pane || host._closing) {
                    if (!pane) host._park();
                    return;
                }
                host._closing = true;
                pane.destroy({ animate: true }).catch(() => {
                    host._closing = false;
                    host._open = false;
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
