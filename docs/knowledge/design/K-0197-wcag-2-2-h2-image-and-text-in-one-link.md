---
id: K-0197
topic: design
claim: WCAG technique H2 puts an image and its text in one link with an empty alt, or an alt that supplements the link text and describes the image, to avoid duplicate text, and the WAI tutorial says a functional image used alone carries the action in its text alternative.
source: "https://www.w3.org/WAI/WCAG22/Techniques/html/H2; https://www.w3.org/WAI/tutorials/images/functional/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

### H2, Combining adjacent image and text links for the same resource

> "This technique provides such links by putting the text and image together in one `a` element"
> "and providing null alternative text on the image to eliminate duplication of text."
> "When the text alternative for the icon is a duplicate of the link text, it is repetitive"
> "For users of assistive technologies, it can be confusing to encounter successive identical links."
> "Check that the `a` element contains an `img` element that has either a null `alt` attribute value"
> "or a value that supplements the link text and describes the image"

It is listed as Sufficient for 1.1.1 and Advisory for 2.4.4 and 2.4.9. "This technique applies to HTML documents that contain links."

### WAI tutorial, Functional images

> "Functional images are used to initiate actions rather than to convey information."
> "The text alternative for the image should convey the action that will be initiated"
> "It has the text alternative “W3C home” to indicate where the link will take the user."
> "so a null (empty) value is applied, (`alt=""`), to avoid redundancy and repetition."

The third line is Example 1, "Image used alone as a linked logo". The fourth is the tutorial's image within link text.

## Why it matters for ORIVILO

An avatar and a name inside one link or row-button match H2's shape, and an avatar alone as a control (K-0190's Dropdown) matches the tutorial's Example 1. Neither page names an avatar.
