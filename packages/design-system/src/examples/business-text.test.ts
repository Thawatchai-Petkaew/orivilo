import type { BusinessView, Face, FoundationNode } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { messagesFor } from "../i18n/messages/index";
import { ENGLISH_READ_VIEW, THAI_READ_VIEW, THAI_VIEW } from "./business-fixtures";
import {
  appIconWord,
  canvasWord,
  colorReason,
  crowdedLine,
  decisionRule,
  faceBecause,
  familyWord,
  foundationStateLine,
  licenceLine,
  listOfNodes,
  listOfWords,
  logoTypeReason,
  logoTypeWord,
  nameLengthLine,
  neutralWord,
  nodeTitle,
  provisionalLines,
  readingQuotes,
  scriptsWord,
  signatureOpenLine,
  styleWord,
  uncheckedLine,
} from "./business-text";
import {
  asksPersonality,
  bothCrowded,
  decided,
  fallback,
  logoTypeDecided,
  partly,
  typographyDecided,
  waitsForPersonality,
} from "./expression-fixtures";

/**
 * ORV-281 design row D6 (ORV-283): the quotes a reading drew on are shown with the reading's own
 * provenance, so a model reading's quote rows say an AI model read them, as its pill card does.
 * The saved record is not touched: each span item keeps the `fromModel` the rule that located it
 * gave it.
 */
describe.each([
  ["Thai", THAI_READ_VIEW],
  ["English", ENGLISH_READ_VIEW],
])("readingQuotes, %s readings fixture", (_name, view) => {
  const readings = view.nodes.flatMap((n) => n.fields).flatMap((f) => f.readings);

  it("has readings with more than one quote to look at", () => {
    expect(readings.length).toBeGreaterThan(0);
    expect(readings.some((r) => r.spans.length > 1)).toBe(true);
  });

  it("gives every quote the reading's provenance and the span's own ids, in order", () => {
    for (const r of readings) {
      const quotes = readingQuotes(r);
      expect(quotes.map((q) => q.id)).toEqual(r.spans.map((s) => s.id));
      expect(quotes.every((q) => q.fromModel === r.item.fromModel)).toBe(true);
      expect(quotes.every((q) => q.fromModel)).toBe(true);
    }
  });

  it("leaves the record's span items as the rule made them", () => {
    for (const r of readings) {
      expect(r.spans.every((s) => !s.fromModel)).toBe(true);
    }
  });
});

/**
 * ORV-291 tech notes T25, spec rows 5 and 10: `business.state.waiting` and the two mark lines fill
 * `{nodes}` with the node titles joined by `Intl.ListFormat`, type `conjunction`, in the page's
 * locale. PR 1 has one node name in each line (`positioning`); the join is proven on two and three
 * names so a comma join, which only shows with more than one, goes red.
 */
