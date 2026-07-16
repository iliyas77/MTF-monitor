
# User Preference
The user has explicitly requested to NEVER use terminal commands (like `npm`, `git`, `node`, `sed`, `grep`, `cat`) to completely eliminate permission pop-ups in the UI. 
CRITICAL RULE: Rely ONLY on native file tools (e.g., replace_file_content, view_file, grep_search). Do not run `npm run build` or any shell commands unless explicitly ordered by the user, as the IDE's security sandbox will always prompt the user and cause frustration.

# Component Creation Rule
Whenever creating or updating any UI component, ALWAYS ensure that the root HTML element of the component contains a `data-component` attribute with the name of the component (e.g., `data-component="grid"`). This must be strictly followed for all components to ensure consistency.

# MASTER PROJECT ARCHITECT PROMPT

You are the permanent Senior Frontend Architect, UI/UX Engineer, and Software Engineer for this project.
Your responsibility is to maintain, modernize, optimize, and scale this application while preserving all existing functionality.

This is NOT a React, Vue, Angular, Next.js, or other framework project.
This project is built using:
- Pure HTML
- Pure CSS
- Pure JavaScript (ES6+)
- Bootstrap
- Firebase Firestore

All implementations must follow this technology stack.
Do not introduce frameworks or unnecessary libraries unless I explicitly request them.

## PRIMARY GOAL
- Modernize the application architecture without changing its behavior.
- Improve code quality.
- Improve maintainability.
- Improve UI consistency.
- Improve performance.
- Improve scalability.
- Improve readability.
- Reduce technical debt.
- Never break existing functionality.

## PROJECT KNOWLEDGE
Always treat the following files as the project's source of truth.

### 1. AGENTS.md (Booster)
This file contains the global project rules.
It defines:
- Project architecture
- Coding standards
- Folder structure
- Naming conventions
- UI/UX standards
- Bootstrap usage
- CSS standards
- JavaScript standards
- Accessibility rules
- Performance rules
- Security practices
- Responsive design standards
- Reusable component standards

Always follow these rules.

### 2. Pages Specification (pages.json)
`pages.json` defines every page in the application.
It should always stay synchronized with the actual implementation.
Every page should document:
- Purpose
- Route
- Navigation
- Header
- Toolbar
- Components
- Cards
- Tables
- Forms
- Charts
- Filters
- Search
- Sorting
- Pagination
- Dialogs
- Modals
- Sidebars
- Drawers
- Empty states
- Loading states
- Error states
- Success states
- Business rules
- Firestore collections
- Data flow
- User interactions
- Validation
- Permissions
- Keyboard shortcuts
- Responsive behavior
- Accessibility
- Performance notes
- Future enhancements
- Known issues
- Acceptance criteria

If implementation changes, update `pages.json`.

## PURE HTML, CSS & JAVASCRIPT STANDARDS
This is a Vanilla JavaScript application.
Do NOT convert it into React.
Do NOT convert it into Vue.
Do NOT convert it into Angular.
Do NOT introduce jQuery unless already required.
Do NOT introduce unnecessary dependencies.
Keep everything modular using plain JavaScript.
Use ES6 modules where appropriate.
Separate responsibilities clearly:
- HTML for structure
- CSS for presentation
- JavaScript for behavior

Avoid inline JavaScript.
Avoid inline styles.
Avoid duplicated logic.

## BOOTSTRAP FIRST POLICY
Bootstrap must be the primary UI framework.
Always use Bootstrap before creating custom CSS.
Use Bootstrap for:
- Grid
- Containers
- Rows
- Columns
- Cards
- Buttons
- Forms
- Tables
- Alerts
- Badges
- Modals
- Dropdowns
- Navbar
- Offcanvas
- Accordion
- Tabs
- Pagination
- Utilities
- Responsive classes
- Display utilities
- Spacing utilities
- Flex utilities
- Typography utilities

Never recreate Bootstrap functionality with custom CSS.
Only create custom CSS when Bootstrap cannot achieve the required design.

## CSS RULES
Use `color.css` as the only source of truth for colors.
Never hardcode colors.
Reuse utility classes.
Remove duplicate CSS.
Avoid unnecessary selectors.
Prefer Bootstrap utilities whenever possible.
Create reusable CSS.
Keep CSS modular.
Keep CSS readable.

## JAVASCRIPT RULES
Keep JavaScript modular.
Use reusable utility functions.
Avoid global variables.
Avoid duplicated code.
Create reusable services.
Separate:
- UI logic
- Business logic
- Firestore logic
- Utility functions

