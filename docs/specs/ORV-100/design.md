---
issue: ORV-100 (ORV-45 part 2, TaskBar)
spec: docs/specs/ORV-100/spec.md v1.1
gate: G2 Design (lane L, passed by Claude under the owner's POC delegation, ADR 0012)
version: 1
---

# TaskBar: design for slices A and B

This file turns spec v1.1 into layout, tokens, recipe, pairs, motion, focus and stories. It adds no semantic token and changes no existing value. Where the design needs something the spec does not say, it is listed under "Deltas against the spec" at the end with a default, so G2 can pass or send it back in one read.

## 1. Sources this design relies on

| Source                                                    | What it decides here                                                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Spec v1.1, AC 1 to 17, rules and bounds                   | Every state, every string, the API, slice split, "no new semantic token"                                                                 |
| `DESIGN.md` §2, §3.3                                      | Working surfaces keep compact density; flat depth; radius grows with level (media 12, container 16, overlay 24); one looping motion only |
| `DESIGN.md` §7, §8                                        | State completeness; failed is `feedback.danger`, done is `feedback.success`, running is `status.running`, focus is `focus.ring`          |
| `DESIGN.md` §9, `.claude/skills/frontend-design/SKILL.md` | The critique in §15                                                                                                                      |
| `catalog/application/task-bar.yaml`                       | "A failed job says why and offers retry", "Jump pans and zooms to the node and selects it", live region, keyboard list                   |
| ADR 0004, `docs/context/canvas-node-study.md`             | A bottom bar that keeps generation history and jumps to the asset                                                                        |
| Shipped parts: `Progress`, `Button`, `ScrollArea`, icons  | Reused as they are; no change to their API or tokens                                                                                     |
| `CanvasBoard` `jumpToNode`, `emit(selectOnly(...))`       | Slice B's opt-in select reuses the board's own selection path (`node.open` already selects this way)                                     |

## 2. Directions considered (same content, same task)

All three show the same fixture: one queued, one running at 40 percent, one done, one failed with a reason, long Thai name, on a 1280 px board and at 360 px.

| Direction                | Shape and surface                                                                                         | Density and composition                                                                      | Why kept or dropped                                                                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Docked strip (chosen) | Solid card strip across the bottom of the board, inset by `space.inset.md`, container radius 16, one edge | Header line always visible; list opens upward above it; rows divided by hairlines, not boxed | Fits the bottom row at every width; holds long reasons; the toggle never moves under the pointer; the other bottom panels lift above it so nothing overlaps when collapsed |
| B. Floating pill         | Glass pill bottom-centre like the shelf, overlay radius 24                                                | Count summary only; a popover list on press                                                  | Dropped: at 360 px it collides with the controls row; glass behind wrapped Thai reasons hurts reading; a popover hides the reason behind one more press                    |
| C. Side drawer           | A Sheet from the end edge                                                                                 | Full height list, roomy                                                                      | Dropped: ADR 0004 places history at the bottom; the end edge is the Inspector's; a drawer hides more of the board than a five-row strip                                    |

Direction A is a working-surface panel, so it follows the compact half of mood E, not the bento half: no big numerals, no glow, no lime.

## 3. Flow

```
collapsed (default, also when jobs is empty)
   │  toggle (click, Enter, Space)              onExpandedChange(true)
   ▼
expanded ── list of rows in prop order, scrolls after about five rows
   │  Retry on a failed row     → onRetry(id) once, button loading until that job's state changes
   │  Go to node (slice B only) → board selects, pans and zooms to the node, focuses it, announces
   │  toggle                    → collapsed, focus stays on the toggle
   ▼
a job's state changes in the next jobs prop → one polite announcement "{name}: {state}"
```

The bar never opens itself, never toasts, never reorders. A host that wants the bar open passes `expanded`.

## 4. Anatomy

```
section.ds-taskbar  (role region, named by the label "งาน" / "Jobs")
├─ div.ds-taskbar__panel  id=panelId  (hidden when collapsed, stays mounted for aria-controls)
│   └─ ScrollArea label "รายการงาน" / "Job list"  (see delta D2)
│       └─ ul.ds-taskbar__list
│           └─ li.ds-taskbar__row  data-state=queued|running|done|failed  tabIndex=-1
│               ├─ span.ds-taskbar__mark          (icon, aria-hidden)
│               ├─ span.ds-taskbar__name  title=full name   (or Progress for running)
│               ├─ div.ds-taskbar__status         (state word, basis label)
│               ├─ p.ds-taskbar__reason           (failed only)
│               └─ div.ds-taskbar__actions        (Go to node, Retry; absent when empty)
│   or p.ds-taskbar__empty  (expanded with no jobs)
├─ div.ds-taskbar__header
│   ├─ span.ds-taskbar__label  id=labelId  "งาน" / "Jobs"
│   ├─ span.ds-taskbar__summary  title=full summary  (one line, truncates)
│   └─ Button ghost sm  "แสดงงาน" / "ซ่อนงาน"  aria-expanded aria-controls=panelId
└─ span.sr-only role=status aria-live=polite   (the one announcer)
```

DOM order is header first, then panel, so Tab reaches the toggle before any row (AC 12). The recipe draws the panel above the header with `flex-direction: column-reverse`, so the toggle stays on the bottom line in both states and does not jump away from the pointer when the list opens. Focus order is therefore toggle, then the list region, then the rows top to bottom (newest first by the host's convention): a meaningful sequence for WCAG 2.4.3.

## 5. Layout per state

Widths below are the bar's own inline size; the bar sets `container-type: inline-size` and switches at 480 px, the same breakpoint the Table uses for its block rows.

### 5.1 Header line (collapsed and expanded)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Jobs   1 queued, 1 running, 1 failed, 2 done                         [ Show jobs  ^ ] │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Min block size `size.control.md` (40) plus `space.inset.sm` above and below: 56 px, always one line.
- Label in `taskbar.fg`, `type.label.md`. Summary in `taskbar.muted-fg`, `type.label.sm`, one line, ellipsis, full text in `title`. Thai: "งาน รอคิว 1 งาน, กำลังทำ 1 งาน, ไม่สำเร็จ 1 งาน, เสร็จแล้ว 2 งาน".
- Empty: summary reads "ยังไม่มีงาน" / "No jobs yet"; the toggle is still there (AC 1).
- Toggle: `Button variant="ghost" size="sm"`, trailing chevron. Collapsed shows `CollapseIcon` (ChevronUp: the list opens upward), expanded shows `ExpandIcon` (ChevronDown). The glyph points where the list goes; the export names are the board's and read the other way round, which is fine because the icon is `aria-hidden` and the words carry the meaning.
- At 360 px the label and toggle keep their width; only the summary shrinks and truncates.

### 5.2 Row, wide (bar at 480 px and above)

```
 mark  name (one line, ellipsis)                                   [Go to node] [Retry]
       state word   basis label
       reason, wrapped in full (failed only)
```

Grid columns: `size.icon.sm` mark, `1fr` content, `auto` actions. Actions sit on the name line, end-aligned. Ghost Go to node before secondary Retry: DOM order matches AC 12 (jump then retry) and the stronger button ends the line.

### 5.3 Row, narrow (under 480 px, the 360 px story)

```
 mark  name (one line, ellipsis)
       state word   basis label
       reason, wrapped in full
       [Go to node] [Retry]        (wraps, start-aligned)
```

### 5.4 Per job state

| State   | Mark (16 px, aria-hidden)                                              | Line 1                                                                                                                   | Line 2                                                     | Line 3                                                       | Actions                                             |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| queued  | `QueuedIcon` (new, Lucide `Clock`) in `taskbar.queued-fg`              | Name                                                                                                                     | "รอคิว" / "Queued" in `taskbar.queued-fg`, basis label     |                                                              | Go to node if on board (slice B)                    |
| running | `RunningIcon` (new, Lucide `Activity`, static) in `taskbar.running-fg` | `Progress size="sm"` whose label is the name (truncating span) and whose value text is "40%" or "กำลังทำงาน" / "Working" | Basis label                                                |                                                              | Go to node if on board (slice B)                    |
| done    | `CheckIcon` in `taskbar.done-fg`                                       | Name                                                                                                                     | "เสร็จแล้ว" / "Done" in `taskbar.done-fg`, basis label     |                                                              | Go to node if on board (slice B)                    |
| failed  | `WarningIcon` in `taskbar.failed-fg`                                   | Name                                                                                                                     | "ไม่สำเร็จ" / "Failed" in `taskbar.failed-fg`, basis label | Reason in `taskbar.reason-fg`, `type.body.sm`, wraps in full | Go to node (slice B), Retry when `onRetry` is given |

- The running row has no separate name span: the `Progress` header is line 1, so the name is not read twice and the bar's percent sits on the name line like the other rows' actions. A `.ds-taskbar__name` span inside the Progress label truncates it on one line (the Progress recipe wraps labels by default; the bar overrides that inside `.ds-taskbar` only, no Progress change).
- Every state differs by mark shape and by word, never by colour alone (AC 7). Queued and running marks differ in shape (clock and pulse line), done and failed too (check and triangle).
- No row tint. A failed row stays on the card; the danger mark and word plus the full reason say it. A tinted row would be the only coloured block in the list and pull the eye away from the newest job.
- The basis label is plain `taskbar.muted-fg` text in `type.label.sm`, not a pill or badge: it is on every row, and a pill per row is chrome. Words: "ตามกฎ" / "By rules", "ข้อมูลจำลอง" / "Mock data". Nothing says AI (AC 10).
- Rows are separated by a 1 px `taskbar.divider` hairline between rows, not boxed: no card kit.

### 5.5 Expanded and empty

```
┌──────────────────────────────────────────────────────────────┐
│ No jobs yet. Jobs you start on the board show up here         │   p.ds-taskbar__empty, muted, body.sm
├──────────────────────────────────────────────────────────────┤
│ Jobs   No jobs yet                              [ Hide jobs v ]│
└──────────────────────────────────────────────────────────────┘
```

### 5.6 On the board (slice B)

- The bar is a child of `CanvasBoard`, like `BlockLibrary`. It renders a plain element (no React Flow `Panel`, so slice A works outside a board); the board recipe positions it: `.ds-board .ds-taskbar { position: absolute; inset-inline: space.inset.md; inset-block-end: space.inset.md; z-index: taskbar.layer }` and gives it `taskbar.shadow` there only (flat elsewhere, §3.3).
- The board's other bottom panels lift by the collapsed bar height when a bar is present: `.ds-board:has(.ds-taskbar)` adds `taskbar header height + 2 x padding-y + space.inset.md` to the bottom margin of the controls, the minimap and the shelf. One rule in the board recipe, no change to those components, and no effect on boards without a bar (their stories are the check).
- The bar carries React Flow's `nowheel nopan nodrag` classes so scrolling the list never zooms the board and dragging in it never pans.
- Expanded, the list overlays the lower part of the board. That is the user's choice and the toggle is one press away; the jump keeps its target clear of it (§10).

## 6. Component tokens: group `taskbar` (component.json, semantic references only)

| Token                     | Reads                         | Slot                                                                 |
| ------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `taskbar.bg`              | `surface.card`                | Bar ground                                                           |
| `taskbar.fg`              | `text.primary`                | Label "Jobs", job names                                              |
| `taskbar.muted-fg`        | `text.secondary`              | Summary, basis label, empty text                                     |
| `taskbar.border`          | `border.subtle`               | Bar edge (decorative, see §8)                                        |
| `taskbar.divider`         | `border.subtle`               | Hairline between rows and above the header                           |
| `taskbar.shadow`          | `elevation.overlay`           | On the board only                                                    |
| `taskbar.radius`          | `shape.container.radius`      | 16: a container of rows, between the toolbar (12) and the shelf (24) |
| `taskbar.padding-x`       | `space.inset.md`              | Header and row inline padding                                        |
| `taskbar.padding-y`       | `space.inset.sm`              | Header block padding                                                 |
| `taskbar.row-block`       | `space.row-block.comfortable` | Row block padding                                                    |
| `taskbar.gap`             | `space.inline.md`             | Between mark, content and actions; between buttons                   |
| `taskbar.line-gap`        | `space.inline.sm`             | Between a row's lines                                                |
| `taskbar.header-height`   | `size.control.md`             | Header min block size                                                |
| `taskbar.list-max-height` | `size.panel.default`          | 320 px, about five rows, then the list scrolls                       |
| `taskbar.icon-size`       | `size.icon.sm`                | 16 px marks                                                          |
| `taskbar.label-type`      | `type.label.md`               | "Jobs"                                                               |
| `taskbar.name-type`       | `type.label.md`               | Job name (matches the Progress label on running rows)                |
| `taskbar.meta-type`       | `type.label.sm`               | Summary, state word, basis label                                     |
| `taskbar.body-type`       | `type.body.sm`                | Reason, empty text                                                   |
| `taskbar.queued-fg`       | `text.secondary`              | Queued mark and word                                                 |
| `taskbar.running-fg`      | `status.running`              | Running mark                                                         |
| `taskbar.done-fg`         | `feedback.success.fg`         | Done mark and word                                                   |
| `taskbar.failed-fg`       | `feedback.danger.fg`          | Failed mark and word                                                 |
| `taskbar.reason-fg`       | `text.primary`                | Failure reason: full contrast, it is the text people act on          |
| `taskbar.layer`           | `layer.overlay`               | Stacking on the board                                                |

No new semantic token. `status.running` and `feedback.*` are locked against profile override, so the state colours read the same under every profile; the bar's ground, text and edge follow the profile through `surface.card`, `text.*` and `border.subtle`. Brand, intent and selection tokens are not read anywhere in the bar (DESIGN.md §8).

## 7. Recipe `ds-taskbar` (recipes.css)

Classes: `ds-taskbar`, `ds-taskbar__header`, `ds-taskbar__label`, `ds-taskbar__summary`, `ds-taskbar__panel`, `ds-taskbar__scroll`, `ds-taskbar__list`, `ds-taskbar__row` (with `[data-state]`), `ds-taskbar__mark`, `ds-taskbar__name`, `ds-taskbar__status`, `ds-taskbar__word`, `ds-taskbar__basis`, `ds-taskbar__reason`, `ds-taskbar__actions`, `ds-taskbar__empty`; board rules `.ds-board .ds-taskbar` and `.ds-board:has(.ds-taskbar) .react-flow__panel.bottom` (and the shelf selector). Every value is a `--cmp-taskbar-*` or `--ds-*` property; layout (grid, flex, gap) only otherwise.

Rules the recipe must hold:

- `.ds-taskbar` is `display: flex; flex-direction: column-reverse`, `container-type: inline-size`, ground, edge, radius; `min-inline-size: 0` so it never forces overflow.
- `.ds-taskbar__name` and `.ds-taskbar__summary`: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-inline-size: 0`.
- `.ds-taskbar__reason`, `.ds-taskbar__empty`: `overflow-wrap: anywhere` so a Thai reason without spaces wraps inside the column; no `line-clamp`, ever (AC 8).
- `.ds-taskbar__row:focus-visible` (programmatic focus, §11): `outline: 2px solid var(--ds-focus-ring); outline-offset: -2px` (inset so the scroll viewport does not clip it).
- `.ds-taskbar__scroll` caps at `taskbar.list-max-height`; the implementer checks that the Radix viewport honours a max block size on the root (`max-height: inherit` on the viewport if not), with the `Overflow` story as proof.
- The list keeps `space.inline.sm` inline padding inside the scroll viewport so a button's 2 px ring plus 2 px gap is never clipped at the edge.
- No `letter-spacing` and no `text-transform` on any text (Thai).
- No hover rule on rows: rows are not interactive. Buttons keep their own Button recipe states.

## 8. Colour pairs to add (`src/recipes/pairs.ts`, recipe `taskbar`)

| Slot         | fg                   | bg           | Floor |
| ------------ | -------------------- | ------------ | ----- |
| label, name  | `taskbar.fg`         | `taskbar.bg` | 4.5   |
| muted        | `taskbar.muted-fg`   | `taskbar.bg` | 4.5   |
| queued       | `taskbar.queued-fg`  | `taskbar.bg` | 4.5   |
| running mark | `taskbar.running-fg` | `taskbar.bg` | 4.5   |
| done         | `taskbar.done-fg`    | `taskbar.bg` | 4.5   |
| failed       | `taskbar.failed-fg`  | `taskbar.bg` | 4.5   |
| reason       | `taskbar.reason-fg`  | `taskbar.bg` | 4.5   |
| row focus    | `ds:focus.ring`      | `taskbar.bg` | 3     |

Marks share the word's token, so the 4.5 text pair covers the 3.0 glyph need. Expected under neutral (from §3.1): `status.running` on card is a declared 4.5 pair, `feedback.success.fg` and `feedback.danger.fg` are 4.5 on canvas and card (E0-5), so no pair is expected to fail; `pnpm contrast` and `recipes.test.ts` are the proof, not this table.

Not listed, with the reason for the pairs file comment: `taskbar.border` and `taskbar.divider` are `border.subtle` dividers; the bar is identified by its ground and, on the board, by its shadow (WCAG 1.4.11 does not apply to a decorative edge). Inside the bar, `Progress` and `Button` (ghost, secondary, sm) sit on `taskbar.bg`, which is `surface.card`; their pairs already exist on `ds:surface.card` (`progress value`, `progress track edge`, `button ghost on card`, `button secondary`). If `taskbar.bg` ever stops reading `surface.card`, those pairs must be repeated on `taskbar.bg`; the recipe comment says so.

## 9. Icons (`src/components/icons.tsx`, Lucide first per DESIGN.md §6)

| Export                                                   | Lucide glyph  | Use                                       |
| -------------------------------------------------------- | ------------- | ----------------------------------------- |
| `QueuedIcon`                                             | `Clock`       | Queued mark (new)                         |
| `RunningIcon`                                            | `Activity`    | Running mark, static (new)                |
| `RetryIcon`                                              | `RotateCcw`   | Leading icon of Retry (new)               |
| `JumpIcon`                                               | `LocateFixed` | Leading icon of Go to node, slice B (new) |
| `CheckIcon`, `WarningIcon`, `CollapseIcon`, `ExpandIcon` | existing      | Done, failed, toggle                      |

All `aria-hidden`, `currentColor`, stroke 2.4. No spinner as a mark: a spinning icon per running row would be a second looping motion beside the Progress sweep (§3.3 allows only the engine at work to loop).

## 10. Slice B: the opt-in select step

Name: **`jumpToNode(id: string, options?: JumpOptions)`** on `BoardContextValue`, with a new exported type

```ts
export interface JumpOptions {
  /** Select the node alone before the jump, the way `node.open` does. Off by default. */
  select?: boolean | undefined;
}
```

Chosen over a separate `selectNode` step because the jump and the select must happen in one order (select, then pan and zoom, then focus, then announce) and a second call from the bar could interleave with a render; one call keeps the order inside the board. The parameter is optional, so `CommandMenu` (`board.jumpToNode(entry.id)`) and `BlockLibrary` (`jump(existing.id)`) compile and behave as today; their stories run unchanged in the slice B PR as the check (spec Impact).

With `{ select: true }` the board:

1. If the node is not already the only selected node, emits `selectOnly(graph, [id])` through the same `emit` path `node.open` uses, so a controlled host sees one `onGraphChange`.
2. Fits the view to the node as today (`duration` 200, `maxZoom` 1). When a `.ds-taskbar` is inside the board, the bottom padding of that fit adds the bar's current block size, so the node lands clear of an open list (React Flow 12.12 accepts per-side padding). This applies to every caller while a bar is present and changes nothing on boards without one.
3. Focuses the node element and announces `board.jumped` ("ไปที่ {title}" / "Jumped to {title}"). The bar's own live region says nothing on a jump.

The bar shows Go to node only when `job.nodeId` is in `useBoard().graph.nodes` (AC 15). Outside a board the context default has an empty graph, so slice A never shows the button and needs no flag. Button: `Button variant="ghost" size="sm" iconLeading={<JumpIcon/>}`, text "ไปที่โหนด" / "Go to node", `aria-label` "ไปที่โหนดของ {name}" / "Go to node of {name}" (AC 14).

## 11. Focus and keyboard

- Tab order: toggle, list region (the ScrollArea viewport, so rows without buttons can still be scrolled by keyboard), then each row's Go to node and Retry in prop order. Rows are not in the Tab order (spec question 6).
- Toggle: Enter and Space toggle; focus stays on it; `aria-expanded`, `aria-controls` the panel, which stays mounted with `hidden` when collapsed.
- Retry: press fires `onRetry(id)` once and the button turns `loading` (spinner in the leading slot, `aria-disabled`, `aria-busy`, a second press does nothing; see delta D1). Focus stays on it.
- When a focused Retry unmounts because its job left `failed` (the host moved it to queued), focus moves to that row (`tabIndex=-1`, inset `focus.ring`), so focus is never dropped to the body. When a focused row disappears from `jobs`, focus moves to the toggle.
- Focus-visible is always `focus.ring` 2 px with the 2 px gap (Button recipe) or the inset ring on a row. The bar has no selected state, so focus can never be confused with selection; the board's selected node keeps `canvas.selection` after a jump and the focused node shows the ring as well.
- Escape does nothing in the bar (it belongs to the board's `panel.close` and `selection.deselect`).

## 12. Live region

One `span.sr-only role="status"` (polite) inside the bar, mounted in both states, so a change is heard while the bar is collapsed. On each new `jobs` prop, the bar compares each job's `state` with the last render by `id` and announces "{name}: {state word}" for changed jobs, joined in one message when several change at once. First render, a new job, and a running job's percent change announce nothing (AC 11). Failure is polite too (spec question 5); the host's danger toast is the assertive one. `Progress` keeps its own `role="status"`, which stays empty while running, so nothing is said twice.

## 13. Motion and reduced motion

| Moment                  | Motion                                                                                       | Reduced motion                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| List opens              | Panel fades in over `motion.feedback.duration` (120 ms), `motion.easing`; no height or slide | None, appears at once                                                                                                                  |
| List closes             | None (hidden at once, so focus and layout settle immediately)                                | None                                                                                                                                   |
| Running, known length   | Progress fill width eases (Progress's own transition)                                        | Progress's own rule                                                                                                                    |
| Running, unknown length | Progress sweep (the engine at work)                                                          | Static bar, "Working" (AC 6)                                                                                                           |
| Retry pending           | Button spinner (`ds-spin`)                                                                   | Static glyph; the implementer confirms `ds-spin` stops under reduced motion and adds the rule to the Button recipe if not (finding F3) |
| Jump                    | Board `fitView` 200 ms                                                                       | See finding F2                                                                                                                         |
| State change in a row   | None; the mark and word swap                                                                 | None                                                                                                                                   |

Nothing loops while every job is queued, done or failed.

## 14. 360 px, long Thai names, missing data

- Names truncate on one line with the full name in `title` (AC 13), including `fixtures.longThai` without spaces. The running row truncates the name inside the Progress label the same way.
- Reasons wrap in full with `overflow-wrap: anywhere`; status, reason and actions wrap below the name under 480 px; nothing scrolls sideways.
- The header keeps "งาน" and the toggle; the summary truncates with its full text in `title`. The full summary is still in the accessible tree.
- Missing data: a job without `nodeId` has no Go to node; a running job without `value` shows "กำลังทำงาน"; no `onRetry` means no Retry. A failed job without a reason cannot be built (type). No row shows a placeholder dash.
- Thai: looped Thai (Sarabun) at 13 to 14 px through the body stack; mixed lines keep the body line-height; no tracking.

## 15. Stories (`application/TaskBar`, id `application-task-bar`)

Every story's description says its jobs are mock data or worked out by rules; content comes from `src/components/fixtures.ts`; Thai by default, English through the toolbar and in `English`.

| Story                  | Slice | Shows                                                                                       | Play test                                                                                                           |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Empty`                | A     | Collapsed, "ยังไม่มีงาน"; expanded empty text                                               | Toggle shows the empty text; `aria-expanded` flips                                                                  |
| `Collapsed`            | A     | Mixed jobs, summary in queued, running, failed, done order, zero counts left out            | Summary text exact; panel `hidden`                                                                                  |
| `Queued`               | A     | Queued rows, both bases                                                                     | Word and basis label; no progressbar                                                                                |
| `Running`              | A     | Known (40%), clamped (over max), unknown                                                    | `aria-valuenow`, "40%", clamp, "กำลังทำงาน"                                                                         |
| `RunningReducedMotion` | A     | Unknown length under reduced motion                                                         | Sweep animation is `none` (computed style)                                                                          |
| `Done`                 | A     | Done rows, no jump off the board                                                            | Check mark and word; no Go to node                                                                                  |
| `Failed`               | A     | With and without `onRetry`; long reason                                                     | Reason not truncated; Retry name "ลองอีกครั้ง {name}"; no button without `onRetry`                                  |
| `RetryPending`         | A     | Retry pressed, host slow to change state                                                    | `onRetry` called once on two presses; `aria-disabled`; focus moves to the row when the host moves the job to queued |
| `Announce`             | A     | Jobs advance through states on a button in the story frame                                  | Live region empty first; then "{name}: {state}"; percent changes silent                                             |
| `Controlled`           | A     | `expanded` from the story, `onExpandedChange` logged                                        | Controlled value wins over a press                                                                                  |
| `Keyboard`             | A     | Mixed jobs                                                                                  | Tab order toggle, list region, jump and retry in prop order; focus-visible ring present                             |
| `Overflow`             | A     | Twelve jobs                                                                                 | List scrolls inside the bar; the bar's height stays at the cap                                                      |
| `Mixed`                | A     | Every state at once, long Thai name                                                         | Snapshot for visual QA                                                                                              |
| `Narrow`               | A     | `Mixed` at 360 px                                                                           | No horizontal overflow (`scrollWidth <= clientWidth`), name has `title`                                             |
| `English`              | A     | `Mixed` in English                                                                          | Strings from the `en` catalog                                                                                       |
| `RecipesAndModes`      | A     | `Matrix`: neutral, Professional, Friendly, light and dark                                   | Renders in all six boundaries                                                                                       |
| `OnBoard`              | B     | Bar inside `CanvasBoard` with the shelf and controls, one done job with a node, one without | Go to node selects, fits and focuses the node, `board.jumped` announced; no button for the missing node             |
| `OnBoardNarrow`        | B     | `OnBoard` at 360 px                                                                         | Controls sit above the collapsed bar; nothing overlaps                                                              |

Slice B also re-runs the `CommandMenu` and `BlockLibrary` stories unchanged.

## 16. Screens for visual QA

Screenshots under `.orivilo/runs/ORV-100/<task_id>/screenshots/`, light and dark each:

1. `Mixed` neutral at 1280 px, expanded.
2. `Mixed` Professional and Friendly (from `RecipesAndModes`): state colours identical, ground and type follow the profile.
3. `Narrow` at 360 px, expanded, long Thai name and long reason.
4. `Collapsed` at 360 px: one line, summary truncated.
5. `Empty` expanded.
6. `Failed` with focus-visible on Retry, and `RetryPending` with the spinner.
7. `Keyboard` with the row's inset ring after Retry unmounts.
8. `Overflow` with the scroll bar shown.
9. `OnBoard` collapsed (controls, shelf and minimap lifted) and expanded after a jump (node clear of the list, selected and focused).
10. `OnBoardNarrow`.
11. `RunningReducedMotion` (static bar).

## 17. Critique against the tells (frontend-design, DESIGN.md §9)

Plan in one sentence: a quiet strip at the foot of the board that reads like a log, where the only colour is the state of a job.

| #   | Tell                                             | Here                                                                                                                                                 |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cream-serif-terracotta, near-black-acid          | Absent. Card ground, ink text, no lime anywhere in the bar                                                                                           |
| 2   | Broadsheet                                       | Hairlines between rows are used, but with radius 16, 12 px row padding and one column of content; it reads as a list, not a newspaper                |
| 3   | Card kit                                         | Avoided on purpose: one container, rows are not cards, no shadow off the board, the bar's radius differs from the toolbar's and the shelf's by level |
| 4   | Template chrome                                  | No caps eyebrow over "Jobs", no middot meta string (the summary is joined by commas), no mono for counts, no arrow on Go to node                     |
| 5   | One accented word, labels that add nothing       | "Jobs" is the region's name, needed by assistive tech and the only label; no "Status:" or "Reason:" prefixes                                         |
| 6   | Ambient motion                                   | Only motion that answers an action (open, retry) plus the engine's own sweep; no row animation on arrival                                            |
| 7   | Numbered markers                                 | None. Prop order is shown without numbers because it is not a sequence the user follows                                                              |
| 8   | Lime as status, violet as tint, focus recoloured | No lime; violet appears only as the Progress fill (see F1); focus is `focus.ring`                                                                    |
| 9   | Thai with Latin rules                            | No tracking, no transform; Thai and Latin share the body line-height                                                                                 |
| 10  | Studio style in the preview                      | Not a preview surface; and inside a profile boundary the bar uses only profile-safe tokens                                                           |
| 11  | Fake evidence                                    | Every row carries its basis; nothing says AI; no done without a job that says so; no success toast                                                   |
| 12  | Per-page mood patch                              | All values from `taskbar.*` and semantic tokens                                                                                                      |

What would be produced for any similar brief, and was changed: a generic job tray would put a coloured status pill and a spinner on every row and box each job as a card. Here the state is a mark and a word in the row's own text line, the basis is plain text, and the only motion is the engine's. One accessory removed before shipping: a per-row timestamp (also out of scope in the spec, and it would need data the bar does not have).

## 18. Findings

- **F1 (no action in this story).** `Progress` fills with `progress.fill` = `action.primary` (violet, the "act" role), while the bar's running mark uses `status.running` (blue). The spec forbids a Progress change here. A later Progress review could move the running fill to `status.running`; recorded so G2 sees it is known.
- **F2 (slice B).** `jumpToNode` uses `duration: 200` regardless of `prefers-reduced-motion`. Proposed for slice B: duration 0 under reduced motion, for every caller (a fix, not an opt-in). If G2 prefers to keep slice B to the opt-in only, this becomes its own S story.
- **F3 (slice A, check only).** Confirm `ds-spin` stops under reduced motion in the Button recipe; the bar's pending state relies on it.
- **No new semantic token was needed.** Every slot maps to an existing name.

## 19. Deltas against the spec (G2 decides; defaults proposed)

| #   | Delta                                                                                                                                                                  | Why                                                                                                                                                                             | Default                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Retry pending uses `Button loading` (spinner, `aria-disabled`, `aria-busy`, status "กำลังดำเนินการ" from `button.working`) instead of a plain disabled look            | `Button` sets `aria-disabled` itself after spreading props, so a caller cannot pass it; `loading` is DESIGN §7's "blocks repeat submission, announces status"; no Button change | Accept; AC 9 still holds (`aria-disabled`, one call). The Button's own status line is a second, user-triggered announcement, separate from job state |
| D2  | The list sits in `ScrollArea`, whose viewport is a named, focusable region: one extra Tab stop after the toggle, and a new key `taskBar.list` "รายการงาน" / "Job list" | Rows without buttons (queued, running) must be reachable by keyboard scroll; axe flags a scrollable region with nothing focusable                                               | Accept; AC 12 reads "toggle, list region, then each row's buttons"; spec bumps to v1.2 with the key                                                  |
| D3  | Retry pending clears when the job's `state` or `reason` changes, not only `state`                                                                                      | A host whose retry fails again before a render would leave the job `failed` with a new reason, and the button would stay pending for ever                                       | Accept with the spec bump; fixtures show it in `RetryPending`                                                                                        |
| D4  | Slice B contract: `jumpToNode(id, options?: JumpOptions)` with `JumpOptions { select?: boolean }` exported; jump padding clears an open task bar                       | The G1 decision left the name to G2                                                                                                                                             | Accept; spec Impact lists `JumpOptions`                                                                                                              |
| D5  | New icon exports `QueuedIcon`, `RunningIcon`, `RetryIcon`, `JumpIcon` (Lucide); a board recipe rule lifts the bottom panels when a bar is present                      | Not in the spec's Impact list                                                                                                                                                   | Accept; add both to Impact                                                                                                                           |

## Changelog

- v1 (2026-10-24): first design for TaskBar slices A and B, for G2.
