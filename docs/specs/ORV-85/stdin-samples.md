# ORV-85 slice A2: recorded hook stdin samples

Evidence for spec ORV-81 v1.3 ("Main session or subagent" bullet, AC 69 to 73). Nothing here is guessed: every value comes from a recorded run.

## How it was recorded

- Installed Claude Code: **2.1.282** (`claude --version`). The dispatching session reported 2.1.308, but the `claude` binary on PATH in this shell is 2.1.282. Samples are from 2.1.282. Re-record if the guards must target 2.1.308.
- Scratch project outside the repo, with its own `.claude/settings.json` registering a recorder script (appends stdin to a file, exits 0) on PreToolUse, PostToolUse, SubagentStart, SubagentStop and UserPromptSubmit (no matcher, so all tools).
- Run 1: `claude -p 'Call the Agent tool exactly once with subagent_type general-purpose, description "probe", prompt "Run the Bash command: echo hi, then reply done". Then run Bash: echo main. Then stop.' --permission-mode bypassPermissions`
- Run 2: same shape, Agent call with `name "prober"`, `model "haiku"`, `run_in_background true`.
- Not exercised: `isolation` and `cwd` on the Agent call; an interactive typed prompt (headless only).
- Samples: `scripts/ovl/fixtures/hook-stdin/*.json`, one file per event and variant. Nothing was redacted: the files hold no tokens or emails, only local paths and ids.

## Common fields (every event)

`session_id`, `transcript_path`, `cwd`, `hook_event_name`, `prompt_id`, `scratchpad_dir`.

## Event by field

| Event (sample file)                                      | Fields present beyond common                                                                                                                                      | Absent                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| UserPromptSubmit (`UserPromptSubmit-headless`)           | `prompt`, `permission_mode`                                                                                                                                       | `source`, `agent_id`, `agent_type`, `effort`    |
| PreToolUse Agent (`PreToolUse-Agent`)                    | `tool_name`, `tool_input`, `tool_use_id`, `permission_mode`, `effort`                                                                                             | `agent_id`, `agent_type` (main session)         |
| PreToolUse Bash in subagent (`PreToolUse-Bash-subagent`) | `agent_id`, `agent_type`, `tool_name`, `tool_input`, `tool_use_id`, `permission_mode`, `effort`                                                                   | none missing                                    |
| PreToolUse Bash in main (`PreToolUse-Bash-main`)         | `tool_name`, `tool_input`, `tool_use_id`, `permission_mode`, `effort`                                                                                             | `agent_id`, `agent_type`                        |
| PostToolUse Agent (`PostToolUse-Agent`, `-background`)   | `tool_name`, `tool_input`, `tool_response`, `tool_use_id`, `duration_ms`, `permission_mode`, `effort`                                                             | `agent_id`, `agent_type`                        |
| SubagentStart (`SubagentStart`)                          | `agent_id`, `agent_type`                                                                                                                                          | `permission_mode`, `effort`, `tool_*`, `prompt` |
| SubagentStop (`SubagentStop`, `-background`)             | `agent_id`, `agent_type`, `stop_hook_active`, `agent_transcript_path`, `last_assistant_message`, `background_tasks`, `session_crons`, `permission_mode`, `effort` | none missing                                    |

## Fields the spec relies on

| Field                                                             | Status                      | Evidence                                                                                         |
| ----------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| `agent_id` on tool events inside a subagent                       | confirmed                   | `PreToolUse-Bash-subagent`: `a9676f924989bd70c`                                                  |
| `agent_type` on tool events inside a subagent                     | confirmed                   | same file: `general-purpose`                                                                     |
| `agent_id`/`agent_type` absent in the main session                | confirmed                   | `PreToolUse-Bash-main`, `PreToolUse-Agent`, `PostToolUse-Agent`                                  |
| `agent_id` on SubagentStart (binding needs it)                    | confirmed                   | `SubagentStart`: `a9676f924989bd70c`, plus `agent_type`                                          |
| `agent_id` on SubagentStop                                        | confirmed                   | same id as SubagentStart and the PostToolUse `agentId`                                           |
| `stop_hook_active` on SubagentStop                                | confirmed                   | `false`, boolean                                                                                 |
| `agent_transcript_path`, `last_assistant_message` on SubagentStop | confirmed                   | both present                                                                                     |
| `tool_response.agentId` on PostToolUse Agent                      | confirmed                   | foreground and background; equals SubagentStart `agent_id` in both runs                          |
| `tool_response.agentType`                                         | confirmed (foreground only) | `general-purpose`; absent in the async-launched response                                         |
| `tool_input.run_in_background`                                    | confirmed                   | always present, `false` or `true`, even when the prompt did not set it                           |
| `tool_input.model`                                                | confirmed                   | present only when set (`haiku`); absent otherwise                                                |
| `tool_input.subagent_type`, `description`, `prompt`               | confirmed                   | present                                                                                          |
| `tool_input.name`                                                 | **absent**                  | passed `name "prober"`; the field did not reach hook input (the call was accepted, name dropped) |
| `tool_input.isolation`                                            | unconfirmed                 | not exercised                                                                                    |
| `tool_input.cwd`                                                  | unconfirmed                 | not exercised                                                                                    |
| `source` on UserPromptSubmit, headless                            | **absent**                  | no `source` field in the headless prompt or the task-notification prompt                         |
| `source` on UserPromptSubmit, interactive typed prompt            | **unconfirmed**             | cannot be recorded headless; NOT yet confirmed to be `"user"`                                    |

