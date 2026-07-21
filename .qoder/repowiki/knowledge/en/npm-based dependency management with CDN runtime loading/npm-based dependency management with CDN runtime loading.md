---
kind: dependency_management
name: npm-based dependency management with CDN runtime loading
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - main.html
    - build-production.js
---

This repository uses npm for dependency management but follows a split strategy between build-time and runtime dependencies:

**Build-time (devDependencies)** — Declared in `package.json` and locked by `package-lock.json` (lockfileVersion 3):
- `http-server`: local dev server (`npm start` / `npm run dev`)
- `html-minifier-terser`: used by `build-production.js` to minify the final HTML bundle
- `playwright`: optional end-to-end smoke tests invoked from `shared/scripts/verify-smoke.js`

**Runtime (dependencies)** — Only `bootstrap@^5.3.8` is listed, but it is **not actually loaded from `node_modules`**. The app shell in `main.html` loads Bootstrap 5.3.7 directly from the jsDelivr CDN at runtime:
```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>
```
The local `node_modules/bootstrap` package exists only as an artifact of `npm install`; the runtime bootstrap entrypoint `shared/lib/bootstrap.js` is a thin wrapper that re-exports the global `bootstrap` object.

**Locking & reproducibility**
- `package-lock.json` pins exact versions of all transitive devDependency trees, so `npm ci` produces deterministic builds.
- There is no vendoring of client-side assets; the production build (`npm run build`) generates a single self-contained HTML file via `build-production.js`, which reads the script manifest (`pages.json`) and inlines everything except the two CDN-hosted Bootstrap files.

**No private registry or proxy configuration** — No `.npmrc`, `yarn.lock`, `pnpm-lock.yaml`, or `go.mod` files exist. All packages resolve against the public npm registry.