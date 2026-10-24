#!/usr/bin/env node
// PreToolUse(SendMessage): blocks every SendMessage, so no subagent resumes without an envelope (ORV-88). Exit 2 blocks.
import { runResumeGuard } from "../../scripts/ovl/resume-guard.mjs";

runResumeGuard();
