---
id: K-0178
topic: design
claim: The WCAG 2.2 Understanding page for SC 4.1.3 says a list of search results is not a status update but brief text such as "Searching...", "18 results returned" or "No results returned" is one if it takes no focus and causes no page refresh, and that the criterion does not force authors to create new messages; technique ARIA22 shows role status on "5 results returned." and checks that the role is on the container before the message occurs.
source: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, joined below as it returned them. Confidence 0.8: the W3C Understanding document and its technique, one publisher. K-0115 records the SC text and the waiting state; this entry records the search and no-results parts.

The Understanding page, under Intent:

> Information can be added to pages which does not meet the definition of a status message.
> For example, the list of results obtained from a search are not considered a status update
> and thus are not covered by this success criterion.
> However, brief text messages displayed about the completion or status of the search, such as "Searching...",
> "18 results returned" or "No results returned" would be status updates if they do not take focus or cause a page refresh.

Its note:

> The purpose of this success criterion is not to force authors to generate new status messages.
> Its intent is to ensure that when status messages are displayed, they are programmatically identified
> in a way that allows assistive technologies to present them to the user.

Its definition opens "change in content that is not a change of context, and that provides information to the user".

ARIA22, Example 1:

```text
<div role="status" aria-atomic="true">5 results returned.</div>
```

> A screen reader will announce "5 results returned".

ARIA22 test step 1 reads "Check that the container destined to hold the status message has a `role` attribute with a value of `status`" and "_before_ the status message occurs." The tool found no zero-result example and no loading or busy content on the ARIA22 page.

Asked for them by name, the tool found none of "empty", "empty state", "first use", "no data", "no items" or "aria-busy" on the Understanding page, and none of "empty", "empty state", "first use", "no data", "no items" or "no results" on the ARIA22 page. It reported that the Understanding page does not discuss a region already empty when the page first loads.

## Why it matters for ORIVILO

By our reading, an empty message that appears as the result of a search or filter is the "No results returned" case, while a region already empty when the page first renders is not a "change in content". The pages read do not name that case, so the second reading is ours.
