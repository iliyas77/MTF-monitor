/**
 * MTFLogger - Centralized activity log utility.
 * Replaces console.log/warn/error across the application for consistent feature tagging.
 */
(function(global) {
    'use strict';

    function getCallerName() {
        try {
            const stack = new Error().stack;
            if (!stack) return 'Feature: general | Caller: unknown';
            const lines = stack.split('\n');
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('activity-log.js')) continue;
                
                let callerName = 'unknown';
                let track = 'general';

                const funcMatch = line.match(/at\s+([a-zA-Z0-9_$$.]+)\s+\(/);
                if (funcMatch && funcMatch[1]) {
                    const parts = funcMatch[1].split('.');
                    callerName = parts[parts.length - 1];
                } else {
                    const anonMatch = line.match(/at\s+(.+:\d+:\d+)/);
                    if (anonMatch && anonMatch[1]) {
                        const cleanPath = anonMatch[1].replace(/.*\//, '');
                        callerName = `anonymous (${cleanPath})`;
                    }
                }

                const searchStr = (line + ' ' + callerName).toLowerCase();
                if (searchStr.includes('positions') || searchStr.includes('trade') || searchStr.includes('transaction') || searchStr.includes('past')) {
                    track = 'positions';
                } else if (searchStr.includes('watchlist') || searchStr.includes('market') || searchStr.includes('quote')) {
                    track = 'watchlist';
                } else if (searchStr.includes('money') || searchStr.includes('ledger') || searchStr.includes('wallet') || searchStr.includes('account') || searchStr.includes('entry') || searchStr.includes('transfer')) {
                    track = 'money';
                } else if (searchStr.includes('calendar')) {
                    track = 'calendar';
                } else if (searchStr.includes('sync') || searchStr.includes('push') || searchStr.includes('cloud') || searchStr.includes('firebase')) {
                    track = 'sync';
                }

                return `Feature: ${track} | Caller: ${callerName}`;
            }
        } catch (_) {}
        return 'Feature: general | Caller: unknown';
    }

    const MTFLogger = {
        log: function(label, ...data) {
            console.log(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        warn: function(label, ...data) {
            console.warn(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        error: function(label, ...data) {
            console.error(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        trace: function(serviceObj, trackName) {
            Object.keys(serviceObj).forEach(key => {
                const originalMethod = serviceObj[key];
                if (typeof originalMethod === 'function') {
                    serviceObj[key] = function(...args) {
                        const callerStr = key;
                        console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method initiated`);
                        try {
                            const result = originalMethod.apply(this, args);
                            if (result instanceof Promise) {
                                return result.finally(() => {
                                    console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited`);
                                });
                            }
                            console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited`);
                            return result;
                        } catch (e) {
                            console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited (with error)`);
                            throw e;
                        }
                    };
                }
            });
            return serviceObj;
        }
    };

    global.MTFLogger = MTFLogger;
})(typeof window !== 'undefined' ? window : globalThis);
