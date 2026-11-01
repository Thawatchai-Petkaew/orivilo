---
id: K-0117
topic: design
claim: WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) needs a pause, stop or hide mechanism for moving content that starts automatically, lasts over five seconds and sits in parallel with other content, unless essential; its Note 4 says a preload animation can be essential when no one can interact during it and showing no progress could look frozen, and its loading example needs no mechanism because nothing runs in parallel.
source: "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: the W3C Understanding document, one source. The tool returned the SC text in line pieces; they are joined here as returned.

> For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it ... unless the movement, blinking, or scrolling is part of an activity where it is essential

Note 4:

> An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users and if not indicating progress could confuse users or cause them to think that content was frozen or broken.

The "loading" animation example:

> Because the moving content is not presented in parallel with other content, no mechanism to pause, stop or hide it needs to be provided, even though the animation may run for more than 5 seconds for users with slower connections.

The page does not name spinners, skeletons or progress bars.

## Why it matters for ORIVILO

A skeleton pulse or a spinner inside one region while the rest of the page stays usable is, by our reading, in parallel with other content, which the loading example excludes; if it can run past five seconds, 2.2.2 at Level A applies unless the motion is essential. That reading is for the designer to confirm.
