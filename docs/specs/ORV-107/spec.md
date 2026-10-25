---
issue: ORV-107 (ORV-105 slice C, ORV-45 part 3; https://tpetkaew.atlassian.net/browse/ORV-107)
lane: L (risk flag: component public API; command availability)
version: 1.1
---

## Why

Slices A and B (ORV-105, ORV-106, merged) gave the board a sidebar chat whose finished replies land as notes linked to the node selected alone. A question is often about more than one node, or about a node that is not selected. ADR 0004 and the catalog rule "@ mentions reference nodes on the board" let the person point at nodes by name with "@", so the reply is linked to every node the question was about and stays traceable to its sources (the Intent Engine's promise).

**What the MVP simulates:** no chat model is connected (ADR 0009). Mentions are node ids passed to the host's `onAsk`; nothing reads or interprets the mentioned nodes. In stories the host is a fixture that streams canned or rule-based text. No copy says AI answered or that the engine read the mentioned nodes (AGENTS.md rule 4).

Not a guard spec; the guard frame (L-0012) does not apply.

This slice spec copies ORV-105 rows 18 to 22 with their numbers (L-0016) and adds rows 29 onward for the items slice B carried (ORV-106 review F7, ORV-106 QA F1 to F3) and the slice C catalog check.

## Source and decisions

- `docs/specs/ORV-105/spec.md` v1.4: the A to D API sketch (`mentions`, `defaultMentions`, `onMentionsChange`), rows 18 to 22, the i18n keys marked C, open question 3 (an explicit early command set instead of raising `CURRENT_STORY`), rules and bounds (mention chips are neutral tags, "@" read from the typed character).
- `docs/specs/ORV-105/design.md` §6 (`chat.picker-max-block-size`), §9 (`MentionIcon`), §14 (stories `Mentions`, `MentionGone`) and §16 (slice C outline: chip row, picker, gone chip, question line).
- G1: ORV-105 comment 10132 (Claude under the owner's POC delegation, ADR 0012 decision 4). G2: ORV-105 comment 10133. Both cover slice C; this spec adds no scope beyond them and the carried items.
- `docs/specs/ORV-106/spec.md` v1.3: `placeReply`, `ChatRequest.contextNodeId`, the placement rule this slice extends for QA F1.
- QA F1 placement rule: decided by Claude under the owner's POC delegation (ADR 0012 decision 4), recorded on ORV-107: a reply never covers an existing node; it steps down by the grid gap until its spot is free.
- Command registry `catalog/commands/canvas.yaml`: `node.mention` (surfaces `chat`, `context-menu`, since E4-5). ADR 0003, 0004, 0009, 0012.
- L-0015: the builder probes measured node sizes in a browser before fixing placement numbers.

## Story

As a Studio user asking about the board, I want to type "@" or press a button to pick the nodes my question is about, see them as chips, and get a reply linked to each of them, so that a question about several nodes stays traceable to all of them.

## API additions to the slice B subset

Slice B ships `ChatRequest = { text; mentions; contextNodeId? }` with `mentions` always empty, and `CanvasChatBase` without mention props. Slice C changes exactly this:

```ts
export interface ChatRequest {
  text: string;
  /** Filled in C: mentioned node ids still on the board, in the order picked. */
  mentions: readonly string[];
  contextNodeId?: string | undefined;
}

interface CanvasChatBase {
  // basis, onAsk, onReply, onClose, className unchanged from slice B
  /** New in C, controlled: the shell adds an id on `node.mention` from the context menu. */
  mentions?: readonly string[] | undefined;
  /** New in C, uncontrolled start value. */
  defaultMentions?: readonly string[] | undefined;
  /** New in C: fires with the whole list after a pick or a remove. */
  onMentionsChange?: ((ids: readonly string[]) => void) | undefined;
}
```

- **`node.mention` on the `chat` surface.** The composer renders the registry command as a `Button ghost sm` with the new `MentionIcon` and the text "อ้างถึงโหนด" / "Mention a node"; it opens the picker. Outside a board the button is absent (no nodes to pick).
- **`node.mention` on the `context-menu` surface.** The node context menu offers the registry label "อ้างถึง node นี้ใน prompt" / "Mention this node in the prompt"; `CanvasBoard` adds `node.mention` to `SHELL_COMMANDS` and calls `onCommand("node.mention", { nodeId })`. The shell adds the id to the controlled `mentions`. Without `onCommand` the item is not offered.
- **Availability.** `commands/index.ts` gets the `EARLY` set from ORV-105 open question 3 holding `node.mention` only (slice D adds `board.open-chat-here`); `CURRENT_STORY` stays `E4-4`.
- `placeReply` keeps its signature; its placement changes for row 30.

## Acceptance criteria

Rows 18 to 22 are ORV-105's rows, unchanged; the Result cell is ORV-105's "User sees" text followed by its "Data effect". Every row is checked by a play test in `application/CanvasChat` (id `application-canvas-chat`) unless it says otherwise. The stories are `Mentions` and `MentionGone` from design.md §14.

| #   | Given                                                                                                        | When                                                          | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | A chat on a board                                                                                            | Typing "@" at the start or after a space                      | A listbox "โหนดบนบอร์ด" / "Nodes on the board" opens above the textarea with every node by title and kind word; text after "@" filters it (same match as the command menu); arrows move, Enter or click picks, Escape closes the list only; no match says 'ไม่มีโหนดชื่อ "{query}"' / 'No node named "{query}"'; combobox semantics as `CommandMenu`. Data effect: None                                                                                                                                                                                                                                           |
| 19  | The picker open                                                                                              | Picking a node                                                | The "@query" text is removed from the textarea; a `Tag` with the node title appears in a list "โหนดที่อ้างถึง" / "Mentioned nodes" with its remove button "ลบ {label}" / "Remove {label}" (existing `tag.remove`); picking the same node again adds nothing; `onMentionsChange` fires. Data effect: None                                                                                                                                                                                                                                                                                                         |
| 20  | A button "อ้างถึงโหนด" / "Mention a node" in the composer (the `node.mention` command on the `chat` surface) | Pressing it                                                   | The same picker opens; the context menu on a node offers "อ้างถึง node นี้ใน prompt" / "Mention this node in the prompt", which reaches the shell through `onCommand("node.mention", { nodeId })`. Data effect: None                                                                                                                                                                                                                                                                                                                                                                                             |
| 21  | Mentions picked                                                                                              | Sending                                                       | `onAsk` gets `mentions` in pick order; the question in the transcript lists them by title; the placed reply (slice B) is linked to every mentioned node and the selected node, each once. Data effect: Edges per source as row 13                                                                                                                                                                                                                                                                                                                                                                                |
| 22  | A mentioned node is deleted from the board                                                                   | The graph changes                                             | Its chip shows "{title} ไม่อยู่บนบอร์ดแล้ว" / "{title} is no longer on the board" and its id is left out of the next request. Data effect: None                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 29  | A CanvasNode with `basis` set (ORV-106 review F7)                                                            | Rendering its header                                          | The kind word and the basis word are separated by one text space only: `.ds-node__basis` has no `margin-inline-start` (removed from `recipes.css`), and the text and the accessibility tree still read "ชิ้นงาน ตามกฎ" / "artifact By rules". The `Basis` story asserts the computed `margin-inline-start` of `.ds-node__basis` is `0px` and the header text keeps the space. Data effect: None                                                                                                                                                                                                                   |
| 30  | A board where the spot `placeReply` would pick is covered, wholly or in part, by an existing node (ORV-106 QA F1) | `placeReply` runs, with a linked source or with only `position` | The reply note never covers an existing node: starting from the slice B spot (right of the source, below any earlier reply, or `position`), its y steps down by `space.grid-gap` (`GRID`) until the note's rect overlaps no node's rect; x does not change. The rect is as wide as `rectOf` gives a `note` of size `sm` and as high as `estimateReplyHeight(text)` says (header, port row and padding 156 px, plus 22.4 px a line, lines counted at 20 characters each; constants from a browser probe, never under the measured Thai and English fixture replies, 223 and 245 px), not `rectOf`'s 120 px default. A free spot is used as it is. Same input, same graph. Checked by unit tests on `placeReply` (covered spot steps down past one and past two stacked nodes; a gap that fits 120 px but not the estimate is passed over by a long reply and used by a short one; free spot unchanged; unlinked `position` covered steps down) and on `estimateReplyHeight` and by the `OnBoard` and `Unlinked` plays asserting the reply's rect meets no other node's rect. Data effect: Graph gains the reply at the first free spot |
| 31  | The `Basis` story in `CanvasNode.stories.tsx` (ORV-106 QA F2)                                               | Rendering all six matrix cells                                | Each board is tall enough that the board toolbar, wrapped or not, covers no part of any of the three nodes: header, body, footer and ports show whole. The play asserts in every cell that each node's rect does not meet the toolbar's rect; its basis assertions stay as they are. Data effect: None                                                                                                                                                                                                                                                                                                           |
| 32  | `docs/specs/ORV-106/spec.md` (ORV-106 QA F3)                                                                 | Reading its Impact list                                       | The catalog line no longer says `coverage.md` is updated for slice B; it says the CanvasChat row needs no change; the spec bumps to v1.3 with a changelog line. Checked by review, not by a play test. Data effect: None                                                                                                                                                                                                                                                                                                                                                                                       |
| 33  | The catalog and contract after slice C                                                                       | `check-catalog`, `check-i18n`, the copy check, `pnpm contrast`, the a11y addon, `surfaces.test.ts` | `canvas-chat.yaml` no longer lists "@ mentions reference nodes on the board" as not built (only slice D stays); the five `chat` keys marked C in ORV-105 (`mention`, `mentionList`, `mentionNone`, `mentioned`, `mentionGone`) exist in `th.ts` and `en.ts` with that copy; `MentionIcon` is in `icons.tsx`; `chat.picker-max-block-size` is in `component.json` with `generated.css` rebuilt; `surfaces.test.ts` no longer skips the `chat` surface and proves `node.mention` renders on `chat` and `context-menu`; every CanvasBoard and context menu story passes; zero a11y violations. Data effect: Contract: `mentions`, `defaultMentions`, `onMentionsChange`, `EARLY` command set, `node.mention` in `SHELL_COMMANDS`, `placeReply` placement |

## i18n keys (namespace `chat`, from ORV-105, slice C)

| Key           | Thai                       | English                           |
| ------------- | -------------------------- | --------------------------------- |
| `mention`     | อ้างถึงโหนด                | Mention a node                    |
| `mentionList` | โหนดบนบอร์ด                | Nodes on the board                |
| `mentionNone` | ไม่มีโหนดชื่อ "{query}"    | No node named "{query}"           |
| `mentioned`   | โหนดที่อ้างถึง             | Mentioned nodes                   |
| `mentionGone` | {title} ไม่อยู่บนบอร์ดแล้ว | {title} is no longer on the board |

Reused, not repeated: `tag.remove`, the kind words the command menu shows, and the registry label for `node.mention` from `catalog/commands/canvas.yaml`. No other new key; a new key found in the build is a spec change that bumps this spec. Thai copy is read aloud in review before G3.

## Rules and bounds

- From ORV-105, unchanged: mention chips are neutral `Tag size="sm"`, never the selection colour; "@" is read from the typed character, not the key position, and opens the picker only at the start or after a space; Enter during IME composition never picks or sends.
- The picker lives inside the chat (no portal), anchored above the textarea, the full composer width, scrolling past `chat.picker-max-block-size`. Its highlighted option uses the `menu.option` highlight, distinct from focus.
- The gone chip keeps its normal ink, adds `WarningIcon` in `feedback.warning.fg` and never uses a strikethrough (design.md §16).
- Mentions are ids, not copies of node content. The component sends nothing about a mentioned node beyond its id.
- Sources for `placeReply` are `contextNodeId` first, then mentions in pick order; a repeat counts once (slice B already dedupes). The anchor for placement stays the first source on the board.
- Placement (row 30): pure and deterministic; only y moves, in whole `space.grid-gap` steps; the reply never covers an existing node. The sizes `rectOf` uses are probed in a browser before the numbers are fixed (L-0015).
- `onMentionsChange` fires only on a pick or a remove by the person, never on a gone node; a gone id stays as a chip until removed and is left out of every request.
- No middot and no em dash in any copy, story, fixture or comment.

## Impact (public API and contracts, AGENTS.md rule 2)

- `CanvasChatProps` gains `mentions`, `defaultMentions`, `onMentionsChange` (all optional). `ChatRequest.mentions` is now filled. Callers: `CanvasChat.stories.tsx` only (no `apps/web` caller yet).
- `placeReply` placement changes (row 30): a reply that would cover a node now lands lower. Callers: `CanvasChat.stories.tsx`; `place-reply.test.ts` gains the overlap cases; the `OnBoard` and `Unlinked` plays are re-run.
- Commands: `EARLY` set in `commands/index.ts` with `node.mention`; `CanvasBoard` `SHELL_COMMANDS` gains `node.mention`; `surfaces.test.ts` stops skipping `chat`. Command menu, context menu, shortcut sheet and every CanvasBoard story re-run as the check. `CURRENT_STORY` unchanged.
- Component token `chat.picker-max-block-size` (`size.panel.min`), regenerated `generated.css`; picker pairs in `src/recipes/pairs.ts` if the picker puts a new colour pair together. No semantic token change.
- New icon `MentionIcon` (Lucide `AtSign`) in `icons.tsx`.
- Locale: five `chat` keys in `th.ts` and `en.ts`.
- `recipes.css`: `.ds-node__basis` loses its `margin-inline-start` (row 29); every CanvasNode and CanvasChat story that shows a basis word is re-run.
- `CanvasNode.stories.tsx` `Basis` board height (row 31); story only.
- Catalog: `canvas-chat.yaml` built and not-built lists. `coverage.md` needs no change (its CanvasChat row stays `draft`).
- `docs/specs/ORV-106/spec.md` v1.3 (row 32, Impact wording only).
- No change to `Tag`, `Textarea`, `CommandMenu`'s public API, `jumpToNode`, `connectionProblem` or any semantic token.

## Out of scope

- The at-cursor form, "/" and `board.open-chat-here` (slice D, ORV-105 rows 23 to 26).
- Rich inline mention tokens inside the textarea; mentions are chips above it.
- Reading or summarising a mentioned node's content; a real chat adapter (ADR 0009).
- Mentioning edges, groups as a whole, or nodes on another board.
- Wiring the chat into `apps/web`.

## Open questions (option, impact, default)

| #   | Question                                     | Options                                                                                        | Impact                                                                                     | Proposed default                                                                                     |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Which way a covered reply moves (row 30)     | Step down by the grid gap; step right; search the nearest free spot in any direction           | Down keeps the reply in its source's column, like stacked replies; a search is less predictable | Step down by `space.grid-gap`, x fixed (decided on ORV-107 under the owner's POC delegation)        |
| 2   | Does a picked node already selected alone also become a chip | Yes, a chip like any other; no, it is already the context node                       | Hiding it confuses the person who just picked it                                            | Yes; the sources list dedupes it, so it gets one edge                                                |
| 3   | Mention count limit                          | No limit; a cap such as 10                                                                     | A cap needs copy and a state; a board in the MVP is small                                   | No limit; the chip row wraps                                                                         |
| 4   | Context menu `node.mention` when the chat is closed | Not offered; offered and the shell opens the sidebar                                     | Opening the sidebar is shell wiring in `apps/web`, out of scope                            | Offered whenever `onCommand` is given; what the shell does with it is the shell's (stories add it to `mentions`) |

## Depends on

- ORV-105 slice A (#98) and ORV-106 slice B (#99), merged into `develop`.
- ORV-44 (command menu combobox, context menu), merged.

## Changelog

- v1 (2026-10-25): first slice spec for ORV-105 slice C, from ORV-105 spec v1.4 rows 18 to 22 and design.md §16, plus rows 29 to 32 for the items slice B carried (ORV-106 review F7, QA F1 to F3) and row 33 for the slice C catalog check. QA F1's rule (step down by the grid gap until free) is decided by Claude under the owner's POC delegation. Downstream: the slice C build task; `docs/specs/ORV-106/spec.md` v1.3 (row 32).
- v1.1 (2026-10-25): row 30 checks overlap at an estimated reply height worked out from the text, not `rectOf`'s 120 px default, because a rendered reply note measured about 284 flow px in the build 1 probe and could overlap a node below a 120 px gap (ORV-107 comment 10136). `placeReply` stays pure; the note itself gets no height, so nothing changes visually.
