---
issue: ORV-123 (https://tpetkaew.atlassian.net/browse/ORV-123)
lane: L
version: 1.0
---

# ORV-123: sign-in follow-ups from ORV-122

## Why

ORV-122 put sign-in behind a shared count with two doors, the `signInWithGoogle` action and `POST /api/auth/sign-in/*` through `authRoute` ([ORV-122 spec](../ORV-122/spec.md)). Its reviews left five small gaps, and ORV-123 comment 10254 decides all five with no new requirement:

1. The route treats a count that throws before it returns a promise like one that rejects (ORV-122 "Rules and bounds", store failure). The action does not: `signInWithGoogle` awaits `consumeSignIn(await headers())` bare, so a count that throws (a missing `BETTER_AUTH_SECRET` inside `subjectFromHeaders`, a database client that cannot be built inside `limiter()`) escapes the action and the person lands on the error page instead of the sign-in notice. ORV-122 row 20 already promises the notice for that case.
2. The `auth-route.test.ts` title "does not count other media types, with or without a foreign Origin" sends every case with `Origin: https://evil.example`; the "without" half has no case.
3. ORV-122 row 20's Test column names "a count that throws synchronously answers 503", a title that does not exist, and row 25's Test column does not yet name the no-Origin cases of item 2.
4. In Thai the failure notice says "ทำไม่สำเร็จ" twice: the `account.problem` badge, then the line `saved.errors.failed` ("ทำไม่สำเร็จ ลองอีกครั้ง").
5. At 360 px in Thai the limit line breaks inside "ในอีก 7 นาที" (ORV-112 design.md §13, sign-off ORV-122-design-signoff-2, S2).

**Frame.** A server-side control, as in ORV-122: not a hook that judges text. The count lives in Postgres behind `orivilo_app`; this story only changes how the action reacts when the count cannot run.

**What is real.** Real server code and unit tests for items 1 and 2. Items 4 and 5 are copy and layout; their exact copy and wrapping method are decided by the designer in `docs/specs/ORV-123/design.md` (a later task), and row 6 rests on the designer's rendered check at 360 px, which `pnpm test` does not run.

## Story

As a person signing in on `/account`, I want a failed sign-in to tell me once, in my language, that it did not work, and the wait to read as one phrase on a phone, so that I know what happened and when to try again; and as the team, we want the action and the route to fail closed the same way, with tests and spec rows that say what they check.

## Acceptance criteria

Rows 1 and 2 follow `orv123-count-guard` and `orv123-log-line`; row 5 follows `orv123-failure-copy`; row 6 follows `orv123-wait-phrase` (all in "Rules and bounds").

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | The sign-in count throws synchronously, before it returns a promise (for example `subjectFromHeaders` throws on a missing `BETTER_AUTH_SECRET`), Thai or English | "Sign in with Google" is pressed on `/account` | The page stays on `/account`, not the error page, and shows row 5's failure notice inside the `role="status"` region; the button stays enabled | `signInWithGoogle` returns `{ error: "failed" }`; `signInSocial` is not called and no `verification` row is written; exactly one log line by `orv123-log-line` | `apps/web/app/account/actions.test.ts`, "a count that throws or rejects returns failed and logs once" (the synchronous case: a mocked `consumeSignIn` that is not async and throws an error whose message is `secret detail`) |
| 2 | The sign-in count returns a promise that rejects (for example the database client fails), Thai or English | "Sign in with Google" is pressed on `/account` | As row 1 | As row 1 | Same test as row 1 (the rejecting case: a mocked async `consumeSignIn` that throws `secret detail`) |
| 3 | `authRoute` with a spied count and a handler that answers 200 | `POST /api/auth/sign-in/social` is sent with each of `text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data; boundary=x` and no `content-type`, once with `Origin: https://evil.example` and once with no `Origin` header | No screen. The handler's own answer comes back for all 8 requests | The count is called 0 times; the handler is called 8 times | `packages/auth/src/auth-route.test.ts`, "does not count other media types, with or without a foreign Origin" (title unchanged, 4 no-Origin cases added) |
| 4 | `docs/specs/ORV-122/spec.md` v1.4 | A reader opens rows 20 and 25 | Row 20's Test column quotes "a count that throws before it returns a promise answers 503 and logs once" and names row 1's action test; row 25's Test column names the no-Origin cases of row 3 | None | `grep -n 'a count that throws before it returns a promise answers 503 and logs once' docs/specs/ORV-122/spec.md` and `grep -n 'no .Origin' docs/specs/ORV-122/spec.md` each print a line of the table |
| 5 | The action returned `{ error: "failed" }` (rows 1 and 2, or the count answering unavailable) | `/account` renders the sign-in notice, once in Thai and once in English | Thai: the badge "ทำไม่สำเร็จ", then a line that does not contain "ทำไม่สำเร็จ", so the `role="status"` region holds "ทำไม่สำเร็จ" exactly once; the line's Thai copy is the one design.md decides. English: the badge "Not done", then "That did not work. Try again.", unless design.md changes it. The button stays enabled | None. Any string added or changed for it lands in `apps/web/i18n/messages.ts` in Thai and English in the same change | `apps/web/app/account/SignInForm.test.tsx`, "shows the failure word once, then the line, in %s" (`en` and `th`: the badge word and design.md's exact line inside `role="status"`, and in Thai one occurrence of "ทำไม่สำเร็จ") |
| 6 | Thai, the action returned `{ error: "rate-limited", retryAfter: 420 }`, the viewport 360 px wide, light and dark | `/account` renders the sign-in notice | The badge "ทำไม่สำเร็จ", then the limit line, today "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 7 นาที" (or the copy design.md decides), with "ในอีก 7 นาที" whole on one line; ORV-112 design.md D2a still holds | None | `apps/web/app/account/SignInForm.test.tsx`, "keeps the wait phrase together in Thai" (the markup carries the wrapping method design.md names around the wait phrase); plus the designer's render of `/account` at 360 px, Thai, light and dark, recorded in design.md, showing the phrase on one line |

