#!/usr/bin/env bash
# Blocks `git commit` from Claude Code until lint and typecheck pass.
# Claude Code passes the tool call as JSON on stdin. Fails closed (ORV-81): malformed input, a
# missing node or any error exits 2, never 0.
set -euo pipefail
trap 'echo "pre-commit-gate failed closed" >&2; exit 2' ERR

input=$(cat)
cmd=$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);if(j===null||typeof j!=="object"||Array.isArray(j))process.exit(1);process.stdout.write(j.tool_input?.command??"")})')

case "$cmd" in
  *"git commit"*)
    cd "$CLAUDE_PROJECT_DIR"
    if ! pnpm -s lint >&2 || ! pnpm -s typecheck >&2; then
      echo "BLOCK: lint or typecheck failed. Fix before committing." >&2
      exit 2
    fi
    ;;
esac
exit 0
