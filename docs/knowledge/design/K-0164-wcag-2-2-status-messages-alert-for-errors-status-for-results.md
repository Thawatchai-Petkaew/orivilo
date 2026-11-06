---
id: K-0164
topic: design
claim: The WCAG 2.2 Understanding page for SC 4.1.3 (Level AA) lists role=status (ARIA22) for the success or results of an action or the state of an application and role=alert or live regions (ARIA19) for a suggestion or a warning on the existence of an error; it excludes an error shown in a dialog that takes focus, and it lists role=alert or assertive on content that is not important and time-sensitive as a failure, with no technique id.
source: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html; docs/knowledge/design/K-0115-wcag-2-2-status-messages-cover-the-waiting-state.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: the W3C Understanding document, one source. The SC text and the definition are in K-0115; this entry records the alert and error parts of the same page.

Situation A:

> If a status message advises on the success or results of an action, or the state of an application:

Techniques: "ARIA22: Using role=status to present status messages", "G199: Providing success feedback when data is submitted successfully".

Situation B:

> If a status message conveys a suggestion, or a warning on the existence of an error:

Techniques: "ARIA19: Using ARIA role=alert or Live Regions to Identify Errors", "G83: Providing text descriptions to identify required fields that were not completed", "G85: Providing a text description when user input falls outside the required format or values", "G177: Providing suggested correction text", "G194: Providing spell checking and suggestions for text input", and G84. The note under this situation reads:

> Not all examples in the preceding general techniques use status messages ... to convey warnings or errors to users.
> A role of "alert" is only necessary where a change of context does not take place.

Under the heading "Failures", marked "(future link)" with no technique id:

> Using role="alert" or aria-live="assertive" on content which is not important and time-sensitive

Dialogs:

> Since the dialog takes focus, it is defined as a change of context ... and does not meet the definition of a status message.

> Changes of context, by their nature, interrupt the user by taking focus.

Text that stays:

> If a status message persists on the page, ... modifications to this text are usually equivalent to a new status message.

An error example: "After a user unsuccessfully fills in a form because some of the data is in the incorrect format, text is added to the existing form which reads "5 errors on page"".

The tool found nothing specific on status content already present when a page loads.

## Why it matters for ORIVILO

The page splits by what a message says: results and application state in Situation A, suggestions and errors in Situation B. Our four kinds do not map onto it by name. By our reading success sits in A and danger in B, while info and warning depend on the message.