## Rules and bounds

- **orv123-count-guard.** `signInWithGoogle` calls `consumeSignIn` so that a synchronous throw and a rejection reach the same path as a count that answers `unavailable`: the action returns `{ error: "failed" }` and does not call `signInSocial`. This is the same guard `authRoute` uses (ORV-122 "Rules and bounds", store failure). Only the count is guarded: an error from `auth().api.signInSocial`, the missing-URL error and Next's `redirect` throw pass through unchanged, so a granted sign-in still redirects.
- **orv123-log-line.** When the guard in `orv123-count-guard` catches a throw or a rejection, the action writes exactly one line with `console.error`: one JSON object with exactly the keys `level` (`"error"`), `route` (`"account/sign-in"`) and `outcome` (`"unavailable"`). The line holds no IP, key, header value, error message, error name or stack (`.claude/rules/security.md` rules 8 and 15). A count that answers `unavailable` without throwing adds no line here; the limiter's own `onResult` line already records it (open question 2).
- **orv123-failure-copy.** In Thai the failure notice says "ทำไม่สำเร็จ" once, in the badge; the line under it says what to do without repeating it. The exact Thai line, and any English change, are decided in `docs/specs/ORV-123/design.md`. The English badge "Not done" and line "That did not work. Try again." stay unless design.md changes them. The change does not alter `saved.errors.failed` as the directions pages use it (open question 3).
- **orv123-wait-phrase.** In Thai at 360 px, the wait phrase of the limit line ("ในอีก 7 นาที" for a 420 s wait) does not break across lines. The method (for example a span per sentence, or a no-wrap span around the phrase) and any copy change are decided in `docs/specs/ORV-123/design.md`; ORV-112 design.md §13 names a span per sentence as a starting point, not a decision. The method must keep ORV-112 design.md D2a (the notice grows downward only, badge and line never side by side).
- Thai and English strings change together in `apps/web/i18n/messages.ts`; no middot and no em dash in any string.

## Out of scope

