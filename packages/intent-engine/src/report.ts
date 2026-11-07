import { z } from "zod";
import { URL_MAX_CHARS, inputEvidenceSchema } from "./evidence";
import { PERSONALITY_AXES, personalityAxisSchema } from "./knowledge";
import { rendererBuildSchema } from "./render-snapshot";
import type { ReadResult } from "./read-page";
import { analyseUrl, notMeasuredSchema, type AnalyserContext, type NotRead } from "./url-analyser";

/** The command's `--json` contract (tech notes section 7, "The report schema"). A minor bump for each member a later slice adds. */
export const REPORT_SCHEMA_VERSION = "1.0";

/** The report lines keyed in `lines`, in print order. The cap on `lines` is its size (F44). */
export const REPORT_LINES = ["report.conflictsNotChecked"] as const;

const REFUSED_KEYS = [
  "read.refused.robots",
  "read.refused.address",
  "timeout",
  "network",
  "redirects",
  "not-html",
] as const;
const REFUSED_LINE_KEYS = [
  "read.refused.robots",
  "read.refused.address",
  "read.failed.timeout",
  "read.failed.network",
  "read.failed.redirects",
  "read.failed.notHtml",
] as const;

/** The strings key of the line each refusal or failure key prints (rule report-outcome-1). Typed on both lists, so a new key needs a line. */
const REFUSED_LINES: Record<(typeof REFUSED_KEYS)[number], (typeof REFUSED_LINE_KEYS)[number]> = {
  "read.refused.robots": "read.refused.robots",
  "read.refused.address": "read.refused.address",
  timeout: "read.failed.timeout",
  network: "read.failed.network",
  redirects: "read.failed.redirects",
  "not-html": "read.failed.notHtml",
};

const notReadReportSchema = z
  .object({
    version: z.literal(REPORT_SCHEMA_VERSION),
    status: z.literal("not-read"), // a competitor URL recorded as text (rule competitor-not-read-1)
    url: z.string().max(URL_MAX_CHARS), // as the person gave it, never fetched
    line: z.literal("read.notRead.competitor"),
  })
  .strict();

const axisReportSchema = z
  .object({
    axis: personalityAxisSchema,
    leans: z // empty: the report prints "no signal"; every reading above the floor, none picked
      .array(
        z
          .object({ lean: z.enum(["high", "low"]), evidenceId: z.string(), confidence: z.number() })
          .strict(),
      )
      .max(5000),
  })
  .strict();

const analysedReportSchema = z
  .object({
    version: z.literal(REPORT_SCHEMA_VERSION),
    status: z.literal("analysed"),
    url: z.string().max(URL_MAX_CHARS), // the URL read, after redirects
    renderer: rendererBuildSchema.nullable(), // null under option D
    evidence: z.array(inputEvidenceSchema).max(5000),
    notMeasured: z.array(notMeasuredSchema).max(4),
    personality: z
      .array(axisReportSchema)
      .length(5)
      .refine((a) => a.every((e, i) => e.axis === PERSONALITY_AXES[i]), {
        message: "one entry per personality axis, in axis order",
      }),
    lines: z
      .array(z.enum(REPORT_LINES))
      .refine(
        // each index above the one before: unique and in REPORT_LINES order (F56); before .max, so zod 4 runs it on a repeat at 1.0
        (l) =>
          l.map((x) => REPORT_LINES.indexOf(x)).every((n, i, a) => i === 0 || (a[i - 1] ?? n) < n),
        { message: "lines are unique and in REPORT_LINES order" },
      )
      .max(REPORT_LINES.length),
  })
  .strict();

const refusedReportSchema = z
  .object({
    version: z.literal(REPORT_SCHEMA_VERSION),
    status: z.literal("refused"), // a refused or failed read; no evidence, no notMeasured, no personality
    url: z.string().max(URL_MAX_CHARS), // the parser's origin and a slash, or empty, then cut
    urlCut: z.boolean(),
    key: z.enum(REFUSED_KEYS),
    line: z.enum(REFUSED_LINE_KEYS),
  })
  .strict()
  .refine((r) => REFUSED_LINES[r.key] === r.line, { message: "line is the key's line" });

