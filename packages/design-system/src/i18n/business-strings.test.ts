import {
  BUSINESS_FIELDS,
  BUSINESS_NODES,
  BUSINESS_READ_REASONS,
  CHROMATIC_FAMILIES,
  COLOR_DECISIONS,
  INTAKE_FIELDS,
  PERSONALITY_AXES,
  PROXY_QUESTIONS,
  START_QUESTIONS,
} from "@orivilo/intent-engine";
import { readFileSync } from "node:fs";
import path from "node:path";
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
import { type Messages, messagesFor } from "./messages/index";

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

/**
 * Every `business.*` key of the spec's Strings section, `home.openBusiness` apart (it lives in the
 * app). The positioning keys are those of ORV-285 PR 1; PR 2 adds the drafted options' keys.
 */
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
  "business.field.statement",
  "business.state.proposed",
  "business.state.skipped",
  "business.state.empty",
  "business.state.gate",
  "business.state.awaitingChoice",
  "business.state.agreed",
  "business.positioning.gatePassed",
  "business.positioning.writeOwn",
  "business.positioning.save",
  "business.positioning.saving",
  "business.positioning.cancel",
  "business.positioning.statementRequired",
  "business.positioning.by.own",
  "business.positioning.stale",
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
  // ORV-291 PR 1: the Brand personality node. PR 2 adds the keys of the next block, PR 3 the core idea's.
  "business.node.identityFrame",
  "business.question.person",
  "business.question.never",
  "business.field.personality",
  "business.field.person",
  "business.field.never",
  "business.axis.playful.low",
  "business.axis.playful.high",
  "business.axis.expressive.low",
  "business.axis.expressive.high",
  "business.axis.structured.low",
  "business.axis.structured.high",
  "business.axis.warm.low",
  "business.axis.warm.high",
  "business.axis.premium.low",
  "business.axis.premium.high",
  "business.identity.axisLegend",
  "business.identity.point",
  "business.identity.hypothesis",
  "business.identity.describe",
  "business.identity.save",
  "business.identity.axesRequired",
  "business.state.given",
  "business.state.waiting",
  "business.marks.unchecked",
  // ORV-291 PR 2 (ORV-295): Brand architecture and Name.
  "business.node.architecture",
  "business.node.name",
  "business.question.subBrands",
  "business.field.subBrands",
  "business.field.architecture",
  "business.field.workingName",
  "business.state.derived",
  "business.state.notInVersion",
  "business.marks.restsOn",
  "business.architecture.no",
  "business.architecture.yes",
  "business.architecture.save",
  "business.architecture.choiceRequired",
  "business.architecture.single",
  "business.architecture.because",
  "business.architecture.notInVersion",
  "business.name.give",
  "business.name.save",
  "business.name.required",
  "business.name.notScreened",
  // ORV-298 PR 1: the Colour node. PR 2 and PR 3 add the typography and logo type keys.
  "business.node.color",
  "business.state.partly",
  "business.state.needsAnswer",
  "business.label.byRule",
  "business.decision.rule",
  "business.question.lineup",
  "business.field.lineup",
  "business.field.crowded",
  "business.field.signature",
  "business.field.neutral",
  "business.field.canvas",
  "business.color.give",
  "business.color.row",
  "business.color.brandName",
  "business.color.hex",
  "business.color.add",
  "business.color.remove",
  "business.color.save",
  "business.color.lineupRequired",
  "business.color.rowIncomplete",
  "business.color.hexInvalid",
  "business.color.nameRepeated",
  "business.color.lineupMax",
  "business.color.givenByYou",
  "business.color.crowdRule",
  "business.color.noneCrowded",
  ...CHROMATIC_FAMILIES.map((family) => `business.color.family.${family}`),
  "business.color.family.ink",
  "business.color.family.paper",
  ...COLOR_DECISIONS.neutral.map((value) => `business.color.neutral.${value}`),
  ...COLOR_DECISIONS.canvas.map((value) => `business.color.canvas.${value}`),
  "business.color.because.signature",
  "business.color.because.fallback",
  "business.color.because.neutral",
  "business.color.because.canvas",
  "business.color.waitsForLineup",
  "business.color.bothCrowded",
  "business.color.needsPersonality",
  "business.color.notDecided",
  "business.color.hypothesis",
  "business.color.familyOnly",
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
      // The `question` group is the proxy questions, the start question and the colour lineup
      // question of ORV-298 (`business.question.lineup`, new copy with no ORV-126 id), and nothing else.
      expect(Object.keys(m.business.question)).toHaveLength(
        PROXY_QUESTIONS.length + START_QUESTIONS.length + 1,
      );
      for (const q of START_QUESTIONS) expect(at(m, q.key), q.key).toBe(q[locale]);
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
    expect(fromModelNote(messagesFor("en"), "anthropic/claude-sonnet-5.5")).toBe(
      "Read by AI (anthropic/claude-sonnet-5.5). Check it before you use it.",
    );
    expect(fromModelNote(messagesFor("th"), "anthropic/claude-sonnet-5.5")).toBe(
      "AI อ่านค่านี้ (anthropic/claude-sonnet-5.5) โปรดตรวจสอบก่อนนำไปใช้",
    );
  });

  it("the AI line reads the catalog", () => {
    const m = messagesFor("en");
    const changed: Messages = {
      ...m,
      brandReport: {
        ...m.brandReport,
        engine: { ...m.brandReport.engine, "evidence.fromModel": "Changed line ({model})" },
      },
    };
    expect(fromModelNote(changed, "m/1")).toBe("Changed line (m/1)");
    expect(fromModelNote(m, "m/1")).toBe("Read by AI (m/1). Check it before you use it.");
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

/**
 * The lines of the positioning gate (ORV-285, PR 1): the keys the spec's Strings table gives in both
 * languages, word for word, and `strategy.skip`, ORV-126's own line. None holds a middot or an em dash.
 */
describe("positioning gate, strings", () => {
  const LINES = {
    en: {
      "business.field.statement": "Positioning statement",
      "business.state.awaitingChoice": "Waiting for your choice",
      "business.state.agreed": "Agreed",
      "business.positioning.gatePassed": "You agreed to this positioning.",
      "business.positioning.writeOwn": "Write my own",
      "business.positioning.save": "Agree to this positioning",
      "business.positioning.saving": "Saving your choice",
      "business.positioning.cancel": "Cancel",
      "business.positioning.statementRequired":
        "Write your positioning before you agree to it, or cancel.",
      "business.positioning.by.own": "Written by you.",
      "business.positioning.stale":
        "Your business answers changed after you agreed to this. Check it again.",
      "strategy.skip": "Skip for now",
    },
    th: {
      "business.field.statement": "ข้อความจุดยืน",
      "business.state.awaitingChoice": "รอให้คุณเลือก",
      "business.state.agreed": "เห็นชอบแล้ว",
      "business.positioning.gatePassed": "คุณเห็นชอบจุดยืนนี้แล้ว",
      "business.positioning.writeOwn": "เขียนเอง",
      "business.positioning.save": "เห็นชอบจุดยืนนี้",
      "business.positioning.saving": "กำลังบันทึกสิ่งที่คุณเลือก",
      "business.positioning.cancel": "ยกเลิก",
      "business.positioning.statementRequired": "เขียนจุดยืนของคุณก่อนกดเห็นชอบ หรือกดยกเลิก",
      "business.positioning.by.own": "คุณเขียนเอง",
      "business.positioning.stale":
        "คำตอบเรื่องธุรกิจของคุณเปลี่ยนไปหลังจากที่คุณเห็นชอบข้อนี้ โปรดตรวจสอบอีกครั้ง",
      "strategy.skip": "ข้ามไปก่อน",
    },
  } as const;

  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: each line is the spec's, word for word, and ORV-126's for strategy.skip`, () => {
      for (const [key, line] of Object.entries(LINES[locale])) {
        expect(at(m, key), key).toBe(line);
      }
    });

    it(`${locale}: no positioning line has a middot or an em dash`, () => {
      const keys = [
        ...leafKeys({ positioning: m.business.positioning }, "business."),
        ...leafKeys({ strategy: m.strategy }),
      ];
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) expect(String(at(m, key)), key).not.toMatch(/[\u00B7\u2014]/);
    });
  }
});

/**
 * The lines of the Brand personality node (ORV-291 PR 1, spec "Strings"): each key in both
 * languages, word for word, the five axes' two ends in the order of `PERSONALITY_AXES`, and no
 * middot or em dash in any of them. `business.question.person` and `.never` are ORV-126's copy,
 * pinned to the engine's `PROXY_QUESTIONS` by the question tests above.
 */
describe("brand personality, strings", () => {
  const LINES = {
    en: {
      "business.node.identityFrame": "Brand personality",
      "business.question.person":
        "If your brand were a person, which three words would people use to describe them?",
      "business.question.never": "How should your brand never feel?",
      "business.field.personality": "Personality",
      "business.field.person": "Three words for your brand as a person",
      "business.field.never": "How it should never feel",
      "business.axis.playful.low": "Serious",
      "business.axis.playful.high": "Playful",
      "business.axis.expressive.low": "Quiet",
      "business.axis.expressive.high": "Bold",
      "business.axis.structured.low": "Free and loose",
      "business.axis.structured.high": "Orderly and precise",
      "business.axis.warm.low": "Cool and reserved",
      "business.axis.warm.high": "Warm and friendly",
      "business.axis.premium.low": "Everyday and easy to reach",
      "business.axis.premium.high": "Premium and exclusive",
      "business.identity.axisLegend": "From {low} to {high}",
      "business.identity.point": "{n} of 5",
      "business.identity.hypothesis":
        "These five scales are ORIVILO's working words for a brand's personality, not a tested method.",
      "business.identity.describe": "Describe the personality",
      "business.identity.save": "Save this personality",
      "business.identity.axesRequired": "Choose a point on each of the five scales, or cancel.",
      "business.state.given": "Given by you",
      "business.state.waiting": "Waits for {nodes}",
      "business.marks.unchecked": "Not yet checked against: {nodes}",
    },
    th: {
      "business.node.identityFrame": "บุคลิกของแบรนด์",
      "business.question.person": "ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา",
      "business.question.never": "แบรนด์ของคุณไม่ควรให้ความรู้สึกแบบไหน",
      "business.field.personality": "บุคลิก",
      "business.field.person": "สามคำที่บรรยายแบรนด์ถ้าเป็นคน",
      "business.field.never": "ความรู้สึกที่แบรนด์ไม่ควรให้",
      "business.axis.playful.low": "จริงจัง",
      "business.axis.playful.high": "ขี้เล่น",
      "business.axis.expressive.low": "เรียบนิ่ง",
      "business.axis.expressive.high": "โดดเด่น",
      "business.axis.structured.low": "อิสระ ยืดหยุ่น",
      "business.axis.structured.high": "เป็นระเบียบ แม่นยำ",
      "business.axis.warm.low": "สุขุม วางตัว",
      "business.axis.warm.high": "อบอุ่น เป็นกันเอง",
      "business.axis.premium.low": "ใช้ได้ทุกวัน เข้าถึงง่าย",
      "business.axis.premium.high": "หรูหรา พิเศษเฉพาะ",
      "business.identity.axisLegend": "จาก {low} ถึง {high}",
      "business.identity.point": "ระดับ {n} จาก 5",
      "business.identity.hypothesis":
        "สเกลทั้งห้านี้เป็นคำที่ ORIVILO ใช้อธิบายบุคลิกแบรนด์ ยังไม่ใช่วิธีที่ผ่านการทดสอบ",
      "business.identity.describe": "บอกบุคลิกของแบรนด์",
      "business.identity.save": "บันทึกบุคลิกนี้",
      "business.identity.axesRequired": "เลือกระดับให้ครบทั้งห้าสเกล หรือกดยกเลิก",
      "business.state.given": "คุณกำหนดเอง",
      "business.state.waiting": "รอ {nodes} ก่อน",
      "business.marks.unchecked": "ยังไม่ได้ตรวจทานกับ: {nodes}",
    },
  } as const;

  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: each line is the spec's, word for word`, () => {
      expect(Object.keys(LINES[locale])).toHaveLength(25);
      for (const [key, line] of Object.entries(LINES[locale])) {
        expect(at(m, key), key).toBe(line);
      }
    });

    it(`${locale}: the node title is the catalog's, and the two ends of the five scales are in axis order`, () => {
      expect(nodeTitle(m, "identity-frame")).toBe(m.business.node.identityFrame);
      for (const axis of PERSONALITY_AXES) {
        expect(typeof m.business.axis[axis].low, axis).toBe("string");
        expect(typeof m.business.axis[axis].high, axis).toBe("string");
        expect(m.business.axis[axis].low).not.toBe(m.business.axis[axis].high);
      }
      expect(Object.keys(m.business.axis)).toEqual([...PERSONALITY_AXES]);
    });

    it(`${locale}: spells the {low}, {high}, {n} and {nodes} slots`, () => {
      expect(m.business.identity.axisLegend).toContain("{low}");
      expect(m.business.identity.axisLegend).toContain("{high}");
      expect(m.business.identity.point).toContain("{n}");
      expect(m.business.state.waiting).toContain("{nodes}");
      expect(m.business.marks.unchecked).toContain("{nodes}");
    });

    it(`${locale}: no personality line has a middot or an em dash`, () => {
      for (const key of Object.keys(LINES[locale])) {
        expect(String(at(m, key)), key).not.toMatch(/[\u00B7\u2014]/);
      }
    });
  }
});