describe("foundation lines", () => {
  type Personality = Extract<FoundationNode, { id: "identity-frame" }>;
  const personality = THAI_VIEW.foundation[0] as Personality;
  const given = (over: Partial<Personality>): Personality => ({ ...personality, ...over });

  it("joins the node titles with the locale's conjunction", () => {
    const en = messagesFor("en");
    const th = messagesFor("th");
    expect(listOfNodes(en, "en", ["positioning"])).toBe("Positioning");
    expect(listOfNodes(en, "en", ["positioning", "identity-frame"])).toBe(
      "Positioning and Brand personality",
    );
    expect(listOfNodes(en, "en", ["situation", "positioning", "identity-frame"])).toBe(
      "Situation, Positioning, and Brand personality",
    );
    expect(listOfNodes(th, "th", ["positioning", "identity-frame"])).toBe(
      "จุดยืนและบุคลิกของแบรนด์",
    );
    expect(listOfNodes(th, "th", ["situation", "positioning", "identity-frame"])).toBe(
      "สถานการณ์ตั้งต้น จุดยืน และบุคลิกของแบรนด์",
    );
  });

  it("fills `{nodes}` of the waiting line with what the node waits for", () => {
    expect(personality.state).toBe("waiting");
    expect(foundationStateLine(messagesFor("th"), "th", personality)).toBe("รอ จุดยืน ก่อน");
    expect(foundationStateLine(messagesFor("en"), "en", personality)).toBe("Waits for Positioning");
    const two = given({ waitingFor: ["positioning", "identity-frame"] });
    expect(foundationStateLine(messagesFor("en"), "en", two)).toBe(
      "Waits for Positioning and Brand personality",
    );
  });

  it("gives the other state lines as the catalog's own words, with no slot", () => {
    for (const locale of ["th", "en"] as const) {
      const m = messagesFor(locale);
      expect(foundationStateLine(m, locale, given({ state: "given", waitingFor: [] }))).toBe(
        m.business.state.given,
      );
      expect(foundationStateLine(m, locale, given({ state: "skipped", waitingFor: [] }))).toBe(
        m.business.state.skipped,
      );
      expect(foundationStateLine(m, locale, given({ state: "empty", waitingFor: [] }))).toBe(
        m.business.state.empty,
      );
    }
  });

  // PR 2 replaces PR 1's pin "has no line for a derived state before PR 2 gives it one".
  it("gives the derived and not-in-version states their own catalog lines (PR 2)", () => {
    for (const locale of ["th", "en"] as const) {
      const m = messagesFor(locale);
      expect(foundationStateLine(m, locale, given({ state: "derived", waitingFor: [] }))).toBe(
        m.business.state.derived,
      );
      expect(foundationStateLine(m, locale, given({ state: "notInVersion", waitingFor: [] }))).toBe(
        m.business.state.notInVersion,
      );
    }
    expect(
      foundationStateLine(messagesFor("en"), "en", given({ state: "derived", waitingFor: [] })),
    ).toBe("Worked out by a fixed rule");
    expect(
      foundationStateLine(messagesFor("th"), "th", given({ state: "derived", waitingFor: [] })),
    ).toBe("ได้จากกฎที่กำหนดไว้");
  });

  it("gives the unchecked line with its nodes, and none when there is nothing unchecked", () => {
    const unchecked = given({ state: "given", waitingFor: [], unchecked: ["positioning"] });
    expect(uncheckedLine(messagesFor("en"), "en", unchecked)).toBe(
      "Not yet checked against: Positioning",
    );
    expect(uncheckedLine(messagesFor("th"), "th", unchecked)).toBe("ยังไม่ได้ตรวจทานกับ: จุดยืน");
    const two = given({ unchecked: ["positioning", "identity-frame"] });
    expect(uncheckedLine(messagesFor("en"), "en", two)).toBe(
      "Not yet checked against: Positioning and Brand personality",
    );
    expect(uncheckedLine(messagesFor("en"), "en", given({ unchecked: [] }))).toBeNull();
  });
});

/**
 * ORV-291 tech notes T34, spec row 17 (PR 2): for a derived result `strategy.provisional` and
 * `business.marks.restsOn` resolve together, the second with its nodes joined in the page's locale.
 * Neither shows alone: no "rests on" line without the provisional line, and none for a result that
 * rests on nothing.
 */
describe("rests on", () => {
  type Architecture = Extract<FoundationNode, { id: "architecture" }>;
  const architecture = THAI_VIEW.foundation[1] as Architecture;
  const derived = (over: Partial<Architecture>): Architecture => ({
    ...architecture,
    state: "derived",
    waitingFor: [],
    ...over,
  });

  it("gives the provisional line and the rests-on line together, in each language", () => {
    const node = derived({ restsOn: ["positioning"] });
    expect(provisionalLines(messagesFor("en"), "en", node)).toEqual({
      provisional: "Provisional. This rests on a step you skipped.",
      restsOn: "Rests on: Positioning",
    });
    expect(provisionalLines(messagesFor("th"), "th", node)).toEqual({
      provisional: "ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้",
      restsOn: "อิงกับ: จุดยืน",
    });
  });

  it("joins several nodes with the locale's conjunction", () => {
    const node = derived({ restsOn: ["situation", "positioning"] });
    expect(provisionalLines(messagesFor("en"), "en", node)?.restsOn).toBe(
      "Rests on: Situation and Positioning",
    );
    expect(provisionalLines(messagesFor("th"), "th", node)?.restsOn).toBe(
      "อิงกับ: สถานการณ์ตั้งต้นและจุดยืน",
    );
  });

  it("gives no line, neither of the two, when the node rests on nothing", () => {
    expect(provisionalLines(messagesFor("en"), "en", derived({ restsOn: [] }))).toBeNull();
  });
});

