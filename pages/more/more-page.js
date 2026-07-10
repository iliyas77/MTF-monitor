/**
 * M18 — More hub option molecule (single table row).
 */
(function (global) {
    'use strict';

    const ICON_VARIANT_CLASSES = {
        primary: 'bg-primary-subtle text-primary',
        success: 'bg-success-subtle text-success',
        money: 'bg-success-subtle text-success'
    };

    function renderMoreHubOption(label, icon, iconVariant, onclick) {
        const { renderIcon } = global.MTFComponents;
        const iconClass = ICON_VARIANT_CLASSES[iconVariant] || ICON_VARIANT_CLASSES.primary;
        return `<button type="button" class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3" onclick="${onclick}">
            <span class="d-inline-flex align-items-center justify-content-center rounded flex-shrink-0 ${iconClass}" style="width:2.25rem;height:2.25rem">${renderIcon(icon)}</span>
            <span class="flex-fill fw-semibold text-truncate text-start">${label}</span>
            ${renderIcon('fa-chevron-right', { className: 'text-muted small flex-shrink-0' })}
        </button>`;
    }

    global.MTFRegister({ renderMoreHubOption });
})(typeof window !== 'undefined' ? window : globalThis);

/**
 * O19 — More hub page organism.
 */
(function (global) {
    'use strict';

    const { renderMoreHubOption } = global.MTFComponents;

    function renderMoreHubPage() {
        return `<section id="page-more" class="w-100 d-none">
        <div class="px-3 pt-3 w-100">
            <p class="text-muted small text-uppercase fw-medium mb-2">Tools and reports</p>
            <div class="card bg-body rounded-3 overflow-hidden border">
                <div class="list-group list-group-flush" role="list">
                        ${renderMoreHubOption('Money', 'fa-coins', 'money', "openMoreFeature('money')")}
                        ${renderMoreHubOption('Total Transactions', 'fa-database', 'primary', "openMoreFeature('transactions')")}
                        ${renderMoreHubOption('MTF Calculator', 'fa-calculator', 'success', "openMoreFeature('mtf-calc')")}
                        ${renderMoreHubOption('Settings', 'fa-cog', 'primary', 'openSettingsPage()')}
                </div>
            </div>
            <p id="more-hub-build-meta" class="small text-muted text-center mt-3 mb-0 d-flex flex-column gap-1" aria-label="App version"></p>
        </div>
    </section>`;
    }

    global.MTFRegister({ renderMoreHubPage });
})(typeof window !== 'undefined' ? window : globalThis);
