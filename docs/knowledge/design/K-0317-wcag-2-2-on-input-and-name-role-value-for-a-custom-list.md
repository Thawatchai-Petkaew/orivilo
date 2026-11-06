---
id: K-0317
topic: design
claim: WCAG 2.2 SC 3.2.2 On Input (Level A) counts changing the selected option in a list as changing a setting, which must not cause an unannounced change of context, and SC 4.1.2 Name, Role, Value (Level A) asks custom controls to expose name, role, states and values with notification of changes.
source: "https://www.w3.org/WAI/WCAG22/Understanding/on-input.html; https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters.

SC 3.2.2:

> Changing the setting of any user interface component does not automatically cause a change of context

> unless the user has been advised of the behavior before using the component.

> changing the selected option in a list control changes its setting

> a select dropdown allows the user to choose the type of calendar entry to create.

SC 4.1.2:

> the name and role can be programmatically determined

> states, properties, and values that can be set by the user can be programmatically set

> notification of changes to these items is available to user agents, including assistive technologies

- The calendar example reveals different fields on a change and the overall context stays the same.
- The On Input page does not use the word combobox.
- SC 4.1.2's examples of state include "whether or not a checkbox or radio button has been selected" and "whether a collapsible tree view or accordion is expanded or collapsed".
- SC 4.1.2's example "Custom widgets using HTML and ARIA" names "such as toggle buttons, comboboxes, or disclosure widgets", implemented "to make sure that they programmatically convey" name, role, state and value.

## Why it matters for ORIVILO

A chosen option that closes the list, adds a chip and clears the filter is a setting change to check against 3.2.2, and a chip's remove button needs a name under 4.1.2 (K-0300, K-0306).
