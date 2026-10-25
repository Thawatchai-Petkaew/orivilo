#!/usr/bin/env node
// PostToolUse(AskUserQuestion): records the close of a stuck envelope the owner clicked in a question
// form (ORV-108 slice C, ADR 0014). Nothing typed in chat closes one. Exit 2 writes no record.
import { runHook } from "../../scripts/ovl/hook.mjs";
import { checkOwnerClose } from "../../scripts/ovl/owner-close.mjs";

runHook("owner-close", checkOwnerClose);
