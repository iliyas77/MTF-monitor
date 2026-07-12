/**
 * Shared pass/fail report helpers for npm run verify.
 * Logs each health point live (1×1) as it completes, then prints a summary.
 */
'use strict';

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function createReport(options = {}) {
    const checks = [];
    const live = options.live !== false;
    const useColor = options.color !== false && !!process.stdout.isTTY;

    function paint(code, text) {
        return useColor ? `${code}${text}${COLORS.reset}` : text;
    }

    function logLive(entry) {
        if (!live) return;
        const n = checks.length;
        let mark;
        if (!entry.ok) mark = paint(COLORS.red, '✗');
        else if (entry.warn) mark = paint(COLORS.yellow, '!');
        else mark = paint(COLORS.green, '✓');
        const idx = paint(COLORS.dim, `[${String(n).padStart(2, ' ')}]`);
        const name = paint(COLORS.bold, entry.name);
        const detail = paint(COLORS.dim, entry.detail);
        console.log(`${idx} ${mark} ${name}  ${detail}`);
    }

    function push(entry) {
        checks.push(entry);
        logLive(entry);
    }

    return {
        pass(name, detail) {
            push({ ok: true, name, detail: detail || 'OK' });
        },
        fail(name, detail) {
            push({ ok: false, name, detail: detail || 'failed' });
        },
        warn(name, detail) {
            push({ ok: true, name, detail: detail || 'OK', warn: true });
        },
        section(title) {
            if (!live) return;
            console.log('');
            console.log(paint(COLORS.cyan, `── ${title} ──`));
        },
        get checks() {
            return checks;
        },
        print() {
            const passed = checks.filter((c) => c.ok && !c.warn).length;
            const warned = checks.filter((c) => c.ok && c.warn).length;
            const failed = checks.filter((c) => !c.ok);
            const total = checks.length;
            const width = Math.max(...checks.map((c) => c.name.length), 12);

            console.log('');
            console.log(paint(COLORS.bold, '═'.repeat(60)));
            console.log(paint(COLORS.bold, '  App health report'));
            console.log(paint(COLORS.bold, '═'.repeat(60)));
            for (const c of checks) {
                let mark;
                if (!c.ok) mark = paint(COLORS.red, '✗');
                else if (c.warn) mark = paint(COLORS.yellow, '!');
                else mark = paint(COLORS.green, '✓');
                const pad = ' '.repeat(width - c.name.length);
                console.log(`${mark} ${c.name}${pad}  ${c.detail}`);
            }
            console.log(paint(COLORS.dim, '─'.repeat(60)));
            console.log(
                `  Health points: ${paint(COLORS.bold, `${passed + warned}/${total}`)}`
                + `  ${paint(COLORS.green, `${passed} pass`)}`
                + (warned ? `  ${paint(COLORS.yellow, `${warned} warn`)}` : '')
                + (failed.length ? `  ${paint(COLORS.red, `${failed.length} fail`)}` : '')
            );
            if (failed.length === 0) {
                const warnNote = warned ? ` (${warned} warning${warned === 1 ? '' : 's'})` : '';
                console.log(paint(COLORS.green, `  RESULT: PASS${warnNote}`));
                console.log(paint(COLORS.bold, '═'.repeat(60)));
                return 0;
            }
            console.log(paint(COLORS.red, `  RESULT: FAIL (${failed.length} check${failed.length === 1 ? '' : 's'} failed)`));
            console.log(paint(COLORS.bold, '═'.repeat(60)));
            return 1;
        }
    };
}

module.exports = { createReport };
