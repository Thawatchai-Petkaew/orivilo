---
id: K-0240
topic: design
claim: Untitled UI React's Button page names three destructive variants (primary-destructive, secondary-destructive, tertiary-destructive) and an isLoading prop that shows a spinner, ignores presses and stops repeat submission, with showTextWhileLoading to keep the label; the page gives no aria guidance for a loading button and does not say a loading button is disabled.
source: "https://www.untitledui.com/react/components/buttons.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces.

> Our button component provides three destructive variants: `primary-destructive`, `secondary-destructive`,
> and `tertiary-destructive`.

> When enabled, the button automatically displays a spinner and becomes non-interactive to prevent multiple submissions.

> Set `isLoading` to `true`. The button shows a spinner in place of its content and ignores presses

> Add `showTextWhileLoading` to keep the label visible next to the spinner.

These are Button facts. No Untitled page read ties them to a modal.

## Why it matters for ORIVILO

It is the nearest thing Untitled shows to a pending confirm: the state sits on the button, not on the dialog. Our Button already has a loading state (K-0259, Ours row).
