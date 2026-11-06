---
id: K-0188
topic: design
claim: Untitled UI's docs pass the person's name as alt even where the same name is the visible title beside the avatar; alt reaches only the img element, so it is not rendered when initials or an icon show, avatar.tsx has no aria or role attribute, and the page prose has no accessibility guidance beyond the add button's name and a focus ring set through a parent link.
source: "https://www.untitledui.com/react/components/avatars.md; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/avatar-label-group.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/avatar/base-components/avatar-add-button.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

### The name twice

The first `AvatarLabelGroup` example has these props:

```text
size="sm"
alt="Olivia Rhye"
title="Olivia Rhye"
subtitle="olivia@untitledui.com"
```

`avatar-label-group.tsx` renders `<Avatar border rounded={rounded} className={avatarClassName} {...props} />` and then `{title}` in a `<p>`, so `alt` goes to the `Avatar` through the spread. That file has no `alt` or `aria-*` attribute of its own.

### Where `alt` goes

The doc comment is "The alternative text for the avatar image." In `avatar.tsx` the identifier appears three times (the fetch's count): the interface, the destructured props, and `alt={alt}` on the `img`.

Own reading: when the image is absent or failed, no `img` renders and `alt` is not in the output. The Initials example (`<Avatar size="md" alt="Olivia Rhye" initials="OR" />`) and the Placeholder example (`<Avatar size="md" alt="Olivia Rhye" />`) pass `alt`, and in both only the initials or an icon reach the page. No `alt` is defaulted, so an `Avatar` with a `src` and no `alt` renders an `img` without the attribute.

### Attributes

- `avatar.tsx`: the fetch reports no `aria-*` and no `role`; only `data-avatar` and `data-avatar-img`. The initials `span`, the icon lines and the wrapper `div` carry no `aria-hidden`. Whether `User01` sets its own was not read (`@untitledui/icons`).
- `AvatarAddButton`: `<AriaTooltip title={title}>` and `aria-label={title}`.

### The page prose

"alt" appears only as a prop in code. "screen reader", "accessible", "accessibility", "decorative" do not occur. `aria-label` occurs in the add button sentence:

> "(default `"Add user"`) used for its tooltip and `aria-label`."

### Focus

> "Set `focusable` on the `Avatar` and add the `group` class to the link around it."
> "The ring is styled with `group-focus-visible`, so it only appears when that parent receives keyboard focus."

```text
focusable && "outline-transparent group-focus-visible:outline-2 group-focus-visible:outline-offset-2"
```

The `Avatar` itself takes no focus; `focusable` is a look for a parent link.

## Why it matters for ORIVILO

The question for ORV-224 is what a person's picture beside their visible name should say. This entry shows Untitled UI repeats the name in its samples and states no rule; K-0195 to K-0200 hold what the standards say.
