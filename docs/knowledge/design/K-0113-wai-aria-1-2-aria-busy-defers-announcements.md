---
id: K-0113
topic: design
claim: In WAI-ARIA 1.2, aria-busy (default false) marks an element as being modified so that assistive technologies may wait until the changes are complete and may ignore changes to content it owns while true; authors may set it on a container before a batch of changes and back to false after the last one, and must set it on a widget whose update would briefly leave required owned elements missing.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool, from the `aria-busy` definition (section 6.7). Confidence 0.8: the W3C Recommendation, one source. Two sentences were returned as paraphrase by the tool and are given below in our words, not as quotes.

> Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete
> The default value of `aria-busy` is `false` for all elements.
> When `aria-busy` is `true` for an element, assistive technologies MAY ignore changes to content owned by that element
> authors MAY set aria-busy to true on the container element before the first change

Value table: `false` (default) "There are no expected updates for the element."; `true` "The element is being updated."

The widget sentence opens "If changes to a rendered widget would create a state where the widget is missing required owned elements"; its rest, in our words: the author MUST then set `aria-busy` to true during the update. In our words from the same definition: on a `feed` marked busy, assistive technologies MAY defer rendering changes inside it.

## Why it matters for ORIVILO

`aria-busy` says "do not read this yet"; it does not itself announce that loading started. A skeleton region or a loading table pairs it with a separate status message (K-0114, K-0115).
