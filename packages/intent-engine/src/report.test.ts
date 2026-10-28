import { describe, expect, it } from "vitest";
import { PERSONALITY_AXES } from "./knowledge";
import { EVIDENCE_STRINGS } from "./evidence-strings";
import { URL_MAX_CHARS } from "./evidence";
import { REPORT_LINES, REPORT_SCHEMA_VERSION, reportSchema } from "./report";

const BUILD = {
  driver: "playwright",
  driverVersion: "1.56.1",
  browser: "chromium",
  browserVersion: "141.0.7390.37",
};

const analysed = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "analysed",
  url: "https://clinic.example/",
  renderer: null,
  evidence: [],
  notMeasured: [{ what: "colour-area", reason: "no-renderer" }],
  personality: PERSONALITY_AXES.map((axis) => ({ axis, leans: [] })),
  lines: ["report.conflictsNotChecked"],
  ...over,
});

const notRead = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "not-read",
  url: "https://rival.example/",
  line: "read.notRead.competitor",
  ...over,
});

const refused = (over: Record<string, unknown> = {}) => ({
  version: REPORT_SCHEMA_VERSION,
  status: "refused",
  url: "http://127.0.0.1/",
  urlCut: false,
  key: "read.refused.address",
  line: "read.refused.address",
  ...over,
});

const ok = (value: unknown) => reportSchema.safeParse(value).success;
const omit = (obj: Record<string, unknown>, key: string) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));

