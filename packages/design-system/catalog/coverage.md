# Coverage checklist

Adapted from the public component index of Untitled UI as a checklist of what a complete three-tier catalog holds (ADR 0003 item 5). Names are ours. Status is what exists in this repository today, nothing more. Update this file in the same PR as any catalog entry.

Legend: `none` not started, `planned` entry exists, no code, `draft` code and story, `stable` gate passed (the PR that lands the entry is the gate; the owner's pass approves it).

## Base

| Component     | Status  | Story              |
| ------------- | ------- | ------------------ |
| Button        | stable  | E2-4               |
| Input         | stable  | E2-4               |
| Field         | stable  | E2-4               |
| Select        | stable  | E2-4               |
| Checkbox      | stable  | E2-4               |
| RadioGroup    | none    |                    |
| Switch        | none    |                    |
| Textarea      | stable  | E2-4               |
| Combobox      | none    |                    |
| Badge         | stable  | E2-4               |
| Tag           | planned | E4-5               |
| Avatar        | none    |                    |
| Tooltip       | stable  | E2-4               |
| Dropdown menu | stable  | base-dropdown-menu |
| Tabs          | stable  | E2-4               |
| Breadcrumb    | none    |                    |
| Pagination    | none    |                    |
| Progress      | planned | E4-5               |
| Slider        | draft   | base-slider        |
| Toast         | planned | E4-5               |
| File upload   | none    |                    |
| Date picker   | none    |                    |
| Popover       | stable  | E2-4               |
| ContextMenu   | stable  | base-context-menu  |
| ToggleGroup   | stable  | base-toggle-group  |
| ScrollArea    | draft   | base-scroll-area   |
| Kbd           | stable  | base-kbd           |
| Resizable     | draft   | base-resizable     |

## Application

| Component               | Status | Story                      |
| ----------------------- | ------ | -------------------------- |
| Dialog                  | stable | application-dialog         |
| Card                    | stable | application-card           |
| Table                   | stable | application-table          |
| Sheet                   | draft  | application-sheet          |
| Top navigation          | none   |                            |
| Sidebar navigation      | none   |                            |
| Page header             | none   |                            |
| Section header          | none   |                            |
| Empty state             | none   |                            |
| Loading state           | none   |                            |
| Command menu            | stable | application-command-menu   |
| Shortcut sheet          | stable | application-shortcut-sheet |
| Metric                  | none   |                            |
| Filters                 | none   |                            |
| Settings layout         | none   |                            |
| ConfirmDialog (pattern) | none   |                            |

## Application, canvas set (ADR 0004)

| Component           | Status  | Story                             |
| ------------------- | ------- | --------------------------------- |
| CanvasBoard         | stable  | application-canvas-board          |
| CanvasNode          | stable  | application-canvas-node           |
| NodePort            | stable  | application-node-port             |
| CanvasEdge          | stable  | application-canvas-edge           |
| NodeGroup           | stable  | application-node-group            |
| NodeToolbar         | stable  | application-node-toolbar          |
| MiniMap             | stable  | application-mini-map              |
| CanvasControls      | stable  | application-canvas-controls       |
| CanvasContextMenu   | stable  | application-canvas-context-menu   |
| BlockLibrary        | draft   | application-block-library         |
| Inspector           | draft   | application-inspector             |
| MissingInputsPrompt | draft   | application-missing-inputs-prompt |
| DirectionStudio     | draft   | application-direction-studio      |
| CanvasChat          | planned | E4-5                              |
| TaskBar             | planned | E4-5                              |
| CompareStrip        | planned | E4-6                              |
| VersionBadge        | planned | E4-6                              |

Commands and shortcuts for the set: `commands/canvas.yaml` (checked by `check-commands`). Blocks of the MVP path: `blocks/mvp.yaml` (checked by `check-blocks`).

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
