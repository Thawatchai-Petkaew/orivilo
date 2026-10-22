# Specs

One folder per Jira issue: `docs/specs/<ISSUE-KEY>/`.

| File        | Written by                       | When                               |
| ----------- | -------------------------------- | ---------------------------------- |
| `spec.md`   | product agent (`discover` skill) | Before G1 (L) or G2 Plan (M)       |
| `design.md` | designer agent                   | L lane, before G2                  |
| `tech.md`   | ds-architect agent               | When a contract changes, before G2 |

Jira holds live status. These files hold the durable content. S lane work may skip the folder and put acceptance criteria in the issue.

## Draft keys and Jira keys

The backlog was drafted with placeholder keys (`E4-3`) before Jira held it. Jira issues were created on 2026-10-22; folders carry the Jira key, and the `since` field of the command registry, `CURRENT_STORY`, DESIGN.md changelog entries and older PR titles keep the draft key. The map, for every story with a spec folder:

| Draft | Jira   | Draft | Jira   | Draft | Jira   |
| ----- | ------ | ----- | ------ | ----- | ------ |
| E0-5  | ORV-14 | E2-4  | ORV-27 | E4-1  | ORV-41 |
| E2-0  | ORV-23 | E2-5  | ORV-28 | E4-2  | ORV-42 |
| E2-1  | ORV-24 | E2-6  | ORV-29 | E4-3  | ORV-43 |
| E2-2  | ORV-25 | E2-7  | ORV-30 |       |        |
| E2-3  | ORV-26 | E2-8  | ORV-31 |       |        |

Every other draft key maps to its Jira issue in `backlog-draft.md`.
