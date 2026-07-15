/**
 * MTF-Monitor Client-Side Router
 * Powered by Page.js
 */
(function (global) {
    'use strict';

    // Verify page.js loaded
    if (typeof page === 'undefined') {
        console.warn('Router: page.js is not loaded.');
        return;
    }

    // Configure page.js for hash routing
    page.configure({ hashbang: true });

    // Ensure our dependencies exist
    function getComponents() {
        return global.MTFComponents || {};
    }

    /**
     * Middleware: Global Loading Indicator + Simulated API Fetch
     * This intercepts every route transition, shows a loader,
     * waits 500ms to simulate data fetching, and then proceeds.
     */
    async function withLoading(ctx, next) {
        const { showLoading, hideLoading } = getComponents();
        
        // 1. Show the global syncing spinner
        if (typeof showLoading === 'function') {
            showLoading('Loading...');
        }

        // 2. Simulate an API fetch delay so the UI doesn't transition instantly
        // If Playwright (webdriver) is running, skip the visual delay so tests don't timeout.
        const delayMs = (typeof navigator !== 'undefined' && navigator.webdriver) ? 0 : 500;
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // 3. Proceed to render the route
        next();

        // 4. Hide the loader after rendering is complete
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }

    /**
     * Helper to render a specific page using the main app logic
     */
    function renderPage(pageId) {
        if (typeof global.renderAppPage === 'function') {
            global.renderAppPage(pageId);
        } else {
            console.warn(`Router: renderAppPage is not defined for route /${pageId}`);
        }
    }

    /**
     * Define Application Routes
     */

    page('/', (ctx) => page.redirect('/trades'));

    page('/trades', withLoading, () => renderPage('trades'));
    page('/past', withLoading, () => renderPage('past'));
    page('/market', withLoading, () => renderPage('market'));
    page('/gold', withLoading, () => renderPage('gold'));
    page('/calendar', withLoading, () => renderPage('calendar'));
    page('/more', withLoading, () => renderPage('more'));
    page('/money', withLoading, () => renderPage('money'));
    page('/mtf-calc', withLoading, () => renderPage('mtf-calc'));

    // Fallback route
    page('*', (ctx) => {
        console.log('Router: Unknown route', ctx.path);
        page.redirect('/trades');
    });

    // Start the router
    page.start();

    // Register empty object to satisfy MTF module requirements
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({});
    }

})(typeof window !== 'undefined' ? window : globalThis);
