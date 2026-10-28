import { describe, expect, it } from "vitest";
import { slugSchema } from "../knowledge";
import {
  FIRST_SCREEN_HEIGHT,
  bodyPairOf,
  contrastRatio,
  declaredFamiliesOf,
  familySubject,
  meetsFirstScreen,
  textDensity,
} from "./page";

// ORV-128 tech notes section 8, "Page": the contrast of the body pair, the densities and the font
// subjects. The contrast numbers come from the WCAG 2 formula computed outside the repo (this task).

describe("contrastRatio", () => {
  it.each([
    ["000000", "ffffff", 21],
    ["ffffff", "000000", 21],
    ["ffffff", "ffffff", 1],
    ["ff0000", "ffffff", 3.998],
    ["767676", "ffffff", 4.542],
    ["1a1a1a", "ffffff", 17.404],
    ["ff7a00", "ffffff", 2.613],
  ])("%s on %s is %s, to thousandths, in either order", (a, b, ratio) => {
    expect(contrastRatio(a, b)).toBe(ratio);
    expect(contrastRatio(b, a)).toBe(ratio);
  });
});

describe("the first screen", () => {
  const box = { x: 0, y: 0, width: 10, height: 10 };

  it("is 800 px high", () => {
    expect(FIRST_SCREEN_HEIGHT).toBe(800);
  });

  it.each([
    ["a box at y 799", { ...box, y: 799 }, true],
    ["a box at y 800", { ...box, y: 800 }, false],
    ["a box at y 0", box, true],
    ["a box of width 0", { ...box, width: 0 }, false],
    ["a box of height 0", { ...box, height: 0 }, false],
    ["a box of width 1 and height 1", { ...box, width: 1, height: 1 }, true],
  ])("%s meets it: %s", (_n, b, expected) => {
    expect(meetsFirstScreen(b)).toBe(expected);
  });

  it("text density is characters per 1,000 px2 of the 1280 x 800 viewport (1,024 thousand)", () => {
    expect(textDensity(1024)).toBe(1);
    expect(textDensity(0)).toBe(0);
    expect(textDensity(512)).toBe(0.5);
  });
});

describe("bodyPairOf", () => {
  const block = (path: string, length: number, pair: [string, string] | null) => ({
    path,
    length,
    pair: pair === null ? null : { color: `#${pair[0]}`, backdrop: `#${pair[1]}` },
  });

  it("is null for no block, and when no block has a pair", () => {
    expect(bodyPairOf([])).toBeNull();
    expect(bodyPairOf([block("html>body>p:nth-of-type(1)", 50, null)])).toBeNull();
  });

  it("is the pair over the most characters in all (10 + 25 against 30), at the first block that holds it", () => {
    const out = bodyPairOf([
      block("a", 10, ["333333", "ffffff"]),
      block("b", 30, ["1a1a1a", "ffffff"]),
      block("c", 25, ["333333", "ffffff"]),
    ]);
    expect(out).toEqual({
      subject: "333333-on-ffffff",
      color: "333333",
      backdrop: "ffffff",
      path: "a",
      ratio: 12.635,
    });
  });

  it("on a tie of characters, the lower subject wins whatever the order of the blocks", () => {
    const a = block("a", 20, ["333333", "ffffff"]);
    const b = block("b", 20, ["1a1a1a", "ffffff"]);
    for (const blocks of [
      [a, b],
      [b, a],
    ]) {
      const out = bodyPairOf(blocks);
      expect(out?.subject).toBe("1a1a1a-on-ffffff");
      expect(out?.path).toBe("b");
      expect(out?.ratio).toBe(17.404);
    }
  });

  it("on a tie, the lower backdrop wins when the colours are equal", () => {
    const out = bodyPairOf([
      block("a", 20, ["111111", "eeeeee"]),
      block("b", 20, ["111111", "dddddd"]),
    ]);
    expect(out?.subject).toBe("111111-on-dddddd");
  });

  it("a block with a null pair counts toward no pair", () => {
    const out = bodyPairOf([block("a", 500, null), block("b", 1, ["000000", "ffffff"])]);
    expect(out?.subject).toBe("000000-on-ffffff");
  });
});

