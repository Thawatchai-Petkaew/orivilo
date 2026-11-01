---
id: K-0110
topic: design
claim: shadcn/ui's Spinner is one lucide icon with role="status", aria-label="Loading" and the classes size-4 animate-spin, taking className and every svg prop; it has no variant, size or label prop (size is a size-* class), the page sets it inside Button and Badge through data-icon="inline-start" or "inline-end", and neither the page nor the code has a reduced-motion rule.
source: "https://ui.shadcn.com/docs/components/spinner; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/spinner.tsx"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: MIT
---

## Evidence

Read on 2026-11-01 through a fetch tool, `main` branch of `shadcn-ui/ui` (no commit hash shown). Confidence 0.8: one project, its page and its registry file agree on the attributes; nothing was rendered.

### The page

> An indicator that can be used to show a loading state.
> You can replace the default spinner icon with any other icon by editing the `Spinner` component.
> Use the `size-*` utility class to change the size of the spinner.

The source shown on the page:

```tsx
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
...
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
```

The page shows a spinner before or after a Button or Badge label with `data-icon="inline-start"` or `data-icon="inline-end"`, an Input group example ("Validating..."), and an Empty example ("Processing your request", with a Cancel button). It has no API reference section, no accessibility section and no colour example; reduced motion is not mentioned.

### The registry file (`new-york-v4/ui/spinner.tsx`)

The fetch tool summarised the file as rendering lucide-react's `Loader2Icon` with `role="status"`, `aria-label="Loading"` and `size-4 animate-spin` merged with `className`, other props forwarded. The icon name differs from the page's `LoaderIcon`; the attributes and classes match.

### Claims that did not re-check

- Whether `Loader2Icon` or `LoaderIcon` is the current default: the page and the registry file read differ, and no other first-party page was searched beyond these two.

## Why it matters for ORIVILO

ORV-201 benchmarks a shared spinner against shadcn/ui. shadcn puts the live region role and a fixed English name on the graphic itself, with no per-use label, which is the opposite of Untitled UI's silent spinner (K-0108).
