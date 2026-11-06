---
id: K-0274
topic: design
claim: Radix Form wires a Form.Message to its control when nested in a Field, shows it when match is true on the control's validity state or on a custom function, and moves focus to the first invalid control, with no text on file inputs.
source: "https://www.radix-ui.com/primitives/docs/components/form"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The source file was not read, so the page's "automatically associated" is not checked against named attributes.

> A validation message which is automatically wired (functionality and accessibility) to a given control when nested inside a `Field` part.

> The message will show if the given `match` is `true` on the control's validity state.

> Focus is moved to the first invalid control.

The page says client-side messages are "automatically associated with their matching control and announced accordingly". It names neither `aria-invalid` nor `aria-describedby`, and it does not mention file inputs.

## Why it matters for ORIVILO

Native validity has no file size check, and `accept` is only a hint (K-0286), so a size or type rejection is a custom rule under this API, not a built-in one (own reading).
