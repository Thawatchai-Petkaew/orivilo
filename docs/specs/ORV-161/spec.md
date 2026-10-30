---
issue: ORV-161 (https://tpetkaew.atlassian.net/browse/ORV-161)
parent: ORV-113 (item 8)
lane: L
version: 1.2
---

# ORV-161: axe on every apps/web page (ORV-113 item 8)

## Why

ADR 0015 decision 1 names WCAG 2.2 Level AA as the yardstick, and its row (line 29) lists the checks that run today: `pnpm contrast` and axe through `@storybook/addon-a11y` on every Storybook story. Its "Not done yet" section records, in its WCAG 2.2 AA line, the gap this story closes: "No axe scan runs on `apps/web` pages". App-only UI never reaches the Storybook run: the layout header, its nav and `LocaleSwitch`, the home page, the `SavedStudio` wrapper, `SignInForm` and the signed-in account form. `apps/web` has no stories, and its 18 Vitest files render with `react-dom/server` and have no DOM, so no check reads that UI at all.

ORV-161 is item 8 of ORV-113 as its own story. Jira quotes the item as "axe on apps/web pages, not only on stories". This story adds a browser scan of every page and state in a locale, colour scheme and width matrix, with a fixed rule set. The scan runs in CI and in `pnpm quality-gate` after the build. A violation fails the build.

**Frame.** The scan is a CI check, not a hook that judges a tool call's text, so the guard rail or boundary frame of L-0012 does not apply to it. One part touches auth: slice 5 mints a session through Better Auth's `testUtils` plugin. That session lives in a test-only auth instance over a throwaway database and a secret made for each run, as `orv161-session` sets out. What keeps it from real data is outside any session's text: the database is created from `TEST_DATABASE_URL`, which points at the CI Postgres service or a local Postgres, never the owner's project (`packages/db/src/testing/database.ts` lines 6 to 10). The secret exists only for that run. The rule that keeps the plugin out of the app bundle (`orv161-session`) is a guard rail for agents that follow the rules. The `security` role checks it by reading the diff.

**What is real.** The scan runs real axe-core 4.14.0 in Chromium against the production build (`next start`). It reports which rules ran and what they found, and nothing more. Automated rules cover only part of WCAG. This story adds no keyboard walk and no screen reader pass. `target-size` checks the size and spacing of the targets axe can find, which is only part of success criterion 2.5.8. 2.4.11 stays unchecked. No text in the code, the reports, the gate packets or the UI says the product conforms to WCAG (ADR 0015 decision 13, `.claude/rules/security.md` rule 16).

## Story

The person who runs ORIVILO wants every page people see in the app scanned in both languages, both colour modes and both widths, on every change. A page that breaks a rule should fail the build the way a story does today. People who use a keyboard or a screen reader then meet fewer of the faults automated rules can find, and a reviewer can cite which rule ran on which page.

## Lane

**L.** The signed-in states need a session minted outside Google sign-in against the app's database (`orv161-session`), and that is the auth and data-access flag. The `security` role is dispatched on slice 5. Two more parts carry weight:

- Slice 4 changes guard files (`.github/workflows/ci.yml`, `scripts/quality-gate.mjs`). Only a bound builder whose envelope lists those exact paths may write them, and the merge needs the owner approval record (ovl skill, "Owner approval").
- The owner can cut the signed-in states (open question 1). Without them no risk flag is left, and the story becomes lane M with the same guard-file slice.

POC mode applies (ORV-137): one short spec, and G1 and G2 pass under the owner's delegation (ADR 0012 decision 4). No contract changes (no schema, token, component API or resolver), so there are no tech notes. The only new UI is the 404 page of open question 4, so there is no `design.md` (open question 12).

## The set this covers

The survey ran on `develop` at `eeb2e71`.

**Pages.** `apps/web/app` holds 4 `page.tsx` files: `/`, `/workspace`, `/directions` and `/account`. Next.js also serves its built-in 404 page, `/_not-found`, for any unknown path, and people see that page too. Found with `find apps/web/app -name page.tsx` and the Next.js build route list. One route is not a page: `/api/auth/[...all]` answers with JSON and redirects and has no document, so it is excluded.

**States per page.** `/`, `/workspace` and `/_not-found` have one state each, and none needs a session. `/directions` (`page.tsx` lines 15 to 21) and `/account` (`page.tsx` lines 18 to 21) are `force-dynamic` and each have three states:

- `/directions`: not-configured, signed-out, and ready (a session with a workspace).
- `/account`: not-configured, signed-out and signed-in.

`/directions` also has an `error` state, which needs the store to fail inside a running server. It is left out, as "Out of scope" records. That gives 9 page states in all. 5 need no database: the three single-state pages and the two not-configured states. 4 need one: the two signed-out states, ready and signed-in.

**Matrix.** Each state is scanned in 2 locales (`th`, `en`, through the `orv-locale` cookie of `apps/web/i18n/locale.ts`), 2 colour schemes (light and dark; the layout's `mode="system"` follows the OS) and 2 widths (360 and 1280 px), as `orv161-matrix` sets out. That is 72 scans for the 9 states, or 40 for the 5 states without a database (worked example "The matrix").

**Rules.** axe-core 4.14.0 is the only axe-core version in the lockfile (`grep -n 'axe-core@' pnpm-lock.yaml`: lines 3115 and 8041, one version). It defines 105 rules in `node_modules/.pnpm/axe-core@4.14.0/node_modules/axe-core/axe.js` (`grep -c 'tags: \['`: 105, every one between `rules: [` at line 36624 and `checks: [` at line 38042). Each rule carries exactly one level tag. Counted on those 105 lines (worked example "The rule set"):

- `wcag2a`: 62 rules, 57 on by default
- `wcag2a-obsolete`: 2, 0 on
- `wcag2aa`: 3, 3 on
- `wcag21a`: 1, 1 on
- `wcag21aa`: 3, 2 on
- `wcag22aa`: 1, 0 on
- `wcag2aaa`: 3, 0 on
- `best-practice`: 30, 27 on

Rules leave axe's default run for three reasons:

- `enabled: false` in the rule: 9 rules.
- A tag in axe's `tagExclude` list, `experimental` or `deprecated` (axe.js line 34101): 6 experimental rules, plus 5 deprecated rules that are also among the 9.

So 15 rules are off by default and 90 are on. `region` (line 37837) and `landmark-one-main` (line 37593) are `best-practice` only. `target-size` (lines 37970 to 37975, tag `wcag22aa`, `wcag258`) is defined with `enabled: false`. The Storybook run uses the 90 minus `region`: the addon turns `region` off for stories (`@storybook/addon-a11y` `dist/_browser-chunks/chunk-5WURYCET.js` lines 42 to 45). That leaves 89 rules there. The page scan uses `orv161-rules`.

## Acceptance criteria

Every scan runs on the pages of `orv161-pages`, under `orv161-matrix`, with `orv161-rules`. The copy quoted comes from the locale catalog `apps/web/i18n/messages.ts`; a new key is marked new. "Red" means the scan, or the test named, fails with the line quoted.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | `/workspace` in Thai or English | The page renders | Exactly one `main` element. It holds the reference screen's heading "ทีมออกแบบ Brand Canvas" (Thai fixture data in both locales). The layout's `header` and `nav` sit outside it, so the page has one banner landmark | None | Slice 2: new `apps/web/app/workspace/page.test.tsx`, "renders the reference screen inside one main", in the `react-dom/server` style of `app/account/page.test.tsx`. Red when the wrapper is removed |
| 2 | The slice 2 diff | `git diff --stat origin/develop` is read | No file under `packages/design-system` changed. `WorkspaceScreen`, its story and the `./examples` export are as before, so `/directions` (which embeds `WorkspaceScreen` inside its own `main`, `page.tsx` line 40) still has one `main` | None | Slice 2: the diff stat in the PR body. The scans of `/directions` (row 8) confirm it in the browser |
| 3 | An unknown path, `/orv-161-no-such-page`, in Thai or English | It is requested | Status 404. One `main` with the `h1` "ไม่พบหน้านี้" / "Page not found", the line "ไม่มีหน้าใดใน ORIVILO ที่ใช้ที่อยู่นี้ ตรวจที่อยู่อีกครั้ง หรือกลับไปหน้าแรก" / "No page in ORIVILO has this address. Check the address, or go back to the home page." and a link to `/`, "ไปหน้าแรก" / "Go to the home page" (new keys `notFound.heading`, `notFound.body` and `notFound.home`). The layout header and nav sit above it. Next.js's text "This page could not be found." does not appear | None | Slice 2: new `apps/web/app/not-found.test.tsx` for the markup and copy of both locales. The 404 status comes from the scan of row 8 (open question 4) |
| 4 | The new `notFound` keys | `pnpm test` and `pnpm typecheck` run | Both pass: Thai and English have the same key paths, and no string has a middot or an em dash | None | Slice 2: the existing `apps/web/i18n/messages.test.ts` and `pnpm typecheck` |
| 5 | The scan, any one of its scans | axe's result is read | The set of rule ids across `passes`, `violations`, `incomplete` and `inapplicable` is exactly the set `orv161-rules` runs. It holds `region`, `landmark-one-main` and `target-size`, and none of the ids `orv161-rules` leaves off | None | Slice 3: an assertion in every scan, "runs the rules of orv161-rules" (worked example "The rule set") |
| 6 | The scan config | `pnpm --filter @orivilo/web exec playwright test --list` runs | It lists 40 tests in slice 3 and 72 after slice 5. Each title names the route, the state, the locale, the scheme and the width, such as `/account not-configured en dark 360` | None | Slice 3 and slice 5: the list count as a `verified` row (worked example "The matrix") |
| 7 | A machine where `apps/web/.env.local` sets `DATABASE_URL`, and the owner's dev server running on port 3000 | `pnpm build`, then `pnpm test:e2e` | The scan server for the states without a database answers on port 3200, and port 3000 is never requested. `/directions` shows "ยังบันทึกทิศทางในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่าฐานข้อมูล" / "Directions cannot be saved in this environment yet: the database is not set up." `/account` shows "ยังลงชื่อเข้าใช้ในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่า Google และฐานข้อมูล" / "Sign-in is not available here yet: Google and the database are not set up." | No connection to any database (`orv161-servers`) | Slice 3: the state assertion of `orv161-wait` before each scan. A run on the owner's Mac is recorded as a `verified` row |
| 8 | The 40 scans of slice 3 | `pnpm test:e2e` runs | Each scan first passes the checks of `orv161-wait`, then axe finds zero violations. The run ends `40 passed` | None | Slice 3: new `apps/web/e2e/pages.a11y.spec.ts` |
| 9 | `orv161-exceptions` | The scan file is read | The list is empty at v1.0. A page-level rule exception exists only as an entry of that list | None | Slice 3: read by the reviewer. Mutant M8 shows an entry without a reason is refused |
| 10 | Each mutant of `orv161-mutants` | It is applied in a scratch run and the scan runs | Red, with the expected rule id or assertion in the failure line. Restored, the run is green again | None | Slice 3: one `verified` row per mutant with its red line (L-0002, testing.md lines 32 to 34) |
| 11 | The CI workflow after slice 4 | A push runs CI | After `pnpm build` and before `pnpm audit`, the step `pnpm test:e2e` runs and its log ends `40 passed` (72 after slice 5). A violation fails the job | None | Slice 4: the CI run id and its log line in the PR body |
| 12 | `pnpm quality-gate` after slice 4 | It runs on a clean tree | `.quality-gate/report.md` has a step `e2e` right after `build`, with its `N passed` line quoted. `scripts/quality-gate.test.mjs` (the CI order parity test) passes. With M1 applied in a scratch run, the step fails and the report is `ok: false` | None | Slice 4: the gate report of the head. The M1 run is a `verified` row |
| 13 | The slice 4 PR | `merge-check` runs | It finds the owner approval record `.orivilo/owner-approvals/<n>.json` for the head. The builder's envelope lists `.github/workflows/ci.yml` and `scripts/quality-gate.mjs` by exact path | None | Slice 4: `merge-check` output |
| 14 | The documents of slice 4 | They are read | `.claude/skills/quality-gate/SKILL.md` names the `e2e` step in CI order. `.github/pull_request_template.md` lists `pnpm test:e2e` under Checks. The `AGENTS.md` Commands block has one new line for `pnpm test:e2e`, and the file stays under 100 lines | None | Slice 4: `grep -n "test:e2e"` on each file, and `wc -l AGENTS.md` |
| 15 | A throwaway database from `createTestDatabase`, and the server for the states with a database on port 3201 (slice 5) | The 32 new scans run | Signed out: `/directions` shows "ลงชื่อเข้าใช้เพื่อบันทึก อนุมัติ และส่งออกทิศทาง ตอนนี้ยังลองเขียนบรีฟได้ แต่จะไม่ถูกบันทึก" / "Sign in to save, approve and export directions. You can still try briefs here, but nothing is saved." `/account` shows the button "ลงชื่อเข้าใช้ด้วย Google" / "Sign in with Google". Signed in as `e2e@example.com`: `/account` shows "ลงชื่อเข้าใช้อยู่ในชื่อ e2e@example.com" / "Signed in as e2e@example.com", the workspace line and "ออกจากระบบ" / "Sign out", and `/directions` shows the ready view with "บันทึกทิศทาง" / "Save this direction". axe finds zero violations, and the run ends `72 passed` | One user, its workspace and its owner membership, in the throwaway database only. The database is dropped at teardown | Slice 5: `pnpm test:e2e` with `TEST_DATABASE_URL`, locally and in CI |
| 16 | The slice 5 run | It runs | No request goes to `accounts.google.com`, and the sign-in button is never pressed. No page load uses up a rate limit: `listDirections` passes no limit (`export async function listDirections` in `apps/web/app/directions/actions.ts`) | No `verification` row, no rate-limit count | Slice 5: a request listener on the context that fails on any request to a host other than `localhost` |
| 17 | The slice 5 diff | `grep -rn "testUtils" apps/web --include="*.ts" --include="*.tsx" --exclude-dir=e2e --exclude-dir=node_modules --exclude-dir=.next` runs | No match. `apps/web/server/auth.ts` is unchanged. No tracked file holds a value for `BETTER_AUTH_SECRET` (`pnpm scan:secrets --report` shows no new finding) | None | Slice 5: the grep and the scan as `verified` rows. The `security` role reads the diff |
| 18 | `.claude/rules/security.md` after slice 5 | It is read | A new numbered rule says the `testUtils` plugin is built only in a test-only auth instance under `apps/web/e2e/` or in a `*.test.ts` file, and never in a module the app imports | None | Slice 5: `grep -n "testUtils" .claude/rules/security.md` |
| 19 | ADR 0015, ORV-108's spec, `DESIGN.md`, `.claude/agents/qa.md` and `.claude/skills/webapp-testing/SKILL.md` after slice 6 | They are read | ADR 0015 has a dated Addition after decision 1's Confirmation (line 39) and one after the WCAG line of "Not done yet", the line that holds "No axe scan runs on `apps/web` pages". Lines 29 and 39 and that WCAG line keep their text. The Additions name the page scan, `orv161-rules`, the `e2e` step, `target-size` as a check of part of 2.5.8, and the keyboard walk, the screen reader pass and 2.4.11 as still open. `docs/specs/ORV-108/spec.md` row 14 keeps its text and gains a dated note pointing here, with a version bump and a changelog line. `DESIGN.md` section 11 line 251 adds the page scan's zero violations. `qa.md` gives the qa role the duty to quote the gate's `e2e` line at G3 for a PR that touches `apps/web/app` or `apps/web/i18n`. The webapp-testing skill names `pnpm test:e2e`, `apps/web/playwright.config.ts` and a port other than 3000 | None | Slice 6: `grep -n "ORV-161"` on each file. The reviewer reads each one for a conformance claim |
| 20 | The home page after slice 6, Thai or English | It loads | A new entry in "สิ่งที่มีจริงตอนนี้" / the real-today list (story `ORV-161`): "axe-core 4.14.0 ตรวจหน้า /, /workspace, /directions, /account และหน้า 404 ใน CI ทุกครั้ง ทั้งไทยและอังกฤษ โหมดสว่างและมืด กว้าง 360 และ 1280 px ทั้งตอนยังไม่ลงชื่อเข้าใช้และลงชื่อเข้าใช้แล้ว การตรวจอัตโนมัติพบได้เพียงบางส่วน ยังไม่มีการทดสอบด้วยคีย์บอร์ดหรือโปรแกรมอ่านหน้าจอ" / "axe-core 4.14.0 checks /, /workspace, /directions, /account and the 404 page in CI on every run, in Thai and English, light and dark, at 360 and 1280 px, signed out and signed in. An automated check finds only part of the problems; no keyboard walk or screen reader pass is done yet." | None | Slice 6: `apps/web/i18n/messages.test.ts`. In lane M (open question 1) the clause about signing in reads "โดยไม่ลงชื่อเข้าใช้" / "without signing in" |
| 21 | A release batch with this story on staging (`orivilo-staging.vercel.app`, ADR 0010 line 35) | The qa walk for G4 runs the scan's `staging` project by hand | The scans of `/`, `/workspace`, `/_not-found` and the signed-out states of `/directions` and `/account`, under `orv161-matrix` (40 scans), find zero violations. The output goes in the G4 packet. The signed-in rows on staging are owner-verify, since only the owner's Google account signs in there | None on staging: page loads only, nothing pressed | Slice 7 (open question 7) |

## Rows per PR

The qa walk of a PR covers the rows its line names (ORV-138 rule `qa-scope-1`). Each later slice PR adds its line here when it opens, with the rows that "Slices" gives it.

- PR 163: rows 1, 2, 3, 4

## Rules and bounds

- **orv161-pages.** The scan covers the 9 page states of "The set this covers", and the slice that first adds a state scans it. Slice 3 adds `/`, `/workspace`, `/_not-found` (reached through `/orv-161-no-such-page`), `/directions` not-configured and `/account` not-configured. Slice 5 adds `/directions` signed-out, `/directions` ready, `/account` signed-out and `/account` signed-in. A page or state added to `apps/web` later joins this list and the scan in its own PR.
- **orv161-rules.** Each scan runs axe-core 4.14.0 with axe's default rule set, the 90 rules `enabled` and outside `tagExclude`, with `target-size` switched on (open question 3). That is 91 rules. No `runOnly` filter is set, so the 27 `best-practice` rules among the 90 run, `region` and `landmark-one-main` among them. axe leaves 15 rules off by default (the 9 marked `enabled: false` and the 6 tagged `experimental`; the 5 tagged `deprecated` are among the 9). This rule switches one of them, `target-size`, back on, so 14 stay off:

  `aria-roledescription`, `audio-caption`, `color-contrast-enhanced`, `css-orientation-lock`, `duplicate-id`, `duplicate-id-active`, `focus-order-semantics`, `hidden-content`, `identical-links-same-purpose`, `landmark-complementary-is-top-level`, `meta-refresh-no-exceptions`, `p-as-heading`, `table-fake-caption`, `td-has-header`.

  Any violation of any impact fails the scan. `@axe-core/playwright` is pinned to a release whose `axe-core` resolves to 4.14.0, so the lockfile keeps one axe-core version (open question 9). The axe source is injected through `page.evaluate`, which the page's CSP does not govern, and the context does not set `bypassCSP` (the CSP is Report-Only today; ORV-116 rechecks this when it enforces).

- **orv161-matrix.** Every state of `orv161-pages` is scanned in each of the 8 combinations of:
  - locale `th` or `en`, set as the `orv-locale` cookie before the first request
  - Playwright `colorScheme` `light` or `dark`
  - viewport 360 by 800 or 1280 by 800 px

  Chromium only.

- **orv161-servers.** Both servers run `next start` from one `pnpm build`, and neither is `next dev`.
  - Port 3200, for the states without a database. Its environment sets each of the app's six names to the empty string: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `OPENROUTER_API_KEY`. Next.js fills a name from `.env.local` only when the name is undefined (`@next/env` 16.4.1, `dist/index.js`), and `requireEnv` treats an empty value as missing (`packages/db/src/env.ts` line 13), so a Mac's `.env.local` can never configure it (worked example "Blank beats .env.local").
  - Port 3201, from slice 5, for the states with a database: `DATABASE_URL` is the throwaway database's `appUrl` (role `orivilo_app`), `BETTER_AUTH_URL` is `http://localhost:3201`, `BETTER_AUTH_SECRET` is random for each run, the two Google names are the placeholder `e2e-not-used`, and `OPENROUTER_API_KEY` is empty.

  Neither port is 3000 (the owner's dev server, ADR 0010 line 33), 6100 (Storybook) or 3100 (ORV-118's hand run). A busy port fails the run and is never reused.

- **orv161-wait.** Before axe runs, a scan waits for conditions, never for a fixed time, and checks five of them:
  - the response status: 200 for the four routes, 404 for `/_not-found`
  - the state's catalog line is visible
  - `document.documentElement.lang` equals the cookie locale
  - `matchMedia("(prefers-color-scheme: dark)").matches` equals the scheme
  - `innerWidth` equals the width

  Time limits are sized for the CI runner (testing.md): the first CI run's step time is recorded with its run id, and the per-test and server-start limits are each at least 10 times the local time measured under `pnpm quality-gate`.

- **orv161-exceptions.** A rule is off for one page state only through an entry `{ route, state, rule, reason }` in one exported list in the scan file, applied as axe's `disableRules` for that state alone. `reason` says why the rule does not fit that page, which is the reason comment of ADR 0015 line 29 in a form the test reads. The run fails on an entry whose `reason` is empty, or whose `rule` is not one of the 91. A violation found while building is fixed in that slice; an exception is the last resort, and each one is listed in the PR body and in this spec's next version.
- **orv161-session.** The signed-in states use a session minted by a test-only `createAuth({ ..., plugins: [testUtils()] })` instance. It is built in `apps/web/e2e/` over the same throwaway database and the same per-run secret as the server on port 3201. `createAuth`'s `plugins` option is marked for tests only (`packages/auth/src/config.ts` lines 17 and 51).
  - The user `e2e@example.com` is created through the adapter, so Better Auth's hooks create its workspace and owner membership.
  - The session cookie goes into the browser context as `better-auth.session_token`, with no `__Secure-` prefix, because the server's `baseURL` is `http://` (worked example "The cookie name").
  - Any stored context state stays under `apps/web/test-results/`, which `.gitignore` line 16 already ignores.
  - `apps/web/server/auth.ts` and every module the app imports stay free of `testUtils`.

  Playwright may start `webServer` entries before `globalSetup`. If it does, the builder starts the port 3201 server from the global setup once the database is migrated, and records which order 1.56.1 uses.

- **orv161-mutants.** Each is run once in a scratch change, seen red, and restored:

  <!-- prettier-ignore -->
  | Id | Rule class | Mutation | Red line expected |
  | --- | --- | --- | --- |
  | M1 | `best-practice`, landmarks | Revert slice 2's `main` on `/workspace` | `landmark-one-main` (and `region`) on the 8 `/workspace` scans |
  | M2 | `wcag2a` | Drop `lang` from `<html>` in `apps/web/app/layout.tsx` | The `lang` check of `orv161-wait` on every scan, which fails before axe runs. A second scratch run with that check removed shows `html-has-lang` on every scan |
  | M3 | `wcag2aa` | In the scan, before axe, give the layout's nav links a colour close to the canvas, made with `color-mix()` from `var(--ds-surface-canvas)` and 10% gray. Not the canvas colour itself: equal colours give axe `incomplete` (`equalRatio`), not a violation | `color-contrast` in both schemes |
  | M4 | `wcag21a` | Set the layout's home link `aria-label` to `m.app.nav`, which does not contain its visible text "ORIVILO" | `label-content-name-mismatch` |
  | M5 | `wcag21aa` | In the scan, before axe, add `<input aria-label="x" autocomplete="orv-nonsense">` to `main` | `autocomplete-valid` |
  | M6 | `wcag22aa`, the switched-on rule | In the scan, before axe, add two 12 by 12 px buttons with names, side by side with no gap | `target-size` (worked example "Target spacing") |
  | M7 | `orv161-servers` | Set port 3200's `DATABASE_URL` to `postgres://orivilo_app:x@127.0.0.1:1/none`. The scan file holds a load-time guard that each of the six port 3200 names of `orv161-servers` is the empty string; the guard is not a test, so the count stays 40. Without it this mutant stays green, since the other five empty names keep both pages not-configured | The guard fails at load, before any scan, with "Error: the port 3200 server must have DATABASE_URL set to the empty string" |
  | M8 | `orv161-exceptions` | Add `{ route: "/workspace", state: "page", rule: "region", reason: "" }` | "exception without a reason" |
  | M9 | `orv161-matrix` | Drop `colorScheme` from the dark combinations | The scheme check of `orv161-wait` on the dark scans |

- **orv161-report.** Test titles, the gate line, PR bodies, gate packets and the home page entry say which rules ran on which pages and what they found, such as "axe-core 4.14.0, 91 rules, 40 scans, 0 violations". None says the product, a page or a release conforms to WCAG or is accessible.
- **Placement.** Scan files live in `apps/web/e2e/` and end in `.spec.ts`. That suffix keeps them apart from Vitest's `*.test.*` globs (the `include` list of `test` in `apps/web/vitest.config.ts`) and from the lighter test-only review path of the ovl skill. `apps/web/package.json` gains `@playwright/test` at 1.56.1, the same version as `packages/design-system`'s `playwright`, so the Chromium that CI already installs serves both and no second install line is needed. The root `package.json` gains `"test:e2e": "pnpm --filter @orivilo/web test:e2e"` in the form of `contrast`. `turbo.json` does not change: a turbo task would filter the server's environment.

## Worked examples

None of these was run in this task, since there is no shell here. The main session runs each from the repo root.

- **The rule set** (`orv161-rules`, rows 5 and 6). Input: the installed `axe.js`, sliced between `rules: [` and `checks: [` and split at each rule boundary (`    }, {` at four spaces). A rule is off by default when it has `enabled: false` at rule level, or a tag in `tagExclude` (`experimental`, `deprecated`; axe.js line 34101). Counts are whole numbers, so there is no rounding.

  ```bash
  node -e 'const s=require("fs").readFileSync("node_modules/.pnpm/axe-core@4.14.0/node_modules/axe-core/axe.js","utf8");const r=s.slice(s.indexOf("\n    rules: [ {"),s.indexOf("\n    checks: [ {"));const rules=r.split("\n    }, {\n").map(c=>({id:c.match(/id: .([\w-]+)./)[1],tags:c.match(/tags: \[([^\]]*)\]/)[1].match(/[\w.-]+/g),off:/\n      enabled: false/.test(c)}));const out=rules.filter(x=>x.off||x.tags.some(t=>t==="experimental"||t==="deprecated"));const on=rules.filter(x=>!out.includes(x));console.log(rules.length,on.length);for(const l of ["wcag2a","wcag2a-obsolete","wcag2aa","wcag21a","wcag21aa","wcag22aa","wcag2aaa","best-practice"])console.log(l,rules.filter(x=>x.tags.includes(l)).length,on.filter(x=>x.tags.includes(l)).length);console.log("off",out.map(x=>x.id).sort().join(" "));const wcag=["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"];console.log("scan",on.length+1,"storybook",on.filter(x=>x.id!=="region").length,"wcag-only",on.filter(x=>x.tags.some(t=>wcag.includes(t))).length+1)'
  # expected:
  # 105 90
  # wcag2a 62 57
  # wcag2a-obsolete 2 0
  # wcag2aa 3 3
  # wcag21a 1 1
  # wcag21aa 3 2
  # wcag22aa 1 0
  # wcag2aaa 3 0
  # best-practice 30 27
  # off aria-roledescription audio-caption color-contrast-enhanced css-orientation-lock duplicate-id duplicate-id-active focus-order-semantics hidden-content identical-links-same-purpose landmark-complementary-is-top-level meta-refresh-no-exceptions p-as-heading table-fake-caption target-size td-has-header
  # scan 91 storybook 89 wcag-only 64
  ```

- **The matrix** (`orv161-pages`, `orv161-matrix`, row 6). Input: the 9 states of "The set this covers" (flag 1 = needs a database, slice 5) and the three dimensions of `orv161-matrix`. No rounding.

  ```bash
  node -e 'const S=[["/","page",0],["/workspace","page",0],["/_not-found","page",0],["/directions","not-configured",0],["/account","not-configured",0],["/directions","signed-out",1],["/account","signed-out",1],["/directions","ready",1],["/account","signed-in",1]];const M=[];for(const l of ["th","en"])for(const c of ["light","dark"])for(const w of [360,1280])M.push([l,c,w]);console.log(S.length,M.length,S.length*M.length,S.filter(s=>!s[2]).length*M.length)'
  # expected: 9 8 72 40
  ```

- **Blank beats .env.local** (`orv161-servers`, row 7). Input: the fill rule of `@next/env` 16.4.1 (`dist/index.js`: a parsed key is set only when `typeof u[t]==="undefined"&&typeof p[t]==="undefined"`) and `requireEnv`'s test (`packages/db/src/env.ts` line 13). No rounding.

  ```bash
  node -e 'const file={DATABASE_URL:"postgres://from-env-local"};const fill=env=>{const out={...env};for(const k of Object.keys(file)){if(typeof out[k]==="undefined")out[k]=file[k]}return out};const missing=v=>v===undefined||v.trim()==="";for(const env of [{DATABASE_URL:""},{}]){const v=fill(env).DATABASE_URL;console.log(JSON.stringify(v),missing(v))}'
  # expected:
  # "" true
  # "postgres://from-env-local" false
  ```

- **The cookie name** (`orv161-session`). Input: the prefix rule of Better Auth 1.7.12 `dist/cookies/index.mjs` line 23. `config.ts` sets no `useSecureCookies` and passes `baseURL` as a string, so the scheme of `baseURL` decides and `isProduction` is not read. Cookie name from lines 28, 29 and 49. No rounding.

  ```bash
  node -e 'const name=(base,isProduction)=>((typeof base==="string"?base.startsWith("https://"):isProduction)?"__Secure-":"")+"better-auth.session_token";console.log(name("http://localhost:3201",true));console.log(name("https://orivilo-staging.vercel.app",true))'
  # expected:
  # better-auth.session_token
  # __Secure-better-auth.session_token
  ```

- **Target spacing** (M6, `target-size`). Input: `minSize: 24` (axe.js line 38426) and the spacing test of 2.5.8: an undersized target fails when a 24 px circle on its centre meets another target's circle, so when the centres are less than 24 px apart. Two 12 px buttons side by side have centres 12 px apart; with a 30 px gap they are 42 px apart. Pixels, no rounding.

  ```bash
  node -e 'const min=24;for(const gap of [0,30]){const d=12+gap;console.log(gap,d,d<min?"target-size violation":"passes by spacing")}'
  # expected:
  # 0 12 target-size violation
  # 30 42 passes by spacing
  ```

## Slices

One PR each, in this order. Sizes are estimates of changed lines with tests.

1. **Spec PR** (this file; docs only). Reviewer approve, then the G1 and G2 packets under delegation.
2. **Fix PR, lane S** (rows 1 to 4, about 120 lines). `apps/web/app/workspace/page.tsx` wraps `<WorkspaceScreen />` in a `main`. The wrapper goes in the page, not in the component (a `main` there would nest a second one in `/directions`) and not in the layout (the other three pages render their own). New `apps/web/app/not-found.tsx` with the `notFound` keys (open question 4). Both tests are in rows 1 and 3. It can merge in parallel with slice 1.
3. **Scan PR** (rows 5 to 10, about 300 lines). `apps/web/package.json` gains `@playwright/test`, `@axe-core/playwright` and the `test:e2e` script. The root `package.json` gains its script. New `apps/web/playwright.config.ts` (`orv161-servers` port 3200, `orv161-matrix`) and `apps/web/e2e/pages.a11y.spec.ts`. In `apps/web/app/page.tsx` the home page backlog link (the `a` after `m.home.schemaLine`) is underlined at rest, not only on hover, so `link-in-text-block` passes and the 8 scans of `/` meet row 8's zero violations. The `verified` rows of M1 to M9 go in the PR body. Full gate, reviewer and qa.
4. **Guard-file PR** (rows 11 to 14, about 60 lines). It needs a bound builder whose envelope lists `.github/workflows/ci.yml` and `scripts/quality-gate.mjs` by exact path, and the owner approval record at G3.
   - `ci.yml`: `- run: pnpm test:e2e` between `pnpm build` and `pnpm audit`.
   - `quality-gate.mjs`: step `{ name: "e2e", command: ["pnpm", "test:e2e"], env: { REQUIRE_DB_TESTS: "1" } }` after `build`, and a `KEY_LINE` alternative for `\d+ (passed|failed|flaky)`. Setting `REQUIRE_DB_TESTS` now means slice 5 needs no guard file.
   - Also in this PR: `scripts/quality-gate.test.mjs` if its parity list needs the step, `.claude/skills/quality-gate/SKILL.md`, `.github/pull_request_template.md` and `AGENTS.md`.
5. **Session PR, lane L** (rows 15 to 18, about 220 lines). The `orv161-session` fixture and the port 3201 server in `apps/web/e2e/`, the four states with a database, and the new rule in `.claude/rules/security.md`. The `security` role reviews it beside the reviewer. Dropped if open question 1 is answered (b).
6. **Closing PR** (rows 19 and 20, about 80 lines). The ADR 0015 Additions, the ORV-108 note, `DESIGN.md` section 11, `qa.md`, the webapp-testing skill, and the home page entry in `apps/web/i18n/messages.ts`. The catalog file makes it a code PR, so it gets the full gate.
7. **G4 walk** (row 21, about 40 lines). A Playwright project `staging` in the same config: no `webServer`, `baseURL` from `E2E_BASE_URL`, and the states that need no session on staging. It runs by hand, never in CI, and its output goes in the G4 packet (open question 7).

## Out of scope

- The `/directions` `error` state. Reaching it needs a store failure inside a running server, and none of the app's parts can force one from a test today. This is a recorded gap: its notice region is not scanned.
- Interaction states: open dialogs, notices after a failed save, loading, and the Studio's drawn controls after a press (open question 10). Shared components keep their Storybook stories and that axe run.
- A keyboard walk, a screen reader pass, 2.4.11 (focus not obscured), and any WCAG criterion axe cannot test.
- Browsers other than Chromium.
- `/api/auth/*`, which answers with JSON and redirects.
- Changing the Storybook run, its 4 exceptions, or its `region` setting.
- Visual regression of pages.

## Impact list

- **New files.** `apps/web/playwright.config.ts`, `apps/web/e2e/pages.a11y.spec.ts` and the slice 5 fixture under `apps/web/e2e/`, `apps/web/app/not-found.tsx`, `apps/web/app/not-found.test.tsx`, `apps/web/app/workspace/page.test.tsx`.
- **Changed code.** `apps/web/app/workspace/page.tsx`; `apps/web/app/page.tsx` (the backlog link underline, slice 3); `apps/web/i18n/messages.ts` (`notFound` keys in slice 2, the home entry in slice 6); `apps/web/package.json`; the root `package.json`; `pnpm-lock.yaml`. After slice 3, `grep -n 'axe-core@' pnpm-lock.yaml` still shows one version.
- **Guard files** (slice 4, owner approval). `.github/workflows/ci.yml` and `scripts/quality-gate.mjs`. The root `.gitignore` needs no change: lines 15 and 16 already ignore `playwright-report/` and `test-results/`.
- **Rules, skills, agents and docs.** `.claude/rules/security.md` (slice 5); `.claude/skills/quality-gate/SKILL.md`, `.github/pull_request_template.md` and `AGENTS.md` (slice 4); `docs/adr/0015-standards-and-required-controls.md` (Additions after line 39 and after the "Not done yet" line that holds "No axe scan runs on `apps/web` pages"), `docs/specs/ORV-108/spec.md` (row 14 note), `DESIGN.md` (section 11 line 251), `.claude/agents/qa.md` and `.claude/skills/webapp-testing/SKILL.md` (lines 13, 25 and 36), all in slice 6.
- **Unchanged.** `packages/design-system` (component, story, catalog), `apps/web/server/auth.ts`, `turbo.json`, `apps/web/vitest.config.ts` and the ESLint configs. `apps/web/tsconfig.json` already includes `**/*.ts`, so `@playwright/test` types must be installed before `pnpm typecheck` passes.
- **Roles.** `security` on slice 5. The reviewer and qa on slices 2, 3, 5 and 6. The reviewer on slices 1 and 4.

## Open questions

Each has a default. Under the owner's delegation (ADR 0012 decision 4), G1 and G2 pass on the defaults unless the owner answers. ORV-113 has one comment (10180, a CSP carry-over) and no owner decision on item 8.

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Scan the signed-in states? | (a) yes: slice 5, a session minted through a test-only auth instance, lane L; (b) no: the 5 states without a database only, lane M, slice 5 dropped | (b) leaves the account form, the sign-out button and the saved-directions list unchecked by any axe run, and saves one L slice and its `security` review; (a) adds `orv161-session` and a security rule | (a), lane L |
| 2 | Which rules? | (a) axe's default set with `target-size` on, 91 rules, best practice included; (b) WCAG A and AA tags only, 64 rules with `target-size` (worked example "The rule set") | (b) drops `region`, `landmark-one-main` and the other `best-practice` rules, the ones that catch `/workspace` today; (a) matches the Storybook run plus `region` and `target-size` | (a), `orv161-rules` |
| 3 | Switch `target-size` on? | (a) on; (b) off, as axe ships it | ADR 0015 "Not done yet", in the line that holds "No axe scan runs on `apps/web` pages", records 2.5.8 as unchecked; (a) gives it a partial check, and a failing control is fixed in its slice or carried in `orv161-exceptions` with a reason | (a) |
| 4 | `/_not-found`? | (a) add `apps/web/app/not-found.tsx` with the catalog copy of row 3, in slice 2; (b) scan Next.js's default page with exceptions; (c) leave it out | Next.js's default page (`next/dist/client/components/http-access-fallback/error-fallback.js`) renders an `h1` "404" and the English line "This page could not be found." outside any landmark, with inline colours and in English under a Thai `lang`, so (b) needs exceptions for `landmark-one-main` and `region`; (c) leaves a page people see unscanned | (a) |
| 5 | How wide is the matrix? | (a) all 8 combinations per state; (b) both locales and schemes at 1280 px, plus Thai light at 360 px, 5 per state | (b) skips dark at 360 px, where `target-size` and reflow differ; each scan is one page load and one axe run | (a), `orv161-matrix`; the first CI run's time is recorded, and (b) is the fallback if the step pushes the 25 minute job limit |
| 6 | Block from the first run? | (a) blocking, as the Storybook run is; (b) report mode first, as the secret and code scans were | (b) lets a violation merge; the pages are few, so a violation found in slice 3 is fixed there | (a) |
| 7 | G4 evidence | (a) the `staging` project run by hand on `orivilo-staging.vercel.app` (slice 7), signed-in rows owner-verify; (b) the CI scan only | Staging is the only place with real configuration (PR previews are off, ADR 0011 line 15); (b) leaves the configured signed-out pages on Vercel unscanned. If staging needs a protection bypass, its rows become owner-verify | (a) |
| 8 | Which runner? | (a) `@playwright/test` in `apps/web/e2e/`, as the webapp-testing skill and testing.md name; (b) a Vitest browser project in `apps/web` | (b) would put a server start inside `pnpm test`, which runs before `pnpm build` in CI | (a) |
| 9 | How to keep one axe-core? | (a) pin `@axe-core/playwright` to a release whose `axe-core` resolves to 4.14.0; (b) a `pnpm.overrides` entry `axe-core: 4.14.0` | Two versions would judge stories and pages by different rules | (a); (b) only if no release resolves to 4.14.0 |
| 10 | Interaction states? | (a) page loads only; (b) also scripted states (dialogs, notices) | (b) needs a script per state; their components are covered in Storybook | (a) |
| 11 | Ports | (a) 3200 without a database, 3201 with one; (b) other free ports | 3000, 6100 and 3100 are taken (`orv161-servers`) | (a) |
| 12 | A `design.md` and the designer for the 404 page? | (a) no: it reuses the layout and the type classes of the other pages, and the reviewer walks `DESIGN.md` section 11; (b) yes | POC mode (ORV-137) keeps one short spec; (b) adds a designer round to an S slice | (a) |

## Depends on

ADR 0015 decision 1 (the WCAG row, its Confirmation and "Not done yet"), decisions 2 (the `security` role) and 13 (no conformance claim); `.claude/rules/security.md` rules 8 and 16; ADR 0010 (environments, ports and staging URL); ADR 0011 (previews off); ADR 0012 decision 4 (G1 and G2 under delegation); ORV-137 (POC mode); ORV-113 (parent; item 8 is this story); ORV-116 (the CSP move to enforce); ORV-118 tech notes, paragraph "R2 setup" with `next start -p 3100` (port 3100; `docs/specs/ORV-118/tech.md` is on the `feature/ORV-118-logo` branch and not on `develop` yet); ORV-138 rule `qa-scope-1` (the `## Rows per PR` form); L-0002 and testing.md (red runs, one mutation per clause, time limits for CI); the ovl skill sections "Owner approval" and "Test-only and docs PRs"; the webapp-testing skill.

## Changelog

- v1.0 (2026-10-30): first spec, ORV-113 item 8 as its own story (task ORV-161-spec-2; ORV-161-spec-1 stopped before writing). Downstream to review: the ORV-161 Jira issue acceptance (rows 1 to 21); the G1 and G2 packets (lane L, or M if open question 1 is answered (b)); and the documents under "Impact list", brought up to date in slices 4 to 6.
- v1.1 (2026-10-31): anchors and qa scope only; no acceptance row changes meaning (task ORV-161-spec-3). ORV-161-qa-1-F1: new section "Rows per PR" with `- PR 163: rows 1, 2, 3, 4`. R1-F1: the ADR 0015 WCAG line of "Not done yet" is named by its text "No axe scan runs on `apps/web` pages" instead of a line number, in "Why", row 19, "Impact list" and open question 3. R1-F2: `listDirections` (row 16) is named by its `export async function` line, the Vitest globs ("Placement") by the `include` list of `apps/web/vitest.config.ts`, and the ORV-118 tech notes ("Depends on") by the paragraph "R2 setup", on the `feature/ORV-118-logo` branch. Downstream to review: the qa walk of PR 163 (rows 1 to 4) and the slice 6 builder envelope (row 19 anchors).
- v1.2 (2026-10-31): mutants as built and one slice 3 scope line; no acceptance row changes meaning (task ORV-180-spec-2, from the deviations and needs_decision of task ORV-180-build-scan). `orv161-mutants`: M2's red line is the `lang` check of `orv161-wait`, which fails before axe, with `html-has-lang` shown in a second scratch run without that check; M3 uses a near-canvas colour made with `color-mix()`, since equal colours give axe `incomplete`; M7 is red through a load-time guard on the six port 3200 names, with its error line, and its rule class is `orv161-servers`. "Slices" item 3 and "Impact list" gain the underline at rest on the home page backlog link in `apps/web/app/page.tsx`, so the 8 scans of `/` meet row 8. Downstream to review: `docs/specs/ORV-180/spec.md` (v1.1), the slice 3 builder envelope (its write set gains `apps/web/app/page.tsx`), the slice 3 PR body (the M2, M3 and M7 `verified` rows) and the reviewer's `DESIGN.md` section 11 walk, which now covers a UI change on `/`.
