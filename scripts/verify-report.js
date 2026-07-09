/**
 * Shared pass/fail report helpers for npm run verify.
 */
'use strict';

function createReport() {
    const checks = [];

    return {
        pass(name, detail) {
            checks.push({ ok: true, name, detail: detail || 'OK' });
        },
        fail(name, detail) {
            checks.push({ ok: false, name, detail: detail || 'failed' });
        },
        warn(name, detail) {
            checks.push({ ok: true, name, detail: detail || 'OK', warn: true });
        },
        get checks() {
            return checks;
        },
        print() {
            const width = Math.max(...checks.map((c) => c.name.length), 12);
            console.log('');
            console.log('═'.repeat(56));
            console.log('  App health report');
            console.log('═'.repeat(56));
            for (const c of checks) {
                const mark = c.ok ? (c.warn ? '!' : '✓') : '✗';
                const pad = ' '.repeat(width - c.name.length);
                console.log(`${mark} ${c.name}${pad}  ${c.detail}`);
            }
            console.log('─'.repeat(56));
            const failed = checks.filter((c) => !c.ok);
            const warned = checks.filter((c) => c.ok && c.warn);
            if (failed.length === 0) {
                const warnNote = warned.length ? ` (${warned.length} warning${warned.length === 1 ? '' : 's'})` : '';
                console.log(`RESULT: PASS${warnNote}`);
                console.log('═'.repeat(56));
                return 0;
            }
            console.log(`RESULT: FAIL (${failed.length} check${failed.length === 1 ? '' : 's'} failed)`);
            console.log('═'.repeat(56));
            return 1;
        }
    };
}

module.exports = { createReport };
