---
id: K-0119
topic: design
claim: Untitled UI React lists no collapsible, disclosure or accordion component in its components index or in the open-source repo's base and application folders; the nearest pages are the marketing FAQ sections, whose examples include "Accordion 01" to "Accordion 04" built with React Aria but describe no open or close behaviour, and Tree views, which expand nodes through React Aria's expandedKeys.
source: "https://www.untitledui.com/react/components; https://api.github.com/repos/untitleduico/react/contents/components; https://api.github.com/repos/untitleduico/react/contents/components/base; https://api.github.com/repos/untitleduico/react/contents/components/application; https://www.untitledui.com/react/marketing/faq-sections (read through https://r.jina.ai/); https://www.untitledui.com/react/marketing/faq-sections.md; https://www.untitledui.com/react/components/tree-views.md"
retrieved: 2026-11-01
confidence: 0.75
applies_to: [ORV-203]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.75: an absence, read from the index and two repo folder listings of one publisher; the FAQ accordion code was not read.

### Components index

The index groups base components, application UI components and marketing website components. Its base and application groups have no Accordion, Collapsible, Disclosure or Expandable entry; the fetch tool, asked for one, answered "It has no accordion, disclosure, or collapsible entry." The marketing group links "FAQ sections" to `https://www.untitledui.com/react/marketing/faq-sections`, and the application group links "Tree views" to `https://www.untitledui.com/react/components/tree-views`.

### Open-source repo (`untitleduico/react`, `main`, no commit hash shown)

`components/` holds `application`, `base`, `foundations`, `internal`, `shared-assets`. `components/base` holds 17 folders (count of the listing returned), none named collapsible, disclosure or accordion: avatar, badges, button-group, buttons, checkbox, dropdown, file-upload-trigger, form, input, progress-indicators, radio-buttons, select, slider, tags, textarea, toggle, tooltip. `components/application` holds 12 folders, none of them either: app-navigation, carousel, charts, date-picker, empty-state, file-upload, loading-indicator, modals, pagination, slideout-menus, table, tabs. No marketing folder is in the repo.

### FAQ sections (nearest page)

> These FAQ sections are built using React Aria and styled with Tailwind CSS.

Example names on the page include "Accordion 01", "Accordion 02", "Accordion 03", "Accordion 04" and the same four with "brand". The words expand, collapse and open do not appear on the page, and no code, `aria-expanded` or animation class was in the text read. The `.md` form of the page returned HTTP 404.

### Tree views

> These tree views are built using React Aria and styled with Tailwind CSS.
> use `defaultExpandedKeys` to open nodes on first render

The page also names "`expandedKeys` with `onExpandedChange`" to control expansion and says "`TreeView` passes its props to React Aria's `Tree`." The API reference on the `.md` page is a placeholder, and keyboard, ARIA and animation are not described.

## Why it matters for ORIVILO

ORV-203 needs an Untitled UI row in its benchmark. There is no component page to read variants, sizes or states from; the row can only record the absence and the two nearest pages.
