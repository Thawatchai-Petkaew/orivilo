---
issue: ORV-227 (https://tpetkaew.atlassian.net/browse/ORV-227)
spec: docs/specs/ORV-227/spec.md v1.1 (open questions 1 to 13 at their defaults, AC rows 1 to 35)
role: designer (task ORV-227-design-1)
version: 1.0
---

# ORV-227 design: File upload, the zone, the list and the two PRs

## 1. Sources this design relies on

- `docs/specs/ORV-227/spec.md` v1.0: rules `upload-limits-1` to `upload-copy-1`, "Contract changes and impact", the Copy table, AC rows 1 to 35, "Rows per PR", open questions 1 to 13.
- `docs/knowledge/design/K-0288-synthesis-file-upload-benchmark.md`: the Add and Do not copy rows.
- `DESIGN.md` v1.60: §3.1 (pairs), §3.3 (radius by level, space, motion), §4 (Thai line height, clip-box rule), §7 (states), §8 (colour roles), §9 (tells), §11 (gate).
- `.claude/rules/design-system.md`. The code on this branch: `Field.tsx`, `Progress.tsx`, `Button.tsx`, `icons.tsx`, `recipes.css` (`.ds-field` line 683, `.ds-progress` line 3805, the clip-box rule line 4715), `component.json` (`field` line 1188, `textarea.radius`, `progress` line 2159), `pairs.ts`.
- PR 186 at `97b64d3`, for `expectFrameCutsNoInk` in `visual-asserts.ts`. It was read, not run.

## 2. Direction

One direction, because the task leaves little room. The control is a form field made of parts that exist, and a person meets it in the middle of giving ORIVILO a brand: calm, plain, nothing to admire. The choice is how much frame it carries.

- **One start edge.** Label, limits, zone and rows all start at the same x. Inside, the Choose button and every row's text start at one inner x (17 px past the outer edge, measured at every width). Nothing is centred.
- **The dashed line is the whole idea of the zone.** Dashed at rest means "this takes something"; solid and ink under a held file means "let go now". The difference is the line's shape, so it holds without colour. The zone has no fill, no icon of its own and no hover, because a press on it does nothing (`upload-drop-1`).
- **Rows are quiet.** Hairline boxes with no fill, one radius shared with the zone. State lives in words and marks, not in the box: the row's edge never changes. An edge that turns red means one thing here, the control is invalid.
- **A failure keeps its action beside its reason.** Retry sits at the start edge under the reason, at every width. Beside Remove, at 1440 px it would start about 900 to 980 px past the end of the words that explain it, and at 360 px it would squeeze a long name into a column about 140 px wide, where the body has 254 now. Both figures are worked out from the measured button and text widths; that layout was not rendered.

Rejected, each rendered on the same content:

| Alternative                                                                                                                                     | Why not                                                                                                                                                           | Shot                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button and hint centred in the zone, the usual dropzone form (K-0264 does not record Untitled UI's alignment, so no source is claimed)          | A second axis between two start-aligned blocks: the eye jumps at 1440 px, and the row text below no longer lines up with the control                              | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/alts-1440.png`                                 |
| Zone at `shape.container.radius` (16) over rows at `shape.media.radius` (12), the spec's proposal                                               | Siblings in one stack with two corners; the mismatch shows at every row. The zone is a control box like Textarea, which already takes the media radius            | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/alts-radius/pr2-full-360-th-light-neutral.png` |
| A red ring on a failed row (Untitled UI's error ring, K-0262), with the reason in secondary ink (our variation: Untitled UI has no reason prop) | The same edge then means two things, a failed row and an invalid control, and they appear together. The reason in grey reads as a note, not a failure (AC row 34) | `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/alts-ring/pr1-failed-360-th-light-neutral.png` |
| A brand ring on the drag (Untitled UI's form, K-0263)                                                                                           | Violet in that slot reads as focus or selection (`DESIGN.md` §8). Ink stays apart from both. Not rendered                                                         | none                                                                                                                                                                                     |

## 3. Flow

```text
Empty: label, limits, zone (Choose, hint). No list.
  Choose pressed, or files dropped (PR 2) -> judgeFiles
     accepted -> onFiles once -> caller adds items -> rows appear, status region speaks
     refused  -> lines appear under the zone, the edge turns error, alert speaks
  A row: uploading -> done          (the row loses its bar: 12 px shorter)
         uploading -> failed        (word, reason, Retry)
         failed -- Retry --> uploading, focus to that row's Remove
         any -- Remove --> the row goes, the lines clear, focus to Choose
  items.length reaches maxFiles -> full: Choose dimmed and focusable, hint says what to do
```

## 4. Anatomy, in DOM order

The list sits outside the `Field`. `Field` renders its error after its children, so a list inside it would push the refused lines under five rows, while AC rows 5 and 17 put them under the zone, next to where the person acted. Outside, the DOM order is the visual order and `Field` does not change.

```text
div.ds-file-upload                                className lands here
  Field (label, description=limits line, error, disabled)
    label.ds-field__label
    p.ds-field__description
    div.ds-file-upload__zone [data-invalid] [data-full] [data-dragging, PR 2]
      input.sr-only type=file (id from Field, aria-hidden, tabindex -1)
      Button secondary md, iconLeading UploadIcon    "เลือกไฟล์"
      p.ds-file-upload__hint                         only when it has text
    p.ds-field__error role=alert                     only when there are lines
      span                                           the caller's error, when set
      span.ds-file-upload__rejected                  one per refused file, then the fold
  ul.ds-file-upload__list                            only with items
    li.ds-file-upload__item [data-status]
      div.ds-file-upload__body
        uploading: Progress sm, then p.ds-file-upload__meta (size)
        done:      p.__name, p.__meta (span size, span.__word)
        failed:    p.__name, p.__meta (span size, span.__word), p.__reason, Button.__retry
      div.ds-file-upload__actions
        Button ghost sm iconOnly CloseIcon
  div.sr-only role=status                            always mounted
```

The input and the Button live in one inner component rendered as `Field`'s child, because `useFieldControl` reads context there.

## 5. Builder table, PR 1: the picker (AC rows 1 to 26, 34, 35)

Every value is a token. The recipe is section 8, the tokens section 7. "Target" is measured on the render in section 14, at 2x, neutral.

| #   | Rule                                  | Markup                                                                                                                                                                                                                                                                                                                                                                | CSS and tokens                                                                                                                                                                                                                                                                                                            | Target                                                                                                                                                                                      | Proved by           |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | `upload-limits-1`                     | The limits line is `Field`'s `description`, built from `limits`                                                                                                                                                                                                                                                                                                       | Existing `.ds-field__description`, 4 px under the label                                                                                                                                                                                                                                                                   | Wraps to 2 lines at 360 px in Thai and in English, 1 line at 1440 px                                                                                                                        | Row 1               |
| 2   | `upload-size-1`, `upload-size-text-1` | No element of their own. The text goes in `__meta` and in the reject lines                                                                                                                                                                                                                                                                                            | `__meta` row 13                                                                                                                                                                                                                                                                                                           | "1.9 MB" reads as one unbroken run                                                                                                                                                          | Rows 3, 5           |
| 3   | `upload-judge-1`, `upload-server-1`   | No look. A file name is a text child only, in `__name`, `.ds-progress__label` and the reject lines                                                                                                                                                                                                                                                                    | `overflow-wrap: anywhere` on each, so a name wraps and is never cut                                                                                                                                                                                                                                                       | Row 18's names show as plain characters                                                                                                                                                     | Rows 18, 25         |
| 4   | `upload-field-1`                      | Root `div.ds-file-upload` holds `Field` then the `ul`. Pass `error={undefined}` when there is no line: `Field` tests truth, and an empty array is true                                                                                                                                                                                                                | `.ds-file-upload`: flex column, `gap: --cmp-file-upload-gap` (8), `min-inline-size: 0`                                                                                                                                                                                                                                    | Lines sit 8 px under the zone, the list 8 px under them                                                                                                                                     | Rows 5, 17          |
| 5   | `upload-input-1`, `upload-field-1`    | `Button variant="secondary" size="md" iconLeading={<UploadIcon />}`, visible text `fileUpload.choose`, `aria-label` from `fileUpload.chooseLabel`, `aria-describedby` from `useFieldControl`. The input comes first in the zone: `multiple`, `accept`, the Field's `id`, `aria-invalid` from `useFieldControl`, `className="sr-only"`, `tabIndex={-1}`, `aria-hidden` | `Button` unchanged; `.sr-only` from the base CSS, absolute, so it takes no gap in the zone                                                                                                                                                                                                                                | Button 40 px high, left edge 17 px inside the root                                                                                                                                          | Rows 1, 2, 5, 17    |
| 6   | `upload-drop-1` (frame only)          | `div.ds-file-upload__zone`, no role, no tabindex, no ARIA                                                                                                                                                                                                                                                                                                             | `padding: --cmp-file-upload-padding` (16), `border: 1px solid --cmp-file-upload-zone-border`, `border-radius: --cmp-file-upload-radius`, flex wrap, `align-items: center`, `gap` 8, `position: relative` so the hidden input has a containing block                                                                       | Zone 74 px high with one line. **Solid in PR 1**: section 6                                                                                                                                 | Row 17, row 34      |
| 7   | `upload-count-1`                      | `data-full` on the zone at `items.length >= limits.maxFiles`; `p.__hint` with `id`, text `fileUpload.full`; the Button takes `aria-disabled` and the hint's id in `aria-describedby`; the input takes `disabled`, so a press on the label opens nothing                                                                                                               | `[data-full]`: `border-color: --cmp-file-upload-zone-border-disabled`. The hint keeps `--cmp-field-description`, not disabled ink: it tells the person what to do                                                                                                                                                         | Hint beside the Button when it fits (1440 px), wrapped under it at the same start edge when it does not (360 px, zone 105.8 px; 320 px English, 129.6 px). No breakpoint: flex wrap does it | Rows 7, 8           |
| 8   | `upload-field-1`, disabled            | `disabled` on `Field`, the input and all Buttons. No new attribute                                                                                                                                                                                                                                                                                                    | `.ds-field[data-disabled] .ds-file-upload__zone`: `border-color: --cmp-file-upload-zone-border-disabled`. `.ds-field[data-disabled] .ds-file-upload__hint`: `--ds-text-disabled`. Row text keeps its ink, because the state of a file is still true                                                                       | Label, limits and Buttons dim; the failed word and reason stay readable                                                                                                                     | Row 16              |
| 9   | `upload-reject-1`                     | `data-invalid` on the zone while `Field` has an error. The caller's error as a plain `span`, each refused file as `span.ds-file-upload__rejected`                                                                                                                                                                                                                     | `.ds-file-upload .ds-field__error > span`: `display: block`; `> span + span`: `margin-block-start: --ds-space-inline-sm` (4). `[data-invalid]`: `border-color: --cmp-file-upload-zone-border-invalid`, after `[data-full]`, so a full control with refused files shows the error edge. Disabled beats both by specificity | 5 lines and the fold stay one block at 360 px; each line starts with its file name, which is what separates them                                                                            | Rows 5, 6, 7, 9, 17 |
| 10  | `upload-item-1`, list                 | `ul.ds-file-upload__list` with `aria-label`, `li.ds-file-upload__item` with `data-status`                                                                                                                                                                                                                                                                             | `__list`: flex column, gap 8, `margin: 0`, `padding: 0`, `list-style: none`. `__item`: flex, `align-items: flex-start`, gap 8, `padding-block: --ds-space-inline-lg` (12), `padding-inline: --cmp-file-upload-padding` (16), `border: 1px solid --cmp-file-upload-item-border`, the same radius                           | Text starts at the Choose button's x. No fill, no shadow, no animation                                                                                                                      | Rows 10 to 12       |
| 11  | `upload-item-1`, uploading            | `<Progress size="sm" label={name} value={progress} />`, then `p.__meta` with the size                                                                                                                                                                                                                                                                                 | `__body`: flex 1, flex column, `align-items: stretch`, gap 4, `min-inline-size: 0`. `Progress` unchanged                                                                                                                                                                                                                  | Row 89.6 px with a one-line name. The percent stays beside the name's first line, whatever the name's length                                                                                | Row 10              |
| 12  | `upload-item-1`, name                 | `p.__name`                                                                                                                                                                                                                                                                                                                                                            | `--cmp-field-label` and `--cmp-field-label-type-*` (14 / 1.7 / 500), the same type as `.ds-progress__label`, `overflow-wrap: anywhere`. It wraps, so it stays out of the clip-box rule                                                                                                                                    | A row keeps its name's look through uploading, done and failed                                                                                                                              | Rows 11, 12, 20     |
| 13  | `upload-item-1`, meta                 | `p.__meta`: `span` size, `span.__word`. An absent size renders `fileUpload.sizeMissing` in the same span                                                                                                                                                                                                                                                              | Flex wrap, `align-items: center`, `column-gap: --ds-space-inline-lg` (12), `--cmp-field-description`, `--cmp-field-text-type-*`. The gap is the separator: no middot, no comma                                                                                                                                            | One line at 360 px; the word drops under the size if a column is ever too narrow                                                                                                            | Rows 11, 12         |
| 14  | `upload-item-1`, done                 | `span.__word`: `<CheckIcon className="size-4" />` and `fileUpload.done`                                                                                                                                                                                                                                                                                               | `__word`: inline-flex, centred, gap 4. `[data-status="done"]`: `--cmp-progress-done`                                                                                                                                                                                                                                      | Row 77.6 px                                                                                                                                                                                 | Row 11              |
| 15  | `upload-item-1`, failed               | `span.__word`: `<WarningIcon className="size-4" />` and `fileUpload.failed`; `p.__reason`                                                                                                                                                                                                                                                                             | `[data-status="failed"]`: `--cmp-progress-failed`. `__reason`: `--cmp-field-error`, `--cmp-field-text-type-*`, `overflow-wrap: anywhere`                                                                                                                                                                                  | Row 145.4 px with a one-line reason, 169.2 px with two                                                                                                                                      | Row 12              |
| 16  | `upload-actions-1`, Retry             | `Button variant="secondary" size="sm" iconLeading={<RetryIcon />} className="ds-file-upload__retry"`, last in `__body`, so it comes before Remove in the tab order                                                                                                                                                                                                    | `align-self: flex-start`, `margin-block-start: --ds-space-inline-sm`: 8 px under the reason with the body's gap                                                                                                                                                                                                           | Left edge on the name's x; 32 px high                                                                                                                                                       | Rows 12, 13         |
| 17  | `upload-actions-1`, Remove            | `div.__actions` holds one `Button variant="ghost" size="sm" iconOnly` with `<CloseIcon className="size-4" />`, in every status                                                                                                                                                                                                                                        | `__actions`: flex, `flex: none`, `margin-block-start: calc(-1 * --ds-space-inline-sm)`. The -4 centres a 32 px button on a 23.8 px first line                                                                                                                                                                             | Centre 0.1 px off the name's first line. The row's height does not depend on it                                                                                                             | Rows 11, 12, 14     |
| 18  | `upload-announce-1`                   | `div.sr-only role="status"`, last child of the root                                                                                                                                                                                                                                                                                                                   | None. It is absolute, so it takes no gap                                                                                                                                                                                                                                                                                  | Nothing visible                                                                                                                                                                             | Rows 3, 13, 15      |
| 19  | `upload-stories-1`                    | `layout: "padded"`, no width decorator, so `FileUpload` fills its column and the sign-off sees 1408 px at 1440. `At360` through `Narrow`. `RecipesAndModes` through `Matrix`                                                                                                                                                                                          | None                                                                                                                                                                                                                                                                                                                      | Page `scrollWidth` less `clientWidth` is 0 in all 176 story shots, and in the 48 readings of section 14 at 320, 360 and 1440 px                                                             | Rows 20, 21         |
| 20  | `upload-copy-1`                       | All 23 keys land in PR 1 (AC row 26). `dropHint` and `dropNow` stay unread until PR 2                                                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                                                                                                      | No middot or em dash                                                                                                                                                                        | Row 26              |
| 21  | Icons                                 | `export const UploadIcon = lucide(Upload, "UploadIcon");` in `icons.tsx`, and the comment's count goes from 46 to 47                                                                                                                                                                                                                                                  | `.ds-button__icon` sizes it                                                                                                                                                                                                                                                                                               | `lucide-react` 1.52.0 ships `dist/esm/icons/upload.mjs`, which closes the spec's "not confirmed"                                                                                            | Row 1               |

## 6. Builder table, PR 2: the drop target (AC rows 27 to 33, with 26, 34, 35)

In PR 1 the zone has a **solid** edge and no drop hint. A dashed edge in PR 1 would promise a drop that does not exist yet, and a real drop would make the browser open the file (`preventDefault` lands in PR 2): that is a look with no backing behaviour. A frame is still needed in PR 1, because AC row 17 asks for the zone's error edge and `DESIGN.md` §7 asks for a danger border with the message. So PR 1 ships a plain frame and PR 2 turns it into a drop target with a one-word change. With one button alone the PR 1 frame looks a little empty (`pr1-empty-*`); that is the honest cost of the split, it has no caller, and it lasts until PR 2 merges. Open question 12 (b), one PR, would remove it.

| #   | Rule                                | Markup                                                                                                                      | CSS and tokens                                                                                                                                                                                      | Target                                                                                                                                                                                                                                                                                                                                                                                                        | Proved by                  |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 22  | `upload-drop-1`, rest               | `p.__hint` renders `fileUpload.dropHint` when the control is neither full nor dragged, and when disabled in its dimmed form | In `.ds-file-upload__zone`, `solid` becomes `dashed`                                                                                                                                                | Hint centred on the Button (0 px off) at 360 and 1440 px, Thai and English. Dashes hold round the corners under neutral and Professional                                                                                                                                                                                                                                                                      | Rows 1, 27                 |
| 23  | `upload-drop-1`, drag               | `data-dragging` on the zone, under the spec's conditions. The hint reads `fileUpload.dropNow`                               | `.ds-file-upload__zone[data-dragging]`: `border-style: solid`, `border-color: --cmp-file-upload-zone-border-drag`. No fill, no width change, so nothing moves; no transition, so it answers at once | Height stays 74 px at 360 and 1440 px, Thai and English. Below the 360 px contract one case moves: at 320 px in English "Drop to add the files" no longer fits beside the Button, so it wraps and the zone grows to 105.8 px while the drag lasts. Accepted, since that width is outside the contract and the rows below move only during a drag. Line shape and word both change, so neither rests on colour | Rows 27, 28, 33            |
| 24  | `upload-drop-1`, drag beats invalid | The rule comes after `[data-invalid]` at the same specificity                                                               | As row 23                                                                                                                                                                                           | A drag over an invalid zone shows the drag edge, and the error edge returns if the drag leaves                                                                                                                                                                                                                                                                                                                | Row 28, by reading the CSS |
| 25  | `upload-drop-1`, disabled and full  | No `data-dragging`                                                                                                          | The edge stays dashed in `zone-border-disabled`. The dashes stay: full and disabled are states of the same frame                                                                                    | No change under a drag                                                                                                                                                                                                                                                                                                                                                                                        | Row 31                     |
| 26  | Token and pairs                     | `zone-border-drag` and its two pairs land here                                                                              | Sections 7 and 9                                                                                                                                                                                    |                                                                                                                                                                                                                                                                                                                                                                                                               | Row 26                     |

## 7. Tokens (`component.json`, after `progress`)

The CSS names come out as `--cmp-file-upload-*`, as `input-group` does. One change from the spec's proposal: `item-radius` is gone and `radius` is `{shape.media.radius}` (amendment A1). No new token beyond the spec's table, no semantic, primitive or profile change.

```json
"file-upload": {
  "$description": "A picker and drop target with a list of files (ORV-227). One radius for the zone and its rows: siblings, and a control box like Textarea",
  "zone-border": { "$type": "color", "$value": "{border.control}" },
  "zone-border-invalid": { "$type": "color", "$value": "{border.error}" },
  "zone-border-disabled": { "$type": "color", "$value": "{border.disabled}" },
  "item-border": { "$type": "color", "$value": "{border.subtle}" },
  "radius": { "$type": "dimension", "$value": "{shape.media.radius}" },
  "padding": { "$type": "dimension", "$value": "{space.inset.md}" },
  "gap": { "$type": "dimension", "$value": "{space.inline.md}" }
}
```

PR 2 adds `"zone-border-drag": { "$type": "color", "$value": "{border.strong}" }`.

## 8. Recipe (`recipes.css`, after the Progress block, before Tag)

This is the CSS that was rendered, with the PR 2 lines marked. It needs no entry in the clip-box rule, because nothing here truncates.

```css
/* File upload (ORV-227) ---------------------------------------------------------------------- */

.ds-file-upload {
  display: flex;
  flex-direction: column;
  gap: var(--cmp-file-upload-gap);
  min-inline-size: 0;
}
.ds-file-upload__zone {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cmp-file-upload-gap);
  padding: var(--cmp-file-upload-padding);
  border: 1px solid var(--cmp-file-upload-zone-border); /* PR 2: dashed */
  border-radius: var(--cmp-file-upload-radius);
}
.ds-file-upload__zone[data-full] {
  border-color: var(--cmp-file-upload-zone-border-disabled);
}
.ds-file-upload__zone[data-invalid] {
  border-color: var(--cmp-file-upload-zone-border-invalid);
}
/* PR 2 adds this rule here:
.ds-file-upload__zone[data-dragging] {
  border-style: solid;
  border-color: var(--cmp-file-upload-zone-border-drag);
}
*/
.ds-field[data-disabled] .ds-file-upload__zone {
  border-color: var(--cmp-file-upload-zone-border-disabled);
}
.ds-file-upload__hint {
  min-inline-size: 0;
  margin: 0;
  color: var(--cmp-field-description);
  font-family: var(--cmp-field-text-type-font-family);
  font-size: var(--cmp-field-text-type-font-size);
  line-height: var(--cmp-field-text-type-line-height);
  font-weight: var(--cmp-field-text-type-font-weight);
  letter-spacing: var(--cmp-field-text-type-letter-spacing);
  overflow-wrap: anywhere;
}
.ds-field[data-disabled] .ds-file-upload__hint {
  color: var(--ds-text-disabled);
}
.ds-file-upload .ds-field__error > span {
  display: block;
}
.ds-file-upload .ds-field__error > span + span {
  margin-block-start: var(--ds-space-inline-sm);
}
.ds-file-upload__list {
  display: flex;
  flex-direction: column;
  gap: var(--cmp-file-upload-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ds-file-upload__item {
  display: flex;
  align-items: flex-start;
  gap: var(--cmp-file-upload-gap);
  padding-block: var(--ds-space-inline-lg);
  padding-inline: var(--cmp-file-upload-padding);
  border: 1px solid var(--cmp-file-upload-item-border);
  border-radius: var(--cmp-file-upload-radius);
}
.ds-file-upload__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  gap: var(--ds-space-inline-sm);
  min-inline-size: 0;
}
.ds-file-upload__name {
  margin: 0;
  color: var(--cmp-field-label);
  font-family: var(--cmp-field-label-type-font-family);
  font-size: var(--cmp-field-label-type-font-size);
  line-height: var(--cmp-field-label-type-line-height);
  font-weight: var(--cmp-field-label-type-font-weight);
  letter-spacing: var(--cmp-field-label-type-letter-spacing);
  overflow-wrap: anywhere;
}
.ds-file-upload__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--ds-space-inline-lg);
  margin: 0;
  color: var(--cmp-field-description);
  font-family: var(--cmp-field-text-type-font-family);
  font-size: var(--cmp-field-text-type-font-size);
  line-height: var(--cmp-field-text-type-line-height);
  font-weight: var(--cmp-field-text-type-font-weight);
  letter-spacing: var(--cmp-field-text-type-letter-spacing);
}
.ds-file-upload__word {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-inline-sm);
}
.ds-file-upload__item[data-status="done"] .ds-file-upload__word {
  color: var(--cmp-progress-done);
}
.ds-file-upload__item[data-status="failed"] .ds-file-upload__word {
  color: var(--cmp-progress-failed);
}
.ds-file-upload__reason {
  margin: 0;
  color: var(--cmp-field-error);
  font-family: var(--cmp-field-text-type-font-family);
  font-size: var(--cmp-field-text-type-font-size);
  line-height: var(--cmp-field-text-type-line-height);
  font-weight: var(--cmp-field-text-type-font-weight);
  letter-spacing: var(--cmp-field-text-type-letter-spacing);
  overflow-wrap: anywhere;
}
.ds-file-upload__retry {
  align-self: flex-start;
  margin-block-start: var(--ds-space-inline-sm);
}
.ds-file-upload__actions {
  display: flex;
  flex: none;
  margin-block-start: calc(-1 * var(--ds-space-inline-sm));
}
```

## 9. Colour pairs (`pairs.ts`, recipe `file-upload`)

Read from the computed tokens under neutral, Professional and Friendly in both modes, 72 pairs, none under its floor. The lowest of the six boundaries is shown. These are browser readings for the builder's list; `pnpm contrast` remains the gate.

| Slot                              | On                  | Lowest ratio             | Floor | PR  |
| --------------------------------- | ------------------- | ------------------------ | ----- | --- |
| `file-upload.zone-border`         | `ds:surface.canvas` | 3.38, neutral light      | 3     | 1   |
| `file-upload.zone-border`         | `ds:surface.card`   | 3.33, Friendly dark      | 3     | 1   |
| `file-upload.zone-border-invalid` | `ds:surface.canvas` | 5.96, neutral light      | 3     | 1   |
| `file-upload.zone-border-invalid` | `ds:surface.card`   | 5.13, Professional dark  | 3     | 1   |
| `progress.done` (done word)       | `ds:surface.canvas` | 5.67, neutral light      | 4.5   | 1   |
| `progress.failed` (failed word)   | `ds:surface.canvas` | 5.96, neutral light      | 4.5   | 1   |
| `field.description`               | `ds:surface.card`   | 5.49, Professional light | 4.5   | 1   |
| `file-upload.zone-border-drag`    | `ds:surface.canvas` | 13.98, Professional dark | 3     | 2   |
| `file-upload.zone-border-drag`    | `ds:surface.card`   | 10.21, Professional dark | 3     | 2   |

The "Not listed" comment in `pairs.ts` names two: `file-upload.zone-border-disabled`, as the spec says, and `file-upload.item-border` (amendment A4), a `border.subtle` hairline that carries no state: a row is identified by its text and its Remove button. The reason text and the Field error use `field.error`, whose canvas and card pairs exist.

## 10. States

Selected does not apply to any part: nothing here is chosen. Nothing in the control uses `surface.selected` or `selection.*`.

| Part             | Default                                                                    | Hover                                                           | Focus                                                           | Disabled                                               | Loading                                         | Empty                                           | Error                                                      | Success                                         |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Zone             | Edge in `zone-border`, solid in PR 1, dashed in PR 2                       | None: a press on it does nothing, and a hover would promise one | None of its own: it takes no focus                              | Edge `zone-border-disabled`, hint in disabled ink      | Not applicable                                  | The state at rest, the Button inviting a choice | Edge `zone-border-invalid`, lines under it                 | Not applicable                                  |
| Zone, PR 2 extra |                                                                            | Drag: solid, `zone-border-drag`, the word `dropNow`             |                                                                 | No drag state                                          |                                                 |                                                 | Drag beats the error edge                                  |                                                 |
| Zone, full       | Edge `zone-border-disabled`, hint `fileUpload.full` in `field.description` | None                                                            | The Button keeps it                                             | Disabled wins                                          |                                                 |                                                 | Error edge wins, with refused lines                        |                                                 |
| Choose           | `Button` secondary md                                                      | `Button`                                                        | Line and halo; the zone's 16 px padding holds it, nothing clips | `disabled`; `aria-disabled` when full, still focusable | Not applicable                                  |                                                 | Takes no `aria-invalid`; the input does (`upload-field-1`) |                                                 |
| Row              | Hairline box, no fill                                                      | None: the row does nothing                                      | Only its Buttons                                                | Text unchanged, Buttons disabled                       | Uploading: the bar, the percent or "กำลังทำงาน" | No `ul`                                         | Failed: mark, word, reason in danger ink, edge unchanged   | Done: tick and word, only from `status: "done"` |
| Retry            | `Button` secondary sm                                                      | `Button`                                                        | Line and halo, inside the row's padding                         | `disabled`                                             | Unmounts when pressed, which blocks a repeat    |                                                 |                                                            |                                                 |
| Remove           | `Button` ghost sm icon                                                     | `Button`                                                        | Line and halo, inside the row                                   | `disabled`                                             |                                                 |                                                 |                                                            |                                                 |
| Refused lines    | Danger ink, block lines                                                    | None                                                            | None, an alert takes no focus                                   | Absent                                                 |                                                 | Unmounted with no line                          | Are the error                                              |                                                 |

Focus stays on the `Button` recipe, with no override. The focus shots show the line and halo whole on Choose, full Choose, Retry and Remove under both profiles and modes.

## 11. Content at every line count

Measured on the proposed render, neutral, light. The `long` story holds `fixtures.longThai` and `fixtures.longLatin` with `.png` added, the mock reason three times over, a missing size and a refused long name.

| Case                                                | 360 px, Thai                   | 360 px, English | 1440 px, Thai       |
| --------------------------------------------------- | ------------------------------ | --------------- | ------------------- |
| Zone, hint beside the Button                        | 74                             | 74              | 74                  |
| Zone, full, hint wraps under                        | 105.8                          | 105.8           | 74 (it fits beside) |
| Row, uploading, one-line name                       | 89.6                           | 89.6            | 89.6                |
| Row, done, one-line name                            | 77.6                           | 77.6            | 77.6                |
| Row, failed, mock reason                            | 145.4 (1 reason line)          | 169.2 (2)       | 145.4 (1)           |
| Row, uploading, long Thai name                      | 137.2 (3 name lines)           | 137.2 (3)       | 89.6 (1)            |
| Row, done, long Latin name                          | 125.2 (3 name lines)           | 125.2 (3)       | 77.6 (1)            |
| Row, failed, long name, the mock reason three times | 240.6 (3 name, 3 reason lines) | 288.2 (3, 5)    | 145.4 (1, 1)        |
| Body width beside Remove                            | 254                            | 254             | 1334                |

English at 1440 px reads the same as the Thai column. At 320 px, below the contract, nothing overflows either: body 214, zone 74, full zone 105.8 (Thai) and 129.6 (English), the drag word 105.8 in English (section 6, row 23), the long rows 161 (4 name lines), 125.2, and 264.4 in Thai or 312 in English.

- **Long names** wrap. They are not truncated: the file name is the only way to tell two rows apart, and wrap needs no clip box, which is the safe form for Thai marks (`DESIGN.md` §4). The percent holds its place on the first line, and Remove stays on the name's first line.
- **A row shrinks 12 px when uploading turns done**, because the bar leaves (`upload-item-1`, "No bar"). Holding the height would leave a blank band in every finished row. There is no animation, so rows below move once. Accepted.
- **Reduced motion.** The control adds no motion. The only moving part is `Progress`'s indeterminate sweep, which its recipe already stops, leaving the word to carry the state. All shots ran under `reducedMotion: "reduce"`, so a stopped bar reads as a 40% fill beside "กำลังทำงาน". That is `Progress` as it stands, not changed here.
- **Forced colours.** The dashed and solid difference is a line style and should survive; not run.

## 12. Answers to the open questions

All thirteen stay on their defaults. The three that touch the look:

- 10: the drag wording shows at every width. `dropHint` fits beside the Button at 320 px and up in both languages; `dropNow` does too, except at 320 px in English, where it wraps under the Button (section 6, row 23).
- 11: no processing, cancel or queued look.
- 12: two PRs, as sections 5 and 6 split them. Option (b) would also remove the interim frame of section 6; the main session owns that choice.

## 13. Amendments to the spec

None changes a rule's behaviour. A3 and A5 are needed for a play or the sign-off to be correct as written.

| #   | Where                                                      | Change                                                                                                                                                                                                                                                                                                                                                                            | Why                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | "Contract changes and impact", row "Component token group" | Drop `item-radius`. `radius` becomes `{shape.media.radius}`                                                                                                                                                                                                                                                                                                                       | Section 2, rendered. The row calls its values proposals                                                                                                                                                                                                                  |
| A2  | Same table, row "Recipe classes"; `upload-actions-1`       | Add `__retry`. `__actions` holds Remove only; Retry is the last child of `__body`. Add `--cmp-field-label-type-*`, `--ds-text-disabled` and `--ds-space-inline-*` to what the recipe reads                                                                                                                                                                                        | Section 2: Retry beside its reason at every width                                                                                                                                                                                                                        |
| A3  | AC rows 6 and 9                                            | Row 6: "the alert is empty after the second pick" becomes "`queryByRole("alert")` is null after the second pick". Row 9: "after Remove the alert has no text" becomes "after Remove no alert is in the canvas"                                                                                                                                                                    | `Field` mounts `p role="alert"` only when there is an error, and `upload-field-1` keeps `Field` unchanged, so `getByRole("alert")` would throw. Row 31's "no alert text" reads true as it stands                                                                         |
| A4  | Same table, row "New pairs"                                | `pairs.ts`'s comment also names `file-upload.item-border`                                                                                                                                                                                                                                                                                                                         | Section 9                                                                                                                                                                                                                                                                |
| A5  | AC row 20, and "Depends on"                                | Add: for each of `.ds-progress__label`, `.ds-file-upload__name`, `.ds-file-upload__reason` and `.ds-file-upload__word`, `expectFrameCutsNoInk(el, el.closest(".ds-file-upload__item"))`; for `.ds-field__description`, `expectFrameCutsNoInk(el, frame)` with the row's 360 px frame. PR 2 adds `.ds-file-upload__hint`, frame `.ds-file-upload__zone`. "Depends on" names PR 186 | `expectLabelInkWhole` reads its own clone and cannot see a clip on an ancestor, and `expectLinesClear` shoots its own clone too. Row 20's `overflow` check sees a declared clip; this one measures the ink. Row 20 is the only row that proves text whole inside a frame |
| A6  | AC rows 34 and 16, "Rows per PR"                           | In the PR 1 walk, row 34's "the dashed edge and the solid drag edge differ without colour" does not apply; it moves to the PR 2 walk. Row 16's "hint in disabled ink" also moves to PR 2, because story `Disabled` holds one item, so in PR 1 it has no hint to read. The rest holds in PR 1                                                                                      | Section 6                                                                                                                                                                                                                                                                |
| A7  | "Contract changes and impact", row `UploadIcon`            | Replace "not confirmed" with: `Upload` is in `lucide-react` 1.52.0                                                                                                                                                                                                                                                                                                                | Read at `dist/esm/icons/upload.mjs`                                                                                                                                                                                                                                      |

PR 1 needs PR 186 on its base for A5, because the helper does not exist on this branch yet.

## 14. Proof rendered for this design

Rendered on a local Storybook (port 6435, stopped after) with the real `Field`, `Button`, `Progress` and icons, imported from the dev server and mounted into the surface of `base-progress--determinate`, with the CSS of sections 7 and 8 through `addStyleTag`. No packages file changed. 360 px shots are at 2x, 1440 px at 1x, all under reduced motion. File form: `<phase>-<story>-<width>-<locale>-<mode>-<profile>.png`.

What this is not: `FileUpload` does not exist, so the composition is a harness, with copy typed from the Copy table and `data-dragging` set by hand. No real drag ran. The hidden input and the status region were not mounted (neither has a look). No a11y addon, no screen reader, no play. Friendly was read for contrast only, not shot.

| Set     | Stories                                                                                             | Profiles              | Widths    | Locale | Modes       | PNGs |
| ------- | --------------------------------------------------------------------------------------------------- | --------------------- | --------- | ------ | ----------- | ---- |
| PR 1    | empty, uploading, done, failed, rejected, rejectedfold, full, fullrejected, disabled, invalid, long | neutral, professional | 360, 1440 | th     | light, dark | 88   |
| PR 2    | empty, dragover, full, fullrejected, disabled, invalid, long                                        | neutral, professional | 360, 1440 | th     | light, dark | 56   |
| Focus   | Choose, Choose when full, Retry, Remove                                                             | neutral, professional | 360, 1440 | th     | light, dark | 48   |
| English | PR 1: uploading, failed, rejected, long. PR 2: empty, dragover, full, long                          | neutral               | 360, 1440 | en     | light, dark | 32   |

- Contact sheet: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/contact-sheet.png`
- All 224 PNGs: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/shots/`
- Readable sheets by state: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/sheets/` (`a` PR 2 rest, `b` list, `c` long, `d` refused, `e` full and refused, `f` focus, `g` PR 2 at 1440, `h` PR 1 at 1440, `i` PR 1 rest, `j` English)
- Proposed CSS and harness: `proposed.css`, `proposed-pr2.css`, `board.js`, `shoot.mjs`, `measure.mjs`, `measure2.mjs` in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-design-1/`

Measured by `measure2.mjs`, 48 readings (8 stories at 320, 360 and 1440 px, Thai and English, neutral, light): root 16 and inner 33 for label, zone, row, Choose, name, Retry and a wrapped hint, at every width and locale; page overflow 0; hint centred on the Button (0 px off) wherever it sits beside it; the percent level with the first name line (0 px off) at every name length; Remove 0.1 px off the first name line in the `failed` and `full` stories. Contrast comes from `measure.mjs` (section 9).

Read on the sheets: Thai stacks whole in "โลโก้ปิ่นโต้" and "พื้นที่ร้าน" at 2x; dashed and solid apart in both modes under both profiles; the Professional square control and 8 px radius hold the same layout, so nothing here assumes a pill; dark rows hold their hairline; the 3 px halo whole on all four focus targets.

## 15. Critique against the tells (`DESIGN.md` §9)

- Card kit (3): the zone and rows share a radius, have no fill and no shadow, and the rows are one list. A stack of five does read as boxes; each is a separate object with its own actions, so the box is earned, and it is a hairline only.
- Template chrome (4): no eyebrow, no middot. The size and the word are apart by a 12 px gap.
- Ambient motion (6): none added. `motion.li` stays out.
- Lime as status (8), Studio style in a preview (10): no brand or Studio token is read. The bar's fill is `Progress`'s own and follows the profile.
- Fake evidence (11): the done word only from `status: "done"`; 100% stays uploading in the shots.
- Thai with Latin rules (9): 1.7 on everything that can wrap, no tracking.
- Left out: a zone icon, a drag fill, a failed-row ring, a hover on the zone. Only the ring was rendered.

## 16. Screens for visual QA (AC row 34)

Each at 360 and 1440 px, light and dark, Thai and English, neutral and one other profile. Name them `<phase>-<story>-<width>-<locale>-<mode>.png`. Compare with the contact sheet.

| Story             | Look for                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Empty`           | PR 1 solid frame; PR 2 dashed, the hint centred on the Button                                                                    |
| `Uploading`       | Percent on the first line; "กำลังทำงาน"; 100% with no tick; the bar stops before Remove                                          |
| `Done`            | Tick and word; "ไม่ทราบขนาด" in the size's place                                                                                 |
| `Failed`          | Mark, word, reason in danger ink; Retry under the reason on the name's x; edge unchanged; Tab to Retry and to Remove, halo whole |
| `Rejected`        | Lines directly under the zone and above the list; the error edge; 5 lines and the fold                                           |
| `Full`            | Dimmed Button, hint in full ink; at 360 px the hint under the Button on one start edge; Tab, line and halo on the inert Button   |
| `Disabled`        | Dim label, limits, edge and hint; the row's words stay readable                                                                  |
| `Invalid`         | The caller's line 8 px under the zone                                                                                            |
| `At360`           | Long names wrap inside the row; Remove stays up top; no mark cut                                                                 |
| `DragOver` (PR 2) | Solid ink edge; height unchanged; the word changes                                                                               |
| `RecipesAndModes` | Friendly, which no shot here covers: its 16 px media radius and pill Button                                                      |

## 17. Rework F1: focus on the inert Button

From ORV-227-signoff-1 finding F1 (ORV-227 comment 10554), recorded by the main session from the sign-off's own proposal and proof.

The Button's disabled border rule (0,4,0) beats the focus rule (0,3,0), so a focused `aria-disabled` Button shows the halo with no line. Spec row 34 asks for the line and the halo on each button. The rule below goes in the Button recipe after the variant blocks, at the focus rule near `recipes.css` line 182, so equal specificity and later order win:

```css
.ds-button[data-variant][aria-disabled="true"]:focus-visible {
  border-color: var(--ds-focus-ring);
}
```

The Button stays dimmed. The sign-off proved this by injection on `Full` in 8 shots (360 and 1440, light and dark, neutral and professional, Thai): the border equals the ring in each, and the strongest focus pixel against its ground reads 6.14 to 11.91. An injected tag sits last, so the proof does not show file order. The recipe is shared, so every `aria-disabled` Button story is read: `Button.stories.tsx` line 179, CanvasChat, TaskBar, DirectionStudio.

Shots: `proposed-full-choose-{360,1440}-{light,dark}-{neutral,professional}.png` in `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv-227-signoff-1/extra/focus-crops/`.

## Changelog

- 1.1 (2026-11-06): section 17 and the `Full` line of section 16, from sign-off finding F1.
- 1.0 (2026-11-06): first version, from spec v1.0.
