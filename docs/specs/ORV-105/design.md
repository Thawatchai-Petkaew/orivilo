---
issue: ORV-105 (ORV-45 part 3, CanvasChat)
spec: docs/specs/ORV-105/spec.md v1.1
gate: G2 Design (lane L, passed by Claude under the owner's POC delegation, ADR 0012)
version: 1
---

# CanvasChat: design for slice A in full, slices B, C and D in outline

This file turns spec v1.1 into flow, anatomy, layout, tokens, recipe, pairs, focus, live region, motion and stories. Slice A (the sidebar core, this issue) is specified to build from. Slices B, C and D get a section each that their own slice specs (L-0016) copy and deepen. The design adds no semantic token and changes no existing token value. Where it needs something the spec does not say, the gap is listed under "Deltas against the spec" (§20) with a default, so G2 can pass it or send it back in one read.

## 1. Sources this design relies on

| Source                                                          | What it decides here                                                                                                                                                              |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec v1.1, AC 1 to 28, rules and bounds, i18n table             | Every state, every string, the API, the slice split, "no new semantic token", plain-text rendering, one request at a time                                                         |
| `DESIGN.md` §2, §3.3                                            | Working surfaces keep compact density; flat depth in the shell; radius grows with level (media 12, container 16, overlay 24); the engine at work is the only looping motion       |
| `DESIGN.md` §4                                                  | Looped Thai (Sarabun) for chat text under 24 px; no tracking or transform on Thai; mixed lines take the body line-height                                                          |
| `DESIGN.md` §7, §8                                              | State completeness; asking the engine is `action.intent`; failure is `feedback.danger`; streaming is `status.running`; focus is `focus.ring`                                      |
| `DESIGN.md` §9, `.claude/skills/frontend-design/SKILL.md`       | The critique in §18                                                                                                                                                               |
| `catalog/application/canvas-chat.yaml`                          | Variants `sidebar`, `at-cursor`; states idle, streaming, error, mock; "Labelled rule-based or mock"; "streaming output in a polite live region; Escape closes the at-cursor form" |
| `docs/context/canvas-node-study.md` (Dreamina notes)            | Chat opens at the cursor with "/" or in a right sidebar; replies land as nodes                                                                                                    |
| `docs/specs/ORV-100/design.md` (TaskBar)                        | The basis label pattern (plain words, `taskBar.basisRules` and `taskBar.basisMock`), one polite announcer, no row tint for failure, hairlines instead of boxes                    |
| Shipped parts: `Button`, `Textarea`, `ScrollArea`, `Tag`, icons | Reused as they are, apart from delta D1 (Button honours a caller's `aria-disabled`)                                                                                               |

## 2. Directions considered (same content, same task)

All three use the same fixture: the basis notice for `rules`, one finished exchange, one streaming reply, a long Thai question without spaces. Each is shown in a 320 px side panel and in a 360 px sheet.

| Direction               | Shape and surface                                                                                                                                                               | Density and composition                                                                                         | Why kept or dropped                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Working log (chosen) | Panel ground with no frame of its own. The question sits in a sunken well (media radius 12). The reply is plain text on the panel ground, full width, with a meta line under it | One column. Exchanges are separated by space, not boxes. The composer is docked at the foot behind one hairline | Reads like notes about the board, which is what the reply becomes (a note node, slice B). Full width keeps long Thai lines readable at 240 px. The question and the reply differ by ground and position, not by colour alone. Nothing in it says "assistant", so the honest framing ("by rules", "mock data") carries the meaning |
| B. Messenger bubbles    | Question bubble at the end edge, reply bubble at the start edge, each pill-ish with a tail, an avatar for the engine                                                            | Two ragged columns, about 75% width each                                                                        | Dropped: at 240 to 360 px a 75% bubble wraps a Thai sentence into a narrow strip; an engine avatar invents a persona that the spec forbids implying (no "AI answered"); bubbles are the generic chat template (§18)                                                                                                               |
| C. Exchange cards       | Each question and reply pair in its own card (container radius 16) with a shadow, the basis as a badge in the card corner                                                       | Stacked cards with gaps                                                                                         | Dropped: card kit (§9 item 3) inside a panel that is already a card; a badge per card makes the basis look like a trust mark; the cards compete with the real nodes on the board                                                                                                                                                  |

Direction A is a working-surface panel. It follows the compact half of mood E, not the bento half: no big numerals, no glow, and lime only on Send.

## 3. Flow (slice A)

```
idle (empty transcript, invite text, basis notice)
  │  type, then Enter or Send (text not blank, within the 2,000-grapheme limit)
  ▼
streaming ── question in the transcript under "คุณ"; reply mounts empty with "กำลังตอบ" and the mark
  │          each snapshot replaces the reply text; Send becomes Stop; Enter does not send
  ├─ iterable ends ──────▶ done: full text, basis word, Send returns, onReply(last, request) once
  ├─ Stop pressed ───────▶ stopped: partial text kept, "หยุดแล้ว", not placed, focus to textarea
  └─ onAsk or iterable throws ▶ error: partial dropped, danger text, "ส่งอีกครั้ง"
                                   │  Send again → streaming with the same request
                                   │  or type a new message → streaming (old failure stays, no button)
close (sidebar with onClose): aborts a streaming reply first, then onClose once
unmount: aborts; transcript is gone
```

The chat never places, selects or opens anything itself. `onReply` is the only exit for a finished reply (slice B wires it).

## 4. Anatomy (sidebar)

```
section.ds-chat  data-variant=sidebar  data-state=idle|streaming|done|stopped|error
│                 role=region  aria-labelledby=titleId
├─ header.ds-chat__header
│   └─ span.ds-chat__title  id=titleId          "แชทบนบอร์ด" / "Board chat"
├─ p.ds-chat__notice                             basis notice from the `basis` prop (AC 2)
├─ ScrollArea  label "บทสนทนา" / "Conversation"  (focusable named region, AC 11)
│   ├─ p.ds-chat__empty                          invite text (no messages yet)
│   └─ ol.ds-chat__log
│       └─ li.ds-chat__exchange  data-state=streaming|done|stopped|failed
│           ├─ div.ds-chat__question
│           │   ├─ span.ds-chat__speaker          "คุณ" / "You"
│           │   └─ p.ds-chat__text                question, plain text, pre-wrap
│           └─ div.ds-chat__reply
│               ├─ p.ds-chat__text  [aria-live=polite aria-busy]   reply text (latest exchange only, §11)
│               ├─ div.ds-chat__meta
│               │   ├─ span.ds-chat__progress     mark + "กำลังตอบ" (streaming only)
│               │   ├─ span.ds-chat__basis        "ตามกฎ" / "ข้อมูลจำลอง" (done, stopped)
│               │   └─ span.ds-chat__stopped      "หยุดแล้ว" (stopped only)
│               └─ div.ds-chat__failure           (failed only)
│                   ├─ WarningIcon + p            failure text
│                   └─ Button secondary sm        "ส่งอีกครั้ง" (latest exchange only, D4)
├─ form.ds-chat__composer
│   ├─ Textarea  aria-label "ข้อความถึงเอนจิน"  placeholder "ถามหรือสั่งงาน"  maxLength 2000  rows 3
│   └─ div.ds-chat__actions
│       └─ Button intent "ส่ง"  (aria-disabled when blank or over the limit)  or  Button secondary "หยุด"
├─ Button ghost sm iconOnly  aria-label "ปิดแชท"  CloseIcon   (only with onClose; DOM last, drawn in the header row)
└─ span.sr-only role=status                      the one status announcer (§11)
```

DOM order is header title, notice, transcript, composer, close. That gives the Tab order AC 11 asks for: transcript region, then any "Send again" inside it, then the textarea, then Send or Stop, then close. The recipe draws close in the header row through grid areas (`"title close" "notice notice" "log log" "composer composer"`). A sighted keyboard user meets close last, after the action they came for. That is a meaningful sequence for WCAG 2.4.3, the same choice TaskBar made with `column-reverse`.

The reply has no speaker name. The basis word in its meta line says where it came from. A name such as "เอนจิน" or an avatar would invent a voice the spec forbids implying.

## 5. Layout per state

The chat fills its host's block size: the shell's side panel on wide screens, the Sheet on narrow ones (as the Inspector does). It sets `container-type: inline-size`. Inline size comes from the host: `size.panel.min` 240 to `size.panel.max` 480 in a panel, the full viewport in a sheet. One breakpoint at 320 px (below it, the composer's actions wrap under the textarea's counter). The transcript is the only part that scrolls. Header, notice and composer never scroll away.

### 5.1 Idle, wide (panel 320 px)

```
┌──────────────────────────────────────┐
│ แชทบนบอร์ด                       [x] │  header, 40 min block, label.md
│ คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI      │  notice, label.sm, muted
├──────────────────────────────────────┤  hairline
│                                      │
│ ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย     │  empty, body.sm, muted, top-start
│                                      │
│                                      │  (transcript region grows)
├──────────────────────────────────────┤  hairline
│ ┌──────────────────────────────────┐ │
│ │ ถามหรือสั่งงาน                     │ │  Textarea md, 3 rows, media radius
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ 0/2,000                       [ ส่ง ] │  counter (Textarea's own), Send intent md, aria-disabled
└──────────────────────────────────────┘
```

- The empty text sits at the top start of the transcript, not centred. There is no illustration and no sample questions: suggested prompts would be content the component does not have (AGENTS.md, no copy that is not backed).
- Send is aria-disabled while the box is blank. It shows the Button's disabled ground through D1 and stays in the Tab order so a screen reader can find it.

### 5.2 Streaming

```
│  ┌────────────────────────────────┐  │
│  │ คุณ                             │  │  speaker, label.sm, muted
│  │ สรุปโหนดแบรนด์ให้หน่อย             │  │  question, body.md, sunken well
│  └────────────────────────────────┘  │
│  โหนดแบรนด์มีสีหลักสองสี ฟอนต์หัวข้อคือ  │  reply text grows, body.md, chat.fg
│  (o) กำลังตอบ                         │  spinner mark + word, status.running, label.sm
├──────────────────────────────────────┤
│  [textarea, still editable]           │
│  12/2,000                     [ หยุด ] │  Stop, secondary md, same slot as Send
```

- The reply mounts empty at once with "กำลังตอบ", so there is never a blank gap after the question.
- The textarea stays editable so a person can draft the next message. Enter does nothing while streaming, and Shift+Enter still adds a line.

### 5.3 Done

```
│  โหนดแบรนด์มีสีหลักสองสี ฟอนต์หัวข้อคือ Anuphan  │  full text, wraps, never truncated
│  และยังไม่มีเสียงของแบรนด์                         │
│  ตามกฎ                                          │  basis word, label.sm, muted
```

### 5.4 Stopped

```
│  โหนดแบรนด์มีสีหลักสองสี ฟอนต์หัว               │  partial text kept as it was
│  ตามกฎ   หยุดแล้ว                              │  basis word, then the stopped word; separated by gap, not a mark
```

The stopped word is `chat.muted-fg` and has no icon. Stopping is the person's own act, not a problem.

### 5.5 Error

```
│  ┌────────────────────────────────┐  │
│  │ คุณ                             │  │
│  │ สรุปโหนดแบรนด์ให้หน่อย             │  │  question kept
│  └────────────────────────────────┘  │
│  /!\ ยังไม่ได้คำตอบ ข้อความของคุณยังอยู่    │  WarningIcon + text, chat.failed-fg, body.sm
│      กดส่งอีกครั้งได้เลย                   │
│      [ (<) ส่งอีกครั้ง ]                   │  Button secondary sm, RetryIcon leading
```

- No tinted block. The danger mark and the danger text are enough, as on the TaskBar's failed row. A red box in a reading column would be the loudest thing in the panel and would still say nothing more.
- Any partial text is removed. The thrown message is never shown (AC 9).
- The composer does not turn invalid: the person's input was fine. Only the exchange failed.

### 5.6 Mock

The same layout as 5.1 to 5.5. The notice reads "คำตอบเป็นข้อมูลจำลอง ยังไม่มี AI", and every reply's basis word reads "ข้อมูลจำลอง" (from the reply's own `basis`). There is no dashed edge, watermark or tint: the words carry it, and they are on every reply. When the `basis` prop and a reply's `basis` differ, each is shown as it is (spec rule, story `BasisMismatch`).

### 5.7 Narrow (360 px viewport, chat in a Sheet, about 328 px of content)

The layout is the same as wide. Below a 320 px container (a 240 px side panel), the actions row wraps: the counter keeps its line and Send or Stop drops to its own line at the end edge. Buttons stay at `size.control.md` (40 px) and keep a 44 px target through their padding on touch (`size.touch`). Nothing scrolls sideways. AC 12 is proven by `scrollWidth <= clientWidth` on the chat and on each text block.

### 5.8 Long Thai text

- Question and reply text: `white-space: pre-wrap` (keeps the person's Shift+Enter lines) and `overflow-wrap: anywhere`, with `word-break: normal`. The browser breaks Thai at dictionary word boundaries (ICU), and `anywhere` is only the fallback for a run it cannot break (such as a URL or `fixtures.longThai` in an engine without the dictionary). No `line-clamp`, no ellipsis, ever (AC 7, AC 12).
- Notice, empty and failure text wrap the same way. The title "แชทบนบอร์ด" is short and fixed.
- Sarabun through the body stack; no letter-spacing or text-transform anywhere in the recipe. A Thai line with Latin node names (such as "Anuphan") keeps the body line-height.

## 6. Component tokens: group `chat` (component.json, semantic references only)

Slice A keys:

| Token                  | Reads                | Slot                                                                                  |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `chat.bg`              | `surface.card`       | Chat ground                                                                           |
| `chat.fg`              | `text.primary`       | Title, reply text                                                                     |
| `chat.muted-fg`        | `text.secondary`     | Notice, speaker, empty text, basis word, stopped word                                 |
| `chat.divider`         | `border.subtle`      | Hairline under the notice and above the composer                                      |
| `chat.question-bg`     | `surface.sunken`     | The question well                                                                     |
| `chat.question-fg`     | `text.primary`       | Question text                                                                         |
| `chat.question-radius` | `shape.media.radius` | 12: the smallest level, inside a panel                                                |
| `chat.streaming-fg`    | `status.running`     | Streaming mark and "กำลังตอบ"                                                         |
| `chat.failed-fg`       | `feedback.danger.fg` | Failure mark and text                                                                 |
| `chat.padding-x`       | `space.inset.md`     | Inline padding of header, notice, transcript, composer                                |
| `chat.padding-y`       | `space.inset.sm`     | Block padding of header and composer                                                  |
| `chat.question-pad`    | `space.inset.sm`     | Padding inside the question well                                                      |
| `chat.exchange-gap`    | `space.stack.lg`     | Between exchanges: space, not rules, separates them                                   |
| `chat.turn-gap`        | `space.stack.sm`     | From the question to its reply                                                        |
| `chat.line-gap`        | `space.inline.sm`    | Between a block's lines (speaker to text, text to meta)                               |
| `chat.inline-gap`      | `space.inline.md`    | Between a mark and its word, between meta items, between buttons                      |
| `chat.header-height`   | `size.control.md`    | Header min block size, so the close button never squeezes the title                   |
| `chat.icon-size`       | `size.icon.sm`       | 16 px marks                                                                           |
| `chat.title-type`      | `type.label.md`      | "แชทบนบอร์ด"                                                                          |
| `chat.text-type`       | `type.body.md`       | Question and reply: this is reading, so 16/1.7 rather than the 14 px of a working row |
| `chat.meta-type`       | `type.label.sm`      | Speaker, basis, stopped, streaming word, notice                                       |
| `chat.body-sm-type`    | `type.body.sm`       | Empty text, failure text                                                              |

Slice D adds `chat.overlay-radius` (`shape.overlay.radius`), `chat.shadow` (`elevation.overlay`), `chat.layer` (`layer.overlay`), `chat.form-inline-size` (`size.node.md`), `chat.form-max-block-size` (`size.panel.default`). Slice C adds `chat.picker-max-block-size` (`size.panel.min`). Slice B adds none.

**No new semantic token.** `status.running` and `feedback.danger.fg` are locked against profile override, so the streaming and failure colours read the same under every profile. Ground, text, well and edges follow the profile through `surface.*`, `text.*` and `border.subtle`. Selection, brand and link tokens are read nowhere in the chat. Intent appears only through `Button variant="intent"` on Send, which renders as the profile's primary action inside a profile boundary.

## 7. Recipe `ds-chat` (recipes.css)

Classes: `ds-chat` (with `[data-variant]`, `[data-state]`), `ds-chat__header`, `ds-chat__title`, `ds-chat__close`, `ds-chat__notice`, `ds-chat__scroll`, `ds-chat__empty`, `ds-chat__log`, `ds-chat__exchange` (with `[data-state]`), `ds-chat__question`, `ds-chat__speaker`, `ds-chat__text`, `ds-chat__reply`, `ds-chat__meta`, `ds-chat__progress`, `ds-chat__mark`, `ds-chat__basis`, `ds-chat__stopped`, `ds-chat__failure`, `ds-chat__composer`, `ds-chat__actions`. Every value is a `--cmp-chat-*` or `--ds-*` property; otherwise only layout (grid, flex, gap).

Rules the recipe holds:

- `.ds-chat`: `display: grid; grid-template-rows: auto auto 1fr auto; block-size: 100%; min-inline-size: 0; min-block-size: 0`, `container-type: inline-size`, `chat.bg` ground. No radius, border or shadow on the sidebar variant: the host panel frames it (as the Inspector inside Resizable or Sheet). Grid areas place the close button in the header row (§4).
- `.ds-chat__scroll` takes the `1fr` row with `min-block-size: 0` so the transcript scrolls inside and the composer stays docked.
- `.ds-chat__text`, `.ds-chat__empty`, `.ds-chat__notice`, `.ds-chat__failure p`: `margin: 0; white-space: pre-wrap; overflow-wrap: anywhere` (text and failure; the notice and empty text use `normal` white-space). No `line-clamp`, no `text-overflow`.
- `.ds-chat__question`: `chat.question-bg`, `chat.question-radius`, `chat.question-pad`. It is full width, not shrink-wrapped, so a short and a long question line up on the same edges.
- `.ds-chat__log` keeps `chat.padding-x` inline padding inside the ScrollArea viewport, so the 2 px ring and 2 px gap of "Send again" is never clipped by the viewport.
- `.ds-chat__mark`: `chat.icon-size`, `currentColor`, flex-shrink 0; aligned to the first line with `1lh` block size (the Checkbox fix of v1.36).
- `.ds-chat__composer`: a `chat.divider` top edge (hairline), `chat.padding-y` and `chat.padding-x`; `.ds-chat__actions` is flex with the Textarea counter at the start and the button at the end, and wraps under 320 px (`@container (inline-size < 320px)`).
- Focus: the ScrollArea viewport, Textarea and Buttons keep their own focus-visible rings (`focus.ring`, 2 px plus 2 px gap). The recipe adds none and removes none.
- No hover rule on exchanges: they are not interactive.
- No `letter-spacing` and no `text-transform` on any class.
- Reduced motion: `.ds-chat__mark .ds-spin { animation: none }` inside `@media (prefers-reduced-motion: reduce)` (§12).

## 8. Colour pairs to add (`src/recipes/pairs.ts`, recipe `chat`)

| Slot             | fg                  | bg                 | Floor |
| ---------------- | ------------------- | ------------------ | ----- |
| title, reply     | `chat.fg`           | `chat.bg`          | 4.5   |
| muted            | `chat.muted-fg`     | `chat.bg`          | 4.5   |
| question         | `chat.question-fg`  | `chat.question-bg` | 4.5   |
| speaker on well  | `chat.muted-fg`     | `chat.question-bg` | 4.5   |
| streaming        | `chat.streaming-fg` | `chat.bg`          | 4.5   |
| failed           | `chat.failed-fg`    | `chat.bg`          | 4.5   |
| transcript focus | `ds:focus.ring`     | `chat.bg`          | 3     |

Marks share their word's token, so the 4.5 text pair covers the 3.0 glyph need. From §3.1 under neutral: `text.secondary` on `surface.sunken` (gray.600 on gray.100 light, gray.400 on gray.950 dark) is the pair most worth watching under Professional and Friendly. `pnpm contrast` and `recipes.test.ts` are the proof, not this table.

Not listed, with the reason for the pairs file comment: `chat.divider` is a `border.subtle` hairline (decorative, WCAG 1.4.11 does not apply). The question well's edge against `chat.bg` is not a boundary someone must perceive to operate anything. The `Textarea`, `Button` (intent, secondary, ghost) and `ScrollArea` inside sit on `chat.bg`, which is `surface.card`, where their pairs already exist. The recipe comment says that if `chat.bg` ever stops reading `surface.card`, those pairs must be repeated on `chat.bg`. The lime Send against the card has no floor, as `action.intent` has none in §3.1: the button is identified by its label, whose pair (`button intent`) is 4.5.

D1 adds one pair if G2 takes the recipe route: the aria-disabled intent button's label on its disabled ground (`button.primary.fg-disabled` on `button.primary.bg-disabled`), which the `:disabled` intent already uses.

## 9. Icons (`src/components/icons.tsx`)

| Export        | Use                                                                     |
| ------------- | ----------------------------------------------------------------------- |
| `SpinnerIcon` | Streaming mark, turning through `.ds-spin`, static under reduced motion |
| `WarningIcon` | Failure mark                                                            |
| `RetryIcon`   | Leading icon of "Send again"                                            |
| `CloseIcon`   | Close chat                                                              |

Slice A adds no icon. Send and Stop are words only: an arrow on Send is the "arrow on every action" tell, and the swap from a lime Send to an outlined Stop with a different word is already distinct without colour. Slice C adds `MentionIcon` (Lucide `AtSign`). Slice B reuses `JumpIcon` and `FillUnlinkedIcon`.

## 10. Focus and keyboard

| Key or act                           | Result                                                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab                                  | Transcript region, "Send again" (when shown), textarea, Send or Stop, close (AC 11)                                                                                                                   |
| Enter in the textarea                | Sends when the text is not blank, within the limit, no IME composition is open, and nothing is streaming; otherwise nothing                                                                           |
| Shift+Enter                          | Adds a line                                                                                                                                                                                           |
| Enter during Thai IME composition    | Never sends (AC 4). Guard: `event.nativeEvent.isComposing`, `keyCode === 229`, and a `compositionend` flag cleared on the next task, because Safari fires `compositionend` before the Enter `keydown` |
| Send pressed while aria-disabled     | Nothing happens; focus stays on Send                                                                                                                                                                  |
| After a send                         | The textarea clears and keeps focus (AC 4)                                                                                                                                                            |
| Stop                                 | Aborts. Stop unmounts, so focus moves to the textarea (AC 8)                                                                                                                                          |
| Reply ends while Stop has focus      | Focus moves to the textarea, as after Stop, so it never drops to the body (D2)                                                                                                                        |
| Send again                           | Calls `onAsk` with the same request; the button unmounts; focus moves to the textarea (D2)                                                                                                            |
| Close                                | Aborts a streaming reply, then `onClose` once. The host decides where focus goes after unmount (the shell's opener)                                                                                   |
| Arrow keys on the focused transcript | Scroll it (ScrollArea)                                                                                                                                                                                |
| Escape                               | Nothing in the sidebar (it belongs to the shell's `panel.close`). Slice D gives it to the at-cursor form                                                                                              |

The textarea's accessible name is "ข้อความถึงเอนจิน" through `aria-label`, and its placeholder is "ถามหรือสั่งงาน". A visible label over a chat box is a label that adds nothing (§9 item 5), and the composer's place and placeholder say what it is. Its description is the Textarea's own counter. The chat has no selected state, so focus can never be confused with selection. Following the newest reply (AC 11) keeps the transcript at its end while it is at or near the end (within 32 px). If the person has scrolled up to read, it does not pull them down. Scrolling is instant, never smooth, so a stream of snapshots does not stutter.

## 11. Live regions

There are two, both polite, both mounted with the chat so they exist before their content changes:

1. **The streaming reply (AC 6).** Only the latest exchange's reply text `p` carries `aria-live="polite"`. It is mounted empty with `aria-busy="true"` when the request starts, filled snapshot by snapshot, and set to `aria-busy="false"` when the iterable ends, so assistive tech reads the finished text once. When a new question is sent, the previous reply drops `aria-live` and the new one takes it, so there is always exactly one. The basis word, the streaming word and the stopped word are outside this region, so they are not read as part of the reply. On Stop, `aria-busy` goes false too, and the partial text is read once. On failure, the region is emptied while still busy and then set false, so nothing is read from it.
2. **The chat status (`span.sr-only role="status"`).** It says "กำลังตอบ" once when a request starts, "หยุดแล้ว" on Stop, the failure text on failure (spec question 12: polite), and in slice B "วางคำตอบเป็นโหนด {title} แล้ว". It never repeats the reply text.

Finding F2: `aria-busy` on a live region is honoured by NVDA and JAWS. VoiceOver support varies, and it may read some snapshots. The play test proves the attributes. A manual VoiceOver pass in QA records what is heard.

## 12. Motion and reduced motion

| Moment                          | Motion                                                                            | Reduced motion                       |
| ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| Streaming                       | `SpinnerIcon` turns (`.ds-spin`): the engine at work, the one allowed loop (§3.3) | Static glyph; the word still says it |
| Snapshot arrives                | None; the text is replaced                                                        | None                                 |
| New exchange appears            | None; no slide or fade                                                            | None                                 |
| Send and Stop swap              | None                                                                              | None                                 |
| Following the newest reply      | Instant scroll                                                                    | Instant scroll                       |
| Button press, focus             | Button's own feedback (`motion.feedback.duration`)                                | Button's own rule                    |
| At-cursor form opens (slice D)  | Fade over `motion.overlay.duration`                                               | Appears at once                      |
| Board jump to a reply (slice B) | `jumpToNode`'s fit, already 0 under reduced motion (ORV-101)                      | Already handled                      |

Nothing moves when nothing is streaming. Unlike the TaskBar's retry spinner, the streaming mark is not essential motion, because the word "กำลังตอบ" carries the state. So the chat recipe stops it under reduced motion (AC 5), and the `StreamingReducedMotion` story proves `animation-name: none` by computed style.

## 13. Missing data and edge content

- No `onClose`: no close button, and the header is the title alone.
- No `onReply`: the reply finishes in the transcript and nothing else happens. Slice A never shows "Go to reply node".
- A snapshot with empty text: the reply shows only "กำลังตอบ"; no placeholder dash.
- An iterable that ends with no snapshot at all: treated as a failure (no reply came back). `onReply` is not called. This is D3.
- Text over 2,000 graphemes: the Textarea counter turns danger and says by how much; Send is aria-disabled; Enter does nothing.
- Unmount while streaming: the signal aborts; nothing is announced.

## 14. Stories (`application/CanvasChat`, id `application-canvas-chat`)

Every story's description says its replies come from a fixture host that is mock data or written rules. Content comes from `src/components/fixtures.ts` (new `chatFixtures`: a short Thai question, a long Thai question without spaces, a Latin and Thai mixed reply, a reply with line breaks, a fixture host that streams a canned reply in snapshots with a delay, and one that throws). Stories are Thai by default and English through the toolbar and in `English`.

| Story                    | Slice | Shows                                                       | Play test                                                                                                                                  |
| ------------------------ | ----- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Idle`                   | A     | Empty transcript, `basis="rules"`, with `onClose`           | Region name, empty text, textarea name and placeholder, Send present (AC 1, 2)                                                             |
| `Mock`                   | A     | `basis="mock"`, one finished mock reply                     | Notice text; reply word "ข้อมูลจำลอง"; no text node in the chat matches an "AI answered" pattern (AC 2)                                    |
| `BlankSend`              | A     | Blank and space-only text                                   | Send `aria-disabled="true"`; Enter and click do not call `onAsk` (AC 3)                                                                    |
| `OverLimit`              | A     | 2,010 graphemes                                             | Counter says over by 10; Send `aria-disabled`; no call                                                                                     |
| `Send`                   | A     | Type and press Enter, then type and click Send              | `onAsk` once each with trimmed text and an `AbortSignal`; question under "คุณ"; textarea empty and focused; Shift+Enter adds a line (AC 4) |
| `ImeCompose`             | A     | Composition events around Enter                             | No call while composing (AC 4)                                                                                                             |
| `Streaming`              | A     | A host that holds mid-stream                                | Latest text shown; "กำลังตอบ"; Stop in place of Send; a second Enter does not call; `aria-live="polite"` with `aria-busy="true"` (AC 5, 6) |
| `StreamingReducedMotion` | A     | `Streaming` under reduced motion                            | Mark animation is `none` (computed style)                                                                                                  |
| `Replied`                | A     | A finished reply, rules                                     | Full text, "ตามกฎ", Send back, `onReply` once with the last snapshot, `aria-busy="false"` (AC 6, 7)                                        |
| `Stopped`                | A     | Stop mid-stream                                             | Signal aborted; partial kept; "หยุดแล้ว"; no `onReply`; focus on textarea (AC 8)                                                           |
| `Failed`                 | A     | Host throws at once, and an iterable that throws mid-stream | Question kept; failure text; thrown message absent; partial gone; Send again calls `onAsk` with the same request (AC 9)                    |
| `Close`                  | A     | Close while streaming                                       | Signal aborted before `onClose`; `onClose` once (AC 10)                                                                                    |
| `Conversation`           | A     | Six exchanges, mixed states                                 | Transcript named and scrolls inside; follows the newest reply; Tab order transcript, textarea, Send, close; focus ring present (AC 11)     |
| `BasisMismatch`          | A     | `basis="rules"` with a mock reply                           | Notice says rules, reply says mock                                                                                                         |
| `Narrow`                 | A     | `Conversation` with long Thai text at 360 px                | No horizontal overflow on chat and text blocks; buttons reachable (AC 12)                                                                  |
| `English`                | A     | `Conversation` in English                                   | Strings from the `en` catalog                                                                                                              |
| `Matrix`                 | A     | `Matrix`: neutral, Professional, Friendly, light and dark   | Renders in all six boundaries; zero a11y violations (AC 27, 28)                                                                            |
| `OnBoard`                | B     | Chat beside a `CanvasBoard`, a node selected alone          | AC 13 to 16                                                                                                                                |
| `Unlinked`               | B     | No selection, no mention                                    | AC 14                                                                                                                                      |
| `Mentions`               | C     | Picker open, two chips                                      | AC 18 to 21                                                                                                                                |
| `MentionGone`            | C     | A mentioned node deleted                                    | AC 22                                                                                                                                      |
| `AtCursor`               | D     | "/" on the board                                            | AC 23, 25, 26                                                                                                                              |
| `AtCursorEdge`           | D     | Opened near the end and bottom edges                        | AC 24                                                                                                                                      |

## 15. Slice B: replies as nodes (outline)

- **Transcript.** A placed reply's meta line gains `Button ghost sm` with `JumpIcon`, text "ไปที่โหนดคำตอบ", and `aria-label` "ไปที่โหนดคำตอบเรื่อง {topic}". It is shown only while the returned id is in `useBoard().graph.nodes`. An unlinked reply shows "ไม่ได้ผูกกับโหนดใด" in `chat.muted-fg` with `FillUnlinkedIcon`, as words, never as a warning colour. The status region says "วางคำตอบเป็นโหนด {title} แล้ว".
- **The node.** A `note` (glass, as ORV-56) titled "คำตอบเรื่อง {topic}", body the reply text, `size.node.sm` wide. The basis word sits in the header row after the kind word, in the kind word's ink (`node.kind-fg`), as plain text like the status word. It is not a chip, so it cannot read as a badge of trust. No done or approved status, no rating.
- **Placement.** Its x is the source's x plus the source's measured width plus `space.grid-gap`, and its y is the source's top. Each later reply from the same source goes below the previous one plus `space.grid-gap`. With no source, it lands at the viewport centre. Following L-0015, the slice B builder probes the measured sizes in a browser before fixing the numbers. The edge is the `derived` meaning (dotted, `edge.dash.derived`), from the source's first output port to a new input port of that kind on the reply.
- **Focus and selection.** These do not move on placement. Jump uses `jumpToNode(id, { select: true })`.
- Every CanvasNode and CanvasBoard story is re-run for the `NodeContent.basis` schema change.

## 16. Slice C: mentions (outline)

- **Composer.** A chip row "โหนดที่อ้างถึง" sits above the textarea, built from `Tag size="sm"` with remove. It is neutral, never the selection colour, and is hidden when empty. A `Button ghost sm` with the new `MentionIcon` and the text "อ้างถึงโหนด" sits at the start of the actions row.
- **Picker.** It is rendered inside the chat, not in a portal, so it needs no PortalScope. It is anchored above the textarea, the full composer width, and its max block size is `chat.picker-max-block-size` (240) with a scroll. It reuses the `ds-command` option recipe (title, then the kind word in muted) and the CommandMenu combobox semantics: `aria-activedescendant` on the textarea, `role="listbox"` named "โหนดบนบอร์ด", and Escape closes the list only. The empty match says 'ไม่มีโหนดชื่อ "{query}"'. The highlighted option uses `menu.option` highlight, distinct from focus.
- **Gone chip.** The Tag keeps its normal ink (readable). Its label becomes "{title} ไม่อยู่บนบอร์ดแล้ว" with a `WarningIcon` in `feedback.warning.fg`, as caution rather than danger. There is no strikethrough, which collides with Thai upper vowels and tone marks.
- **Question.** The transcript lists its mentions under the question as plain titles, separated by commas.

## 17. Slice D: at-cursor (outline)

- **Form.** A solid `chat.bg` card with `chat.overlay-radius` (24), `chat.shadow`, `chat.layer`, and an inline size of `chat.form-inline-size` (320), never wider than the board less `space.inset.md` on each side. It is solid, not glass, because Thai replies are read in it (glass is for chrome, §3.3). The board renders it as a child placed at the screen point of `position`. It follows that point when the view pans or zooms but does not scale with zoom, so text stays readable.
- **Edges.** It opens to the end and below the point. Near the end or bottom edge it flips to the other side of the point, and it is clamped inside the board with `space.inset.md`. `AtCursorEdge` proves this at 360 px.
- **Contents.** The basis notice on one line (wrapping when needed), the latest exchange only with a max block size of `chat.form-max-block-size` and scroll, the textarea at `size="sm"` and 2 rows, Send or Stop, and close. There is no title row: the region is still named "แชทบนบอร์ด" through `aria-label`. The form carries React Flow's `nowheel nopan nodrag` classes.
- **Escape.** With the picker closed, Escape aborts and calls `onClose`. Focus returns to the node that was selected, else to the board pane. "/" in any text field types a slash.
- Its Send is the intent button. When the sidebar chat is open at the same time, the screen has two (finding F3).

## 18. Critique against the tells (frontend-design, DESIGN.md §9)

Plan in one sentence: a quiet working log beside the board, where the question sits in a well, the reply reads as a note, and the only colours are the one ask button, the engine-at-work mark, and a failure when there is one.

| #   | Tell                                             | Here                                                                                                                                                                                          |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cream-serif-terracotta, near-black-acid          | Absent. Card ground, ink text, lime only on Send. In dark mode, Send is the one lime element in the panel                                                                                     |
| 2   | Broadsheet                                       | Two hairlines in the whole panel (under the notice, above the composer). Exchanges are separated by space, and the well has radius 12                                                         |
| 3   | Card kit                                         | Avoided on purpose: no card per message, no shadow in the sidebar. Radius by level: well 12, at-cursor form 24                                                                                |
| 4   | Template chrome                                  | No caps eyebrow over "Board chat", no middot meta (the meta line separates by gap), no mono, no arrow on Send, no typing-dots indicator                                                       |
| 5   | One accented word, labels that add nothing       | "คุณ" is kept because AC 4 needs the speaker and it is the only speaker label. The textarea's label is accessible-only because a visible one would add nothing over the placeholder and place |
| 6   | Ambient motion                                   | Only the streaming mark turns, and only while the engine works. No message slides in                                                                                                          |
| 7   | Numbered markers                                 | None; the transcript is an `ol` for assistive tech, with no visible numbers                                                                                                                   |
| 8   | Lime as status, violet as tint, focus recoloured | Lime is the ask action only. No violet anywhere in the chat. Focus is `focus.ring`                                                                                                            |
| 9   | Thai with Latin rules                            | No tracking or transform; body line-height on mixed lines; Sarabun at 16 px for reading                                                                                                       |
| 10  | Studio style in the preview                      | Not a preview surface. Inside a profile boundary, Send renders as the profile's primary action                                                                                                |
| 11  | Fake evidence                                    | A notice before the first message and a basis word on every reply. Nothing says AI answered. No avatar, no engine persona, no confidence, no "done" without an ended iterable                 |
| 12  | Per-page mood patch                              | All values from `chat.*` and semantic tokens                                                                                                                                                  |

What I would have produced for any similar brief, and changed: a generic AI chat panel would use bubbles left and right, an engine avatar with a sparkle icon, three bouncing dots while waiting, suggested-prompt chips in the empty state, and a gradient send button with an arrow. Here there are no bubbles (a well and a note), no persona (the basis word stands where a name would be), one spinner that stops under reduced motion, an empty state that invites without inventing content, and a word-only Send in the one intent colour. One accessory was removed before shipping: a per-message timestamp. The component has no clock it may use (`placeReply` and the transcript put no time in the data), and it would be chrome.

## 19. Screens for visual QA

Screenshots go under `.orivilo/runs/ORV-105/<task_id>/screenshots/`, light and dark each:

1. `Idle` neutral in a 320 px panel: notice, empty text, aria-disabled Send.
2. `Conversation` neutral at 480 px: wells, replies, meta lines, transcript scrolled to the end.
3. `Streaming`, and `StreamingReducedMotion` (static mark).
4. `Stopped` and `Failed` side by side: muted stopped word compared with the danger failure and Send again.
5. `Mock` and `BasisMismatch`.
6. `Narrow` at 360 px with the long Thai question and reply: nothing clipped, actions wrapped under 320 px.
7. `Matrix`: Professional and Friendly. State colours identical; ground, well and type follow the profile; Send is the profile's primary.
8. `Conversation` with focus-visible on the transcript region, then on Send, then on close.
9. `OverLimit`: counter in danger and Send disabled-looking.
10. Slices B to D add theirs: `OnBoard` (node placed right of the source, dotted edge, basis in the header), `Mentions`, `MentionGone`, `AtCursor`, `AtCursorEdge` at 360 px.

## 20. Deltas against the spec (G2 decides; defaults proposed)

| #   | Delta                                                                                                                                                                                                                                                                                                   | Why                                                                                                                                                                                                                                                                                                                                                                     | Default                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | `Button` honours a caller's `aria-disabled` (`aria-disabled={loading \|\| rest["aria-disabled"] \|\| undefined}`), and the recipe gives `.ds-button[aria-disabled="true"]:not([data-loading])` the same colours as `:disabled` for each variant. Its click handler ignores the press when aria-disabled | AC 3 needs Send with `aria-disabled="true"` that stays focusable. Today `Button` overwrites the attribute with `undefined` (`Button.tsx`, the `aria-disabled={loading \|\| undefined}` after `{...rest}`), and the recipe only sets `cursor` for it, so an aria-disabled intent button would look enabled (DESIGN.md §7 says disabled is `aria-disabled` or `disabled`) | Accept. It is a fix to a shared component, so the slice A PR re-runs every Button story and every story that renders a Button. No existing call passes `aria-disabled` to Button today. The spec's Impact gains "Button honours `aria-disabled`" |
| D2  | When Stop or Send again unmounts while focused (reply ended, retry started), focus moves to the textarea                                                                                                                                                                                                | The spec covers focus after Stop only. Without this rule, focus drops to the body                                                                                                                                                                                                                                                                                       | Accept; add to AC 7 and AC 9 in the spec bump                                                                                                                                                                                                    |
| D3  | An iterable that ends without yielding any snapshot counts as a failure                                                                                                                                                                                                                                 | No snapshot means no reply and no basis. Placing an empty node, or showing a basis with no text, would be a fake success                                                                                                                                                                                                                                                | Accept; add a row to AC 9                                                                                                                                                                                                                        |
| D4  | "Send again" shows on the latest exchange only. An older failed exchange keeps its failure text without a button                                                                                                                                                                                        | One request at a time, and a retry far up the log would put a reply out of order below newer exchanges                                                                                                                                                                                                                                                                  | Accept                                                                                                                                                                                                                                           |
| D5  | Only the latest reply carries `aria-live`; a second `role="status"` announcer carries start, stopped, failed and (slice B) placed                                                                                                                                                                       | AC 6 says "one polite live region" for the streaming reply. The short state words must not be read as part of the reply text                                                                                                                                                                                                                                            | Accept; AC 6 reads "one polite live region for the reply"                                                                                                                                                                                        |
| D6  | The textarea's name is `aria-label` only; no visible label                                                                                                                                                                                                                                              | §18 item 5. WCAG 2.5.3 (label in name) concerns visible label text, and a placeholder is not one; a speech user can still target it as "text field"                                                                                                                                                                                                                     | Accept; if G2 prefers a visible label, it goes in the header row as the title's second line, not above the box                                                                                                                                   |

## 21. Findings

- **F1. No new semantic token was needed.** Every slot maps to an existing name.
- **F2. `aria-busy` support differs across screen readers** (VoiceOver may read snapshots). The attributes are proven by play test, and QA records a manual VoiceOver pass. If it is noisy, a later fix moves the reply's announcement to the status region at end only. That would be a spec change to AC 6, not a silent swap.
- **F3. The intent budget.** DESIGN.md §2 allows one Intent Engine button per screen. The sidebar's Send is that button. When slice D's form is open at the same time, the screen briefly has two. Proposed for slice D: while the at-cursor form is open, the sidebar's Send renders as `primary` rather than `intent`, so only the form you are typing in carries lime. Slice D's spec decides.
- **F4. Fixtures.** `src/components/fixtures.ts` gains `chatFixtures` (§14). The fixture host's replies are written in Thai and English, with no middot or em dash, and none of them says AI.

## Changelog

- v1 (2026-10-25): first design for CanvasChat, slice A in full and slices B, C and D in outline, for G2.
- v1.1 (2026-10-25): superseded in part by `docs/specs/ORV-107/design.md` v2 (spec v1.3): the chat floats as a card, the question is a pill bubble with the speaker word hidden, Send, Stop and Mention are icon-only with tooltips, Jump keeps its text, the notice sits under the composer, starters are added and the composer is one box. Sections 2, 6, 9, 15 and 16 read with those deltas; the rest holds.
