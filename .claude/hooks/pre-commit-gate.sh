#!/usr/bin/env bash
# Blocks `git commit` from Claude Code until lint and typecheck pass.
# Claude Code passes the tool call as JSON on stdin.
set -euo pipefail

cmd=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

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
