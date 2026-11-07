---
id: K-0089
topic: orchestration
claim: "On commit f2f5fa2 of chore/ORV-138-guard-batch, an honest qa walk can be refused, or left unrecorded, by the routes listed here in scripts/ovl/result-recorder.mjs, scripts/ovl/merge-check.mjs and scripts/ovl/schemas/qa.v1.json: the missing-spec and no-table routes already give the qa-spec-1 refusal on this head, the working-tree spec read is changed by spec-at-head-1, the every-row and approve-fail routes by qa-scope-1, the keyword-visual route by qa-scope-2; five points (own count), the envelope-binding route and four points inside kept routes, are named by no rule and no Honest limit of the ORV-138 spec; the other routes are kept or an Honest limit."
source: "scripts/ovl/result-recorder.mjs; scripts/ovl/merge-check.mjs; scripts/ovl/schemas/qa.v1.json; scripts/ovl/schemas/reviewer.v1.json (lines 27 to 51); scripts/ovl/validate.mjs (line 17); scripts/ovl/hook.mjs (lines 78 to 101); .claude/hooks/result-recorder.mjs; docs/specs/ORV-138/spec.md; docs/specs/ORV-134/spec.md (line 64); all read at commit f2f5fa2419c0ef8ca9693ac69d3f6518e3d9634f (branch chore/ORV-138-guard-batch); commits 81e95d5bef314824b03297af45538a070884bea9, 97bab4feabda15a80b1695c1f67bf00fffcaaed6 and 40ba745b0b6971c48d20f0b3675bd0308a028463 by their subjects in that branch's reflog"
retrieved: 2026-10-29
confidence: 0.8
applies_to: [ORV-138, ORV-136, ORV-120, ORV-104]
license: internal
---

## Evidence

Survey for `docs/specs/ORV-138/spec.md` acceptance row 12 (source ORV-136, L-0045). Confidence is 0.8: one source, this repo at one commit, read file by file and quoted; no code was run and no test was run for this entry. Where the entry says what code does when run, that is a reading of the lines quoted, not a measurement.

### The head read

- The branch ref `chore/ORV-138-guard-batch` points at `f2f5fa2419c0ef8ca9693ac69d3f6518e3d9634f`. The tree was clean at the session start (git status), so the working-tree files read are the files at that commit.
- The branch reflog gives four commits after the branch was created from `81e95d5`: `fix(ORV-94): builder grant wording names every tool write`, `fix(ORV-120): a qa report on an issue with no acceptance table gets a plain reason` (`97bab4f`), `fix(ORV-104): slice spec walk and DESIGN.md in the write_set union` (`40ba745`) and `fix(ORV-104): close a stuck read-only envelope whose report came back` (`f2f5fa2`). No commit subject names ORV-136, so this entry is written before the first ORV-136 code commit (row 12).
- The spec's seed list ("Refusal routes found by reading") gives line numbers read on `81e95d5`. Each route below gives the line on `f2f5fa2` and, where the seed lists it, the seed's line.

### Search patterns and hit counts

Each count is the number of matching lines the search tool returned for that pattern in that one file, at `f2f5fa2`.

