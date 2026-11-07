---
issue: ORV-119 (https://tpetkaew.atlassian.net/browse/ORV-119)
lane: S (test code only, no contract change)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1
base: develop at `eeb2e71` (repo line numbers below are read there)
---

# ORV-119: CanvasChat plays read names from the active locale

## Why

ORV-39 let every play assert Thai copy under the default locale (`docs/specs/ORV-39/spec.md` line 48). On 2026-10-22 the owner made Storybook open in English (`packages/design-system/.storybook/preview.tsx` lines 47 to 55), while the Vitest run of the stories still starts in Thai (`packages/design-system/vite.config.ts` line 26). A play that looks up Thai copy as a literal therefore passes in CI and throws on the Storybook dev server in English. The preview logs the failure as a console error and marks the story failed (Storybook 10.6.3, `dist/preview/runtime.js` lines 35754 to 35759, 35786 to 35795 and 37176 to 37178). ORV-116 fixed four CanvasChat stories and the Send play (`docs/specs/ORV-116/spec.md` row 2); the issue counts 22 CanvasChat plays that still throw in English (`throws-set`). Whoever opens them in the default language sees failed plays and console errors that hide a real fault.

The ORV-116 review (review-2, finding R3) found a second gap. The either-catalog matcher (`SEND`, `STOP`, `YOU` and the default name of `input()`, `CanvasChat.stories.tsx` lines 168 to 192) accepts a name from either catalog, so no play can catch a name the chat shows in the wrong language. The owner decided in ORV-119 comment 10181: "match on catalogOf(globals) for the active locale as Idle does; keep the either-catalog matcher only where a story's locale decorator overrides the toolbar". The first half is `toolbar-locale-1`, the second `own-locale-1`. The comment is the later decision, so where the issue text calls `SEND`, `STOP` and `YOU` the pattern, this spec follows the comment. The issue text also says ORV-116 made `input()` read the active catalog; on the base its default name still accepts either catalog (lines 168 to 177).

What is real: this is test code only (`stories-only-1`). Every reply in these stories comes from a fixture host that streams canned text, worked out by rules or mock data; nothing here is AI.

## User story

As the owner, I open the CanvasChat stories in Storybook in English or Thai, light or dark, and every play runs to the end with a clean console. A play fails when the chat shows a name in the wrong language, so a red play means a real fault.

## Scope

The 43 stories of `packages/design-system/src/components/canvas-chat/CanvasChat.stories.tsx` (title "Application/Canvas chat"): 35 written out and 8 made by `goneStory` (lines 1624 to 1673), each with a play. Each story is in exactly one of four sets, read from the stories file on the base (worked example 2):

- `throws-set`, 22 stories. The play looks up Thai copy as a literal, so it throws under `locale:en`: Mock, BlankSend, OverLimit, CounterThreshold, Streaming, Replied, RepliedLines, FocusKeptOnEnd, FocusKeptOnFail, Stopped, Failed, FailedMidStream, FailedNoReply, Close, Conversation, BasisMismatch, Narrow, NarrowestPanel, WidestPanel, RecipesAndModes, Unlinked, MentionFromMenu.
- `lenient-set`, 6 stories. The play passes under `locale:en` only through the either-catalog matcher, or through an absence check on a Thai name that English copy can never match: Send, ImeCompose, StreamingReducedMotion, NoClose, NoBoardNoMention, MentionsSmallest.
- `done-set`, 4 stories. The play already reads `catalogOf(globals)` (ORV-116): Idle, OnBoard, Mentions, MentionGone.
- `own-locale-set`, 11 stories. The story's decorator, or its render for StartersAtWidths, wraps the chat in its own `LocaleProvider`: English, StartersAtWidths, MentionGoneNarrow, MentionGoneNarrowDark, MentionGoneNarrowEnglish, MentionGoneNarrowEnglishDark, MentionGonePanel, MentionGonePanelDark, MentionGonePanelEnglish, MentionGonePanelEnglishDark, MentionsEnglish.

The plays of `throws-set` and `lenient-set` (28) change; `toolbar-locale-1` and `own-locale-1` say what each set's play must do, and row 1 walks all 43. One PR into `develop`, bounded by `stories-only-1`.

## Acceptance criteria

| #   | Given                                                                                                                                           | When                                                                               | User sees                                                                                                                                                                                                                             | Data effect                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | The Storybook dev server runs on the PR head (port 6100)                                                                                        | The walk of `walk-1` opens the 43 stories of Scope under the four globals it lists | Each story renders and its play runs to the end, with 0 console errors on each of the 172 loads                                                                                                                                       | None. Fixture hosts stream canned text, by rules or mock data, never AI |
| 2   | The 11 plays the issue names: OverLimit, BlankSend, Streaming, Replied, Failed, Stopped, Narrow, Close, Conversation, Unlinked, MentionFromMenu | Each runs under `locale:en`, then `locale:th`                                      | Each play finds the copy of that locale, as Names each play reads lists, for example "Characters: 2,010 of 2,000, 10 over the limit" and "ตัวอักษร 2,010 จาก 2,000 เกินมา 10 ตัวอักษร" (OverLimit), "Close chat" and "ปิดแชท" (Close) | None                                                                    |
| 3   | A play of `throws-set`, `lenient-set` or `done-set` (32 stories)                                                                                | It looks up a name or a text the chat shows                                        | A code read of each play finds every lookup made as `toolbar-locale-1` states (ORV-119 comment 10181)                                                                                                                                 | None                                                                    |
| 4   | The Vitest `storybook` project, which runs every story in Thai (`vite.config.ts` line 26)                                                       | One mutation of `mutation-1` at a time is made in `CanvasChat.tsx`                 | The play `mutation-1` names for it fails on the PR head: a name in the wrong locale fails the play (ORV-116 review-2 R3)                                                                                                              | None. Each mutation is reverted and never committed                     |
| 5   | A story of `own-locale-set` (11 stories), whose own `LocaleProvider` overrides the toolbar locale                                               | It runs under `locale:en`, then `locale:th`                                        | The chat keeps the story's own locale, for example "Board chat" (English) and "ไม่อยู่บนบอร์ดแล้ว" (MentionGoneNarrow), and the play reads names as `own-locale-1` states (ORV-119 comment 10181)                                     | None                                                                    |
| 6   | The PR into `develop`                                                                                                                           | Its diff is read and `pnpm --filter @orivilo/design-system test` runs              | The diff holds only what `stories-only-1` allows, and the run passes with the 43 CanvasChat stories in it                                                                                                                             | None                                                                    |

Rows 1, 2 and 5 are checked on the walk of `walk-1`, row 3 by reading the plays, row 4 in Vitest, row 6 on the PR diff and its test run. Done when rows 1 to 6 pass on the PR head.

## Rules and bounds

### walk-1

The dev-server walk that rows 1, 2 and 5 run, driving a browser as `.claude/skills/webapp-testing/SKILL.md` does:

1. On the PR head, start `pnpm --filter @orivilo/design-system storybook` (Storybook 10.6.3 on port 6100, `packages/design-system/package.json` line 18).
2. Take each story's id: `application-canvas-chat--` and the export name in kebab case, as Storybook builds it from the title "Application/Canvas chat" and the export name (worked example 3), for example `application-canvas-chat--over-limit`.
3. Open `http://localhost:6100/iframe.html?id=<id>&viewMode=story&globals=<globals>` in a new Chromium page through Playwright, once with each of the four globals `locale:en;mode:light`, `locale:en;mode:dark`, `locale:th;mode:light` and `locale:th;mode:dark`. The profile stays neutral.
4. From navigation until `window.__STORYBOOK_PREVIEW__.currentRender.phase` reads `finished`, count every `console` message of type `error` and every `pageerror` event. The preview reaches `finished` after the play whether it passed or threw (`runtime.js` lines 35777 to 35795). Wait on that condition, never on a fixed time; a load still short of `finished` 60 seconds after navigation adds one error to its count.
5. Record each load: the story id, the globals, the count and the first error text.

### toolbar-locale-1

A play of `throws-set`, `lenient-set` or `done-set` looks up every name and text the chat shows in the locale the toolbar set, as Idle does (lines 209 to 283):

- a catalog string from `catalogOf(globals)` (lines 163 to 166), passed as the exact name or text, for example `catalogOf(globals).chat.send`;
- a string with a placeholder through `fill` and the template from `catalogOf(globals)`, with each number through `formatNumber(n, localeOf(globals))`, a reply title through `replyTitle(question, localeOf(globals))` and a jump label through `fill(c.jumpLabel, { topic })`, as OnBoard does (lines 1236 and 1266 to 1268);
- a word that comes in pairs outside the catalog, such as the command registry label of `node.mention` or a `CANVAS_WORDS` word, through `pick(<pair>, localeOf(globals))`, as Mentions does (line 1377);
- the text field through `input(canvas, c.input)` and `ask(canvas, text, c.input)`, where `c` is `catalogOf(globals).chat`.

The same holds inside the helpers such a play calls (`converse`, `failure`, the text a play passes to `expectNotice`) and in an absence check, so that the check looks for the name the chat would show in the active locale. Such a play uses none of `SEND`, `STOP`, `YOU`, `nameIn`, `inputNames` or the default name of `input()`, and writes no UI copy as a Thai or English literal.

Text that is not UI copy stays a literal, the same in both locales: the values of `chatFixtures` and `fixtures` (`src/components/fixtures.ts`), the node titles of `BOARD` (`src/components/canvas-board/fixtures.ts`, such as "บรีฟ", "โลโก้" and "โปรไฟล์ว่าที่ลูกค้า"), text the play types itself (such as "ก", "บรรทัดแรก", "สวัสดี", "@บ" and the questions of `SIX`), fixture error text the play proves is never shown ("upstream timeout 504", "stream reset"), and the Mock play's pattern that nothing claims AI answered, which already covers both languages (line 297).

This rule is the first half of ORV-119 comment 10181.

### own-locale-1

A story of `own-locale-set` wraps the chat in its own `LocaleProvider`, which overrides the toolbar locale, so `catalogOf(globals)` can name a locale the chat does not show. Its play needs no change for this issue: it may keep the either-catalog matcher, as `goneStory` does for its four Thai stories through the default name of `input()` (line 1654), and the copy of its own locale written out (English, MentionsEnglish, and `GONE_TH` and `GONE_EN` at lines 1663 and 1664). These plays are the only place the either-catalog matcher stays. This rule is the second half of ORV-119 comment 10181.

### mutation-1

The mutations row 4 runs. Each mutation changes one line of `packages/design-system/src/components/canvas-chat/CanvasChat.tsx` so the chat shows one name in English while the toolbar is Thai. With one mutation in place, run `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/canvas-chat/CanvasChat.stories.tsx`, record the failing line, then revert the mutation.

1. Line 736, the Send button's `aria-label={m.chat.send}` becomes `aria-label="Send"`; the play is BlankSend.
2. Line 722, the Stop button's `aria-label={m.chat.stop}` becomes `aria-label="Stop"`; the play is Stopped.
3. Line 676, the field's `aria-label={m.chat.input}` becomes `aria-label="Message to the engine"`; the play is ImeCompose.
4. Line 512, the hidden speaker `{m.chat.you}` becomes `You`; the play is Send.

On the base each of these plays passes under its mutation, because the either-catalog matcher accepts the English word (worked example 6). This is read from the plays, not run here.

### stories-only-1

The PR changes `packages/design-system/src/components/canvas-chat/CanvasChat.stories.tsx` and files under `docs/` only. `CanvasChat.tsx`, the catalogs, the fixtures, the command registry and the Storybook preview stay as on the base, so the chat shows the same copy in both locales before and after this change.

## Names each play reads

The copy each changed play looks up, by catalog key, Thai then English (`packages/design-system/src/i18n/messages/th.ts` and `en.ts`). Each is read as `toolbar-locale-1` states.

- `chat.input`: "ข้อความถึงเอนจิน", "Message to the engine"
- `chat.send`: "ส่ง", "Send"
- `chat.stop`: "หยุด", "Stop"
- `chat.retry`: "ส่งอีกครั้ง", "Send again"
- `chat.close`: "ปิดแชท", "Close chat"
- `chat.you`: "คุณ", "You"
- `chat.transcript`: "บทสนทนา", "Conversation"
- `chat.empty`: "ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย", "No messages yet. Ask anything about the board"
- `chat.noticeRules`: "คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI", "Replies come from written rules. No AI yet"
- `chat.noticeMock`: "คำตอบเป็นข้อมูลจำลอง ยังไม่มี AI", "Replies are mock data. No AI yet"
- `chat.streaming`: "กำลังตอบ", "Replying"
- `chat.stopped`: "หยุดแล้ว", "Stopped"
- `chat.failed`: "ยังไม่ได้คำตอบ ข้อความของคุณยังอยู่ กดส่งอีกครั้งได้เลย", "No reply came back. Your message is kept, so you can send it again"
- `chat.starters`: "เริ่มจากคำถามเหล่านี้", "Ways to start"
- `chat.jump`: "ไปที่โหนดคำตอบ", "Go to reply node"
- `chat.jumpLabel`: "ไปที่โหนดคำตอบ เรื่อง {topic}", "Go to reply node on {topic}"
- `chat.replyTitle`, through `replyTitle`: "คำตอบเรื่อง {topic}", "Reply on {topic}"
- `chat.unlinked`: "ไม่ได้ผูกกับโหนดใด", "Not linked to any node"
- `chat.mention`: "อ้างถึงโหนด", "Mention a node"
- `taskBar.basisRules`: "ตามกฎ", "By rules"
- `taskBar.basisMock`: "ข้อมูลจำลอง", "Mock data"
- `textarea.countOf`: "ตัวอักษร {count} จาก {max}", "Characters: {count} of {max}"
- `textarea.countOver`: "ตัวอักษร {count} จาก {max} เกินมา {over} ตัวอักษร", "Characters: {count} of {max}, {over} over the limit"
- `tag.remove`: "ลบ {label}", "Remove {label}"
- The registry label of `node.mention` (`src/commands/generated.ts` line 463): "อ้างถึง node นี้ใน prompt", "Mention this node in the prompt"

The plays of `throws-set`:

- Mock: `chat.noticeMock`, `taskBar.basisMock`, `chat.input`.
- BlankSend: `chat.send`, `chat.input`, `chat.empty`.
- OverLimit: `chat.input`, `textarea.countOver` with 2,010, 2,000 and 10 (worked example 4), `chat.send`.
- CounterThreshold: `chat.input`, `textarea.countOf` with 1,800 and 2,000 (worked example 4).
- Streaming: `chat.send`, `chat.input`, `chat.streaming`, `chat.stop`, `chat.noticeRules`.
- Replied: `taskBar.basisRules`, `chat.send`, `chat.stop`, `chat.you`, `chat.starters`, `chat.jump`, `chat.unlinked`, `chat.input`.
- RepliedLines, Narrow: `taskBar.basisRules`, `chat.input`.
- FocusKeptOnEnd: `chat.stop`, `taskBar.basisRules`, `chat.input`.
- FocusKeptOnFail: `chat.stop`, `chat.failed`, `chat.input`.
- Stopped: `chat.stop`, `chat.stopped`, `chat.send`, `chat.input`.
- Failed: `chat.failed`, `chat.noticeRules`, `chat.retry`, `chat.input`.
- FailedMidStream: `chat.failed`, `taskBar.basisRules`, `chat.input`.
- FailedNoReply: `chat.failed`, `chat.retry`, `chat.input`.
- Close: `chat.stop`, `chat.stopped`, `chat.close`, `chat.input`.
- Conversation: `chat.input`, `chat.stop`, `chat.you`, `chat.transcript`, `chat.noticeRules`, `chat.send`, `chat.close`, `chat.failed`, `chat.retry`.
- BasisMismatch: `chat.noticeRules`, `taskBar.basisMock`, `taskBar.basisRules`, `chat.input`.
- NarrowestPanel, WidestPanel: `taskBar.basisRules`, `chat.send`, `chat.input`.
- RecipesAndModes: `taskBar.basisRules` and `chat.input` in each of the six cells.
- Unlinked: `chat.replyTitle`, `chat.unlinked`, `chat.jumpLabel` (worked example 5), `chat.input`.
- MentionFromMenu: the registry label of `node.mention`, `tag.remove`.

The plays of `lenient-set`:

- Send: `chat.input`, `chat.send`, `chat.you`.
- ImeCompose, StreamingReducedMotion, MentionsSmallest: `chat.input`.
- NoClose: `chat.close`, in its absence check.
- NoBoardNoMention: `chat.input`, and `chat.mention` in its absence check.

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`. Examples 3 to 6 copy the logic from its source, because the functions are TypeScript sources or Storybook internals that a plain `node -e` cannot import.

1. Scope, row 1 and `walk-1`: the number of stories, those written out and those made by `goneStory`, and the number of loads (43 stories, 2 locales, 2 modes). Whole numbers, no rounding. Expected output: `43 35 8 172`.

   ```bash
   node -e 'const t=require("fs").readFileSync("packages/design-system/src/components/canvas-chat/CanvasChat.stories.tsx","utf8");const n=(t.match(/^export const \w+: Story\b/gm)||[]).length;const g=(t.match(/^export const \w+: Story = goneStory\(/gm)||[]).length;console.log(n,n-g,g,n*2*2)'
   ```

2. Scope, rows 3 and 5: the four sets hold every story exactly once, member lists copied from Scope; then the plays that change (`throws-set` and `lenient-set`) and the plays row 3 reads (those and `done-set`). Counts and a boolean, no rounding. Expected output: `22 6 4 11 28 32 true`.

   ```bash
   node -e 'const t=require("fs").readFileSync("packages/design-system/src/components/canvas-chat/CanvasChat.stories.tsx","utf8");const all=[...t.matchAll(/^export const (\w+): Story\b/gm)].map(m=>m[1]);const sets=["Mock BlankSend OverLimit CounterThreshold Streaming Replied RepliedLines FocusKeptOnEnd FocusKeptOnFail Stopped Failed FailedMidStream FailedNoReply Close Conversation BasisMismatch Narrow NarrowestPanel WidestPanel RecipesAndModes Unlinked MentionFromMenu","Send ImeCompose StreamingReducedMotion NoClose NoBoardNoMention MentionsSmallest","Idle OnBoard Mentions MentionGone","English StartersAtWidths MentionGoneNarrow MentionGoneNarrowDark MentionGoneNarrowEnglish MentionGoneNarrowEnglishDark MentionGonePanel MentionGonePanelDark MentionGonePanelEnglish MentionGonePanelEnglishDark MentionsEnglish"].map(s=>s.split(" "));const u=sets.flat();const [a,b,c]=sets.map(s=>s.length);console.log(sets.map(s=>s.length).join(" "),a+b,a+b+c,u.length===all.length&&new Set(u).size===u.length&&all.every(n=>u.includes(n)))'
   ```

3. `walk-1` step 2: the story id from the export name. The logic is copied from Storybook 10.6.3 `dist/preview/runtime.js`: the two camel-case steps of `toStartCaseStr` (line 14397), and `sanitize` and `toId` (lines 14413 to 14418) with the character class reduced to "not a letter or digit", which gives the same id for these ASCII names. Strings, no rounding. Expected output: `application-canvas-chat--over-limit application-canvas-chat--blank-send application-canvas-chat--mention-from-menu application-canvas-chat--mention-gone-narrow-english-dark`.

   ```bash
   node -e 'const name=k=>k.replace(/([^\n])([A-Z])([a-z])/g,"$1 $2$3").replace(/([a-z])([A-Z])/g,"$1 $2");const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");console.log(["OverLimit","BlankSend","MentionFromMenu","MentionGoneNarrowEnglishDark"].map(k=>slug("Application/Canvas chat")+"--"+slug(name(k))).join(" "))'
   ```

4. OverLimit and CounterThreshold: the counter copy in both locales. `fill` is copied from `src/i18n/messages/index.ts` lines 29 to 35, the templates from `th.ts` lines 103 and 104 and `en.ts` lines 99 and 100, the locale tags from `src/i18n/locale.ts` line 12. Whole numbers grouped by thousands with a comma in both locales, no rounding. Expected output, four lines:

   ```bash
   node -e 'const fill=(t,p)=>t.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,k)=>String(p[k]));const T=[["th-TH","ตัวอักษร {count} จาก {max} เกินมา {over} ตัวอักษร","ตัวอักษร {count} จาก {max}"],["en-US","Characters: {count} of {max}, {over} over the limit","Characters: {count} of {max}"]];for(const [tag,a,b] of T){const n=x=>new Intl.NumberFormat(tag).format(x);console.log(fill(a,{count:n(2010),max:n(2000),over:n(10)}));console.log(fill(b,{count:n(1800),max:n(2000)}))}'
   ```

   ```text
   ตัวอักษร 2,010 จาก 2,000 เกินมา 10 ตัวอักษร
   ตัวอักษร 1,800 จาก 2,000
   Characters: 2,010 of 2,000, 10 over the limit
   Characters: 1,800 of 2,000
   ```

5. Unlinked: the reply title and the jump label in both locales. `replyTopic` is copied from `src/components/canvas-chat/place-reply.ts` lines 22 to 31, the templates from `th.ts` lines 80 and 82 and `en.ts` lines 76 and 78, the question from `src/components/fixtures.ts` line 151. The question has fewer than 40 graphemes, so the topic is the whole question; no rounding. Expected output, four lines:

   ```bash
   node -e 'const q="สรุปโหนดแบรนด์ให้หน่อย";const fill=(t,p)=>t.replace(/\{([a-zA-Z0-9_]+)\}/g,(_,k)=>String(p[k]));const topic=l=>Array.from(new Intl.Segmenter(l,{granularity:"grapheme"}).segment(q.replace(/\s+/g," ").trim())).slice(0,40).map(s=>s.segment).join("");for(const [l,title,jump] of [["th","คำตอบเรื่อง {topic}","ไปที่โหนดคำตอบ เรื่อง {topic}"],["en","Reply on {topic}","Go to reply node on {topic}"]]){console.log(fill(title,{topic:topic(l)}));console.log(fill(jump,{topic:topic(l)}))}'
   ```

   ```text
   คำตอบเรื่อง สรุปโหนดแบรนด์ให้หน่อย
   ไปที่โหนดคำตอบ เรื่อง สรุปโหนดแบรนด์ให้หน่อย
   Reply on สรุปโหนดแบรนด์ให้หน่อย
   Go to reply node on สรุปโหนดแบรนด์ให้หน่อย
   ```

6. Row 4 and `mutation-1`: the either-catalog matcher against the exact name from the active catalog, under the Thai toolbar. The matcher is copied from `CanvasChat.stories.tsx` lines 186 to 189, the names from `th.ts` line 69 and `en.ts` line 65. Booleans, no rounding. Expected output: `true true true false` (the matcher accepts the English "Send", the active name does not).

   ```bash
   node -e 'const th="ส่ง",en="Send";const either=n=>[th,en].includes(n);const active=c=>n=>n===c;console.log([either("ส่ง"),either("Send"),active(th)("ส่ง"),active(th)("Send")].join(" "))'
   ```

## Out of scope

- Every file `stories-only-1` keeps as on the base.
- A second Vitest run in English. The Vitest `storybook` project stays Thai (`vite.config.ts` line 26); the English check here is the walk of `walk-1`.
- The plays of other components' stories. A ripgrep search for a query or text matcher with Thai on the same line, `(By(Role|Text|LabelText|PlaceholderText|DisplayValue|Title)|toHaveTextContent|toHaveAccessibleName)\b.*[\x{0E00}-\x{0E7F}]` over `*.stories.tsx` in `packages/`, finds 667 lines in 48 files on the base, 42 of them in `CanvasChat.stories.tsx`. Many are fixture text; whether any other story throws in English is not walked here.
- The Thai board label of the stories' `BoardChat` ("กระดานแบรนด์ (ข้อมูลตัวอย่าง)", line 1139), which stays Thai under `locale:en`; no play reads it.
- Accessibility results on the dev server. The a11y check stays with the Vitest run (`a11y: { test: "error" }`, `preview.tsx` line 97).

## Open questions (option, impact, default)

1. A story fails under `locale:en` for a cause outside its play (the chat, a catalog or a fixture). Option: fix it in this PR, or in its own issue. Impact: a fix outside the stories file breaks `stories-only-1` and the lane. Default: the builder stops and reports it in `needs_decision`; the fix gets its own issue.
2. `SEND`, `STOP`, `YOU` and `nameIn` once no play uses them. Option: delete or keep. Impact: a helper left unused invites the old matcher back. Default: delete each helper no play uses; keep `inputNames` and the default name of `input()` while `goneStory` uses them (`own-locale-1`).
3. The plays of other components' stories (Out of scope). Option: a follow-up issue that walks every story under `locale:en`, now or later. Impact: other stories may throw in English the same way. Default: this spec opens none; the main session decides when it raises G3.
4. A second Vitest run in English. Option: add an English `storybook` project, or keep the dev-server walk. Impact: a second browser run of every story in CI. Default: not in this issue; it needs its own decision.

## Depends on

- ORV-119 comment 10181, the owner's decision (`toolbar-locale-1`, `own-locale-1`).
- ORV-116 and `docs/specs/ORV-116/spec.md` v2 (row 2, and the Out of scope line that moved active-catalog matching to this issue), review-2 finding R3.
- ORV-39 and `docs/specs/ORV-39/spec.md` line 48 (the locale toolbar, and plays that assert Thai under the default).
- `.claude/rules/testing.md` (a test fails on the real defect; wait for conditions, never for fixed time) and `.claude/skills/webapp-testing/SKILL.md` (the walk).
- ADR 0012 (`docs/adr/0012-jira-states-by-environment.md`, gates and lanes) and the POC mode section of `.claude/skills/ovl/SKILL.md` (short spec, one review round).

## Changelog

- v1 (2026-10-30): first version, from the ORV-119 description and owner comment 10181, read on develop `eeb2e71`. Downstream to review: none yet (no tech notes, design or PR).
