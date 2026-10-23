#!/usr/bin/env node
// PreToolUse(Bash): blocks a subagent from removing a worktree (ORV-89). Exit 2 blocks.
import { runWorktreeGuard } from "../../scripts/ovl/worktree-guard.mjs";

runWorktreeGuard();
