---
id: K-0172
topic: design
claim: Untitled UI's EmptyState.Title renders an h1, Content a main, Header a header and Footer a footer; its page says the h1 and main suit a full-page empty state and duplicate both inside a page that has them, and gives two prop overrides; the avatar decorations are aria-hidden, the AvatarGrid marquee stops under reduced motion, and the tool found no aria-live, aria-busy, role status or the word loading in the file.
source: "https://www.untitledui.com/react/components/empty-states.md (read through https://r.jina.ai/); https://raw.githubusercontent.com/untitleduico/react/main/components/application/empty-state/empty-state.tsx; https://api.github.com/repos/untitleduico/react/contents/components/application/empty-state"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-223]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, `main` branch of `untitleduico/react` (no commit hash shown). Confidence 0.8: one publisher, its page and its code agree; nothing was rendered. The `empty-state` folder holds one file, `empty-state.tsx`.

### The page, under Accessibility

> Yes. `EmptyState.Title` renders an `<h1>` and `EmptyState.Content` renders a `<main>`,
> which suits a full-page empty state but duplicates both inside a page that already has them.
> Both spread your props onto the element, so `<EmptyState.Title role="heading" aria-level={2}>` demotes the heading
> and `<EmptyState.Content role="presentation">` drops the landmark.
> The avatar decorations are `aria-hidden`, so keep the meaningful copy in the title and description.

### The page, under Reduced motion

> Yes. The marquee rows in `EmptyState.AvatarGrid` are marked `motion-reduce:animate-none`,
> so the animation stops for users who have the reduced-motion preference enabled while the layout stays intact.

### The code (`empty-state.tsx`)

```text
<h1
<main
<header
return <footer {...props} className={cx("z-10 flex gap-3", props.className)} />;
size?: "sm" | "md" | "lg";
role="img"
```

As the tool summarised the file: Description renders a `p`, the root a `div`, and `AvatarRadius`, `AvatarRow` and `AvatarGrid` are each a `div` with `aria-hidden="true"`. `role="img"` is on Illustration. Asked for them by name, the tool found none of `aria-live`, `aria-busy`, `role="status"` or `loading` in the file.

## Why it matters for ORIVILO

An empty region inside the Studio shell sits on a page that already has its heading and `main`, which is the case the page warns about. The component announces nothing itself, so a region that turns empty after an action gets no status from it.
