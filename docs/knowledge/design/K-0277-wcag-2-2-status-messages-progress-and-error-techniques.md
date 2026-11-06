---
id: K-0277
topic: design
claim: WCAG 2.2's SC 4.1.3 Understanding page lists ARIA19 with text techniques for error warnings and, for progress, ARIA23, ARIA25, ARIA22 with G193 or ARIA27, says content that takes focus is not a status message, and lists role alert on content that is not important and time-sensitive as a failure.
source: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. K-0115 holds the criterion's text and the definition; this entry adds what bears on an upload.

> An application displays a dynamic progress bar to indicate the status of an upgrade. The screen reader provides intermittent announcements of the progress.

> Since the dialog takes focus, it is defined as a change of context and does not meet the definition of a status message.

> A role of "alert" is only necessary where a change of context does _not_ take place.

> Using `role="alert"` or `aria-live="assertive"` on content which is not important and time-sensitive.

| Situation                                                | Techniques named                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| A: success or results of an action, or application state | ARIA22 (role=status) with G199                                       |
| B: a suggestion, or a warning about an error             | ARIA19 (role=alert or live regions) with G83, G84, G85, G177 or G194 |
| C: progress of a process                                 | ARIA23 (role=log), ARIA25, ARIA22 with G193, or ARIA27               |

The page has no upload example and does not mention `role="progressbar"`. Its ARIA23 technique page uses a chat and a server log as examples, with no upload.

## Why it matters for ORIVILO

An upload produces all three situations: done, rejected or failed, and progress. The table is the source's list, not a choice among them.
