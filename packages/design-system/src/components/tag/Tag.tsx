"use client";

import { useState } from "react";
import { fill } from "../../i18n/messages/index";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { CheckIcon, CloseIcon } from "../icons";

export interface TagProps {
  /** The text of the tag; a long one truncates and the full text is in `title`. */
  label: string;
  size?: "sm" | "md" | undefined;
  /** Shows a remove button named "Remove {label}". */
  onRemove?: (() => void) | undefined;
  /** Passing any of `selected`, `defaultSelected` or `onSelectedChange` makes the tag selectable. */
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
  onSelectedChange?: ((selected: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * A label the user chose: a reference, a filter, a mention (catalog `base/tag`). Remove is its own
 * real button beside the label, never nested in it. A selectable tag is a toggle button
 * (`aria-pressed`); selected adds a check and a heavier edge, so it differs by more than colour.
 */
export function Tag({
  label,
  size = "md",
  onRemove,
  selected,
  defaultSelected,
  onSelectedChange,
  disabled = false,
  className,
}: TagProps) {
  const m = useMessages();
  const [own, setOwn] = useState(defaultSelected ?? false);
  const selectable =
    selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const on = selected ?? own;
  const body = (
    <>
      {selectable && on ? <CheckIcon className="ds-tag__check size-4" /> : null}
      <span className="ds-tag__label">{label}</span>
    </>
  );
  return (
    <span
      className={cx("ds-tag", className)}
      data-size={size}
      data-selected={selectable && on ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      title={label}
    >
      {selectable ? (
        <button
          type="button"
          className="ds-tag__main"
          aria-pressed={on}
          disabled={disabled}
          onClick={() => {
            if (selected === undefined) setOwn(!on);
            onSelectedChange?.(!on);
          }}
        >
          {body}
        </button>
      ) : (
        <span className="ds-tag__main">{body}</span>
      )}
      {onRemove ? (
        <button
          type="button"
          className="ds-tag__remove"
          aria-label={fill(m.tag.remove, { label })}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon className="size-4" />
        </button>
      ) : null}
    </span>
  );
}
