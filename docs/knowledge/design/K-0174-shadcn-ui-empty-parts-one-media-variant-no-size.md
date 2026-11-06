---
id: K-0174
topic: design
claim: shadcn/ui's Empty page gives six parts (Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent), one variant prop on EmptyMedia (default or icon) and className on the rest; outline and background are utility classes, EmptyContent takes a button, input or link, and the tool found no size, role, aria, heading, loading or live on the page.
source: "https://ui.shadcn.com/docs/components/radix/empty; https://ui.shadcn.com/docs/components/empty"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.8: one project's page, read at both URLs; nothing was rendered. The page links Base UI and React Aria versions, which were not read.

> Use the Empty component to display an empty state.
> The main component of the empty state. Wraps the `EmptyHeader` and `EmptyContent` components.
> The `EmptyHeader` component wraps the empty media, title, and description.
> Use the `EmptyMedia` component to display the media of the empty state such as an icon or an image.
> Use the `EmptyContent` component to display the content of the empty state such as a button, input or a link.

API row: `variant`, `"default" | "icon"`, default `default`. The other parts take `className`.

> Use the `border` utility class to create an outline empty state.
> Use the `bg-*` and `bg-gradient-*` utilities to add a background to the empty state.

Asked for them by name, the tool reported that the page does not mention size, role, aria, heading, loading or live.

The example titles and actions, as the tool listed them:

- First example: "You haven't created any projects yet. Get started by creating your first project.", buttons Create Project and Import Project, a Learn More link.
- Outline: "Cloud Storage Empty", button Upload Files.
- Background: "No Notifications", button Refresh.
- Avatar: "User Offline", button Leave Message.
- Avatar Group: "No Team Members", button Invite Members.
- InputGroup: "404 - Not Found", a search input and a "Need help? Contact support" line.
- RTL: an Arabic version of the first example.

The usage sample reads `<EmptyTitle>No data</EmptyTitle>`, `<EmptyDescription>No data found</EmptyDescription>` and a `<Button>Add data</Button>` inside `EmptyContent`.

## Why it matters for ORIVILO

The rule in `.claude/rules/design-system.md` asks for a shadcn/ui row. shadcn gives the same four roles as Untitled UI (media, title, description, action) with no size ladder, and it leaves accessibility unstated on this page; K-0175 reads the code.
