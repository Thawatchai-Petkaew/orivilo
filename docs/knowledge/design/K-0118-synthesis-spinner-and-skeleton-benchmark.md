---
id: K-0118
topic: design
claim: Across K-0108 to K-0117, Untitled UI has a silent spinner with three types, four sizes and a visible label and no skeleton in its index; shadcn/ui has a one-size spinner that carries role status and an English name on the icon, and a bare pulsing skeleton div; neither publisher's code read adds a reduced-motion rule; WAI-ARIA and WCAG 2.2 pair aria-busy (wait) with a polite status message (announce), put SC 2.3.3 at AAA for interaction-started motion and 2.2.2 at Level A for automatic motion past five seconds beside other content, each with an essential-motion exception.
source: "docs/knowledge/design/K-0108-untitled-ui-loading-indicator-types-sizes-and-no-announcement.md; docs/knowledge/design/K-0109-untitled-ui-react-lists-no-skeleton-component.md; docs/knowledge/design/K-0110-shadcn-ui-spinner-status-role-on-the-icon.md; docs/knowledge/design/K-0111-shadcn-ui-skeleton-pulse-div-without-aria.md; docs/knowledge/design/K-0112-tailwind-spin-and-pulse-ignore-reduced-motion-by-default.md; docs/knowledge/design/K-0113-wai-aria-1-2-aria-busy-defers-announcements.md; docs/knowledge/design/K-0114-wai-aria-1-2-role-status-is-a-polite-live-region.md; docs/knowledge/design/K-0115-wcag-2-2-status-messages-cover-the-waiting-state.md; docs/knowledge/design/K-0116-wcag-2-2-animation-from-interactions-and-c39.md; docs/knowledge/design/K-0117-wcag-2-2-pause-stop-hide-and-loading-animations.md; packages/design-system/src/components/button/Button.tsx; packages/design-system/src/components/table/Table.tsx; packages/design-system/src/components/dialog/Dialog.tsx; packages/design-system/src/components/sheet/Sheet.tsx; packages/design-system/src/components/canvas-board/CanvasBoard.tsx; .claude/rules/design-system.md; packages/design-system/src/components/icons.tsx; packages/design-system/src/recipes/recipes.css; packages/design-system/src/tokens/orivilo.css; packages/design-system/catalog/base/button.yaml"
retrieved: 2026-11-01
confidence: 0.75
applies_to: [ORV-201]
license: own-words
---

## Evidence

A synthesis of the entries in `source:` plus a read of the repo files listed there. Inputs are at 0.8 except K-0109 (0.75, an absence). The Ours row is what the code shows on 2026-11-01; the Add and Do not copy rows list options the sources raise, not decisions.

### Spinner

| Item        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untitled    | Types `line-simple` (default), `line-spinner`, `dot-circle`. Sizes sm 32, md 48, lg 56, xl 64 px (default sm). Slot: `label` under the spinner in text-secondary. No `className`, no `color` (brand foreground token). Not announced: no role, no live region; the FAQ says wrap it in `role="status"`. `animate-spin`, no reduced-motion rule (K-0108, K-0112).                                                                                                                                                                                                             |
| shadcn      | One lucide icon, `size-4 animate-spin`, size by a `size-*` class, no variant or label prop. `role="status"` and `aria-label="Loading"` on the svg itself. Placed in Button and Badge through `data-icon="inline-start"` or `"inline-end"`. No reduced-motion rule (K-0110, K-0112).                                                                                                                                                                                                                                                                                          |
| Ours        | No Spinner component or catalog entry. `SpinnerIcon` (lucide `LoaderCircle`, `icons.tsx`) with the shared `.ds-spin` rule, 1s linear infinite, commented as essential motion that keeps turning under reduced motion (`recipes.css`); the token file zeroes the feedback, overlay and page durations under reduced motion (`orivilo.css`). Button: spinner in the leading slot, `aria-hidden`, a `sr-only` `role="status"` span with `loadingLabel`, `aria-busy` and `aria-disabled` while loading. Table: `role="status"` with the spinner and visible `loadingLabel` text. |
| Add         | Options the sources raise: a size ladder (K-0108) rather than one size (K-0110); a visible label slot (K-0108); the status message outside the graphic so the label can be localised and announced politely (K-0114, K-0115); an explicit reduced-motion stance per K-0116 and K-0117, since the publishers' code has none (K-0112).                                                                                                                                                                                                                                         |
| Do not copy | shadcn's fixed English `aria-label="Loading"` on the icon: one name for every use and every locale, and a role on a graphic (K-0110, K-0114). Untitled's silent default: a waiting state with no status message falls short of SC 4.1.3 by our reading (K-0108, K-0115). Brand foreground as the only colour with no prop (K-0108): a reason for the colour token choice, not a value to copy.                                                                                                                                                                               |

### Skeleton

| Item        | Detail                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untitled    | None found: no index entry, no `components/base` folder, `skeletons.md` 404 (K-0109).                                                                                                                                                                                                                                                                            |
| shadcn      | One div, `data-slot="skeleton"`, `animate-pulse rounded-md bg-accent`; shape and size by `className` only. Compositions shown: Avatar, Card, Text, Form, Table. No aria attribute, no reduced-motion rule (K-0111, K-0112).                                                                                                                                      |
| Ours        | No Skeleton component, story or catalog entry (grep of `packages/design-system` for "Skeleton" found none). Busy regions already set `aria-busy` (Table, Dialog, Sheet, Canvas board).                                                                                                                                                                           |
| Add         | Options the sources raise: a busy container with `aria-busy` while the placeholders show (K-0113) and one polite status message for the region rather than per shape (K-0114, K-0115); a stance on the pulse under reduced motion and under 2.2.2 when it runs beside usable content (K-0116, K-0117); shape presets for the compositions shadcn shows (K-0111). |
| Do not copy | A bare `animate-pulse` div with no reduced-motion rule and nothing for assistive technology (K-0111, K-0112). Shape and size by free `className` (K-0111): radius and colour classes are forbidden in our components (`.claude/rules/design-system.md`), so presets would come from tokens.                                                                      |

### Standards, each scoped to the pages read

- `aria-busy` asks assistive technologies to wait; it does not announce (K-0113).
- `role="status"` is polite and atomic by default and should not take focus (K-0114).
- SC 4.1.3 (AA) names the waiting state of an application as a status message; it does not name spinners or skeletons (K-0115).
- SC 2.3.3 is AAA and covers interaction-started motion only; C39 is its reduced-motion technique (K-0116).
- SC 2.2.2 is Level A for automatic motion over five seconds beside other content; Note 4 lets a preload animation be essential when no interaction can occur (K-0117).
- None of the three publisher components read (K-0108, K-0110, K-0111) sets a reduced-motion rule in the code read; Untitled has no skeleton to check (K-0109), and Untitled's `theme.css` was not checked for an `--animate-spin` override (K-0112).

### Open points

- shadcn's docs page and registry file name different icons (`LoaderIcon`, `Loader2Icon`) (K-0110).
- Whether the ORIVILO spinner counts as essential motion under 2.3.3 and 2.2.2 (`recipes.css` says it does) is for the designer (K-0116, K-0117).

## Why it matters for ORIVILO

ORV-201 needs the audit section B table before the Spinner and Skeleton stories. This entry is that table with each cell tied to an entry; the values are for the designer and the owner to choose.
