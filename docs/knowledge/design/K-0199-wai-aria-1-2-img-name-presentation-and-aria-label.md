---
id: K-0199
topic: design
claim: WAI-ARIA 1.2 requires an accessible name on role img and makes its children presentational, says no meaningful alternative text goes on an image with role presentation, treats role none or presentation on an HTML img as aria-hidden true, and says to use aria-labelledby rather than aria-label when the label text is in the DOM.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

Read through a fetch tool in parts by character offset. The sections below were found; the `aria-hidden` text on focusable elements was not found in the parts returned.

### role img (`#img`)

> "A container for a collection of elements that form an image."

The section says `img` "represents a single graphic within a document, whether or not it is formed by a collection of drawing objects." The characteristics table has Children Presentational True and Accessible Name Required True.

> "The DOM descendants are presentational."
> "User agents _SHOULD NOT_ expose descendants of this element through the platform accessibility API."

### role presentation

> "An element whose implicit native role semantics will not be mapped to the accessibility API."
> "Authors SHOULD NOT provide meaningful alternative text (for example, use alt="" in HTML)"
> " when the presentation role is applied to an image."
> "Consequently, using role="presentation" or role="none" on an HTML img is equivalent to using aria-hidden="true"."

### aria-hidden, aria-label

> "Indicates whether the element is exposed to an accessibility API."
> "The element is hidden from the accessibility API."
> "Authors are advised to use extreme caution and consider a wide range of disabilities"
> "Defines a string value that labels the current element."
> "If the label text is available in the DOM (i.e. typically visible text content), authors SHOULD use aria-labelledby"

The second line is the `true` value row. The fetch gave the rest of the last sentence as: authors should not use `aria-label`.

The sections read say nothing on a person's picture.

## Why it matters for ORIVILO

A wrapper with role `img` would need a name, and a picture hidden through `role="none"` or `aria-hidden` leaves the name to the text beside it (own reading). These are the mechanisms a design can choose between; the sections read do not pick one for an avatar.