/**
 * ORV-298 PR 1, spec rows 2, 3, 5 and 8 (T21): the Colour node's lines. The reasons fill the scale
 * points and the family words of the catalog, the crowded families join through `Intl.ListFormat`
 * (type `conjunction`, the page's locale), the rule line carries the rule id as the engine gave it,
 * and the open lines of the signature name the families they quote. A reason is never filled from
 * a value the engine did not give: with no points a reason throws, so a view cannot print a guess.
 */
describe("expression lines", () => {
  type Color = Extract<FoundationNode, { id: "color" }>;
  const colorOf = (view: BusinessView) => view.foundation.find((n) => n.id === "color") as Color;
  const en = messagesFor("en");
  const th = messagesFor("th");

  it("fills the signature reason with the points and the family word, in each language", () => {
    const node = colorOf(decided("en"));
    expect(node.decisions?.signature?.value).toBe("lime");
    expect(colorReason(en, node, "signature")).toBe(
      "Bold at 4 of 5 and warm at 4 of 5 point to Lime, and Lime is not crowded among the colours you gave.",
    );
    expect(colorReason(th, node, "signature")).toBe(
      "ความโดดเด่นระดับ 4 จาก 5 และความอบอุ่นระดับ 4 จาก 5 ชี้ไปที่กลุ่มสี เขียวมะนาว และกลุ่มสีนี้ไม่ซ้ำกับสีที่คุณระบุ",
    );
  });

  it("fills the fallback reason with the preferred family and the family used", () => {
    const node = colorOf(fallback("en"));
    expect(node.decisions?.signature).toMatchObject({ value: "cyan", preferred: "lime" });
    expect(colorReason(en, node, "fallback")).toBe(
      "Bold at 4 of 5 and warm at 4 of 5 point first to Lime, which is crowded among the colours you gave, so the next candidate, Cyan, is used.",
    );
    expect(colorReason(th, node, "fallback")).toBe(
      "ความโดดเด่นระดับ 4 จาก 5 และความอบอุ่นระดับ 4 จาก 5 ชี้ไปที่กลุ่มสี เขียวมะนาว ก่อน แต่กลุ่มสีนั้นซ้ำกับสีที่คุณระบุ จึงใช้ตัวเลือกถัดไป คือ ฟ้าอมเขียว",
    );
  });

  it("fills the greys and the background with the warm and the premium points", () => {
    const node = colorOf(partly("en"));
    expect(colorReason(en, node, "neutral")).toBe("Warm at 4 of 5 sets the greys.");
    expect(colorReason(en, node, "canvas")).toBe("Premium at 4 of 5 sets the background.");
    expect(colorReason(th, node, "neutral")).toBe("ความอบอุ่นระดับ 4 จาก 5 กำหนดสีเทา");
    expect(colorReason(th, node, "canvas")).toBe("ความหรูหราระดับ 4 จาก 5 กำหนดพื้นหลัง");
    expect(neutralWord(en, "warm")).toBe("Warm greys");
    expect(canvasWord(th, "soft")).toBe("ขาวนวล วางการ์ดสีขาวด้านบน");
  });

  it("gives a reason only for a decision the engine made, and never prints a guess", () => {
    const open = colorOf(waitsForPersonality("en"));
    expect(open.points).toBeNull();
    expect(() => colorReason(en, open, "neutral")).toThrow();
    const noLineup = colorOf(partly("en"));
    expect(() => colorReason(en, noLineup, "signature")).toThrow();
    expect(() => colorReason(en, noLineup, "fallback")).toThrow();
  });

  it("joins the crowded families with the locale's conjunction, in the audit's order", () => {
    const node = colorOf(decided("en"));
    expect(node.crowded).toEqual(["ink", "orange", "violet"]);
    expect(crowdedLine(en, "en", node.crowded ?? [])).toBe("Near black, Orange, and Violet");
    expect(crowdedLine(th, "th", node.crowded ?? [])).toBe("เกือบดำ ส้ม และม่วง");
    expect(listOfWords("en", ["Lime", "Cyan"])).toBe("Lime and Cyan");
    expect(listOfWords("th", ["เขียว", "ฟ้า"])).toBe("เขียวและฟ้า");
    expect(listOfWords("en", ["Lime"])).toBe("Lime");
  });

  it("says none when no family is crowded, and knows every family word", () => {
    expect(crowdedLine(en, "en", [])).toBe("None");
    expect(crowdedLine(th, "th", [])).toBe("ไม่มี");
    expect(familyWord(en, "magenta")).toBe("Magenta");
    expect(familyWord(th, "paper")).toBe("เกือบขาว");
  });

  it("gives the rule line the rule id as it is", () => {
    expect(decisionRule(en, "color.neutral.warm")).toBe("Rule: color.neutral.warm");
    expect(decisionRule(th, "color.signature.cyan-warm-fallback")).toBe(
      "กฎ: color.signature.cyan-warm-fallback",
    );
  });

  it("gives the signature's open line, the lineup wait or both families quoted", () => {
    const waits = colorOf(partly("en"));
    expect(waits.signatureOpen).toEqual({ why: "waitsForLineup" });
    expect(signatureOpenLine(en, waits.signatureOpen)).toBe(
      "The signature colour waits for your competitors' colours.",
    );
    const both = colorOf(bothCrowded("en"));
    expect(signatureOpenLine(en, both.signatureOpen)).toBe(
      "Both candidate families for this personality, Lime and Cyan, are crowded among the colours you gave, so no signature colour is chosen.",
    );
    expect(signatureOpenLine(th, both.signatureOpen)).toBe(
      "กลุ่มสีตัวเลือกทั้งสองของบุคลิกนี้ คือ เขียวมะนาว และ ฟ้าอมเขียว ซ้ำกับสีที่คุณระบุ จึงยังไม่เลือกสีประจำแบรนด์",
    );
    expect(signatureOpenLine(en, null)).toBeNull();
  });

  it("titles the Colour node from the catalog, and gives its partly and needs-answer state lines", () => {
    const node = colorOf(partly("en"));
    expect(node.state).toBe("partly");
    expect(nodeTitle(en, "color")).toBe("Colour");
    expect(nodeTitle(th, "color")).toBe("สี");
    expect(foundationStateLine(en, "en", node)).toBe("Partly worked out by fixed rules");
    expect(foundationStateLine(th, "th", node)).toBe("ได้จากกฎที่กำหนดไว้บางส่วน");
    const asks = colorOf(asksPersonality("en"));
    expect(asks.state).toBe("needsAnswer");
    expect(foundationStateLine(th, "th", asks)).toBe("รอคำตอบของคุณ");
  });
});

