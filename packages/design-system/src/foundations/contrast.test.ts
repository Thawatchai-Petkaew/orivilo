import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "./contrast";

describe("contrastRatio", () => {
  it("matches the ratios recorded in DESIGN.md §3.1", () => {
    expect(contrastRatio("#16151D", "#F4F4F0")).toBe(16.4);
    expect(contrastRatio("#FFFFFF", "#7A22C7")).toBe(7.3);
    expect(contrastRatio("#5B5A66", "#F4F4F0")).toBe(6.1);
    expect(contrastRatio("#D9F66F", "#16151D")).toBe(15);
  });

  it("accepts three- and six-digit hex and rejects anything else", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("oklch(0.5 0 0)")).toBeNull();
    expect(contrastRatio("", "#000000")).toBeNull();
  });
});
