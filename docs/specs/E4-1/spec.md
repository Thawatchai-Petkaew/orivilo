---
issue: E4-1 (placeholder; folder is renamed to the ORV key when the Jira issue is created)
lane: L (risk flag: semantic token contract)
version: 1
---

## Why

ADR 0004 puts the canvas set in the design-system package with every visual value from tokens, typed ports shown by shape and icon as well as colour, and edges whose three meanings differ by stroke style. None of those names existed; E4-2 cannot build CanvasBoard, CanvasNode, NodePort and CanvasEdge without them, and the study (`docs/context/canvas-node-study.md`) lists the set to add. The handoff (§10 group 6) also asks for a graphic palette separate from the transaction colours, which the port kinds are the first use of.

## Story

As the designer and the E4-2 implementer, I want the board, grid, selection, port kinds, edge meanings and node statuses as semantic tokens with their pairs checked, and the node, port, edge, group and board component tokens on top, so that the canvas components compose from the contract like every other component and nothing on the board changes inside a customer profile.

## Acceptance criteria

| #   | Given                        | When                                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                   |
| --- | ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | `semantic.json`              | Reading the new names               | `surface.board`; `canvas.grid`, `canvas.selection`, `opacity.selection`, `space.grid-gap`; `port.text`, `port.image`, `port.palette`, `port.type`, `port.profile`; `edge.stroke` and its hover, selected, invalid and stale, `edge.width`, `edge.width-selected`, `edge.dash.input`, `edge.dash.reference`, `edge.dash.derived`; `status.running`, `status.stale`, `status.locked`; `size.node.sm`, `size.node.md`, `size.node.lg`, `size.port` | `pnpm tokens` output; Foundations › Canvas tokens          |
| 2   | Each port kind               | Reading its token                   | A colour per mode and a shape in `$extensions.orivilo.shape` (circle, square, diamond, triangle, hexagon); no two kinds share a shape or a colour in either mode; no port takes an action or feedback value                                                                                                                                                                                                                                     | `canvas.test.ts`                                           |
| 3   | The four non-text port kinds | Reading their primitives            | They come from a new `color.graphic` palette (teal, magenta, indigo, orange; one step for light, one for dark), separate from the seven brand ramps and never used by an action, state or feedback token (handoff §10 group 6)                                                                                                                                                                                                                  | `primitives.json`; test above                              |
| 4   | The three edge meanings      | Reading `edge.dash.*`               | Solid, dashed and dotted; distinct; the colour tokens carry state (rest, hover, selected, invalid, stale), not meaning                                                                                                                                                                                                                                                                                                                          | `canvas.test.ts`                                           |
| 5   | Every new colour             | `pnpm contrast`                     | In a pair or exempt with a reason: ports at 3.0 on `surface.card` and `surface.board`; edge strokes and `canvas.selection` at 3.0 on board and card; status words at 4.5 on card, sunken and board; primary and secondary text at 4.5 on `surface.board`; `canvas.grid` exempt as decorative. All pass under neutral, Professional and Friendly in both modes                                                                                   | `pnpm contrast` output in the PR; `contrast-pairs.test.ts` |
| 6   | A profile source             | It overrides a canvas group         | `canvas`, `port`, `edge` and `status` are locked like `feedback` and `focus`; the profile fails validation with the reason                                                                                                                                                                                                                                                                                                                      | `LOCKED_GROUPS`; `profiles.test.ts`; `canvas.test.ts`      |
| 7   | `component.json`             | Reading the new groups              | `board.*`, `node.*`, `port.*`, `edge.*`, `group.*`: every value references a semantic token; node radius is the media level (12) and group radius the container level (16); node widths sm 240, md 320, lg 480                                                                                                                                                                                                                                  | `tokens.test.ts` layer rule; generated CSS                 |
| 8   | Storybook                    | Opening Foundations › Canvas tokens | The board with its grid, a node and a box selection painted from the component tokens; the five port glyphs with their shapes; the three dash patterns; the status words in both modes; the a11y addon reports zero violations                                                                                                                                                                                                                  | `canvas.stories.tsx` play test                             |
| 9   | `src/tokens/canvas.ts`       | Importing it in E4-2                | `PORT_KINDS`, `PORT_SHAPES`, `portShape()`, `EDGE_MEANINGS`, `NODE_STATUSES`, `CANVAS_WORDS` (Thai and English)                                                                                                                                                                                                                                                                                                                                 | module and test                                            |
| 10  | DESIGN.md                    | Reading §3, §5, §12                 | New rows in the §3.1 snapshot, the graphic palette in §3.2, node sizes in §3.3, the locked groups in the §5 profile row, canvas tokens real in §12, changelog with the impact list                                                                                                                                                                                                                                                              | DESIGN.md v1.12                                            |

## Rules and bounds

- **Meaning never moves (DESIGN.md §8).** Selection on the board is violet like `selection.fg`; focus stays the ink ring; missing inputs use `action.intent` because the node asks the engine; error uses `feedback.danger.fg`. Neither gets a canvas token.
- **Colour never alone.** A port's kind is its shape and icon first; an edge's meaning is its dash and label first. The tests enforce distinct shapes and distinct dashes, the contrast check enforces readability. Hue distance is a lineup question, not a test.
- **Studio chrome.** The board never renders inside a customer boundary (ADR 0004 item 6), so the canvas groups are locked for profiles; a preview node's content carries its own boundary.
- **Graphic palette.** Four hues with two steps each, enough for the data kinds; not interpolated from the brand anchors and not a brand asset. A chart palette (handoff group 6) can grow it in its own story.
- **No component yet.** This story adds tokens, the vocabulary module and a Foundations page. CanvasBoard, CanvasNode, NodePort, CanvasEdge are E4-2; their catalog entries stay `planned`.

## Impact (contract change, AGENTS.md rule 2)

- Primitives: `color.graphic.{teal,magenta,indigo,orange}.{700,300}`, `opacity.selection` 0.16, `size.60` 240, `size.80` 320, `size.0-5` 2, `size.0-75` 3, `dash.{solid,dashed,dotted}`. No existing primitive changes.
- Semantic: 27 new tokens listed in AC 1. No existing semantic value changes. `LOCKED_GROUPS` gains four groups; the two shipped profiles override none of them, so they still validate.
- Component: 5 new groups (`board`, `node`, `port`, `edge`, `group`), 62 tokens. No existing component token changes.
- Tailwind: every new colour is a utility through `@theme` (`bg-surface-board`, `text-status-stale`, `fill-port-image`); the lint rule accepts them as token names.
- Contrast set: 94 pairs (was 61); `surface.board` joins the text surfaces.

## Out of scope

The components (E4-2), the command surfaces (E4-3), MiniMap and toolbar tokens beyond the existing `toolbar.*` (E4-3 adds what it needs), a chart palette, a Foundations page for the graphic palette on its own.

## Depends on

E2-1 (token model), E0-5 (contrast set). Unblocks E4-2.

## Changelog

- v1 (2026-10-22): written and delivered in the same PR after the owner's "ดำเนินการต่อเลย" on the night summary; lane L gates G1 and G2 were not raised to the owner, the PR carries the impact list and the owner reviews it on main.
