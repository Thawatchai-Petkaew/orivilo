---
id: K-0276
topic: design
claim: WCAG 2.2 SC 2.1.1 Keyboard (Level A) requires all functionality to work through a keyboard interface unless the function depends on the path of movement, and its Understanding page gives an application whose drag and drop also supports cut and paste or form controls as an example.
source: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, so long sentences are in parts.

> All functionality of the content is operable through a keyboard interface

> without requiring specific timings for individual keystrokes

> except where the underlying function requires input that depends on the path of the user's movement

> An application that uses drag and drop also supports "cut" and "paste" or form controls to move objects.

The example, titled "A drag and Drop Feature", moves objects inside an application and does not name files. Picking a file is a task with endpoints, not a path, so the exception is not an obvious fit (own reading).

## Why it matters for ORIVILO

A drop-only control offers no keyboard route; the example shows a form control beside the drag as the accepted shape.
