# 📋 MTF Monitor Tickets

This file tracks tasks and synchronizes with your GitHub Project: [iliyas77/projects/1](https://github.com/users/iliyas77/projects/1/views/1?template_dialog_tab=featured&layout_template=board).

### 🤖 AI Agent Workflow Instructions (CRITICAL):
1. Whenever the user requests a new ticket (e.g. by mentioning this TICKETS.md file), the AI MUST NOT perform the actual task or modify the codebase. The AI MUST ONLY automatically write the ticket into `ticket.txt` using the `### [NEW]` block format.
2. After writing the ticket to `ticket.txt`, the AI MUST automatically execute `npm run sync` via a terminal command. (The user will approve any network permission popups).
3. The AI MUST NOT leave `ticket.txt` un-synced. The script itself clears `ticket.txt` automatically upon a successful push.
4. After every successful task completion, the AI must append a small Markdown table to its final response summarizing the task status.

## Ticket Creation Template (STRICT FORMAT)

When generating a ticket for `ticket.txt`, the AI MUST use this exact pattern:

```markdown
# Task

<Replace this section with the task description>

---

# Mandatory Implementation Instructions

You are working on a production HTML, CSS, and JavaScript application.

Before making any changes, carefully understand the existing implementation, identify the root cause, and implement the requested task completely without affecting any existing functionality.

## Project Rules (Mandatory)

- Strictly follow all existing Antigravity project rules.
- Follow the existing project architecture, coding style, file structure, and naming conventions.
- Reuse existing code whenever possible.
- Do not introduce unnecessary abstractions, libraries, frameworks, or architectural changes.
- Make the smallest safe change required to solve the problem completely.

## UI & Styling Rules

- This project uses Bootstrap.
- Use Bootstrap utility classes and Bootstrap components only.
- Do NOT create custom CSS.
- Do NOT add inline styles.
- Reuse existing CSS classes whenever possible.
- Maintain the existing responsive behavior and visual consistency.

## Functional Requirements

- Complete the requested task 100%.
- Preserve all existing functionality.
- Do not introduce regressions.
- Avoid duplicate logic.
- Avoid unnecessary database/API calls.
- Prevent race conditions, duplicate event bindings, and memory leaks where applicable.
- Ensure the implementation is optimized, maintainable, and production-ready.

## Before Coding

- Analyze the current implementation.
- Identify the actual root cause.
- Check whether an existing function or utility can be reused before creating new code.
- Modify only the files that are necessary.

## Activity Log (Mandatory)

Maintain an implementation activity log throughout the task.

Include:
- Files modified
- What was changed
- Why the change was required
- Any assumptions made
- Validation performed

## Validation Checklist

Before completing the task, verify:

- The requested task is fully implemented.
- Existing features continue to work correctly.
- No console errors or warnings were introduced.
- No unnecessary database/API requests occur.
- Performance is not degraded.
- Code follows the project's existing standards.

## Build Verification (Mandatory)

After implementation is complete, always run:

npm run build

Resolve every build error before considering the task complete.

## Final Response

Provide:

1. Summary of the implementation.
2. Root cause identified.
3. Files modified.
4. Activity log.
5. Build result.
6. Confirmation that all existing functionality remains intact.
```

---

## 🔄 Synced Tickets (Live on GitHub)
*These tickets have been successfully pushed to your GitHub project.*

| Issue ID | Title | Status | Link |
|----------|-------|--------|------|
<!-- The sync script will automatically populate this table -->

| #92 | Redesign Positions Summary Card | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/92) |
| #93 | Add Trace Toggle to Activity Log Settings | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/93) |
| #95 | Fix redundant DB calls on scroll in Positions | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/95) |
| #96 | Remove pagination limit for Positions/Transactions fetch | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/96) |
| #97 | Implement Local Caching for Transactions DB | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/97) |