---
issue: ORV-268 (https://tpetkaew.atlassian.net/browse/ORV-268)
lane: L (risk flag: auth and data access)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.0
---

# ORV-268: only approved email addresses can use /read

## Goal

This is not a hook on a tool call, so the guard frame of L-0012 does not apply. It is a boundary against strangers on the deployed app. The server enforces it: the page and the server action run on the server and read a list the browser never holds.

Finding SEC-267-2 of task `ORV-267-security-1` found that any Google account can sign up and use `/read`. Each account gets its own page-read limit, and one read can reach many outbound hosts. So outbound traffic and function time grow with the number of strangers who sign up. On 2026-11-07 the owner chose "Approved emails only" for the POC (the question form; the Jira issue holds the scope).

After this story, only a signed-in person whose email address is on a server-side list can read a website. Everyone else who is signed in sees one plain line and no form, and the server action refuses them first, in the order of `read-door-1`. Sign-up stays open, and every other page works as before.

What is real: the check is a plain string match on the server, done on every page load and every action call. Nothing here is AI and nothing is simulated.

## Story

As the owner running the POC on staging, I want only the email addresses I approve to be able to read a website through `/read`, so that strangers who sign in with Google cannot make our server send traffic or spend function time.

## Rules and bounds

### read-allow-list-1

- **The variable.** The list lives in one server environment variable, `READ_ALLOWED_EMAILS`. It is server only. Its name never takes the `NEXT_PUBLIC_` prefix, and only a module that imports `server-only` reads it. It is read from `process.env` on each call, not once at module load.
- **Where it is set.** Locally in `apps/web/.env.local` for `pnpm dev`. On the Vercel project, in the Preview and the Production environments, with the same name in each (ADR 0010 point 4). `apps/web/.env.example` gets the name with an empty value. No real address goes into the repo, a test, a fixture, a story, Jira or chat. Tests use addresses under `example.com` and `example.test`.
- **The format.** Addresses separated by commas. Each entry is trimmed of whitespace (spaces, tabs, line breaks) and lowercased. An entry that is empty after the trim is dropped.
- **The match.** The session's `user.email`, trimmed and lowercased the same way, must equal one entry exactly. There is no other normalisation: dots and `+` tags are not removed. There are no domain entries and no wildcards, so `example.com` or `*@example.com` in the list allows no one.
- **Default deny.** If the variable is unset, empty, or holds only separators and whitespace, no one is allowed. If the session has no email or an empty email, that person is not allowed.
- **One answer for every refusal.** The page and the action give the same answer whether the list is unset, empty, or lacks the address. Neither says which, so nobody learns how the list is set up.
- **No address leaves the check.** The check returns true or false. No log line, error body, page or story holds the session's address, any part of it, or any list entry.

### read-door-1

This is the order the action `analysePage` checks things in, for a person with a session:

1. the session,
2. `read-allow-list-1`,
3. the `page-read` limit,
4. the input schema,
5. the ports and the fetch (`createReadPorts`, then `readUrlInput`).

A person refused at step 2 gets error `forbidden`, code `FORBIDDEN`, `retryable: false`. The answer has no `message` field and no address. The boundary line ends `{ level: "info", outcome: "refused", reason: "forbidden" }`. No limit is consumed, no port is created and no input is parsed. Without a session the path does not change: the `signed-out` limit counts by IP, then the action answers `signed-out` (ORV-267 row 12). The list is never consulted for a caller with no session.

For an approved person, this rule narrows the parent's `page-read-limit-1` sentence "every submission that reaches the server counts". It now reads: every submission from an approved person counts. That sentence's home is `docs/specs/ORV-266/spec.md`. This story does not edit it, and the task report lists it for review.

### Copy

One new key, in the design-system catalog (`packages/design-system/src/i18n/messages/en.ts` and `th.ts`). The text is a draft for the owner's copy review. It has no middot and no em dash.

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `brandReport.notAllowed` | Reading a website is open only to approved accounts for now, and this account is not one of them. | ตอนนี้การอ่านเว็บไซต์เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ |

The screen gets no new component. `BrandReportScreen`'s `access` prop gains the value `not-allowed`. On the page, the line renders the way `brandReport.notConfigured` does: a `p` under the heading, with no form. After a submit, the line renders in the screen's existing failure line (the `danger` Notice in the `role="alert"` container).

## Acceptance criteria

Rows 1 to 6 test the pure check of `read-allow-list-1` (`apps/web/server/read-access.test.ts`, names suggested). Rows 7 to 10 test the action with the fake ports and the in-memory limiter of `apps/web/app/read/actions.test.ts`, so no test reaches the internet (ADR 0009 point 8). The page rows are proven on `page.test.tsx` and on stories of `Examples/Application: Brand report` in both languages, because a QA checkout cannot open a signed-in page without a Google session. The list values in the rows are fixtures.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `READ_ALLOWED_EMAILS` unset, session email `reader@example.com` | The check runs | No UI | The check is false by `read-allow-list-1` | `read-access.test.ts` "unset denies" |
| 2 | `READ_ALLOWED_EMAILS` is `""`; separately ` , ,  ` | The check runs for `reader@example.com` | No UI | False in both cases | `read-access.test.ts` "empty denies", one case each |
| 3 | `READ_ALLOWED_EMAILS` is `reader@example.com,second@example.test` | The check runs for `reader@example.com`, then for `second@example.test` | No UI | True for both | `read-access.test.ts` "listed allows" |
| 4 | The list of row 3; separately the list `example.com,*@example.com` | The check runs for `other@example.com`, `reader@example.co` and `eader@example.com` on the first list, and for `reader@example.com` on the second | No UI | False for each. A domain entry and a wildcard entry allow no one | `read-access.test.ts` "not listed denies" |
| 5 | `READ_ALLOWED_EMAILS` is ` Reader@Example.COM ,second@example.test` followed by a line break | The check runs for `reader@example.com`, `READER@EXAMPLE.COM ` and ` Second@Example.Test`, then for `re.ader@example.com` and `reader+x@example.com` | No UI | True for the first three and false for the last two, as "Worked examples" shows | `read-access.test.ts` "case and whitespace", one case each |
| 6 | The list of row 3 | The check runs for a session whose email is `""`, and for one with no email field | No UI | False for both | `read-access.test.ts` "no email denies" |
| 7 | Session `other@example.com`, list of row 3 | The action is called with `{ url: "example.com", role: "own" }`; separately with `{}`; separately with the limit store set to fail | No UI | All three give the step 2 refusal of `read-door-1`, never `invalid-input` or `SERVICE_UNAVAILABLE`. `state.consumed` is `[]`, `state.created` is 0, and `state.resolved` and `state.requested` are `[]` | `actions.test.ts` "not allowed refuses first". The mutants "allow-list check moved after the limit" and "moved after the input check" each go red |
| 8 | Session `reader@example.com`, list of row 3 | The action is called with `{}`; separately with a valid input after the hourly window is used up; separately with a valid input to a routed fake page | No UI | First: one `page-read` consume, then `invalid-input`, and `state.created` 0. Second: `RATE_LIMITED` with `retryAfter`, and `state.created` 0. Third: a report, and `state.created` 1. Recorded order: session, allow-list, consume, ports (`read-door-1`) | `actions.test.ts` "allowed order" |
| 9 | No session, list of row 3 | The action is called | No UI | The path without a session of `read-door-1`: one `signed-out` consume by IP, then `signed-out`. The list is not read | `actions.test.ts` "signed out" (ORV-267 row 12) still passes, plus a spy that sees no read of the list |
| 10 | Session `not.listed+tag@example.com`, list `reader@example.com,second@example.test` | The action is called with a valid input, and the page renders for that session | No UI | No captured log line and no `JSON.stringify` of the answer holds `not.listed`, `example.com`, `reader@` or `second@`. The one boundary line has route `read/analysePage` and the ending of `read-door-1`, and it passes `expectLineShape` | `actions.test.ts` "no address in logs or answer"; `page.test.tsx` "not allowed logs nothing" with `captureLines` |
| 11 | A signed-in person not on the list | They open `/read` | `brandReport.heading`, then "Reading a website is open only to approved accounts for now, and this account is not one of them." ("ตอนนี้การอ่านเว็บไซต์เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ"). No form, no sign-in link, no address | None. `analysePage` is not called | `page.test.tsx` "not allowed"; story `NotAllowed`, play: the line shows, and no `form` and no `textbox` exist |
| 12 | A signed-in person, `READ_ALLOWED_EMAILS` unset; separately `""` | They open `/read` | The same as row 11: `brandReport.notAllowed`, never `brandReport.notConfigured` | None | `page.test.tsx` "unset list shows not allowed", one case each |
| 13 | A signed-in person on the list | They open `/read` | The form, as in ORV-267 rows 14 to 37 | None | `page.test.tsx` "allowed shows the form"; the ORV-267 tests and stories still pass |
| 14 | An approved person has the form open, and the address then leaves the list (the action answers `forbidden`) | They submit `example.com` with `brandReport.roleOwn` | The failure line (Alert `danger`) with `brandReport.notAllowed`, never `saved.errors.forbidden`. The address stays in the field. No report sections | One action call | A test of `ReadForm`: a stub answer `forbidden` gives the `brandReport.notAllowed` text; story `NotAllowedOnSubmit` |
| 15 | The `NotAllowed` and `NotAllowedOnSubmit` stories | They render in Thai, then in English | The Thai line of row 11, then the English line, each from the catalog. The Thai text has no letter spacing | None | Both stories in both languages; `check-i18n` finds the key in `en.ts` and `th.ts` |
| 16 | A frame 360 px wide | `NotAllowed` and `NotAllowedOnSubmit` render in Thai and in English, light and dark | The line wraps inside the frame; no horizontal scroll | None | Story play on the 360 px frame: the frame is at most 360 px wide and its `scrollWidth` is at most its `clientWidth` |
| 17 | The PR head | `pnpm build` runs | No UI | `git grep -n "NEXT_PUBLIC_READ_ALLOWED"` is empty. The module that reads `READ_ALLOWED_EMAILS` imports `server-only`. `grep -rl READ_ALLOWED_EMAILS apps/web/.next/static` is empty. `apps/web/.env.example` holds `READ_ALLOWED_EMAILS=` with no value | The three commands; a read of `apps/web/.env.example` in the diff |
| 18 | The PR head | The diff is read | No UI | Sign-up stays open: `git diff --stat origin/develop -- packages/auth` is empty. No route other than `/read` changes: `git diff --stat origin/develop -- apps/web/app` lists only `apps/web/app/read/` | The two commands; `e2e/pages.a11y.spec.ts` still passes |
| 19 | The PR head | The gate runs | No UI | Thai and English keys match, and there is no middot or em dash in the new copy | `check-i18n`; `apps/web/i18n/messages.test.ts`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |

## Rows per PR

- PR 205: rows 1-19

## Rows that render nothing

- Rows: 1-10, 17, 18, 19

Rows 1 to 6 test the pure check, and rows 7 to 10 test the action. The screen they end on is row 11's or row 14's. Rows 17, 18 and 19 are commands and a gate run.

## Worked examples

**`read-allow-list-1`, the match (rows 1 to 6).** Input: the fixture addresses and lists of rows 1 to 6. No module holds them yet, because the check is new in this story. Output: the check's answer per case, one line each, true or false, so no rounding applies. This line was not run (not run, no shell). The builder runs it and reports any difference.

```bash
node -e "const list=s=>(s??'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean);const may=(email,raw)=>{const a=(email??'').trim().toLowerCase();return a.length>0&&list(raw).includes(a)};const L=' Reader@Example.COM ,second@example.test\n';for(const [e,r] of [['reader@example.com',undefined],['reader@example.com',''],['reader@example.com',' , ,  '],['reader@example.com',L],['READER@EXAMPLE.COM ',L],[' Second@Example.Test',L],['other@example.com',L],['re.ader@example.com',L],['reader+x@example.com',L],['reader@example.com','example.com,*@example.com'],['',L],[undefined,L]])console.log(e===undefined?'(no email)':JSON.stringify(e),String(r===undefined?'(unset)':JSON.stringify(r)),may(e,r))}"
```

Expected, the last word of each line: `false`, `false`, `false`, `true`, `true`, `true`, `false`, `false`, `false`, `false`, `false`, `false`.

## Out of scope

- Closing sign-up, or changing the hook that creates a workspace for each new user (`packages/auth/src/config.ts`). Sign-up stays open.
- Any page or action other than `/read` and `analysePage`.
- SEC-267-1 (a cap on reads in flight), and SEC-267-3 to SEC-267-6.
- A screen or a table to manage the list. The list lives in the environment only.
- Domain entries, wildcards, and address normalisation beyond trim and lowercase.
- A link to sign in with another account from the not-allowed line.

## Open questions (with defaults)

1. **Google's verified flag.** The check could also require `user.emailVerified`. Default: match the address only, because Google is the only sign-in method and Google gives the address. Revisit when another sign-in method is added.
2. **Calls from a refused person are not counted.** By `read-door-1`, a signed-in person off the list spends no limit. So they can call the action without a count, though each call costs only a session read and never opens an outbound connection. Default: accept this for the POC, as the owner set the order. Option: count refused calls on the `signed-out` limit by IP.
3. **Changing the list needs a redeploy.** On Vercel, a changed environment variable applies only to a new deployment. Default: accept this for the POC. Option: a table, which is a later story.
4. **The home page link.** `home.openBrandReport` still shows to everyone. Default: keep it, since other pages stay unchanged, and `/read` says why a person cannot read.

## Depends on

- PR 204 (ORV-267): `apps/web/app/read/actions.ts`, `page.tsx`, `ReadForm.tsx`, their tests, and the `BrandReportScreen` `access` prop. This story builds after PR 204 merges into `develop`.
- `docs/specs/ORV-266/spec.md`: `page-read-limit-1`, which `read-door-1` narrows, and open question 3 ("Who may read on staging"), whose default this owner decision replaces. Both are listed in the task report for review, and this file does not edit them.
- Finding SEC-267-2 of task `ORV-267-security-1`.
- `.claude/rules/security.md` rules 1, 8, 14 and 15. ADR 0010 point 4 (one variable name in every environment). ADR 0009 point 8 (no test reaches the network).
- `packages/auth/src/log.ts` `REASONS`, which already holds `forbidden`, and `packages/auth/src/errors.ts` `FORBIDDEN`. Neither changes.
- `security` reviews the PR, because it touches `apps/web/server`.
- At G4 the owner sets `READ_ALLOWED_EMAILS` on the Vercel Preview and Production environments before the release. An unset variable is handled by the default deny of `read-allow-list-1`.

## Changelog

- v1.0 (2026-11-07): first version, from the owner's choice "Approved emails only" and finding SEC-267-2. Task `ORV-268-spec-1`. Downstream to review: `docs/specs/ORV-266/spec.md` line 92 (`page-read-limit-1`) and line 340 (open question 3), the builder envelope, the `security` envelope, and the qa envelope once "Rows per PR" names the PR number.
