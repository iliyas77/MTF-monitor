/**
 * O22 — Generic bottom sheet organism.
 */
(function (global) {
    'use strict';

    const { initDateFields } = global.MTFComponents;

    const Sheet = {
        el: () => document.getElementById('appSheet'),
        titleEl: () => document.getElementById('appSheetTitle'),
        bodyEl: () => document.getElementById('appSheetBody'),
        footerEl: () => document.getElementById('appSheetFooter'),
        _home: () => document.getElementById('sheetPanels'),
        _activePanel: null,
        _bound: false,

        _ensureBound() {
            if (Sheet._bound) return;
            const el = Sheet.el();
            if (!el) return;
            Sheet._bound = true;
            el.addEventListener('close', () => {
                Sheet._restoreActivePanel();
            });
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
                footer.classList.add('hidden');
            }
        },

        open(title, content, footerHtml = '') {
            Sheet._ensureBound();
            const body = Sheet.bodyEl();
            const footer = Sheet.footerEl();
            if (Sheet.titleEl()) Sheet.titleEl().innerHTML = title;
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
                footer.classList.toggle('hidden', !footerHtml);
            }
            if (body) initDateFields(body);
            Sheet.el()?.showModal();
        },

        mountPanel(title, panelId, footerHtml) {
            const panel = document.getElementById(panelId);
            if (panel) Sheet.open(title, panel, footerHtml);
        },

        close() {
            Sheet._restoreActivePanel();
            const el = Sheet.el();
            if (el?.open) el.close();
        },

        show() {
            Sheet._ensureBound();
            Sheet.el()?.showModal();
        },

        hide() {
            Sheet.close();
        }
    };

    function closeSheet() {
        Sheet.close();
    }

    global.MTFRegister({ Sheet, closeSheet });
})(typeof window !== 'undefined' ? window : globalThis);
