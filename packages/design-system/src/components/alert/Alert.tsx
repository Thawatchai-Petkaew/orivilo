"use client";

import type { ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { FeaturedIcon } from "../featured-icon/FeaturedIcon";
import { CloseIcon } from "../icons";

/**
 * The four kinds are Alert's own type, spelled out here and never derived from `FeaturedIconProps`,
 * so a later kind on FeaturedIcon never widens Alert (`alert-api-1`). `live` is typed per kind
 * (`alert-live-1`): `success` cannot be raised to `alert`, the listed failure of SC 4.1.3, and
 * `danger` cannot drop to `status`.
 */
type AlertKind =
  | { variant: "success"; live?: "status" | "off" | undefined }
  | { variant: "info" | "warning"; live?: "status" | "alert" | "off" | undefined }
  | { variant: "danger"; live?: "alert" | "off" | undefined };

export type AlertProps = AlertKind & {
  /** What happened. */
  title: string;
  /** The fix for `danger` and `warning`; what the person can do next for `success` and `info`. */
  description: string;
  /** The caller's own `<Button size="sm" variant="secondary">`, one at most. */
  action?: ReactNode | undefined;
  /** When given, a close button shows. The caller unmounts the Alert and moves focus on. */
  onDismiss?: (() => void) | undefined;
  /** Layout only. */
  className?: string | undefined;
};

/** What each kind announces when `live` is left out (`alert-live-1`). */
const DEFAULT_LIVE = {
  success: "status",
  info: "status",
  warning: "status",
  danger: "alert",
} as const;

/**
 * An inline message for one feedback kind (catalog `base/alert`): a tile, a title that says what
 * happened and a description that says the fix, with an optional action and close. It stays until
 * the caller takes it out, never takes focus, and has no animation. `live="off"` gives it no role,
 * for a message already on the page at first render or one placed inside the caller's own live
 * container (`alert-load-1`, `alert-mount-1`).
 */
export function Alert({
  variant,
  title,
  description,
  action,
  onDismiss,
  live,
  className,
}: AlertProps) {
  const m = useMessages();
  const value = live ?? DEFAULT_LIVE[variant];
  return (
    <div
      className={cx("ds-alert", className)}
      data-variant={variant}
      role={value === "off" ? undefined : value}
    >
      <FeaturedIcon variant={variant} size="sm" />
      <div className="ds-alert__content">
        <p className="ds-alert__title">{title}</p>
        <p className="ds-alert__description">{description}</p>
        {action ? <div className="ds-alert__action">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={m.alert.dismiss}
          className="ds-alert__close"
          onClick={onDismiss}
        >
          <CloseIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
