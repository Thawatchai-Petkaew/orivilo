---
issue: ORV-274 (https://tpetkaew.atlassian.net/browse/ORV-274)
spec: docs/specs/ORV-274/spec.md v2.3
design: docs/specs/ORV-274/design.md, revision 5.1
task: ORV-274-tech-3
author: ds-architect
date: 2026-11-17
---

# ORV-274 tech notes: the shared contract for gaps 14 to 19 and the ORIVILO canvas page

POC mode, short. These notes turn gaps 14 to 19 of docs/specs/ORV-274/design.md, section "12. Gaps", plus the gaps that still stand (1 to 6, 8, 9, 11), into token, prop and recipe decisions, and gaps 20 to 23 (art type, photo treatments, scene quads, the guide colour) into page-local decisions with no contract change. They give the page's data shape and two pull requests: PR 211 (shared components, spec rows 1 to 16, 37 and 38) and PR 212 (the page, spec rows 17 to 36 and 39 to 41). Where design revision 5.1 and these notes disagree on a contract name or value, these notes win (ORV-274 comment 10656). "Design §n" means a section of docs/specs/ORV-274/design.md, cited by its title. Line numbers are those of the `feature/ORV-275-typography-inter-anuphan` base (commit 1ef5afd).

Three things change for every board that exists today. Builders and reviewers should know them before they start:

1. **Every present board** (`variant="present"`) gets the modern node, the calm ground, kind hues on edges and no arrow heads. Seven stories render a present board today; they are named in "Impact list", group C.
2. **Every board** draws edges at a fixed width on screen, with the new dash lengths (reference 6 on 5 off, derived round dots 5 apart). Edit boards keep their widths (2 px at rest, 3 px selected), but those widths now hold at every zoom. Edges in all 224 board stories therefore change pixels at any zoom other than 1. No play reads a width or a dash length.
3. Everything else is optional and defaults to today's behaviour: new props, new data fields, the dialog size, the icon, the heading level.

No ADR: the decisions here sit inside ADR 0004 (React Flow for the canvas). A component contract change is recorded by its impact list. The architecture does not change.

## Contract: tokens

Build with `pnpm --filter @orivilo/design-system tokens`; commit `src/tokens/generated.css`. Dimension tokens carry one value for both modes. The `edge` group is locked against profile override, so no profile file changes.

### Primitives (`src/tokens/source/primitives.json`)

| Token             | CSS variable           | Before                  | After               | Why                                                |
| ----------------- | ---------------------- | ----------------------- | ------------------- | -------------------------------------------------- |
| `size.0-375`      | `--op-size-0-375`      | none                    | `1.5px` (dimension) | Present edge width, design §5                      |
| `size.0-625`      | `--op-size-0-625`      | none                    | `2.5px` (dimension) | Present selected and chain width, derived dot size |
| `dash.dashed-on`  | `--op-dash-dashed-on`  | none                    | `6px` (dimension)   | Reference dash, design §5                          |
| `dash.dashed-off` | `--op-dash-dashed-off` | none                    | `5px` (dimension)   | Reference gap                                      |
| `dash.dotted-on`  | `--op-dash-dotted-on`  | none                    | `0px` (dimension)   | Derived: a round cap on a zero dash draws a dot    |
| `dash.dotted-off` | `--op-dash-dotted-off` | none                    | `5px` (dimension)   | Derived dot pitch                                  |
| `dash.dashed`     | `--op-dash-dashed`     | `8 6` (strokeDasharray) | removed             | No reader after the semantic change                |
| `dash.dotted`     | `--op-dash-dotted`     | `2 5` (strokeDasharray) | removed             | No reader after the semantic change                |
| `dash.solid`      | `--op-dash-solid`      | `none`                  | unchanged           | Input stays solid                                  |

Why lengths and not a pattern string: one `stroke-dasharray` string cannot be multiplied by the zoom in CSS. Two lengths can: `calc(length * var(--_zi, 1))`. Design gap 16 asks for "pairs of lengths".

### Semantic (`src/tokens/source/semantic.json`, group `edge`)

| Token                         | CSS variable                       | Before            | After                                                                            |
| ----------------------------- | ---------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `edge.dash.input`             | `--ds-edge-dash-input`             | `{dash.solid}`    | unchanged                                                                        |
| `edge.dash.reference`         | `--ds-edge-dash-reference`         | `{dash.dashed}`   | removed                                                                          |
| `edge.dash.reference-on`      | `--ds-edge-dash-reference-on`      | none              | `{dash.dashed-on}`, "Reference: dash length, multiplied by the zoom factor"      |
| `edge.dash.reference-off`     | `--ds-edge-dash-reference-off`     | none              | `{dash.dashed-off}`                                                              |
| `edge.dash.derived`           | `--ds-edge-dash-derived`           | `{dash.dotted}`   | removed                                                                          |
| `edge.dash.derived-on`        | `--ds-edge-dash-derived-on`        | none              | `{dash.dotted-on}`, "Derived from: zero dash, round cap, so a dot"               |
| `edge.dash.derived-off`       | `--ds-edge-dash-derived-off`       | none              | `{dash.dotted-off}`                                                              |
| `edge.width`                  | `--ds-edge-width`                  | `{size.0-5}` 2px  | unchanged (edit boards, the port ring, the running ring, the shelf tile ring)    |
| `edge.width-selected`         | `--ds-edge-width-selected`         | `{size.0-75}` 3px | unchanged                                                                        |
| `edge.width-present`          | `--ds-edge-width-present`          | none              | `{size.0-375}` 1.5px, "An edge at rest on a present board, on screen"            |
| `edge.width-present-selected` | `--ds-edge-width-present-selected` | none              | `{size.0-625}` 2.5px, "A selected or chained edge on a present board, on screen" |

The design wants `edge.width` at 1.5 and `edge.width-selected` at 2.5 on present boards. Changing the two existing tokens would also change four other readers: `port.ring-width`, `node.ring-width`, `shelf.tile-ring-width` and the edit boards. So the build needs two more tokens, `edge.width-present` and `edge.width-present-selected`. The derived chain width of 3.5 is computed as `2 x selected - rest` (2 x 2.5 - 1.5), so it needs no token.

No colour token changes. The present edge hues read the existing `port.*` component tokens, and the text kind reads `edge.stroke`. Every pair passes as it stands (see "Contrast pairs"), so no hue gets a new value.

### Component (`src/tokens/source/component.json`)

| Token                             | CSS variable                            | Before                  | After                                                    |
| --------------------------------- | --------------------------------------- | ----------------------- | -------------------------------------------------------- |
| `edge.dash-input`                 | `--cmp-edge-dash-input`                 | `{edge.dash.input}`     | unchanged                                                |
| `edge.dash-reference`             | `--cmp-edge-dash-reference`             | `{edge.dash.reference}` | removed                                                  |
| `edge.dash-reference-on` / `-off` | `--cmp-edge-dash-reference-on` / `-off` | none                    | `{edge.dash.reference-on}` / `{edge.dash.reference-off}` |
| `edge.dash-derived`               | `--cmp-edge-dash-derived`               | `{edge.dash.derived}`   | removed                                                  |
| `edge.dash-derived-on` / `-off`   | `--cmp-edge-dash-derived-on` / `-off`   | none                    | `{edge.dash.derived-on}` / `{edge.dash.derived-off}`     |
| `edge.width-present`              | `--cmp-edge-width-present`              | none                    | `{edge.width-present}`                                   |
| `edge.width-present-selected`     | `--cmp-edge-width-present-selected`     | none                    | `{edge.width-present-selected}`                          |
| `node.padding-media`              | `--cmp-node-padding-media`              | none                    | `{space.inset.sm}` 8px (design gap 14)                   |

No other token is added. Gap 15 asks for no new token: the ground reads `surface.canvas`, `border.subtle` and `shape.container`. The dot pitch is the existing `space.grid-gap` (see "Recipes", ground).

## Contract: components

Types follow the file's own style: `graph.ts` writes `field?: T`, and component props write `prop?: T | undefined`.

### `graph.ts` (node and edge data)

| Field                                       | Type                                     | Default                 | Behaviour                                                                                                                                                                                                                                                      | Accessibility                                                                                                                                                                                             | Unchanged                                                                         |
| ------------------------------------------- | ---------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `NodeContent.open`                          | `{ count: number }` (integer, 1 or more) | absent                  | The node opens something. The title row ends with the pages word (`node.pages`, "{count} pages") and `OpenIcon` in both looks. The card shows `cursor: zoom-in`. It enables `onNodeOpen` (below).                                                              | The board sets `aria-haspopup="dialog"` through React Flow's `domAttributes`, and names the node `graph.nodeOpenLabel` ("{title}, {count} pages" / "{title} {count} หน้า") in place of `graph.nodeLabel`. | A node without `open` keeps its name "{title}, {kind}" and has no popup attribute |
| `NodeContent.pad`                           | `"text" \| "media"`                      | `"text"`                | Written as `data-pad`. On a present board, `text` pads 16 (`--cmp-node-padding`) and `media` pads 8 (`--cmp-node-padding-media`), with media corners at radius 16. Edit boards ignore it.                                                                      | none                                                                                                                                                                                                      | Edit board padding                                                                |
| `NodeContent.source` (build needs one more) | `string`                                 | absent                  | Rendered as `p.ds-node__source`: a pill under the card that shows on hover, selection or keyboard focus. It works in both looks. Why: design §4 puts a source line on every node but gap 14 names no field for it.                                             | The text is in the DOM. The design's hover-or-selection rule also covers `:focus-visible`, so a keyboard user can see the text too.                                                                       | Nodes without it render nothing new                                               |
| `PortSpec.row` (build needs one more)       | `string`                                 | absent                  | On a present board, the port sits at the vertical middle of the body element `[data-port-row="<row>"]` of its node, instead of joining the group centred on the card. Why: the 06 sheets need one port per row (design §4, "06 Design system and 07 Product"). | none                                                                                                                                                                                                      | Ports without `row` keep their group                                              |
| `EdgeContent.label`                         | `false`                                  | absent (the pill shows) | `false` hides the label pill. A stale or invalid edge shows its pill anyway, because the pill carries that state.                                                                                                                                              | The edge's accessible name (`graph.edgeLabel`) is unchanged, and the pill stays `aria-hidden`.                                                                                                            | Every edge today shows its pill                                                   |

The graph types are not persisted. The apps/web grep (see "Impact list") finds no canvas use, so there is no stored graph to migrate. Every new field is optional, so a graph written today stays valid.

### `CanvasBoard`

| Prop         | Type                                  | Default     | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onNodeOpen` | `((id: string) => void) \| undefined` | `undefined` | Called once for a node whose data has `open`, in any of these cases: Enter or Space while the node has focus (in `onKeyDownCapture`, before command routing, with `preventDefault` and `stopPropagation` so neither `node.open` nor the Space pan key runs); on a present board, the first click (`onNodeClick`), where nothing drags; on an edit board, a double click (`onNodeDoubleClick`). A double click on a present board does not call it again, because its first click already did. With no `onNodeOpen`, or on a node without `open`, every key and click does what it does today. On an edit board, `node.open` (the inspector) stays reachable from the node toolbar and the context menu. |

Other board changes, with no new prop:

| Change                                                                                                                                                                                                                                                                                                                                              | Where                                                                                | Applies to                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| The private property `--_zi` (1 / zoom) is written on the `section.ds-board` root with `style.setProperty`. A `useLayoutEffect` writes it once from `useStoreApi().getState().transform[2]`, then from `store.subscribe` on every viewport change. The board does not re-render on zoom.                                                            | `CanvasBoard.tsx`, inner board body (it already sits inside the React Flow provider) | Every board                                              |
| `data-has-selection` on the root when one or more nodes are selected (from `selectedNodeIds`)                                                                                                                                                                                                                                                       | root `section`                                                                       | Every board. The recipe reads it on present boards only. |
| A present board passes no `markerEnd`, because the port glyph at each end shows the direction (the mock draws no arrow). Edit boards keep the arrow.                                                                                                                                                                                                | edges memo, line 390                                                                 | Present boards                                           |
| Present ground: an internal `PresentGround` child replaces `<Background>` on present boards. It reads the zoom with `useStore((s) => s.transform[2])`, so only it re-renders, and passes `gap={GRID_UNIT / zoom}` and `size={1 / zoom}`. The dots then sit 24 px apart on screen at 1 px. Edit boards keep `<Background gap={GRID_UNIT} size={1}>`. | line 1144                                                                            | Present boards                                           |
| An open node gets `ariaLabel` = `nodeOpenLabel(data, locale)` and `domAttributes: { "aria-haspopup": "dialog" }`                                                                                                                                                                                                                                    | nodes memo, line 374                                                                 | Nodes with `open`                                        |

`--_zi` is private on purpose. `recipes.test.ts` checks `var(--name)` with `--[a-z0-9-]+`, so a `--_` name is exempt. The design's `--zi` would fail that check, because no token declares it. If there is no board (an edge outside a board, a static lineup), `var(--_zi, 1)` falls back to 1 and every width and dash is in world units, as today.

### `CanvasNode` (the present look, gap 14)

The present look applies when `board.readOnly` is true, which is how a present board renders. Edit boards keep the header band, the meta row and the port row.

| Part   | Present look                                                                                                                                                                                                                                                                                                                                                                                                                             | Edit look                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Name   | `div.ds-node__label`, placed outside and above the card: the kind glyph (`KIND_ICON`, icon-xs, `aria-hidden`), `span.ds-node__title`, then status and basis when set (the existing `.ds-node__status` and `.ds-node__basis` spans), and for `open` the `span.ds-node__pages` word and `OpenIcon` (`.ds-node__open`, `aria-hidden`). One line that ends in an ellipsis. The kind word is not shown, because the accessible name keeps it. | unchanged header, plus the pages word and `OpenIcon` after the title when `open` is set |
| Card   | One surface: `--cmp-node-bg`, 1 px `--ds-border-subtle`, `--cmp-node-radius`, no header band                                                                                                                                                                                                                                                                                                                                             | unchanged                                                                               |
| Body   | `renderBody`, or the summary, steps, missing and error, as today                                                                                                                                                                                                                                                                                                                                                                         | unchanged                                                                               |
| Ports  | Glyph dots centred on the card edges (see `NodePort`)                                                                                                                                                                                                                                                                                                                                                                                    | unchanged port row                                                                      |
| Source | `p.ds-node__source` under the card                                                                                                                                                                                                                                                                                                                                                                                                       | the same pill                                                                           |

`.ds-node` also carries `data-pad` (the field, `text` when absent) and `data-open` (when `open` is set), in both looks.

The design lets a label run 56 world px into the column gap rather than end in an ellipsis. That is not adopted: 56 is not a token, and the full title is in the accessible name. Labels cut off at the card width.

Row ports: `CanvasNode` measures the `[data-port-row]` elements of its body with one `ResizeObserver` on the card. For each port with `row`, it passes the row's middle (a px offset from the card top) to `NodePort` as its `rowY` prop, which `NodePort` writes on its `li` as the private style property `--_port-y`. It then calls `useUpdateNodeInternals()(id)` so React Flow reads the moved handles. This is a measured layout position, not a design value.

### `NodePort`

| Prop   | Type                  | Default     | Behaviour                                                                                                                                                                       |
| ------ | --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rowY` | `number \| undefined` | `undefined` | The middle of the port's row in px from the card top, measured by `CanvasNode`. Written on the `li` as the private style property `--_port-y`. Without it, no style is written. |

`rowY` is how `--_port-y` reaches the `li`; `NodePort` gains no other public prop.

| Change | Present look                                                                                                                                                                                                                                                         | Edit look |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Glyph  | Centred on the card edge at full opacity in its kind's hue. On a present board the `disabled` state no longer fades its handle (`.ds-port__handle`, where the fade sits): the design draws every dot in its locked hue, and the name still says it cannot be edited. | unchanged |
| Name   | The existing `span.ds-port__label` becomes a pill (`surface.card`, `border.subtle`, `--ds-shape-round-radius`, `--ds-elevation-overlay`). It shows when the node is hovered, selected or has keyboard focus.                                                         | unchanged |
| Row    | `data-row` on the `li` when `port.row` is set. Its top is `var(--_port-y)`, from `rowY`.                                                                                                                                                                             | ignored   |

The Handle's role, `aria-label` and connectability do not change. The `NodePort.Disabled` and `CanvasNode.ReadOnly` plays (they look for names ending in แก้ไขไม่ได้) still hold.

### `CanvasEdge`

| Attribute                                            | Value                                                                                                        | Use                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `data-kind` on `g.ds-edge`                           | `portOf(board.graph.nodes, { nodeId: source, handleId: sourceHandleId })?.kind`, with `text` as the fallback | Present hue             |
| `data-chain` on `g.ds-edge` and on `.ds-edge__label` | Set when `source` or `target` is in `board.selectedNodeIds`                                                  | Present chain highlight |
| Label                                                | Rendered when `data.label !== false`, or when the edge is stale or invalid                                   | Gap 8                   |

### `CanvasControls` (gap 17)

| Prop       | Type                               | Default   | Behaviour                                                                                                                                                                                            |
| ---------- | ---------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `position` | `"start" \| "center" \| undefined` | `"start"` | `start` is the React Flow Panel at `bottom-left`, as today. `center` puts it at `bottom-center` with no side margin, centred by the recipe (see "Recipes", dock). The panel carries `data-position`. |
| `children` | `ReactNode`                        | none      | Rendered first, then a divider, then the commands.                                                                                                                                                   |

The design names the values `"end" | "center"` with `"end"` as the default. The panel sits bottom-left today, which is the start side in LTR, so the default is named `start`: the name says where the panel already is.

When `position="center"`:

- The toolbar shows only the four viewport commands: `board.zoom-out`, `board.zoom-100` (the percent), `board.zoom-in` and `board.zoom-to-fit`. Design §6 lists exactly these. Every other command keeps its keyboard shortcut on the board. Adding a commands prop instead would invent a prop.
- If the board is read-only, the toolbar's first item is `span.ds-controls__mode` with `m.board.readOnly` ("View only", ดูอย่างเดียว), then a divider. The board's own corner badge `.ds-board__mode` hides (recipe), so the honest label lives in the component and the page cannot lose it. As a result the page drops `orvCanvas.dock.viewOnly`.
- Under 480 px the bar spans the board's flow area (`.ds-board__flow`, inside a present board's 1 px border) less `space.inset-sm` on each side, and `children` scroll in one row. The read-only word becomes visually hidden (still read aloud), and the divider after it hides. Zoom out, the percent and zoom in hide. Fit stays.
- The toolbar keeps `aria-label={m.controls.label}`. The page names its chapter group itself (see "The prototype page").

