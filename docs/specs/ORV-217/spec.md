---
issue: ORV-217 (https://tpetkaew.atlassian.net/browse/ORV-217)
lane: as set on ORV-217 in Jira (not read in this role). No risk flag applies by this spec's reading (AGENTS.md, "Lanes and gates"): no `CanvasChatProps` change, no token, no profile or schema, no resolver, no auth or data access. The change adds locale keys and recipe classes only ("Contract changes and impact"). If the builder finds that a new token or prop is needed, that is a contract change: the spec version goes up and the lane is checked again
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_rows: docs/specs/ORV-64/audit.md section D.1 rows 3 and 4; section C rows Conversation and Message
version: 1.0
---

# ORV-217: CanvasChat copy action on a finished reply, and a back-to-latest button

## Benchmark

These tables follow the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247), plus an AI Elements row because audit section C maps both additions from it. `docs/knowledge/` has no entry yet for Untitled UI Messaging, shadcn/ui Bubble or Message Scroller, or the AI Elements Message and Conversation props. Those cells come from audit sections A.2 and C, and where the audit did not read the page the cell says **open research need**. The Ours row is the code at `packages/design-system/src/components/canvas-chat/CanvasChat.tsx` on this branch. The Add and Do not copy rows are this spec's choices, and each one names the rule in "Rules" that holds it.

