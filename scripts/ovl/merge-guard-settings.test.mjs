// Row 39 (ORV-95): merge-guard is registered once, in the PreToolUse Bash entry, and nowhere else.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const settings = JSON.parse(
  readFileSync(new URL("../../.claude/settings.json", import.meta.url), "utf8"),
);
const COMMAND = 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/merge-guard.mjs" || exit 2';

function registrations() {
  const found = [];
  for (const [event, entries] of Object.entries(settings.hooks)) {
    for (const entry of entries) {
      for (const hook of entry.hooks) {
        if (hook.command.includes("merge-guard"))
          found.push({ event, matcher: entry.matcher, hook });
      }
    }
  }
  return found;
}

test("row 39: merge-guard is registered once, on PreToolUse Bash, with the spec command", () => {
  const found = registrations();
  assert.equal(found.length, 1);
  assert.equal(found[0].event, "PreToolUse");
  assert.equal(found[0].matcher, "Bash");
  assert.equal(found[0].hook.type, "command");
  assert.equal(found[0].hook.command, COMMAND);
});

test("row 39: the existing PreToolUse Bash entry keeps its other hooks", () => {
  const bash = settings.hooks.PreToolUse.filter((entry) => entry.matcher === "Bash");
  assert.equal(bash.length, 1);
  const commands = bash[0].hooks.map((hook) => hook.command);
  assert.ok(commands.some((c) => c.includes("pre-commit-gate.sh")));
  assert.ok(commands.some((c) => c.includes("worktree-guard.mjs")));
  assert.ok(commands.some((c) => c.includes("write-guard.mjs")));
});
