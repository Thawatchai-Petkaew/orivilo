# Handoff: where the work stands

Read this first when you pick the work up in a new session or on another account. Update it before you stop, so the next session can start without asking. Last updated 2026-10-23, after ORV-72.

The plan and its order live in `docs/context/master-plan.md`; pages published in the Claude project thread are listed in `docs/context/artifacts.md`.

## How we work (the owner's standing decisions)

- **Flow:** review on local, story PRs merge into `develop` (parks work, deploys nothing), a release PR moves a batch from `develop` to staging (`main`), the owner approves production (G5, a `v*` tag). ADR 0011, names in ADR 0010.
- **Who merges:** Claude merges a story PR into `develop` once the full gate and CI are green. A release PR into `main` opens when the owner says so, or when Claude proposes a finished batch (an epic or related stories) with its list and the owner agrees. Claude runs gates G1 to G4. Only the owner passes G5; never tag or deploy production.
- **Jira:** a story moves with the transition named "Staging" when its batch reaches `main`, never "Done".
- **Vercel:** the free plan (100 deploys a day, counted over the last 24 hours). Finish commits locally and push once per PR. Previews are off unless a commit says `[preview]`; `develop` never deploys; a release costs about 2 deploys. `scripts/vercel-ignore.sh` skips builds that change nothing they deploy.
- **Review without a deploy:** run Storybook locally, `pnpm --filter @orivilo/design-system storybook`, on http://localhost:6100.
- **Environments:** `development`, `preview`, `staging`, `production` (ADR 0010). The real staging and production split is ORV-63, parked until the POC ends. Until then orivilo.vercel.app is staging.
- **Base first:** base components get variant depth where a variant has a functional meaning, following the build order in `docs/specs/ORV-64/audit.md` section D.
- **Branches:** delete a branch, its local copy and its worktree once its PR is merged or closed; only `main` and `develop` live on (AGENTS.md).
- **Copy:** every UI string in Thai and English from the locale catalog; no middot and no em dash anywhere.
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
| ORV-72 | Checkbox sm, Textarea sm and Thai grapheme counter (in `develop`)             | PR  |
| ORV-71 | Master plan and artifact list in the repo                                     | #59 |

## Next, in order

1. Audit D.2 stories 16 and 17: Slider range, DropdownMenu checkbox and radio items (story 14 is ORV-70, story 15 is ORV-72). One story of about 400 lines each; spec in `docs/specs/<KEY>/spec.md` first. When both are in `develop`, propose the batch ORV-70 to story 17 as a release to staging.
2. ORV-45 part 2, TaskBar, then part 3, CanvasChat (audit D.1 stories 1 to 8: Spinner, Skeleton, Collapsible, chat parts). When all parts are merged, move ORV-45 to "Staging".
3. Audit D.3: missing components by Studio need.
4. CI/CD plan (https://claude.ai/artifact/S49r4bs4x5cn7g33HbT7rx) steps 4 to 7: turbo cache and affected-only runs in CI, the flaky `BlockLibrary > Place By Keyboard` test, branch protection on `main` (the owner turns it on), ORV-63 after the POC.

## Set up a machine

- Node and pnpm as in `package.json`, then `pnpm install`. If pnpm asks, approve the esbuild build script with `pnpm approve-builds`.
- Postgres 16 for the database tests. CI uses `postgres://postgres:postgres@localhost:5432/postgres`; set `TEST_DATABASE_URL` to your own and `REQUIRE_DB_TESTS=1` to make the tests fail instead of skip without it.
- `apps/web/.env.local` from `apps/web/.env.example` with real values, for `pnpm dev`.
- Playwright's Chromium for the Storybook tests (`pnpm exec playwright install chromium`).
- On macOS, 18 Storybook tests fail locally and pass in CI (ubuntu): canvas-board, command-menu, canvas-context-menu, dropdown-menu `Open`, inspector `Studio Layout`, node-group `Group And Ungroup`. The stories press `Control` for `Mod`, which is `Meta` on a Mac (`src/commands/index.ts`). Compare against `develop` before blaming a change; fixing the stories to press the platform key is a small chore not yet filed.
- Jira through the Atlassian MCP server in `.mcp.json`; sign in once per account. GitHub through `gh auth login` or the IDE.

## The full gate

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm contrast && pnpm test && pnpm build
```

Report its real output in the PR. Prove each new test can fail (break the behaviour, see it red, restore).
