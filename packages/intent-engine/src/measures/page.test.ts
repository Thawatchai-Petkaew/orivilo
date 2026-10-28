import { describe, expect, it } from "vitest";
import { slugSchema } from "../knowledge";
import { renderSnapshotSchema } from "../render-snapshot";
import {
  FIRST_SCREEN_HEIGHT,
  FONT_FAMILY_MAX_CHARS,
  bodyPairOf,
  contrastRatio,
  declaredFamiliesOf,
  familySubject,
  meetsFirstScreen,
  textDensity,
} from "./page";

declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
/** The framework timeout of a test that guards a time bound: above the bound, so vitest never pre-empts the guard. */
const HEAVY_TIMEOUT = 60_000;
/** The time bound of a stylesheet measure on 1 MB (SEC-3), sized for the CI runner under the parallel full suite (ORV-139): at least 10 times the slowest local time seen while `pnpm test` ran, and below the time the defect it guards takes. */
const TIME_BOUND_MS = 3000;
const MB = 1024 * 1024;

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

  describe("a family over the bound gives no item (SEC-3)", () => {
    const families = (css: string) => declaredFamiliesOf(css).map((f) => f.family);

    it("is the bound of a font family in the snapshot: 100 characters", () => {
      expect(FONT_FAMILY_MAX_CHARS).toBe(100);
      const rgba = new Uint8Array(320 * 200 * 4);
      const snapshot = (fontFamily: string) => ({
        version: "1",
        renderer: {
          driver: "playwright",
          driverVersion: "1.56.1",
          browser: "chromium",
          browserVersion: "141.0.7390.37",
        },
        viewport: { width: 1280, height: 800 },
        firstScreen: { width: 320, height: 200, rgba },
        fullPage: { width: 320, height: 200, rgba },
        textBoxes: [
          {
            path: "html>body>p",
            box: { x: 0, y: 0, width: 10, height: 10 },
            pair: null,
            fontFamily,
          },
        ],
        elements: [],
      });
      expect(
        renderSnapshotSchema.safeParse(snapshot("a".repeat(FONT_FAMILY_MAX_CHARS))).success,
      ).toBe(true);
      expect(
        renderSnapshotSchema.safeParse(snapshot("a".repeat(FONT_FAMILY_MAX_CHARS + 1))).success,
      ).toBe(false);
    });

    it.each([
      ["a semicolon", ";"],
      ["a comma", ","],
      ["a brace", "}"],
      ["the end of the sheet", ""],
    ])("a family of 100 characters ending at %s is kept, one of 101 is not", (_n, end) => {
      const at = (n: number) => `a{font-family:${"f".repeat(n)}${end}`;
      expect(families(at(100))).toEqual(["f".repeat(100)]);
      expect(families(at(101))).toEqual([]);
    });

    it("counts a quoted family with its quotes, and a comma inside the quotes does not end it", () => {
      expect(families(`a{font-family:"${"f".repeat(98)}"}`)).toHaveLength(1); // 100 with quotes
      expect(families(`a{font-family:"${"f".repeat(99)}"}`)).toEqual([]); // 101
      expect(families(`a{font-family:"${"f,".repeat(60)}"}`)).toEqual([]); // the comma is inside the quotes
    });

    it("an item after an over-long family is still read", () => {
      expect(families(`a{font-family:${"f".repeat(200)}}b{font-family:Inter}`)).toEqual(["Inter"]);
    });

    it("the scan counts the value as written, !important included", () => {
      expect(families(`a{font-family:${"f".repeat(80)} !important}`)).toEqual(["f".repeat(80)]);
      expect(families(`a{font-family:${"f".repeat(90)} !important}`)).toEqual([]); // 101 as written
    });
  });

  describe("no family for a value that names no font (S-8)", () => {
    const families = (css: string) => declaredFamiliesOf(css).map((f) => f.family);

    it.each([
      ["a var() value", "a{font-family:var(--font-sans)}"],
      ["a var() value with a fallback", "a{font-family:var(--font-sans, Inter)}"],
      ["an upper-case VAR(", "a{font-family:VAR(--x)}"],
      ["inherit", "a{font-family:inherit}"],
      ["initial", "a{font-family:initial}"],
      ["unset", "a{font-family:unset}"],
      ["revert", "a{font-family:revert}"],
      ["revert-layer", "a{font-family:revert-layer}"],
      ["a keyword in any case", "a{font-family:INHERIT}"],
      ["a keyword with !important", "a{font-family:inherit !important}"],
      ["an @font-face descriptor", "@font-face{font-family:'X Brand';src:url(x.woff2)}"],
      ["an @font-face descriptor in any case", "@FONT-FACE{font-family:'X Brand'}"],
      ["an @font-face inside @media", "@media print{@font-face{font-family:X}}"],
      ["an @font-face with a comment before it", "/* c */ @font-face /* d */ {font-family:X}"],
      ["an @font-face with a string holding a brace", "@font-face{src:url('}');font-family:X}"],
      ["a value that holds var( after other text", "a{font-family:Inter var(--x)}"],
      ["an @font-face after an @import", "@import url(x.css);@font-face{font-family:X}"],
      ["an @font-face that is never closed", "@font-face{font-family:X"],
      ["an @font-face after a rule", "a{margin:0} @font-face{font-family:X}"],
    ])("gives none for %s", (_name, css) => {
      expect(families(css)).toEqual([]);
    });

    it.each([
      ["a family named like a keyword", "a{font-family:inherited}", ["inherited"]],
      ["a family that only starts like var", "a{font-family:variable}", ["variable"]],
      ["a rule after an @font-face", "@font-face{font-family:X} a{font-family:Inter}", ["Inter"]],
      [
        "a rule in @media after an @font-face",
        "@font-face{font-family:X}@media print{a{font-family:Inter}}",
        ["Inter"],
      ],
      ["a rule before an @font-face", "a{font-family:Inter} @font-face{font-family:X}", ["Inter"]],
      ["a rule whose selector looks like it", "@font-faces{font-family:Inter}", ["Inter"]],
      [
        "a rule after an @font-face with a nested block",
        "@font-face{src:url(x)}a{font-family:Inter}",
        ["Inter"],
      ],
      [
        "the value after a var() fallback list is not read",
        "a{font-family:Inter, var(--x)}",
        ["Inter"],
      ],
      [
        "a second declaration after a keyword",
        "a{font-family:inherit}b{font-family:Georgia}",
        ["Georgia"],
      ],
    ])("gives the family for %s", (_name, css, expected) => {
      expect(families(css)).toEqual(expected);
    });
  });

  describe("every route is linear in a 1 MB sheet (SEC-3)", () => {
    const timed = (css: string) => {
      expect(css.length).toBeLessThanOrEqual(MB);
      const started = performance.now();
      const out = declaredFamiliesOf(css);
      expect(performance.now() - started).toBeLessThan(TIME_BOUND_MS);
      return out;
    };

    it.each([
      ["font-family: with no end", (n: number) => "font-family:a ".repeat(n / 14)],
      ["a 1 MB run of spaces before !important", (n: number) => `font-family:a${" ".repeat(n)}b`],
      [
        "a 1 MB run of spaces then !important",
        (n: number) => `font-family:a${" ".repeat(n)}!important x`,
      ],
      ["a 1 MB quoted value with no end", (n: number) => `font-family:"${"a".repeat(n)}`],
      [
        "a 1 MB value of font-family names",
        (n: number) => `font-family:${"font-family:".repeat(n / 12)}`,
      ],
      ["1 MB of open @font-face blocks", (n: number) => "@font-face{".repeat(n / 11)],
      ["1 MB of unclosed comments", (n: number) => "/*".repeat(n / 2)],
      ["1 MB of unclosed strings", (n: number) => "'x\n".repeat(n / 4)],
      ["1 MB of closing braces", (n: number) => "}".repeat(n)],
    ])(
      "%s",
      (_name, make) => {
        timed(make(MB - 64));
      },
      HEAVY_TIMEOUT,
    );

    it(
      "1 MB of short declarations is read in order",
      () => {
        const n = 45_000;
        const css = Array.from({ length: n }, (_, i) => `a{font-family:f${i}}`).join("");
        const out = timed(css);
        expect(out).toHaveLength(n);
        expect(out[n - 1]?.family).toBe(`f${n - 1}`);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "1 MB of @font-face blocks, each with a descriptor, gives none",
      () => {
        expect(timed("@font-face{font-family:X}".repeat(40_000))).toEqual([]);
      },
      HEAVY_TIMEOUT,
    );
  });
});
