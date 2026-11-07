---
id: K-0282
topic: design
claim: The WAI-ARIA Authoring Practices patterns list has no file input, file upload, drag and drop or progressbar pattern, and its Meter pattern says a meter should not show progress and to use the progressbar role instead.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/; https://www.w3.org/WAI/ARIA/apg/patterns/meter/; https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters.

> The meter should not be used to indicate progress, such as loading or percent completion of a task.

> To communicate progress, use the progressbar role instead.

> Unlike HTML input elements, ARIA roles do not cause browsers to provide keyboard behaviors or styling.

- The Patterns page lists Accordion through Window Splitter, Meter included. No entry covers file input, file upload, drag and drop or progress.
- "Read Me First" has the heading "No ARIA is better than Bad ARIA". It does not state a native-HTML-first rule in those words.

## Why it matters for ORIVILO

The APG gives no pattern to follow for this control, so the standards input comes from WCAG and ARIA in HTML (K-0275 to K-0281, K-0285), not from a keyboard table.