/**
 * The lines of Brand architecture and Name (ORV-291 PR 2, ORV-295, spec "Strings"): each key in both
 * languages, word for word; the question is ORV-126's start question and `strategy.provisional` is
 * ORV-126 "Missing strategy" word for word, read from ORV-126's spec so a changed catalog line goes
 * red (T33, spec row 24); no middot or em dash in any of them.
 */
describe("brand architecture and name, strings", () => {
  const LINES = {
    en: {
      "business.node.architecture": "Brand architecture",
      "business.node.name": "Name",
      "business.question.subBrands": "Does this brand sit above or below other brands?",
      "business.field.subBrands": "Other brands above or below",
      "business.field.architecture": "Architecture",
      "business.field.workingName": "Working name",
      "business.state.derived": "Worked out by a fixed rule",
      "business.state.notInVersion": "Not in this version",
      "business.marks.restsOn": "Rests on: {nodes}",
      "business.architecture.no": "No, it stands on its own",
      "business.architecture.yes": "Yes, it sits above or below other brands",
      "business.architecture.save": "Save this answer",
      "business.architecture.choiceRequired": "Choose one answer first.",
      "business.architecture.single": "Single brand, one unit",
      "business.architecture.because":
        "Worked out from your answer: this brand does not sit above or below other brands.",
      "business.architecture.notInVersion":
        "A brand that sits above or below other brands needs a brand architecture study, which this version does not do yet.",
      "business.name.give": "Give a working name",
      "business.name.save": "Use this working name",
      "business.name.required": "Write a working name, or cancel.",
      "business.name.notScreened": "Working name, not screened for trademarks.",
      "strategy.provisional": "Provisional. This rests on a step you skipped.",
    },
    th: {
      "business.node.architecture": "โครงสร้างแบรนด์",
      "business.node.name": "ชื่อแบรนด์",
      "business.question.subBrands": "แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่",
      "business.field.subBrands": "แบรนด์อื่นที่อยู่เหนือหรือใต้",
      "business.field.architecture": "โครงสร้าง",
      "business.field.workingName": "ชื่อใช้งาน",
      "business.state.derived": "ได้จากกฎที่กำหนดไว้",
      "business.state.notInVersion": "ยังไม่มีในเวอร์ชันนี้",
      "business.marks.restsOn": "อิงกับ: {nodes}",
      "business.architecture.no": "ไม่ใช่ แบรนด์นี้อยู่เดี่ยว ๆ",
      "business.architecture.yes": "ใช่ แบรนด์นี้อยู่เหนือหรือใต้แบรนด์อื่น",
      "business.architecture.save": "บันทึกคำตอบนี้",
      "business.architecture.choiceRequired": "เลือกหนึ่งคำตอบก่อน",
      "business.architecture.single": "แบรนด์เดียว หน่วยเดียว",
      "business.architecture.because":
        "ได้จากคำตอบของคุณ: แบรนด์นี้ไม่ได้อยู่เหนือหรือใต้แบรนด์อื่น",
      "business.architecture.notInVersion":
        "แบรนด์ที่อยู่เหนือหรือใต้แบรนด์อื่นต้องศึกษาโครงสร้างแบรนด์ ซึ่งเวอร์ชันนี้ยังไม่ได้ทำ",
      "business.name.give": "ตั้งชื่อใช้งาน",
      "business.name.save": "ใช้ชื่อนี้",
      "business.name.required": "เขียนชื่อใช้งาน หรือกดยกเลิก",
      "business.name.notScreened": "ชื่อใช้งานชั่วคราว ยังไม่ได้ตรวจสอบเครื่องหมายการค้า",
      "strategy.provisional": "ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้",
    },
  } as const;

  const orv126 = readFileSync(
    path.join(import.meta.dirname, "../../../../docs/specs/ORV-126/spec.md"),
    "utf8",
  );
  const PROVISIONAL = /^- `strategy\.provisional`: en "([^"]*)"; th "([^"]*)"$/m;

  it("finds ORV-126's strategy.provisional line", () => {
    expect(orv126.match(PROVISIONAL)).not.toBeNull();
  });

  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: each line is the spec's, word for word`, () => {
      expect(Object.keys(LINES[locale])).toHaveLength(21);
      for (const [key, line] of Object.entries(LINES[locale])) {
        expect(at(m, key), key).toBe(line);
      }
    });

    it(`${locale}: strategy.provisional is ORV-126 'Missing strategy' word for word`, () => {
      const home = orv126.match(PROVISIONAL);
      expect(m.strategy.provisional).toBe(home?.[locale === "en" ? 1 : 2]);
    });

    it(`${locale}: the question of the choice is the start question of ORV-126`, () => {
      expect(START_QUESTIONS).toHaveLength(1);
      expect(m.business.question.subBrands).toBe(START_QUESTIONS[0]?.[locale]);
    });

    it(`${locale}: the node titles are the catalog's and spell the {nodes} slot of the new mark line`, () => {
      expect(nodeTitle(m, "architecture")).toBe(m.business.node.architecture);
      expect(nodeTitle(m, "name")).toBe(m.business.node.name);
      expect(m.business.marks.restsOn).toContain("{nodes}");
    });

    it(`${locale}: no line has a middot or an em dash`, () => {
      for (const key of Object.keys(LINES[locale])) {
        expect(String(at(m, key)), key).not.toMatch(/[\u00b7\u2014]/);
      }
    });
  }
});

