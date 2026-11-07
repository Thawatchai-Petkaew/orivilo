---
id: K-0097
topic: design
claim: In shadcn/ui (new-york-v4 registry) the title is set semibold or medium in the inherited foreground colour and the description text-sm in text-muted-foreground, with a gap of 2 px in Alert and 8 px in Card and Dialog headers (own arithmetic); the Alert description paragraphs take leading-relaxed (1.625), and Sonner, which the shadcn toast wraps without text classes, styles a 13 px toast with a 500 title on 1.5, a 400 description on 1.4 and a 2 px gap.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/alert.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/card.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/dialog.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sonner.tsx; https://raw.githubusercontent.com/emilkowalski/sonner/main/src/styles.css; https://tailwindcss.com/docs/theme; https://tailwindcss.com/docs/font-size; https://tailwindcss.com/docs/line-height; https://tailwindcss.com/docs/gap"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: MIT
---

## Evidence

Read on the `main` branch of `shadcn-ui/ui` and `emilkowalski/sonner` on 2026-10-31 (no commit hash shown). Confidence 0.8: one project's code, quoted through a fetch tool, not rendered.

### Alert (`alert.tsx`)

- Root: `"rounded-lg border px-4 py-3 text-sm"`, `"grid w-full grid-cols-[0_1fr] items-start gap-y-0.5"`, `"has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3"` (segments of one class string).
- AlertTitle: `"col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight"`
- AlertDescription: `"col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed"`

So title and description share 14 px (the root's text-sm); the steps are weight (medium, 500) and colour (muted-foreground); the row gap is 2 px (`gap-y-0.5`, by our arithmetic).

### Card (`card.tsx`)

- CardHeader: `"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6"`
- CardTitle: `"leading-none font-semibold"`
- CardDescription: `"text-sm text-muted-foreground"`

CardTitle sets no size, so it takes the size it inherits; the description is 14 px; gap 8 px (by our arithmetic).

### Dialog (`dialog.tsx`)

- DialogHeader: `"flex flex-col gap-2 text-center sm:text-left"`
- DialogTitle: `"text-lg leading-none font-semibold"`
- DialogDescription: `"text-sm text-muted-foreground"`

So 18 px semibold over 14 px muted, 8 px gap (by our arithmetic).

### Toast (`sonner.tsx` and Sonner's `styles.css`)

shadcn's `sonner.tsx` sets only `className="toaster group"` on the Toaster, no class for title or description. Sonner's own CSS:

```text
[data-sonner-toast][data-styled='true'] [data-title] { font-weight: 500; line-height: 1.5; color: inherit; }
[data-sonner-toast][data-styled='true'] [data-description] { font-weight: 400; line-height: 1.4; color: #3f3f3f; }
[data-sonner-toast][data-styled='true'] [data-content] { display: flex; flex-direction: column; gap: 2px;
```

(Each rule joined onto one line here.) The toast rule sets `font-size: 13px;`.

### Tailwind values used above

Default theme: `--spacing: 0.25rem;`, `--text-sm: 0.875rem;`, `--text-sm--line-height: calc(1.25 / 0.875);`, `--text-lg: 1.125rem;`, `--leading-relaxed: 1.625;`, `--font-weight-medium: 500;`, `--font-weight-semibold: 600;`. `leading-none` is `line-height: 1;`. `gap-y-<number>` is `row-gap: calc(var(--spacing) * <value>);`.

## Why it matters for ORIVILO

shadcn/ui is one of the two benchmarks for every ORIVILO component. Its compact components keep title and description at nearly one size and separate them by weight and a muted colour; the gap is 2 px in the alert and toast, 8 px in card and dialog headers.
