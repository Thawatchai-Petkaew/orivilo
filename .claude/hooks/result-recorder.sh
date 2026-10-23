#!/usr/bin/env bash
# SubagentStop wrapper for result-recorder (ORV-81, Hooks and AC 63). Exit 2 sends a subagent back to
# fix its report; if the recorder fails while stop_hook_active is true, the subagent stops (exit 0) and
# nothing is recorded, so a crashing recorder can never loop a subagent. Every other failure exits 2.
input=$(cat)
if printf '%s' "$input" | node "$CLAUDE_PROJECT_DIR/.claude/hooks/result-recorder.mjs"; then
  exit 0
fi
if printf '%s' "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi
exit 2
