import type { ChromaticFamily, LineupAudit } from "../color-audit";
import { COLOR_RULES, decideColor, type ColorDecisionResult } from "../color-rules";
import { PERSONALITY_AXES } from "../knowledge";
import { evaluateScope, type BriefFacts, type ColorDecisionValue, type RuleAction } from "../rules";
import {
  checkEntry,
  type AxisValue,
  type EntryRequest,
  type NewestByNode,
  type TypographyScripts,
} from "./foundation";

/**
 * The expression rules (ORV-298 tech notes section 6): the adapter around ORV-20's colour rules and
 * the checks of the lineup editor. Pure functions over stored entries, called by the view and by
 * the server door alike. Rule-based, not AI: no model, no clock, no network, and nothing here is
 * stored. It imports `foundation.ts` and ORV-20's modules, and nothing from `foundation-marks.ts`
 * or `view.ts`, so the marks can import it without a cycle.
 */

export type ColorAxes = Record<"expressive" | "warm" | "premium", AxisValue>;
export type SignatureFamily = ColorDecisionValue<"signature">; // lime, cyan, magenta, teal

/** The priority of the rule that names a family outright; a lower one is its fallback. */
const SIGNATURE_PRIORITY = 80;

export type ColorOutcome = {
  status: ColorDecisionResult["status"];
  signature: null | {
    value: SignatureFamily;
    /** The winning rule id, for example `color.signature.lime-warm`. */
    rule: string;
    /** Priority 80, or its fallback of priority 70. */
    because: "signature" | "fallback";
    /** The priority 80 family of the same band and warmth, for a fallback only. */
    preferred: ChromaticFamily | null;
  };
  neutral: null | { value: ColorDecisionValue<"neutral">; rule: string };
  canvas: null | { value: ColorDecisionValue<"canvas">; rule: string };
  /** Why the signature is open, when it is and the status is needs-input. */
  signatureOpen:
    | null
    | { why: "waitsForLineup" }
    | { why: "bothCrowded"; first: ChromaticFamily; second: ChromaticFamily };
  /** The questions of `decideColor`, mapped to the node that would answer each, in ORV-126 number order. */
  asks: Array<"competitive-frame" | "identity-frame">;
  /** A conflicted or invalid result: no decision shown. */
  notDecided: boolean;
  /** The three axis values the reasons quote, or null with no given personality. */
  axes: ColorAxes | null;
  /** `auditLineup`'s result, or null with no lineup. */
  audit: LineupAudit | null;
  /** How many of the three decisions are made. */
  decided: 0 | 1 | 2 | 3;
};

/** The nodes a question maps to, in ORV-126 number order (5, then 7). */
const ASK_ORDER = ["competitive-frame", "identity-frame"] as const;

function askedOf(questions: readonly string[]): ColorOutcome["asks"] {
  const asked = new Set<(typeof ASK_ORDER)[number]>();
  for (const question of questions) {
    if (question === "lineup") asked.add("competitive-frame");
    else if (PERSONALITY_AXES.some((axis) => question === `personality.${axis}`)) {
      asked.add("identity-frame");
    }
  }
  return ASK_ORDER.filter((node) => asked.has(node));
}

const SIGNATURE_RULES = COLOR_RULES.filter((rule) =>
  rule.then.some((action) => action.set === "signature"),
);

/**
 * The two families the signature rules name for a personality, the priority 80 one first, or null
 * when the axes the rules read are not all given. ORV-20's own evaluator runs the signature rules
 * with nothing crowded, so exactly the rule of the band and warmth and its fallback fire; no
 * threshold is copied here.
 */
export function colorCandidates(
  personality: BriefFacts["personality"],
): [ChromaticFamily, ChromaticFamily] | null {
  const evaluation = evaluateScope(
    SIGNATURE_RULES,
    { personality, industry: null, audiences: [], avoid: [], crowded: [] },
    ["signature"],
  );
  const fired = SIGNATURE_RULES.filter((rule) => evaluation.fired.includes(rule.id)).sort(
    (a, b) => b.priority - a.priority,
  );
  const families = fired.map(
    (rule) =>
      rule.then.find(
        (action): action is Extract<RuleAction, { set: "signature" }> => action.set === "signature",
      )?.to,
  );
  const [first, second] = families;
  return fired.length === 2 && first !== undefined && second !== undefined ? [first, second] : null;
}

type ColorKey = "signature" | "neutral" | "canvas";

/** A decision `decideColor` made, with the one rule that won it; none without a named rule. */
function decisionOf<K extends ColorKey>(
  result: ColorDecisionResult,
  key: K,
): { value: ColorDecisionValue<K>; rule: string; priority: number } | null {
  const decision = result.evaluation.decisions[key];
  const rule = decision?.rules[0];
  if (decision === undefined || rule === undefined) return null;
  // The value is one the rule's own action set, so it is a member of the key's list.
  return { value: decision.value as ColorDecisionValue<K>, rule, priority: decision.priority };
}

