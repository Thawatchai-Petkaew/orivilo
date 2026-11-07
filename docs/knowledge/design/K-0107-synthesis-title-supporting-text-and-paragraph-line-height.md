---
id: K-0107
topic: design
claim: Across the systems read in K-0096 to K-0101, a title is separated from its supporting text by a weight step in 13 of 14 pairs (Material's dialog is the exception), a colour step where a colour is stated except Carbon, and a size step in dialog headers and empty states but not in alerts, toasts, notifications or checkbox labels, with gaps of 0 to 4 px in compact components and 8 px in headers (Material 16dp); body rows at 14 to 16 px run from 1.29 to 1.625 (own arithmetic), most often 14 on 20 and 16 on 24; for Thai, IBM's rule gives 1.50 to 1.58 on its looser rows (own arithmetic), readers preferred 1.5 or double spacing, and no source gives a Sarabun figure.
source: "docs/knowledge/design/K-0096-untitled-ui-title-and-supporting-text-pair.md; docs/knowledge/design/K-0097-shadcn-ui-title-and-description-pair.md; docs/knowledge/design/K-0098-material-3-dialog-headline-and-supporting-text.md; docs/knowledge/design/K-0099-apple-hig-headline-equals-body-size-weight-step.md; docs/knowledge/design/K-0100-carbon-notification-title-subtitle-and-body-sets.md; docs/knowledge/design/K-0101-atlassian-heading-body-pairing-and-paragraph-spacing.md; docs/knowledge/design/K-0102-wcag-2-2-text-spacing-and-line-spacing.md; docs/knowledge/design/K-0103-ibm-type-scale-thai-at-95-percent-same-line-height.md; docs/knowledge/design/K-0104-thai-is-a-tall-script-with-stacked-marks.md; docs/knowledge/design/K-0105-thai-and-uk-readers-prefer-1-5-or-double-line-spacing.md; docs/knowledge/design/K-0106-informal-test-tall-scripts-clip-at-1-1-line-height.md"
retrieved: 2026-10-31
confidence: 0.75
applies_to: [ORV-192]
license: own-words
---

## Evidence

A synthesis of the entries in `source:`; every figure comes from them, and the arithmetic is ours. Confidence 0.75: the inputs are at 0.8 except K-0105 (0.7) and K-0106 (0.5, used only as a lead), and several rows are our reading of classes, not rendered output.

### Title over supporting text, pair by pair

| Entry  | Component           | Title                       | Supporting text                | Size step | Weight step | Colour step      | Gap            |
| ------ | ------------------- | --------------------------- | ------------------------------ | --------- | ----------- | ---------------- | -------------- |
| K-0096 | Empty state sm      | 16 semibold, text-primary   | 14 regular, text-tertiary      | yes       | yes         | yes              | 4 px           |
| K-0096 | Empty state md      | 18 semibold                 | 14 regular, text-tertiary      | yes       | yes         | yes              | 8 px           |
| K-0096 | Empty state lg      | 20 semibold                 | 16 regular, text-tertiary      | yes       | yes         | yes              | 8 px           |
| K-0096 | Checkbox sm         | 14 medium, text-secondary   | 14 regular, text-tertiary      | no        | yes         | yes              | 0              |
| K-0096 | Checkbox md         | 16 medium, text-secondary   | 16 regular, text-tertiary      | no        | yes         | yes              | 2 px           |
| K-0097 | Alert               | 14 medium, inherited colour | 14, muted-foreground           | no        | yes         | yes              | 2 px           |
| K-0097 | Card header         | inherited size, semibold    | 14, muted-foreground           | not set   | yes         | yes              | 8 px           |
| K-0097 | Dialog header       | 18 semibold                 | 14, muted-foreground           | yes       | yes         | yes              | 8 px           |
| K-0097 | Toast (Sonner)      | 13, 500, inherited colour   | 13, 400, #3f3f3f               | no        | yes         | yes, our reading | 2 px           |
| K-0098 | Dialog              | 24 regular, on-surface      | 14 regular, on-surface-variant | yes       | no          | yes              | 16dp           |
| K-0100 | Inline notification | 14, 600, text-primary       | 14, 400, text-primary          | no        | yes         | no               | 4 px, same row |
| K-0100 | Toast notification  | 14, 600, text-primary       | 14, 400, text-primary          | no        | yes         | no               | 0, our reading |
| K-0099 | Headline over Body  | same size, Bold or Semibold | Regular                        | no        | yes         | not stated       | not stated     |
| K-0101 | Small component     | Heading XS 14 bold          | Body M 14 regular              | no        | yes         | not stated       | not stated     |

The K-0101 row is our pairing of two tokens the page names for small components; the page does not show them together.

### Patterns, each scoped to the rows above

- Weight: 13 of the 14 rows step the weight (500, 600 or bold over 400); the exception is Material's dialog (K-0098), which steps size and colour instead.
- Colour: of the 12 rows that state a colour for both texts, 10 step it (Untitled text-primary or text-secondary over text-tertiary, shadcn muted-foreground, Sonner #3f3f3f, Material on-surface-variant); Carbon's two notification rows keep one token (K-0100). Apple and Atlassian rows state no colour.
- Size: the alert, toast, notification and checkbox rows keep one size; the dialog and empty-state rows step up, by 2 px (empty state sm) to 10 px (Material dialog). shadcn's card title sets no size.
- Gap: compact rows (checkbox, alert, toasts, inline notification) sit at 0 to 4 px; dialog and card headers at 8 px, except Material's 16dp; Untitled's empty state at 4 px (sm) or 8 px (md, lg).

### Body line height at 14 to 16 px (Latin)

Rows used, by entry: K-0096 text-sm 14 on 20, text-md 16 on 24; K-0097 Tailwind text-sm 14 on 20 and the Alert paragraphs' leading-relaxed 1.625; K-0098 body-medium 14 on 20, body-large 16 on 24; K-0099 iOS xSmall Body 14 on 19; K-0100 body-compact-01 14 on 18, body-compact-02 16 on 22, body-01 14 on 20, body-02 16 on 24; K-0101 font.body 14 on 20, font.body.large 16 on 24.

Rows left out because their size is outside 14 to 16: Untitled text-xs (12), Material body-small (12), Carbon helper-text-01 and label-01 (12), Atlassian font.body.small (12), Sonner's 13 px description (1.4), Apple macOS Body (13 on 16) and iOS xSmall Callout (13), Subhead and Footnote (12).

By our arithmetic the range is 1.29 (Carbon body-compact-01) to 1.625 (shadcn Alert paragraphs). 14 on 20 (1.43) and 16 on 24 (1.5) both appear in K-0096, K-0098, K-0100 and K-0101; K-0097 has 14 on 20. Carbon ties its looser row to paragraphs over four lines (K-0100), Apple asks to avoid tight leading at three or more lines (K-0099), and IBM's scale offers more than one line height for paragraph length (K-0103).

WCAG 2.2 (K-0102): at AA a layout must survive a user's 1.5 line height; at AAA, paragraphs need at least space-and-a-half.

### Thai

- Material classes Thai as tall and needing extra line height, with no figure and no tall themes in Material 3 (K-0104).
- IBM sets Thai at 95 percent on the Latin line height: 13.3 on 20 (1.50) and 15.2 on 24 (1.58), or 13.3 on 18 (1.35) for the tighter option (K-0103, our arithmetic).
- Thai and UK readers preferred 1.5 or double line spacing; the abstract does not map that to CSS (K-0105).
- An informal test found tall scripts, Thai among them, clipping at 1.1 and fixed at 1.6 (K-0106, confidence 0.5, a lead only).
- No source read gives a Sarabun figure; K-0104 notes its metrics were not read.

### Open points

- Untitled UI's toast, alert and card header classes are not public (K-0096).
- Apple's iOS default (Large) rows were not read (K-0099).
- Carbon's toast style page and its SCSS give different subtitle bottom margins (K-0100).
- DESIGN.md sets body 16/1.7 and 14/1.6. 16/1.7 is above every Latin row read; 14/1.6 is above every Latin row read except shadcn's 1.625 Alert paragraphs (K-0097). Both are above IBM's Thai ratios (K-0103), at or above K-0106's 1.6 lead, and between the 1.5 and double spacing readers preferred (K-0105). Whether they stay is for the designer.

## Why it matters for ORIVILO

ORV-192 asks for the title and supporting-text pair and the paragraph line height. This entry lays out what the sources show; the choice belongs to the designer and the owner.
