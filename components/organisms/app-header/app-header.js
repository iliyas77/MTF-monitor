/**
 * O3 — App header organism (mode switching for default / settings / subpage).
 */
(function (global) {
    'use strict';

    const DEFAULT_MORE_FEATURE_TITLES = {
        money: '<i class="fas fa-coins mr-2"></i>Money',
        transactions: '<i class="fas fa-database mr-2"></i>Total Transactions',
        'mtf-calc': '<i class="fas fa-calculator mr-2"></i>MTF Calculator'
    };

    function getHeaderConfig() {
        return (global.MTFAppHelpers || {}).appHeader || {};
    }

    function updateAppHeader(pageId) {
        const def = document.getElementById('appHeaderDefault');
        const settings = document.getElementById('appHeaderSettings');
        const subpage = document.getElementById('appHeaderSubpage');
        const subpageTitle = document.getElementById('appHeaderSubpageTitle');
        if (!def || !settings) return;

        const { moreFeatureMap = {}, moreFeatureTitles = DEFAULT_MORE_FEATURE_TITLES } = getHeaderConfig();
        const onSettings = pageId === 'page-settings';
        const onSearch = pageId === 'page-search';
        const moreFeature = Object.entries(moreFeatureMap).find(([, id]) => id === pageId)?.[0];
        const onSubpage = !!moreFeature;

        def.classList.toggle('hidden', onSettings || onSubpage || onSearch);
        settings.classList.toggle('hidden', !onSettings || onSearch);
        if (subpage) subpage.classList.toggle('hidden', !onSubpage || onSearch);
        if (subpageTitle && moreFeature) {
            subpageTitle.innerHTML = moreFeatureTitles[moreFeature] || '';
        }

        const searchBtn = document.getElementById('appHeaderSearchBtn');
        if (searchBtn) {
            const showSearch = pageId === 'page-trades' || pageId === 'page-past';
            searchBtn.classList.toggle('hidden', !showSearch);
        }
    }

    global.MTFRegister({
        DEFAULT_MORE_FEATURE_TITLES,
        updateAppHeader
    });
})(typeof window !== 'undefined' ? window : globalThis);
