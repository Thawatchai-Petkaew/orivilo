import { describe, expect, it } from "vitest";
import { messagesFor } from "../../i18n/messages/index";
import { announcements } from "./announce";
import type { FileUploadItem } from "./FileUpload";

const th = messagesFor("th");
const en = messagesFor("en");
const up = (id: string, progress?: number): FileUploadItem => ({
  id,
  name: `${id}.png`,
  status: "uploading",
  progress,
});
const done = (id: string): FileUploadItem => ({ id, name: `${id}.png`, status: "done" });
const failed = (id: string, reason: string): FileUploadItem => ({
  id,
  name: `${id}.png`,
  status: "failed",
  reason,
});
const said = (prev: FileUploadItem[], next: FileUploadItem[]) =>
  announcements(prev, next, th, "th");

describe("announcements (upload-announce-1)", () => {
  it("speaks a percent for one file only at each quarter reached (worked example W4)", () => {
    const steps = [0, 10, 24, 25, 49, 80, 100];
    const out = steps.slice(1).map((p, i) => said([up("a", steps[i])], [up("a", p)]));
    expect(out).toEqual([
      "",
      "",
      "a.png อัปโหลดไปแล้ว 25%",
      "",
      "a.png อัปโหลดไปแล้ว 75%",
      "a.png อัปโหลดไปแล้ว 100%",
    ]);
  });

  it("holds progress to 0 through 100 before it counts quarters", () => {
    expect(said([up("a", 90)], [up("a", 130)])).toBe("a.png อัปโหลดไปแล้ว 100%");
    expect(said([up("a", -10)], [up("a", 10)])).toBe("");
  });

  it("speaks the percent in English words too", () => {
    expect(announcements([up("a", 10)], [up("a", 30)], en, "en")).toBe("a.png: 25% uploaded");
  });

  it("speaks no percent with a second uploading item", () => {
    expect(said([up("a", 10), up("b", 10)], [up("a", 60), up("b", 10)])).toBe("");
  });

  it("speaks no percent when progress is unknown on either side", () => {
    expect(said([up("a")], [up("a", 60)])).toBe("");
    expect(said([up("a", 10)], [up("a")])).toBe("");
  });

  it("starts with the name for a new uploading item", () => {
    expect(said([], [up("a", 0)])).toBe("กำลังอัปโหลด a.png");
  });

  it("starts again when a failed item is retried", () => {
    expect(said([failed("a", "x")], [up("a")])).toBe("กำลังอัปโหลด a.png");
  });

  it("says done when an item turns done", () => {
    expect(said([up("a", 100)], [done("a")])).toBe("อัปโหลด a.png แล้ว");
  });

  it("says failed with the reason when an item turns failed", () => {
    expect(said([up("a", 60), up("b", 10)], [up("a", 60), failed("b", "หลุด")])).toBe(
      "อัปโหลด b.png ไม่สำเร็จ: หลุด",
    );
  });

  it("gives nothing for items that did not change, as at the first render", () => {
    const items = [up("a", 50), done("b")];
    expect(said(items, items)).toBe("");
    expect(said(items, [...items])).toBe("");
  });

  it("joins two changes in one render into one text, in item order", () => {
    expect(said([up("a", 90), up("b", 10)], [done("a"), failed("b", "r")])).toBe(
      "อัปโหลด a.png แล้ว อัปโหลด b.png ไม่สำเร็จ: r",
    );
  });

  it("says nothing for an item that left the list", () => {
    expect(said([up("a", 10)], [])).toBe("");
  });
});
