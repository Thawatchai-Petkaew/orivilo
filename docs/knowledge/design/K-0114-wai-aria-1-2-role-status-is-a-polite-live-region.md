---
id: K-0114
topic: design
claim: In WAI-ARIA 1.2, role status is a live region for advisory information with implicit aria-live polite and aria-atomic true, and should not receive focus when it changes; a polite region is read at the next graceful opportunity without interrupting, assertive immediately, off only when focused; role progressbar is for the progress of long tasks.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool, from the `status`, `progressbar` and `aria-live` definitions. Confidence 0.8: the W3C Recommendation, one source.

### status

> A type of live region whose content is advisory information for the user but is not important enough to justify an alert, often but not necessarily presented as a status bar.
> Authors SHOULD ensure an element with role `status` does not receive focus as a result of change in status.

Implicit values: "Default for aria-live is polite." and "Default for aria-atomic is true."

### aria-live

> When regions are specified as `polite`, assistive technologies will notify users of updates but generally do not interrupt the current task, and updates take low priority.
> When regions are specified as `assertive`, assistive technologies will immediately notify the user, and could potentially clear the speech queue of previous updates.

Values: polite "Indicates that updates to the region should be presented at the next graceful opportunity, such as at the end of speaking the current sentence or when the user pauses typing."; off (default) "Indicates that updates to the region should not be presented to the user unless the user is currently focused on that region."

### progressbar

> An element that displays the progress status for tasks that take a long time.

## Why it matters for ORIVILO

A loading message in a `status` element is spoken politely without moving focus. shadcn puts the role on the icon (K-0110); Untitled UI tells the caller to wrap its spinner in one (K-0108).
