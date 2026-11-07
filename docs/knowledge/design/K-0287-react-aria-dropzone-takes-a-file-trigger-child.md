---
id: K-0287
topic: design
claim: React Aria's DropZone page has FileTrigger passed as a child for picking files and a label slot, shows a visible Browse button in its examples, and has no accessibility section and no text on dropping by keyboard or on a virtual drop target.
source: "https://react-aria.adobe.com/DropZone"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes, after `https://react-spectrum.adobe.com/react-aria/DropZone.html` redirected here. Confidence 0.75, not 0.8: half the claim is an absence from one page, and React Aria's source and hook pages were not read. It is outside the three libraries the question names; it is here because Untitled UI says its uploaders are built with React Aria (K-0260).

> To allow the selection of files from the user's device, pass `FileTrigger` as a child of `DropZone`.

> Drop or paste text or images here.

- The API shows `<Text slot="label" />` inside `DropZone`; `aria-label` is "Defines a string value that labels the current element."
- The second quote is a label in the page's examples; the page gives no keyboard paste instructions.

## Why it matters for ORIVILO

It is a lead on a drop target that takes a picker inside it. It does not settle how such a zone behaves for a keyboard user, because the page read does not say.