### Copy action on a reply

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | **Open research need.** The audit lists "Messaging" as present in Untitled (audit A.2, Messaging row, source <https://www.untitledui.com/react/components>) but did not read its page; the Sources list in the audit has no messaging page. Variants, sizes, states and slots of a message action are not known. |
| shadcn/ui | **Open research need.** "Bubble" and "Message Scroller" are in the shadcn index (audit A.2, row "Attachment, Bubble, Message Scroller", source <https://ui.shadcn.com/docs/components>), "pages not read". No knowledge entry. |
| AI Elements | Message (read in the audit, <https://elements.ai-sdk.dev/components/message>): user and assistant message blocks with actions retry, copy, like and share, and branching between versions (audit C, Message row). Verdict there: "copy and retry only", mapped to `MessageActions` in `ChatMessage` (audit C, Message and Actions rows). Exact prop names were not recorded; the audit says to re-check them on the source page (audit, Sources, last line). |
| Ours | Per exchange: the reply text as a React text child in `p.ds-chat__text`, and a `ds-chat__meta` row with the basis word, "หยุดแล้ว" / "Stopped" on a stopped reply, and on a placed reply a ghost sm "ไปที่โหนดคำตอบ" / "Go to reply node" button with `jumpLabel` as its name. A failed latest reply has "ส่งอีกครั้ง" / "Send again" (`m.chat.retry`). No copy action, and nothing in the package calls the system clipboard (the board's clipboard is its own, `CanvasBoard.tsx` line 314). `CopyIcon` and `CheckIcon` exist in `icons.tsx` (lines 108, 81). One polite `role="status"` region for announcements. |
| Add | A copy button on each finished reply, in the meta row: `copy-shown-1`. It places the reply's plain text only: `copy-text-1`. It shows success only after the write resolves, and it says plainly when the write fails: `copy-status-1`. It names which reply it copies, like the jump button does: `copy-name-1`. |
| Do not copy | Like, share and branch actions (audit C, Message and Branch rows): there is no backing data for a rating (AGENTS.md, no ratings without backing data), no share target, and versions belong to VersionBadge. Copying Markdown or HTML (audit C, MessageResponse row): replies render as text, never HTML (`copy-text-1`). A success tick shown on press, before the write resolves: a success state with no backing data (`copy-status-1`). |

### Back-to-latest button

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | **Open research need.** Same as above: the Messaging page was not read (audit A.2). Whether it has a scroll-to-latest control is not known. |
| shadcn/ui | **Open research need.** "Message Scroller" is in the index, page not read (audit A.2). It may be the closest match; check it before the design. |
| AI Elements | Conversation (read in the audit, <https://elements.ai-sdk.dev/components/conversation>): a scroll container that pins to the newest message, shows a "back to latest" button, an empty state, and a Markdown export (audit C, Conversation row). Verdict there: "keep it to scroll, pin and empty state", on `ScrollArea`. When the button shows, its label and how focus moves were not recorded (open research need). |
| Ours | The transcript is a `ScrollArea` named "บทสนทนา" / "Conversation". It follows the newest reply while the view is within `FOLLOW_SLACK` (32 px) of the end (`CanvasChat.tsx` lines 111, 236 to 249), it stops following when the reader scrolls up, and a new send turns following back on (`start`, line 365). The streaming reply sits in a polite live region with `aria-busy` (lines 543 to 547). The view does not show that new text arrived below it, and there is no way back to the end except scrolling. `ChevronDownIcon` exists (`icons.tsx` line 85). |
| Add | A button that shows only when the reader is away from the end and new text has arrived since: `latest-shown-1`. Pressing it goes to the end and turns following back on: `latest-press-1`. It sits over the bottom of the transcript and does not move the composer: `latest-place-1`. The new text is still announced by the existing live region (K-0113, K-0114, K-0115), so the button adds no announcement of its own (`latest-shown-1`). |
| Do not copy | Smooth scrolling: ORV-105 design section 12 "Motion and reduced motion" keeps following instant, and a pressed jump follows the same rule (`latest-press-1`). A button shown whenever the view is not at the end, even with nothing new: the issue asks for the case where new text arrives (`latest-shown-1`, open question 2). Markdown export of the conversation (audit C, Conversation row): out of scope. |

## Goal

Two gaps in the sidebar CanvasChat, from audit D.1 rows 3 and 4 and the ORV-217 issue. First, a person who wants to keep a reply has to select its text by hand; each finished reply gets a copy button. Second, a person who scrolls up to reread while a reply is still streaming loses track of the new text below; a "ไปที่ข้อความล่าสุด" / "Go to latest" button shows in that case and takes them back to the end.

What is simulated: replies still come from a fixture host that streams canned or rule-based text (ORV-105, "What the MVP simulates"). Copy places whatever text the reply shows. It claims nothing about where that text came from beyond the basis word the reply already carries. In stories the play replaces `navigator.clipboard` with a stub. No story writes to the real system clipboard.

## Story

As a person using the board chat, I press "คัดลอก" under a reply and get its text in my clipboard, with the chat telling me it worked or that it did not. When I scroll up while a reply is still coming in, a "ไปที่ข้อความล่าสุด" button takes me back to the newest text.

## Rules

### copy-shown-1

A copy button renders in the `ds-chat__meta` row of every exchange whose status is `done`, latest or not. It renders nothing while the reply is streaming, on a `stopped` reply, or on a `failed` exchange (open question 1). It is a `Button` `variant="ghost"` `size="sm"` with `iconLeading={<CopyIcon />}` and the visible text `chat.copy`. It sits after the basis word and before the jump button. It does not depend on a board: it shows outside a `CanvasBoard` too.

### copy-name-1

The copy button's accessible name is `fill(m.chat.copyLabel, { topic: replyTopic(exchange.request.text, locale) })`, the same topic as `jumpLabel` (`place-reply.ts`, `TOPIC_LENGTH` 40 graphemes). The name starts with the visible text `chat.copy` in both locales (SC 2.5.3). Worked example W3.

### copy-text-1

A press calls `navigator.clipboard.writeText(reply.text)` with the reply's last snapshot text exactly as shown: not trimmed, line breaks kept, no question text, no basis word, no mention titles. It never calls `navigator.clipboard.write` with a `text/html` or any other item, never builds HTML or Markdown, and never reads the clipboard. Markup in a reply is copied as the same characters. Worked example W2.

### copy-status-1

The copy status is one value per chat, `{ exchangeId, result }` with `result` `"copied"` or `"failed"`, or none.

- When `writeText` resolves, the status becomes `"copied"` for that exchange. While it holds, the button's icon is `CheckIcon` and a `span.ds-chat__copied` reading `chat.copied` shows after the button. The status region announces `chat.copied`. The status clears `COPIED_MS` (2000) ms after the write resolves, and the icon goes back to `CopyIcon`. A later press on any copy button replaces the status at once.
- When `writeText` rejects, or `navigator.clipboard?.writeText` is not a function, the status becomes `"failed"` for that exchange. A `span.ds-chat__copy-failed` shows after the button, with a `WarningIcon` mark and `chat.copyFailed`, in the chat's failure colour. The status region announces `chat.copyFailed`. The failed status does not clear on a timer. The next press of any copy button replaces it.
- Before the write resolves, nothing changes: no tick, no text, no announcement. The rejection's message is never shown.
- The button's name, `copy-name-1`, does not change with the status. Focus stays on the button.
- A status whose exchange is replaced (Send again) or whose chat unmounts is dropped. A write that resolves after unmount sets nothing.

### latest-shown-1

The button shows when both of these hold: (1) the transcript is not following, by the existing test `scrollHeight - scrollTop - clientHeight <= FOLLOW_SLACK` being false; (2) the exchanges changed (a new snapshot, a status change, a new exchange) while (1) held. It hides when the reader scrolls back within `FOLLOW_SLACK` of the end, when it is pressed (`latest-press-1`), or when a send turns following on. Reading up with nothing new does not show it. The button carries no live region and makes no announcement: the reply's polite live region already speaks the new text. Worked example W1.

### latest-press-1

A press sets the viewport's `scrollTop` to its `scrollHeight` at once (no smooth scroll), turns following back on, and hides the button. The button unmounts, so focus moves to the textarea, as ORV-105 design delta D2 does for a button that unmounts. The button is a `Button` `variant="secondary"` `size="sm"` with `iconLeading={<ChevronDownIcon />}` and the visible text `chat.toLatest`, which is also its whole accessible name.

### latest-place-1

The button renders as a sibling right after the `ScrollArea`, in a `div.ds-chat__latest` that shares the `log` grid area. It is aligned to the end of the block axis and the centre of the inline axis, with an inset from an existing `--cmp-chat-*` padding property. Coming later in the DOM, it paints over the transcript. It never changes the size of the transcript or the composer. At a 360 px frame it stays inside the chat and does not cover the composer. In the Tab order it comes after the transcript and before the textarea, only while it is shown.

### chat217-copy-1

Five new keys go in the existing `chat` group in `src/i18n/messages/th.ts` and `en.ts` (table "Copy"). The two additions own no other copy.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| Five `chat` keys (`chat217-copy-1`) | Locale catalog | `th.ts`, `en.ts`; `check-i18n` and `i18n.test.ts` check key and placeholder parity |
| Recipe classes `ds-chat__latest`, `ds-chat__copied`, `ds-chat__copy-failed` (`latest-place-1`, `copy-status-1`) | Recipe | `recipes.css` only, values from existing `--cmp-chat-*` and `--ds-*` properties. `ds-chat__copied` reads `--cmp-chat-muted-fg` and `ds-chat__copy-failed` reads `--cmp-chat-failed-fg`, both pairs the chat already declares. The back-to-latest button is a secondary Button on the chat ground, so it uses the Button pairs. No new token and no new pair are expected; if the designer needs one, the spec version goes up |
| `COPIED_MS` constant, copy status, unseen-text flag | Component internal | `CanvasChat.tsx`; not exported |
| `CanvasChatProps`, `ChatRequest`, `ChatReply` | Component API | Not changed |
| `catalog/application/canvas-chat.yaml` | Catalog | Gains the two behaviours in its rules and a11y lines; status stays `draft` |

Not changed: `Button`, `ScrollArea`, `Textarea`, `Tag`, any token or profile, `apps/web`, every existing ORV-105, ORV-106 and ORV-107 AC row.

### Copy

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `chat.copy` | คัดลอก | Copy |
| `chat.copyLabel` | คัดลอกคำตอบเรื่อง {topic} | Copy reply on {topic} |
| `chat.copied` | คัดลอกคำตอบแล้ว | Reply copied |
| `chat.copyFailed` | คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง | Could not copy. Select the text and copy it yourself |
| `chat.toLatest` | ไปที่ข้อความล่าสุด | Go to latest |

## Acceptance criteria

Story file: `application/CanvasChat` (id `application-canvas-chat`, `CanvasChat.stories.tsx`). Plays run in Thai; `InEnglish`-style stories nest `LocaleProvider locale="en"`. A copy play installs a stub on `navigator.clipboard` (`Object.defineProperty`, restored after the play), records the argument of `writeText`, and resolves or rejects it when the play says. Fixtures come from `chatFixtures` in `src/components/fixtures.ts`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Story `CopyReply`, neutral, light, Thai, `chatFixtures.host(chatFixtures.replyLines)`, question `chatFixtures.question` | The reply ends | Under the reply, after "ตามกฎ": a ghost button "คัดลอก" with a copy icon | None. `getByRole("button", { name: "คัดลอกคำตอบเรื่อง สรุปโหนดแบรนด์ให้หน่อย", exact: true })` exists (`copy-shown-1`, `copy-name-1`, W3) | `CopyReply` play |
| 2 | Same, a resolving stub | "คัดลอก" is clicked | A tick in place of the copy icon and "คัดลอกคำตอบแล้ว" beside it; focus stays on the button | `writeText` called once with exactly `chatFixtures.replyLines` (4 lines); the `role="status"` region reads "คัดลอกคำตอบแล้ว" (`copy-text-1`, `copy-status-1`, W2) | `CopyReply` play step |
| 3 | Same, after row 2 | 2000 ms pass (fake timers or `waitFor`) | "คัดลอกคำตอบแล้ว" is gone; the copy icon is back | None. No `.ds-chat__copied` in the canvas (`copy-status-1`) | `CopyReply` play step |
| 4 | Story `CopyPending`, a stub that does not resolve until the play releases it | "คัดลอก" is clicked | Nothing changes yet: no tick, no "คัดลอกคำตอบแล้ว" | Status region text unchanged; after release, row 2's view (`copy-status-1`) | `CopyPending` play |
| 5 | Story `CopyFailed`, a rejecting stub (`new Error("NotAllowedError")`) | "คัดลอก" is clicked | A warning mark and "คัดลอกไม่ได้ ลองเลือกข้อความแล้วคัดลอกเอง" in the failure colour; no tick; the thrown text is not shown | Status region reads `chat.copyFailed`; "NotAllowedError" not in the document; `.ds-chat__copy-failed` `getComputedStyle().color` equals that of `.ds-chat__failure` in a probe (`copy-status-1`) | `CopyFailed` play |
| 6 | Same story, `navigator.clipboard` set to `undefined` | "คัดลอก" is clicked | The same failure text as row 5 | Same as row 5 (`copy-status-1`) | `CopyFailed` play step |
| 7 | Story `CopyStates`: one stopped reply, one failed exchange, one streaming reply held by `hostLatch` | Rendering | No "คัดลอก" on the stopped, failed or streaming reply; after `release()` the now-done reply shows it | `queryAllByRole("button", { name: /^คัดลอก/ })` length 0, then 1 (`copy-shown-1`) | `CopyStates` play |
| 8 | Story `CopyMarkup`, a host reply `<b>ตัวหนา</b> ในคำตอบ` | "คัดลอก" is clicked | The reply shows the markup as characters (unchanged ORV-105 rule) | `writeText` argument equals `<b>ตัวหนา</b> ในคำตอบ` exactly; the stub's `write` (any item form) is never called (`copy-text-1`) | `CopyMarkup` play |
| 9 | Story `CopyInEnglish`, `questionEn`, `replyEn`, a resolving stub | The reply ends and "Copy" is clicked | "Copy" button, then "Reply copied" | Button name "Copy reply on Summarise the brand node" (exact); status region "Reply copied" | `CopyInEnglish` play |
| 10 | Story `BackToLatest`, 360 by 480 px frame, five finished exchanges so the transcript overflows, then a sixth held by `hostLatch` | The play scrolls the viewport to `scrollTop` 0, then the host yields one more snapshot | A secondary button "ไปที่ข้อความล่าสุด" with a down chevron over the bottom of the transcript, centred; the composer has not moved | Before the snapshot: no button (`latest-shown-1` case "nothing new"). After it: `getByRole("button", { name: "ไปที่ข้อความล่าสุด", exact: true })`; composer `getBoundingClientRect().top` unchanged; the button's rect lies inside the ScrollArea's rect (`latest-shown-1`, `latest-place-1`, W1) | `BackToLatest` play |
| 11 | Same, button shown | The button is clicked | The view jumps to the end at once; the button is gone; focus is in the textarea | Viewport `scrollHeight - scrollTop - clientHeight` at most 32; no button; textarea `toHaveFocus()` (`latest-press-1`) | `BackToLatest` play step |
| 12 | Same, button shown again after scrolling up and one more snapshot | The reader scrolls back to the end by hand | The button is gone | No button after the scroll event (`latest-shown-1`) | `BackToLatest` play step |
| 13 | Same, button shown | A new message is sent | The button is gone; the transcript follows the new reply (ORV-105 AC 11 unchanged) | No button; viewport at the end (`latest-shown-1`) | `BackToLatest` play step |
| 14 | Same, button shown | Tab from the transcript | Focus lands on "ไปที่ข้อความล่าสุด", then the next Tab reaches the textarea | `toHaveFocus()` in that order (`latest-place-1`) | `BackToLatest` play step |
| 15 | Same, a screen reader on | The button shows | Nothing new is announced by the button; the reply's live region keeps its `aria-live="polite"` and `aria-busy` as in ORV-105 AC 6 | The button and its wrapper have no `aria-live` and no `role="status"`; the status region text unchanged by the button showing (`latest-shown-1`) | `BackToLatest` play step |
| 16 | Story `BackToLatestInEnglish` | Same as row 10 | "Go to latest" | Button name "Go to latest" (exact) | play |
| 17 | Story `RecipesAndModes` (existing) gains one done reply with "คัดลอก" in each boundary | Rendering through `Matrix` | Six boundaries (neutral, professional, friendly, each light and dark), each with a copy button | 6 copy buttons; colours from existing Button ghost and chat pairs, proven by `recipes.test.ts` and `pnpm contrast` | `RecipesAndModes` play count |
| 18 | The PR head | `check-catalog`, `check-i18n`, `i18n.test.ts`, the copy check, `recipes.test.ts`, the a11y addon run | Not a screen | The five keys exist in Thai and English with matching placeholders; no middot or em dash in new copy; every value of the three new classes passes `recipes.test.ts`; zero a11y violations in the new stories (`chat217-copy-1`) | `pnpm --filter @orivilo/design-system test`, `pnpm contrast` |
| 19 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `CopyReply` (copied), `CopyFailed`, `BackToLatest` (shown) | The copy button reads as a quiet action beside the basis word, not as status; the failure reads as a failure; the back-to-latest button floats over the text without hiding the composer | None | Designer visual sign-off with screenshots |
| 20 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/canvas-chat`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows per PR

One PR is expected for all rows, about 300 to 400 changed lines. The main session adds the PR line once the PR exists, in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`), with a changelog line.

Placeholder: no PR line yet (the PR does not exist).

## Rows that render nothing

- Rows: 18, 20

## Out of scope

- The at-cursor variant of CanvasChat and the rest of ORV-105 slice D (ORV-105 AC rows 23 to 26).
- Phase 2 work: a real chat adapter, a pinned model, AI-labelled replies, and wiring the chat into `apps/web`.
- Copy on a stopped, streaming or failed reply, and copy of the question (open question 1).
- Copy as Markdown or HTML, a copy-all of the transcript, Markdown export (audit C, Conversation row).
- Like, share and branch actions on a message.
- A count of new messages on the back-to-latest button, and smooth scrolling.
- Any change to `Button`, `ScrollArea`, tokens or profiles.

## Open questions (each with a default)

| #   | Question                              | Options                                                                                                             | Default                                                                                                                                                                   |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Which replies get Copy                | Done only; done and stopped (the partial text)                                                                      | Done only, the same set `onReply` receives (`copy-shown-1`)                                                                                                               |
| 2   | When back-to-latest shows             | Only when new text arrived while away; whenever the view is away from the end                                       | Only when new text arrived (`latest-shown-1`), as the issue words it                                                                                                      |
| 3   | Where focus goes after back-to-latest | The textarea; the transcript region; the latest reply                                                               | The textarea, as ORV-105 delta D2 does for a button that unmounts (`latest-press-1`)                                                                                      |
| 4   | How long "คัดลอกคำตอบแล้ว" stays      | 2000 ms; until the next press; until focus leaves                                                                   | 2000 ms (`COPIED_MS`, `copy-status-1`); a failure stays until the next press                                                                                              |
| 5   | Untitled UI and shadcn/ui cells       | Research the Messaging, Bubble and Message Scroller pages before the design; build on the AI Elements reading alone | Research first: one `research` task adds knowledge entries, and the benchmark cells marked "open research need" are filled in a spec revision before the builder envelope |

## Depends on

- `docs/specs/ORV-64/audit.md` section A.2 (Messaging; Attachment, Bubble, Message Scroller rows), section B (table form), section C (Conversation, Message, MessageResponse, Actions, Branch rows), section D.1 rows 3 and 4.
- `docs/specs/ORV-105/spec.md` (AC 6, 7, 11; rules "Untrusted text" and "One request at a time"; "What the MVP simulates") and `docs/specs/ORV-105/design.md` (delta D2 in section 10 "Focus and keyboard", section 11 "Live regions", section 12 "Motion and reduced motion").
- `packages/design-system/src/components/canvas-chat/CanvasChat.tsx` (`FOLLOW_SLACK`, follow logic, status region) and `place-reply.ts` (`replyTopic`, `TOPIC_LENGTH`).
- ORV-137 comment 10247 (benchmark table in POC mode); ORV-138 `qa-scope-1` (Rows per PR form).
- AGENTS.md rule 4 (honesty labels), "no success states without backing data", "model output is data".
- `.claude/rules/design-system.md` ("Components", "UX and writing").

## Knowledge

- K-0113: aria-busy defers announcements, so the reply's live region already speaks the finished text and the button adds none
- K-0114: role status is a polite live region, the home of the copy result announcement
- K-0115: SC 4.1.3, the copy result is a status message and is announced without moving focus

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The show rule of `latest-shown-1`. Input: `FOLLOW_SLACK` 32 (`CanvasChat.tsx` line 111). Four cases as `[scrollHeight, scrollTop, clientHeight, new text since away]`: `[1000, 600, 400, true]`, `[1000, 568, 400, true]`, `[1000, 567, 400, true]`, `[1000, 567, 400, false]`. Expected output, one line per case as `following shown`: `true false`, `true false`, `false true`, `false false`. Integers, no rounding.

```bash
node -e 'const SLACK=32;const follow=(h,t,c)=>h-t-c<=SLACK;for(const [h,t,c,u] of [[1000,600,400,true],[1000,568,400,true],[1000,567,400,true],[1000,567,400,false]]){const f=follow(h,t,c);console.log(f,!f&&u)}'
```

W2. The copy payload of `copy-text-1`. Input: `chatFixtures.replyLines` (`fixtures.ts` line 248), with a stub `writeText`. Expected output: `true 4` (the written text equals the reply exactly, and it keeps its 4 lines).

```bash
node -e 'const t="สรุปโหนดแบรนด์\nสีหลักสองสี\nฟอนต์หัวข้อ Anuphan\nยังไม่มีเสียงของแบรนด์";let w;const clip={writeText:s=>{w=s;return Promise.resolve()}};clip.writeText(t).then(()=>console.log(w===t,w.split("\n").length))'
```

W3. The copy name of `copy-name-1`. Input: `chatFixtures.question` "สรุปโหนดแบรนด์ให้หน่อย" and `questionEn` "Summarise the brand node" (`fixtures.ts` lines 239, 240), `TOPIC_LENGTH` 40 (`place-reply.ts` line 19), the `copyLabel` keys of the Copy table. Expected output: `คัดลอกคำตอบเรื่อง สรุปโหนดแบรนด์ให้หน่อย` then `Copy reply on Summarise the brand node`. Both questions are under 40 graphemes, so nothing is cut.

```bash
node -e 'const topic=(q,l)=>Array.from(new Intl.Segmenter(l,{granularity:"grapheme"}).segment(q.replace(/\s+/g," ").trim())).slice(0,40).map(s=>s.segment).join("");console.log("คัดลอกคำตอบเรื่อง {topic}".replace("{topic}",topic("สรุปโหนดแบรนด์ให้หน่อย","th")));console.log("Copy reply on {topic}".replace("{topic}",topic("Summarise the brand node","en")))'
```

## Changelog

- v1.0 (2026-11-02): first version, from audit D.1 rows 3 and 4 and audit C (Conversation, Message), with the benchmark cells that have no source marked as open research needs. Downstream to review: a research envelope for the open cells (open question 5), the designer envelope (placement, look of the copied and failed notes, back-to-latest button), the builder envelope (one PR, rows 1 to 20), the qa envelope (the Rows per PR line once the PR exists), `catalog/application/canvas-chat.yaml`.
