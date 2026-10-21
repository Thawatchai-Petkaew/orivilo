@AGENTS.md

## Claude Code specifics

- Team roles live in `.claude/agents/`. The `lead` agent plans and dispatches; it never writes production code or approves a gate.
- Skills: `discover` (spec + gaps), `gate-packet` (raise a gate), `quality-gate` (run checks), `retro` (lessons after Done), `frontend-design` (anti-template critique), `webapp-testing` (browser evidence). Why these and not others: `docs/context/ai-team-skills.md`.
- Model policy: **analysis on Opus, execution on Sonnet.** Planning, specs, architecture, design, security and QA review run on `opus`. Implementation, fixes from review findings, and release mechanics run on `sonnet`. Change a model only in the agent file, with the reason in the commit.
- Jira is reached through the Atlassian MCP server in `.mcp.json`. Post gate packets as Jira comments; move status only through the workflow transitions.
- Run each issue in its own worktree (`claude --worktree`) so parallel work never shares a tree.
- Path-scoped rules in `.claude/rules/` load when you touch matching files; read them anyway before you start.
