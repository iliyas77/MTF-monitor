/**
 * Browser smoke tests against production.html via Playwright.
 * Covers navigation, Open/Plan/Closed views, date ranges, summary,
 * compact table, filter sheet, search, add-trade sheet, and storage.
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

/** Pages use Bootstrap `d-none` (legacy `.hidden` is unused). */
function pageVisible(page, id) {
    return page.locator(`#${id}`).evaluate((el) => {
        if (!el) return false;
        return !el.classList.contains('d-none') && !el.classList.contains('hidden');
    });
}

async function seedSmokeTrades(page) {
    return page.evaluate(() => {
        // Explicit permission required — production storage strips smoke rows otherwise.
        window.__MTF_ALLOW_SMOKE_TRADES__ = true;
        try { localStorage.setItem('mtf_allow_smoke_trades', '1'); } catch (_) { /* ignore */ }

        const db = window.MTFDb;
        if (!db || typeof db.getStorage !== 'function' || typeof db.saveStorageLocal !== 'function') {
            return { ok: false, note: 'MTFDb save API missing' };
        }
        const today = new Date();
        const ymd = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        const ago = (n) => {
            const d = new Date(today);
            d.setDate(d.getDate() - n);
            return ymd(d);
        };
        const txs = [
            {
                id: 'smoke-open-1',
                company: 'Smoke Open Ltd',
                symbol: 'SMOKEO',
                broker: 'Zerodha',
                quantity: 10,
                buyPrice: 100,
                sellPrice: 110,
                buyDate: ago(2),
                sellDate: ago(0),
                leverage: 5,
                status: 'open',
                executed: true,
                netProfit: 80
            },
            {
                id: 'smoke-plan-1',
                company: 'Smoke Plan Ltd',
                symbol: 'SMOKEP',
                broker: 'Dhan',
                quantity: 5,
                buyPrice: 200,
                sellPrice: 220,
                buyDate: ago(0),
                sellDate: ago(-1),
                leverage: 1,
                status: 'open',
                executed: false,
                netProfit: 50
            },
            {
                id: 'smoke-closed-win',
                company: 'Smoke Win Ltd',
                symbol: 'SMOKEW',
                broker: 'Groww',
                quantity: 8,
                buyPrice: 50,
                sellPrice: 60,
                buyDate: ago(4),
                sellDate: ago(1),
                leverage: 1,
                status: 'closed',
                executed: true,
                netProfit: 70,
                verified: false
            },
            {
                id: 'smoke-closed-loss',
                company: 'Smoke Loss Ltd',
                symbol: 'SMOKEL',
                broker: 'Zerodha',
                quantity: 12,
                buyPrice: 90,
                sellPrice: 80,
                buyDate: ago(5),
                sellDate: ago(2),
                leverage: 1,
                status: 'closed',
                executed: true,
                netProfit: -40,
                verified: true
            }
        ];
        const data = db.getStorage();
        const kept = (data.transactions || []).filter((t) => !String(t.id || '').startsWith('smoke-'));
        data.transactions = kept.concat(txs);
        db.saveStorageLocal(data);
        if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
        return { ok: true, note: `seeded ${txs.length} smoke trades (${data.transactions.length} total)` };
    });
}

