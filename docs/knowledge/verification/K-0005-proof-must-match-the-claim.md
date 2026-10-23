---
id: K-0005
topic: verification
claim: A check counts only when its kind matches the claim; for anything visual that means computed style on the rendered element or a screenshot someone looked at, never a grep of the class name.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/skills/atlas/references/tiered-routing.md:30-38 (also acceptance.md:73-80)"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81, ORV-80]
license: internal
---

## Evidence

> | The edit changes                                | The check is                                                              | Not a check                 |
> | ----------------------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
> | a style: colour, token, spacing, weight, radius | `getComputedStyle` on the rendered element, or a screenshot you looked at | grepping the new class name |
> | layout or responsive behaviour                  | a render at the affected widths (375 / 768 / 1280), measured              | `tsc`                       |
> | ...                                             | ...                                                                       | ...                         |
> | copy                                            | the rendered text on the page                                             | grepping the source         |

## Why it matters for ORIVILO

Our G3 passed an off-centre Checkbox and overlapping story menus because no one looked at the render ([[L-0001-g3-passed-visual-defects]]). The rule recurred four times in Allkons before it was written down (acceptance.md: "recur ×4"), but this entry rests on one source, so confidence stays at 0.8.
