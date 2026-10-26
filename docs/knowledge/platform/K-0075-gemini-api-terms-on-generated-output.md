---
id: K-0075
topic: platform
claim: Google's Gemini API Additional Terms say Google will not claim ownership of generated content but may generate the same or similar content for others, make the user responsible for using it, and for Paid Services say prompts and responses are not used to improve Google's products but are logged for a limited period to detect violations.
source: "https://ai.google.dev/gemini-api/terms"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-126, ADR-0018, ADR-0009]
license: own-words
---

## Evidence

The page says "Last updated 2026-04-28 UTC." Read on 2026-10-26 through a fetch tool that returns page text to a reading model, treated as untrusted data. The terms carry no reuse license; short quotes only.

> Google won't claim ownership over that content.

> You acknowledge that Google may generate the same or similar content for others and that we reserve all rights to do so.

> You're responsible for your use of generated content, and for the use of that content by anyone you share it with.

> Google logs prompts and responses for a limited period of time, solely for detecting and preventing violations

## What the page states (fact)

- **Ownership.** Google does not claim ownership of generated content. It does not say the user owns it either; it says Google will not claim it.
- **Not exclusive.** Google may produce the same or similar content for other users and keeps the right to do so.
- **Responsibility.** The user is responsible for use of generated content, including by people they share it with, and is told to "Use discretion before relying on generated content."
- **Paid Services data use.** Google does not use prompts or responses to improve its products; it logs them for a limited, unstated period only to detect and prevent violations.
- **What counts as paid.** Gemini API access is a Paid Service "only when accessing the API through a Cloud Project" with an active billing account; AI Studio access counts as paid under a billing Cloud Project or a Workspace enterprise account.

## What the page does not state

- **How these terms apply when the model is reached through OpenRouter.** The terms address a Google customer's own Gemini API use. OpenRouter's terms say each model's own terms govern outputs ([[K-0076-openrouter-terms-on-outputs]]), but the list that maps OpenRouter's Google AI Studio endpoint to a Google terms page did not come through when read, and the model page on OpenRouter links no terms. That this page is the one that governs ORIVILO's calls through OpenRouter is an inference, below 0.7.
- **Whether OpenRouter's account with Google is a Paid Service**, which decides the training and logging rule above. Not stated anywhere read.
- **Trademark or originality.** Nothing on the page says generated content is free of third-party rights.

## Why it matters for ORIVILO

ADR 0018 decision 5 labels every image a draft and never says a logo is unique or owned; the "same or similar content for others" sentence is the direct ground for that. The data-use text backs the PDPA privacy notice only if the Paid Service rule and the OpenRouter link are confirmed.
