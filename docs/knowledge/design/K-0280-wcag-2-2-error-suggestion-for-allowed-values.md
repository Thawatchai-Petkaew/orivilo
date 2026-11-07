---
id: K-0280
topic: design
claim: WCAG 2.2 SC 3.3.3 Error Suggestion (Level AA) requires known corrections for a detected input error to be given unless that harms security or purpose, and its example for a limited set of values lists the allowed choices in the suggestion.
source: "https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html; DESIGN.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, so the criterion is in two parts.

> If an input error is automatically detected and suggestions for correction are known,

> then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content.

> The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible.

The example "Suggestions from a Limited Set of Values" is a field that needs a month name; a suggestion reads "Choose one of: January, February, March, April, May, June, July, August, September, October, November, December." The fetch returned no file example.

## Why it matters for ORIVILO

A type or size limit is a known set of allowed values, so a rejection message can state it. `DESIGN.md` section 7 asks the same of an invalid state: the "message says the fix".