/**
 * ORV-298 PR 2 (`typography-node-1`): the words of the Typography view come from the catalog keys
 * they name, the family and licence names pass through as written in both languages.
 */
describe("Typography words", () => {
  const en = messagesFor("en");
  const th = messagesFor("th");
  const facesOf = (view: BusinessView) => {
    const node = view.foundation.find((n) => n.id === "typography");
    if (node?.id !== "typography" || node.faces === null) throw new Error("no faces");
    return node.faces;
  };

  it("names the three scripts answers from their own catalog keys", () => {
    expect(scriptsWord(en, "thai-latin")).toBe("Thai and Latin");
    expect(scriptsWord(en, "thai")).toBe("Thai only");
    expect(scriptsWord(en, "latin")).toBe("Latin only");
    expect(scriptsWord(th, "thai-latin")).toBe("อักษรไทยและอักษรละติน");
    expect(scriptsWord(th, "thai")).toBe(th.business.typography.scripts.thai);
    expect(scriptsWord(th, "latin")).toBe(th.business.typography.scripts.latin);
  });

  it("gives each family its style, its licence as written and, for a Thai family, its reason", () => {
    const { reading, display } = facesOf(typographyDecided("en", "thai-latin"));
    const [sarabun, inter] = reading;
    const [anuphan] = display;
    expect(sarabun?.family).toBe("Sarabun");
    expect(styleWord(en, sarabun?.style ?? "looped")).toBe("Thai, looped");
    expect(styleWord(en, anuphan?.style ?? "looped")).toBe("Thai, loopless");
    expect(styleWord(en, inter?.style ?? "looped")).toBe("Latin, sans serif");
    expect(faceBecause(en, sarabun as Face)).toBe(en.business.typography.because.reading);
    expect(faceBecause(en, anuphan as Face)).toBe(en.business.typography.because.display);
    expect(faceBecause(en, inter as Face)).toBeNull();
    for (const face of [sarabun, inter, anuphan]) {
      const licence = (face as NonNullable<typeof face>).licence;
      expect(licence).not.toBe("");
      expect(licenceLine(en, face as Face)).toBe(`Licence: ${licence}`);
      expect(licenceLine(th, face as Face)).toBe(
        th.business.typography.licence.replace("{licence}", licence),
      );
    }
  });
});

