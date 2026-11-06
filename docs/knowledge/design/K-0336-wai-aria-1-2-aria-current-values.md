---
id: K-0336
topic: design
claim: WAI-ARIA 1.2 defines aria-current with the values page, step, location, date, time, true and false (default), says authors should mark only one element in a set as current, and says it should not substitute for aria-selected.
source: "https://www.w3.org/TR/wai-aria-1.2/#aria-current"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-229]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, from the section of the page that starts near character 380000.

> Indicates the element that represents the current item within a container or set of related elements.

> Authors SHOULD only mark one element in a set of elements as current with aria-current.

> Authors SHOULD NOT use the aria-current attribute as a substitute for aria-selected

- `page`: "Represents the current page within a set of pages."
- `step`: "Represents the current step within a process."
- `location`: "Represents the current location within an environment or context."
- `date`: "Represents the current date within a collection of dates."
- `time`: "Represents the current time within a set of times."
- `true`: "Represents the current item within a set."
- `false` (default): "Does not represent the current item within a set."

## Why it matters for ORIVILO

`page` is the value the APG and both libraries use for a breadcrumb and a page number. The aria-selected line separates "current page" from the selection state, which bears on which visual tokens a current item takes.
