#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = __dirname;
const ROOT = path.resolve(HOOKS_DIR, '../..');
const SCHEDULE_FILE = path.join(HOOKS_DIR, '.rebuild-scheduled');
const LOCK_FILE = path.join(HOOKS_DIR, '.rebuild.lock');
const LOG_FILE = path.join(HOOKS_DIR, '.rebuild.log');
const DEBOUNCE_MS = 2000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
    try {
        while (true) {
            await sleep(DEBOUNCE_MS);
            if (!fs.existsSync(SCHEDULE_FILE)) break;

            const lastEdit = Number(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
            if (Date.now() - lastEdit < DEBOUNCE_MS) continue;

            const output = execSync('npm run build:nobump', {
                cwd: ROOT,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe']
            });
            fs.writeFileSync(LOG_FILE, `${new Date().toISOString()}\n${output}\n`);
            break;
        }
    } catch (err) {
        const message = err.stdout || err.stderr || err.message || String(err);
        fs.writeFileSync(LOG_FILE, `${new Date().toISOString()}\nBUILD FAILED\n${message}\n`);
    } finally {
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    }
}

run();
