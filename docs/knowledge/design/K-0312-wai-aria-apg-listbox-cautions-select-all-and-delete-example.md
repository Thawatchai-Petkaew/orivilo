---
id: K-0312
topic: design
claim: The WAI-ARIA APG Listbox pattern warns that a listbox is no accessible way to present interactive elements such as checkboxes and that long option names are hard to scan, suggests separate Select All and Unselect All buttons, and its Rearrangeable example removes with Delete only in the chosen options list and confirms completed actions in a live region.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/listbox/listbox-pattern.html; https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, so the Select All line is an excerpt; the pattern's HTML is read on `main`, not pinned to a commit.

> it does not provide an accessible way to present a list of interactive elements, such as links, buttons, or checkboxes.

> Avoiding very long option names facilitates understandability and perceivability for screen reader users.

> implementing separate controls for these actions, such as buttons for "Select All" and "Unselect All"

Rearrangeable example:

> Delete performs a remove only when focus is in the chosen options list.

> Enter performs an add only when focus is in the available options list.

> focus lands on the first of the subsequent options that is still present.

- Screen readers announce an option's name as a flat string, so semantic content inside an option is lost. The Grid Pattern is the suggested alternative for interactive content.
- Options sharing a repeated leading phrase make scanning tedious; separate controls are the suggested fix.
- Example: `aria-multiselectable` is "Used only in example 2."; `aria-selected="false"` is "Applied to elements with role option that are not visually styled as selected"; the shortcuts are communicated "via the aria-keyshortcuts property" on the action buttons.
- "Live regions provide confirmation of completed actions."; the page shows a "Last change:" status.
- The "lands on" line is about an add: "If the option that had focus before the add operation is no longer present in the list," and then the quoted clause.

## Why it matters for ORIVILO

This example is the nearest the APG comes to removing a chosen item: a key, a focus rule and a confirmation. It is a two-list control, not a tag field, so it is a lead for chips and not their rule.
