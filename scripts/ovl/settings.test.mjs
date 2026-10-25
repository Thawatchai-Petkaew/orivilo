// Row 50 (ORV-108): settings.json denies reading .env* files by the forms an agent uses. These are
// permission rules matched against the tool call text, a guard rail and not a boundary (L-0012).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const settings = JSON.parse(
  readFileSync(new URL("../../.claude/settings.json", import.meta.url), "utf8"),
);
const { allow = [], ask = [], deny = [] } = settings.permissions;

const READS = [
  "Read(./.env)",
  "Read(./.env.*)",
  "Read(./**/.env)",
  "Read(./**/.env.*)",
  "Read(./**/.env*)",
];
const COMMANDS = ["cat", "head", "tail", "less", "more", "grep", "source"];

test("row 50: deny keeps the four Read entries and adds the .env* glob", () => {
  for (const entry of READS) assert.ok(deny.includes(entry), `deny lacks ${entry}`);
});

test("row 50: deny names each reading command with a .env or .env.* file", () => {
  for (const command of COMMANDS) {
    for (const entry of [`Bash(${command} *.env)`, `Bash(${command} *.env.*)`]) {
      assert.ok(deny.includes(entry), `deny lacks ${entry}`);
    }
  }
});

test("row 50: no allow or ask entry names .env", () => {
  for (const entry of [...allow, ...ask]) assert.ok(!entry.includes(".env"), entry);
});

test("row 50: every deny entry is a Read or Bash rule with balanced parentheses", () => {
  for (const entry of deny) assert.match(entry, /^(Read|Bash)\([^()]+\)$/, entry);
});
