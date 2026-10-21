// Computes every text and UI contrast pair of the semantic layer under the neutral set and every
// profile, in both modes, and exits 1 when any pair is under its floor or any colour token is
// neither paired nor exempt (spec E0-5). Run: pnpm contrast (also a CI step). `--all` lists
// passing pairs too.
import { profiles } from "../src/profiles/index.ts";
import {
  checkContrast,
  semanticPairs,
  staleExemptions,
  unexplainedColours,
} from "../src/tokens/contrast-pairs.ts";
import { tokens } from "../src/tokens/index.ts";

const all = process.argv.includes("--all");
const sets = [
  { id: "neutral", set: tokens },
  ...profiles.map((p) => ({ id: p.id, set: p.tokens })),
];
const results = checkContrast(sets);
const failures = results.filter((r) => !r.pass);

const line = (r: (typeof results)[number]) =>
  `${r.pass ? "pass" : "FAIL"}  ${r.profile.padEnd(12)} ${r.mode.padEnd(5)} ${r.fg.padEnd(24)} on ${r.bg.padEnd(24)} ${String(r.ratio ?? "n/a").padStart(5)} / ${r.floor}  (${r.fgValue} on ${r.bgValue})`;

for (const r of all ? results : failures) console.log(line(r));

const problems: string[] = [];
for (const { id, set } of sets) {
  for (const path of unexplainedColours(set))
    problems.push(`${id}: ${path} is in no pair and not exempt`);
  for (const path of staleExemptions(set)) problems.push(`${id}: exemption for ${path} is stale`);
}
for (const p of problems) console.log(`FAIL  ${p}`);

const pairs = semanticPairs(tokens).length;
const lowest = results.reduce(
  (min, r) => (r.ratio !== null && r.ratio < min.ratio ? { ratio: r.ratio, r } : min),
  {
    ratio: Number.POSITIVE_INFINITY,
    r: results[0],
  },
);
console.log(
  `\n${pairs} pairs x ${sets.length} sets x 2 modes = ${results.length} checks, ${failures.length} under floor, ${problems.length} unexplained; lowest ${lowest.ratio} (${lowest.r?.fg} on ${lowest.r?.bg}, ${lowest.r?.profile} ${lowest.r?.mode})`,
);
if (failures.length > 0 || problems.length > 0) process.exit(1);