export const reportSchema = z.discriminatedUnion("status", [
  notReadReportSchema,
  analysedReportSchema,
  refusedReportSchema,
]);
export type Report = z.infer<typeof reportSchema>;

/**
 * report-outcome-1, the `url` of a refused member: the origin the URL parser reads from `given`,
 * with a slash after it, cut at URL_MAX_CHARS. It is empty when the parser rejects the text or reads
 * no origin (an opaque path such as `view-source:` gives the text `null`). A URL origin has no place
 * for a username, a password, a path or a query, so none of them can be shown.
 * The limit: the origin keeps what the parser reads as the host or the port. A slash or a backslash
 * inside a username or a password ends the authority early, so the text before it stays as the host
 * (https://user\:secret@example.com/ gives https://user/).
 */
function refusedUrlOf(given: string): { url: string; urlCut: boolean } {
  let origin: string;
  try {
    origin = new URL(given).origin;
  } catch {
    return { url: "", urlCut: false }; // the parser rejects the text
  }
  if (origin === "null") return { url: "", urlCut: false }; // the parser reads no origin
  const url = `${origin}/`;
  if (url.length <= URL_MAX_CHARS) return { url, urlCut: false };
  return { url: url.slice(0, URL_MAX_CHARS), urlCut: true }; // an origin is ASCII: no half pair
}

type ReportMemberBuilt =
  | { ok: true; report: Report }
  | { ok: false; error: "id-collision" | "competitor-not-read" | "report-invalid" };

/**
 * Rule report-outcome-1 (ORV-266 spec, without the command's exit codes): one member of
 * `reportSchema` for each read outcome. `given` is the URL as the person gave it; `outcome` is what
 * `readUrlInput` returned. A `read` is analysed with `analyseUrl`; its personality entries hold the
 * readings that are not below the floor, in axis order, none picked. A result no report fits (the
 * analyser's refusal, or a report `reportSchema` rejects) is `ok: false`, never a throw. Pure:
 * `ctx.retrievedAt` is the caller's clock reading.
 */
export function reportOf(
  given: string,
  outcome: ReadResult | NotRead,
  snapshot: unknown | null,
  ctx: AnalyserContext,
): ReportMemberBuilt {
  let candidate: unknown;
  if (outcome.status === "not-read") {
    candidate = {
      version: REPORT_SCHEMA_VERSION,
      status: "not-read",
      url: outcome.url,
      line: outcome.line,
    };
  } else if (outcome.status === "read") {
    const analysis = analyseUrl(outcome, snapshot, ctx);
    if (!analysis.ok) return { ok: false, error: analysis.error };
    candidate = {
      version: REPORT_SCHEMA_VERSION,
      status: "analysed",
      url: outcome.url,
      renderer: analysis.renderer,
      evidence: analysis.evidence,
      notMeasured: analysis.notMeasured,
      personality: PERSONALITY_AXES.map((axis) => ({
        axis,
        leans: analysis.evidence.flatMap((item) =>
          item.reading !== null &&
          item.reading.target === `identity-frame.personality.${axis}` &&
          "lean" in item.reading.value &&
          !item.belowFloor
            ? [
                {
                  lean: item.reading.value.lean,
                  evidenceId: item.id,
                  confidence: item.confidence.value,
                },
              ]
            : [],
        ),
      })),
      lines: [...REPORT_LINES],
    };
  } else {
    const key = outcome.reason;
    candidate = {
      version: REPORT_SCHEMA_VERSION,
      status: "refused",
      ...refusedUrlOf(given),
      key,
      line: REFUSED_LINES[key],
    };
  }
  const parsed = reportSchema.safeParse(candidate);
  return parsed.success
    ? { ok: true, report: parsed.data }
    : { ok: false, error: "report-invalid" };
}
