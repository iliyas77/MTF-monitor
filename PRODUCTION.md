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

After any change to `main.html`, `main.css`, `main.js`, or files under `components/`, run:

```bash
npm run build
```

Or: `node build-production.js`

The build **bundles** local CSS/JS into one HTML file, then **minifies** HTML, CSS, and JavaScript (whitespace removal, comment stripping, JS mangling). This **overwrites** `production.html` in the project root.

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

## Workflow going forward

```
Edit sources  →  npm run build (or auto via Cursor hooks)  →  copy production.html
```

- **Do not edit `production.html` by hand** — your changes will be lost on the next build.
- Always edit the source files, then rebuild.

## Output file

| File | Purpose |
|------|---------|
| `production.html` | Single-file production release for mobile |

The build script prints the file size when it finishes so you can confirm the bundle was updated.
