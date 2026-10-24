---
issue: ORV-106 (ORV-105 slice B, ORV-45 part 3; https://tpetkaew.atlassian.net/browse/ORV-106)
lane: L (risk flags: component public API, board document schema `NodeContent`)
version: 1.1
---

## Why

Slice A (ORV-105, merged) gave the board a sidebar chat whose replies stay in its transcript. ADR 0004 wants each answer on the board as a node linked to the node it is about, so an answer never gets lost in a chat log and stays traceable to its source (the Intent Engine's promise). Slice B places a finished reply as a node with a `derived` edge from its source, shows where the reply came from (`rules` or `mock`) on that node, and lets the person jump to it.

**What the MVP simulates:** no chat model is connected (ADR 0009). In stories the host is a fixture that streams canned or rule-based text; nothing interprets language. The reply node says "ตามกฎ" / "By rules" or "ข้อมูลจำลอง" / "Mock data" from the reply's own basis, and no copy says AI answered (AGENTS.md rule 4).

Not a guard spec; the guard frame (L-0012) does not apply.

This slice spec copies ORV-105 rows 13 to 17 with their numbers (L-0016) and adds rows 29 onward for the items slice A carried (ORV-105 comment 10134).

## Source and decisions

- `docs/specs/ORV-105/spec.md` v1.3: the A to D API sketch, rows 13 to 17, open questions 4, 5, 6 and 11 (auto-place through `onReply`, reply as a `note` with one input port per source, optional `NodeContent.basis`, the context node is the one selected alone at send), the i18n keys marked B, rules and bounds.
- `docs/specs/ORV-105/design.md` §14 (stories `OnBoard`, `Unlinked`) and §15 (slice B outline: jump button, unlinked words, node header basis word, placement, focus and selection).
- G1: ORV-105 comment 10132 (Claude under the owner's POC delegation, ADR 0012 decision 4). G2: ORV-105 comment 10133. Both cover slice B; this spec adds no new scope beyond them and the carried items.
- ADR 0004 (replies land as nodes linked to their source), ADR 0009 (chat model later), ADR 0012 (lane L).
- `docs/specs/ORV-100/spec.md` v1.6: `jumpToNode(id, { select: true })`, the `taskBar.basisRules` and `taskBar.basisMock` words.
- L-0015: the builder probes measured node sizes in a browser before fixing placement numbers.

## Story

As a Studio user asking about a node on the board, I want the finished reply to appear as a node next to it, linked by a derived edge and labelled by rules or mock data, and a way to jump to it from the chat, so that the answer lives on the board and I can see where it came from.

## API additions to the slice A subset

Slice A ships `ChatRequest = { text; mentions }`, the sidebar-only `CanvasChatProps`, and `onReply` returning `void`. Slice B changes exactly this:

```ts
export interface ChatRequest {
  text: string;
  mentions: readonly string[];
  /** New in B: the node selected alone on the board when the message is sent, if any. */
  contextNodeId?: string | undefined;
}

interface CanvasChatBase {
  // basis, onAsk, onClose, className unchanged from slice A
  /** Changed in B: returns the placed node id, or nothing when the host declines to place it. */
  onReply?: ((reply: ChatReply, request: ChatRequest) => string | undefined) | undefined;
}

/** New in B, pure, beside placeBlock: the graph with the reply as a note linked to its sources. */
export function placeReply(
  graph: Graph,
  reply: {
    id: string;
    title: string;
    text: string;
    basis: ChatBasis;
    sources: readonly string[];
    position?: { x: number; y: number };
  },
): Graph;

/** New in B (open question 1): "คำตอบเรื่อง {topic}" / "Reply on {topic}", topic the first 40 graphemes. */
export function replyTitle(question: string, locale: Locale): string;
```

`NodeContent` gains `basis?: ChatBasis`. CanvasNode shows the basis word in the header row after the kind word when it is present (design.md §15). `contextNodeId` is read by the chat from `useBoard().selectedNodeIds` at send time (one id exactly, else absent); outside a board it is absent. A host that returns a string from `onReply` gets the jump button and the placed announcement; a host that returns nothing gets neither, as in slice A. Existing slice A callers that return `void` still type-check.

## Acceptance criteria

Rows 13 to 17 are ORV-105's rows, unchanged; the Result cell is ORV-105's "User sees" text followed by its "Data effect". Every row is checked by a play test in `application/CanvasChat` (id `application-canvas-chat`) unless it says otherwise. The stories are `OnBoard` and `Unlinked` from design.md §14.

| #   | Given                                                                | When                                                                                                                 | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | A chat inside a `CanvasBoard`, a node selected alone                 | A reply finishes and the host's `onReply` calls `placeReply`                                                         | A new node appears one grid unit right of that node (below any earlier reply from it), titled "คำตอบเรื่อง {topic}" / "Reply on {topic}" (topic: the question's first 40 graphemes), its body the reply text, its header tag "ตามกฎ" / "By rules" or "ข้อมูลจำลอง" / "Mock data"; an edge with meaning `derived` from the source node to it; selection and focus do not move. Data effect: Graph gains one node with `basis` and one `derived` edge per source (pure helper)                              |
| 14  | No node selected and no mention                                      | A reply finishes and is placed                                                                                       | The node lands at the viewport centre with no edge; the reply in the transcript says "ไม่ได้ผูกกับโหนดใด" / "Not linked to any node". Data effect: Graph gains one node, no edge                                                                                                                                                                                                                                                                                                                          |
| 15  | A placed reply                                                       | Pressing "ไปที่โหนดคำตอบ" / "Go to reply node" (name "ไปที่โหนดคำตอบเรื่อง {topic}" / "Go to reply node on {topic}") | `jumpToNode(id, { select: true })`: the board pans, selects and focuses the node and announces "ไปที่ {title}" / "Jumped to {title}" (existing `board.jumped`); the button is absent when `onReply` returned nothing or the node is no longer on the board. Data effect: Board selection becomes that node                                                                                                                                                                                                |
| 16  | A reply was placed                                                   | The board announces                                                                                                  | The chat's live region says "วางคำตอบเป็นโหนด {title} แล้ว" / "Placed the reply as node {title}". Data effect: None                                                                                                                                                                                                                                                                                                                                                                                       |
| 17  | Sources with different output port kinds, or with none               | `placeReply` runs                                                                                                    | The reply node gets one input port per source, of that source's first output kind, so the edge is valid by `connectionProblem`; a source with no output port (a note, a group) gets no edge and the reply says "ไม่ได้ผูกกับโหนดใด" / "Not linked to any node" when no edge was made (unit test on `placeReply`). Data effect: As row 13                                                                                                                                                                  |
| 29  | A sidebar chat with `onClose`, a reply streaming (ORV-105 review N1) | Pressing "ปิดแชท" / "Close chat"                                                                                     | The chat's status region says "หยุดแล้ว" / "Stopped" (the same `chat.stopped` text Stop announces), the reply is marked stopped, the signal aborts, then `onClose` runs once; the order is abort, status, close in the `Close` story. Data effect: None                                                                                                                                                                                                                                                   |
| 30  | Every story in `CanvasChat.stories.tsx` (ORV-105 QA-1)               | Reading the comment above each story                                                                                 | Each comment names the basis its fixture host uses: "worked out by rules" for a `rules` host, "mock data" for a `mock` host, both when a story mixes them; `RecipesAndModes` no longer says mock data over a `rules` host. Checked by the reviewer reading the file against each story's `onAsk` args, not by a play test. Data effect: None                                                                                                                                                              |
| 31  | `RecipesAndModes` in all six matrix cells (ORV-105 QA-2)             | Rendering                                                                                                            | Each chat sits in a frame of `WIDTH.panel` (322 px, the 320 px panel plus the 2 px border), so the composer shows the panel layout, not the wrapped layout below 320 px; the play test asserts each cell's chat is 320 px wide and the basis word shows in every cell. Data effect: None                                                                                                                                                                                                                  |
| 32  | `docs/specs/ORV-105/spec.md` (ORV-105 QA-3)                          | Reading the States table and row 27                                                                                  | They name the story `RecipesAndModes`, not `Matrix` (`Matrix` stays the name of the wrapper); the spec bumps to v1.4 with a changelog line. Checked by review, not by a play test. Data effect: None                                                                                                                                                                                                                                                                                                      |
| 33  | The catalog and contract after slice B                               | `check-catalog`, `check-i18n`, the copy check, `pnpm contrast`, the a11y addon                                       | `canvas-chat.yaml` no longer lists "Replies are placed as nodes linked to the node they came from" as not built; every CanvasNode and CanvasBoard story passes unchanged with `NodeContent.basis` added; the five `chat` keys marked B in ORV-105 (`replyTitle`, `jump`, `jumpLabel`, `placed`, `unlinked`) exist in `th.ts` and `en.ts` with that copy; zero a11y violations. Data effect: Contract: `NodeContent.basis`, `placeReply`, `replyTitle`, `ChatRequest.contextNodeId`, `onReply` return type |

## Rules and bounds

- From ORV-105, unchanged: only a reply whose iterable ended reaches `onReply`; a stopped or failed reply is never placed. Graph changes go through the shell, which applies `placeReply` (CanvasBoard is controlled).
- `placeReply` is pure and deterministic: the caller gives the id, no time or random value enters the graph, and existing nodes and edges keep their `selected` state (unlike `placeBlock`, which selects the new node).
- The reply node is a `note` with `summary` set to the reply text and `basis` set. It is never marked done, approved or trusted; no rating or confidence (DESIGN.md §9 item 11). The basis word is plain text in `node.kind-fg`, not a chip.
- Edge ids are derived from the reply id and the source id, so the same input gives the same graph. Each edge has meaning `derived`, from the source's first output port to a new input port of that kind on the reply.
- Placement: x is the source's x plus its measured width plus `space.grid-gap`; y is the source's top, or below the lowest earlier reply linked from that source plus `space.grid-gap`. With no linked source, the node uses `position`. The numbers are probed in a browser before they are fixed (L-0015).
- Sources that are gone from the graph are skipped. A source listed twice gets one edge.
- `NodeContent.basis` is optional, so every saved board stays valid without a migration.
- Reply text renders as plain text on the node, never as HTML or markdown.
- No middot and no em dash in any copy, story, fixture or comment.

## Impact (public API and contracts, AGENTS.md rule 2)

- Board document schema: `NodeContent.basis?: ChatBasis`. CanvasNode renders it in the header. Every CanvasNode and CanvasBoard story is re-run in this PR as the check; `graph.test.ts` gets a round-trip case with and without `basis`.
- `ChatRequest` gains optional `contextNodeId`; `onReply` return type widens from `void` to `string | undefined`. Callers: `CanvasChat.stories.tsx` only (no `apps/web` caller yet).
- New exports from `@orivilo/design-system`: `placeReply`, `replyTitle`.
- Locale: five `chat` keys in `th.ts` and `en.ts`; reused `taskBar.basisRules`, `taskBar.basisMock`, `board.jumped`.
- Catalog: `canvas-chat.yaml` notes and `coverage.md` row updated for slice B; `canvas-node.yaml` mentions the basis word if its entry lists header contents.
- `docs/specs/ORV-105/spec.md` v1.4 for row 32 (story name only, no requirement change).
- No change to `TaskBar`, `Textarea`, `Tag`, `jumpToNode`, `connectionProblem`, any token or any semantic token. A new token for the reply node or the jump button would be a contract change that bumps this spec.

## Out of scope

- Mentions as sources (slice C, ORV-105 rows 18 to 22); `ChatRequest.mentions` stays empty. `placeReply` already takes a list of sources so C adds no new helper.
- The at-cursor form and its `position` (slice D, rows 23 to 26).
- Wiring the chat and `placeReply` into `apps/web`; a real chat adapter (ADR 0009).
- Editing, moving or deleting a reply node through the chat; replies that change existing nodes.

## Open questions (option, impact, default)

| #   | Question                               | Options                                                                                                          | Impact                                                                                | Proposed default                                                                                                                                          |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Who makes the reply title              | The chat passes it in a third `onReply` argument; an exported `replyTitle(question, locale)`; the host builds it | A third argument grows the callback; a host-built title can drift from the jump label | Export `replyTitle`; the chat uses it for the jump label topic and reads the placed node's title from the graph for the announcement                      |
| 2   | Where an unlinked reply lands          | The host passes `position` (viewport centre in flow coordinates); `placeReply` reads a viewport it does not have | `placeReply` stays pure only if the host passes it                                    | The host passes the viewport centre as `position`; without a linked source and without `position`, the node lands at the origin, covered by the unit test |
| 3   | Which "below" counts for a later reply | Lowest reply linked from the same source by a `derived` edge; any node in that column                            | Any node in the column can jump across unrelated nodes                                | Lowest reply node linked from that source                                                                                                                 |

## Depends on

- ORV-105 slice A, merged into `develop` (#98).
- ORV-100 and ORV-101 (`jumpToNode` with select, basis words), merged.

## Changelog

- v1 (2026-10-25): first slice spec for ORV-105 slice B, from ORV-105 spec v1.3 rows 13 to 17 and design.md §15, plus rows 29 to 33 for the items slice A carried (review N1, QA-1 to QA-3) and the slice B catalog check. Downstream: the slice B build task; `docs/specs/ORV-105/spec.md` v1.4 (row 32).
- v1.1 (2026-10-25): decisions by Claude within the ORV-105 G1 and G2 scope (comments 10132, 10133). Open questions 1 to 3 take their defaults: export `replyTitle`, the host passes the viewport centre as position with an origin fallback, and a later reply stacks below the lowest reply linked from the same source.
