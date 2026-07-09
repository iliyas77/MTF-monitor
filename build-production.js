#!/usr/bin/env node
/**
 * Bundles and minifies main.html + main.css + component/page scripts + main.js into production.html.
 * Run: npm run build   (or: node build-production.js)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const ROOT = __dirname;
const OUT_FILE = path.join(ROOT, 'production.html');
const MANIFEST = path.join(ROOT, 'components', 'manifest.json');

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
    console.log('  Copy production.html to your phone for mobile deployment.');
}

build();
