/**
 * Owner's rule (2026-10-21): no middot (U+00B7) and no em dash (U+2014) in any UI text.
 * Scans component, story, and message sources plus the catalog. Fails with file and line.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.join(import.meta.dirname, "..");
const FORBIDDEN = [
  { char: "\u00B7", name: "a middot" },
  { char: "\u2014", name: "an em dash" },
];

function walk(dir: string, match: (file: string) => boolean): string[] {
  let out: string[] = [];
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name === "node_modules" || dirent.name === "storybook-static") continue;
      out = out.concat(walk(full, match));
    } else if (match(dirent.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("UI copy", () => {
  const files = [
    ...walk(path.join(root, "src"), (f) => /\.(tsx?|css|json|md|mdx)$/.test(f)),
    ...walk(path.join(root, "catalog"), (f) => /\.(ya?ml|md)$/.test(f)),
  ];

  it("contains no middot and no em dash", () => {
    const hits: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const { char, name } of FORBIDDEN) {
          if (line.includes(char)) hits.push(`${path.relative(root, file)}:${i + 1} has ${name}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});

/**
 * DESIGN.md "No jargon in user copy", as a word list for Thai messages (ORV-108). Developer words
 * are refused in the Thai message values. The product words the Studio teaches (token, component,
 * profile) are not on the list. This is a word list: it misses other spellings, and reading the
 * Thai copy aloud stays the check for tone.
 */
const THAI_JARGON = [
  "เอพีไอ",
  "เอนด์พอยต์",
  "แบ็กเอนด์",
  "ฟรอนต์เอนด์",
  "ดีพลอย",
  "รีเควสต์",
  "เพย์โหลด",
  "สคีมา",
  "ดีบัก",
  "คิวรี",
];
const LATIN_JARGON = ["API", "endpoint", "payload", "JSON", "null", "undefined"];
const STRING_LITERAL = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
const LATIN_WORD = new RegExp(`(?<![A-Za-z0-9_])(?:${LATIN_JARGON.join("|")})(?![A-Za-z0-9_])`);

/** Each jargon word found in a string literal of `source`, as `line N has <word>`. */
function thaiJargonHits(source: string): string[] {
  const hits: string[] = [];
  source.split("\n").forEach((line, i) => {
    for (const literal of line.match(STRING_LITERAL) ?? []) {
      for (const word of THAI_JARGON) {
        if (literal.includes(word)) hits.push(`line ${i + 1} has ${word}`);
      }
      const latin = literal.match(LATIN_WORD);
      if (latin) hits.push(`line ${i + 1} has ${latin[0]}`);
    }
  });
  return hits;
}

describe("Thai jargon list", () => {
  it("refuses a developer word in a Thai message", () => {
    expect(thaiJargonHits('  failed: "เรียก เอพีไอ ไม่สำเร็จ",')).toEqual(["line 1 has เอพีไอ"]);
    expect(thaiJargonHits('  raw: "ส่ง JSON ไป",')).toEqual(["line 1 has JSON"]);
  });

  it("lets the product word token through", () => {
    expect(thaiJargonHits('  tokensNone: "ไม่มี token ที่ต่างจากชุดพื้นฐาน",')).toEqual([]);
  });

  it("reads string values only, not keys or code", () => {
    expect(thaiJargonHits("  const payload = null;")).toEqual([]);
  });

  it("finds none in the Thai message values of the design system and the web app", () => {
    const th = readFileSync(path.join(root, "src/i18n/messages/th.ts"), "utf8");
    const web = readFileSync(path.join(root, "../../apps/web/i18n/messages.ts"), "utf8");
    // The web file holds Thai first and English after it; only the Thai half is scanned.
    const webThai = web.slice(0, web.indexOf("export type WebMessages"));
    const hits = [
      ...thaiJargonHits(th).map((h) => `packages/design-system/src/i18n/messages/th.ts ${h}`),
      ...thaiJargonHits(webThai).map((h) => `apps/web/i18n/messages.ts ${h}`),
    ];
    expect(hits).toEqual([]);
  });
});
