# Coverage checklist

Adapted from the public component index of Untitled UI as a checklist of what a complete three-tier catalog holds (ADR 0003 item 5). Names are ours. Status is what exists in this repository today, nothing more. Update this file in the same PR as any catalog entry.

Legend: `none` not started, `planned` entry exists, no code, `draft` code and story, `stable` gate passed (the PR that lands the entry is the gate; the owner's pass approves it).

## Base

| Component     | Status  | Story |
| ------------- | ------- | ----- |
| Button        | stable  | E2-4  |
| Input         | stable  | E2-4  |
| Field         | stable  | E2-4  |
| Select        | stable  | E2-4  |
| Checkbox      | stable  | E2-4  |
| RadioGroup    | none    |       |
| Switch        | none    |       |
| Textarea      | stable  | E2-4  |
| Combobox      | none    |       |
| Badge         | stable  | E2-4  |
| Tag           | planned | E4-5  |
| Avatar        | none    |       |
| Tooltip       | stable  | E2-4  |
| Dropdown menu | planned | E4-3  |
| Tabs          | stable  | E2-4  |
| Breadcrumb    | none    |       |
| Pagination    | none    |       |
| Progress      | planned | E4-5  |
| Slider        | planned | E4-4  |
| Toast         | planned | E4-5  |
| File upload   | none    |       |
| Date picker   | none    |       |
| Popover       | stable  | E2-4  |
| ContextMenu   | planned | E4-3  |
| ToggleGroup   | planned | E4-3  |
| ScrollArea    | planned | E4-4  |
| Kbd           | planned | E4-5  |
| Resizable     | planned | E4-4  |

## Application

| Component               | Status  | Story              |
| ----------------------- | ------- | ------------------ |
| Dialog                  | stable  | application-dialog |
| Card                    | stable  | application-card   |
| Table                   | stable  | application-table  |
| Sheet                   | planned | E4-4               |
| Top navigation          | none    |                    |
| Sidebar navigation      | none    |                    |
| Page header             | none    |                    |
| Section header          | none    |                    |
| Empty state             | none    |                    |
| Loading state           | none    |                    |
| Command menu            | planned | E4-3               |
| Metric                  | none    |                    |
| Filters                 | none    |                    |
| Settings layout         | none    |                    |
| ConfirmDialog (pattern) | none    |                    |

## Application, canvas set (ADR 0004)

| Component           | Status  | Story |
| ------------------- | ------- | ----- |
| CanvasBoard         | planned | E4-2  |
| CanvasNode          | planned | E4-2  |
| NodePort            | planned | E4-2  |
| CanvasEdge          | planned | E4-2  |
| NodeGroup           | planned | E4-3  |
| NodeToolbar         | planned | E4-3  |
| MiniMap             | planned | E4-3  |
| CanvasControls      | planned | E4-3  |
| CanvasContextMenu   | planned | E4-3  |
| BlockLibrary        | planned | E4-4  |
| Inspector           | planned | E4-4  |
| MissingInputsPrompt | planned | E4-4  |
| CanvasChat          | planned | E4-5  |
| TaskBar             | planned | E4-5  |
| CompareStrip        | planned | E4-6  |
| VersionBadge        | planned | E4-6  |

Commands and shortcuts for the set: `commands/canvas.yaml` (checked by `check-commands`).

## Marketing

| Component        | Status | Story |
| ---------------- | ------ | ----- |
| Hero section     | none   |       |
| Features section | none   |       |
| Pricing section  | none   |       |
| Testimonials     | none   |       |
| Logo cloud       | none   |       |
| CTA section      | none   |       |
| FAQ              | none   |       |
| Footer           | none   |       |
| Newsletter       | none   |       |
| Contact          | none   |       |

## Page examples

| Example                        | Tier        | Status | Story                                    |
| ------------------------------ | ----------- | ------ | ---------------------------------------- |
| Workspace settings form        | base        | stable | examples-base-settings-form              |
| Decision log overview (bento)  | application | stable | examples-application-decision-log        |
| Landing page                   | marketing   | draft  | examples-marketing-landing-page          |
| Reference screen (handoff §19) | application | stable | examples-application-workspace-reference |
| Tokens and type specimen       | foundation  | stable | foundations-typography                   |

Marketing has no section entries yet and will not until a story needs a generated landing page; the gap is intentional and reported here rather than implied. Its page example (E2-7) is `draft` for that reason: it is composed from Base and Application components only, and becomes `stable` when a marketing section lands with its own entry. A page example lists only the public components it uses; an inline page header, metric or empty state in an example does not make that row above real.
