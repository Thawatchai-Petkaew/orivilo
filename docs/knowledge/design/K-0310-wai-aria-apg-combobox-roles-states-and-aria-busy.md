---
id: K-0310
topic: design
claim: The APG and WAI-ARIA 1.2 give a combobox role combobox, aria-expanded false when collapsed and true when the popup is visible, aria-controls to the popup, aria-autocomplete matching its behaviour and DOM focus kept on it with aria-activedescendant naming the focused option; a popup defaults to listbox, and a widget missing required owned elements while loading must be marked aria-busy true.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/combobox/combobox-pattern.html; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/; https://www.w3.org/TR/wai-aria-1.2/; docs/knowledge/design/K-0113-wai-aria-1-2-aria-busy-defers-announcements.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the pattern's HTML is read on `main`, not pinned to a commit. Confidence stays at 0.8: the APG and the ARIA 1.2 specification agree on `aria-expanded`, but the APG is written from that specification, so they do not count as two independent sources. The specification (446,886 characters) was read only in part.

APG:

> When the combobox popup is not visible, the element with role combobox has aria-expanded set to false.

> When the popup element is visible, aria-expanded is set to true.

> The combobox element has aria-controls set to a value that refers to the element that serves as the popup.

> DOM focus remains on the combobox

> the combobox has aria-activedescendant set to a value that refers to the focused element within the popup

> The combobox element has aria-autocomplete set to a value that corresponds to its autocomplete behavior:

> the option, gridcell, row, or treeitem containing that value has aria-selected set to true.

WAI-ARIA 1.2:

> Authors MUST set aria-expanded to true on an element with role combobox when it is expanded and false when it is collapsed.

> Elements with the role combobox have an implicit aria-haspopup value of listbox.

> When a widget is missing required owned elements due to script execution or loading,

> authors MUST mark a containing element with aria-busy equal to true.

- "Note that aria-controls only needs to be set when the popup is visible."
- Non-listbox popups need `aria-haspopup` set to the matching type.
- Name, in the page's order: "it is labeled using the label element", then `aria-labelledby` to a visible label, otherwise "a label provided by aria-label".
- `aria-autocomplete` values: `none`, `list`, `both`.
- Editable example: `aria-selected` is "Specified on an option in the listbox when it is visually highlighted as selected."; `aria-label` "Provides a label for the `listbox`."
- The aria-busy lines come from section 5.2.6, Required Owned Elements; [[K-0113-wai-aria-1-2-aria-busy-defers-announcements]] records `aria-busy` itself.

## Why it matters for ORIVILO

These are the attributes a Combobox's interaction test can assert, and the aria-busy line is the one standards sentence read that speaks to a listbox with no options yet because of loading.
