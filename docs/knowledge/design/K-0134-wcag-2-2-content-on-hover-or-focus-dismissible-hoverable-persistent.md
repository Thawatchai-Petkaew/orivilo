---
id: K-0134
topic: design
claim: WCAG 2.2 SC 1.4.13 Content on Hover or Focus (AA) applies when hover or focus shows and hides additional content, and asks that it be dismissible without moving hover or focus, hoverable without disappearing, and persistent until the trigger is removed, it is dismissed or it is no longer valid; custom tooltips and non-modal popups shown on hover and focus are covered, modal dialogs are out of scope, and content opened only by a click is not addressed by the text.
source: "https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-211]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: one W3C page. The page title gives the level: "Content on Hover or Focus (Level AA)".

> Dismissible: A mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus,
> Hoverable: ... the pointer can be moved over the additional content without the additional content disappearing.
> Persistent: ... remains visible until the hover or focus trigger is removed,

Dismissible has the exception "unless the additional content communicates an input error or does not obscure or replace other content". The criterion has one exception: "The visual presentation of the additional content is controlled by the user agent and is not modified by the author." The intent names "custom tooltips, sub-menus and other non-modal popups which display on hover and focus" and says "Modal dialogs are out of scope for this criterion". The fetch tool found no text on content opened by a click or activation; the reading that click-only content is outside the criterion is ours, from its wording.

## Why it matters for ORIVILO

AI Elements opens its citation card on hover with no delay (K-0127) on a primitive that also opens on focus (K-0129), which puts it under 1.4.13. A card opened only by pressing the pill falls outside the criterion by our reading; one that also opens on hover has to meet all three conditions.
