---
issue: ORV-217 (https://tpetkaew.atlassian.net/browse/ORV-217)
spec: docs/specs/ORV-217/spec.md v1.2 (deltas D1 to D5 folded in at their defaults)
role: designer (task ORV-217-design-1)
version: 1.0
---

# ORV-217 design: the copy action on a finished reply, and the back-to-latest button

## 1. Sources this design relies on

- `docs/specs/ORV-217/spec.md` v1.1: rules `copy-shown-1`, `copy-name-1`, `copy-status-1`, `latest-shown-1`, `latest-press-1`, `latest-place-1`, the Copy table, AC rows 1 to 19. This design does not change a rule; where it reads a rule more narrowly, it says so in section 11 (deltas, each with a default).
- `DESIGN.md` v1.59: §3.3 (space, size, depth, motion), §7 (state completeness), §8 (colour roles), §9 (tells), §10 (writing), §11 (design gate).
- `docs/specs/ORV-105/design.md`: §4 anatomy, §6 tokens, §7 recipe, §8 pairs, §10 focus (delta D2: a button that unmounts sends focus to the textarea), §11 live regions, §12 motion.
- The code on this branch: `CanvasChat.tsx` (the meta row at lines 550 to 585, the status region at line 762), `recipes.css` lines 4296 to 4500 (`.ds-chat*`), `generated.css` (`--cmp-chat-*`, `--cmp-button-*`), `icons.tsx` (`CopyIcon` 108, `CheckIcon` 81, `ChevronDownIcon` 85, `WarningIcon` 89).
- K-0143 (synthesis of K-0136 to K-0142): both reference buttons are icon-only, both scroll smoothly; the spec's Do not copy rows already turn those down.

## 2. Direction

One direction, because the task leaves almost no room: both additions are small controls inside a component whose look is settled (ORV-105, ORV-189). The choice is how quiet each one is.

- **Copy is a reading aid, not an event.** It is the same ghost sm button as the existing "ไปที่โหนดคำตอบ" (Go to reply node), in the same row, with the same 16 px icon. A reader sees one family of quiet actions under each reply. Its result speaks in words in the same muted voice as the basis word (copied) or in the chat's existing failure voice (failed). No toast, no tinted box, no success green: the tick on the button plus a short sentence is enough, and a green "done" for a clipboard write would be the loudest thing in a reading column.
- **Back-to-latest is the one floating thing in the chat.** It is a secondary sm pill that sits over the bottom of the transcript, centred, with the overlay shadow so it reads as above the text, not part of it. It appears and disappears at once, never fades or slides.

Rejected: an icon-only copy button with a tooltip (spec `copy-shown-1`, and a bare icon beside a basis word reads as a status mark); a copy action that appears on hover only (a touch reader would never find it, and the row height would change on hover); a back-to-latest bar across the full width (it would cover more text and read as a banner); an arrow-only round button as in K-0142 (no name, spec `latest-press-1`).

## 3. Flow

```
Reply done ──> meta row: [basis] [Copy] [Go to reply node]? [Unlinked]?
   Copy pressed ──(write pending: nothing changes)──┬─ resolves ──> icon = tick, "คัดลอกคำตอบแล้ว" at row end,
                                                    │               status region speaks it; 2000 ms later both go back
                                                    └─ rejects / no clipboard ──> warning line under the row,
                                                                    status region speaks it; stays until the next Copy press
Any Copy press replaces the one status (one per chat).

Reader scrolls up (not following) ──> new snapshot, status change or new exchange
   ──> "ไปที่ข้อความล่าสุด" shows, centred over the transcript foot
       ├─ pressed ──> scrollTop = scrollHeight at once, following on, button unmounts, focus to the textarea
       ├─ reader scrolls back within 32 px ──> button unmounts, focus untouched
       └─ a new send ──> following on, button unmounts
```

## 4. Anatomy (additions only, in DOM order)

```
ScrollArea .ds-chat__scroll
└─ li.ds-chat__exchange[data-state=done]
    └─ div.ds-chat__reply
        ├─ p.ds-chat__text
        └─ div.ds-chat__meta
            ├─ span.ds-chat__basis                       "ตามกฎ" / "By rules" (existing)
            ├─ Button ghost sm  iconLeading Copy|Check   "คัดลอก" / "Copy"   name: chat.copyLabel   (NEW)
            ├─ Button ghost sm  JumpIcon                 "ไปที่โหนดคำตอบ" (existing, board only)
            ├─ span.ds-chat__unlinked                    (existing, board only)
            └─ span.ds-chat__copied                      "คัดลอกคำตอบแล้ว" / "Reply copied"           (NEW, copied only)
               or span.ds-chat__copy-failed              mark WarningIcon + span chat.copyFailed        (NEW, failed only)
div.ds-chat__latest   (sibling right after the ScrollArea, grid-area log, only while shown)      (NEW)
└─ Button secondary sm  iconLeading ChevronDownIcon      "ไปที่ข้อความล่าสุด" / "Go to latest"
form.ds-chat__composer (existing)
```

The note is the last child of the meta row, not the child right after the Copy button: delta D1, section 11.

## 5. Layout per state

Measured with the proposed CSS (section 7) injected into `NarrowestPanel` (240 px) and `WidestPanel` (480 px), section 14.

### 5.1 Copy, idle (done reply)

```
480 px  │ ตามกฎ  [⧉ คัดลอก]  [↗ ไปที่โหนดคำตอบ]                     │  one 32 px line
240 px  │ ตามกฎ  [⧉ คัดลอก]                 │  line 1, 32 px
        │ [↗ ไปที่โหนดคำตอบ]                 │  line 2 (board only), icon on the basis word's start edge
```

- Without a board (no jump button) the row is one 32 px line at every width from 240 up, Thai and English.
- With a board, the row wraps at the 240 px panel in both locales (measured 68 px: 32 + 4 + 32). The first line never changes when it wraps (ORV-189 comment in the recipe: "the basis word never moves").

### 5.2 Copy, copied (2000 ms)

```
480 px  │ ตามกฎ  [✓ คัดลอก]  [↗ ไปที่โหนดคำตอบ]  คัดลอกคำตอบแล้ว        │
240 px  │ ตามกฎ  [✓ คัดลอก]                 │
        │ [↗ ไปที่โหนดคำตอบ]                 │
        │ คัดลอกคำตอบแล้ว                    │  muted, starts on the same edge
```

- Only the icon changes inside the button; `CheckIcon` and `CopyIcon` are both 16 px, so the button keeps its width and nothing after it moves inside line 1.
- The note wraps to its own line when it does not fit, starting on the row's start edge. At 480 it fits on line 1 in both locales.

### 5.3 Copy, failed (until the next press)

```
480 px  │ ตามกฎ  [⧉ คัดลอก]  [↗ ไปที่โหนดคำตอบ]                     │
        │ /!\ คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง                  │  failed-fg, own line
240 px  │ /!\ คัดลอกไม่ได้ ลองเลือกข้อความแล้ว    │
        │     คัดลอกเอง                        │  second line hangs on the text, not under the mark
```

- The failure line always takes a full line (`flex-basis: 100%`), at every width, so its shape is the same whether the sentence takes one line or three. The mark sits on the row's start edge, the text on one start edge after it, like `.ds-chat__failure` above it in the same recipe.
- The button keeps `CopyIcon`: a failed write never shows a tick.
- No tinted box (ORV-105 design 5.5, same reason).

### 5.4 Back-to-latest, shown

```
│ ...reply text runs under the button...  │
│        ┌───────────────────────┐        │
│        │ ⌄ ไปที่ข้อความล่าสุด     │        │  secondary sm, 32 px, centred, 16 px above the transcript foot
│        └───────────────────────┘        │
├─────────────────────────────────────────┤  (no rule: the composer box starts here)
│ [composer, unchanged]                   │
```

- Measured at 240 and 480, Thai and English, every profile and mode: the button is 32 px tall, 147 px wide in Thai and 118 px in English, centred to 0 px, inside the ScrollArea's rect, and 16 px above the composer's top. `elementFromPoint` at its centre hits the button (it paints over the transcript).
- Hidden: not rendered (spec `latest-shown-1`). Nothing is reserved for it: the transcript keeps its full height in both states.

## 6. States

### 6.1 Copy button (`Button` ghost sm)

| State         | Look                                                                                                                                                                              | Source                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| default       | No ground, no edge; `CopyIcon` and "คัดลอก" in `button.ghost.fg` (`text.primary`), 16 px icon, `type.label` sm                                                                    | Button ghost, same as the jump button |
| hover         | `surface.hover` ground and `border.subtle` edge                                                                                                                                   | Button ghost                          |
| focus-visible | `focus.ring` border plus the 3 px halo, no gap (DESIGN §7); 11 px left inside the log's 16 px padding when it starts a wrapped line, so never clipped                             | Button                                |
| pressed       | `surface.sunken` ground                                                                                                                                                           | Button ghost                          |
| pending write | Identical to default. No spinner, no `aria-busy`, no disabled state (spec `copy-status-1`): the write is near instant, and a loading look would be a state with nothing behind it | spec                                  |
| copied        | Icon becomes `CheckIcon`; `span.ds-chat__copied` at the row end; focus stays on the button                                                                                        | spec `copy-status-1`, D1              |
| failed        | Icon stays `CopyIcon`; `span.ds-chat__copy-failed` on its own line                                                                                                                | spec `copy-status-1`                  |
| disabled      | Never. The button only exists on a `done` reply                                                                                                                                   | spec `copy-shown-1`                   |
| empty reply   | A `done` reply whose text is empty: no button (D5)                                                                                                                                | D5                                    |
| selected      | Not a state of this button; the chat has no selection                                                                                                                             | ORV-105 §10                           |

The copied note is not colour alone: the tick replaces the copy glyph, and the sentence says it. The failure is not colour alone: the warning glyph and the sentence say it.

### 6.2 Back-to-latest button (`Button` secondary sm)

| State                       | Look                                                                                                                                                | Source                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| hidden                      | Not in the DOM, wrapper included                                                                                                                    | spec `latest-shown-1` |
| default                     | `button.secondary.bg` (`surface.card`), `border.control` edge, `text.primary` label, `ChevronDownIcon` 16 px; the wrapper's overlay shadow under it | Button secondary, D3  |
| hover                       | `surface.hover` ground, `border.control-hover` edge                                                                                                 | Button secondary      |
| focus-visible               | `focus.ring` border plus 3 px halo, drawn over the wrapper's shadow (the shadow is on the wrapper, so focus never removes it)                       | Button, D3            |
| pressed                     | `surface.sunken` ground for the one frame before it unmounts                                                                                        | Button secondary      |
| disabled, loading, selected | Never                                                                                                                                               | spec                  |

## 7. Recipe: the CSS the builder writes (`recipes.css`, after `.ds-chat__failure .ds-button`)

Every value is an existing `--cmp-chat-*`, `--cmp-button-*` or `--ds-*` property; `recipes.test.ts` line 44 accepts each. No new token.

```css
/* D2: a 12 px column gap, and buttons pulled back by their own 8 px inline padding, so a button that
 * wraps to the start of a line puts its icon on the basis word's edge; line 1 is unchanged. */
.ds-chat__meta {
  column-gap: var(--cmp-chat-turn-gap);
}
.ds-chat__meta .ds-button {
  padding-inline: var(--cmp-chat-inline-gap); /* existing */
  margin-inline-start: calc(-1 * var(--cmp-chat-inline-gap));
}
/* Copied: the muted voice of the basis word, at the end of the row (D1). */
.ds-chat__copied {
  min-inline-size: 0;
  overflow-wrap: anywhere;
  color: var(--cmp-chat-muted-fg);
}
/* Copy failed: always a line of its own; mark on the row's edge, text hanging after it. */
.ds-chat__copy-failed {
  display: grid;
  grid-template-columns: var(--cmp-chat-icon-size) minmax(0, 1fr);
  column-gap: var(--cmp-chat-inline-gap);
  flex-basis: 100%;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  color: var(--cmp-chat-failed-fg);
}
/* Back to latest: shares the transcript's cell, centred at its foot, painted over it (D3). */
.ds-chat__latest {
  grid-area: log;
  align-self: end;
  justify-self: center;
  position: relative;
  display: flex;
  max-inline-size: calc(100% - 2 * var(--cmp-chat-padding-x));
  margin-block-end: var(--cmp-chat-padding-x);
  border-radius: var(--ds-shape-control-radius);
  box-shadow: var(--ds-elevation-overlay);
}
```

Notes for the builder:

- `.ds-chat__copy-failed` holds `<span class="ds-chat__mark" aria-hidden="true"><WarningIcon /></span><span>{m.chat.copyFailed}</span>`. The mark class already gives the 16 px glyph and the `1lh` box that lines it up with the first text line.
- The meta row's `gap` (4 px) stays the row gap; only the column gap changes (D2). `.ds-chat__meta` keeps `flex-wrap: wrap` and `min-block-size` 32 px.
- `.ds-chat__latest` needs `position: relative` to paint over the ScrollArea's positioned parts (Radix scrollbar). No `z-index`: DOM order does the rest. Its radius reads `shape.control.radius`, the same property `--cmp-button-radius` reads, so the shadow follows the pill in neutral and friendly and the 6 px rectangle in professional (seen in the professional screenshots).
- `align-self: end` puts the button at the transcript's foot; the wrapper is shrink-wrapped (`justify-self: center`), so it covers only the button and the transcript stays scrollable and clickable beside it.
- No `transition`, `animation` or `opacity` on any of the three classes, so no reduced-motion rule is needed.
- No `letter-spacing` and no `text-transform`.

## 8. Colour pairs

No new pair. Each colour is an existing pair (`src/recipes/pairs.ts`, recipe `chat` and `button`):

| What                              | fg on bg                                              | Existing pair         |
| --------------------------------- | ----------------------------------------------------- | --------------------- |
| Copy label and icons (copy, tick) | `button.ghost.fg` on `chat.bg` (`surface.card`)       | button ghost          |
| Copied note                       | `chat.muted-fg` on `chat.bg`                          | chat muted            |
| Failure mark and text             | `chat.failed-fg` on `chat.bg`                         | chat failed           |
| Back-to-latest label, icon, edge  | `button.secondary.*` on its own `surface.card` ground | button secondary      |
| Focus                             | `focus.ring` on `chat.bg`                             | chat transcript focus |

The back-to-latest ground is opaque, so the text running behind it never meets its label. `chat.failed-fg` reads the locked `feedback.danger.fg`, so the failure is the same red under every profile; the friendly profile's coral focus ring is a line with a halo, never text, so it does not read as the failure (seen in the friendly screenshots).

## 9. Focus, keyboard and live regions

- Tab order, back-to-latest hidden: the ORV-105 AC 11 order, with every Copy button and jump button inside the transcript in DOM order (they are already in the region). Shown: transcript (and its buttons), back-to-latest, textarea, Send or Stop, close.
- Copy keeps focus through pending, copied and failed. Its name does not change, so a screen reader does not re-read the button; the status region speaks the result once (K-0114, K-0115).
- Back-to-latest pressed: focus to the textarea before the button unmounts (spec `latest-press-1`, ORV-105 D2). Hidden by scrolling or by a send while it has focus: that cannot happen by scrolling with the keyboard (focus would be on the transcript), and a send is pressed from the composer, so focus is already elsewhere.
- No new live region. The visible notes are not live; the existing `role="status"` span carries the words.

## 10. Writing

The five keys are the spec's Copy table, unchanged. Read aloud: "คัดลอก" is the verb a Thai reader expects on this button; "คัดลอกคำตอบแล้ว" names what was copied; "คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง" says what went wrong and the fix (DESIGN §10); "ไปที่ข้อความล่าสุด" matches "ไปที่โหนดคำตอบ" in form. No middot, no em dash, sentence case in English.

## 11. Deltas against the spec (each with a default)

| #   | Spec says                                                                     | Design proposes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default               |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| D1  | `copy-status-1`: the note "shows after the button"                            | After it in DOM and reading order, as the **last child** of `.ds-chat__meta`, not the next sibling. Right after the button, its 95 px (Thai) would push "ไปที่โหนดคำตอบ" right or onto another line for 2 s after every press: a control that moves under the pointer. The tick on the button gives the local feedback. AC rows 2 and 5 still hold (they look for the class, not its position)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Last child            |
| D2  | Contract table: recipe changes are the three new classes                      | Two declarations on existing rules: `.ds-chat__meta { column-gap: var(--cmp-chat-turn-gap) }` (12) and `margin-inline-start: calc(-1 * var(--cmp-chat-inline-gap))` (-8) on `.ds-chat__meta .ds-button`. With Copy, the meta row wraps at the 240 px panel when a board adds the jump button; without D2 the wrapped button's icon starts 8 px inside the basis word's edge (two start edges, screenshot `copy-neutral-min-th-light.png`). With D2 it starts on the same edge (`copy-d2-neutral-min-th-light.png`), and line 1 is pixel-identical (box gap after a text item 12 - 8 = 4, as today; between two buttons 4, as today). Side effect: between two text items (basis to "หยุดแล้ว", jump to "ไม่ได้เชื่อมกับโหนดใด") the gap grows from 4 to 12, which separates two meta items that today almost read as one phrase. OnBoard's 32 px meta check still holds at 320 px (measured content 255 of 288) | Take D2               |
| D3  | `latest-place-1`: no shadow named                                             | `box-shadow: var(--ds-elevation-overlay)` on `.ds-chat__latest` (the wrapper, so the button's focus shadow does not replace it). DESIGN §3.3 keeps the shell flat except floating layers; this button is the one floating layer inside the chat, and without it the button's edge competes with the glyphs running behind it. Dark mode reads the dark overlay shadow and relies on the edge, as the chat itself does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Shadow on the wrapper |
| D4  | `latest-place-1`: "an inset from an existing `--cmp-chat-*` padding property" | `--cmp-chat-padding-x` (16), the same as the log's own block-end padding, so the button sits on the content's 16 px frame                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 16 px                 |
| D5  | `copy-shown-1`: every `done` exchange                                         | Not when the done reply's text is empty (`reply.text === ""`): "Reply copied" for an empty string would be a success with nothing behind it (AGENTS.md). Not reached by today's fixtures; one line of logic and a play step if taken                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Hide on empty text    |

None needs a new token, a new pair or a prop. D2 is the only one that changes the look of existing stories (Stopped, Unlinked: 8 px more between meta items).

## 12. Motion

None added. The tick and the notes appear and leave at once; back-to-latest appears and unmounts at once; its press jumps instantly (spec `latest-press-1`, ORV-105 §12). Button's own 120 ms colour feedback stays, under the Button's own rule.

## 13. Edge content

- Long topic in the name (`chat.copyLabel`, 40 graphemes): not visible, no layout effect.
- English failure sentence at 240: two lines, text hanging after the mark (screenshot `copy-d2-neutral-min-en-dark.png`).
- Thai marks: "คัดลอก", "ไปที่", "ล่าสุด" in 32 px buttons with `type.label` sm line-height 1.5: no mark clipped in any of the 48 screenshots.
- Back-to-latest label at 240: 147 px of a 208 px maximum (Thai), 118 px (English). A label over the maximum is not possible with today's catalog; the button stays `nowrap` like every Button.
- A short transcript that does not overflow cannot be "away from the end", so the button never shows over an empty or short chat.

## 14. Proof rendered for this design

The CSS of section 7 and the DOM of section 4 were injected (`page.addStyleTag`, DOM clones of a real exchange, Lucide paths of the four icons) into `application-canvas-chat--narrowest-panel` (240) and `--widest-panel` (480) on a local Storybook (port 6117), at 2x. Each config has two shots: `copy-*` (three exchanges: idle with the Copy button focused by keyboard, copied, failed; jump button present) and `latest-*` (scrolled to the top, back-to-latest shown and focused by Tab).

The write guard blocks a shell write that names the run-record folder, so the PNGs are in the session scratchpad, not the run folder: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/4c42d0ab-c7b3-4866-8936-343e8f35297b/scratchpad/orv217-shots/`. Script: `.../scratchpad/orv217-design.mjs` (`D2=1` adds the D2 rules).

| Set        | Profiles               | Widths         | Locales | Modes       | Files |
| ---------- | ---------------------- | -------------- | ------- | ----------- | ----- |
| Without D2 | neutral                | 240, 480       | th, en  | light, dark | 16    |
| With D2    | neutral                | 240, 480       | th, en  | light, dark | 16    |
| With D2    | professional, friendly | 240 th, 480 en |         | light, dark | 16    |

Measured in every one of the 24 configs: back-to-latest focused by Tab, inside the ScrollArea, centred (0 px), 16 px above the composer, hit at its centre. Meta row heights: 240 px, 68 / 92 / 111 (idle, copied, failed); 480 px, 32 / 32 / 56.

## 15. Critique against the tells (DESIGN §9)

- 3 card kit: nothing new is a card. 4 template chrome: no caps, no middot, no arrow on an action (the chevron points where the view goes, and the jump's glyph existed). 6 ambient motion: none. 8 lime or violet misuse: no brand colour read; focus through `focus.*` only. 9 Thai with Latin rules: no tracking, no transform. 11 fake evidence: the tick shows only after the write resolves (spec), and D5 removes the empty case. 12 per-page mood patch: tokens only.

## 16. Screens for visual QA (the designer sign-off, AC row 19)

At the narrowest and widest container each story allows (240 and 480 for the panel frames; `BackToLatest` uses the spec's 360 by 480 frame, so 360 is both), Thai and English, light and dark:

1. `CopyReply`, after the click: the tick, the note at the row end, focus on the button. Check the note sits on the row's start edge when it wraps.
2. `CopyFailed`: the warning line on its own line, text hanging after the mark, in the failure red, Copy icon unchanged.
3. `CopyStates`: no Copy on stopped, failed or streaming; the stopped row's gap (D2).
4. `BackToLatest`, shown and focused: centred, over the text, 16 px above the composer, shadow under the focus halo; then hidden, nothing in its place.
5. `RecipesAndModes`: Copy under neutral, professional and friendly, light and dark; professional shows the 6 px button radius and the matching shadow corner.
6. `OnBoard` or `Unlinked` at 240: the wrapped jump button's icon on the basis word's edge (D2), focus halo not clipped at the log's start padding.

## Changelog

- 1.0 (2026-11-02): first version for spec v1.1. Deltas D1 to D5 with defaults; 48 screenshots of the proposed CSS injected.
