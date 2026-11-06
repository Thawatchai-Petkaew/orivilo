---
id: K-0286
topic: design
claim: The HTML Standard calls accept a hint of the expected file types and MDN says it does not validate and must be backed by server-side validation; MDN also hides a file input with opacity and not visibility hidden or display none, because assistive technology reads those two as not interactive.
source: "https://html.spec.whatwg.org/multipage/input.html; https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file; docs/adr/0009-ai-through-openrouter.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The first request to `html.spec.whatwg.org` failed with a refused connection; a retry worked, and the characters 100,000 to 200,000 of 317,535 held the File Upload state section.

> The `accept` attribute may be specified to provide user agents with a hint of what file types will be accepted.

> User agents should prevent the user from selecting files that are not accepted by one (or more) of these tokens.

> Unless the `multiple` attribute is set, there must be no more than one file in the list of selected files.

> The `accept` attribute doesn't validate the types of the selected files; it provides hints for browsers to guide users towards selecting the correct file types.

> Because of this, you should make sure that the `accept` attribute is backed up by appropriate server-side validation.

> **Note:** `opacity` is used to hide the file input instead of `visibility: hidden` or `display: none`, because assistive technology interprets the latter two styles to mean the file input isn't interactive.

The HTML Standard also says data from a client "should be treated with caution" and encourages authors to give both MIME types and extensions. MDN's example styles the `<label>` like a button and hides the input. MDN has no note on drag and drop.

## Why it matters for ORIVILO

ADR 0009 point 5 checks images by magic bytes on the server. This entry records why `accept` alone cannot stand for that check, and it bears on how the file input is hidden.