/**
 * What the Colour node shows for a `decideColor` result (`color-node-1`): each decision with its
 * winning rule, the questions by node, and why the signature is open. A decision shows only on a
 * resolved or needs-input result; a conflicted or invalid one has none and says so. Never a value
 * `decideColor` did not give.
 */
export function colorOutcome(result: ColorDecisionResult, axes: ColorAxes | null): ColorOutcome {
  const shows = result.status === "resolved" || result.status === "needs-input";
  const signature = shows ? decisionOf(result, "signature") : null;
  const neutral = shows ? decisionOf(result, "neutral") : null;
  const canvas = shows ? decisionOf(result, "canvas") : null;
  let signatureOpen: ColorOutcome["signatureOpen"] = null;
  if (result.status === "needs-input" && signature === null) {
    if (result.questions.includes("lineup")) {
      signatureOpen = { why: "waitsForLineup" };
    } else if (axes !== null && result.audit !== null) {
      const pair = colorCandidates(axes);
      if (pair !== null) signatureOpen = { why: "bothCrowded", first: pair[0], second: pair[1] };
    }
  }
  const made = [signature, neutral, canvas].filter((d) => d !== null).length as 0 | 1 | 2 | 3;
  const fallback = signature !== null && signature.priority !== SIGNATURE_PRIORITY;
  return {
    status: result.status,
    signature:
      signature === null
        ? null
        : {
            value: signature.value,
            rule: signature.rule,
            because: fallback ? "fallback" : "signature",
            preferred: fallback ? (colorCandidates(axes ?? {})?.[0] ?? null) : null,
          },
    neutral: neutral === null ? null : { value: neutral.value, rule: neutral.rule },
    canvas: canvas === null ? null : { value: canvas.value, rule: canvas.rule },
    signatureOpen,
    asks: askedOf(result.questions),
    notDecided: result.status === "conflicted" || result.status === "invalid",
    axes,
    audit: result.audit,
    decided: made,
  };
}

/**
 * The colour of a project from its stored entries: the personality axes of the newest given
 * `identity-frame` entry (none when it holds none or a skip) and the stored lineup. Stored entries
 * passed `storedEntrySchema`, so `decideColor`'s input check cannot throw on them.
 */
export function colorOf(newest: NewestByNode): ColorOutcome {
  const entry = newest["identity-frame"];
  const given = entry?.kind === "given" ? entry : null;
  const lineup = newest["competitive-frame"]?.payload.lineup ?? null;
  const result = decideColor({
    facts: { personality: given?.payload.axes ?? {}, industry: null, audiences: [], avoid: [] },
    lineup,
  });
  const axes: ColorAxes | null =
    given === null
      ? null
      : {
          expressive: given.payload.axes.expressive,
          warm: given.payload.axes.warm,
          premium: given.payload.axes.premium,
        };
  return colorOutcome(result, axes);
}

/** One row of the lineup editor, as the person typed it. */
export type LineupRow = { name: string; hex: string };

/** The bound of a competitor's name, in code points (`lineupSchema`). */
const LINEUP_NAME_MAX = 60;

/** `row` is the index in the rows the person has, empty rows counted, from 0. */
export type LineupRowProblem =
  | { kind: "lineupRequired" }
  | { kind: "rowIncomplete"; row: number; field: "name" | "hex" }
  | { kind: "hexInvalid"; row: number }
  | { kind: "nameRepeated"; row: number }
  | { kind: "tooLong"; row: number; max: typeof LINEUP_NAME_MAX }
  /** More rows than the lineup holds; the editor does not offer a row past twenty. */
  | { kind: "lineupMax" };

/** The order the editor shows the lines in (`lineup-input-1`): the first problem is the first shown. */
const PROBLEM_ORDER: Record<LineupRowProblem["kind"], number> = {
  lineupRequired: 0,
  rowIncomplete: 1,
  hexInvalid: 2,
  nameRepeated: 3,
  tooLong: 4,
  lineupMax: 5,
};

const LINEUP_FIELD = /^payload\.lineup\.(\d+)\.(name|hex)$/;

/**
 * The checks of the lineup editor (`lineup-input-1`), before any call: a row with both fields empty
 * after the trim is dropped; a row with one empty field is incomplete, and the check stops there;
 * with no row left a lineup is required; else the engine's own `checkEntry` runs and each of its
 * problems goes back to the row the person typed it in. Problems carry a kind and a row, never a
 * name or a colour. The project id is the caller's: a value that is no UUID is a bug, not input.
 */
