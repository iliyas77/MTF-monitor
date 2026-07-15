#!/usr/bin/env node
/**
 * Commit all changes and push to the current branch.
 *
 * npm run save-local
 * npm run save-local -- quote-fix
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const SECRET_PATTERNS = [
    /\.env$/i,
    /credentials\.json$/i,
    /\.pem$/i,
    /id_rsa$/i,
    /\.p12$/i
];

function runGit(args, opts = {}) {
    return execFileSync('git', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: opts.stdio || 'pipe',
        ...opts
    }).trim();
}

function fail(msg) {
    console.error(`✗ ${msg}`);
    process.exit(1);
}

function runNpm(args, opts = {}) {
    return execFileSync('npm', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: opts.stdio || 'pipe',
        ...opts
    });
}

function readAppVersion() {
    try {
        const raw = fs.readFileSync(path.join(ROOT, 'app-version.json'), 'utf8');
        const data = JSON.parse(raw);
        return String(data.version || '').trim();
    } catch (_) {
        return '';
    }
}

function bumpBuildBeforeSave() {
    console.log('Bumping version + building production.html…');
    try {
        const output = runNpm(['run', 'build'], { stdio: ['ignore', 'pipe', 'pipe'] });
        process.stdout.write(output);
    } catch (e) {
        const msg = (e && (e.stderr || e.stdout || e.message)) || String(e);
        fail(`npm run build failed (version bump required before push):\n${msg}`);
    }
    const version = readAppVersion();
    if (version) console.log(`✓ Version ready: ${version}`);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function slugify(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}

function formatBuiltAt(date = new Date()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} · ${hours}:${pad2(date.getMinutes())} ${ampm}`;
}

function parseUserName(argv) {
    const args = argv.slice(2).filter((a) => a !== '--');
    return args.join(' ').trim();
}

function buildCommitMessage(userName, now = new Date()) {
    const slug = slugify(userName);
    if (slug) return `chore: ${slug.replace(/-/g, ' ')}`;
    return `chore: save local work ${formatBuiltAt(now)}`;
}

function assertSafeToCommit() {
    let porcelain;
    try {
        porcelain = runGit(['status', '--porcelain']);
    } catch (e) {
        fail(`git status failed: ${e.message}`);
    }
    if (!porcelain) return [];

    const paths = porcelain
        .split('\n')
        .map((line) => line.slice(3).trim())
        .filter(Boolean);

    for (const p of paths) {
        for (const re of SECRET_PATTERNS) {
            if (re.test(p)) {
                fail(`Refusing to commit sensitive file: ${p}`);
            }
        }
    }
    return paths;
}

function main() {
    try {
        runGit(['rev-parse', '--git-dir']);
    } catch (_) {
        fail('Not a git repository');
    }

    let currentBranch;
    try {
        currentBranch = runGit(['branch', '--show-current']);
    } catch (_) {
        fail('Could not determine current branch');
    }
    if (!currentBranch) fail('Detached HEAD — checkout a branch first');

    const userName = parseUserName(process.argv);
    const now = new Date();
    const commitMessage = buildCommitMessage(userName, now);

    console.log(`Current branch: ${currentBranch}`);

    // Bump version + production build first so push always includes a fresh stamp.
    bumpBuildBeforeSave();

    const version = readAppVersion();
    const commitWithVersion = version
        ? `${commitMessage} (v${version})`
        : commitMessage;

    const changedPaths = assertSafeToCommit();
    let committed = false;

    if (changedPaths.length > 0) {
        const fileListStr = changedPaths.join('\n- ');
        const finalCommitMessage = `${commitWithVersion}\n\nModified files:\n- ${fileListStr}`;
        
        try {
            runGit(['add', '-A']);
            runGit(['commit', '-m', finalCommitMessage]);
            committed = true;
            console.log(`✓ Committed: ${commitWithVersion} (${changedPaths.length} files)`);
        } catch (e) {
            fail(`git commit failed: ${e.message}`);
        }
    } else {
        console.log('✓ No file changes to commit');
    }

    try {
        runGit(['push', 'origin', 'HEAD']);
        console.log('✓ Pushed to origin');
    } catch (e) {
        fail(`git push failed: ${e.message}`);
    }

    console.log('');
    console.log('Done.');
    console.log(`  Branch: ${currentBranch}`);
    if (committed) console.log(`  Commit: ${commitWithVersion}`);
}

main();
