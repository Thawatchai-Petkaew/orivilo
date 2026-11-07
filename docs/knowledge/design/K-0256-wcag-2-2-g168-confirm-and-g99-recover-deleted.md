---
id: K-0256
topic: design
claim: WCAG technique G168, Requesting confirmation to continue with selected action, is for an action that can not be undone, and its test checks that a request to confirm is presented and that the action can be confirmed and canceled; G99, Providing the ability to recover deleted information, is the recovery route for content that user actions delete.
source: "https://www.w3.org/WAI/WCAG22/Techniques/general/G168; https://www.w3.org/WAI/WCAG22/Techniques/general/G99"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces.

### G168

> Use this technique in situations where the action can not be undone after it has been followed through.

> Initiate the action that can not be reversed or changed.

> Check that a request to confirm the selected action is presented.

> Check that the action can be confirmed and canceled.

### G99

> This technique applies to content where user actions cause content to be deleted.

> the server can provide a means to recover information that was deleted in error by a user.

> Check if deleted information can be recovered.

Both are sufficient techniques under SC 3.3.4 for actions that delete information (K-0254). Neither page speaks of a pending or failed confirmation.

## Why it matters for ORIVILO

G168's test is the shortest statement of what a confirm must do: appear, and offer both confirm and cancel. An undo or trash route (G99) is the listed alternative to it.
