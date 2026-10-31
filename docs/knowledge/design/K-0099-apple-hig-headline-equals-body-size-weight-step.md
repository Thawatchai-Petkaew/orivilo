---
id: K-0099
topic: design
claim: Apple's HIG text styles give Headline the same size and line height as Body and separate them by weight only (macOS Headline Bold 13 on 16 over Body Regular 13 on 16; iOS xSmall Headline Semibold 14 on 19 over Body Regular 14 on 19); the HIG says to adjust weight, size and colour for hierarchy and to avoid tight leading for three or more lines.
source: "https://developer.apple.com/design/human-interface-guidelines/typography (read through https://r.jina.ai/)"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: link-only
---

## Evidence

Read through a reader proxy because the page renders in script. Confidence 0.8: Apple's own guideline page, quoted. The iOS "Large (default)" table sits in a tab the reader did not return, so the iOS default rows were not read; only the xSmall and AX1 iOS tables and the macOS table came through.

### Hierarchy

> "Adjust font weight, size, and color as needed to emphasize important information and help people visualize hierarchy."
> "Be sure to maintain the relative hierarchy and visual distinction of text elements when people adjust text sizes."

### Tables (Text style, Weight, Size, Line height or leading, Emphasized weight)

macOS built-in text styles:

> | Headline | Bold | 13 | 16 | Heavy |
> | Body | Regular | 13 | 16 | Semibold |

Other macOS rows read: Callout Regular 12 on 15; Subheadline Regular 11 on 14.

iOS, iPadOS, xSmall:

> "Headline | Semibold | 14 | 19 | Semibold"
> "Body | Regular | 14 | 19 | Semibold"

Other xSmall rows read: Title 3 Regular 17 on 22; Callout Regular 13 on 18; Subhead Regular 12 on 16; Footnote Regular 12 on 16.

### Leading

> "...more space between lines (loose leading) can make it easier for people to keep their place"
> "...decreasing the space between lines (tight leading) can help the text fit well."
> "If you need to display three or more lines of text, avoid tight leading even in areas where height is limited."

### What the page read does not say

- No line-height guidance for Thai or other tall scripts was found in the text the reader returned.
- No gap between a headline and its body.

## Why it matters for ORIVILO

Apple shows the weight-only step at one size: a title in a compact component can share the body size and differ in weight. Apple's body leading (16 on 13, 19 on 14, by our arithmetic about 1.23 and 1.36) is tighter than the 14 on 20 and 16 on 24 body rows of the web scales read for ORV-192 (K-0096, K-0098, K-0100, K-0101), though Carbon's body-compact-01 at 14 on 18 is tighter still (K-0100).
