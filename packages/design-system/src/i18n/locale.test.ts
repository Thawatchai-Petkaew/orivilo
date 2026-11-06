import { describe, expect, it } from "vitest";
import { DATE_TAGS, LOCALE_TAGS, LOCALES, WEEK_START, YEAR_OFFSET } from "./locale";

describe("date tags (date-format-1, date-year-1, cal-week-1)", () => {
  it("names the calendar and the digits of each locale", () => {
    expect(DATE_TAGS).toEqual({
      th: "th-TH-u-ca-buddhist-nu-latn",
      en: "en-US-u-ca-gregory-nu-latn",
    });
  });

  it("starts the week on Sunday in both locales", () => {
    expect(WEEK_START).toEqual({ th: 0, en: 0 });
  });

  it("offsets the Buddhist Era by 543 years and the Common Era by none", () => {
    expect(YEAR_OFFSET).toEqual({ th: 543, en: 0 });
  });

  it("holds one entry per locale in every table", () => {
    for (const table of [DATE_TAGS, WEEK_START, YEAR_OFFSET]) {
      expect(Object.keys(table).sort()).toEqual([...LOCALES].sort());
    }
  });

  it("leaves LOCALE_TAGS as it was, so number formats do not change", () => {
    expect(LOCALE_TAGS).toEqual({ th: "th-TH", en: "en-US" });
  });
});
