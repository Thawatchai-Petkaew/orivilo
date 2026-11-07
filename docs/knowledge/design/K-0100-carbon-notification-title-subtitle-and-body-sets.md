---
id: K-0100
topic: design
claim: IBM Carbon sets a notification title in heading-compact-01 (14 px on 18, 600) and its subtitle in body-compact-01 (14 px on 18, 400) in the same colour token, a weight step only, with the inline notification's title and subtitle on one wrapping row 4 px apart and the toast's stacked with no margin between (our reading of the SCSS); Carbon keeps body-compact (14 on 18, 16 on 22) for text up to four lines and body (14 on 20, 16 on 24) for longer paragraphs.
source: "https://carbondesignsystem.com/components/notification/style/; https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/notification/_inline-notification.scss; https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/notification/_toast-notification.scss; https://carbondesignsystem.com/elements/typography/type-sets/; https://carbondesignsystem.com/elements/spacing/overview/"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: own-words
---

## Evidence

Carbon's site and its `main` branch SCSS, read 2026-10-31. Confidence 0.8: one publisher (IBM), docs and code agree.

### Notification style page

| Element  | Font size (px / rem) | Font weight    | Type token            |
| -------- | -------------------- | -------------- | --------------------- |
| Title    | 14 / 0.875           | SemiBold / 600 | `$heading-compact-01` |
| Subtitle | 14 / 0.875           | Regular / 400  | `$body-compact-01`    |

Colour: low contrast, title and subtitle both `$text-primary`; high contrast, both `$text-inverse`. The page gives no title-to-subtitle spacing; for the toast it lists a title margin-top of 16 px (`$spacing-05`) and a subtitle margin-bottom of 24 px (`$spacing-06`).

### Code

Inline notification:

```text
.#{$prefix}--inline-notification__text-wrapper {
display: flex;
flex-wrap: wrap;
.#{$prefix}--inline-notification__title {
@include type-style('heading-compact-01');
margin-inline-end: $spacing-02;
```

Toast notification:

```text
.#{$prefix}--toast-notification__title {
@include type-style('heading-compact-01');
margin-block-start: $spacing-05;
.#{$prefix}--toast-notification__subtitle {
@include type-style('body-compact-01');
margin-block: 0 $spacing-05;
```

(Excerpts; lines between them left out.) The toast SCSS gives the subtitle `margin-block: 0 $spacing-05` (16 px below, none above), which differs from the style page's 24 px; the code was read on `main`. Spacing page: `$spacing-02` 0.25 rem, 4 px; `$spacing-03` 0.5 rem, 8 px; `$spacing-05` 1 rem, 16 px.

### Type sets

| Token              | Size  | Line height | Weight |
| ------------------ | ----- | ----------- | ------ |
| body-compact-01    | 14 px | 18 px       | 400    |
| body-compact-02    | 16 px | 22 px       | 400    |
| body-01            | 14 px | 20 px       | 400    |
| body-02            | 16 px | 24 px       | 400    |
| heading-compact-01 | 14 px | 18 px       | 600    |
| heading-compact-02 | 16 px | 22 px       | 600    |
| heading-01         | 14 px | 20 px       | 600    |
| heading-02         | 16 px | 24 px       | 600    |
| helper-text-01     | 12 px | 16 px       | 400    |
| label-01           | 12 px | 16 px       | 400    |

> body-compact-01: "This is for short paragraphs with no more than four lines and is commonly used in components."
> body-01: "this body style is used in productive layouts for long paragraphs with more than four lines."

By our arithmetic the ratios are 1.29 (14 on 18), 1.375 (16 on 22), 1.43 (14 on 20) and 1.5 (16 on 24).

## Why it matters for ORIVILO

Carbon is the plainest case of a weight-only step at one size and one colour, and, with IBM's own type scale (K-0103), the only system read for ORV-192 that names two body line heights by paragraph length: a compact one inside components and a looser one past four lines. The toast's title-to-subtitle gap of 0 is our reading of the margins quoted; nothing was rendered.
