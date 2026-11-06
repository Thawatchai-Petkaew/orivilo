---
id: K-0234
topic: design
claim: WCAG 2.2 SC 2.4.3 Focus Order (A) has an example where a modal dialog makes the page inert and focus returns to the button on close, and lists failure F85 for dialogs or menus not adjacent to their trigger; SC 2.4.11 Focus Not Obscured (AA) names sticky headers as content that can hide focus, with C43 scroll-padding sufficient and F110 the failure.
source: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html; https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

SC 2.4.3, Focus Order (Level A):

> focusable components receive focus in an order that preserves meaning and operability.

> A web page implements modal dialogs. When the trigger button is activated, a dialog opens and focus is set within the dialog.

> As long as the dialog is open, all web page content outside the dialog becomes inert and cannot receive focus

> When the dialog is dismissed, focus returns to the button or the element following the button.

> using dialogs or menus that are not adjacent to their trigger control in the sequential navigation order.

SC 2.4.11 (Level AA):

> When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content.

> Typical types of content that can overlap focused items are sticky footers, sticky headers, and non-modal dialogs.

Techniques: C43 (CSS scroll-padding) is sufficient; F110 covers a sticky footer or header that completely hides focused elements.

## Why it matters for ORIVILO

The drawer in both libraries is a modal, so the first example is its reading. shadcn's `SidebarHeader` and `SidebarFooter` are sticky (K-0213) inside a scrolling list, which is the case SC 2.4.11 names.