## Other facts the guards should know

- Event order in a foreground call: PreToolUse Agent, SubagentStart, subagent tool events, SubagentStop, PostToolUse Agent.
- Background call: SubagentStart fires before PostToolUse; PostToolUse `tool_response` is `{isAsync: true, status: "async_launched", agentId, ...}` with no `content`, and the report arrives later as a **UserPromptSubmit** whose `prompt` is a `<task-notification>` block (`UserPromptSubmit-task-notification`), with no `source`. A guard that treats every UserPromptSubmit as a typed user prompt would misread it.
- SubagentStop fires again when a background agent stops; the main session is then resumed through that notification.
- Foreground PostToolUse `tool_response` holds `status`, `agentId`, `agentType`, `content[]` (the report text), `resolvedModel`, `usage`.

## Decision

Because UserPromptSubmit carries no `source` here and a task notification arrives as a UserPromptSubmit too, a chat prompt cannot be proven to be the owner's typing. On 2026-10-23 the owner chose, in the question form, "กดเลือกในแบบฟอร์มเท่านั้น" (count only answers clicked in the question form). `owner-grant` now runs only on PostToolUse(`AskUserQuestion`), and nothing typed or pasted into chat grants a rework round. See spec ORV-81 v1.3 (`docs/specs/ORV-81/spec.md`: Hooks, `owner-grant`; AC 64, 72, 73, 78, 79; the v1.3 change-log line "Post-review owner decision") and ADR 0014, which amends ADR 0013 decisions 5 and 7. The `owner-grant` fixture is built from a real answered form, the `toolUseResult` of an `AskUserQuestion` call in a Claude Code 2.1.308 session transcript (excerpt at `docs/specs/ORV-85/askuserquestion-transcript-excerpt.json`), not from recorded hook stdin. A live PostToolUse(`AskUserQuestion`) hook delivery is still unconfirmed (Question-form sample, below).

## Question-form sample

Fixture: `scripts/ovl/fixtures/hook-stdin/PostToolUse-AskUserQuestion-from-transcript.json`. Excerpt it was built from: `docs/specs/ORV-85/askuserquestion-transcript-excerpt.json`.

- **Source.** The `toolUseResult` of the owner's answered AskUserQuestion form in this session's transcript (Claude Code 2.1.308, 2026-10-23). The excerpt holds only the owner's form choices; nothing secret. It is not a PostToolUse stdin captured live by a hook.
- **Real fields.** `tool_input.questions[]` (`question`, `header`, `options[]` with `label` and `description`, `multiSelect`), `tool_response.questions[]` (the same list echoed back) and `tool_response.answers`, an object keyed by the full question text whose value is the clicked option label. `tool_name` is `AskUserQuestion` and `hook_event_name` is `PostToolUse`.
- **Placeholders.** `session_id` (`placeholder-session-id`), `transcript_path` (`/placeholder/transcript.jsonl`), `prompt_id` (`placeholder-prompt-id`), `tool_use_id` (`placeholder-tool-use-id`), `cwd` (`/work/tree`) and `permission_mode`. The envelope around the transcript result was written by hand, so these ids carry no meaning; the tests rewrite `cwd` to a temp repo.
- **Key comparison.** The async Agent `toolUseResult` keys in the transcript equal the `tool_response` keys of `PostToolUse-Agent-background.json`, except `canContinueAgent`, which 2.1.308 added. That match is the evidence that a transcript tool result and a hook `tool_response` share a shape, and so that the fixture's `tool_response` (the transcript's `toolUseResult` for the form) is what `owner-grant` will read. A live PostToolUse(`AskUserQuestion`) hook delivery is still unconfirmed; `owner-grant` fails closed on any other shape.
