---
id: K-0171
topic: design
claim: Untitled UI's EmptyState root takes size sm, md or lg (default lg) and, in the file read, no variant or state prop; the page names Header, Content, Title, Description and Footer plus six header visuals, Footer holds the action buttons in a row, and the six demos on the rendered page each show two buttons, five of them after a search miss (own count).
source: "https://www.untitledui.com/react/components/empty-states.md; https://www.untitledui.com/react/components/empty-states (read through https://r.jina.ai/); https://raw.githubusercontent.com/untitleduico/react/main/components/application/empty-state/empty-state.tsx; https://www.untitledui.com/react/components (read through https://r.jina.ai/)"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, `main` branch of `untitleduico/react` (no commit hash shown). Confidence 0.8: one publisher, its page and its code agree; nothing was rendered by us. The page's API table is a placeholder in the `.md` text (`<ApiReference slug="empty-states" />`) and was not read.

### Size

> The `size` prop on the `EmptyState` root accepts `"sm"`, `"md"` and `"lg"` and defaults to `"lg"`.
> It flows through context to the title, description, spacing, `EmptyState.Illustration`,
> `EmptyState.AvatarRow` and `EmptyState.AvatarGrid`.
> `EmptyState.FeaturedIcon` renders at `"xl"` under a `"lg"` root and `"lg"` otherwise unless you set its own `size`,
> while `EmptyState.Illustration` only honors its own `size` when the root is `"lg"`.

The code, as the tool summarised it:

- Root: `mx-auto flex w-full max-w-lg flex-col items-center justify-center`; props are the `div` props plus `size`.
- Title: `text-md font-semibold text-primary`; `text-lg` at md; `text-xl` at lg.
- Description: `text-center text-sm text-tertiary`; `text-md` at lg.
- Content: `mb-6`, `gap-1`, `max-w-88`; `mb-8 gap-2` at md and lg.
- Header: `relative mb-4`; `mb-5` at md and lg.

### Parts and visuals

> Nest the parts inside `EmptyState`
> `EmptyState.Footer` holds your action buttons in a row.

As the tool listed them from the page:

- `Header` holds the visual. Its `pattern` is `circle` (default), `square`, `grid`, `grid-check` or `none`; its `patternSize` is `sm`, `md` (default) or `lg`.
- `Content` wraps `Title` and `Description`. Every part takes a `className`.
- `FeaturedIcon`: defaults to the `SearchLg` icon, `color="gray"`, `theme="modern"`.
- `Illustration`: `type` is `cloud` (default), `box`, `documents` or `credit-card`.
- `FileTypeIcon`: `type` such as `folder` (default); `theme` is `solid` (default), `default` or `gray`.
- `AvatarRadius`, `AvatarRow`, `AvatarGrid`: each takes an `avatars` array of `{ src, alt? }`.

### Demos

The `.md` page lists six examples: Featured icon, Illustration, File icon, Avatar radius, Avatar row, Avatar grid. Their text, read from the rendered page:

- Featured icon, Illustration, File icon: "No projects found", "Your search "Landing page design" did not match any projects. Please try again.", buttons "Clear search" and "New project".
- Avatar radius: "No users found", "Your search did not match any users.", buttons "Clear search" and "Add user".
- Avatar row: "Invite your first user", "Add your team members and external users.", buttons "Create link" and "Add user".
- Avatar grid: "Sorry, no results!", "We couldn't find any apps or commands. Please try again or browse all apps.", with "browse all apps" as a link, buttons "Clear search" and "Integration".

Own count from that list: five of the six are a search miss, one is a first use.

### Open point

The components index lists "Empty states" as "3 components"; the page lists six examples. Neither page says how the two numbers relate.

## Why it matters for ORIVILO

The rule in `.claude/rules/design-system.md` asks for an Untitled UI row of variants, sizes, states and slots before a new component. Untitled sets the look through which visual goes in the Header, not through a variant, and its size is the one root prop.
