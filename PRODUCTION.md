# Production release (single HTML file)

For mobile deployment you need **one self-contained HTML file** — no separate `main.js` on the device.

## What gets bundled

| Source (edit these) | Inlined into |
|---------------------|--------------|
| `main.html`         | structure + app logic |
| `shared/css/_variables.css` | brand theme tokens + Bootstrap color bridge (`<style>`) |
| `shared/lib/**/*.js` + `features/**/*.js` + `shared/db/**/*.js` + `main.js` | single bundled `<script>` (order from `shared/scripts/manifest.json`) |

CDN assets (Bootstrap, Font Awesome, Google Fonts, Firebase) stay as network links — the app still needs internet for those on first load.

Brand colors come only from `shared/css/_variables.css` (mapped onto Bootstrap `--bs-*` variables).

Shared helpers live in `shared/lib/` (`_registry.js`, `format.js`, `bootstrap.js`). Data/sync lives in `shared/db/`. Build/verify tooling lives in `shared/scripts/`. Cross-feature UI (shell, trade list, sheets, modal) lives in `features/common/`. Each tab keeps its feature scripts under its folder (e.g. `features/positions/trades-page.js`).

## One-time setup

```bash
npm install
```

## Build the production file

After any change to `main.html`, `shared/css/_variables.css`, `main.js`, or files under `shared/lib/` / `features/` / `shared/db/`, run:

```bash
npm run build
```

The build **first repairs** `shared/scripts/manifest.json` and the matching `<script>` tags in `main.html` (same as `npm run repair`), then **bundles** JS into one HTML file and **minifies** HTML and JavaScript. This **overwrites** `production.html`.

### Repair manifest only

```bash
npm run repair
```

Updates `shared/scripts/manifest.json` and the `<!-- COMPONENT SCRIPTS -->` block in `main.html`.

## Deploy to mobile

1. Run `npm run build` (always bumps the patch version + stamps date/time).
2. Copy **`production.html`** to your phone.
3. Open it in the mobile browser.

`npm run save` also bumps + builds first, then commits and pushes so the version is never stale on push.

## Verify

```bash
npm run verify
```

- **Do not edit `production.html` by hand.**
- Prefer `npm run verify` before shipping.
