# ADR 0004: React Flow as the behavior layer of the canvas, our own visual layer, commands in one registry

- Status: accepted
- Date: 2026-10-21
- Decided by: GOLF (owner), in the project thread, on the study in `docs/context/canvas-node-study.md`

## Context

The owner set the Studio's UX (brief, "UX vision"): the user fills input blocks on a canvas, filled blocks generate groups, every node carries its own knowledge and asks for what it is missing, and the board can be presented. Dreamina's AI Canvas is the reference for how that feels: an infinite canvas where every result is a node linked to its source, a chat with the engine opened at the cursor whose answers land as nodes, reference nodes mentioned with @, and a task bar that jumps to assets. This needs a node graph with pan, zoom, selection, typed ports, edges, groups, keyboard navigation and a11y. Writing that ourselves is weeks of behavior work with no product value; the question was which base to take.

## Decision

1. **React Flow (`@xyflow/react`, MIT) provides the canvas behavior only.** Viewport, drag, selection, connection, handles, sub flows (groups), keyboard focus and aria descriptions come from it. Every visual value comes from our tokens; React Flow's theme stylesheet is not loaded, only the base style its layout needs. This is the same split as shadcn in ADR 0003: behavior borrowed, visual ours.
2. **The canvas set lives in `packages/design-system`, application tier.** CanvasBoard, CanvasNode (variants input-block, knowledge, artifact, reference, direction, note), NodePort, CanvasEdge (meanings input, reference, derived), NodeGroup, NodeToolbar, BlockLibrary, Inspector, MissingInputsPrompt, CanvasChat, TaskBar, MiniMap, CanvasControls, CompareStrip, VersionBadge, CanvasContextMenu, CommandMenu. Each has a catalog entry today (status planned) and lands with its story and states under the usual gate.
3. **A new result is a new node.** Generation and edits never overwrite a node; they create a node linked to its source so every artifact traces back (AGENTS.md, trace everything). Deleting a node keeps downstream nodes and marks them stale.
4. **Ports are typed and edges have meaning.** A port carries one data kind (text, image, palette, type, profile) shown by shape and icon, not colour alone. An edge is input, reference or derived-from; the three differ by stroke and label.
5. **One command registry.** Every action on the canvas, its shortcut, its scope and the surfaces that show it live in `packages/design-system/catalog/commands/canvas.yaml`. CommandMenu, ContextMenu, NodeToolbar, CanvasControls and the shortcut sheet read it; nothing defines a key elsewhere. `check-commands` keeps ids, labels (Thai and English), scopes and shortcuts consistent and clash-free.
6. **The board is Studio chrome.** It runs the neutral profile. Customer profiles appear only inside preview nodes and the CompareStrip, each under its own `DesignProfileBoundary` (DESIGN.md §9 item 10).
7. **Not chosen.** tldraw (production needs a paid license key; freeform, no port or edge model), Excalidraw (canvas 2D, our components cannot render inside a node), Rete.js (brings an execution engine; ours is the Intent Engine), writing our own (no product value in redoing pan, zoom, selection and a11y).

## Enforcement

- Lint rule from E2-0 applies to the canvas set: no raw colour, radius, shadow or font classes; `.react-flow__*` class overrides are token-only.
- `check-catalog` requires an entry per story; `check-commands` validates the registry; both run in `pnpm test`.
- A canvas PR shows every state listed in its catalog entry as a story, in both modes, and proves keyboard connect, nudge and delete in a browser test.
- Nothing in a node claims AI interpretation, Figma sync or export without an implementation and a test (AGENTS.md rule 4). CanvasChat is labelled rule-based or mock until a real adapter lands (E2-10).

## Consequences

- Epic E4 in `docs/specs/backlog-draft.md` replaces E2-13 and runs after E2-4, because every node is built from Button, Input, Badge, Tooltip and friends.
- Upgrading React Flow is mechanical as long as the behavior and visual split stays strict; the Pro tier is not needed (its examples are not code we depend on).
- Multi-user realtime, a timeline editor and more than about five hundred nodes per board are out of scope for the MVP; each would be a new ADR.
