---
id: K-0278
topic: design
claim: WCAG techniques ARIA25 and ARIA27 both use a file upload progress bar as their case; ARIA25 updates visually hidden text in an aria-live polite region because role progressbar is not a live region, keeps focus where it is and states no announcement interval, and ARIA27 says ariaNotify was still experimental as of April 2026.
source: "https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA25; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA27"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. ARIA25's title is quoted; the rest of its text below is the fetch's summary, not a quote.

> ARIA25: Using an ARIA live region to convey the status of a progress bar

> demonstrates how to use the ariaNotify method to programmatically convey the status of a file upload progress bar

> As of April 2026, ariaNotify is still an experimental feature in web browsers and assistive technologies.

- ARIA25 method: update a visually hidden text element with `aria-live="polite"`, for example "0% complete". The visible bar has `role="progressbar"` with `aria-valuemin`, `aria-valuemax` and `aria-valuenow`.
- ARIA25 reason: that role is not a live region, so its value changes are not announced. The bar is not essential to the technique; the status message is.
- ARIA25 test: updates reach the user with a screen reader without focus moving to the bar or the message.
- ARIA25 does not address how often to update, whether to throttle, or `role="status"`.
- ARIA27: until support is broader, use `ariaNotify` only as an add-on to more dependable methods such as ARIA25.

## Why it matters for ORIVILO

These two are the WCAG pages read that use a file upload as their case. ARIA25 names the mechanism and leaves the announcement rate open.
