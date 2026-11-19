import { describe, expect, it } from "vitest";
import { ENGLISH_READ_VIEW, THAI_READ_VIEW } from "./business-fixtures";
import { readingQuotes } from "./business-text";

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
