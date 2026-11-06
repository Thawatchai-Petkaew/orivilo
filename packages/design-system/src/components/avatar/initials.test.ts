import { describe, expect, it } from "vitest";
import { fixtures } from "../fixtures";
import { initialsOf } from "./initials";

describe("initialsOf (avatar-initials-1)", () => {
  // AC 14: the nine inputs of W1, in order.
  it.each([
    [fixtures.thaiMarks, "ป"],
    [fixtures.thaiMarks2, "ล"],
    [fixtures.longThai, "บ"],
    [fixtures.mixed, "ป"],
    [fixtures.latin, "SC"],
    [fixtures.longLatin, "A"],
    ["Brand แคนวาส", "B"],
    ["2026", ""],
    ["   ", ""],
  ])("W1: %j gives %j", (name, want) => {
    expect(initialsOf(name)).toBe(want);
  });

  describe("clause 1: words that hold a letter", () => {
    it("trims the name before it splits", () => {
      expect(initialsOf("  Anong Srisuk  ")).toBe("AS");
    });
    it("splits on any whitespace, not only a space", () => {
      expect(initialsOf("Anong\tSrisuk")).toBe("AS");
      expect(initialsOf("Anong\nSrisuk")).toBe("AS");
    });
    it("skips a leading word with no letter", () => {
      expect(initialsOf("2026 Brand")).toBe("B");
      expect(initialsOf("2026 Anong Srisuk")).toBe("AS");
    });
    it("skips a trailing word with no letter", () => {
      expect(initialsOf("Anong 2026")).toBe("A");
    });
    it("gives nothing for a name with no letter at all", () => {
      expect(initialsOf("")).toBe("");
      expect(initialsOf("123 456")).toBe("");
      expect(initialsOf("- _ .")).toBe("");
    });
  });

  describe("clause 2: the first cluster that holds a letter", () => {
    it("passes over leading punctuation", () => {
      expect(initialsOf("(Anong")).toBe("A");
      expect(initialsOf("-Anong Srisuk")).toBe("AS");
    });
    it("keeps a combining mark with its letter", () => {
      expect(initialsOf("école")).toBe("É");
    });
  });

  describe("clause 3: a Thai first cluster", () => {
    it("gives one consonant, never two", () => {
      expect(initialsOf("สมชาย ใจดี")).toBe("ส");
      expect(initialsOf("ไพลิน ศรีสุข")).toBe("พ");
    });
    it("passes a leading vowel over", () => {
      expect(initialsOf("โลโก้")).toBe("ล");
      expect(initialsOf("เมฆา")).toBe("ม");
    });
    it("takes the consonant of the first word, never of a later word", () => {
      expect(initialsOf("เ กมล")).toBe("");
    });
    it("covers both ends of the consonant range", () => {
      expect(initialsOf("กา")).toBe("ก");
      expect(initialsOf("ฮา")).toBe("ฮ");
    });
    it("gives nothing for a word with no consonant", () => {
      expect(initialsOf("เ")).toBe("");
    });
    it("drops the vowel and tone marks that follow", () => {
      expect(initialsOf("ปิ่น")).toBe("ป");
    });
  });

  describe("clause 4: any other first cluster", () => {
    it("adds the first cluster of the last word", () => {
      expect(initialsOf("Anong Srisuk")).toBe("AS");
    });
    it("takes the last word, not a middle one", () => {
      expect(initialsOf("Anong Bee Srisuk")).toBe("AS");
    });
    it("gives one letter for one word", () => {
      expect(initialsOf("Anong")).toBe("A");
    });
    it("upper-cases in code", () => {
      expect(initialsOf("anong srisuk")).toBe("AS");
      expect(initialsOf("émile zola")).toBe("ÉZ");
    });
    it("adds no second letter when the last word opens in Thai", () => {
      expect(initialsOf("Brand แคนวาส")).toBe("B");
      expect(initialsOf("Anong สมชาย")).toBe("A");
    });
    it("passes leading punctuation of the last word over", () => {
      expect(initialsOf("Anong (Srisuk)")).toBe("AS");
    });
  });
});
