---
id: K-0163
topic: design
claim: The WAI-ARIA APG Alert pattern gives role alert, no keyboard interaction, and three cautions, that an alert must not affect keyboard focus, should not disappear automatically and should not interrupt often; it also says screen readers do not tell users of alerts present before page load completes; the two criteria it names for timing and interruption, 2.2.3 and 2.2.4, are Level AAA.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/alert/; https://www.w3.org/WAI/WCAG22/Understanding/no-timing.html; https://www.w3.org/WAI/WCAG22/Understanding/interruptions.html; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, joined below with `...` where a break fell. Confidence 0.8: the W3C APG page, one source, with the two levels from the Understanding pages. The APG example page was not read.

> An alert is an element that displays a brief, important message in a way that attracts the user's attention ... without interrupting the user's task.

> It is important to note that, at this time, screen readers do not inform users of alerts ... that are present on the page before page load completes.

> Because alerts are intended to provide important and potentially time-sensitive information without ... interfering with the user's ability to continue working, it is crucial they do not affect keyboard focus.

> The Alert Dialog Pattern is designed for situations where interrupting work flow is necessary.

> It is also important to avoid designing alerts that disappear automatically.

> An alert that disappears too quickly can lead to failure to meet WCAG 2.0 success criterion 2.2.3.

> Frequent interruptions inhibit usability for people with visual and cognitive disabilities, which makes ... meeting the requirements of WCAG 2.0 success criterion 2.2.4 more difficult.

Keyboard interaction: "Not applicable." Roles: "The widget has a role of alert."

The page names WCAG 2.0. The WCAG 2.2 Understanding pages head these as "Understanding SC 2.2.3 No Timing (Level AAA)" and "Understanding SC 2.2.4 Interruptions (Level AAA)".

## Why it matters for ORIVILO

A failed job shown inline may already be on the page when a user arrives, and by this page such an alert is not spoken. The "at this time" wording is the APG's, and no screen reader test backs it here. The timing and interruption cautions tie to Level AAA criteria.
