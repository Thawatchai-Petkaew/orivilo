# Component catalog

The registry agents read before composing UI (handoff §15, ADR 0003 item 4 and 5). One YAML file per component or pattern, in its tier directory. Storybook (`pnpm --filter @orivilo/design-system storybook`, E2-0) is the visual half of the same catalog: an entry without a story, or a story without an entry, fails `check-catalog` (E2-0) and the design gate in `DESIGN.md` §11.

Tiers follow Untitled UI's structure; the implementation does not (ADR 0003 item 5). Untitled UI is not installed.

| Directory      | Tier        | Holds                                                                |
| -------------- | ----------- | -------------------------------------------------------------------- |
| `base/`        | Base        | Controls, inputs, feedback, navigation primitives                    |
| `application/` | Application | Shells, overlays, tables, empty and loading states, settings layouts |
| `marketing/`   | Marketing   | Sections for generated landing and brand pages                       |

`coverage.md` is the checklist of what each tier should eventually hold and what exists today.

## Entry shape

```yaml
name: Button # PascalCase, the exported component name
tier: base # base | application | marketing
status: planned # planned | draft | stable | deprecated
since: E2-4 # backlog or Jira key that creates it; the PR that lands it updates this to the ORV key
import: "@orivilo/design-system" # none until status is draft
story: base-button # Storybook title id; must resolve once status is draft
useWhen:
  - One primary action per view
avoidWhen:
  - Navigation that changes the URL (use Link)
contract: ButtonProps # exported type name; props are read from the type, not repeated here
variants: [primary, secondary, ghost, destructive]
sizes: [sm, md, lg]
states: [default, hover, focus-visible, pressed, disabled, loading]
recipes: [] # recipes it has been proven under; the gate needs two
examples: [] # paths to example screens that use it
rules:
  - Icon-only form carries an accessible name
a11y:
  - Loading blocks repeat submission and announces status
```

## Statuses

| Status       | Meaning                                                              | Gate                                                                   |
| ------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `planned`    | Entry exists so agents know the intended contract; no code, no story | Agents must not import it; propose nothing that depends on it shipping |
| `draft`      | Code and story exist; not yet proven under two recipes or both modes | Usable inside the design-system package only                           |
| `stable`     | Design gate passed; `recipes` lists ≥ 2; both modes in stories       | Agents may compose with it                                             |
| `deprecated` | Replaced; entry names the replacement in `rules`                     | No new uses                                                            |

## How to register

1. Copy `_template.yaml` into the tier directory, named in kebab-case (`confirm-dialog.yaml`).
2. Fill `useWhen` and `avoidWhen` from the task, not from the component's features.
3. Land the entry in the same PR as the component and its story. The PR sets `status`, `import`, `story`, `recipes`.
4. Update `coverage.md` in the same PR.
5. The reviewer checks `status` against reality (DESIGN.md §11).

Agents: search here first, read the `contract` type and one `examples` entry, then compose. Never invent a prop or a token name; propose an extension in the PR instead.
