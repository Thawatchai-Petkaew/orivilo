---
issue: ORV-45 (draft key E4-5; https://tpetkaew.atlassian.net/browse/ORV-45)
lane: L (risk flag: component public API)
version: 1
---

## Why

The board can hold nodes, show what each one knows and ask for what is missing (E4-4), but nothing on it talks back. The owner's canvas vision (ADR 0004) has a person ask the engine at a point on the board or in a sidebar, see generation jobs run, and get short notices when something is saved or fails. This story adds the pieces for that: the chat surface, the job bar, and the small base parts they stand on.

## Decisions this spec relies on

- ADR 0004: the canvas is the Studio's main surface; replies land as nodes linked to the node they came from.
- ADR 0009: chat runs on its own pinned model (`chat`). That job is a separate story. Here the chat surface takes its answers from a prop, and every story and fixture is labelled rule-based or mock (AGENTS.md rule 4).
- The catalog entries already planned for E4-5: `application/canvas-chat`, `application/task-bar`, `base/toast`, `base/progress`, `base/tag`.

## Parts

| Part | Content                                      | Status    |
| ---- | -------------------------------------------- | --------- |
| 1    | Toast, Progress, Tag (base)                  | This spec |
| 2    | TaskBar                                      | Planned   |
| 3    | CanvasChat, at the cursor and in the sidebar | Planned   |

## Story (part 1)

As a Studio user, I want short notices that say what happened, a bar that shows how far a job has got, and removable labels for what I picked, so that I always know what the Studio is doing and can undo a choice in one step.

## Acceptance criteria (part 1)

| #   | Given                        | When                                | Result                                                                                                                                                                                                                                 | Evidence                                            |
| --- | ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | A notice to show             | `toast({ ... })` is called          | A toast appears in a corner region with a title, an optional description and an optional action; variant neutral, success or danger; it leaves after its duration, or stays while hovered or focused                                   | Toast stories with play tests                       |
| 2   | A failure toast              | It appears                          | It is announced assertively; it says what failed and how to fix it; it does not leave on its own                                                                                                                                       | Play test                                           |
| 3   | Any toast                    | Pressing its close button or Escape | It leaves; the close button's name is "ปิดการแจ้งเตือน" / "Dismiss"; focus does not jump to it when it appears                                                                                                                         | Play test                                           |
| 4   | A job with a known length    | Rendering `Progress`                | A bar with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, a visible label and the value as text ("40%")                                                                                                      | Progress stories                                    |
| 5   | A job with an unknown length | Rendering it                        | `aria-busy`, no `aria-valuenow`; the bar moves only when reduced motion is off; with reduced motion it is static and the text says "กำลังทำงาน" / "Working"                                                                            | Stories; reduced-motion story                       |
| 6   | A failed or finished job     | Rendering it                        | The text says "ไม่สำเร็จ" / "Failed" or "เสร็จแล้ว" / "Done"; colour never carries the state alone                                                                                                                                     | Stories                                             |
| 7   | A tag with a remove action   | Pressing its remove button          | `onRemove` fires; the button is a real button named "ลบ {label}" / "Remove {label}", reachable by keyboard                                                                                                                             | Tag play test                                       |
| 8   | A tag that can be selected   | Clicking or pressing Space          | `aria-pressed` toggles; selected looks different by more than colour                                                                                                                                                                   | Play test                                           |
| 9   | Every new component          | Catalog and Storybook               | Entries move from `planned` to `draft`, with stories in both modes under three profiles and at 360 px; component tokens and recipes; contrast pairs; `coverage.md`; DESIGN.md bump; a11y addon clean; all copy from the locale catalog | `check-catalog`, `pnpm contrast`, storybook project |

## Rules and bounds

- Toast: at most three on screen; older ones leave first. Default duration 5 seconds for neutral and success; danger stays until dismissed. The region sits at the bottom end corner, inside the profile portal scope, and clears the safe-area insets.
- Never a success toast without backing data (AGENTS.md).
- Progress: value is clamped to 0 to max; sizes sm and md.
- Tag: sizes sm and md; a long label truncates with the full text in `title`.
- No middot and no em dash in any copy.

## Impact (public API, AGENTS.md rule 2)

- New exports from `@orivilo/design-system`: `Toaster`, `toast`, `Progress`, `Tag`, and their prop types.
- New component token groups `toast`, `progress`, `tag`; new recipes; new contrast pairs. No existing token or component changes.

## Depends on

- E4-4 (ORV-44), merged.

## Changelog

- v1 (2026-10-23): part 1 spec.