/**
 * ORV-298 PR 1, spec row 16 (T22): the Colour node's keys, word for word. The copy of record is the
 * spec's "Strings" table; the test reads its rows marked PR 1 and holds the catalog to them in both
 * languages, so a one-word edit of a catalog line, English or Thai, goes red. It also holds every
 * colour word to the engine's own lists (each family `auditLineup` can name, each value of
 * `neutral` and `canvas`) and every PR 1 line free of a middot and an em dash.
 */
describe("expression, colour strings", () => {
  const spec = readFileSync(
    path.join(import.meta.dirname, "../../../../docs/specs/ORV-298/spec.md"),
    "utf8",
  );
  const table = spec.slice(spec.indexOf("\n## Strings"), spec.indexOf("\n## Acceptance criteria"));
  const rows = table
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.slice(2, -2).split(" | "))
    .filter((cells) => cells.length === 4 && cells[3] === "1")
    .map(([key, en, th]) => ({
      key: (key ?? "").replaceAll("`", ""),
      en: en ?? "",
      th: th ?? "",
    }));

  it("reads the fifty-three PR 1 rows of the spec's Strings table", () => {
    expect(rows).toHaveLength(53);
    expect(new Set(rows.map((row) => row.key)).size).toBe(53);
  });

  it("is the whole PR 1 set of this test file's key list", () => {
    const first = SPEC_KEYS.indexOf("business.node.color");
    expect(rows.map((row) => row.key).sort()).toEqual([...SPEC_KEYS.slice(first)].sort());
  });

  for (const locale of LOCALES) {
    const m = messagesFor(locale);

    it(`${locale}: each PR 1 line is the spec's, word for word`, () => {
      for (const row of rows) expect(at(m, row.key), row.key).toBe(row[locale]);
    });

    it(`${locale}: no PR 1 line has a middot or an em dash`, () => {
      for (const row of rows) expect(String(at(m, row.key)), row.key).not.toMatch(/[\u00b7\u2014]/);
    });

    it(`${locale}: every colour family the audit can name has a word, and the words differ`, () => {
      const families = [...CHROMATIC_FAMILIES, "ink", "paper"] as const;
      const words = families.map((family) => m.business.color.family[family]);
      expect(words.every((word) => word.trim() !== "")).toBe(true);
      expect(new Set(words).size).toBe(families.length);
      expect(Object.keys(m.business.color.family).sort()).toEqual([...families].sort());
      expect(Object.keys(m.business.color.neutral)).toEqual([...COLOR_DECISIONS.neutral]);
      expect(Object.keys(m.business.color.canvas)).toEqual([...COLOR_DECISIONS.canvas]);
    });
  }

  it("spells the slots of the reasons: points, families, the rule and the row", () => {
    for (const locale of LOCALES) {
      const { color, decision } = messagesFor(locale).business;
      expect(color.because.signature).toContain("{expressive}");
      expect(color.because.signature).toContain("{warm}");
      expect(color.because.fallback).toContain("{preferred}");
      expect(color.because.neutral).toContain("{warm}");
      expect(color.because.canvas).toContain("{premium}");
      expect(color.bothCrowded).toContain("{first}");
      expect(color.bothCrowded).toContain("{second}");
      expect(color.remove).toContain("{name}");
      expect(color.row).toContain("{n}");
      expect(decision.rule).toContain("{rule}");
    }
  });
});
