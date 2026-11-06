---
id: K-0187
topic: design
claim: Untitled UI's Avatar renders one indicator at a time, in the order status, verified, count, badge; its status dot is a bottom-right span, green for online and neutral gray for offline, that differs only by colour class and carries no text, role or aria attribute.
source: "https://www.untitledui.com/react/components/avatars.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/base-components/avatar-online-indicator.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/base-components/verified-tick.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/base-components/avatar-count.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

### The page

> "Only one indicator renders at a time, picked in the order `status`, `verified`, `count`, `badge`,"
> "so setting `status` hides the other three."
> "It renders a dot in the bottom-right corner, green for `"online"` and neutral gray for"
> "`"offline"`, sized to match the avatar."
> "The `badge` prop accepts a React node and will be displayed in the top-right corner of the avatar."

The page says nothing on where a status value comes from or how it stays current.

### The dot (`avatar-online-indicator.tsx`)

```text
"absolute right-0 bottom-0 flex justify-center rounded-full ring-[1.5px] ring-bg-primary",
status === "online" ? "bg-fg-success-secondary" : "bg-utility-neutral-300",
```

- Sizes: `xs` `size-1.5`, `sm` `size-2`, `md` `size-2.5`, `lg` `size-3`, `xl` `size-3.5`, `2xl` `size-4`, `3xl` `size-4.5`, `4xl` `size-5`.
- No `aria-*`, no `role`, no sr-only text. The two statuses differ by the background class only.

### The other indicators

- Verified tick: an `svg` with `text-utility-blue-500`, at `absolute right-0 bottom-0`, no `aria-*`, `role` or `title` element. Its doc comment is "Display a verified tick icon."
- Count: `<AvatarCount count={count} />`, a `size-3.5` circle with `bg-fg-error-primary` at the bottom right; the value prints as given with no cap, and there is no `aria-*` or `role`.
- Badge: the doc comment is "Display a badge (i.e. company logo)."; the example passes `<AvatarCompanyIcon src="/logos/images/Layers.jpg" alt="Layers Inc." size="md" />`. `AvatarCompanyIcon`'s source was not read.

## Why it matters for ORIVILO

Audit D.3 row 21 says no status dot without data. This records what Untitled UI's dot is, so the row can state what it leaves out.
