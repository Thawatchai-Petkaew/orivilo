import { describe, expect, it } from "vitest";
import { readMood, rankSuggestions, SUGGESTION_CANDIDATES, SUGGESTION_KINDS } from "./suggest";

const top = (text: string, kind: (typeof SUGGESTION_KINDS)[number]) =>
  rankSuggestions(readMood(text), kind).map((r) => r.candidate.id);

describe("reading a mood (AC 1)", () => {
  it("gives axis values and the words they came from, and lists what it did not understand", () => {
    const reading = readMood("อบอุ่น เป็นมิตร และเป็นระเบียบ ฟ้าใส");
    expect(reading.method).toBe("rule-based");
    expect(reading.axes).toEqual({ warm: 75, structured: 75 });
    expect(reading.words.warm).toEqual(["อบอุ่น", "เป็นมิตร"]);
    expect(reading.words.structured).toEqual(["เป็นระเบียบ"]);
    expect(reading.notUnderstood).toEqual(["ฟ้าใส"]);
  });

  it("reads nothing from empty text", () => {
    expect(readMood("  ").axes).toEqual({});
  });
});

describe("ranking (AC 2, 3)", () => {
  it("puts structured faces and sets first for an orderly mood", () => {
    expect(top("เป็นระเบียบ พรีเมียม", "font").slice(0, 3)).toEqual([
      "anuphan",
      "ibm-plex-sans-thai",
      "trirong",
    ]);
    expect(top("เป็นระเบียบ พรีเมียม", "icon")[0]).toBe("square-stroke");
    expect(top("เป็นระเบียบ พรีเมียม", "corners")[0]).toBe("sharp");
  });

  it("puts playful, warm options first for a fun mood", () => {
    expect(top("สนุก อบอุ่น", "font").slice(0, 2)).toEqual(["mali", "mitr"]);
    expect(top("สนุก อบอุ่น", "icon")[0]).toBe("rounded-stroke");
    expect(top("สนุก อบอุ่น", "corners")[0]).toBe("round");
    expect(top("หรูหรา", "density")[0]).toBe("spacious");
  });

  it("follows a lowered axis: formal reads as less playful", () => {
    expect(top("ทางการ", "font").at(-1)).toBe("mali");
  });

  it("names the axes that raised a candidate, with the words, strongest first", () => {
    const [first] = rankSuggestions(readMood("สนุก อบอุ่น"), "font");
    expect(first?.because).toEqual([
      { axis: "playful", words: ["สนุก"] },
      { axis: "warm", words: ["อบอุ่น"] },
    ]);
  });

  it("is deterministic", () => {
    expect(top("โดดเด่น สดใส", "font")).toEqual(top("โดดเด่น สดใส", "font"));
  });

  it("suggests nothing when no word is known", () => {
    for (const kind of SUGGESTION_KINDS)
      expect(rankSuggestions(readMood("ฟ้าใส"), kind)).toEqual([]);
  });
});

describe("candidates (AC 7)", () => {
  it("has unique ids per kind, OFL fonts and one licensed icon set per style", () => {
    for (const kind of SUGGESTION_KINDS) {
      const ids = SUGGESTION_CANDIDATES.filter((c) => c.kind === kind).map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const fonts = SUGGESTION_CANDIDATES.filter((c) => c.kind === "font");
    expect(fonts.length).toBeGreaterThanOrEqual(6);
    expect(fonts.every((f) => f.licence === "OFL-1.1" && f.source.startsWith("https://"))).toBe(
      true,
    );
    const icons = SUGGESTION_CANDIDATES.filter((c) => c.kind === "icon");
    expect(icons.map((i) => i.id)).toEqual(["rounded-stroke", "square-stroke", "solid"]);
    expect(icons.map((i) => i.licence)).toEqual(["ISC", "Apache-2.0", "MIT"]);
  });
});
