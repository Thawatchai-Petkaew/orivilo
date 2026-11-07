---
id: K-0311
topic: design
claim: The WAI-ARIA APG Listbox pattern's recommended multi-select model needs no modifier key to move, Space toggles the focused option, Shift with arrows and Control plus A are optional, a multi-select listbox sets aria-multiselectable true, a listbox uses aria-selected or aria-checked and never both, Home and End are strongly recommended above five options and type-ahead especially above seven.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/listbox/listbox-pattern.html; https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the pattern's HTML is read on `main`, not pinned to a commit.

> A listbox widget presents a list of options and allows a user to select one or more of them.

> Space: changes the selection state of the focused option.

> Shift + Down Arrow (Optional): Moves focus to and toggles the selected state of the next option.

> Control + A (Optional): Selects all options in the list.

> the element with role listbox has aria-multiselectable set to true.

> Some design systems use aria-selected for single-select widgets and aria-checked for multi-select widgets.

> Supporting this key is strongly recommended for lists with more than five options.

> Type-ahead is recommended for all listboxes, especially those with more than seven options:

> their aria-setsize and aria-posinset attributes are set appropriately.

- Focus on entry: "If none of the options are selected before the listbox receives focus, focus is set on the first option"; a multi-select list does not change selection on focus.
- Alternative model: "moving focus without holding a Shift or Control modifier unselects all selected options except the focused option".
- Not both: "If the selection state is indicated with aria-selected, then aria-checked is not specified for any options."
- Consistency: "It is important to adopt a consistent convention for selection models across a site or app."
- Groups: "Each option group has an accessible name provided via aria-label or aria-labelledby."
- Label: "If the element with role listbox is not part of another widget, such as a combobox," it has a visible label or `aria-label`, so the line does not ask a listbox inside a combobox for one.
- `aria-setsize` and `aria-posinset` are for options loaded on demand.
- The Scrollable example is single-select: "demonstrates a scrollable single-select listbox widget."

## Why it matters for ORIVILO

These keys describe a standalone listbox. Whether they all apply inside a combobox popup with focus on the input is not stated in what was read ([[K-0313-wai-aria-apg-has-no-tag-or-multi-value-combobox-pattern]]).
