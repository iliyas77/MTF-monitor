---
kind: configuration_system
name: Global Registry-Based Runtime Configuration (MTFRegister + MTFDb)
category: configuration_system
scope:
    - '**'
source_files:
    - shared/lib/_registry.js
    - shared/db/firebase-config.js
    - shared/db/db-service.js
    - shared/db/local-db.js
    - main.js
    - main.html
---

The application uses a lightweight, global-registry configuration system rather than a dedicated config library. All runtime configuration is published onto the `window` object via two registries and consumed through the same globals.

### How it works

1. **Component registry (`shared/lib/_registry.js`)** — every module calls `global.MTFRegister({ ...exports })`, which merges its API into `window.MTFComponents`. This is how UI atoms, bootstrap helpers, and feature modules expose their public functions to the rest of the app.
2. **Database/feature registry (`shared/db/firebase-config.js`, `shared/db/db-service.js`, `shared/db/local-db.js`)** — each database-related module calls `global.MTFDbRegister({...})` (a thin alias over `MTFRegister`) to publish cloud-sync, local-cache, and query APIs under `window.MTFDb` / `window.MTFLocalDB`.
3. **Bootstrapping (`main.html` → `main.js`)** — the HTML shell loads scripts in dependency order; `main.js` re-exports everything from `window.MTFComponents` onto `window` so features can call helpers directly.
4. **Feature files** import what they need by destructuring `window.MTFComponents` or `window.MTFDb` at startup.

### Where configuration lives

| Kind | File | What it provides | Loaded via |
|---|---|---|---|
| Firebase / cloud sync credentials | `shared/db/firebase-config.js` | `FIREBASE_CONFIG`, `DEFAULT_SYNC_CODE` (registered as `MTFDb`) | `<script>` in `main.html` |
| Broker fee & interest rates | `main.js` (local const) | `BROKER_CONFIG = { Zerodha, Groww, Dhan }` | Inlined in the app shell |
| App-level constants | `main.js` | `TX_SELL_PCT_SAME_DAY`, `TX_SELL_PCT_OVERNIGHT`, `TX_DEFAULT_BUDGET`, NSE/Yahoo URLs, JINA proxy URL | Inlined in the app shell |
| Local cache schema | `shared/db/local-db.js` | IndexedDB name/version/object stores | `<script>` in `main.html` |
| CSS theme tokens | `shared/css/_variables.css`, `shared/css/colors.css` | Bootstrap overrides, color variables | `<link>` in `main.html` |
| Build-time manifest | `pages.json`, `app-version.json` | Page list, version string used by dev tools | Read by Node build scripts |

There are **no** `.env`, YAML, TOML, or property-file loaders. Environment-specific values (Firebase keys, default sync code) are placed directly in source files and shipped with the bundle.

### Conventions developers should follow

- **Publish new runtime settings** by calling `global.MTFDbRegister({ key: value })` (for DB/cloud config) or `global.MTFRegister({ key: value })` (for UI/runtime helpers), then consume them by destructuring `window.MTFComponents` / `window.MTFDb` at the top of your module.
- **Do not use `process.env` or `dotenv`** — this is a pure browser SPA; there is no Node runtime at load time for env vars.
- **Keep secrets out of shared sources** — `firebase-config.js` currently contains a real Firebase project key; treat it like any other secret and replace with a per-deploy injection step before bundling.
- **Broker fees and business constants** belong in `main.js`'s `BROKER_CONFIG` block; add new brokers there rather than scattering literals across pages.
- **User preferences** (sync code, log toggles) are persisted in `localStorage` keys like `mtf_sync_code`, `mtf_data_version`; read/write through the existing helpers instead of inventing new storage keys.