The status line needs no change: its anchor rule (recipes.css, the `@supports (anchor-name: --a)` block after line 5148) already places it above the controls panel wherever the panel is.

The page renders `<CanvasControls position="center">` as a child of `CanvasBoard` with `chrome={false}`. A `CanvasBoard` with chrome renders its own `CanvasControls` without props. Using `chrome={false}` plus a child adds no board prop. The page loses nothing it uses: the context menu, the command menu and the shortcut sheet are not in its design.

### `Dialog` (gap 18)

| Prop   | Type                                    | Default | Behaviour                                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size` | `"sm" \| "md" \| "viewer" \| undefined` | `"sm"`  | `viewer` drops the `max-w-*` class. The recipe sets width and height to the window less one `space.gutter` on each side, padding `space.inset-md`, gap `space.stack-sm`, no entry animation, and the body as a flex column that fills the height and does not scroll itself. |

At 360 px the viewer is 328 x 728 at a window height of 760. The footer is page content (see "The prototype page"). The close button stays last in the DOM and sits at the top end.

Focus: Radix sends focus into the panel on open and back on close. A viewer has no `DialogTrigger`, so the page passes two handlers through the existing rest props:

- `onOpenAutoFocus`: `preventDefault()`, then focus Next page, or Previous page when it opened on the last page.
- `onCloseAutoFocus`: `preventDefault()`, then `focus({ preventScroll: true })` on the opening node's `.react-flow__node[data-id]` element inside the board. Focus returns to the node and the board does not move.

`Dialog.tsx` itself adds nothing beyond the size.

### `icons.tsx`

`export const OpenIcon = lucide(Maximize2, "OpenIcon");`. `Maximize2` joins the lucide import list. It is used by `CanvasNode` and by nothing else in PR 211.

### `BrandReportScreen` (`examples/brand-report.tsx`, gap 4)

| Prop           | Type                       | Default | Behaviour                                                                                                                                                                                                                    |
| -------------- | -------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headingLevel` | `1 \| 2 \| 3 \| undefined` | `1`     | `PageHeader level={headingLevel}`. Each report section's `SectionHeader` is `headingLevel + 1`, passed to `Block` as a prop. The personality axis heading (today a raw `h3`, line 288) becomes `` `h${headingLevel + 2}` ``. |

The preview passes `3`, not the design's `2`. Radix `Dialog.Title` renders an `h2`, so a page inside the dialog sits one level under it. The canvas frames pass `3` too, though they are `aria-hidden`. apps/web passes nothing and keeps level 1.

Also in `brand-report.tsx`: `Notice` and `ReadingCard` become named exports with unchanged props. They are not added to `examples/index.ts`, so they are not part of the package's examples API. `ANALYSED` and everything it is built from (`PAGE`, `SHEET`, `READ_AT`, `AXES`, `reading()`, `personalityOf`, `NOT_MEASURED`, `PREMIUM_*`) move to `examples/brand-report.fixtures.ts` (gap 11). The stories import them from there.

### `Landing` (`examples/landing.tsx`, build needs one more)

The six static ids (`top`, `hero-title`, `modules`, `modules-title`, `how`, `how-title`) and the three `#` anchors come from one `useId()` prefix. No prop is added. Why: the page renders `Landing` twice at once (the `p-landing` frame and the web tile), and a third time in the preview, so fixed ids would repeat. No test reads those ids (searched across `packages` and `apps`: 0 hits outside `landing.tsx`).

## Recipes

Every value is a `--cmp-*` or `--ds-*` token, or a private `--_*` property defined in the same block. `border-radius` and `box-shadow` must start with `var(` (recipes.test), so computed radii go through a private property.

### Edges, every board (replace lines 2726 to 2760)

```css
.ds-board {
  --_edge-w: var(--cmp-edge-width);
  --_edge-w-selected: var(--cmp-edge-width-selected);
}
.ds-board[data-variant="present"] {
  --_edge-w: var(--cmp-edge-width-present);
  --_edge-w-selected: var(--cmp-edge-width-present-selected);
}
.ds-board .ds-edge__path {
  stroke-width: calc(var(--_edge-w, var(--cmp-edge-width)) * var(--_zi, 1));
}
.ds-edge[data-meaning="reference"] .ds-edge__path {
  stroke-dasharray: calc(var(--cmp-edge-dash-reference-on) * var(--_zi, 1))
    calc(var(--cmp-edge-dash-reference-off) * var(--_zi, 1));
}
.ds-edge[data-meaning="derived"] .ds-edge__path {
  stroke-width: calc(var(--_edge-w-selected, var(--cmp-edge-width-selected)) * var(--_zi, 1));
  stroke-dasharray: calc(var(--cmp-edge-dash-derived-on) * var(--_zi, 1))
    calc(var(--cmp-edge-dash-derived-off) * var(--_zi, 1));
  stroke-linecap: round;
}
.ds-board .react-flow__edge.selected .ds-edge__path,
.ds-board .react-flow__edge:focus-visible .ds-edge__path,
.ds-board .ds-edge[data-selected] .ds-edge__path {
  stroke: var(--cmp-edge-stroke-selected);
  stroke-width: calc(var(--_edge-w-selected, var(--cmp-edge-width-selected)) * var(--_zi, 1));
}
```

Input keeps `--cmp-edge-dash-input` (`none`). The rest stroke, the hover and selected colours and the stale and invalid colours stay as they are.

### Edges, present boards

| Selector                                                                                                                                                                         | Declarations                                                                         | Token source                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ds-board[data-variant="present"] .ds-edge[data-kind="image"]:not([data-selected], [data-stale], [data-invalid]) .ds-edge__path`, and the same for `palette`, `type`, `profile` | `stroke: var(--cmp-port-<kind>)`                                                     | `port.*`; text keeps `--cmp-edge-stroke`. Hover and keyboard focus keep the kind hue: this rule outranks the hover and `:focus-visible` stroke rules, and the focus outline still shows |
| `.ds-board[data-variant="present"][data-has-selection] .ds-edge:not([data-chain])`, `... .ds-edge__label:not([data-chain])`                                                      | `opacity: var(--ds-opacity-disabled)`                                                | `opacity.disabled`                                                                                                                                                                      |
| `.ds-board[data-variant="present"] .ds-edge[data-chain] .ds-edge__path`                                                                                                          | `stroke-width: calc(var(--_edge-w-selected) * var(--_zi, 1))`                        | 2.5 on screen                                                                                                                                                                           |
| `.ds-board[data-variant="present"] .ds-edge[data-chain][data-meaning="derived"] .ds-edge__path`                                                                                  | `stroke-width: calc((2 * var(--_edge-w-selected) - var(--_edge-w)) * var(--_zi, 1))` | 3.5 on screen                                                                                                                                                                           |
| `.ds-board[data-variant="present"] .ds-edge__label`                                                                                                                              | `scale: max(1, var(--_zi, 1))`                                                       | The pill stays readable when zoomed out (the mock's `--ls`). The inline `transform` stays the translate.                                                                                |

### Ground, present boards (gap 15)

| Selector                            | Declarations                                                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ds-board[data-variant="present"]` | `background: var(--ds-surface-canvas); border: 1px solid var(--ds-border-subtle); border-radius: var(--ds-shape-container-radius); --xy-background-color: var(--ds-surface-canvas); --xy-background-pattern-color: var(--ds-border-subtle);` |

