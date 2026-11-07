import { describe, expect, it } from "vitest";
import { webMessages } from "./messages";

/** Every string of a catalog with its path; arrays use their index in the path. */
function walk(value: unknown, path: string[] = []): Array<[string, unknown]> {
  if (typeof value === "string") return [[path.join("."), value]];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => walk(child, [...path, key]));
  }
  return [[path.join("."), value]];
}

// ORV-144 row 20. No check reads apps/web/i18n for the owner's copy rules (the design system's
// copy checks scan packages/design-system only), so this test does. A key in one language only
// also fails `pnpm typecheck`, because WebMessages is typeof th.
describe("the web catalog", () => {
  const th = walk(webMessages.th);
  const en = walk(webMessages.en);

  it("has the same key paths in Thai and English", () => {
    expect(th.map(([path]) => path)).toStrictEqual(en.map(([path]) => path));
  });

  it("every catalog string is in Thai and English, without a middot or an em dash", () => {
    for (const [locale, entries] of [
      ["th", th],
      ["en", en],
    ] as const) {
      for (const [path, text] of entries) {
        expect(typeof text, `${locale} ${path}`).toBe("string");
        expect((text as string).trim(), `${locale} ${path}`).not.toBe("");
        expect(text, `${locale} ${path}`).not.toMatch(/[·—]/);
      }
    }
  });

  it("carries the failure lines of orv144-ui", () => {
    expect(webMessages.en.failure).toStrictEqual({
      reference: "Reference: {requestId}",
      network: "Could not reach ORIVILO. Check your connection, then try again.",
    });
    expect(webMessages.th.failure).toStrictEqual({
      reference: "รหัสอ้างอิง: {requestId}",
      network: "ติดต่อ ORIVILO ไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง",
    });
  });

  // ORV-267 "Strings": the three keys the parent places in this catalog, word for word.
  it("carries the brand report keys of ORV-266 'Strings'", () => {
    expect(webMessages.en.home.openBrandReport).toBe(
      "Paste a website address and see a brand evidence report",
    );
    expect(webMessages.th.home.openBrandReport).toBe(
      "วางที่อยู่เว็บไซต์ แล้วดูรายงานหลักฐานแบรนด์",
    );
    expect(webMessages.en.brandReport).toStrictEqual({
      title: "Brand evidence report, ORIVILO",
      description:
        "Paste a website address and see what its page declares and says, read by rules.",
    });
    expect(webMessages.th.brandReport).toStrictEqual({
      title: "รายงานหลักฐานแบรนด์, ORIVILO",
      description:
        "วางที่อยู่เว็บไซต์ แล้วดูสิ่งที่หน้านั้นประกาศและเขียนไว้ อ่านตามกฎ ยังไม่ใช้ AI",
    });
  });
});
