/**
 * A9 — Format helpers (currency, dates).
 */
(function (global) {
    'use strict';

    function fmt(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(1) + 'Cr';
        if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(1) + 'L';
        return sign + '₹' + Math.round(abs).toLocaleString('en-IN');
    }

    function fmtINR(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.round(Math.abs(n));
        return sign + '₹' + abs.toLocaleString('en-IN');
    }

    function fmtDec(n) {
        if (n === undefined || n === null || isNaN(n)) return '₹0.00';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        return sign + '₹' + abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function parseDateInput(d) {
        if (!d) return null;
        const s = String(d).trim();
        if (!s) return null;
        const dt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
        return isNaN(dt.getTime()) ? null : dt;
    }

    function fmtDateDisplay(d) {
        const dt = parseDateInput(d);
        if (!dt) return '—';
        return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function fmtDateShort(d) {
        const dt = parseDateInput(d);
        if (!dt) return '—';
        return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
    }

    global.MTFRegister({
        fmt,
        fmtINR,
        fmtDec,
        parseDateInput,
        fmtDateDisplay,
        fmtDateShort
    });
})(typeof window !== 'undefined' ? window : globalThis);
