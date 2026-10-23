#!/usr/bin/env node
// Validates a JSON value against one of the ovl contracts (scripts/ovl/schemas/*.json).
// Usage: node scripts/ovl/validate.mjs <contract> <file>
// Exit 0 when valid, 1 when invalid (errors on stderr), 2 on a usage error or unreadable input.

import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), "schemas");

export const CONTRACTS = ["envelope.v1", "implementer.v1", "reviewer.v1", "qa.v1"];

/** Compiles every contract under ajv strict mode. qa.v1 refers to reviewer.v1 by its $id. */
export function compileAll() {
  const ajv = new Ajv2020({ strict: true, allErrors: true, verbose: true });
  const validators = {};
  for (const name of CONTRACTS) {
    const schema = JSON.parse(readFileSync(join(schemaDir, `${name}.json`), "utf8"));
    ajv.addSchema(schema);
  }
  for (const name of CONTRACTS) {
    validators[name] = ajv.getSchema(`https://orivilo.dev/ovl/${name}`);
  }
  return validators;
}

let compiled;

const isBranchNoise = (e) =>
  e.keyword === "if" || /^must match "(then|else)" schema$/.test(e.message);

function describe(e) {
  const where = e.instancePath || "/";
  const p = e.params ?? {};
  const detail = [];
  if (p.additionalProperty !== undefined)
    detail.push(`additionalProperty: ${p.additionalProperty}`);
  if (p.missingProperty !== undefined) detail.push(`missingProperty: ${p.missingProperty}`);
  if (p.allowedValues !== undefined)
    detail.push(`allowedValues: ${JSON.stringify(p.allowedValues)}`);
  if (p.allowedValue !== undefined) detail.push(`allowedValue: ${JSON.stringify(p.allowedValue)}`);
  if (p.pattern !== undefined) detail.push(`pattern: ${p.pattern}`);
  return `${where} ${e.message}${detail.length ? ` (${detail.join(", ")})` : ""}`;
}

/**
 * For each failed then/else branch, the readable condition that made it apply, keyed by the branch's
 * schema path, plus the instance path of the field the condition selects on.
 */
function branchConditions(rawErrors) {
  const out = new Map();
  for (const e of rawErrors) {
    if (e.keyword !== "if") continue;
    const [field, rule] = Object.entries(e.parentSchema?.if?.properties ?? {})[0] ?? [];
    if (field === undefined || !("const" in rule)) continue;
    const prefix = e.schemaPath.slice(0, -"/if".length);
    const not = e.params.failingKeyword === "else" ? "not " : "";
    out.set(`${prefix}/${e.params.failingKeyword}/`, {
      text: `because ${field} is ${not}${JSON.stringify(rule.const)}`,
      selects: `${e.instancePath}/${field}`,
    });
  }
  return out;
}

/**
 * Returns {ok, errors, rawErrors} for `value` against the named contract. Throws on an unknown contract.
 * errors are readable strings. The generic if/then/else wrapper lines are dropped when a specific error
 * exists; each branch-only error names the condition that applied it and comes after any error on the
 * field that selects the branch.
 */
export function validate(contract, value) {
  if (!CONTRACTS.includes(contract)) throw new Error(`unknown contract: ${contract}`);
  compiled ??= compileAll();
  const check = compiled[contract];
  const ok = check(value) === true;
  const rawErrors = ok ? [] : [...(check.errors ?? [])];
  const specific = rawErrors.filter((e) => !isBranchNoise(e));
  const shown = specific.length > 0 ? specific : rawErrors;
  const conditions = branchConditions(rawErrors);
  const branchOf = (e) => [...conditions].find(([prefix]) => e.schemaPath.startsWith(prefix))?.[1];
  const selecting = new Set([...conditions.values()].map((c) => c.selects));
  const rank = (e) => (!branchOf(e) && selecting.has(e.instancePath) ? 0 : 1);
  const errors = shown
    .map((e, i) => ({ e, i }))
    .sort((x, y) => rank(x.e) - rank(y.e) || x.i - y.i)
    .map(({ e }) => {
      const branch = specific.length > 0 ? branchOf(e) : undefined;
      return branch ? `${describe(e)} (${branch.text})` : describe(e);
    });
  return { ok, errors, rawErrors };
}

function main(argv) {
  const [contract, file] = argv;
  if (!contract || !file || argv.length > 2 || !CONTRACTS.includes(contract)) {
    console.error(`usage: validate.mjs <${CONTRACTS.join("|")}> <file>`);
    return 2;
  }
  let value;
  try {
    value = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`cannot read ${file} as JSON: ${error.message}`);
    return 2;
  }
  const { ok, errors } = validate(contract, value);
  if (!ok) console.error(errors.join("\n"));
  return ok ? 0 : 1;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(main(process.argv.slice(2)));
}
