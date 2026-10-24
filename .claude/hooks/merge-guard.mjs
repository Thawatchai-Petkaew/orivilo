#!/usr/bin/env node
// PreToolUse(Bash): judges every merge and push in three stages (ORV-95). Exit 2 blocks.
// It does not use the shared runHook, which fails closed outside a repo; a push is judged anywhere.
import { runMergeGuard } from "../../scripts/ovl/merge-guard.mjs";

runMergeGuard();
