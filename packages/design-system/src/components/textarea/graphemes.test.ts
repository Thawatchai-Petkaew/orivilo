/** The Textarea counter counts grapheme clusters, not UTF-16 units (ORV-72, AC 4). */
import { describe, expect, it } from "vitest";
import { countGraphemes } from "./graphemes";

describe("countGraphemes", () => {
  it("counts a Thai cluster with a tone mark and sara am as one", () => {
    expect("น้ำ".length).toBe(3);
    expect(countGraphemes("น้ำ")).toBe(1);
  });

  it("counts Thai words the way a reader sees them", () => {
    expect(countGraphemes("น้ำใจ")).toBe(3);
    expect(countGraphemes("กี่ที่")).toBe(2);
  });

  it("counts Latin, emoji and an empty string", () => {
    expect(countGraphemes("Brief")).toBe(5);
    expect(countGraphemes("👍🏽")).toBe(1);
    expect(countGraphemes("")).toBe(0);
  });

  it("counts mixed Thai and Latin with spaces", () => {
    expect(countGraphemes("แบรนด์ ORIVILO")).toBe(countGraphemes("แบรนด์") + 8);
  });
});
