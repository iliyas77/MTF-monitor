# CSS Class Audit Report

## Summary
- Defined classes: 721
- Referenced classes: 444
- Unused classes: 394
- Unavailable classes: 117

## Unavailable Classes (Referenced but not defined)
These classes are used in HTML/JS but have no corresponding CSS rule.

### Top Issues
- `badge`, `badge-sm` — DaisyUI-style badge classes not defined in custom CSS.
- `btn-neutral`, `btn-outline`, `btn-primary`, `btn-xs` — button variants missing.
- `card-body` — DaisyUI card body class not defined.
- `divider` — DaisyUI divider class not defined.
- `dropdown`, `dropdown-content`, `dropdown-end` — dropdown utilities missing.
- `fa-*` — Font Awesome icon classes (expected from external lib).
- `app-sheet`, `app-sheet__body`, `app-sheet__header` — sheet classes referenced but not defined.
- `amount-display__icon`, `amount-display--quantity` — amount display variants missing.

## Unused Classes (Defined but not referenced)
- 394 classes are defined but never referenced in HTML/JS.
- Examples: `align-baseline`, `align-bottom`, `align-middle`, `align-text-bottom`, `align-top`, `amount-tone--negative`, `amount-tone--neutral`, `amount-tone--positive`, `amount-tone--secondary`, `amount-tone--warning`, `amount-tone-text--*`, `app-alert`, `app-alert--error`, `app-alert--info`, `app-avatar`, `app-avatar--lg`, `app-avatar--sm`, `app-badge`, `app-badge--error`, `app-badge--primary`, `app-badge--secondary`, `app-badge--sm`, etc.

## MD Files with Migration Aliases
- `css-migration-progress.md` and `css-framework-plan.md` contain many migration aliases (app-modal, app-card, app-input, etc.).
- These are planning notes; no stale live references affecting runtime were found.

## Recommendations
1. Add missing CSS rules for unavailable classes that are still actively used.
2. Remove or archive unused classes to shrink CSS size.
3. Update MD migration docs to reflect completed work or convert TODO notes to tracked issues.