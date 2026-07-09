#!/usr/bin/env node
/**
 * Bundles and minifies main.html + main.css + component/page scripts + main.js into production.html.
 * Run: npm run build   (or: node build-production.js)
 * Ship (bump version + stamp date/time): npm run ship
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const ROOT = __dirname;
const OUT_FILE = path.join(ROOT, 'production.html');
const MANIFEST = path.join(ROOT, 'components', 'manifest.json');
const VERSION_JSON = path.join(ROOT, 'app-version.json');
const VERSION_JS = path.join(ROOT, 'pages', 'more', 'app-version.js');

const htmlPath = path.join(ROOT, 'main.html');
const cssPath = path.join(ROOT, 'main.css');

const MINIFY_OPTIONS = {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: {
        compress: {
            dead_code: true,
            drop_debugger: true,
            passes: 2
        },
        mangle: true,
        format: {
            comments: false
        }
    }
};

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatBuiltAt(date = new Date()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${hours}:${pad2(date.getMinutes())} ${ampm}`;
}

function bumpPatch(version) {
    const parts = String(version || '1.0.0').split('.').map((p) => parseInt(p, 10));
    while (parts.length < 3) parts.push(0);
    if (parts.some((n) => Number.isNaN(n))) {
        return '1.0.1';
    }
    parts[2] += 1;
    return parts.join('.');
}

function readVersionState() {
    if (!fs.existsSync(VERSION_JSON)) {
        return { version: '1.0.0', builtAt: formatBuiltAt() };
    }
    try {
        const data = JSON.parse(fs.readFileSync(VERSION_JSON, 'utf8'));
        return {
            version: data.version || '1.0.0',
            builtAt: data.builtAt || formatBuiltAt()
        };
    } catch (_) {
        return { version: '1.0.0', builtAt: formatBuiltAt() };
    }
}

function writeVersionFiles(state) {
    fs.writeFileSync(VERSION_JSON, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    const js = `/**
 * App version + build stamp shown on the More page.
 * Updated by \`npm run ship\` (or \`node build-production.js --bump\`).
 */
(function (global) {
    'use strict';

    const APP_VERSION = ${JSON.stringify(state.version)};
    const APP_BUILT_AT = ${JSON.stringify(state.builtAt)};

    function paintMoreHubBuildMeta() {
        const el = document.getElementById('more-hub-build-meta');
        if (!el) return;
        el.innerHTML = \`<span class="more-hub-build-meta__version">Version \${APP_VERSION}</span>\` +
            \`<span class="more-hub-build-meta__built">\${APP_BUILT_AT}</span>\`;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', paintMoreHubBuildMeta);
    } else {
        paintMoreHubBuildMeta();
    }

    global.MTFRegister({
        APP_VERSION,
        APP_BUILT_AT,
        paintMoreHubBuildMeta
    });
})(typeof window !== 'undefined' ? window : globalThis);
`;
    fs.writeFileSync(VERSION_JS, js, 'utf8');
}

function prepareVersion({ bump }) {
    const current = readVersionState();
    const next = {
        version: bump ? bumpPatch(current.version) : current.version,
        builtAt: bump ? formatBuiltAt() : current.builtAt
    };
    writeVersionFiles(next);
    return { previous: current, next, bumped: bump };
}

function bundleJs() {
    const { scripts } = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    return scripts.map((rel) => {
        const file = path.join(ROOT, rel);
        if (!fs.existsSync(file)) {
            console.error(`Missing script: ${rel}`);
            process.exit(1);
        }
        return fs.readFileSync(file, 'utf8');
    }).join('\n');
}

async function build() {
    for (const file of [htmlPath, cssPath, MANIFEST]) {
        if (!fs.existsSync(file)) {
            console.error(`Missing source file: ${path.basename(file)}`);
            process.exit(1);
        }
    }

    const bump = process.argv.includes('--bump');
    const versionInfo = prepareVersion({ bump });

    let html = fs.readFileSync(htmlPath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');
    const js = bundleJs();

    html = html.replace(
        /<link rel="stylesheet" href="main\.css"\s*\/?>/,
        `<style>${css}</style>`
    );

    html = html.replace(
        /<!-- COMPONENT SCRIPTS -->[\s\S]*?<script src="main\.js"><\/script>/,
        `<script>${js}</script>`
    );

    let minified;
    try {
        minified = await minify(html, MINIFY_OPTIONS);
    } catch (err) {
        console.error('Minification failed:', err.message);
        process.exit(1);
    }

    fs.writeFileSync(OUT_FILE, minified, 'utf8');

    const sizeBytes = fs.statSync(OUT_FILE).size;
    const sizeKb = (sizeBytes / 1024).toFixed(1);
    const unminKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
    const saved = Math.round((1 - sizeBytes / Buffer.byteLength(html, 'utf8')) * 100);
    const scriptCount = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).scripts.length;

    console.log(`✓ production.html (${sizeKb} KB, minified from ${unminKb} KB, −${saved}%)`);
    console.log(`  Sources: main.html, main.css, ${scriptCount} JS files (components/manifest.json)`);
    if (versionInfo.bumped) {
        console.log(`  Version: ${versionInfo.previous.version} → ${versionInfo.next.version} (${versionInfo.next.builtAt})`);
    } else {
        console.log(`  Version: ${versionInfo.next.version} (${versionInfo.next.builtAt})`);
    }
    console.log('  Copy production.html to your phone for mobile deployment.');
}

build();
