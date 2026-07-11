/**
 * Static integrity checks: manifest files, orphans, register calls, JS syntax.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'shared', 'scripts', 'manifest.json');

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

function runIntegrity(report) {
    const required = ['main.html', 'main.js', 'shared/scripts/manifest.json'];
    const missingRequired = required.filter((f) => !fs.existsSync(path.join(ROOT, f)));
    if (missingRequired.length) {
        report.fail('Sources', `missing: ${missingRequired.join(', ')}`);
        return;
    }
    const mainHtml = fs.readFileSync(path.join(ROOT, 'main.html'), 'utf8');
    if (!/bootstrap@[\d.]+\/dist\/css\/bootstrap\.min\.css/.test(mainHtml)) {
        report.fail('Sources', 'main.html missing Bootstrap CSS CDN link');
        return;
    }
    if (!/bootstrap@[\d.]+\/dist\/js\/bootstrap\.bundle\.min\.js/.test(mainHtml)) {
        report.fail('Sources', 'main.html missing Bootstrap JS CDN link');
        return;
    }
    if (!fs.existsSync(path.join(ROOT, 'shared/css/_variables.css'))) {
        report.fail('Sources', 'shared/css/_variables.css missing');
        return;
    }
    if (!/shared\/css\/_variables\.css/.test(mainHtml)) {
        report.fail('Sources', 'main.html missing shared/css/_variables.css link');
        return;
    }
    report.pass('Sources', 'main.html, main.js, manifest, Bootstrap CDN, brand theme present');

    let scripts;
    try {
        scripts = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).scripts;
        if (!Array.isArray(scripts) || !scripts.length) {
            report.fail('Integrity', 'manifest.json has no scripts[]');
            return;
        }
    } catch (err) {
        report.fail('Integrity', `manifest.json parse error: ${err.message}`);
        return;
    }

    const missing = scripts.filter((s) => !fs.existsSync(path.join(ROOT, s)));
    if (missing.length) {
        report.fail('Integrity', `${missing.length} missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
    } else {
        report.pass('Integrity', `${scripts.length}/${scripts.length} manifest scripts present`);
    }

    const manifestSet = new Set(scripts.map((s) => s.split('/').join('/')));
    const discovered = [
        ...walkJsFiles(path.join(ROOT, 'shared', 'lib')),
        ...walkJsFiles(path.join(ROOT, 'features')),
        ...walkJsFiles(path.join(ROOT, 'shared', 'db'))
    ];
    const orphans = discovered
        .map(rel)
        .filter((r) => !manifestSet.has(r) && r !== 'main.js');

    if (orphans.length) {
        report.fail(
            'Orphans',
            `${orphans.length} JS file(s) not in manifest: ${orphans.slice(0, 4).join(', ')}${orphans.length > 4 ? '…' : ''}`
        );
    } else {
        report.pass('Orphans', 'no shared lib/db or feature JS files missing from manifest');
    }

    const registerIssues = [];
    for (const script of scripts) {
        if (script === 'main.js') continue;
        if (script.endsWith('/_registry.js')) {
            continue;
        }
        const file = path.join(ROOT, script);
        if (!fs.existsSync(file)) continue;
        const src = fs.readFileSync(file, 'utf8');
        if (script.startsWith('shared/db/')) {
            if (!src.includes('MTFDbRegister')) {
                registerIssues.push(`${script} (missing MTFDbRegister)`);
            }
        } else if (script.startsWith('shared/lib/') || script.startsWith('features/')) {
            if (!src.includes('MTFRegister')) {
                registerIssues.push(`${script} (missing MTFRegister)`);
            }
        }
    }
    if (registerIssues.length) {
        report.fail('Modules', registerIssues.slice(0, 3).join('; ') + (registerIssues.length > 3 ? '…' : ''));
    } else {
        report.pass('Modules', 'all shared lib/feature/db modules register exports');
    }

    const syntaxFails = [];
    for (const script of scripts) {
        const file = path.join(ROOT, script);
        if (!fs.existsSync(file)) continue;
        try {
            execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
        } catch (err) {
            const msg = (err.stderr && err.stderr.toString()) || err.message;
            syntaxFails.push(`${script}: ${msg.split('\n')[0]}`);
        }
    }
    if (syntaxFails.length) {
        report.fail('Syntax', syntaxFails.slice(0, 2).join('; ') + (syntaxFails.length > 2 ? '…' : ''));
    } else {
        report.pass('Syntax', `${scripts.length} JS files parse cleanly`);
    }
}

module.exports = { runIntegrity };
