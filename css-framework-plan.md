# CSS Framework Migration Plan

## Current State Analysis

### Third-Party Dependencies
1. **DaisyUI 4.12.14** - Component library (btn, card, input, modal, dropdown, badge, etc.)
2. **Tailwind CSS** - Utility-first CSS framework
3. **Font Awesome 6.5.1** - Icon library
4. **Google Fonts (Roboto)** - Typography

### Current CSS Breakdown
- **main.css**: 3112 lines of custom CSS
- **Custom components**: ~40% (app-btn, gr-total-card, bottom-bar, app-sheet, etc.)
- **DaisyUI overrides**: ~30% (customizing DaisyUI components)
- **Tailwind utilities**: ~30% (layout, spacing, typography)

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
**Goal**: Create core CSS framework structure

#### 1.1 CSS Folder Structure
```
css/
├── _variables.css       # CSS custom properties (colors, spacing, typography)
├── _reset.css          # CSS reset/normalize
├── _base.css           # Base element styles (html, body, headings)
├── _utilities.css      # Utility classes (flex, grid, spacing, text)
├── _components.css     # Reusable UI components
├── _layout.css         # Layout-specific styles
├── main.css            # Entry point (imports all above)
```

#### 1.2 Core Variables to Extract
**Colors** (already in :root):
- Primary palette: --gr-accent, --gr-bg, --gr-text, etc.
- Semantic colors: --gr-danger, --gr-success, --gr-warning
- Border colors: --gr-border, --gr-border-strong

**Spacing Scale** (to create):
```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
```

**Typography Scale** (to create):
```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

**Border Radius** (to create):
```css
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-full: 9999px;
```

### Phase 2: Utility System (Week 2-3)
**Goal**: Replace Tailwind utilities with custom utilities

#### 2.1 Layout Utilities (~200 lines)
```css
/* Flexbox */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-1 { flex: 1 1 0%; }
.min-w-0 { min-width: 0; }
.flex-shrink-0 { flex-shrink: 0; }

/* Grid */
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }

/* Positioning */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.inset-0 { inset: 0; }
```

#### 2.2 Spacing Utilities (~100 lines)
```css
/* Padding */
.p-0 { padding: 0; }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.px-3 { padding-left: var(--space-3); padding-right: var(--space-3); }
.py-3 { padding-top: var(--space-3); padding-bottom: var(--space-3); }

/* Margin */
.m-0 { margin: 0; }
.mb-2 { margin-bottom: var(--space-2); }
.mb-3 { margin-bottom: var(--space-3); }
.mb-4 { margin-bottom: var(--space-4); }
.mt-2 { margin-top: var(--space-2); }
.mx-auto { margin-left: auto; margin-right: auto; }
.ml-auto { margin-left: auto; }
```

#### 2.3 Typography Utilities (~80 lines)
```css
.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

#### 2.4 Sizing Utilities (~50 lines)
```css
.w-full { width: 100%; }
.h-full { height: 100%; }
.max-w-\[480px\] { max-width: 480px; }
.h-10 { height: 2.5rem; }
.min-h-0 { min-height: 0; }
```

**Coverage**: ~60% of Tailwind utilities used in project

### Phase 3: Component System (Week 3-4)
**Goal**: Replace DaisyUI components with custom components

#### 3.1 Form Components (~400 lines)

**Button** (already exists as app-btn):
```css
.app-btn { /* existing styles */ }
.app-btn--action { /* primary action */ }
.app-btn--cancel { /* secondary/ghost */ }
.app-btn--danger { /* destructive */ }
.app-btn--tonal { /* subtle */ }
.app-btn--sm { /* size variant */ }
```

**Input** (new):
```css
.app-input {
  display: block;
  width: 100%;
  padding: 0.5rem 0.875rem;
  background: var(--gr-input-bg);
  border: 1px solid var(--gr-border);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--text-base);
  color: var(--gr-text1);
  transition: border-color 0.15s ease;
}

.app-input:focus {
  outline: none;
  border-color: var(--gr-accent);
}

.app-input--bordered {
  border: 1px solid var(--gr-border);
}

.app-input--rounded-full {
  border-radius: var(--radius-full);
}
```

