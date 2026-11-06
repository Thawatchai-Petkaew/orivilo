---
id: K-0173
topic: design
claim: No page-loading or loading-state pattern was found in Untitled UI React: the components index read names Loading indicators, Progress indicators and Progress steps, the guessed pages page-loading.md and loading-states.md return 404, the loading indicator page names no placement, and the tables page has no example heading with the word empty or loading, only the no-rows examples "No vendors found" and "No users found".
source: "https://www.untitledui.com/react/components (read through https://r.jina.ai/); https://api.github.com/repos/untitleduico/react/contents/components/application; https://www.untitledui.com/react/components/page-loading.md; https://www.untitledui.com/react/components/loading-states.md; https://www.untitledui.com/react/components/loading-indicators.md; https://www.untitledui.com/react/components/tables.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-223]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes. Confidence 0.75: an absence read from an index, a folder listing and two guessed URLs. The tool was asked for the entries near loading and empty, not for the full list; the paid Figma kit and the demo code were not read.

The index entries near the question, as the tool listed them with the count text beside each:

- Base components: Progress indicators, "2 components + 9 variants".
- Application UI components: Empty states, "3 components"; Loading indicators, "3 components"; Progress steps, "18 components".
- Shared page examples: 404 sections, "10 components".
- Marketing website examples: 404 pages, "10 pages".

The GitHub listing of `components/application` has 12 folders (count stated by the tool): app-navigation, carousel, charts, date-picker, empty-state, file-upload, loading-indicator, modals, pagination, slideout-menus, table, tabs. `page-loading.md` and `loading-states.md` each returned HTTP 404.

The loading indicators page, asked where the indicator is meant to go, gave only its description:

> Free and open-source React loading indicator components built for modern applications and websites.

Its example headings are Line simple, Line simple with label, Line spinner, Line spinner with label, Dot circle, Dot circle with label and Sizes. K-0108 records the indicator's props; K-0109 records the skeleton absence.

The tables page, under "## Table examples", has the headings `### No vendors found` and `### No users found` over previews. The tool found no empty state, loading state, skeleton, spinner or `aria-busy` in its text, and no example heading with "empty" or "loading". The empty states page mentions loading only as a navigation link.

## Why it matters for ORIVILO

The ORV-223 benchmark needs an Untitled UI cell for a loading pattern. Its cell is "none found", with the spinner in K-0108 as the nearest piece, not a pattern filled from memory.
