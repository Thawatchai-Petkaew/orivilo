---
id: L-0024
date: 2026-10-26
issue: [ORV-20]
what_happened: The rule-based, no-model test for the colour node passed against a multi-line, a side-effect or a dynamic import of the model modules, so removing the guarantee would not have turned it red.
cause: The guard matched source text line by line, and the mutation run before handoff broke the code under test but never fed the guard each import form it claims to block.
rule: A test that guards source text is run against one failing sample of every syntax form it claims to block, and the builder lists each red sample in `verified`.
---

## What happened

ORV-20 slice A (PR 112) added a check for spec row 16 in `packages/intent-engine/src/color-rules.test.ts` (line 270 on head `4ddac58`) that the colour node imports no interpreter, no OpenRouter client and no design system. It kept only lines that both start with `import` or `export` and contain `from`.

ORV-20-build-1 reported 4 mutations that went red (crowded inverted, wrong scope, band edge, crowd threshold), and none of them broke the import guard. Reviewer ORV-20-review-2 finding R2-1 (Important) ran a three-line `import { ... } from "./llm-interpreter"` through the same filter: kept lines `[]`, match `false`. A side-effect import and a dynamic `import("./openrouter")` also pass. ORV-20-build-2 (372,773 tokens) rewrote the match over the whole source, and ORV-20-review-3 (637,842 tokens, shared with the other round 1 fixes) approved `58ccb27`.

This narrows [[L-0002-a-test-that-cannot-fail]], which asks for one red run. One red sample is not enough for a text guard: here the single-line form would have failed as expected while the other three forms passed.

## Rule

- A guard over source text (an import ban, a forbidden token, a copy check) lists the syntax forms it blocks in a comment or test name. For an import ban that means a single-line import, a multi-line import, a side-effect import, a dynamic `import()` and an `export ... from`.
- Before handoff the builder runs the guard on one failing sample of each form, as a fixture inside the test or a scratch run, and adds one `verified` row per form with the red line.
- The reviewer checks that each form has a row, and raises any missing form as a finding.
- Target: `.claude/rules/testing.md` (guard test section) and `.claude/agents/builder.md` (handoff checklist).

Status: promoted 2026-10-26, into `.claude/rules/testing.md` (guard test bullet) and `.claude/agents/builder.md` (Loop per task, step 5); no hook enforces it
