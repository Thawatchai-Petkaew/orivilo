---
name: discover
description: Turn a request or Jira issue into a spec with testable acceptance criteria and a bundled list of open questions. Use at intake for M and L lane work, or when a requirement changes.
---

# Discover

1. **Research first.** Read the Jira issue, `docs/context/origo-brief.md`, the relevant handoff sections, existing specs in `docs/specs/`, and the code it touches. Search Jira for duplicates.
2. **Gap list.** For each dimension (business, functional, technical, UX, data/security, risk) mark every gap: closed (evidence), assumed (state the default), must-ask (blocker), or not applicable.
3. **Write `docs/specs/<KEY>/spec.md`:**

   ```markdown
   ---
   issue: <KEY>
   lane: S | M | L
   version: 1
   ---

   ## Why

   ## Story

   ## Acceptance criteria

   | # | Given | When | User sees | Data effect |

   ## Rules and bounds

   ## Out of scope

   ## Open questions (option, impact, default)

   ## Depends on (ADRs, decisions, other issues)

   ## Changelog
   ```

4. **Ask once.** Put every must-ask and assumed item in one gate packet. Never ask piecemeal.
5. **Done when** no must-ask gap remains and every criterion is testable.