**Select** (new):
```css
.app-select {
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron icon */
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}
```

**Textarea** (new):
```css
.app-textarea {
  min-height: 6rem;
  resize: vertical;
}
```

#### 3.2 Container Components (~300 lines)

**Card** (new):
```css
.app-card {
  background: var(--gr-bg);
  border: 1px solid var(--gr-border);
  border-radius: var(--radius-lg);
  box-shadow: none;
}

.app-card--elevated {
  box-shadow: var(--gr-shadow);
}

.app-card-body {
  padding: var(--space-4);
}
```

**Modal/Dialog** (already exists as app-sheet):
```css
.app-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.app-modal__content {
  position: relative;
  background: var(--gr-bg);
  border-radius: var(--radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}
```

#### 3.3 Feedback Components (~200 lines)

**Badge** (new):
```css
.app-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1.25;
}

.app-badge--primary {
  background: var(--gr-accent-soft);
  color: var(--gr-accent);
}

.app-badge--success {
  background: var(--gr-accent-soft);
  color: var(--gr-accent);
}

.app-badge--error {
  background: var(--gr-danger-soft);
  color: var(--gr-danger);
}
```

**Alert** (new):
```css
.app-alert {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gr-border);
  border-radius: var(--radius-md);
  background: var(--gr-bg-soft);
}
```

**Divider** (new):
```css
.app-divider {
  height: 1px;
  background: var(--gr-border);
  margin: var(--space-4) 0;
}
```

#### 3.4 Navigation Components (~250 lines)

**Dropdown** (already exists as app-dropdown-menu):
```css
.app-dropdown {
  position: relative;
  display: inline-block;
}

.app-dropdown__menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  min-width: 12rem;
  background: var(--gr-bg);
  border: 1px solid var(--gr-border);
  border-radius: var(--radius-md);
  box-shadow: var(--gr-shadow-lg);
  padding: var(--space-2);
}

.app-dropdown__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0;
  background: transparent;
  color: var(--gr-text1);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease;
}

.app-dropdown__item:hover {
  background: var(--gr-row-hover);
}
```

**Bottom Bar** (already exists):
```css
.bottom-bar { /* existing styles */ }
.bottom-bar__item { /* existing styles */ }
.bottom-bar__fab { /* existing styles */ }
```

**Coverage**: ~80% of DaisyUI components used in project

### Phase 4: Advanced Components (Week 4-5)
**Goal**: Replace remaining DaisyUI components

#### 4.1 Selection Components (~150 lines)

**Radio** (new):
```css
.app-radio {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--gr-border);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-radio:checked {
  border-color: var(--gr-accent);
  background: var(--gr-accent);
  box-shadow: inset 0 0 0 3px var(--gr-bg);
}
```

**Toggle/Switch** (new):
```css
.app-toggle {
  appearance: none;
  width: 2.5rem;
  height: 1.5rem;
  background: var(--gr-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  position: relative;
  transition: background-color 0.15s ease;
}

.app-toggle::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--gr-bg);
  border-radius: 50%;
  transition: transform 0.15s ease;
}

.app-toggle:checked {
  background: var(--gr-accent);
}

.app-toggle:checked::after {
  transform: translateX(1rem);
}
```

**Checkbox** (new):
```css
.app-checkbox {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--gr-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-checkbox:checked {
  background: var(--gr-accent);
  border-color: var(--gr-accent);
  /* Add checkmark via background-image or mask */
}
```

#### 4.2 Data Display (~100 lines)

**Table** (new):
```css
.app-table {
  width: 100%;
  border-collapse: collapse;
}

.app-table th,
.app-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--gr-border);
}

.app-table th {
  font-weight: 600;
  color: var(--gr-text-muted);
  background: var(--gr-bg-soft);
}
```

**Coverage**: ~90% of DaisyUI components used in project

### Phase 5: Polish & Optimization (Week 5-6)
**Goal**: Finalize framework and optimize

#### 5.1 Responsive Utilities
```css
@media (max-width: 400px) {
  /* Narrow screen adjustments */
}

@media (min-width: 768px) {
  /* Tablet+ adjustments */
}
```

#### 5.2 Animation Utilities
```css
.transition {
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.transition-transform {
  transition: transform 0.15s ease;
}
```

