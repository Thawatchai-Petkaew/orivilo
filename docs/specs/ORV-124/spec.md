---
issue: ORV-124 (https://tpetkaew.atlassian.net/browse/ORV-124)
lane: S
version: 1
---

# ORV-124: run the Vercel functions in sin1, next to the Supabase Singapore database

## Why

The database is Supabase in Singapore (ADR 0001), but `apps/web/vercel.json` declares no region, so Vercel runs the functions in its default, `iad1` (Washington, D.C.). Every query then crosses the Pacific and back. The ORV-122 row 21 staging probe showed the cost: 4 of 5 `POST /api/auth/sign-in/social` answered 503 after about 2.6 s, with `x-vercel-id` reading `sin1::iad1::...` (edge in Singapore, function in iad1). A sign-in limit that times out instead of counting cannot pass ORV-122's G4, and every page that reads the database pays the same round trip.

The fix is one line: declare `"regions": ["sin1"]` in `apps/web/vercel.json` so the functions run in Singapore beside the database.

## User story

As the owner, I open staging or run the ORV-122 probe, and the functions answer from Singapore beside the database, so sign-in limits count and pages load without a trans-Pacific round trip on every query.

## Acceptance criteria

| #   | Given                                                                    | When                                                                                            | Result                                                                                                                                                                                        | Data effect                                   | Verified by                                         |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| 1   | `apps/web/vercel.json` with no `regions` key                             | The change lands                                                                                | `vercel.json` declares `"regions": ["sin1"]` and every other key is unchanged. A test or check in `pnpm test` reads the file and fails if `regions` is anything other than exactly `["sin1"]` | None                                          | `pnpm test` at G3                                   |
| 2   | The change released to staging (`main`)                                  | Any staging page or API route is requested                                                      | The response's `x-vercel-id` names `sin1` as the function region (the segment before the request id), for example `sin1::sin1::<id>`, and no longer `iad1`                                    | None                                          | Staging check: `owner_verify` at G3, verified at G4 |
| 3   | The change released to staging, and the ORV-122 row 21 preconditions met | The ORV-122 row 21 probe runs its machine 1 part (4 forged posts, then 1 with no forged header) | Statuses read `200,200,200,429,429`, requests 4 and 5 carry body code `RATE_LIMITED`, and no request answers 503                                                                              | Rows in the staging `rate_limit_counter` only | Staging check: `owner_verify` at G3, verified at G4 |
| 4   | `docs/context/handoff.md` with no region recorded                        | The change lands                                                                                | The handoff names `sin1` as the function region, beside the Supabase Singapore database, and points to this spec                                                                              | None                                          | Read at G3                                          |

Rows 2 and 3 can only be checked on staging, after the release PR merges into `main`. The G3 packet lists them as `owner_verify`; the G4 packet records the `x-vercel-id` header and the probe's commands, statuses and body codes.

## Rules and bounds

- Touch only `apps/web/vercel.json`, the check that pins it, and `docs/context/handoff.md`. No code, dependency or other Vercel setting changes.
- One region only. No failover or multi-region setup.
- Row 3 covers the machine 1 part of ORV-122 row 21. The second-network request and the rest of row 21 stay with ORV-122's G4.

## Out of scope

- Moving the database or Supabase Storage.
- Edge runtime or middleware region choices.
- Performance budgets or latency targets beyond "no 503 on the probe".
- Production (`sin1` reaches production with the owner's tag, G5).

## Open questions

- Does the Vercel plan accept `sin1` from `vercel.json`, or does a project setting override it? Default: `vercel.json` wins over the dashboard default; if row 2 still shows `iad1` after release, the owner sets the region in the project's Functions settings and this spec gets a version bump.

## Decisions it depends on

ADR 0001 (production stack, Supabase Singapore), ADR 0012 (gates and Jira states), ADR 0016 (staging releases), spec ORV-122 row 21 (the staging probe).

## Changelog

- v1 (2026-10-26): first spec.