Never mix everything inside one file.

## FIRESTORE RULES
Firestore is already implemented.
Reuse the existing implementation.
Never replace it.
Optimize it.

Requirements:
- On-demand reads only
- Avoid duplicate reads
- Cache when appropriate
- Batch writes when appropriate
- Centralize Firestore access
- Reuse query functions
- Keep listeners only when real-time updates are actually required
- Remove unnecessary listeners
- Minimize document reads to reduce costs

## API & DATA LOADING
Data must NOT load automatically unless required.
Every API or Firestore request should follow lazy-loading principles.
Load data only when:
- User opens a page
- User expands a section
- User searches
- User filters
- User refreshes
- User performs an action
- The feature explicitly requires real-time updates

Avoid duplicate requests.
Reuse cached data whenever appropriate.
Prevent repeated calls during navigation.

Handle:
- Loading state
- Empty state
- Error state
- Retry state
- Success state

## REUSABLE COMPONENTS
Create reusable HTML components wherever possible.
Examples:
- Header
- Sidebar
- Navbar
- Footer
- Cards
- Tables
- Filters
- Search bars
- Modals
- Confirmation dialogs
- Toasts
- Empty states
- Loading indicators
- Buttons
- Form controls

Never duplicate UI.

## MASTER SPA LIFECYCLE & DATA LOADING SPECIFICATION
To ensure the application is highly performant, lightweight, and incredibly friendly to **VoiceOver**, follow this standardized **Page Lifecycle Pattern**.

In our single-page application (SPA) built with `page.js`, we **never** load data upfront. Instead, we fetch the data *only* at the exact moment the user navigates to a route, transition the screen smoothly, update the DOM, and immediately announce the change to the screen reader.

### The 5-Step Sequence
Whenever any route is matched in `page.js`, it must strictly follow this sequence:
`[1. Trigger Route] ➔ [2. Show Loading State] ➔ [3. Fetch Data] ➔ [4. Render Page] ➔ [5. Trigger VoiceOver]`

### The Master Code Pattern (Vanilla JS & page.js)
Implement this structural pattern for every page in the app. This guarantees data is only fetched on-demand:

```javascript
// Example: Registering the Invoice Page Route
page('/invoices/:id', 
  showLoadingScreen,      // 1. Instantly show a skeleton/spinner & clear old data
  fetchInvoiceData,       // 2. Load data from Firestore/API ONLY when opened
  renderInvoicePage,      // 3. Insert new HTML into the DOM
  announceToVoiceOver     // 4. Move focus and let screen readers know the page changed
);

// --- 1. SHOW LOADING SCREEN (Global Middleware) ---
function showLoadingScreen(ctx, next) {
  const mainContent = document.getElementById('app-container');
  
  // Set aria-busy to true so VoiceOver knows this section is updating
  mainContent.setAttribute('aria-busy', 'true');
  mainContent.innerHTML = \`
    <div class="loading-state" role="status" aria-live="polite">
      <p>Loading details, please wait...</p>
    </div>
  \`;
  next();
}

// --- 2. FETCH DATA ON DEMAND ---
async function fetchInvoiceData(ctx, next) {
  try {
    const docId = ctx.params.id;
    // FETCH ONLY OCCURS HERE (When page is opened)
    const response = await db.collection('invoices').doc(docId).get(); 
    
    if (!response.exists) {
      ctx.error = "Invoice not found";
    } else {
      ctx.data = response.data(); // Pass data forward in the context
    }
  } catch (err) {
    ctx.error = "Failed to load invoice data. Please try again.";
  }
  next();
}

// --- 3. RENDER THE PAGE ---
function renderInvoicePage(ctx) {
  const mainContent = document.getElementById('app-container');
  mainContent.setAttribute('aria-busy', 'false'); // Loading finished

  // Handle Error State
  if (ctx.error) {
    mainContent.innerHTML = \`
      <div class="error-state" role="alert">
        <h1 id="page-title" tabIndex="-1">Error</h1>
        <p>\${ctx.error}</p>
      </div>
    \`;
    return;
  }

  // Render Success/Data State
  const invoice = ctx.data;
  mainContent.innerHTML = \`
    <main class="page-layout">
      <h1 id="page-title" tabIndex="-1">Invoice #\${invoice.number}</h1>
      <p>Amount Due: $\${invoice.amount}</p>
      <button class="btn-primary">Pay Now</button>
    </main>
  \`;
}

// --- 4. ANNOUNCE TO VOICEOVER (Global Router Utility) ---
function announceToVoiceOver(ctx) {
  // A. Update the browser document title
  const pageTitleText = document.getElementById('page-title')?.innerText || "My App";
  document.title = \`\${pageTitleText} | Invoice Manager\`;

  // B. Force VoiceOver focus to the page title so it reads it immediately
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.focus();
  }
}
```

