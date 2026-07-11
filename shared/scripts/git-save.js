#!/usr/bin/env node
/**
 * Create a dated save branch, commit, push, and open a PR against Dev.
 *
 * npm run save
 * npm run save -- quote-fix
 */
'use strict';

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
/** PRs from `npm run save` always target this branch. */
const PR_BASE_BRANCH = 'Dev';
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

function runGh(args) {
    const result = spawnSync('gh', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe'
    });
    return {
        status: result.status,
        stdout: (result.stdout || '').trim(),
        stderr: (result.stderr || '').trim()
    };
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

/** Always bump + rebuild before commit/push so the More-page version matches the shipped build. */
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

function buildBranchBase(userName, now = new Date()) {
    const y = now.getFullYear();
    const m = pad2(now.getMonth() + 1);
    const d = pad2(now.getDate());
    const hh = pad2(now.getHours());
    const mm = pad2(now.getMinutes());
    const date = `${y}-${m}-${d}`;
    const slug = slugify(userName);
    if (slug) return `save/${date}-with-${slug}`;
    return `save/${date}-${hh}${mm}`;
}

function buildCommitMessage(userName, now = new Date()) {
    const slug = slugify(userName);
    if (slug) return `chore: ${slug.replace(/-/g, ' ')}`;
    return `chore: save work ${formatBuiltAt(now)}`;
}

function listExistingBranchNames() {
    const names = new Set();
    try {
        runGit(['branch', '--format=%(refname:short)']).split('\n').forEach((b) => {
            if (b) names.add(b.trim());
        });
    } catch (_) {}
    try {
        runGit(['ls-remote', '--heads', 'origin']).split('\n').forEach((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2 && parts[1].startsWith('refs/heads/')) {
                names.add(parts[1].replace('refs/heads/', ''));
            }
        });
    } catch (_) {}
    return names;
}

function uniqueBranchName(baseName, existing) {
    if (!existing.has(baseName)) return baseName;
    for (let i = 1; i < 1000; i++) {
        const candidate = `${baseName}-${i}`;
        if (!existing.has(candidate)) return candidate;
    }
    fail(`Could not find a free branch name for ${baseName}`);
}

function assertSafeToCommit() {
    let porcelain;
    try {
        porcelain = runGit(['status', '--porcelain']);
    } catch (e) {
        fail(`git status failed: ${e.message}`);
    }
    if (!porcelain) return false;

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
    return true;
}

function ensureGhReady() {
    try {
        execFileSync('gh', ['--version'], { stdio: 'pipe' });
    } catch (_) {
        fail('GitHub CLI (gh) is not installed. Install it and run: gh auth login');
    }
    const auth = runGh(['auth', 'status']);
    if (auth.status !== 0) {
        fail('gh is not authenticated. Run: gh auth login');
    }
}

function findExistingPrUrl(headBranch) {
    const res = runGh(['pr', 'list', '--head', headBranch, '--json', 'url', '--jq', '.[0].url']);
    if (res.status === 0 && res.stdout) return res.stdout;
    return '';
}

function createPullRequest({ baseBranch, headBranch, title, body }) {
    const existing = findExistingPrUrl(headBranch);
    if (existing) {
        console.log(`  PR already exists: ${existing}`);
        return existing;
    }

    const res = runGh([
        'pr', 'create',
        '--base', baseBranch,
        '--head', headBranch,
        '--title', title,
        '--body', body
    ]);

    if (res.status !== 0) {
        fail(`gh pr create failed: ${res.stderr || res.stdout || 'unknown error'}`);
    }

    const url = res.stdout.split('\n').find((line) => line.startsWith('http')) || res.stdout;
    return url;
}

function buildPrBody(userName, now = new Date()) {
    const summary = userName.trim()
        ? `- ${userName.trim()}`
        : `- Save work ${formatBuiltAt(now)}`;

    return `## Summary
${summary}

## Test plan
- [ ] npm run build
- [ ] Smoke-tested on device / browser
`;
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

    const baseBranch = PR_BASE_BRANCH;
    const userName = parseUserName(process.argv);
    const now = new Date();
    const existing = listExistingBranchNames();
    const branchBase = buildBranchBase(userName, now);
    const newBranch = uniqueBranchName(branchBase, existing);
    const commitMessage = buildCommitMessage(userName, now);
    const prBody = buildPrBody(userName, now);

    console.log(`Current:      ${currentBranch}`);
    console.log(`PR base:      ${baseBranch}`);
    console.log(`New branch:   ${newBranch}`);

    // Bump version + production build first so push always includes a fresh stamp.
    bumpBuildBeforeSave();

    try {
        runGit(['checkout', '-b', newBranch]);
    } catch (e) {
        fail(`git checkout -b failed: ${e.message}`);
    }

    const version = readAppVersion();
    const commitWithVersion = version
        ? `${commitMessage} (v${version})`
        : commitMessage;

    const hasChanges = assertSafeToCommit();
    let committed = false;

    if (hasChanges) {
        try {
            runGit(['add', '-A']);
            runGit(['commit', '-m', commitWithVersion]);
            committed = true;
            console.log(`✓ Committed: ${commitWithVersion}`);
        } catch (e) {
            fail(`git commit failed: ${e.message}`);
        }
    } else {
        console.log('✓ No file changes to commit');
    }

    try {
        runGit(['push', '-u', 'origin', 'HEAD']);
        console.log('✓ Pushed to origin');
    } catch (e) {
        fail(`git push failed: ${e.message}`);
    }

    ensureGhReady();
    const prUrl = createPullRequest({
        baseBranch,
        headBranch: newBranch,
        title: commitWithVersion,
        body: prBody
    });

    console.log('');
    console.log('Done.');
    console.log(`  Branch: ${newBranch}`);
    if (committed) console.log(`  Commit: ${commitWithVersion}`);
    console.log(`  PR:     ${prUrl}`);
}

main();
