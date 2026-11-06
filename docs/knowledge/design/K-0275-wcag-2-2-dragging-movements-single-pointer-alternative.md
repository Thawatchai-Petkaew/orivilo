---
id: K-0275
topic: design
claim: WCAG 2.2 SC 2.5.7 Dragging Movements (Level AA) requires functionality that uses dragging to work with a single pointer without dragging, unless dragging is essential or set by the user agent, and is evaluated apart from keyboard access; the Understanding page does not mention files, uploads or the operating system.
source: "https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, so long sentences are in parts.

> All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging

> unless dragging is essential or the functionality is determined by the user agent and not modified by the author.

> This requirement applies to web content that interprets pointer actions

> achieving keyboard equivalence for a dragging operation does not automatically meet this success criterion.

> This criterion does not apply to scrolling and dragging gestures enabled by the user agent.

Examples on the page are on-page items: a map, a range slider, a Kanban board, a task board, a carousel. A search of the fetched page for "file", "upload" and "operating system" found none.

Open point: the page does not say whether dragging a file in from the operating system's file manager is in scope. A script that reads a file drop does interpret the drop, while the drag itself starts outside the page (own reading, not a W3C statement). If it is in scope, a picker button is the kind of single pointer route the criterion asks for.

## Why it matters for ORIVILO

The drop target's alternative has two separate tests: this one for pointers and SC 2.1.1 for keyboards (K-0276). One visible button can answer both, and the scope question stays open for whoever writes the acceptance criteria.
