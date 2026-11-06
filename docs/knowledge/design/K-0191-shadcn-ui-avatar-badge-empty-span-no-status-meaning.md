---
id: K-0191
topic: design
claim: shadcn/ui's AvatarBadge is a bottom-right span with no text or status prop; the docs use it as a green dot only through the caller's className, and the page never uses the words status or online.
source: "https://ui.shadcn.com/docs/components/radix/avatar; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/avatar.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/examples/radix/avatar-badge.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-224]
license: MIT
---

## Evidence

> "Use the `AvatarBadge` component to add a badge to the avatar."
> "You can also use an icon inside `<AvatarBadge>`."

```text
<AvatarBadge className="bg-green-600 dark:bg-green-800" />
```

### Registry classes

```text
"absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full"
"bg-primary text-primary-foreground ring-2 ring-background select-none"
"group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden"
"group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2"
"group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2"
```

- It takes `className` and the spread `span` props; no other prop. It renders no text or label of its own.
- An icon child is hidden at `sm`.
- The word check on the Radix docs page found "status" 0 times and "online" 0 times.

Own reading: the badge states no meaning. A green badge has the meaning a reader guesses, with no text alternative in the sample.

## Why it matters for ORIVILO

The sample shows a free colour class on a dot, which audit B.3 lists under Do not copy for Select. The rule's reach to an Avatar is for the designer to state.
