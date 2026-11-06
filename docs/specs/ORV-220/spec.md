---
issue: ORV-220 (https://tpetkaew.atlassian.net/browse/ORV-220)
lane: S, as the envelope sets it (Jira not read in this role). No risk flag applies: no prop, token, schema, resolver, auth or data access change
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-220: a second Copy press always reaches the status region

## Goal

A second Copy press on a CanvasChat reply is always written to the polite status region as a change, on CI as on a Mac.

Why: a person using a screen reader hears the result of a press only when the region changes. ORV-217 closed that gap for a repeat press and added the story `CopyAnnouncesEachPress` to guard it (L-0052). That guard is only worth its place if a red run means the defect. The evidence so far is the four CI runs in ORV-220 comment 10564.

What is simulated: the story stubs `navigator.clipboard`, as every ORV-217 copy play does. The CPU throttle stands in for a loaded CI runner. It is not the CI runner, and the PR says so beside its counts.

## Story

As a person using a screen reader, when I press "คัดลอก" twice, I hear the result both times, whatever machine the build was proven on.

## Lead, not proven

ORV-220 comment 10564 points at `CanvasChat.tsx` lines 450 to 453: the region is emptied, then written one animation frame later. Nothing below is measured, and row 1 decides it.

- One reading of those lines, from the code alone: the result arrives in a promise callback (line 465), so the empty text waits for a React render. If the frame fires first, both updates land in one render, the new text equals the old, and React writes nothing. Before the first press the region still holds `chat.streaming` (line 357; a finished reply does not clear it), so the first press is a change either way and only the second goes silent (W1).
- The test side is open too: the write may land, later than the play's `waitFor` allows on a slow runner.

This spec picks neither, and it does not name a fix.

## Rules

### repeat-write-1

A settled Copy press writes its result words to the chat's status region as a DOM change, also when those words equal the words already there: a second copy with the same result, and a retry after a failure. The measure is the MutationObserver record of `CopyAnnouncesEachPress` (`CanvasChat.stories.tsx` lines 1669 to 1704): the count of those words in the record rises by one per settled press (W1). ORV-217 has no rule for the repeat (L-0052), so this is its home. What the region says, and when, stays with `copy-status-1`.

### no-blind-fix-1

No `retry`, no raised `testTimeout` or `waitFor` limit and no fixed sleep, unless a measured time backs it: the time taken in a throttled run, quoted with its run id (L-0046, `.claude/rules/testing.md`). The play's count checks stay as strict as they are.

### loop-count-1

The loop runs `CopyAnnouncesEachPress` alone, never the full suite (L-0009), 50 times under a CPU throttle, once on the branch point 3291b85 (before) and once on the PR head (after), with the same machine, rate and command. The count is red runs of 50. It adds to the `--repeats 4` run of `testing.md`; it does not replace it.

The row passes at 0 of 50 after, with at least 5 of 50 before, so a clean after is not luck (W2). Below 5 before, the loop has not reproduced the fault: raise the rate, restart both counts and report each rate tried. If no rate reaches 5, the builder returns `blocked` and no fix lands.

The PR body quotes both counts with the rate, the machine and the command. The loop script stays out of the PR.

## Acceptance criteria

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The four CI runs of ORV-220 comment 10564 and the lead above | The builder records the order of the region writes in one red run and one green run of `CopyAnnouncesEachPress` | Nothing on screen | None. The PR body names the cause in one sentence, shows the two records, ties them to the play step the CI runs failed at, and says whether the lead held. A lead that did not hold is recorded as dropped, with the record that rules it out | Reviewer reads the PR body |
| 2 | The cause of row 1 | The fix lands where the evidence points: the component if the region is not written, the test if it is written and the play misses it | Nothing on screen changes. On the second press a screen reader hears "คัดลอกคำตอบแล้ว" / "Reply copied" again, and on a retry "คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง" / "Could not copy. Select the text and copy it yourself" again | `repeat-write-1` and `no-blind-fix-1` hold. The play goes red on a build that sets the same text with no reset, the L-0052 defect, seen once and restored | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/canvas-chat`; the red line quoted in the builder's report |
| 3 | `CopyAnnouncesEachPress` under a CPU throttle | The loop of `loop-count-1` runs before and after the fix | Nothing on screen | None. Both counts are quoted in the PR and meet `loop-count-1` | Reviewer reads the PR body. The PR's CI run is green; one green run alone proves nothing for a fault that comes and goes |
| 4 | The PR head | `git diff origin/develop...HEAD -- docs/specs/ORV-217/spec.md packages/design-system/src/i18n/messages/th.ts packages/design-system/src/i18n/messages/en.ts` | Nothing on screen | The diff is empty: `copy-status-1` stays as written, and `chat.copied` and `chat.copyFailed` keep their words. The chat gains no second live region. `CopyReply`, `CopyPending` and `CopyFailed` pass unchanged | The command above, and the suite of row 2 |

## Rows that render nothing

- Rows: 1, 2, 3, 4

## Rows per PR

One PR is expected for all rows. The main session adds the PR line once the PR exists, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line.

- PR 197: rows 1-4

## Out of scope

- Any change to `copy-status-1`, the copy notes, `COPIED_MS` or the look of the chat.
- Repeats of other words in the region (`chat.placed`, `chat.stopped`, `chat.failed`).
- Other flaky stories, and any change to the Storybook test project's limits.
- A committed throttle harness or a new CI job.
- The proposed L-0052 rule line for `.claude/agents/product.md`.

## Open questions (each with a default)

<!-- prettier-ignore -->
| Question | Options | Default |
| --- | --- | --- |
| How the throttle is applied | Chrome DevTools Protocol `Emulation.setCPUThrottlingRate`; load on the whole machine | The protocol call, at rate 8, the Mac to CI ratio `testing.md` records, raised as `loop-count-1` says |
| Where the loop runs | The builder's Mac; a one-off CI job | The builder's Mac, since a Mac with a throttle is what the proxy line in "Goal" names |
| The floor on the before count | Any red run; a set floor | The floor in `loop-count-1`, set by this spec and not by the card; W2 shows why |

## Depends on

- `docs/specs/ORV-217/spec.md`, rule `copy-status-1`.
- ORV-220 comment 10564 (the card, the four CI runs, the lead), not read in this role: the envelope carries it as a fact.
- `docs/lessons/L-0052-status-ac-had-no-repeat-row.md`; L-0009 and L-0046 through `.claude/rules/testing.md`.
- `packages/design-system/src/components/canvas-chat/CanvasChat.tsx` and `CanvasChat.stories.tsx`.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The count of `repeat-write-1`. Input: `chat.copied` (`th.ts` line 102), the `times` filter of the story (line 1678), and two records of two presses after the region held `chat.streaming`: both presses written, then the second press folded as the lead reads it (a shape, not a recording). Expected output: `2 true` then `1 false` (count, and whether the play's `times(c.copied)` of 2 is met). Integers, no rounding.

```bash
node -e 'const C="คัดลอกคำตอบแล้ว";const times=(seen,t)=>seen.filter(x=>x===t).length;for(const seen of [["",C,"",C],["",C]]){const n=times(seen,C);console.log(n,n===2)}'
```

W2. The floor of `loop-count-1`. Input: 50 runs, before counts of 1 and 5. The output is the chance in percent that a change with no effect still shows 0 of 50 after, when each run goes red at the before rate. Expected output: `1 36.4` then `5 0.5`. Rounded to one decimal.

```bash
node -e 'for(const r of [1,5])console.log(r,((1-r/50)**50*100).toFixed(1))'
```

## Changelog

- v1.1 (2026-11-06): the line for PR 197 under "Rows per PR". No requirement changed.
- v1.0 (2026-11-06): first version, from the ORV-220 envelope. Downstream to review: the builder envelope (rows 1 to 4, the three open question defaults), the reviewer envelope (the PR body of rows 1 and 3), the PR line under "Rows per PR".
