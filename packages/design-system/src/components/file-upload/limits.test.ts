import { describe, expect, it } from "vitest";
import { messagesFor } from "../../i18n/messages/index";
import { acceptOf, fileSizeText, IMAGE_UPLOAD_LIMITS, limitsText } from "./limits";

const SIZES = [
  [0, "0 KB"],
  [1536, "1.6 KB"],
  [512000, "512 KB"],
  [999900, "999.9 KB"],
  [999901, "1 MB"],
  [1843200, "1.9 MB"],
  [3999999, "4 MB"],
  [4000000, "4 MB"],
  [4000001, "4.1 MB"],
  [4194304, "4.2 MB"],
  [4900000, "4.9 MB"],
] as const;

describe("fileSizeText (upload-size-text-1, worked example W1)", () => {
  it.each(SIZES)("writes %i bytes as %s in English", (bytes, text) => {
    expect(fileSizeText(bytes, "en", messagesFor("en"))).toBe(text);
  });

  it.each(SIZES)("writes %i bytes with the same Latin digits in Thai", (bytes, text) => {
    expect(fileSizeText(bytes, "th", messagesFor("th"))).toBe(text);
  });

  it("rounds up, so a file over the limit never reads at or under it", () => {
    const m = messagesFor("en");
    expect(fileSizeText(IMAGE_UPLOAD_LIMITS.maxBytes + 1, "en", m)).not.toBe(
      fileSizeText(IMAGE_UPLOAD_LIMITS.maxBytes, "en", m),
    );
  });
});

describe("IMAGE_UPLOAD_LIMITS (upload-limits-1, upload-size-1)", () => {
  it("holds the three limits of ADR 0009 point 5 that a person can act on", () => {
    expect(IMAGE_UPLOAD_LIMITS).toEqual({
      maxFiles: 5,
      maxBytes: 4_000_000,
      types: [
        { label: "PNG", mime: "image/png", extensions: [".png"] },
        { label: "JPEG", mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
        { label: "WebP", mime: "image/webp", extensions: [".webp"] },
      ],
    });
  });

  it("builds the accept string of worked example W5", () => {
    expect(acceptOf(IMAGE_UPLOAD_LIMITS)).toBe(
      "image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp",
    );
  });

  it("builds the limits line from the object, in Thai and English (worked example W6)", () => {
    expect(limitsText(IMAGE_UPLOAD_LIMITS, "th", messagesFor("th"))).toBe(
      "ไฟล์ PNG, JPEG, WebP ขนาดไม่เกิน 4 MB ต่อไฟล์ เลือกได้สูงสุด 5 ไฟล์",
    );
    expect(limitsText(IMAGE_UPLOAD_LIMITS, "en", messagesFor("en"))).toBe(
      "PNG, JPEG, WebP files, up to 4 MB each. At most 5 files",
    );
  });

  it("follows the object: other limits give another line", () => {
    const other = {
      maxFiles: 10,
      maxBytes: 1_500_000,
      types: [{ label: "GIF", mime: "image/gif", extensions: [".gif"] }],
    };
    expect(limitsText(other, "en", messagesFor("en"))).toBe(
      "GIF files, up to 1.5 MB each. At most 10 files",
    );
    expect(acceptOf(other)).toBe("image/gif,.gif");
  });
});
