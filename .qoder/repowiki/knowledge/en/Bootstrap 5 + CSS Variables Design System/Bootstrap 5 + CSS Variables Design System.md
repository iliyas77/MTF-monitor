---
kind: frontend_style
name: Bootstrap 5 + CSS Variables Design System
category: frontend_style
scope:
    - '**'
source_files:
    - shared/css/colors.css
    - shared/css/_variables.css
    - main.html
    - components/card.js
    - components/metrics-cell.js
---

The app's visual layer is a thin, mobile-first theme built on top of Bootstrap 5.3 (loaded from CDN) and Font Awesome 6.5 icons, with the Google Roboto font. All brand tokens live in two source-of-truth files under `shared/css/` and are consumed by both CSS and JS components.

**Design tokens**
- `shared/css/colors.css` — defines every color via CSS custom properties (`--gr-*`, `--blue500`, `--whole-bg`, etc.) plus utility classes `.bg-gr-*`, `.text-gr-*`, `.border-gr-*`.
- `shared/css/_variables.css` — maps those tokens onto Bootstrap 5 theme variables (`--bs-primary`, `--bs-body-bg`, `--bs-border-color`, …), overrides default BS styles (buttons, forms, dropdowns, tables, modals), and provides all page-specific layout rules (app shell width cap, bottom bar clearance, Cupertino Pane sheet chrome, trade cards, company info hero, calendar grid, compact trades table, etc.).

**Component library**
- `components/card.js` — a tiny string-based renderer that emits Bootstrap `.card` markup and auto-injects `data-component="card"`. Registered through the global `MTFRegister` / `MTFComponents` registry.
- `components/metrics-cell.js` — reusable KPI cell renderer supporting rich/simple variants, icon tones, progress bars, subtitle pills, clickability, and live-update hooks (`data-live-field`). Mirrors the same token set as `_variables.css`.
- `components/grid.js` — shared grid helper used across feature pages.

**Architecture & conventions**
- **Single HTML entry**: `main.html` loads Bootstrap CSS → brand colors → brand variables → Font Awesome → Roboto, then mounts page sections (`#page-trades`, `#page-past`, `#page-market`, `#page-gold`, `#page-calendar`, `#page-settings`, `#page-more`) and persistent sheets (`#searchSheet`, `#tradeDetailSheet`, `#txModal`, `#appSheet`, `#tradeFilterSheet`).
- **Mobile-first responsive strategy**: body is full-width up to `1100px` where it caps at `840px`; bottom nav/FAB use `env(safe-area-inset-bottom)`; sheets use `90dvh` max-height and Cupertino Pane for draggable panes.
- **Theme bridge pattern**: every Bootstrap semantic variable is remapped to a `--gr-*` token, so changing one token in `colors.css` re-themes the entire UI without touching Bootstrap classes.
- **JS-driven DOM refs**: nearly every template element carries a `data-ref="..."` attribute consumed by the runtime for text/content injection, keeping HTML declarative and JS imperative.
- **Iconography**: FontAwesome 6.5 via CDN; brand green is forced on calendar-related icons through CSS overrides.
- **No SCSS/preprocessor**: everything is plain CSS loaded directly in `<head>`.

**Rules developers should follow**
1. Add new colors only to `shared/css/colors.css` as CSS variables; never hardcode hex values in templates or JS.
2. Reference colors via the generated utilities (`.bg-gr-accent-soft`, `.text-gr-danger`, …) or Bootstrap tokens remapped in `_variables.css`.
3. Use Bootstrap 5 utility classes for layout (flex, spacing, border-radius) and reserve custom CSS in `_variables.css` for app-wide overrides.
4. Build reusable UI fragments as small modules registered via `global.MTFRegister({ ... })` following the `Card` / `MetricsCell` pattern, emitting Bootstrap class names.
5. Mark every injectable DOM node with a hierarchical `data-ref="section.subsection.element"` path.
6. Keep fonts, icons, and Bootstrap versions pinned in `main.html` — do not import them inside feature modules.