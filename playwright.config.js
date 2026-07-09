/**
 * Playwright config for npm run verify smoke tests.
 * Chromium only — mobile web app smoke against production.html.
 */
'use strict';

/** @type {import('playwright').PlaywrightTestConfig} */
module.exports = {
    testDir: 'scripts',
    timeout: 60000,
    retries: 0,
    use: {
        headless: true,
        viewport: { width: 390, height: 844 },
        trace: 'off'
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' }
        }
    ]
};
