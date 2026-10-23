import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTRACTS, compileAll, validate } from "./validate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "validate.mjs");

test("all four schemas compile under ajv strict: true", () => {
  assert.deepEqual([...CONTRACTS].sort(), [
    "envelope.v1",
    "implementer.v1",
    "qa.v1",
    "reviewer.v1",
  ]);
  assert.doesNotThrow(() => compileAll());
});

for (const contract of CONTRACTS) {
  const dir = join(here, "fixtures", contract);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "expect.json");
  test(`${contract} has a valid fixture and several invalid ones`, () => {
    assert.ok(files.some((f) => f.startsWith("valid-")));
    assert.ok(files.filter((f) => f.startsWith("invalid-")).length >= 3);
  });
  // expect.json maps each invalid fixture to the error it must produce:
  // {"<file>": {"path": "<instancePath>", "keyword": "<ajv keyword>", "params": {<subset of ajv params>}}}
  const expectFile = join(dir, "expect.json");
  const expected = existsSync(expectFile) ? JSON.parse(readFileSync(expectFile, "utf8")) : {};
  test(`${contract}: expect.json lists exactly the invalid fixtures`, () => {
    const invalid = files.filter((f) => f.startsWith("invalid-")).sort();
    assert.deepEqual(Object.keys(expected).sort(), invalid);
  });
  for (const file of files) {
    const expectOk = file.startsWith("valid-");
    test(`${contract}: ${file} is ${expectOk ? "accepted" : "rejected for its own rule"}`, () => {
      const value = JSON.parse(readFileSync(join(dir, file), "utf8"));
      const result = validate(contract, value);
      assert.equal(result.ok, expectOk, JSON.stringify(result.errors));
      if (expectOk) return;
      const want = expected[file];
      assert.ok(want, `no expectation for ${file}`);
      const hit = result.rawErrors.some(
        (e) =>
          e.instancePath === want.path &&
          e.keyword === want.keyword &&
          Object.entries(want.params ?? {}).every(
            ([k, v]) => JSON.stringify(e.params[k]) === JSON.stringify(v),
          ),
      );
      assert.ok(hit, `expected ${JSON.stringify(want)} in ${JSON.stringify(result.rawErrors)}`);
    });
  }
}

/** The spec's contract blocks: only ```json blocks that carry an ovl $id are parsed. */
function specSchemaBlocks(spec) {
  const marker = '"$id": "https://orivilo.dev/ovl/';
  return [...spec.matchAll(/```json\n([\s\S]*?)\n```/g)]
    .filter((m) => m[1].includes(marker))
    .map((m) => {
      const id = /"\$id": "([^"]+)"/.exec(m[1])?.[1] ?? "(unknown $id)";
      try {
        return JSON.parse(m[1]);
      } catch (error) {
        throw new Error(`spec block for ${id} is not valid JSON: ${error.message}`);
      }
    });
}

test("error strings name the field and the allowed values", () => {
  const fx = (c, f) => JSON.parse(readFileSync(join(here, "fixtures", c, f), "utf8"));
  const extra = validate("implementer.v1", fx("implementer.v1", "invalid-extra-field.json"));
  assert.ok(
    extra.errors.some((e) => e.includes("extra")),
    JSON.stringify(extra.errors),
  );
  const missing = validate("implementer.v1", fx("implementer.v1", "invalid-missing-result.json"));
  assert.ok(missing.errors.some((e) => e.includes("result")));
  const en = validate("implementer.v1", fx("implementer.v1", "invalid-result-enum.json"));
  assert.ok(en.errors.some((e) => e.includes("done") && e.includes("blocked")));
  const pat = validate("reviewer.v1", fx("reviewer.v1", "invalid-short-head-sha.json"));
  assert.ok(pat.errors.some((e) => e.includes("^[0-9a-f]{40}$")));
  const blocked = validate(
    "implementer.v1",
    fx("implementer.v1", "invalid-done-without-verified.json"),
  );
  assert.ok(blocked.errors.every((e) => !/must match "(then|else)" schema/.test(e)));
  assert.ok(Array.isArray(extra.rawErrors) && extra.rawErrors.length > 0);
});

