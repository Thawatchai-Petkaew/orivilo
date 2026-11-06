---
id: K-0168
topic: design
claim: WCAG failure F81 says content fails SC 1.4.1 when a required or error field is identified by colour differences and no non-colour way to identify it is provided.
source: "https://www.w3.org/WAI/WCAG22/Techniques/failures/F81"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: the W3C failure page, one source.

> Failure of Success Criterion 1.4.1 due to identifying required or error fields using color differences only

Test procedure:

> For all required fields or error fields in the web page that are identified using color differences:
> Check that a non-color way to identify the required field or error field is provided.

Expected results: "If check #1 is false, then this failure condition applies and content fails the Success Criterion."

## Why it matters for ORIVILO

F81 names fields, not alert boxes, so it applies directly to `Field` and `Checkbox` errors and only by analogy to an Alert. SC 1.4.1 itself (K-0167) has no such limit.
