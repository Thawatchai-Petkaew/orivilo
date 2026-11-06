---
id: K-0308
topic: design
claim: The WAI-ARIA APG Combobox pattern splits comboboxes into select-only (no text input) and editable, lets the popup be a listbox, grid, tree or dialog, and names four autocomplete forms, none, list with manual selection, list with automatic selection, and list with inline autocomplete.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/combobox/combobox-pattern.html; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the pattern's HTML is read on `main` of `w3c/aria-practices`, not pinned to a commit.

> A combobox is an input widget that has an associated popup.

> If a combobox does not support text input, it is referred to as select-only,

> Alternatively, if a combobox supports text input, it is referred to as editable.

> The popup is hidden by default, i.e., the default state is collapsed.

- Editable: the value may be limited to allowed options, with typing filtering suggestions, or it may be arbitrary.
- None: suggestions do not change as the user types.
- List with manual selection: suggestions match the typed text, and the typed text stays the value unless a suggestion is picked.
- List with automatic selection: the first suggestion is highlighted and becomes the value on blur unless the user changes it.
- List with inline autocomplete: as automatic, with the untyped rest of the suggestion highlighted after the cursor.
- Select-only example: "a single-select combobox widget that is functionally similar to an HTML `select` element."
- Editable example: list autocomplete with manual selection; it accepts text that is not a listed state.
- Select-only page: "The code in this example is not intended for production environments."

## Why it matters for ORIVILO

ORIVILO's `Select` on Radix is the select-only kind ([[K-0307-radix-has-no-combobox-and-select-is-one-value-without-search]]). A long searchable list is the editable kind, and which autocomplete form it takes is a design choice these names let the spec state.
