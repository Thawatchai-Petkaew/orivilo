# Handoff: where the work stands

Read this first when you pick the work up in a new session or on another account. Update it before you stop, so the next session can start without asking. Last updated 2026-10-23, after ORV-79 (audit D.2 done).

The plan and its order live in `docs/plans/master-plan.md`; pages published in the Claude project thread are listed in `docs/context/artifacts.md`.

## How we work (the owner's standing decisions)

- **Flow:** review on local, story PRs merge into `develop` (parks work, deploys nothing), a release PR moves a batch from `develop` to staging (`main`), the owner signs G5: on staging during the POC, a `v*` tag for production after ORV-63. ADR 0011, statuses in ADR 0012, names in ADR 0010.
- **Who merges:** Claude merges a story PR into `develop` once the full gate and CI are green. A release PR into `main` opens when the owner says so, or when Claude proposes a finished batch (an epic or related stories) with its list and the owner agrees. The owner decides G1, G2 and G5; Claude passes G3 and G4 with evidence (ADR 0012). Never tag or deploy production.
- **Jira (ADR 0012):** each status means where the work is. Lane L and M issues pass Discovery, G1 (L), Design and G2 in Jira before Build. A merged PR moves to "G3 PR review"; its batch reaching `main` moves it to "Staging"; only the owner moves it to "Done" after G5.
- **Vercel:** the free plan (100 deploys a day, counted over the last 24 hours). Finish commits locally and push once per PR. Previews are off unless a commit says `[preview]`; `develop` never deploys; a release costs about 2 deploys. `scripts/vercel-ignore.sh` skips builds that change nothing they deploy.
- **Review without a deploy:** run Storybook locally, `pnpm --filter @orivilo/design-system storybook`, on http://localhost:6100.
- **Environments:** `development`, `preview`, `staging`, `production` (ADR 0010). The real staging and production split is ORV-63, parked until the POC ends. Until then orivilo.vercel.app is staging.
- **Base first:** base components get variant depth where a variant has a functional meaning, following the build order in `docs/specs/ORV-64/audit.md` section D.
- **Branches:** delete a branch, its local copy and its worktree once its PR is merged or closed; only `main` and `develop` live on (AGENTS.md).
- **Copy:** every UI string in Thai and English from the locale catalog; no middot and no em dash anywhere.
- **Progress doc:** the owner follows the work in the Claude Doc "ORIVILO ความคืบหน้าแผนหลัก" (https://claude.ai/artifact/WiTsC13it9yESkFiRU7wL7). Update it after every story and every release batch: status counts from Jira, the core component plan table, and the owner's checklist. Jira and `master-plan.md` stay the sources; the doc is their view.
- **Secrets:** environment variables only. Never commit `.env*`, never paste keys in chat.

## Done today

| Issue  | What                                                                          | PR  |
| ------ | ----------------------------------------------------------------------------- | --- |
| ORV-45 | Part 1: Toast, Progress, Tag                                                  | #51 |
| ORV-64 | Component parity and depth audit                                              | #52 |
| ORV-65 | Segmented ToggleGroup, centred Thai labels                                    | #53 |
| ORV-66 | Vercel Ignored Build Step, ADR 0010, test role race fix                       | #54 |
| ORV-67 | Button icons and link, InputGroup, PasswordInput                              | #55 |
| ORV-68 | Select option icons and groups, Badge dot and icon, vertical Tabs with counts | #56 |
| ORV-69 | `develop` parks merged work, staging moves in batches (ADR 0011)              | #57 |
| ORV-70 | Tooltip description line and align (in `develop`, not yet on staging)         | #58 |
| ORV-71 | Master plan and project artifact list in the repo (in `develop`)              | #59 |
| ORV-72 | Checkbox sm, Textarea sm and Thai grapheme counter (in `develop`)             | #60 |
| ORV-73 | Migrate runs from a path with spaces; local setup steps (in `develop`)        | #61 |
| ORV-74 | Stories press the platform Mod key; `pnpm test` runs on macOS (in `develop`)  | #62 |
| ORV-75 | Jira states by environment, ADR 0012 option A (in `develop`)                  | #63 |
| ORV-77 | RangeSlider on Radix `preserveThumbOrder` (in `develop`)                      | #64 |
| ORV-78 | DropdownMenu checkbox and radio items (in `develop`)                          | #65 |

## Next, in order

1. Release the batch in `develop` to staging when the owner says yes: ORV-70 to ORV-75, ORV-77, ORV-78 and ORV-79 once their PRs are merged. Audit D.2 is complete.
2. AI team Phase 3 (the AI Team Loop plan, https://claude.ai/artifact/G7gBVvVk5fgsxZPYWbw4XC): E0-4 quality-gate script with real exit codes, E0-1 Jira field check, then an orchestrated dispatch where tasks go out and come back as JSON with a verify step before anything counts as done. Jira Automation and GitHub secrets need the owner (see master-plan.md).
3. ORV-45 part 2, TaskBar, then part 3, CanvasChat (audit D.1 stories 1 to 8: Spinner, Skeleton, Collapsible, chat parts). When all parts are merged, move ORV-45 to "Staging".
4. Audit D.3: missing components by Studio need.
5. ORV-76: CanvasBoard, CanvasContextMenu and BlockLibrary stories flaky on macOS (pass in CI).
6. CI/CD plan (https://claude.ai/artifact/S49r4bs4x5cn7g33HbT7rx) steps 4 to 7: turbo cache and affected-only runs in CI, the flaky `BlockLibrary > Place By Keyboard` test, branch protection on `main` (the owner turns it on), ORV-63 after the POC.

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
- On macOS, 18 Storybook tests fail locally and pass in CI (ubuntu): canvas-board, command-menu, canvas-context-menu, dropdown-menu `Open`, inspector `Studio Layout`, node-group `Group And Ungroup`. The stories press `Control` for `Mod`, which is `Meta` on a Mac (`src/commands/index.ts`). Compare against `develop` before blaming a change; fixing the stories to press the platform key is a small chore not yet filed.
- Jira through the Atlassian MCP server in `.mcp.json`; sign in once per account. GitHub through `gh auth login` or the IDE.

## The full gate

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm contrast && pnpm test && pnpm build
```

Report its real output in the PR. Prove each new test can fail (break the behaviour, see it red, restore).
