/**
 * The block registry at runtime and the pure rules that read it (spec ORV-44 part 2): which inputs
 * a block node still misses, its fill state, and the rule-based summary it shows. The board never
 * stores a fill state; it follows from the node's answers, the registry and the edges, so the shelf,
 * the node and the prompt always agree. No React: the shell can run the same rules on a saved board.
 */
import type { BoardNode, Graph, NodeContent, PortSpec } from "../components/canvas-board/graph";
import { type Locale, pick } from "../i18n/locale";
import { fill, messagesFor } from "../i18n/messages/index";
import type { NodeKind, PortKind } from "../tokens/canvas";
import { BLOCKS, BLOCK_MODULES } from "./generated";

export { BLOCKS, BLOCK_MODULES, BLOCK_REGISTRY_VERSION } from "./generated";

export type Block = (typeof BLOCKS)[number];
export type BlockId = Block["id"];
export type BlockKind = Block["kind"];
export type BlockModule = keyof typeof BLOCK_MODULES;
export type BlockInput = Block["inputs"][number];
export type AnswerType = BlockInput["answer"];

/** What the user gave for one input: one string, or a list (colours, images). */
export type Answer = string | string[];

/**
 * How full a block node is. `empty`: no required input yet; `partial`: some, not all; `summarized`:
 * every required input; `unlinked`: has content but no edge on a board with other nodes.
 */
export const FILL_STATES = ["empty", "partial", "summarized", "unlinked"] as const;
export type FillState = (typeof FILL_STATES)[number];

/** The board node kind each block kind renders as. */
export const NODE_KIND_OF: Record<BlockKind, NodeKind> = {
  source: "input-block",
  synthesis: "knowledge",
  decision: "direction",
  output: "artifact",
};

export function blockById(id: string): Block | undefined {
  return BLOCKS.find((b) => b.id === id);
}

/** The output port id every block node carries. */
export const OUTPUT_PORT = "out";

/** A new node of a block: its ports from the registry, no answers, selected (the shelf places it). */
export function nodeForBlock(
  block: Block,
  id: string,
  position: { x: number; y: number },
  locale: Locale,
): BoardNode {
  const inputs: PortSpec[] = block.inputs
    .filter((i) => i.from.length > 0)
    .map((i) => ({
      id: i.id,
      kind: (blockById(i.from[0] ?? "")?.output ?? "text") as PortKind,
      label: pick(i.label, locale),
    }));
  const content: NodeContent = {
    title: pick(block.name, locale),
    kind: NODE_KIND_OF[block.kind],
    block: block.id,
    answers: {},
    inputs,
    outputs: [{ id: OUTPUT_PORT, kind: block.output as PortKind, label: pick(block.name, locale) }],
  };
  return { id, type: "orivilo", position, selected: true, data: content };
}

/** The graph with a node of the block added at the position, selected alone. */
export function placeBlock(
  graph: Graph,
  block: Block,
  id: string,
  position: { x: number; y: number },
  locale: Locale,
): Graph {
  return {
    nodes: [
      ...graph.nodes.map((n) => ({ ...n, selected: false })),
      nodeForBlock(block, id, position, locale),
    ],
    edges: graph.edges.map((e) => ({ ...e, selected: false })),
  };
}

/** The first node on the board made from the block, if any (the shelf selects it instead of adding). */
export function nodeOfBlock(graph: Graph, blockId: string): BoardNode | undefined {
  return graph.nodes.find((n) => n.data.block === blockId);
}

/** Whether an answer holds something: a non-blank string or a non-empty list. */
export function answered(value: Answer | undefined): boolean {
  if (value === undefined) return false;
  return Array.isArray(value) ? value.length > 0 : value.trim() !== "";
}

/** How one input of a node is filled: by the user's answer, by an edge from a complete node, or not. */
export interface InputFill {
  input: BlockInput;
  /** The user's answer when there is one. */
  answer?: Answer;
  /** The complete upstream node that feeds it, when an edge does. */
  source?: BoardNode;
}

function complete(graph: Graph, node: BoardNode, seen: ReadonlySet<string>): boolean {
  const block = node.data.block ? blockById(node.data.block) : undefined;
  if (!block) return false;
  return inputFills(graph, node, seen).every((f) => !f.input.required || filled(f));
}

function filled(f: InputFill): boolean {
  return answered(f.answer) || f.source !== undefined;
}

