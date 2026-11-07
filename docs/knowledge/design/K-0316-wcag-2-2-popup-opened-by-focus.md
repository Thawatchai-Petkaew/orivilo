---
id: K-0316
topic: design
claim: For a list that opens on focus, WCAG 2.2 SC 3.2.1 (Level A) bars a change of context on focus while its page sets no rule for popups and says a dynamic menu need not change context, SC 1.4.13 (AA) covers non-modal popups shown on hover and focus and never mentions a combobox, and SC 2.4.11 (AA) names combobox lists among non-persistent items that do not fail it by themselves.
source: "https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html; https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html; https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html; docs/knowledge/design/K-0134-wcag-2-2-content-on-hover-or-focus-dismissible-hoverable-persistent.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. Confidence 0.75, not 0.8: the claim rests partly on what the pages do not say about a combobox.

SC 3.2.1 On Focus:

> When any user interface component receives focus, it does not initiate a change of context.

> dynamic menu, or a tab control do not necessarily change the context.

> When a field receives focus, a help dialog window describing the field and providing options opens.

SC 1.4.13 Content on Hover or Focus:

> Custom tooltips, sub-menus, and other nonmodal popups that display on hover and focus

SC 2.4.11 Focus Not Obscured (Minimum):

> When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content.

> Content opened by the user may obscure the component receiving focus.

> Examples of such components are menu items, select element items, combobox lists (and other dropdown items),

- The third quote is the On Focus page's failure example of a dialog window opening on focus.
- SC 1.4.13's page does not mention combobox lists, autocomplete or input suggestions; its three conditions are in [[K-0134-wcag-2-2-content-on-hover-or-focus-dismissible-hoverable-persistent]].
- SC 2.4.11 is still met when "the user can reveal the focused component without advancing the keyboard focus."

## Why it matters for ORIVILO

Own reading: these pages neither forbid nor approve opening a list on focus, as Untitled UI's ComboBox does ([[K-0291-untitled-ui-select-combobox-opens-on-focus-visual-hint]]). The nearest duty is 1.4.13's, if the open list counts as a popup shown on focus.
