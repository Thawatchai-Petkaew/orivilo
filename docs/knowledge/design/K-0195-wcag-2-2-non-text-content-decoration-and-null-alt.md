---
id: K-0195
topic: design
claim: WCAG 2.2 SC 1.1.1 (Level A) asks for a text alternative serving the equivalent purpose for all non-text content, and asks that pure decoration be implemented so assistive technology can ignore it, which technique H67 does with an empty alt and no title; the Understanding page does not mention a portrait, an avatar or a profile picture.
source: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html; https://www.w3.org/WAI/WCAG22/Techniques/html/H67"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

### Understanding SC 1.1.1 Non-text Content (Level A)

> "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose"
> "If non-text content is pure decoration, is used only for visual formatting, or is not presented to users,"
> "then it is implemented in a way that it can be ignored by assistive technology."
> "serving only an aesthetic purpose, providing no information, and having no functionality"
> "If non-text content is a control or accepts user input, then it has a name that describes its purpose."

The fourth line is the definition of pure decoration.

> "Sometimes there is non-text content that really is not meant to be seen or understood by the user."
> "Putting alternative text on such items just distracts people using screen readers from the content on the page."

The page has no sentence on an image that repeats adjacent text. Word check: "portrait", "avatar" and "profile" do not occur. Its one photograph example is "A photograph of two world leaders shaking hands accompanies a news story about an international summit meeting."

Techniques listed: H67 and C9 under "Situation F: If the non-text content should be ignored by assistive technology:"; H2 and G196 under Situation A; failures F38 ("not marking up decorative images in HTML in a way that allows assistive technology to ignore them") and F39 ("providing a text alternative that is not null (e.g., alt="spacer" or alt="image")").

### H67

> "Using null alt text and no title attribute on img elements for images that assistive technology should ignore"
> "Having a "null" alt attribute is not the same as having no alt attribute."
> "Check that title attribute is either absent or empty."
> "Check that alt attribute is present and empty."

## Why it matters for ORIVILO

SC 1.1.1 sets the two outcomes a picture can have: a text alternative or a way to be ignored. It does not say which a person's picture beside their name takes; K-0196 to K-0198 come closest.
