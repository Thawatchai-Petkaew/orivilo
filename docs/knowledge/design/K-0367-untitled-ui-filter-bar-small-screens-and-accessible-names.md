---
id: K-0367
topic: design
claim: Untitled UI's Filter bars page handles small screens by hiding or swapping controls with Tailwind classes (max-md:hidden on DateRangePicker, an icon-only Filters button below md, short labels such as 7d), names the icon button only through its required label, gives search aria-label Search, and says the shortcut prop registers no keyboard shortcut.
source: "https://www.untitledui.com/react/components/filter-bars.md; .claude/rules/design-system.md; AGENTS.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one page, quoted from its FAQ; no code read (K-0368).

> The examples hide or swap controls with Tailwind breakpoint classes:
> the `DateRangePicker` gets `max-md:hidden`, an icon-only Filters button replaces the labeled one below `md`,
> and the period buttons switch to short labels such as `7d`.
> Use the same approach for your own controls.

> The button has no visible text, so `label` is its only accessible name.

> The examples use `Input` with `icon={SearchLg}`, `size="sm"`, `aria-label="Search"` and `placeholder="Search"`.

> doesn't register a keyboard shortcut, so add your own handler if you need one.

The word search found no other accessibility or keyboard text, and no size other than the search input's `sm`.

## Why it matters for ORIVILO

ORIVILO stories render at 360 px and every string comes from the locale catalog (`.claude/rules/design-system.md`, AGENTS.md), so how a filter survives a narrow width and how `7d` reads in Thai are open for the designer.
