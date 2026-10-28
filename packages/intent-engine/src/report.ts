import { z } from "zod";
import { URL_MAX_CHARS, inputEvidenceSchema } from "./evidence";
import { PERSONALITY_AXES, personalityAxisSchema } from "./knowledge";
import { rendererBuildSchema } from "./render-snapshot";
import { notMeasuredSchema } from "./url-analyser";

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
    url: z.string().max(URL_MAX_CHARS), // userinfo dropped, then cut at URL_MAX_CHARS
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
