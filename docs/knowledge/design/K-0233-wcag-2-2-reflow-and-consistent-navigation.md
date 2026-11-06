---
id: K-0233
topic: design
claim: WCAG 2.2 SC 1.4.10 Reflow (AA) wants content without two-dimensional scrolling at 320 CSS pixels, and its example puts main navigation behind a hamburger button at that width; SC 3.2.3 Consistent Navigation (AA) wants repeated navigation in the same relative order, and items inserted or removed, as in expanding menus, do not break that order.
source: "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html; https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

SC 1.4.10, Reflow (Level AA):

> Content can be presented without loss of information or functionality

> Vertical scrolling content at a width equivalent to 320

> 320 CSS pixels is equivalent to a starting viewport width of 1280 CSS pixels wide at 400% zoom.

In the Examples section the navigation first hides options behind a "More" dropdown as zoom grows, then:

> most navigation options are eventually behind a "hamburger" menu button.

> The main navigation is hidden behind a hamburger menu button.

SC 3.2.3, Consistent Navigation (Level AA):

> Navigational mechanisms that are repeated on multiple web pages within a set of web pages

> occur in the same relative order each time they are repeated, unless a change is initiated by the user.

> Items are considered to be in the same relative order even if other items are inserted or removed from the original order.

> For example, expanding navigation menus may insert an additional level of detail

The page does not discuss responsive layouts or hidden menus.

## Why it matters for ORIVILO

Stories render at 360 px (`.claude/rules/design-system.md`); SC 1.4.10's width is 320. A drawer below a breakpoint, as both libraries do, is the form the Reflow example itself shows, and the drawer's item order is what SC 3.2.3 reads.
