---
id: K-0102
topic: design
claim: WCAG 2.2 SC 1.4.12 Text Spacing (AA) does not require authors to set a line height but requires no loss of content when a user sets line height to 1.5 times the font size, paragraph spacing to 2 times, letter spacing to 0.12 and word spacing to 0.16, with an exception for scripts that do not use a property; SC 1.4.8 Visual Presentation (AAA) asks for line spacing of at least space-and-a-half within paragraphs.
source: "https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html; https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: link-only
---

## Evidence

W3C's Understanding pages for WCAG 2.2, read 2026-10-31. Confidence 0.8: one standards body, quoted. K-0013 pins WCAG 2.2 as the version ORIVILO follows.

### SC 1.4.12 Text Spacing (Level AA)

> "Line height (line spacing) to at least 1.5 times the font size;"
> "Spacing following paragraphs to at least 2 times the font size;"
> "Letter spacing (tracking) to at least 0.12 times the font size;"
> "Word spacing to at least 0.16 times the font size."
> Note 1: "Content is not required to use these text spacing values."
> "This SC does not dictate that authors must set all their content to the specified metrics"

On scripts: "Human languages and scripts that do not make use of one or more of these text style properties in written text" can conform "using only the properties that exist for that combination of language and script." The page's example is "languages such as Japanese do not use spacing following paragraphs." It says nothing about Thai.

### SC 1.4.8 Visual Presentation (Level AAA)

> "Line spacing (leading) is at least space-and-a-half within paragraphs,"
> "paragraph spacing is at least 1.5 times larger than the line spacing."

## Why it matters for ORIVILO

At AA the 1.5 figure is a test a layout must survive under a user override, not a value to ship; at AAA it is a floor for paragraphs. Body rows at 14 on 20 (1.43, our arithmetic) pass AA if the box grows when a user raises the line height, and sit under the AAA floor.
