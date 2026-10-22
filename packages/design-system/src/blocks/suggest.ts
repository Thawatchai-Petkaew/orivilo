/**
 * Mood suggestions on block nodes (spec ORV-61). The font, icon and shape nodes read the mood that
 * fills their `mood` input, typed or fed by edges, and rank the intent engine's candidates by rules.
 * Each kind writes to one input of its block, so a pick is an ordinary answer and the rest of the
 * board (fill state, summary, sources) needs nothing new.
 */
import {
  type Candidate,
  type MoodReading,
  type Ranked,
  rankSuggestions,
  readMood,
  type SuggestionKind,
} from "@orivilo/intent-engine";
import type { Graph } from "../components/canvas-board/graph";
import { type Locale, pick } from "../i18n/locale";
import { type Answer, type BlockInput, blockById, fillsOf } from "./index";

/** The input each kind's pick is written to, per block. */
const KINDS: Record<string, readonly { kind: SuggestionKind; input: string }[]> = {
  font: [{ kind: "font", input: "wanted" }],
  icon: [{ kind: "icon", input: "style" }],
  "shape-spacing": [
    { kind: "corners", input: "corners" },
    { kind: "density", input: "density" },
  ],
};

/** The mood input every suggesting block reads. */
const MOOD_INPUT = "mood";

/** How many candidates the panel lists per kind. */
export const SUGGESTIONS_SHOWN = 3;

export interface KindSuggestions {
  kind: SuggestionKind;
  /** The registry input a pick writes to. */
  input: BlockInput;
  ranked: Ranked[];
  /** The id of the candidate the node's answer holds, if any. */
  picked?: string;
}

export interface NodeSuggestions {
  reading: MoodReading;
  kinds: KindSuggestions[];
}

const texts = (value: Answer): string[] => (Array.isArray(value) ? value : [value]);

/** Every typed answer of a node and of the nodes that feed it, upstream first, each once. */
function upstreamText(graph: Graph, nodeId: string, seen: Set<string>): string[] {
  if (seen.has(nodeId)) return [];
  seen.add(nodeId);
  const out: string[] = [];
  for (const f of fillsOf(graph, nodeId)) {
    if (f.source) out.push(...upstreamText(graph, f.source.id, seen));
    if (f.answer !== undefined && (f.input.answer === "text" || f.input.answer === "long-text")) {
      out.push(...texts(f.answer));
    }
  }
  return out;
}

/** The mood text a suggesting node reads: its own mood answer, or what feeds its mood input. */
export function moodText(graph: Graph, nodeId: string): string {
  const fill = fillsOf(graph, nodeId).find((f) => f.input.id === MOOD_INPUT);
  if (!fill) return "";
  if (fill.answer !== undefined) return texts(fill.answer).join(" ");
  if (fill.source) return upstreamText(graph, fill.source.id, new Set()).join(" ");
  return "";
}

/** The answer value a candidate writes: a font by its name, every other kind by its id. */
export function answerFor(candidate: Candidate): string {
  return candidate.kind === "font" ? candidate.name : candidate.id;
}

/**
 * The suggestions of a node, or undefined when its block does not suggest or its mood is not
 * filled yet. A filled mood with no word the rules know gives a reading and empty rankings.
 */
export function suggestionsFor(graph: Graph, nodeId: string): NodeSuggestions | undefined {
  const node = graph.nodes.find((n) => n.id === nodeId);
  const blockId = node?.data.block;
  const kinds = blockId ? KINDS[blockId] : undefined;
  const block = blockId ? blockById(blockId) : undefined;
  if (!node || !kinds || !block) return undefined;
  const text = moodText(graph, nodeId);
  if (text.trim() === "") return undefined;
  const reading = readMood(text);
  return {
    reading,
    kinds: kinds.flatMap(({ kind, input }) => {
      const spec = block.inputs.find((i) => i.id === input);
      if (!spec) return [];
      // Only candidates the mood raises: each has at least one reason to show.
      const ranked = rankSuggestions(reading, kind).filter((r) => r.score > 0);
      const answer = node.data.answers?.[input];
      const held = typeof answer === "string" ? answer : undefined;
      const picked = ranked.find((r) => answerFor(r.candidate) === held)?.candidate.id;
      return [{ kind, input: spec, ranked, ...(picked ? { picked } : {}) }];
    }),
  };
}

/** A candidate's name for people: a font or set by its own name, a choice by its option label. */
export function candidateName(candidate: Candidate, input: BlockInput, locale: Locale): string {
  const options = ((input as { options?: unknown }).options ?? []) as readonly {
    id: string;
    th: string;
    en: string;
  }[];
  const option = options.find((o) => o.id === candidate.id);
  if (candidate.kind === "icon" && option) return `${pick(option, locale)} (${candidate.name})`;
  return option ? pick(option, locale) : candidate.name;
}
