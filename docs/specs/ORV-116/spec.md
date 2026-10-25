---
issue: ORV-116 (https://tpetkaew.atlassian.net/browse/ORV-116)
lane: S
version: 2
pr: https://github.com/Thawatchai-Petkaew/orivilo/pull/104
---

# ORV-116: staging polish, no console errors on staging pages and stories

## Why

The G4 staging walk on release e11fc8c passed with follow-ups: the staging app and the deployed Storybook log console errors that have nothing to do with a real fault. Noise like this hides the next real error from anyone who opens the console, and it makes a QA walk that counts console errors unreliable. This story removes the five sources found on that walk and changes no feature.

This spec records the scope as built and reviewed on PR 104, head a5923d8. It adds no scope.

## User story

As the owner walking staging, I open the app pages and the listed stories in Thai and English, light and dark, and the browser console stays empty, so any error I do see is a real one.

## Done when

Staging pages (`/`, `/directions`, `/workspace`) and the listed stories load with 0 console errors in Thai and English, light and dark.

## Acceptance criteria

| #   | Given                                                                                                                                           | When                                                                            | Result                                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The app sends its CSP as `Content-Security-Policy-Report-Only`, and browsers ignore `upgrade-insecure-requests` in report mode and log an error | `/`, `/directions` or `/workspace` loads on a production build, Thai or English | The policy has no `upgrade-insecure-requests` directive and every other directive is unchanged. The page logs 0 console errors. HSTS still upgrades requests. `security-headers.test.ts` pins the missing directive                                                                                                                                    |
| 2   | The CanvasChat Idle, Mentions, MentionGone, OnBoard and Send stories and the TaskBar Mixed story                                                | Each story loads with locale `en` or `th`, mode light or dark                   | Idle reads its names from the active locale catalog. The input, Send, Stop and You matchers accept the name from either catalog, Thai or English, so a name from the other locale does not fail a play. Each listed play passes and the story logs 0 console errors under `en` and `th`                                                                |
| 3   | The visual-asserts EdgeInk stories, whose plays call `expectEdgeInk` from `vitest/browser`                                                      | A story loads in the static Storybook, outside Vitest                           | The play returns early, `vitest/browser` never throws, and the story logs 0 console errors. Under Vitest the play still runs its assertion                                                                                                                                                                                                             |
| 4   | The production CSP has no `'unsafe-eval'`, and zod's compiled parsers build a function with `new Function`                                      | `/directions` or `/workspace` loads, Thai or English, light or dark             | `z.config({ jitless: true })` runs in `apps/web/instrumentation-client.ts` before the app is interactive and before any schema is built, so no CSP violation is logged and the page logs 0 console errors. zod is a direct `apps/web` dependency at the workspace's pinned 4.6.6, no new package                                                       |
| 5   | A delete on the board removes nodes or edges and leaves downstream nodes stale                                                                  | The delete message is built for 1 and for many, in Thai and English             | Singular and plural forms read right with no space before the comma. English: "Deleted 1 node and 1 edge, 1 downstream node is stale" and "Deleted 3 nodes and 4 edges, 5 downstream nodes are stale". Thai: "ลบ 1 node และ 1 สาย, 1 node ปลายทางล้าสมัย" and "ลบ 3 node และ 4 สาย, 5 node ปลายทางล้าสมัย". `delete-message.test.ts` covers 1 and many |

## Rules and bounds

- Touch only what the five items need: no new dependency, no new shared component, no other CSP directive or header.
- Every string stays in the locale catalogs, Thai and English together. No middot and no em dash.
- The CSP stays Report-Only. Restoring `upgrade-insecure-requests` belongs to the change that makes the CSP enforce.
- The ORV-108 spec no longer lists `upgrade-insecure-requests` in the CSP, matching row 1.

## Out of scope

- The 22 other CanvasChat stories that still use Thai literals and throw in English (ORV-119).
- Restoring `upgrade-insecure-requests` when the CSP enforces (ORV-113 comment 10180).
- Matching the input, Send, Stop and You names against the active catalog only, so a name from the wrong locale fails the play (ORV-119, review-2 R3, ORV-119 comment 10181).

## Open questions

None. The scope comes from the G4 staging walk on e11fc8c and was built, reviewed and walked by QA before this spec was written.

## Decisions it depends on

ADR 0012 (gates and Jira states), ADR 0016 (staging releases), spec ORV-108 (security headers and the Report-Only CSP), `.claude/rules/testing.md` (visual plays through `visual-asserts.ts`, L-0018).

## Changelog

- v1 (2026-10-25): first spec, recording the scope as built on PR 104 head a5923d8.
- v2 (2026-10-25): row 2 now matches the code at a5923d8 (Idle reads the active catalog; the input, Send, Stop and You matchers accept either catalog), and matching against the active catalog only moves to Out of scope under ORV-119 (review-3 S1). No code changes. Downstream review: none beyond this spec; ORV-119 already holds R3.