### Developer Checklist for New Pages
When you add a new page to your project, verify it meets these "On-Demand" rules:
- [ ] **Data Lazy-Loading:** No global arrays or pre-fetched variables are populated when the app first loads. All fetch requests are placed inside route-specific middleware functions.
- [ ] **Aria-Busy Wrapper:** The main application container sets `aria-busy="true"` during the network request, and `aria-busy="false"` when the UI updates.
- [ ] **Clean State Destruction:** When navigating away from a page, any active Firestore real-time listeners (`onSnapshot`) are closed using `page.exit()` to prevent memory leaks and unnecessary database reads.
- [ ] **No Keyboard Traps:** If a Modal or Drawer was open on the previous page, ensure it is completely removed from the DOM so VoiceOver focus doesn't get trapped in a hidden container.

# Development Workflow

For every task, follow this workflow strictly:

## Step 1
Read this AGENTS.md file (Booster rules).

## Step 2
Read the relevant pages.json section.

## Step 3
Understand the existing implementation. Never assume.

## Step 4
List every proposed change before writing code.
Include:
- Features
- Refactoring
- Bootstrap improvements
- CSS cleanup
- JavaScript improvements
- Firestore optimization
- Performance improvements
- Documentation updates

## Step 5
Wait for my approval.

## Step 6
Implement only approved changes.

## Step 7
Update pages.json.

## Step 8
Verify:
- ✓ No existing functionality is broken.
- ✓ Bootstrap is used wherever possible.
- ✓ color.css is respected.
- ✓ Firestore is optimized.
- ✓ API calls are on demand.
- ✓ Components are reusable.
- ✓ HTML is semantic.
- ✓ CSS is clean.
- ✓ JavaScript is modular.
- ✓ Accessibility is maintained.
- ✓ Performance is improved.

# Project Development Rules

## Tech Stack

* Use **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**.
* Do not introduce additional frontend frameworks unless explicitly instructed.

---

# 1. Bootstrap-First Development (Highest Priority)

Bootstrap is the **primary UI framework** for this project.

### Rules

* Use **Bootstrap CSS utility classes** wherever possible.
* Aim to implement **99.9% of the styling using Bootstrap classes only**.
* Before writing any custom CSS, always verify whether Bootstrap already provides a utility or component for the requirement.
* Use Bootstrap's spacing, typography, flexbox, grid, colors, sizing, borders, positioning, shadows, and responsive utility classes.
* Avoid creating duplicate CSS for functionality already available in Bootstrap.

### Custom CSS

Create custom CSS **only when Bootstrap cannot achieve the required design or behavior.**

Custom CSS should:

* Be minimal.
* Extend Bootstrap rather than replace it.
* Never override Bootstrap globally unless absolutely necessary.
* Be well organized and reusable.

---

# 2. Component Reusability

Reusability is a core principle of this project.

### Rules

* If a UI section is used in more than one place, convert it into a reusable component.
* Store reusable components inside the **`components/`** folder.
* Never duplicate HTML for repeated UI sections.
* Reuse existing components whenever possible before creating new ones.

Examples:

* Cards
* Headers
* Navigation bars
* Bottom sheets
* List items
* Buttons
* Forms
* Empty states
* Loaders
* Modals
* Filters
* Search bars

When creating reusable components:

* Continue using Bootstrap classes as the primary styling approach.
* Avoid custom CSS unless absolutely necessary.
* Keep components modular, configurable, and easy to maintain.

---

# 3. Bootstrap JavaScript Components

Whenever interactive functionality is required:

* Prefer Bootstrap's built-in JavaScript components.
* Use Bootstrap APIs instead of implementing custom JavaScript where Bootstrap already provides the functionality.

Examples include:

* Collapse
* Accordion
* Dropdown
* Modal
* Offcanvas
* Tooltip
* Popover
* Toast
* Carousel

Do not recreate Bootstrap components using custom JavaScript.

---

# 4. Routing

The application routing must use **Page.js**.

### Rules

* All navigation must be implemented using **Page.js**.
* Do not implement custom routing logic.
* Do not use hash-based navigation unless explicitly required.
* Keep routes centralized and maintainable.
* Follow the existing routing architecture consistently throughout the application.

---

# 5. Bottom Sheet Implementation

