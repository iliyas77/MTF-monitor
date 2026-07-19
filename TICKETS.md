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
### [NEW] <Replace this with the Task Title>
**Status:** Todo
**Description:**
<Replace this section with the task description>

---

Implementation Instructions:

First, analyze the existing implementation and identify the root cause. Do not implement a workaround if the underlying issue can be fixed properly.
Strictly follow all existing Antigravity project rules throughout the implementation.
This is a pure HTML, CSS, and JavaScript application. Follow the existing project architecture, coding standards, file structure, and naming conventions.
Use only existing project components and Bootstrap utilities. Do not introduce custom CSS, inline styles, new frameworks, or unnecessary libraries.
Make the smallest safe change required to fully resolve the issue. Reuse existing functions and logic wherever possible.
Ensure the requested task is completed 100% while preserving all existing functionality. Do not introduce regressions or modify unrelated features.
Prevent duplicate database/API calls, duplicate event listeners, race conditions, memory leaks, or unnecessary re-renders as part of the solution.
Maintain an activity log during implementation, including the files modified, changes made, and reasons for each change.
After implementation, run `npm run build` and resolve any build errors before considering the task complete.

In the final response, provide:
1. Root cause identified
2. Summary of the implementation
3. Files modified
4. Activity log
5. Build result
6. Confirmation that existing functionality remains intact
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
| #101 | Fix redundant DB calls on scroll in Positions | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/101) |
| #104 | Redesign the Positions summary section | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/104) |
| #105 | Redesign the Positions summary section | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/105) |
| #106 | Implement Local Caching for Transactions DB | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/106) |
| #107 | Remove pagination limit for Positions/Transactions fetch | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/107) |
| #108 | Redesign the Positions summary section | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/108) |
| #109 | Fix redundant DB calls on scroll in Positions | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/109) |
| #110 | Set up initial HTML structure and core layout | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/110) |
| #111 | Implementation Task: Temporarily Disable Permanent Delete & Batch Delete, Use Soft Delete Everywhere | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/111) |
| #112 | New Ticket | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/112) |
| #115 | Role: Expert Full-Stack Developer & Code Refactoring Specialist | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/115) |
| #116 | Role: Expert Full-Stack Developer & Code Refactoring Specialist | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/116) |
| #119 | Role: Expert Frontend & Architecture Developer | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/119) |
| #120 | Objective | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/120) |
| #121 | Enhance the settings management module | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/121) |
| #122 | Objective | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/122) |
| #123 | Objective | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/123) |
| #124 | Objective | Todo | [Link](https://github.com/iliyas77/MTF-monitor/issues/124) |