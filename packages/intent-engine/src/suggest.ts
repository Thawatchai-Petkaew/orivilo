import { PERSONALITY_AXES, type PersonalityAxis } from "./knowledge";
import { interpretWithRules, RULE_ADAPTER_VERSION } from "./interpreter";

/**
 * Mood suggestions by rules (ORV-61). A mood text is read with the brief interpreter's word list
 * (ORV-33), then a fixed, licensed candidate list is ranked by each candidate's affinity to the
 * personality axes the text names. Deterministic and not AI: the same text gives the same order,
 * every suggestion quotes the words it came from, and a text with no known word gives none.
 */

export const SUGGESTION_KINDS = ["font", "icon", "corners", "density"] as const;
export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];

export type Affinity = Partial<Record<PersonalityAxis, number>>;

export interface Candidate {
  /** Stable id; the value a block answer stores. */
  id: string;
  kind: SuggestionKind;
  /** The name shown to people, the same in Thai and English (a family or set name). */
  name: string;
  /** SPDX licence id; empty for corners and density, which are our own scale. */
  licence: string;
  /** Where the face or set comes from; empty for our own scale. */
  source: string;
  /** How much the candidate fits more of each axis; negative fits less. */
  affinity: Affinity;
}

const font = (id: string, name: string, affinity: Affinity): Candidate => ({
  id,
  kind: "font",
  name,
  licence: "OFL-1.1",
  source: `https://fonts.google.com/specimen/${name.replaceAll(" ", "+")}`,
  affinity,
});

/**
 * The candidates, in tie-break order. Every font is OFL-1.1 on Google Fonts and covers Thai and
 * Latin; the icon sets differ by style, one each (ORV-60 defaults).
 */
export const SUGGESTION_CANDIDATES: readonly Candidate[] = [
  font("anuphan", "Anuphan", { structured: 1, premium: 0.5, playful: -0.3 }),
  font("sarabun", "Sarabun", { structured: 0.6, warm: 0.5, expressive: -0.4 }),
  font("ibm-plex-sans-thai", "IBM Plex Sans Thai", { structured: 0.9, premium: 0.4, warm: -0.2 }),
  font("noto-sans-thai-looped", "Noto Sans Thai Looped", { warm: 0.7, structured: 0.3 }),
  font("prompt", "Prompt", { expressive: 0.7, playful: 0.3, structured: 0.3 }),
  font("kanit", "Kanit", { expressive: 1, premium: -0.2 }),
  font("mitr", "Mitr", { playful: 0.8, warm: 0.6, premium: -0.4 }),
  font("mali", "Mali", { playful: 1, warm: 0.5, structured: -0.6, premium: -0.6 }),
  font("trirong", "Trirong", { premium: 1, warm: 0.3, playful: -0.5 }),
  {
    id: "rounded-stroke",
    kind: "icon",
    name: "Lucide",
    licence: "ISC",
    source: "https://lucide.dev",
    affinity: { warm: 0.6, playful: 0.4, structured: 0.2 },
  },
  {
    id: "square-stroke",
    kind: "icon",
    name: "Material Symbols Sharp",
    licence: "Apache-2.0",
    source: "https://fonts.google.com/icons",
    affinity: { structured: 1, premium: 0.5, playful: -0.5 },
  },
  {
    id: "solid",
    kind: "icon",
    name: "Phosphor Fill",
    licence: "MIT",
    source: "https://phosphoricons.com",
    affinity: { expressive: 1, playful: 0.5, structured: -0.2 },
  },
  ...(
    [
      ["sharp", { structured: 0.6, premium: 0.6, playful: -0.6, warm: -0.3 }],
      ["soft", { warm: 0.4, structured: 0.3 }],
      ["round", { playful: 0.8, warm: 0.6, premium: -0.3 }],
    ] as const
  ).map(([id, affinity]) => ({
    id,
    kind: "corners" as const,
    name: id,
    licence: "",
    source: "",
    affinity,
  })),
  ...(
    [
      ["compact", { structured: 0.5, premium: -0.5, warm: -0.2 }],
      ["comfortable", { warm: 0.2 }],
      ["spacious", { premium: 0.8, warm: 0.3, structured: -0.2 }],
    ] as const
  ).map(([id, affinity]) => ({
    id,
    kind: "density" as const,
    name: id,
    licence: "",
    source: "",
    affinity,
  })),
];

/** What the rules read in a mood text. */
export interface MoodReading {
  method: "rule-based";
  adapter: { id: string; version: string };
  /** 0 to 100 per axis the text names without contradicting itself. */
  axes: Partial<Record<PersonalityAxis, number>>;
  /** The words each axis came from, as written. */
  words: Partial<Record<PersonalityAxis, string[]>>;
  /** Clauses the word list does not know. */
  notUnderstood: string[];
}

/** Reads a mood text with the rule lexicon. Empty text reads as nothing. */
export function readMood(text: string): MoodReading {
  const reading: MoodReading = {
    method: "rule-based",
    adapter: { id: "rules", version: RULE_ADAPTER_VERSION },
    axes: {},
    words: {},
    notUnderstood: [],
  };
  if (text.trim() === "") return reading;
  const result = interpretWithRules({ text });
  for (const axis of PERSONALITY_AXES) {
    const value = result.facts.personality[axis];
    if (value === undefined) continue;
    reading.axes[axis] = value;
    reading.words[axis] = [
      ...new Set(
        result.findings
          .filter((f) => f.field === "personality" && f.axis === axis)
          .map((f) => f.evidence.text),
      ),
    ];
  }
  reading.notUnderstood = result.uncertain
    .filter((u) => u.reason === "not-understood")
    .flatMap((u) => u.evidence.map((e) => e.text));
  return reading;
}

/** One ranked candidate and the axes that raised it, strongest first. */
export interface Ranked {
  candidate: Candidate;
  score: number;
  because: { axis: PersonalityAxis; words: string[] }[];
}

/** The candidates of a kind ranked for a reading; empty when the reading names no axis. */
export function rankSuggestions(reading: MoodReading, kind: SuggestionKind): Ranked[] {
  const axes = PERSONALITY_AXES.filter((a) => reading.axes[a] !== undefined);
  if (axes.length === 0) return [];
  const ranked = SUGGESTION_CANDIDATES.filter((c) => c.kind === kind).map((candidate, order) => {
    const parts = axes.map((axis) => ({
      axis,
      value: (candidate.affinity[axis] ?? 0) * (((reading.axes[axis] as number) - 50) / 50),
    }));
    const score = Math.round(parts.reduce((sum, p) => sum + p.value, 0) * 1000) / 1000;
    const because = parts
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((p) => ({ axis: p.axis, words: reading.words[p.axis] ?? [] }));
    return { candidate, score, because, order };
  });
  ranked.sort((a, b) => b.score - a.score || a.order - b.order);
  return ranked.map(({ candidate, score, because }) => ({ candidate, score, because }));
}
