---
id: K-0257
topic: design
claim: WCAG 2.2 SC 3.3.1 Error Identification (Level A) and SC 3.3.3 Error Suggestion (Level AA) apply when an input error is automatically detected, require the error described in text and known suggestions provided, and define an input error as information provided by the user that is not accepted; the pages read do not say whether a failed server action counts as one.
source: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html; https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> If an input error is automatically detected, the item that is in error is identified
> and the error is described to the user in text.

> The intent of this success criterion is to ensure that users are aware that an error has occurred
> and can determine what is wrong.

> If an input error is automatically detected and suggestions for correction are known,
> then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content.

Key term, input error: "information provided by the user that is not accepted". Its note lists information required but omitted, and information outside the required format or values.

## Why it matters for ORIVILO

A confirm that fails on the server (network, permission) falls outside the words of this definition as read, so these criteria do not by their words settle the failure state. SC 4.1.3 (K-0115) covers how a message is exposed, not what it says.
