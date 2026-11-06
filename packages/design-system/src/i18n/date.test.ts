import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate, fromIsoDate, toIsoDate, type DateRange, type IsoDate } from "./date";
import { DATE_TAGS } from "./locale";

const a: IsoDate = "2026-11-12";
const b: IsoDate = "2020-09-29";

describe("formatDate (date-format-1, date-year-1, worked example W1)", () => {
  it("prints W1 line for line", () => {
    expect(formatDate(b, "medium", "th")).toBe("29 ก.ย. 2563");
    expect(formatDate(a, "medium", "th")).toBe("12 พ.ย. 2569");
    expect(formatDate(a, "monthYear", "th")).toBe("พฤศจิกายน 2569");
    expect(formatDate(a, "full", "th")).toBe("วันพฤหัสบดีที่ 12 พฤศจิกายน พ.ศ. 2569");
    expect(formatDate(a, "medium", "en")).toBe("Nov 12, 2026");
    expect(formatDate(a, "monthYear", "en")).toBe("November 2026");
    expect(formatDate(a, "full", "en")).toBe("Thursday, November 12, 2026");
  });

  it("shows the Buddhist year in Thai and the Gregorian year in English for the same date", () => {
    expect(formatDate(b, "medium", "en")).toBe("Sep 29, 2020");
    expect(formatDate(b, "medium", "th")).toContain("2563");
    expect(formatDate(b, "medium", "th")).not.toContain("2020");
  });

  it("reads the Gregorian Thai tag as the control: it would show 2020, not 2563", () => {
    const control = new Intl.DateTimeFormat("th-TH-u-ca-gregory-nu-latn", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2020, 8, 29)));
    expect(control).toBe("29 ก.ย. 2020");
  });

  it("resolves the Thai tag to the Buddhist calendar with Latin digits", () => {
    const r = new Intl.DateTimeFormat(DATE_TAGS.th).resolvedOptions();
    expect(`${r.calendar} ${r.numberingSystem}`).toBe("buddhist latn");
  });

  it("writes the era word only on the full date, and uses Arabic digits in both locales", () => {
    expect(formatDate(a, "full", "th")).toContain("พ.ศ.");
    expect(formatDate(a, "medium", "th")).not.toContain("พ.ศ.");
    expect(formatDate(a, "monthYear", "th")).not.toContain("พ.ศ.");
    for (const style of ["medium", "full", "monthYear"] as const) {
      expect(formatDate(a, style, "th")).not.toMatch(/[๐-๙]/);
    }
  });

  it("joins the month and the year with one space and nothing else in monthYear", () => {
    expect(formatDate("2026-03-01", "monthYear", "th")).toBe("มีนาคม 2569");
    expect(formatDate("2026-03-01", "monthYear", "en")).toBe("March 2026");
  });

  it.each(["Pacific/Honolulu", "Asia/Bangkok", "UTC"])(
    "does not move a plain date with the viewer's zone (%s)",
    async (tz) => {
      const old = process.env.TZ;
      try {
        process.env.TZ = tz;
        vi.resetModules();
        const fresh = await import("./date");
        expect(fresh.formatDate(a, "medium", "en")).toBe("Nov 12, 2026");
        expect(fresh.formatDate("2026-01-01", "monthYear", "en")).toBe("January 2026");
      } finally {
        if (old === undefined) delete process.env.TZ;
        else process.env.TZ = old;
      }
    },
  );

  it("returns an empty string for a value that is not a real date", () => {
    expect(formatDate("2026-02-30", "medium", "th")).toBe("");
  });

  it("builds one formatter per locale and style", async () => {
    vi.resetModules();
    const spy = vi.spyOn(Intl, "DateTimeFormat");
    try {
      const fresh = await import("./date");
      fresh.formatDate("2026-01-05", "medium", "en");
      fresh.formatDate("2026-01-06", "medium", "en");
      fresh.formatDate("2026-01-07", "medium", "en");
      expect(spy).toHaveBeenCalledTimes(1);
      fresh.formatDate("2026-01-07", "full", "en");
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("fromIsoDate and toIsoDate (date-value-1, worked example W2)", () => {
  const zones = ["Asia/Bangkok", "Pacific/Honolulu", "UTC"];
  const old = process.env.TZ;
  afterEach(() => {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  });

  it.each(zones)("round-trips 2026-11-12 in %s", (tz) => {
    process.env.TZ = tz;
    const d = fromIsoDate("2026-11-12");
    expect(d).toBeInstanceOf(Date);
    expect(d && toIsoDate(d)).toBe("2026-11-12");
  });

  it("builds a local Date from the three numbers", () => {
    const d = fromIsoDate("2026-11-12");
    expect(d && [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([
      2026, 10, 12, 0,
    ]);
  });

  it("reads back with local getters, so Bangkok midnight stays the same day (W2)", () => {
    process.env.TZ = "Asia/Bangkok";
    const d = new Date(2026, 10, 12);
    expect(d.toISOString()).toBe("2026-11-11T17:00:00.000Z");
    expect(toIsoDate(d)).toBe("2026-11-12");
  });

  it("reads a false date as no value", () => {
    expect(fromIsoDate("2026-02-30")).toBeUndefined();
    expect(fromIsoDate("2026-13-01")).toBeUndefined();
    expect(fromIsoDate("2026-00-10")).toBeUndefined();
    expect(fromIsoDate("2026-04-31")).toBeUndefined();
    expect(fromIsoDate("not a date")).toBeUndefined();
    expect(fromIsoDate("2026-1-2")).toBeUndefined();
    expect(fromIsoDate("")).toBeUndefined();
  });

  it("accepts 29 February only in a leap year", () => {
    expect(fromIsoDate("2024-02-29")).toBeInstanceOf(Date);
    expect(fromIsoDate("2026-02-29")).toBeUndefined();
    expect(fromIsoDate("2100-02-29")).toBeUndefined();
    expect(fromIsoDate("2000-02-29")).toBeInstanceOf(Date);
  });

  it("pads year, month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("types a range as two IsoDate strings", () => {
    const r: DateRange = { start: "2026-11-01", end: "2026-11-12" };
    expect(r.start < r.end).toBe(true);
  });
});
