---
id: K-0108
topic: design
claim: Untitled UI's loading indicator takes only type (line-simple, line-spinner, dot-circle; default line-simple), size (sm 32, md 48, lg 56, xl 64 px; default sm) and an optional label under the spinner, draws in the brand foreground token with Tailwind animate-spin, and by its own FAQ is not announced to screen readers (no role, no live region); the code read has no aria attribute and no reduced-motion rule.
source: "https://www.untitledui.com/react/components/loading-indicators.md; https://raw.githubusercontent.com/untitleduico/react/main/components/application/loading-indicator/loading-indicator.tsx; https://www.untitledui.com/react/components (read through https://r.jina.ai/)"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool, `main` branch of `untitleduico/react` (no commit hash shown). Confidence 0.8: one publisher, its page and its code agree; nothing was rendered. The page's API reference table is a placeholder in the `.md` text (`<ApiReference slug="loading-indicators" />`), so the props come from the FAQ and the code.

### The page (`loading-indicators.md`)

> Four sizes, set with the size prop: "sm" renders a 32px spinner, "md" 48px, "lg" 56px, and "xl" 64px.
> The default is "sm".
> It renders directly beneath the spinner in text-secondary, centered
> No [-] the component only accepts type, size and label.
> There is no color prop.
> All three types draw with the brand foreground token.

On announcing:

> Not by default.
> The spinners are plain decorative `<svg>` elements with no role or live region, and the optional label is rendered as ordinary text.
> If the loading state needs to be announced, put the indicator inside a container with role="status"

The page names the three types `line-simple` ("a solid arc over a muted track"), `line-spinner` ("a solid arc with no track") and `dot-circle` ("a dotted ring with a gradient fade"), default `line-simple`, and the install command `npx untitledui@latest add loading-indicator`. The components index lists it as "Loading indicators 3 components". Reduced motion is not mentioned on the page.

### The code (`loading-indicator.tsx`)

```text
interface LoadingIndicatorProps {
cx("flex flex-col items-center justify-center", styles[size].root)
cx("animate-spin", styles[size].spinner)
cx("animate-spin text-fg-brand-primary", styles[size].spinner)
```

Styles map, as read: sm root `gap-4`, label `text-sm font-medium`, spinner `size-8`; md `gap-4`, `text-sm font-medium`, `size-12`; lg `gap-4`, `text-lg font-medium`, `size-14`; xl `gap-5`, `text-lg font-medium`, `size-16`. The fetch tool found no `role`, `aria-*`, `motion-reduce` or `prefers-reduced-motion` in the file. Tailwind's `animate-spin` itself carries no reduced-motion rule (K-0112).

## Why it matters for ORIVILO

ORV-201 benchmarks a shared spinner against Untitled UI. Its spinner is a decorative graphic with a size ladder and an optional visible label; the announcement and the reduced-motion behaviour are left to the caller.
