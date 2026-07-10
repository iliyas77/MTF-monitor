#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const HOOKS_DIR = __dirname;
const ROOT = path.resolve(HOOKS_DIR, '../..');
const SCHEDULE_FILE = path.join(HOOKS_DIR, '.rebuild-scheduled');
const LOCK_FILE = path.join(HOOKS_DIR, '.rebuild.lock');

function isSourceFile(filePath) {
    if (!filePath) return true;

    const rel = path.relative(ROOT, path.resolve(ROOT, filePath)).replace(/\\/g, '/');
    if (!rel || rel.startsWith('..')) return false;
    if (rel === 'production.html') return false;
    if (rel.startsWith('.cursor/')) return false;
    if (rel.startsWith('node_modules/')) return false;
    if (rel === 'package.json' || rel === 'package-lock.json') return false;

    return (
        rel === 'main.html' ||
        rel === 'main.js' ||
        rel === 'app-version.json' ||
        rel === 'build-production.js' ||
        rel === 'css/_variables.css' ||
        rel === 'scripts/manifest.json' ||
        rel.startsWith('lib/') ||
        rel.startsWith('pages/') ||
        rel.startsWith('db/')
    );
}

function scheduleBuild() {
    fs.writeFileSync(SCHEDULE_FILE, String(Date.now()));

    try {
        fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
    } catch {
        return;
    }

    const runner = path.join(HOOKS_DIR, 'rebuild-production-runner.js');
    const child = spawn(process.execPath, [runner], {
        detached: true,
        stdio: 'ignore',
        cwd: ROOT
    });
    child.unref();
}

async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
}

async function main() {
    const input = await readStdin();

    if (input.trim()) {
        try {
            const data = JSON.parse(input);
            const file =
                data.file_path ||
                data.path ||
                data.filePath ||
                data.file ||
                data.editedFile ||
                '';

            if (file && !isSourceFile(file)) {
                process.exit(0);
            }
        } catch {
            // stop / unknown payloads: still schedule a build
        }
    }

    scheduleBuild();
    process.exit(0);
}

main().catch(() => process.exit(0));
