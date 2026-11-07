---
id: K-0360
topic: design
claim: On Untitled UI's Metrics page a card shows change through a change string plus a positive or negative direction that swaps the colours between the success and error tokens; the direction prop is trend on two cards and changeTrend on five (own count of the cards the page names), and MetricChangeIndicator has three type values, simple, trend and modern.
source: "https://www.untitledui.com/react/components/metrics.md; DESIGN.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ.

> `MetricsSimple` and `MetricsChart01` use a `trend` prop, while
> `MetricsIcon03`, `MetricsIcon04`, `MetricsChart02`, `MetricsChart03` and `MetricsChart04` use `changeTrend`.

> supports three `type` values: `"simple"` (a plain up or down arrow), `"trend"` (a trend line icon)

> (a diagonal arrow inside a bordered pill).

The last line is the `"modern"` value. Changing the direction "swaps the colors between the success and error tokens." The fetch tool reported `change` as a string such as `"100%"`, `type` on `MetricsSimple`, `MetricsChart03` and `MetricsChart04`, and chart cards defaulting to `"trend"`. Which props `MetricsIcon01`, `MetricsIcon02` and `MetricsChart01` take for `type` was not read beyond this.

## Why it matters for ORIVILO

The arrow gives the direction a shape as well as a colour, which is the kind of difference DESIGN.md section 7 asks for. The page does not say what happens when a rise is bad news, so good and bad stay tied to the direction prop's value.
