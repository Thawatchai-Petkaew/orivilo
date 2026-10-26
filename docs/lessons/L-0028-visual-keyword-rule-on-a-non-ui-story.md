---
id: L-0028
date: 2026-10-26
issue: [ORV-20]
what_happened: The recorder's keyword rule marked 11 of slice A's 20 rows visual because they contain "color" or "gap", so QA attached a screenshot of the test runner to a PR that changes no UI file.
cause: The visual rule reads words in the AC Result cell, and a colour-domain story uses those words for data, not for anything rendered.
rule: The recorder applies the visual keyword rule only when the PR diff touches a UI path, and a spec may mark a row `Visual: no` that the recorder honours, so a non-UI story needs no placeholder screenshot.
---

## What happened

The result recorder (`result-recorder.mjs` in the ovl scripts, line 33) defines `VISUAL = /layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position/i`. `.claude/agents/qa.md` step 4 requires a screenshot or a computed style for every row the list makes visual. QA finding QA-4 (Suggestion) on ORV-20-qa-1: 11 of the 20 slice A rows matched, because "color" is the node's domain and "gap" is a field the audit returns. The ORV-20-qa-1 envelope's own fact, checked by `git diff --stat`, says the PR has no UI and no story file.

A screenshot of test output is evidence of the tests, not of a visual property. The rule produced a record that proves nothing. The next colour slice, ORV-125 (swatch sets and the contrast proof), will match the same words.

## Rule

- The recorder treats a row as visual only when the reviewed diff (`git diff --name-only <base>...<head_sha>`) touches a UI path: `apps/web/**`, `packages/design-system/src/**`, `*.stories.tsx` or `*.css`. A spec row can still opt in by saying `Visual: yes`.
- A spec may add `Visual: no` to a row in a story that has UI paths. The recorder honours it, and the reviewer checks that the row renders nothing.
- This edits a guard file, so it needs a builder envelope that names the recorder script and its test, under its own Jira issue. `.claude/agents/qa.md` step 4 changes to match.
- Target: the ovl result recorder script, `.claude/agents/qa.md`.

Status: proposed. The owner declined it on 2026-10-26 (ORV-20 comment 10218); no rule or recorder change was applied
