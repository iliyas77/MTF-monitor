/**
 * Browser smoke tests against production.html via Playwright.
 * Covers navigation, Open/Plan/Closed views, date ranges, summary,
 * compact table, filter sheet, search, add-trade sheet, and storage.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

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
        const globals = await page.evaluate(() => {
            const db = window.MTFDb || {};
            return {
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
            hasSummaryBuckets: typeof (window.MTFComponents || {}).aggregatePortfolioSummary === 'function',
            moneyApis: {
                getAccounts: typeof db.getMoneyAccounts === 'function',
                getEntries: typeof db.getMoneyEntries === 'function',
                addAccount: typeof db.addMoneyAccount === 'function',
                addEntry: typeof db.addMoneyEntry === 'function',
                addTransfer: typeof db.addMoneyTransfer === 'function',
                noteDbCall: typeof db.noteDbCall === 'function',
                cloudPush: typeof db.cloudPush === 'function',
                connectSync: typeof db.connectSync === 'function'
            }
        };
        });
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
        const moneyApiOk = Object.values(globals.moneyApis).every(Boolean);
        if (moneyApiOk) {
            report.pass('DB money APIs', 'ledger CRUD + call log + sync push on MTFDb');
        } else {
            report.fail('DB money APIs', JSON.stringify(globals.moneyApis));
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
                cardCount: summary?.querySelectorAll('.portfolio-stat-card')?.length || 0,
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
        if (openView.hasPnl && openView.hasInvested && openView.hasHoldings && openView.cardCount === 3) {
            report.pass('Summary Open', 'Total P&L + Invested + Holdings shown (3 cards)');
        } else {
            report.fail(
                'Summary Open',
                `pnl=${openView.hasPnl} invested=${openView.hasInvested} holdings=${openView.hasHoldings} cards=${openView.cardCount}`
            );
        }
        if (openView.listHasTrade) {
            report.pass('List Open', 'seeded open trade rendered');
        } else {
            report.fail('List Open', 'seeded open trade not found in list');
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
                hasCards: (summary?.querySelectorAll('.portfolio-stat-card') || []).length === 3,
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
            report.pass('Summary Closed', 'Total P&L + Invested + Holdings shown (3 cards)');
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
            if (!summary) return { holdings: null, hasInvested: false, cardCount: 0 };
            const cards = [...summary.querySelectorAll('.portfolio-stat-card')];
            const read = (label) => {
                const card = cards.find((el) => new RegExp(label, 'i').test(el.querySelector('.portfolio-stat-label')?.textContent || ''));
                return card?.querySelector('.portfolio-stat-value')?.textContent?.trim() || null;
            };
            const holdingsRaw = read('Total Holdings');
            return {
                holdings: holdingsRaw == null ? null : Number(holdingsRaw),
                hasInvested: !!read('Total Invested'),
                cardCount: cards.length
            };
        });
        if (
            bucketCounts.holdings != null
            && bucketCounts.holdings >= 2
            && bucketCounts.hasInvested
            && bucketCounts.cardCount === 3
        ) {
            report.pass(
                'Summary buckets',
                `Holdings ${bucketCounts.holdings} with Invested (3 cards)`
            );
        } else {
            report.fail(
                'Summary buckets',
                `holdings=${bucketCounts.holdings} invested=${bucketCounts.hasInvested} cards=${bucketCounts.cardCount}`
            );
        }

        // --- Filter sheet includes All option ---
        await page.evaluate(() => {
            if (typeof window.openFilterSheet === 'function') window.openFilterSheet();
        });
        await page.waitForTimeout(500);
        const filterSheet = await page.evaluate(() => {
            const allBtn = document.getElementById('pastRange-all');
            const allLabel = document.querySelector('label[for="pastRange-all"]');
            const statusOpen = document.getElementById('tradeFilterStatus-open');
            const holdAll = document.getElementById('tradeFilterHold-all');
            const sortHolding = document.getElementById('tradeFilterSort-holding');
            const filterShell = document.getElementById('tradeFilterSheet');
            const applyBtn = document.getElementById('tradeFilterApplyBtn');
            const bodyText = document.getElementById('tradeFilterContent')?.textContent
                || document.getElementById('panelPastFilter')?.textContent
                || '';
            const footer = filterShell?.querySelector('.trade-filter-footer')
                || document.querySelector('.trade-filter-footer');
            const cancel = footer?.querySelector('button');
            return {
                hasAll: !!(allBtn && allLabel && /all/i.test(allLabel.textContent || '')),
                hasStatus: !!(statusOpen && /Status/i.test(bodyText)),
                hasHolding: !!(holdAll && /Holding/i.test(bodyText)),
                hasPerf: /Performance/i.test(bodyText),
                hasSort: !!(sortHolding && /Sort/i.test(bodyText)),
                hasSidebar: !!document.querySelector('#panelPastFilter .trade-filter-nav'),
                hasApply: !!(applyBtn && /Apply filters/i.test(applyBtn.textContent || '')),
                fullHeight: !!filterShell,
                footerVisible: (() => {
                    if (!footer || !cancel || !applyBtn) return false;
                    if (!/Cancel/i.test(cancel.textContent || '')) return false;
                    const fr = footer.getBoundingClientRect();
                    const cr = cancel.getBoundingClientRect();
                    const ar = applyBtn.getBoundingClientRect();
                    const vh = window.innerHeight || 0;
                    // Footer may sit near the bottom edge while the pane animates in.
                    const nearViewport = fr.height > 0 && fr.top < vh + 40 && fr.bottom > -40;
                    const buttonsLaidOut = cr.height > 20 && ar.height > 20;
                    return nearViewport && buttonsLaidOut;
                })(),
                sheetOpen: !!(filterShell && document.querySelector('.cupertino-pane-wrapper #tradeFilterSheet'))
                    || !!(document.querySelector('.pane') || document.querySelector('[class*="cupertino"]'))
                    || !!allBtn
            };
        });
        if (filterSheet.hasAll && filterSheet.hasStatus && filterSheet.hasHolding && filterSheet.hasPerf && filterSheet.hasSort && filterSheet.hasSidebar && filterSheet.hasApply && filterSheet.fullHeight && filterSheet.footerVisible) {
            report.pass('Filter sheet', 'Sidebar filters with visible Cancel / Apply footer');
        } else {
            report.fail(
                'Filter sheet',
                `all=${filterSheet.hasAll} status=${filterSheet.hasStatus} hold=${filterSheet.hasHolding} perf=${filterSheet.hasPerf} sort=${filterSheet.hasSort} sidebar=${filterSheet.hasSidebar} apply=${filterSheet.hasApply} footer=${filterSheet.footerVisible} full=${filterSheet.fullHeight}`
            );
        }
        await page.evaluate(() => {
            if (typeof window.closeFilterSheet === 'function') window.closeFilterSheet();
            else if (window.MTFComponents?.Sheet?.close) window.MTFComponents.Sheet.close();
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
            const tagsText = card.querySelector('.trade-position-tags')?.textContent || '';
            const metaText = card.querySelector('.trade-position-meta')?.textContent || '';
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
                hasStatusTag: true, // Status tags removed in UI refactor
                hasBrokerTag: /Groww|Zerodha|Dhan/i.test(tagsText),
                noBrokerInMeta: !/Groww|Zerodha|Dhan|Verified/i.test(metaText),
                noGlobalBtn: !document.getElementById('tradesCollapseAllBtn'),
                hasOpenApi: typeof window.openTradeDetail === 'function',
                noDetailPage: !document.getElementById('page-trade-detail')
            };
        });
        await page.waitForTimeout(350);
        const detailOpen = await page.evaluate(() => {
            const sheet = document.getElementById('tradeDetailSheet');
            const detailText = sheet?.textContent || '';
            const closeBtn = document.querySelector(
                '#tradeDetailHeader .trade-detail-close-btn, #tradeDetailHeader [aria-label="Close"], #tradeDetailSheet .trade-detail-close-btn'
            );
            const sheetOpen = typeof window.MTFComponents?.TradeDetailSheet?.isOpen === 'function'
                ? window.MTFComponents.TradeDetailSheet.isOpen()
                : !!document.querySelector('.cupertino-pane-wrapper #tradeDetailSheet');
            return {
                sheetOpen,
                hasPnlSummary: /Net P&L|Sold Result|At Target/i.test(detailText),
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
            && detailNav.hasStatusTag
            && detailNav.hasBrokerTag
            && detailNav.noBrokerInMeta
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
            const footerText = document.getElementById('tradeDetailFooter')?.textContent || '';
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
            return {
                hasEdit: /Edit/i.test(footerText),
                hasCopy: /Copy/i.test(footerText)
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
            const footerText = document.getElementById('tradeDetailFooter')?.textContent || '';
            if (typeof window.backFromTradeDetail === 'function') window.backFromTradeDetail();
            return { hasDone: /Done/i.test(footerText), hasEdit: /Edit/i.test(footerText) };
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

        // --- Search sheet ---
        await page.evaluate(() => {
            if (typeof window.openSearchPage === 'function') window.openSearchPage();
        });
        await page.waitForTimeout(350);
        const searchOk = await page.evaluate(() => {
            const sheet = document.getElementById('searchSheet');
            const inPane = !!document.querySelector('.cupertino-pane-wrapper #searchSheet');
            const input = document.getElementById('searchPageInput');
            return !!(sheet && inPane && input);
        });
        if (searchOk) {
            report.pass('Search', 'Search sheet opens from trades');
        } else {
            report.fail('Search', '#searchSheet not shown as bottom sheet');
        }
        await page.evaluate(() => {
            if (typeof window.closeSearchPage === 'function') window.closeSearchPage();
        });
        await page.waitForTimeout(200);

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

        // --- Navigation: Watchlist ---
        await page.click('#bottomBarNav [data-page="market"]');
        await page.waitForTimeout(300);
        if (!(await pageVisible(page, 'page-market'))) {
            report.fail('Nav Watchlist', '#page-market not shown');
        } else {
            report.pass('Nav Watchlist', 'Watchlist page shown');
        }
        const watchlistChrome = await page.evaluate(() => {
            const search = document.getElementById('marketSearchInput');
            const headerSearch = document.getElementById('appHeaderSearchBtn');
            const headerRefresh = document.getElementById('appHeaderRefreshBtn');
            const list = document.getElementById('marketQuotesList');
            const pageRefresh = document.getElementById('marketRefreshBtn');
            const inTradeTab = document.querySelector('[data-market-tab="in-trade"], #market-tab-in-trade');
            return {
                noInlineSearch: !search,
                hasHeaderSearch: !!headerSearch,
                hasHeaderRefresh: !!(headerRefresh && !headerRefresh.classList.contains('d-none')),
                hasList: !!list,
                noPageRefresh: !pageRefresh,
                noInTrade: !inTradeTab
            };
        });
        if (watchlistChrome.noInlineSearch && watchlistChrome.hasHeaderSearch && watchlistChrome.hasHeaderRefresh && watchlistChrome.hasList && watchlistChrome.noPageRefresh && watchlistChrome.noInTrade) {
            report.pass('Watchlist chrome', 'header search + refresh; no page Refresh / inline search / In Trade');
        } else {
            report.warn('Watchlist chrome', `inlineSearch=${!watchlistChrome.noInlineSearch} headerSearch=${watchlistChrome.hasHeaderSearch} headerRefresh=${watchlistChrome.hasHeaderRefresh} list=${watchlistChrome.hasList} noPageRefresh=${watchlistChrome.noPageRefresh} noInTrade=${watchlistChrome.noInTrade}`);
        }

        // --- Market Buy opens trade form ---
        const marketBuy = await page.evaluate(async () => {
            const hasApi = typeof window.openBuyTradeFromMarket === 'function';
            const buyBtn = document.querySelector('#marketQuotesList .market-buy-btn');
            if (buyBtn) {
                buyBtn.click();
            } else if (hasApi) {
                await window.openBuyTradeFromMarket('RELIANCE', 'Reliance Industries');
            } else {
                return { ok: false, reason: 'no Buy button or API' };
            }
            await new Promise((r) => setTimeout(r, 450));
            const modal = document.getElementById('txModal');
            const locked = document.getElementById('txCompanyLocked');
            const search = document.getElementById('txCompanySearchWrap');
            const company = document.getElementById('txCompany');
            const qty = document.getElementById('txQty');
            const sheetOpen = !!(modal && (
                company?.offsetParent !== null
                || locked?.offsetParent !== null
                || modal.querySelector('.pane-wrapper, .cupertino-pane-wrapper')
                || modal.getAttribute('aria-hidden') === 'false'
            ));
            const lockedVisible = !!(locked && !locked.classList.contains('d-none'));
            const searchHidden = !!(search && search.classList.contains('d-none'));
            if (typeof window.closeTradeModal === 'function') window.closeTradeModal();
            else if (window.MTFComponents?.TradeSheet?.close) window.MTFComponents.TradeSheet.close();
            return {
                ok: hasApi && sheetOpen && lockedVisible && searchHidden && !!qty,
                hasApi,
                sheetOpen,
                lockedVisible,
                searchHidden,
                usedButton: !!buyBtn
            };
        });
        await page.waitForTimeout(200);
        if (marketBuy.ok) {
            report.pass('Market Buy', 'Buy opens trade form with company locked');
        } else {
            report.warn('Market Buy', `api=${marketBuy.hasApi} sheet=${marketBuy.sheetOpen} locked=${marketBuy.lockedVisible} searchHidden=${marketBuy.searchHidden}`);
        }

        // --- Navigation: Calendar ---
        await page.click('#bottomBarNav [data-page="calendar"]');
        await page.waitForTimeout(300);
        if (!(await pageVisible(page, 'page-calendar'))) {
            report.fail('Nav Calendar', '#page-calendar not shown');
        } else {
            report.pass('Nav Calendar', 'Calendar page shown');
        }
        const calendarView = await page.evaluate(() => {
            const grid = document.getElementById('calendarGrid');
            const title = document.getElementById('calendarMonthTitle')?.textContent || '';
            const jump = document.getElementById('calendarMonthJumpBtn');
            const card = document.querySelector('#page-calendar .cal-month-card');
            const profit = document.getElementById('calTotalProfit');
            const loss = document.getElementById('calTotalLoss');
            const bar = document.getElementById('calNetBar');
            const todayBtn = document.querySelector('#page-calendar .cal-today-btn');
            const reportBtn = document.getElementById('appHeaderReportBtn');
            const cells = grid?.querySelectorAll('.cal-cell:not(.cal-cell--pad)')?.length || 0;
            return {
                hasGrid: !!grid,
                hasTitle: /[A-Za-z]+ \d{4}/.test(title),
                hasJump: !!jump,
                hasCard: !!card,
                hasProfitLoss: !!(profit && loss),
                hasBar: !!bar,
                hasTodayBtn: !!todayBtn,
                hasReportBtn: !!(reportBtn && !reportBtn.classList.contains('d-none')),
                hasDays: cells >= 28
            };
        });
        if (calendarView.hasGrid && calendarView.hasTitle && calendarView.hasJump && calendarView.hasCard && calendarView.hasProfitLoss && calendarView.hasBar && calendarView.hasTodayBtn && calendarView.hasReportBtn && calendarView.hasDays) {
            report.pass('Calendar UI', 'profit/loss cards + net bar + today + report + day cells');
        } else {
            report.warn('Calendar UI', JSON.stringify(calendarView));
        }

        await page.click('#appHeaderReportBtn');
        await page.waitForTimeout(350);
        const reportSheet = await page.evaluate(() => {
            const sheet = document.getElementById('appSheet');
            const body = document.getElementById('appSheetBody');
            const open = sheet && !sheet.classList.contains('d-none') && sheet.getAttribute('aria-hidden') !== 'true';
            const html = body?.innerHTML || '';
            return {
                open: !!open || !!(body && body.querySelector('.cal-month-report')),
                hasReport: html.includes('cal-month-report'),
                hasMetrics: html.includes('cal-summary-metrics'),
                hasBrokers: html.includes('cal-summary-brokers')
            };
        });
        if (reportSheet.open && reportSheet.hasReport && reportSheet.hasMetrics && reportSheet.hasBrokers) {
            report.pass('Calendar report', 'monthly report sheet shown');
        } else {
            report.warn('Calendar report', `open=${reportSheet.open} report=${reportSheet.hasReport} metrics=${reportSheet.hasMetrics} brokers=${reportSheet.hasBrokers}`);
        }
        await page.evaluate(() => {
            if (window.MTFComponents?.Sheet?.close) window.MTFComponents.Sheet.close();
            else if (typeof window.closeSheet === 'function') window.closeSheet();
            document.querySelectorAll('.cupertino-pane-wrapper.app-sheet-pane').forEach((el) => {
                try { el.remove(); } catch (_) { /* ignore */ }
            });
        });
        await page.waitForFunction(() => !document.querySelector('.cupertino-pane-wrapper.app-sheet-pane .cal-month-report'), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(250);

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

        // --- Money (Broker Wallets) ---
        await page.locator('#page-more .list-group-item', { hasText: 'Money' }).click();
        await page.waitForTimeout(300);
        if (!(await pageVisible(page, 'page-money'))) {
            report.fail('Money', '#page-money not shown');
        } else if (!(await page.locator('#moneySummaryCard').count())) {
            report.fail('Money', 'summary card missing');
        } else {
            report.pass('Money', 'Broker Wallets page shown');
        }

        const moneyChrome = await page.evaluate(() => {
            const tools = document.getElementById('appHeaderMoneyTools');
            const searchWrap = document.getElementById('appHeaderMoneySearch');
            const search = document.getElementById('moneySearchInput');
            const filterBtn = document.getElementById('moneyPageFilterBtn');
            const filterHost = document.getElementById('moneyAccountFilterHost');
            const subtitle = document.getElementById('appHeaderMoneySubtitle');
            const monthInput = document.getElementById('moneyMonthPicker')
                || document.querySelector('#moneyMonthChart input[type="month"], #moneyMonthChartCard input[type="month"]');
            const wallets = document.getElementById('moneyAccountList');
            const summaryHero = document.getElementById('moneyTotalValueHero');
            return {
                toolsVisible: !!(tools && !tools.classList.contains('d-none')),
                searchVisible: !!(searchWrap && !searchWrap.classList.contains('d-none') && search),
                hasFilterBtn: !!filterBtn,
                hasFilterHost: !!filterHost,
                hasSubtitle: !!(subtitle && /cash per broker/i.test(subtitle.textContent || '')),
                hasMonthPicker: !!(monthInput && monthInput.type === 'month'),
                hasWalletList: !!wallets,
                hasSummaryHero: !!summaryHero,
                moneyFns: {
                    search: typeof window.setMoneySearchQuery === 'function',
                    month: typeof window.setMoneyMonthKey === 'function',
                    filter: typeof window.openMoneyPageFilterSheet === 'function',
                    render: typeof window.renderMoney === 'function'
                }
            };
        });
        if (moneyChrome.toolsVisible && moneyChrome.searchVisible && moneyChrome.hasFilterBtn && moneyChrome.hasSubtitle) {
            report.pass('Money header', 'search + All filter + filter btn + Cash per broker in header');
        } else {
            report.fail(
                'Money header',
                `tools=${moneyChrome.toolsVisible} search=${moneyChrome.searchVisible} filter=${moneyChrome.hasFilterBtn} subtitle=${moneyChrome.hasSubtitle}`
            );
        }
        if (moneyChrome.hasMonthPicker && moneyChrome.moneyFns.month) {
            report.pass('Money month', 'Monthly Flow month picker (type=month) wired');
        } else {
            report.fail('Money month', `picker=${moneyChrome.hasMonthPicker} setMoneyMonthKey=${moneyChrome.moneyFns.month}`);
        }
        if (moneyChrome.hasWalletList && moneyChrome.hasSummaryHero && moneyChrome.moneyFns.render) {
            report.pass('Money UI', 'summary hero + wallets list + renderMoney');
        } else {
            report.fail(
                'Money UI',
                `list=${moneyChrome.hasWalletList} hero=${moneyChrome.hasSummaryHero} render=${moneyChrome.moneyFns.render}`
            );
        }

        // Money search filters in place
        if (moneyChrome.moneyFns.search) {
            await page.fill('#moneySearchInput', 'zzz-no-match-smoke');
            await page.waitForTimeout(200);
            const searchMode = await page.evaluate(() => {
                const filterView = document.getElementById('moneyPageFilterView');
                const defaultView = document.getElementById('moneyPageDefaultView');
                const title = document.getElementById('moneyPageFilterViewTitle');
                return {
                    filterShown: !!(filterView && !filterView.classList.contains('d-none')),
                    defaultHidden: !!(defaultView && defaultView.classList.contains('d-none')),
                    titleText: (title && title.textContent) || ''
                };
            });
            if (searchMode.filterShown || /search/i.test(searchMode.titleText)) {
                report.pass('Money search', 'search query switches to results view');
            } else {
                report.warn('Money search', `filterShown=${searchMode.filterShown} title=${searchMode.titleText || '(empty)'}`);
            }
            await page.evaluate(() => {
                if (typeof window.clearMoneySearchQuery === 'function') window.clearMoneySearchQuery();
                else if (typeof window.setMoneySearchQuery === 'function') window.setMoneySearchQuery('');
            });
            await page.waitForTimeout(150);
        } else {
            report.fail('Money search', 'setMoneySearchQuery missing');
        }

        // Add-account surface (mount panel; UI normally needs cloud sync)
        const moneyAccountApi = await page.evaluate(() => typeof window.openAddMoneyAccountModal === 'function');
        if (!moneyAccountApi) {
            report.fail('Money add account', 'openAddMoneyAccountModal missing');
        } else {
            await page.evaluate(() => {
                const Sheet = window.MTFComponents && window.MTFComponents.Sheet;
                const editId = document.getElementById('moneyAccountEditId');
                if (editId) editId.value = '';
                if (Sheet && typeof Sheet.mountPanel === 'function') {
                    Sheet.mountPanel('Add wallet', 'panelMoneyAccount', '');
                }
            });
            await page.waitForTimeout(400);
            const accountSheet = await page.evaluate(() => {
                const Sheet = window.MTFComponents && window.MTFComponents.Sheet;
                const panel = document.getElementById('panelMoneyAccount');
                const broker = document.getElementById('moneyAccountBroker');
                const inSheet = !!(panel && panel.closest('.cupertino-pane-wrapper, #appSheet, [data-cupertino]'));
                const open = !!(Sheet && typeof Sheet.isOpen === 'function' && Sheet.isOpen());
                const ok = !!(broker && (open || inSheet || broker.offsetParent !== null));
                return {
                    ok,
                    note: ok
                        ? 'account panel mounts via Sheet'
                        : `open=${open} inSheet=${inSheet} broker=${!!broker}`
                };
            });
            if (accountSheet.ok) {
                report.pass('Money add account', accountSheet.note);
            } else {
                report.warn('Money add account', accountSheet.note);
            }
            await page.evaluate(() => {
                if (typeof window.closeSheet === 'function') window.closeSheet();
                else if (window.MTFComponents?.Sheet?.close) window.MTFComponents.Sheet.close();
            });
            await page.waitForTimeout(200);
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
            company: !!document.getElementById('calcCompany'),
            qty: !!document.getElementById('calcQty'),
            hasCompare: !!document.getElementById('calcComparePanel'),
            hasLeverage: !!document.getElementById('calcLeverageCards'),
            hasOverview: !!document.getElementById('calcOverviewGrid'),
            hasSummary: !!document.getElementById('calcSummaryStats')
        }));
        if (calcFields.company && calcFields.qty && calcFields.hasCompare && calcFields.hasLeverage && calcFields.hasOverview) {
            report.pass('MTF Calc UI', 'company + leverage + overview + compare present');
        } else {
            report.warn('MTF Calc UI', JSON.stringify(calcFields));
        }

        // --- MTF Calculator Preset Click (Assertion 1) ---
        await page.fill('#calcBuyPrice', '100');
        await page.fill('#calcQty', '10');
        await page.waitForTimeout(100);
        await page.click('[data-ref="page.mtf-calc.presets.chip"]:has-text("5%")');
        await page.waitForTimeout(100);
        const sellPriceVal = await page.inputValue('#calcSellPrice');
        if (parseFloat(sellPriceVal) === 105) {
            report.pass('MTF Calc Preset Click', 'Target sell price updated to 105.00 on 5% preset click');
        } else {
            report.fail('MTF Calc Preset Click', `Target sell price expected 105.00, got ${sellPriceVal}`);
        }

        // --- MTF Calculator Custom Preset (Assertion 2) ---
        await page.fill('#calcSellPctCustom', '7.5');
        await page.click('#calcAddPctBtnHost button');
        await page.waitForTimeout(100);
        const sellPriceCustomVal = await page.inputValue('#calcSellPrice');
        if (parseFloat(sellPriceCustomVal) === 107.5) {
            report.pass('MTF Calc Custom Preset', 'Custom preset 7.5% added and applied target sell price (107.50)');
        } else {
            report.fail('MTF Calc Custom Preset', `Target sell price expected 107.50, got ${sellPriceCustomVal}`);
        }

        // --- MTF Calculator Leverage Card Click (Assertion 3) ---
        await page.click('[data-ref="page.mtf-calc.leverage-card"]:has-text("4x")');
        await page.waitForTimeout(100);
        const selectedText = await page.textContent('#calcLeverageSelected');
        if (selectedText && selectedText.includes('4x Selected')) {
            report.pass('MTF Calc Leverage Card Click', 'Leverage cards updated selection to 4x');
        } else {
            report.fail('MTF Calc Leverage Card Click', `Selected text expected '4x Selected', got '${selectedText}'`);
        }

        // --- MTF Calculator Breakdown Modal (Assertion 4) ---
        await page.click('[data-ref="page.mtf-calc.broker-card"]:has-text("Zerodha")');
        await page.waitForTimeout(250);
        const breakdownTitle = await page.textContent('.sheet-header-title');
        if (breakdownTitle && breakdownTitle.includes('Zerodha Breakdown')) {
            report.pass('MTF Calc Breakdown Modal', 'Breakdown sheet opened for Zerodha');
        } else {
            report.fail('MTF Calc Breakdown Modal', `Expected title to contain 'Zerodha Breakdown', got '${breakdownTitle}'`);
        }

        // --- MTF Calculator Breakdown Refs (Assertion 5) ---
        const breakdownRefs = await page.evaluate(() => {
            const list = document.querySelectorAll('[data-ref^="sheet.calc-breakdown."]');
            return Array.from(list).map(el => el.getAttribute('data-ref'));
        });
        if (breakdownRefs.length > 5) {
            report.pass('MTF Calc Breakdown Refs', `Verified ${breakdownRefs.length} sheet.calc-breakdown data-ref keys`);
        } else {
            report.fail('MTF Calc Breakdown Refs', `Only found ${breakdownRefs.length} sheet.calc-breakdown keys`);
        }
        // Close breakdown sheet
        await page.evaluate(() => {
            if (typeof window.closeSheet === 'function') window.closeSheet();
        });
        await page.waitForTimeout(200);

        // --- Gold Page Nav & Visibility (Assertion 6) ---
        await page.evaluate(() => {
            if (window.page) window.page('/gold');
        });
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-gold'))) {
            report.fail('Gold Page Nav', '#page-gold not visible');
        } else {
            report.pass('Gold Page Nav', 'Gold Page shown via routing');
        }

        // --- Gold Page Header Title (Assertion 7) ---
        const goldHeaderTitle = await page.textContent('[data-ref="page.gold"] h4, [data-ref="page.gold"] .header-title, #page-gold h4');
        if (goldHeaderTitle && goldHeaderTitle.trim().length > 0) {
            report.pass('Gold Page Title', `Gold Page header title is visible: "${goldHeaderTitle.trim()}"`);
        } else {
            report.fail('Gold Page Title', 'Gold Page header title is missing or empty');
        }

        // --- Money Page Month Flow Hero Chart Ref (Assertion 8) ---
        await page.evaluate(() => {
            if (window.page) window.page('/money');
        });
        await page.waitForTimeout(250);
        const monthFlowRef = await page.locator('[data-ref="page.money.month-flow"]').count();
        if (monthFlowRef > 0) {
            report.pass('Money Month Flow Ref', 'Money page month flow hero chart contains data-ref="page.money.month-flow"');
        } else {
            report.fail('Money Month Flow Ref', 'Money month flow hero chart data-ref is missing');
        }

        // --- Money Page Wallet Card Refs (Assertion 9) ---
        const walletCardRefs = await page.evaluate(() => {
            const list = document.querySelectorAll('[data-ref^="page.money.wallet-card"]');
            return Array.from(list).map(el => el.getAttribute('data-ref'));
        });
        if (walletCardRefs.length > 0) {
            report.pass('Money Wallet Card Refs', `Verified presence of ${walletCardRefs.length} money wallet card references`);
        } else {
            report.fail('Money Wallet Card Refs', 'Broker wallet card references are missing on money page');
        }

        // --- Money Filter Click (Assertion 10) ---
        const hasFilterItem = await page.locator('[data-ref="page.money.filters.all"], [data-ref^="page.money.filters."]').count();
        if (hasFilterItem > 0) {
            report.pass('Money Filter Ref', 'Verified presence of Money Page active/filters data-ref list items');
        } else {
            report.fail('Money Filter Ref', 'Money Page filter references are missing');
        }

        // --- Calendar Month Navigation (Assertion 11) ---
        await page.evaluate(() => {
            if (window.page) window.page('/calendar');
        });
        await page.waitForTimeout(250);
        const initialCalendarHeader = await page.textContent('[data-ref="page.calendar.header.title"], #page-calendar .calendar-header-title, #page-calendar h4');
        await page.click('[data-ref="page.calendar.header.next-btn"], #page-calendar .btn-next, #page-calendar button:has(.fa-chevron-right)');
        await page.waitForTimeout(200);
        const nextCalendarHeader = await page.textContent('[data-ref="page.calendar.header.title"], #page-calendar .calendar-header-title, #page-calendar h4');
        if (initialCalendarHeader !== nextCalendarHeader) {
            report.pass('Calendar Month Nav', `Navigated calendar month successfully from "${initialCalendarHeader?.trim()}" to "${nextCalendarHeader?.trim()}"`);
        } else {
            report.fail('Calendar Month Nav', 'Calendar month header did not update after navigating');
        }

        // --- Watchlist Header Search Toggle (Assertion 12) ---
        await page.evaluate(() => {
            if (window.page) window.page('/market');
        });
        await page.waitForTimeout(250);
        await page.click('[data-ref="page.market.header.search-btn"], #page-market button:has(.fa-search)');
        await page.waitForTimeout(100);
        const searchInputVisible = await page.locator('[data-ref="page.market.header.search-input"], #marketSearchInput').isVisible();
        if (searchInputVisible) {
            report.pass('Watchlist Search Toggle', 'Watchlist header search input toggled visible on click');
        } else {
            report.fail('Watchlist Search Toggle', 'Watchlist header search input did not toggle visible');
        }

        // --- Watchlist element refs (Assertion 13) ---
        const watchlistCardRefs = await page.locator('[data-ref="page.market.list.item"]').count();
        if (watchlistCardRefs > 0) {
            report.pass('Watchlist Element Refs', `Verified presence of ${watchlistCardRefs} watchlist market items`);
        } else {
            report.fail('Watchlist Element Refs', 'Watchlist items data-ref is missing');
        }

        // --- Settings Page Container Ref (Assertion 14) ---
        await page.evaluate(() => {
            if (window.page) window.page('/settings');
        });
        await page.waitForTimeout(250);
        if (!(await pageVisible(page, 'page-settings'))) {
            report.fail('Settings', '#page-settings not shown');
        } else {
            report.pass('Settings', 'Settings page shown');
        }
        const settingsContainerRef = await page.locator('[data-ref="page.settings.container"]').count();
        if (settingsContainerRef > 0) {
            report.pass('Settings Page Ref', 'Settings page container contains data-ref="page.settings.container"');
        } else {
            report.fail('Settings Page Ref', 'Settings container data-ref is missing');
        }

        // --- Settings Page Title (Assertion 15) ---
        const settingsTitle = await page.textContent('[data-ref="page.settings.container"] h4, #page-settings h4');
        if (settingsTitle && settingsTitle.trim().length > 0) {
            report.pass('Settings Title', `Settings header title is visible: "${settingsTitle.trim()}"`);
        } else {
            report.fail('Settings Title', 'Settings header title is missing');
        }

        // --- Global data-ref Rule Audit (Assertion 16 - Bonus!) ---
        const refAuditResult = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-ref]');
            const invalid = [];
            const validPattern = /^(page\.[a-z0-9-]+(\.[a-z0-9-]+)*|component\.[a-z0-9-]+(\.[a-z0-9-]+)*|sheet\.[a-z0-9-]+(\.[a-z0-9-]+)*)$/;
            elements.forEach(el => {
                const ref = el.getAttribute('data-ref');
                if (!validPattern.test(ref)) {
                    invalid.push(ref);
                }
            });
            return { total: elements.length, invalid };
        });
        if (refAuditResult.invalid.length === 0 && refAuditResult.total > 20) {
            report.pass('Global Reference Rules', `Exhaustively audited ${refAuditResult.total} DOM elements; 100% compliant with hierarchical dot-separated data-ref naming rules`);
        } else {
            report.fail('Global Reference Rules', `Audited ${refAuditResult.total} elements; invalid formats: ${refAuditResult.invalid.slice(0, 5).join(', ')}`);
        }

        // Return to more page before restoring default behavior
        await page.evaluate(() => {
            if (window.page) window.page('/more');
        });
        await page.waitForTimeout(200);

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
