/**
 * App health verify — integrity + build + browser smoke + report.
 * Run: npm run verify
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createReport } = require('./verify-report');
const { runIntegrity } = require('./verify-integrity');
const { runSmoke } = require('./verify-smoke');

const ROOT = path.join(__dirname, '..');

function runBuild(report) {
    const result = spawnSync('npm', ['run', 'build'], {
        cwd: ROOT,
        encoding: 'utf8',
        shell: process.platform === 'win32'
    });
    if (result.status !== 0) {
        const err = (result.stderr || result.stdout || 'build failed').trim().split('\n').slice(-3).join(' ');
        report.fail('Build', err || `exit ${result.status}`);
        return false;
    }
    const out = path.join(ROOT, 'production.html');
    if (!fs.existsSync(out)) {
        report.fail('Build', 'production.html was not written');
        return false;
    }
    const sizeKb = (fs.statSync(out).size / 1024).toFixed(1);
    if (fs.statSync(out).size < 1000) {
        report.fail('Build', `production.html too small (${sizeKb} KB)`);
        return false;
    }
    report.pass('Build', `production.html built (${sizeKb} KB)`);
    return true;
}

async function main() {
    const report = createReport();
    console.log('Running app health checks…\n');

    runIntegrity(report);

    const integrityFailed = report.checks.some((c) => !c.ok);
    if (integrityFailed) {
        console.log('Skipping build & smoke because integrity failed.\n');
        process.exit(report.print());
    }

    const built = runBuild(report);
    if (!built) {
        console.log('Skipping smoke because build failed.\n');
        process.exit(report.print());
    }

    await runSmoke(report);
    process.exit(report.print());
}

main().catch((err) => {
    console.error('Verify crashed:', err);
    process.exit(1);
});
