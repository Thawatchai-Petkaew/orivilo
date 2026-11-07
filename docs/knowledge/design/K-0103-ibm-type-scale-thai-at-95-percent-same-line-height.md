---
id: K-0103
topic: design
claim: IBM's type scale tells designers to set Thai (with Chinese, Japanese, Korean, Devanagari and Arabic) at 95 percent of the default point size while keeping the default line height, so 14 becomes 13.3 on 18 or 20 and 16 becomes 15.2 on 22 or 24, a line-height ratio about 5 percent above the Latin one (own arithmetic); it also says line height loosens for body sizes and offers several line heights for different paragraph lengths.
source: "https://www.ibm.com/design/language/typography/type-scale (read through https://r.jina.ai/)"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: link-only
---

## Evidence

IBM Design Language, type scale page, read 2026-10-31 through a reader proxy (a direct fetch returned 38 characters of text). Confidence 0.8: one publisher, quoted; the numeric table carries no column labels in the reader's text.

### Thai and the other listed scripts

> "For Plex Chinese, Japanese, Korean, Thai, Devanagari and Arabic, the type scale has been adjusted to 95%"
> "of the default size while keeping the same line height."
> "Don't use the default point size and line height for the Chinese, Japanese, Korean, Thai, Devanagari or Arabic alphabets."
> "Decrease the point size to 95% when using the Chinese, Japanese, Korean, Thai, Devanagari or Arabic alphabet."

(The page writes the apostrophe in "Don't" as a curly quote.)

### Line height and paragraph length

> "The IBM line height adapts to the paragraph length and relative type size."
> "The line height is usually larger for body type scales and becomes progressively tighter"
> "For certain type sizes, multiple line height options are provided to account for varying paragraph lengths"

### Table rows at 14 and 16

The reader returned an unlabeled table whose middle column is 95 percent of the first (6 to 5.7). Read as default size, 95 percent size, line height, its rows near body size are:

```text
12 11.4 16
14 13.3 18
20
16 15.2 22
24
```

The lone `20` and `24` are read here as the second line-height option for 14 and 16; the page's own labels were not in the reader's text, so this reading is ours.

By our arithmetic: Latin 14 on 20 is 1.43 and Thai 13.3 on 20 is 1.50; Latin 16 on 24 is 1.5 and Thai 15.2 on 24 is 1.58; Latin 14 on 18 is 1.29 and Thai 13.3 on 18 is 1.35.

## Why it matters for ORIVILO

Of the systems read for ORV-192, this is the one that gives a Thai size and line-height rule beside its Latin scale; Material names Thai a tall script but gives no values (K-0104). IBM keeps the Latin line box and shrinks Thai inside it. DESIGN.md says Thai "must not look smaller or lighter than the Latin beside it"; the IBM page does not say whether 95 percent makes Plex Thai look equal to or smaller than the Latin. The rule was set for IBM Plex, not Sarabun, and the page does not say it holds for other Thai faces.