#### 5.3 Focus States
```css
.focus-visible:focus-visible {
  outline: 2px solid var(--gr-accent);
  outline-offset: 2px;
}
```

## Migration Execution Plan

### Step 1: Create CSS Folder Structure
```bash
mkdir -p css
touch css/_variables.css
touch css/_reset.css
touch css/_base.css
touch css/_utilities.css
touch css/_components.css
touch css/_layout.css
touch css/main.css
```

### Step 2: Extract and Organize Variables
- Move all CSS custom properties from main.css to _variables.css
- Add missing spacing, typography, and radius scales
- Document each variable with comments

### Step 3: Build Utility System
- Create _utilities.css with layout, spacing, typography utilities
- Test each utility class against existing usage
- Ensure 100% compatibility with current Tailwind usage

### Step 4: Build Component System
- Create _components.css with all UI components
- Migrate existing custom components (app-btn, gr-total-card, etc.)
- Add missing components (input, select, textarea, badge, etc.)

### Step 5: Update HTML
- Replace DaisyUI classes with custom classes
- Keep Tailwind CDN for now (gradual migration)
- Test each page thoroughly

### Step 6: Remove Dependencies
- Remove DaisyUI CDN link
- Remove Tailwind CDN script
- Test all functionality
- Optimize CSS (remove unused utilities)

## Coverage Estimate

### What Can Be Custom CSS: ~85-90%

**Fully Replaceable:**
- ✅ Layout utilities (flex, grid) - 100%
- ✅ Spacing utilities (padding, margin) - 100%
- ✅ Typography utilities - 100%
- ✅ Custom components (app-btn, gr-total-card, etc.) - 100%
- ✅ Form components (input, select, textarea) - 100%
- ✅ Container components (card, modal) - 100%
- ✅ Navigation (bottom-bar, dropdown) - 100%
- ✅ Feedback (badge, alert) - 100%

**Partially Replaceable:**
- ⚠️ Complex DaisyUI components (dropdown-content, menu) - 80%
- ⚠️ Radio/Toggle/Checkbox - 90%

### What Should Stay Third-Party: ~10-15%

**Keep External:**
- 🔄 Font Awesome (icons) - No need to reinvent
- 🔄 Google Fonts (Roboto) - Unless you want custom font
- 🔄 Firebase SDK (not CSS, but external dependency)

**Consider Keeping:**
- ⚠️ DaisyUI/Tailwind during transition (gradual migration)
- ⚠️ Some complex utilities (advanced responsive, animations)

## Benefits of Custom CSS Framework

1. **Full Control**: Complete control over design system
2. **Smaller Bundle**: Remove unused DaisyUI/Tailwind code (~300KB → ~50KB)
3. **Faster Loading**: No CDN dependencies, faster parse time
4. **Consistency**: Enforced design tokens and component patterns
5. **Maintainability**: Single source of truth for styles
6. **Performance**: Optimized for mobile, no bloat
7. **Learning**: Better understanding of CSS architecture

## Risks & Mitigation

**Risk 1: Breaking Changes**
- Mitigation: Test each component thoroughly before migration
- Keep old CSS as fallback during transition

**Risk 2: Time Investment**
- Mitigation: Phased approach, 5-6 weeks total
- Prioritize most-used components first

**Risk 3: Missing Features**
- Mitigation: Document all DaisyUI features used
- Build only what you need, not everything

## Next Steps

1. **Review this plan** - Adjust timeline and priorities
2. **Create CSS folder** - Set up directory structure
3. **Start with variables** - Extract and organize CSS custom properties
4. **Build utilities** - Create layout and spacing utilities
5. **Migrate components** - One component at a time
6. **Test thoroughly** - Ensure no visual regressions
7. **Remove dependencies** - Remove DaisyUI/Tailwind when ready

## Questions to Answer

1. **Timeline**: Is 5-6 weeks acceptable, or do you want faster/slower?
2. **Scope**: Should we keep Font Awesome, or replace with SVG icons?
3. **Typography**: Keep Roboto, or choose different font?
4. **Browser Support**: Target modern browsers only, or include older ones?
5. **CSS Methodology**: BEM, utility-first, or hybrid approach?