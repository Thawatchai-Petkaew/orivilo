---
issue: ORV-227 (https://tpetkaew.atlassian.net/browse/ORV-227)
lane: as set on ORV-227 in Jira (not read in this role). By this spec's reading the risk flag "component public API" applies (AGENTS.md, "Lanes and gates"), because `FileUploadProps` is a new public contract; G1 and G2 pass under the owner's delegation during the POC (ADR 0012 decision 4). No semantic token, profile, schema, resolver, auth or data access changes
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_rows: docs/specs/ORV-64/audit.md section D.3 row 24; section A.1 rows Image picker and File upload
version: 1.2
design: docs/specs/ORV-227/design.md v1.0; its amendments A1 to A7 and the answers of its section 12 are taken in here
---

# ORV-227: File upload, a list with progress, failed items, retry, and size and type limits

## Benchmark

This table follows the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The Untitled UI and shadcn/ui cells come from K-0260 to K-0287, as K-0288 sums them up, and each cell names its entry. The Ours row is the repo on this branch. The Add and Do not copy rows are this spec's choices, and each one names the rule in "Rules" that holds it.

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | Page: <https://www.untitledui.com/react/components/file-uploaders>. Variants: two list items, `ListItemProgressBar` and `ListItemProgressFill`, and `fileIconVariant` (K-0260, K-0261). Sizes: none stated (K-0260). States, zone: default, dragging over (brand ring), disabled, invalid (the hint turns the error colour) (K-0263, K-0264). States, item: uploading, complete, failed (K-0261, K-0262). Slots: none named; `hint` is a string prop (K-0260). List: a controlled `ul` of `motion.li` with `name`, `size` in bytes and `progress` 0 to 100 (K-0261). Failed: boolean `failed`, error ring, fixed text, no reason prop (K-0262). Retry: "Try again" calling `onRetry`; delete in every state, named "Delete" (K-0262). Limits: `accept`, `maxSize` in bytes, size checked first, callbacks for rejected files, no file count limit (K-0263). Keyboard and screen reader: a sr-only input and a "Click to upload" Button beside native drag events, no ARIA on the zone, no `aria-live`, no name on the bar (K-0264, K-0265). Second route: `FileTrigger`, its input `display: none` (K-0266). Not read: the API tables on this page and on <https://www.untitledui.com/react/components/inputs>, and the demos `FileUploadInputDemo`, `MaxSizeLimitDemo` and `ImagesOnlyDemo` (K-0260, K-0266). This row is not filled from memory, so the props above come from the FAQ text and the source file, not from a props table. |
| shadcn/ui | Pages: <https://ui.shadcn.com/docs/components/radix/attachment> and <https://ui.shadcn.com/docs/components/radix/input>. No dropzone or upload component; a plain `Input type="file"` example with no limits (K-0267). Attachment is a display and picks nothing: parts Media, Content, Title, Description, Actions, Action, Trigger, Group (K-0268). Variants: media `icon`, `image`; orientation horizontal, vertical (K-0268). Sizes: `default`, `sm`, `xs` (K-0268). States: `idle`, `uploading`, `processing`, `error`, `done` (K-0269). Slots: the parts, with `className` on each (K-0268). Progress: no prop, a percent only in sample text; a `Progress` with a Field label is a separate part (K-0269, K-0271). Failed and retry: `error` with a destructive treatment, the reason kept in `AttachmentDescription`, retry, cancel and remove as sample actions (K-0269, K-0270). Limits: none (K-0267, K-0268). Keyboard and screen reader: the docs ask for `aria-label` on actions and trigger, the source sets no role or live region (K-0270). Errors: `FieldError` with role alert, `aria-invalid` (K-0271). Radix under it: no file part (K-0272); Progress has no failed state and sets no name (K-0273); Form moves focus to the first invalid control and has no file text (K-0274). |
| Ours | Catalog: File upload `none` (`packages/design-system/catalog/coverage.md` line 37). `MissingInputsPrompt` says uploads come later and offers skip only (`MissingInputsPrompt.tsx` lines 130 to 134). One `type="file"` under `apps/web` and `packages/design-system`: the directions import (`apps/web/app/directions/SavedStudio.tsx` lines 374 to 392), one JSON file, `sr-only`, `tabIndex={-1}`, `aria-hidden`, opened by a `Button` with loading, a hint by `aria-describedby`, `MAX_FILE_BYTES = 256_000` (line 50), one `invalid-file` notice. Parts: `Progress` (`label` required, `size` sm or md, `status` running, done or failed, Radix underneath, its `role="status"` holding the done or failed word only); `Field` (label, description, error with role alert, `aria-invalid`; its `children` comment names Input, Textarea or Select); `Button` (`iconLeading`, `iconOnly` with a required `aria-label`, a caller's `aria-disabled` keeps it focusable and inert); `RetryIcon`, `TrashIcon`, `CloseIcon`, `CheckIcon`, `WarningIcon`; no file or upload icon in `icons.tsx`. Limits decided: ADR 0009 point 5. No such bound is in code (K-0288, Ours), and no upload path exists (ADR 0015 decision 11). |
| Add | A visible picker on a real file input, one Tab stop: `upload-input-1`. A drop zone around that picker, never instead of it: `upload-drop-1`. The limits as text before any choice, built from one object: `upload-limits-1`. A check before the wait, with the real check named as the server's: `upload-judge-1`, `upload-server-1`. A rejected file named, with its reason and its fix, in text and in an alert: `upload-reject-1`. A way to be stopped at the count limit that says what to do: `upload-count-1`. A list item with uploading, done and failed, a reason in text: `upload-item-1`. Retry and remove that name the file and keep focus: `upload-actions-1`. A bar per row named by the file (K-0283), through `Progress`: `upload-item-1`. Progress reaching a screen reader through a polite region, since the bar is not one (K-0278): `upload-announce-1`. A size text that cannot read at the limit when the file is over it: `upload-size-text-1`. The same file can be chosen twice (K-0266): `upload-input-1`. Weighed and left out: `processing`, cancel and a queued `idle` item (K-0269), open question 11; a size prop, since no screen asks for one and Untitled UI states none (K-0260). |
| Do not copy | Oversized files dropped silently when a callback is missing (K-0263): SC 3.3.1 wants the error in text (K-0279), `upload-reject-1`. A rejection shown only by the hint's colour (K-0263): K-0279, and `DESIGN.md` section 7 bars colour alone. The default hint "SVG, PNG, JPG or GIF (max. 800x400px)" (K-0263): it does not match ADR 0009 point 5, `upload-limits-1`. A bar with no name (K-0265, K-0273): progressbar requires one (K-0283). Hard-coded English strings (K-0261, K-0264): `AGENTS.md`, every UI string comes from the locale catalog. "Uploading [,] 64%" and "Uploaded [,] 1.8 MB", where `[,]` stands for a middot in the sample (K-0269): `AGENTS.md` bars the middot in UI text. Floored sizes (K-0261): a 4.9 MB file would read 4 MB beside the limit, `upload-size-text-1`. "Complete" shown because progress reached 100 (K-0261): a success state with no backing data, `upload-item-1`. A failed item with one fixed text and no reason (K-0262): K-0279 and K-0280 ask for the error and a known fix. A delete named "Delete" with no file (K-0262): K-0270 asks for "the action and its target", `upload-actions-1`. `aria-grabbed` and `aria-dropeffect` (K-0284): deprecated. A role on the file input (K-0285): not allowed. The meter role for progress (K-0282): the APG says progressbar. Role alert on progress updates (K-0277): listed as a failure for content not important and time-sensitive, `upload-announce-1`. A shimmer with no reduced-motion class (K-0270): K-0116 records C39, and the `shimmer` definition was not read. `motion.li` on the list (K-0261): `DESIGN.md` section 9 item 6, `upload-item-1`. An input left in the tab order beside its button (K-0264): two stops, and the own reading in K-0264 finds no focus style on it. `fileIconVariant` (K-0260): three image kinds need no icon set, and `icons.tsx` has none. |

Standards the rules rest on, none of them a conformance claim (security rule 16): `input type=file` has no role and may carry `aria-invalid` (K-0285); `accept` is a hint (K-0286); the APG has no file or drag pattern (K-0282); SC 2.5.7 and SC 2.1.1 are judged apart (K-0275, K-0276); SC 4.1.3 covers progress and errors (K-0115, K-0277); ARIA25 puts file upload progress in a polite live region (K-0278); role status is polite and takes no focus (K-0114); SC 3.3.1, 3.3.3 and 3.3.2 ask for the item and the error in text, known corrections, and instructions on allowed input (K-0279, K-0280, K-0281). Nothing in K-0260 to K-0288 was run in a browser or with a screen reader.

## Goal

A person giving ORIVILO a brand needs to hand it pictures: a current logo, a mood board, photos of a shop. The Studio can only say "later" today (`prompt.uploadLater`), and audit D.3 row 24 asks for the control that comes first. This story builds `FileUpload`: a person sees the limits before choosing, chooses or drops files, sees each file's progress, learns in words why a file was refused and how to fix it, and can try a failed file again. Done when the limits shown match ADR 0009 point 5 and a failed item offers retry.

What is simulated: everything after the choice. `FileUpload` shows limits and state and uploads nothing. No server path exists (ADR 0015 decision 11), so the progress, done and failed states in stories are mock data from a story driver. The check before the wait is a courtesy, not a security control (`upload-server-1`).

## Story

As a person adding brand images, I see which files are welcome before I choose. I press "เลือกไฟล์" or drop files on the zone, I watch each one's progress in a list, and when one fails or is refused I read why and I can try again or take it out.

## Rules

### upload-limits-1

`FileUpload` takes a required `limits` object, `FileUploadLimits`. `IMAGE_UPLOAD_LIMITS`, in `src/components/file-upload/limits.ts`, holds the three limits of ADR 0009 point 5 that a person can act on:

- `maxFiles`: 5.
- `maxBytes`: the value of `upload-size-1`.
- `types`: PNG (`image/png`, `.png`), JPEG (`image/jpeg`, `.jpg`, `.jpeg`), WebP (`image/webp`, `.webp`).

The line `fileUpload.limits` shows in every state, before any choice, as the Field description, and it is built from `limits`, never typed: `{types}` is the labels joined by ", ", `{size}` is `maxBytes` through `upload-size-text-1`, `{count}` is `maxFiles`. The other lines of point 5 (the magic byte check, the 1568 px long edge, EXIF, signed URLs) are server steps that no code does yet, so the UI says nothing about them: no "we resize your image" text. Worked example W6.

### upload-size-1

One MB is 1,000,000 bytes, so `maxBytes` is 4,000,000. A file of exactly that size passes and one byte more is refused. This is the smaller of the two readings of "4 MB", so a file that passes here passes under either (open question 1, W2).

### upload-size-text-1

One helper, `fileSizeText(bytes, locale, m)` in `limits.ts`, writes every size on screen. `kb` is `Math.ceil(bytes / 100) / 10`. When `kb` is under 1000 the text is `fileUpload.sizeKb` with `formatNumber(kb, locale)`. Otherwise it is `fileUpload.sizeMb` with `formatNumber(Math.ceil(bytes / 100_000) / 10, locale)`. Sizes round up to one decimal place, so a file over the limit never reads at or under it. Worked example W1.

### upload-judge-1

`judgeFiles(files, limits, used)` in `src/components/file-upload/judge.ts` is pure and takes `File`-shaped objects. It walks the files in the order the browser gives them and gives each one result, in this order:

1. Refused for `type` unless `file.type`, lowercased, equals a rule's `mime`, or `file.type` is empty and the lowercased name ends with one of a rule's extensions.
2. Refused for `size` when `file.size` is over `limits.maxBytes`.
3. Refused for `count` when `used` plus the files accepted so far has reached `limits.maxFiles`.
4. Otherwise accepted.

A refused file takes no slot. It returns `{ accepted, rejected }`, each `rejected` entry holding `name`, `size` and `reason`. A pick and a drop run the same function. `onFiles` is called once with `accepted`, and is not called when `accepted` is empty. Worked example W3.

### upload-count-1

`used` is `items.length`, whatever each item's status: a failed item keeps its slot, since retry can bring it back. A pick that would pass the limit keeps files until the list is full and refuses the rest by name (`upload-judge-1`, `upload-reject-1`). When `items.length` has reached `limits.maxFiles` the control is full: the Choose button takes `aria-disabled`, stays focusable and opens nothing, the input takes `disabled` so a press on the label opens nothing either, and the zone's hint is `fileUpload.full`, linked to the button by `aria-describedby`. Point 5 bounds one model request; this story reads the list as one request, which is open question 2.

### upload-server-1

The component shows limits and state only. It never reads a file's bytes, never calls the network, and sends nothing. `accept` is a hint (K-0286) and `file.type` is what the browser reports, so a person can pass both. `judgeFiles` saves a person a wait and is not a security check. The real checks stay on the server: the type by magic bytes, the size cap and the count (ADR 0009 point 5, ADR 0015 decision 11, `.claude/rules/security.md` rule 10). No such check exists in code today, and no AC row, story or catalog line claims one.

A file name is untrusted. It renders as a React text child only, and is never used as HTML, a URL or a storage key. The story driver is labelled as a mock in `fixtures.ts`, and in the story meta's docs description ("Mock upload: nothing leaves the browser").

### upload-input-1

The file input is a native `<input type="file" multiple>`, hidden as `SavedStudio.tsx` hides it: `className="sr-only"`, `tabIndex={-1}`, `aria-hidden`, no `role` (K-0285), never `display: none` (open question 4). `accept` is each rule's `mime` then its extensions, joined by "," (W5).

The picker is a `Button` `variant="secondary"` `size="md"` with `iconLeading={<UploadIcon />}` and the visible text `fileUpload.choose`; a press calls `input.click()`. It is the control's one Tab stop. Its accessible name is `fileUpload.chooseLabel`, which starts with the visible text and, in Thai, has a space after it (the `label-content-name-mismatch` finding of ORV-217 `copy-name-1`). The input's value is set to `""` after every change, so the same file can be chosen again (K-0266).

### upload-field-1

`FileUpload` renders one `Field` itself, with `label`, the limits line as `description`, the lines of `upload-reject-1` as `error`, and `disabled`. The input takes the Field's `id`, so a press on the label opens the picker. The Button is not the Field's control, because a `label` pointing at it would replace its name and drop the visible text. It reads `describedBy` from `useFieldControl`, so the error and the limits reach it by `aria-describedby`. `aria-invalid` stays on the input, which K-0285 allows; the Button does not take it. `Field` changes only in its `children` comment.

### upload-reject-1

Each refused file gets one line in the Field's error slot: `fileUpload.rejectType`, `rejectSize` or `rejectCount`, each naming the file, the reason and the fix. A caller's `error` comes first, then the refused files in browser order. Each line is a `span.ds-file-upload__rejected` shown as a block inside the Field's `p role="alert"`. At most `REJECT_LINES` (5) lines show; the rest fold into `fileUpload.rejectMore`.

The lines are replaced by the next pick or drop, and cleared by a press on any Remove button. A press on Retry leaves them. Files accepted in the same pick go on as usual.

### upload-item-1

`items` is owned by the caller and renders in its order, in a `ul` named `fileUpload.listLabel`. With no items there is no `ul`. There is no list animation. Each item holds `id`, `name`, an optional `size` (when absent the size text is `fileUpload.sizeMissing`) and a `status`:

- `uploading`, with an optional `progress` from 0 to 100: `Progress` `size="sm"`, `label={name}`, `value={progress}`, status running, which also shows "กำลังทำงาน" when `progress` is absent. Under it the size. Remove.
- `done`: name, size, `CheckIcon` and `fileUpload.done`. Remove. No bar.
- `failed`, with a required `reason` string: name, size, `WarningIcon` and `fileUpload.failed`, then `reason`. Retry and Remove. No bar (K-0262).

The done word shows only when the caller sets `status: "done"`. An `uploading` item at `progress` 100 reads "100%" and stays uploading, with no check and no done word. `Progress` is unmounted before an item is done or failed, so its own status word never speaks: `upload-announce-1` is the one voice, because that word carries no file name.

### upload-actions-1

Retry: a `Button` `variant="secondary"` `size="sm"`, `iconLeading={<RetryIcon />}`, visible text `fileUpload.retry`, name `fileUpload.retryLabel`, on every failed item. It takes the class `ds-file-upload__retry` and is the last child of `__body`, under the reason, so it comes before Remove in the tab order. A press calls `onRetry(id)`, and the caller sets the item to `uploading` in the same handler, which unmounts Retry and blocks a repeat press. Focus then moves to that row's Remove button.

Remove: a `Button` `variant="ghost"` `size="sm"` `iconOnly`, `CloseIcon`, `aria-label` from `fileUpload.removeLabel`, in every status, and the only child of `__actions`. A press calls `onRemove(id)`; stopping an upload that is running is the caller's job. When the item leaves `items`, focus moves to the Choose button, never to the page.

`disabled` disables Retry and Remove too.

### upload-announce-1

One `div.sr-only` with `role="status"`, always mounted and empty at first, is the control's voice. `announcements(prev, next, m, locale)` in `src/components/file-upload/announce.ts` is pure, compares items by `id`, and returns lines in item order, joined by a space into the region's text in one update:

- An item new since `prev`, or whose status changed: `fileUpload.announceStart` for `uploading`, `announceDone` for `done`, `announceFailed` with its `reason` for `failed`.
- An item that stays `uploading` with a numeric `progress` both times, while it is the only `uploading` item in `next`: `announceProgress` when `Math.floor(progress / 25)` rose, with `{percent}` as `formatPercent(step / 4, locale)`, where `step` is that floor (`formatPercent` takes a ratio). With two or more uploading items no percent is announced.

Items present at first render announce nothing, and an empty result leaves the text as it was. No percent ever goes through role alert (K-0277). Open question 6, W4.

### upload-drop-1

`div.ds-file-upload__zone` holds the Choose button and the hint. It has no role, no `tabIndex` and no ARIA attribute, and a press on the zone outside the button does nothing. The drag has no keyboard route of its own; the Choose button is the route for keyboard and for a single pointer, so nothing needs the drag (open question 5).

A drag counts only when `dataTransfer.types` holds `"Files"`. While a counted drag is over the zone and the control is neither disabled nor full, the zone has `data-dragging`, its edge turns from dashed to solid, and the hint reads `fileUpload.dropNow` in place of `fileUpload.dropHint`. It ends when the drag leaves the zone (a `dragleave` whose `relatedTarget` is inside the zone does not end it) or on drop.

`dragover` and `drop` call `preventDefault` in every state, so the browser never opens the file in place of the page. A drop runs `upload-judge-1`; a drop on a disabled control does nothing else, and a drop on a full one refuses by `upload-count-1`.

### upload-stories-1

Story title `Base/File upload` (id `base-file-upload`) in `src/components/file-upload/FileUpload.stories.tsx`. The title has a space because Storybook builds the id from it: without the space the id would be `base-fileupload`, which the catalog's `story` field does not name (W7). `Base/Password input` and the other two-word components have the same form. Stories come in Thai and English twins, the English one nesting `LocaleProvider locale="en"`. The set is the table "Stories" under "Acceptance criteria". Fixtures are `fileUploadFixtures` in `src/components/fixtures.ts`: Thai, Latin, `fixtures.longThai` and `fixtures.longLatin` as file names, Thai with stacked marks, and an item with no `size` (the missing value).

### upload-copy-1

23 new keys go in a new `fileUpload` group in `src/i18n/messages/th.ts` and `en.ts` (table "Copy"). The component owns no other copy; `reason` and `error` are the caller's, from the caller's catalog. `prompt.uploadLater` stays, since no upload exists yet.

## Contract changes and impact

```ts
export interface FileUploadLimits {
  maxFiles: number;
  maxBytes: number;
  types: readonly { label: string; mime: string; extensions: readonly string[] }[];
}

export type FileUploadItem = { id: string; name: string; size?: number | undefined } & (
  | { status: "uploading"; progress?: number | undefined }
  | { status: "done" }
  | { status: "failed"; reason: string }
);

export interface FileUploadProps {
  /** Always visible; also the end of the Choose button's name. */
  label: string;
  limits: FileUploadLimits;
  items: readonly FileUploadItem[];
  onFiles: (files: File[]) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  error?: ReactNode | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}
```

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| New public API: `FileUpload`, `FileUploadProps`, `FileUploadItem`, `FileUploadLimits`, `IMAGE_UPLOAD_LIMITS` | Component API | `src/components/file-upload/` (`FileUpload.tsx`, `limits.ts`, `judge.ts`, `announce.ts`, the stories and the unit tests), `src/index.ts`. No existing caller. `MissingInputsPrompt` and `SavedStudio.tsx` do not change |
| Component token group `file-upload` (new, reason: no group names a drop zone's edge): `zone-border` `{border.control}`, `zone-border-drag` `{border.strong}`, `zone-border-invalid` `{border.error}`, `zone-border-disabled` `{border.disabled}`, `item-border` `{border.subtle}`, `radius` `{shape.media.radius}`, `padding` `{space.inset.md}`, `gap` `{space.inline.md}` | Component token | `component.json`, `generated.css` through the tokens build. Each reference is an existing semantic name; no semantic token, primitive or profile changes. The values are those of `design.md` section 7 |
| Recipe classes `ds-file-upload`, `ds-file-upload__zone`, `__hint`, `__list`, `__item`, `__body`, `__name`, `__meta`, `__word`, `__reason`, `__retry`, `__actions`, `__rejected`, and the attributes `data-dragging`, `data-invalid`, `data-full`, `data-status` | Recipe | `recipes.css` only. Text reuses `--cmp-field-label`, `--cmp-field-label-type-*`, `--cmp-field-description`, `--cmp-field-error` and `--cmp-field-text-type-*`; the done and failed words reuse `--cmp-progress-done` and `--cmp-progress-failed`; the recipe also reads `--ds-text-disabled` and `--ds-space-inline-*` |
| New pairs under recipe `file-upload`: zone edge, drag edge and invalid edge on `ds:surface.canvas` and on `ds:surface.card` at the UI floor; done word and failed word on `ds:surface.canvas` at the text floor (the card pairs exist under `progress`); `field.description` on `ds:surface.card` at the text floor, which `pairs.ts` does not list today | Recipe | `pairs.ts`, `recipes.test.ts`, `pnpm contrast`. `zone-border-disabled` gets no pair: like `border.disabled` on any control it does not carry the state, the disabled button and disabled text do; `pairs.ts` records that in a comment. The same comment names `item-border`, a `border.subtle` hairline that carries no state: a row is identified by its text and its Remove button |
| The keys of `upload-copy-1` | Locale catalog | `th.ts`, `en.ts`; `check-i18n` and `i18n.test.ts` check key and placeholder parity |
| `UploadIcon` (Lucide `Upload`) | Icons | `icons.tsx`, added by name (`DESIGN.md` section 6). `Upload` is in `lucide-react` 1.52.0, read at `dist/esm/icons/upload.mjs` |
| `Field`'s `children` comment names the file control (`upload-field-1`) | Component comment | `Field.tsx`, a comment only. No Field story changes |
| `catalog/base/file-upload.yaml` (new, `status: draft`, `since: ORV-227`, `story: base-file-upload`, `contract: FileUploadProps`, `recipes: [neutral, professional, friendly]`); its rules hold the line "Shows limits and state only; real file checks stay on the server" | Catalog | Lands with the code and story. `coverage.md` line 37 becomes `draft`, `base-file-upload` |
| `fileUploadFixtures` | Fixtures | `fixtures.ts`, labelled as mock |
| `DESIGN.md` section 12 | Contract document | One new "What is real" row: File upload as draft, with what is mock. Version line and change log per that file's practice |
| `.claude/rules/design-system.md` line 33 | Rule | Not changed here. `FileUpload` has no shadcn primitive to sit on, a deviation this spec records in open question 3 for the owner's call |

Not changed: `Button`, `Progress`, `Input`, any semantic token, profile or primitive, `apps/web`, `packages/intent-engine`, `MissingInputsPrompt`, `prompt.uploadLater`.

### Copy

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `fileUpload.choose` | เลือกไฟล์ | Choose files |
| `fileUpload.chooseLabel` | เลือกไฟล์ สำหรับ{label} | Choose files for {label} |
| `fileUpload.limits` | ไฟล์ {types} ขนาดไม่เกิน {size} ต่อไฟล์ เลือกได้สูงสุด {count} ไฟล์ | {types} files, up to {size} each. At most {count} files |
| `fileUpload.dropHint` | หรือลากไฟล์มาวางที่นี่ | or drag files here |
| `fileUpload.dropNow` | ปล่อยเพื่อเพิ่มไฟล์ | Drop to add the files |
| `fileUpload.full` | ครบ {count} ไฟล์แล้ว นำไฟล์ออกก่อนจึงจะเพิ่มได้ | {count} files added. Remove one to add another |
| `fileUpload.listLabel` | ไฟล์ที่เลือก | Chosen files |
| `fileUpload.sizeKb` | {size} KB | {size} KB |
| `fileUpload.sizeMb` | {size} MB | {size} MB |
| `fileUpload.sizeMissing` | ไม่ทราบขนาด | Size unknown |
| `fileUpload.done` | อัปโหลดแล้ว | Uploaded |
| `fileUpload.failed` | อัปโหลดไม่สำเร็จ | Upload failed |
| `fileUpload.retry` | ลองอีกครั้ง | Try again |
| `fileUpload.retryLabel` | ลองอีกครั้ง อัปโหลด {name} | Try again to upload {name} |
| `fileUpload.removeLabel` | นำ {name} ออกจากรายการ | Remove {name} from the list |
| `fileUpload.rejectType` | {name}: ไฟล์ชนิดนี้ใช้ไม่ได้ เลือกไฟล์ชนิด {types} แทน | {name}: this file type is not accepted. Choose one of these: {types} |
| `fileUpload.rejectSize` | {name}: ไฟล์ขนาด {size} เกิน {max} ย่อไฟล์แล้วเลือกอีกครั้ง | {name}: this file is {size}, over the {max} limit. Make it smaller and choose it again |
| `fileUpload.rejectCount` | {name}: เกิน {count} ไฟล์ นำไฟล์ออกจากรายการก่อนแล้วเลือกอีกครั้ง | {name}: over the limit of {count} files. Remove a file from the list and choose this one again |
| `fileUpload.rejectMore` | และอีก {count} ไฟล์ที่เพิ่มไม่ได้ | and {count} more files not added |
| `fileUpload.announceStart` | กำลังอัปโหลด {name} | Uploading {name} |
| `fileUpload.announceProgress` | {name} อัปโหลดไปแล้ว {percent} | {name}: {percent} uploaded |
| `fileUpload.announceDone` | อัปโหลด {name} แล้ว | {name} uploaded |
| `fileUpload.announceFailed` | อัปโหลด {name} ไม่สำเร็จ: {reason} | {name} failed to upload: {reason} |

Fixture copy, not catalog keys: the label "ภาพอ้างอิงแบรนด์" / "Brand reference images", the caller error "เพิ่มภาพอย่างน้อยหนึ่งภาพ" / "Add at least one image", and the mock reason "การเชื่อมต่อหลุดระหว่างอัปโหลด ลองอีกครั้ง" / "The connection dropped during the upload. Try again".

## Acceptance criteria

Plays run in Thai, neutral, light, on `fileUploadFixtures`. A play picks files with `userEvent.setup({ applyAccept: false }).upload(input, files)`, so a wrong type reaches the component, and it finds the input with `canvasElement.querySelector('input[type="file"]')`. A play gives a `File` its size with `Object.defineProperty(file, "size", { value })`. Progress, done and failed come from a mock driver in the story, with no timers: a play calls it and waits on the condition. The real operating system picker is not opened by any row: a play counts opens with a `click` listener on the input that calls `preventDefault`, which sees both `input.click()` and a label's activation (a spy on the `click` method would miss the label).

Stories (`upload-stories-1`):

<!-- prettier-ignore -->
| Story, Thai | Story, English | Shows |
| --- | --- | --- |
| `Empty` | `EmptyInEnglish` | No items |
| `Uploading` | `UploadingInEnglish` | Three items: `progress` 40, no `progress`, `progress` 100 |
| `Done` | `DoneInEnglish` | Two done items, one with no `size` |
| `Failed` | `FailedInEnglish` | One failed item with the mock reason |
| `Rejected` | `RejectedInEnglish` | The refused lines, after the play's pick |
| `Full` | `FullInEnglish` | Five items |
| `Disabled` | `DisabledInEnglish` | `disabled`, one failed item |
| `Invalid` | `InvalidInEnglish` | The caller's `error`, no items |
| `At360` | `At360InEnglish` | `Narrow`, long names, one item of each status |
| `DragOver` | `DragOverInEnglish` | A file drag held over the zone |
| `RecipesAndModes` | none, it is a Matrix of the Thai states | `Matrix`, six boundaries |

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Story `Empty` | Rendering | The label "ภาพอ้างอิงแบรนด์", the limits "ไฟล์ PNG, JPEG, WebP ขนาดไม่เกิน 4 MB ต่อไฟล์ เลือกได้สูงสุด 5 ไฟล์", a button "เลือกไฟล์" with an upload icon, the hint "หรือลากไฟล์มาวางที่นี่", no list | None. Button name exactly "เลือกไฟล์ สำหรับภาพอ้างอิงแบรนด์"; its `aria-describedby` reaches the limits line; no `ul` in the canvas (`upload-limits-1`, `upload-input-1`, `upload-item-1`, W6) | `Empty` play |
| 2 | Same, the input's `click` listener counting | Tab, then Enter, then Space, then a click on the label, then Tab | The focus line and halo on "เลือกไฟล์"; the next Tab leaves the control | The first Tab lands on the button and the last Tab leaves the control, so one stop; the listener counts 3; the input has `multiple`, `tabindex` -1, `aria-hidden` true, class `sr-only`, no `role`, computed `display` not `none`, and `accept` equal to W5's output (`upload-input-1`, `upload-field-1`) | `Empty` play step |
| 3 | Story `Empty`, the mock host | The play picks `ภาพหน้าร้านบ้านกาแฟ.png`, type `image/png`, 1,843,200 bytes | A list row with the name, "0%" and "1.9 MB" | `onFiles` called once with 1 file; `getByRole("progressbar", { name: "ภาพหน้าร้านบ้านกาแฟ.png" })` exists; status region reads "กำลังอัปโหลด ภาพหน้าร้านบ้านกาแฟ.png" (`upload-item-1`, `upload-announce-1`) | `Empty` play step |
| 4 | Same, after row 3 | The play picks the same `File` again | A second row with that name | `input.value` is `""` after each pick; `onFiles` has run twice (`upload-input-1`) | `Empty` play step |
| 5 | Story `Rejected`, no items | The play picks `max.png`, 4,000,000 bytes, and `big.png`, 4,000,001 bytes, both `image/png` | One row for `max.png` reading "4 MB". Under the zone: "big.png: ไฟล์ขนาด 4.1 MB เกิน 4 MB ย่อไฟล์แล้วเลือกอีกครั้ง" | `onFiles` receives `max.png` only; `getByRole("alert")` holds that line; the input has `aria-invalid` true; the zone has `data-invalid` (`upload-size-1`, `upload-size-text-1`, `upload-reject-1`, W1) | `Rejected` play |
| 6 | Same story | The play picks `logo.svg` (`image/svg+xml`), then `ภาพ.PNG` with an empty type | First pick: "logo.svg: ไฟล์ชนิดนี้ใช้ไม่ได้ เลือกไฟล์ชนิด PNG, JPEG, WebP แทน". Second pick: `ภาพ.PNG` joins the list and the line is gone | `onFiles` not called for `logo.svg` and called with `ภาพ.PNG`; `queryByRole("alert")` is null after the second pick (`upload-judge-1`, `upload-reject-1`, W3) | `Rejected` play step |
| 7 | Story `Uploading`, three items | The play picks four valid files `p4.png` to `p7.png` | `p4.png` and `p5.png` join the list, and two lines read "p6.png: เกิน 5 ไฟล์ นำไฟล์ออกจากรายการก่อนแล้วเลือกอีกครั้ง" and the same for `p7.png`. The hint now reads "ครบ 5 ไฟล์แล้ว นำไฟล์ออกก่อนจึงจะเพิ่มได้" | `onFiles` called once with 2 files; 5 `li` (`upload-count-1`, W3) | `Uploading` play |
| 8 | Story `Full`, the input's `click` listener counting | Tab to "เลือกไฟล์" and press Enter, then a click on the label | The button dimmed and still focused; no picker; the hint "ครบ 5 ไฟล์แล้ว นำไฟล์ออกก่อนจึงจะเพิ่มได้" | Button `aria-disabled` true and `toHaveFocus()` after Enter; the input is `disabled`; the listener counts 0; the button's `aria-describedby` reaches the hint; the hint "หรือลากไฟล์มาวางที่นี่" is gone (`upload-count-1`) | `Full` play |
| 9 | Story `Rejected` | The play picks 8 files of type `text/plain` named `n1.txt` to `n8.txt`; then presses Remove on the row of row 5 | 5 lines, then "และอีก 3 ไฟล์ที่เพิ่มไม่ได้"; after Remove, no lines | 5 `.ds-file-upload__rejected` for files, 1 for the fold; after Remove no alert is in the canvas and the zone has no `data-invalid` (`upload-reject-1`) | `Rejected` play step |
| 10 | Story `Uploading` | Rendering | Row 1 "40%" and a bar; row 2 "กำลังทำงาน" and a moving bar; row 3 "100%" with no tick and no "อัปโหลดแล้ว" | 3 `progressbar`, each named by its file; row 3 has no check icon; no done word in the canvas (`upload-item-1`) | `Uploading` play step |
| 11 | Story `Done` | Rendering | Each row with the name, a tick and "อัปโหลดแล้ว"; one row reads "1.9 MB", the other "ไม่ทราบขนาด" | No `progressbar`; no Retry; 2 Remove buttons, names exactly "นำ {name} ออกจากรายการ" with each file's name (`upload-item-1`, `upload-actions-1`) | `Done` play |
| 12 | Story `Failed` | Rendering | The name, a warning mark, "อัปโหลดไม่สำเร็จ", "การเชื่อมต่อหลุดระหว่างอัปโหลด ลองอีกครั้ง", a button "ลองอีกครั้ง" and a Remove button | No `progressbar`; Retry name exactly "ลองอีกครั้ง อัปโหลด {name}" (`upload-item-1`, `upload-actions-1`) | `Failed` play |
| 13 | Same | "ลองอีกครั้ง" is pressed | The row shows its bar again; "ลองอีกครั้ง" is gone; focus is on that row's Remove button | `onRetry` called once with the item's id; Remove `toHaveFocus()`; status region reads "กำลังอัปโหลด {name}" (`upload-actions-1`, `upload-announce-1`) | `Failed` play step |
| 14 | Story `Done` | Remove on the first row, then on the last | The row goes each time; after the last one the list is gone; focus is on "เลือกไฟล์" | `onRemove` called once per press; the Choose button `toHaveFocus()`, not `document.body`; no `ul` (`upload-actions-1`, `upload-item-1`) | `Done` play step |
| 15 | Story `Empty`, one item running through the mock driver | The driver sets `progress` 10, 24, 25, 49, 80, 100, then `done`; a second run with two items sets `progress` 60 on one, then `failed` on the other | Nothing visible beyond the bars and words of rows 10 to 12 | Region text after each step: unchanged, unchanged, "{name} อัปโหลดไปแล้ว 25%", unchanged, 75%, 100%, then "อัปโหลด {name} แล้ว". Second run: no percent; then "อัปโหลด {name} ไม่สำเร็จ: {reason}". The region is `role="status"` and no percent reaches `role="alert"` (`upload-announce-1`, W4) | `Empty` play step |
| 16 | Story `Disabled` | Tab, and a click on the label | The label, limits and hint in disabled ink (the hint in the second PR's walk, "Rows per PR"); "เลือกไฟล์", "ลองอีกครั้ง" and Remove disabled | Tab reaches none of them; the input and the three buttons are `disabled` (`upload-field-1`, `upload-actions-1`) | `Disabled` play |
| 17 | Story `Invalid` | Rendering | "เพิ่มภาพอย่างน้อยหนึ่งภาพ" under the zone, with the zone's error edge | `getByRole("alert")` holds it; the Choose button's `aria-describedby` reaches it; the zone has `data-invalid` (`upload-field-1`, `upload-reject-1`) | `Invalid` play |
| 18 | Story `Rejected` | The play picks `<img src=x onerror=alert(1)>.txt` and `{size}.txt`, both `text/plain` | Both names as plain characters at the start of their lines | The canvas has no `img`; the second line starts "{size}.txt:" (`upload-server-1`, W6) | `Rejected` play step |
| 19 | The stories of the English column of "Stories", less `DragOverInEnglish` | Rendering, each with its play | The English copy: "PNG, JPEG, WebP files, up to 4 MB each. At most 5 files", "Choose files", "Uploaded", "Upload failed", "Try again", "5 files added. Remove one to add another", and the rejection lines of the Copy table | Button name "Choose files for Brand reference images"; progressbar names unchanged; no Thai character in a canvas of Latin fixtures (`upload-copy-1`) | The `InEnglish` plays |
| 20 | Stories `At360` and `At360InEnglish`, a 360 px frame | Rendering | The long Thai name and the long Latin name wrap inside their rows; the limits line wraps; the actions stay inside the row | Frame `scrollWidth` at most `clientWidth`. From each text element (`.ds-progress__label`, `.ds-file-upload__name`, `.ds-file-upload__reason`, `.ds-field__description`) up to the frame, every ancestor computes `overflow-x` and `overflow-y` `visible`. Wrapped text is proved by `expectLinesClear` on each of those elements. The `At360` play reads those line gaps through `expectLinesClearAtWholePixel`, a wrapper local to `FileUpload.stories.tsx`, until the shared helper is fixed: at device scale 1 the helper reads a 0 px gap between 23.8 px lines when the clone's baseline falls between .5 and .7 of a pixel, whatever the style, so the wrapper puts the clone's top on a whole pixel first. The one-line done word is proved by `expectLabelInkWhole` on `.ds-file-upload__word`. A clip on an ancestor is proved by `expectFrameCutsNoInk(el, el.closest(".ds-file-upload__item"))` for each of `.ds-progress__label`, `.ds-file-upload__name`, `.ds-file-upload__reason` and `.ds-file-upload__word`, and by `expectFrameCutsNoInk(el, frame)` with this story's 360 px frame for `.ds-field__description`. The second PR adds `.ds-file-upload__hint`, frame `.ds-file-upload__zone` (`upload-stories-1`) | `At360` plays, under `inVitest` |
| 21 | Story `RecipesAndModes` | Rendering through `Matrix` | Six boundaries (neutral, professional, friendly, each light and dark), each with the zone, one uploading row, one done row and one failed row | 6 `.ds-file-upload`; `data-matrix-profile` and `data-matrix-mode` cover the six pairs (`upload-stories-1`) | `RecipesAndModes` play count |
| 22 | `judge.test.ts` | The unit test runs | Not a screen | W3's seven files and `used` 3 give W3's output; a file of `limits.maxBytes` passes and one byte more is refused; an empty type with a wrong extension is refused for `type` (`upload-judge-1`) | `pnpm --filter @orivilo/design-system exec vitest run src/components/file-upload/judge.test.ts` |
| 23 | `limits.test.ts` | The unit test runs | Not a screen | The eleven inputs of W1 give W1's output in `en`; `th` gives the same numbers with Latin digits; `IMAGE_UPLOAD_LIMITS` equals `upload-limits-1` and W5's `accept` output (`upload-size-text-1`, `upload-limits-1`) | `pnpm --filter @orivilo/design-system exec vitest run src/components/file-upload/limits.test.ts` |
| 24 | `announce.test.ts` | The unit test runs | Not a screen | W4's sequence gives W4's output; a second uploading item gives no percent; items at first render give nothing; two changes in one render join into one text (`upload-announce-1`) | `pnpm --filter @orivilo/design-system exec vitest run src/components/file-upload/announce.test.ts` |
| 25 | The PR head | The source is searched | Not a screen | `grep -rn -e "fetch(" -e XMLHttpRequest -e FileReader -e arrayBuffer -e dangerouslySetInnerHTML packages/design-system/src/components/file-upload` has no hit outside a test; the catalog entry holds the line of the Catalog row in "Contract changes and impact"; `fileUploadFixtures` and the story meta name the mock (`upload-server-1`) | The grep, `check-catalog`, and a read of `catalog/base/file-upload.yaml` |
| 26 | The PR head | `check-catalog`, `check-i18n`, `i18n.test.ts`, the copy check, `recipes.test.ts`, `pnpm contrast` and the a11y addon run | Not a screen | The keys of `upload-copy-1` exist in Thai and English with matching placeholders; no middot or em dash in new copy; the pairs of "Contract changes and impact" pass under the three profiles in both modes; zero a11y violations in the stories of "Stories" that the PR holds. `Disabled` and `DisabledInEnglish` leave `.ds-field__description` out of the a11y scan: axe reads a contrast of 3.37 on the limits line of a disabled control, text of an inactive control is exempt from WCAG 1.4.3, and axe cannot see that the line belongs to the disabled input | `pnpm --filter @orivilo/design-system test`, `pnpm contrast` |
| 27 | Story `DragOver`, a `dragenter` with `dataTransfer.types` `["Files"]` | The drag is held over the zone | The edge turns solid and the hint reads "ปล่อยเพื่อเพิ่มไฟล์" | Zone has `data-dragging`; the zone's `borderTopStyle` is `solid`, `dashed` before (`upload-drop-1`) | `DragOver` play |
| 28 | Same | A `dragleave` with `relatedTarget` the Choose button, then a `dragleave` with `relatedTarget` outside the zone | The word stays after the first and "หรือลากไฟล์มาวางที่นี่" returns after the second | `data-dragging` present, then absent (`upload-drop-1`) | `DragOver` play step |
| 29 | Story `DragOver`, no items | A `drop` with `big.png` as in row 5 and `ภาพหน้าร้านบ้านกาแฟ.png` | The same row and the same line as rows 3 and 5 | The `drop` event's `defaultPrevented` is true; `onFiles` called once with 1 file; no `data-dragging` after it (`upload-drop-1`, `upload-judge-1`) | `DragOver` play step |
| 30 | Story `DragOver`, no drag held | A `dragenter` with `dataTransfer.types` `["text/plain"]` | The zone does not change | No `data-dragging` (`upload-drop-1`) | `DragOver` play step |
| 31 | Stories `Disabled` and `Full` | A `drop` of one valid file on each | `Disabled`: nothing changes. `Full`: the count line of row 7 for that file | Both `drop` events have `defaultPrevented` true. `Disabled`: `onFiles` not called, no alert text. `Full`: `onFiles` not called, one rejected line (`upload-drop-1`, `upload-count-1`) | `Disabled` and `Full` play steps |
| 32 | Story `DragOver` | The zone is read | Nothing new | The zone has no `role`, no `tabindex`, no `aria-*` attribute, and the canvas has no `aria-grabbed` or `aria-dropeffect`; Tab from the page start still lands on the Choose button first (`upload-drop-1`) | `DragOver` play step |
| 33 | Story `DragOverInEnglish` | The drag is held over the zone | "Drop to add the files" | Zone has `data-dragging`; before the drag the hint reads "or drag files here" (`upload-copy-1`) | `DragOverInEnglish` play |
| 34 | Storybook at 360 and 1440 px, light and dark, Thai and English, under neutral and a second profile | The designer opens the stories of "Stories" that the PR holds | The zone reads as a place to act and not as a card or a selected item; the dashed edge and the solid drag edge differ without colour (the second PR's walk, "Rows per PR"); uploading, done and failed read apart by word and mark; a failure reason reads as a failure; long names wrap and every Thai mark stays whole; the focus line and halo show on each button | None | Designer visual sign-off with screenshots named `<phase>-<story>-<width>-<locale>-<mode>.png`; the main session posts the sign-off's PNG paths, absolute, as a Jira comment on ORV-227 (`.claude/skills/ovl/SKILL.md`, "Visual sign-off") |
| 35 | The PR head | The affected suites, then the full gate | Not a screen | Every play and test passes | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/file-upload`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows that render nothing

- Rows: 22, 23, 24, 25, 26, 35

## Rows per PR

Estimated at about 1,000 changed lines by hand for all rows, plus generated CSS, of which the stories are close to half: over the 400-line guide. By the default of open question 12 the work splits vertically in two PRs. The first holds rows 1 to 26, 34 and 35: everything a person can do with the picker, a complete `FileUpload` with its catalog entry. The second holds rows 27 to 33, with 16, 20, 26, 34 and 35 again for what it adds: the drop target. Until the second lands, `dropHint` stays out of the zone, the zone's edge is solid (`design.md` section 6) and row 1's hint is not checked, and the first PR's changelog line says so. The first PR's walk leaves out two clauses, which move to the second PR's walk: row 34's "the dashed edge and the solid drag edge differ without colour", and row 16's "hint in disabled ink", since story `Disabled` holds one item and has no hint to read until then. The rest of those two rows holds in the first PR. In the second PR, row 20 covers the `.ds-file-upload__hint` check it adds. The first PR is PR 192, on the line below. The second has no PR yet; the main session adds its line in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line, once that PR exists.

- PR 192: rows 1-26, 34, 35

## Out of scope

- Any real upload: storage, a server action, the magic byte check, downscaling, EXIF, signed URLs (`upload-server-1`), and wiring `FileUpload` into `MissingInputsPrompt` or a Studio page.
- File kinds other than images (open question 7), and a single-file control (`maxFiles` of 1, where the English `fileUpload.limits` would not read well).
- Image previews or thumbnails, so no object URL and no drawing of a person's file. Audit A.1 keeps Image picker for later.
- `processing`, cancel and a queued item (open question 11), paste, folder picking (K-0266 `acceptDirectory`), `capture`, a drop anywhere on the page.
- Sizes and variants of the control: one zone, no compact form.
- A check that a file is not chosen twice; the caller owns the list.
- Any change to `Button`, `Progress`, `Input`, any semantic token or profile.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The size text of `upload-size-text-1`. Input: the limit, 1536 bytes from K-0261's example, and the boundaries around each unit. Expected output, one line per input as `bytes text`: `0 0 KB`, `1536 1.6 KB`, `512000 512 KB`, `999900 999.9 KB`, `999901 1 MB`, `1843200 1.9 MB`, `3999999 4 MB`, `4000000 4 MB`, `4000001 4.1 MB`, `4194304 4.2 MB`, `4900000 4.9 MB`. Rounding: up, to one decimal place. K-0261's floored rule reads 1536 as 1 KB; here it reads 1.6 KB.

```bash
node -e 'const t=b=>{const kb=Math.ceil(b/100)/10;return kb<1000?kb+" KB":Math.ceil(b/100000)/10+" MB"};for(const b of [0,1536,512000,999900,999901,1843200,3999999,4000000,4000001,4194304,4900000])console.log(b,t(b))'
```

W2. The two readings of "4 MB" in `upload-size-1`. Input: "at most 4 MB each" (ADR 0009 point 5, line 62). Expected output: `1,000 4000000`, `1,024 4194304`, then `194304`, the band of bytes where the readings disagree. Integers, no rounding.

```bash
node -e 'for(const [n,b] of [["1,000",4*1000*1000],["1,024",4*1024*1024]])console.log(n,b);console.log(4*1024*1024-4*1000*1000)'
```

W3. The order of `upload-judge-1`, with `used` 3 and the limits of `upload-limits-1`. Input: seven files as named in the command. Expected output, one line: `{"a":["a.png","d.webp"],"r":[["b.svg","type"],["c.jpg","size"],["e.PNG","count"],["f.gif","type"],["g.jpeg","count"]]}`. `e.PNG` passes on its extension and then finds the list full; `f.gif` is over the size too and reports `type`, which comes first.

```bash
node -e 'const L={maxFiles:5,maxBytes:4000000,types:[["image/png",[".png"]],["image/jpeg",[".jpg",".jpeg"]],["image/webp",[".webp"]]]};const ok=f=>L.types.some(([m,x])=>f.type.toLowerCase()===m||(f.type===""&&x.some(e=>f.name.toLowerCase().endsWith(e))));const judge=(fs,used)=>{const a=[],r=[];for(const f of fs){if(!ok(f))r.push([f.name,"type"]);else if(f.size>L.maxBytes)r.push([f.name,"size"]);else if(used+a.length>=L.maxFiles)r.push([f.name,"count"]);else a.push(f.name)}return{a,r}};console.log(JSON.stringify(judge([{name:"a.png",type:"image/png",size:1000000},{name:"b.svg",type:"image/svg+xml",size:1000},{name:"c.jpg",type:"image/jpeg",size:4000001},{name:"d.webp",type:"image/webp",size:4000000},{name:"e.PNG",type:"",size:2000},{name:"f.gif",type:"image/gif",size:5000000},{name:"g.jpeg",type:"image/jpeg",size:1000}],3)))'
```

W4. The steps of `upload-announce-1`, for one uploading item. Input: the `progress` values 0, 10, 24, 25, 49, 80, 100 of AC row 15. Expected output: `25 75 100`. The jump from 49 to 80 announces 75, the step reached. Integers, rounded down to a step.

```bash
node -e 'const step=(p,n)=>Math.floor(n/25)>Math.floor(p/25)?Math.floor(n/25)*25:null;const s=[0,10,24,25,49,80,100];const out=[];for(let i=1;i<s.length;i++){const v=step(s[i-1],s[i]);if(v!==null)out.push(v)}console.log(out.join(" "))'
```

W5. The `accept` string of `upload-input-1`. Input: `types` of `upload-limits-1`. Expected output: `image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp`.

```bash
node -e 'const types=[["image/png",[".png"]],["image/jpeg",[".jpg",".jpeg"]],["image/webp",[".webp"]]];console.log(types.flatMap(([m,x])=>[m,...x]).join(","))'
```

W6. The limits line of `upload-limits-1`, and a file name that looks like a placeholder (`upload-server-1`). Input: `fill` as in `src/i18n/messages/index.ts` line 29, the Copy table. Expected output, two lines: `ไฟล์ PNG, JPEG, WebP ขนาดไม่เกิน 4 MB ต่อไฟล์ เลือกได้สูงสุด 5 ไฟล์`, then `{size}.png: ไฟล์ขนาด 4.1 MB เกิน 4 MB ย่อไฟล์แล้วเลือกอีกครั้ง`. `fill` makes one pass, so a name's `{size}` stays as written.

```bash
node -e 'const fill=(t,p)=>t.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,n)=>String(p[n]));console.log(fill("ไฟล์ {types} ขนาดไม่เกิน {size} ต่อไฟล์ เลือกได้สูงสุด {count} ไฟล์",{types:"PNG, JPEG, WebP",size:"4 MB",count:5}));console.log(fill("{name}: ไฟล์ขนาด {size} เกิน {max} ย่อไฟล์แล้วเลือกอีกครั้ง",{name:"{size}.png",size:"4.1 MB",max:"4 MB"}))'
```

W7. The story id of `upload-stories-1`. Input: the title at `FileUpload.stories.tsx` line 100, and the same title with no space. Expected output, two lines: `Base/File upload base-file-upload`, then `Base/FileUpload base-fileupload`. The command is a reduced form of Storybook's id rule, lower case with each run of other characters as one hyphen, not Storybook's own function. No rounding.

```bash
node -e 'const id=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");for(const t of ["Base/File upload","Base/FileUpload"])console.log(t,id(t))'
```

## Open questions (each with a default)

Answers from `design.md` section 12: questions 1 to 13 all stay on their defaults. Three of them touch the look. On 10, the drag wording shows at every width: `dropHint` fits beside the Button at 320 px and up in both languages, and `dropNow` does too, except at 320 px in English, where it wraps under the Button (`design.md` section 6, row 23). On 11, there is no processing, cancel or queued look. On 12, two PRs, as `design.md` sections 5 and 6 split them; option (b) would also remove the interim frame of `design.md` section 6, and the main session owns that choice.

1. Is the 4 MB of ADR 0009 point 5 based on 1,000 or 1,024? Options: (a) 1,000-based; (b) 1,024-based, as Untitled UI's text reads sizes (K-0261). Impact: W2's band. With (b), a file in that band passes here and fails a server that later reads 1,000; with (a), the opposite mistake cannot happen, and a person whose system reports sizes on 1,024 may see a file refused that their file manager calls under 4 MB. Default: (a), `upload-size-1`, for that reason, and because the only byte limit in the repo is written on 1,000 (`MAX_FILE_BYTES = 256_000`). ADR 0009 stays silent until someone records it, so this needs an addition there (K-0288, open points).
2. How is a person stopped at a sixth file, and is five the list's limit at all? No source read has a count limit (K-0263). ADR 0009 point 5 bounds one model request, and the owner's decision D5 in `docs/specs/ORV-128/spec.md` (line 988) allows at most 10 images per analysis, which that spec's "Images" line (379) says makes two requests and its row 26 holds by refusing the 11th. Options: (a) a list of 5: keep files until the list is full, name each refused file, and make the button inert at the limit; (b) the same with a list of 10, as D5, sent 5 per request by a caller that does not exist yet; (c) refuse the whole selection; (d) drop the extra files silently. Default: (a), `upload-count-1`, because audit D.3 row 24 ties the limits shown to point 5. `maxFiles` is a prop, so the story that wires this to the photo analyser can pass 10 with no change here, and only `IMAGE_UPLOAD_LIMITS` and the line it builds would differ. (c) punishes the files that were fine, and (d) is what SC 3.3.1 rules out (K-0279, K-0280).
3. How does a file control fit the rule that a shared component is built on a shadcn primitive, when behaviour comes from `radix-ui`? The sources give only `Input type="file"` and Attachment, and Radix has no file part (K-0267, K-0268, K-0272). Options: (a) a native input with our `Button`, `Field` and `Progress`, no new dependency, recorded as a deviation; (b) take shadcn's Attachment and strip its classes: it adds no behaviour worth keeping, since its source sets no role or live region (K-0270), and it picks nothing; (c) add React Aria's DropZone and FileTrigger (K-0287): a second behaviour library against ADR 0003 item 1, a new runtime dependency, and K-0287's page says nothing on keyboard drop; (d) stop and raise an ADR first. Default: (a). shadcn's own file route is a native input (K-0267), so a native input keeps the same primitive; the Radix behaviour that exists comes in through `Progress`; `Input` is itself a native input with no primitive, and `DESIGN.md` section 12 records `Tag` as built in house on native buttons. The rule's wording needs an owner's yes or a note.
4. Which way is the file input hidden? The sources do not rank these (K-0288, open points). Options: (a) `sr-only`, `tabIndex={-1}`, `aria-hidden`, opened by a `Button`, as `SavedStudio.tsx` does; (b) `sr-only` and left in the tab order beside the Button, as Untitled UI's zone (K-0264): two stops, one with no visible focus; (c) `display: none`, as `FileTrigger` (K-0266), which MDN warns against for its pattern (K-0286); (d) `opacity: 0` with a `label` styled as a button, MDN's pattern (K-0286), which gives up `Button`'s states. Default: (a), `upload-input-1`: one Tab stop, and the Button brings its focus, disabled and name. MDN's note is about an input that stays the control, which is not the case here. Not run with a screen reader (K-0288).
5. Does a file dragged in from the operating system count under SC 2.5.7? The page does not say, and a script does read the drop while the drag starts outside the page (K-0275, own reading in that entry). Options: (a) treat it as in scope; (b) treat it as out of scope and rest on SC 2.1.1 alone (K-0276). Default: (a), `upload-drop-1`. The answer changes no build, since the Choose button is needed for the keyboard anyway and is the single pointer route K-0275 describes. No row claims conformance.
6. How often is progress announced? ARIA25 names the mechanism and not the rate (K-0278); K-0277's example says "intermittent". Options: (a) at each quarter for one file, and no percent while several run; (b) on every change, which floods the queue; (c) start and end only, which leaves a long upload silent; (d) on a timer, which adds timers and states nothing a test can hold. Default: (a), `upload-announce-1`: several files at once would otherwise crowd the queue with percents, and each file still announces its own start and result.
7. Which file kinds? Audit D.3 row 24 says "Brief upload, later image reading", and audit A.1 says "brief and mood board upload", but ADR 0009 point 5 bounds images only. Options: (a) images only, `limits` left open for a later kind; (b) add document types now, with a size cap this spec would have to invent. Default: (a): ADR 0015 decision 11 says each kind's cap is set by the story that adds the kind.
8. Where does `IMAGE_UPLOAD_LIMITS` live? K-0288 finds no such bound in code. Options: (a) in `src/components/file-upload/limits.ts`, moved to the domain by the story that adds the server check, with `limits` staying a prop; (b) in `packages/intent-engine` now, which needs a dependency the design system does not have. Default: (a). A profile changes visual expression only (AGENTS.md), so the limit belongs to the domain in the end, and the prop is what keeps that move small.
9. What of a failure that retry cannot fix, such as a file the server finds is not an image? Row 24 says a failed item offers retry, and K-0262 and K-0269 both offer it. Options: (a) every failed item offers it; (b) add a `retryable` flag now. Default: (a), `upload-actions-1`, with the `reason` saying what to do; the upload story adds the flag when a real failure needs it.
10. Is the drag wording shown on a touch screen? Untitled UI hides it on narrow widths (K-0264). Options: (a) show it at every width; (b) hide it by width; (c) hide it by pointer type. Default: (a): a narrow desktop window can still drop, and hiding by width would be wrong there. A follow-up can take (c).
11. `processing`, cancel and a queued item (K-0269)? Options: (a) leave them out; (b) add them now. Default: (a): Remove covers stopping (`upload-actions-1`), and none has backing behaviour until a server exists.
12. PR size. Options: (a) two PRs split vertically, as "Rows per PR" gives; (b) one PR with the review sized to it (ORV-146), as ORV-201 and ORV-211 decided. Default: (a), the product rule on story size. The main session may take (b) and record it as those two did.
13. Untitled UI's unread API tables and demos (K-0260, K-0266). Options: (a) build from what K-0260 to K-0266 read, the cells saying what is unread; (b) another research pass first. Default: (a): the two pages render the table only as a placeholder through the tools used, and the source file gave the props.

## Depends on

- `docs/specs/ORV-64/audit.md` section A.1 (Image picker, File upload), section B (table form), section D.3 row 24.
- ADR 0009 point 5 (the limits), ADR 0015 decision 11 (uploads, "No upload path exists today"), ADR 0003 item 1 (behaviour layer), ADR 0012 decision 4 (delegation), ORV-128 decision D5 (10 images per analysis, open question 2).
- `.claude/rules/design-system.md` ("Components", "UX and writing"), `.claude/rules/security.md` rules 7, 10 and 16, `.claude/rules/testing.md`, `DESIGN.md` sections 6, 7, 8, 9, 10, 11 and 12.
- ORV-137 comment 10247 (benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (Rows per PR, Rows that render nothing); ORV-217 `copy-name-1` (a space after the visible Thai word).
- `Progress`, `Field`, `Button`, `src/i18n/format.ts`, `fill`, `Narrow` and `Matrix` (`src/components/matrix.tsx`), `src/testing/visual-asserts.ts`.
- ORV-222 PR 186, which brings `expectFrameCutsNoInk` for AC row 20. The builder of this issue starts after that PR merges.
- `docs/specs/ORV-227/design.md` v1.0: amendments A1 to A7, section 6 (the first PR's solid edge), section 7 (the token values), section 12 (the answers).
- A file name is untrusted input, so the main session dispatches `security` on the PR (ovl skill, POC mode).

## Knowledge

- K-0260 to K-0266: Untitled UI's file uploaders, list items, failed item, limits, zone, bars and `FileTrigger`; K-0267 to K-0271: shadcn/ui's input, Attachment, Progress and Field; K-0272 to K-0274: Radix has no file part, its Progress and its Form.
- K-0275 to K-0281: WCAG 2.2 on dragging, keyboard, status messages, ARIA25 and ARIA27, error identification, suggestion, instructions; K-0282 to K-0285: the APG, progressbar, the deprecated drag attributes, ARIA in HTML; K-0286: `accept` is a hint, and MDN on hiding; K-0287: React Aria's DropZone.
- K-0288: the synthesis behind the benchmark table and the open points this spec turns into questions. K-0114, K-0115, K-0116: role status, SC 4.1.3, C39.

## Changelog

- 1.0 (2026-11-06): first version, from audit D.3 row 24 and K-0260 to K-0288. Downstream to review: the designer envelope (zone look, token values, the item's layout), the builder envelopes (two by open question 12), the `security` dispatch, the qa envelope (the Rows per PR lines once the PRs exist), `catalog/base/file-upload.yaml`, `coverage.md`, `DESIGN.md` section 12, and an addition to ADR 0009 for open question 1.
- v1.1 (2026-11-06): takes in amendments A1 to A7 of `design.md`: the "Contract changes and impact" rows for the token group, recipe classes, pairs and `UploadIcon`, rule `upload-actions-1`, AC rows 6, 9, 16 and 20, row 34 with the sign-off's PNG paths as a Jira comment, "Rows per PR" and "Depends on". Records the answers of `design.md` section 12 under "Open questions". No rule's behaviour changes and every row number stands. Downstream to review: the builder envelopes (rows 6, 9 and 20, `__retry`, `radius`, the two PR walks, and PR 186 on the base), the qa envelope (the second PR's rows now hold 16 and 20), the designer sign-off envelope, and the front matter of `design.md`, which names spec v1.0.
- v1.2 (2026-11-06): records what the build of PR 192 shows: the story title `Base/File upload` in `upload-stories-1` with W7, the `At360` play's story-local wrapper of `expectLinesClear` in AC row 20, the `.ds-field__description` exclusion of the `Disabled` stories in AC row 26, and the line for PR 192 under "Rows per PR". PR 192 is the first PR, so it holds no drop target: "Rows per PR" says what that leaves out. No rule's behaviour changes, no requirement is added and every row number stands. Downstream to review: the qa envelope (PR 192's line now narrows its rows, and rows 20 and 26 read as above), the reviewer of PR 192, and the shared helper in `src/testing/visual-asserts.ts`, whose fix retires the wrapper and the row 20 sentence.
