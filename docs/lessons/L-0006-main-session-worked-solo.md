---
id: L-0006
date: 2026-10-23
issue: [ORV-81]
what_happened: The main session built the stories itself and checked them with reviewer subagents it chose and judged, and the owner said they do not trust the work.
cause: The same session built the work, chose what to review and accepted the findings, and no QA role was separate from the builder.
rule: The main session only plans and dispatches; each story is built by a role agent and accepted by a QA agent that did not build it, and a story without a QA report does not reach G3.
---

## What happened

The master plan records the pilot as "Done by hand (ORV-72 to ORV-78)" (`docs/plans/master-plan.md`, layer 4). The main session wrote the code and ran the checks. It did dispatch reviewer subagents, but it chose what they looked at and decided which findings counted, so the review never left the builder's hands. No QA role existed apart from the builder. L-0001 and L-0002 are defects this setup missed.

The ORV-81 Jira description records the result: "On 2026-10-23 the owner said they do not trust the work." ORV-81 sets up work through role agents.

## Rule

- The main session runs the `ovl` skill: it writes envelopes, dispatches role agents and reports. It does not edit production code.
- Each story has a builder agent and a separate QA agent. The QA agent gets the spec and the sources as paths, not the builder's summary, and returns findings with evidence that can be re-run ([[K-0006-finding-without-evidence-is-dropped]]).
- The G3 packet names which agent did each step and attaches the QA report. No QA report, no G3 ([[K-0010-campvibe-done-needs-a-verify-role]]).
- Model review stops at 2 rounds; what is left goes to the owner ([[K-0007-model-review-capped-at-two-rounds]]).

Status: proposed (targets AGENTS.md, the `ovl` skill and the `gate-packet` skill; ORV-81)