function inputFills(graph: Graph, node: BoardNode, seen: ReadonlySet<string>): InputFill[] {
  const block = node.data.block ? blockById(node.data.block) : undefined;
  if (!block) return [];
  const next = new Set(seen).add(node.id);
  return block.inputs.map((input) => {
    const out: InputFill = { input };
    const value = node.data.answers?.[input.id];
    if (answered(value)) out.answer = value as Answer;
    const from = input.from as readonly string[];
    if (from.length > 0) {
      for (const edge of graph.edges) {
        if (edge.target !== node.id || edge.targetHandle !== input.id) continue;
        // A cycle never counts as filled: a node cannot feed itself through others.
        if (next.has(edge.source)) continue;
        const source = graph.nodes.find((n) => n.id === edge.source);
        if (!source?.data.block || !from.includes(source.data.block)) continue;
        if (complete(graph, source, next)) {
          out.source = source;
          break;
        }
      }
    }
    return out;
  });
}

/** Every input of a block node with how it is filled, in registry order; empty for other nodes. */
export function fillsOf(graph: Graph, nodeId: string): InputFill[] {
  const node = graph.nodes.find((n) => n.id === nodeId);
  return node ? inputFills(graph, node, new Set()) : [];
}

/** The required inputs a block node still needs, in registry order (what the prompt asks). */
export function missingInputs(graph: Graph, nodeId: string): BlockInput[] {
  return fillsOf(graph, nodeId)
    .filter((f) => f.input.required && !filled(f))
    .map((f) => f.input);
}

/** The node's fill state, or undefined when it is not made from a block. */
export function fillState(graph: Graph, nodeId: string): FillState | undefined {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node?.data.block || !blockById(node.data.block)) return undefined;
  const fills = inputFills(graph, node, new Set());
  const required = fills.filter((f) => f.input.required);
  const have = required.filter(filled).length;
  if (have === 0) return "empty";
  const linked = graph.edges.some((e) => e.source === nodeId || e.target === nodeId);
  if (!linked && graph.nodes.length > 1) return "unlinked";
  return have === required.length ? "summarized" : "partial";
}

/** What the node shows: one line per filled input, naming its source, and the colours it holds. */
export interface BlockSummary {
  lines: string[];
  colours: string[];
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A typed colour in the shape the registry stores: `#` and six hex digits, lower case; or undefined. */
export function normaliseColour(raw: string): string | undefined {
  const v = raw.trim().replace(/^(?!#)/, "#");
  if (!HEX.test(v)) return undefined;
  const hex = v.slice(1).toLowerCase();
  return `#${hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex}`;
}

function formatAnswer(input: BlockInput, value: Answer, locale: Locale): string {
  const m = messagesFor(locale).block;
  const list = Array.isArray(value) ? value : [value];
  switch (input.answer) {
    case "images":
      return fill(m.images, { count: String(list.length) });
    case "choice": {
      const options = input.options as readonly { id: string; th: string; en: string }[];
      return list.map((id) => options.find((o) => o.id === id)?.[locale] ?? id).join(", ");
    }
    default:
      return list.join(", ");
  }
}

/** The rule-based summary of a block node (spec rule: a summary names its sources, never guesses). */
export function summarize(graph: Graph, nodeId: string, locale: Locale): BlockSummary {
  const m = messagesFor(locale).block;
  const lines: string[] = [];
  const colours: string[] = [];
  for (const f of fillsOf(graph, nodeId)) {
    const label = pick(f.input.label, locale);
    if (f.answer !== undefined) {
      lines.push(fill(m.line, { label, value: formatAnswer(f.input, f.answer, locale) }));
      if (f.input.answer === "colours") {
        for (const c of Array.isArray(f.answer) ? f.answer : [f.answer]) {
          const hex = normaliseColour(c);
          if (hex) colours.push(hex);
        }
      }
    } else if (f.source) {
      lines.push(fill(m.line, { label, value: fill(m.from, { source: f.source.data.title }) }));
      colours.push(...summarize(graph, f.source.id, locale).colours);
    }
  }
  return { lines, colours: [...new Set(colours)] };
}

/** The blocks of each module, in registry order, for the shelf. */
export function blocksByModule(): { module: BlockModule; blocks: Block[] }[] {
  return (Object.keys(BLOCK_MODULES) as BlockModule[]).map((module) => ({
    module,
    blocks: BLOCKS.filter((b) => b.module === module),
  }));
}

/** The fill state in words for a locale ("ถามอีก 2 ข้อ"), or undefined for a node outside the registry. */
export function fillWord(graph: Graph, nodeId: string, locale: Locale): string | undefined {
  const state = fillState(graph, nodeId);
  if (!state) return undefined;
  const words = messagesFor(locale).node.fill;
  return state === "partial"
    ? fill(words.partial, { count: String(missingInputs(graph, nodeId).length) })
    : words[state];
}
