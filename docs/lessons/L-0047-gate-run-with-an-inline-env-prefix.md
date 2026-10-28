---
id: L-0047
date: 2026-10-28
issue: [ORV-133]
what_happened: Before the merge of PR 130 the main session ran the quality gate with an inline variable prefix (`VAR=... pnpm quality-gate`), which `result-recorder` does not count as a gate run, so no gate record was written for the head and merge-check refused the merge until the gate ran again as `export ...; pnpm quality-gate`.
cause: The ovl skill's "A fact that the gate passed" bullet (from L-0026) writes the gate run as `TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1 pnpm quality-gate`, while the recorder counts only a command segment that starts with `pnpm quality-gate` or `node scripts/quality-gate.mjs`.
rule: The skills write the gate run as `export TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1; pnpm quality-gate` and say that an inline prefix (`VAR=... pnpm quality-gate`, `env ... pnpm quality-gate`) writes no gate record.
---

## What happened

- `scripts/ovl/result-recorder.mjs` lines 412 to 419: `runsGate` splits the command at `&&`, `||`, `;` and `|` and counts a segment only when it matches `^(?:node scripts\/quality-gate\.mjs|pnpm (?:run )?quality-gate)(?: |$)`. A segment `TEST_DATABASE_URL=... pnpm quality-gate` does not match; `export ...; pnpm quality-gate` gives a second segment that does.
- `.claude/skills/ovl/SKILL.md` line 168 ("A fact that the gate passed", L-0026) gives the inline form as the run to name. Line 225 says which runs write no record (a subagent's, an interrupted one, `--only`) and does not name this one.
- The only gate record for the merged head `9222b28` is `.orivilo/runs/ORV-133/gates/2026-10-28T06:04:58.834Z.json` (`ok: true`, `dirty: false`, `steps_source: "gate"`). The refused merge-check and the inline run are the main session's account in the envelope of task `ORV-133-retro-1`; a run the recorder skips leaves no record by design, so the records cannot show it.
- Cost: one full gate run repeated (the gate's length in time); no task tokens. No `## Expected saving` for that reason.

Related: [[L-0026-gate-database-url-missing-from-the-fact]] (whose command form this narrows).

## Rule

Proposed diff, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, section 2, "A fact that the gate passed" (line 168):

```diff
-- **A fact that the gate passed.** Its `checked_by` names the run: `TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1 pnpm quality-gate`, with the URL the main session used. That URL is a local database with no password, never a secret (L-0026). No hook checks this; it is the main session's duty.
+- **A fact that the gate passed.** Its `checked_by` names the run: `export TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1; pnpm quality-gate`, with the URL the main session used. That URL is a local database with no password, never a secret (L-0026, L-0047). No hook checks this; it is the main session's duty.
```

In `.claude/skills/ovl/SKILL.md`, section 4, the paragraph "Running `pnpm quality-gate` in the main session writes a gate record" (line 225), after "a partial run (`--only`) writes none.":

```diff
+A run behind an inline variable prefix (`VAR=... pnpm quality-gate` or `env ... pnpm quality-gate`)
+writes none either: set the variables with `export` in an earlier segment (L-0047).
```

In `.claude/skills/quality-gate/SKILL.md`, after the code block that shows `pnpm quality-gate` (line 12):

```diff
+When the run needs variables (the test database URL), export them first:
+`export TEST_DATABASE_URL=<url> REQUIRE_DB_TESTS=1; pnpm quality-gate`. The gate record hook does not
+count `VAR=... pnpm quality-gate` (L-0047).
```

What proves it was done: `grep -n "REQUIRE_DB_TESTS=1 pnpm quality-gate" .claude/skills/ovl/SKILL.md` finds no line, and the next merge-check of a main-session gate run passes on the first run.

Status: promoted 2026-10-28, into `.claude/skills/ovl/SKILL.md` (section 2, "A fact that the gate passed"; section 4, the gate record paragraph) and `.claude/skills/quality-gate/SKILL.md` (after the `pnpm quality-gate` code block); no hook enforces it