describe("reportSchema", () => {
  it("is version 1.0 with one report line", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("1.0");
    expect([...REPORT_LINES]).toEqual(["report.conflictsNotChecked"]);
  });

  it("every report line has a string", () => {
    for (const line of REPORT_LINES) expect(line in EVIDENCE_STRINGS).toBe(true);
  });

  describe("the analysed member", () => {
    it("parses a report with a renderer, with none, and with a snapshot-free not-measured list", () => {
      expect(ok(analysed())).toBe(true);
      expect(ok(analysed({ renderer: BUILD, notMeasured: [] }))).toBe(true);
    });

    it("refuses a missing, an extra and a misplaced field", () => {
      expect(ok(omit(analysed(), "evidence"))).toBe(false);
      expect(ok(analysed({ snapshot: {} }))).toBe(false);
      expect(ok(analysed({ version: "1.1" }))).toBe(false);
    });

    it("holds one personality entry per axis, in axis order", () => {
      const entries = PERSONALITY_AXES.map((axis) => ({ axis, leans: [] }));
      expect(ok(analysed({ personality: entries.slice(1) }))).toBe(false);
      expect(ok(analysed({ personality: [...entries, entries[0]] }))).toBe(false);
    });

    it("refuses an extra key on a personality entry", () => {
      const entries = PERSONALITY_AXES.map((axis, i) => ({
        axis,
        leans: [],
        ...(i === 0 ? { x: 1 } : {}),
      }));
      expect(ok(analysed({ personality: entries }))).toBe(false);
    });

    it("refuses personality entries out of axis order", () => {
      const entries = PERSONALITY_AXES.map((axis) => ({ axis, leans: [] }));
      const swapped = [entries[1], entries[0], ...entries.slice(2)];
      expect(ok(analysed({ personality: swapped }))).toBe(false);
    });

    it("caps leans and evidence at 5000 entries", () => {
      const lean = { lean: "high", evidenceId: "e1", confidence: 0.6 };
      const withLeans = (n: number) =>
        analysed({
          personality: PERSONALITY_AXES.map((axis, i) => ({
            axis,
            leans: i === 0 ? Array.from({ length: n }, () => lean) : [],
          })),
        });
      expect(ok(withLeans(5000))).toBe(true);
      expect(ok(withLeans(5001))).toBe(false);
      // Items of the wrong shape also fail, so the cap is read from its own issue.
      const over = reportSchema.safeParse(
        analysed({ evidence: Array.from({ length: 5001 }, () => ({})) }),
      );
      expect(
        over.error?.issues.some((i) => i.code === "too_big" && i.path.join() === "evidence"),
      ).toBe(true);
    });

    it("refuses a not-measured entry outside notMeasuredSchema", () => {
      expect(ok(analysed({ notMeasured: [{ what: "colour-area", reason: "other" }] }))).toBe(false);
    });

    it("holds at most four not-measured entries and at most 2048 characters of url", () => {
      const four = ["colour-area", "contrast-pair", "density", "text-visibility"].map((what) => ({
        what,
        reason: "no-renderer",
      }));
      expect(ok(analysed({ notMeasured: four }))).toBe(true);
      expect(ok(analysed({ notMeasured: [...four, four[0]] }))).toBe(false);
      expect(ok(analysed({ url: "a".repeat(URL_MAX_CHARS) }))).toBe(true);
      expect(ok(analysed({ url: "a".repeat(URL_MAX_CHARS + 1) }))).toBe(false);
    });

    it("refuses a lean outside high and low and an extra key on a lean", () => {
      const leans = (lean: unknown, extra: Record<string, unknown> = {}) =>
        analysed({
          personality: PERSONALITY_AXES.map((axis, i) => ({
            axis,
            leans: i === 0 ? [{ lean, evidenceId: "e1", confidence: 0.6, ...extra }] : [],
          })),
        });
      expect(ok(leans("high"))).toBe(true);
      expect(ok(leans("middle"))).toBe(false);
      expect(ok(leans("low", { picked: true }))).toBe(false);
    });
  });

  describe("the not-read member", () => {
    it("parses the competitor record and nothing more", () => {
      expect(ok(notRead())).toBe(true);
      expect(ok(notRead({ evidence: [] }))).toBe(false);
      expect(ok(notRead({ line: "read.refused.address" }))).toBe(false);
      expect(ok(notRead({ url: "a".repeat(URL_MAX_CHARS + 1) }))).toBe(false);
    });
  });

  // Rows D-3 and D-4: the JSON the command writes for a refused or failed read.
  describe("the refused member", () => {
    it("parses row D-3: an address refusal, uncut and cut", () => {
      expect(ok(refused())).toBe(true);
      const cut = "https://rival.example/" + "a".repeat(2026);
      expect(cut.length).toBe(URL_MAX_CHARS);
      expect(ok(refused({ url: cut, urlCut: true }))).toBe(true);
      expect(ok(refused({ url: cut + "a" }))).toBe(false);
    });

    it("parses row D-4: a failed read keyed by its reason", () => {
      expect(
        ok(
          refused({
            url: "https://nowhere.example/",
            key: "network",
            line: "read.failed.network",
          }),
        ),
      ).toBe(true);
    });

    it("parses every outcome of report-outcome-1 with its own line", () => {
      const outcomes: [string, string][] = [
        ["read.refused.address", "read.refused.address"],
        ["read.refused.robots", "read.refused.robots"],
        ["timeout", "read.failed.timeout"],
        ["network", "read.failed.network"],
        ["redirects", "read.failed.redirects"],
        ["not-html", "read.failed.notHtml"],
      ];
      for (const [key, line] of outcomes) {
        expect(ok(refused({ key, line }))).toBe(true);
        expect(line in EVIDENCE_STRINGS).toBe(true);
      }
    });

    it("refuses a line that is not the key's line, and a key or line outside the six", () => {
      expect(ok(refused({ key: "timeout", line: "read.failed.network" }))).toBe(false);
      expect(ok(refused({ key: "read.refused.robots", line: "read.refused.address" }))).toBe(false);
      expect(ok(refused({ key: "network", line: "network" }))).toBe(false);
      expect(ok(refused({ key: "other", line: "read.refused.other" }))).toBe(false);
      expect(ok(refused({ key: "read.notRead.competitor", line: "read.notRead.competitor" }))).toBe(
        false,
      );
    });

    it("holds no evidence, no notMeasured and no personality, and needs urlCut", () => {
      expect(ok(refused({ evidence: [] }))).toBe(false);
      expect(ok(refused({ notMeasured: [] }))).toBe(false);
      expect(ok(refused({ personality: [] }))).toBe(false);
      expect(ok(omit(refused(), "urlCut"))).toBe(false);
      expect(ok(refused({ urlCut: "no" }))).toBe(false);
    });
  });

  it("refuses an unknown status and a missing one", () => {
    expect(ok(refused({ status: "failed" }))).toBe(false);
    expect(ok({})).toBe(false);
  });

  // Row 38, beyond the row (F56).
  it("report lines are unique and in REPORT_LINES order", () => {
    expect(ok(analysed({ lines: ["report.conflictsNotChecked"] }))).toBe(true);
    expect(ok(analysed({ lines: [] }))).toBe(true);
    const repeat = reportSchema.safeParse(
      analysed({ lines: ["report.conflictsNotChecked", "report.conflictsNotChecked"] }),
    );
    expect(repeat.success).toBe(false);
    // The refine runs before the cap, so a repeat at 1.0 shows `custom` beside `too_big`.
    const codes = repeat.error?.issues.map((i) => i.code) ?? [];
    expect(codes).toContain("custom");
    expect(codes).toContain("too_big");
    expect(ok(analysed({ lines: ["industry.byNameOnly"] }))).toBe(false);
  });
});
