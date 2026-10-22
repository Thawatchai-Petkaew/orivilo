# ADR 0005: Knowledge entries are closed, sourced, capped and dated records

- Status: accepted
- Date: 2026-10-22
- Decided by: the implementer under the owner's 2026-10-22 policy (agents run G1 to G4; the owner reviews at G5), story ORV-16

## Context

The brief makes knowledge the moat: every canvas node is expert in its topic, missing knowledge is a gap to fill and never something to improvise, and knowledge is versioned like every other contract. `docs/context/ai-team-skills.md` proposed modelling the record on UI/UX Pro Max's structured rows (keywords, do and don't, severity, status, verified date, confidence, sources) plus our own facets, without its flaws: industry as a style lock, generic palettes, a flat table with no relations. The handoff §12.2 forbids a confidence number with no way of reaching it. Stories E1-2 to E1-7 and the resolver (E2-9) all read this shape, so it is fixed first.

## Decision

1. **One record, `knowledgeEntrySchema` v1.0 in `packages/intent-engine/src/knowledge.ts`.** Fields: `schemaVersion`, `id` (slug), `version`, `kind`, `status`, `statement`, `do`, `avoid`, `severity`, `appliesTo`, `keywords`, `sources`, `confidence`, `confidenceBasis`, `verifiedAt`, `verifiedBy`, `relations`. Every object is strict: an unknown field is an error, not silently dropped.
2. **Kinds are four.** `principle` (how to do something well), `guideline` (a checkable do or avoid), `pattern` (what a kind of product tends to need), `reference` (an outside example). Decision rules are not a kind; they are E1-2's grammar and point at entries.
3. **Text is ours, in Thai, English or both.** `statement`, `do` and `avoid` take `{ th?, en? }` with at least one. Principles are summarized in our own words; nothing is pasted from a source.
4. **Scope is facets, never a lookup.** `appliesTo` has `topics` (closed list: brand, logo, color, typography, shape, density, surface, imagery, motion, content, pattern; at least one), `industries` and `audiences` (slugs; empty means any), and `personality` (optional 0 to 100 range per axis of the brand brief: playful, expressive, structured, warm, premium). Industry narrows where an entry applies; it never picks a style on its own.
5. **Every entry has at least one source, each with a license.** Licenses: `own-words`, `link-only`, `MIT`, `CC-BY-4.0`, `CC0-1.0`. A `link-only` source needs an https url. A `reference` entry may only hold `link-only` sources, so third-party visuals are never copied (brief, licensing split).
6. **Confidence needs a basis, and the basis caps it.** `owner-verified` 1, `multiple-sources` 0.9, `single-source` 0.8, `imported` 0.7, `hypothesis` 0.4. The caps are a contract, not a measurement; they order trust so an import can never outrank a person's check.
7. **Freshness is computed, not stored.** A `verified` entry records `verifiedAt` (ISO date) and `verifiedBy`. `freshness(entry, today)` returns fresh up to 90 days after the check, stale after, unverified when never checked. `today` is passed in, so the engine stays reproducible.
8. **Relations are typed.** `supports`, `refines`, `contradicts`, `supersedes`, each to another id. `checkCorpus(entries)` reports duplicate ids, relations to missing entries, a live entry leaning on a retired one, and supersede loops, in a stable order.

## Change rules

- Adding a topic, kind, license, source kind or relation type is additive and keeps `schemaVersion` "1.0"; the change names the stories that use it.
- Renaming or removing a field, tightening a bound, or changing a cap bumps `schemaVersion` and needs a migration note in the PR.

## Not chosen

- **A free-form `tags` bag for scope.** It would grow into the industry lookup we rejected.
- **Stored freshness status.** It goes stale by itself; computing it from the date cannot.
- **Confidence as a bare number** (handoff §12.2), and **storage in the database now**: entries live in code and tests until a story needs them persisted (E2-12 or later).