Dot pitch: the design asks for 28 screen px and also for no new token. 28 is not on the space scale, so the ground uses `space.grid-gap` (24, the board's `GRID_UNIT`) at a fixed screen pitch. That gives a calm, sparse ground with no new value. Edit boards keep `surface.board` and `canvas.grid`.

### Node, present boards (gap 14)

| Selector                                                                                                    | Declarations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:where(.ds-board[data-variant="present"]) .ds-node`                                                        | `--_ls: max(1, var(--_zi, 1)); border: 1px solid var(--ds-border-subtle); background: var(--cmp-node-bg); border-radius: var(--cmp-node-radius); padding: var(--cmp-node-padding); overflow: visible;`                                                                                                                                                                                                                                                                                                                                                          |
| `... .ds-node[data-pad="media"]`                                                                            | `--_media-radius: calc(var(--cmp-node-radius) - var(--cmp-node-padding-media)); padding: var(--cmp-node-padding-media);`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `... .ds-node[data-pad="media"] .ds-node__media` (a slot class the page puts on its image or frame)         | `border-radius: var(--_media-radius); overflow: hidden;`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.ds-board[data-variant="present"] .ds-node__body`                                                          | `padding: 0;`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `.ds-board[data-variant="present"] .ds-node__steps`, `... .ds-node__error`                                  | `padding-inline: 0;`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `.ds-board[data-variant="present"] .ds-node__missing`                                                       | `margin-inline: 0;` (with the three rows above, the card's one padding is the only inset)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.ds-node__label`                                                                                           | `position: absolute; inset-inline-start: 0; bottom: calc(100% + 1px);` (the card's own 1 px hairline lies between the padding box the label is placed against and the card's top); inline-size: calc(100% / var(--_ls)); scale: var(--_ls); transform-origin: 0 100%; display: flex; align-items: center; gap: var(--ds-space-inline-sm); padding-block-end: var(--ds-space-inline-sm); color: var(--ds-text-secondary);`plus the`type.label-sm`family, size, line height and weight; the title`white-space: nowrap; overflow: hidden; text-overflow: ellipsis` |
| `.ds-node__label > svg:first-child`, `.ds-node__open`                                                       | `inline-size: var(--ds-size-icon-xs); block-size: var(--ds-size-icon-xs); color: var(--ds-text-tertiary)`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.ds-node__pages`                                                                                           | `color: var(--ds-text-tertiary)` plus `type.body-xs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `.ds-board[data-variant="present"] .react-flow__node:is(:hover, .selected, :focus-visible) .ds-node__label` | `color: var(--ds-text-primary)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `:where(.ds-board[data-variant="present"] .react-flow__node:hover) .ds-node`                                | `border-color: var(--cmp-node-border-hover)` (the existing hover rule is `:not([data-readonly])`, so the present look needs its own)                                                                                                                                                                                                                                                                                                                                                                                                                            |
| selected                                                                                                    | the existing rule: border and 1 px inner outline at offset -2 in `--cmp-node-border-selected`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| focus                                                                                                       | the existing focus line and halo, unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `.ds-node[data-open]` (written when `open` is set)                                                          | `cursor: zoom-in`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `.ds-node__source`                                                                                          | `position: absolute; inset-inline-start: 0; top: calc(100% + var(--ds-space-inline-sm)); padding: var(--ds-space-inline-sm) var(--ds-space-inline-md); border: 1px solid var(--ds-border-subtle); border-radius: var(--ds-shape-round-radius); background: var(--ds-surface-card); box-shadow: var(--ds-elevation-overlay); color: var(--ds-text-secondary); font-family: var(--ds-font-mono);` plus `type.body-xs` size and line height; `visibility: hidden`, and `visible` under `.react-flow__node:is(:hover, .selected, :focus-visible)`                   |

The card rule and the hover rule sit in `:where(...)`, which adds no specificity, so the existing selected, error, running, empty and note state rules keep winning over the present card. As plain rules, the present `border` shorthand beat the selected border.

### Ports, present boards

| Selector                                               | Declarations                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ds-board[data-variant="present"] .ds-node__ports`    | `position: absolute; inset: 0; margin: 0; padding: 0; border: 0; pointer-events: none;`                                                                                                                                                                                                                               |
| `... .ds-node__port-list`                              | `position: absolute; inset-block: 0; display: flex; flex-direction: column; justify-content: center; gap: calc(var(--ds-space-grid-gap) - var(--ds-size-port));` and `inset-inline-start: calc(var(--ds-size-port) / -2)` for `[data-direction="input"]`, `inset-inline-end` for output (a 24 pitch: 16 glyph plus 8) |
| `... .ds-port[data-row]`                               | `position: absolute; top: var(--_port-y); translate: 0 -50%;`                                                                                                                                                                                                                                                         |
| `... .ds-port[data-state="disabled"] .ds-port__handle` | `opacity: 1` (the edit-board fade sits on the handle, not on the `li`)                                                                                                                                                                                                                                                |
| `... .ds-port__label`                                  | the pill (`--ds-surface-card`, `--ds-border-subtle`, `--ds-shape-round-radius`, `--ds-elevation-overlay`, `--ds-text-secondary`, `type.body-xs`), placed outside the edge, `visibility: hidden`; `visible` under the node's hover, `.selected` or `:focus-visible`                                                    |

### Levels of detail (gap 19, the page writes `data-lod`)

| Selector                                                                                 | Declarations         |
| ---------------------------------------------------------------------------------------- | -------------------- |
| `.ds-board[data-lod="far"] .ds-node__label`, `.ds-board[data-lod="far"] .ds-edge__label` | `visibility: hidden` |
| `.ds-board[data-lod="mid"] .ds-node__pages`                                              | `display: none`      |

### Dock (gap 17) and the current chapter (gap 9)

| Selector                                                                                                                   | Declarations                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ds-board .react-flow__panel.ds-controls[data-position="center"]`                                                         | `flex-wrap: nowrap; margin-inline: 0; transform: translateX(-50%);` and the existing block margin and max width. React Flow's `bottom-center` panel shifts by `translateX(-15px) translateX(-50%)` for a 15 px side margin, so the existing side margin left the dock 15 px off centre (measured) |
| `.ds-controls__mode`                                                                                                       | `padding-inline: var(--ds-space-inline-md); color: var(--ds-text-secondary); white-space: nowrap;` plus `type.label-sm`. It reuses `text.secondary` on `toolbar.bg`, the pair already proven for the status line, not the mock's `text.tertiary`                                                  |
| `.ds-controls__children` (the wrapper around `children`)                                                                   | `display: flex; gap: var(--ds-space-inline-sm); min-inline-size: 0; overflow-x: auto; scrollbar-width: none;`                                                                                                                                                                                     |
| `.ds-board:has(.ds-controls[data-position="center"]) .ds-board__mode`                                                      | `display: none`                                                                                                                                                                                                                                                                                   |
| `@media (width < 480px)`: `.ds-controls[data-position="center"]`                                                           | `inline-size: calc(100% - 2 * var(--ds-space-inset-sm)); max-inline-size: none; margin-block: var(--ds-space-inset-sm);` (the side margin stays 0, so the bar is the flow area less 16, centred by the transform)                                                                                 |
| same media: `.ds-controls__mode`                                                                                           | visually hidden (the clip pattern the recipes already use for `[data-loading] .ds-board__status`), still in the accessibility tree                                                                                                                                                                |
| same media: `.ds-controls__mode + .ds-controls__divider`                                                                   | `display: none` (the divider is decoration)                                                                                                                                                                                                                                                       |
| same media: `[data-command="board.zoom-out"]`, `.ds-controls__zoom`, `[data-command="board.zoom-in"]` inside a centre dock | `display: none`                                                                                                                                                                                                                                                                                   |
| `.ds-button[data-variant="ghost"][aria-current="true"]`                                                                    | `background: var(--ds-selection-bg); color: var(--ds-selection-fg);`                                                                                                                                                                                                                              |

### Dialog viewer (gap 18)

| Selector                                                | Declarations                                                                                                                                                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ds-dialog[data-size="viewer"]`                        | `inline-size: calc(100% - 2 * var(--ds-space-gutter)); block-size: calc(100% - 2 * var(--ds-space-gutter)); max-inline-size: none; max-block-size: none; padding: var(--ds-space-inset-md); gap: var(--ds-space-stack-sm); animation: none;` |
| `.ds-dialog[data-size="viewer"] .ds-dialog__body`       | `display: flex; flex-direction: column; overflow: hidden;` (the page's ScrollArea scrolls, not the body)                                                                                                                                     |
| `.ds-dialog[data-size="viewer"] .ds-dialog__footer > *` | `flex: 1 1 auto` (the page's footer grid takes the whole row at every width)                                                                                                                                                                 |

### Pairs (`src/recipes/pairs.ts`)

| Recipe   | Slot                                                               | fg                                                                                                     | bg                  | Floor |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------- | ----- |
| node     | present label                                                      | `ds:text.secondary`                                                                                    | `ds:surface.canvas` | text  |
| node     | present label, hover or selected                                   | `ds:text.primary`                                                                                      | `ds:surface.canvas` | text  |
| node     | present page count                                                 | `ds:text.tertiary`                                                                                     | `ds:surface.canvas` | text  |
| node     | present selected edge                                              | `node.border-selected`                                                                                 | `ds:surface.canvas` | UI    |
| node     | source pill                                                        | `ds:text.secondary`                                                                                    | `ds:surface.card`   | text  |
| port     | text, image, palette, type, profile on the present ground (5 rows) | `port.<kind>`                                                                                          | `ds:surface.canvas` | UI    |
| port     | name pill                                                          | `ds:text.secondary`                                                                                    | `ds:surface.card`   | text  |
| edge     | present rest, hover, selected, invalid, stale (5 rows)             | `edge.stroke`, `edge.stroke-hover`, `edge.stroke-selected`, `edge.stroke-invalid`, `edge.stroke-stale` | `ds:surface.canvas` | UI    |
| edge     | present kind hue, image, palette, type, profile (4 rows)           | `port.<kind>`                                                                                          | `ds:surface.canvas` | UI    |
| controls | read-only word                                                     | `ds:text.secondary`                                                                                    | `toolbar.bg`        | text  |
| button   | ghost current                                                      | `ds:selection.fg`                                                                                      | `ds:selection.bg`   | text  |

That is 22 rows (5 node, 6 port, 9 edge, 1 controls, 1 button): step 1 adds 15 (5 port, 9 edge, the node present selected edge), step 2 the other 7. In `src/tokens/contrast-pairs.ts`, the port rule (line 120) and the edge rule (line 133) gain `"surface.canvas"` in `on`. That adds 11 semantic pairs: 5 port hues plus 5 edge strokes plus `canvas.selection`. `pnpm contrast` should then print 112 pairs (from 101); the builder reports the real line.

## Contrast pairs

Floors: text 4.5, UI 3.0. Measured under every set of `CONTRAST_SETS` (neutral, professional, friendly, orivilo), in both modes, with the package's own `contrastRatio`. Script: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-274-tech-1/measure-pairs.ts`, run as `node <script> "$PWD"` from `packages/design-system`. Output, 184 rows, 0 under the floor: `/private/tmp/claude-501/-Users-tawatchaipetkaew-My-Work-NOXIOUS-ORIVILO/1a700de3-9f5f-41df-9e15-cdbbfd48f205/scratchpad/orv-274-tech-1/measure-pairs.out`. Values are neutral / professional / friendly / orivilo.

| Pair                                                                 | Floor | Light                     | Dark                      |
| -------------------------------------------------------------------- | ----- | ------------------------- | ------------------------- |
| `edge.stroke` on `surface.canvas`                                    | 3.0   | 6.1 / 6.3 / 6.3 / 6.1     | 7.6 / 7.1 / 7.0 / 7.6     |
| `edge.stroke-hover` on `surface.canvas`                              | 3.0   | 16.4 / 16.9 / 16.8 / 16.4 | 16.0 / 14.8 / 14.7 / 16.0 |
| `edge.stroke-selected` on `surface.canvas`                           | 3.0   | 6.6 / 6.8 / 6.8 / 6.6     | 6.1 / 5.7 / 5.6 / 6.1     |
| `edge.stroke-invalid` on `surface.canvas`                            | 3.0   | 6.0 / 6.1 / 6.1 / 6.0     | 7.6 / 7.0 / 7.0 / 7.6     |
| `edge.stroke-stale` on `surface.canvas`                              | 3.0   | 4.9 / 5.1 / 5.0 / 4.9     | 8.5 / 7.9 / 7.9 / 8.5     |
| `canvas.selection` on `surface.canvas`                               | 3.0   | 6.6 / 6.8 / 6.8 / 6.6     | 6.1 / 5.7 / 5.6 / 6.1     |
| `port.text` on `surface.canvas`                                      | 3.0   | 16.4 / 16.9 / 16.8 / 16.4 | 16.0 / 14.8 / 14.7 / 16.0 |
| `port.image` on `surface.canvas`                                     | 3.0   | 5.0 / 5.1 / 5.1 / 5.0     | 12.2 / 11.3 / 11.3 / 12.2 |
| `port.palette` on `surface.canvas`                                   | 3.0   | 5.7 / 5.9 / 5.9 / 5.7     | 10.3 / 9.5 / 9.5 / 10.3   |
| `port.type` on `surface.canvas`                                      | 3.0   | 7.2 / 7.4 / 7.3 / 7.2     | 9.1 / 8.4 / 8.4 / 9.1     |
| `port.profile` on `surface.canvas`                                   | 3.0   | 4.7 / 4.8 / 4.8 / 4.7     | 10.7 / 9.9 / 9.9 / 10.7   |
| `port.image` on `surface.card`                                       | 3.0   | 5.5 / 5.5 / 5.5 / 5.5     | 11.3 / 8.2 / 8.2 / 11.3   |
| `port.palette` on `surface.card`                                     | 3.0   | 6.3 / 6.3 / 6.3 / 6.3     | 9.5 / 6.9 / 6.9 / 9.5     |
| `port.type` on `surface.card`                                        | 3.0   | 7.9 / 7.9 / 7.9 / 7.9     | 8.4 / 6.1 / 6.1 / 8.4     |
| `port.profile` on `surface.card`                                     | 3.0   | 5.2 / 5.2 / 5.2 / 5.2     | 9.9 / 7.2 / 7.2 / 9.9     |
| `text.primary` on `surface.canvas`                                   | 4.5   | 16.4 / 15.6 / 15.5 / 16.4 | 16.0 / 14.0 / 14.2 / 16.0 |
| `text.secondary` on `surface.canvas`                                 | 4.5   | 6.1 / 5.1 / 5.1 / 6.1     | 7.6 / 9.3 / 9.2 / 7.6     |
| `text.tertiary` on `surface.canvas`                                  | 4.5   | 6.1 / 5.1 / 5.1 / 6.1     | 7.6 / 6.7 / 6.7 / 7.6     |
| `text.secondary` on `surface.card`                                   | 4.5   | 6.8 / 5.5 / 5.5 / 6.8     | 7.0 / 6.8 / 6.8 / 7.0     |
| `text.secondary` on `surface.sunken` (preview captions on the stage) | 4.5   | 6.0 / 4.6 / 4.7 / 6.0     | 8.6 / 11.2 / 11.1 / 8.6   |
| `text.primary` on `surface.raised`                                   | 4.5   | 17.6 / 16.3 / 16.1 / 17.6 | 14.7 / 10.2 / 10.4 / 14.7 |
| `selection.fg` on `selection.bg` (current chapter)                   | 4.5   | 7.5 / 8.6 / 6.5 / 7.5     | 5.1 / 10.2 / 10.3 / 5.1   |
| `focus.ring` on `surface.canvas` (node focus on the ground)          | 3.0   | 6.6 / 11.9 / 3.4 / 6.6    | 6.1 / 9.2 / 8.6 / 6.1     |

The lowest values: `port.profile` on the light ground at 4.7 (UI floor 3.0) and `text.secondary` on the light stage at 4.6 under professional (text floor 4.5). Every hue passes, so none changes. The port and edge values match across profiles because the canvas groups are locked. Only the ground moves with the profile. The committed proof is `pnpm contrast` and `recipes.test.ts` after PR 211; this script is scratch and not committed.

## The prototype page

This part serves spec rows 17 to 36 and 39 to 41 and follows design revision 5.1. Everything in it is page-local: it changes no shared component, token, recipe or pair, so group B of "Impact list" is its whole footprint. Where design.md and these notes disagree on a name or a value, these notes win (ORV-274 comment 10656).

### Files

| File                                                                              | What                                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/design-system/src/examples/orivilo-canvas.data.ts`                      | All content as typed records, plus the pure helpers `graphOf`, `cellBox` and the quad helpers (see "The scene quad helper"). No JSX, no copy strings: copy is message keys, and data (quotes, the brand's own lines, hex, versions, paths, ids) is literal    |
| `packages/design-system/src/examples/orivilo-canvas.tsx`                          | `OriviloCanvas`, the body renderers, `ArtFrame`, `LiveFrame`, `Photo`, the board and book page renderers, the giant mark and construction SVG, the guides, the phone, the chapter, level-of-detail and chapter-title children, the dock children, the preview |
| `packages/design-system/src/examples/orivilo-canvas.stories.tsx`                  | Title `Examples/Prototype: ORIVILO canvas` (id `examples-prototype-orivilo-canvas`), `layout: "fullscreen"`, `globals: { locale: "en" }`. The 17 stories of the design's "For the builder" section                                                            |
| `packages/design-system/src/examples/orivilo-canvas.test.ts`                      | The data, image, quad and art checks (see "Tests")                                                                                                                                                                                                            |
| `packages/design-system/src/examples/index.ts`                                    | `export { OriviloCanvas, type OriviloCanvasProps } from "./orivilo-canvas";`                                                                                                                                                                                  |
| `packages/design-system/src/examples/brand-report.fixtures.ts`                    | `ANALYSED` and what it is built from (gap 11)                                                                                                                                                                                                                 |
| `packages/design-system/src/i18n/messages/th.ts`, `en.ts`                         | The `orvCanvas` group (see "Locale keys")                                                                                                                                                                                                                     |
| `packages/design-system/catalog/coverage.md`                                      | A "Page examples" row: `ORIVILO canvas (ORV-274) \| application \| draft \| examples-prototype-orivilo-canvas`                                                                                                                                                |
| `packages/design-system/.storybook/static/orv-274/<id>.webp` and `<id>.prompt.md` | The seven images and their prompts (see "Images")                                                                                                                                                                                                             |

`OriviloCanvas` props:

| Prop            | Type                                                  | Default      | What                                                                                                  |
| --------------- | ----------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `chapter`       | `ChapterId \| "overview" \| undefined`                | `"overview"` | The view the board opens on. Chapter stories set it                                                   |
| `preview`       | `{ sequence: SequenceId; page: number } \| undefined` | `undefined`  | Opens the preview at a page on mount, for the preview stories                                         |
| `missingImages` | `readonly ImageId[] \| undefined`                     | `[]`         | Renders those images in the missing state, for the `MissingImages` story. A failed load does the same |

### Data shape (`orivilo-canvas.data.ts`)

These types are page-local and not exported from the package. Changing them is a page edit, not a contract change.

```ts
import type { BoardNode, Graph, PortSpec } from "../components/canvas-board/graph";
import type { Messages } from "../i18n/messages/index";

type Copy = Messages["orvCanvas"];
/** A dotted path to a string leaf of `orvCanvas`, such as "direction.people". */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type CopyKey = Leaves<Copy>;

export type ChapterId =
  "brief" | "direction" | "logo" | "colour" | "inUse" | "brandbook" | "system" | "product";
export type SequenceId = "direction" | "logo" | "type" | "palette" | "inUse" | "book" | "pages";
export type ImageId =
  | "brand-hero"
  | "direction-team"
  | "colour-reference"
  | "direction-making"
  | "direction-place"
  | "scene-card"
  | "scene-sign";
export type LiveId = "landing" | "form" | "report";
export type BoardId = "direction" | "inUse";
export type PieceId =
  | "people"
  | "line"
  | "place"
  | "making"
  | "type" // direction board, 5
  | "hero"
  | "icon"
  | "lockup"
  | "phone"
  | "ink"
  | "card"
  | "sign"; // brand in use board, 7
export type PaletteId = "violet" | "violetDark" | "ink" | "canvas" | "lime";

// Geometry: design px of the 1280 x 800 art unless a comment says otherwise.
export interface Size {
  w: number;
  h: number;
}
export interface Box extends Size {
  x: number;
  y: number;
}
export type Pt = readonly [x: number, y: number];
/** Top start, top end, bottom end, bottom start: percent of the image in a record, px of a tile after quadInTile. */
export type Quad = readonly [Pt, Pt, Pt, Pt];

// Colour in the art: token names only, never a colour value (spec row 41).
// A Paint resolves inside a nested DesignProfileBoundary profile="neutral" of its mode.
export type ArtToken =
  | "brand.signature"
  | "surface.canvas"
  | "surface.card"
  | "text.primary"
  | "text.secondary"
  | "text.brand"
  | "border.subtle"
  | "border.strong"
  | "border.control";
export interface Paint {
  token: ArtToken;
  mode: "light" | "dark";
}
export const VIOLET: Paint = { token: "brand.signature", mode: "light" }; // #7A22C7
export const VIOLET_ON_INK: Paint = { token: "brand.signature", mode: "dark" }; // #B07FEE
export const INK: Paint = { token: "surface.canvas", mode: "dark" }; // #16151D
export const PAPER: Paint = { token: "surface.canvas", mode: "light" }; // #F4F4F0

// Art type, gap 20. A line is set at display-lg's size times k, or at a scale style.
export type TypeStyle =
  | "display-md"
  | "heading-lg"
  | "heading-md"
  | "heading-sm"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "body-xs"
  | "code-md"
  | "label-sm"
  | "label-md";
export interface ArtText {
  text: { copy: CopyKey } | { data: string }; // brand lines, samples and numerals are data (copy-1)
  size: { k: number } | { style: TypeStyle }; // k from 0.8 to 5, no token
  leading?: "display" | "numeral" | 1.05; // with k only; Thai text always renders "display"
  family?: "display" | "thai-body"; // default: display-lg's family; "thai-body" is Sarabun
  ink: Paint;
  maxWidth?: number;
}

export type PieceContent =
  | { kind: "photo"; image: ImageId; focus?: Pt } // the treatment comes from the image record
  | {
      kind: "scene";
      image: ImageId;
      face: Size; // the flat face the lockup is laid on, in face units
      surface: Paint; // the polygon of the missing state
      lockup: { width: number; tone: "full" | "one-colour"; mode: "light" | "dark" };
    }
  | { kind: "type"; lines: readonly ArtText[] }
  | { kind: "icon"; side: number; radius: number; mark: number; ground: Paint }
  | { kind: "lockup"; width: number; guides: { dash: number; stroke: number } }
  | {
      kind: "phone";
      width: number;
      ratio: number;
      top: number;
      radius: number;
      bezel: number;
      screenRadius: number;
      screenWidth: number;
    }
  | {
      kind: "ink";
      mark: { size: number; endInset: number; top: number; ring: Paint; dot: Paint };
      lockupSize: number;
      lines: readonly ArtText[];
      action: { label: CopyKey; size: "lg" | "md" };
    };
export interface PieceRecord {
  id: PieceId;
  board: BoardId;
  box: Box; // in-use boxes come from cellBox()
  flood: Paint; // the tile's ground, and the ground of its missing state
  content: PieceContent;
  caption: CopyKey; // the preview footer's title; the art itself carries no caption
  second: CopyKey; // the preview footer's second line
}
export interface BoardRecord {
  id: BoardId;
  pieces: readonly PieceId[]; // 5 and 7, in the preview's order
  badge: CopyKey; // the node card's meta line: `Badge size="sm"`
  line: CopyKey; // and its body-xs line
  note: CopyKey; // the second caption line of preview page 1
}

export type BookPart = "cover" | "logo" | "colour" | "use";
export type BookLayout =
  | "cover"
  | "contents"
  | "opener"
  | "construction"
  | "grounds"
  | "palette"
  | "type"
  | "voice"
  | "applications"
  | "checks";
export type BookArt =
  | { kind: "giant-mark"; size: number; x: number; y: number; ring: Paint; dot: Paint }
  | { kind: "fields"; ratio: readonly number[]; paints: readonly Paint[] }
  | { kind: "photo"; image: ImageId; focus: Pt }
  | {
      kind: "pieces";
      pieces: readonly { piece: PieceId; box: Box; variant?: "violet" | "small" }[];
    };
export interface BookPageRecord {
  n: number; // 1 to 12
  part: BookPart;
  section: CopyKey; // the end of the top furniture row
  layout: BookLayout;
  ground: Paint | readonly Paint[]; // one flood, or the thirds of page 5
  split?: true; // an opener: the ink half (704) carries the furniture, the art fills the rest
  lines: readonly ArtText[]; // every line on the page, in reading order
  art?: BookArt;
  swatches?: readonly PaletteId[]; // page 7 reads PALETTE: data colour inline (gap 3)
}

export type Show =
  | { board: BoardId }
  | { piece: PieceId }
  | { book: number }
  | { live: LiveId }
  | { logo: "mark" | "horizontal" | "onInk" }
  | { type: "latin" | "thai" }
  | { palette: "all" | PaletteId };
export interface PreviewPageRecord {
  show: Show;
  caption: CopyKey;
  second?: CopyKey;
}
export interface SequenceRecord {
  id: SequenceId;
  title: CopyKey;
  description?: CopyKey; // DialogContent description; the direction board's is image.label
  pages: readonly PreviewPageRecord[];
}

export type Treatment = "violet" | "paper" | "photo";
export interface ImageCheck {
  subject: string; // what the checker saw, one sentence
  noText: true;
  noMarks: true | { exactlyOne: true; matchesReference: true }; // the object form on brand-hero only
  licence: string;
  checkedBy: string;
  checkedOn: string; // YYYY-MM-DD
}
export interface ImageRecord {
  id: ImageId;
  file: `/orv-274/${ImageId}.webp`;
  promptFile: `${ImageId}.prompt.md`; // beside the WebP: a byte copy of the v1.prompt.md it was made from
  prompt: string; // the text sent to Codex, word for word
  width: number; // of the WebP
  height: number;
  treatment: Treatment;
  quad?: Quad; // the two scenes only: measured corners, percent of the image
  reference?: string; // brand-hero only: the mark image passed to Codex
  generatedWith: string;
  generatedOn: string;
  termsUrl: string;
  check: ImageCheck;
}

export const CHAPTERS: readonly ChapterRecord[]; // 8, plus the Overview stop: 9
export const NODES: readonly NodeRecord[]; // 31
export const EDGES: readonly EdgeRecord[]; // 40
export const SEQUENCES: readonly SequenceRecord[]; // 7, with 6, 3, 2, 6, 8, 12 and 3 pages (40)
export const BOARDS: Readonly<Record<BoardId, BoardRecord>>; // 2
export const PIECES: readonly PieceRecord[]; // 12: 5 direction, 7 in use
export const BOOK: readonly BookPageRecord[]; // 12
export const BOOK_FRAME: {
  size: Size;
  pad: { top: 36; side: 48; bottom: 30 };
  mark: 20;
  gap: 24;
  inkHalf: 704;
};
export const PALETTE: readonly { id: PaletteId; hex: string; name: CopyKey; role: CopyKey }[]; // 5
export const SHEETS: { base: readonly RowRecord[]; composed: readonly RowRecord[] }; // 5 + 5
export const FRAMES: readonly FrameRecord[]; // 3
export const IMAGES: readonly ImageRecord[]; // 7
export function graphOf(m: Messages): Graph; // NodeRecord to BoardNode, EdgeRecord to BoardEdge
export function cellBox(cell: { col: number; row: number; cols: number; rows: number }): Box;
```

`ChapterRecord`, `PortRecord`, `EdgeRecord`, `RowRecord` and `FrameRecord` keep the fields of the earlier revision of these notes (id, number, title key, anchor and nodes; id, kind, name key and `row`; `n`, from, to, meaning and `label?: false`; the sheet rows; id, story, design width, frame height and start). Two records change:

```ts
export interface NodeRecord {
  id: string;
  chapter: ChapterId;
  kind: BoardNode["data"]["kind"];
  title: CopyKey;
  width: number;
  x: number;
  y: number;
  pad: "text" | "media";
  open?: { sequence: SequenceId; page: number; count?: number }; // count: the sequence's length unless set
  inputs: readonly PortRecord[];
  outputs: readonly PortRecord[];
  source?: string;
  body: BodyRecord;
}
export type BodyRecord =
  | { kind: "rows"; rows: readonly RowRecord[] }
  | { kind: "quote"; quote: string; lang: "th" | "en"; gloss?: CopyKey }
  | { kind: "board"; board: BoardId } // the board as media, then its meta line
  | { kind: "logo"; part: "idea" | "build" | "history" | "mark" }
  | { kind: "type" }
  | { kind: "palette" }
  | { kind: "contrast" }
  | { kind: "demo" }
  | { kind: "book"; part: BookPart } // the stack: the part's first page and two sheet edges
  | { kind: "sheet"; sheet: "base" | "composed" }
  | { kind: "page"; page: LiveId };
```

The book parts set `count`: `bb-cover` opens page 1 with 12, `bb-logo` page 3 with 3, `bb-colour` page 6 with 4, `bb-use` page 10 with 3 (the design's "05 Brandbook" table). Every other result's count is its sequence's length. `graphOf` fills `title`, `PortSpec.label`, `size: "custom"`, `width`, `position`, `pad`, `open: { count }`, `source` and `row`. It returns `satisfies Graph`, so a change to the board types fails the typecheck here first. Edge ids are `e<n>`, and handles are the port ids.

`cellBox` lays the brand in use grid: 5 columns of 246.4 and 3 rows of 776 / 3 (258.67), gutter 12, so `x = col * 258.4`, `y = row * (776 / 3 + 12)`, `w = cols * 246.4 + (cols - 1) * 12`, `h = rows * 776 / 3 + (rows - 1) * 12` (columns and rows from 0).

Why this shape keeps the art free: a piece, a page, a line, an image or a caption is a record, and its words are message keys. Rewording, swapping an image, changing a `k` or reordering pages is a data and copy edit. A new layout or a new piece kind is a renderer edit. None touches a shared component or token, so none needs an impact list.

### The two boards (12 pieces)

Positions, sizes and inks are the design's "Nodes and their data", sections 01 and 04; this table names what each record carries. `k` values are the design's "Visual decisions", type.

| Board     | Piece    | Box at 1280 x 800                      | Flood    | Content                                                                                                                                                                                                                                                                            | Caption / second                 |
| --------- | -------- | -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| direction | `people` | 0, 0, 788, 494                         | `VIOLET` | photo `direction-team`, focus 50, 45                                                                                                                                                                                                                                               | `direction.people` / `violetSub` |
| direction | `line`   | 800, 0, 480, 494                       | `PAPER`  | type: "ให้ไอเดีย / มีตัวตน" (data) at k 1.55, leading display, `text.primary` light; "Give your ideas a world." (data) at display-md, `text.secondary` light                                                                                                                       | `direction.feeling` / `lineSub`  |
| direction | `place`  | 0, 506, 388, 294                       | `PAPER`  | photo `direction-place`                                                                                                                                                                                                                                                            | `direction.place` / `paperSub`   |
| direction | `making` | 400, 506, 388, 294                     | `VIOLET` | photo `direction-making`                                                                                                                                                                                                                                                           | `direction.making` / `violetSub` |
| direction | `type`   | 800, 506, 480, 294                     | `INK`    | type: "Aa กข" (data) at k 2.5, "กข" in `VIOLET_ON_INK`; "Inter, Anuphan, Sarabun" (data) at body-sm, `text.secondary` dark                                                                                                                                                         | `direction.type` / `typeSub`     |
| inUse     | `hero`   | `cellBox` 0, 0, 2 x 2 (504.8 x 529.33) | `VIOLET` | photo `brand-hero`, focus 50, 34; nothing is laid on it                                                                                                                                                                                                                            | `use.hero` / `use.heroSub`       |
| inUse     | `icon`   | 2, 0, 1 x 1                            | `VIOLET` | icon: side 0.52 of the shorter tile side, radius 0.225 of the side, ground `INK`, `Logo kind="mark"` full tone at 0.62, `elevation.overlay`                                                                                                                                        | `use.icon` / `use.drawn`         |
| inUse     | `lockup` | 3, 0, 2 x 1                            | `VIOLET` | lockup: `Logo kind="horizontal" tone="one-colour"` at 0.86 of the tile width in a dark boundary; guides dash 7, stroke 1.6 at the lockup's scale (gap 23)                                                                                                                          | `use.lockup` / `use.drawn`       |
| inUse     | `phone`  | 2, 1, 1 x 2                            | `VIOLET` | phone: width 0.84, height 2.06 x width, top 0.16, radius 0.15, bezel 0.035, screen radius 0.12, frame `INK`, `elevation.overlay`; on the screen `Landing` at 390, light, `inert`                                                                                                   | `use.phone` / `use.phoneSub`     |
| inUse     | `ink`    | 3, 1, 2 x 2                            | `INK`    | ink: giant mark 1.12 x the tile height, end inset 0.62 x height, top -0.2 x height, ring `VIOLET`, dot `VIOLET_ON_INK`; `Logo kind="horizontal"` at 30, inset 40 by 36; "Give your ideas a world." (data) at k 1.2, max width 330; `Button variant="intent" size="lg"` `use.start` | `use.ink` / `use.inkSub`         |
| inUse     | `card`   | 0, 2, 1 x 1                            | `VIOLET` | scene `scene-card`, face 350 x 200, surface `surface.card` light, lockup full tone, light, width 0.56                                                                                                                                                                              | `use.card` / `use.sceneSub`      |
| inUse     | `sign`   | 1, 2, 1 x 1                            | `INK`    | scene `scene-sign`, face 600 x 300, surface `VIOLET`, lockup one colour, dark, width 0.65                                                                                                                                                                                          | `use.sign` / `use.sceneSub`      |

The direction caption keys are under `direction.`, the in use ones under `use.`. `BOARDS.direction` carries `direction.badge`, `direction.noLogo` and `direction.note`; `BOARDS.inUse` carries `use.badge`, `use.noteShort` and `use.note`. Each board says its honest label once: on the node card's meta line and on preview page 1's second caption line (`honest-1`).

### The brandbook (12 pages)

The page frame is `BOOK_FRAME`: 1280 x 800, padding 36, 48 and 30, the furniture rows (the mark at 20 in one colour, `wall.guidelines`, the section at the end; "ORIVILO v1.5" and the two-digit page number as data) in body-sm `text.secondary` of the page's ground. Content and positions are the design's "05 Brandbook" table.

| #   | Part   | Layout         | Ground                   | Art lines and their `k`                                                                                                                | Other                                                                                                                                                                                 |
| --- | ------ | -------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | cover  | `cover`        | `VIOLET`                 | `wall.coverTitle` at k 1.9, leading 1.05 (Thai renders display)                                                                        | lockup one colour at 64; giant mark 980 at 560, -40, ring `INK`, dot `PAPER`                                                                                                          |
| 2   | cover  | `contents`     | `PAPER`                  | `wall.contents` k 1.15; "01", "02", "03" k 3.2 numeral in `VIOLET`; section names display-md; `wall.page` body-md                      | `border.strong` rules                                                                                                                                                                 |
| 3   | logo   | `opener`       | `INK`, split             | "01" k 5 numeral in `VIOLET_ON_INK`; `wall.logo` k 1.3; pages "04", "05" in code-md with `wall.constructionPage`, `wall.onGroundsPage` | art: giant mark 820 in `PAPER` on `VIOLET`, bleeding off the end                                                                                                                      |
| 4   | logo   | `construction` | `PAPER`                  | `wall.constructionPage` heading-lg; the facts (`wall.ringRadius` and the rest); `wall.smallest`                                        | construction at 600 on `surface.card` (gap 2), marks at 96, 48, 24, 16                                                                                                                |
| 5   | logo   | `grounds`      | `VIOLET`, `INK`, `PAPER` | `wall.onViolet`, `wall.onInk`, `wall.onPaper` body-md                                                                                  | the lockup at 64 in each third                                                                                                                                                        |
| 6   | colour | `opener`       | `INK`, split             | "02" k 5; `wall.colourAndType` k 1.3; pages "07", "08", "09"                                                                           | art: fields 2.2 : 1.4 : 5 in `PAPER`, `VIOLET_ON_INK`, `VIOLET`                                                                                                                       |
| 7   | colour | `palette`      | `PAPER`                  | numerals k 1.6 numeral; names heading-md, hex code-md, roles body-sm                                                                   | `swatches`: canvas, ink, violet, violetDark, lime from `PALETTE`, fields 44 : 26 : 18 : 12, the last split 55 : 45                                                                    |
| 8   | colour | `type`         | `PAPER`                  | `wall.typePage` k 1.15; "Aa", "กข", "กข" k 3.4 (Inter, Anuphan, Sarabun); samples heading-md and body-md                               | three columns under `border.subtle` rules                                                                                                                                             |
| 9   | colour | `voice`        | `VIOLET`                 | "ให้ไอเดียมีตัวตน / และไปต่อได้จริง" (data) k 1.9; "Give your ideas a world." k 0.8; `wall.voiceLabel` body-sm; the words display-md   | rule in `currentColor`; text from a dark boundary                                                                                                                                     |
| 10  | use    | `opener`       | `INK`, split             | "03" k 5; `wall.inUse` k 1.3; pages "11", "12"                                                                                         | art: photo `brand-hero`, focus 50, 30                                                                                                                                                 |
| 11  | use    | `applications` | `PAPER`                  | none of its own                                                                                                                        | pieces: `phone` 300 x 638, `sign` and `card` 430 x 313, `icon` at 150 twice (`violet` variant one colour, then ink), `ink` 430 x 313 (`small`: no lockup, tagline k 0.9, `Button` md) |
| 12  | use    | `checks`       | `PAPER`                  | `wall.open` k 1.15; `wall.openLead` body-lg; "01" to "04" k 2.6 numeral in `VIOLET`; the checks display-md                             | `border.strong` rules                                                                                                                                                                 |

Page 7's fields are the palette itself, so they read `PALETTE` (hex as data, inline with a hairline, gap 3), like `c-pal`. Its hex lives in `PALETTE` only, so no art record holds a colour value.

### How a node renders a live component

| Node or piece               | What renders                                                                                                                                                  | How                                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `p-base` Base components    | `Button` (primary, secondary, sm), `Badge` (brand, default, warning, sm), `Field` with `Input size="sm"`, `RadioGroup` with two items, `Alert variant="info"` | Rendered live, at world size, inside one `DesignProfileBoundary profile={BRAND_PROFILES[0]}` with the page's mode. The sheet is `inert`. Each row carries `data-port-row="<row id>"` for its port |
| `p-pat` Composed components | `Card`, `PageHeader level={3}`, `BrandReportScreen access="form" headingLevel={3}` (the form part), `SectionHeader level={3}`, `Notice` and `ReadingCard`     | Each row is a `LiveFrame` at a design width of 656, scaled 0.5 to fill the 328 content width, under the orivilo boundary, `inert`, `aria-hidden`                                                  |
| `p-landing`                 | `Landing`                                                                                                                                                     | `LiveFrame` at 1280, scaled to 464, frame 290 high from the top                                                                                                                                   |
| `p-form`                    | `BrandReportScreen access="form" headingLevel={3}`                                                                                                            | `LiveFrame` at 800, scaled to 464, frame 270 high, starting 48 px down                                                                                                                            |
| `p-report`                  | `BrandReportScreen access="form" view={ANALYSED} headingLevel={3}`                                                                                            | `LiveFrame` at 800, scaled to 464, frame 420 high, starting at `[data-report]` less `space.inset-md` (measured after mount)                                                                       |
| The `phone` piece           | `Landing`                                                                                                                                                     | A `LiveFrame` at 390, light, from the top, scaled to the screen's width inside the drawn phone (it bleeds off the tile's bottom)                                                                  |
| `d-board`, `u-board`        | The board's 5 or 7 pieces                                                                                                                                     | An `ArtFrame` of 1280 x 800 at a width of 542 (the 560 card less its border and the media inset of 8: 0.4234), then the meta line                                                                 |
| `bb-*` parts                | The part's first page (1, 3, 6, 10)                                                                                                                           | An `ArtFrame` at a width of 342 with two sheet edges above it (6 px apart, `surface.card`, hairline)                                                                                              |

`LiveFrame` (page-local) is an outer box of the frame size with `overflow: hidden`, `inert` and `aria-hidden="true"`. Inside it, an inner box is laid out at the design width and moved with `transform: scale(s) translateY(-start)` from origin `0 0`. A transform does not change layout, so the page keeps its design-width layout, and its `@container` queries see the design width. The outer box has a fixed size, so a late mount or a measured start causes no reflow and no node re-measure.

`ArtFrame({ design, width })` (page-local) is the same idea for the art: an outer box of `width` by `width * design.h / design.w`, `inert` and `aria-hidden="true"`, with an inner box of the design size scaled by `width / design.w` from origin `0 0`. A board or a book page is designed at 1280 x 800 and a piece at its own box, so one renderer draws the canvas card, the book stack and the preview stage, and art type scales with the art (spec rows 28 to 30 and 41).

On the canvas, every live tree and every art frame is `inert` and `aria-hidden`. That takes them out of the tab order and the accessibility tree, so the board's keyboard path stays: dock, board, nodes. The art's intent `Button` is a picture of the action in an `inert` subtree, so the page has no live intent action and no second lime. The page's heading outline is its own `PageHeader` (`h1`) only.

### Drawing the art

| Part                             | Build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floods                           | A `Paint` renders as `DesignProfileBoundary profile="neutral" mode={paint.mode}` around a box whose background is the token's utility (`bg-brand-signature`, `bg-surface-canvas`, `bg-surface-card`). Text on a flood nests the boundary whose `text.primary` reads on it (a dark boundary inside `VIOLET` gives paper text). The art keeps its floods in both page modes, as a printed page does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Art type (gap 20)                | `artType(line)` returns the style `{ fontSize: "calc(var(--ds-type-display-lg-font-size) * k)", lineHeight }` with the family and weight of display-lg. `lineHeight` is `var(--ds-type-display-lg-line-height)` for words and for any line with Thai, `var(--ds-type-numeral-lg-line-height)` (1) for Latin numerals, and 1.05 on the cover's Latin title only. Scale lines use the type utilities (`text-display-md` and the rest). No letter-spacing, no uppercase                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Photo treatments (gap 21)        | `Photo({ id, focus })` reads `treatment` from the image record. Container classes: `relative overflow-hidden isolate bg-brand-signature`, inside `DesignProfileBoundary profile="neutral" mode="light"`. Image classes `size-full object-cover`, plus a page-local style constant: violet `{ filter: "grayscale(1) contrast(1.1)", mixBlendMode: "luminosity" }`; paper `{ filter: "grayscale(1) brightness(1.2) contrast(1.15)", mixBlendMode: "screen" }`, then a sibling `<span aria-hidden="true" className="absolute inset-0 bg-surface-canvas mix-blend-multiply" />` after the image. `photo` adds nothing. The filter is a style constant, not Tailwind's filter utilities, because Tailwind composes the filter functions in its own fixed order (grayscale last), which is not the order judged on the real photographs. No `recipes.css` and no `pairs.ts` change (spec default 10) |
| Giant mark, construction (gap 2) | Page-local SVG from the logo geometry with the `ds-logo__ring` and `ds-logo__dot` classes. The ring and the dot sit in two `<g>` elements, each in its own nested boundary, so each takes the `Paint` it names. The construction's lines take `border.subtle`, `border.control` and `text.brand`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Scenes (gap 22)                  | `Photo` fills the tile (cover). A face box of `face.w` by `face.h` holds the real `Logo` at `lockup.width` of the face width, centred, in the lockup's boundary, with `transform: placeOnQuad(quad, face, tile, image)` and `transform-origin: 0 0`. The tile size is the piece's box on a board and its page box on book page 11, so the same record places the lockup on the canvas, the preview and the book                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Guides (gap 23)                  | Page-local SVG behind the lockup: the cap line, the baseline, the mark's box and the word's start and end, `stroke="currentColor"` with the `text-text-secondary` class of the lockup's own dark boundary, `stroke-dasharray` 7 7 and width 1.6 in the lockup's units. Never `opacity.disabled`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Missing image                    | The tile stays its `flood`, with the image id in label-sm and `image.missing` in body-xs at the bottom start corner, inset 20 by 16, in the flood's text colour; no `img`, no dashed frame. A missing scene also draws its surface as an SVG polygon at its quad in `surface`, with the lockup laid on it. On a piece page the placeholder is large, and the second caption line is the image id (data)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### The scene quad helper (gap 22)

Pure functions in `orivilo-canvas.data.ts`, beside `graphOf`, unit-tested in `orivilo-canvas.test.ts` (spec row 40):

```ts
/** The cover crop of an image in a tile: scale s and offset (dx, dy) in tile px. */
export function coverCrop(tile: Size, image: Size): { s: number; dx: number; dy: number };
/** A record's quad, percent of the image, in tile px through the cover crop. */
export function quadInTile(quad: Quad, tile: Size, image: Size): Quad;
/** The homography H = [[a, b, c], [d, e, f], [g, h, 1]] (row major, 9 values) that takes the
 *  face rectangle (0, 0) to (w, h) onto `to`, corners in Quad order. Solved as an 8 x 8 system. */
export function homography(face: Size, to: Quad): readonly number[];
/** The CSS transform of a face-sized box with transform-origin 0 0 in the tile:
 *  `matrix3d(a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1)` (CSS lists columns). */
export function placeOnQuad(quad: Quad, face: Size, tile: Size, image: Size): string;
```

The measured corners (design revision 5.1, "04 Brand in use"), held as `quad` on the image records:

| Image        | Quad (top start, top end, bottom end, bottom start), percent | Face      | Lockup                 |
| ------------ | ------------------------------------------------------------ | --------- | ---------------------- |
| `scene-card` | (21.7, 39.7), (72.7, 31.8), (78.7, 61.5), (27.4, 68.2)       | 350 x 200 | full tone, light, 0.56 |
| `scene-sign` | (16.7, 32.3), (82.8, 24.1), (82.8, 71.2), (16.7, 64.8)       | 600 x 300 | one colour, dark, 0.65 |

Worked example W5 with these corners, through the cover crop of a 1254 x 1254 image, in tile px (computed with `node -e` from the formula of `coverCrop` and `quadInTile`):

| Tile                        | `scene-card`                                                 | `scene-sign`                                               |
| --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Board cell, 246.4 x 776 / 3 | 50.00, 102.69; 181.92, 82.26; 197.44, 159.08; 64.74, 176.41  | 37.06, 83.55; 208.04, 62.34; 208.04, 184.17; 37.06, 167.62 |
| Book page 11, 430 x 313     | 93.31, 112.21; 312.61, 78.24; 338.41, 205.95; 117.82, 234.76 | 71.81, 80.39; 356.04, 45.13; 356.04, 247.66; 71.81, 220.14 |

Every point lies inside its tile. A piece page draws the piece at its own aspect (contain), so its tile is the board cell scaled, and the same percentages hold.

### The preview (gap 18)

| Part           | Build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface        | `Dialog` open state held by the page; `DialogContent size="viewer" title={sequence title} description={sequence description} footer={pager}`, the default close label. Only the direction board's sequence has a description, `image.label`                                                                                                                                                                                                                                                                   |
| Stage          | `div[data-stage]` in the body: `surface.sunken`, radius container, padding `space.inset-lg`, `flex: 1; min-height: 0` (Tailwind layout and token utilities)                                                                                                                                                                                                                                                                                                                                                   |
| Art pages      | An `ArtFrame` at contain size: `width = min(stage width, stage height x design.w / design.h)`, measured with one `ResizeObserver` on the stage. A board or a book page from 1280 x 800; a piece from its own box, so drawn type stays sharp. At 1440 x 900 a board or a page is 1059 x 662 and fills the stage height                                                                                                                                                                                         |
| Other pictures | The logo, type and palette pages, rendered contained (scaled to fit whole, never cropped)                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Landing` page | `LiveFrame` scaled to the stage width (at most 1) inside a `ScrollArea`; `inert`, `aria-hidden`, and the caption says it is view only                                                                                                                                                                                                                                                                                                                                                                         |
| Form page      | `BrandReportScreen access="form" headingLevel={3}`, live, laid out at `min(800, stage width)`, not scaled, so it stays usable at 360. With no `onRead`, a submit only validates, and the caption says it sends nothing                                                                                                                                                                                                                                                                                        |
| Report page    | `BrandReportScreen access="form" view={ANALYSED} headingLevel={3}` in a `ScrollArea`. On mount the viewport scrolls to `[data-report]` less `space.inset-md`, or stays at the top when that element is absent                                                                                                                                                                                                                                                                                                 |
| Footer         | One `div` grid, `grid-cols-1` and `min-[600px]:grid-cols-[1fr_auto_1fr]`: the caption (label-md title, body-xs second line), then the pager centred. The pager is two `Button variant="secondary" size="sm" iconOnly` with `ChevronLeftIcon` and `ChevronRightIcon` (from `../components/icons`) and `orvCanvas.preview.previous` and `next` as names. The count "6 / 12" sits in a `span`, with a visually hidden `aria-live="polite"` span reading `preview.count`. The pager hides for a one-page sequence |
| Keys           | `onKeyDown` on the content: ArrowLeft and ArrowRight page, Home and End jump. Only when the event target is not inside `[data-stage]`, so a live form's arrows and text stay its own                                                                                                                                                                                                                                                                                                                          |
| Focus          | On open, to Next, or to Previous at the last page. When Next disables under focus, focus moves to Previous, and the reverse. On close, back to the node (see "Contract: components", `Dialog`)                                                                                                                                                                                                                                                                                                                |

The seven sequences, in the order of the design's "The whole structure": direction 6 (the board, then `people`, `line`, `place`, `making`, `type`), logo 3, type 2, palette 6, in use 8 (the board, then `hero`, `icon`, `lockup`, `phone`, `ink`, `card`, `sign`), brandbook 12, product pages 3. That is 6, 3, 2, 6, 8, 12 and 3 pages, 40 in all (spec `structure-1`).

Live trees at once: on the canvas, 2 `Landing` (`p-landing`, the `phone` piece) and 3 `BrandReportScreen` (the `p-pat` form row, `p-form`, `p-report`), plus the base sheet and 4 other composed rows. The preview adds the current page's trees (one more `Landing` on the phone piece page and on book page 11) and unmounts them on close or page change. Only the current page renders.

What is deferred: at the default fit view every node is on screen, so viewport-based deferral would save nothing. Instead, the canvas live trees mount in one `startTransition` after the board's first fit. The nodes, edges, frames and art paint first, then the trees fill their reserved boxes. Images take `loading="lazy"` and `decoding="async"`, and the preview's trees mount on open.

### Levels of detail, chapters, titles

- A page-local child inside `CanvasBoard` reads `useViewport().zoom` and writes `data-lod` (`far` under 0.4, `mid` from 0.4 to under 0.7, `near` from 0.7) on the closest `.ds-board`. The recipe rules PR 211 adds read it.
- At `far`, the same child renders the chapter titles through React Flow `ViewportPortal`, at each chapter's anchor card: `label-md`, `text.primary`, with the number in `text.tertiary`, on a `surface.canvas` backing, scaled by `1 / zoom` so they stay fixed on screen.
- The chapter child calls `useReactFlow().fitView({ nodes, padding: 0.08, maxZoom: 1, duration: 0 })` and sets the board `status` to `m.board.jumped`. Overview runs `board.zoom-to-fit`.
- The dock children are a `div role="group" aria-label={orvCanvas.dock.chapters}` holding 9 `Button variant="ghost" size="sm"`, with `aria-current="true"` on the chapter shown.

### Locale keys

The keys of the design's "Copy" section, under `orvCanvas` in `th.ts` (the shape) and `en.ts`, with these changes:

| Key                       | Change                                                                                                                                                                                             | Why                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `open.pages`, `open.name` | Not added, in `orvCanvas` or in `node`. PR 211 adds the catalog keys `node.pages` ("{count} pages" / "{count} หน้า") and `graph.nodeOpenLabel` ("{title}, {count} pages" / "{title} {count} หน้า") | `CanvasNode` and `CanvasBoard` render them. A shared component reads catalog keys, not page keys |
| `dock.viewOnly`           | Not added                                                                                                                                                                                          | `CanvasControls` renders `m.board.readOnly`                                                      |
| `dock.label`              | Not added                                                                                                                                                                                          | The toolbar keeps `m.controls.label`, and the chapters group takes `dock.chapters`               |
| `preview.close`           | Not added                                                                                                                                                                                          | `DialogContent` defaults to `dialog.close`                                                       |
| `image.alt.<id>`          | 7 keys, one per `ImageId`, in both languages                                                                                                                                                       | The image test reads them                                                                        |

The keys the design lists as removed in revision 5 are not added. No string has a middot or an em dash. Ranges use "to" and ถึง.

### Images

Seven images, all made and checked by the main session. The source PNG and its prompt are in the main checkout, untracked; only the copies below are committed.

| Id                 | Source PNG (main checkout root, then this path)                       | px          | Treatment | Used in                    | Record extra                      |
| ------------------ | --------------------------------------------------------------------- | ----------- | --------- | -------------------------- | --------------------------------- |
| `brand-hero`       | `.claude/generated-images/2026-11-17-orv-274-brand-hero/v1.png`       | 1086 x 1448 | `photo`   | `hero` piece; book page 10 | `reference`, the object `noMarks` |
| `direction-team`   | `.claude/generated-images/2026-11-17-orv-274-direction-team/v1.png`   | 1448 x 1086 | `violet`  | `people` piece             | none                              |
| `colour-reference` | `.claude/generated-images/2026-11-17-orv-274-colour-reference/v1.png` | 1448 x 1086 | `photo`   | `c-demo`                   | none                              |
| `direction-making` | `.claude/generated-images/2026-11-17-orv-274-direction-making/v1.png` | 1448 x 1086 | `violet`  | `making` piece             | none                              |
| `direction-place`  | `.claude/generated-images/2026-11-17-orv-274-direction-place/v1.png`  | 1448 x 1086 | `paper`   | `place` piece              | none                              |
| `scene-card`       | `.claude/generated-images/2026-11-17-orv-274-scene-card/v1.png`       | 1254 x 1254 | `photo`   | `card` piece; book page 11 | `quad`                            |
| `scene-sign`       | `.claude/generated-images/2026-11-17-orv-274-scene-sign/v1.png`       | 1254 x 1254 | `photo`   | `sign` piece; book page 11 | `quad`                            |

The main checkout root is `/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO`. Each folder also holds `v1.prompt.md`, the prompt the image was made from. Pixel sizes were read from the PNG files.

| Item        | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Folder      | `packages/design-system/.storybook/static/orv-274/`. Storybook serves `staticDirs: ["./static"]` at `/`, in `storybook dev`, in `storybook build` and in the Vitest browser project (the addon's `configureServer` mounts the same dirs). The package `exports` do not include `.storybook`, so no app ships them                                                                                                                                                                                                                                                                                                                                                                            |
| URL         | Root-absolute `/orv-274/<id>.webp`. The relative `./` form breaks in the Vitest runner, whose page is not at the Storybook root. The Storybook deploy is served from its domain root                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Format      | WebP, quality 82, with sharp from the installed tree. The longest side is 1448, so nothing is resized (cap 1600). Each file must be 400 KB or less; if one is larger, lower its quality in steps of 4 and name the quality in the commit body                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Prompt file | `<id>.prompt.md`, a byte copy of the folder's `v1.prompt.md`. The three kept files carry a header and the prompt in a `text` fence; the four new ones are the bare prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Record      | `prompt` is the text sent to Codex, word for word: the body of the `text` fence where the file has one, else the whole file without its final newline. `generatedWith`: "Codex CLI, built-in image generation". `generatedOn`: "2026-11-17". `termsUrl`: "https://openai.com/policies/terms-of-use/". `check`: `noText: true`; `noMarks: true`, or on `brand-hero` the object form with `reference: "orivilo-mark-on-ink.svg.png, the real mark rendered from its SVG"`; `licence`: "AI image made with Codex from the prompt beside it; for this demo only"; `checkedBy`: "main session, ORV-274 comment 10653"; `checkedOn`: "2026-11-17"; `subject`: one sentence of what the image shows |
| Missing     | All seven exist, so no record is missing. The missing state shows for a failed load (`onError`) and for the ids in `missingImages`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Never       | `.claude/generated-images` is untracked and is never a runtime path. Only the copied WebP files are referenced                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

Copy and convert, from the worktree root after `pnpm install` (the worktree has no `node_modules` until then):

```sh
SRC="/Users/tawatchaipetkaew/My Work/NOXIOUS/ORIVILO/.claude/generated-images"
DST="packages/design-system/.storybook/static/orv-274"
SHARP="$PWD/node_modules/.pnpm/node_modules/sharp"
mkdir -p "$DST"
for id in brand-hero direction-team colour-reference direction-making direction-place scene-card scene-sign; do
  node -e 'require(process.argv[1])(process.argv[2]).webp({ quality: 82 }).toFile(process.argv[3]).then((i) => console.log(process.argv[3], i.width, i.height, i.size))' \
    "$SHARP" "$SRC/2026-11-17-orv-274-$id/v1.png" "$DST/$id.webp"
  cp "$SRC/2026-11-17-orv-274-$id/v1.prompt.md" "$DST/$id.prompt.md"
done
```

Each line it prints gives the path, the width, the height and the bytes; the width and height go into the record. sharp 0.35.5 is installed as `node_modules/.pnpm/node_modules/sharp` (checked in the main checkout, where it loads and lists `webp`).

### Tab icon and brand SVGs

These ship in PR 211 (spec rows 37 and 38), not with the page.

| Item                                                  | Change                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/logo/assets.ts`                       | A fifth `LogoAssetFile`: `{ path: "packages/design-system/.storybook/static/favicon.svg", bytes: utf8(faviconSvg(set, geometry)) }`. These are the same bytes as `apps/web/app/icon1.svg`: the mark at 16, light and dark through the media query                                                        |
| Storybook file that points to it                      | `packages/design-system/.storybook/main.ts`, `staticDirs: ["./static"]`, unchanged. Storybook's common preset serves `<static dir>/favicon.svg` as the tab icon for a static dir mounted at `/` (`storybook/dist/core-server/presets/common-preset.js`, the `favicon` preset). `manager.ts` is unchanged |
| `scripts/build-logo-assets.ts`                        | No code change: it writes every file `logoAssetFiles()` returns. Run `pnpm --filter @orivilo/design-system logo-assets`                                                                                                                                                                                  |
| `docs/context/brand/assets/orivilo-mark.svg` line 3   | `fill="#D9F66F"` becomes `fill="#7A22C7"` (`violet.600`, the signature)                                                                                                                                                                                                                                  |
| `docs/context/brand/assets/orivilo-lockup.svg` line 4 | `fill="#D9F66F"` becomes `fill="#7A22C7"`                                                                                                                                                                                                                                                                |

`logo.test.ts` ignores colours in those files (its own header says so), so it does not change.

## Impact list

Counts are files and stories at base 1ef5afd. "Change" means the rendered output or the code changes; the reason is given each time.

### A. Files changed by PR 211 (43)

| #        | File                                                                                                                                                                            | Change                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1        | `src/tokens/source/primitives.json`                                                                                                                                             | 6 tokens added, 2 removed                                                                    |
| 2        | `src/tokens/source/semantic.json`                                                                                                                                               | 6 added, 2 removed                                                                           |
| 3        | `src/tokens/source/component.json`                                                                                                                                              | 7 added, 2 removed                                                                           |
| 4        | `src/tokens/generated.css`                                                                                                                                                      | rebuilt                                                                                      |
| 5        | `src/tokens/contrast-pairs.ts`                                                                                                                                                  | `surface.canvas` on the port and edge rules                                                  |
| 6        | `src/tokens/canvas.test.ts`                                                                                                                                                     | "edge meanings" builds each pattern from the on and off lengths                              |
| 7        | `src/recipes/recipes.css`                                                                                                                                                       | the rules of "Recipes"                                                                       |
| 8        | `src/recipes/pairs.ts`                                                                                                                                                          | the 22 rows                                                                                  |
| 9        | `src/components/canvas-board/graph.ts`                                                                                                                                          | `open`, `pad`, `source`, `row`, `label`, `nodeOpenLabel()`                                   |
| 10       | `src/components/canvas-board/CanvasBoard.tsx`                                                                                                                                   | `onNodeOpen`, `--_zi`, present ground, no marker on present, `data-has-selection`, open name |
| 11       | `src/components/canvas-node/CanvasNode.tsx`                                                                                                                                     | present look, label, source, row measure                                                     |
| 12       | `src/components/node-port/NodePort.tsx`                                                                                                                                         | the optional `rowY` prop, `data-row`, `--_port-y`                                            |
| 13       | `src/components/canvas-edge/CanvasEdge.tsx`                                                                                                                                     | `data-kind`, `data-chain`, label                                                             |
| 14       | `src/components/canvas-controls/CanvasControls.tsx`                                                                                                                             | `position`, `children`, read-only word                                                       |
| 15       | `src/components/dialog/Dialog.tsx`                                                                                                                                              | `viewer`                                                                                     |
| 16       | `src/components/icons.tsx`                                                                                                                                                      | `OpenIcon`                                                                                   |
| 17, 18   | `src/i18n/messages/th.ts`, `en.ts`                                                                                                                                              | `graph.nodeOpenLabel`, `node.pages`                                                          |
| 19       | `src/foundations/canvas.stories.tsx`                                                                                                                                            | the dash table reads the on and off tokens                                                   |
| 20       | `src/components/logo/assets.ts`                                                                                                                                                 | the favicon file                                                                             |
| 21       | `src/components/logo/assets.test.ts`                                                                                                                                            | `ALL` gains the favicon path; "four files" becomes "five files"                              |
| 22       | `.storybook/static/favicon.svg`                                                                                                                                                 | new, generated                                                                               |
| 23 to 29 | `catalog/application/canvas-board.yaml`, `canvas-node.yaml`, `canvas-edge.yaml`, `node-port.yaml`, `canvas-controls.yaml`, `dialog.yaml`; `catalog/base/button.yaml`            | the new props, fields, looks, states and stories (spec row 14)                               |
| 30 to 36 | `CanvasBoard.stories.tsx`, `CanvasNode.stories.tsx`, `NodePort.stories.tsx`, `CanvasEdge.stories.tsx`, `CanvasControls.stories.tsx`, `Dialog.stories.tsx`, `Button.stories.tsx` | new stories (group D), docstrings, and the plays group C names                               |
| 37       | `DESIGN.md`                                                                                                                                                                     | rows 94, 95, 96, 102, line 122, line 294, change log v1.75 (ORV-275 took v1.74 on `develop`) |
| 38, 39   | `docs/context/brand/assets/orivilo-mark.svg`, `orivilo-lockup.svg`                                                                                                              | dot fill                                                                                     |
| 40 to 42 | `docs/specs/ORV-274/spec.md`, `design.md`, `tech.md`                                                                                                                            | new: the spec, the design and these notes, committed with the first step                     |
| 43       | `src/components/canvas-board/graph.test.ts`                                                                                                                                     | `nodeOpenLabel`: Thai, English, count, fallback                                              |

`catalog/base/button.yaml` gains the state `current` (a ghost Button with `aria-current="true"`), one rule ("ghost with `aria-current="true"` marks the shown item of a set, such as a chapter strip: `selection.bg` and `selection.fg`, never a brand colour") and the stories `GhostCurrent` and `GhostCurrentInEnglish`. No component today renders a ghost Button with `aria-current`: `Card`, `NavItem`, `Breadcrumb` and `TopNavigation` set `aria-current` on their own classes, not on `.ds-button` (grep of `aria-current` in `packages/design-system/src`), so the new rule changes no existing screen.

### B. Files changed by PR 212 (26)

`orivilo-canvas.data.ts`, `orivilo-canvas.tsx`, `orivilo-canvas.stories.tsx`, `orivilo-canvas.test.ts`, `brand-report.fixtures.ts` (5 new); `examples/index.ts`, `brand-report.tsx`, `brand-report.stories.tsx`, `landing.tsx`, `i18n/messages/th.ts`, `en.ts`, `catalog/coverage.md` (7 changed); and in `.storybook/static/orv-274/`, 7 WebP files and 7 prompt files (14 new).

### C. Stories that render a changed component or token (counted)

| Story file                                                                                                                                                                                                                                                           | Stories          | Change              | Reason                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CanvasBoard.stories.tsx`                                                                                                                                                                                                                                            | 37               | change, 37          | Edges fixed on screen and new dashes (`BOARD_EDGES` holds reference and derived edges). `Present` also gets the present look, ground and no arrows, and its play gains the ground check of spec row 7. Plays read no width or dash. `Present` presses Enter on a node without `open`, so it is unchanged |
| `CanvasNode.stories.tsx`                                                                                                                                                                                                                                             | 20               | change, 20          | Edges where present. `ReadOnly` (present) gets the present look, and its play still holds                                                                                                                                                                                                                |
| `CanvasEdge.stories.tsx`                                                                                                                                                                                                                                             | 6                | change, 6           | Dashes and widths. The `Meanings` play compares dash strings (`none`, not `none`, different), which still holds                                                                                                                                                                                          |
| `NodePort.stories.tsx`                                                                                                                                                                                                                                               | 5                | change, 5           | Edges. `Disabled` (present) glyphs no longer fade, its docstring changes, and the play holds. `StatesLineup` is static: no change to its markup, and it has no `.ds-board` zoom, so the fallback is 1                                                                                                    |
| `CanvasControls.stories.tsx`                                                                                                                                                                                                                                         | 5                | change, 5           | Edges. `Present` gets the present look, and its play holds (default `start`)                                                                                                                                                                                                                             |
| `CanvasContextMenu.stories.tsx`                                                                                                                                                                                                                                      | 8                | change, 8           | Edges. `Present` gets the present look                                                                                                                                                                                                                                                                   |
| `CommandMenu.stories.tsx`                                                                                                                                                                                                                                            | 7                | change, 7           | Edges. `Present` gets the present look                                                                                                                                                                                                                                                                   |
| `ShortcutSheet.stories.tsx`                                                                                                                                                                                                                                          | 3                | change, 3           | Edges. `FromControl` (present) gets the present look                                                                                                                                                                                                                                                     |
| `BlockLibrary.stories.tsx` 12, `CanvasChat.stories.tsx` 53, `Inspector.stories.tsx` 12, `LoadingState.stories.tsx` 8, `MiniMap.stories.tsx` 4, `MissingInputsPrompt.stories.tsx` 7, `NodeGroup.stories.tsx` 6, `NodeToolbar.stories.tsx` 5, `TaskBar.stories.tsx` 26 | 133              | change, pixels only | Edit boards: edges fixed on screen at their old widths, with the new dashes. Empty-board stories draw no edge and look the same                                                                                                                                                                          |
| `foundations/canvas.stories.tsx`                                                                                                                                                                                                                                     | 1                | change              | The dash table shows `6px 5px` and `0px 5px`                                                                                                                                                                                                                                                             |
| `Button.stories.tsx`                                                                                                                                                                                                                                                 | 15               | change, 1           | `RecipesAndModes` gains one ghost Button with `aria-current="true"`, so the six cells show the current look; its play (layout only) holds. The other 14 render no `aria-current` and do not change                                                                                                       |
| `Dialog.stories.tsx`                                                                                                                                                                                                                                                 | 9                | no change           | `sm` and `md` are untouched                                                                                                                                                                                                                                                                              |
| `ConfirmDialog.stories.tsx` 26, `Combobox.stories.tsx` 40                                                                                                                                                                                                            | 66               | no change           | They use `DialogContent` `sm` or `md`                                                                                                                                                                                                                                                                    |
| `examples/decision-log.stories.tsx` 9, `members.stories.tsx` 6, `workspace.stories.tsx` 9                                                                                                                                                                            | 24               | no change           | `DialogContent` `sm` or `md`                                                                                                                                                                                                                                                                             |
| `examples/brand-report.stories.tsx`                                                                                                                                                                                                                                  | 32               | no change in output | Fixtures move to the fixtures file, and `headingLevel` defaults to 1                                                                                                                                                                                                                                     |
| `examples/landing.stories.tsx`                                                                                                                                                                                                                                       | 5                | no visible change   | Ids become `useId` values, and the anchors follow                                                                                                                                                                                                                                                        |
| `ScrollArea.stories.tsx`                                                                                                                                                                                                                                             | 3                | no change           | Used by the page, not changed                                                                                                                                                                                                                                                                            |
| `Tabs.stories.tsx`                                                                                                                                                                                                                                                   | 0 of its stories | no change           | Its "2px" assertion (line 134) is the tab indicator (`--cmp-tabs-indicator`), not `edge.width`                                                                                                                                                                                                           |

Totals: 224 board stories change (7 of them present boards with the new look), plus 1 foundations story and 1 Button story. 153 stories that use `Dialog`, `Button`, the examples or `ScrollArea` do not change.

Token readers that do not change: `port.ring-width`, `node.ring-width` and `shelf.tile-ring-width` read `edge.width` and `edge.width-selected`, whose values stay the same. No profile file names an `edge` token (0 hits in `src/profiles`).

### D. New stories

Rule `shared-change-1` asks, for every new state of a changed shared component, Thai and English stories, light and dark, and a matrix of the present look under the three profiles. One pattern meets it in every file:

- The plain story (`Present`, `KindsAndZoom` and so on) renders the Thai fixtures at the toolbar's mode, light by default.
- Its `...InEnglish` twin sets `globals: { locale: "en", mode: "dark" }`, so the pair covers both languages and both modes, and its play checks the English accessible names.
- A `PresentRecipesAndModes` story per canvas file renders the present look through `Matrix`: neutral, professional and friendly, light and dark, six cells. The existing `RecipesAndModes` stories render edit boards and stay as they are, so their plays do not change.

| File                         | New stories                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Count |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `CanvasNode.stories.tsx`     | `Present` (four kinds), `PresentInEnglish`, `PresentStates` (hover, selected, focus, result with `open`, media pad, missing data, source pill), `PresentStatesInEnglish`, `PresentRowPorts`, `PresentRowPortsInEnglish`, `PresentRecipesAndModes` (four kinds, a result, a media node, a selected node)                                                                                                                                                            | 7     |
| `NodePort.stories.tsx`       | `PresentNames` (the pills on hover and selection, spec row 3), `PresentNamesInEnglish`, `PresentRecipesAndModes` (all five kinds on a present board)                                                                                                                                                                                                                                                                                                               | 3     |
| `CanvasEdge.stories.tsx`     | `KindsAndZoom` (four kinds and text by three meanings at zoom 0.25, 1 and 2, measured 1.5 px for input and reference and 2.5 px for derived; an edit board beside it at 2 px, 3 px for derived; spec rows 9 and 10), `KindsAndZoomInEnglish`, `ChainHighlight` (spec row 11), `ChainHighlightInEnglish`, `LabelHidden` (spec row 11), `LabelHiddenInEnglish`, `PresentRecipesAndModes` (the five hues, a chain from a selected node, a hidden label, a stale edge) | 7     |
| `CanvasBoard.stories.tsx`    | `OpenNode` (Enter, Space, the present first click and the edit double click call `onNodeOpen`; edit-board Enter on a node without `open` still runs `node.open`; spec rows 5 and 6), `OpenNodeInEnglish`, `LevelsOfDetail` (spec row 8), `LevelsOfDetailInEnglish`, `PresentRecipesAndModes` (the ground, an open node, one edge per meaning)                                                                                                                      | 5     |
| `CanvasControls.stories.tsx` | `WithChapters` (spec row 12), `WithChaptersInEnglish`, `WithChaptersAt360`, `WithChaptersAt360InEnglish`, `PresentRecipesAndModes` (the centre dock with a chapter strip and one current chapter)                                                                                                                                                                                                                                                                  | 5     |
| `Dialog.stories.tsx`         | `Viewer` (spec row 13), `ViewerInEnglish`, `ViewerAt360`. The viewer is not a present-board look, so it has no matrix story; `InsideProfile` still proves the profile                                                                                                                                                                                                                                                                                              | 3     |
| `Button.stories.tsx`         | `GhostCurrent` (spec rows 12 and 14), `GhostCurrentInEnglish`; and `RecipesAndModes` shows the current ghost in all six cells (group C)                                                                                                                                                                                                                                                                                                                            | 2     |
| PR 211 total                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 32    |
| `orivilo-canvas.stories.tsx` | PR 212: the 17 stories of the design's "For the builder"                                                                                                                                                                                                                                                                                                                                                                                                           | 17    |
| `brand-report.stories.tsx`   | PR 212: `HeadingLevel3`                                                                                                                                                                                                                                                                                                                                                                                                                                            | 1     |

`LevelsOfDetail` renders three present boards stacked, each holding one node with `open: { count: 3 }` and one edge whose label pill shows. A story-local child `LodWriter({ lod })` inside each board writes `data-lod` (`far`, `mid`, `near`) on its closest `.ds-board` in a layout effect, as the page's writer will (spec default 2). `LabelHidden` renders a present board with four edges: `label: false`; `label: false` and stale; `label: false` and invalid; and no `label`. `GhostCurrent` renders three ghost `sm` Buttons in a row, the second with `aria-current="true"`.

### E. App screens

The apps/web grep, run at base 1ef5afd:

```sh
grep -rnE 'CanvasBoard|CanvasNode|CanvasEdge|NodePort|CanvasControls|DialogContent|DialogSize|BrandReportScreen|Landing\b|OpenIcon|edge-dash|edge-width|node-padding|NodeContent|EdgeContent|PortSpec' apps/web --include='*.ts' --include='*.tsx' --include='*.css' --exclude-dir=node_modules --exclude-dir=.next
```

It returned 8 lines in 4 files:

| File                                  | Lines  | Change    | Reason                                                                |
| ------------------------------------- | ------ | --------- | --------------------------------------------------------------------- |
| `apps/web/app/read/page.tsx`          | 2, 55  | no change | `<BrandReportScreen access={access} />`: `headingLevel` defaults to 1 |
| `apps/web/app/read/ReadForm.tsx`      | 4, 77  | no change | Same props, plus one optional prop                                    |
| `apps/web/app/read/ReadForm.test.tsx` | 55, 57 | no change | It wraps the real component with the same props type                  |
| `apps/web/e2e/header.spec.ts`         | 45, 50 | no change | `selectNodeContents`, a false match on "NodeContent"                  |

A second grep for the removed token names (`edge-dash|op-dash|edge-width|edge\.dash`) in `apps` and `packages/intent-engine` returned 0 files. `apps/web/app/icon1.svg` keeps the same bytes, because the favicon generator does not change. apps/web uses `WorkspaceScreen` (Dialog `sm` and `md`) and `Logo`: no change. The ghost `aria-current` rule has no reader in apps/web either (0 hits for `aria-current` in `apps/web/app` and `apps/web/components`).

## Build order

Each step is one builder task: three for each PR, run in order. Each ends green on its commands and with its own commit before the next starts. Every step's commands include `pnpm lint`, `pnpm typecheck` and `pnpm test`; run `pnpm install` first in a fresh worktree. Commit subjects use the Conventional form `feat(ORV-274): ...` (`docs(ORV-274): ...` for a docs-only commit), because commitlint rejects `ORV-274: ...` on a branch commit (the type may not be empty), and body lines are 100 characters or fewer. Spec "Rows per PR": PR 211 is rows 1 to 16, 37 and 38; PR 212 is rows 17 to 36 and 39 to 41.

### PR 211: shared components (branch `feature/ORV-274-concept-prototype`, worktree `.claude/worktrees/orv-274`)

**Step 1: tokens, edges and the ground; the docs.**

- Write set:
  - Docs: `docs/specs/ORV-274/spec.md`, `docs/specs/ORV-274/design.md`, `docs/specs/ORV-274/tech.md` (committed as they stand, unedited).
  - Tokens: `src/tokens/source/primitives.json`, `src/tokens/source/semantic.json`, `src/tokens/source/component.json`, `src/tokens/generated.css`, `src/tokens/contrast-pairs.ts`, `src/tokens/canvas.test.ts`.
  - Recipes: `src/recipes/recipes.css` (edges, ground), `src/recipes/pairs.ts` (port, edge and node rows).
  - Components: `src/components/canvas-board/graph.ts` (`EdgeContent.label`), `src/components/canvas-board/CanvasBoard.tsx` (`--_zi`, `PresentGround`, markers, `data-has-selection`), `src/components/canvas-edge/CanvasEdge.tsx`.
  - Stories: `CanvasEdge.stories.tsx` (its 7 new stories), `CanvasBoard.stories.tsx` (the `Present` play's ground check).
  - Docs and catalog: `src/foundations/canvas.stories.tsx`, `catalog/application/canvas-edge.yaml`, `DESIGN.md` (rows 94, 95, 102).
- Acceptance: at zoom 0.25, 1 and 2, a present input or reference edge's computed `stroke-width` times the zoom is 1.5 (plus or minus 0.01), and a present derived edge's is 2.5. A reference edge's dasharray times the zoom is 6 and 5. Kind hues read from `port.*`. The edit-board edge width times the zoom is 2, and 3 for a derived edge. `LabelHidden` shows 3 pills of 4. The present dot pitch on screen is 24 at zoom 0.5 and 1. `contrast` prints 0 under the floor with 112 pairs.
- Commands: `pnpm --filter @orivilo/design-system tokens`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm contrast`.
- Commits: `feat(ORV-274): edges keep their width on screen, dashes as lengths, calm present ground`, then the docs as `docs(ORV-274): spec, design and tech notes for the ORIVILO canvas prototype`.

**Step 2: the present node, ports, open, levels of detail, dock and current chapter.**

- Write set:
  - Graph and board: `src/components/canvas-board/graph.ts` (`open`, `pad`, `source`, `row`, `nodeOpenLabel`), `src/components/canvas-board/graph.test.ts` (`nodeOpenLabel`: Thai, English, count, fallback), `src/components/canvas-board/CanvasBoard.tsx` (`onNodeOpen`, open name).
  - Node and ports: `src/components/canvas-node/CanvasNode.tsx`, `src/components/node-port/NodePort.tsx` (`rowY`).
  - Controls and icon: `src/components/canvas-controls/CanvasControls.tsx`, `src/components/icons.tsx`.
  - Tokens, recipes and copy: `src/tokens/source/component.json` (`node.padding-media`), `src/tokens/generated.css`, `src/recipes/recipes.css` (node, ports, levels of detail, dock, ghost current), `src/recipes/pairs.ts` (label, pills, controls, button rows), `src/i18n/messages/th.ts`, `src/i18n/messages/en.ts`.
  - Stories: `CanvasNode.stories.tsx` (7), `NodePort.stories.tsx` (3), `CanvasBoard.stories.tsx` (5), `CanvasControls.stories.tsx` (5), `Button.stories.tsx` (2, and the `RecipesAndModes` row).
  - Catalog and docs: `catalog/application/canvas-node.yaml`, `node-port.yaml`, `canvas-board.yaml`, `canvas-controls.yaml`; `catalog/base/button.yaml`; `DESIGN.md` (row 96, line 122, line 294, the change log line for the whole PR; step 2 writes it as v1.74, and it becomes v1.75 when `develop` is taken in after step 3).
- Acceptance: the 22 new stories of these files pass their plays. The seven present stories of group C pass unchanged plays. `check-i18n` passes with the two new keys in both languages. `recipes.test` passes with no raw value. `check-catalog` finds every new story the five entries name.
- Commands: `pnpm --filter @orivilo/design-system tokens`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (includes `tests/check-i18n.test.ts`, `tests/check-copy.test.ts` and `tests/check-catalog.test.ts`), `pnpm contrast`, `pnpm build`.
- Commit: `feat(ORV-274): present node look, port pills, onNodeOpen, centre dock with chapters`.

**Step 3: the viewer dialog, the tab icon, the brand dot.**

- Write set: `src/components/dialog/Dialog.tsx`, `src/components/dialog/Dialog.stories.tsx` (3), `src/recipes/recipes.css` (viewer), `catalog/application/dialog.yaml`, `src/components/logo/assets.ts`, `src/components/logo/assets.test.ts`, `.storybook/static/favicon.svg`, `docs/context/brand/assets/orivilo-mark.svg`, `docs/context/brand/assets/orivilo-lockup.svg`.
- Acceptance: `Viewer` at 1440 is the window less 16 on each side. At 360 it is 328 wide. Focus lands on the story's Next button and returns to its opener. `assets.test` passes with five files. The built Storybook serves `/favicon.svg`. `grep -n -i "D9F66F"` on the two brand SVGs returns nothing.
- Commands: `pnpm --filter @orivilo/design-system logo-assets`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm contrast`, `pnpm build`, then `ls packages/design-system/storybook-static/favicon.svg`.
- Commit: `feat(ORV-274): Dialog viewer size, ORIVILO tab icon in Storybook, violet dot in brand SVGs`.

**After step 3: take `develop` in.** `develop` is merged into the branch before the pull request opens. It carries ORV-275 (the system fonts Inter, Anuphan and Sarabun) and DESIGN.md v1.74, so this pull request's DESIGN.md change log line becomes v1.75. The plays are then rerun with the new fonts (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm contrast`, `pnpm build`).

### PR 212: the page (branch `feature/ORV-274-orivilo-canvas-page`, cut from `develop` after PR 211 merges)

**Step 1: the brand report and Landing changes.**

- Write set: `src/examples/brand-report.tsx`, `src/examples/brand-report.fixtures.ts`, `src/examples/brand-report.stories.tsx` (imports, and a `HeadingLevel3` story checking `h3`, `h4`, `h5`), `src/examples/landing.tsx`.
- Acceptance: the 32 brand report stories are unchanged in output. Two `Landing` trees on one page have no duplicate id. apps/web `ReadForm.test.tsx` passes.
- Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Commit: `feat(ORV-274): BrandReportScreen headingLevel, shared ANALYSED fixture, Landing ids from useId`.

**Step 2: data, copy, the quad helper and the seven images.**

- Write set: `src/examples/orivilo-canvas.data.ts` (records, `graphOf`, `cellBox`, the quad helpers), `src/examples/orivilo-canvas.test.ts`, `src/i18n/messages/th.ts`, `src/i18n/messages/en.ts` (`orvCanvas`), and `.storybook/static/orv-274/` (7 WebP files and 7 prompt files, made by the command in "Images").
- Acceptance: the data, image, quad and art tests of "Tests" pass. Every WebP is 400 KB or less. `check-i18n` and `check-copy` pass.
- Commands: the copy and convert block of "Images", then `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Commit: `feat(ORV-274): ORIVILO canvas data, quad helper, orvCanvas copy, seven demo images`.

**Step 3: the page and its stories.**

- Write set: `src/examples/orivilo-canvas.tsx`, `src/examples/orivilo-canvas.stories.tsx`, `src/examples/index.ts`, `catalog/coverage.md`.
- Acceptance: the plays of "Tests" pass in English and Thai, light and dark, at 1440 and 360. `check-catalog` finds the story id. `pnpm contrast` prints the same 112 pairs as PR 211.
- Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm contrast`, `pnpm build`.
- Commit: `feat(ORV-274): ORIVILO canvas prototype page with live parts, art boards and previews`.

## Tests

### PR 211

| Test                                                | Proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tokens/canvas.test.ts` "edge meanings"             | Three distinct patterns, built from `edge.dash.input` and the on and off pairs; input is `none`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `canvas-board/graph.test.ts` "labels"               | `nodeOpenLabel` names an open node "{title}, {count} pages" in English and "{title} {count} หน้า" in Thai, carries the count, and falls back to `nodeLabel` for a node without `open`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `tokens/tokens.test.ts` (existing stale check)      | `generated.css` matches the source, so the build is deterministic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tokens/contrast-pairs.test.ts` and `pnpm contrast` | The 11 new semantic pairs under 4 sets and 2 modes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `recipes/recipes.test.ts`                           | The 22 new pair rows; no raw radius or shadow (computed radii go through `--_media-radius`); every var is declared or private; `node.padding-media` and the new edge tokens are read by a recipe                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `profiles.test.ts` (existing)                       | No profile overrides the locked `edge` group, so locked values cannot drift per profile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CanvasEdge.KindsAndZoom` play                      | Reads the zoom from the `.react-flow__viewport` transform after `zoomTo(0.25)`, `zoomTo(1)` and `zoomTo(2)`. Each time it asserts `parseFloat(strokeWidth) * zoom` is 1.5 (plus or minus 0.01) for input and reference edges and 2.5 for derived edges (they draw at `edge.width-present-selected`), the reference dasharray times the zoom is `6, 5`, the derived one is `0, 5` with a round cap, and the image edge's stroke equals `--cmp-port-image` (probe element). The edit board's edge width times the zoom is 2, and 3 for a derived edge                                                                            |
| `CanvasEdge.ChainHighlight` play                    | Selecting a node sets `data-chain` on its 2 edges and `data-has-selection` on the board. The other edges compute `opacity` 0.4, and the chained width times the zoom is 2.5                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CanvasEdge.LabelHidden` play                       | 3 `.ds-edge__label` pills for 4 edges: none on the `label: false` edge, one each on the stale and the invalid edge, one on the plain edge. Every edge keeps its accessible name from `graph.edgeLabel`, and every pill stays `aria-hidden`                                                                                                                                                                                                                                                                                                                                                                                     |
| `CanvasNode.PresentStates` play                     | The label is above the card (`label.bottom <= card.top`). The source pill is hidden at rest and visible on selection and on focus. Selected and focused differ in computed outline and box-shadow. A node with `open` has `aria-haspopup="dialog"` and the name "{title}, 3 pages". Media padding is 8                                                                                                                                                                                                                                                                                                                         |
| `CanvasNode.PresentRowPorts` play                   | Each row port's centre is within 1 px of its row's middle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `NodePort.PresentNames` play                        | The port pills are hidden at rest and shown on hover and on selection; each port keeps its catalog accessible name; glyphs compute `opacity` 1 on a present board                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `CanvasBoard.Present` play (changed)                | The ground computes `surface.canvas` with a `border.subtle` edge. The dot pattern's width is 24 (to two decimals) at zoom 0.5 and at 1: with `gap={GRID_UNIT / zoom}` the pattern width is already the on-screen pitch. Edges have no `marker-end`. Its existing assertions hold                                                                                                                                                                                                                                                                                                                                               |
| `CanvasBoard.OpenNode` play                         | `onNodeOpen` is called once for each of Enter, Space, the first click on a present board and a double click on an edit board, on an open node; a single click on an edit board does not call it. It is never called for a node without `open`. On an edit board, Enter on a node without `open` calls `onCommand("node.open")`. Space does not start a pan                                                                                                                                                                                                                                                                     |
| `CanvasBoard.LevelsOfDetail` play                   | Far: every `.ds-node__label` and `.ds-edge__label` computes `visibility: hidden`, and the node keeps its accessible name. Mid: the label is visible, `.ds-node__pages` computes `display: none` and `.ds-node__open` is visible. Near: `.ds-node__pages` is visible                                                                                                                                                                                                                                                                                                                                                            |
| `CanvasControls.WithChapters` play                  | The bar's centre x is within 1 px of the board's; the children come first, then a divider, then the four zoom commands; the read-only word is first                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CanvasControls.WithChaptersAt360` play             | The play resizes the browser to 360 by 640 through `page.viewport` (the `atPhoneSize` pattern of the `EvidenceSpan`, `Select` and `Combobox` stories), because the dock's rule is a viewport media query that a 360 px frame in the 1200 px test iframe never matches; the static Storybook falls back to the toolbar viewport. The bar is the `.ds-board__flow` width less 16 (the present board's 1 px border sits outside the flow area). The zoom steps are hidden, fit is visible, the divider after the read-only word is hidden, the children scroll in one row, and the read-only word is still in the accessible tree |
| `Button.GhostCurrent` play                          | The current ghost Button's computed background and colour equal probes of `--ds-selection-bg` and `--ds-selection-fg`; its neighbours keep the ghost look                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| The `...InEnglish` plays                            | The same assertions as their Thai twin, with the English names ("Logo, 3 pages", "View only"), in dark mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| The `PresentRecipesAndModes` plays                  | Six `[data-matrix-cell]` cells, each holding a `.ds-board[data-variant="present"]` with its fixture rendered (the expected count of nodes, ports, edges or dock buttons per cell), so the a11y addon covers the present look in all six boundaries                                                                                                                                                                                                                                                                                                                                                                             |
| `Dialog.Viewer` and `ViewerAt360` plays             | The panel rect is the window less 2 x 16. Focus goes to the given element on open and back to the opener on close                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tests/check-catalog.test.ts`                       | The seven catalog entries of spec row 14 exist with their stories                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `logo/assets.test.ts`                               | Five files, equal bytes on two generations, the favicon equal to `icon1.svg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### PR 212

| Test                                                          | Spec rows                    | Proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orivilo-canvas.test.ts`, structure                           | 19, 23                       | 31 nodes (by chapter 8, 2, 4, 6, 2, 4, 2, 3; by kind 12 knowledge, 2 direction, 16 artifact, 1 reference) and 40 edges (29 input, 8 reference, 3 derived; exactly one without `label: false`, edge 18). 12 nodes with `open`, and 7 sequences of 6, 3, 2, 6, 8, 12 and 3 pages (40). Each `open.page` lies in its sequence; the book parts open pages 1, 3, 6 and 10 with counts 12, 3, 4 and 3. Every edge joins ports of the same kind and steps right. Every node except `c-demo` has `source`. The world fits 4640 x 2260. No middot or em dash in any string of the module                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `orivilo-canvas.test.ts`, boards and book                     | 28, 29, 30                   | 5 direction and 7 in use pieces; every piece box lies inside 1280 x 800, no two boxes of a board overlap, and neighbours sit exactly 12 apart. 12 book pages numbered 1 to 12, parts cover 1 to 2, logo 3 to 5, colour 6 to 9, use 10 to 12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `orivilo-canvas.test.ts`, images                              | 33                           | `IMAGES` holds exactly the 7 ids. For each: the file exists under `.storybook/static/orv-274/`, its size is 400 KB or less, its RIFF header (a `VP8`, `VP8L` or `VP8X` chunk) gives the recorded width and height, and the longest side is 1600 or less; `<id>.prompt.md` exists and its prompt (the `text` fence body, or the whole file) equals `prompt`; `orvCanvas.image.alt[id]` is non-empty in `th` and `en`; `treatment` is as the "Images" table gives; `check` has a subject, `noText`, a licence, `checkedBy` and an ISO `checkedOn`; `generatedWith`, `generatedOn` and an https `termsUrl` are set. Only `brand-hero` has the object `noMarks` and a `reference`, and its prompt has a line starting "The mark:"; every other prompt has a `Constraints:` line that says "No" and "logos". Only the two scenes have `quad`; each point lies in 0 to 100 and the four corners are convex (the cross products have one sign). Every image is used by a piece, a page or `c-demo`                                                                                                                                                                                                                                                                                    |
| `orivilo-canvas.test.ts`, quad helper                         | 40                           | `homography` maps the face's four corners onto the given quad within 0.01 px, for the card (350 x 200) and the sign (600 x 300) on their tile quads, and for a square onto a known trapezoid. The 16 numbers of `placeOnQuad`, applied as a column-major 4 x 4 to `(x, y, 0, 1)` and divided by w, give the same corners within 0.01 px. `quadInTile` gives the W5 table of "The scene quad helper" within 0.01 for the board cell and book page 11, and every point lies inside its tile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `orivilo-canvas.test.ts`, art                                 | 41                           | Every `ArtText` with `k` has 0.8 <= k <= 5. Every line with Thai text has no `leading` other than `display`. `leading: 1.05` appears on page 1's title only. No string anywhere in `PIECES`, `BOOK` or `BOARDS` matches a colour value (`#` and 3 to 8 hex digits, `rgb(`, `hsl(`, `oklch(`); every paint is a token name (the type checks it)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `graphOf(m)` in the same test                                 | 19                           | Runs twice and gives deep-equal results; `satisfies Graph`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Default` play                                                | 17, 20 to 23, 26, 32, 34, 35 | One `h1`, the description, the dock with "View only". Fit view zoom 0.25 or more, chapter titles shown, node labels hidden, status "Showing the whole board, 31 nodes". No two node rectangles overlap, labels included, and stack gaps are 40 or more. The dock group has 9 buttons; "01 Direction" sets `aria-current="true"` on it only and the status "Jumped to 01 Direction". Tab to `bb-colour`, Enter: the dialog "ORIVILO brandbook v1.5" at "6 / 12", the live region "Page 6 of 12"; Right 7; End 12 with Next disabled and focus on Previous; Home 1; Escape closes and focus is on `bb-colour` with the viewport unchanged. Each result opens its own page with a total equal to its sequence; the scrim closes. No duplicate `id`. Every `LiveFrame` and `ArtFrame` is `inert` and `aria-hidden`; outside them the document has one heading, the `h1`. Each present image's `naturalWidth` equals its record. The product nodes and pages hold zero `img` and `picture` and at least one `.ds-button` each. No text says "AI read", "generated by ORIVILO" or "exported", and no score. The dialog computes `animation-name: none` and no transition; a chapter jump moves the viewport with no transition. No element inside a board or a book page takes focus |
| `InThai` play                                                 | 18, 30, 41                   | `h1` "ORIVILO จากโจทย์ถึงผลิตภัณฑ์", the dock "ดูอย่างเดียว", Thai headings computing the Anuphan family and Thai body Sarabun (from the tokens). It opens `bb-cover` and pages 1 to 12: every furniture row is one line, no art text box leaves its page, and `expectLabelInkWhole` holds on the cover, the openers (3, 6, 10), the voice page and page 12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Dark` play                                                   | 35                           | The a11y addon reports zero violations; a `VIOLET` flood computes the same background as in light (the art keeps its floods)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `At360` play                                                  | 36                           | The frame's `scrollWidth` equals its `clientWidth`; the title wraps; the dock is one row with the chapter strip scrolling and fit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `DirectionChapter` play                                       | 28, 41                       | At 1440 the board renders 5 pieces; no `.ds-logo`, no hex and no swatch inside `d-board`. The violet photographs compute `mix-blend-mode: luminosity` with `filter: grayscale(1) contrast(1.1)`, the paper one `screen` with `grayscale(1) brightness(1.2) contrast(1.15)` and a sibling computing `multiply` on `surface.canvas`. Each art line's computed font size over display-lg's is its `k` within 0.01, and no art box leaves its piece. `expectLabelInkWhole` holds on the Thai line                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `PreviewDirectionBoard` play                                  | 28                           | Opens at "1 / 6" with the board filling the stage height within 2 px and the description `image.label`; pages 2 to 6 show one piece each at its aspect, the caption only in the footer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `InUseChapter` and `PreviewInUseBoard` plays                  | 29                           | 7 pieces; "1 / 8". On the canvas and on the card and sign piece pages, four zero-size markers at the face box's corners read back on screen within 1 px of `quadInTile` plus the tile's origin. Nothing but the `img` sits over the hero. The phone's `Landing` is live and `inert`. Exactly one `.ds-button[data-variant="intent"]` in the board, inside an `inert` subtree. The guides compute the stroke of `text.secondary` in the lockup's dark boundary and `opacity` 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `BrandbookChapter` and `PreviewBrandbook` plays               | 22, 30                       | Four parts of one size, each showing its first page. Paging 1 to 12 in English: each page fills the stage height within 2 px, furniture rows are one line, every mark is `.ds-logo` or SVG with the `ds-logo` classes, page 11's intent Button is inside an `inert` subtree                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `LogoChapter` and `ColourChapter` plays                       | 31                           | The logo preview renders `.ds-logo` live on its 3 pages. The type pages compute the font tokens' families. The palette pages show each swatch's name and hex inside it, with an inline background equal to the `PALETTE` hex and a hairline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DesignSystemChapter` play                                    | 24                           | `p-base` holds the live Button "Read this page", Badge, Field with Input, RadioGroup and Alert; `p-pat` its five rows. Each sheet's closest `[data-design-profile]` is `orivilo`, and the Button's computed `--ds-action-primary` equals a probe in a fresh `orivilo` light boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ProductChapter` and `PreviewProductPages` plays              | 25, 26, 27                   | Three frames, Landing first, each live, `inert` and `aria-hidden`. The report page's `ScrollArea` viewport has `scrollTop` above 0 and `[data-report]` within 24 px of its top. Under the dialog's `h2` title the page heading is `h3` and its sections `h4`; the page still has one `h1`. Typing in the address field or an arrow key in its radio group does not page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `PreviewAt360` play                                           | 36                           | The footer is one column, the panel is 328 wide, and focus is on Next                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `MissingImages` play                                          | 28, 29                       | With all 7 ids missing: zero `img`; each photo tile shows its flood, its id and "This image is not here yet"; each scene shows its polygon with the lockup on it; a piece page's second caption line is the id                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `brand-report.stories.tsx` `HeadingLevel3` and apps/web tests | 27                           | `h3`, `h4` and `h5` at level 3; `ReadForm.test.tsx` passes with the default level 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Quality gate                                                  | 39                           | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass; `pnpm contrast` prints the same 112 pairs as after PR 211                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
