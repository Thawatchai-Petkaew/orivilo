---
id: K-0201
topic: design
claim: WCAG 2.2 SC 1.4.1 (Level A) says colour may not be the only visual means of conveying information, and SC 1.4.11 (Level AA) asks 3:1 for parts of graphics required to understand the content, with status icons without associated text as an example; neither page speaks of a presence dot.
source: "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html; https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: link-only
---

## Evidence

### SC 1.4.1 Use of Color (Level A)

> "Color is not used as the only visual means of conveying information, indicating an action,"
> "prompting a response, or distinguishing a visual element."
> "However, if content relies on the user's ability to accurately perceive or differentiate a particular color"
> "an additional visual indicator will be required regardless of the contrast ratio between those colors."
> "Use information in addition to color, such as shape or text, to convey meaning."

Techniques named: G14 ("Ensuring that information conveyed by color differences is also available in text"), G205. The page has no example on a status dot or an online state.

### SC 1.4.11 Non-text Contrast (Level AA)

> "The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s):"
> "Status icons on an application's dashboard (without associated text) have a 3:1 minimum contrast ratio."
> "Not every graphical object needs to contrast with its surroundings."
> "The information is available in another form, such as in a table that follows the graph."

The graphical objects bullet covers "Parts of graphics required to understand the content,". The last line is one of the listed cases where a graphic need not meet the ratio.

### Own reading

A dot that tells online from offline carries information, so it is not pure decoration under K-0195 and needs a text alternative. The pages do not say this of a dot. Untitled UI's two statuses differ by colour class only (K-0187).

## Why it matters for ORIVILO

If a status dot is ever built, these are the criteria it meets or misses. No check here claims conformance (security rule 16).
