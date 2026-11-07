---
id: K-0318
topic: design
claim: WCAG 2.2 SC 2.1.1 Keyboard (Level A) asks that all functionality works through a keyboard interface and SC 2.4.3 Focus Order (Level A) that focus order preserves meaning and operability; the Focus Order page does not address where focus goes when a focused element is deleted, and its nearest lines are about a dismissed dialog, tree items added or removed on expand and collapse, and scripted navigation.
source: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html; https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. Confidence 0.75, not 0.8: the last part of the claim is an absence found by a prompted search of the page.

> All functionality of the content is operable through a keyboard interface

> focusable components receive focus in an order that preserves meaning and operability.

> When the dialog is dismissed, focus returns to the button or the element following the button.

> Dynamic HTML may modify the navigation sequence using scripting

> F85: Failure of Success Criterion 2.4.3 due to using dialogs or menus that are not adjacent to their trigger control

- The Keyboard page has no example about lists or removing items; its nearest is "An application that uses drag and drop also supports "cut" and "paste" or form controls to move objects."
- On tree controls, the Focus Order page says "as additional items get expanded or collapsed, they are added or removed from the navigation sequence." That is expansion and collapse, not deletion.

## Why it matters for ORIVILO

Own reading: a keyboard route to remove a chip follows from 2.1.1, while the place focus lands afterwards has no sentence in either page. The closest written rule is the APG example in [[K-0312-wai-aria-apg-listbox-cautions-select-all-and-delete-example]].
