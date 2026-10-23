#!/usr/bin/env node
// PreToolUse(Agent): blocks a dispatch without a valid envelope (ORV-81, Hooks). Exit 2 blocks.
import { runHook } from "../../scripts/ovl/hook.mjs";
import { checkEnvelope } from "../../scripts/ovl/envelope-guard.mjs";

runHook("envelope-guard", checkEnvelope);
