#!/usr/bin/env node
// PreToolUse(Write, Edit, MultiEdit, NotebookEdit, Bash): keeps deliverables, guard files and records
// out of the wrong hands (ORV-93). Exit 2 blocks.
import { runWriteGuard } from "../../scripts/ovl/write-guard.mjs";

runWriteGuard();