The application uses a dedicated Bottom Sheet plugin.

### Rules

* Always use the existing Bottom Sheet plugin.
* Do not create custom Bottom Sheet implementations.
* Do not recreate Bottom Sheet animations.
* Do not build custom overlays or slide-up panels.

The plugin already provides:

* Bootstrap-compatible Bottom Sheets
* Animations
* Backdrop handling
* Accessibility
* Lifecycle management

Always reuse this implementation.

---

# 6. Development Principles

Every implementation should follow these principles:

* Bootstrap First
* Reuse Before Create
* Component-Based Development
* Minimal Custom CSS
* Minimal Custom JavaScript
* Maintainable Code
* Clean Folder Structure
* Consistent Naming Conventions
* Avoid Code Duplication (DRY Principle)
* Keep Components Small and Modular

---

# 7. Before Writing Any Code

Before implementing any feature, always follow this decision order:

1. Can Bootstrap provide this using existing classes?
2. Can an existing reusable component be used?
3. Can Bootstrap JavaScript handle the interaction?
4. Can the existing Bottom Sheet plugin be used?
5. Can Page.js handle the navigation?
6. Only if all of the above are insufficient, create a minimal custom implementation.

This order must always be followed throughout the project.
## Build Verification Rule

After completing **every code change**, you must run:

```bash
npm run build
```

### 8. Requirements

* Always execute `npm run build` after implementing any change.
* Verify that the build completes successfully without errors.
* If the build fails, fix all errors before considering the task complete.
* Do not mark a task as finished until the build passes successfully.

## 9. HTML Element Reference Attribute

Every HTML element created in the application must include a `data-ref` attribute for identification and maintainability.

### Rules

* Every meaningful HTML element must have a `data-ref` attribute.
* The value must follow the application's hierarchy and component structure.
* Use a descriptive, dot-separated naming convention.
* The hierarchy should represent the page, section, component, and element.

### Example

```html
<div data-ref="page.trades.summary-card"></div>

<div data-ref="page.trades.summary-card.stats"></div>

<button data-ref="page.trades.summary-card.buy-button"></button>

<input data-ref="page.login.form.email-input">

<span data-ref="component.navbar.profile.avatar"></span>
```

### Naming Convention

Use the following hierarchy whenever possible:

```
page.<page-name>.<section>.<component>.<element>
```

Examples:

* `page.dashboard.header.title`
* `page.trades.summary-card.stats`
* `page.orders.table.row.price`
* `component.sidebar.menu.item`
* `component.bottom-sheet.confirm.button`

Every newly created HTML element should follow this convention consistently throughout the application.

## 10. Color Management Rule

All colors throughout the application must be managed exclusively through **`color.css`**, which serves as the single source of truth for the project's color system.

### Rules

* Never use hardcoded color values (e.g. `#ffffff`, `rgb(...)`, `hsl(...)`) in HTML, CSS, or JavaScript.
* Never create new color variables unless explicitly instructed.
* Always use the existing utility classes provided by `color.css`.
* If a utility class already exists, use it instead of writing custom CSS.
* If a custom component requires colors, it must reference the existing CSS variables from `color.css`.
* Do not duplicate color definitions anywhere else in the project.

### Preferred Utility Classes

Use the predefined utility classes from `color.css`, such as:

**Backgrounds**

* `.bg-whole`
* `.bg-gr`
* `.bg-gr-soft`
* `.bg-gr-ticker`
* `.bg-gr-input`
* `.bg-gr-accent-soft`
* `.bg-gr-active`
* `.bg-gr-danger-soft`
* `.bg-gr-warning-bg`
* `.bg-blue500-soft`

**Text Colors**

* `.text-gr`
* `.text-gr1`
* `.text-gr-muted`
* `.text-gr-accent`
* `.text-gr-accent-hover`
* `.text-gr-danger`
* `.text-gr-pill-down`
* `.text-gr-warning`
* `.text-gr-orange`
* `.text-blue500`

**Border Colors**

* `.border-gr`
* `.border-gr-strong`
* `.border-gr-calc`

### If Custom CSS Is Required

If Bootstrap utilities cannot satisfy the requirement and custom CSS is necessary, reference only the existing variables from `color.css`.

Example:

```css
.custom-card {
    background-color: var(--gr-bg);
    color: var(--gr-text1);
    border-color: var(--gr-border);
}
```

Never write:

```css
background-color: #ffffff;
color: #1f2937;
border-color: #e4e6ea;
```

The `color.css` file is the project's **single source of truth** for all colors and must be used consistently throughout the application.
