#!/usr/bin/env node
// PreToolUse(Atlassian transitionJiraIssue, executeWrite, executeDestructive): guards the move to
// "G3 PR review" (ORV-98). Exit 2 blocks.
import { g3Check } from "../../scripts/ovl/g3-check.mjs";
import { runHook } from "../../scripts/ovl/hook.mjs";

runHook("g3-check", g3Check());
