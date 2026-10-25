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

// A Bash permission pattern: `*` matches any run of characters, the rest is literal, the whole command must match.
const matches = (pattern, command) => {
  const body = /^Bash\((.*)\)$/.exec(pattern)?.[1];
  if (body === undefined) return false;
  const regex = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${regex}$`).test(command);
};
const denied = (command) => deny.some((entry) => matches(entry, command));

test("row 50: deny reads of a dotenv path by each reading command, piped forms included", () => {
  for (const command of COMMANDS) {
    for (const path of [
      ".env",
      ".env.local",
      "./.env",
      "apps/web/.env.production",
      "/abs/dir/.env",
    ]) {
      assert.ok(denied(`${command} ${path}`), `${command} ${path} is not denied`);
      assert.ok(denied(`${command} -n KEY ${path}`), `${command} -n KEY ${path} is not denied`);
    }
  }
  assert.ok(denied("cat .env | head"), "cat .env | head");
  assert.ok(denied("grep KEY .env | cat"), "grep KEY .env | cat");
  assert.ok(denied("grep -rn KEY apps/web/.env.local | head -3"), "grep on a nested dotenv, piped");
});

test("row 50: a process.env read in a .ts file, or a command that only quotes it, is not denied", () => {
  for (const command of [
    "grep -n 'process.env.NODE_ENV' apps/web/proxy.ts",
    "grep -rn process.env.DATABASE_URL packages/db/src",
    "cat apps/web/proxy.ts | grep process.env.NODE_ENV",
    "head -5 apps/web/next.config.ts",
    "git grep -n 'process.env.X'",
  ]) {
    assert.equal(denied(command), false, command);
  }
});

test("row 50: no allow or ask entry names .env", () => {
  for (const entry of [...allow, ...ask]) assert.ok(!entry.includes(".env"), entry);
});

test("row 50: every deny entry is a Read or Bash rule with balanced parentheses", () => {
  for (const entry of deny) assert.match(entry, /^(Read|Bash)\([^()]+\)$/, entry);
});
