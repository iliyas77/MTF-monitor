---
kind: logging_system
name: MTFLogger — Feature-tagged console wrapper with runtime-configurable switches
category: logging_system
scope:
    - '**'
source_files:
    - shared/lib/activity-log.js
    - features/more/settings-page.js
    - features/calendar/calendar-service.js
    - features/common/router.js
    - features/common/app-shell.js
    - features/positions/PositionRepository.js
    - features/watchlist/WatchlistRepository.js
---

## What system/approach is used
The app ships a single, self-contained logger called **MTFLogger** (defined in `shared/lib/activity-log.js`) that wraps the browser's native `console.log`/`warn`/`error`. It adds two cross-cutting concerns:
- **Automatic feature tagging**: each log line is prefixed with `Feature: <feature> | Caller: <function>` derived from the call stack by scanning for feature-specific keywords (`positions`, `watchlist`, `money`, `calendar`, `sync`).
- **Runtime toggleable channels**: four boolean switches (`master`, `db`, `app`, `trace`) let developers enable/disable broad categories of output without changing source code.

There is no external logging library; MTFLogger is a thin shim over `console.*` and is loaded as an early `<script>` so it is available globally before feature modules execute.

## Key files and packages
- `shared/lib/activity-log.js` — the entire logger implementation and global `window.MTFLogger` export.
- `features/more/settings-page.js` — exposes UI controls that write to `localStorage` keys like `activityLog_master`, `activityLog_db`, `activityLog_app`, `activityLog_trace` and calls `MTFLogger.updateConfig()` at runtime.
- Feature modules that consume it (examples): `features/calendar/calendar-service.js`, `features/common/router.js`, `features/common/app-shell.js`, `features/gold/gold-page.js`, `features/positions/PositionRepository.js`, `features/watchlist/WatchlistRepository.js`.

## Architecture and conventions
- **Global singleton**: MTFLogger is attached to `window` via an IIFE and consumed as `global.MTFLogger` / `MTFLogger` throughout the SPA. Call sites guard against its absence with `if (global.MTFLogger)` checks because it may not be present in production builds where activity logging is disabled.
- **Structured prefix format**: every emitted line follows `[Activity Log] Feature: <track> | Caller: <name> | <label> ...args`, making it easy to filter logs in DevTools.
- **Channel gating**:
  - `master` — top-level on/off switch; when false all logging is suppressed.
  - `db` — filters out labels containing `from DB` unless enabled.
  - `app` / `trace` — currently unused beyond config loading; `trace` powers the `MTFLogger.trace(serviceObj, trackName)` method which wraps every function on an object with entry/exit markers around syncs.
- **Configuration persistence**: defaults are read from `global.AppPermissions` (server-provided) or `localStorage`; callers can refresh via `MTFLogger.updateConfig()` after toggling settings.
- **Trace decorator**: `MTFLogger.trace(obj, trackName)` returns the same object with every function wrapped so that method entry/exit is logged automatically — useful for profiling async flows.

## Rules developers should follow
1. **Use `MTFLogger` instead of bare `console.*`** in feature code. The repo still contains scattered `console.log`/`console.error` in build scripts and a few legacy spots; new code should go through MTFLogger.
2. **Pass a descriptive label** as the first argument to `log`/`warn`/`error`; the auto-detected caller name supplements it but is not a substitute for human-readable context.
3. **Respect channel flags**: do not rely on logs being visible in production — wrap sensitive or noisy calls behind `if (global.MTFLogger && config.db)` style guards if needed.
4. **Prefer `MTFLogger.trace`** for wrapping service objects whose methods you want to monitor end-to-end rather than adding manual entry/exit logs.
5. **Keep feature keywords aligned** with the heuristics in `getCallerName` (`positions|trade|transaction|past`, `watchlist|market|quote`, `money|ledger|wallet|account|entry|transfer`, `calendar`, `sync|push|cloud|firebase`) so automatic tagging stays accurate.