---
id: L-0038
date: 2026-10-26
issue: [ORV-128]
what_happened: Three claims in the ORV-128 spec were each disproved by a reviewer with one `node -e` line, the arithmetic behind D3 (F1), a TSIC matching method that could not match the fixture page (F2) and, after the fix, exact confidence values that IEEE doubles do not produce (S1).
cause: The product role has no shell, the spec stated its numbers and its matching method as prose with no worked example on a real input, and the ovl loop runs a no-shell role's checks only for research (L-0023), so nothing in the spec was executed before a reviewer did it.
rule: A spec that states a computed number or a method that maps input to output gives each a worked example as a command with real input and the expected output; product lists each as not run, and the main session runs them with the product envelope's `done_when` before any review or gate packet.
---

## What happened

Records are under `.orivilo/runs/ORV-128/`; tokens are `tokens.total` from `.orivilo/metrics/ORV-128.json`.

- `.claude/agents/product.md` grants `Read, Grep, Glob, Write, Edit`. All three product results (`ORV-128-product-spec-2`, `-3`, `-4`) say in `deviations` that the session had no shell and did not run `pnpm format:check`, `pnpm check:knowledge` or the report validator.
- `ORV-128-review-spec-1` F1: `node -e 'console.log(0.6*0.8, 0.6*0.7)'` prints `0.48 0.42`, while the D3 reason said a model reading survives one mild factor at a floor of 0.5.
- `ORV-128-review-spec-1` F2: `node -e 'console.log("คลินิกโรคเฉพาะทาง".includes("กิจกรรมคลินิกโรคเฉพาะทาง"))'` prints `false`, so the substring method at spec v1.1 line 109 (head `23e399b`) could not give row 13's expected code `86202` from its own fixture heading. The TSIC name came from the ORV-127 module, a real source; the fixture heading was written for the row, and the two were never set against each other.
- `ORV-128-product-spec-4` (1,060,193 tokens) fixed both. Its new numbers were again prose: `ORV-128-review-spec-2` (298,256 tokens) S1 ran `node -e 'console.log(0.7*0.8, 0.7*0.7, 0.7-0.6, 0.8-0.7)'` and got `0.5599999999999999 0.48999999999999994 0.09999999999999998 0.10000000000000009`, so rows 3, 12 and 32 state exact values with no rounding rule and the 0.1 margin depends on float error. S1 was a Suggestion and merged open.
- `.claude/skills/ovl/SKILL.md` section 4 has the main session run `done_when` after a `research` result only (L-0023); a `product` result has no such step.

Related: [[L-0023-research-role-cannot-run-its-checks]] (the same gap for research, promoted; this lesson extends its step to product and adds worked examples), [[L-0034-level-5-count-mixed-two-bases]] (a count fact carries a reproducing command; this lesson asks the same of numbers and methods inside the spec).

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/agents/product.md`, under Standards:

```diff
+- A number the spec derives (a product of factors, a threshold, a margin) and a method that maps input
+  to output (a match, a parse, a lean) each get a worked example under `## Worked examples`: one
+  `node -e` line with real input copied from its source (a module, a page, a fixture file), and the
+  output the spec expects, with its rounding stated. List each as a `verified` row marked "not run, no
+  shell" (L-0038). No hook checks this.
```

In `.claude/skills/ovl/SKILL.md`, section 4, the paragraph that begins "A `research` result is followed":

```diff
-A `research` result is followed by the main session running that envelope's `done_when` commands in the worktree, before any review is dispatched.
+A `research` or `product` result is followed by the main session running that envelope's `done_when` commands, and for `product` every line under the spec's `## Worked examples`, in the worktree, before any review or gate packet. An output that differs from the one the spec states goes back to `product` in a new envelope that names it (L-0038). No hook checks this; it is the main session's duty.
```

What proves it was done: on the next spec with computed numbers or a matching method, the spec has a `## Worked examples` section, the reviewer envelope carries one fact per example (`checked_by` the command), and the first review raises no finding that a one-line command disproves.

Status: promoted 2026-10-26, into `.claude/agents/product.md` (Standards, the worked examples bullet) and `.claude/skills/ovl/SKILL.md` (section 4, the paragraph that begins "A `research` or `product` result is followed"); no hook enforces it
