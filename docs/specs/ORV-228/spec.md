---
issue: ORV-228 (https://tpetkaew.atlassian.net/browse/ORV-228)
lane: as set on ORV-228 in Jira (not read in this role, which has no Jira tool); two new component public APIs are an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 25 ("Combobox, then Multi-select", done when "Async, empty and keyboard stories pass")
design: docs/specs/ORV-228/design.md (tasks ORV-228-design-1 and ORV-228-design-2, amendments A1 to A9 folded in v1.1, A10 to A16 in v1.3)
version: 1.3
---

# ORV-228: Combobox and Multi-select

## Benchmark

The comparison tables in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` line 34 names (owner, ORV-137 comment 10247). Every cell is from K-0290 to K-0319 (read 2026-11-06). Radix, cmdk and Base UI sit in the shadcn/ui row because shadcn/ui's two components are built on them; React Aria sits in the Untitled UI row for the same reason. The Ours row is the code in this worktree, as K-0319 records it, plus four lines read for this spec and marked "read here". The Add and Do not copy rows are this spec's choices, each pointing to the rule that holds it. Nothing here was run in a browser or with a screen reader.

### Combobox (one value from a long list, with search)

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | <https://www.untitledui.com/react/components/select>. Variants: none named; `Select.ComboBox` on React Aria, with `menuTrigger` fixed to "focus" (K-0291, K-0297). Sizes sm, md (default), lg. States: disabled, required, invalid; one item disabled (K-0290). Slots: item icon, avatar, supporting text, checkmark, checkbox or none (K-0290); leading search icon and an `aria-hidden` ⌘K hint with no key listener (K-0291). Async: no loading state in the Select or ComboBox files (K-0290, K-0291); the Command menu page has `filter={false}` with `inputValue` and `onInputChange` and states no pending state (<https://www.untitledui.com/react/components/command-menus>, K-0296). Empty: no text in the ComboBox file (K-0291); an `emptyState` node on Command menu (K-0296). Keyboard: no text on the page; React Aria's page says little beyond arrow keys under `manual` (K-0297). Under it: `allowsEmptyCollection`, `allowsCustomValue`, a count announcement while open, the value reverted to the chosen item on blur (K-0297). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/combobox>. Imports `@base-ui/react` even on the Radix URL (K-0298). Parts Combobox, Input, Content, Empty, List, Item, Group, Label, Collection, Separator, Chips, Chip, ChipsInput, Value, Trigger, Clear; examples Clear Button, Groups, Custom Items, Invalid, Disabled, Auto Highlight, Popup, Input Group, RTL; no size prop, no Async example, no keyboard text (K-0299). Base UI under it: `Combobox.Status` and `Combobox.Empty` are mounted live regions (K-0303); its Async samples show a prompt, "Searching…", an error and no match, and abort stale requests (K-0304). Command is on cmdk: `aria-expanded` fixed to true, Empty with role presentation, Loading with role progressbar, ArrowDown, ArrowUp, Home, End, Enter, an IME guard (K-0301, K-0302). Radix: no combobox package; `Select` is one value with no text input (K-0307). |
| Ours | No Combobox (`coverage.md` line 21). `Select` on Radix is the select-only kind (K-0308): `options` or `groups`, option `icon`, `description` and `disabled`, `emptyText`, sizes sm, md, lg, states default, hover, focus-visible, open, disabled, invalid, empty, Field wiring and `PortalScope` (`Select.tsx`, `select.yaml`); `select.yaml` lines 11 and 26 send search and async to Combobox. `CommandMenu` is a hand-built combobox with `aria-activedescendant`, `aria-autocomplete="list"`, ArrowDown, ArrowUp, Home, End, Enter, an empty line and a mounted `role="status"` count (`CommandMenu.tsx` lines 112 to 129, 163 to 180, 183, 241 to 243); no loading state. `CanvasChat` has a second one on a textarea with a listbox, a `role="status"` empty line and an IME guard (`CanvasChat.tsx` lines 717, 721 to 745, 802 to 814). `InputGroup` has `start`, `end` and `shortcut`. Popover is stable; Spinner and Skeleton are draft (`coverage.md` lines 31, 32, 39). `DESIGN.md` line 175 asks for "Async data, empty, keyboard". The package has `radix-ui` 1.8.1 and no `cmdk` or `@base-ui/react`. Read here: `.ds-menu` sizes itself from `--radix-select-*` (`recipes.css` lines 454 to 456), so a popup on Radix Popover needs its own sizing; Radix Popover's content has role dialog with `contentProps` spread after it (`@radix-ui/react-popover` 1.3.1, `dist/index.mjs` lines 280 and 285); a chosen and active `.ds-menu__option` has no mark of its own, as only `.ds-menu__item` has one (`recipes.css` lines 2299 to 2305); `CommandMenu.tsx` line 203 sets `aria-selected` from the active option. |
| Add | The editable kind as a component apart from `Select` (K-0308; audit.md line 166; `DESIGN.md` line 175): `cbx-kind-1`. The keys of K-0309, required and optional apart: `cbx-keys-1`. The attributes of K-0310: `cbx-aria-1`. One mounted live region for count, pending and empty (K-0303, K-0314, K-0115, `CommandMenu.tsx` lines 241 to 243): `cbx-status-1`. Pending and error as status text, stale requests dropped, `aria-busy` while options are missing (K-0304, K-0310, K-0113; `DESIGN.md` lines 200, 202): `cbx-async-1`. An empty line that invites an action (K-0292; `DESIGN.md` line 203): `cbx-status-1`. A clear button (K-0299): `cbx-api-1`. Option `icon`, `description` and groups as `Select` has them, sizes sm, md, lg (K-0290, `Select.tsx`): `cbx-api-1`. An IME guard (K-0302, K-0305, `CanvasChat.tsx` lines 807 to 814): `cbx-ime-1`. Option rows and field buttons that meet SC 2.5.8 (K-0315, our reading): `cbx-target-1`. |
| Do not copy | Fixed open on focus (K-0291): React Aria's own default is input (K-0297), and it brings the SC 1.4.13 question (K-0316, K-0134); `cbx-open-1`. The ⌘K hint with no key listener (K-0291): `kbd.yaml` line 18 says keys come from the command registry. `aria-expanded` fixed to true (K-0302): K-0310 asks for false when collapsed; `cbx-aria-1`. Empty with role presentation (K-0302): the line is a result a screen reader user would miss (K-0314, our reading); `cbx-status-1`. Hard-coded English such as "Search", "No items found." and "Command Palette" (K-0291, K-0299, K-0301): every string comes from the Thai and English catalog (`AGENTS.md`); `cbx-copy-1`. `opacity-50` for disabled (K-0290): `DESIGN.md` line 199 asks for contrast of at least 3.0. `role="combobox"` on a Button over Command (K-0301): cmdk's input is a combobox too (K-0302), so the sample has two, by our reading. |

### Multi-select (several values, shown as tags)

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | <https://www.untitledui.com/react/components/multi-select> and <https://www.untitledui.com/react/components/tags>. Sizes sm, md (default), lg (K-0292). Three forms. `MultiSelect`: a button opening a popover dialog with a search field and a multiple-selection listbox; the trigger shows a count and never the labels, no per-item remove, footer Reset and Select all do nothing until wired, empty state with a title, a description and Clear search, no loading state (K-0292). `TagSelect`: a combobox with tags before the input; a focused tag removes on Space, Enter or Backspace but not Delete, arrows move between tags, a keyboard removal moves focus to a neighbour, a pointer removal moves none, Backspace in an empty input moves to the previous tag without removing it, no loading state and no no-results text (K-0293). `InputTags`: Enter adds; empty, duplicate, past `maxTags` or failing `validate` is refused with no message (K-0295). `TagCloseX`: 14, 16 or 20 px at sm, md, lg (own arithmetic), always named "Remove this tag"; the Tags page says Backspace or Delete removes a focused tag (K-0294). |
| shadcn/ui | <https://ui.shadcn.com/docs/components/radix/combobox>. `Combobox` with `multiple`, `ComboboxChips`, `ComboboxValue`, `ComboboxChip`, `ComboboxChipsInput`, `useComboboxAnchor`; the remove button is ghost icon-xs at `opacity-50`, 24 px in a 22 px high chip in the new-york-v4 file (own arithmetic), and has no name in the files read (K-0300). The components list has no Tag, Chip or Multi Select (K-0301). Base UI under it: chips sit outside the tab order; Backspace or Delete on a chip removes it and moves focus to the chip now at that place, the new last chip or the input; the remove button sends focus to the input; Backspace in an empty input removes the last chip at once (K-0305). `aria-multiselectable` in multiple mode (K-0303). No screen reader strings shipped; the docs ask the author for `aria-description` and `aria-label` and to translate them; "Limiting visible chips" is a docs heading (K-0306). Chosen items stay merged in the async list (K-0304). Radix: `Select` has no multiple option (K-0307). |
| Ours | No Multi-select: no row in `coverage.md`; audit.md line 35 says none, "build after Combobox and Tag", and line 156 says "Tag input after Tag lands". `Tag` is draft (`coverage.md` line 23): sizes sm, md, states default, hover, focus-visible, selected, disabled; a real remove button named `tag.remove`, "Remove {label}" and "ลบ {label}" (`Tag.tsx` lines 73 to 83, `en.ts` line 108, `th.ts` line 112); a long label truncates with `title`; no key handler, no focus code and no group. Remove width 24 px; tag height 24 px at sm and 32 px at md (`generated.css` lines 1546, 1549, 1550). `CanvasChat` lists mentions as `Tag size="sm"` with `onRemove` in a named `ul` (`CanvasChat.tsx` lines 752 to 760); `changeMentions` (lines 294 to 297) has no focus call. `Badge` is a read-only status word, not a chosen-value control. |
| Add | Chosen items as `Tag` with its named remove (`Tag.tsx`; K-0293, K-0300): `ms-api-1`. A key to remove a focused tag and one rule for focus after removal (K-0293, K-0305, K-0312, K-0318): `ms-keys-1`, `ms-focus-1`. `aria-multiselectable` on the list (K-0303, K-0311): `ms-choose-1`. Instructions and a count as catalog strings (K-0306, `AGENTS.md`): `ms-status-1`. Clear all as a button outside the list (K-0292, K-0312): `ms-api-1`. Chosen items that stay reachable under async results (K-0304): `ms-choose-1`. A live confirmation of a removal (K-0312, K-0314): `ms-status-1`. Left for later: a limit on visible tags (K-0306) and free tag entry with a message on refusal (K-0295; `DESIGN.md` line 252; audit.md line 156), open question 10. |
| Do not copy | A count-only trigger (audit.md line 360 asks for tag entry; K-0292): `ms-api-1`. One fixed name "Remove this tag" (K-0294): two tags would share one name, by our reading of SC 4.1.2 (K-0317); ours has "Remove {label}". A nameless remove (K-0300, K-0306): SC 4.1.2 (K-0317). A 14 to 20 px close (own arithmetic, K-0294): `cbx-target-1`. A remove at `opacity-50` until hover (K-0300): faint when not hovered, and `DESIGN.md` line 199 sets 3.0 even for disabled. Silent refusal (K-0295): `DESIGN.md` line 252. Real checkboxes inside options (K-0312), if the `checkbox` indicator of K-0290 proves interactive, which was not read. Footer buttons that do nothing without a callback (K-0292). Hard-coded "{count} selected" and "Reset" (K-0292, `AGENTS.md`): `ms-copy-1`. Delete left out of the tag keys (K-0293): the Tags page, Base UI and the APG example use it (K-0294, K-0305, K-0312). |

### Not read

K-0319 lists these as not read, and this spec does not fill them from memory: Untitled UI's API tables on the select, multi-select, tags, inputs and command-menus pages, `input-tags-outer.tsx`, `popover.tsx`, `CheckboxBase` and the Command menu source; shadcn/ui's `cn-combobox-chip*` style files, its Select page, and whether the docs still show `combobox-demo`; Base UI's `useButton`, Autocomplete and the parts of its page the narrow prompts did not reach; React Aria's `tokenfield` folder and tag hooks; the license files of cmdk and Base UI (their entries are `link-only`); ARIA 1.2's role listbox and option sections. How well `aria-description` is supported was not read either (K-0319, Open points), so `ms-status-1` does not use it.

## Goal

ORIVILO's Studio needs people to pick from lists too long to scan: a `Select` has no search, takes one value and cannot wait for results. This story gives the design system a Combobox (one value, with search) and a Multi-select (several values shown as tags), with async, empty and keyboard stories passing (audit D.3 row 25). `select.yaml` line 26 already sends search to Combobox, and `Tag` is waiting for its chosen-value use.

What is simulated: no server search exists. The `search` prop is a real contract, but every async story runs a labelled mock over `comboboxFixtures` (`cbx-stories-1`), with no network, and the story says so. The filter is a rule-based substring match (`cbx-filter-1`), not a semantic search, and nothing here is AI. No screen reader was used for any claim in this spec; plays assert the attributes and the status text, not what a reader speaks.

## Story

As a person filling a form in the Studio, I type a few letters into a field and pick from the matching options by keyboard or pointer, and when I need several I see each as a tag I can remove. When a search is running, fails or finds nothing, the field tells me so, in Thai or English.

## Design amendments

design.md sets the look, and its amendments A1 to A16 are taken in at the places below. An amendment to a rule is marked there by its number, and an amendment to a row is mapped in the table. The proof of A1 to A9 was static markup in Chromium only, with the popup in the flow and the `--radix-popover-*` values set by script (design.md line 12). So real Radix positioning and collision, key and pointer behaviour, the portal and WebKit stay unproven until the row named here passes on the real component.

A10 to A16 come from the rework of sign-off 1 on head 02ef2ad (findings F1 and F2, design.md section "Rework from sign-off 1"). Their proof was the real Combobox stories with the CSS injected, the thumb a script stand-in and `story.css` in place of the `Sizes` classes, plus a separate mount of the real `ScrollArea` (design.md lines 512 to 515). So the real `Combobox.tsx` with `ScrollArea` in it, and a key or a press against it, stay unproven until the row named here passes on the real component. WebKit, iOS, forced colours and a screen reader were not run for them, and no row here runs them.

<!-- prettier-ignore -->
| Amendment | Taken in at | Rests on, and not run in the design | Row that proves it |
| --- | --- | --- | --- |
| A1 | `cbx-recipe-1` | Real Radix positioning and the portal: the popup's width, its gap, its cap and the room left | 4, 12, 22 |
| A2 | `cbx-recipe-1` | None of the four; measured on static markup, repeated on the component | 17 |
| A3 | `cbx-recipe-1` | The portal: the line inside the real popup | 14, 22, 37 |
| A4 | `cbx-async-1` | Key behaviour: a real search phase behind the ring and the glyph | 31, 35 |
| A5 | `cbx-aria-1` | Key behaviour: a real choice | 6 |
| A6 | `ms-api-1` | Pointer behaviour: a press on the ground. Real Radix positioning: a field that grows under an open popup | 43, 44, 48, 56 |
| A7 | `ms-recipe-1` | WebKit: `display: contents` and `field-sizing` | 54, 56, and 60 through `ms-webkit-1` |
| A8 | `ms-choose-1` | Key behaviour: a real choice in a scrolled list | 45 |
| A9 | Row 54 | None of the four | 54 |
| A10 | `cbx-recipe-1` | The `LeastWidth` story, which the design ran only as a form of `Sizes` in a 6rem cell | 17 |
| A11 | `cbx-recipe-1`, `cbx-base-1` | The real `Combobox.tsx` with `ScrollArea`: in the stories the thumb was a stand-in, and the real `ScrollArea` ran apart from them | 12, 22 |
| A12 | `cbx-recipe-1`, "Contract changes and impact" | The two pairs in `recipes.test.ts`: the design read their ratios from the rendered tokens | 27 |
| A13 | Row 12 | Key behaviour and a press on the thumb, whose first run is this row's plays (design.md line 515) | 12 |
| A14 | Row 17 | The Tailwind container classes of `Sizes`, for which `story.css` stood in | 17 |
| A15 | Row 22 | The real thumb at Radix's available height | 22 |
| A16 | Row 28, `cbx-base-1` | None | 28 |

## Rules

### cbx-base-1

Default of open question 1. The popup is Radix Popover from `radix-ui`, used directly as `Select.tsx` uses Radix Select: `Popover.Root` (non-modal, Radix's default), `Popover.Anchor asChild` on the `.ds-combobox` root, `Popover.Portal` with `PortalScope` inside it, and `Popover.Content` with `side="bottom"`, `align="start"` and `sideOffset={4}`, the offset `Select.tsx` line 117 has. Radix gives the position, the portal, the collision handling and Escape, and `ScrollArea` gives the list's drawn thumb (A11). On `Popover.Content`: `role="presentation"` (this replaces Radix's `role="dialog"`, since DOM focus stays in the input and the popup is not a dialog); `onOpenAutoFocus` and `onCloseAutoFocus` call `preventDefault`; `onInteractOutside` calls `preventDefault` when the target is inside the `.ds-combobox` root. The input, list, options and keys are hand-built, as `CommandMenu.tsx` and `CanvasChat.tsx` are, in one internal hook `useComboboxList` that Combobox and MultiSelect share. No dependency is added to `packages/design-system/package.json`. This keeps to the rule that behaviour comes from `radix-ui` for everything Radix has; Radix has no combobox (K-0307), so the keys and attributes are ours, and rows 5 to 9 are their proof.

### cbx-kind-1

Default of open question 2. Combobox is the editable kind with list autocomplete and manual selection (K-0308): `aria-autocomplete="list"`, no option is active until a key or the pointer makes one so, and the typed text is never the value. The value is limited to listed options.

### cbx-value-1

An option is identified by its `value`. Choosing sets the value, puts the option's `label` in the input, closes the list and calls `onValueChange` once. Text typed after that changes nothing until a new choice. When focus leaves with edited text, the text reverts to the chosen label, or to empty with no value, and `onValueChange` is not called (K-0297). Reopening without an edit shows the whole list, with the chosen option marked. `name` renders one `<input type="hidden">` with the option's `value`, and none with no value.

### cbx-open-1

Default of open question 3. The list opens on a text edit, on the keys in `cbx-keys-1` and on a press of the chevron button. It never opens on focus or on a click in the input. The chevron is an icon-only ghost `Button` (`size="sm"`) in the `end` slot of `InputGroup`, with `tabIndex={-1}`, since the keys already reach the list (K-0309); its name is `combobox.open` closed and `combobox.close` open, and it is `disabled` with the field.

### cbx-keys-1

DOM focus stays in the input (K-0310). Moves skip disabled options and wrap (K-0290, K-0309), by the method of W5. The active option is scrolled into view by script (K-0309). Required and optional are as K-0309 marks them; the rest of the table is this spec's choice, and it answers open question 11.

<!-- prettier-ignore -->
| Key | List closed | List open | K-0309 |
| --- | --- | --- | --- |
| Down Arrow | Opens, first enabled option active | Next enabled option active | Required |
| Up Arrow | Opens, last enabled option active | Previous enabled option active | Optional |
| Alt + Down Arrow | Opens, no option active | No effect | Optional |
| Alt + Up Arrow | No effect | Closes, text kept | Optional |
| Enter | Browser default | With an active option: chooses it, `preventDefault`. With none: chooses nothing, browser default | Required |
| Escape | Browser default | Closes through Radix, text kept, focus stays in the input | Required |
| Home, End | Caret | With an active option: first or last enabled option. With none: caret | Optional |
| Left Arrow, Right Arrow | Caret | Caret, and no option stays active | Required when editable |
| A printable key | Edits the text | Edits the text, and no option stays active | Required when editable |
| Backspace, Delete | Edits the text | Edits the text, and no option stays active | Optional |
| Tab | Moves on | Closes, chooses nothing, moves on; `cbx-value-1` applies | Not stated |
| Page Up, Page Down | Browser default | Browser default | Not in the editable pattern read |

### cbx-pointer-1

Moving the pointer over an enabled option makes it active. A press on an option chooses it, and its `onMouseDown` calls `preventDefault` so focus stays in the input (K-0305 does this on its remove button). A press outside the `.ds-combobox` root closes the list through Radix.

### cbx-ime-1

While a composition runs, the key handler returns at once, by the three tests of `CanvasChat.tsx` lines 506 to 510 (`isComposing`, keyCode 229, a flag set by `onCompositionStart` and cleared after `onCompositionEnd`). Text changes during a composition still filter.

### cbx-aria-1

Input: `role="combobox"`; `aria-expanded` is `"true"` exactly while the listbox is in the DOM and `"false"` otherwise; `aria-controls` names the listbox only while it is in the DOM; `aria-autocomplete="list"`; `aria-activedescendant` names the active option, and is absent with none; no `aria-haspopup`, as listbox is implicit (K-0310). The name comes from `Field` through `for` and `id`, or from `aria-label`.

Listbox: `role="listbox"`, `aria-label` from `combobox.list`, in the DOM when the list is open and has options, or when `cbx-async-1` marks it busy. Option: `role="option"`; `aria-selected` is `"true"` on the chosen option and `"false"` on the others, and it never follows the active option (K-0310, K-0312), unlike `CommandMenu.tsx` line 203; no `aria-checked` (open question 4); `aria-disabled="true"` when disabled; a description through `aria-describedby`, as `Select.tsx` line 175 does. Group: `role="group"` named by its heading. Options use the existing classes and attributes: `ds-menu__option` with `data-highlighted` when active, `data-state="checked"` when chosen, `data-disabled`, `data-described` and `data-icon`. A chosen option shows `CheckIcon className="size-4 shrink-0"` after its label, as `Select.tsx` line 188 does (A5).

### cbx-filter-1

With `options` or `groups`, an option stays when `matches(label + " " + description, query)` is true. `matches` keeps the method of `CommandMenu.tsx` lines 28 to 31: trim, lower case, substring, and a blank query matches. It is copied to `src/components/combobox/options.ts`, so that Combobox does not import the board code, and `CommandMenu` is left as it is. No Thai folding: a query missing a tone mark does not match (open question 12, W1). A group with no option left is not rendered. Disabled options stay and count.

### cbx-status-1

Default of open question 6. One live region: `<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">` inside the `.ds-combobox` root and outside the portal, mounted from the first render with empty text, so it stays mounted through open and close (K-0303). Its text comes from `statusKey` in `options.ts`, W3:

1. List closed: empty.
2. Phase `pending`: `combobox.pending`.
3. Phase `error`: `combobox.error`.
4. No options and a blank query: `combobox.prompt` with `search`, otherwise `emptyText` or `select.empty`.
5. No options: `combobox.empty` with the query.
6. One option: `combobox.countOne`. More: `combobox.count`.

Disabled options count; a group heading does not. The visible line carries the same text as cases 2 to 5, in the popup and outside the listbox: `<div class="ds-menu__empty">` with no role, never `role="presentation"`. Its text sits in a `<span>` child, because `.ds-menu__empty` is a flex row and `expectLinesClear` puts its two forced lines in a clone of the element it is given, which on the flex row would lie side by side. There is no visible line for case 6. The query is a React text child, so markup in it shows as characters. `combobox.empty` invites the next action in words and has no button, as popup content stays out of the Tab sequence (K-0309). A caller who knows a better action passes `emptyText`.

### cbx-async-1

With `search`, there is no local filter (K-0296, K-0304). A text edit to a non-blank query aborts the previous request through its `AbortSignal`, sets the phase to `pending` and calls `search(query, signal)`. A blank query aborts the request and calls nothing. Only the newest request's result lands, even when the caller ignores the signal. There is no debounce (K-0304): aborting bounds stale work, and the mock costs nothing. While `pending`: the listbox is in the DOM with `aria-busy="true"` and no option (K-0310, K-0113), and the visible line starts with a `decorative` `Spinner` at `size="sm"`, since this control owns its status (`spinner.yaml` line 25). A rejection that is not an abort sets the phase to `error`, and the visible line takes `data-tone="error"` and starts with `WarningIcon`, `aria-hidden`; the next text edit searches again (A4). An abort shows nothing. The chosen option is an object held by the component, so a list that no longer returns it changes neither the value nor the input.

### cbx-api-1

New public component `Combobox` (`src/components/combobox/Combobox.tsx`, contract `ComboboxProps`), exported from `@orivilo/design-system`, with `ComboboxOption` and `ComboboxGroup` as aliases of `SelectOption` and `SelectGroup`:

- Items, one of: `options`; `groups`; `search(query: string, signal: AbortSignal): Promise<readonly ComboboxOption[]>` (added with `cbx-async-1`). Never two.
- `value` (`ComboboxOption | null`), `defaultValue`, `onValueChange(option: ComboboxOption | null)`.
- `placeholder` (default `combobox.prompt`), `emptyText` (default `select.empty`), `size` (`ControlSize`, default `md`), `disabled`, `invalid`, `required`, `name`, `id`, `aria-label`, `aria-describedby`, `className`.
- `clearable` (default false): an icon-only ghost `Button` in the `end` slot before the chevron, named `combobox.clear`, shown with a value and not disabled. A press sets the value to `null`, empties the text and puts focus in the input.

The field is `InputGroup` unchanged, with the combobox attributes passed through its input props and `Field` wiring through `useFieldControl`. No read-only state: `Select` has none, and a page shows a read-only value as text. A profile changes the look only: which options exist, and which are disabled, comes from the caller.

### cbx-target-1

Each pointer target of the field and the list is at least 24 by 24 CSS px (K-0315): the chevron, the clear button and option rows, at sm, md and lg. At sm the slot rule would make a Button 22 px high (`recipes.css` line 442, W4), so `cbx-recipe-1` raises it to `--ds-size-icon-lg`. The one exception is `ms-target-1`.

### cbx-recipe-1

New recipe classes in `recipes.css`, each value a `--ds-*` or `--cmp-*` property, a local `--_*`, a Radix variable or a keyword, placed after `.ds-menu` so they win. design.md, section "Builder table", holds the full CSS block; this list says what each class must do.

- `.ds-combobox`: block, full width. With one field, `min-width: min-content`, and its input `width` and `min-width` `--ds-size-control-lg`, so the field holds its least width, the slot stays in the field and the chevron keeps `Select`'s place in any container (A10).
- `.ds-combobox__popup`, beside `ds-menu`: `width` and `min-width: var(--radix-popover-trigger-width)`, `max-width: var(--radix-popover-content-available-width)`, `max-height: min(var(--radix-popover-content-available-height), var(--ds-size-panel-default))`, flex column (A1).
- `.ds-combobox__scroll` (Radix `ScrollArea.Root`, `type="auto"`): flex column, `min-height: 0`. `.ds-combobox__list` (its Viewport): `overflow-y: auto`, `min-height: 0`, and Radix's inner wrapper set to block. `.ds-scroll__bar` and `.ds-scroll__thumb` in it take design.md D17: the thumb sits in the popup's end padding, clear of the corner, in `--cmp-scroll-area-thumb-hover` at rest and `--cmp-scroll-area-thumb` on hover, and shows exactly while the list overflows. No row count is promised at the popup's foot (A11).
- `.ds-combobox__popup .ds-menu__empty`: `overflow-wrap: anywhere`, so a long Thai query wraps; start aligned, gap `--cmp-button-gap`, `padding-block: var(--cmp-menu-padding)`; its `svg` takes the option icon size and sits on the first line; `[data-tone="error"]` reads `--cmp-menu-option-fg-destructive` (A3).
- `.ds-combobox__popup .ds-menu__option[data-state="checked"][data-highlighted]`: the form of `recipes.css` lines 2301 to 2305, so a chosen and active option shows `--ds-focus-ring` on its edge and selection and focus never read the same (`DESIGN.md` line 201).
- `.ds-combobox .ds-input-group__slot > .ds-button`: square, of side `--_b`, the inner field height less twice `--cmp-input-group-inset`, and `--ds-size-icon-lg` at sm; gap `--cmp-input-group-inset`; only the last button in the end slot takes the end margin, which puts its glyph where `Select`'s chevron sits; ink `--cmp-input-icon` until hover or disabled (A2).

No new token. Option, highlighted, selected, description, disabled, empty line, destructive and "checked highlighted ring" are existing `menu` pairs (`pairs.ts` lines 273 to 318, 676 to 698), and the slot buttons' ink is the existing `control` pair `input.icon` on `input.bg` (`pairs.ts` line 258). Two new `menu` pairs at the UI floor: `scroll-area.thumb-hover` and `scroll-area.thumb` on `menu.bg` (A12).

Known limit, with no requirement here: an active option that is not chosen keeps the system's ground alone, `menu.option.bg-hover`, as `Select`, `DropdownMenu`, `CommandMenu` and `CanvasChat` do (design.md D12). design.md reads that ground at 1.10 to 1.50 on `menu.bg`, so the mark is faint. ORV-242 holds the active option mark across every list.

### cbx-copy-1

The keys of the table "Copy, Combobox", in `src/i18n/messages/th.ts` and `en.ts`. Combobox reads `select.empty` as it stands and owns no other copy; the option text is the caller's.

### cbx-stories-1

Story files `Base/Combobox` (id `base-combobox`, `Combobox.stories.tsx`) and `Base/Multi select` (id `base-multi-select`, `MultiSelect.stories.tsx`). Plays run in Thai (`INITIAL_LOCALE` in the test run). An English twin of story `X` is `XInEnglish`: the same render inside `LocaleProvider locale="en"`, with the `En` fixtures. The members are listed here, and rows point to these lists.

- PR A stories with an English twin (`cbx-twins-a`): `Default`, `Sizes`, `LeastWidth`, `WithValue`, `Open`, `ActiveOnChosen`, `NoMatch`, `NoOptions`, `Grouped`, `IconsAndDescriptions`, `Clearable`, `Invalid`, `Disabled`, `DisabledOption`, `Missing`.
- PR A stories with no twin, as they add no variant or state: `Keyboard`, `Pointer`, `LongList`, `LongListFriendly`, `Composition`, `InsideProfile`, `InsideDialog`, `At360`, `At360Friendly`, `RecipesAndModes`.
- PR B stories with an English twin (`cbx-twins-b`): `Async`, `AsyncPending`, `AsyncResults`, `AsyncEmpty`, `AsyncError`.
- PR B stories with no twin: `AsyncStale`, `AsyncChosen`, `AsyncRecipesAndModes`.
- PR C stories with an English twin (`ms-twins`): `Default`, `Sizes`, `WithValue`, `Open`, `NoMatch`, `NoOptions`, `Async`, `ClearAll`, `Invalid`, `Disabled`.
- PR C stories with no twin: `Keyboard`, `LongList`, `RemoveKeys`, `Pointer`, `Refused`, `Composition`, `ManyTagsAt360`, `InsideProfile`, `RecipesAndModes`.

Hover and focus-visible are interaction states, not stories of their own (`.claude/rules/design-system.md` line 36), so in both locales a play step of `Open` hovers an option and a play step of `Default` tabs to the input.

Fixtures are `comboboxFixtures` in `src/components/fixtures.ts` (table "Mock fixtures"). The mock is `createMockSearch()`, whose comment says MOCK and which holds each call until the play releases or fails it, so no play waits for time. The async stories show `comboboxFixtures.mockNote` under the field.

### cbx-ink-1

How a visual row proves Thai ink in a clip, so a row names only its element. For each element below: walk from the element's parent up to its frame and assert computed `overflow-x` and `overflow-y` are `visible` on every ancestor below the frame; prove the ink with `expectLabelInkWhole(el)` for one line or `expectLinesClear(el)` for wrapped text; prove the frame's clip with `expectFrameCutsNoInk(el, frame)`, on `develop` through PR 186.

<!-- prettier-ignore -->
| Element | Lines | Frame |
| --- | --- | --- |
| Option label (`.ds-menu__option > span:first-child`) | One | `.ds-combobox__list` |
| Option description (`.ds-menu__option-description`) | Wrapped | `.ds-combobox__list` |
| Visible line (`.ds-menu__empty > span`) | Wrapped | `.ds-combobox__popup` |
| Tag label (`.ds-tag__label`) | One | `.ds-tag` |

Two bounds of these helpers, read from `visual-asserts.ts`. `expectFrameCutsNoInk` sets `overflow: visible` on the element itself, so a label that ends in an ellipsis would show its cut text and fail; such a label takes `expectLabelInkWhole` alone. `expectLabelInkWhole` reads a clone placed after the element, and `.ds-menu__option > span:first-child` does not select that clone, so on the option label it sees no clip; there `expectFrameCutsNoInk` on a label with stacked marks is the proof.

The text inside an `<input>` is not a text node, so these helpers cannot read it; the designer's screenshots are its check.

### ms-api-1

New public component `MultiSelect` (`src/components/multi-select/MultiSelect.tsx`, contract `MultiSelectProps`), exported from `@orivilo/design-system`. It takes what `cbx-api-1` lists, except: `value` and `defaultValue` are `readonly ComboboxOption[]`; `onValueChange(options: readonly ComboboxOption[])`; `name` renders one hidden input per chosen option; `clearable` shows a button named `multiSelect.clearAll`, which empties the value, puts focus in the input and calls `onValueChange` once.

Chosen items render before the input as `<ul aria-label={multiSelect.chosen}>` of `<li>` holding `Tag` with `onRemove` and `disabled` from the field, and the option's `label`. `Tag` is not changed. Tag size: sm in a sm field, md in md and lg. The trigger never collapses to a count. The field is a `div.ds-input-group` in the `.ds-combobox` root, with `data-multiple`, the `ds-input-group__input` class on the input so the group's focus edge works, and the same chevron as `cbx-open-1`. The `ul` and the input sit in `.ds-combobox__values`, which wraps, and the end slot stays beside it on the first row. With no tags there is no `ul`. The placeholder shows only with no tags. A press on the ground of `.ds-combobox__values` puts focus in the input (A6).

### ms-choose-1

Default of open question 8. The listbox has `aria-multiselectable="true"`, and each chosen option has `aria-selected="true"`, with the same attribute as `cbx-aria-1`. Enter on the active option, or a press, toggles it: a choice adds a tag in choice order and an unchoice removes it. The list stays open, the text empties and no option stays active. When the text was already empty the list keeps its scroll position; when it held a query the list refills from the top (A8). Space stays a typed character, as focus is in an editable input (K-0309, open question 11). A chosen option stays in the list. In async use, a tag outlives the query that found it (K-0304). When focus leaves, leftover text empties.

### ms-keys-1

Default of open question 5, first half. The key handler sits on the `ul` and on the input, so `Tag` needs no key code. A tag's focus target is its remove button, a natural Tab stop (open question 9).

<!-- prettier-ignore -->
| Key | Where | Effect |
| --- | --- | --- |
| Backspace | Input, empty, with tags | Focus moves to the last tag's remove button; nothing is removed |
| Left Arrow | Input, caret at 0, nothing selected, with tags | Same move |
| Delete, Backspace | Remove button | Removes that tag; `ms-focus-1` applies |
| Enter, Space | Remove button | The button's own press removes that tag; `ms-focus-1` applies |
| Left Arrow | Remove button | Previous tag's remove button; none on the first tag |
| Right Arrow | Remove button | Next tag's remove button, or the input from the last tag |
| Escape | Remove button | Focus moves to the input |

The keys of `cbx-keys-1` hold in the input otherwise. Focus moving from the input to a tag closes the list.

### ms-focus-1

Default of open question 5, second half. After any removal, by key or pointer, focus goes to `nextFocus(index, count)` of W2, with `count` taken before the removal: the tag now at that place, the new last tag, or the input when none is left (K-0305). One rule for key and pointer (K-0293 moves none on a pointer press, K-0305 moves to the input): focus never falls to the page, and on a phone it does not raise the keyboard on each removal. If the parent refuses the removal (`ms-status-1`), focus stays.

### ms-status-1

The region of `cbx-status-1` is shared. When `value` changes between renders, the region shows `multiSelect.added` or `multiSelect.removed` with the label, or `multiSelect.cleared` for a change that empties two or more, until the next text edit. The line comes from the diff of the `value` the component holds, not from the key or press, so a controlled parent that refuses a change produces no confirmation (AGENTS.md, no success state without backing data). The input takes `aria-describedby` to an `sr-only` element holding `multiSelect.count` or `multiSelect.countOne`, then `multiSelect.help`, with no count at zero; `aria-description` is not used (see "Not read").

### ms-target-1

Default of open question 13. The remove button of a sm `Tag` is 24 by 22 px, as the 24 px tag loses 2 px to its border (`recipes.css` lines 3911 to 3913, 3982 to 3986, W4; not measured before this spec). It stays, under the Spacing exception of SC 2.5.8 (K-0315): a 24 px circle on its centre stays inside its own tag, and the tag's label part is not a target. Row 54 measures it. The md remove is 24 by 24.

### ms-recipe-1

Added to `cbx-recipe-1`, same terms: `.ds-combobox__values` (flex, wrap, gap from `--cmp-tag-gap`, `min-width: 0`, the inset of design.md D9 as its padding), `.ds-combobox__tags` (`display: contents`, list reset, so the input flows after the last tag), and `.ds-input-group[data-multiple]` (no `flex-wrap`, height growing with its rows, the corner of design.md D9). The input's height and least width are those of design.md D11, the slot's height is one row, and a disabled tag takes the edge of design.md D10 (A7). `Tag` pairs stand: `tag.fg` and `tag.remove-fg` on `tag.bg`, `focus.ring` on `tag.bg` (`pairs.ts` lines 916, 927, 928). The tag's rest edge is decorative (`pairs.ts` line 918), so `tag.bg` on `input.bg` needs no pair. Its hover edge pair is against `surface.card` (`pairs.ts` line 919), and `--cmp-input-bg` reads `--ds-surface-card` (`generated.css` line 913), so the field's ground needs none either.

### ms-webkit-1

Nothing in this repo runs WebKit: the `storybook` project has one `chromium` instance (`packages/design-system/vite.config.ts` line 40), CI installs Chromium only (`.github/workflows/ci.yml` line 57), and `apps/web/playwright.config.ts` line 27 has one `chromium` project. So `display: contents` and the `field-sizing` fallback of A7 are unproven there, and row 60's addon, which runs in Chromium, proves neither. PR C adds no WebKit to the repo. The builder runs one scratch Playwright script on the PR head, against a Storybook of that head, in `webkit`, after `pnpm --filter @orivilo/design-system exec playwright install webkit`:

1. `WithValue`: `page.accessibility.snapshot({ interestingOnly: false })`, which has a WebKit backend in Playwright 1.56.1 (`lib/server/webkit/wkAccessibility.js`), holds a list named by `multiSelect.chosen` with one item per tag.
2. `ManyTagsAt360`, at a width of 360 px, with a long query typed: each tag's right edge and the input's right edge lie inside the field, and the chevron stays on the first row.

The script and its output go in the builder's `verified`. A failure blocks PR C and goes back to the designer, as the markup or the recipe has to change. This reads the WebKit engine that Playwright ships, on the builder's machine. It is not Safari and not a screen reader run.

### ms-copy-1

The keys of the table "Copy, Multi-select". `tag.remove` names each remove button as it stands.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | PR | Impact |
| --- | --- | --- | --- |
| `Combobox`, `ComboboxProps`, `ComboboxOption`, `ComboboxGroup` (`cbx-api-1`) | Component API | A | New exports in `src/components/index.ts`; new `catalog/base/combobox.yaml` (story `base-combobox`, status `draft`, sizes sm, md, lg, recipes neutral, professional, friendly); `catalog/coverage.md` line 21 moves from `none` to `draft`; `select.yaml` line 26 loses "later". The aliases mean a change to `SelectOption` or `SelectGroup` reaches Combobox |
| `search` prop (`cbx-async-1`) | Component API | B | Widens the items union of `ComboboxProps`; `combobox.yaml` gains the async rules |
| `MultiSelect`, `MultiSelectProps` (`ms-api-1`) | Component API | C | New export; new `catalog/base/multi-select.yaml` (story `base-multi-select`); a new row in `catalog/coverage.md`; a new row in `DESIGN.md` §6 ("Pick several of a long list", Multi-select, then "Async data, empty, keyboard, tag removal"); `tag.yaml` gains a consumer line, since a change to Tag moves the field |
| Recipe classes of `cbx-recipe-1` and `ms-recipe-1` | Recipe | A, C | `recipes.css`; `recipes.test.ts` checks each value. They read `ds-menu__option`, `ds-menu__empty`, `ds-input-group` and `ds-scroll__bar`, so a change to those recipes moves both components. Two new pairs in `pairs.ts` (A12). No token in any layer, no profile |
| `pairs.ts`: `scroll-area.thumb-hover` and `scroll-area.thumb` on `menu.bg`, recipe `menu`, UI floor (A12) | Recipe | A | The first pairs that read these two tokens: `pairs.ts` has no `scroll-area` line today. `recipes.test.ts` checks them under neutral, professional and friendly in both modes, so a profile that moves `--ds-text-tertiary`, `--ds-border-strong` or `--ds-surface-raised` (`generated.css` lines 1398, 1397, 1160) now answers to the UI floor on a menu. The ratios are in design.md, "Tokens and contrast". The thumb on any other ground stays unpaired, as it is now |
| `Combobox.tsx`: the listbox moves into `ScrollArea` from `radix-ui` (`cbx-recipe-1`, A11), in the markup of design.md, "Rework from sign-off 1", item 2 | Internal | A | `ComboboxProps` does not change, and no dependency is added, as `radix-ui` is already there. `.ds-combobox__list` stays the listbox, the scroll box and the frame of `cbx-ink-1`, so rows 12, 22 and 45 read the same node. Radix puts a wrapper between the listbox and its options, so a change to that wrapper in `radix-ui` reaches the options' width; the `LongList` play reads it. The package's `ScrollArea` component is not used, as it sets `role="region"`, a label and a Tab stop on its Viewport (`ScrollArea.tsx` lines 33 to 35) and focus stays in the input |
| `combobox.yaml`: the popup rule gains the thumb line, and a new rule gives the field's least width and when to stack fields, in the words of design.md, "Rework from sign-off 1", item 1 | Catalog | A | `catalog/base/combobox.yaml` only. It is the caller's source for the least width, so a change to the recipe's least width moves this line too. PR B adds its async rules to the same entry |
| Locale groups `combobox` (10 keys, 8 in A and 2 in B) and `multiSelect` (8 keys, in C) | Locale catalog | A, B, C | `th.ts`, `en.ts`; `check-i18n` and `i18n.test.ts` check key and placeholder parity |
| `comboboxFixtures`, `createMockSearch` | Fixture | A, B | `src/components/fixtures.ts` only, labelled mock; no component reads them |
| `useComboboxList`, `options.ts` (`matches`, `statusKey`, `nextActive`, in C `nextFocus`) | Internal | A, C | Not exported from the package; unit tested in `options.test.ts` |
| Runtime dependency | Package | None | None under the default of open question 1. Option (a) or (b) adds one, which is an owner-facing cost and brings a `security` review of the PR (`.claude/skills/ovl/SKILL.md` step 6) |

Not changed: `Select`, `Tag`, `InputGroup`, `Popover`, `ScrollArea`, `Spinner`, `CommandMenu`, `CanvasChat` and their recipes; any token or profile; `apps/web`. `.claude/rules/design-system.md` line 33 says a shared component "is built on a shadcn primitive"; shadcn's Combobox is on Base UI (K-0298), so the default of open question 1 departs from that line in the same way `CommandMenu` does, and the decision is recorded there.

## Copy

Copy, Combobox (`cbx-copy-1`):

<!-- prettier-ignore -->
| Key | Thai | English | PR |
| --- | --- | --- | --- |
| `combobox.prompt` | พิมพ์เพื่อค้นหา | Type to search | A |
| `combobox.list` | ตัวเลือก | Options | A |
| `combobox.open` | เปิดรายการ | Show options | A |
| `combobox.close` | ปิดรายการ | Hide options | A |
| `combobox.clear` | ล้างค่าที่เลือก | Clear the choice | A |
| `combobox.countOne` | พบ 1 รายการ | 1 result | A |
| `combobox.count` | พบ {count} รายการ | {count} results | A |
| `combobox.empty` | ไม่พบ "{query}" ลองคำอื่น | No match for "{query}". Try another word. | A |
| `combobox.pending` | กำลังค้นหา | Searching | B |
| `combobox.error` | ค้นหาไม่สำเร็จ แก้คำค้นแล้วลองอีกครั้ง | The search failed. Change the text and try again. | B |

Copy, Multi-select (`ms-copy-1`):

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `multiSelect.chosen` | รายการที่เลือก | Chosen items |
| `multiSelect.countOne` | เลือกแล้ว 1 รายการ | 1 chosen |
| `multiSelect.count` | เลือกแล้ว {count} รายการ | {count} chosen |
| `multiSelect.help` | กดลูกศรซ้ายเพื่อไปยังรายการที่เลือก แล้วกด Delete เพื่อลบ | Press Left Arrow to reach the chosen items, then Delete to remove one. |
| `multiSelect.added` | เพิ่ม {label} แล้ว | {label} added |
| `multiSelect.removed` | ลบ {label} แล้ว | {label} removed |
| `multiSelect.clearAll` | ล้างทั้งหมด | Clear all |
| `multiSelect.cleared` | ล้างรายการที่เลือกแล้ว | All chosen items cleared |

Existing keys read as they stand: `select.empty` ("ไม่มีตัวเลือก", "No options"), `tag.remove` ("ลบ {label}", "Remove {label}").

Mock fixtures (`comboboxFixtures`, the comment says mock). `label` is "หัวข้อ" and `labelEn` "Topic"; `multiLabel` is "หัวข้อที่สนใจ" and `multiLabelEn` "Topics"; `error` is "เลือกหัวข้อที่งานนี้สังกัด" and `errorEn` "Choose the topic this work belongs to"; `mockNote` is "ตัวอย่างนี้ค้นจากข้อมูลจำลอง ไม่ได้เชื่อมต่อเซิร์ฟเวอร์" and `mockNoteEn` "This sample searches mock data, with no server". `long` is 40 options "ตัวเลือกที่ {n}", n from 1 to 40. `options` and `optionsEn`, in this order:

<!-- prettier-ignore -->
| `value` | Thai label | English label | Note |
| --- | --- | --- | --- |
| `save` | `fixtures.thai` | Save changes | |
| `latin` | `fixtures.latin` | Brand guide | |
| `closed` | ปิดรับแล้ว | Closed | `disabled: true` |
| `canvas` | `fixtures.mixed` | The team's Brand Canvas project | |
| `pinto` | `fixtures.thaiMarks` | Pinto | Stacked marks |
| `logo` | `fixtures.thaiMarks2` | Logo | Stacked marks |
| `long` | `fixtures.longThai` | `fixtures.longLatin` | No spaces |

## Acceptance criteria

"The canvas" below is Storybook's test project, neutral, light, Thai, unless the row says otherwise. Rows 1 to 29 are PR A, 30 to 42 PR B and 43 to 63 PR C. A row that names a rule proves that rule on the row's fixture and does not add to it.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | The canvas, Combobox in a `Field` labelled "หัวข้อ" | `Default` renders | The label, the placeholder "พิมพ์เพื่อค้นหา", a chevron; no list | None. `getByRole("combobox", { name: "หัวข้อ" })` has `aria-expanded="false"`, `aria-autocomplete="list"`, no `aria-controls`, no `aria-activedescendant`, no `aria-haspopup` (`cbx-aria-1`) | `Default` play |
| 2 | Same | "แบรนด์" is typed | A list with one option, the long Thai name; no option marked | Listbox named "ตัวเลือก" holds 1 option; input `aria-expanded="true"`, `aria-controls` equals the listbox id, no `aria-activedescendant`; the status reads "พบ 1 รายการ" (`cbx-filter-1`, `cbx-status-1`, W1) | `Default` play step, `userEvent.type` |
| 3 | Same, fresh render | The input takes focus by Tab, then by a click | The field's focus edge; no list | `aria-expanded` stays `"false"`; `queryByRole("listbox")` is null after both (`cbx-open-1`) | `Keyboard` play first steps; `expectFocusBorderForm` on `.ds-input-group` |
| 4 | Same | The chevron is pressed, then pressed again | The list opens with 7 options, then closes; focus stays in the input | The button's name reads "เปิดรายการ", then "ปิดรายการ", then "เปิดรายการ"; the status reads "พบ 7 รายการ" while open; the input `toHaveFocus()`; on the real popup, the proof of A1 that design.md did not run, its width and `left` equal those of `.ds-input-group` and its `top` is 4 px below the field's `bottom` (`cbx-open-1`, `cbx-base-1`, `cbx-recipe-1`) | `Open` play, `getBoundingClientRect()` |
| 5 | Same | Down Arrow, Down Arrow, Down Arrow, then Up Arrow, Up Arrow, Up Arrow | The mark moves down, skips "ปิดรับแล้ว" and comes back, then wraps to the last option | `aria-activedescendant` follows `save`, `latin`, `canvas`, `latin`, `save`, `long`; `data-highlighted` is on that option only; `aria-selected` stays `"false"` on each (`cbx-keys-1`, `cbx-aria-1`, W5) | `Keyboard` play, `userEvent.keyboard` |
| 6 | Same, `latin` active | Enter, then Down Arrow | The input shows "Save changes" and the list closes; then the whole list reopens, "Save changes" chosen, with a check at the row's end | `onValueChange` called once with `latin`; the input `toHaveFocus()`; after reopening, 7 options, `latin` has `aria-selected="true"` and the other six `"false"`, and only `latin` holds the check `svg` (`cbx-value-1`, `cbx-aria-1`) | `Keyboard` play step, `fn()` spy |
| 7 | Same, text "ปิ่", list open | Escape; then Alt + Down Arrow; then Alt + Up Arrow | The list closes and the text stays; it opens with no option marked; it closes | `aria-expanded` `"false"`, `"true"`, `"false"`; no `aria-activedescendant` after the second step; `onValueChange` not called (`cbx-keys-1`) | `Keyboard` play step |
| 8 | Same, list open on 7 options, `canvas` active | End, Home, Left Arrow; then Down Arrow, then "ก" | The mark goes to the last option, then the first, then no option; then the first again, then the text gains "ก" | `aria-activedescendant` is `long`, `save`, absent, `save`, absent (`cbx-keys-1`) | `Keyboard` play step |
| 9 | Same, value `latin`, text edited to "abc", a button after the field | Tab | The list closes, focus is on the button, the input shows "Save changes" again | `onValueChange` not called (`cbx-keys-1`, `cbx-value-1`) | `Keyboard` play step |
| 10 | Same, list open | The pointer moves over "โลโก้" and presses it; then the list reopens and a press lands outside the field | The option takes the hover mark and is chosen; the list then closes | `aria-activedescendant` is `logo` before the press; `onValueChange` once with `logo`; the input keeps focus through the press; `queryByRole("listbox")` null after the outside press (`cbx-pointer-1`) | `Pointer` play, `userEvent.hover`, `userEvent.click` |
| 11 | Same, value `latin` | `ActiveOnChosen` opens the list and moves onto `latin` | The chosen fill with a focus line on its edge, unlike a chosen option that is not active and unlike an active option that is not chosen | The line is in `--ds-focus-ring`, 1 px, on the option's edge (`cbx-recipe-1`): computed `outline-width` is `1px` and `outline-color` is that token. Edge ink reads 4 px on all four sides when active and 0 px at rest, not 1 px, because the line lies inside the 4 px inset halo of `--_focus-shadow-inset` (`orivilo.css` line 45) and `expectEdgeInk` counts line and halo as one band. The read uses reach 8, not the default 4, so that the pixel line ends on the option's fill past the band | `ActiveOnChosen` play: `expectEdgeInk` on the option at rest and active; read from pixels, not from one property |
| 12 | Same, `long` fixture (40 options) | Down Arrow 30 times | The list scrolls with the mark | The active option's box lies inside the `.ds-combobox__list` box; `scrollTop` above 0; with the field near the top of the frame, the popup's height is 320 px, the cap of A1 on real Radix values; a thumb shows in the popup's end padding, off the rows, clear of the corner and at least 18 px long, at 40 px rows and, in `LongListFriendly`, at 44 px rows; it moves down with the list; a press on it keeps focus in the input and the list open; `Open` has a thumb only if its list overflows (`cbx-keys-1`, `cbx-recipe-1`, W6, W8) | `LongList`, `LongListFriendly` and `Open` plays, `getBoundingClientRect()` |
| 13 | Same, list open, `save` active | A `compositionstart` fires, then Enter with `isComposing` true; then `compositionend`, then Enter | Nothing chosen at the first Enter; the option chosen at the second | `onValueChange` not called, then called once (`cbx-ime-1`) | `Composition` play, `fireEvent` |
| 14 | Same | `NoMatch`: "ปิน" is typed | A panel with the line `ไม่พบ "ปิน" ลองคำอื่น`; no options | No listbox; input `aria-expanded="false"`, no `aria-controls`; the status reads the same text, and it is the same DOM node as before typing; the line has no `role` (`cbx-status-1`, W1, W3) | `NoMatch` play: node held before typing, `toBe` after |
| 15 | Same | `NoOptions` renders `options: []` and the chevron is pressed; a second field has `emptyText` "ยังไม่มีหัวข้อ เพิ่มหัวข้อก่อน" | "ไม่มีตัวเลือก"; the second shows its own text | The status reads the same text; no listbox (`cbx-status-1`) | `NoOptions` play |
| 16 | Same | `Grouped` renders two headed groups, one option in each with an icon, and "ปิ่น" is typed; `IconsAndDescriptions` renders icons and descriptions | One group left, its heading above "ปิ่นโต้"; icon and second line as in `Select` | `role="group"` named by its heading; a group with no match is not in the DOM; the description is read through `aria-describedby`, and the option's name stays the label (`cbx-aria-1`, `cbx-filter-1`) | `Grouped` and `IconsAndDescriptions` plays |
| 17 | The canvas | `Sizes` renders sm, md, lg, `clearable`, with a value, each beside a `Select` of its size | Three fields of 32, 40 and 48 px | Heights equal `size.control.*`; at each size the chevron, the clear button and, when open, an option row meet `cbx-target-1` (W4). Both slot buttons are square, of 24, 30 and 38 px (W6), and their boxes do not overlap; the chevron glyph's centre lies as far from the field's end as the `Select` chevron's, and at rest its computed `color` equals that chevron's; the input is at least `--ds-size-control-lg` wide, the slot stays inside the field and the value reads whole; all of this at the default viewport and again at 360 by 640, where the row is one column; `LeastWidth` proves the same in a 96 px cell, with the popup at the field's width (`cbx-recipe-1`, A2, A10) | `Sizes` and `LeastWidth` plays, `getBoundingClientRect()`; `expectSameHeight` on the field and a sibling `Input` of its size |
| 18 | The canvas, `Clearable`, value `latin` | Tab reaches the clear button, Enter | The text empties, the clear button goes, focus is in the input | `onValueChange` once with `null`; button named "ล้างค่าที่เลือก" (`cbx-api-1`) | `Clearable` play |
| 19 | The canvas | `Invalid`, `Disabled` and `DisabledOption` render; in `DisabledOption` the list opens and "ปิดรับแล้ว" is pressed | `Invalid`: the danger edge and the message "เลือกหัวข้อที่งานนี้สังกัด". `Disabled`: the disabled look, no list on a press or a key. `DisabledOption`: nothing chosen | `aria-invalid="true"`, message linked by `aria-describedby`; input and chevron `disabled`; the option has `aria-disabled="true"`, `onValueChange` not called (`cbx-api-1`, `cbx-aria-1`) | The three plays |
| 20 | The canvas | `WithValue` renders value `canvas` with `name="topic"`; `Missing` renders value `null` | "โปรเจกต์ Brand Canvas ของทีม" in the input; the placeholder, never a blank | Hidden input `topic` has value `canvas`; in `Missing` there is no hidden input (`cbx-value-1`) | `WithValue` and `Missing` plays |
| 21 | The canvas | `InsideProfile` opens inside a `friendly` dark boundary; `InsideDialog` opens the list in a `Dialog`, presses an option, reopens, presses Escape twice | The list in Friendly's dark look; in the dialog the option is chosen, the first Escape closes the list only, the second closes the dialog | The popup's nearest `[data-design-profile]` is `friendly` with `data-mode="dark"`; after one Escape `getByRole("dialog")` remains, and after two it is gone (`cbx-base-1`) | `InsideProfile` and `InsideDialog` plays |
| 22 | A 360 by 640 viewport | `At360` opens the list on `options`, then types `fixtures.longThai` plus "x"; then a second field, its top 240 px down a frame 340 px high, opens on the `long` fixture | The field and the list inside the frame; the long option on one line with an ellipsis; then the line wraps inside the panel; then the second list inside the frame, shorter than the cap | Frame `scrollWidth` not above 360; popup `left` not below 0 and `right` not above 360, viewport-relative (the form of `Select.stories.tsx` lines 96 to 138); `cbx-ink-1` on the option label of `pinto` and on the visible line. The second popup, which proves the collision of A1 that design.md did not see: `top` not below 0, `bottom` not above 640, height below 320 px, so Radix's available height decides and not the cap, and the thumb shows as in row 12, at 40 px rows here and at 44 px rows in `At360Friendly`. The field sits 240 px down because at 300 px the room above it holds the cap, so the popup flips up at 320 px and proves nothing shorter; at 240 px neither side holds the cap, and the popup stays below at 300.2 px (W7). The popup carries `collisionPadding` 8, so a list never touches the screen edge: without it the real popup ended at 640.2 of 640, as its `top` rounds to 332 while its available height is counted from 331.8 (W7) | `At360` and `At360Friendly` plays, `inVitest` guard on the ink helpers |
| 23 | The canvas | `RecipesAndModes` renders through `Matrix` | In six boundaries (neutral, professional, friendly, each light and dark): a field with a value, one invalid, one disabled | The play opens the valued field of each cell in turn; each popup's nearest boundary equals its cell's; no `Field` nested in a `Field` | `RecipesAndModes` play; colour by `recipes.test.ts` and `pnpm contrast` |
| 24 | The canvas, English | The twins of `cbx-twins-a` render | The same states in English: "Type to search", "Show options", "Clear the choice", `No match for "zzz". Try another word.`, "No options", "1 result", "7 results" where each state shows them | The status and names read those strings | One play per twin, asserting the strings of its state |
| 25 | The canvas | The a11y addon runs on the stories of `Combobox.stories.tsx` | Not a screen | Zero violations (`DESIGN.md` §11) | Vitest Storybook project output |
| 26 | Vitest, node | `options.test.ts` runs | Not a screen | `matches` gives W1's counts; `statusKey` gives W3's keys for the rows without phases and those with; `nextActive` gives W5's indexes | `pnpm --filter @orivilo/design-system exec vitest run src/components/combobox/options.test.ts` |
| 27 | The PR head | `check-catalog`, the copy checks and the recipe checks run | Not a screen | `catalog/base/combobox.yaml` resolves to `base-combobox`; the 8 PR A keys exist in Thai and English with matching placeholders; no middot or em dash in the new files; the classes of `cbx-recipe-1` pass `recipes.test.ts`; `packages/design-system/package.json` has no new dependency | `pnpm --filter @orivilo/design-system test` and `pnpm contrast` output; `git diff` of `package.json` |
| 28 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Sizes`, `LeastWidth`, `Open`, `ActiveOnChosen`, `LongList`, `NoMatch`, `Invalid`, `At360`, `RecipesAndModes` on the PR head | The field reads as one control with `Select`; focus, active and chosen read as three different things, with the known limit of `cbx-recipe-1` named in the sign-off; Thai stacks whole in the input | None | Designer visual sign-off (`reviewer.v1`, empty `write_set`); the main session posts its PNG paths as a Jira comment on ORV-228 |
| 29 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/combobox` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/components/combobox/options.test.ts`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 30 | The canvas, `Async` with `createMockSearch` | The story renders and the chevron is pressed | The note "ตัวอย่างนี้ค้นจากข้อมูลจำลอง ไม่ได้เชื่อมต่อเซิร์ฟเวอร์" under the field; a panel with "พิมพ์เพื่อค้นหา" | The mock's call count is 0; the status reads "พิมพ์เพื่อค้นหา"; no listbox (`cbx-async-1`, `cbx-status-1`, `cbx-stories-1`) | `Async` play |
| 31 | Same | `AsyncPending`: "ปิ่" is typed and the mock is held | A panel with a turning ring and "กำลังค้นหา" | Mock called once with "ปิ่"; listbox has `aria-busy="true"` and no option; input `aria-expanded="true"`; the status reads "กำลังค้นหา"; the `Spinner` adds no second `role="status"`, and its ring has `data-size="sm"` (`cbx-async-1`) | `AsyncPending` play: `getAllByRole("status")` length 1 |
| 32 | Same, row 31 | `AsyncResults`: the mock releases one option | The list with "ปิ่นโต้" | No `aria-busy`; the status reads "พบ 1 รายการ" | `AsyncResults` play |
| 33 | Same | `AsyncStale`: "ปิ่" is typed, then "ปิ่น"; the second call is released first, then the first | The list from the second query, unchanged by the first | The first call's `signal.aborted` is true; the options equal the second result after both releases, also with a mock that ignores its signal (`cbx-async-1`) | `AsyncStale` play |
| 34 | Same | `AsyncEmpty`: "zzz" is typed and the mock releases nothing | `ไม่พบ "zzz" ลองคำอื่น` | No listbox, `aria-expanded="false"`; the status reads the same | `AsyncEmpty` play |
| 35 | Same | `AsyncError`: the mock fails; then a letter is typed | "ค้นหาไม่สำเร็จ แก้คำค้นแล้วลองอีกครั้ง" with the error tone and the warning glyph; then "กำลังค้นหา" | The status reads each text; a second mock call; an abort in row 33 shows no error line; the failed line has `data-tone="error"` and holds one `aria-hidden` `svg`, and the pending line after it has no `data-tone` (`cbx-async-1`) | `AsyncError` play |
| 36 | Same | `AsyncChosen`: an option is chosen, then the text is edited to a query the mock answers without it, then focus leaves | The chosen label back in the input | Value unchanged, `onValueChange` once in total (`cbx-async-1`, `cbx-value-1`) | `AsyncChosen` play |
| 37 | The canvas, and a 360 by 640 viewport | `AsyncRecipesAndModes` renders through `Matrix`; `At360` gains a held search and a failed one | In six boundaries (neutral, professional, friendly, each light and dark) a field that opens the pending panel; at 360 the error line wraps inside the panel | Each popup's nearest boundary equals its cell's; `cbx-ink-1` on the visible line | `AsyncRecipesAndModes` and `At360` plays |
| 38 | The canvas, English | The twins of `cbx-twins-b` render | "This sample searches mock data, with no server", "Type to search", "Searching", "1 result", `No match for "zzz". Try another word.`, "The search failed. Change the text and try again." in their states | The status reads those strings | One play per twin |
| 39 | The canvas | The a11y addon runs on the `Async` stories | Not a screen | Zero violations, including the busy listbox with no option (K-0310) | Vitest Storybook project output |
| 40 | The PR head | `options.test.ts`, the copy checks and `check-catalog` run | Not a screen | `statusKey` gives W3's phase rows; the 2 PR B keys exist in both locales; `combobox.yaml` names the async rules; no middot or em dash in the changed files | `pnpm --filter @orivilo/design-system test` output |
| 41 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Async`, `AsyncPending`, `AsyncEmpty`, `AsyncError` on the PR head | The waiting, empty and failed panels read as three states; the mock note reads as a note | None | Designer visual sign-off (`reviewer.v1`, empty `write_set`); the main session posts its PNG paths as a Jira comment on ORV-228 |
| 42 | The PR head | The affected suites run | Every play and test passes | None | The commands of row 29, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 43 | The canvas, MultiSelect in a `Field` labelled "หัวข้อที่สนใจ" | `Default` renders | The label, the placeholder, a chevron; no tags, no list | Input `role="combobox"` by that name; no `aria-describedby` count; no hidden input; `queryByRole("list")` is null in the field (`ms-api-1`, `ms-status-1`) | `Default` play |
| 44 | Same | "ปิ่" is typed, Down Arrow, Enter; then Down Arrow, Enter | A tag "ปิ่นโต้" before the input, the list still open, the text empty; then a second tag "บันทึกการเปลี่ยนแปลง" | `onValueChange` with `[pinto]`, then `[pinto, save]`; listbox has `aria-multiselectable="true"`; each chosen option `aria-selected="true"`, no `aria-checked`; the status reads "เพิ่ม ปิ่นโต้ แล้ว", then "เพิ่ม บันทึกการเปลี่ยนแปลง แล้ว"; the input's description reads "เลือกแล้ว 2 รายการ" then `multiSelect.help`; the input has no `placeholder` once a tag exists (`ms-choose-1`, `ms-status-1`, `ms-api-1`) | `Open` play |
| 45 | Same, `pinto` chosen, list open; `LongList` on the `long` fixture | Enter on `pinto`; then in `LongList`, with empty text, Down Arrow 30 times and Enter; then "ตัวเลือกที่ 3" is typed, Down Arrow 10 times and Enter | The tag goes; the option stays in the list, no longer chosen; the long list stays where it was after the first pick; it shows its top after the second | `onValueChange` with `[]`; `aria-selected="false"`; the status reads "ลบ ปิ่นโต้ แล้ว". The proof of A8 on real keys: `.ds-combobox__list` `scrollTop` is above 0 and unchanged by the first Enter; it is above 0 before the second Enter and 0 after it, with 40 options back (`ms-choose-1`) | `Keyboard` play step; `LongList` play |
| 46 | Same, three tags, empty input | Backspace; Left Arrow; Right Arrow, Right Arrow; then Left Arrow at caret 0; then Escape | Focus moves to the last tag's remove, then the second, then the third, then the input, then the third, then the input | Nothing removed in any step; `onValueChange` not called; focus in the named buttons "ลบ {label}" (`ms-keys-1`) | `Keyboard` play, `toHaveFocus()` per step |
| 47 | Same, three tags | `RemoveKeys`: focus on the first tag's remove, Delete; focus on the last tag's remove, Backspace; focus on the one left, Delete | Tags go one by one; focus lands on the tag now first, then the new last tag, then the input | `onValueChange` three times; focus as W2's rows `0 3`, `1 2`, `0 1`; the status reads "ลบ {label} แล้ว" each time (`ms-focus-1`, W2) | `RemoveKeys` play |
| 48 | Same, three tags | `Pointer`: the middle tag's remove is pressed; then Enter on the remove that has focus; then a press lands on the ground of `.ds-combobox__values` | The tag goes, and focus lands on the tag now at that place; then that tag goes, and focus lands on the one left; then focus is in the input, with no list | `onValueChange` twice; `toHaveFocus()` as W2's rows `1 3`, `1 2`; the proof of A6 on a real press: the input `toHaveFocus()` and `aria-expanded` stays `"false"` (`ms-focus-1`, `ms-api-1`, `cbx-open-1`) | `Pointer` play, `userEvent.click` |
| 49 | Same, controlled, a parent that refuses every change | `Refused`: the first tag's remove takes Delete | The tag stays | `onValueChange` called once; the status stays empty; focus stays on that remove (`ms-status-1`, `ms-focus-1`) | `Refused` play |
| 50 | Same, list open, `save` active | A space is typed; then a composition with Enter as in row 13 | The text gains a space and `save` stays unchosen; nothing chosen during the composition | `onValueChange` not called (`ms-choose-1`, `cbx-ime-1`) | `Composition` play |
| 51 | Same, `createMockSearch`, the mock note shown | `Async`: "ปิ่" is typed and released, Enter on the option; "zzz" is typed and released | The tag stays while the panel shows `ไม่พบ "zzz" ลองคำอื่น` | Value keeps `pinto`; the tag's remove still works (`ms-choose-1`, `cbx-async-1`) | `Async` play |
| 52 | Same | `NoMatch` types "ปิน"; `NoOptions` renders `options: []` | The line of row 14; "ไม่มีตัวเลือก" | No listbox; the status reads the same (`cbx-status-1`) | The two plays |
| 53 | Same, three tags, `clearable` | `ClearAll`: "ล้างทั้งหมด" is pressed | The tags go; focus in the input | `onValueChange` once with `[]`; the status reads "ล้างรายการที่เลือกแล้ว" (`ms-api-1`, `ms-status-1`) | `ClearAll` play |
| 54 | The canvas | `Sizes` renders sm, md, lg with two tags each | Tags inside the field at each size | At rest the field heights equal `size.control.*`. The md and lg removes meet `cbx-target-1`; the sm remove meets `ms-target-1`, measured from `getBoundingClientRect()` of the remove and its tag (W4); the input's height equals the tag's: 24, 32 and 32 px (W6) | `Sizes` play, `getBoundingClientRect()`; `expectSameHeight` on the tags of a row |
| 55 | The canvas | `Invalid` and `Disabled` render with two tags | The danger edge with the message; disabled tags with no remove action | `aria-invalid="true"`; each remove and the input are `disabled` | The two plays |
| 56 | A 360 by 640 viewport | `ManyTagsAt360` renders `pinto`, `logo`, `long`, `canvas`, `save` chosen; then the chevron opens the list and `latin` is chosen | Tags wrap inside the field; the long Thai label ends in an ellipsis; the input keeps a row or a place to type; the chevron stays on the first row; the list follows the field as it grows | Frame `scrollWidth` not above 360; each tag's right edge inside the field; the long tag's `title` holds the full text; `cbx-ink-1` on the tag label of `pinto` and on that of `long`; the chevron's `top` is above the first tag's `bottom`; after the choice, the proof on real Radix positioning that design.md did not run, `waitFor` reads the popup's `top` 4 px below the field's new `bottom` (`ms-api-1`, `ms-recipe-1`) | `ManyTagsAt360` play, `inVitest` guard |
| 57 | The canvas | `InsideProfile` opens inside a `friendly` dark boundary | The list in Friendly's dark look | The popup's nearest `[data-design-profile]` is `friendly` with `data-mode="dark"` | `InsideProfile` play |
| 58 | The canvas | `RecipesAndModes` renders through `Matrix` | In six boundaries (neutral, professional, friendly, each light and dark): a field with two tags, one invalid, one disabled | 6 cells; each popup's boundary equals its cell's; no `Field` nested in a `Field` | `RecipesAndModes` play; colour by `recipes.test.ts` and `pnpm contrast` |
| 59 | The canvas, English | The twins of `ms-twins` render | The same states in English: "Remove Pinto", "Pinto added", "Pinto removed", "2 chosen", "1 chosen", "Clear all", "All chosen items cleared", and `multiSelect.help` in English where each state shows them | The names and the status read those strings | One play per twin |
| 60 | The canvas | The a11y addon runs on the stories of `MultiSelect.stories.tsx`; the scratch run of `ms-webkit-1` runs | Not a screen | Zero violations (`DESIGN.md` §11), in Chromium; the two reads of `ms-webkit-1` pass in WebKit | Vitest Storybook project output; the `ms-webkit-1` script and its output in the builder's `verified` |
| 61 | The PR head | `options.test.ts`, `check-catalog`, the copy checks and the recipe checks run | Not a screen | `nextFocus` gives W2's output; `catalog/base/multi-select.yaml` resolves to `base-multi-select`; the 8 `multiSelect` keys exist in both locales with matching placeholders; no middot or em dash in the new files; the classes of `ms-recipe-1` pass `recipes.test.ts`; `Tag.tsx` has no diff | `pnpm --filter @orivilo/design-system test` and `pnpm contrast` output; `git diff --stat` of `Tag.tsx` |
| 62 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Default`, `Open`, `Sizes`, `ManyTagsAt360`, `Invalid`, `RecipesAndModes` on the PR head | The tags sit in the field as chosen values, not as status; the field grows without a jump; a focused remove is plain to see | None | Designer visual sign-off (`reviewer.v1`, empty `write_set`); the main session posts its PNG paths as a Jira comment on ORV-228 |
| 63 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/multi-select src/components/combobox src/components/tag` and `pnpm --filter @orivilo/design-system exec vitest run src/recipes src/i18n src/components/combobox/options.test.ts`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows that render nothing

- Rows: 25, 26, 27, 29, 39, 40, 42, 60, 61, 63

## Rows per PR

Default of open question 7: three vertical PRs on this issue, in order. PR A is Combobox with a local list, rows 1 to 29. PR B is async on Combobox, rows 30 to 42. PR C is Multi-select, rows 43 to 63. PR A is PR 194. PR B and PR C have no number yet, and the recorder marks a list line with no number as malformed, so neither has a list line now. The main session adds one line per PR in the `qa-scope-1` form, numbers and `a-b` ranges only, with a changelog line, when each PR opens.

- PR 194: rows 1-29

## Out of scope

- A real search source, a server action, or any `apps/web` use; the stories use the labelled mock.
- Moving `CommandMenu` or `CanvasChat` onto the new hook, and their `aria-selected` and focus behaviour (`CommandMenu.tsx` line 203, `CanvasChat.tsx` lines 294 to 297). A follow-up card.
- `Select.tsx` line 120, whose empty line has the same role presentation as cmdk's Empty (K-0319, Open points). A follow-up card.
- `commandMenu.count`, which reads "1 results" in English at a count of one.
- The sm `Tag` remove's size in other consumers (`CanvasChat`).
- Free tag entry, a limit on visible tags, Select all, a count-only trigger (open question 10).
- Thai-aware matching (open question 12), ranking, match highlighting, a debounce, virtualised lists, `readOnly`, an avatar slot (Avatar has no component yet), a keyboard shortcut hint, right-to-left keys.
- Any token, profile, `Tag`, `Select`, `InputGroup` or `Popover` change.
- The active option mark across lists, which ORV-242 holds (`cbx-recipe-1`, known limit).
- A swap of the thumb tokens at source and a scroll cue on `Select` (open questions 14 and 15).
- WebKit in `vite.config.ts` or in CI (`ms-webkit-1`).
- Visual regression baselines (`.claude/rules/testing.md`).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`. No rounding in W1 to W6: every value is an integer or a word. W7 and W8 state their own.

W1. The match of `cbx-filter-1`. Input: the method of `CommandMenu.tsx` lines 28 to 31 and the six strings of `src/components/fixtures.ts` lines 11 to 18 that `comboboxFixtures.options` takes (`thai`, `latin`, `mixed`, `thaiMarks`, `thaiMarks2`, `longThai`). Expected output, query then count: `"brand" 1`, `"SAVE" 1`, `"ปิ่น" 1`, `"ปิน" 0`, `"โต" 1`, `"แบรนด์" 1`, `"   " 6`. "ปิน" shows the limit: without its tone mark it does not match "ปิ่นโต้".

```bash
node -e 'const matches=(t,q)=>{const s=q.trim().toLowerCase();return s===""||t.toLowerCase().includes(s)};const L=["บันทึกการเปลี่ยนแปลง","Save changes","โปรเจกต์ Brand Canvas ของทีม","ปิ่นโต้","โลโก้","บริษัทพัฒนาซอฟต์แวร์เพื่อการออกแบบอัตลักษณ์แบรนด์และผลิตภัณฑ์ดิจิทัลจำกัดมหาชน"];for(const q of ["brand","SAVE","ปิ่น","ปิน","โต","แบรนด์","   "])console.log(JSON.stringify(q),L.filter(t=>matches(t,q)).length)'
```

W2. `nextFocus` of `ms-focus-1`. Input: the two lines quoted in K-0305, for the removed tag's index and the tag count before the removal. Expected output, index, count, target: `0 3 0`, `1 3 1`, `2 3 1`, `1 2 0`, `0 1 input`.

```bash
node -e 'const next=(i,n)=>{const k=i>=n-1?n-2:i;return k>=0?k:"input"};for(const [i,n] of [[0,3],[1,3],[2,3],[1,2],[0,1]])console.log(i,n,next(i,n))'
```

W3. `statusKey` of `cbx-status-1`. Input: the states of rows 2, 4, 14, 15, 30, 31, 32, 34 and 35 and a closed list. Expected output, in order: an empty line, then `combobox.countOne`, `combobox.count`, `combobox.empty`, `emptyText`, `combobox.prompt`, `combobox.pending`, `combobox.countOne`, `combobox.empty`, `combobox.error`.

```bash
node -e 'const key=({open,async:a,phase,query,count})=>{if(!open)return "";if(phase==="pending")return "combobox.pending";if(phase==="error")return "combobox.error";if(count===0){if(query.trim()==="")return a?"combobox.prompt":"emptyText";return "combobox.empty"}return count===1?"combobox.countOne":"combobox.count"};const s=(open,a,phase,query,count)=>({open,async:a,phase,query,count});[s(false,false,"idle","",7),s(true,false,"idle","แบรนด์",1),s(true,false,"idle","",7),s(true,false,"idle","ปิน",0),s(true,false,"idle","",0),s(true,true,"idle","",0),s(true,true,"pending","ปิ่",0),s(true,true,"idle","ปิ่",1),s(true,true,"idle","zzz",0),s(true,true,"error","zzz",0)].forEach(x=>console.log(key(x)))'
```

W4. The sizes of `cbx-target-1` and `ms-target-1`. Input: `size.control.*` and `size.icon.lg` (`semantic.json` lines 850 to 863, 883 to 886, resolving through `primitives.json` lines 521, 529, 537, 565), `--cmp-input-group-inset` as `space.inline.sm` (`generated.css` line 947), the 1 px borders of `.ds-input-group` and `.ds-tag`, and `recipes.css` line 442. Expected output, px: `22 30 38` (a Button in a slot at sm, md, lg, before `cbx-recipe-1` raises the first to 24); `30 38 46` (inner field height, so 24 fits at sm); `24 22 true` (the sm remove's width and height, and that a 24 px circle on its centre stays inside the tag's border box); `40` (an option row).

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const v=r=>{const [g,k]=r.replace(/[{}]/g,"").split(".");return parseFloat(p[g][k].$value)};const c=["sm","md","lg"].map(k=>v(s.size.control[k].$value)),icon=v(s.size.icon.lg.$value),inset=v(s.space.inline.sm.$value);console.log(c.map(h=>h-2-2*inset).join(" "));console.log(c.map(h=>h-2).join(" "));console.log(icon,icon-2,(icon-2)/2+1>=icon/2);console.log(c[1])'
```

W5. `nextActive` of `cbx-keys-1`. Input: the seven options of "Mock fixtures", index 2 (`closed`) disabled, and a list with every option disabled. Calls, as active index and direction: `-1 down`, `1 down`, `6 down`, `0 up`, `3 up`, `-1 up`, then `-1 down` with every option disabled. Expected output: `0 3 0 6 1 6 -1`.

```bash
node -e 'const next=(a,d,dis)=>{const n=dis.length;for(let i=1;i<=n;i++){const k=a<0?(d>0?i-1:n-i):(a+d*i+n*n)%n;if(!dis[k])return k}return -1};const D=[false,false,true,false,false,false,false];console.log(next(-1,1,D),next(1,1,D),next(6,1,D),next(0,-1,D),next(3,-1,D),next(-1,-1,D),next(-1,1,D.map(()=>true)))'
```

W6. The sizes of A1, A2, A7 and A9, under neutral. Input: `size.control.*`, `size.icon.lg`, `space.inline.sm` and `size.panel.default` (`semantic.json`, resolving through `primitives.json`), `--cmp-tag-height-sm` as `size.icon.lg` and `--cmp-tag-height-md` as `size.control.sm` (`generated.css` lines 1549, 1550), the 1 px border of `.ds-input-group`, and the forms of design.md D2, D9 and D11. Expected output, px: `24 30 38` (the side `--_b` at sm, md, lg); `24 32 32` (the tag and input height at sm, md, lg); `3 3 7` (the inset of D9); `320` (the popup's cap).

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const v=r=>{const [g,k]=r.replace(/[{}]/g,"").split(".");return parseFloat(p[g][k].$value)};const c=["sm","md","lg"].map(k=>v(s.size.control[k].$value)),lg=v(s.size.icon.lg.$value),inset=v(s.space.inline.sm.$value),tag=[lg,c[0],c[0]];console.log(c.map((h,i)=>i?h-2-2*inset:lg).join(" "));console.log(tag.join(" "));console.log(c.map((h,i)=>(h-2-tag[i])/2).join(" "));console.log(v(s.size.panel.default.$value))'
```

W7. The room of row 22. Input: a viewport height of 640; `sideOffset` 4 and `collisionPadding` 8 (`Combobox.tsx` lines 247, 249); the cap of 320 (W6); a field 40 px high, and the field's top 47.8 px down the page before the offset, both from the build's reading of the second field (group top 287.8, bottom 327.8, `top-[240px]` at `Combobox.stories.tsx` line 893). `side` is a model of Radix's flip fitted to what the build saw, not its code. The rounding of the third line is `roundByDPR` (`@floating-ui/react-dom` 2.1.9, lines 70 to 72, 213, 214), at a device pixel ratio of 1. Expected output, px, to one decimal: `240 300.2 275.8 bottom 300.2` and `300 240.2 335.8 top 320.0` (offset, room below, room above, side, height), then `332 632.2 640.2` (the rounded `top`, the bottom with `collisionPadding`, the bottom without it). The build read `top` 332, bottom 632.2, height 300.2, and 640.2 without the padding.

```bash
node -e 'const H=640,pad=8,gap=4,cap=320,field=40,lead=47.8;for(const o of [240,300]){const top=lead+o,bottom=top+field,below=H-pad-gap-bottom,above=top-gap-pad,side=below>=cap||below>=above?"bottom":"top";console.log(o,below.toFixed(1),above.toFixed(1),side,Math.min(cap,side==="bottom"?below:above).toFixed(1))}const b=lead+240+field,y=Math.round(b+gap);console.log(y,(y+H-pad-gap-b).toFixed(1),(y+H-gap-b).toFixed(1))'
```

W8. The thumb's length of row 12. Input: Radix's `getThumbSize` (`@radix-ui/react-scroll-area` 1.4.0, `dist/index.mjs` lines 725 to 735), with `viewport` the list's height and `content` its rows; the bar's 1 px padding (`recipes.css` line 2908); the bar's `margin-block` of half `--cmp-menu-radius` at each end (design.md, the CSS block), that radius 24 in neutral and 32 in friendly (`generated.css` of `tokens` line 264, of `profiles` line 327); 40 rows of 40 or 44 px; and the list heights 302 and 102 px of design.md line 514. Expected output, px, to one decimal: `52.1 46.0 18.0` (neutral at 302, friendly at 302, neutral at 102). The last is Radix's floor, the 18 of row 12: the share in view alone gives 4.8.

```bash
node -e 'const thumb=(list,rows,rowH,radius)=>Math.max((list-radius-2)*list/(rows*rowH),18).toFixed(1);console.log(thumb(302,40,40,24),thumb(302,40,44,32),thumb(102,40,40,24))'
```

## Open questions (option, impact, default)

design.md, "Answers to the open questions" (task ORV-228-design-1), answers questions 3, 8, 9 and 13. All four stand on their defaults, and each answer is held by the rule named. The options below stay as the record. Questions 14 to 16 are the designer's open points from ORV-228-design-2, recorded on their defaults.

- Question 3: default confirmed, with the look of design.md row 3. Held by `cbx-open-1`.
- Question 8: default confirmed, plus the scroll line of A8. Held by `ms-choose-1`.
- Question 9: default confirmed. While a remove has focus the field shows no edge, with no code, as `recipes.css` line 385 keys on the input. Held by `ms-keys-1`.
- Question 13: default confirmed on static markup in neutral, friendly and professional. Held by `ms-target-1`, and row 54 measures it on the component.

1. The primitive base (K-0319 Open points, for the architect and the owner). Options:
   - (a) Add `@base-ui/react` for these two components, as shadcn/ui does (K-0298). Gain: the fullest parts read, with Status, Empty, chips and `multiple` (K-0303, K-0305). Cost: ADR 0003 item 1 names Base UI, but its item 5 and handoff line 144 bar mixing bases, and `.claude/rules/design-system.md` line 23 says behaviour comes from `radix-ui`, so it needs a new ADR that supersedes those lines and a change to that rule. It adds a runtime dependency, an owner-facing cost that brings a `security` review of the PR (`.claude/skills/ovl/SKILL.md` step 6). Its license file was not read (`link-only`, K-0303). `PortalScope` is unproven on its Portal, and it would run a second focus and dismiss stack beside Radix inside `Dialog`.
   - (b) Radix Popover plus `cmdk` (K-0301, K-0302). Cost: a runtime dependency with the same `security` review, and its license file was not read. It has no multiple selection, so Multi-select still needs hand-built code. It fixes `aria-expanded` to true against K-0310, and its Empty has role presentation against K-0314, so both would have to be worked around. It fits ADR 0003 better than (a), as its `Command.Dialog` composes Radix Dialog (K-0302) and shadcn's Radix base builds Command on it (K-0298, K-0301).
   - (c) Hand-built on Radix Popover, as `CommandMenu.tsx` and `CanvasChat.tsx` are. Cost: every key and attribute of K-0309 and K-0310 is ours, and the tag keys of K-0305 and K-0293 too, so rows 3 to 13 and 46 to 50 carry the risk that a library would. It becomes the third hand-built combobox in the package. No dependency, no ADR supersession, no second base; it departs only from the wording of `.claude/rules/design-system.md` line 33, as `CommandMenu` already does.

   Default: (c), which is `cbx-base-1`. React Aria stays out under ADR 0003 item 5 (K-0297). Choosing (a) or (b) changes the contract table, the rows above and the estimates in open question 7.

2. The autocomplete form (K-0308). Options: (a) none, where suggestions do not follow typing, which fails the search need; (b) list with manual selection; (c) list with automatic selection, where the first suggestion becomes the value on blur, so leaving a field can set a value nobody picked (K-0317, our reading); (d) list with inline autocomplete, which puts a selected tail after the caret and sits badly with the IME guard (K-0302, K-0305; our reading, not run). Default: (b), which is `cbx-kind-1`.
3. When the list opens (K-0291, K-0297, K-0316, K-0134). Options: (a) on input, plus keys and a button; (b) on focus, as Untitled UI, which brings the SC 1.4.13 question and covers the page each time a keyboard user tabs through; (c) on a button or keys only, as `manual`, which hides results while typing. Default: (a), which is `cbx-open-1`. Base UI also opens on a click in the input (`openOnInputClick`, K-0303); the chevron gives pointer and touch users that route instead.
4. `aria-selected` or `aria-checked` on Multi-select options (K-0311). Options: (a) `aria-selected`, one attribute for both components, and the one K-0310 names for a chosen option; (b) `aria-checked`, which K-0311 says some design systems use for multi-select, and which would differ from Combobox. Never both (K-0311). Default: (a), which is `cbx-aria-1` and `ms-choose-1`.
5. Backspace in an empty input, Delete on a focused tag, focus after removal (K-0293, K-0294, K-0305, K-0312, K-0313, K-0318). No standard settles these (K-0313). Backspace: (a) moves to the last tag and removes nothing, as Untitled UI (K-0293, K-0295), so one slip loses nothing; (b) removes the last tag at once, as Base UI (K-0305), one key shorter. Delete: (c) removes, as Base UI, the Tags page and the APG example (K-0305, K-0294, K-0312); (d) ignored, as TagSelect (K-0293). Focus: (e) a neighbour, then the input, for key and pointer alike; (f) a neighbour for keys and the input for a pointer (K-0305); (g) no move on a pointer (K-0293), which drops focus to the page. Default: (a), (c) and (e), which are `ms-keys-1` and `ms-focus-1`.
6. How a result count and an empty result are announced (K-0303, K-0297, K-0314, K-0115, K-0114). Options: (a) one mounted polite region outside the portal for count, pending, error and empty, with the visible line separate; (b) the visible line is the live region, as Base UI's Empty, which would have to stay mounted in a portal that unmounts on close; (c) count only, as React Aria (K-0297), which leaves pending and error silent. Default: (a), which is `cbx-status-1`. Applying SC 4.1.3 to a combobox list is our reading (K-0319). `aria-expanded` is false with a panel on screen in the empty case, as the popup "may close" there (K-0309) and `CommandMenu.tsx` line 167 does the same; a screen reader run would test this, and none has been done.
7. How the work splits into PRs, Combobox first (audit D.3 row 25). Estimates, by this spec's count of files and not measured: Combobox with a local list about 850 changed lines, async about 350, Multi-select about 750. Options: (a) three PRs (A, B, C), each with its own sign-off, reviewer and qa, which is nearest the 400-line guide, though A and C stay over it; (b) two PRs, Combobox with async at about 1,200, then Multi-select, as ORV-201 and ORV-211 chose fewer PRs under delegation; (c) one PR of about 1,950, which ships nothing until all of it is right. A split below A would ship a component without its stories, which `.claude/rules/design-system.md` line 35 forbids. Default: (a). Option (b) needs only the rows moved in "Rows per PR".
8. What happens after a choice in Multi-select (K-0293, K-0304, K-0306, K-0317). Options: (a) the list stays open and the text empties, as K-0293 clears the text; (b) closes and empties, as Base UI (K-0306), which costs a key for each further pick; (c) stays open and keeps the text, which leaves a stale filter. Chosen options stay in the list, since K-0293 leaves them out but `aria-selected` then has nothing to mark. Default: (a), which is `ms-choose-1`.
9. Are tag removes Tab stops (K-0305, K-0294, K-0318)? Options: (a) yes, as `CanvasChat` has them, with no `Tag` change, which costs one Tab stop per tag before the input; (b) `tabIndex={-1}` with arrow keys only, as Base UI, which needs a new `Tag` prop and so a contract change for a draft component. Default: (a), which is `ms-keys-1`. A form with many tags is the case to watch.
10. What "tag entry" in audit D.3 row 25 asks for (K-0292, K-0293, K-0295, K-0306; audit.md lines 156, 360). Options: (a) tags chosen from a list; (b) also free text as a new tag, with a message on refusal (`DESIGN.md` line 252), a third state set and new copy; (c) a count-only trigger, which shows no tags. Default: (a), which is `ms-api-1`, with free entry, a limit on visible tags and Select all left to a follow-up card if a Studio screen needs them. The audit's row does not define the term further.
11. Which keys of K-0311 apply inside a combobox popup with focus on the input (K-0311, K-0313; not stated in what was read). Options: (a) Space stays a typed character, Enter toggles, Home and End move only with an active option, type-ahead is the text itself, Shift and Control combinations are not handled; (b) Space toggles when an option is active, which blocks a space in a query. Default: (a), which is `cbx-keys-1` and `ms-choose-1`.
12. Thai matching (K-0319 Open points; K-0293, K-0296, K-0303). No source read says how `sensitivity: "base"` or Base UI's `locale` treat Thai. Options: (a) plain substring on code points, the method `CommandMenu` has, with W1's limit; (b) fold tone marks and vowels, which needs a Thai source and tests and is new work. Default: (a), which is `cbx-filter-1`.
13. The sm `Tag` remove (K-0315, K-0319 Open points). Options: (a) keep it and rest on the Spacing exception; (b) drop sm from MultiSelect, so it no longer matches `Select`'s sizes; (c) change the Tag recipe, a change to a shared component with other consumers. Default: (a), which is `ms-target-1`. Row 54 measures what K-0319 left unmeasured.
14. The thumb tokens (design.md D17 and line 619). On a menu `--cmp-scroll-area-thumb`, the rest ink of `.ds-scroll__thumb`, is the strongest ink in the panel. Options: (a) the tokens are not swapped at source, and Combobox uses them the other way round, so its thumb goes stronger on hover, the reverse of `.ds-scroll__thumb` elsewhere; (b) swap `scroll-area.thumb` and `scroll-area.thumb-hover` at source, which is a token change that reaches every `ScrollArea`. Default: (a), which is `cbx-recipe-1`.
15. A scroll cue on `Select` (design.md line 617). Its list has no cap and no drawn bar, so a long one has the gap of F2. Options: (a) a follow-up card, and this story leaves `Select` alone; (b) the same cue in this story, which is a change to a shared component with stories of its own. Default: (a).
16. MultiSelect's floor (design.md line 616). The rules of A10 do not reach `.ds-combobox__values`, so a long tag could raise `min-content` past a 360 px screen. Options: (a) decide it in PR C, where the field exists to measure; (b) decide it now, with nothing to measure on. Default: (a). Nothing in this version proves that floor.

## Depends on

- `docs/knowledge/design/K-0290` to `K-0319`, and `K-0113`, `K-0114`, `K-0115`, `K-0134`.
- `docs/specs/ORV-228/design.md` (tasks ORV-228-design-1 and ORV-228-design-2): the look, the CSS block, amendments A1 to A16 and the rework of findings F1 and F2 of sign-off `ORV-228-signoff-1`. G1 and G2 passed under delegation on v1.0 (ORV-228 comment 10533, taken from the task's facts).
- PR 186, which put `expectFrameCutsNoInk` on `develop`. This worktree has not taken that merge yet, so the branch merges `develop` before rows 22, 37 and 56 can run.
- ORV-242, which holds the active option mark across every list (taken from the task's facts, as this role has no Jira tool).
- `docs/specs/ORV-64/audit.md` section B (table form), B.2 and B.3 (lines 156, 166), section A rows (lines 34, 35), D.3 row 25 (line 360).
- ADR 0003 (items 1, 4 and 5), ADR 0012 (gates), and `docs/context/intent-studio-handoff.md` line 144.
- `DESIGN.md` §6 (line 175), §7 (lines 197 to 205), §10, §11.
- `.claude/rules/design-system.md` (lines 23, 24, 33 to 38), `.claude/rules/testing.md`.
- ORV-137 comment 10247 (the benchmark table in POC mode), taken from the task's facts and `.claude/rules/design-system.md` line 34, as this role has no Jira tool; ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- `docs/specs/ORV-211/spec.md` (the spec shape), `docs/specs/ORV-201/spec.md` (Spinner, `decorative`).

## Changelog

- v1.0 (2026-11-06): first version, from K-0290 to K-0319 and audit D.3 row 25. Downstream to review: the architect and the owner (open question 1), the designer envelope (design.md, the look of `cbx-recipe-1` and `ms-recipe-1`, open questions 3, 8, 9, 13), the builder envelopes (three PRs, rows as in "Rows per PR"), the qa envelope (the Rows per PR lines once the PRs exist), `catalog/coverage.md`, `select.yaml`, `tag.yaml` and `DESIGN.md` §6.
- v1.1 (2026-11-06): takes in A1 to A9 of design.md, each marked by its number and mapped in "Design amendments"; records the answers to open questions 3, 8, 9 and 13; points the front matter at design.md; names ORV-242 as the known limit of the active mark; adds `ms-webkit-1`, W6 and a PR C `LongList` story. Two fixes the amendments exposed: the visible line's text sits in a `<span>` (`cbx-status-1`), and `cbx-ink-1` states the bounds of its helpers. `expectFrameCutsNoInk` is now on `develop`. Rows 4, 6, 12, 17, 22, 28, 31, 35, 43, 44, 45, 48, 54, 56 and 60 change, with no row renumbered and "Rows that render nothing" and "Rows per PR" as they were. Downstream to review: design.md (lines 131, 132, 332 and 334), the builder envelopes, the qa envelope, the designer sign-offs of rows 28, 41 and 62.
- v1.2 (2026-11-06): records what ORV-228-build-1 showed, with no new requirement. Row 22: the second field sits 240 px down, not 300 px, and the popup carries `collisionPadding` 8, each with its reason, and W7 holds the arithmetic. Row 11: edge ink on a chosen and active option reads 4 px, with the reason, and the 1 px line stands. "Rows per PR" gains the line for PR 194, which is PR A. No row is renumbered, and "Rows that render nothing" is as it was. Downstream to review: the reviewer and qa envelopes of PR 194 (rows 1 to 29, and rows 11 and 22 as they now read), and row 37, which reuses the frame of `At360`.
- v1.3 (2026-11-06): takes in A10 to A16 of design.md, from findings F1 and F2 of sign-off 1, with no requirement beyond them. `cbx-recipe-1` gains the field's least width and the list's thumb, its pairs line names the two new pairs, and that line's `pairs.ts` numbers are read again from the file; `cbx-base-1` names `ScrollArea`; rows 12, 17, 22 and 28 change; `cbx-stories-1` lists `LeastWidth` with its twin, `LongListFriendly` and `At360Friendly`, which those rows name; the contract table gains `pairs.ts`, `Combobox.tsx` and `combobox.yaml` with their impact; open questions 14 to 16 record the designer's open points on their defaults; W8 holds the thumb's length. No row is renumbered, and "Rows that render nothing" and "Rows per PR" are as they were. Downstream to review: design.md (lines 3 and 10), the builder envelope of the rework on PR 194, the reviewer and qa envelopes of PR 194 (rows 12, 17, 22 and 24), the designer sign-off of row 28, `combobox.yaml`, `pairs.ts`, and row 45 of PR C, which reads the same list node.
