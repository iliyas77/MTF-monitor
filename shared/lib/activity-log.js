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

    let config = { master: true, db: true, app: true, trace: true };

    function loadConfig() {
        try {
            if (global.AppPermissions) {
                config.master = global.AppPermissions.activityLogMaster !== false;
                config.db = global.AppPermissions.activityLogDb === true;
                config.app = global.AppPermissions.activityLogApp !== false;
                config.trace = global.AppPermissions.activityLogTrace === true;
            } else if (typeof localStorage !== 'undefined') {
                config.master = localStorage.getItem('activityLog_master') !== 'false';
                config.db = localStorage.getItem('activityLog_db') === 'true';
                config.app = localStorage.getItem('activityLog_app') !== 'false';
                config.trace = localStorage.getItem('activityLog_trace') === 'true';
            }
        } catch (e) {
            console.warn('MTFLogger: Config access failed, using default config', e);
        }
    }
    loadConfig();

    console.log('[Activity Log] Logger initialized. Config:', config);

    const MTFLogger = {
        updateConfig: function() {
            loadConfig();
        },
        log: function(label, ...data) {
            if (!config.master) return;
            if (label && typeof label === 'string' && label.includes('from DB') && !config.db) return;
            console.log(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        warn: function(label, ...data) {
            if (!config.master) return;
            console.warn(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        error: function(label, ...data) {
            if (!config.master) return;
            console.error(`[Activity Log] ${getCallerName()} | ${label}`, ...data);
        },
        trace: function(serviceObj, trackName) {
            Object.keys(serviceObj).forEach(key => {
                const originalMethod = serviceObj[key];
                if (typeof originalMethod === 'function') {
                    serviceObj[key] = function(...args) {
                        const callerStr = key;
                        if (config.master && config.trace) {
                            console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method initiated`);
                        }
                        try {
                            const result = originalMethod.apply(this, args);
                            if (result instanceof Promise) {
                                return result.finally(() => {
                                    if (config.master && config.trace) {
                                        console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited`);
                                    }
                                });
                            } else {
                                if (config.master && config.trace) {
                                    console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited`);
                                }
                                return result;
                            }
                        } catch (err) {
                            if (config.master && config.trace) {
                                console.log(`[Activity Log] Feature: ${trackName} | Caller: ${callerStr} | Method exited (with error)`);
                            }
                            throw err;
                        }
                    };
                }
            });
            return serviceObj;
        }
    };

    global.MTFLogger = MTFLogger;
})(typeof window !== 'undefined' ? window : globalThis);
