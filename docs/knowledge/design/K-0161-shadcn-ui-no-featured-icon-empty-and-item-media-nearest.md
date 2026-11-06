---
id: K-0161
topic: design
claim: shadcn/ui's component index, 66 names by the fetch tool's count, has no featured icon, and the nearest pieces read are `EmptyMedia` with variant `icon`, `ItemMedia` with variant `icon` and the alert dialog's media tile, none of which takes a status colour in the classes or props read.
source: "https://ui.shadcn.com/docs/components; https://ui.shadcn.com/docs/components/radix/empty; https://ui.shadcn.com/docs/components/radix/item; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-nova.css; docs/specs/ORV-64/audit.md; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-222]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. Confidence 0.75: an absence on an index page, plus two API rows and one stylesheet. The 66 is the count the tool stated for the "All Components" index of `https://ui.shadcn.com/docs/components`, and its numbered list runs to 66; `docs/specs/ORV-64/audit.md` line 10 records 66 names from that page on 2026-10-23. Featured Icon, Icon and Icon Tile are not on the list.

> Use the `EmptyMedia` component to display the media of the empty state such as an icon or an image.

> Use `ItemMedia` to display media content such as icons, images, or avatars.

- `EmptyMedia`: `variant` is `"default" | "icon"`, default `default`.
- `ItemMedia`: `variant` is `"default" | "icon" | "image"`, default `default`. The page's Avatar section also writes `variant="avatar"`, which the API table does not list.
- `style-nova.css`, as the tool described it: `.cn-empty-media-icon` has a muted background and foreground, a size-8 square that does not shrink, rounded corners and an svg at size-4. Its exact text was not copied.
- `style-nova.css`, copied: `.cn-item-media-variant-icon` sets only `[&_svg:not([class*='size-'])]:size-4`; `.cn-alert-dialog-media` is `bg-muted mb-2 inline-flex size-10 items-center justify-center rounded-md`, with its svg at `size-6`.

## Why it matters for ORIVILO

The rule in `.claude/rules/design-system.md` asks for a shadcn/ui row. For FeaturedIcon that row is an absence, with these media slots as the nearest pieces. The two that draw a tile are muted, so neither shows a status colour to compare with.
