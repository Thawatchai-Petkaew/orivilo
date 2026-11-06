---
id: K-0254
topic: design
claim: WCAG 2.2 SC 3.3.4 Error Prevention (Legal, Financial, Data), Level AA, covers pages that cause legal commitments or financial transactions, that modify or delete user-controllable data in data storage systems, or that submit test responses, and needs at least one of reversible, checked or confirmed; its Understanding page says the deletion concern is mass loss of data such as a file or record, and that a confirmation for each save command is not the intent.
source: "https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces; lines joined below are consecutive pieces of one sentence.

> For web pages that cause legal commitments or financial transactions for the user to occur, that modify or delete
> user-controllable data in data storage systems, or that submit user test responses,
> at least one of the following is true:

> Submissions are reversible.

> Data entered by the user is checked for input errors and the user is provided an opportunity to correct them.

> A mechanism is available for reviewing, confirming, and correcting information before finalizing the submission.

> When referring to modification or deletion of 'user controllable' data, the intent is to prevent mass loss of data
> such as deleting a file or record.

> It is not the intent to require a confirmation for each save command

> User-controllable data is user-viewable data that the user can change and/or delete through an intentional action.

For actions that delete information ("If an action causes information to be deleted:"), the page lists G99, G168 and G155 as sufficient techniques (K-0256).

## Why it matters for ORIVILO

At AA a confirm is one of three routes, not the only one: an action that is reversible meets the criterion without a dialog.
