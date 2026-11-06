---
id: K-0238
topic: design
claim: Untitled UI React lists Warning and Destructive versions of its Stacked left aligned and Horizontal modals as PRO examples installed one at a time; the page text has neither the word delete nor the word confirm and documents no loading or error state, and the two preview URLs tried returned no body text, so their copy, button order and focus were not read.
source: "https://www.untitledui.com/react/components/modals.md; https://www.untitledui.com/react/components/modals; https://www.untitledui.com/react/iframe/modals/destructive-stacked-left-aligned-modal; https://www.untitledui.com/react/iframe/modals/warning-horizontal-modal; https://github.com/untitleduico/react/tree/main/components/application/modals"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.75: most of this is an absence in docs text, and the example source is PRO and was not read.

> The examples on this page are PRO and install one at a time with the command shown on each

```bash
npx untitledui@latest add modals/warning-stacked-left-aligned
npx untitledui@latest add modals/destructive-stacked-left-aligned
npx untitledui@latest add modals/warning-horizontal
npx untitledui@latest add modals/destructive-horizontal
```

The fetched text of the two preview pages held only metadata, for example the description "Preview of the Destructive stacked left aligned component". The public repo folder `components/application/modals` showed one file, `modal.tsx`, behind a "View all files" link that was not expanded.

### Not read

- https://www.untitledui.com/react/iframe/modals/warning-stacked-left-aligned-modal
- https://www.untitledui.com/react/iframe/modals/destructive-horizontal-modal
- The PRO source of all four examples.

## Why it matters for ORIVILO

Untitled's React confirmation shapes exist, but their impact copy, pending state, failure state and first focus cannot be taken from what is public. The benchmark marks those cells not read, not absent.
