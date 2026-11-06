"use client";

import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import type { Locale } from "../../i18n/locale";
import { fill, type Messages } from "../../i18n/messages/index";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { Field, useFieldControl } from "../field/Field";
import { CheckIcon, CloseIcon, RetryIcon, UploadIcon, WarningIcon } from "../icons";
import { Progress } from "../progress/Progress";
import { announcements } from "./announce";
import { judgeFiles, type RejectedFile } from "./judge";
import { acceptOf, fileSizeText, type FileUploadLimits, limitsText, typesText } from "./limits";

/** One file in the list. The caller owns the list and sets each item's status. */
export type FileUploadItem = { id: string; name: string; size?: number | undefined } & (
  | { status: "uploading"; progress?: number | undefined }
  | { status: "done" }
  | { status: "failed"; reason: string }
);

export interface FileUploadProps {
  /** Always visible; also the end of the Choose button's name. */
  label: string;
  limits: FileUploadLimits;
  items: readonly FileUploadItem[];
  /** The files that passed the check, once per pick; never called with an empty list. */
  onFiles: (files: File[]) => void;
  /** A failed item was asked to try again; the caller sets it to `uploading` in the same handler. */
  onRetry: (id: string) => void;
  /** An item was asked to leave; stopping an upload that is running is the caller's job. */
  onRemove: (id: string) => void;
  /** The caller's own error, shown first among the lines under the zone. */
  error?: ReactNode | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/** At most this many refused files get a line; the rest fold into one count. */
const REJECT_LINES = 5;

function rejectLine(file: RejectedFile, limits: FileUploadLimits, locale: Locale, m: Messages) {
  const f = m.fileUpload;
  switch (file.reason) {
    case "type":
      return fill(f.rejectType, { name: file.name, types: typesText(limits) });
    case "size":
      return fill(f.rejectSize, {
        name: file.name,
        size: fileSizeText(file.size, locale, m),
        max: fileSizeText(limits.maxBytes, locale, m),
      });
    case "count":
      return fill(f.rejectCount, { name: file.name, count: limits.maxFiles });
  }
}

/** The input and its visible button. They sit inside the Field, which wires the id and the errors. */
function Picker({
  label,
  limits,
  full,
  onPick,
}: {
  label: string;
  limits: FileUploadLimits;
  full: boolean;
  onPick: (files: File[]) => void;
}) {
  const m = useMessages();
  const field = useFieldControl({}, undefined);
  const input = useRef<HTMLInputElement>(null);
  const hintId = field.id ? `${field.id}-hint` : undefined;
  const describedBy =
    [field.describedBy, full ? hintId : undefined].filter(Boolean).join(" ") || undefined;
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared at once so the same file can be chosen again (`upload-input-1`).
    event.target.value = "";
    if (files.length > 0) onPick(files);
  };
  return (
    <div
      className="ds-file-upload__zone"
      data-full={full ? "" : undefined}
      data-invalid={field.invalid ? "" : undefined}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={acceptOf(limits)}
        id={field.id}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        aria-invalid={field.invalid || undefined}
        disabled={field.disabled || full}
        onChange={change}
      />
      <Button
        variant="secondary"
        size="md"
        className="ds-file-upload__choose"
        iconLeading={<UploadIcon />}
        aria-label={fill(m.fileUpload.chooseLabel, { label })}
        aria-describedby={describedBy}
        aria-disabled={full || undefined}
        disabled={field.disabled}
        onClick={() => input.current?.click()}
      >
        {m.fileUpload.choose}
      </Button>
      {full ? (
        <p className="ds-file-upload__hint" id={hintId}>
          {fill(m.fileUpload.full, { count: limits.maxFiles })}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Chooses files and lists them with their progress (catalog `base/file-upload`). It shows limits
 * and state only: it reads no file, calls no network and sends nothing. The check before the wait
 * (`judgeFiles`) is a courtesy that names a refused file and how to fix it; the real checks (type
 * by content, size, count) stay on the server. A file name is untrusted and renders as text only.
 * The caller owns `items` and sets each status; the control never shows a file as done on its own.
 */
export function FileUpload({
  label,
  limits,
  items,
  onFiles,
  onRetry,
  onRemove,
  error,
  disabled = false,
  className,
}: FileUploadProps) {
  const m = useMessages();
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const leaving = useRef(new Set<string>());
  const [rejected, setRejected] = useState<readonly RejectedFile[]>([]);
  // The voice of the control: what changed since the last render, said once, politely. Items
  // present at the first render say nothing, because `seen` starts as `items`.
  const [seen, setSeen] = useState(items);
  const [announcement, setAnnouncement] = useState("");
  if (seen !== items) {
    setSeen(items);
    const said = announcements(seen, items, m, locale);
    if (said) setAnnouncement(said);
  }

  // A removed item takes its focus with it: put it on Choose, never on the page.
  useEffect(() => {
    if (leaving.current.size === 0) return;
    const present = new Set(items.map((item) => item.id));
    const gone = [...leaving.current].filter((id) => !present.has(id));
    if (gone.length === 0) return;
    for (const id of gone) leaving.current.delete(id);
    root.current?.querySelector<HTMLElement>(".ds-file-upload__choose")?.focus();
  }, [items]);

  const full = items.length >= limits.maxFiles;
  const pick = (files: File[]) => {
    const result = judgeFiles(files, limits, items.length);
    setRejected(result.rejected);
    if (result.accepted.length > 0) onFiles(result.accepted);
  };
  const shown = rejected.slice(0, REJECT_LINES);
  const folded = rejected.length - shown.length;
  const lines =
    error || shown.length > 0 ? (
      <>
        {error ? <span>{error}</span> : null}
        {shown.map((file, i) => (
          <span key={i} className="ds-file-upload__rejected">
            {rejectLine(file, limits, locale, m)}
          </span>
        ))}
        {folded > 0 ? (
          <span className="ds-file-upload__rejected" data-fold="">
            {fill(m.fileUpload.rejectMore, { count: folded })}
          </span>
        ) : null}
      </>
    ) : undefined;

  return (
    <div ref={root} className={cx("ds-file-upload", className)}>
      <Field
        label={label}
        description={limitsText(limits, locale, m)}
        error={lines}
        disabled={disabled}
      >
        <Picker label={label} limits={limits} full={full} onPick={pick} />
      </Field>
      {items.length > 0 ? (
        <ul className="ds-file-upload__list" aria-label={m.fileUpload.listLabel}>
          {items.map((item) => (
            <li key={item.id} className="ds-file-upload__item" data-status={item.status}>
              <div className="ds-file-upload__body">
                {item.status === "uploading" ? (
                  <Progress size="sm" label={item.name} value={item.progress} />
                ) : (
                  <p className="ds-file-upload__name">{item.name}</p>
                )}
                <p className="ds-file-upload__meta">
                  <span>
                    {item.size === undefined
                      ? m.fileUpload.sizeMissing
                      : fileSizeText(item.size, locale, m)}
                  </span>
                  {item.status === "done" ? (
                    <span className="ds-file-upload__word">
                      <CheckIcon className="size-4" />
                      {m.fileUpload.done}
                    </span>
                  ) : null}
                  {item.status === "failed" ? (
                    <span className="ds-file-upload__word">
                      <WarningIcon className="size-4" />
                      {m.fileUpload.failed}
                    </span>
                  ) : null}
                </p>
                {item.status === "failed" ? (
                  <>
                    <p className="ds-file-upload__reason">{item.reason}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="ds-file-upload__retry"
                      iconLeading={<RetryIcon />}
                      aria-label={fill(m.fileUpload.retryLabel, { name: item.name })}
                      disabled={disabled}
                      onClick={(event) => {
                        const row = event.currentTarget.closest("li");
                        onRetry(item.id);
                        // Retry unmounts when the item turns uploading: keep focus in the row.
                        row?.querySelector<HTMLElement>(".ds-file-upload__actions button")?.focus();
                      }}
                    >
                      {m.fileUpload.retry}
                    </Button>
                  </>
                ) : null}
              </div>
              <div className="ds-file-upload__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={fill(m.fileUpload.removeLabel, { name: item.name })}
                  disabled={disabled}
                  onClick={() => {
                    leaving.current.add(item.id);
                    setRejected([]);
                    onRemove(item.id);
                  }}
                >
                  <CloseIcon className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <div role="status" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
