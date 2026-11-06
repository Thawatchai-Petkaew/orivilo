---
id: K-0196
topic: design
claim: The W3C WAI Images Tutorial counts an image identified and described by surrounding text as decorative and gives it an empty alt, with a sleeping dog as its example, and warns that without an alt attribute some screen readers announce the file name.
source: "https://www.w3.org/WAI/tutorials/images/decorative/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

> "Decorative images don’t add information to the content of a page."
> "Identified and described by surrounding text."
> "This picture of a sleeping dog is already sufficiently described by the adjacent text."
> "a null (empty) `alt` text should be provided (`alt=""`)"
> "when it is not provided, some screen readers will announce the file name of the image instead."

The second line is one of four bullets on when an image is decorative. The others are visual styling, "Supplementary to link text to improve its appearance or increase the clickable area;", and "Illustrative of adjacent text but not contributing information (“eye-candy”);".

The third line is Example 3, "Image with adjacent text alternative". The example is not a person. Own reading: a visible name identifies who is pictured but does not describe the picture, so the fit to an avatar is an inference, not a statement of the tutorial.

## Why it matters for ORIVILO

This is the closest W3C guidance found for a picture beside a visible name, and it comes from a tutorial, not a normative text.
