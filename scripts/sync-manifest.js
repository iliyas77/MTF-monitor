#!/usr/bin/env node
/**
 * Repair components/manifest.json + main.html script tags so they match
 * JS files on disk (components/, pages/, db/, main.js).
 *
 * Run: npm run repair   (or: node scripts/sync-manifest.js)
 * Also runs automatically at the start of build-production.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'components', 'manifest.json');
const HTML_PATH = path.join(ROOT, 'main.html');

// Match optional leading indent so rewrites stay stable across runs.
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
        ...walkJsFiles(path.join(ROOT, 'components')),
        ...walkJsFiles(path.join(ROOT, 'pages')),
        ...walkJsFiles(path.join(ROOT, 'db'))
    ].map(rel);

    const mainRel = 'main.js';
    if (fs.existsSync(path.join(ROOT, mainRel))) {
        found.push(mainRel);
    }
    return new Set(found);
}

function groupKey(script) {
    if (script === 'main.js') return 'main';
    if (script.startsWith('components/')) return 'components';
    if (script.startsWith('pages/')) return 'pages';
    if (script.startsWith('db/')) return 'db';
    return 'other';
}

function repairScripts(existing, onDisk) {
    const kept = existing.filter((s) => onDisk.has(s) && s !== 'main.js');
    const keptSet = new Set(kept);
    const orphans = [...onDisk].filter((s) => s !== 'main.js' && !keptSet.has(s));

    const byGroup = { components: [], pages: [], db: [], other: [] };
    for (const s of orphans) {
        byGroup[groupKey(s)].push(s);
    }
    for (const key of Object.keys(byGroup)) {
        byGroup[key].sort();
    }

    const next = [
        ...kept,
        ...byGroup.components,
        ...byGroup.pages,
        ...byGroup.db,
        ...byGroup.other
    ];

    if (onDisk.has('main.js')) {
        next.push('main.js');
    }

    const removed = existing.filter((s) => !onDisk.has(s));
    const added = orphans;

    return { scripts: next, removed, added };
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
    if (!fs.existsSync(MANIFEST)) {
        console.error('Missing components/manifest.json');
        process.exit(1);
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
            if (removed.length) {
                console.log(`  Removed: ${removed.join(', ')}`);
            }
            if (added.length) {
                console.log(`  Added: ${added.join(', ')}`);
            }
            if (manifestChanged) console.log('  Updated components/manifest.json');
            if (htmlChanged) console.log('  Updated main.html script tags');
        }
    }

    return { scripts, removed, added, manifestChanged, htmlChanged };
}

if (require.main === module) {
    syncManifest();
}

module.exports = { syncManifest };
