import { formatNumber } from "../../i18n/format";
import type { Locale } from "../../i18n/locale";
import { fill, type Messages } from "../../i18n/messages/index";

/** One kind of file a control takes: its name on screen, its MIME type and its extensions. */
export interface FileUploadType {
  label: string;
  mime: string;
  extensions: readonly string[];
}

/** What a person may hand over, shown before any choice and read by `judgeFiles` (`upload-limits-1`). */
export interface FileUploadLimits {
  maxFiles: number;
  maxBytes: number;
  types: readonly FileUploadType[];
}

/**
 * The three limits of ADR 0009 point 5 that a person can act on (`upload-limits-1`). One MB is
 * 1,000,000 bytes, the smaller of the two readings of "4 MB", so a file that passes here passes
 * under either (`upload-size-1`). The other lines of point 5 are server steps that no code does
 * yet, so nothing here or on screen claims them.
 */
export const IMAGE_UPLOAD_LIMITS = {
  maxFiles: 5,
  maxBytes: 4_000_000,
  types: [
    { label: "PNG", mime: "image/png", extensions: [".png"] },
    { label: "JPEG", mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
    { label: "WebP", mime: "image/webp", extensions: [".webp"] },
  ],
} as const satisfies FileUploadLimits;

/**
 * Every size on screen (`upload-size-text-1`). Sizes round up to one decimal place, so a file over
 * the limit never reads at or under it: 4,000,001 bytes reads "4.1 MB" beside a "4 MB" limit.
 */
export function fileSizeText(bytes: number, locale: Locale, m: Messages): string {
  const kb = Math.ceil(bytes / 100) / 10;
  if (kb < 1000) return fill(m.fileUpload.sizeKb, { size: formatNumber(kb, locale) });
  return fill(m.fileUpload.sizeMb, {
    size: formatNumber(Math.ceil(bytes / 100_000) / 10, locale),
  });
}

/** The labels of the accepted kinds, joined for a sentence: "PNG, JPEG, WebP". */
export const typesText = (limits: FileUploadLimits) => limits.types.map((t) => t.label).join(", ");

/** The `accept` string of the input: each rule's MIME type, then its extensions (a hint only). */
export const acceptOf = (limits: FileUploadLimits) =>
  limits.types.flatMap((t) => [t.mime, ...t.extensions]).join(",");

/** The line that shows the limits before any choice, built from `limits` and never typed. */
export function limitsText(limits: FileUploadLimits, locale: Locale, m: Messages): string {
  return fill(m.fileUpload.limits, {
    types: typesText(limits),
    size: fileSizeText(limits.maxBytes, locale, m),
    count: limits.maxFiles,
  });
}
