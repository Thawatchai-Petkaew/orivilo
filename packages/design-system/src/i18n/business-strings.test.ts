import {
  BUSINESS_FIELDS,
  BUSINESS_NODES,
  BUSINESS_READ_REASONS,
  INTAKE_FIELDS,
  PROXY_QUESTIONS,
} from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import {
  belowFloorLine,
  fieldLabel,
  fromModelNote,
  intakeLabel,
  nodeTitle,
  questionText,
  readReasonLine,
} from "../examples/business-text";
import { LOCALES } from "./locale";
import { messagesFor } from "./messages/index";

/**
 * The business screens (ORV-281, task A5, T20) look the engine's keys up in `business.*`. These
 * tests hold the catalog to the engine's own words and keys, in both languages: the six
 * `business.question.*` lines are ORV-126's proxy question copy word for word, every key the engine
 * names resolves to a string, and the catalog holds the keys of the spec's Strings section and no
 * other.
 */

/** Walks a dotted key such as `business.question.offer` down the catalog. */
function at(catalog: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    return typeof node === "object" && node !== null
      ? (node as Record<string, unknown>)[part]
      : undefined;
  }, catalog);
}

function leafKeys(tree: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : leafKeys(value as Record<string, unknown>, `${prefix}${key}.`),
  );
}

/** Every `business.*` key of the spec's Strings section, `home.openBusiness` apart (it lives in the app). */
const SPEC_KEYS = [
  "business.list.heading",
  "business.list.new",
  "business.list.empty",
  "business.intake.heading",
  "business.intake.lede",
  "business.intake.projectName",
  "business.intake.industry",
  "business.intake.website",
  "business.intake.optional",
  "business.intake.submit",
  "business.intake.pending",
  "business.intake.offerRequired",
  "business.intake.nameRequired",
  "business.intake.tooLong",
  "business.intake.websiteInvalid",
  "business.question.offer",
  "business.question.bestCustomer",
  "business.question.problem",
  "business.question.instead",
  "business.question.only",
  "business.question.why",
  "business.node.situation",
  "business.node.businessCore",
  "business.node.audience",
  "business.node.competitiveFrame",
  "business.node.positioning",
  "business.field.industry",
  "business.field.name",
  "business.field.website",
  "business.field.offer",
  "business.field.why",
  "business.field.customers",
  "business.field.problem",
  "business.field.category",
  "business.field.alternatives",
  "business.field.value",
  "business.state.proposed",
  "business.state.skipped",
  "business.state.empty",
  "business.state.gate",
  "business.stillToAsk",
  "business.label.yourWords",
  "business.label.aiUnavailable",
  "business.label.confidence",
  "business.reading.confidence",
  "business.industry.awaitingTaxonomy",
  "business.website.notRead",
  "business.competitors.coloursNotRead",
  "business.board.lede",
  "business.board.savedAt",
  "business.board.label",
  "business.signedOut",
  "business.signInLink",
  "business.notAllowed",
  "business.notConfigured",
  "business.errors.aiNotConfigured",
  "business.errors.aiFailed",
  "business.errors.aiRateLimited",
  "business.errors.aiSpendCap",
];

