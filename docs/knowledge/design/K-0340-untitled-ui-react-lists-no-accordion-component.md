---
id: K-0340
topic: design
claim: On 2026-11-06 Untitled UI React's components index has no Accordion, Collapsible or Disclosure entry and the open-source repo's base and application folders have no such folder; the only accordion names read are eight FAQ section examples ("Accordion 01" to "04" and their brand forms, own count) on a marketing page that describes no open or close behaviour.
source: "https://www.untitledui.com/react/components; https://api.github.com/repos/untitleduico/react/contents/components/base; https://api.github.com/repos/untitleduico/react/contents/components/application; https://www.untitledui.com/react/marketing/faq-sections (read through https://r.jina.ai/); https://www.untitledui.com/react/marketing/faq-sections.md; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.75: an absence, read from one index and two folder listings of one publisher; the FAQ accordion code was not read. This re-reads the absence recorded in K-0119 (2026-11-01) and finds the same result.

### Components index

Asked for each word, the fetch tool answered "Does not exist on this page." for Accordion, Collapsible and Disclosure. The marketing group links "FAQ sections" to `https://www.untitledui.com/react/marketing/faq-sections` and "FAQ pages" to `https://www.untitledui.com/react/marketing/faq-pages`.

### Open-source repo (`untitleduico/react`, `main`, no commit hash shown)

`components/base` lists 17 entries and `components/application` lists 12 (counts of the listings returned); none is named accordion, collapsible or disclosure.

### FAQ sections

Example names read: "Accordion 01", "Accordion 01 brand", "Accordion 02", "Accordion 02 brand", "Accordion 03", "Accordion 03 brand", "Accordion 04", "Accordion 04 brand". The fetch tool found none of the words aria-expanded, expand, collapse, keyboard or heading in the page text. The `.md` form of the page returned HTTP 404.

## Why it matters for ORIVILO

The Accordion benchmark's Untitled UI row can only record this absence. The audit (`docs/specs/ORV-64/audit.md`, line 67) says the same: Untitled "no".
