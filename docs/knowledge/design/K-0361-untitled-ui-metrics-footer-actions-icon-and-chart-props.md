---
id: K-0361
topic: design
claim: On Untitled UI's Metrics page every card takes a footer React node (a divider and right-aligned row, hidden when left out) and className; actions false hides the dots dropdown on MetricsIcon03, MetricsIcon04 and MetricsChart01 only; icon sets the icon on three cards; chartData, chartColor, chartAreaFill and chartCurveType feed the chart cards.
source: "https://www.untitledui.com/react/components/metrics.md; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ; the API table is a placeholder.

> Every metric card accepts a `footer` prop that takes any React node.

> the card renders a divider and a right-aligned footer row

> Omit `footer` or pass `null` to render the card without one.

> Set `actions={false}`. That prop is available on `MetricsIcon03`, `MetricsIcon04` and `MetricsChart01`;

> where `highlight: true` renders the emphasized dot on that point.

> plus `chartColor`, `chartAreaFill` and `chartCurveType` (a Recharts `CurveType`)

As the fetch tool gave them: the other cards always show the dots dropdown, and the page does not list its items; `icon` is on `MetricsIcon03`, `MetricsIcon04` and `MetricsChart02`, while `MetricsIcon01` and `MetricsIcon02` use fixed icons; `MetricsChart01` takes `chartData` of `{ value: number; highlight?: boolean }`, and `MetricsChart03` and `MetricsChart04` take `{ value: number }`; footer examples use `Button` with `color="link-color"` and `size="sm"`.

## Why it matters for ORIVILO

These are the slots read: footer, actions, icon and chart. The name of the dots button is not given on the page, so it cannot be said here whether it meets the icon-only rule in `.claude/rules/design-system.md`.
