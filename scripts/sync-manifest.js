#!/usr/bin/env node
/**
 * Repair scripts/manifest.json + main.html script tags so they match
 * JS files on disk (lib/, pages/, db/, main.js).
 *
 * Run: npm run repair   (or: node scripts/sync-manifest.js)
 * Also runs automatically at the start of build-production.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'scripts', 'manifest.json');
const HTML_PATH = path.join(ROOT, 'main.html');

const SCRIPT_BLOCK_RE =
    /[ \t]*<!-- COMPONENT SCRIPTS -->[\s\S]*?<script src="main\.js"><\/script>/;

function walkJsFiles(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walkJsFiles(full, out);
        else if (name.endsWith('.js')) out.push(full);
    }
    return out;
}

function rel(file) {
    return path.relative(ROOT, file).split(path.sep).join('/');
}

function discoverScripts() {
    const found = [
        ...walkJsFiles(path.join(ROOT, 'lib')),
        ...walkJsFiles(path.join(ROOT, 'pages')),
        ...walkJsFiles(path.join(ROOT, 'db'))
    ].map(rel);

    if (fs.existsSync(path.join(ROOT, 'main.js'))) {
        found.push('main.js');
    }
    return new Set(found);
}

function groupKey(script) {
    if (script === 'main.js') return 'main';
    if (script.startsWith('lib/')) return 'lib';
    if (script.startsWith('pages/')) return 'pages';
    if (script.startsWith('db/')) return 'db';
    return 'other';
}

function preferredLibOrder(scripts) {
    const preferred = [
        'lib/_registry.js',
        'lib/format.js',
        'lib/bootstrap.js'
    ];
    const set = new Set(scripts);
    const ordered = preferred.filter((s) => set.has(s));
    const rest = [...set].filter((s) => !preferred.includes(s)).sort();
    return [...ordered, ...rest];
}

function preferredPagesOrder(scripts) {
    // Shared shell + trade UI first (dependency order), then one *-page.js per route.
    const preferred = [
        'pages/common/bottom-bar.js',
        'pages/common/sheet.js',
        'pages/common/dialog.js',
        'pages/common/trade-list-meta.js',
        'pages/common/trade-list-detail-values.js',
        'pages/common/trade-list-details.js',
        'pages/common/trade-list-actions.js',
        'pages/common/trade-list-item.js',
        'pages/common/trade-list.js',
        'pages/common/trade-summary-row.js',
        'pages/common/trade-detail-row.js',
        'pages/common/trade-view-details.js',
        'pages/common/trade-sheet-meta.js',
        'pages/common/charges-table.js',
        'pages/common/trade-view-sheet.js',
        'pages/common/trade-charges-sheet.js',
        'pages/common/trade-interest-sheet.js',
        'pages/common/trade-target-sell-sheet.js',
        'pages/common/trade-buy-price-sheet.js',
        'pages/common/trade-leverage-sheet.js',
        'pages/common/trade-hold-sheet.js',
        'pages/common/trade-modal.js',
        'pages/common/app-header.js',
        'pages/common/app-version.js',
        'pages/trades/trades-page.js',
        'pages/market/market-page.js',
        'pages/money/money-page.js',
        'pages/more/more-page.js',
        'pages/mtf-calculator/mtf-calculator-page.js',
        'pages/past/past-page.js',
        'pages/plan/plan-page.js',
        'pages/search/search-page.js',
        'pages/settings/settings-page.js',
        'pages/transactions/transactions-page.js'
    ];
    const set = new Set(scripts);
    const ordered = preferred.filter((s) => set.has(s));
    const rest = [...set].filter((s) => !preferred.includes(s)).sort();
    // Put preferred first, then remaining pages (money, more, etc.)
    const restWithoutDup = rest.filter((s) => !ordered.includes(s));
    return [...ordered, ...restWithoutDup];
}

function repairScripts(existing, onDisk) {
    const kept = existing.filter((s) => onDisk.has(s) && s !== 'main.js');
    const keptSet = new Set(kept);
    const orphans = [...onDisk].filter((s) => s !== 'main.js' && !keptSet.has(s));

    const byGroup = { lib: [], pages: [], db: [], other: [] };
    for (const s of orphans) {
        byGroup[groupKey(s)].push(s);
    }

    // If starting fresh or many orphans, rebuild preferred order for lib/pages
    const allLib = [...kept, ...orphans].filter((s) => s.startsWith('lib/'));
    const allPages = [...kept, ...orphans].filter((s) => s.startsWith('pages/'));
    const allDb = [...kept, ...orphans].filter((s) => s.startsWith('db/'));
    const other = [...kept, ...orphans].filter((s) => groupKey(s) === 'other');

    const next = [
        ...preferredLibOrder(allLib),
        ...preferredPagesOrder(allPages),
        ...allDb.sort(),
        ...other.sort()
    ];

    // Dedupe while preserving order
    const seen = new Set();
    const deduped = [];
    for (const s of next) {
        if (seen.has(s)) continue;
        seen.add(s);
        deduped.push(s);
    }

    if (onDisk.has('main.js')) {
        deduped.push('main.js');
    }

    const removed = existing.filter((s) => !onDisk.has(s));
    const added = orphans;

    return { scripts: deduped, removed, added };
}

function buildHtmlScriptBlock(scripts) {
    const lines = ['    <!-- COMPONENT SCRIPTS -->'];
    let dbCommentWritten = false;

    for (const script of scripts) {
        if (!dbCommentWritten && script.startsWith('db/')) {
            lines.push('    <!-- DB / SERVICE LAYER -->');
            dbCommentWritten = true;
        }
        lines.push(`    <script src="${script}"></script>`);
    }

    return lines.join('\n');
}

function syncManifest({ quiet } = {}) {
    if (!fs.existsSync(path.dirname(MANIFEST))) {
        fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    }
    if (!fs.existsSync(MANIFEST)) {
        fs.writeFileSync(MANIFEST, `${JSON.stringify({ scripts: [] }, null, 2)}\n`, 'utf8');
    }
    if (!fs.existsSync(HTML_PATH)) {
        console.error('Missing main.html');
        process.exit(1);
    }

    let existing;
    try {
        const data = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
        existing = Array.isArray(data.scripts) ? data.scripts : [];
    } catch (err) {
        console.error(`manifest.json parse error: ${err.message}`);
        process.exit(1);
    }

    const onDisk = discoverScripts();
    const { scripts, removed, added } = repairScripts(existing, onDisk);

    const manifestChanged = JSON.stringify(existing) !== JSON.stringify(scripts);
    if (manifestChanged) {
        fs.writeFileSync(MANIFEST, `${JSON.stringify({ scripts }, null, 2)}\n`, 'utf8');
    }

    const html = fs.readFileSync(HTML_PATH, 'utf8');
    if (!SCRIPT_BLOCK_RE.test(html)) {
        console.error('main.html is missing <!-- COMPONENT SCRIPTS --> … main.js block');
        process.exit(1);
    }

    const nextBlock = buildHtmlScriptBlock(scripts);
    const nextHtml = html.replace(SCRIPT_BLOCK_RE, nextBlock);
    const htmlChanged = nextHtml !== html;
    if (htmlChanged) {
        fs.writeFileSync(HTML_PATH, nextHtml, 'utf8');
    }

    if (!quiet) {
        if (!manifestChanged && !htmlChanged) {
            console.log(`✓ Manifest in sync (${scripts.length} scripts)`);
        } else {
            console.log(`✓ Manifest repaired (${scripts.length} scripts)`);
            if (removed.length) console.log(`  Removed: ${removed.slice(0, 8).join(', ')}${removed.length > 8 ? '…' : ''}`);
            if (added.length) console.log(`  Added: ${added.slice(0, 8).join(', ')}${added.length > 8 ? '…' : ''}`);
            if (manifestChanged) console.log('  Updated scripts/manifest.json');
            if (htmlChanged) console.log('  Updated main.html script tags');
        }
    }

    return { scripts, removed, added, manifestChanged, htmlChanged };
}

if (require.main === module) {
    syncManifest();
}

module.exports = { syncManifest };
