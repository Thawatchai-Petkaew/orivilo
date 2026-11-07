---
id: K-0116
topic: design
claim: WCAG 2.2 SC 2.3.3 Animation from Interactions is Level AAA and covers only motion animation triggered by a user's interaction, which must be possible to disable unless essential; animation the page starts by itself falls under 2.2.2 instead, and technique C39 meets 2.3.3 with a prefers-reduced-motion media query, tested by checking that the motion is essential or suppressed.
source: "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html; https://www.w3.org/WAI/WCAG22/Techniques/css/C39; packages/design-system/src/recipes/recipes.css"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: W3C Understanding and Techniques pages, one publisher.

### Understanding 2.3.3

> Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed.
> "Animation from interactions" applies when a user’s interaction initiates non-essential animation.
> In contrast, 2.2.2 Pause, Stop, Hide applies when the web page initiates animation "automatically" that is not in response to an intentional user activation.

The heading reads "Animation from Interactions (Level AAA)". The page names C39 and SCR40 as techniques and does not mention loading spinners.

### Technique C39

> This technique applies to CSS which causes motion that is triggered by user interactions.

```text
@media (prefers-reduced-motion: reduce) {
  /* CSS to disable motion goes here */
}
```

Test procedure, for each element that triggers motion: "Enable the reduced motion setting in your system;", "Check that the motion animation is essential;", "Check that the motion animation is suppressed." Expected result: "#2 or #3 is true."

## Why it matters for ORIVILO

A spinner that appears after a click is motion started by an interaction, by our reading; 2.3.3 then lets it keep turning only if it is essential. The repo's `.ds-spin` comment already classes the spinner as essential motion (`packages/design-system/src/recipes/recipes.css`); whether that holds is for the designer.
