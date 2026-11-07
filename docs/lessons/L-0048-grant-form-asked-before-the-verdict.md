---
id: L-0048
date: 2026-10-28
issue: [ORV-133]
what_happened: Twice in PR 130 the owner's grant form went out before the verdicts on the last builder head were in; once the owner's click granted nothing and envelope-guard refused the builder until a reviewer verdict (round 7), and once the form described a test-only round that became the List steps build (round 6).
cause: The main session treated a red CI on a builder head as a reason to ask for a round, while the escalation the grant needs is set only by a verdict (reviewer, `security`, `qa`) or a failed gate record, and the form's text was written before the verdicts named the round's work.
rule: A red CI on a builder head after round 2 goes to the reviewer re-check (and `security` when its cases hold) on that head first; the grant form is asked only after every verdict dispatched on that head is in and one requests changes, and its question names those verdict task ids and finding ids.
---

## What happened

Records are under `.orivilo/runs/ORV-133/`; hook decisions are in `.orivilo/heartbeat.jsonl`.

Round 7, head `769f09e`:

- The gate record on `769f09e` passed (`gates/2026-10-28T05:03:39.757Z.json`, `ok: true`); CI run 40635628259 then failed on a test timeout.
- At 05:08:55.789Z the main session asked a question form; the `owner-grant` hook's decision is `block`, and no `owner-grant-*.json` was written. With no verdict on `build-rework-6` and a passing gate record, ORV-133 was not escalated, which is the hook's "is not escalated, so there is nothing to grant" branch (`scripts/ovl/owner-grant.mjs` line 78).
- At 05:09:11.074Z `envelope-guard` blocked an Agent call; `review-code-6` and `security-6` started at 05:09:24Z and 05:09:32Z.
- `review-code-6` requested changes (R4-1, R4-2) at 05:23:29Z; `owner-grant-5.json` was answered at 05:26:32Z; `build-rework-7` started at 05:26:45Z. The owner answered two forms for one round.

Round 6, head `0f32d79`:

- `owner-grant-4.json` was answered at 03:16:54Z. Its question said round 6 "only fixes test files" for the row 6 robots.txt time bound on CI, and would add "this round's review fixes, if any". `security-5` had requested changes at 03:07:00Z (SEC-133-R3-1, Critical); `review-code-5` was still running until 03:21:19Z (R3-1).
- The round it paid for, `build-rework-6` (8,659,283 tokens), built the List steps after `research-parse5-lists-1` and `design-tech-r3-1`: a new bound, not a test-only fix. The owner granted a round described as something else.

Cost: one form the owner answered for nothing, and one grant whose description did not match its round; no task tokens. No `## Expected saving` for that reason.

Related: [[L-0014-qa-walked-a-head-the-recheck-rejected]] (round 1 or more: the re-check goes first), [[L-0017-rework-look-decided-in-text]] (the form shows what is granted).

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 3, after the first paragraph ("When the work stops for the owner, post both reports on the Jira issue, then ask a question form", line 192):

```diff
+Ask the form only after every verdict dispatched on the last builder head is in and one of them
+requests changes, or a gate record on it failed. A red CI on that head is not a verdict: dispatch the
+reviewer re-check (and `security` when its cases hold) on the head first, with the failing CI run id
+as a fact; `owner-grant` writes no grant while the issue is not escalated. The question names the
+verdict task ids and the finding ids the round will fix, and nothing else (L-0048).
```

What proves it was done: every `owner-grant-*.json` after promotion is answered after the `ended_at` of each verdict task on its head, and its question names those task ids; no `owner-grant` heartbeat line with `decision` `block` follows a main-session form.

Status: promoted 2026-10-28, into `.claude/skills/ovl/SKILL.md` (section 3, after the first paragraph and its option list); no hook enforces it
