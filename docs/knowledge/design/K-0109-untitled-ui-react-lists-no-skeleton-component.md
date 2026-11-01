---
id: K-0109
topic: design
claim: The Untitled UI React components index lists no skeleton or placeholder component (its loading entries are Loading indicators, Progress indicators and Progress steps), the open repo's components/base folder has no skeleton folder, and the guessed page skeletons.md returns 404, so Untitled UI gives no skeleton variants, sizes, states or slots to benchmark.
source: "https://www.untitledui.com/react/components (read through https://r.jina.ai/); https://api.github.com/repos/untitleduico/react/contents/components/base; https://www.untitledui.com/react/components/skeletons.md"
retrieved: 2026-11-01
confidence: 0.75
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.75: an absence read from an index and a folder listing; the paid Figma kit and any page not in the index were not read.

The index groups and the entries near loading, as the fetch tool returned them:

> Loading indicators 3 components
> Progress indicators 2 components + 9 variants
> Progress steps 18 components

Asked for Skeleton, Skeleton loader, Spinner or Placeholder, the tool found "No matching entries." The GitHub API lists 17 folders under `components/base` (avatar, badges, button-group, buttons, checkbox, dropdown, file-upload-trigger, form, input, progress-indicators, radio-buttons, select, slider, tags, textarea, toggle, tooltip), none named skeleton. `https://www.untitledui.com/react/components/skeletons.md` returned HTTP 404.

K-0096 found `loading-indicator` among the 12 folders under `components/application`; that folder holds the spinner (K-0108), not a skeleton.

## Why it matters for ORIVILO

The ORV-201 benchmark table needs an Untitled UI row for Skeleton. Its cell is "none found", with this entry as the reason, not a set filled from memory.
