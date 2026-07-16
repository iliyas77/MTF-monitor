/**
 * Call Log diagnostics service.
 */
(function (global) {
    'use strict';

    const LOCAL_KEY = 'mtf_db_call_log';

    function todayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function emptyDay() {
        return { reads: 0, writes: 0, total: 0 };
    }

    function emptyLog() {
        return {
            version: 1,
            days: {},
            totalReads: 0,
            totalWrites: 0,
            total: 0,
            lastFlushedAt: null,
            lastHydratedAt: null,
            dirty: false
        };
    }

    function recomputeTotals(log) {
        let reads = 0;
        let writes = 0;
        Object.keys(log.days || {}).forEach((key) => {
            const day = log.days[key] || emptyDay();
            day.reads = Math.max(0, Number(day.reads) || 0);
            day.writes = Math.max(0, Number(day.writes) || 0);
            day.total = day.reads + day.writes;
            log.days[key] = day;
            reads += day.reads;
            writes += day.writes;
        });
        log.totalReads = reads;
        log.totalWrites = writes;
        log.total = reads + writes;
        return log;
    }

    function normalizeDbCallLog(raw) {
        const base = emptyLog();
        if (!raw || typeof raw !== 'object') return base;
        const days = {};
        const srcDays = raw.days && typeof raw.days === 'object' ? raw.days : {};
        Object.keys(srcDays).forEach((key) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
            const d = srcDays[key] || {};
            const reads = Math.max(0, Number(d.reads) || 0);
            const writes = Math.max(0, Number(d.writes) || 0);
            days[key] = { reads, writes, total: reads + writes };
        });
        base.days = days;
        base.lastFlushedAt = raw.lastFlushedAt ? String(raw.lastFlushedAt) : null;
        base.lastHydratedAt = raw.lastHydratedAt ? String(raw.lastHydratedAt) : null;
        base.dirty = !!raw.dirty;
        return recomputeTotals(base);
    }

    function readLocalLog() {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            if (!raw) return emptyLog();
            return normalizeDbCallLog(JSON.parse(raw));
        } catch (_) {
            return emptyLog();
        }
    }

    function writeLocalLog(log) {
        const normalized = recomputeTotals(normalizeDbCallLog(log));
        try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
        } catch (_) { /* ignore quota */ }
        return normalized;
    }

    function ensureTodayBucket(log) {
        const key = todayKey();
        if (!log.days[key]) log.days[key] = emptyDay();
        return key;
    }

    let suppressDbCallNotes = 0;

    /** Increment local-only counters. Never writes to Firestore. */
    function noteDbCall(kind, reason) {
        if (suppressDbCallNotes > 0) return readLocalLog();
        const log = readLocalLog();
        const key = ensureTodayBucket(log);
        const day = log.days[key];
        if (kind === 'read') day.reads += 1;
        else day.writes += 1;
        day.total = day.reads + day.writes;
        log.dirty = true;
        log.lastReason = reason ? String(reason) : kind;
        log.lastCallAt = new Date().toISOString();
        return writeLocalLog(log);
    }

    function mergeDbCallLogs(a, b) {
        const left = normalizeDbCallLog(a);
        const right = normalizeDbCallLog(b);
        const keys = new Set([].concat(Object.keys(left.days), Object.keys(right.days)));
        const days = {};
        keys.forEach((key) => {
            const l = left.days[key] || emptyDay();
            const r = right.days[key] || emptyDay();
            const reads = Math.max(l.reads, r.reads);
            const writes = Math.max(l.writes, r.writes);
            days[key] = { reads, writes, total: reads + writes };
        });
        const out = emptyLog();
        out.days = days;
        out.lastFlushedAt = [left.lastFlushedAt, right.lastFlushedAt]
            .filter(Boolean)
            .sort()
            .pop() || null;
        out.lastHydratedAt = new Date().toISOString();
        out.dirty = !!(left.dirty || right.dirty);
        return recomputeTotals(out);
    }

    function hydrateDbCallLogFromRemote(remoteLog) {
        const merged = mergeDbCallLogs(readLocalLog(), remoteLog);
        merged.lastHydratedAt = new Date().toISOString();
        const remote = normalizeDbCallLog(remoteLog);
        merged.dirty = Object.keys(merged.days).some((key) => {
            const l = merged.days[key];
            const r = remote.days[key] || emptyDay();
            return l.reads > r.reads || l.writes > r.writes;
        });
        return writeLocalLog(merged);
    }

    function getDbCallLogSnapshot() {
        return normalizeDbCallLog(readLocalLog());
    }

    function getDbCallLogSummary() {
        const log = readLocalLog();
        const key = todayKey();
        const today = log.days[key] || emptyDay();
        const dayKeys = Object.keys(log.days).sort();
        return {
            todayKey: key,
            todayReads: today.reads,
            todayWrites: today.writes,
            todayTotal: today.total,
            totalReads: log.totalReads,
            totalWrites: log.totalWrites,
            total: log.total,
            dayCount: dayKeys.length,
            dirty: !!log.dirty,
            lastFlushedAt: log.lastFlushedAt,
            lastHydratedAt: log.lastHydratedAt,
            lastCallAt: log.lastCallAt || null,
            lastReason: log.lastReason || '',
            days: log.days
        };
    }

    function flushDbCallLogToDatabase() {
        const db = global.MTFDb;
        if (!db || typeof db.getStorage !== 'function' || typeof db.saveStorage !== 'function') {
            return Promise.reject(new Error('Storage unavailable'));
        }
        const snapshot = getDbCallLogSnapshot();
        const key = todayKey();
        if (!snapshot.days[key]) snapshot.days[key] = emptyDay();
        snapshot.days[key].writes += 1;
        snapshot.days[key].total = snapshot.days[key].reads + snapshot.days[key].writes;
        recomputeTotals(snapshot);
        snapshot.lastFlushedAt = new Date().toISOString();
        snapshot.dirty = false;
        writeLocalLog(snapshot);

        const data = db.getStorage();
        data.dbCallLog = {
            version: 1,
            days: snapshot.days,
            totalReads: snapshot.totalReads,
            totalWrites: snapshot.totalWrites,
            total: snapshot.total,
            lastFlushedAt: snapshot.lastFlushedAt,
            updatedAt: snapshot.lastFlushedAt
        };
        suppressDbCallNotes += 1;
        return db.saveStorage(data).then((ok) => ({
            ok: !!ok,
            log: getDbCallLogSummary()
        })).finally(() => {
            suppressDbCallNotes = Math.max(0, suppressDbCallNotes - 1);
        });
    }

    global.MTFDbRegister({
        LOCAL_DB_CALL_LOG_KEY: LOCAL_KEY,
        noteDbCall,
        readLocalDbCallLog: readLocalLog,
        getDbCallLogSnapshot,
        getDbCallLogSummary,
        hydrateDbCallLogFromRemote,
        mergeDbCallLogs,
        normalizeDbCallLog,
        flushDbCallLogToDatabase
    });

    // Register module
    if (typeof global.MTFRegister === 'function') {
        global.MTFRegister({ callLogService: {} });
    }
})(typeof window !== 'undefined' ? window : globalThis);
