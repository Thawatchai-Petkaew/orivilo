/**
 * The landing's catalog and source rules (spec ORV-309 rows 2 and 14): the `oriviloLanding` group
 * exists in both locales with the same keys and placeholders, the U+2060 word joiners are in the
 * Thai title and band title and nowhere else, no middot or em dash, no claim without data, and the
 * example's source holds no raw colour value.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "../i18n/locale";
import { messagesFor, placeholdersOf } from "../i18n/messages/index";

const JOINER = String.fromCodePoint(0x2060);
type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const at = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(at, value);
    else for (const [k, v] of leaves(value, at)) out.set(k, v);
  }
  return out;
}

const FORBIDDEN = new RegExp(`[${String.fromCodePoint(0xb7)}${String.fromCodePoint(0x2014)}]`);
const THAI = new RegExp(`[${String.fromCodePoint(0xe00)}-${String.fromCodePoint(0xe7f)}]`);

const group = (locale: (typeof LOCALES)[number]) =>
  leaves(messagesFor(locale).oriviloLanding as unknown as Tree);
const th = group("th");
const en = group("en");

describe("oriviloLanding catalog", () => {
  it("has the same keys in English and Thai, with the same placeholders", () => {
    expect(th.size).toBeGreaterThan(40);
    expect([...en.keys()].sort()).toEqual([...th.keys()].sort());
    for (const [key, value] of en) {
      expect(placeholdersOf(value).sort(), key).toEqual(placeholdersOf(th.get(key) ?? "").sort());
    }
  });

  it("holds the copy of the design: the buttons, the footer and the AI label", () => {
    expect(en.get("start")).toBe("Start from your brief");
    expect(th.get("start")).toBe("เริ่มจากบรีฟของคุณ");
    expect(en.get("concept")).toBe("A concept preview with sample projects.");
    expect(th.get("concept")).toBe("ตัวอย่างแนวคิด ใช้โปรเจกต์ตัวอย่าง");
    expect(en.get("aiPhoto")).toBe("Photograph made with AI.");
    expect(th.get("aiPhoto")).toBe("ภาพถ่ายนี้สร้างด้วย AI");
  });

  it("keeps U+2060 in the Thai title and band title only, never in English (R7)", () => {
    const withJoiner = (leaf: Map<string, string>) =>
      [...leaf].filter(([, v]) => v.includes(JOINER)).map(([k]) => k);
    expect(withJoiner(th).sort()).toEqual(["bandTitle", "title"]);
    expect(withJoiner(en)).toEqual([]);
    // The whole English catalog is free of it, not only this group.
    const everyEnglish = leaves(messagesFor("en") as unknown as Tree);
    expect([...everyEnglish].filter(([, v]) => v.includes(JOINER))).toEqual([]);
  });

  it("puts the joiners inside the words the narrow line breaker would split", () => {
    expect(th.get("title")?.split(JOINER)).toEqual([
      "ให้ไอ",
      "เดีย",
      "มี",
      "ตัว",
      "ตน และไปต่อได้",
      "จริง",
    ]);
    expect(th.get("bandTitle")?.split(JOINER)).toEqual(["ทำให้เจตนาจับ", "ต้อง", "ได้"]);
  });

  it("has no middot, no em dash and no empty value", () => {
    for (const [key, value] of [...th, ...en]) {
      expect(value.trim(), key).not.toBe("");
      expect(value, key).not.toMatch(FORBIDDEN);
    }
  });

  it("keeps Thai out of English and Thai in the Thai copy", () => {
    for (const [key, value] of en) expect(value, key).not.toMatch(THAI);
    for (const [key, value] of th) {
      if (key === "board.nameValue") continue;
      expect(value, key).toMatch(THAI);
    }
  });

  it("claims nothing without data: no number, rating, user count or quote", () => {
    for (const [locale, leaf] of [
      ["en", en],
      ["th", th],
    ] as const) {
      for (const [key, value] of leaf) {
        expect(value, `${locale}:${key}`).not.toMatch(/\d|%|["“”]/);
      }
    }
    const english = [...en.values()].join(" ");
    expect(english).not.toMatch(/\b(rating|rated|stars?|reviews?|trusted|customers?|users)\b/i);
  });
});

/** Raw colour forms the example may not hold: hex, rgb(a), hsl(a), oklch and oklab. */
const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/;
const rawColourLines = (source: string) =>
  source
    .split("\n")
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => RAW_COLOUR.test(line))
    .map(({ n }) => n);

describe("OriviloLanding source", () => {
  it("catches each raw colour form", () => {
    expect(rawColourLines('const a = "#7A22C7";')).toEqual([1]);
    expect(rawColourLines('const a = "#fff";')).toEqual([1]);
    expect(rawColourLines("style={{ background: rgb(0 0 0) }}")).toEqual([1]);
    expect(rawColourLines("x: rgba(0, 0, 0, 0.5)")).toEqual([1]);
    expect(rawColourLines("x: hsl(10 20% 30%)")).toEqual([1]);
    expect(rawColourLines("x: hsla(10 20% 30% / 0.5)")).toEqual([1]);
    expect(rawColourLines("x: oklch(0.5 0.1 200)")).toEqual([1]);
    expect(rawColourLines("x: oklab(0.5 0.1 0.1)")).toEqual([1]);
    expect(rawColourLines("x: var(--ds-surface-canvas)")).toEqual([]);
  });

  it("holds no raw colour value", () => {
    const source = readFileSync(path.join(import.meta.dirname, "orivilo-landing.tsx"), "utf8");
    expect(rawColourLines(source)).toEqual([]);
  });
});
