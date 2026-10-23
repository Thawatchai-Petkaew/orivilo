#!/usr/bin/env node
// SubagentStart, SubagentStop, PostToolUse(Agent) and PostToolUse(Bash): binds each subagent to its
// envelope, checks and records its report, and records the gate run (ORV-81, Hooks). Exit 2 blocks.
import { runHook } from "../../scripts/ovl/hook.mjs";
import { checkRecorder } from "../../scripts/ovl/result-recorder.mjs";

runHook("result-recorder", checkRecorder);
