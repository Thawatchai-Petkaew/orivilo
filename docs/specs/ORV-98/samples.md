# ORV-98 task 1: recorded Atlassian MCP hook stdin and gh pr list samples

Evidence for spec ORV-98 v1.0, row 1 and open question 5. Values come from recorded runs unless a note says derived.

## How it was recorded

- Installed Claude Code: **2.1.282** (`claude --version`). Installed GitHub CLI: **gh 2.95.0** (2026-06-17).
- Scratch project outside the repo, with a recorder hook (`--settings` file) on PreToolUse, matcher `.*`. The recorder appends stdin to a file and exits 2 only for a `tool_name` that ends `__transitionJiraIssue`, `__executeWrite` or `__executeDestructive`. A first recorder blocked every `mcp__` tool; it was narrowed so `discover` and `executeRead` could run.
- `claude -p '<prompt>' --settings <hooks.json> --permission-mode bypassPermissions --output-format json`. The prompt asked the session to load the tools with `ToolSearch` and call each once on `ORV-0` with id `4`. All three calls were blocked by the recorder (exit 2). **No Jira issue changed status.** `ORV-0` does not exist.
- Read-only calls made: `discover`, `executeRead` with `listJiraIssueTransitions`, `getJiraIssue`.

## Servers reached

| Server                                                              | Reached by headless `claude -p`                                                                                                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| claude.ai connector (`mcp_server.name` `claude.ai Atlassian MCP`)   | Yes. Its tools load, and `executeRead` returned data                                                                                                             |
| `.mcp.json` server `atlassian` (`https://mcp.atlassian.com/v1/mcp`) | **Not reachable**: no `mcp__atlassian__*` tool exists in the headless session because the server needs authorization. Its `tool_name` prefix is **not recorded** |

## Fixtures

| File                                                                      | Source                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-transitionJiraIssue.json` | **Recorded**. Primary tool call                                                                                           |
| `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeWrite.json`        | **Recorded** stdin of a call the session made with `name` `transitionJiraIssue`. See "executeWrite is derived in meaning" |
| `scripts/ovl/fixtures/hook-stdin/PreToolUse-mcp-executeDestructive.json`  | Same as `executeWrite`                                                                                                    |
| `scripts/ovl/fixtures/gh/pr-list.json`                                    | **Recorded** `gh pr list` output, re-indented by `python3 json.dumps(indent=2)`, no value edited                          |

Edits to the hook fixtures: `cwd`, `transcript_path` and `scratchpad_dir` were shortened to a tidy scratch path (`/private/tmp/orv98-scratch`) because the real ones name this worktree's scratchpad. No token or email was in the stdin. Every other field is as recorded.

## `tool_name` values

- Claude.ai connector: `mcp__claude_ai_Atlassian_MCP__transitionJiraIssue`, `mcp__claude_ai_Atlassian_MCP__executeWrite`, `mcp__claude_ai_Atlassian_MCP__executeDestructive` (recorded).
- `.mcp.json` server `atlassian`: expected `mcp__atlassian__<tool>` by Claude Code's naming rule, **not recorded**.
- The spec matcher `^mcp__.*[Aa]tlassian.*__(transitionJiraIssue|executeWrite|executeDestructive)$` matches all three recorded names (`claude_ai_Atlassian_MCP` holds `Atlassian`). It would match `mcp__atlassian__transitionJiraIssue` only through `[Aa]tlassian`, which holds.

## Fields

Common fields, as in `PreToolUse-SendMessage.json`: `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `prompt_id`, `permission_mode`, `effort`, `hook_event_name`, `tool_name`, `tool_input`, `tool_use_id`. New in an MCP call: `mcp_server` = `{name: "claude.ai Atlassian MCP", source: "claudeai"}`. `agent_id` is absent (main session).

`tool_input`:

| Tool                                 | Keys                                                                                  | Sample                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `transitionJiraIssue`                | `cloudId`, `issueIdOrKey`, then `transitionId` **or** `transitionName` (flat strings) | `{cloudId: "tpetkaew.atlassian.net", issueIdOrKey: "ORV-0", transitionId: "4"}`              |
| `executeWrite`, `executeDestructive` | `cloudId` (top level), `name`, `inputs`                                               | `{cloudId, name: "transitionJiraIssue", inputs: {issueIdOrKey: "ORV-0", transitionId: "4"}}` |

