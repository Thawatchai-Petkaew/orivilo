---
id: K-0359
topic: design
claim: Untitled UI's Metrics page says the metrics file exports nine cards, MetricsSimple, MetricsIcon01 to 04 and MetricsChart01 to 04, plus a MetricChangeIndicator, and shows 18 examples (own count), each card with an actions form; icon cards pair a FeaturedIcon with the value and chart cards embed a small Recharts area chart.
source: "https://www.untitledui.com/react/components; https://www.untitledui.com/react/components/metrics.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted; the demo code is not in the page text (`ComponentCode` tags name `metrics/MetricsSimpleDemo` and others), and the API reference is a placeholder (`<ApiReference slug="metrics" />`).

Install: `npx untitledui@latest add metrics`, or copy from `application/metrics`.

> The metrics file exports nine cards: `MetricsSimple`

> The icon cards pair a `FeaturedIcon` with the value,

> the chart cards embed a small Recharts area chart alongside it.

Examples, counted in the list the page returned (18, own count): Simple, Simple actions; Icon 01 to 04 and Icon actions 01 to 04; Chart 01 to 04 and Chart actions 01 to 04.

The index links "Metrics" under Application UI at `https://www.untitledui.com/react/components/metrics`, and a separate "Metrics sections" at `https://www.untitledui.com/react/marketing/metrics-sections`, which was not read (audit line 131 skips marketing sections).

## Why it matters for ORIVILO

The audit says Metric has no shadcn peer and an Untitled page (`docs/specs/ORV-64/audit.md`, line 102); this is that page. The title and value props of a card were not read, since the page's FAQ does not name them.
