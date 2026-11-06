---
id: K-0241
topic: design
claim: The Untitled UI React component index lists Alerts and Modals and no entry named confirmation, confirm, alert dialog or dialog; its Alerts are inline cards whose confirm action comes from onConfirm with a confirmLabel, in default, brand, gray, error, warning or success colors, and the Alerts page mentions neither destructive use nor role alert.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/alerts.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces. Confidence 0.75: the first half is an absence in an index as the tool returned it.

> AlertFloating is a self-contained rounded card with a border and shadow that you place inside your layout.

> Pass `onConfirm` together with a `confirmLabel` string.
> The action row only renders when `onConfirm` or `onClose` is supplied,
> so a purely informational alert can omit both.

> Both alerts accept a `color` prop of `"default"`, `"brand"`, `"gray"`, `"error"`, `"warning"` or `"success"`,
> defaulting to `"default"`.

## Why it matters for ORIVILO

So the "modal and confirmation pages" the question asks for are, at Untitled, the Modals pages only (K-0237, K-0238, K-0239). The Alerts confirm action is inline and does not block the page.
