---
id: K-0309
topic: design
claim: The WAI-ARIA APG Combobox pattern puts the combobox in the Tab sequence and keeps popup descendants out of it; Down Arrow moves into the popup, Escape dismisses it and Enter accepts a suggestion, Alt plus Down and Up Arrow are optional, and from a listbox popup in an editable combobox Left, Right and printable keys return to the input, with the popup allowed to close when a typed string matches nothing.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/combobox/combobox-pattern.html; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, so several quotes end in `...` where the tool cut them; the pattern's HTML is read on `main`, not pinned to a commit.

> The combobox is in the page Tab sequence.

> the popup descendants are excluded from the page Tab sequence.

> Down Arrow: If the popup is available, moves focus into the popup:

> Escape: Dismisses the popup if it is visible.

> Enter: If the combobox is editable and an autocomplete suggestion is selected in the popup, accepts the suggestion...

> Alt + Down Arrow (Optional): If the popup is available but not displayed, displays the popup without moving focus.

> forms a string that does not have any matching suggestions, the popup may close

Listbox popup:

> Enter: Accepts the focused option in the listbox by closing the popup, placing the accepted value in the combobox...

> Escape: Closes the popup and returns focus to the combobox.

> Left Arrow: If the combobox is editable, returns focus to the combobox without closing the popup...

> Right Arrow: If the combobox is editable, returns focus to the combobox without closing the popup and moves the input...

> If the combobox is editable, returns the focus to the combobox without closing the popup and types the character.

- The last quote sits under "Any printable character:". On the combobox itself, the Printable Characters item says: "If the combobox is editable, type characters in the combobox."
- Up Arrow is optional and places focus on the last focusable element in the popup. Alt + Up Arrow is optional.
- Home and End are optional: either the first or last option, or, when editable, back to the combobox. Backspace and Delete are optional in the popup and return to the input when editable.
- Editable example: Escape closes the listbox if open and clears the textbox if closed; Down and Up wrap in the popup; the active option is scrolled into view by script: "Browsers do not manage visibility of elements referenced by aria-activedescendant like they do for elements with focus."
- Select-only example: on a closed combobox Space and Enter each "Opens the listbox without moving focus or changing selection."; in the listbox they set the value, close and keep focus on the combobox; PageUp and PageDown jump 10 options; Tab sets the value, closes and performs the default action. "Note: the native `<select>` element closes the listbox but does not move focus on tab."
- The editable example's page does not describe what happens when nothing matches, and does not mention a live region for results.

## Why it matters for ORIVILO

Row 25 of the ORV-64 build order asks for a keyboard story. This is the list of keys that story would walk, with the required and optional ones apart.
