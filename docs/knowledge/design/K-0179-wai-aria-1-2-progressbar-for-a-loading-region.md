---
id: K-0179
topic: design
claim: WAI-ARIA 1.2 says that when a progressbar describes the loading progress of a region of a page, the author should point to the status with aria-describedby and keep aria-busy true on the region until it has finished loading.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, from the description of role `progressbar`, joined as it returned them. Confidence 0.8: the W3C Recommendation, one source. The role's first sentence is in K-0114 and `aria-busy` in K-0113; this entry records the sentence that ties the two to a region.

> If the progressbar is describing the loading progress of a particular region of a page,
> the author SHOULD use aria-describedby to point to the status,
> and set the aria-busy attribute to true on the region until it is finished loading.

## Why it matters for ORIVILO

This is the spec's one sentence read that joins a region, `aria-busy` and a status. It applies when a progressbar is present; a region with a spinner or a status text alone is not named in it.
