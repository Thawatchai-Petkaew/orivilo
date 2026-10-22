---
issue: ORV-35 (draft key E2-12; https://tpetkaew.atlassian.net/browse/ORV-35)
lane: L
version: 1.1
---

## Why

The Studio's two directions (ORV-34) are gone on reload. ORV-38 gave people, workspaces and a database only the right member can read. This story keeps a direction: save it as a draft, approve it into a version that never changes, and move it in and out as a JSON file that brings back the same look.

## Decisions this spec relies on

- ADR 0002: server-only data access through `withWorkspace`, default deny, the restricted role, row security keyed by workspace.
- ADR 0007: the resolver is deterministic and its `fingerprint` names one result; locks win over adjustments.
- ORV-34: a refinement is an adjustment with a reason; the look is the chosen curated profile with its refinements applied.
- Backlog E2-12, done when: an approved snapshot is immutable; edits create drafts; a round trip returns the same look.

## Parts

| Part | Content                                                                                                                                      | Status       |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1    | Snapshot and file format in `intent-engine`; tables, immutability and row security in `db`; draft, approve, list and read through the helper | Merged (#42) |
| 2    | Studio wiring in `apps/web`: save, approve, version list, export and import buttons, signed-out state; Storybook story for the new props     | This PR      |

## Story

As a person shaping a direction in the Studio, I want to save it, approve the one I mean, and take it out as a file, so the decision survives a reload and nobody can change what was approved.

## Decisions (technical)

- **What is saved is the input, not the output.** A snapshot holds the brief, the brand's locks, the adjustments (refinements included, with their reasons), the profile being viewed, the resolver and catalog versions, and the resolver's fingerprint. The engine is deterministic, so replaying the snapshot rebuilds the same directions and the same look. The server recomputes the fingerprint before writing; a client value is never trusted.
- **Replay is honest.** `replayDirection` refuses a snapshot whose resolver version is not the current one, whose profile no longer exists, or whose fingerprint does not match the replay. Nothing is silently repaired.
- **Two tables.** `direction` (a named direction in a workspace) and `direction_version` (its snapshots). A version is `draft` or `approved`. A direction has at most one draft (partial unique index). Approving turns the draft into the next numbered version. Editing an approved direction saves a new draft beside it, so "edits create drafts" needs no copy step.
- **Approved is immutable in the database**, not only in code: a trigger refuses any `UPDATE` of an approved row, so even `orivilo_app` with the workspace set cannot change one. Both tables carry `workspace_id` with the `workspace_rows` policy and are in `TENANT_TABLES`.
- **Roles.** A member saves drafts and reads; approving needs `admin` or `owner` (humans own the gate).
- **File format** `orivilo.direction` schema 1.0: `{ format, schemaVersion, name, version: { status, number }, snapshot }`, validated with zod on import. An import always creates a new draft, never an approved version.

## Acceptance criteria

| #   | Given                                            | When                                      | Then                                                                                                | Evidence                     |
| --- | ------------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | A brief, locks, refinements and a viewed profile | Taking a snapshot and replaying it        | The same fingerprint, the same two directions and the same viewed profile                           | Engine test                  |
| 2   | A snapshot whose fingerprint or resolver changed | Replaying it                              | Refused with the reason (fingerprint, resolver, profile); nothing repaired                          | Engine test                  |
| 3   | A member of workspace A                          | Saving a new direction, then saving again | One direction and one draft; the second save updates that draft                                     | Integration test             |
| 4   | A draft and an admin                             | Approving                                 | The draft becomes version 1, records who and when; the next approval is version 2                   | Integration test             |
| 5   | A member (not admin)                             | Approving                                 | Denied (403); the draft is unchanged                                                                | Integration test             |
| 6   | An approved version                              | Saving the direction again                | A new draft beside it; version 1 is unchanged                                                       | Integration test             |
| 7   | `orivilo_app` with the workspace set             | Updating an approved row directly         | Refused by the database                                                                             | Integration test             |
| 8   | A member of workspace B                          | Reading or saving workspace A's direction | Not found or denied; row security returns zero rows even without the helper                         | Integration test             |
| 9   | A snapshot whose client fingerprint was altered  | Saving                                    | The server stores its own recomputed fingerprint, or refuses when replay fails                      | Integration test             |
| 10  | An exported file                                 | Importing it                              | A new draft whose replay matches the export; a malformed or altered file is refused with the reason | Engine and integration tests |

### Part 2 (Studio)

| #   | Given                                         | When                                       | Then                                                                                                                         | Evidence                               |
| --- | --------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 11  | The studio showing a direction                | It changes                                 | It reports the engine's inputs once per change (never the output), `null` while nothing is offered                           | Storybook `SaveAndReopen`, `NotRead`   |
| 12  | A reported state                              | Reopening it with `studioPropsFrom`        | The same viewed direction, the same refinement, the same preview profile and an equal reported state                         | Storybook `SaveAndReopen`              |
| 13  | Signed out on /directions                     | Opening the page                           | The studio works; the panel says nothing is saved and links to /account                                                      | Browser check                          |
| 14  | Signed in as the owner                        | Save, approve, edit and save, open, export | Draft, then version 1 with its badge, then a new draft beside it; opening version 1 brings back its look; the file downloads | Browser check against a local database |
| 15  | The exported file, a tampered one, a non-JSON | Importing each                             | A new draft that opens with the same look; the tampered and the non-JSON files are refused with the reason in words          | Browser check against a local database |

## Changelog

- 1.1: part 2 acceptance criteria (11 to 15).

## Out of scope

- Deleting directions, comparing versions (E4-6 CompareStrip and VersionBadge), sharing outside the workspace.
- Token and asset export beyond the direction file (E3-5 and later).

## Self-verify

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm contrast && pnpm test && pnpm build` with `TEST_DATABASE_URL` and `REQUIRE_DB_TESTS=1`. Mutation proofs: dropping the trigger fails AC 7; skipping the role check fails AC 5; trusting the client fingerprint fails AC 9.

## Gates

Lane L. G1 (scope) and G2 (design) are run by Claude under the owner's standing autonomy (G1 to G4 delegated, G5 with the owner). Recorded in the PR.
