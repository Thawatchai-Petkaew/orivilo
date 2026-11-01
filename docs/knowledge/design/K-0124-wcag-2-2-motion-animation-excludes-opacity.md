---
id: K-0124
topic: design
claim: WCAG 2.2 defines motion animation for SC 2.3.3 (AAA) as steps between conditions that give an illusion of movement or a smooth transition, and leaves out changes of colour, blurring or opacity that do not change perceived size, shape or position; C39 meets 2.3.3 by suppressing such motion under prefers-reduced-motion unless it is essential.
source: "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html; https://www.w3.org/WAI/WCAG22/Techniques/css/C39"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-203]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: W3C Understanding and Techniques pages, one publisher. K-0116 records the same SC and technique for spinners; this entry adds the definition of motion animation.

### Understanding 2.3.3

> Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed.

Heading: "Animation from Interactions (Level AAA)". Definition of motion animation:

> addition of steps between conditions to create the illusion of movement or to give a sense of a smooth transition.
> Motion animation does not include changes of color, blurring, or opacity which do not change the perceived size, shape, or position of the element.

Essential: "if removed, would fundamentally change the information or functionality of the content, and" the information and functionality cannot be achieved another way that conforms. An example the page accepts: "The transition is a page-flipping animation that respects the `prefers-reduced-motion` CSS media query."

### Technique C39

> This technique applies to CSS which causes motion that is triggered by user interactions.

Test: "Enable the reduced motion setting in your system;", "Check that the motion animation is essential;", "Check that the motion animation is suppressed." Expected result: "#2 or #3 is true."

## Why it matters for ORIVILO

A panel that grows from 0 to its height on a click changes perceived size, so by our reading it is motion animation under 2.3.3; an opacity-only fade is not. The page does not speak of collapsibles; the reading is ours.
