---
kind: build_system
name: Node-based SPA Build, Integrity & Save Workflow
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - build-production.js
    - shared/scripts/sync-manifest.js
    - shared/scripts/verify.js
    - shared/scripts/verify-integrity.js
    - shared/scripts/verify-smoke.js
    - shared/scripts/verify-report.js
    - shared/scripts/git-save.js
    - shared/scripts/github-sync.js
    - playwright.config.js
    - main.html
    - app-version.json
    - features/more/app-version.js
---

The project uses a lightweight Node.js build pipeline centered on `build-production.js` to assemble the single-page app into one minified `production.html`. There is no bundler (Webpack/Vite/Rollup); instead, a manifest-driven approach concatenates all JS sources and inlines CSS before minification.

### What system/approach is used
- **Manifest-driven script assembly**: `shared/scripts/sync-manifest.js` scans `shared/lib/`, `components/`, `features/`, `shared/db/`, and `main.js`, then writes an ordered list into `shared/scripts/manifest.json` and rewrites the `<!-- COMPONENT SCRIPTS -->` block in `main.html`. The order is deterministic via preferred-order lists for lib, db, components, and features.
- **HTML/CSS/JS minification**: `build-production.js` reads `main.html`, inlines `shared/css/colors.css` and `_variables.css` as `<style>`, replaces the component-script block with the concatenated JS from the manifest, then runs `html-minifier-terser` to produce `production.html`. Bootstrap stays as an external CDN link.
- **Version stamping**: `app-version.json` + generated `features/more/app-version.js` hold `APP_VERSION` / `APP_BUILT_AT`; `--bump` increments the patch version and updates both files.
- **Verification suite**: `npm run verify` orchestrates integrity checks (`verify-integrity.js`), a rebuild (`runBuild`), and Playwright smoke tests against `production.html` (mobile viewport 390x844).
- **Developer save workflow**: `npm run save` (alias `ship`) bumps the version, builds, creates a dated branch `save/YYYY-MM-DD[-with-slug]`, commits, pushes to origin, and opens a PR targeting the `Dev` branch — guarded by secret-file pattern checks and `gh auth` validation.
- **Local dev server**: `http-server . -p 8080 -c-1` serves the source tree; `npm run production` opens `production.html` directly.

### Key files and packages
- `package.json` — npm scripts (`start`, `dev`, `production`, `repair`, `sync`, `build`, `ship`, `build:nobump`, `verify`, `all`, `save`, `save-local`) and dependencies (`http-server`, `html-minifier-terser`, `playwright`).
- `build-production.js` — entry point for the build: manifest repair -> version bump -> HTML/CSS/JS assembly -> minify -> write `production.html`.
- `shared/scripts/sync-manifest.js` — discovers `.js` files, computes deterministic load order, rewrites `manifest.json` and `main.html`.
- `shared/scripts/verify.js` — top-level health gate: integrity -> build -> smoke, exits non-zero on failure.
- `shared/scripts/verify-integrity.js`, `shared/scripts/verify-smoke.js`, `shared/scripts/verify-report.js` — sub-checks and report formatter.
- `shared/scripts/git-save.js` — `npm run save` flow: bump+build -> branch/commit/push -> `gh pr create` against `Dev`.
- `shared/scripts/github-sync.js` — parses `ticket.txt` -> creates GitHub issues -> adds to GitHub Project #1 -> appends rows to `TICKETS.md`.
- `playwright.config.js` — headless Chromium, mobile viewport, single project.
- `main.html` — shell template containing the `<!-- COMPONENT SCRIPTS -->` injection block and required `<link>` tags for Bootstrap, colors.css, _variables.css.
- `app-version.json` / `features/more/app-version.js` — persisted version metadata injected at build time.

### Architecture and conventions
- **No transpiler or module bundler** — plain ES5-style scripts loaded sequentially; dependency ordering is enforced by the manifest's preferred-order lists rather than import statements.
- **Single output artifact** — everything ships as one `production.html` plus Bootstrap CDN; there is no asset pipeline beyond minification.
- **Deterministic ordering** — `sync-manifest.js` enforces a fixed precedence (registry/format/bootstrap first, DB layer next, reusable components, then feature pages) so runtime initialization order never drifts.
- **Version lifecycle** — `--no-bump` (default for `npm run build`) keeps the current version; `--bump` (used by `save` and `save-local`) increments patch and stamps the build timestamp.
- **Gatekeeping** — `npm run verify` is the canonical pre-commit sanity check; it aborts subsequent stages if any earlier stage fails.

### Rules developers should follow
- Add new JS files under `shared/lib/`, `components/`, `features/<feature>/`, or `shared/db/`; do not manually edit `manifest.json` or the script block in `main.html` — run `npm run repair` (or rely on the build doing it automatically).
- Keep feature page files named `<name>-page.js` and their services `<name>-service.js` so the preferred-order lists stay accurate when adding new routes.
- Use `npm run build -- --bump` only when you want a new patch version; otherwise use `npm run build` or `npm run ship` (which aliases `build`).
- Before pushing work-in-progress, run `npm run save` to auto-create a dated branch and PR against `Dev`; ensure `gh auth login` has been run once.
- Always run `npm run verify` locally; it will rebuild and smoke-test `production.html` in a mobile-sized Chromium window.
- Do not commit files matching the secret patterns (`.env`, `credentials.json`, `.pem`, `id_rsa`, `.p12`) — `git-save.js` will refuse to commit them.