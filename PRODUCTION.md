# Production release (single HTML file)

For mobile deployment you need **one self-contained HTML file** — no separate `main.css` or `main.js` on the device.

## What gets bundled

| Source (edit these) | Inlined into |
|---------------------|--------------|
| `main.html`         | structure + app logic |
| `main.css`          | `<style>` in `<head>` |
| `components/**/*.js` + `main.js` | single bundled `<script>` (order from `components/manifest.json`) |

CDN assets (DaisyUI, Tailwind, Font Awesome, Firebase) stay as network links — the app still needs internet for those on first load.

## One-time setup

Install build tools (minifiers):

```bash
npm install
```

## Build the production file

After any change to `main.html`, `css/main.css`, `main.js`, or files under `components/` / `pages/` / `db/`, run:

```bash
npm run build
```

Or: `node build-production.js`

The build **first repairs** `components/manifest.json` and the matching `<script>` tags in `main.html` (same as `npm run repair`), then **bundles** local CSS/JS into one HTML file and **minifies** HTML, CSS, and JavaScript. This **overwrites** `production.html` in the project root.

### Repair manifest only

If you added/renamed/deleted JS under `components/`, `pages/`, or `db/` and want to sync the lists without building:

```bash
npm run repair
```

This updates `components/manifest.json` and the `<!-- COMPONENT SCRIPTS -->` block in `main.html` so they match files on disk (existing load order is preserved; new files are appended before `main.js`).

### Automatic rebuild (Cursor)

This repo includes Cursor hooks that rebuild `production.html` when:

- You save source files in **other tabs** (`afterTabFileEdit`)
- The **agent** edits files (`afterFileEdit`)
- An **agent turn finishes** (`stop`)

Edits are debounced (~2s) so rapid saves trigger one build. Check `.cursor/hooks/.rebuild.log` if a hook build fails.

Restart Cursor once after pulling these hooks if they do not run immediately.

## Deploy to mobile

1. Run the build command above.
2. Copy **`production.html`** to your phone (AirDrop, Google Drive, email, etc.).
3. Open it in the mobile browser, or save to Files and open from there.

You only need that one file — do not copy `main.css` or `main.js` separately.

## Verify after a feature (health report)

When you finish a feature or any source change, run a full health check:

```bash
npm run verify
```

This will:

1. Check manifest / component integrity and JS syntax
2. Run `npm run build`
3. Open `production.html` in a headless browser and smoke-test main screens (nav, More hub, Money, Settings, storage)
4. Print a pass/fail report (`RESULT: PASS` or `RESULT: FAIL`)

Exit code `0` means everything checked out; non-zero means fix the failed line and re-run.

One-time browser install (after `npm install`):

```bash
npx playwright install chromium
```

Fast integrity-only check (no browser):

```bash
npm run verify:integrity
```

## Workflow going forward

```
Edit sources  →  npm run build (auto-repairs manifest, or npm run repair alone)  →  npm run verify  →  copy production.html
```

- **Do not edit `production.html` by hand** — your changes will be lost on the next build.
- Always edit the source files, then rebuild. You do not need to hand-edit `components/manifest.json` when adding/removing JS — `npm run repair` / `npm run build` syncs it.
- Prefer `npm run verify` before shipping so you know screens and the build still work.

## Output file

| File | Purpose |
|------|---------|
| `production.html` | Single-file production release for mobile |

The build script prints the file size when it finishes so you can confirm the bundle was updated.
