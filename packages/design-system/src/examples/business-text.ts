import {
  BUSINESS_FIELDS,
  type BusinessFieldId,
  type BusinessFieldReading,
  type BusinessNodeId,
  type BusinessReadReason,
  type FoundationFieldKey,
  type FoundationNode,
  type Face,
  type FoundationNodeId,
  type InputEvidence,
  type IntakeField,
  type MarkRef,
  PROXY_QUESTIONS,
  type ProxyQuestionId,
  type TypographyScripts,
} from "@orivilo/intent-engine";
import type { EvidenceItem } from "../components/index";
import { DATE_TAGS, type Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";

/**
 * Looks the engine's keys up in the catalog for the three business screens (ORV-281 tech notes
 * section 9). The engine holds keys, never resolved text; `business-strings.test.ts` proves every
 * key below resolves in both languages and equals the catalog entry the engine names.
 */

type Business = Messages["business"];

const NODE_KEY = {
  situation: "situation",
  "business-core": "businessCore",
  audience: "audience",
  "competitive-frame": "competitiveFrame",
  positioning: "positioning",
  // The foundation nodes of ORV-291.
  "identity-frame": "identityFrame",
  architecture: "architecture",
  name: "name",
  "core-idea": "coreIdea",
  color: "color",
  typography: "typography",
} as const satisfies Record<BusinessNodeId | FoundationNodeId, keyof Business["node"]>;

export function nodeTitle(m: Messages, id: BusinessNodeId | FoundationNodeId): string {
  return m.business.node[NODE_KEY[id]];
}

/** The node titles of `refs` as one line: `Intl.ListFormat`, type `conjunction`, in the page's locale. */
export function listOfNodes(m: Messages, locale: Locale, refs: readonly MarkRef[]): string {
  return new Intl.ListFormat(DATE_TAGS[locale], { type: "conjunction" }).format(
    refs.map((ref) => nodeTitle(m, ref)),
  );
}

/** Words as one line: `Intl.ListFormat`, type `conjunction`, in the page's locale. */
export function listOfWords(locale: Locale, words: readonly string[]): string {
  return new Intl.ListFormat(DATE_TAGS[locale], { type: "conjunction" }).format(words);
}

type ColorNode = Extract<FoundationNode, { id: "color" }>;
type Color = Business["color"];

/** The word of a colour family, a key of `business.color.family.*`. */
export function familyWord(m: Messages, family: keyof Color["family"]): string {
  return m.business.color.family[family];
}

/** The word of a neutral decision, a key of `business.color.neutral.*`. */
export function neutralWord(m: Messages, value: keyof Color["neutral"]): string {
  return m.business.color.neutral[value];
}

/** The word of a canvas decision, a key of `business.color.canvas.*`. */
export function canvasWord(m: Messages, value: keyof Color["canvas"]): string {
  return m.business.color.canvas[value];
}

/** The crowded families as one line, or `business.color.noneCrowded` when none is. */
export function crowdedLine(
  m: Messages,
  locale: Locale,
  crowded: ReadonlyArray<keyof Color["family"]>,
): string {
  return crowded.length === 0
    ? m.business.color.noneCrowded
    : listOfWords(
        locale,
        crowded.map((family) => familyWord(m, family)),
      );
}

/**
 * The reason line of a decision (`color-node-1`): the catalog's sentence filled with the scale points
 * and the family words the engine gave. A reason for a decision the engine did not make, or with no
 * points, throws: a view prints no guess.
 */
export function colorReason(
  m: Messages,
  node: ColorNode,
  which: "signature" | "fallback" | "neutral" | "canvas",
): string {
  const { points, decisions } = node;
  if (points === null || decisions === null) throw new Error("colorReason: no decision to explain");
  const because = m.business.color.because;
  if (which === "neutral" || which === "canvas") {
    if ((which === "neutral" ? decisions.neutral : decisions.canvas) === null) {
      throw new Error(`colorReason: no ${which} decision`);
    }
    return which === "neutral"
      ? fill(because.neutral, { warm: String(points.warm) })
      : fill(because.canvas, { premium: String(points.premium) });
  }
  const signature = decisions.signature;
  if (signature === null || signature.because !== which) {
    throw new Error(`colorReason: the signature is not a ${which} decision`);
  }
  const shared = {
    expressive: String(points.expressive),
    warm: String(points.warm),
    family: familyWord(m, signature.value),
  };
  if (which === "signature") return fill(because.signature, shared);
  if (signature.preferred === null)
    throw new Error("colorReason: a fallback names its first family");
  return fill(because.fallback, { ...shared, preferred: familyWord(m, signature.preferred) });
}

/** The rule line of a decision: `business.decision.rule` with the rule id as the engine gave it. */
export function decisionRule(m: Messages, rule: string): string {
  return fill(m.business.decision.rule, { rule });
}

/** Why the signature is open: the lineup wait, or the two families both crowded; null when it is not. */
export function signatureOpenLine(m: Messages, open: ColorNode["signatureOpen"]): string | null {
  if (open === null) return null;
  return open.why === "waitsForLineup"
    ? m.business.color.waitsForLineup
    : fill(m.business.color.bothCrowded, {
        first: familyWord(m, open.first),
        second: familyWord(m, open.second),
      });
}

/** The word of a scripts answer, a key of `business.typography.scripts.*` (`typography-node-1`). */
export function scriptsWord(m: Messages, scripts: TypographyScripts): string {
  const words = m.business.typography.scripts;
  return scripts === "thai-latin" ? words.thaiLatin : words[scripts];
}

/** The word of a family's style, a key of `business.typography.style.*`. */
export function styleWord(m: Messages, style: Face["style"]): string {
  return m.business.typography.style[style];
}

/** The licence line of a family: `business.typography.licence` with the licence name as written. */
export function licenceLine(m: Messages, face: Face): string {
  return fill(m.business.typography.licence, { licence: face.licence });
}

/** The reason of a Thai family's role, or null for a family that has none (the Latin one). */
export function faceBecause(m: Messages, face: Face): string | null {
  return face.because === null ? null : m.business.typography.because[face.because];
}

/** The name of a foundation field, a key of `business.field.*`. */
export function foundationFieldLabel(m: Messages, field: FoundationFieldKey): string {
  return m.business.field[field];
}

/**
 * The state line of a foundation node (`foundation-marks-1`): the catalog's line for its state key,
 * and for `waiting` the line with the nodes it waits for.
 */
export function foundationStateLine(m: Messages, locale: Locale, node: FoundationNode): string {
  return node.state === "waiting"
    ? fill(m.business.state.waiting, { nodes: listOfNodes(m, locale, node.waitingFor) })
    : m.business.state[node.state];
}

/**
 * The provisional pair of a derived result that rests on a skipped step (`foundation-marks-1`):
 * `strategy.provisional`, then `business.marks.restsOn` with its nodes. Both or neither, so a
 * "rests on" line never stands without the line that says what it means.
 */
export function provisionalLines(
  m: Messages,
  locale: Locale,
  node: FoundationNode,
): { provisional: string; restsOn: string } | null {
  return node.restsOn.length === 0
    ? null
    : {
        provisional: m.strategy.provisional,
        restsOn: fill(m.business.marks.restsOn, { nodes: listOfNodes(m, locale, node.restsOn) }),
      };
}

/** `business.marks.unchecked` with its nodes, or null when the node rests on nothing unchecked. */
export function uncheckedLine(m: Messages, locale: Locale, node: FoundationNode): string | null {
  return node.unchecked.length === 0
    ? null
    : fill(m.business.marks.unchecked, { nodes: listOfNodes(m, locale, node.unchecked) });
}

type Tail<T, P extends string> = T extends `${P}${infer K}` ? K : never;
type FieldKey = Tail<(typeof BUSINESS_FIELDS)[number]["labelKey"], "business.field.">;
type QuestionKey = Tail<(typeof PROXY_QUESTIONS)[number]["key"], "business.question.">;

/** Both records are built from the engine's tables, whose keys the two `Tail` types above close. */
const FIELD_KEY = Object.fromEntries(
  BUSINESS_FIELDS.map((f) => [f.id, f.labelKey.slice("business.field.".length)]),
) as Record<BusinessFieldId, FieldKey & keyof Business["field"]>;

const QUESTION_KEY = Object.fromEntries(
  PROXY_QUESTIONS.map((q) => [q.id, q.key.slice("business.question.".length)]),
) as Record<ProxyQuestionId, QuestionKey & keyof Business["question"]>;

export function fieldLabel(m: Messages, field: BusinessFieldId): string {
  return m.business.field[FIELD_KEY[field]];
}

export function questionText(m: Messages, id: ProxyQuestionId): string {
  return m.business.question[QUESTION_KEY[id]];
}

/** The label of each intake field, in the catalog entry `INTAKE_FIELDS` names. */
export function intakeLabel(m: Messages, key: IntakeField): string {
  switch (key) {
    case "projectName":
      return m.business.intake.projectName;
    case "idea":
      return m.business.question.offer;
    case "industry":
      return m.business.intake.industry;
    case "customers":
      return m.business.question.bestCustomer;
    case "problem":
      return m.business.question.problem;
    case "competitors":
      return m.business.question.instead;
    case "value":
      return m.business.question.only;
    case "website":
      return m.business.intake.website;
  }
}

/** The date a project was saved, as `formatReadAt` of the brand report shows a read: Bangkok time. */
export function formatSavedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DATE_TAGS[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

/** Notes, meta: the `FIELD_NOTE` of the brand report. */
export const FIELD_NOTE = "text-body-sm text-text-secondary";

/** The line `business-read-1` gives for each reason a result has no model reading. */
export function readReasonLine(m: Messages, reason: BusinessReadReason): string {
  switch (reason) {
    case "ai-not-configured":
      return m.business.errors.aiNotConfigured;
    case "ai-failed":
      return m.business.errors.aiFailed;
    case "ai-rate-limited":
      return m.business.errors.aiRateLimited;
    case "ai-spend-cap":
      return m.business.errors.aiSpendCap;
  }
}

/**
 * "Read by AI (model). Check it before you use it." from the catalog key
 * `brandReport.engine["evidence.fromModel"]`, the model the saved record names. The key holds the
 * engine's line word for word (`brand-report-strings.test.ts` pins it), as `belowFloorLine` reads
 * its own (ORV-287 row 8).
 */
export function fromModelNote(m: Messages, modelId: string): string {
  return fill(m.brandReport.engine["evidence.fromModel"], { model: modelId });
}

/**
 * "Too uncertain to use: the text has fewer than 20 words", from the brand report's catalog table of
 * the engine's lines, which holds `evidence.belowFloor` and the `quality.*` reasons.
 */
export function belowFloorLine(m: Messages, reading: BusinessFieldReading): string {
  return fill(m.brandReport.engine["evidence.belowFloor"], {
    reason: reading.quality.map((key) => m.brandReport.engine[key]).join(", "),
  });
}

/** An evidence item as `EvidenceSpan` takes it: a quote of the brief, or none when it is not one. */
export function briefItem(item: InputEvidence): EvidenceItem | undefined {
  return item.inputKind === "brief-text" ? { ...item, inputKind: "brief-text" } : undefined;
}

/** The items of a list that are quotes of the brief. */
export function briefItems(items: readonly InputEvidence[]): EvidenceItem[] {
  return items.flatMap((item) => briefItem(item) ?? []);
}

/**
 * The quotes a reading drew on, as the reading's own: a model reading's quotes say an AI model read
 * them, as its pill card does (ORV-283, row D6). The record keeps each span's own `fromModel`.
 */
export function readingQuotes(reading: BusinessFieldReading): EvidenceItem[] {
  return briefItems(reading.spans).map((item) => ({ ...item, fromModel: reading.item.fromModel }));
}
