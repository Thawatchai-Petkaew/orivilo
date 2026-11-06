import { formatPercent } from "../../i18n/format";
import type { Locale } from "../../i18n/locale";
import { fill, type Messages } from "../../i18n/messages/index";
import type { FileUploadItem } from "./FileUpload";

/** Progress is spoken at each quarter: 25, 50, 75, 100. */
const STEPS = 4;

/** The quarter that `progress` (0 to 100) has reached, 0 to 4. */
const stepOf = (progress: number) =>
  Math.max(0, Math.min(Math.floor(progress / (100 / STEPS)), STEPS));

/**
 * What the control says aloud for the change from `prev` to `next` (`upload-announce-1`): one text,
 * the lines joined by a space in item order, or "" when nothing is worth saying (the caller then
 * leaves the region as it was). Items are compared by `id`. A new item, or one whose status
 * changed, announces its start, its result or its failure with the reason. An item that stays
 * uploading announces a percent only when a quarter was reached and it is the only uploading item
 * in `next`, so several files at once never crowd the queue. The percent speaks through a polite
 * status region and never through role alert.
 */
export function announcements(
  prev: readonly FileUploadItem[],
  next: readonly FileUploadItem[],
  m: Messages,
  locale: Locale,
): string {
  const before = new Map(prev.map((item) => [item.id, item]));
  const uploading = next.filter((item) => item.status === "uploading").length;
  const lines: string[] = [];
  for (const item of next) {
    const was = before.get(item.id);
    if (!was || was.status !== item.status) {
      if (item.status === "uploading") {
        lines.push(fill(m.fileUpload.announceStart, { name: item.name }));
      } else if (item.status === "done") {
        lines.push(fill(m.fileUpload.announceDone, { name: item.name }));
      } else {
        lines.push(fill(m.fileUpload.announceFailed, { name: item.name, reason: item.reason }));
      }
    } else if (
      item.status === "uploading" &&
      was.status === "uploading" &&
      uploading === 1 &&
      item.progress !== undefined &&
      was.progress !== undefined
    ) {
      const step = stepOf(item.progress);
      if (step > stepOf(was.progress)) {
        lines.push(
          fill(m.fileUpload.announceProgress, {
            name: item.name,
            percent: formatPercent(step / STEPS, locale),
          }),
        );
      }
    }
  }
  return lines.join(" ");
}
