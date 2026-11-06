---
id: K-0279
topic: design
claim: WCAG 2.2 SC 3.3.1 Error Identification (Level A) requires an automatically detected input error to identify the item and describe the error in text; colour may be added beside the text, and its techniques for data outside allowed formats or values include G84, G85, ARIA18, ARIA19, ARIA21 and SCR18.
source: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters.

> If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.

> information provided by the user that is not accepted

> The error must be indicated in text.

> It is perfectly acceptable to indicate the error in other ways such as through the use of an image, color, or other visual indicator.

- The definition's note names required information left out and information outside the required data format or values.
- Situation B (data format or allowed values) lists G84, G85, ARIA18, ARIA19, ARIA21 and SCR18. ARIA21 is "Using aria-invalid to Indicate An Error Field".
- The page does not mention file formats or uploads. A rejected type or size is read here as information "not accepted" (own reading).

## Why it matters for ORIVILO

"The item in error" for a multi-file picker is the file, so the source bears on naming each rejected file, and it excludes a colour change alone as the whole message.
