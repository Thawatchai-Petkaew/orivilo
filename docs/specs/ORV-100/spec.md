---
issue: ORV-100 (ORV-45 part 2, draft key E4-5; https://tpetkaew.atlassian.net/browse/ORV-100)
lane: L (risk flag: component public API)
version: 1.2
---

## Why

ADR 0004 has the canvas run generation jobs and keep a history of them at the bottom of the board, with a jump from each job to the node it made. ORV-45 part 1 shipped the base parts this needs (Toast, Progress, Tag). Part 2 adds the bar itself, so that a person can see at a glance what the Studio is doing, why a job failed, and try it again in one step, without searching the board.

This is a design-system component only. No job runner exists yet: the bar takes its jobs from a prop, and every job it shows is labelled as worked out by rules or as mock data (AGENTS.md rule 4). Nothing on the bar claims that AI generated anything.

Not a guard spec; the guard frame (L-0012) does not apply.

## Decisions this spec relies on

- ADR 0003: Storybook is the catalog's visual half; behaviour from `radix-ui`, no shadcn visual classes.
- ADR 0004: the canvas is the Studio's main surface; a bottom task bar keeps generation history and jumps to the asset (`docs/context/canvas-node-study.md`).
- ADR 0009: generation runs on pinned models server-side. That is a later story; here jobs come from a prop.
- ADR 0012: lane L, G1 and G2 passed by Claude under the owner's POC delegation, G3 with evidence.
- `docs/specs/ORV-45/spec.md` v1: part 1 (Progress, Toast, Tag) and the parts table that plans TaskBar as part 2.
- Catalog entry `packages/design-system/catalog/application/task-bar.yaml` (status `planned`): states `empty, running, failed, done, collapsed`; rules "A failed job says why and offers retry" and "Jump pans and zooms to the node and selects it"; a11y "Job status in a live region; the list is keyboard navigable".
- `DESIGN.md` §7 (state completeness), §8 (colour roles), §9 (anti-patterns, item 11 fake evidence), §10 (writing), §11 (design gate).

## Story

As a Studio user working on the board, I want a bar that lists the jobs I started, shows how far each one has got, says plainly why one failed and lets me retry it or go to its node, so that I always know what the Studio is doing and never lose a result on a large board.

## Public API sketch (new contract, impact below)

```ts
export type TaskJobState = "queued" | "running" | "done" | "failed";
/** Where the job's outcome comes from today. A later story adds a real source with its adapter. */
export type TaskJobBasis = "rules" | "mock";

interface TaskJobBase {
  id: string;
  /** Visible job name, from the host's locale catalog. */
  name: string;
  basis: TaskJobBasis;
  /** The node the job made or works on; the jump appears only when it is on the board. */
  nodeId?: string | undefined;
}
export type TaskJob =
  | (TaskJobBase & { state: "queued" })
  | (TaskJobBase & { state: "running"; value?: number | undefined; max?: number | undefined })
  | (TaskJobBase & { state: "done" })
  | (TaskJobBase & { state: "failed"; reason: string });

export interface TaskBarProps {
  /** Jobs in the order to show them; the host owns order (newest first by convention). */
  jobs: readonly TaskJob[];
  /** Shown on failed jobs when given. The host moves the job back to queued. */
  onRetry?: ((jobId: string) => void) | undefined;
  expanded?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
  className?: string | undefined;
}
```

The component stores no job data. A failed job without a `reason` does not type-check. Exact names may change in G2 design; a change after G2 bumps this spec.

## States

| State     | What the bar shows                                                                             | Story             |
| --------- | ---------------------------------------------------------------------------------------------- | ----------------- |
| empty     | Collapsed by default; expanded it shows the empty text                                         | `Empty`           |
| collapsed | One line: the region name, the count summary, the show button                                  | `Collapsed`       |
| queued    | Row with name, basis label and the word "รอคิว" / "Queued" with a mark                         | `Queued`          |
| running   | Row with `Progress`: percent when the length is known, "กำลังทำงาน" / "Working" when it is not | `Running`         |
| done      | Row with a check mark and "เสร็จแล้ว" / "Done", plus the jump when the node is on the board    | `Done`            |
| failed    | Row with a warning mark, "ไม่สำเร็จ" / "Failed", the reason in full and the retry button       | `Failed`          |
| mixed     | Every state at once, long Thai name, 360 px                                                    | `Mixed`, `Narrow` |
| on board  | The bar on a `CanvasBoard` with the jump working (slice B)                                     | `OnBoard`         |

## Acceptance criteria

Slice A is the bar on its own; slice B is the jump inside the board. Each slice is one PR.

| #   | Slice | Given                                                  | When                                                                                      | User sees                                                                                                                                                                                                                                                                                                                                                                                       | Data effect                                                         |
| --- | ----- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | A     | `jobs` is empty                                        | The bar renders                                                                           | It is collapsed: a region named "งาน" / "Jobs" with the text "ยังไม่มีงาน" / "No jobs yet" and a button "แสดงงาน" / "Show jobs". Expanded, it says "ยังไม่มีงาน งานที่เริ่มบนบอร์ดจะแสดงที่นี่" / "No jobs yet. Jobs you start on the board show up here"                                                                                                                                       | None                                                                |
| 2   | A     | Jobs in several states                                 | The bar is collapsed                                                                      | The summary lists only non-zero counts in the order queued, running, failed, done: "รอคิว {count} งาน" / "{count} queued", "กำลังทำ {count} งาน" / "{count} running", "ไม่สำเร็จ {count} งาน" / "{count} failed", "เสร็จแล้ว {count} งาน" / "{count} done", joined by a comma                                                                                                                   | None                                                                |
| 3   | A     | The bar is collapsed or expanded                       | Pressing the toggle (click, Enter, Space)                                                 | It expands or collapses; the button reads "แสดงงาน" / "Show jobs" or "ซ่อนงาน" / "Hide jobs" and carries `aria-expanded` and `aria-controls`; focus stays on the button; `onExpandedChange` fires; controlled `expanded` wins over local state                                                                                                                                                  | None                                                                |
| 4   | A     | A queued job                                           | Expanded                                                                                  | Its row shows the name, the basis label and "รอคิว" / "Queued" with a mark; no progress bar                                                                                                                                                                                                                                                                                                     | None                                                                |
| 5   | A     | A running job with `value` (and optional `max`)        | Expanded                                                                                  | Its row has a `Progress` labelled by the job name, with `aria-valuenow` and the percent as text ("40%"), clamped to 0 to max                                                                                                                                                                                                                                                                    | None                                                                |
| 6   | A     | A running job without `value`                          | Expanded                                                                                  | `Progress` is indeterminate with "กำลังทำงาน" / "Working"; static under reduced motion                                                                                                                                                                                                                                                                                                          | None                                                                |
| 7   | A     | A done job                                             | Expanded                                                                                  | A check mark and "เสร็จแล้ว" / "Done"; colour never carries the state alone                                                                                                                                                                                                                                                                                                                     | None                                                                |
| 8   | A     | A failed job with `reason` and `onRetry`               | Expanded                                                                                  | A warning mark, "ไม่สำเร็จ" / "Failed", the reason wrapped in full (never truncated), and a button with text "ลองอีกครั้ง" / "Retry" and name "ลองอีกครั้ง {name}" / "Retry {name}"; without `onRetry` there is no button                                                                                                                                                                       | None                                                                |
| 9   | A     | The retry button                                       | Pressing it                                                                               | `onRetry(jobId)` fires once; the button shows `Button loading` with `aria-disabled` until that job's `state` or `reason` changes, so a second press does nothing                                                                                                                                                                                                                                | Host callback only; the bar changes no job                          |
| 10  | A     | Any job                                                | Expanded                                                                                  | A small label says where its result comes from: `rules` shows "ตามกฎ" / "By rules", `mock` shows "ข้อมูลจำลอง" / "Mock data". No row says AI                                                                                                                                                                                                                                                    | None                                                                |
| 11  | A     | A job's state changes between renders                  | The new `jobs` prop arrives                                                               | One polite live region in the bar announces "{name}: {state}" with the state word ("รอคิว", "กำลังทำงาน", "เสร็จแล้ว", "ไม่สำเร็จ" / "Queued", "Working", "Done", "Failed"); the first render announces nothing; a running job's percent is not announced on every change                                                                                                                       | None                                                                |
| 12  | A     | The expanded list                                      | Moving by keyboard                                                                        | The list is a `ul` of rows in prop order; Tab reaches the toggle, then the named list region ("รายการงาน" / "Job list"), then each row's jump and retry buttons in order; focus-visible is the `focus.ring` and differs from any selected look; more rows than fit scroll inside the bar                                                                                                        | None                                                                |
| 13  | A     | A long Thai job name without spaces, at 360 px         | Rendering                                                                                 | The name truncates on one line with the full name in `title`; status, reason and buttons wrap below; nothing clips or overflows                                                                                                                                                                                                                                                                 | None                                                                |
| 14  | B     | A job whose `nodeId` is on the board                   | Pressing "ไปที่โหนด" / "Go to node" (name "ไปที่โหนดของ {name}" / "Go to node of {name}") | The board pans and zooms to the node, the node is selected and focused, and the board announces "ไปที่ {title}" / "Jumped to {title}" (existing `board.jumped`)                                                                                                                                                                                                                                 | Board selection becomes that node                                   |
| 15  | B     | A job with no `nodeId`, or a `nodeId` not on the board | Rendering                                                                                 | No jump button on that row                                                                                                                                                                                                                                                                                                                                                                      | None                                                                |
| 16  | A, B  | Every story                                            | Storybook                                                                                 | Stories `application/TaskBar` (id `application-task-bar`) cover every state above with play tests, light and dark, under neutral, Professional and Friendly (`Matrix`), Thai and English; every story's description says its jobs are mock data or worked out by rules                                                                                                                          | None                                                                |
| 17  | A     | The catalog and contract                               | `check-catalog`, `pnpm contrast`, a11y addon                                              | `task-bar.yaml` moves from `planned` to `draft` with `import: "@orivilo/design-system"`, `contract: TaskBarProps`, recipes listed; a `taskbar` component token group and a `ds-taskbar` recipe; new colour pairs in `src/recipes/pairs.ts` pass in every profile and mode; `coverage.md` row; `DESIGN.md` §12 row updated; a11y addon reports zero violations; all copy from the locale catalog | Contract: new component tokens and recipe; no semantic token change |

## i18n keys (new namespace `taskBar` in `th.ts` and `en.ts`)

| Key            | Thai                                       | English                                               |
| -------------- | ------------------------------------------ | ----------------------------------------------------- |
| `label`        | งาน                                        | Jobs                                                  |
| `show`         | แสดงงาน                                    | Show jobs                                             |
| `hide`         | ซ่อนงาน                                    | Hide jobs                                             |
| `none`         | ยังไม่มีงาน                                | No jobs yet                                           |
| `empty`        | ยังไม่มีงาน งานที่เริ่มบนบอร์ดจะแสดงที่นี่ | No jobs yet. Jobs you start on the board show up here |
| `queued`       | รอคิว                                      | Queued                                                |
| `countQueued`  | รอคิว {count} งาน                          | {count} queued                                        |
| `countRunning` | กำลังทำ {count} งาน                        | {count} running                                       |
| `countFailed`  | ไม่สำเร็จ {count} งาน                      | {count} failed                                        |
| `countDone`    | เสร็จแล้ว {count} งาน                      | {count} done                                          |
| `retry`        | ลองอีกครั้ง                                | Retry                                                 |
| `retryLabel`   | ลองอีกครั้ง {name}                         | Retry {name}                                          |
| `jump`         | ไปที่โหนด                                  | Go to node                                            |
| `jumpLabel`    | ไปที่โหนดของ {name}                        | Go to node of {name}                                  |
| `announce`     | {name}: {state}                            | {name}: {state}                                       |
| `basisRules`   | ตามกฎ                                      | By rules                                              |
| `basisMock`    | ข้อมูลจำลอง                                | Mock data                                             |
| `list`         | รายการงาน                                  | Job list                                              |

Reused, not repeated: `progress.working`, `progress.done`, `progress.failed`, `board.jumped`. Job names and failure reasons are host copy and come from the host's catalog (in stories, from `src/components/fixtures.ts`). Thai copy is read aloud in review before G3.

## Rules and bounds

- Data comes only from `jobs`. The bar never starts, cancels, reorders or times a job, and stores nothing but the expanded flag and the per-job retry pending flag.
- `Progress` renders only for running jobs. Done, failed and queued rows draw their own word and mark, so the bar's single live region is the only announcer (Progress keeps a `role="status"` of its own, which stays empty while running).
- Colour roles per `DESIGN.md` §8: failed uses `feedback.danger`, done uses `feedback.success`, running uses `status.running`; brand and intent colours never mark a state. No new semantic token. If the design needs one, that is a contract change and bumps this spec.
- A failed job always shows a reason (type-enforced); the reason says what went wrong and how to fix it (fixtures follow this).
- Never a done state without a job in the prop that says so; never a success toast from the bar (the host decides toasts).
- No cap on job count; the list scrolls inside the bar after about five rows. Large lists (hundreds) are not optimised in this story.
- Placement is the host's: the stories place the bar at the bottom of the board; slice B renders it as a `CanvasBoard` child, like `BlockLibrary`.
- No middot and no em dash in any copy, story or fixture.

## Impact (public API, AGENTS.md rule 2)

- New exports from `@orivilo/design-system`: `TaskBar`, `TaskBarProps`, `TaskJob`, `TaskJobState`, `TaskJobBasis`.
- New component token group `taskbar`, new recipe `ds-taskbar`, new pairs in `src/recipes/pairs.ts`; regenerated `generated.css`.
- New `taskBar` namespace in both locale files.
- New icon exports `QueuedIcon`, `RunningIcon`, `RetryIcon`, `JumpIcon` (Lucide), and a board recipe rule that lifts the bottom panels when a bar is present (design D5).
- Slice B: `jumpToNode(id, options?: JumpOptions)` with exported `JumpOptions { select?: boolean }` (G1 question 3, design D4); the jump's bottom padding clears an open task bar. Callers that do not opt in, the command menu and BlockLibrary, keep today's selection behaviour; their stories still run unchanged in that PR as the check.
- Slice B: `jumpToNode` uses duration 0 under `prefers-reduced-motion` for every caller (design F2, a fix).
- No change to `Progress`, `Toast`, `Tag` or any semantic token.

## Out of scope

- A job runner, queue, polling, server action, database table or persistence of job history.
- Real AI generation and any "by AI" label (ADR 0009 job stories).
- Cancel, pause, clear finished jobs, remove a job, elapsed time and timestamps.
- Wiring the bar into the Studio page in `apps/web`.
- CanvasChat (ORV-45 part 3).
- Auto-expanding the bar or raising a toast when a job fails (the host may toast; the bar does not).
- Virtualised rendering for very long lists.

## Open questions (option, impact, default)

| #   | Question                                        | Options                                                                   | Impact                                                    | Proposed default                                                                                                                   |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | One PR or two                                   | One PR; slice A (bar) and slice B (jump on board)                         | One PR is likely about 550 lines with stories and tokens  | Two vertical slices, A then B, each its own PR and G3; the catalog says the jump arrives in slice B until it does                  |
| 2   | Is the basis label in the UI or only in stories | Story text only; a required `basis` per job shown on each row             | Rule 4 asks for labels in the UI                          | Required `basis: "rules" \| "mock"` on each job, shown per row; a later story adds a real source                                   |
| 3   | How jump selects the node                       | Prop `onJumpToNode` like Inspector; read the board context inside a board | Context needs a select step that `jumpToNode` lacks today | Read `useBoard()` when rendered as a board child; add selection to the board's jump, re-check CommandMenu and BlockLibrary stories |
| 4   | Jump when the node is gone                      | Hide the button; show it disabled with a reason                           | Hidden is simpler; disabled explains                      | Hide it                                                                                                                            |
| 5   | Live region politeness for a failure            | Polite for all; assertive for failed                                      | Assertive twice if the host also toasts                   | Polite for all; the host's danger toast is the assertive one                                                                       |
| 6   | Keyboard model of the list                      | Tab through buttons; roving focus with arrow keys                         | Roving needs focusable rows and more code                 | Tab order, rows not focusable                                                                                                      |
| 7   | Expanded by default when jobs exist             | Collapsed always; expanded when jobs exist                                | Expanding moves the board's visible area                  | `defaultExpanded` false; host may pass `expanded`                                                                                  |
| 8   | Retry pending                                   | Component disables until the state changes; host only                     | DESIGN §7 loading blocks repeat submission                | Component disables that job's retry until its state changes                                                                        |

## Depends on

- ORV-45 part 1 (Progress, Toast, Tag), on staging.
- ORV-44 (E4-4: BlockLibrary, Inspector, board context), merged.
- ADR 0003, 0004, 0009, 0012.

## Changelog

- v1 (2026-10-24): first spec for ORV-45 part 2, TaskBar.
- v1.1 (2026-10-24): G1 decisions by Claude under the owner's POC delegation (ADR 0012 decision 4). Open questions 1, 2 and 4 to 8 take their proposed defaults. Question 3 is decided differently: slice B reads `useBoard()` and selects the node through an opt-in (`jumpToNode(id, { select: true })` or a separate select step, named in G2), so the command menu's jump keeps today's behaviour and its stories need no change. The Impact item for slice B is narrowed to match.
- v1.2 (2026-10-24): G2 decisions by Claude under the owner's POC delegation, from `docs/specs/ORV-100/design.md` (task ORV-100-design-1). Deltas D1 to D5 accepted: retry pending uses `Button loading` (AC 9); the list is a named `ScrollArea` region with key `taskBar.list` (AC 12); pending clears on a change of `state` or `reason` (AC 9); slice B names `JumpOptions`; four icons and a board recipe rule join Impact. Finding F2 (reduced motion on jump) is fixed in slice B. F1 is recorded only; F3 is a check in slice A.
- v1.3 (2026-10-25): review ORV-100-review-1 fixes. R1: a pending retry now ends as soon as the job's `state` or `reason` differs from the stored one, or the job leaves `jobs`, so a job that fails again with the same reason shows an enabled Retry (AC 9; story RetryAgain). R3 decided: the retry spinner is essential motion and keeps turning under reduced motion, as the shared `.ds-spin` rule says; the scoped task bar override is dropped. R4: the recipe comment names the Radix ScrollArea wrapper it depends on.
