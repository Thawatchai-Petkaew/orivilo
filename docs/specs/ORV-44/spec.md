---
issue: ORV-44 (draft key E4-4; https://tpetkaew.atlassian.net/browse/ORV-44)
lane: L (risk flag: UX architecture)
version: 2
---

## Why

The owner's UX vision (brief, "Every node carries a knowledge base") says a node collects what it needs before it generates, asks for the missing pieces one at a time, and keeps the answers. E4-2 and E4-3 put nodes, ports and commands on the board, but a node cannot yet say what it needs, what it already has, or ask for the rest. The block library is how a user sees every node the board can hold and what each one knows. This story makes both real for the MVP path decided in ORV-60.

## Decisions this spec relies on

- Side panel direction: round 3 on the design canvas (owner, 2026-10-22): every shelf block is a node; a filled node shows a summary, an empty one its question; source nodes feed starter tokens; mood feeds font, icon and shape suggestions. Element detail is settled node by node later.
- Module and node research, ORV-60 (owner accepted every default, 2026-10-22, "ตามค่าตั้งต้น"):
  1. The MVP holds Design System nodes plus the minimum Brand nodes: brief, brand personality, audience, mood and theme.
  2. Logo: an existing file only; creating a logo belongs to the Brand module.
  3. Colour extraction from images is rule-based, in the browser; images do not leave the user's machine.
  4. Sample website: the user uploads a screenshot; the link is kept as provenance. A live fetch needs an allow list and a security review first.
  5. Font suggestions: open licence (OFL) faces with Thai only; a customer's licensed font can be uploaded as a source.
  6. Icon suggestions: three open-licence sets that differ clearly (rounded stroke, square stroke, solid).
- Four node kinds (source, synthesis, decision, output) and six fill states (empty, partial, summarized, locked, stale, unlinked), from the ORV-60 doc.

## Parts

| Part | Content                                                                   | Status         |
| ---- | ------------------------------------------------------------------------- | -------------- |
| 1    | ScrollArea, Slider, Resizable, Sheet                                      | Merged, PR #30 |
| 2    | Block registry, node fill states, MissingInputsPrompt, BlockLibrary shelf | This spec      |
| 3    | Inspector (summary, missing, sources tabs; the handoff §17.5 trace)       | After part 2   |

## Story (part 2)

As a Studio user, I want every node the board can hold listed on a shelf with what it already knows, and a node that is missing something to ask me for it one question at a time, so that I can fill the board in any order without guessing what each node still needs.

## Acceptance criteria (part 2)

| #   | Given                                                  | When                               | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidence                                    |
| --- | ------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | `catalog/blocks/mvp.yaml`                              | Reading the registry               | 16 blocks: 8 sources (reference images, screenshot, sample website, typed colours, existing logo, brief, brand personality, platform and languages), 2 synthesis (audience, mood and theme), 4 decisions (starter colours, font, icon, shape and spacing), 2 outputs (token set and profile, two directions). Each has an id, a kind, a module, Thai and English names, its inputs (required or optional, each with a Thai and English question and an answer type) and the blocks it feeds | `check-blocks` in `pnpm test`               |
| 2   | The registry                                           | Checking it                        | Every `feeds` id exists; no cycle; every required input has a question in both locales; no middot or em dash                                                                                                                                                                                                                                                                                                                                                                                | `check-blocks`                              |
| 3   | A node whose required inputs are all missing           | Rendering it                       | Dashed frame, the fill word "ยังว่าง", the first question as the body; no summary                                                                                                                                                                                                                                                                                                                                                                                                           | CanvasNode › Empty story                    |
| 4   | A node with some answers                               | Rendering it                       | Header says "ถามอีก N ข้อ"; the body shows the summary so far                                                                                                                                                                                                                                                                                                                                                                                                                               | CanvasNode › Partial story                  |
| 5   | A node with every required input                       | Rendering it                       | Header says "สรุปแล้ว"; the body shows the summary: up to three lines, and a swatch row when the summary has colours                                                                                                                                                                                                                                                                                                                                                                        | CanvasNode › Summarized story               |
| 6   | A node with no edges on a board with other nodes       | Rendering it                       | Header says "ยังไม่เชื่อม"; the summary stays                                                                                                                                                                                                                                                                                                                                                                                                                                               | CanvasNode › Unlinked story                 |
| 7   | A selected node with missing required inputs           | Opening `MissingInputsPrompt`      | One question at a time: "ข้อ k จาก n", the question as a labelled field of its answer type, "ข้ามไปก่อน" and "บันทึก"; Enter saves; saving writes the answer to the node at once, updates the count and moves to the next question; skip moves on without writing                                                                                                                                                                                                                           | MissingInputsPrompt stories with play tests |
| 8   | The last required answer saved                         | Looking at the prompt and the node | The prompt says the node has what it needs; the node state is summarized; downstream nodes that depend on it lose their missing mark for that input                                                                                                                                                                                                                                                                                                                                         | Play test; `blocks.test.ts`                 |
| 9   | A required input fed by an edge from a summarized node | Rendering the target               | That input counts as filled, and the prompt does not ask for it                                                                                                                                                                                                                                                                                                                                                                                                                             | `blocks.test.ts`                            |
| 10  | The board                                              | Looking at the bottom              | `BlockLibrary` shelf, glass, with groups by module; each tile shows the block name and its state (not on board, empty, partial, summarized, unlinked) as words and a mark, never colour alone; a summarized colour block shows its swatches                                                                                                                                                                                                                                                 | BlockLibrary stories                        |
| 11  | A tile not on the board                                | Dragging it or pressing Enter      | A node of that block appears at the drop point or the viewport centre, selected; a status line announces it                                                                                                                                                                                                                                                                                                                                                                                 | BlockLibrary play test                      |
| 12  | A tile already on the board                            | Pressing Enter or clicking         | The board selects and fits that node instead of adding a second one                                                                                                                                                                                                                                                                                                                                                                                                                         | Play test                                   |
| 13  | The shelf                                              | Typing in its search               | Tiles filter by Thai and English name; an empty result says so; arrow keys move between tiles                                                                                                                                                                                                                                                                                                                                                                                               | Play test                                   |
| 14  | Any summary written by rules                           | Rendering it                       | Labelled "ตามกฎ"; nothing says AI                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Stories; `check-copy`                       |
| 15  | Every new component and the registry                   | Catalog and Storybook              | Entries `draft` with stories in both modes under three profiles; `coverage.md`; DESIGN.md bump; a11y addon clean                                                                                                                                                                                                                                                                                                                                                                            | `check-catalog`, storybook project          |

## Rules and bounds

- **The registry is data.** Blocks live in `catalog/blocks/mvp.yaml`, compiled to a module like the command registry; nothing in a component lists a block by hand.
- **Never guess.** A node with a missing required input does not show a value for what that input decides. A summary names its sources.
- **Fill state is derived.** It comes from the node's answers, the registry and the edges, by a pure function in `blocks.ts`; the board does not store it.
- **Order is free.** Any block can be placed first; a node asks for what it is missing when the user reaches it (brief, "Sequential or not").
- **Honest UI.** Colour extraction and every suggestion are rule-based until E2-10 lands an adapter, and say so. The shelf shows only the 16 MVP blocks.
- **Not in part 2.** Inspector (part 3); the real colour extraction from images and the font, icon and shape suggestion rules (each its own story after this one); uploads (stories use fixture images); voice.

## Impact (public API, AGENTS.md rule 2)

- New: `catalog/blocks/mvp.yaml`, `check-blocks`, `blocks.ts` (registry, `fillState`, `missingInputs`), `MissingInputsPrompt`, `BlockLibrary`.
- `NodeContent` gains `block` (registry id) and `answers`; `missing` stays for nodes outside the registry.
- Node recipe gains the empty (dashed) and unlinked looks; component tokens for the shelf tile and prompt.
- Catalog: BlockLibrary and MissingInputsPrompt `planned` to `draft`.

## Depends on

E4-2, E4-3, part 1 (#30), ORV-60. Unblocks part 3 and E2-11.

## Changelog

- v2 (2026-10-22): parts split; part 2 written from the round 3 mock and the ORV-60 defaults the owner accepted.
- v1: backlog row only (`docs/specs/backlog-draft.md`).
