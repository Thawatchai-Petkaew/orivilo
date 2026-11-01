---
id: K-0125
topic: design
claim: WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) covers motion that starts automatically, lasts more than five seconds and runs beside other content; motion started by activating a button is not automatic, but motion started by focusing, hovering or scrolling an element into view is, and the page says such motion also potentially fails 2.3.3.
source: "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: one W3C Understanding page. K-0117 records the same SC for loading animations; this entry adds what "starts automatically" means.

Heading: "Pause, Stop, Hide (Level A)". The criterion applies to "any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds" "and (3) is presented in parallel with other content".

> In the context of this Success Criterion, "starts automatically" broadly refers to animations/updates that are not the direct result of a user's intentional activation

> Moving, blinking, scrolling, auto-updating content is considered to start automatically either when it starts without direct user activation or interaction (such as activating a button) or when it starts as a result of an indirect interaction (such as focusing/hovering over an element, or scrolling an element into view).

> Content that starts automatically from an indirect interaction also potentially fails 2.3.3 Animation from Interactions.

## Why it matters for ORIVILO

By our reading, a Collapsible opened by pressing its trigger is a direct activation and its open animation, well under five seconds, sits outside 2.2.2; a panel that opens on hover or focus would count as starting automatically. The page does not speak of collapsibles; the reading is ours.
