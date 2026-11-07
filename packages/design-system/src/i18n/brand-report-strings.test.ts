import {
  CHROMATIC_FAMILIES,
  EVIDENCE_STRINGS,
  FLAG_KEYS,
  NOT_MEASURED_REASON_LINES,
  NOT_MEASURED_WHAT_KEYS,
  PERSONALITY_AXES,
  REPORT_LINES,
} from "@orivilo/intent-engine";
import { describe, expect, it } from "vitest";
import { LOCALES } from "./locale";
import { messagesFor } from "./messages/index";

/**
 * The brand report screen looks the view's keys up in `brandReport.engine` (ORV-266 tech notes
 * section 7). These tests hold that table to the engine's own words, in both languages, and to the
 * keys a view can carry, so a word edited in one place or a key added in the engine fails here.
 */
describe("brandReport.engine", () => {
  for (const locale of LOCALES) {
    const engine: Record<string, string> = messagesFor(locale).brandReport.engine;

    it(`${locale}: every line is word for word the engine's EVIDENCE_STRINGS`, () => {
      const wrong = Object.entries(engine)
        .filter(([key, text]) => {
          const source = (EVIDENCE_STRINGS as Record<string, { th: string; en: string }>)[key];
          return source === undefined || source[locale] !== text;
        })
        .map(([key]) => key);
      expect(wrong).toEqual([]);
    });
  }

  it("holds every key a ReportView can carry, and no other", () => {
    const carried = [
      "read.refused.robots",
      "read.refused.address",
      "read.failed.timeout",
      "read.failed.network",
      "read.failed.redirects",
      "read.failed.notHtml",
      "read.notRead.competitor",
      "evidence.belowFloor",
      ...REPORT_LINES,
      ...Object.values(NOT_MEASURED_REASON_LINES).flatMap((r) =>
        r.reason === null ? [r.line] : [r.line, r.reason],
      ),
      ...Object.values(NOT_MEASURED_WHAT_KEYS),
      ...FLAG_KEYS.filter((key) => key.startsWith("quality.")),
    ];
    expect(Object.keys(messagesFor("th").brandReport.engine).sort()).toEqual(
      [...new Set(carried)].sort(),
    );
  });
});

describe("brandReport word lists", () => {
  it("names every hue band the analyser can give, the ten families then ink and paper", () => {
    expect(Object.keys(messagesFor("th").brandReport.hue)).toEqual([
      ...CHROMATIC_FAMILIES,
      "ink",
      "paper",
    ]);
  });

  it("names every personality axis in the direction catalog the screen reuses", () => {
    expect(Object.keys(messagesFor("th").direction.axes)).toEqual([...PERSONALITY_AXES]);
  });

  it("names the four text kinds, title, meta, heading, body", () => {
    expect(Object.keys(messagesFor("th").brandReport.kind)).toEqual([
      "title",
      "meta",
      "heading",
      "body",
    ]);
  });
});

describe("brandReport.notAllowed", () => {
  it("is the approved text in both languages, with no middot and no em dash", () => {
    expect(messagesFor("en").brandReport.notAllowed).toBe(
      "Reading a website is open only to approved accounts for now, and this account is not one of them.",
    );
    expect(messagesFor("th").brandReport.notAllowed).toBe(
      "ตอนนี้การอ่านเว็บไซต์เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ",
    );
    for (const locale of LOCALES) {
      const banned = new RegExp(`[${String.fromCharCode(0xb7, 0x2014)}]`);
      expect(messagesFor(locale).brandReport.notAllowed).not.toMatch(banned);
    }
  });
});
