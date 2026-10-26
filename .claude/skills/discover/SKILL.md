---
name: discover
description: Turn a request or Jira issue into a spec with testable acceptance criteria and a bundled list of open questions. Use at intake for M and L lane work, or when a requirement changes.
---

# Discover

1. **Research first.** Read the Jira issue, `docs/context/orivilo-brief.md`, the relevant handoff sections, existing specs in `docs/specs/`, and the code it touches. Search Jira for duplicates.
2. **Gap list.** For each dimension (business, functional, technical, UX, data/security, risk) mark every gap: closed (evidence), assumed (state the default), must-ask (blocker), or not applicable.
   When the aim is coverage of a set (categories, touchpoints, sections, rules), the first gap to
   close is the structure: the standard or source that defines the whole set, its count per level on
   one base, what is excluded and why, and the data source that orders members inside a level. The
   spec opens with that structure, then the method, then priorities; a named member appears only as an
   example of a data row, never as a pick (L-0036). No hook checks this.
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
