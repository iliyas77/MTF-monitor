/**
 * A37 — Money entry time display formatter.
 */
(function (global) {
    'use strict';

    function formatMoneyEntryTimeDisplay(time) {
        if (!time) return '-';
        const parts = time.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        if (isNaN(h)) return time;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        return `${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    global.MTFRegister({ formatMoneyEntryTimeDisplay });
})(typeof window !== 'undefined' ? window : globalThis);
