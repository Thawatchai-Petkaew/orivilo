---
issue: ORV-211 (https://tpetkaew.atlassian.net/browse/ORV-211)
lane: as set on ORV-211 in Jira (not read in this role); two new component public APIs are an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.1 row 8 ("EvidenceSpan and EvidenceList")
version: 1.0
---

# ORV-211: EvidenceSpan and EvidenceList

## Benchmark

The comparison tables in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247), plus an AI Elements row because audit section C maps both components from it. Every cell is from K-0127 to K-0135 (read 2026-11-01), and the EvidenceList Untitled UI, shadcn/ui and Standards cells also from K-0119, K-0120 and K-0126; the Ours row is the code on this branch at `00f6b67`, as K-0135 records it. The Add and Do not copy rows are this spec's choices; each points to the rule in "Rules" that holds it.

### EvidenceSpan (a control in a line of text that opens a card with the quote and its source)

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | None found: <https://www.untitledui.com/react/components> lists no citation, source, reference, footnote, quote, popover or hover card entry. Nearest: <https://www.untitledui.com/react/components/tooltips> (`title` and `description`, `arrow` false, `placement` top, `delay` 300, `closeDelay` 0, opens on hover and focus, `trigger="focus"`, `isDisabled`) and <https://www.untitledui.com/react/marketing/testimonial-sections> (no item contents described). No variants, sizes, states or slots to read (K-0131). |
| shadcn/ui | Popover (<https://ui.shadcn.com/docs/components/popover>): parts Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription; "triggered by a button"; `align` start, center, end (K-0130). Hover Card: "For sighted users to preview content available behind a link", example `delay` 100 and `closeDelay` 200 (K-0129). |
| AI Elements | InlineCitation, 14 parts on HoverCard with `openDelay` and `closeDelay` 0. Slots: text, card trigger (secondary rounded Badge, first hostname plus "+N", "unknown" when empty), card body 320 px wide (`w-80`), carousel with a `current/count` index and Previous and Next, source (`title`, `url`, `description`), quote (`blockquote`, start border, muted, italic). No variants or sizes; states are open and closed. No aria beyond the two arrows (K-0127). |
| Standards | No APG pattern for a popover or a citation (K-0133). Button: an accessible label; focus moves into a dialog it opens and back on close (K-0132). Radix Popover follows the Dialog pattern: trigger `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` while open, content `role="dialog"`, Space and Enter toggle, Esc closes to the trigger, modal false by default, no focus trap when non-modal (K-0130). Tooltip takes no focus; a hover with focusable content is a non-modal dialog (K-0133). Radix Hover Card: content out of the tab order, ignored by screen readers, no touch open (K-0129). SC 1.4.13 (AA): content shown on hover or focus is dismissible, hoverable and persistent; content opened only by a press is outside it by our reading (K-0134). |
| Ours | No EvidenceSpan. `Popover` wraps Radix Popover (`open`, `defaultOpen`, `onOpenChange`; `PopoverTrigger` and `PopoverClose` default to `asChild`; `PopoverContent` defaults `sideOffset` 6 and `align` start, takes `aria-label`, renders in `PortalScope` with the `ds-popover` recipe and a focus-visible border). `Tag` has a toggle form, a `button.ds-tag__main` with its own hover and focus rules. The evidence item: `id`, `source.ref`, `source.locator` (text with path, start, end; element; box; surface), `observation.quote` (optional, 1 to 300 characters, only on text kinds with a text locator), `fromModel` (K-0135, `evidence.ts`). |
| Add | A press-opened card on our `Popover`, so the dialog wiring, Esc and focus return come from the primitive (K-0130, K-0132): `ev-open-1`. A trigger whose name says what it opens, not a hostname (K-0127, K-0132): `ev-trigger-1`. A name for the card through `aria-label` (K-0133): `ev-card-1`. Quote and source slots from the evidence schema, with the rule or model label (`evidence.ts`, AGENTS.md rule 4): `ev-card-1`. A missing-span state, since the schema allows a quote only on text kinds (`evidence.ts`): `ev-span-1`, `ev-missing-1`. |
| Do not copy | The hover card as the carrier (K-0127, K-0129): its content does not reach keyboard, screen reader or touch users (`ev-open-1`). Zero-delay hover opening (K-0127): a pointer pass flashes the card and it falls under 1.4.13 (K-0134), see open question 1. The hostname pill with "+N" and "unknown" (K-0127): it names a site, not the evidence, and "unknown" shows a value with no backing data (`ev-trigger-1`, `ev-missing-1`). The carousel (K-0127): one card per fact, so nothing to page through. Italic quote and the `bg-accent` tint (K-0127): raw classes; our recipe reads `--ds-*` and `--cmp-*` only (`ev-recipe-1`). Links to web pages: the spans point into the brief (audit section C, Sources row), `ev-text-1`. |

### EvidenceList (a collapsible list of the quotes a reading drew on, with a count)

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | None found: <https://www.untitledui.com/react/components> lists no sources or reference list (K-0131). Nearest is <https://www.untitledui.com/react/components/tree-views>, read for K-0119; not a list of quotes. No variants, sizes, states or slots to read. |
| shadcn/ui | No sources component on the pages read; Collapsible (<https://ui.shadcn.com/docs/components/collapsible>) has three parts, `data-slot` only, no styles (K-0120). |
| AI Elements | Sources, 4 parts on Collapsible. Trigger: required `count`, "Used {count} sources" with no singular form, a chevron that does not turn. Content: a column that fades and slides from the top, no reduced-motion rule. Source: an anchor with `target="_blank"`, `rel="noreferrer"`, a book icon and a bold title. No aria in the file (K-0128). |
| Standards | Disclosure: role button, `aria-expanded`, optional `aria-controls`, Enter and Space; no Escape, no focus move (K-0132). A list opened by a press is outside 1.4.13 by our reading (K-0134). Motion readings 2.3.3 and 2.2.2 in K-0126. |
| Ours | No EvidenceList. `Collapsible` (ORV-203): `open`, `defaultOpen`, `onOpenChange`, `disabled`; the trigger is a ghost md `Button` whose label stays the same and whose icon swaps; content fades in at `--ds-motion-feedback-duration`, `animation: none` under reduced motion (K-0135). |
| Add | Build on our `Collapsible`, so the Disclosure wiring and the reduced-motion rule are there (K-0128, K-0132): `ev-list-1`. A count from the locale catalog with a singular form in English and the Thai form (K-0128, AGENTS.md i18n rule): `ev-count-1`. A list element per quote (K-0128): `ev-list-1`. A zero state the AI Elements trigger does not have (K-0128): `ev-list-1`, `ev-missing-1`. |
| Do not copy | Hard-coded English "Used {count} sources" with no singular (K-0128): `ev-copy-1`, `ev-count-1`. The non-turning chevron (K-0128): our trigger swaps its icon. The slide-from-top classes with no reduced-motion rule (K-0128): `Collapsible` keeps its own fade. `text-primary text-xs` on the root (K-0128): colour and size utilities our lint forbids (`ev-recipe-1`). Anchors that open web pages (K-0128): `ev-text-1`. |

## Goal

When ORIVILO reads a brief, each fact it draws (a brand name, a personality lean, a mood word) has to show the words of the brief it came from, or say plainly that it has none. Today the Direction Studio prints quoted words as a muted line, and nothing lets a person open the exact quote beside a fact. This story gives the design system an EvidenceSpan, a control after a fact that opens a small card with the quote, its source and whether a rule or an AI model read it, and an EvidenceList, a collapsible list of those quotes with a count. A fact with no quote shows "ไม่มีหลักฐาน" / "No evidence" instead of a blank (audit D.1 row 8).

What is simulated: no brief analyser exists yet (`packages/intent-engine/src` has the evidence schema but no `brief-text` analyser), so every story renders mock evidence items from `src/components/fixtures.ts`, labelled as mock there. The rule or model line in the card reflects the item's `fromModel` field and claims nothing beyond it; no AI reading runs in this story.

## Story

As a person reading what ORIVILO took from my brief, I press "หลักฐาน" next to a fact and see the exact words of my brief it came from and whether a rule or an AI model read them, and when a fact has no quote, I am told so instead of seeing nothing.

## Rules

### ev-item-1

Both components take items of one type, `EvidenceItem`, exported from `src/components/evidence-span/span.ts`: `Pick<InputEvidence, "id" | "source" | "observation" | "fromModel"> & { inputKind: "brief-text" }`, with `InputEvidence` imported as a type from `@orivilo/intent-engine` (already a dependency in `packages/design-system/package.json`). The props map to the engine shape: the quote is `observation.quote`, the locator is `source.locator`, the basis is `fromModel`, the React key is `id`. `inputKind` is narrowed to `"brief-text"` so a website or photo item cannot be passed (spans point into the brief). No other field of the item is read.

### ev-span-1

`spanOf(item: EvidenceItem | undefined): string | null` in `span.ts` returns the quote to show, or `null` for a missing span. It returns `null` in each of these four cases: (1) `item` is undefined; (2) `item.observation.quote` is undefined; (3) `item.source.locator.kind` is not `"text"`; (4) the quote is empty after `trim()`. Otherwise it returns `observation.quote` unchanged (not trimmed). Worked example W1.

### ev-missing-1

When `spanOf` is `null`, EvidenceSpan renders the fact followed by the `evidence.missing` text as plain text: no button, no popover, no `aria-haspopup`. EvidenceList shows the same text in place of its trigger when its span count (`ev-count-1`) is 0.

### ev-api-1

Two new public components, exported from `@orivilo/design-system`:

- `EvidenceSpan` (`src/components/evidence-span/EvidenceSpan.tsx`, contract type `EvidenceSpanProps`): `children` (the fact, the caller's text), `item` (`EvidenceItem | undefined`), `open`, `defaultOpen` (default false), `onOpenChange(open: boolean)`. The three state props pass to our `Popover` unchanged. No size, no variant, no `className`.
- `EvidenceList` (`src/components/evidence-list/EvidenceList.tsx`, contract type `EvidenceListProps`): `items` (`readonly EvidenceItem[]`), `open`, `defaultOpen` (default false), `onOpenChange(open: boolean)`. The three state props pass to our `Collapsible` unchanged. No size, no variant, no `className`.

### ev-open-1

EvidenceSpan's card is our `Popover`: `PopoverTrigger` over the trigger of `ev-trigger-1`, `PopoverContent` holding the card of `ev-card-1`. It opens on a press only: click, Enter or Space, which Radix gives (K-0130). No hover, focus or pointer-enter handler opens it (open question 1). It is non-modal, Radix's default, which our `PopoverProps` does not change (open question 2). Esc closes it and returns focus to the trigger; a click outside closes it; both are Radix's (K-0130). The trigger's `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` and the card's `role="dialog"` are Radix's, never set by hand.

### ev-trigger-1

The trigger is a `<span class="ds-tag ds-evidence-span__trigger" data-size="sm">` holding a `<button type="button" class="ds-tag__main">` with a `<span class="ds-tag__label">` reading `evidence.trigger`, so it takes Tag's toggle-form look, hover and focus rules (`recipes.css` lines 3893 to 4003) and Tag's existing colour pairs (`pairs.ts` lines 916 to 933). `PopoverTrigger asChild` sits on the button. The button has no `aria-pressed`. Its accessible name is its visible text. Open question 3 holds the alternatives.

### ev-card-1

`PopoverContent` carries `aria-label` from `evidence.cardLabel` and the class `ds-evidence-card` beside `ds-popover`. Inside it, the shared piece `EvidenceQuote` (`src/components/evidence-span/EvidenceQuote.tsx`, not exported from the package) renders, in this order: a `<blockquote class="ds-evidence-quote__text">` with the quote from `spanOf`, and a `<p class="ds-evidence-quote__meta">` reading `evidence.sourceByModel` when `fromModel` is true and `evidence.sourceByRule` when it is false. The card has no focusable child; Radix moves focus to the content on open (K-0130, `Popover.tsx` comment), and `.ds-popover:focus-visible` shows its border and halo.

### ev-text-1

The quote renders as a React text child, never through `dangerouslySetInnerHTML` or a Markdown renderer, so markup in a quote shows as characters. Neither component renders an `<a>` element, and neither renders `source.ref` or `source.locator` (a ref may be a URL; the spans point into the brief).

### ev-count-1

The EvidenceList count is the number of `items` for which `spanOf` is not `null`. Its label is `evidence.countOne` when the count is 1 and `fill(evidence.count, { count })` otherwise (the singular form, as `canvas-board/delete-message.ts` line 20 selects `staleAfterDeleteOne`). A count of 0 follows `ev-missing-1`. Worked example W2.

### ev-list-1

EvidenceList renders our `Collapsible` (class `ds-evidence-list` on the root), whose `CollapsibleTrigger` label is the count label of `ev-count-1`, and whose `CollapsibleContent` holds a `<ul class="ds-evidence-list__items">` with one `<li>` per item for which `spanOf` is not `null`, in the order of `items`, each holding `EvidenceQuote` (`ev-card-1`). Items with a `null` span are not listed. Closed by default; the trigger, the icon swap, the fade and the reduced-motion rule are `Collapsible`'s, unchanged.

### ev-recipe-1

New recipe classes in `recipes.css`, each value a `--ds-*` or `--cmp-*` property or a keyword:

- `.ds-evidence-span`: `display: inline`.
- `.ds-evidence-span__trigger`: `vertical-align: baseline`, `margin-inline-start: var(--ds-space-inline-sm)`.
- `.ds-evidence-card`: `max-inline-size: var(--ds-size-panel-default)` (320 px; `.ds-popover` already caps it at the viewport less two gutters, W3).
- `.ds-evidence-quote__text`: `margin: 0`, `padding-inline-start: var(--ds-space-inline-sm)`, `border-inline-start: 2px solid var(--ds-border-subtle)` (decoration, like the dividers `pairs.ts` lines 7 to 11 leave out), type from the `--ds-type-body-md-*` properties, `min-inline-size: 0`, `overflow-wrap: anywhere`, no colour.
- `.ds-evidence-quote__meta`: `margin: 0`, `margin-block-start: var(--ds-space-stack-sm)`, type from the `--ds-type-body-sm-*` properties, no colour.
- `.ds-evidence-list__items`: `list-style: none`, `margin: 0`, `padding: 0`, `display: flex`, `flex-direction: column`, `gap: var(--ds-space-stack-sm)`.

No rule sets a colour, so text takes `popover.fg` in the card and the page's ink in the list, both existing pairs; `pairs.ts` is unchanged. No new token in any layer.

### ev-copy-1

Seven new locale keys under a new `evidence` group in `src/i18n/messages/th.ts` and `en.ts` (table "Copy"). The components own no other copy; the fact text is the caller's.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `EvidenceSpan`, `EvidenceList`, `EvidenceSpanProps`, `EvidenceListProps`, `EvidenceItem` (`ev-api-1`, `ev-item-1`) | Component API | New exports in `src/components/index.ts`; new catalog entries `catalog/application/evidence-span.yaml` (story `application-evidence-span`) and `catalog/application/evidence-list.yaml` (story `application-evidence-list`), status `draft`, recipes neutral, professional, friendly; two new rows in `catalog/coverage.md`. `EvidenceItem` reads `InputEvidence` from `@orivilo/intent-engine`: a change to `observation.quote`, `source.locator` or `fromModel` in `evidence.ts` needs a review of `span.ts` |
| `spanOf`, `countLabel` in `span.ts` (`ev-span-1`, `ev-count-1`) | Internal helper | Not exported from the package; unit tested in `span.test.ts` |
| Recipe classes `ds-evidence-span`, `ds-evidence-span__trigger`, `ds-evidence-card`, `ds-evidence-quote__text`, `ds-evidence-quote__meta`, `ds-evidence-list`, `ds-evidence-list__items` (`ev-recipe-1`) | Recipe | `recipes.css` only; `recipes.test.ts` checks every value. The trigger reuses the Tag classes `ds-tag`, `ds-tag__main`, `ds-tag__label` (`ev-trigger-1`): a later change to the Tag recipe changes EvidenceSpan's trigger, so the Tag catalog entry gains a line naming EvidenceSpan as a consumer. No new token, no new pair |
| Locale group `evidence` with seven keys (`ev-copy-1`) | Locale catalog | `src/i18n/messages/th.ts` and `en.ts`; `check-i18n` and `i18n.test.ts` check key and placeholder parity |
| `evidenceFixtures` | Fixture | `src/components/fixtures.ts` only, labelled mock; no component reads it |

Not changed: `Popover`, `Collapsible`, `Tag`, `Button` APIs and recipes; `pairs.ts`; any token or profile; `packages/intent-engine`; DirectionStudio; `apps/web` (Out of scope).

### Copy

Locale keys (`ev-copy-1`):

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `evidence.trigger` | หลักฐาน | Evidence |
| `evidence.cardLabel` | หลักฐานจากบรีฟ | Evidence from the brief |
| `evidence.sourceByRule` | จากบรีฟของคุณ อ่านด้วยกฎ | From your brief, read by rules |
| `evidence.sourceByModel` | จากบรีฟของคุณ อ่านด้วยโมเดล AI | From your brief, read by an AI model |
| `evidence.missing` | ไม่มีหลักฐาน | No evidence |
| `evidence.countOne` | ยกมาจากบรีฟ 1 ข้อความ | 1 quote from the brief |
| `evidence.count` | ยกมาจากบรีฟ {count} ข้อความ | {count} quotes from the brief |

Mock fixtures (`evidenceFixtures` in `fixtures.ts`, the comment says mock). Each item has `inputKind` `"brief-text"`, an 8-hex fixture `id`, and `source` with `ref` `"fixture:brief"`, a 64-zero `contentHash`, a fixed `retrievedAt`, `renderer` null; a text locator has `path` `"brief"` and `start` and `end` at the quote's place in `evidenceFixtures.brief` (from `indexOf`).

<!-- prettier-ignore -->
| Fixture | Fact (caller's text) | Observation kind, locator | Quote | `fromModel` |
| --- | --- | --- | --- | --- |
| `brief` (Thai) | not an item | not an item | ร้านบ้านกาแฟ อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน ใช้โทนไม้และแสงธรรมชาติ | not an item |
| `name` | ชื่อแบรนด์: บ้านกาแฟ | `brand-name`, text | ร้านบ้านกาแฟ | false |
| `warm` | บุคลิก: อบอุ่น | `personality-signal`, text | อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน | true |
| `mood` | อารมณ์: ไม้และแสงธรรมชาติ | `mood-word`, text | ใช้โทนไม้และแสงธรรมชาติ | false |
| `noQuote` | อุตสาหกรรม: ร้านกาแฟ | `industry-candidate`, element `brief` | none | false |
| `markup` | ข้อความทดสอบ | `text-span`, text | `<b>ตัวหนา</b> ในบรีฟ` | false |
| `long` | ชื่อบริษัท | `brand-name`, text | `fixtures.longThai` | false |
| `briefEn` and the `*En` items | Brand name: Baan Coffee / Personality: warm / Mood: wood and daylight / Industry: coffee shop | as the Thai rows | Baan Coffee wants guests to feel as warm as at a friend's home, with wood tones and daylight / Baan Coffee / feel as warm as at a friend's home / wood tones and daylight / none | as the Thai rows |

## Acceptance criteria

Story files: `Application/Evidence span` (id `application-evidence-span`, `EvidenceSpan.stories.tsx`) and `Application/Evidence list` (id `application-evidence-list`, `EvidenceList.stories.tsx`). Plays run in Thai (Storybook preview, `INITIAL_LOCALE` in the test run); `InEnglish` nests `LocaleProvider locale="en"` and the English fixtures. Unit tests: `src/components/evidence-span/span.test.ts`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Storybook test project, neutral, light, Thai | EvidenceSpan `Default` renders with `name` | "ชื่อแบรนด์: บ้านกาแฟ" then a pill "หลักฐาน"; no card | None. The button has `aria-haspopup="dialog"`, `aria-expanded="false"`, no `aria-pressed` (`ev-open-1`, `ev-trigger-1`) | `Default` play: `getByRole("button", { name: "หลักฐาน" })` attributes; `queryByRole("dialog")` is null |
| 2 | Same | The pill is clicked | A card under the pill: the quote "ร้านบ้านกาแฟ" with a line at its start edge, then "จากบรีฟของคุณ อ่านด้วยกฎ" | None. `getByRole("dialog", { name: "หลักฐานจากบรีฟ" })` holds a `blockquote` with text "ร้านบ้านกาแฟ" and the meta line (`ev-card-1`); `aria-expanded="true"` | `Default` play step, `userEvent.click`, `within(document.body)` |
| 3 | Same, card open | A click on the canvas outside the card | The card closes | None. `queryByRole("dialog")` is null, `aria-expanded="false"` (`ev-open-1`) | `Default` play step |
| 4 | Same | `Keyboard` play: Tab to the pill, press Enter | The card opens; focus is inside the card, its border and halo show | None. `document.activeElement` is inside the dialog (`ev-card-1`) | `Keyboard` play: `userEvent.tab()`, `toHaveFocus()`, `userEvent.keyboard("{Enter}")` |
| 5 | Same, card open after row 4 | Press Esc | The card closes and focus is back on the pill | None. `queryByRole("dialog")` is null; the pill `toHaveFocus()` (`ev-open-1`) | Same play: `userEvent.keyboard("{Escape}")` |
| 6 | Same, closed, focus on the pill | Press Space, then Esc | The card opens, then closes, focus back on the pill | None. Dialog present after Space, absent after Esc | Same play: `userEvent.keyboard(" ")`, then `{Escape}` |
| 7 | Same | The pill is hovered, then focused, with no press | Tag's hover and focus looks only; no card | None. `aria-expanded` stays `"false"` and no dialog after `userEvent.hover` and after `focus()` (`ev-open-1`) | `Default` play step |
| 8 | Same | `ByModel` renders with `warm` and the pill is clicked | Quote "อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน", then "จากบรีฟของคุณ อ่านด้วยโมเดล AI" | None. The meta line reads `evidence.sourceByModel` because `fromModel` is true (`ev-card-1`) | `ByModel` play |
| 9 | Same | `Missing` renders three EvidenceSpans: `item` undefined, `noQuote`, and `name` with its quote replaced by three spaces | Each fact followed by "ไม่มีหลักฐาน" as plain text; no pill | None. `queryAllByRole("button")` is empty; three `getByText("ไม่มีหลักฐาน")`; no `[aria-haspopup]` in the canvas (`ev-span-1` cases 1, 2, 4; case 3 is W1's last input in row 21; `ev-missing-1`) | `Missing` play |
| 10 | Same | `TextOnly` renders with `markup` and the pill is clicked | The card shows `<b>ตัวหนา</b> ในบรีฟ` as typed characters | None. The blockquote's `textContent` equals the quote; no `b` element and no `a` element in the dialog; "fixture:brief" is not in the document (`ev-text-1`) | `TextOnly` play |
| 11 | Same, English | EvidenceSpan `InEnglish` renders with `nameEn`, the pill is clicked | "Brand name: Baan Coffee", a pill "Evidence"; the card "Baan Coffee", "From your brief, read by rules" | None. Dialog name "Evidence from the brief" | `InEnglish` play |
| 12 | Storybook, a 360 px frame | EvidenceSpan `At360` renders with `long`, the pill is clicked | The fact and pill wrap inside the frame; the card is no wider than 320 px; the long Thai quote wraps inside it with no clipped marks | None. Frame `scrollWidth` not above 360; dialog `getBoundingClientRect().width` not above 320 (W3); blockquote `scrollWidth` not above its `clientWidth`; `expectNoGlyphClip` on the blockquote (`src/testing/visual-asserts.ts`) | `At360` play |
| 13 | Storybook test project | EvidenceSpan `InsideProfile` renders inside a `friendly` dark boundary and the pill is clicked | The card in Friendly's dark look | None. The dialog's nearest `[data-design-profile]` is `friendly` with `data-mode="dark"` (`PortalScope`) | `InsideProfile` play |
| 14 | Storybook test project | EvidenceSpan `RecipesAndModes` renders through `Matrix` | In each of six boundaries (neutral, professional, friendly, each light and dark) one fact with a pill and one with "ไม่มีหลักฐาน" | None. 6 pills, 6 missing texts | `RecipesAndModes` play counts; colour is Tag's and Popover's existing pairs, proven by `recipes.test.ts` and `pnpm contrast` with no new pair |
| 15 | Storybook test project, neutral, light, Thai | EvidenceList `Default` renders with `name`, `warm`, `mood`, `noQuote` (closed) | A ghost button "ยกมาจากบรีฟ 3 ข้อความ" with a chevron down; no list | None. `aria-expanded="false"`; no `li` in the canvas (`ev-count-1`, W2 row a) | `Default` play |
| 16 | Same | The trigger is clicked, then Enter is pressed on it | Open: three quotes, each with its meta line, in the order name, warm, mood; the chevron up. Then closed again | None. One `ul` with 3 `li`; each `li` holds a `blockquote`; `noQuote` is not listed (`ev-list-1`); `aria-expanded` `"true"` then `"false"` | `Default` play steps, `userEvent.click`, `userEvent.keyboard("{Enter}")` |
| 17 | Same | `One` renders with `name` only, and `Empty` renders with `noQuote` only | `One`: "ยกมาจากบรีฟ 1 ข้อความ". `Empty`: "ไม่มีหลักฐาน" as plain text, no button | None. `One` trigger name equals `evidence.countOne`; `Empty` has no button and no `ul` (`ev-count-1`, `ev-missing-1`, W2 rows b and c) | `One` and `Empty` plays |
| 18 | Same, English | EvidenceList `InEnglish` renders with `nameEn`, `warmEn`, `moodEn`, `noQuoteEn` and is opened, then `InEnglishOne` with `nameEn` | "3 quotes from the brief", then the three English quotes; "1 quote from the brief" | None. Trigger names as given | `InEnglish` and `InEnglishOne` plays |
| 19 | Storybook, a 360 px frame | EvidenceList `At360` renders open with `long` and `name` | The long Thai quote wraps inside the frame; no horizontal scroll; no clipped marks | None. Frame `scrollWidth` not above 360; `expectNoGlyphClip` on each blockquote | `At360` play |
| 20 | Storybook test project | EvidenceList `RecipesAndModes` renders through `Matrix` | In each of six boundaries one closed and one open list | None. 12 triggers: six `aria-expanded="false"`, six `"true"`; 6 open lists | `RecipesAndModes` play counts; contrast is Button ghost's pairs and the page ink, no new pair |
| 21 | Vitest, node | `span.test.ts` runs | Not a screen | `spanOf` returns the quote or `null` for the five inputs of W1; `countLabel` returns the three labels of W2 in Thai and English | `pnpm --filter @orivilo/design-system exec vitest run src/components/evidence-span/span.test.ts` |
| 22 | Storybook test project | The a11y addon runs on the stories of both files | Not a screen | Zero violations (DESIGN.md §11) | Vitest Storybook project output |
| 23 | The PR head | `check-catalog` and the copy checks run | Not a screen | The two catalog entries resolve; the seven `evidence` keys exist in Thai and English with matching placeholders (`ev-copy-1`); no middot or em dash in the new files | `pnpm --filter @orivilo/design-system test` output (check-catalog, `i18n.test.ts`, `check-i18n`) |
| 24 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens EvidenceSpan `Default` (open), `Missing`, `At360` and EvidenceList `Default` (open), `Empty`, `RecipesAndModes` | The pill reads as a control and not as a status; the quote reads as a quote; "ไม่มีหลักฐาน" reads as a statement, not a blank | None | Designer visual sign-off with screenshots in design.md, with the answers to open questions 1 to 3 |
| 25 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/evidence-span src/components/evidence-list` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/components/evidence-span/span.test.ts`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows per PR

Both components together, with the helper, recipe block, locale keys, fixtures, two story files and two catalog entries, are estimated at about 550 changed lines, over the 400-line guide, so two PRs are planned, split by component. The first carries EvidenceSpan and what it needs (the helper with `spanOf`, `EvidenceQuote`, the span and card recipe classes, the keys used by the card and the missing text, the fixtures): rows 1 to 14, 21 (the `spanOf` half), 22 to 25. The second carries EvidenceList on top of it (`countLabel`, the list recipe classes, the two count keys): rows 15 to 20, 21 (the `countLabel` half), 22 to 25. The main session adds the PR lines, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line once each PR exists.

## Out of scope

- A brief analyser that makes `brief-text` items; this story renders mock items only.
- Showing the position of a span in the brief (`source.locator` start and end): the engine's locator does not state whether offsets count code units or code points, and a Thai reader would not count either.
- Highlighting the span inside the brief text itself.
- Showing confidence, `belowFloor`, hypothesis notes or flags in the card.
- Evidence from website, photo or another brand's CI inputs (`ev-item-1` narrows `inputKind`).
- Moving DirectionStudio's quoted lines onto EvidenceSpan; a follow-up card.
- A hover-opened card, a modal card, a carousel of several quotes per fact (open questions 1 and 2).
- Any token, profile, `Popover`, `Collapsible`, `Tag` or `apps/web` change.
- Visual regression baselines (`.claude/rules/testing.md`).

## Open questions (with defaults)

1. Opening. Options: (a) press only (click, Enter, Space), as our `Popover` gives: by our reading outside SC 1.4.13, and keyboard, screen reader and touch users reach the card (K-0130, K-0134); (b) press plus hover and focus with an open delay, which must then meet the three 1.4.13 conditions (dismissible with Esc without moving the pointer, hoverable, persistent) and needs a hover-intent layer our `Popover` lacks (K-0134), and opening on focus would move focus into the card while tabbing; (c) a hover card, which Do not copy rules out (K-0129). Default: (a), which is `ev-open-1`.
2. Modal or non-modal card. Options: (a) non-modal, Radix's default and our `Popover`'s only form: no focus trap, the page stays readable beside the card, a click outside closes it (K-0130); the APG has no non-modal dialog pattern but its tooltip note points interactive hover content to one (K-0133); (b) modal, which traps focus and hides the page from assistive technology for a card with no control in it, and needs a `modal` prop added to `PopoverProps`, a Popover API change with its own impact list (K-0130, K-0133). Default: (a), which is `ev-open-1`.
3. Trigger look. Options: (a) Tag's toggle-form pill at size sm reading "หลักฐาน", Tag's hover, focus and pairs reused (`ev-trigger-1`, K-0135 Ours row); (b) a `Button` `link` variant, which DESIGN.md §8 keeps for "Go somewhere" (`text.link`) while this opens a card in place; (c) a numbered marker "1", "2" after each fact, a DESIGN.md §9 item 7 tell when the facts are not a sequence; (d) the fact text itself as the button with an underline, which turns the caller's text into a control and leaves no place for the missing text. Default: (a). Under (a) every pill on a reading has the same name "หลักฐาน"; the designer says whether the name should add the fact (a new key with a `{fact}` placeholder and a string `fact` prop).

## Depends on

- `docs/knowledge/design/K-0127` to `K-0135` (benchmark and standards, 2026-11-01); `K-0119`, `K-0120`, `K-0126` for the EvidenceList Untitled, shadcn and Standards cells.
- `docs/specs/ORV-64/audit.md` section B (table form), section C (Sources and InlineCitation rows), section D.1 row 8 (the story and its done-when).
- `docs/specs/ORV-203/spec.md` (Collapsible, the spec shape).
- `packages/intent-engine/src/evidence.ts` (`InputEvidence`, `TEXT_KINDS`, the quote and locator rules).
- `DESIGN.md` §7 (states), §8 (colour roles), §9 items 7 and 11, §10 (copy), §11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off; "Tokens and layers"; overlays and `PortalScope`).
- AGENTS.md rule 4 (label rule-based and model output), the data rule "text, never HTML".
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` (the Rows per PR form).
- ADR 0003 (Storybook and catalog), ADR 0012 (gates).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The map of `ev-span-1`. Input: the `name` fixture (quote "ร้านบ้านกาแฟ", text locator), the `noQuote` fixture (element locator, no quote), `name` with its quote set to three spaces, `undefined`, and a quote with a box locator (the schema refuses it, `evidence.ts` clause 4 and 16, but the component takes a Pick and checks it). Expected output, one line per input: `ร้านบ้านกาแฟ`, `null`, `null`, `null`, `null`.

```bash
node -e 'const spanOf=i=>{if(!i)return null;const q=i.observation.quote;if(q===undefined||i.source.locator.kind!=="text"||q.trim()==="")return null;return q};const t={kind:"text",path:"brief",start:0,end:12};[{observation:{kind:"brand-name",quote:"ร้านบ้านกาแฟ"},source:{locator:t}},{observation:{kind:"industry-candidate"},source:{locator:{kind:"element",path:"brief"}}},{observation:{kind:"brand-name",quote:"   "},source:{locator:t}},undefined,{observation:{kind:"brand-name",quote:"x"},source:{locator:{kind:"box",x:0,y:0,width:1,height:1}}}].forEach(i=>console.log(spanOf(i)))'
```

W2. The count label of `ev-count-1`. Input: (a) `name`, `warm`, `mood`, `noQuote` (three spans); (b) `name` (one); (c) `noQuote` (zero), with the Thai and English keys of the Copy table. Expected output: `3 ยกมาจากบรีฟ 3 ข้อความ / 3 quotes from the brief`, `1 ยกมาจากบรีฟ 1 ข้อความ / 1 quote from the brief`, `0 missing`. No rounding (integers).

```bash
node -e 'const k={th:{one:"ยกมาจากบรีฟ 1 ข้อความ",n:"ยกมาจากบรีฟ {count} ข้อความ"},en:{one:"1 quote from the brief",n:"{count} quotes from the brief"}};const lab=(c,l)=>c===1?k[l].one:k[l].n.replace("{count}",c);for(const spans of [[1,1,1,0],[1],[0]]){const c=spans.filter(Boolean).length;console.log(c,c===0?"missing":lab(c,"th")+" / "+lab(c,"en"))}'
```

W3. The card width of AC 12 (`ev-recipe-1`). Input: `size.panel.default` references `{size.80}` (`semantic.json` lines 916 to 920), `320px` (`primitives.json` lines 549 to 552); `.ds-popover` caps `max-width` at `calc(100vw - 2 * var(--ds-space-gutter))` (`recipes.css` line 841) with `space.gutter` referencing `{space.4}` (`semantic.json` lines 823 to 827), `16px` (`primitives.json` lines 475 to 478); a 360 px viewport. Expected output, px, no rounding: `320` (the smaller of 320 and 328).

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const v=r=>{const [g,k]=r.replace(/[{}]/g,"").split(".");return parseFloat(p[g][k].$value)};const panel=v(s.size.panel.default.$value),gut=v(s.space.gutter.$value);console.log(Math.min(panel,360-2*gut))'
```

## Changelog

- v1.0 (2026-11-01): first version, from K-0127 to K-0135 at `00f6b67` and audit D.1 row 8. Downstream to review: the designer envelope (design.md, open questions 1 to 3), the builder envelopes (two PRs, rows as in "Rows per PR"), the qa envelope (the Rows per PR lines once the PRs exist), `catalog/coverage.md` and the Tag catalog entry (consumer line).
