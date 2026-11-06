---
id: K-0315
topic: design
claim: WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA, asks for pointer targets of at least 24 by 24 CSS pixels, with a Spacing exception where a 24 CSS pixel circle centred on each undersized target meets no other target, and Equivalent, Inline, User agent control and Essential exceptions; its page has no example of a remove button on a tag, and it says targets obscured by a combobox's dropdown list are out of scope while they are obscured, while targets in the new content are in scope.
source: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters.

> The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when:

> if a 24 CSS pixel diameter circle is centered on the bounding box of each, the circles do not intersect another target

> The function can be achieved through a different control on the same page that meets this criterion

> The target is in a sentence or its size is otherwise constrained by the line-height of non-target text

> In the second row, the same targets are only 20 by 20 CSS pixels, but have a 4 CSS pixel space between them

> The requirement does not apply to targets while they are obscured by content displayed

> interacting with a combobox shows a dropdown list of suggestions

> The requirement does however apply to targets in any new content that appears on top of other content.

- The "20 by 20" quote is the page's example of smaller targets with spacing between them. No example uses a close or remove button on a tag.
- The three last quotes come from the "Size requirement" part of the Intent section; the combobox line is a list item under the first.

## Why it matters for ORIVILO

Small remove buttons sit next to the input and the next chip, so the Spacing exception turns on what is beside them. The sizes read are in [[K-0294-untitled-ui-tag-close-x-size-and-one-fixed-name]] and [[K-0300-shadcn-ui-combobox-chips-remove-button-has-no-name]]. Own reading: option rows in an open list are targets in new content, so the size rule reaches them too.