/**
 * ORV-298 PR 3 (`logo-type-1`): the words of the Logo type view come from the catalog keys they
 * name. The name length line splits at the person's name, which is never filled into the template
 * or parsed: a name that spells a slot stays literal.
 */
describe("Logo type words", () => {
  const en = messagesFor("en");
  const th = messagesFor("th");
  const outcomeOf = (view: BusinessView) => {
    const node = view.foundation.find((n) => n.id === "logo-type");
    if (node?.id !== "logo-type" || node.decision === null) throw new Error("no decision");
    return node.decision;
  };

  it("names the two logo types and the three reasons from their own catalog keys", () => {
    expect(logoTypeWord(en, "wordmark")).toBe("Wordmark: the name itself is the logo");
    expect(logoTypeWord(en, "symbol-plus-name")).toBe("Symbol plus name");
    expect(logoTypeWord(th, "wordmark")).toBe(th.business.logoType.wordmark);
    expect(logoTypeWord(th, "symbol-plus-name")).toBe(th.business.logoType.symbolPlusName);
    expect(logoTypeReason(en, "longName")).toBe(en.business.logoType.because.longName);
    expect(logoTypeReason(en, "appIcon")).toBe(en.business.logoType.because.appIcon);
    expect(logoTypeReason(th, "wordmark")).toBe(th.business.logoType.because.wordmark);
    expect(
      new Set(["longName", "appIcon", "wordmark"].map((r) => logoTypeReason(en, r as never))),
    ).toHaveProperty("size", 3);
  });

  it("names the two answers of the app icon question", () => {
    expect(appIconWord(en, true)).toBe("Yes, it needs one");
    expect(appIconWord(en, false)).toBe("No, the name is enough");
    expect(appIconWord(th, true)).toBe(th.business.logoType.appIcon.yes);
    expect(appIconWord(th, false)).toBe(th.business.logoType.appIcon.no);
  });

  it("splits the name length line at the name and fills the length and the bound", () => {
    const outcome = outcomeOf(logoTypeDecided("en", false));
    const { before, after } = nameLengthLine(en, outcome);
    expect(before + outcome.name + after).toBe(
      "Your working name ORIVILO has 7 characters; more than 12 counts as long.",
    );
    const thai = nameLengthLine(th, outcome);
    expect(thai.before + outcome.name + thai.after).toBe(
      "ชื่อใช้งาน ORIVILO มี 7 ตัวอักษร เกิน 12 ตัวนับว่ายาว",
    );
  });

  it("never fills a slot the name itself spells", () => {
    const outcome = { ...outcomeOf(logoTypeDecided("en", false)), name: "{max}{n}{name}" };
    const { before, after } = nameLengthLine(en, outcome);
    expect(before.includes("{")).toBe(false);
    expect(after.includes("{")).toBe(false);
    expect(before + outcome.name + after).toContain("Your working name {max}{n}{name} has 7");
  });
});
