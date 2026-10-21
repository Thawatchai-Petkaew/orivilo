# Canvas and node components: study

Status: decided (ADR 0004, 2026-10-21). The owner asked for the components a Dreamina-style canvas needs, with reference platforms and open repositories. The long form with screenshots of the zones is the Claude Doc "Canvas and node components" (project thread, 2026-10-21); this file is the durable summary.

## What Dreamina does (from its product pages and guides)

- An infinite canvas is one project. Content nodes: text, image, video, audio, file. A principal node (subject) holds a reference for a character, person, product or object and is reused in generation with @.
- A generation node takes a prompt and a model and produces a new node linked to its inputs. Edits (expand, crop, fuse, enhance, trim, inpaint, upscale) produce new linked nodes; nothing is overwritten.
- Edges mean reference, input and creative dependency, not typed data.
- Left toolbar holds the generation nodes to drag onto the board. Chat with the agent (Octo) opens at the cursor with "/" or in a right sidebar; replies land as nodes. A bottom task bar keeps generation history and jumps to the asset. Groups, rename, search on the board. A timeline editor assembles video.
- Not documented on the pages: keyboard shortcuts, side-by-side comparison, systematic versions, collaboration. Agent and CLI control of nodes is announced as future.

## What the others add

- Krea Nodes: inputs left, parameters inside, outputs right; dragging from a port lists only compatible nodes; edges colour-coded by data type; section nodes, groups and sticky notes; a Node Agent plans before it builds and shows cost per node; an App Builder turns a graph into a 5 to 7 field form.
- Figma Weave (formerly Weavy): workflow to tool mode; pulls Figma components and variables into generation.
- Fuser: cost shown before a run; every prompt and reference stays on the graph; reusable recipes.
- Flora and Magnific Spaces: live cursors, version history, templates; canvases reported to slow as graphs grow.

## Open repositories

| Repo                          | License                                                                         | Use for us                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| xyflow/xyflow (React Flow 12) | MIT                                                                             | Behavior base (ADR 0004): nodes as React components, Background, Controls, MiniMap, Panel, NodeToolbar, NodeResizer, Handle, sub flows, keyboard and aria built in                |
| langflow-ai/langflow          | MIT                                                                             | Reference for nodes with fields inside, a searchable component sidebar, type-validated edges, a playground beside the canvas; uses @xyflow/react, Radix, Tailwind, zustand, elkjs |
| FlowiseAI/Flowise (archived)  | Apache 2.0                                                                      | Simple agent-flow reference on React Flow                                                                                                                                         |
| excalidraw/excalidraw         | MIT                                                                             | Arrow binding, frames, open JSON file format; not a base (canvas 2D)                                                                                                              |
| langgenius/dify               | Apache 2.0 with conditions (no multi-tenant, keep logo if its frontend is used) | UX reference only: run and debug panel beside a node, variables between nodes, notes                                                                                              |
| n8n-io/n8n                    | Sustainable Use License (source available, not open source)                     | UX reference only: node creator panel, sticky notes, execution data per node                                                                                                      |
| Comfy-Org/ComfyUI_frontend    | GPL-3.0                                                                         | UX reference only: node library sidebar, keybinding editor, subgraphs                                                                                                             |
| tldraw/tldraw                 | tldraw license (production needs a license key)                                 | Not used: freeform whiteboard without a port or edge model                                                                                                                        |

Star counts and versions as read on 2026-10-21; license notes are from each project's own page, not legal advice.

## Components (all registered in `packages/design-system/catalog/`, status planned)

Application tier: CanvasBoard, CanvasNode (input-block, knowledge, artifact, reference, direction, note), NodePort, CanvasEdge, NodeGroup, NodeToolbar, BlockLibrary, Inspector, MissingInputsPrompt, CanvasChat, TaskBar, MiniMap, CanvasControls, CompareStrip, VersionBadge, CanvasContextMenu, CommandMenu, Sheet.

Base tier added for them: Tooltip, Badge, Tag, Textarea, Popover, DropdownMenu, ContextMenu, Tabs, Slider, ToggleGroup, ScrollArea, Progress, Toast, Kbd, Resizable.

Commands and shortcuts: `packages/design-system/catalog/commands/canvas.yaml` (69 commands in six scopes), checked by `tests/check-commands.test.ts`.

## Tokens the canvas needs (E4-1, contract change with impact list)

Semantic: surface.board, canvas.grid, canvas.selection, port colour per data kind (text, image, palette, type, profile), edge style per meaning (input, reference, derived), status.running, status.stale, status.locked. Selection stays violet and focus stays the existing ring. Component: node.bg, node.border, node.border-selected, node.header, node.radius (media 12 from mood E), port.size, edge.width, group.bg, toolbar.bg.

## Assumptions

- Single user per board in the MVP; no realtime cursors (handoff §19). A sync layer would be its own ADR.
- No timeline editor: ORIVILO's output is a design system and brand book, not video.
- Boards stay under about five hundred nodes; React Flow handles that without virtualization.
- Dreamina was not used logged in; the description comes from its public pages. Screenshots from the owner would refine the "what Dreamina does" section.

## Sources

Dreamina: AI Canvas, Octo workspace, workflow review and "best AI canvas" pages on dreamina.capcut.com. Krea: krea.ai/docs/user-guide/features/nodes. Comparisons: fuser.studio, wireflow.ai, melius.com (each ranks itself first). React Flow: npm page, accessibility guide, NodeToolbar, NodeResizer and sub-flows docs on reactflow.dev. Node editor comparison: pistack.xyz (2026-09-09). tldraw license pages on tldraw.dev. Dify LICENSE on GitHub. Repository front pages of xyflow, langflow, dify, n8n, ComfyUI_frontend, tldraw, excalidraw, Flowise.