describe("familySubject", () => {
  // Tech notes section 8, the worked cases (role body), each run through the engine's slugSchema.
  it.each([
    ["Inter", "body.inter"],
    ['"Noto Sans Thai"', "body.noto-sans-thai"],
    ['"IBM Plex Sans Thai"', "body.ibm-plex-sans-thai"],
    ["'TH Sarabun New'", "body.th-sarabun-new"],
    ["sans-serif", "body.sans-serif"],
    ["-apple-system", "body.apple-system.2f1a9564"],
    ["Sarabun_Bold", "body.sarabun-bold.3058bab1"],
    ['"ヒラギノ角ゴ Pro W3"', "body.pro-w3.cbc1cac5"],
    ['"微软雅黑"', "body.family.830d6642"],
    ["3D Sans", "body.3d-sans"],
    ["Inter2", "body.inter2"],
    ["Noto Sans ไทย", "body.noto-sans.ad5e5d7b"],
    ["Noto Sans 日本", "body.noto-sans.b31beccf"],
  ])("%s gives %s, and the subject passes slugSchema", (family, subject) => {
    expect(familySubject("body", family)).toBe(subject);
    expect(slugSchema.safeParse(subject).success).toBe(true);
  });

  it("an empty family, and a quoted empty one, give none", () => {
    expect(familySubject("body", "")).toBeNull();
    expect(familySubject("body", '""')).toBeNull();
    expect(familySubject("body", "  \t ")).toBeNull();
  });

  it("the role changes only the first part", () => {
    expect(familySubject("heading", '"Noto Sans Thai"')).toBe("heading.noto-sans-thai");
    expect(familySubject("declared", "-apple-system")).toBe("declared.apple-system.2f1a9564");
  });

  it("a space and a hyphen read alike, and the case is folded", () => {
    const subjects = [
      '"Noto Sans Thai"',
      "Noto-Sans-Thai",
      "noto  sans\tthai",
      "noto\nsans\fthai",
      "noto\rsans thai",
      " Noto Sans Thai\n",
    ].map((f) => familySubject("heading", f));
    expect(new Set(subjects)).toEqual(new Set(["heading.noto-sans-thai"]));
  });

  it("drops a pair of quotes only when one opens and closes the family", () => {
    expect(familySubject("body", "'Inter'")).toBe("body.inter");
    expect(familySubject("body", "\"Inter'")).toMatch(/^body\.inter\.[0-9a-f]{8}$/);
    expect(familySubject("body", '"')).toMatch(/^body\.family\.[0-9a-f]{8}$/);
  });

  it("turns a run of characters outside a to z and 0 to 9 into one hyphen in the base", () => {
    expect(familySubject("body", "Sarabun__Bold")).toMatch(/^body\.sarabun-bold\.[0-9a-f]{8}$/);
    expect(familySubject("body", "__a_b__")).toMatch(/^body\.a-b\.[0-9a-f]{8}$/);
  });

  it("lowercases A to Z only", () => {
    expect(familySubject("body", "ÀB")).toMatch(/^body\.b\.[0-9a-f]{8}$/);
    expect(familySubject("body", "ÀB")).not.toBe(familySubject("body", "àb"));
  });

  it("a two-part subject and a three-part subject never meet", () => {
    for (const f of ["Inter", "-apple-system", '"微软雅黑"', "a  b", "a_b"]) {
      const parts = (familySubject("body", f) ?? "").split(".").length;
      expect([2, 3]).toContain(parts);
    }
    expect(familySubject("body", "a_b")?.split(".")).toHaveLength(3);
    expect(familySubject("body", "a b")?.split(".")).toHaveLength(2);
  });
});

describe("declaredFamiliesOf", () => {
  it("reads the first family of each declaration, up to the first comma outside quotes", () => {
    const css =
      'a{font-family: "Noto Sans Thai", sans-serif} b{font-family:Inter} c{font-family:serif;}';
    expect(declaredFamiliesOf(css)).toEqual([
      { family: '"Noto Sans Thai"', offset: css.indexOf('"Noto') },
      { family: "Inter", offset: css.indexOf("Inter") },
      { family: "serif", offset: css.lastIndexOf("serif") },
    ]);
  });

  it("keeps a comma inside quotes", () => {
    expect(declaredFamiliesOf('a{font-family:"A, B", c}').map((f) => f.family)).toEqual(['"A, B"']);
  });

  it("drops a trailing !important, any case", () => {
    expect(declaredFamiliesOf("a{font-family: Inter !IMPORTANT}").map((f) => f.family)).toEqual([
      "Inter",
    ]);
  });

  it("does not read the font shorthand or a longer property name", () => {
    expect(declaredFamiliesOf("a{font: 12px Inter}")).toEqual([]);
    expect(declaredFamiliesOf("a{--font-family: Inter; x-font-family: Inter}")).toEqual([]);
  });

  it("trims the space before a comma, a semicolon or a brace", () => {
    expect(declaredFamiliesOf("a{font-family: Inter }").map((f) => f.family)).toEqual(["Inter"]);
    expect(declaredFamiliesOf("a{font-family: Inter ;}").map((f) => f.family)).toEqual(["Inter"]);
    expect(declaredFamiliesOf("a{font-family: Inter , serif}").map((f) => f.family)).toEqual([
      "Inter",
    ]);
  });

  it("reads a single-quoted family and a property name in any case", () => {
    expect(declaredFamiliesOf("a{FONT-FAMILY: 'A, B', c}").map((f) => f.family)).toEqual([
      "'A, B'",
    ]);
  });

  it("skips an empty value", () => {
    expect(declaredFamiliesOf("a{font-family:;}")).toEqual([]);
  });
});
