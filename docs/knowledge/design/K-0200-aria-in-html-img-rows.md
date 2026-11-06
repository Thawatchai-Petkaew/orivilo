---
id: K-0200
topic: design
claim: ARIA in HTML maps an img with non-empty alt to role img, an img with alt="" to none or presentation with no aria attribute except aria-hidden="true", and allows no role other than none or presentation on an img with no alt or name.
source: "https://www.w3.org/TR/html-aria/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

Read through a fetch tool; characters 0 to 100000 of 172302, which hold the conformance table rows below. The rest was not read.

> "If the img has non-empty alt (alt="some text") or an accessible name is provided by another img naming method"
> "role=img or image"
> "If the img has no alt attribute or no accessible name:"
> "No role other than the role=none or presentation roles."
> "role=img or image is also allowed, but NOT RECOMMENDED."

> "If the img has an empty alt (alt="") and lacks any other img naming methods:"
> "role=none, role=presentation"
> "No role other than the role=none or presentation roles, which are NOT RECOMMENDED."
> "No aria-* attributes except aria-hidden="true"."

The read part has no sentence saying to prefer `alt` over `aria-label` on an `img`.

## Why it matters for ORIVILO

If a picture beside a name takes `alt=""`, these rows say what else may sit on it.
