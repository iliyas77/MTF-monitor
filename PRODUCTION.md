# Production release (single HTML file)

For mobile deployment you need **one self-contained HTML file** — no separate `main.js` on the device.

## What gets bundled

| Source (edit these) | Inlined into |
|---------------------|--------------|
| `main.html`         | structure + app logic |
| `css/_variables.css` | brand theme tokens + Bootstrap color bridge (`<style>`) |
| `lib/**/*.js` + `pages/**/*.js` + `main.js` | single bundled `<script>` (order from `scripts/manifest.json`) |

CDN assets (Bootstrap, Font Awesome, Google Fonts, Firebase) stay as network links — the app still needs internet for those on first load.

Brand colors come only from `css/_variables.css` (mapped onto Bootstrap `--bs-*` variables).

Shared helpers live in `lib/` (`_registry.js`, `format.js`, `bootstrap.js`). Cross-page UI (shell, trade list, sheets, modal) lives in `pages/common/`. Each route keeps a single `*-page.js` under its folder (e.g. `pages/trades/trades-page.js`).

## One-time setup

```bash
npm install
```

## Build the production file

After any change to `main.html`, `css/_variables.css`, `main.js`, or files under `lib/` / `pages/` / `db/`, run:

```bash
npm run build
```

The build **first repairs** `scripts/manifest.json` and the matching `<script>` tags in `main.html` (same as `npm run repair`), then **bundles** JS into one HTML file and **minifies** HTML and JavaScript. This **overwrites** `production.html`.

### Repair manifest only

```bash
npm run repair
```

Updates `scripts/manifest.json` and the `<!-- COMPONENT SCRIPTS -->` block in `main.html`.

## Deploy to mobile

1. Run `npm run build` (or `npm run ship` to bump version).
2. Copy **`production.html`** to your phone.
3. Open it in the mobile browser.

## Verify

```bash
npm run verify
```

- **Do not edit `production.html` by hand.**
- Prefer `npm run verify` before shipping.
