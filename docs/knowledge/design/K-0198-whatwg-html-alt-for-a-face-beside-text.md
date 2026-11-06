---
id: K-0198
topic: design
claim: The WHATWG HTML standard treats a face beside text as an ancillary image, gives the example alt="" for a politician's face and says describing a bare face may add nothing, requires a non-empty alt when a caption gives the image's title, and requires alt text that conveys the purpose when an image is the only content of a link or button; it has no avatar example.
source: "https://html.spec.whatwg.org/multipage/images.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

Read through a fetch tool in two parts (characters 0 to 100000, then 100000 to the end). Section 4.8.4.4 is in the second part.

### Ancillary images (4.8.4.4.7)

> "Sometimes, an image is not critical to the content, but is nonetheless neither purely decorative"
> "nor entirely redundant with the text."
> "In these cases, the alt attribute must be present, and its value should either be the empty string,"
> "or a textual representation of the information that the image conveys."
> "If the image has a caption giving the image's title, then the alt attribute's value must not be empty"
> "(as that would be quite confusing for non-visual readers)."

The section's example of a face:

> "Consider a news article about a political figure, in which the individual's face was shown in an image."
> "Whether any alternative text need be provided is an authoring decision, "
> "decided by whether the image influences the interpretation of the prose."
> "In this first variant, the image is shown without context, and no alternative text is provided:"
> "If the picture is just a face, there might be no value in describing it."

```text
<p><img src="president.jpeg" alt=""> Ahead of today's referendum,
the President wrote an open letter to all registered voters.
In it, she admitted that the country was divided.</p>
```

### Other sections

> "Except where otherwise specified, the alt attribute must be specified and its value must not be empty"

That is the general rule the sections below qualify.

> "In many cases, the image is actually just supplementary, and its presence merely reinforces the surrounding text."
> "In these cases, the alt attribute must be present but its value must be the empty string."

That is "A graphical representation of some of the surrounding text".

> "When an a element that creates a hyperlink, or a button element, has no textual content"
> " but contains one or more images, the alt attributes must contain text"
> " that together convey the purpose of the link or button."

That is "A link or button containing nothing but the image".

> "Similarly, a photograph of a person's face, for example in a biography, can be considered quite relevant"
> "and key to the content, but it can be hard to fully substitute text for:"

That is "A key part of the content", with an alt that describes the face (`Isaac Asimov had dark hair, a tall forehead, and wore glasses. Later in life, he wore long white sideburns.`).

> "The title attribute can be used for supplemental information."

No avatar or user picture example was found in either part.

## Why it matters for ORIVILO

This is the one normative text read that speaks of a face. It leaves the choice to the author and shows `alt=""` for a face with no caption, and it separates that from a picture alone in a control.
