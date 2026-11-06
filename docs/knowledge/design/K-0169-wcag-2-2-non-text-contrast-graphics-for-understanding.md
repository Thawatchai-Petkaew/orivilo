---
id: K-0169
topic: design
claim: WCAG 2.2 SC 1.4.11 Non-text Contrast (Level AA) asks for 3:1 against adjacent colours for parts of graphics required to understand the content; the Understanding page lists four cases that need not meet it, gives status icons "without associated text" as a 3:1 example, keeps a down-arrow beside the word Menu at 3:1, and has no sentence saying an icon paired with text is exempt.
source: "https://www.w3.org/TR/WCAG22/; https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, joined below with `...` where a break fell. Confidence 0.8: the W3C Recommendation and its Understanding document.

> The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s):

> Parts of graphics required to understand the content, ... except when a particular presentation of graphics is essential to the information being conveyed.

Section "Required for understanding":

> The term "required for understanding" is used in the success criterion as many graphics do not need to meet ... the contrast requirements.

The four cases:

1. "A graphic with text embedded or overlaid conveys the same information, such as labels and values on a chart."
2. "The graphic is for aesthetic purposes that does not require the user to see or understand it to understand the content or use the functionality."
3. "The information is available in another form, such as in a table that follows the graph, which becomes visible when a "Long Description" button is pressed."
4. "The graphic's presentation falls under the essential exception."

Icons on the page:

> The term 'graphical object' applies to stand-alone icons such as a print icon (with no text)

> For simple graphics such as single-color icons the entire image is a graphical object.

> Status icons on an application's dashboard (without associated text) have a 3:1 minimum contrast ratio.

In the Dropdown indicator examples the arrow sits next to the word Menu and still counts: "The down-arrow is required to understand that there is drop-down functionality". The tool searched the page for "icon" and found no sentence saying an icon paired with text is exempt.

## Why it matters for ORIVILO

A status icon inside a featured icon tile sits beside a title that says the same thing, which the "without associated text" example leaves open and the four cases do not name; any exemption is our reading only. The repo holds UI pairs to 3.0 regardless (`.claude/rules/design-system.md`), so the icon's ink on its tile can be held to that floor without settling the question.