- `scripts/ovl/result-recorder.mjs`, `out\.push\(`: 19 (lines 184 to 280).
- `scripts/ovl/result-recorder.mjs`, ``problems\.push\(|problems: \[|return \[`|return \[reason|return \[\.\.\.``: 12 (lines 93, 96, 250, 296, 304, 313, 315, 317, 329, 405, 413, 475).
- `scripts/ovl/result-recorder.mjs`, `throw` followed by one space: 6 (lines 44, 136, 378, 439, 449, 494).
- `scripts/ovl/result-recorder.mjs`, ``return `|return null|return false``: 9 (lines 52, 54, 57, 66, 71, 146, 157, 242, 244).
- `scripts/ovl/result-recorder.mjs`, `readFileSync\(|JSON\.parse\(|git\(root` (calls that throw without an explicit `throw`): 9 (lines 59, 69, 111, 130, 162, 215, 290, 446, 466).
- `scripts/ovl/merge-check.mjs`, `out\.push\(|return \[|throw` with one space after `throw`: 26 (lines 27 to 258).
- `scripts/ovl/schemas/qa.v1.json`, `"required"|"minItems"|"const"|"if"|"pattern"|"enum"|"additionalProperties": false|"minLength"|"minimum"|"contains"|"\$ref"`: 30 (lines 5 to 87).
- `scripts/ovl/hook.mjs`, `catch|exit|decision|error`: 12 (lines 2 to 113).
- `scripts/ovl/validate.mjs`, `contains|"if"|then|\$ref|minItems|const`: 35 (most are the word `const`; read for line 17 only).
- `docs/specs/ORV-138/spec.md`, a table row holding a keyword of `result-recorder.mjs` line 33 (case-insensitive, `^\| \d+ \|.*(layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position)`): 0.
- `docs/specs/ORV-134/spec.md`, `^\|\s*#\s*\||^\| 8 \|`: 4 (lines 64, 67, 87, 89; line 67, row 8 of the acceptance table, was returned as an omitted long line; 87 and 89 are row 8 of later tables).

The schema is run by Ajv in draft 2020-12 mode (`validate.mjs` line 17), so `if`, `then` and `contains` apply:

```js
const ajv = new Ajv2020({ strict: true, allErrors: true, verbose: true });
```

### What a refusal and a throw do (hook.mjs)

`scripts/ovl/hook.mjs` lines 87 to 99: the checkout the recorder reads is the git top of the hook input's `cwd`; returned reasons exit 2 with decision `block`; a throw exits 2 with decision `error` and "failed closed".

```js
root = gitTop(input.cwd);
store = recordsRoot(input.cwd);
const reasons = check(input, { root, store });
beat(store, hook, input, reasons.length > 0 ? "block" : "allow");
...
return { code: 2, stderr: `${hook} failed closed: ${error.message}` };
```

By reading `result-recorder.mjs` lines 410 to 414, only a returned refusal at PostToolUse closes the envelope as `no_report`; a throw inside `judge` leaves it open and records nothing (the stuck envelope that close-1 closes afterwards).

### Routes in scripts/ovl/result-recorder.mjs

- **R1, spec missing or unreadable.** Lines 108 to 114 and 249 to 250 (seed: line 106, a throw). `lines = readFileSync(join(root, "docs", "specs", issue, "spec.md"), "utf8").split("\n");` then `} catch {` and `return [];`; line 250: ``if (specRowList.length === 0) return [`no acceptance table in docs/specs/${env.issue}/spec.md`];``. Verdict: changed by **qa-spec-1**, already on this head (commit `97bab4f`); no throw remains on this route.
- **R2, no acceptance table.** Lines 115 to 117 (seed: lines 117 to 118, a throw). `const start = lines.findIndex((l) => /^\|\s*#\s*\|/.test(l));` and `for (const line of start < 0 ? [] : lines.slice(start + 2)) {`. A `#` table with no row whose first cell is all digits also gives an empty list and the same refusal. Verdict: changed by **qa-spec-1**, already on this head.
- **R3, the spec is read from the working tree.** Line 111 (quoted under R1) reads `root`, the git top of the hook input's `cwd` (`hook.mjs` line 87), not the commit `head_sha`. An honest walk of one head can be judged against another version of the spec. Verdict: changed by **spec-at-head-1**.
- **R4, which rows and which cell count.** Lines 118 to 123: `if (!line.startsWith("|")) break;` and `if (/^\d+$/.test(cells[0])) rows.push({ row: Number(cells[0]), result: cells[3] ?? "" });`. Only the first table whose header starts with `#` is read. The keyword rule (R8) reads the fourth cell whatever its header: in `docs/specs/ORV-134/spec.md` line 64 the fourth header is `User sees`; in `docs/specs/ORV-138/spec.md` line 46 it is `Check`. Verdict: the row choice is kept; the fixed fourth cell is named by no rule (N5).
- **R5, a repeated `ac` row.** Lines 252 to 254 (seed: 245 to 251). ``if (seen.has(ac.row)) out.push(`ac row ${ac.row} appears more than once`);``. Verdict: kept.
- **R6, an `ac` row not in the spec.** Lines 255 to 257 (seed: 245 to 251). ``out.push(`ac row ${ac.row} is not a row of the spec`);``. Verdict: kept; qa-scope-1 adds its own refusal for a row outside the PR's list.
- **R7, an entry for every spec row.** Lines 259 to 264 (seed: 252 to 257). ``out.push(`ac has no entry for spec row ${row}`);``. Verdict: changed by **qa-scope-1** (only the PR's listed rows when its line exists).
- **R8, the keyword list makes a row visual.** Line 33 and lines 265 to 267 (seed: 258 to 260). `const VISUAL = /layout|spacing|gap|align|centre|center|colou?r|overlap|motion|position/i;` and ``out.push(`ac row ${row} is visual by the spec's keyword list; visual cannot be false`);``. Verdict: changed by **qa-scope-2**. The schema half is S7.
- **R9, an approve with a `fail` row.** Lines 268 to 270 (seed: 261 to 263). ``out.push(`ac row ${row} is fail; an approve needs every row pass or owner_verify`);``. Verdict: kept, scoped by **qa-scope-1** ("an approve needs every listed row `pass` or `owner_verify`").
- **R10, `owner_verify` needs a screenshot.** Lines 271 to 273 (seed: 264 to 266). ``out.push(`ac row ${row} is owner_verify; its evidence needs a screenshot`);``. Verdict: kept.
- **R11, `ac` evidence.** Lines 274 to 277 with 238 to 245, 48 to 62 and 35 (seed: 267 to 270 with 232 to 239 and 48 to 62). ``return `screenshot ${path} is outside ${dir}`;``, ``return `screenshot ${path} does not exist; screenshots live in the main checkout's records (${store})`;``, the PNG signature test at line 59, and `const STYLE_REF = /^[a-z0-9-]+--[a-z0-9-]+ \S.* [a-z-]+$/;`. Verdict: kept.
- **R12, screenshot naming.** Lines 179 to 190 (seed: 173 to 184). ``out.push(`screenshot ${s.path} must be named ${dir}${s.story}-${s.mode}.png`);``. Verdict: kept.
- **R13, an approve needs the gate report.** Lines 192 to 213 with 128 to 138 (seed: 186 to 207 with 123 to 131). Refusals: `quality_gate.head_sha differs from head_sha: the evidence is stale` (195), a report for another sha (198 to 202), `.quality-gate/report.json is dirty` (204), `stepsSource` not `"gate"` (205 to 209), `ok: false` (210), `partial` (211 to 213). Line 130 throws on a missing or unparsable file, line 136 on a malformed one: `const r = JSON.parse(readFileSync(join(root, ".quality-gate", "report.json"), "utf8"));`. Verdict: the refusals are kept; the throw is N1 and the checkout it reads is N2.
- **R14, story screenshots on an approve.** Lines 215 to 234 with 161 to 171 (seed: 209 to 228 with 156). ``const files = git(root, ["diff", "--name-only", `origin/develop...${report.head_sha}`])`` and ``const source = git(root, ["show", `${head}:${file}`]);``; each changed `.stories.tsx` needs a light and a dark screenshot. `git` (lines 40 to 41) throws when the command fails, for example on a head or `origin/develop` the hook's checkout does not hold. Verdict: the refusal is kept; the throw is N1.
- **R15, the findings rules (shared with reviewer.v1).** Lines 87 to 102 with 78 to 84 (seed: 92 to 99). `problems.push("an approve with a kept Critical finding is invalid");` and `request_changes needs at least one kept Critical or Important finding with re-executable evidence`; a finding whose evidence cannot be re-run moves to `dropped`. By reading, a `fail` row alone does not satisfy a `request_changes`: the count at line 91 is over findings only. Verdict: kept.
- **R16, the report shape.** Lines 285 to 314 (seed: 294 to 307). Not one JSON object (294 to 300), a report valid under another owned contract (301 to 309), a schema error (310 to 311), another `task_id` (312 to 314). Verdict: kept.
- **R17, one send-back, then nothing recorded.** Lines 369 to 375 (seed: 362 to 368): `// A subagent sent back once cannot be sent back again: it stops, and nothing is recorded. A` and `if (background) writeClosed(store, task, "no_report");`. Verdict: kept (the one send-back of ORV-81).
- **R18, PostToolUse closes a refused report.** Lines 410 to 414 (seed: 403 to 407). `writeClosed(store, task, "no_report");` and ``return [...judged.problems, `${task.id} closed as no_report`];``. Verdict: kept.
- **R19, binding needs exactly one open envelope of the role (not in the seed).** Lines 325 to 330: ``return [`${open.length} open unbound ${agentType} envelopes; binding needs exactly one`];``. Two open unbound qa envelopes (for example two PRs of one issue walked at once) bind neither, and both reports then meet R20. Verdict: named by no rule (N3).
- **R20, no bound envelope, or a closed one (not in the seed).** Lines 339 to 344 with 357 and 404 to 405: ``if (!task) return { reason: `no envelope is bound to agent ${agentId}` };`` and ``return isOpen(task) ? { task } : { reason: `envelope ${task.id} is already closed` };``. Verdict: the closed case is an **Honest limit** (spec, Honest limits, ORV-104 close-1: "its later report is not recorded"); the unbound case follows R19.
- **R21, a blank final message (not in the seed).** Lines 43 to 45 with 362: ``if (!nonblank(input[name])) throw new Error(`hook input has no ${name} (${what})`);``. At SubagentStop this fails closed unless `stop_hook_active` (line 377). Verdict: kept (a blank message carries no report).
- **R22, a failed Agent call (not in the seed).** Lines 461 to 476 close a bound open envelope as `no_report`: ``return [`the Agent call for ${task.id} failed; ${task.id} closed as no_report`];``. No report reached the hook. Verdict: kept.

### Routes in scripts/ovl/schemas/qa.v1.json

- **S1.** Line 5, top level `"additionalProperties": false`: a report has no field to narrow its own scope (row 17). Kept.
- **S2.** Lines 6 to 16, the nine required fields. Kept.
- **S3.** Line 35, `"minItems": 1` under `ac` (seed: line 36; on this head line 36 is `"items": {`). Kept.
- **S4.** Line 39, `"required": ["row", "status", "visual", "evidence"]`: every entry states `visual`, also a row listed under qa-scope-2. Kept.
- **S5.** Line 46, `"minItems": 1` under `evidence` (seed: line 46). Kept.
- **S6.** Lines 47 and 81, `"$ref": "reviewer.v1#/$defs/evidence"` and `"$ref": "reviewer.v1#/$defs/finding"`: `reviewer.v1.json` lines 42 to 51 allow evidence kinds `"command", "screenshot", "computed_style", "code"`, need `kind` and `ref` (`"minLength": 1`), and forbid other fields. Kept.
- **S7.** Lines 50 to 61: `"if": { "properties": { "visual": { "const": true } } },` then `"contains"` with `"kind": { "enum": ["screenshot", "computed_style"] }`. Kept (qa-scope-2 keeps it for a listed row marked `visual: true`).
- **S8.** Lines 64 to 77, screenshot items: `story` pattern `^[a-z0-9-]+--[a-z0-9-]+$`, `mode` light or dark, `path` pattern `^\\.orivilo/runs/ORV-[0-9]+/`, `"looked_at": { "const": true }`, `note` `"minLength": 1`. Kept.
- **S9.** Lines 84 to 89, an approve needs `quality_gate.ok` `{ "const": true }` (seed: 84 to 89). Kept.
- **S10.** Line 28, `"report": { "const": ".quality-gate/report.json" }`. Kept.

### Routes in scripts/ovl/merge-check.mjs

- **M1, no qa.json.** Line 139 (seed: 134): ``if (q === undefined) return [`no qa.json for ${issue} on ${head}`];``. Kept.
- **M2, the latest qa.json of the issue.** Lines 135 to 138 pick the latest `qa.json` over every task of the issue by `recorded_at`; a bad time throws at line 27 and an unparsable file at line 46, and `runMergeCheck` turns a throw into `merge-check failed closed` (lines 283 to 285). Kept.
- **M3, a stale head.** Lines 141 to 145 (seed: 136 to 140): `` `the qa.json evidence is stale: the latest qa.json is for ${r.head_sha}, the head is ${head}`, ``. Kept; see N4.
- **M4, another PR.** Lines 147 to 148 (seed: 142 to 143): ``out.push(`the latest qa.json for ${issue} is for PR ${r.pr}, not PR ${n} (head ${head})`);``. Kept; see N4.
- **M5, not an approve.** Lines 149 to 150 (seed: 144 to 145). Kept.
- **M6, story screenshots.** Lines 151 to 168 (seed: 146 to 163); a stories file removed at the head is skipped (line 153). Kept.
- **M7, the gate record.** Lines 121 to 132 (seed: 116 to 127): ``if (forHead.length === 0) return [`no gate record has sha ${head}`];``, then `ok`, `dirty` and `steps_source`. Kept.
- **M8, the write_set union.** Lines 107 to 119 with 236 to 239 (seed: 107 to 114 with 231 to 234). Line 115 is `"DESIGN.md",`, so union-1 is already on this head (commit `40ba745`). Kept.
- Other refusals in `decide` are not about the qa walk and are listed only: head moved (209 to 212), base branch (213 to 214), branch and title key (216 to 222), checks (226, with 75 to 96), guard files and the owner approval (230 to 235), docs-only (241 to 246), reviewer approve (250).

### Named by no rule and no Honest limit of the spec (own count: 5)

- **N1.** R13 and R14 throw (lines 130, 136, 162, 215) instead of returning a qa.v1 problem. The hook fails closed with decision `error`; at PostToolUse the envelope stays open and nothing is recorded. qa-spec-1's "No state of the spec makes the recorder throw" covers the spec read only; close-1 closes the envelope afterwards but does not change the throw.
- **N2.** R13 reads `.quality-gate/report.json` from `root`, the git top of the hook input's `cwd`. spec-at-head-1 moves only the spec read to the head. Which checkout the PostToolUse input's `cwd` names is not shown in the files read (open point).
- **N3.** R19: two open unbound qa envelopes bind neither, so neither report is recorded.
- **N4.** M2 to M4: merge-check reads the latest `qa.json` of the whole issue. Under qa-scope-1 one issue can have several PRs; by reading, a later walk of PR B makes PR A's merge refuse as stale or as for PR B until A is walked again. Row 17 keeps these lines unchanged; no rule or Honest limit names this effect.
- **N5.** R4: the keyword rule reads the fourth cell of the table, whatever its header (`User sees` in ORV-134, `Check` in ORV-138). qa-scope-2 exempts listed rows but does not name the column.

### Line drift between the spec text and this head

- qa-scope-2 cites `result-recorder.mjs` "lines 33 and 258 to 260"; on `f2f5fa2` line 33 is the keyword list and the test is lines 265 to 267.
- Row 17 cites the qa rules of `merge-check.mjs` as "lines 129 to 165"; on `f2f5fa2` `function qaProblems` is lines 134 to 170.
- union-1 cites `merge-check.mjs` "line 111"; on `f2f5fa2` line 111 opens the main-session list (`const main = [`) and `"DESIGN.md",` is line 115.
- Row 7 cites `storyTitle` at "lines 134 to 152"; on `f2f5fa2` `metaTitle` is lines 141 to 158 and `storyTitle` lines 161 to 171.

### Open points

- `record` (line 389) calls `reworkState(readIssue(...))`, and the routes call `allTasks`, `isOpen`, `writeClosed` and `writeJson` from `scripts/ovl/records.mjs`, which this entry did not read; whether they throw on a malformed record is not checked.
- Which checkout `input.cwd` names for SubagentStop and for PostToolUse is not stated in the files read (N2).

### Claims that did not re-check

- The spec's statement that the seed lines were "read on this branch's head (81e95d5)": the files at `81e95d5` were not opened (no shell; only the working tree at `f2f5fa2` was read). Searched: `docs/specs/ORV-138/spec.md` (line 220 states it) and the branch reflog, which gives the commit and its subject only. Whether `qa.v1.json` changed between the two commits (the seed's line 36 against line 35 here) is therefore not checked; the reflog subjects name ORV-94, ORV-120 and ORV-104 only.

## Why it matters for ORIVILO

Row 12 of ORV-138 asks for this survey before the first ORV-136 code commit (L-0045). The four rules cover R1 to R3 and R7 to R9; N1 to N5 are the points the spec does not name yet, for the architect or the owner to place before the ORV-136 builder task.
