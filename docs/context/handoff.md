# Handoff: where the work stands

Read this first when you pick the work up in a new session or on another account. Update it before you stop, so the next session can start without asking. Last updated 2026-10-24, after release PR #92 put the finished AI team loop (ORV-93, ORV-95, ORV-98, ORV-99) on staging.

The plan and its order live in `docs/plans/master-plan.md`; pages published in the Claude project thread are listed in `docs/context/artifacts.md`.

## How we work (the owner's standing decisions)

- **Flow:** review on local, story PRs merge into `develop` (parks work, deploys nothing), a release PR moves a batch from `develop` to staging (`main`), the owner signs G5: on staging during the POC, a `v*` tag for production after ORV-63. ADR 0011, statuses in ADR 0012, names in ADR 0010.
- **Who merges:** Claude merges a story PR into `develop` once the full gate and CI are green. Claude opens and merges the release PR into `main` (staging) on its own once every PR in the batch passed G3 and the checks are green, then tells the owner (ADR 0016). The owner decides G1, G2 and G5; Claude passes G3 and G4 with evidence (ADR 0012). Never tag or deploy production.
- **Jira (ADR 0012):** each status means where the work is. Lane L and M issues pass Discovery, G1 (L), Design and G2 in Jira before Build. A merged PR moves to "G3 PR review"; its batch reaching `main` moves it to "Staging"; only the owner moves it to "Done" after G5.
- **Vercel:** the free plan (100 deploys a day, counted over the last 24 hours). Finish commits locally and push once per PR. Previews are off unless a commit says `[preview]`; `develop` never deploys; a release costs about 2 deploys. `scripts/vercel-ignore.sh` skips builds that change nothing they deploy.
- **Function region (ORV-124):** the Vercel functions run in `sin1` (Singapore), set by `regions` in `apps/web/vercel.json` and pinned by `apps/web/vercel-region.test.ts`, beside the Supabase Singapore database (ADR 0001). Without it Vercel defaults to `iad1` and every query crosses the Pacific; the ORV-122 staging probe saw 503 after about 2.6 s. Spec: `docs/specs/ORV-124/spec.md`.
- **Review without a deploy:** run Storybook locally, `pnpm --filter @orivilo/design-system storybook`, on http://localhost:6100.
- **Environments:** `development`, `preview`, `staging`, `production` (ADR 0010). The real staging and production split is ORV-63, parked until the POC ends. Until then orivilo.vercel.app is staging.
- **Base first:** base components get variant depth where a variant has a functional meaning, following the build order in `docs/specs/ORV-64/audit.md` section D.
- **Branches:** delete a branch, its local copy and its worktree once its PR is merged or closed; only `main` and `develop` live on (AGENTS.md).
- **Copy:** every UI string in Thai and English from the locale catalog; no middot and no em dash anywhere.
- **Progress doc:** the owner follows the work in the Claude Doc "ORIVILO ความคืบหน้าแผนหลัก" (https://claude.ai/artifact/WiTsC13it9yESkFiRU7wL7). Update it after every story and every release batch: status counts from Jira, the core component plan table, and the owner's checklist. Jira and `master-plan.md` stay the sources; the doc is their view.
- **Secrets:** environment variables only. Never commit `.env*`, never paste keys in chat.

## Done recently

Every row is on staging: release PRs #67, #82 (the owner's go in ORV-88 comment 10084) and #92 (merged into `main` as fcad4c8, ORV-99 comment 10123) moved them to `main`, and Jira shows them in "Staging" until the owner signs G5. Nothing waits in `develop`.

| Issue  | What                                                                          | PR  |
| ------ | ----------------------------------------------------------------------------- | --- |
| ORV-45 | Part 1: Toast, Progress, Tag                                                  | #51 |
| ORV-64 | Component parity and depth audit                                              | #52 |
| ORV-65 | Segmented ToggleGroup, centred Thai labels                                    | #53 |
| ORV-66 | Vercel Ignored Build Step, ADR 0010, test role race fix                       | #54 |
| ORV-67 | Button icons and link, InputGroup, PasswordInput                              | #55 |
| ORV-68 | Select option icons and groups, Badge dot and icon, vertical Tabs with counts | #56 |
| ORV-69 | `develop` parks merged work, staging moves in batches (ADR 0011)              | #57 |
| ORV-70 | Tooltip description line and align                                            | #58 |
| ORV-71 | Master plan and project artifact list in the repo                             | #59 |
| ORV-72 | Checkbox sm, Textarea sm and Thai grapheme counter                            | #60 |
| ORV-73 | Migrate runs from a path with spaces; local setup steps                       | #61 |
| ORV-74 | Stories press the platform Mod key; `pnpm test` runs on macOS                 | #62 |
| ORV-75 | Jira states by environment, ADR 0012 option A                                 | #63 |
| ORV-77 | RangeSlider on Radix `preserveThumbOrder`                                     | #64 |
| ORV-78 | DropdownMenu checkbox and radio items                                         | #65 |
| ORV-82 | Knowledge, lessons and plans folders with a checker                           | #68 |
| ORV-81 | /ovl slice A1: contract schemas and validator                                 | #71 |
| ORV-85 | /ovl slice A2: envelope-guard, owner-grant, doctor, minimal skill             | #72 |
| ORV-86 | /ovl slice A3: result-recorder, gate record, close-envelope                   | #73 |
| ORV-87 | Run metrics: spec and collector, slice 1                                      | #74 |
| ORV-89 | Background runs recorded at SubagentStop, shared run records                  | #75 |
| ORV-90 | worktree-guard heartbeat only into this project                               | #76 |
| ORV-87 | Run metrics: report and session commands, slice 2                             | #77 |
| ORV-91 | Improvement loop, lessons with Expected saving, metrics due                   | #78 |
| ORV-92 | zod 4.6.5 to 4.6.6, GHSA-mrhx-c7xc-m3w5                                       | #79 |
| ORV-91 | First improvement run, L-0008 re-check rule, plan update                      | #80 |
| ORV-88 | resume-guard blocks every SendMessage; re-checks are fresh                    | #81 |
| ORV-88 | Improvement run, handoff and master plan after release #82                    | #83 |
| ORV-93 | qa agent; screenshots resolve in the main checkout records                    | #84 |
| ORV-93 | write-guard, doctor probe, metrics session --out                              | #85 |
| ORV-76 | Stable macOS canvas stories; L-0009 affected-test rule                        | #86 |
| ORV-93 | Improvement run L-0010, L-0011, downstream specs, handoff and plan            | #87 |
| ORV-95 | Slice C1: `merge-guard` blocks a merge without its records                    | #88 |
| ORV-98 | Slice C2: `g3-check` guards the move to G3 PR review                          | #89 |
| ORV-95 | L-0012 guard frame first, L-0013 one revision per reviewed head               | #90 |
| ORV-99 | Slice D: the AC walk moves to qa; the full `ovl` skill                        | #91 |
| ORV-99 | Release: `develop` into `main` as fcad4c8, batch on staging                   | #92 |

`main`'s CI run after release #67 failed at the zod audit; ORV-92 fixed it, and `main`'s CI after release #82 is green.

## The AI team loop (ORV-81, ORV-87)

The loop is complete and on staging: slices A1 to A3, B (ORV-93), C1 (ORV-95), C2 (ORV-98) and D (ORV-99). Hooks check every Agent call in this repo (envelope-guard, result-recorder, owner-grant, worktree-guard), resume-guard blocks every SendMessage (ORV-88), and write-guard blocks the main session from writing deliverables, guard files and records (ORV-93); start a run with the `ovl` skill and `node scripts/ovl/doctor.mjs plan`. `pnpm quality-gate` in the main session writes a gate record, and the qa agent walks every AC with the full gate (slice D moved the AC walk to qa).

Two guard rails read the records before work moves on. `merge-guard` (ORV-95) blocks a merge or a push into `develop` or `main` without a qa approve, a reviewer approve, a passing gate and green checks for the head. `g3-check` (ORV-98) blocks a Jira move to "G3 PR review" until the PR is merged into `develop` and its records hold. Both are guard rails for agents that follow the rules, not a boundary against a session that sets out to defeat them (L-0012); their Honest limits are in `docs/specs/ORV-95/spec.md` and `docs/specs/ORV-98/spec.md`.

- **ORV-97, owner only:** GitHub rulesets on `develop` and `main` are the planned server-side boundary. On this private repo on the free plan they return HTTP 403 (ORV-97 comment 10110); the owner chooses GitHub Pro or a public repo. Even then they hold only against a session credential that cannot administer the repo, with no bypass actor that matches it.
- **Follow-ups:** ORV-94 (the `merge-guard` hook-timeout gap, the stories file path in row 24's stderr, the 300-character cut case in row 35) and ORV-96 (a Bash call that writes a record without naming `.orivilo` in its text).

Metrics: `node scripts/ovl/metrics.mjs collect|report|session|due` (spec `docs/specs/ORV-87/spec.md`); the `ovl` skill step 5 runs the improvement loop after each merge.

The first improvement run (2026-10-24, ORV-91) produced `docs/lessons/L-0008-recheck-costs-like-a-first-review.md`: a reviewer re-check starts from the previous findings and the rework diff. The owner approved it (ORV-91 comment 10081); it is applied to the `ovl` skill and the reviewer agent and is checked after 2026-11-07. The run also showed the orchestrator main session at 388,875,503 tokens in session 0baff5a3, about 4.3 times all its subagents together. Later runs promoted L-0009 (verify a fix with the affected tests, then the full suite once; ORV-76), L-0010 (one deliverable per builder task), L-0011 (spec revision before the fix; both ORV-93), L-0012 (state a guard's frame before its review) and L-0013 (one spec revision per reviewed head; both ORV-95). All six are checked after 2026-11-07.

## Next, in order

1. **ORV-45 part 2:** the TaskBar (E4-5), the product work again.
2. Story fixes: ORV-83, ORV-84.
3. Guard follow-ups: ORV-94, then ORV-96.
4. On or after 2026-11-07: `node scripts/ovl/metrics.mjs due` and measure L-0008 to L-0013.
5. Then the rest of `docs/plans/master-plan.md` "Order from here": ORV-45 part 3, audit D.3, and the CI/CD plan (https://claude.ai/artifact/S49r4bs4x5cn7g33HbT7rx) steps 4 to 7.
6. Waiting on the owner: G5 for what is on staging, and the ORV-97 choice.

## Set up a machine

- Node and pnpm as in `package.json`, then `pnpm install`. If pnpm asks, approve the esbuild build script with `pnpm approve-builds`.
- Postgres 16 for the database tests. CI uses `postgres://postgres:postgres@localhost:5432/postgres`; set `TEST_DATABASE_URL` to your own and `REQUIRE_DB_TESTS=1` to make the tests fail instead of skip without it.
- `apps/web/.env.local` from `apps/web/.env.example` with real values, for `pnpm dev`. `vercel env pull` leaves secrets empty (`""`); fill them by hand. Development uses local Postgres (ADR 0010), never the staging database:
  - `createdb orivilo_dev`, then `MIGRATION_DATABASE_URL=postgres://<you>@localhost:5432/orivilo_dev pnpm --filter @orivilo/db migrate` (prints "migrations applied").
  - `psql -d orivilo_dev -c "alter role orivilo_app login password 'orivilo_app_test'"`: migrations create `orivilo_app` without a login; the database tests set this same password on every run, so a password of your own does not survive.
  - `DATABASE_URL=postgres://orivilo_app:orivilo_app_test@localhost:5432/orivilo_dev`.
  - `BETTER_AUTH_SECRET`: a new one per machine (`openssl rand -base64 32`), not staging's.
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: the staging OAuth client, with `http://localhost:3000` as a JavaScript origin and `http://localhost:3000/api/auth/callback/google` as a redirect URI. Production gets its own client (ORV-63).
  - `OPENROUTER_API_KEY`: the same key works locally; its spend joins staging's.
- Playwright's Chromium for the Storybook tests (`pnpm exec playwright install chromium`).
- On macOS the full Storybook suite passes since ORV-74 (stories press the platform Mod key) and ORV-76 (canvas stories wait for React Flow to measure and draw). If a story flakes, verify the fix the L-0009 way: `--repeats 4` on the affected file, then the full suite once.
- Jira through the Atlassian MCP server in `.mcp.json`; sign in once per account. GitHub through `gh auth login` or the IDE.

## The full gate

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm contrast && pnpm test && pnpm build
```

Report its real output in the PR. Prove each new test can fail (break the behaviour, see it red, restore).