describe("business catalog", () => {
  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: holds the keys of the spec's Strings section and no other`, () => {
      const keys = leafKeys({ business: m.business });
      expect([...keys].sort()).toEqual([...SPEC_KEYS].sort());
    });

    it(`${locale}: every business.question line is word for word the ORV-126 proxy question`, () => {
      const wrong = PROXY_QUESTIONS.filter((q) => at(m, q.key) !== q[locale]).map((q) => q.id);
      expect(wrong).toEqual([]);
      // The six questions are the catalog's whole `question` group.
      expect(Object.keys(m.business.question)).toHaveLength(PROXY_QUESTIONS.length);
    });

    it(`${locale}: every proxy question id resolves to its own catalog line`, () => {
      for (const q of PROXY_QUESTIONS) expect(questionText(m, q.id)).toBe(q[locale]);
    });

    it(`${locale}: every business field label key the engine names resolves to that line`, () => {
      expect(BUSINESS_FIELDS).toHaveLength(10);
      for (const f of BUSINESS_FIELDS) {
        const line = at(m, f.labelKey);
        expect(typeof line, f.labelKey).toBe("string");
        expect(fieldLabel(m, f.id)).toBe(line);
      }
    });

    it(`${locale}: every intake field label is the catalog line INTAKE_FIELDS names`, () => {
      expect(INTAKE_FIELDS.map((f) => f.key)).toHaveLength(8);
      for (const f of INTAKE_FIELDS) {
        const line = at(m, f.question);
        expect(typeof line, f.question).toBe("string");
        expect(intakeLabel(m, f.key)).toBe(line);
      }
    });

    it(`${locale}: the five node titles are distinct, in fill order`, () => {
      const titles = BUSINESS_NODES.map((id) => nodeTitle(m, id));
      expect(titles).toEqual([
        m.business.node.situation,
        m.business.node.businessCore,
        m.business.node.audience,
        m.business.node.competitiveFrame,
        m.business.node.positioning,
      ]);
      expect(new Set(titles).size).toBe(5);
    });

    it(`${locale}: spells the {max}, {date} and {value} slots`, () => {
      expect(m.business.intake.tooLong).toContain("{max}");
      expect(m.business.board.savedAt).toContain("{date}");
      expect(m.business.reading.confidence).toContain("{value}");
    });
  }
});

/**
 * The lines of the slice 3 rows (ORV-283, rows 31 and 33): one `business.errors.*` line for each
 * reason a result has no model reading, in the order the spec gives them, and the three lines the
 * view takes from the engine's ORV-128 table, word for word in each language.
 */
describe("business readings, strings", () => {
  const LINES = {
    en: {
      "ai-not-configured":
        "AI is not set up in this environment, so only your own words are shown.",
      "ai-failed": "AI could not read your answers, so only your own words are shown.",
      "ai-rate-limited":
        "You have reached the limit for AI readings, so only your own words are shown.",
      "ai-spend-cap":
        "This workspace has used its AI budget for this month, so only your own words are shown.",
    },
    th: {
      "ai-not-configured": "สภาพแวดล้อมนี้ยังไม่ได้ตั้งค่า AI จึงแสดงเฉพาะคำของคุณเอง",
      "ai-failed": "AI อ่านคำตอบของคุณไม่สำเร็จ จึงแสดงเฉพาะคำของคุณเอง",
      "ai-rate-limited": "ใช้ AI อ่านครบจำนวนที่กำหนดแล้ว จึงแสดงเฉพาะคำของคุณเอง",
      "ai-spend-cap": "เวิร์กสเปซนี้ใช้งบ AI ของเดือนนี้ครบแล้ว จึงแสดงเฉพาะคำของคุณเอง",
    },
  } as const;

  it("the engine names four reasons, in the order of the spec", () => {
    expect([...BUSINESS_READ_REASONS]).toEqual([
      "ai-not-configured",
      "ai-failed",
      "ai-rate-limited",
      "ai-spend-cap",
    ]);
  });

  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: each reason gives its own line, word for word`, () => {
      for (const reason of BUSINESS_READ_REASONS) {
        expect(readReasonLine(m, reason), reason).toBe(LINES[locale][reason]);
      }
      expect(new Set(BUSINESS_READ_REASONS.map((r) => readReasonLine(m, r))).size).toBe(4);
    });
  }

  it("the model line is the engine's, with the saved model id", () => {
    expect(fromModelNote("en", "anthropic/claude-sonnet-5.5")).toBe(
      "Read by AI (anthropic/claude-sonnet-5.5). Check it before you use it.",
    );
    expect(fromModelNote("th", "anthropic/claude-sonnet-5.5")).toBe(
      "AI อ่านค่านี้ (anthropic/claude-sonnet-5.5) โปรดตรวจสอบก่อนนำไปใช้",
    );
  });

  it("a reading below the floor says why, in each language", () => {
    const reading = { quality: ["quality.fewWords"] } as Parameters<typeof belowFloorLine>[1];
    expect(belowFloorLine(messagesFor("en"), reading)).toBe(
      "Too uncertain to use: the text has fewer than 20 words",
    );
    expect(belowFloorLine(messagesFor("th"), reading)).toBe(
      "ยังไม่แน่ชัดพอจะนำไปใช้: ข้อความมีไม่ถึง 20 คำ",
    );
  });
});
