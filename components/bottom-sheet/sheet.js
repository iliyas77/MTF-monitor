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

        open(title, content, footerHtml = '') {
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
            const panel = Sheet._activePanel;
            const home = Sheet._home();
            if (panel && home) home.appendChild(panel);
            Sheet._activePanel = null;
            Sheet.el()?.close();
        },

        show() {
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
