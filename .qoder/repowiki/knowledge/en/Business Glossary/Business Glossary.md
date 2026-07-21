---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Sync code
- Definition：A user-chosen secret string (default `iliyas-mtf-9f3k2x7q`) entered in Settings → Cloud Sync; both devices must share the same code so their watchlist, positions, closed trades and settings are merged into the same Firestore collections.
- Aliases：syncCode、mtf_sync_code

### Closed trades
- Definition：Trades whose status is `closed` (or legacy `close`); they are persisted separately from open transactions and surfaced on the Past Trades page and the calendar monthly report.
- Aliases：past trades、closed_trades collection

### Watchlist
- Definition：The user's saved list of stock symbols (with display names and order index); synced to its own flat Firestore collection keyed by `syncCode_symbol`.
- Aliases：market watchlist、watchlist collection

### LocalDB
- Definition：IndexedDB-backed cache layer (`MTFLocalDB`) that persists closed trades between sessions; the DB core reads from it before hitting Firestore and writes closed-trade snapshots back into it.
- Aliases：MTFLocalDB

### Soft Delete
- Definition：Deletion strategy where documents are marked `isDeleted: true` with a `deletedAt` timestamp rather than being physically removed; batch delete operations route through this path.
- Aliases：soft-delete

### Production build
- Definition：The single self-contained `production.html` bundle produced by `npm run build` (which repairs manifest, bundles all feature/lib scripts in `manifest.json` order, minifies HTML+JS, bumps version). This is the only artifact shipped to mobile browsers.
- Aliases：production.html、build
