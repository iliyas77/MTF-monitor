/**
 * O19 — More hub page organism.
 */
(function (global) {
    'use strict';

    const { renderMoreHubOption } = global.MTFComponents;

    function renderMoreHubPage() {
        return `<section id="page-more" class="page-section hidden">
        <div class="px-3.5 app-page-pad pt-3 max-w-[480px] mx-auto w-full">
            <p class="text-base-content/60 text-xs uppercase tracking-wide font-medium mb-2">Tools and reports</p>
            <div class="card bg-base-100 rounded-xl">
                <div class="card-body p-1.5 flex flex-col gap-0.5">
                    ${renderMoreHubOption('Money', 'fa-coins', 'money', "openMoreFeature('money')")}
                    ${renderMoreHubOption('Total Transactions', 'fa-database', 'primary', "openMoreFeature('transactions')")}
                    ${renderMoreHubOption('MTF Calculator', 'fa-calculator', 'success', "openMoreFeature('mtf-calc')")}
                    ${renderMoreHubOption('Settings', 'fa-cog', 'primary', 'openSettingsPage()')}
                </div>
            </div>
        </div>
    </section>`;
    }

    global.MTFRegister({ renderMoreHubPage });
})(typeof window !== 'undefined' ? window : globalThis);
