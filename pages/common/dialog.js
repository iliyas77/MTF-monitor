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
                    Promise.resolve(cb()).catch((err) => console.warn('confirm action failed', err));
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
