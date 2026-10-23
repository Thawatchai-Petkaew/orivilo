#!/usr/bin/env node
// PostToolUse(AskUserQuestion): records a rework-round grant the owner clicked in a question form
// (ORV-81, ADR 0014). Nothing typed in chat grants a round. Exit 2 writes no record.
import { runHook } from "../../scripts/ovl/hook.mjs";
import { checkOwnerGrant } from "../../scripts/ovl/owner-grant.mjs";

runHook("owner-grant", checkOwnerGrant);