- Errors from `signInSocial`, the missing-URL error and the redirect (they keep today's behaviour).
- The copy of `saved.errors.failed` on the directions pages.
- Wrapping of the English limit line, and of any line other than the Thai sign-in limit line.
- A request id for server actions and their log lines (ORV-113).
- A Playwright page test for `apps/web` (not set up; ORV-112 design.md v1.2).
- Any change to `authRoute`'s code or to the count's limit, window or subject.

## Tests

<!-- prettier-ignore -->
| Row | File | Test title | What it asserts |
| --- | --- | --- | --- |
| 1, 2 | `apps/web/app/account/actions.test.ts` | "a count that throws or rejects returns failed and logs once" | For a non-async mock that throws and an async mock that rejects, each with the message `secret detail`: the action resolves to `{ error: "failed" }`; `signInSocial` is not called; `console.error` is called once per press; the line parses as JSON with exactly the keys and values of `orv123-log-line`; the line does not contain `secret detail` |
| 1, 2 | `apps/web/app/account/actions.test.ts` | "counts the sign-in limit per network, then starts OAuth" (existing) | Still passes: the guard does not swallow the redirect |
| 3 | `packages/auth/src/auth-route.test.ts` | "does not count other media types, with or without a foreign Origin" | The 4 media types with the foreign `Origin` and the same 4 with no `Origin`: the count is never called; the handler is called 8 times |
| 4 | `docs/specs/ORV-122/spec.md` | none (a document row) | The two `grep -n` commands in row 4 each print a table line |
| 5 | `apps/web/app/account/SignInForm.test.tsx` | "shows the failure word once, then the line, in %s" | In `en` and `th`, for `{ error: "failed" }`: the badge word and design.md's exact line inside `role="status"`; in `th`, "ทำไม่สำเร็จ" occurs once in that region; the button has neither `disabled` nor `aria-busy` |
| 6 | `apps/web/app/account/SignInForm.test.tsx` | "keeps the wait phrase together in Thai" | For `{ error: "rate-limited", retryAfter: 420 }` in `th`: the markup carries design.md's method around "ในอีก 7 นาที" (or the phrase design.md names); the full line text is unchanged unless design.md changes it |
| 6 | `docs/specs/ORV-123/design.md` | designer's render | `/account` at 360 px, Thai, light and dark, the limited state: the phrase sits on one line and D2a holds |

Existing tests that change with this story: the "shows the word and the wait line in %s" case in `SignInForm.test.tsx` reads the line as one string, so a span per sentence may need its assertion read from the text content; `sign-in-line.test.ts` asserts the failure line equals `saved.errors.failed`, which changes if the line gets its own key (open question 3).

## Worked examples

Each line is copied from its source and was not run in this task (no shell).

- The wait for row 6, from `formatWait` in `apps/web/i18n/wait.ts` and `wait.minutes` (Thai) in `apps/web/i18n/messages.ts`. Rounding: whole minutes rounded up (`Math.ceil`), so any `retryAfter` from 361 to 420 gives 7.

  ```bash
  node -e 'const m={one:"{n} นาที",other:"{n} นาที"};const s=420;const n=Math.ceil(s/60);console.log(m[n===1?"one":"other"].replace("{n}",String(n)))'
  # expected: 7 นาที
  ```

- The full Thai limit line for row 6, from `account.rateLimited` (Thai) filled with that wait. No rounding.

  ```bash
  node -e 'console.log("มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก {wait}".replace("{wait}","7 นาที"))'
  # expected: มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 7 นาที
  ```

- The count row 5 checks, on today's Thai notice: `account.problem` then `saved.errors.failed`. An integer count, no rounding. Today it prints 2; row 5 expects 1.

  ```bash
  node -e 'const t="ทำไม่สำเร็จ"+"\n"+"ทำไม่สำเร็จ ลองอีกครั้ง";console.log(t.split("ทำไม่สำเร็จ").length-1)'
  # expected today: 2
  ```

## Impact list

- `apps/web/app/account/actions.ts`: `signInWithGoogle` guards the count (`orv123-count-guard`) and logs (`orv123-log-line`).
- `apps/web/app/account/actions.test.ts`: the new test of rows 1 and 2.
- `packages/auth/src/auth-route.test.ts`: the no-Origin cases of row 3.
- `apps/web/i18n/messages.ts`: the failure line and, if design.md changes it, the limit line, Thai and English together.
- `apps/web/app/account/SignInForm.tsx`, `sign-in-line.ts`, `page.tsx`: the notice's line and the wrapping method, as design.md decides; `page.tsx` passes a new label if the line gets its own key.
- `apps/web/app/account/SignInForm.test.tsx`, `sign-in-line.test.ts`: rows 5 and 6, and the existing cases named under "Tests".
- `docs/specs/ORV-122/spec.md`: rows 20 and 25 Test column, v1.4 (this task).
- Specs to review: `docs/specs/ORV-112/design.md` §13 (the second bullet says the sign-in store-failure path throws to the error page, which ORV-122 already changed; the third bullet's polish is taken by this story), `docs/specs/ORV-112/tech.md` "Slice B as built" (the action's failure path).

## Open questions

<!-- prettier-ignore -->
| # | Question | Options | Impact | Default |
| --- | --- | --- | --- | --- |
| 1 | Does the action's log line carry a `requestId`? | (a) no; (b) a random id per line, as `authRoute` makes | (b) gives an id that no response header carries, since server actions have no `x-request-id` yet | (a): `orv123-log-line` has no `requestId`; ORV-113 adds request ids to server actions |
| 2 | Does the action also log when the count answers `unavailable` without throwing? | (a) no; (b) yes, the same line | (b) writes two lines for one failure, the limiter's `onResult` line and this one | (a), as `orv123-log-line` says |
| 3 | Where does the sign-in failure line live? | (a) its own key under `account`, named in design.md; (b) change `saved.errors.failed` | (b) changes the directions pages' copy, which is out of scope | (a); `saved.errors.failed` keeps its copy |
| 4 | What if design.md names no wrapping method? | (a) the build waits for design.md; (b) the builder picks | (b) puts a design choice in a build task | (a); ORV-112 design.md §13's span per sentence is a starting point for the designer only |

## Decisions

From ORV-123 comment 10254 (the owner's five decisions, as the envelope of task ORV-123-spec-1 restates them):

1. `signInWithGoogle` guards `consumeSignIn` like `authRoute` does: a count that throws synchronously or rejects returns `{ error: "failed" }` and logs once, with a test where the mocked count throws. Met by `orv123-count-guard`, `orv123-log-line`, rows 1 and 2.
2. The auth-route media-type test gains no-Origin cases and its title stays true. Met by row 3.
3. Items 1 and 2 bring `docs/specs/ORV-122/spec.md` row 20's Test column (quoting "a count that throws before it returns a promise answers 503 and logs once") and row 25 up to date. Met by row 4 and ORV-122 spec v1.4.
4. The Thai failure notice does not repeat "ทำไม่สำเร็จ" (badge then line); exact copy in design.md. Met by `orv123-failure-copy`, row 5.
5. The Thai limit line keeps "ในอีก 7 นาที" together at 360 px; wrapping method and copy in design.md. Met by `orv123-wait-phrase`, row 6.

English copy stays unless the designer changes it; Thai and English change together in `apps/web/i18n/messages.ts` (comment 10254).

## Depends on

[ORV-122](https://tpetkaew.atlassian.net/browse/ORV-122) spec v1.4 (rows 11, 20 and 25, "Rules and bounds"), [ORV-112](https://tpetkaew.atlassian.net/browse/ORV-112) design.md D2, D2a and §13, ORV-112 decisions 4 (`useActionState` form) and 7 (fail closed), ORV-113 (request ids), ADR 0015 decision 6 (logs), `.claude/rules/security.md` rules 8 and 15, sign-off `ORV-122-design-signoff-2` (S2). `docs/specs/ORV-123/design.md` (a later task) decides the copy of row 5 and the copy and method of row 6.

## Changelog

- v1.0 (2026-10-29): first spec, the five items of ORV-123 comment 10254. Downstream to review: the ORV-123 Jira issue acceptance (rows 1 to 6), `docs/specs/ORV-123/design.md` (to be written: rows 5 and 6), the build task (Impact list), `docs/specs/ORV-112/design.md` §13 and `docs/specs/ORV-112/tech.md` "Slice B as built".
