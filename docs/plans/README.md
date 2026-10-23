# Plans

Where ORIVILO is going and in what order. Jira holds live status for each issue; a plan holds the shape of the work and why the order is what it is.

## What lives here

| File             | What it is                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `master-plan.md` | The one plan for the whole product: layers, epics, what is done, what is next, open owner calls |

Add a file only when a plan does not fit the master plan, such as the plan for one phase or one epic. Name it `<phase-or-epic>-plan.md` and link it from `master-plan.md`.

## Rules

- Update the plan when an epic moves, when the owner changes the order, and before handing work to another session. Put the date of the update at the top.
- Where the plan and Jira disagree on status, Jira wins. Where they disagree on order, ask the owner and fix the plan.
- A plan cites the decisions it rests on: ADRs by number, knowledge by id in a `## Knowledge` section ([knowledge README](../knowledge/README.md)), lessons by id where a lesson changed the order or the process.
- A plan states what is real and what is mocked or rule-based, in the same words the product uses.

## Related folders

- `docs/adr/`: decisions. Supersede, never rewrite.
- `docs/specs/<ISSUE-KEY>/`: the spec for one issue.
- `docs/knowledge/`: facts from outside sources, with confidence.
- `docs/lessons/`: what went wrong in our work and the rule that changed.
- `docs/context/`: the brief, the handoff and other stable background.
