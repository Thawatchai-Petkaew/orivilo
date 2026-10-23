---
id: K-0008
topic: enforcement
claim: A hook that never runs looks the same as one that always passes; Allkons' hooks failed every call for about a month from a quoting bug, Camp Vibes' hooks read environment variables that do not exist, and a heartbeat log is what makes the difference visible.
source: "~/My Work/TechFlow/AI-First/allkons-marketplace/.claude/hooks/require-checked-by.py:15-20; ~/Claude/Projects/CAMPVIBE/.claude/hooks/palette-guard.sh:5-7 (CAM-691); ~/Claude/Projects/CAMPVIBE/.claude/hooks/npm-shared-node-modules-guard.sh:17-24 (CAM-690)"
retrieved: 2026-10-23
confidence: 0.85
applies_to: [ORV-81, ORV-82]
license: internal
---

## Evidence

Allkons, `require-checked-by.py`:

> Heartbeat: this gate was invoked 1355 times between 2026-07-20 and 2026-08-22 and
> failed all 1355 with exit 127, because `${CLAUDE_PROJECT_DIR}` was unquoted in
> settings.json and the project path contains a space. ... It now records every
> invocation to heartbeat.jsonl. If that file is not growing, this gate is not
> running, whatever it claims to enforce.

Camp Vibes, `palette-guard.sh`:

```sh
# CONTRACT (CAM-691): Claude Code does NOT set CLAUDE_TOOL_INPUT_* env vars [-]
# those never existed, so a hook that reads them exits 0 unconditionally and
# never actually runs.
```

## Why it matters for ORIVILO

Our repo path also contains a space (`My Work`). Any hook we add needs a quoted path, reads its input from stdin, and writes a heartbeat line, plus a test that it fires. Camp Vibes' CAM-690 follow-up found `$CLAUDE_PROJECT_DIR` absent inside a running hook script, so the hook failed open with exit 1 (only exit 2 blocks).
