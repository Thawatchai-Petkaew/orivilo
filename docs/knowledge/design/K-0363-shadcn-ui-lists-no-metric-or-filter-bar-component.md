---
id: K-0363
topic: design
claim: shadcn/ui's component list (66 names, own count of the list returned) has no Metric, Stat, Filter or Filter bar; its nearest named pages are Data Table, whose Filtering section adds a search input, and Chart.
source: "https://ui.shadcn.com/docs/components; https://ui.shadcn.com/docs/components/radix/data-table; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.75: an absence, read from one list; the shadcn blocks pages were not read.

The list returned under "All Components" holds 66 names (own count). Asked for each word, the fetch tool answered: Accordion yes, Collapsible yes, Separator yes, Metric no, Stat no, Filter no, Filter bar no.

Data Table page:

> Powerful table and datagrids built using TanStack Table.

Its "Filtering" heading opens:

> Let's add a search input to filter emails in our table.

## Why it matters for ORIVILO

The benchmark's shadcn/ui rows for Metric and Filters record this absence and are not filled from a nearest page. The audit says the same (`docs/specs/ORV-64/audit.md`, lines 102 and 103).
