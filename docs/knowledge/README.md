# Knowledge

What the team has learned from outside sources, one fact per file, each with its source and how sure we are. Decisions cite these entries by id, so a reader can follow a rule back to the evidence behind it.

This folder holds **process knowledge** for the team that builds ORIVILO (how agents are dispatched, checked and gated). It is not the product's knowledge corpus. Product knowledge entries (brand, colour, typography and so on) live in code under `packages/intent-engine` and follow `knowledgeEntrySchema` (ADR 0005). The two share their ideas on purpose: a source, a retrieval date, a confidence and a license on every record.

## Where entries live

```text
docs/knowledge/<topic>/K-NNNN-<kebab-slug>.md
```

- `<topic>` is a lowercase folder, such as `orchestration`, `verification` or `enforcement`. Add a topic when a new entry fits none of the existing ones.
- `K-NNNN` is four digits and unique across every topic. Take the next free number; never reuse a number, even after a file is retired.
- The slug says the fact in a few words.

## Entry format

```markdown
---
id: K-0001
topic: verification
claim: One sentence, the single fact.
source: "repo-relative path, absolute path or URL; for an external repo, the path inside it (with a line)"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> A short quote or excerpt from the source, at most 6 lines, copied exactly.

## Why it matters for ORIVILO

One to three sentences.
```

| Field        | Meaning                                                                                                 | In `knowledgeEntrySchema` (ADR 0005) |
| ------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`         | `K-NNNN`, unique across topics                                                                          | `id` (a slug there)                  |
| `topic`      | The folder the file sits in                                                                             | `appliesTo.topics`                   |
| `claim`      | One sentence, one fact, in our own words                                                                | `statement`                          |
| `source`     | Where the evidence is. A path must exist when the entry is written; a line number helps the next reader | `sources[].url` or `title`           |
| `retrieved`  | ISO date the source was read                                                                            | `sources[].retrievedAt`              |
| `confidence` | 0 to 1. See the rule below                                                                              | `confidence`                         |
| `applies_to` | Jira keys, ADRs or plans the entry informs                                                              | (no equivalent)                      |
| `license`    | How we may reuse the source: `internal`, `own-words`, `link-only`, `MIT`, `CC-BY-4.0`, `CC0-1.0`        | `sources[].license`                  |

### Quoting

- Copy the source's words exactly, and use `...` where you leave words out.
- Our docs carry no em dash and no middot (AGENTS.md). Where the source has one, write `[-]` for an em dash and `[,]` for a middot. Nothing else changes.
- A quote that is code or a shell comment goes in a fenced code block, so a `#` is not read as a heading.

### Licenses

`internal` means a private repo of the owner or a team the owner works with (Camp Vibes, Allkons). We reuse the idea and a short quote for evidence; we never copy files from it.

## Confidence rule

- **Below 0.7, an entry may not be used for a decision.** It can be cited as a lead to check, never as the reason.
- Pick the number the way the product does (ADR 0005, `CONFIDENCE_CAP`): one source read and quoted, at most 0.8; two independent sources that agree, at most 0.9; checked by the owner, up to 1. A number copied from a source that does not show how it was measured stays below 0.7.
- If a quote can no longer be found at its source, lower the confidence below 0.7 and say why in the body. Do not delete the entry.

## How a decision cites knowledge

A decision (an ADR, a spec or a plan) that rests on knowledge adds a `## Knowledge` section listing the ids it relies on, one per line, with a few words on how each was used:

```markdown
## Knowledge

- K-0008: why a hook needs a heartbeat to prove it fires
- K-0007: the review cap of 2 rounds
```

The check (`pnpm check:knowledge`) reads citations in `docs/adr`, `docs/specs`, `docs/plans`, `docs/lessons`, `docs/context`, `.claude/rules`, `.claude/agents`, `.claude/skills` and `AGENTS.md`. A decision may cite only entries at 0.7 or above. When an entry changes or drops below 0.7, search for its id (`grep -rn "K-0001" docs`) and review every decision that cites it.

## Changing an entry

- Fix a typo in place.
- A new fact is a new entry. If it replaces an old one, the new entry says `Supersedes [[K-NNNN-...]]` in its body, and the old one gets a line `Superseded by [[K-NNNN-...]]` at the top of its body. The old file stays.

## Reading in Obsidian

Open `docs/` (or the repo root) as a vault. The frontmatter reads as Obsidian properties, and the folders show as a tree.

- Link entries with wikilinks by file name: `[[K-0005-proof-must-match-the-claim]]`. Wikilinks are allowed in this folder and in `docs/lessons/`.
- Do not use Dataview or any other plugin query. Every file must read correctly as plain markdown on GitHub, where a wikilink shows as text.

## Index

Keep this table in step with the folder when you add an entry.

| Entry                                                  | Confidence | In short                                                              |
| ------------------------------------------------------ | ---------- | --------------------------------------------------------------------- |
| [[K-0001-prose-rules-vs-running-gates]]                | 0.65       | Prose rules caught 0 of 83 gaps, running gates 7 of 7 (count unshown) |
| [[K-0002-atlas-orchestrates-from-the-main-loop]]       | 0.8        | The orchestrator is a main-loop skill; workers are agents             |
| [[K-0003-atlas-envelope-v2-and-checked-facts]]         | 0.8        | One envelope, one objective; every fact has `checked_by`              |
| [[K-0004-atlas-report-contracts]]                      | 0.8        | implementer.v1, reviewer.v1, explorer.v1: JSON only                   |
| [[K-0005-proof-must-match-the-claim]]                  | 0.8        | Visual claims need computed style or a looked-at screenshot           |
| [[K-0006-finding-without-evidence-is-dropped]]         | 0.8        | A finding without re-runnable evidence is dropped                     |
| [[K-0007-model-review-capped-at-two-rounds]]           | 0.8        | Model review stops at 2 rounds, then the human decides                |
| [[K-0008-hooks-fail-silently-without-a-heartbeat]]     | 0.85       | Hooks failed silently; a heartbeat proves they fire                   |
| [[K-0009-campvibe-envelope-done-when-is-an-outcome]]   | 0.8        | `done_when` is an outcome a command proves                            |
| [[K-0010-campvibe-done-needs-a-verify-role]]           | 0.8        | No Done without a QA or Security role in the history                  |
| [[K-0011-campvibe-circuit-breaker-and-stall-watchdog]] | 0.8        | Back to Discovery after 2 rejections; stall after about 15 minutes    |
| [[K-0012-skill-use-per-role-is-prose-only]]            | 0.75       | Skill use per role is enforced in prose only                          |
