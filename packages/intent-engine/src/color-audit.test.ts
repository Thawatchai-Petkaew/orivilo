import { describe, expect, it } from "vitest";
import { auditLineup, classifyHex, lineupInputSchema, lineupSchema } from "./color-audit";
import { STAND_IN_LINEUP } from "./color-fixtures";

describe("category audit", () => {
  it("classifies the ORIVILO stand-in lineup", () => {
    const audit = auditLineup(STAND_IN_LINEUP);
    const family = (hex: string) => audit.entries.find((e) => e.hex === hex)?.family;
    for (const hex of ["#5B3FD9", "#6E4AE8", "#7B5CF0"]) expect(family(hex)).toBe("violet");
    for (const hex of ["#111111", "#0A0A0A"]) expect(family(hex)).toBe("ink");
    for (const hex of ["#D2691E", "#C8743F"]) expect(family(hex)).toBe("orange");
    expect(audit.crowded).toEqual(["ink", "orange", "violet"]);
    expect(audit.gaps).toEqual([
      "blue",
      "cyan",
      "green",
      "lime",
      "magenta",
      "red",
      "teal",
      "yellow",
    ]);
  });

  // [edge, hex just below the edge, family below, hex exactly on the edge, family from the edge]
  const edges = [
    [10, "#FD2A00", "red", "#781400", "orange"],
    [45, "#FFBF00", "orange", "#785A00", "yellow"],
    [65, "#E8FD00", "yellow", "#6E7800", "lime"],
    [95, "#67F700", "lime", "#327800", "green"],
    [150, "#00FF7F", "green", "#00783C", "teal"],
    [185, "#00E8FD", "teal", "#006E78", "cyan"],
    [205, "#008FF5", "cyan", "#004678", "blue"],
    [240, "#0001FF", "blue", "#000078", "violet"],
    [290, "#D100FB", "violet", "#640078", "magenta"],
    [345, "#FF0040", "magenta", "#78001E", "red"],
  ] as const;

  it.each(edges)("band edges: hue %i", (_edge, below, belowFamily, on, onFamily) => {
    expect(classifyHex(below)).toBe(belowFamily);
    expect(classifyHex(on)).toBe(onFamily);
  });

  it("band edges: chroma 0.11 and 0.12, lightness either side of 0.5", () => {
    // 28/255 = 0.110 is achromatic, 31/255 = 0.122 has a hue (red here).
    expect(classifyHex("#8C7070")).toBe("ink");
    expect(classifyHex("#907474")).toBe("paper");
    expect(classifyHex("#8F7070")).toBe("red");
    expect(classifyHex("#7F7F7F")).toBe("ink");
    expect(classifyHex("#808080")).toBe("paper");
  });

  it("order never matters", () => {
    const reversed = [...STAND_IN_LINEUP].reverse();
    expect(auditLineup(reversed)).toEqual(auditLineup(STAND_IN_LINEUP));
  });
});

describe("lineup bounds", () => {
  const entry = (i: number) => ({ name: `n${i}`, hex: "#112233" });
  const pathOf = (lineup: unknown) => {
    const parsed = lineupInputSchema.safeParse({ lineup });
    return parsed.success ? null : parsed.error.issues[0]?.path.join(".");
  };

  it("fails with the path of the bad field", () => {
    expect(pathOf([])).toBe("lineup");
    expect(pathOf(Array.from({ length: 21 }, (_, i) => entry(i)))).toBe("lineup");
    expect(pathOf([entry(0), entry(1), entry(2), { name: "N0", hex: "#112233" }])).toBe(
      "lineup.3.name",
    );
    expect(pathOf([{ name: "x".repeat(61), hex: "#112233" }])).toBe("lineup.0.name");
    for (const hex of ["#12345", "red", "#GGGGGG", "#FFF"]) {
      expect(pathOf([{ name: "a", hex }])).toBe("lineup.0.hex");
    }
  });

  it("accepts null as not given, and stores hex uppercase", () => {
    expect(lineupInputSchema.parse({ lineup: null })).toEqual({ lineup: null });
    expect(lineupSchema.parse([{ name: " a ", hex: "#abcdef" }])).toEqual([
      { name: "a", hex: "#ABCDEF" },
    ]);
    expect(lineupSchema.safeParse(Array.from({ length: 20 }, (_, i) => entry(i))).success).toBe(
      true,
    );
  });
});
