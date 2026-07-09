/**
 * O3 — App header organism (mode switching for default / settings / subpage).
 */
(function (global) {
    'use strict';

    const DEFAULT_MORE_FEATURE_TITLES = {
        money: `${global.MTFComponents.renderIcon('fa-coins', { className: 'mr-2' })}Money`,
        transactions: `${global.MTFComponents.renderIcon('fa-database', { className: 'mr-2' })}Total Transactions`,
        'mtf-calc': `${global.MTFComponents.renderIcon('fa-calculator', { className: 'mr-2' })}MTF Calculator`
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
            const showSearch = pageId === 'page-trades' || pageId === 'page-past' || pageId === 'page-market';
            searchBtn.classList.toggle('hidden', !showSearch);
        }
    }

    global.MTFRegister({
        DEFAULT_MORE_FEATURE_TITLES,
        updateAppHeader
    });
})(typeof window !== 'undefined' ? window : globalThis);
