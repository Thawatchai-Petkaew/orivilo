# ORV-93 PR 2: recorded hook stdin samples for write-guard

Evidence for spec ORV-93 v1.1, row 33. Every value comes from a recorded run unless the file name ends in `-derived`.

## How it was recorded

- Installed Claude Code: **2.1.282** (`claude --version`), the same binary ORV-85 recorded on.
- Scratch project outside the repo (the session scratchpad), with its own `.claude/settings.json` registering a recorder script (appends stdin to a file, exits 0) on PreToolUse with no matcher, so every tool is recorded.
- Run 1: `claude -p` asked for one Write of `a.txt`, one Edit of `e.txt`, a MultiEdit if the session has one, a NotebookEdit of `nb.ipynb`, and one Agent call (`general-purpose`) whose prompt told the subagent to Write `sub.txt`. `--permission-mode bypassPermissions`.
- Run 2: `claude -p` asked for a Read of `nb.ipynb` and then one NotebookEdit (run 1's NotebookEdit failed inside the tool before any hook, because the notebook had not been read).
- Exit 2 check: the recorder was swapped for a hook that prints to stderr and exits 2, registered on `Write|Edit|NotebookEdit`. A Write, an Edit and a NotebookEdit were each attempted: each was reported blocked by the hook, and `b.txt` was not created, `e2.txt` kept its text and the notebook cell kept its source.
- Samples: `scripts/ovl/fixtures/hook-stdin/`. Nothing was redacted: the files hold no tokens or emails, only local paths and ids.

## Which write tools the installed version offers

| Tool         | Offered in 2.1.282                                    | Fixture                                                                                           |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Write        | yes                                                   | `PreToolUse-Write`                                                                                |
| Edit         | yes                                                   | `PreToolUse-Edit`                                                                                 |
| MultiEdit    | **no** ("I don't have a MultiEdit tool")              | `PreToolUse-MultiEdit-derived` (the Edit sample with `edits[]` in place of its three text fields) |
| NotebookEdit | yes (a deferred tool, loaded by ToolSearch on demand) | `PreToolUse-NotebookEdit`                                                                         |

MultiEdit stays in the matcher. Its fixture is derived: it keeps the recorded Edit envelope and `file_path`, and carries `edits: [{old_string, new_string}]`, the shape earlier Claude Code builds documented. It is marked `-derived` in the file name, as ORV-85 did for `PostToolUseFailure`.

## Fields present

Common to every event: `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `prompt_id`, `permission_mode`, `effort`, `hook_event_name` (`PreToolUse`), `tool_name`, `tool_input`, `tool_use_id`.

| Fixture                        | `tool_input` fields                                               | `agent_id`, `agent_type`                        |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------- |
| `PreToolUse-Write`             | `file_path` (absolute), `content`                                 | absent (main session)                           |
| `PreToolUse-Edit`              | `file_path` (absolute), `old_string`, `new_string`, `replace_all` | absent (main session)                           |
| `PreToolUse-NotebookEdit`      | `notebook_path` (absolute), `cell_id`, `new_source`               | absent (main session)                           |
| `PreToolUse-Write-subagent`    | `file_path` (absolute), `content`                                 | present: `a0c4526cf6f2dc10b`, `general-purpose` |
| `PreToolUse-MultiEdit-derived` | `file_path`, `edits[]`                                            | absent                                          |

- Paths in `tool_input` were absolute in every recorded call, even though the prompt gave a relative name; `cwd` is the project folder. The guard still resolves a relative path against `cwd`, because an older or newer build may send one.
- NotebookEdit names its path field `notebook_path`, not `file_path`. The guard reads each tool's own field and fails closed when it is missing.
- The Write inside the subagent carries `agent_id` and `agent_type`, as the Bash call did in the ORV-85 samples.
- NotebookEdit's `new_source` is the new cell text, so it is content, never echoed.