async function clearSmokeTrades(page) {
    return page.evaluate(() => {
        window.__MTF_ALLOW_SMOKE_TRADES__ = false;
        try { localStorage.removeItem('mtf_allow_smoke_trades'); } catch (_) { /* ignore */ }
        const db = window.MTFDb;
        if (!db || typeof db.getStorage !== 'function') return { ok: false };
        const data = db.getStorage();
        const before = (data.transactions || []).length;
        data.transactions = (data.transactions || []).filter((t) => {
            if (String(t.id || '').startsWith('smoke-')) return false;
            if (/^Smoke\s+(Open|Plan|Win|Loss)\s+Ltd$/i.test(String(t.company || '').trim())) return false;
            if (/^SMOKE[OPWL]$/i.test(String(t.symbol || '').trim())) return false;
            return true;
        });
        if (typeof db.saveStorageLocal === 'function') db.saveStorageLocal(data);
        return { ok: true, removed: before - data.transactions.length };
    });
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
            componentCount: window.MTFComponents ? Object.keys(window.MTFComponents).length : 0,
            hasViewMode: typeof window.setTradesViewMode === 'function',
            hasPastRange: typeof window.setPastRange === 'function',
            hasCollapse: typeof window.toggleTradeCardCollapse === 'function',
            hasFilterSheet: typeof window.openFilterSheet === 'function',
            hasTradeDetail: typeof window.openTradeDetail === 'function'
                && typeof window.backFromTradeDetail === 'function',
            hasSummaryBuckets: typeof (window.MTFComponents || {}).aggregatePortfolioSummary === 'function'
        }));
        if (!globals.hasComponents || !globals.hasDb || !globals.hasBottomBar || !globals.hasHeader) {
            report.fail(
                'Globals',
                `MTFComponents=${globals.hasComponents} MTFDb=${globals.hasDb} bottomBar=${globals.hasBottomBar} header=${globals.hasHeader}`
            );
        } else {
            report.pass('Globals', `MTFComponents (${globals.componentCount}), MTFDb, bottom bar, header`);
        }
        if (globals.hasViewMode && globals.hasPastRange && globals.hasTradeDetail && globals.hasFilterSheet) {
            report.pass('APIs', 'view mode, date range, trade detail, filter sheet exposed');
        } else {
            report.fail(
                'APIs',
                `viewMode=${globals.hasViewMode} range=${globals.hasPastRange} detail=${globals.hasTradeDetail} filter=${globals.hasFilterSheet}`
            );
        }
        if (globals.hasTradeDetail && globals.hasSummaryBuckets) {
            report.pass('Feature APIs', 'trade detail + portfolio summary helpers registered');
        } else {
            report.fail(
                'Feature APIs',
                `detail=${globals.hasTradeDetail} buckets=${globals.hasSummaryBuckets}`
            );
        }

        // --- Trades UI shell ---
        const tradesShell = await page.evaluate(() => {
            const list = document.getElementById('transactionList');
            const pageEl = document.getElementById('page-trades');
            const summary = document.getElementById('summaryOpenStats');
            const filterPanel = document.getElementById('panelPastFilter');
            const filterBtn = document.getElementById('appHeaderFilterBtn');
            return !!(pageEl && list && summary && filterPanel && filterBtn);
        });
        if (tradesShell) {
            report.pass('UI shells', 'Trades page, list, summary, filter sheet present');
        } else {
            report.fail('UI shells', 'Trades shell pieces missing');
        }

        // --- Seed sample trades for feature checks ---
        const seeded = await seedSmokeTrades(page);
        await page.waitForTimeout(200);
        if (seeded.ok) {
            report.pass('Seed data', seeded.note);
        } else {
            report.fail('Seed data', seeded.note);
        }

        // --- Open view (default) ---
        await page.click('#bottomBarNav [data-page="trades"]');
        await page.waitForTimeout(200);
        await page.evaluate(() => {
            if (typeof window.setTradesViewMode === 'function') window.setTradesViewMode('trade');
        });
        await page.waitForTimeout(200);
        const openView = await page.evaluate(() => {
            const mode = window.MTFAppHelpers?.tradePages?.getTradesViewMode?.() || '';
            const from = window.MTFAppHelpers?.tradePages?.getPastFrom?.();
            const to = window.MTFAppHelpers?.tradePages?.getPastTo?.();
            const header = document.getElementById('appHeaderDefaultTitle');
            const summary = document.getElementById('summaryOpenStats');
            const summaryText = summary?.textContent || '';
            return {
                modeOk: mode === 'trade',
                headerOk: /My Positions/i.test(header?.textContent || ''),
                hasMenu: !!document.getElementById('appHeaderMenuBtn'),
                hasSearch: !document.getElementById('appHeaderSearchBtn')?.classList.contains('d-none'),
                hasFilter: !document.getElementById('appHeaderFilterBtn')?.classList.contains('d-none'),
                hasMore: !document.getElementById('appHeaderMoreBtn')?.classList.contains('d-none'),
                hasPnl: /Total P\s*&\s*L/i.test(summaryText),
                hasInvested: /Total Invested/i.test(summaryText),
                hasHoldings: /Total Holdings/i.test(summaryText),
                hasMtf: /MTF Used/i.test(summaryText),
                rangeAll: !from && !to,
                listHasTrade: /Smoke Open/i.test(document.getElementById('transactionList')?.textContent || '')
            };
        });
        if (openView.modeOk) {
            report.pass('View Open', 'Open view mode active');
        } else {
            report.fail('View Open', `mode=${openView.modeOk}`);
        }
        if (openView.hasMenu && openView.hasSearch && openView.hasFilter && openView.hasMore) {
            report.pass('Header chrome', 'Menu + My Positions + search/filter/more icons');
        } else {
            report.fail(
                'Header chrome',
                `menu=${openView.hasMenu} search=${openView.hasSearch} filter=${openView.hasFilter} more=${openView.hasMore}`
            );
        }
        if (openView.rangeAll) {
            report.pass('Range Open default', 'Open view defaults to All dates');
        } else {
            report.fail('Range Open default', 'expected All dates (no from/to)');
        }
        if (openView.hasPnl && openView.hasInvested && openView.hasHoldings && openView.hasMtf) {
            report.pass('Summary Open', 'Total P&L + Invested + Holdings + MTF Used shown');
        } else {
            report.fail(
                'Summary Open',
                `pnl=${openView.hasPnl} invested=${openView.hasInvested} holdings=${openView.hasHoldings} mtf=${openView.hasMtf}`
            );
        }
        if (openView.listHasTrade) {
            report.pass('List Open', 'seeded open trade rendered');
        } else {
            report.fail('List Open', 'seeded open trade not found in list');
        }

        // --- Plan view ---
        await page.evaluate(() => window.setTradesViewMode('plan'));
        await page.waitForTimeout(200);
        const planView = await page.evaluate(() => {
            const mode = window.MTFAppHelpers?.tradePages?.getTradesViewMode?.() || '';
            const from = window.MTFAppHelpers?.tradePages?.getPastFrom?.();
            const to = window.MTFAppHelpers?.tradePages?.getPastTo?.();
            const header = document.getElementById('appHeaderDefaultTitle');
            const summary = document.getElementById('summaryOpenStats');
            return {
                modeOk: mode === 'plan',
                headerOk: /My Positions/i.test(header?.textContent || ''),
                rangeAll: !from && !to,
                hasHoldings: /Total Holdings/i.test(summary?.textContent || ''),
                listHasTrade: /Smoke Plan/i.test(document.getElementById('transactionList')?.textContent || '')
            };
        });
        if (planView.modeOk && planView.headerOk) {
            report.pass('View Plan', 'Plan view mode active');
        } else {
            report.fail('View Plan', `mode=${planView.modeOk} header=${planView.headerOk}`);
        }
        if (planView.rangeAll) {
            report.pass('Range Plan default', 'Plan view defaults to All dates');
        } else {
            report.fail('Range Plan default', 'Plan view did not keep/show All');
        }
        if (planView.listHasTrade && planView.hasHoldings) {
            report.pass('List Plan', 'seeded plan trade + portfolio summary');
        } else {
            report.fail('List Plan', `list=${planView.listHasTrade} summary=${planView.hasHoldings}`);
        }

        // --- Closed view ---
        await page.evaluate(() => window.setTradesViewMode('past'));
        await page.waitForTimeout(250);
        const closedView = await page.evaluate(() => {
            const mode = window.MTFAppHelpers?.tradePages?.getTradesViewMode?.() || '';
            const from = window.MTFAppHelpers?.tradePages?.getPastFrom?.();
            const to = window.MTFAppHelpers?.tradePages?.getPastTo?.();
            const header = document.getElementById('appHeaderDefaultTitle');
            const summary = document.getElementById('summaryOpenStats');
            return {
                modeOk: mode === 'past',
                headerOk: /My Positions/i.test(header?.textContent || ''),
                rangeNotAll: !!(from && to),
                hasHoldings: /Total Holdings/i.test(summary?.textContent || ''),
                hasPnl: /Total P\s*&\s*L/i.test(summary?.textContent || ''),
                hasCards: (summary?.querySelectorAll('.portfolio-stat-card') || []).length >= 4,
                listText: document.getElementById('transactionList')?.textContent || ''
            };
        });
        if (closedView.modeOk && closedView.headerOk) {
            report.pass('View Closed', 'Closed view mode active');
        } else {
            report.fail(
                'View Closed',
                `mode=${closedView.modeOk} header=${closedView.headerOk}`
            );
        }
        if (closedView.rangeNotAll) {
            report.pass('Range Closed default', 'Closed view defaults to This Week (not All)');
        } else {
            report.fail('Range Closed default', 'expected week range from/to');
        }
        if (closedView.hasHoldings && closedView.hasPnl && closedView.hasCards) {
            report.pass('Summary Closed', 'four portfolio metric cards shown');
        } else {
            report.fail(
                'Summary Closed',
                `holdings=${closedView.hasHoldings} pnl=${closedView.hasPnl} cards=${closedView.hasCards}`
            );
        }

        // --- All date range on Closed ---
        await page.evaluate(() => {
            if (typeof window.setPastRange === 'function') window.setPastRange('all');
        });
        await page.waitForTimeout(250);
        const allRange = await page.evaluate(() => {
            const from = window.MTFAppHelpers?.tradePages?.getPastFrom?.();
            const to = window.MTFAppHelpers?.tradePages?.getPastTo?.();
            const list = document.getElementById('transactionList')?.textContent || '';
            return {
                labelAll: !from && !to,
                hasWin: /Smoke Win/i.test(list),
                hasLoss: /Smoke Loss/i.test(list)
            };
        });
        if (allRange.labelAll && allRange.hasWin && allRange.hasLoss) {
            report.pass('Range All', 'All shows closed win + loss trades');
        } else {
            report.fail(
                'Range All',
                `label=${allRange.labelAll} win=${allRange.hasWin} loss=${allRange.hasLoss}`
            );
        }
        const bucketCounts = await page.evaluate(() => {
            const summary = document.getElementById('summaryOpenStats');
            if (!summary) return { holdings: null, hasInvested: false, hasMtf: false };
            const cards = [...summary.querySelectorAll('.portfolio-stat-card')];
            const read = (label) => {
                const card = cards.find((el) => new RegExp(label, 'i').test(el.querySelector('.portfolio-stat-label')?.textContent || ''));
                return card?.querySelector('.portfolio-stat-value')?.textContent?.trim() || null;
            };
            const holdingsRaw = read('Total Holdings');
            return {
                holdings: holdingsRaw == null ? null : Number(holdingsRaw),
                hasInvested: !!read('Total Invested'),
                hasMtf: !!read('MTF Used')
            };
        });
        if (
            bucketCounts.holdings != null
            && bucketCounts.holdings >= 2
            && bucketCounts.hasInvested
            && bucketCounts.hasMtf
        ) {
            report.pass(
                'Summary buckets',
                `Holdings ${bucketCounts.holdings} with Invested + MTF metrics`
            );
        } else {
            report.fail(
                'Summary buckets',
                `holdings=${bucketCounts.holdings} invested=${bucketCounts.hasInvested} mtf=${bucketCounts.hasMtf}`
            );
        }

        // --- Filter sheet includes All option ---
        await page.evaluate(() => {
            if (typeof window.openFilterSheet === 'function') window.openFilterSheet();
        });
        await page.waitForTimeout(300);
        const filterSheet = await page.evaluate(() => {
            const allBtn = document.getElementById('pastRange-all');
            const allLabel = document.querySelector('label[for="pastRange-all"]');
            const statusOpen = document.getElementById('tradeFilterStatus-open');
            const holdAll = document.getElementById('tradeFilterHold-all');
            const sortHolding = document.getElementById('tradeFilterSort-holding');
            const filterShell = document.getElementById('tradeFilterSheet');
            const bodyText = document.getElementById('tradeFilterContent')?.textContent
                || document.getElementById('panelPastFilter')?.textContent
                || '';
            return {
                hasAll: !!(allBtn && allLabel && /all/i.test(allLabel.textContent || '')),
                hasStatus: !!(statusOpen && /Status/i.test(bodyText)),
                hasHolding: !!(holdAll && /Holding/i.test(bodyText)),
                hasPerf: /Performance/i.test(bodyText),
                hasSort: !!(sortHolding && /Sort/i.test(bodyText)),
                fullHeight: !!filterShell,
                sheetOpen: !!(filterShell && document.querySelector('.cupertino-pane-wrapper #tradeFilterSheet'))
                    || !!(document.querySelector('.pane') || document.querySelector('[class*="cupertino"]'))
                    || !!allBtn
            };
        });
        if (filterSheet.hasAll && filterSheet.hasStatus && filterSheet.hasHolding && filterSheet.hasPerf && filterSheet.hasSort && filterSheet.fullHeight) {
            report.pass('Filter sheet', 'Full-height filters with Status, Holding, Performance, Sort, date All');
        } else {
            report.fail(
                'Filter sheet',
                `all=${filterSheet.hasAll} status=${filterSheet.hasStatus} hold=${filterSheet.hasHolding} perf=${filterSheet.hasPerf} sort=${filterSheet.hasSort} full=${filterSheet.fullHeight}`
            );
        }
        await page.evaluate(() => {
            if (window.MTFComponents?.Sheet?.close) window.MTFComponents.Sheet.close();
            else if (typeof window.closeSheet === 'function') window.closeSheet();
        });
        await page.waitForTimeout(200);

        // --- Trade detail page (card tap) ---
        await page.evaluate(() => {
            try {
                localStorage.removeItem('mtf_trade_cards_compact_mode');
                localStorage.removeItem('mtf_collapsed_trade_cards');
                localStorage.removeItem('mtf_expanded_trade_cards');
            } catch (_) { /* ignore */ }
            if (typeof window.setPastRange === 'function') window.setPastRange('all');
            if (typeof window.setTradesViewMode === 'function') window.setTradesViewMode('past');
            if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
        });
        await page.waitForTimeout(250);
        const detailCardMeta = await page.evaluate(() => {
            const list = document.getElementById('transactionList');
            const card = list?.querySelector('[data-trade-card][data-trade-id="smoke-closed-win"]')
                || list?.querySelector('[data-trade-card]');
            if (!card) return { ok: false, note: 'no trade card found' };
            const id = card.getAttribute('data-trade-id');
            const moreBtn = card.querySelector('[data-bs-toggle="dropdown"]');
            const openTarget = card.matches('[data-trade-open-detail]')
                || !!card.querySelector('[data-trade-open-detail]');
            const grid = card.querySelector('.trade-position-grid');
            const headerText = card.querySelector('.trade-position-meta')?.parentElement?.textContent || '';
            const buyOpensSheet = !!card.querySelector('[onclick*="openBuyPriceModal"]');
            const targetOpensSheet = !!card.querySelector('[onclick*="openTargetModal"]');
            const hasChevron = !!card.querySelector('.trade-position-chevron');
            if (typeof window.openTradeDetail === 'function') {
                window.openTradeDetail(id);
            }
            return {
                ok: true,
                noMoreMenu: !moreBtn,
                hasOpenTarget: openTarget,
                noChevron: !hasChevron,
                noBuySheet: !buyOpensSheet,
                noTargetSheet: !targetOpensSheet,
                hasAvatar: !!card.querySelector('.trade-position-avatar'),
                hasAlwaysVisibleGrid: !!grid && grid.children.length === 4,
                noBrokerOnHeader: !/Groww|Zerodha|Dhan|Verified/i.test(headerText),
                noGlobalBtn: !document.getElementById('tradesCollapseAllBtn'),
                hasOpenApi: typeof window.openTradeDetail === 'function',
                noDetailPage: !document.getElementById('page-trade-detail')
            };
        });
        await page.waitForTimeout(350);
        const detailOpen = await page.evaluate(() => {
            const detailText = document.getElementById('tradeDetailContent')?.textContent || '';
            const closeBtn = document.querySelector('#tradeDetailContent .trade-detail-close-btn, #tradeDetailContent [aria-label="Close"]');
            const sheetOpen = typeof window.MTFComponents?.TradeDetailSheet?.isOpen === 'function'
                ? window.MTFComponents.TradeDetailSheet.isOpen()
                : !!document.querySelector('.cupertino-pane-wrapper #tradeDetailSheet');
            return {
                sheetOpen,
                hasPnlSummary: /If Sold Now|Sold Result|At Target/i.test(detailText),
                hasInvestment: /Buy Price|Total Cost|Progress to Target/i.test(detailText),
                hasCloseBtn: !!closeBtn
            };
        });
        await page.evaluate(() => {
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
        });
        await page.waitForTimeout(350);
        const detailClosed = await page.evaluate(() => {
            const backToList = document.getElementById('page-trades')
                && !document.getElementById('page-trades').classList.contains('d-none');
            const sheetClosed = typeof window.MTFComponents?.TradeDetailSheet?.isOpen === 'function'
                ? !window.MTFComponents.TradeDetailSheet.isOpen()
                : true;
            return { backToList, sheetClosed };
        });
        const detailNav = { ...detailCardMeta, ...detailOpen, ...detailClosed };
        if (
            detailNav.ok
            && detailNav.noMoreMenu
            && detailNav.hasOpenTarget
            && detailNav.noChevron
            && detailNav.noBuySheet
            && detailNav.noTargetSheet
            && detailNav.hasAvatar
            && detailNav.hasAlwaysVisibleGrid
            && detailNav.noBrokerOnHeader
            && detailNav.sheetOpen
            && detailNav.hasPnlSummary
            && detailNav.hasInvestment
            && detailNav.hasCloseBtn
            && detailNav.sheetClosed
            && detailNav.backToList
            && detailNav.noGlobalBtn
            && detailNav.hasOpenApi
            && detailNav.noDetailPage
        ) {
            report.pass('Trade detail page', 'full-height sheet opens; close returns to list');
        } else {
            report.fail('Trade detail page', JSON.stringify(detailNav));
        }

        // --- Closed card actions (on detail page) ---
        await page.evaluate(() => {
            if (typeof window.setTradesViewMode === 'function') window.setTradesViewMode('past');
            if (typeof window.setPastRange === 'function') window.setPastRange('all');
            if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
        });
        await page.waitForTimeout(250);
        const actions = await page.evaluate(() => {
            const list = document.getElementById('transactionList');
            const card = list?.querySelector('[data-trade-card]');
            const id = card?.getAttribute('data-trade-id');
            const grid = card?.querySelector('.trade-position-grid');
            if (id && typeof window.openTradeDetail === 'function') window.openTradeDetail(id);
            return {
                id,
                hasFourColGrid: !!grid && grid.children.length === 4
            };
        });
        await page.waitForTimeout(300);
        const actionsDetail = await page.evaluate(() => {
            const detailText = document.getElementById('tradeDetailContent')?.textContent || '';
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
            return {
                hasEdit: /Edit/i.test(detailText),
                hasCopy: /Copy/i.test(detailText)
            };
        });
        await page.waitForTimeout(450);
        if (actionsDetail.hasEdit && actionsDetail.hasCopy && actions.hasFourColGrid) {
            report.pass('Card actions', 'Closed detail shows Copy + Edit; list keeps 4-col metrics');
        } else {
            report.fail('Card actions', JSON.stringify({ ...actions, ...actionsDetail }));
        }

        // --- Open card actions (Done + Edit on detail page) ---
        await page.evaluate(() => window.setTradesViewMode('trade'));
        await page.waitForTimeout(200);
        await page.evaluate(() => {
            const card = document.getElementById('transactionList')?.querySelector('[data-trade-card]');
            const id = card?.getAttribute('data-trade-id');
            if (id && typeof window.openTradeDetail === 'function') window.openTradeDetail(id);
        });
        await page.waitForTimeout(300);
        const openActions = await page.evaluate(() => {
            const detailText = document.getElementById('tradeDetailContent')?.textContent || '';
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
            return { hasDone: /Done/i.test(detailText), hasEdit: /Edit/i.test(detailText) };
        });
        await page.waitForTimeout(450);
        await page.evaluate(() => {
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
            if (window.MTFComponents?.TradeDetailSheet?.close) {
                window.MTFComponents.TradeDetailSheet.close({ quiet: true });
            }
            document.querySelectorAll('.cupertino-pane-wrapper.app-sheet-pane').forEach((el) => {
                if (el.querySelector('#tradeDetailSheet')) el.remove();
            });
        });
        await page.waitForTimeout(200);
        if (openActions.hasDone && openActions.hasEdit) {
            report.pass('Open actions', 'Open detail shows Done + Edit');
        } else {
            report.fail('Open actions', `done=${openActions.hasDone} edit=${openActions.hasEdit}`);
        }

        // --- Search page ---
        await page.evaluate(() => {
            if (typeof window.openSearchPage === 'function') window.openSearchPage();
        });
        await page.waitForTimeout(250);
        const searchOk = await pageVisible(page, 'page-search');
        if (searchOk) {
            report.pass('Search', 'Search page opens from trades');
        } else {
            report.fail('Search', '#page-search not shown');
        }
        await page.evaluate(() => {
            if (typeof window.closeSearchPage === 'function') window.closeSearchPage();
            else if (typeof window.setTradesViewMode === 'function') {
                window.setTradesViewMode('trade');
                document.getElementById('page-search')?.classList.add('d-none');
                document.getElementById('page-trades')?.classList.remove('d-none');
            }
        });
        await page.waitForTimeout(150);

        // --- Add trade sheet (FAB) ---
        await page.click('#bottomBarNav [data-page="trades"]');
        await page.waitForTimeout(150);
        await page.evaluate(() => {
            if (typeof window.openAddModal === 'function') window.openAddModal();
        });
        await page.waitForTimeout(400);
        const addSheet = await page.evaluate(() => {
            const modal = document.getElementById('txModal');
            const company = document.getElementById('txCompany');
            const visible = modal && (
                !modal.classList.contains('d-none')
                || modal.classList.contains('show')
                || modal.style.display === 'block'
                || modal.getAttribute('aria-hidden') === 'false'
                || !!modal.querySelector('.pane-wrapper, .cupertino-pane-wrapper')
                || (company && company.offsetParent !== null)
            );
            return { visible: !!visible, hasCompany: !!company };
        });
        if (addSheet.visible && addSheet.hasCompany) {
            report.pass('Add trade', 'add/edit trade sheet opens with company field');
        } else {
            report.warn('Add trade', `visible=${addSheet.visible} company=${addSheet.hasCompany}`);
        }
        await page.evaluate(() => {
            if (typeof window.closeTradeModal === 'function') window.closeTradeModal();
            else if (window.MTFComponents?.TradeSheet?.close) window.MTFComponents.TradeSheet.close();
        });
        await page.waitForTimeout(200);

        // --- Navigation: Market ---
        await page.click('#bottomBarNav [data-page="market"]');
        await page.waitForTimeout(300);
        if (!(await pageVisible(page, 'page-market'))) {
            report.fail('Nav Market', '#page-market not shown');
        } else {
            report.pass('Nav Market', 'Market page shown');
        }
        const marketTabs = await page.evaluate(() => {
            const inTrade = document.querySelector('#marketSubTabs [data-bs-target="#marketInTradePane"], #marketInTradeTab, [data-market-tab="in-trade"]');
            const watch = document.querySelector('#marketSubTabs [data-bs-target="#marketWatchlistPane"], #marketWatchlistTab, [data-market-tab="watchlist"]');
            const anyTab = document.querySelector('#page-market .nav-pills, #page-market [role="tablist"]');
            return !!(inTrade || watch || anyTab);
        });
        if (marketTabs) {
            report.pass('Market tabs', 'Market In Trade / Watchlist chrome present');
        } else {
            report.warn('Market tabs', 'market tab chrome not found (layout may differ)');
        }

        // --- Navigation: More ---
        await page.click('#bottomBarNav [data-page="more"]');
        await page.waitForTimeout(200);
        if (!(await pageVisible(page, 'page-more'))) {
            report.fail('Nav More', '#page-more not shown');
        } else {
            report.pass('Nav More', 'More hub shown');
        }

        // --- App version stamp ---
        const version = await page.evaluate(() => {
            const el = document.getElementById('more-hub-build-meta');
            const text = el?.textContent || document.getElementById('page-more')?.textContent || '';
            return {
                hasStamp: !!(el && String(el.textContent || '').trim()),
                mentionsVersion: /Version\s+\d+\.\d+/i.test(text)
            };
        });
        if (version.hasStamp || version.mentionsVersion) {
            report.pass('App version', 'More page shows version / build stamp');
        } else {
            report.warn('App version', 'version stamp not found on More page');
        }

        // --- Money ---
        await page.locator('#page-more .list-group-item', { hasText: 'Money' }).click();
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-money'))) {
            report.fail('Money', '#page-money not shown');
        } else {
            report.pass('Money', 'Money page shown');
        }
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
        const calcFields = await page.evaluate(() => ({
            qty: !!document.getElementById('calcQty'),
            buy: !!document.getElementById('calcBuyPrice') || !!document.getElementById('calcBuy'),
            hasCompare: !!document.getElementById('calcComparePanel')
        }));
        if (calcFields.qty && calcFields.hasCompare) {
            report.pass('MTF Calc UI', 'calculator qty + compare panel present');
        } else {
            report.warn('MTF Calc UI', `qty=${calcFields.qty} compare=${calcFields.hasCompare}`);
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
                const hasSmoke = (parsed.transactions || []).some((t) => String(t.id || '').startsWith('smoke-'));
                return {
                    ok: Array.isArray(parsed.transactions),
                    note: hasSmoke
                        ? 'localStorage round-trip OK (smoke trades persisted)'
                        : 'localStorage round-trip OK'
                };
            } catch (e) {
                return { ok: false, note: e.message };
            }
        });
        if (!roundTrip.ok && !storage.ok) {
            report.fail('Storage', roundTrip.note || storage.note);
        } else {
            report.pass('Storage', roundTrip.ok ? roundTrip.note : storage.note);
        }

        // --- Console / page errors ---
        const seriousConsole = consoleErrors.filter((t) => {
            const s = String(t);
            if (/Failed to load resource/i.test(s)) return false;
            if (/net::ERR_/i.test(s)) return false;
            if (/favicon/i.test(s)) return false;
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
        try { await clearSmokeTrades(page); } catch (_) { /* ignore */ }
        await browser.close().catch(() => {});
        await new Promise((r) => server.close(r));
    }
}

module.exports = { runSmoke };
