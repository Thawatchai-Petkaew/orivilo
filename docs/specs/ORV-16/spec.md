---
issue: ORV-16 (draft key E1-1; https://tpetkaew.atlassian.net/browse/ORV-16)
lane: L (schema contract)
version: 1
---

## Why

Every canvas node must carry knowledge with provenance (brief, "Every node carries a knowledge base" and "Knowledge is the core value"). E1-2's rule grammar, E1-3's seed import, E1-4 to E1-6's node knowledge, E1-7's collectors and the resolver (E2-9) all read one record shape. Fixing it first, with tests, keeps every later story from inventing its own.

## Story

As the Intent Engine, I want one validated record for a piece of design knowledge, with its scope, sources, license, confidence basis and check date, so that a node can say what it knows, where that came from, how sure we are and whether it needs a fresh look, and so that an import or a collector can never pass off copied or unchecked material as trusted knowledge.

## Rules and bounds

The shape and its reasons are ADR 0005. In short:

- Strict objects: an unknown field fails parsing.
- `id` is a lowercase slug (`color.semantics-separate`); `version` a positive integer.
- `statement`, `do`, `avoid`: Thai, English or both, each non-empty after trimming.
- `appliesTo.topics`: at least one of the eleven topics. `industries`, `audiences`: slugs, empty means any. `personality`: optional `{ min, max }` per axis, integers 0 to 100, `min <= max`.
- `sources`: at least one; `link-only` needs an https url; a `reference` holds only `link-only` sources.
- `confidence` 0 to 1, capped by `confidenceBasis` (1, 0.9, 0.8, 0.7, 0.4).
- `status` `verified` needs `verifiedAt` (ISO date) and `verifiedBy`.
- No relation to itself. `checkCorpus` reports duplicates, missing targets, live-to-retired leans and supersede loops.
- `freshness(entry, today)`: fresh at 90 days or fewer, stale after, unverified when never checked; a bad date throws.

## Design (G2)

```
packages/intent-engine/src/
  knowledge.ts       schemas, CONFIDENCE_CAP, REVIEW_AFTER_DAYS, freshness, checkCorpus
  knowledge.test.ts  three entries from brand-ci-method.md §5 and §6 as fixtures
  index.ts           re-exports knowledge
docs/adr/0005-knowledge-entry-shape.md
```

Pure TypeScript and zod; no framework import, no `Date.now` (the package's lint rules).

## Acceptance criteria

| #   | Given                                         | When                                       | Then                                                 |
| --- | --------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| 1   | the three method entries                      | parsed, and parsed after a JSON round trip | each equals its input                                |
| 2   | an entry with an extra field at any level     | parsed                                     | it fails at that level                               |
| 3   | a bad id, an unknown topic or no topic        | parsed                                     | it fails at `id` or `appliesTo.topics`               |
| 4   | a statement with no language or only spaces   | parsed                                     | it fails at `statement`                              |
| 5   | a reversed, out-of-range or unknown axis      | parsed                                     | it fails under `appliesTo.personality`               |
| 6   | no source, a link-only source without https   | parsed                                     | it fails at `sources` or the source's `url`          |
| 7   | a reference holding a non link-only source    | parsed                                     | it fails at `sources`                                |
| 8   | a confidence above its basis cap              | parsed                                     | it fails at `confidence`; at the cap it passes       |
| 9   | a verified entry without date or checker      | parsed                                     | it fails at `verifiedAt`                             |
| 10  | an entry checked on 2026-10-21                | `freshness` on 2027-01-19, then 2027-01-20 | fresh, then stale; unverified when never checked     |
| 11  | a corpus with a duplicate or a missing target | `checkCorpus`                              | both reported, sorted by id                          |
| 12  | a live entry supporting a retired one         | `checkCorpus`                              | reported; a `supersedes` to a retired entry is fine  |
| 13  | a supersede loop through a second branch      | `checkCorpus`                              | every entry on the loop is reported                  |
| 14  | the package                                   | `pnpm lint && pnpm typecheck && pnpm test` | pass; mutating any rule above turns a named test red |

## Out of scope

- Rules over entries (E1-2), importing a corpus (E1-3), node knowledge content (E1-4 to E1-6), collectors (E1-7).
- Search or ranking, persistence in the database, and any UI showing entries (later stories).