The full input schema of `transitionJiraIssue` (JSON Schema draft-07, `additionalProperties: false`, required `cloudId` and `issueIdOrKey`): `actionSource`, `assignToBacklog`, `boardId`, `cloudId`, `fields` (object), `historyMetadata`, `issueIdOrKey` (string, "Issue key like PROJ-123"), `sprintId`, `transitionId` (string), `transitionName` (string, "Name of the transition itself, not the target status"), `update` (object).

A fourth recorded call (not saved as a fixture): `transitionJiraIssue` with `{cloudId, issueIdOrKey: "ORV-0", transitionName: "G3 PR review"}`, the same shape with `transitionName` in place of `transitionId`.

## What differs from the spec (deviations for the spec revision, L-0011)

1. **There is no `transition.id`.** The spec reads `tool_input.transition.id` (and `tool_input.inputs.transition.id`). The real field is a flat string `tool_input.transitionId` (and `inputs.transitionId`). The session first tried `transition: {id}` and the tool refused it by schema, so it sent `transitionId`.
2. **`transitionName` moves an issue with no id.** `transitionName` is a second way to name the move. A guard that reads only `transitionId` lets `transitionName: "G3 PR review"` pass. Note the name of a transition differs from its target status for ids 11, 21 and 31 (below).
3. **`transitionJiraIssue` is a primary tool only.** `discover` lists it under `primaryTools` with `availableAsPrimaryTool: true` and no `inputs` or execute tool. No execute-tier route for a transition is advertised, so `executeWrite` and `executeDestructive` with `name` `transitionJiraIssue` may be refused by the server. They are still in the matcher; the fixtures are what the model sent to the hook.
4. **`executeWrite` is derived in meaning.** The hook stdin is recorded, but the `inputs` shape (`transitionId` flat) is the model's choice from the primary tool schema, not confirmed by a server schema. `cloudId` sits at top level, not inside `inputs`, as the connector's instructions say.
5. **The `atlassian` server tools are not recorded** (not authorized in headless mode).

## Transition ids, open question 5

`listJiraIssueTransitions` (via `executeRead`, read only) on three issues in three statuses: ORV-98 (Build), ORV-97 (Backlog), ORV-93 (G3 PR review). All three returned the same 12 transitions, each `isAvailable: true`, `hasScreen: false`. The workflow allows a move to any status from any status, the current one included. So the ids are global, and open question 5 default (a) holds.

<!-- prettier-ignore -->
| id | name | to.name |
| --- | --- | --- |
| 2 | G2 review | G2 review |
| 3 | Build | Build |
| 4 | G3 PR review | G3 PR review |
| 5 | Staging | Staging |
| 6 | G4 review | G4 review |
| 7 | Release | Release |
| 8 | G5 review | G5 review |
| 9 | Done | Done |
| 10 | Design | Design |
| 11 | To Do | Backlog |
| 21 | In Progress | Discovery |
| 31 | In Review | G1 Scope review |

These match the twelve ids of the ORV-98 Jira copy. The name of ids 11, 21 and 31 differs from the target status, so `transitionName` `In Review` leads to G1 Scope review.

## `pr-list.json`

- Command: `gh pr list -R Thawatchai-Petkaew/orivilo --base develop --state all --search "ORV-93 in:title" --limit 100 --json number,state,title,headRefName,headRefOid,mergedAt`, exit 0. Issue: **ORV-93**, which holds several merged PRs.
- Output: an array of 3 objects, keys sorted by name: `headRefName`, `headRefOid`, `mergedAt`, `number`, `state`, `title`. Sorted newest first. Entries: #87 (`docs/ORV-93-improvement-and-docs`), #85 (`feature/ORV-93-write-guard`), #84 (`feature/ORV-93-qa-agent`), all `MERGED`, with an ISO `mergedAt` ending `Z` and a 40-hex `headRefOid`.
- **Not recorded**: an `OPEN` or `CLOSED` entry. The repo holds no open PR and no closed unmerged PR into `develop` at this time, so the `mergedAt` value of an unmerged PR is unknown. A test must not rely on it; the guard should read `state` first.
