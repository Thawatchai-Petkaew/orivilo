---
id: K-0211
topic: design
claim: Untitled UI's SectionHeader has five parts (Root with a bottom divider, Group, Heading, Subheading, Actions) and six examples (own count of the page's list); Heading renders an h2 and Subheading a p, Group stacks until the md breakpoint, tabs are a second child of Root, and a separate SectionLabel adds tooltip, required marker and size sm or md.
source: "https://www.untitledui.com/react/components/section-headers.md; https://github.com/untitleduico/react/tree/main/components/application"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The API reference is a placeholder (`<ApiReference slug="section-headers" />`), so the props table was not read. The source was not read: no `section-headers` folder shows in the truncated listing of `components/application`.

> `SectionHeader` exposes five parts: `SectionHeader.Root` (the container with the bottom divider), `SectionHeader.Group`...

> A typical header nests `Heading` and `Subheading` on the left of a `Group` and `Actions` on the right.

> Render the tabs as a second child of `SectionHeader.Root`, directly after `SectionHeader.Group`.

> `SectionHeader.Group` is `flex-col` by default and switches to `flex-row` at the `md` breakpoint, so the title block...

> `SectionHeader.Group` is also `relative`, which lets you absolutely position an overflow menu in the top-right corner...

> `SectionHeader.Heading` renders an `h2` styled `text-md font-semibold text-primary`, and `SectionHeader.Subheading`...

- Examples: buttons, search input, button group, and each of the three with tabs, so six (own count of the page's list).
- `SectionHeader.Root` is a vertical flex with `gap-5` and `border-b border-secondary`. `SectionHeader.Subheading` is a `p`, `text-sm text-tertiary`.
- For another heading level the page says to use your own element with the same classes.
- `SectionLabel.Root` takes `title`, `description`, `tooltip`, `tooltipDescription`, `isRequired` and `size` (`"sm"` or `"md"`, default `"sm"`). `SectionLabel.Actions` holds buttons under it.
- Both parts forward standard props, so `id` and `ref` pass through. Every `SectionHeader` part accepts `className`.
- No state is documented, and no dropdown or divider slot. The only accessibility line is that the headers are built with React Aria and Tailwind CSS.

## Why it matters for ORIVILO

An h2 by default sits under a Page header h1, and the heading level is the author's job to change. K-0231 is the rule that level has to meet.
