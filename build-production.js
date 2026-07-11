#!/usr/bin/env node
/**
 * Bundles and minifies main.html + brand theme CSS + component/page scripts + main.js
 * into production.html. Bootstrap CSS/JS stay as external CDN links.
 *
 * Run:  npm run build          (bumps patch version + stamps builtAt)
 *       node build-production.js --no-bump   (rebuild without bumping)
 *
 * Always repairs shared/scripts/manifest.json + main.html script tags first
 * (same as `npm run repair`).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');
const { syncManifest } = require('./shared/scripts/sync-manifest');

const ROOT = __dirname;
const OUT_FILE = path.join(ROOT, 'production.html');
const MANIFEST = path.join(ROOT, 'shared', 'scripts', 'manifest.json');
const VERSION_JSON = path.join(ROOT, 'app-version.json');
const VERSION_JS = path.join(ROOT, 'features', 'more', 'app-version.js');

const htmlPath = path.join(ROOT, 'main.html');
const themeCssPath = path.join(ROOT, 'shared', 'css', '_variables.css');
const BOOTSTRAP_CSS_RE = /bootstrap@[\d.]+\/dist\/css\/bootstrap\.min\.css/;
const THEME_LINK_RE = /<link rel="stylesheet" href="shared\/css\/_variables\.css"\s*\/?>/;

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
 * Bumped automatically by \`npm run build\` / \`npm run save\`.
 */
(function (global) {
    'use strict';

    const APP_VERSION = ${JSON.stringify(state.version)};
    const APP_BUILT_AT = ${JSON.stringify(state.builtAt)};

    function paintMoreHubBuildMeta() {
        const el = document.getElementById('more-hub-build-meta');
        if (!el) return;
        el.innerHTML = \`<span class="text-muted small">Version \${APP_VERSION}</span>\` +
            \`<span class="text-muted small">\${APP_BUILT_AT}</span>\`;
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

function shouldBumpVersion(argv) {
    // Default: bump. Opt out with --no-bump (used by agent rebuild hooks).
    if (argv.includes('--no-bump')) return false;
    if (argv.includes('--bump')) return true;
    return true;
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
    syncManifest({ quiet: false });

    for (const file of [htmlPath, themeCssPath, MANIFEST]) {
        if (!fs.existsSync(file)) {
            console.error(`Missing source file: ${path.relative(ROOT, file)}`);
            process.exit(1);
        }
    }

    const bump = shouldBumpVersion(process.argv);
    const versionInfo = prepareVersion({ bump });

    let html = fs.readFileSync(htmlPath, 'utf8');
    if (!BOOTSTRAP_CSS_RE.test(html)) {
        console.error('main.html is missing Bootstrap CSS CDN link');
        process.exit(1);
    }
    if (!THEME_LINK_RE.test(html)) {
        console.error('main.html is missing <link rel="stylesheet" href="shared/css/_variables.css" />');
        process.exit(1);
    }

    const themeCss = fs.readFileSync(themeCssPath, 'utf8');
    const js = bundleJs();

    html = html.replace(THEME_LINK_RE, `<style>${themeCss}</style>`);

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
    console.log(`  Sources: main.html, shared/css/_variables.css, ${scriptCount} JS files (shared/scripts/manifest.json), Bootstrap CDN`);
    if (versionInfo.bumped) {
        console.log(`  Version: ${versionInfo.previous.version} → ${versionInfo.next.version} (${versionInfo.next.builtAt})`);
    } else {
        console.log(`  Version: ${versionInfo.next.version} (${versionInfo.next.builtAt}) [no bump]`);
    }
    console.log('  Copy production.html to your phone for mobile deployment.');
}

build();
