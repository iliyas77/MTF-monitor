---
kind: external_dependency
name: Bootstrap 5 — UI framework (CSS + JS components)
slug: bootstrap-5
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

### Role
- Primary CSS/JS framework providing grid, navbar, modal, toast, dropdown, form controls, badges, spinners, etc. Loaded from CDN in `main.html` and also declared as a dev dependency in `package.json`.

### Framework behavior to follow
- App code never manipulates DOM classes directly for UI chrome; instead it uses the thin wrappers in `shared/lib/bootstrap.js` (`showModal`, `hideModal`, `onModalHidden`, `showBootstrapToast`, `renderAppButton`, `renderDropdownMenu`, `renderSelect`, `renderFormField`, `renderEmptyState`, `renderSearchBar`, `renderIconButton`, `renderLabel`, `appTag`, `renderMoneyValueBlock`, `renderAppButtonRow`).