export function checkLineupRows(
  rows: readonly LineupRow[],
  projectId: string,
):
  | { ok: true; request: Extract<EntryRequest, { node: "competitive-frame" }> }
  | { ok: false; problems: LineupRowProblem[] } {
  const kept = rows
    .map((row, at) => ({ at, name: row.name.trim(), hex: row.hex.trim() }))
    .filter((row) => row.name !== "" || row.hex !== "");
  if (kept.length === 0) return { ok: false, problems: [{ kind: "lineupRequired" }] };
  const incomplete = kept.flatMap((row): LineupRowProblem[] =>
    row.name === ""
      ? [{ kind: "rowIncomplete", row: row.at, field: "name" }]
      : row.hex === ""
        ? [{ kind: "rowIncomplete", row: row.at, field: "hex" }]
        : [],
  );
  if (incomplete.length > 0) return { ok: false, problems: incomplete };

  const checked = checkEntry({
    projectId,
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup: kept.map(({ name, hex }) => ({ name, hex })) },
  });
  if (checked.ok) {
    const { entry } = checked;
    if (entry.node !== "competitive-frame") throw new Error("checkLineupRows: not a lineup entry");
    return {
      ok: true,
      request: { node: entry.node, kind: entry.kind, payload: entry.payload },
    };
  }

  const problems: LineupRowProblem[] = [];
  for (const problem of checked.problems) {
    if (problem.path === "projectId") throw new Error("checkLineupRows: the project id is no UUID");
    if (problem.path === "payload.lineup") {
      problems.push({ kind: "lineupMax" });
      continue;
    }
    const field = LINEUP_FIELD.exec(problem.path);
    const row = kept[Number(field?.[1])]?.at;
    if (field === null || row === undefined) continue;
    if (field[2] === "hex") {
      // A row that reaches the check has a colour, so any problem on it is a form problem.
      problems.push({ kind: "hexInvalid", row });
    } else if (problem.kind === "too-long") {
      problems.push({ kind: "tooLong", row, max: LINEUP_NAME_MAX });
    } else if (problem.kind === "required") {
      problems.push({ kind: "rowIncomplete", row, field: "name" });
    } else {
      problems.push({ kind: "nameRepeated", row });
    }
  }
  // The sort is stable and the check lists one kind of problem in row order, so rows stay in order.
  problems.sort((a, b) => PROBLEM_ORDER[a.kind] - PROBLEM_ORDER[b.kind]);
  return { ok: false, problems };
}

/**
 * The curated family list (`typography-families-1`), the one home of every typeface the typography
 * rule can name. A family is listed only with its licence and the path of the licence text in the
 * repo, from the repo root. The list is data: the engine reads no file, and a test reads each path.
 * Nothing is imported from `suggest.ts`.
 */
export const TYPOGRAPHY_FAMILIES = [
  {
    id: "sarabun",
    family: "Sarabun",
    script: "thai",
    style: "looped",
    roles: ["reading"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-sarabun.txt",
  },
  {
    id: "anuphan",
    family: "Anuphan",
    script: "thai",
    style: "loopless",
    roles: ["display"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-anuphan.txt",
  },
  {
    id: "inter",
    family: "Inter",
    script: "latin",
    style: "latinSans",
    roles: ["reading", "display"],
    licence: "OFL-1.1",
    licenceName: "SIL Open Font License 1.1",
    licenceFile: "packages/design-system/src/tokens/fonts/LICENSE-inter.txt",
  },
] as const;

/** A family as the view shows it; the words around it stay keys the view resolves. */
export type Face = {
  id: (typeof TYPOGRAPHY_FAMILIES)[number]["id"];
  /** Shown as written, in both languages. */
  family: string;
  /** A key of `business.typography.style.*`. */
  style: "looped" | "loopless" | "latinSans";
  /** The licence name, shown as written, in both languages. */
  licence: string;
  /** The reason of the role: the Thai reading and display families only. */
  because: "reading" | "display" | null;
};

export type TypographyOutcome = { reading: Face[]; display: Face[]; pairing: boolean };

/** The scripts each answer names (`typography-node-1`), Thai first. */
const SCRIPTS_OF: Record<TypographyScripts, ReadonlyArray<"thai" | "latin">> = {
  "thai-latin": ["thai", "latin"],
  thai: ["thai"],
  latin: ["latin"],
};

function facesFor(scripts: TypographyScripts, role: "reading" | "display"): Face[] {
  // The families are listed Thai first, so each script's families come out in the answer's order.
  return SCRIPTS_OF[scripts].flatMap((script) =>
    TYPOGRAPHY_FAMILIES.filter(
      (family) => family.script === script && (family.roles as readonly string[]).includes(role),
    ).map((family): Face => ({
      id: family.id,
      family: family.family,
      style: family.style,
      licence: family.licenceName,
      because: family.script === "thai" ? role : null,
    })),
  );
}

/**
 * `typography-node-1`: for each role, the families whose script the answer names and whose role
 * matches, Thai first, then Latin. No axis is read and nothing is stored; null with no answer.
 */
export function typographyOf(scripts: TypographyScripts | null): TypographyOutcome | null {
  if (scripts === null) return null;
  return {
    reading: facesFor(scripts, "reading"),
    display: facesFor(scripts, "display"),
    pairing: scripts === "thai-latin",
  };
}

/** What each expression node decides, from the stored entries. PR 3 adds logo type. */
export type ExpressionOutcomes = {
  color: ColorOutcome;
  typography: TypographyOutcome | null;
};

export function expressionOf(newest: NewestByNode): ExpressionOutcomes {
  return {
    color: colorOf(newest),
    typography: typographyOf(newest.typography?.payload.scripts ?? null),
  };
}
