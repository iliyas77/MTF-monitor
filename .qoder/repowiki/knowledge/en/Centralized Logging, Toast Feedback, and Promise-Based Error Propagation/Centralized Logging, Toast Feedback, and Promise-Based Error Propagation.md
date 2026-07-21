---
kind: error_handling
name: Centralized Logging, Toast Feedback, and Promise-Based Error Propagation
category: error_handling
scope:
    - '**'
source_files:
    - shared/lib/activity-log.js
    - shared/db/db-service.js
    - shared/db/BaseRepository.js
    - shared/lib/bootstrap.js
    - features/common/app-shell.js
---

The MTF Monitor SPA does not define a custom error class hierarchy or sentinel-error system. Instead, it relies on three complementary mechanisms that together form the application's error-handling approach:

1. Centralized logging via `MTFLogger` (shared/lib/activity-log.js)
   - A global logger exposing `log`, `warn`, `error`, and `trace` methods.
   - Each call is prefixed with an auto-detected feature tag (`positions`, `watchlist`, `money`, `calendar`, `sync`) derived from the stack trace, plus the caller function name.
   - Configurable per-feature toggles read from `AppPermissions` / `localStorage` keys (`activityLog_master`, `activityLog_db`, `activityLog_app`, `activityLog_trace`).
   - The `trace` helper wraps service objects to log method entry/exit and re-throw errors, used as an optional instrumentation layer.
   - All cross-cutting modules (`shared/db/db-service.js`, repositories in `features/*/`, `app-shell.js`, `router.js`) call `MTFLogger.error/warn/log` rather than bare `console.*`.

2. User-facing feedback via Bootstrap Toasts + loading indicators (shared/lib/bootstrap.js)
   - `showToast(message, type)` renders a Bootstrap toast with semantic color variants: `success`, `danger`, `warning`, `info`.
   - `showLoading(label)` / `hideLoading()` manage a non-blocking header spinner; `showBlockingProgress(label)` / `hideBlockingProgress()` show a full-screen blocker for destructive cloud writes.
   - Database operations surface user-visible messages through the `hooks.showToast` callback injected by `db-service.setSyncHooks`, e.g. `'Cloud sync failed. Saved locally — try reconnecting sync.'`.

3. Promise-based propagation with `.catch` / `finally` and return-of-result-object pattern
   - Firestore CRUD helpers in `shared/db/db-service.js` (`createDocument`, `getDocument`, `updateDocument`, `deleteDocument`, `getCollection`, `listenToCollection`, `batchWrite`) wrap each async operation in `try/catch`, log via `MTFLogger`, and return `{ success: boolean, data?, error? }` objects instead of throwing. Callers branch on `success`.
   - Network/listen callbacks pass `{ success: false, error }` into their `callback(err)` signature so listeners can react without unhandled rejections.
   - Repository classes (`BaseRepository` in `shared/db/BaseRepository.js`, `PositionRepository`, `WatchlistRepository`, `SettingsRepository`) throw synchronous `Error('...')` for programming mistakes (e.g. missing subclass implementation, unauthenticated access) and catch network failures, logging them and returning empty arrays or cached values.
   - UI-layer code uses `.catch(err => MTFLogger.warn(...))` or `.catch(e => MTFLogger.error(...))` around confirm-action promises and sheet interactions, never letting exceptions bubble to the top level.

Conventions developers should follow:
- Use `MTFLogger.log/warn/error` for all diagnostics; avoid raw `console.*` calls.
- For async I/O (Firestore, IndexedDB), prefer the `try/catch` + return `{ success, ... }` pattern used in `db-service.js`; do not throw across async boundaries unless it is a programming error.
- Surface transient/network problems to users through `hooks.showToast` (or `showBootstrapToast`) with one of the four semantic types (`success|info|warning|danger`).
- Use `showLoading`/`hideLoading` around batched reads and `showBlockingProgress`/`hideBlockingProgress` around destructive writes so the UI stays responsive.
- Throw plain `new Error('message')` only for unrecoverable developer mistakes (missing auth, abstract-method override); callers should guard against these synchronously.