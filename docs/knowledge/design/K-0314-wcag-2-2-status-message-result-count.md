---
id: K-0314
topic: design
claim: WCAG 2.2's Understanding page for SC 4.1.3 gives a search that adds "5 results returned" to the page as a status message example, defines a status message as telling the user the success or results of an action, and treats content that takes focus as a change of context instead.
source: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html; docs/knowledge/design/K-0115-wcag-2-2-status-messages-cover-the-waiting-state.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters.

> The change to content also includes the message "5 results returned" near the top of this new content.

> provides information to the user on the success or results of an action

> Since the dialog takes focus, it is defined as a change of context and does not meet the definition of a status message.

> a section of content near the Shopping Cart icon adds the text "5 items".

- The first example follows a press of a Search button, with results shown below it; it is not a combobox list.
- SC 4.1.3 is Level AA and also covers the waiting state ([[K-0115-wcag-2-2-status-messages-cover-the-waiting-state]]).

## Why it matters for ORIVILO

Own reading: an updated result count, a "no results" line and a "searching" line are close to this example, while the page does not name a combobox. The shopping cart line is the nearest case for an added item count.
