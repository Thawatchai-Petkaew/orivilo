import { describe, expect, it } from "vitest";
import { collatorFor, formatNumber, formatPercent } from "./format";
import { DEFAULT_LOCALE, isLocale, LOCALES, pick } from "./locale";
import { fill, messagesFor, placeholdersOf } from "./messages/index";

describe("locale", () => {
  it("knows Thai and English, Thai first", () => {
    expect(LOCALES).toEqual(["th", "en"]);
    expect(DEFAULT_LOCALE).toBe("th");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("picks a word from a pair", () => {
    expect(pick({ th: "ก", en: "a" }, "en")).toBe("a");
    expect(pick({ th: "ก", en: "a" }, "th")).toBe("ก");
  });
});

describe("messages", () => {
  it("serves the catalog of the locale, Thai by default", () => {
    expect(messagesFor().dialog.close).toBe("ปิด");
    expect(messagesFor("en").dialog.close).toBe("Close");
  });

  it("lists the placeholders a template spells", () => {
    expect(placeholdersOf("{count} node, {edges} สาย")).toEqual(["count", "edges"]);
    expect(placeholdersOf("ปิด")).toEqual([]);
  });

  it("fills every placeholder and throws on one without a value", () => {
    expect(fill("{n} node", { n: 3 })).toBe("3 node");
    expect(fill("{a} to {b} to {a}", { a: "x", b: "y" })).toBe("x to y to x");
    expect(() => fill("{n} node", {})).toThrow(/\{n\}/);
    expect(fill("no braces")).toBe("no braces");
  });
});

describe("format", () => {
  it("formats numbers and percents by locale", () => {
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber(1234.5, "th")).toBe("1,234.5");
    expect(formatPercent(0.5, "en")).toBe("50%");
    expect(formatPercent(1.25, "th")).toBe("125%");
  });

  it("collates numerically and case-insensitively in the locale's order", () => {
    expect(collatorFor("en").compare("item 2", "item 10")).toBeLessThan(0);
    expect(collatorFor("en").compare("a", "A")).toBe(0);
    expect(["ข", "ก"].sort(collatorFor("th").compare)).toEqual(["ก", "ข"]);
    expect(collatorFor("en")).toBe(collatorFor("en"));
  });
});
