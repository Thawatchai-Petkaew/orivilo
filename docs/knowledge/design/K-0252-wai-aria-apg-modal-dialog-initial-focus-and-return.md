---
id: K-0252
topic: design
claim: The WAI-ARIA APG Modal Dialog pattern moves focus to an element inside on open and advises that for a final step that is not easily reversible, such as deleting data, it may be advisable to focus the least destructive action; for a dialog that only informs or continues processing, the most frequently used element such as OK or Continue; for structured or long content, a static element with tabindex -1; Escape closes, focus returns to the invoking element unless it is gone or the work flow makes another target more logical, and a visible close or cancel button in the tab sequence is strongly recommended.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> If a dialog contains the final step in a process that is not easily reversible,
> such as deleting data or completing a financial transaction,
> it may be advisable to set focus on the least destructive action,
> especially if undoing the action is difficult or impossible.

> If a dialog is limited to interactions that either provide additional information or continue processing,
> it may be advisable to set focus to the element that is likely to be most frequently used,
> such as an OK or Continue button.

> If the dialog content includes semantic structures, such as lists, tables, or multiple paragraphs,
> that need to be perceived in order to easily understand the content,
> then it is advisable to add `tabindex="-1"` to a static element at the start of the content
> and initially focus that element.

> When a dialog closes, focus returns to the element that invoked the dialog unless either:

> The invoking element no longer exists. Then, focus is set on another element that provides logical work flow.

> It is strongly recommended that the tab sequence of all dialogs include a visible element with role `button`
> that closes the dialog, such as a close icon or cancel button.

The same page makes `aria-describedby` optional and advises leaving it off when the content has structure that is hard to follow as one announced string. These are notes ("may be advisable"), not requirements.

## Why it matters for ORIVILO

This gives three different first-focus targets for three kinds of dialog, which bears on a confirm that deletes and one that accepts AI changes. After a confirmed delete, the invoking element may no longer exist, so the "no longer exists" exception of the closing rule applies.
