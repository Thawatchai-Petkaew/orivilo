---
id: K-0226
topic: design
claim: WAI-ARIA 1.2 defines aria-current for the current item in a set of related elements, with values page, step, location, date, time, true and false (default); authors should mark only one element in a set and should not use it as a substitute for aria-selected where that has the same meaning.
source: "https://www.w3.org/TR/wai-aria-1.2/; packages/design-system/src/components/card/Card.tsx; packages/design-system/src/foundations/spec-sheet.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes, from characters 300000 to 400000 of the page, the part that holds the definition.

> The aria-current attribute is used when an element within a set of related elements is visually styled

> Authors SHOULD only mark one element in a set of elements as current with aria-current.

> Authors SHOULD NOT use the aria-current attribute as a substitute for aria-selected

The sentence ends "in widgets where aria-selected has the same meaning."

Values:

- `page`: "Represents the current page within a set of pages."
- `step`: "Represents the current step within a process."
- `location`: "Represents the current location within an environment or context."
- `date`: "Represents the current date within a collection of dates."
- `time`: "Represents the current time within a set of times."
- `true`: "Represents the current item within a set."
- `false` (default): "Does not represent the current item within a set."

## Why it matters for ORIVILO

ORIVILO's Card sets `aria-current="true"` for a selected card and the spec sheet sets `"page"` on a nav sample; the value names which one is meant. "One element in a set" bears on a parent and child both lit (K-0208): the spec states the rule per set, and whether a nested list is its own set is not stated in the text read.
