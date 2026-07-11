/**
 * O3 — App header organism (mode switching for default / settings / subpage).
 */
(function (global) {
    'use strict';

    const { renderIcon } = global.MTFComponents;

    const DEFAULT_MORE_FEATURE_TITLES = {
        money: `${renderIcon('fa-coins', { className: 'me-2' })}Money`,
        transactions: `${renderIcon('fa-database', { className: 'me-2' })}Total Transactions`,
        'mtf-calc': `${renderIcon('fa-calculator', { className: 'me-2' })}MTF Calculator`
    };

    const PAGE_TITLES = {
        trades: { icon: 'fa-list-ul', label: 'Trades' },
        trade: { icon: 'fa-list-ul', label: 'Trades' },
        plan: { icon: 'fa-clipboard-list', label: 'Plan' },
        past: { icon: 'fa-history', label: 'Past Trades' },
        market: { icon: 'fa-chart-line', label: 'Market' },
        more: { icon: 'fa-ellipsis-h', label: 'More' }
    };

    function getHeaderConfig() {
        return (global.MTFAppHelpers || {}).appHeader || {};
    }

    function getTradesViewMode() {
        const helpers = (global.MTFAppHelpers || {}).tradePages || {};
        return typeof helpers.getTradesViewMode === 'function' ? helpers.getTradesViewMode() : 'trade';
    }

    function renderDefaultTitle(pageId) {
        let key = 'trades';
        if (pageId === 'page-market') key = 'market';
        else if (pageId === 'page-more') key = 'more';
        else if (pageId === 'page-trades' || pageId === 'page-plan' || pageId === 'page-past') {
            const mode = getTradesViewMode();
            key = mode === 'plan' ? 'plan' : (mode === 'past' ? 'past' : 'trade');
        }
        const meta = PAGE_TITLES[key] || PAGE_TITLES.trades;
        return `${renderIcon(meta.icon, { className: 'me-2 text-success' })}${meta.label}`;
    }

    function updateAppHeader(pageId) {
        const def = document.getElementById('appHeaderDefault');
        const settings = document.getElementById('appHeaderSettings');
        const subpage = document.getElementById('appHeaderSubpage');
        const subpageTitle = document.getElementById('appHeaderSubpageTitle');
        const defaultTitle = document.getElementById('appHeaderDefaultTitle');
        if (!def || !settings) return;

        const { moreFeatureMap = {}, moreFeatureTitles = DEFAULT_MORE_FEATURE_TITLES } = getHeaderConfig();
        const onSettings = pageId === 'page-settings';
        const onSearch = pageId === 'page-search';
        const moreFeature = Object.entries(moreFeatureMap).find(([, id]) => id === pageId)?.[0];
        const onSubpage = !!moreFeature;

        def.classList.toggle('d-none', onSettings || onSubpage || onSearch);
        settings.classList.toggle('d-none', !onSettings || onSearch);
        if (subpage) subpage.classList.toggle('d-none', !onSubpage || onSearch);
        if (subpageTitle && moreFeature) {
            subpageTitle.innerHTML = moreFeatureTitles[moreFeature] || '';
        }
        if (defaultTitle && !onSettings && !onSubpage && !onSearch) {
            defaultTitle.innerHTML = renderDefaultTitle(pageId);
        }

        const searchBtn = document.getElementById('appHeaderSearchBtn');
        if (searchBtn) {
            const showSearch = pageId === 'page-trades' || pageId === 'page-past' || pageId === 'page-plan' || pageId === 'page-market';
            searchBtn.classList.toggle('d-none', !showSearch);
        }
    }

    global.MTFRegister({
        DEFAULT_MORE_FEATURE_TITLES,
        updateAppHeader
    });
})(typeof window !== 'undefined' ? window : globalThis);
