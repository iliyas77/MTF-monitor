/**
 * Browser smoke tests against production.html via Playwright.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function startStaticServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            try {
                const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
                let relPath = urlPath === '/' ? '/production.html' : urlPath;
                const filePath = path.normalize(path.join(ROOT, relPath));
                if (!filePath.startsWith(ROOT)) {
                    res.writeHead(403);
                    res.end('Forbidden');
                    return;
                }
                if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
                fs.createReadStream(filePath).pipe(res);
            } catch (err) {
                res.writeHead(500);
                res.end(String(err.message));
            }
        });
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            resolve({ server, port, baseUrl: `http://127.0.0.1:${port}` });
        });
        server.on('error', reject);
    });
}

function pageVisible(page, id) {
    return page.locator(`#${id}`).evaluate((el) => !el.classList.contains('hidden'));
}

async function runSmoke(report) {
    let chromium;
    try {
        ({ chromium } = require('playwright'));
    } catch (_) {
        report.fail('Smoke', 'playwright not installed — run npm install');
        return;
    }

    const prodPath = path.join(ROOT, 'production.html');
    if (!fs.existsSync(prodPath) || fs.statSync(prodPath).size < 1000) {
        report.fail('Smoke', 'production.html missing or empty — build first');
        return;
    }

    const { server, baseUrl } = await startStaticServer();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2
    });
    const page = await context.newPage();

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
        await page.goto(`${baseUrl}/production.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Wait for app init (bottom bar mount moves #bottomBar to body)
        await page.waitForSelector('#bottomBar', { timeout: 30000 });
        await page.waitForTimeout(400);

        // --- Boot ---
        const tradesVisible = await pageVisible(page, 'page-trades');
        if (!tradesVisible) {
            report.fail('Boot', '#page-trades not visible on load');
        } else if (pageErrors.length) {
            report.fail('Boot', `uncaught: ${pageErrors[0]}`);
        } else {
            report.pass('Boot', 'app starts; Trades page visible');
        }

        // --- Globals / components ---
        const globals = await page.evaluate(() => ({
            hasComponents: !!(window.MTFComponents && Object.keys(window.MTFComponents).length),
            hasDb: !!(window.MTFDb && typeof window.MTFDb.getStorage === 'function'),
            hasBottomBar: !!document.getElementById('bottomBar'),
            hasHeader: !!document.getElementById('appHeader'),
            componentCount: window.MTFComponents ? Object.keys(window.MTFComponents).length : 0
        }));
        if (!globals.hasComponents || !globals.hasDb || !globals.hasBottomBar || !globals.hasHeader) {
            report.fail(
                'Globals',
                `MTFComponents=${globals.hasComponents} MTFDb=${globals.hasDb} bottomBar=${globals.hasBottomBar} header=${globals.hasHeader}`
            );
        } else {
            report.pass('Globals', `MTFComponents (${globals.componentCount}), MTFDb, bottom bar, header`);
        }

        // --- Trades UI shell ---
        const tradesShell = await page.evaluate(() => {
            const list = document.getElementById('transactionList');
            const page = document.getElementById('page-trades');
            return !!(page && list);
        });
        if (tradesShell) {
            report.pass('UI shells', 'Trades page + list container present');
        } else {
            report.fail('UI shells', 'Trades list container missing');
        }

        // --- Navigation: Past (under Trades dropdown) ---
        await page.click('#bottomBarNav [data-page="trades"]');
        await page.waitForTimeout(200);
        const pastViaDropdown = await page.evaluate(() => {
            if (typeof window.setTradesViewMode === 'function') {
                window.setTradesViewMode('past');
                return true;
            }
            return false;
        });
        await page.waitForTimeout(200);
        const pastOk = await page.evaluate(() => {
            const trades = document.getElementById('page-trades');
            const modeBtn = document.getElementById('tradesViewMode');
            return !!(trades && !trades.classList.contains('d-none') && modeBtn && /past/i.test(modeBtn.textContent || ''));
        });
        if (!pastViaDropdown || !pastOk) {
            report.fail('Nav Past', 'Past view not shown under Trades');
        } else {
            report.pass('Nav Past', 'Past trades shown via Trades dropdown');
        }

        // --- Navigation: Market ---
        await page.click('#bottomBarNav [data-page="market"]');
        await page.waitForTimeout(300);
        if (!(await pageVisible(page, 'page-market'))) {
            report.fail('Nav Market', '#page-market not shown');
        } else {
            report.pass('Nav Market', 'Market page shown');
        }

        // --- Navigation: More ---
        await page.click('#bottomBarNav [data-page="more"]');
        await page.waitForTimeout(200);
        if (!(await pageVisible(page, 'page-more'))) {
            report.fail('Nav More', '#page-more not shown');
        } else {
            report.pass('Nav More', 'More hub shown');
        }

        // --- Money ---
        await page.locator('#page-more .list-group-item', { hasText: 'Money' }).click();
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-money'))) {
            report.fail('Money', '#page-money not shown');
        } else {
            report.pass('Money', 'Money page shown');
        }
        // Back to More
        await page.locator('#appHeaderSubpage button[aria-label="Back"]').click();
        await page.waitForTimeout(200);

        // --- Total Transactions ---
        await page.locator('#page-more .list-group-item', { hasText: 'Total Transactions' }).click();
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-transactions'))) {
            report.fail('Transactions', '#page-transactions not shown');
        } else {
            report.pass('Transactions', 'Total Transactions page shown');
        }
        await page.locator('#appHeaderSubpage button[aria-label="Back"]').click();
        await page.waitForTimeout(200);

        // --- MTF Calculator ---
        await page.locator('#page-more .list-group-item', { hasText: 'MTF Calculator' }).click();
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-mtf-calc'))) {
            report.fail('MTF Calc', '#page-mtf-calc not shown');
        } else {
            report.pass('MTF Calc', 'MTF Calculator page shown');
        }
        await page.locator('#appHeaderSubpage button[aria-label="Back"]').click();
        await page.waitForTimeout(200);

        // --- Settings ---
        await page.locator('#page-more .list-group-item', { hasText: 'Settings' }).click();
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-settings'))) {
            report.fail('Settings', '#page-settings not shown');
        } else {
            report.pass('Settings', 'Settings page shown');
        }

        // --- Chrome still present ---
        const chrome = await page.evaluate(() => ({
            bar: !!document.getElementById('bottomBar'),
            header: !!document.getElementById('appHeader')
        }));
        if (!chrome.bar || !chrome.header) {
            report.fail('Chrome', 'bottom bar or header missing after navigation');
        } else {
            report.pass('Chrome', 'bottom bar + header still mounted');
        }

        // --- Storage ---
        const storage = await page.evaluate(() => {
            try {
                const raw = localStorage.getItem('mtf_tracker_data');
                if (!raw) return { ok: true, note: 'key absent until first write (OK)' };
                const data = JSON.parse(raw);
                return { ok: Array.isArray(data.transactions), note: 'mtf_tracker_data readable' };
            } catch (e) {
                return { ok: false, note: e.message };
            }
        });
        // Trigger a storage round-trip via MTFDb if available
        const roundTrip = await page.evaluate(() => {
            try {
                if (!window.MTFDb || typeof window.MTFDb.getStorage !== 'function') {
                    return { ok: false, note: 'MTFDb.getStorage missing' };
                }
                const data = window.MTFDb.getStorage();
                if (typeof window.MTFDb.saveStorageLocal === 'function') {
                    window.MTFDb.saveStorageLocal(data);
                } else if (typeof window.MTFDb.saveStorage === 'function') {
                    window.MTFDb.saveStorage(data);
                }
                const raw = localStorage.getItem('mtf_tracker_data');
                const parsed = JSON.parse(raw);
                return { ok: Array.isArray(parsed.transactions), note: 'localStorage round-trip OK' };
            } catch (e) {
                return { ok: false, note: e.message };
            }
        });
        if (!roundTrip.ok && !storage.ok) {
            report.fail('Storage', roundTrip.note || storage.note);
        } else {
            report.pass('Storage', roundTrip.ok ? roundTrip.note : storage.note);
        }

        // --- Console / page errors (after all nav) ---
        // Filter noisy CDN/network noise that is not app breakage
        const seriousConsole = consoleErrors.filter((t) => {
            const s = String(t);
            if (/Failed to load resource/i.test(s)) return false;
            if (/net::ERR_/i.test(s)) return false;
            if (/favicon/i.test(s)) return false;
            // External market feeds often fail under CORS / offline — not a UI regression
            if (/finance\.yahoo\.com|query1\.finance|nseindia|cors|Access to fetch/i.test(s)) return false;
            return true;
        });
        if (pageErrors.length) {
            report.fail('Console', `uncaught exception: ${pageErrors[0]}`);
        } else if (seriousConsole.length) {
            report.warn('Console', `${seriousConsole.length} console.error(s): ${seriousConsole[0].slice(0, 80)}`);
        } else {
            report.pass('Console', 'no uncaught exceptions');
        }
    } catch (err) {
        report.fail('Smoke', err.message);
    } finally {
        await browser.close().catch(() => {});
        await new Promise((r) => server.close(r));
    }
}

module.exports = { runSmoke };
