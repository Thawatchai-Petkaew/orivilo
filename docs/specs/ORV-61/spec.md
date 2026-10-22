---
issue: ORV-61 (https://tpetkaew.atlassian.net/browse/ORV-61)
lane: M
version: 1
---

## Why

ORV-44 made the font, icon and shape nodes ask for a mood, but they do nothing with it. In round 3 the owner said that mood feeds font, icon and shape suggestions. This story makes those suggestions real and honest. Fixed rules read the mood with the word list the brief interpreter already uses (ORV-33), then rank a short, licensed candidate list. Every suggestion names the words it came from.

## Decisions this spec relies on

- ORV-60 defaults, which the owner accepted on 2026-10-22:
  - Fonts are open licence (OFL) faces that support Thai.
  - Icons are three open-licence sets that differ clearly: rounded stroke, square stroke and solid.
- ORV-33: the rule lexicon and `interpretWithRules`, which is deterministic and says it is rule-based.
- ORV-44: block nodes, `summarize`, the Inspector and `onAnswer`.

## Story

As a Studio user who has described a mood, I want the font, icon and shape nodes to suggest options that fit it and say why. Then I can pick one with a click and see where each suggestion came from.

## Acceptance criteria

| #   | Given                                                                                         | When                              | Result                                                                                                                                                                                                         | Evidence                           |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | A mood text, typed into the node or reached through edges (mood and theme, brand personality) | Reading it                        | The rule lexicon gives values per personality axis, and the words for each one. Clauses it does not understand are listed                                                                                      | `suggest.test.ts`                  |
| 2   | A reading with at least one axis                                                              | Ranking                           | Each kind (font, icon set, corners, density) is ranked from a fixed list by its affinities. The same text always gives the same order. Each candidate carries its licence and source                           | `suggest.test.ts`                  |
| 3   | A reading with no axis                                                                        | Ranking                           | No suggestion. The node and the panel say the mood has no word the rules know and give example words                                                                                                           | Tests; Inspector story             |
| 4   | A font, icon or shape node whose mood is filled and where nothing has been picked yet         | Rendering the node                | The summary gains "แนะนำ: {name}" for the top candidate. The node, the shelf and the panel stay labelled "ตามกฎ"                                                                                               | CanvasNode story; `blocks.test.ts` |
| 5   | The same node in the Inspector                                                                | Summary tab                       | "ข้อเสนอตามกฎ" lists the top three, each with its name, licence and "เพราะ {words}" quoting the mood. A "ใช้อันนี้" button writes the answer: font → `wanted`, icon → `style`, shape → `corners` and `density` | Inspector › Suggestions play test  |
| 6   | A picked candidate                                                                            | Looking at the node and the panel | The node summary shows the pick instead of "แนะนำ", and the panel marks the pick "ใช้อยู่"                                                                                                                     | Play test                          |
| 7   | Every candidate                                                                               | Checking the list                 | Unique ids. Every font is OFL-1.1 and covers Thai and Latin. Icon sets are ISC, Apache-2.0 or MIT, one per style                                                                                               | `suggest.test.ts`                  |

## Rules

- **No AI.** The method is "rule-based", and the panel says so next to the list.
- **Never guess.** Without a known word there is no suggestion, and no default is passed off as one.
- **Ranking.** The score is the sum, over the axes read, of `affinity × (value − 50) / 50`. Ties keep list order. Reasons are the axes that add to the score, quoted with the words from the text.
- **Fonts, all OFL-1.1 on Google Fonts, all Thai and Latin:** Anuphan, Sarabun, IBM Plex Sans Thai, Noto Sans Thai Looped, Prompt, Kanit, Mitr, Mali, Trirong.
- **Icon sets:**
  - Lucide (rounded stroke, ISC).
  - Material Symbols Sharp (square stroke, Apache-2.0).
  - Phosphor Fill (solid, MIT).
- **Corners:** sharp, soft, round. **Density:** compact, comfortable, spacious.
- **Previews.** The suggestion is a name, a licence and a reason. Font specimens and icon previews need the faces and sets in the bundle, so they wait for their own story. The panel never renders a fallback face as if it were the suggested one.

## Data and contract impact

- `packages/intent-engine`: new `suggest.ts` exports `readMood`, `rankSuggestions`, `SUGGESTION_CANDIDATES` and its types.
- `catalog/blocks/mvp.yaml`: `shape-spacing` gains the optional choice input `corners` (sharp, soft, round). The registry version is bumped.
- `packages/design-system`:
  - `@orivilo/intent-engine` moves from devDependencies to dependencies.
  - `src/blocks` gains `suggestionsFor`, and `summarize` appends the suggestion line.
  - The Inspector summary tab gains the suggestions section.
  - i18n gains `suggest.*`, and recipes gain `ds-inspector__suggest*`.

## Out of scope

- Font specimens and icon previews.
- Colour extraction from images, which is its own story.
- The token set output.
- E2-11 directions.

## Changelog

- v1 (2026-10-22): written after ORV-44 merged; the owner said go on ("ดำเนินการต่อ").
