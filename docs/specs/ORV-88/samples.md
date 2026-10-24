# ORV-88: recorded SendMessage hook stdin

Evidence for spec ORV-88 v1.0 (row 17, open questions 2 and 3). Nothing here is guessed: every value comes from a recorded run.

## How it was recorded

- Installed Claude Code: **2.1.282** (`claude --version`). The owner's session reports 2.1.308; re-record if the guard must target it.
- Scratch project `/private/tmp/orv88-scratch`, outside the repo, with its own `.claude/settings.json` registering a recorder script (appends stdin to a file) on PreToolUse (no matcher, so all tools) and SubagentStart.
- Run 1 (main session, recorder exits 0): `claude -p '<prompt>' --permission-mode bypassPermissions --output-format json`. The prompt asked the session to load `SendMessage` with ToolSearch if deferred, then call it once with `to "reviewer"`, `summary "probe"`, `message "probe message"`. The tool was deferred: the recorded calls are `ToolSearch` (`{query: "select:SendMessage", max_results: 1}`), then `SendMessage`. The call itself failed in the tool ("No agent named 'reviewer' is reachable"), after the hook had run.
- Run 2 (recorder exits 2 on `SendMessage`): the prompt asked the session to call the Agent tool (`general-purpose`), whose prompt told it to load `SendMessage` and call it once with `to a1b2c3d4e5f60718`. The subagent reported that a PreToolUse hook blocked the call with the recorder's stderr. So a PreToolUse exit 2 stops a `SendMessage`, in the main session path and inside a subagent.
- Not exercised: a `name` on the Agent call, an interactive session, a `SendMessage` to a live agent id.

## Fixtures

| File                                                                   | Source                                       |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| `scripts/ovl/fixtures/hook-stdin/PreToolUse-SendMessage.json`          | Run 1, recorded (main session)               |
| `scripts/ovl/fixtures/hook-stdin/PreToolUse-SendMessage-subagent.json` | Run 2, recorded (subagent `general-purpose`) |

Both are recorded, not derived. Nothing was redacted: the files hold no tokens or emails, only local paths and ids.

## Fields

| Field                                                                 | Main session sample | Subagent sample     |
| --------------------------------------------------------------------- | ------------------- | ------------------- |
| `session_id`, `transcript_path`, `cwd`, `prompt_id`, `scratchpad_dir` | present             | present             |
| `hook_event_name`                                                     | `PreToolUse`        | `PreToolUse`        |
| `tool_name`                                                           | `SendMessage`       | `SendMessage`       |
| `tool_use_id`                                                         | present             | present             |
| `permission_mode`, `effort`                                           | present             | present             |
| `agent_id`                                                            | absent              | `a6bf09283267f6209` |
| `agent_type`                                                          | absent              | `general-purpose`   |
| `tool_input`                                                          | see below           | see below           |

`tool_input` keys in both: `to`, `summary`, `message`, and three the model did not set: `type` (`"message"`), `recipient` (a copy of `to`), `content` (a copy of `message`). The guard reads `tool_name` and that `to` is a string, and nothing else from `tool_input`; it never echoes `to`, `recipient`, `message` or `content`.

## Agent tool input fields (open question 3)

PreToolUse Agent in 2.1.282, `tool_input` keys: `description`, `prompt`, `run_in_background`, `subagent_type` (plus `model` and `name` as ORV-85 recorded: `model` only when set, `name` dropped). No field resumes an agent. No follow-up issue is needed for this version.

## Answers to the spec's open questions

- Question 2: `SendMessage` exists in 2.1.282 as a deferred tool and fires PreToolUse with `tool_name` `SendMessage`. The doctor probe is possible after `ToolSearch select:SendMessage`. Not yet confirmed in the owner's 2.1.308 session (row 12 does that).
