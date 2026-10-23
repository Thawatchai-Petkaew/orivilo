"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import { useId, type ReactNode } from "react";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { formatPercent } from "../../i18n/format";
import { cx } from "../cx";
import { CheckIcon, WarningIcon } from "../icons";

export type ProgressStatus = "running" | "done" | "failed";

export interface ProgressProps {
  /** Visible label; it names the bar. */
  label: ReactNode;
  /** How far the job has got, 0 to `max`. Leave it out when the length is unknown. */
  value?: number | undefined;
  max?: number | undefined;
  /** `done` fills the bar and `failed` keeps where it stopped; both say so in words. */
  status?: ProgressStatus | undefined;
  size?: "sm" | "md" | undefined;
  className?: string | undefined;
}

/**
 * How far a job has got (catalog `base/progress`). A known length shows the bar and the value as
 * text ("40%"); an unknown length shows a moving bar and the word "Working", and the bar is static
 * under reduced motion. A finished or failed job says so in words with an icon, so colour never
 * carries the state alone.
 */
export function Progress({
  label,
  value,
  max = 100,
  status = "running",
  size = "md",
  className,
}: ProgressProps) {
  const m = useMessages();
  const locale = useLocale();
  const labelId = useId();
  const done = status === "done";
  const failed = status === "failed";
  const ceiling = max > 0 ? max : 100;
  const known = value !== undefined || done;
  const current = known ? (done ? ceiling : Math.min(Math.max(value ?? 0, 0), ceiling)) : null;
  const running = !done && !failed;
  const indeterminate = current === null && running;
  const text = current === null ? m.progress.working : formatPercent(current / ceiling, locale);
  const word = done ? m.progress.done : failed ? m.progress.failed : null;
  return (
    <div
      className={cx("ds-progress", className)}
      data-size={size}
      data-status={status}
      data-indeterminate={indeterminate ? "" : undefined}
    >
      <div className="ds-progress__header">
        <span id={labelId} className="ds-progress__label">
          {label}
        </span>
        <span className="ds-progress__value">
          {running ? text : null}
          {/* Always mounted so a change to done or failed is announced. */}
          <span role="status" className="ds-progress__status">
            {done ? (
              <CheckIcon className="size-4" />
            ) : failed ? (
              <WarningIcon className="size-4" />
            ) : null}
            {word}
          </span>
        </span>
      </div>
      <ProgressPrimitive.Root
        className="ds-progress__bar"
        aria-labelledby={labelId}
        aria-busy={indeterminate || undefined}
        value={current}
        max={ceiling}
        getValueLabel={() => word ?? text}
      >
        <ProgressPrimitive.Indicator
          className="ds-progress__fill"
          style={current === null ? undefined : { inlineSize: `${(current / ceiling) * 100}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
