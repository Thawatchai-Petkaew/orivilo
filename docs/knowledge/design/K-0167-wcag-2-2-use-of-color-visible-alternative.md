---
id: K-0167
topic: design
claim: WCAG 2.2 SC 1.4.1 Use of Color (Level A) says colour is not the only visual means of conveying information, indicating an action, prompting a response or distinguishing a visual element; it requires a visible alternative, aims at sighted users who cannot tell some colours apart, and leaves assistive technology to other criteria such as 1.1.1, 1.3.1 and 4.1.2.
source: "https://www.w3.org/TR/WCAG22/; https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, joined below with `...` where a break fell. Confidence 0.8: the W3C Recommendation and its Understanding document.

> Color is not used as the only visual means of conveying information, indicating an action, ... prompting a response, or distinguishing a visual element.

Note under the SC:

> This success criterion addresses color perception specifically. Other forms of perception are covered in Guideline 1.3 ... including programmatic access to color and other visual presentation coding.

Note in the Intent section:

> This criterion does not directly address the needs of users with assistive technologies.
> It aims to ensure that sighted users who cannot distinguish between some colors ... can still understand content.
> How information is conveyed to assistive technology users is covered separately ... in other criteria, including (but not limited to) 1.1.1 Non-text Content ... 1.3.1 Info and Relationships ... and 4.1.2 Name, Role, Value.

> This criterion requires a visible alternative to color.

> Color is an important asset in the design of web content

Example, "A form that uses color and text to indicate required fields":

> Instructions at the top of the form explain that required fields are labeled with red text and also with an icon.

Sufficient techniques for colour in words, backgrounds or content include "G14: Ensuring that information conveyed by color differences is also available in text" and "G182: Ensuring that additional visual cues are available when text color differences are used to convey information".

## Why it matters for ORIVILO

By our reading, colour may stay on an alert as long as text or a shape says the same thing. Because the alternative has to be visible, a hidden `aria-*` value would not meet this criterion, while an icon hidden from assistive technology still could, since it is seen.
