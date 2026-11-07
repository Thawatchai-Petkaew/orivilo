---
id: K-0368
topic: design
claim: The Untitled UI pages for Content dividers, Metrics and Filter bars point at application/content-divider, application/metrics and application/filter-bar, but the open-source repo's components/application listing has none of those folders, so no code for the three was read and each row rests on page text.
source: "https://api.github.com/repos/untitleduico/react/contents/components/application; https://www.untitledui.com/react/components/content-dividers.md; https://www.untitledui.com/react/components/metrics.md; https://www.untitledui.com/react/components/filter-bars.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, `main` branch (no commit hash shown). Confidence 0.75: an absence, read from one listing.

`components/application` lists 12 entries (count of the listing returned): `app-navigation`, `carousel`, `charts`, `date-picker`, `empty-state`, `file-upload`, `loading-indicator`, `modals`, `pagination`, `slideout-menus`, `table`, `tabs`.

The pages' install lines read `npx untitledui@latest add content-divider`, `add metrics` and `add filter-bar`; the filter bars page imports its demo from `@/components/application/filter-bar/filter-bar.demo.tsx`.

The page text does not say why these are missing from the open repo, and whether a paid plan holds them was not read.

## Why it matters for ORIVILO

The prop lists in K-0352, K-0359 to K-0361 and K-0364 to K-0367 are what the FAQ text says. A claim about how these components behave at run time is out of reach from what was read.
