---
id: K-0101
topic: design
claim: Atlassian Design pairs a bold heading token with a regular body token by component size (Heading M with Body M in modals, Heading S or XS for titles in small components such as flags, Heading XXS with Body S), sets body at 14 px on 20 (default) and 16 px on 24 (large) with paragraph spacing of 12 and 16 px, and says to use heading styles rather than bold or a size change.
source: "https://atlassian.design/foundations/typography"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: link-only
---

## Evidence

Atlassian's typography foundation page, read 2026-10-31. Confidence 0.8: one publisher's guideline page, quoted.

### Pairing

> "M can be used in large components where space is not limited and perfectly balances with Body M, such as modals."
> "S and XS are for titles in small components where space is limited, such as flags."
> "XXS should be used sparingly and is suitable when matched with Body S, for example, in fine print."
> "Use heading styles, rather than bold or a change of font size, as they're important for accessibility."
> "Body M (Default) is the default size in components or where space is limited"

### Tokens

| Token               | Weight  | Size              | Line height      | Paragraph spacing |
| ------------------- | ------- | ----------------- | ---------------- | ----------------- |
| font.body.large     | Regular | 1 rem / 16 px     | 1.5 rem / 24 px  | 1 rem / 16 px     |
| font.body           | Regular | 0.875 rem / 14 px | 1.25 rem / 20 px | 0.75 rem / 12 px  |
| font.body.small     | Regular | 0.75 rem / 12 px  | 1 rem / 16 px    | 0.5 rem / 8 px    |
| font.heading.xsmall | Bold    | 0.875 rem / 14 px | 1.25 rem / 20 px |                   |
| font.heading.small  | Bold    | 1 rem / 16 px     | 1.25 rem / 20 px |                   |
| font.heading.medium | Bold    | 1.25 rem / 20 px  | 1.5 rem / 24 px  |                   |

The page says paragraph spacing is set in Figma text styles; in code it says to "use separate text components for each paragraph," with spacing from the stack component.

### What the page does not say

- The colour of a heading against its body, and the gap between a heading and the body under it in a flag or modal.
- Any line height for Thai or another tall script.

## Why it matters for ORIVILO

By our reading, a small component titled in Heading XS (14 px bold) over the default Body M (14 px regular) has the same weight-only step at one size as Carbon (K-0100) and Apple (K-0099); the page names the two tokens for small components but does not show them together. The page gives accessibility as its reason for heading styles and says no more.
