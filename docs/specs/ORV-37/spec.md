---
issue: ORV-37 (https://tpetkaew.atlassian.net/browse/ORV-37)
lane: M (no risk flag, no contract changes)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.5
depends on: ORV-30 (E2-7, the page examples), ORV-31 (E2-8, the reference screen)
---

# ORV-37: agent catalog exercise, one screen composed from the public entry

## Goal

Phase 1 claims that an agent can build a screen from the catalog. This story tests that claim once and records what happened. Jira Done when: generated code imports real components and props; no duplicates created.

As the owner, I want a builder agent to compose one new screen from the catalog alone, so that I can see from evidence what the catalog carries and where it falls short.

The composer reads the catalog, the public export list and the contract types, and composes the screen of `## Brief` inside `packages/design-system`, through the public entry only. A pass means the file imports only real, stable catalog components, uses only real props, and creates no duplicate in the file or in the repo. A need the catalog cannot meet is reported as a gap, not built.

Frame: the judge (`## Judge`) is a guard rail for an agent that follows the rules. It is not a boundary against a session that sets out to defeat it: it is a text rule in a test file, and nothing outside the session enforces it (`## Honesty limits`). The forms it must catch are the ones a rule-following agent reaches for, including the forms the existing examples use.

What is simulated: all data is sample data, no invitation or email is sent, and nothing is saved. There is no model call in the product and no generation pipeline: the composer is the `builder` role of the delivery loop.

Paths start at `packages/design-system/` unless they start at the repo root (`docs/`, `scripts/`, `.claude/`, `DESIGN.md`). Commands run from the repo root.

## Brief

Compose a workspace members screen on sample data, a new page example. The screen file is `src/examples/members.tsx`. It exports `MembersScreen` and `MEMBERS`, so the story harness survives a recomposition. The story file is `src/examples/members.stories.tsx`, titled `Examples/Application: Members (agent)`, with the exports `Default`, `FilterInvited`, `InviteMember`, `RemoveMember`, `At360` and `FriendlyDark`. The screen is not exported from `src/examples/index.ts` and not listed under any catalog entry.

What the screen must do, by need:

- N1. At the top: the workspace name (c-1), one line with the member count and the pending invitation count (c-2), computed from the rows, and a visible note that the data is sample data (c-3).
- N2. A person can look down the whole team and weigh people against each other on the same five facts: name, email, role, membership state (active or invited, read only) and date joined (c-5). People can be put in order by name and by date. The choices of order are named c-16, and at 360 px a person can see them and reach them, with focus shown at each stop. `MEMBERS` holds six people, defined in the screen file: at least one Thai name, one Latin name, one long Thai name without spaces, one person with no email, who reads c-4, and at least one person in each state.
- N3. A person can narrow the list by membership state. The three choices (c-6) stay in sight at once. Choosing one shows only those people. The counts of N1 do not change.
- N4. Each person has their own small set of actions, opened from one control on that person's line and named with the person (c-8): make admin, after which that person's role reads c-7's admin word, and remove, placed last and marked as destructive.
- N5. One primary action (c-9) invites a person without leaving the screen. Email is required, the role is picked from six roles (c-7), and a choice to send a copy to oneself (c-10) applies on submit. An email that is empty or holds no `@` shows c-11 and adds nobody. A valid email shows pending for a short simulated moment, then the person is the first in the list, in state invited, dated 2026-11-06, and a status text reads c-12, followed by c-13 when the copy choice was on.
- N6. Remove asks first, in words that name the person and the consequence (c-14). Confirming removes the person and announces it (c-15). Cancelling or pressing Escape changes nothing. After cancelling or Escape, keyboard focus is back on that person's own control (c-8). After confirming, that control no longer exists, so keyboard focus lands on the primary action (c-9), which stays on the screen whatever the list holds, and not on the page body.
- N7. Each person's line shows that person's picture.
- N8. After an invitation, a brief note floats over the screen with the words of c-12. People can keep working under it and it leaves by itself.
- N9. At 360 px nothing scrolls sideways, on the sample rows and after a valid invitation of a long unbroken address.

No icons: the public export list has no icon module. Where nothing stable meets a need, follow `orv37-gap-1`.

Copy. Only the Thai renders, as in the other examples; the English is the meaning, kept here for review.

<!-- prettier-ignore -->
| Key | Thai (renders) | English (meaning) |
| --- | --- | --- |
| c-1 | ทีมออกแบบ Brand Canvas | Brand Canvas design team |
| c-2 | สมาชิก {active} คน, รอตอบรับ {invited} คน | {active} members, {invited} pending |
| c-3 | ข้อมูลตัวอย่าง ไม่มีการบันทึกหรือส่งจริง | Sample data: nothing is saved or sent |
| c-4 | ไม่มีข้อมูล | No data |
| c-5 | ชื่อ, อีเมล, บทบาท, สถานะ, วันที่เข้าร่วม | Name, Email, Role, State, Date joined |
| c-6 | ทั้งหมด, ใช้งานอยู่, รอตอบรับ | All, Active, Invited |
| c-7 | เจ้าของ, ผู้ดูแล, นักออกแบบ, นักพัฒนา, ผู้ตรวจงาน, ผู้ชม | Owner, Admin, Designer, Developer, Reviewer, Viewer |
| c-8 | จัดการ {name}; ตั้งเป็นผู้ดูแล; นำออก | Manage {name}; Make admin; Remove |
| c-9 | เชิญสมาชิก (the action and its submit); ยกเลิก | Invite member; Cancel |
| c-10 | อีเมล; บทบาท; ส่งสำเนาให้ฉันด้วย | Email; Role; Send me a copy |
| c-11 | ใส่อีเมลก่อนเชิญ เช่น name@example.com | Enter an email before inviting, such as name@example.com |
| c-12 | เชิญ {email} แล้ว เป็นข้อมูลตัวอย่าง ไม่ได้ส่งจริง | Invited {email}. Sample data, nothing was sent |
| c-13 | สำเนาก็ไม่ได้ส่งเช่นกัน | The copy was not sent either |
| c-14 | นำ {name} ออกจากเวิร์กสเปซ; {name} จะเข้าเวิร์กสเปซนี้ไม่ได้อีก และต้องเชิญใหม่หากจะกลับมา; นำออก; ยกเลิก | Remove {name} from the workspace; {name} loses access to this workspace and must be invited again to return; Remove; Cancel |
| c-15 | นำ {name} ออกแล้ว | Removed {name} |
| c-16 | เรียงตาม (the accessible name of the choices of order) | Sort by |

The counts of c-2: `{active}` is the rows in state active, `{invited}` the rows in state invited.

## Acceptance criteria

`J` is `pnpm --filter @orivilo/design-system exec vitest run --project checks tests/check-agent-composition.test.ts`. `S` is `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/examples/members.stories.tsx`. A need reported unmet under `orv37-gap-1` leaves its part of rows 1 to 5 unproven and is judged in row 12.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Story `Default` | It renders | c-1; c-2 with counts computed from the rows; c-3 visible; six people with the five facts of N2 and a picture (N7); the long Thai name inside its line; one email reading c-4; exactly one primary action | None | Play `Default` in `S`: row count equals `MEMBERS.length`; each row shows the name and email of its `MEMBERS` entry, so a misspelt column key goes red, and a picture by role `img`; one `[data-variant="primary"]` element; one c-4; the counts equal values computed from `MEMBERS`; the long name ends inside its row. The a11y addon reports zero violations (`a11y: { test: "error" }`, `.storybook/preview.tsx`) |
| 2 | Stories `FilterInvited` and `At360` (through `Narrow`) | The people are ordered by date, then by name; then the invited choice of c-6 is taken; in `At360`, the keyboard walks the screen at 360 px | All three choices of c-6 at once; the order changes; only invited people; c-2 unchanged; at 360 px the choices of order of N2 in sight and reached | None, the screen's own state only | Play `FilterInvited` in `S`: before any choice of order, the first row is neither the first of `MEMBERS` sorted by date nor the first sorted by name. The order of the sample rows gives this start, and `MEMBERS` still meets N2. Taking the name order first does not give it: with the rows in date order, a date choice that leaves them as they came still shows the right first row. Then first row equals the first of `MEMBERS` sorted by date; the order changes on the name sort; row count equals `MEMBERS` filtered by state; the c-2 line reads as before. The play goes red when the choice of order by date does nothing, seen red and restored (`.claude/rules/testing.md` line 11), once with the date order leaving the rows as they came and once with the choice changing no state. Play `At360` in `S`: both choices under the name c-16 are visible and inside the 360 px `Narrow` frame; each keyboard stop of the screen, the choices of order among them, has a box over 8 px inside that frame, matches `:focus-visible` and is not clipped at its centre. The play does not read focus ink; qa reads it at 360 px |
| 3 | Story `InviteMember` | c-9 is opened; submit with an empty email, then with no `@`; then a valid email with the copy choice off; then again with it on | c-11 on the email entry, no new person; pending; the form closes; the new person first, invited; c-12, then c-12 with c-13; the note of N8 | One new row in the screen's own state per valid invite; nothing saved or sent | Play `InviteMember` in `S`: the `alert` text, row count unchanged, then the new first row, its state, c-2 raised by one invited person, the status text and the note of N8, each waited for by condition |
| 4 | Story `RemoveMember` | The row trigger of a person who is not admin is opened; make admin; then remove, cancel, remove, Escape, remove, confirm | The trigger named c-8; remove last and destructive; the role reads the admin word; c-14 names the person and the consequence; after cancel or Escape nothing changes and focus is back on that person's control of N6; after confirm the person is gone, c-15 is announced and focus is on the stop N6 names | The row's role changes; the row leaves the screen's own state on confirm only | Play `RemoveMember` in `S`: item order, the role cell, the name and text of the confirmation, row count before and after, c-15; the cancel and Escape paths first. Focus, waited for by condition: the focused element is that person's control, found by role and the name c-8, after cancel and after Escape, and the stop of N6, found by role and name, after confirm; it is never the page body. These focus assertions are seen red on the screen of `0466822` before the screen changes (`.claude/rules/testing.md` line 11). After confirm the play reads the rows, not the text of the whole screen, because c-8 holds the name only in an accessible name and c-15 holds it too: that person's line is gone and the line of every other person of `MEMBERS` stays. The play goes red when confirm takes out anyone other than the named person, seen red and restored |
| 5 | Stories `At360` (through `Narrow`) and `FriendlyDark` (through `Under`) | They render; then in `At360` a valid invitation of the long unbroken address of N9 is submitted through c-9 | No sideways scroll at 360 px, on the fixtures and after that invitation; the screen under Friendly dark | `At360`: one new row in the screen's own state, nothing saved or sent. `FriendlyDark`: none | Play `At360` in `S` asserts the 360 px `Narrow` frame's `scrollWidth` equals its `clientWidth` on the fixtures; submits the address `"a".repeat(64) + "@example.com"`, which holds no space and no hyphen; waits by condition for it in the new first row and in the status text of N5; and asserts the same equality again. That second assertion is seen red on the screen of `f65faf8` before the screen changes (`.claude/rules/testing.md` line 11). `FriendlyDark` runs with the a11y addon; designer visual sign-off on the head (`orv37-rework-1`); qa takes a light and a dark screenshot of the story |
| 6 | The screen and story files | `J` runs | Nothing | None | `J` green: `orv37-i1`, `orv37-s1` and `orv37-t1` hold on the target; `-t controls` holds one red sample per import form |
| 7 | The screen file | `J` runs | Nothing | None | `J` green: `orv37-i2` and `orv37-stable-1` hold on the target. qa opens two used entries and reads the status line |
| 8 | The screen file | `J` runs | Nothing | None | `J` green: `orv37-i3` holds on the target. qa runs `grep -c "src/examples"` by hand on two used entries with no example and reads 0 (it exits 1, so it is never a `done_when` or a fact). Rows of the selection table equal the entries the screen uses (`orv37-record-1`) |
| 9 | The screen file | `pnpm typecheck` and `J` run | Nothing | None | Typecheck green in the gate record; `J` green: `orv37-p1` holds on the target, with one red control per item |
| 10 | The screen file | `J` and `pnpm lint` run | Nothing | None | `J` green: `orv37-d1`, `orv37-d2` and `orv37-d3` hold on the target, with one red control each; lint green (`orivilo/no-raw-style-classes`) |
| 11 | The PR head | qa runs the commands of `## Repo check` | Nothing | No component, token, recipe, catalog entry or export list changes | The outputs `## Repo check` names; `pnpm quality-gate` green on the pushed head, quoted in the G3 packet |
| 12 | The composer's report and the PR body | qa and the reviewer read them | Nothing in place of an unmet need | None | The gap list and selection table of `orv37-record-1` exist. For each quote: `git show <composing head>:<named file>`, then `grep -n -F '<quote>'`, finds it (`orv37-head-1`). The reviewer reads the screen for a stand-in (`orv37-gap-1`) and judges each gap claim against the need; this part is read by a person, not asserted |
| 13 | The record of the run | `pnpm --filter @orivilo/design-system exec vitest run --project checks tests/check-catalog.test.ts`, worked example 3, and a reading of the record | The story description says a builder agent, with its model id, composed the screen from the public entry in one run, and that the data is sample data | `catalog/coverage.md` gains the one row of task 3; `DESIGN.md` gains the three changes of task 3; when a rework round follows task 3, a later docs task updates the gap and round numbers of the `DESIGN.md` row (`orv37-recount-1`) | check-catalog green (the row resolves to the story); the two numstat commands of task 3 print its expected counts, and they stay those counts after that later docs task; worked example 3 prints no hit; the reviewer reads the story description, the `DESIGN.md` row and the files-opened list against `## Read lists` (self reported, `## Honesty limits`) |

## Rows that render nothing

- Rows: 6-13

These rows are proved by files, commands and a reading of the record. Rows 1 to 5 hold everything a person sees.

## Rules

- `orv37-stable-1`. The screen composes only with entries of status `stable`. This is the exercise's own rule: `catalog/README.md` line 47 lets a `draft` entry be used inside this package, and the screen lives inside it. The rule makes the status field a real constraint.
- `orv37-gap-1`. Where no stable entry meets a need, build nothing for it: no stand-in, and no text, initials, emoji or shape in its place. Leave the need unmet and report it with the line of `catalog/coverage.md`, or of a catalog entry, that shows why.
- `orv37-head-1`. The composing head is the commit task 2 starts from, recorded in the task 2 report and the PR body. Gaps are recorded as the catalog stood at the composing head. The owner chose on 2026-11-06 to build the D.3 rows in cards ORV-221 to ORV-231; a D.3 component that lands in `develop` during the run does not change the brief, the screen or the gap list, and the screen is not recomposed to use it. Each new composing round starts from the same catalog: the branch takes no `develop` update before the last composing round is done.
- `orv37-blob-1`. Task 1 is committed before the screen exists. The main session puts the judge's blob id, `git rev-parse <judge commit>:packages/design-system/tests/check-agent-composition.test.ts`, as a fact in every composing envelope. A judge change after that needs a spec revision and a new task 1 envelope, never an edit by the composer; the next composing envelope carries the new blob id and the PR body lists the change.
- `orv37-rework-1`. Every rework round of the screen or its stories is a new composing envelope under the same read lists. A finding enters it as a spec row, need or clause id and what failed, and names no component, prop or class. The round count goes in the record. A look finding that fails no row becomes a Suggestion for the follow-up card, so no `docs/specs/ORV-37/design.md` is written and `## Repo check` keeps its six paths. The designer sign-off judges honesty and template tells; final look waits in the POC.
- `orv37-leak-1`. No catalog name appears in `## Brief` in any letter case, or in the rest of this spec or the judge in exact case. The names are every `name:` under `catalog/base` and `catalog/application` plus the first cell of every component table in `catalog/coverage.md` (worked example 3). Composing envelopes cite rows, needs and clauses by id. The expected result of the gap needs is kept out of this spec and out of composing envelopes: it stays in the main session's design brief and reaches only the reviewer and qa.
- `orv37-record-1`. The composer's report and then the PR body hold: the composing head; the model id; the round count; every file opened; a selection table (need, entry YAML path, quoted `useWhen` line, one row per used entry); a gap list (need, quoted line, file); and, per example read, one line on what was copied from it. The model id is the id the composing agent reports from its own session. If it can give only the alias, the record says `sonnet`, the alias in `.claude/agents/builder.md` line 5, and says it is an alias.

## Judge

`tests/check-agent-composition.test.ts`, one Vitest file in the `checks` project (which also includes `src/**/*.test.ts`). No new dependency: `typescript` and `js-yaml` are already devDependencies. A pure function takes source text, the export list and the catalog entries and returns problems.

Describe `controls` holds one failing inline sample per clause and per import form, plus one clean sample. Controls run on a synthetic export list and a synthetic catalog with invented names, so the file names no catalog name (`orv37-leak-1`). The file sits outside the package ESLint block, which covers `src/**` and `.storybook/**`, so its samples are not flagged, and outside the copy scan. `src/examples/` is inside the copy scan and outside the hard-coded Thai scan (`tests/check-i18n.test.ts` line 86 calls examples demo content; that scan reads `src/components`, `src/boundary`, `src/commands/index.ts`, `.tsx` under `src/i18n` and `apps/web/app`).

Describe `target` runs the function on `AGENT_COMPOSED = ["src/examples/members.tsx"]` and the story clause of `orv37-s1` on the story file.

- `orv37-t1`. Target reads its files inside `it()`, never in the describe body, so the `-t controls` run does not fail at collection. It fails when the screen or story file is missing, and when the catalog parse returns fewer than 40 entries. So it cannot pass by reading nothing.
- `orv37-i1`. The screen imports only from `react` and `../index`, by named imports. `package.json` `exports["."]` equals `./src/index.ts`. Refused, one red sample each: a single-line, multi-line, side-effect, namespace and default import, a dynamic `import()`, an `export ... from`, `require()`, and an import of `../components/index` or `../components/fixtures`.
- `orv37-i2`. Every name imported from `../index`, value or type, is an export of `src/components/index.ts`, read by its exported name (after any `as`). The first path segment of its export specifier names a folder; `catalog/base/<folder>.yaml` or `catalog/application/<folder>.yaml` exists with status `stable` and import `@orivilo/design-system`. A value name also starts with a capital followed by a lowercase letter, which refuses hooks, helpers and constants in stable folders. Every other export of `src/index.ts` is refused, including the boundary, profiles, i18n, commands, blocks and `./tokens/canvas` exports. Worked example 2. Red controls: an invented name, a name from a draft folder, a function from a draft folder, an export with no entry, a hook from a stable folder, and a public name outside the component list.
- `orv37-i3`. At least 8 distinct stable entries appear as JSX tags, from both the base and the application tier, and at least two of them have `examples: []`. Red controls: a 7-entry sample, a base-only sample, a sample whose entries all list examples. This is a size hint: a tag in a branch that never renders counts. Filler is refused by row 8: every used entry has a selection table row naming the need it serves. If the no-example floor can be reached only by an entry no need calls for, the composer stops and reports `blocked`; the main session then revises the spec and reworks task 1 to lower the floor. The floor reads the catalog as it stands, so it is a fact about the composing head: a later PR that lists an example under a used entry removes that floor from `target`, keeps the control, and says so.
- `orv37-p1`. The screen holds no JSX spread; no hyphenated attribute other than `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-live`, `aria-atomic`, `aria-hidden` and `aria-busy`; no `any`; no type assertion other than `as const`; no `ts-ignore`, `ts-expect-error`, `ts-nocheck` or `eslint-disable`; no `createElement`, `cloneElement` or `dangerouslySetInnerHTML`; no use of `JSON`, `Reflect`, `Function`, `eval` or `globalThis`, which hand back an `any` with no keyword. Red control per item, including a `data-` attribute, an invented `aria-` name, a string cast to a variant type and a `JSON.parse` value in a prop.
- `orv37-d1`. No local declaration has the name of an export of `src/components/index.ts`. No local declaration whose name starts with a capital matches a component row of `catalog/coverage.md`, compared without case, spaces or `(pattern)`, so a `none` row is covered too.
- `orv37-d2`. A lowercase JSX tag is one of `div`, `span`, `p`, `h1`, `h2`, `h3`, `header`, `section`, `main`, `form`, `ul`, `ol`, `li`, `strong`, `em`, `time`. A capitalised tag is a name imported from `../index` or a function component declared in the file, so `const Box = "button" as const` and member tags such as `<DS.Thing>` are refused. A lowercase element has no `on*` attribute (except `onSubmit` on `form`), no `tabIndex`, no `contentEditable`, and no `role` other than `status` or `alert`.
- `orv37-d3`. `className` sits only on a lowercase element and its value is a plain string literal, so a class built by concatenation or `join` and a restyled component are refused. After variant prefixes are stripped, no token starts with `ds-`, contains `[`, or belongs to a paint family: `bg-`, `border`, `rounded`, `shadow`, `drop-shadow`, `ring`, `inset-ring`, `outline`, `divide`, `fill-`, `stroke-`, `opacity-`, `decoration-`, `backdrop-`, `mask-`, `text-feedback-`, `text-action-`, `text-brand-`. The file holds no `style` attribute, no `var(--`, no hex colour and no `rgb(`. This is stricter than the existing examples (`src/examples/landing.tsx` lines 43 and 113 use paint classes), and that is deliberate: `no-raw-style-classes` passes semantic utilities, so a hand-made stand-in passes lint. A need such as a divider line that this blocks is a gap.
- `orv37-s1`. The screen's value exports are exactly `MembersScreen` and `MEMBERS`, and `MembersScreen` declares no parameter, so a story cannot pass UI in. The story file imports only from `@storybook/react-vite`, `storybook/test`, `./members`, `../components/matrix` (`Under` and `Narrow` only) and `../testing/visual-asserts`. Its only JSX tags are `MembersScreen`, `Under` and `Narrow`, it sets no `decorators`, and it holds no `ds-` text.

## Repo check

qa runs these on the pushed head.

1. `git diff --name-only origin/develop...HEAD` lists exactly `docs/specs/ORV-37/spec.md`, `packages/design-system/tests/check-agent-composition.test.ts`, `packages/design-system/src/examples/members.tsx`, `packages/design-system/src/examples/members.stories.tsx`, `packages/design-system/catalog/coverage.md` and `DESIGN.md`.
2. `git diff --name-only origin/develop...HEAD -- packages/design-system/src/components packages/design-system/src/recipes packages/design-system/src/tokens packages/design-system/catalog/base packages/design-system/catalog/application packages/design-system/src/index.ts packages/design-system/src/examples/index.ts packages/design-system/package.json` prints nothing.
3. `git rev-parse HEAD:packages/design-system/tests/check-agent-composition.test.ts` equals the blob id of the last composing envelope (`orv37-blob-1`).
4. `git diff --name-only <judge commit>..<last composing commit> -- . ':!docs/specs/ORV-37/spec.md' ':!DESIGN.md' ':!packages/design-system/catalog/coverage.md'` lists only the two example files. `DESIGN.md` and `catalog/coverage.md` stay out of this diff because the record commit of task 3 sits inside the range when a rework round lands after task 3. The numstat commands of task 3 read those two files instead.

## Read lists

The composer reads only the allowed list and reports every file it opened (`orv37-record-1`).

### Allowed

- `AGENTS.md`, `DESIGN.md`, `.claude/rules/design-system.md`, `.claude/rules/testing.md`.
- `docs/specs/ORV-37/spec.md`.
- `catalog/README.md`, `catalog/coverage.md`, `catalog/base/*.yaml`, `catalog/application/*.yaml`.
- `package.json` (the exports map), `src/index.ts`, `src/components/index.ts`.
- For each chosen entry, the file that declares its contract type, `src/components/<name>/<Name>.tsx`, for the exported types and their doc comments only.
- Where a chosen entry's exported part takes its props from a primitive of the `radix-ui` package, that package's `.d.ts` files, for those props only.
- At most one example file per chosen entry, and only a path that entry lists under `examples`.
- For the story file only: `src/components/matrix.tsx`, `src/examples/workspace.stories.tsx` and `src/testing/visual-asserts.ts`.
- `tests/check-agent-composition.test.ts`, to read and run, not to write; and the output of its own lint, typecheck and test runs.

Forms in those files that this exercise refuses: `src/examples/workspace.tsx` imports `../components/index` (line 19) and `../components/fixtures` (line 20) and uses `as` casts (lines 107 and 165), and its stories import fixtures and select by a `ds-` class. Three of the four example screens import fixtures; `landing.tsx` does not. This story departs on purpose from `docs/specs/ORV-30/spec.md` line 36 and `.claude/rules/design-system.md` line 23, which send fixture content to `src/components/fixtures.ts`: here it is inline, so the screen stays on the public entry.

### Forbidden

- `src/components/fixtures.ts`, `icons.tsx`, `cx.ts`, `menu-item.tsx`, `story-keys.ts`, `command-button.tsx`: internal helpers or exports with no catalog entry.
- Component stories, `src/components/**/*.stories.tsx`: if the entry, the contract type and one listed example are not enough, that is a catalog gap to report.
- `src/recipes/**`, `src/tokens/**`, `src/profiles/**`.
- `apps/web/**` and every other package.
- `docs/specs/` outside `docs/specs/ORV-37/spec.md`, including any `docs/specs/ORV-37/design.md`; `docs/plans/**`; `docs/context/**`; the Jira issues ORV-221 to ORV-231.
- Any spec, review, design brief or earlier answer that names which components to use or what the gaps are.
- Any `.env` file.
- Any write outside the task 2 write set: the judge, `src/components/**`, `catalog/**`, `src/index.ts`, `src/examples/index.ts`.

## Honesty limits

- One screen, one run, one model. A pass says nothing general about what agents can compose. The `DESIGN.md` row and the story description say so.
- Reads are self reported. No hook guards reads, and a contract type shares its file with the implementation, so reading the contract opens the code. The read list is a boundary plus a self-reported list; the mechanical proof is on the output. The G3 packet says this.
- Provenance is not proven. Forbidden files can be read and copied unseen. The needs were reworded away from the `useWhen` lines but may still lead to them, and an allowed example already holds several of the same parts, so much of the screen may be a copy. The record says how much (`orv37-record-1`).
- No hook keeps the composer off the judge or `catalog/coverage.md`. `write-guard` lets any subagent write under `packages/` without comparing the path with its `write_set` (`scripts/ovl/write-guard.mjs` line 3), and `merge-check` reads the union of all the issue's envelopes (`.claude/skills/ovl/SKILL.md` line 436). The only checks are `orv37-blob-1`, `## Repo check` and the numstat commands of task 3, run by hand. Those commands see a change in line count, not an edit inside a line.
- Real props means typed props. Typecheck plus `orv37-p1` leave these open: a component that extends native attributes accepts the whole DOM attribute set; a prop typed plain string is unchecked, so row 1 catches a misspelt column key by its effect only; an allowed `aria-` attribute passed to a component that does not forward it is dropped silently, and only the a11y addon and role-based plays see that.
- A duplicate can hide. A local component under a name no list holds passes `orv37-d1`, and it can hold only allowed elements with no paint. A text-only or emoji stand-in passes the judge. Only the reviewer's reading (row 12) catches them.
- `orv37-d3` stays a denylist: a paint utility outside it passes.
- `orv37-i2` rests on folder names matching catalog file names. It holds today except for one draft export that lives in the folder of another draft entry, so the verdict is still right; a later export from a shared folder could be misjudged.
- The composer writes its own plays. A weak play is caught only by the reviewer reading rows 1 to 5 against the story file.

## Builder tasks

Three tasks, in this order, on one branch. One deliverable each. Do not run `pnpm quality-gate` between task 1 and task 2: `target` is red by design, a failed gate record would follow, and the next builder envelope would then count as a rework round. The gate runs once, in the foreground on a clean tree, on the pushed head after task 3.

1. The judge. Write set: `packages/design-system/tests/check-agent-composition.test.ts`. Built from `## Judge`; committed before the screen exists. The objective asks for one mutation per clause, per closed list and per bound, seen red and restored, with one `verified` row each and one per import form (`.claude/rules/testing.md` lines 31 to 34), and for the same file run without `-t` to be red only in `target`, with the missing `src/examples/members.tsx` message. Done when:

   ```bash
   pnpm --filter @orivilo/design-system exec vitest run --project checks tests/check-agent-composition.test.ts -t controls --testTimeout=400
   pnpm format:check
   pnpm lint
   pnpm typecheck
   ```

2. The exercise. Write set: `packages/design-system/src/examples/members.tsx` and `packages/design-system/src/examples/members.stories.tsx`, one deliverable because the stories are the screen's tests. The envelope objective cites rows and needs by id and names no component or prop, and it carries the blob fact (`orv37-blob-1`). The story description is the sentence of row 13. The objective asks for the record of `orv37-record-1` in the report. Done when:

   ```bash
   pnpm --filter @orivilo/design-system exec vitest run --project checks tests/check-agent-composition.test.ts
   pnpm --filter @orivilo/design-system exec vitest run --project storybook src/examples/members.stories.tsx
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm --filter @orivilo/design-system exec vitest run --project checks --testTimeout=400
   ```

   The timeout run is scoped to the `checks` project because an unscoped run also runs the browser story plays, which have no per-test timeout argument, and 158 of its failures sit in existing story files.

3. The record. Write set: `packages/design-system/catalog/coverage.md` and `DESIGN.md`, written after task 2 so the row names a story that exists. No other row changes. In `catalog/coverage.md`, under Page examples, exactly this row, which fits the padded columns (worked example 1):

   ```text
   | Members (agent, ORV-37)        | application | draft  | examples-application-members-agent       |
   ```

   In `DESIGN.md`: one row in section 12, item `Agent catalog exercise (ORV-37)`, saying it is real for one screen composed in one run by one model, naming `src/examples/members.tsx` and `tests/check-agent-composition.test.ts`, the number of gaps, the number of rework rounds, and that reads are self reported and not machine checked; the title bumped to the next version (today v1.60 becomes v1.61); one `Change log: v<n> (date) ORV-37: ...` line. After the commit the two numstat commands print `1 0` and `4 1`. Done when:

   ```bash
   pnpm --filter @orivilo/design-system exec vitest run --project checks tests/check-catalog.test.ts
   git diff --numstat origin/develop...HEAD -- packages/design-system/catalog/coverage.md
   git diff --numstat origin/develop...HEAD -- DESIGN.md
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

   `orv37-recount-1`. When a rework round (`orv37-rework-1`) follows task 3, a later docs task, after the last composing round, updates the gap and round numbers of the `DESIGN.md` row. Its write set is `DESIGN.md`. It edits in place the section 12 row and the task 3 change log line, which repeats those numbers. It adds no line and bumps no version, so the `DESIGN.md` numstat stays `4 1`. Its `done_when` is the list above. The gate of row 11 runs on the head this task leaves.

Every `done_when` entry is a command, as `scripts/ovl/envelope-guard.mjs` needs; expected outputs and reports go in the objective.

## Worked examples

None of these was run when this spec was written (no shell in that task). The builder and qa run them.

1. Story id and row widths (task 3). Source: `storyId` in `tests/check-catalog.test.ts` lines 51 to 57, the story title of `## Brief`, and the row name. The Page examples table pads Example to 30 and Story to 40, so both must fit or Prettier re-pads every row. Integers, no rounding.

   ```bash
   node -e 'const id=t=>t.toLowerCase().replace(/[^a-z0-9/]+/g,"-").replace(/\//g,"-").replace(/^-+|-+$/g,"");const s=id("Examples/Application: Members (agent)");console.log(s,s.length,"Members (agent, ORV-37)".length)'
   ```

   Expected: `examples-application-members-agent 34 23`.

2. The mapping of `orv37-i2`, on the real `src/components/index.ts` and catalog at `371f477`. The sample names are chosen to cover each verdict.

   ```bash
   node -e 'const fs=require("fs"),p="packages/design-system/",src=fs.readFileSync(p+"src/components/index.ts","utf8"),map={};for(const m of src.matchAll(/export (?:type )?\{([^}]*)\} from "\.\/([^/"]+)/g))for(const part of m[1].split(",")){const w=part.trim().split(/\s+/).filter(x=>x&&x!=="type");if(w.length)map[w[w.length-1]]={folder:m[2],type:m[0].startsWith("export type")||part.trim().startsWith("type ")}}const status=f=>{for(const d of ["base","application"]){const y=p+"catalog/"+d+"/"+f+".yaml";if(fs.existsSync(y))return fs.readFileSync(y,"utf8").match(/^status: (.+)$/m)[1]}return "none"};const judge=n=>{const e=map[n];if(!e)return "refused, not a component export";const s=status(e.folder);if(s!=="stable")return "refused, "+e.folder+" is "+s;if(!e.type&&!/^[A-Z][a-z]/.test(n))return "refused, not a component";return "allowed"};for(const n of ["BoardTool","useFieldControl","commandMenuMatches","GRID_UNIT","CommandHint","RangeSliderProps","useDesignProfile"])console.log(n,"=>",judge(n))'
   ```

   Expected, one line each: `BoardTool => allowed`, `useFieldControl => refused, not a component`, `commandMenuMatches => refused, not a component`, `GRID_UNIT => refused, not a component`, `CommandHint => refused, command-button is none`, `RangeSliderProps => refused, slider is draft`, `useDesignProfile => refused, not a component export`.

3. The leak check of `orv37-leak-1`. It prints the size of the name list (52 YAML names and 80 coverage rows make 83 at `371f477`, because three YAML names differ from their coverage row), then the hits in `## Brief` (any case), in the whole spec (exact case) and in the judge (exact case, empty until the file exists). A later catalog entry raises the size; the hits stay empty.

   ```bash
   node -e 'const fs=require("fs"),p="packages/design-system/catalog/",names=new Set();for(const d of ["base/","application/"])for(const f of fs.readdirSync(p+d)){const m=fs.readFileSync(p+d+f,"utf8").match(/^name: (.+)$/m);if(m)names.add(m[1].trim())}for(const l of fs.readFileSync(p+"coverage.md","utf8").split("## Page examples")[0].split("\n")){const c=l.match(/^\| ([A-Za-z][^|]*?) +\|/);if(c&&c[1]!=="Component")names.add(c[1].replace(" (pattern)",""))}const spec=fs.readFileSync("docs/specs/ORV-37/spec.md","utf8"),brief=spec.split(/^## Brief$/m)[1].split(/^## /m)[0],judge="packages/design-system/tests/check-agent-composition.test.ts",hits=(t,fl)=>[...names].filter(n=>new RegExp("\\b"+n+"\\b",fl).test(t));console.log(names.size,JSON.stringify(hits(brief,"i")),JSON.stringify(hits(spec,"")),JSON.stringify(fs.existsSync(judge)?hits(fs.readFileSync(judge,"utf8"),""):[]))'
   ```

   Expected: `83 [] [] []`.

## Out of scope

- An app route or any change under `apps/web`.
- Any new component, variant, token, recipe, locale key or catalog entry. Gaps are only reported.
- Exporting the screen from `./examples`, or listing it under any catalog entry's `examples`.
- Retrofitting the four existing examples to the judge: `landing.tsx` imports `../components/index`, and the other three also import `../components/fixtures`.
- A hook or log that machine-checks what an agent reads; any guard or hook change.
- Rendered English copy for the example screen.
- A model call, a generation pipeline or an in-product agent feature.
- A repeat or regression run of the exercise, and a CI job that dispatches an agent.
- Real members data, invitations, email, persistence or auth.
- Final look and screen flow.
- A general claim that agents can compose any screen.

## Open questions

None blocks the work. Each runs on its default unless the main session or the owner changes it.

1. Where does the composed screen live? Default: `src/examples/` with stories, so behaviour and a11y are proven in the gate and CI. Option: an `apps/web` route, which needs a hand-run qa walk (app tests render static markup, and e2e is in neither the gate nor CI) and Thai and English catalog copy.
2. Does stable-only bind this exercise? Default: yes (`orv37-stable-1`). Option: stable and draft, planned still refused.
3. Which screen? Default: workspace members on sample data. Option: a brand evidence report mock, which needs draft entries and waits for phase 2.
4. What happens to the gaps the run finds? Default: one combined follow-up card raised after the merge, leaving out any gap a card of ORV-221 to ORV-231 already closes; nothing is fixed in this PR. Options: one card per gap, or the PR body only.
5. Does the record need its own builder task? Default: yes, task 3. It keeps one deliverable per task, and the row can name a story that exists. It does not stop the composer writing `catalog/coverage.md`; the numstat commands of task 3 detect a write that changes the line count. Option: ride in task 2's write set, as ORV-30 and ORV-31 did.
6. May a look finding take a rework round? Default: no (`orv37-rework-1`), a deviation from `.claude/skills/ovl/SKILL.md` line 27 for this PR, because `design.md` would be a seventh path and would hand designer guidance to the composer. Option: allow the path in `## Repo check` and keep the file out of composing envelopes.
7. May the PR run over about 400 changed lines? Default: yes. The judge, the screen with its stories and the record are compared on one head, and the claim needs all three.

## Depends on

- ADR 0003 (the catalog, and Storybook as its visual half); `catalog/README.md` (statuses and the agent read order).
- ORV-30 (page examples, the title rule) and ORV-31 (the reference screen); both stay as they are.
- ORV-221 to ORV-231 (owner, 2026-11-06), through `orv37-head-1` only.

## Changelog

- 1.0 (2026-11-06): first version, from the design panel's brief with the fact-check's corrections and false-pass routes applied.
- 1.1 (2026-11-06): the last `done_when` of task 2 is scoped to the `checks` project, with its reason in task 2, and row 5 names the 360 px `Narrow` frame. Downstream review: the `done_when` of any later task 2 envelope, and qa's and the reviewer's reading of row 5.
- 1.2 (2026-11-06): the `DESIGN.md` count of task 3 is `4 1`, not `3 1`: the title replaces one line, the row adds one, and the change log entry adds two, its line and the blank line before it, as v1.44 to v1.60 do. The three changes of row 13 stand. Downstream review: the expected counts in any later task 3 envelope, and qa's and the reviewer's reading of row 13.
- 1.3 (2026-11-06): sign-off findings signoff-1-n9 and signoff-2-n2 of ORV-37-signoff-1 (ORV-37 comment 10518, head `f65faf8`). N9 and row 5 now cover a valid invitation of a long unbroken address, because a person can add an address no fixture holds, and the `At360` play proves it. `## Repo check` item 4 leaves `DESIGN.md` and `catalog/coverage.md` out of its diff, because the record commit of task 3 falls inside the range when a rework round lands after it; the numstat commands of task 3 take over reading those files, so `## Honesty limits` and open question 5 name them. `orv37-recount-1` in task 3, with row 13 pointing to it, says a later docs task updates the gap and round numbers in place. Downstream review: the next composing envelope (N9, row 5), the docs task envelope of `orv37-recount-1`, and qa's and the reviewer's reading of rows 5 and 13 and of item 4.
- 1.4 (2026-11-06): after composing round 2 (ORV-37-build-4, head `e972d94`). The screen names its choices of order `เรียงตาม`, which the copy table did not hold, so c-16 is added with its English value. N2 and row 2 now say those choices can be seen and reached at 360 px, the expected result of sign-off finding signoff-2-n2, and the `At360` play proves it; row 2 leaves focus ink to qa, because the play reads `:focus-visible` only. `orv37-recount-1` is applied to `DESIGN.md` in this same task. Downstream review: qa's and the reviewer's reading of N2, c-16 and row 2, and the gate of row 11 on the head this task leaves.
- 1.5 (2026-11-06): three Important findings of the review of head `0466822`. `orv37-r1-focus`: N6 and row 4 now say where keyboard focus goes after cancel or Escape and after confirm, and the `RemoveMember` play proves both; it was a fail of `DESIGN.md` section 11 line 6. The stop after confirm is c-9 because it is on the screen whatever the list holds. `orv37-r1-date-order`: the Check of row 2 now goes red when the choice of order by date does nothing, because the sample rows ran in date order, so the check could not tell; the start comes from the order of the sample rows. `orv37-r1-wrong-person`: the Check of row 4 now goes red when confirm takes out anyone other than the named person, by reading that person's line as gone and the others as staying, because a text search cannot find a name that lives only in an accessible name. Downstream review: the next composing envelope (N6, rows 2 and 4, citing these ids), the docs task envelope of `orv37-recount-1`, qa's and the reviewer's reading of N6 and rows 2 and 4, the reviewer's line 6 of `DESIGN.md` section 11, and the gate of row 11 on the head the last task leaves.
