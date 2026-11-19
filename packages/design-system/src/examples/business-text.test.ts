import type { FoundationNode } from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { messagesFor } from "../i18n/messages/index";
import { ENGLISH_READ_VIEW, THAI_READ_VIEW, THAI_VIEW } from "./business-fixtures";
import { foundationStateLine, listOfNodes, uncheckedLine, readingQuotes } from "./business-text";

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
  const personality = THAI_VIEW.foundation[0] as FoundationNode;
  const given = (over: Partial<FoundationNode>): FoundationNode => ({ ...personality, ...over });

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

  it("has no line for a derived state before PR 2 gives it one", () => {
    expect(() =>
      foundationStateLine(messagesFor("en"), "en", given({ state: "derived", waitingFor: [] })),
    ).toThrow(/derived/);
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