test("a dropped then/else wrapper keeps its condition, and the selecting field comes first", () => {
  const fx = (c, f) => JSON.parse(readFileSync(join(here, "fixtures", c, f), "utf8"));
  const en = validate("implementer.v1", fx("implementer.v1", "invalid-result-enum.json"));
  assert.match(en.errors[0], /^\/result must be equal to one of the allowed values/);
  assert.ok(
    en.errors.some(
      (e) => e.startsWith("/blocked_on") && e.includes('(because result is not "done")'),
    ),
    JSON.stringify(en.errors),
  );
  const noReason = validate(
    "implementer.v1",
    fx("implementer.v1", "invalid-blocked-without-reason.json"),
  );
  assert.ok(
    noReason.errors.some(
      (e) => e.startsWith("/blocked_on") && e.includes('(because result is not "done")'),
    ),
    JSON.stringify(noReason.errors),
  );
  const doneBlocked = validate(
    "implementer.v1",
    fx("implementer.v1", "invalid-done-with-blocked-on.json"),
  );
  assert.ok(
    doneBlocked.errors.some((e) => e.includes('(because result is "done")')),
    JSON.stringify(doneBlocked.errors),
  );
});

test("each schema file equals its json block in the spec", () => {
  const spec = readFileSync(join(here, "..", "..", "docs", "specs", "ORV-81", "spec.md"), "utf8");
  const blocks = specSchemaBlocks(spec);
  assert.equal(blocks.length, CONTRACTS.length);
  for (const name of CONTRACTS) {
    const block = blocks.find((b) => b.$id === `https://orivilo.dev/ovl/${name}`);
    assert.ok(block, `no spec block for ${name}`);
    const file = JSON.parse(readFileSync(join(here, "schemas", `${name}.json`), "utf8"));
    assert.deepEqual(file, block, `${name} drifted from the spec`);
  }
});

test("a malformed schema block in the spec fails by name; other json blocks are ignored", () => {
  const good = '{ "$id": "https://orivilo.dev/ovl/envelope.v1" }';
  const sample = (extra) => "```json\n" + good + "\n```\n\n" + extra;
  assert.equal(specSchemaBlocks(sample("```json\nnot json at all\n```")).length, 1);
  assert.throws(
    () => specSchemaBlocks(sample('```json\n{ "$id": "https://orivilo.dev/ovl/qa.v1", \n```')),
    /spec block for https:\/\/orivilo\.dev\/ovl\/qa\.v1 is not valid JSON/,
  );
});

test("an unknown contract is a usage error", () => {
  assert.throws(() => validate("nope.v1", {}), /unknown contract/);
});

test("CLI exit codes: 0 valid, 1 invalid, 2 usage or unreadable", () => {
  const run = (...args) => spawnSync("node", [cli, ...args], { encoding: "utf8" });
  const fx = (c, f) => join(here, "fixtures", c, f);
  assert.equal(run("envelope.v1", fx("envelope.v1", "valid-full.json")).status, 0);
  const bad = run("envelope.v1", fx("envelope.v1", "invalid-blank-checked-by.json"));
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /checked_by/);
  const extra = run("implementer.v1", fx("implementer.v1", "invalid-extra-field.json"));
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /additionalProperty: extra/);
  assert.equal(run().status, 2);
  assert.equal(run("nope.v1", "x").status, 2);
  assert.equal(run("envelope.v1", join(here, "fixtures", "missing.json")).status, 2);
  assert.equal(run("envelope.v1", join(here, "validate.mjs")).status, 2);
});

test("CLI run through a symlink still runs main", () => {
  const link = join(mkdtempSync(join(tmpdir(), "ovl-")), "v.mjs");
  symlinkSync(cli, link);
  const res = spawnSync("node", [link], { encoding: "utf8" });
  assert.equal(res.status, 2);
});
