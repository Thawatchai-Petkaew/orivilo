"use client";

import type { ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { Spinner } from "../spinner/Spinner";

export interface LoadingStateProps {
  /** What is loading, in the caller's language; the catalog's `spinner.loading` by default. */
  label?: string | undefined;
  /**
   * Who speaks. `status` (default) is one `role="status"` holding the ring and the label. `off`
   * renders no role and the label in a plain `p`, for a region that owns its status.
   */
  live?: "status" | "off" | undefined;
  /** The caller's own Button that stops the wait, one at most. It sits outside any status. */
  action?: ReactNode;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A region that waits (catalog `application/loading-state`): the Spinner ring at `lg` with its
 * label under it and an optional stop action, centred and capped at the panel width. It sets no
 * `aria-busy`: the region that waits sets it on itself while it waits and drops it when done.
 * It has no pulse and adds no motion beyond the ring's own turn.
 */
export function LoadingState({ label, live = "status", action, className }: LoadingStateProps) {
  const m = useMessages();
  const text = label ?? m.spinner.loading;
  return (
    <div className={cx("ds-loading-state", className)}>
      {live === "status" ? (
        <Spinner size="lg" label={text} />
      ) : (
        <div className="ds-loading-state__quiet">
          <Spinner decorative size="lg" />
          <p className="ds-loading-state__label">{text}</p>
        </div>
      )}
      {action ? <div className="ds-loading-state__action">{action}</div> : null}
    </div>
  );
}
