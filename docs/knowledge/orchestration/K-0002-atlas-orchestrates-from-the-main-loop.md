---
id: K-0002
topic: orchestration
claim: Allkons' orchestrator Atlas runs as a skill in the main loop, not as a subagent; it never calls a skill itself, authors only small Tier A edits since a 2026-09-24 trial, and sends other deliverables to crew agents (directly or through the Workflow harness), with a design-owner exception for quick UI fixes.
source: "https://bitbucket.org/ThammasornDEV/allkons-marketplace .claude/skills/atlas/references/role.md:10-15; .claude/skills/atlas/SKILL.md:9-11 and 70; .claude/skills/atlas/references/tiered-routing.md:59"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

`role.md`:

> Atlas is a _role_ that **executes as the `/atlas` skill loaded
> into the main loop** ... **not** a dispatched subagent. ...
> A `.claude/agents/atlas.md` (a Claude-Code subagent) would make Atlas an isolated worker that returns once
> and cannot conduct. So the orchestrator is a skill; the workers are agents.

`SKILL.md`:

> You author only **Tier A** edits: small, following an existing decision, and confirmed by a modality-matched check ... You never call a skill directly.

`SKILL.md:70`:

> **C:** a Workflow fan-out of several agents, for breadth or independent files.

`tiered-routing.md`:

> **Amendment (the design owner, 2026-09-24): a quick UI fix that the design owner sends while iterating on a page is Atlas's own edit, even when it touches a DS file, PROVIDED the /ds log is written in the same pass ...**

## Why it matters for ORIVILO

Our `lead` agent plans and dispatches, but a subagent returns once and cannot hold a conversation with the owner. The conductor belongs in the main session, with the role agents as its workers. "Atlas never edits deliverables" is not exact: it makes one-sentence Tier A edits with a check that matches the claim, and quick UI fixes the design owner sends.
