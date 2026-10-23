"use client";

import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useId, type ReactNode } from "react";
import { cx } from "../cx";
import { CheckIcon, MinusIcon } from "../icons";

export type CheckedState = boolean | "indeterminate";

export interface CheckboxProps {
  /** Part of the hit area (catalog rule); the box alone is never the control. */
  label: ReactNode;
  /** `sm` for tables and dense lists: a 16 px box that keeps a 24 px target (ORV-72). */
  size?: "sm" | "md" | undefined;
  description?: ReactNode | undefined;
  /** Says what went wrong and how to fix it; sets `aria-invalid`. */
  error?: ReactNode | undefined;
  checked?: CheckedState | undefined;
  defaultChecked?: CheckedState | undefined;
  onCheckedChange?: ((checked: CheckedState) => void) | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
  value?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * Zero or more of a short list, applied on submit (DESIGN.md §6). Radix Checkbox exposes
 * `indeterminate` as `aria-checked="mixed"`; the checked and mixed states show a glyph on a
 * filled box, never a fill alone (catalog rule). The label is a real `<label>`, so it toggles the box.
 */
export function Checkbox({
  label,
  size = "md",
  description,
  error,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  required,
  name,
  value,
  id: ownId,
  className,
}: CheckboxProps) {
  const generated = useId();
  const id = ownId ?? generated;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(" ") || undefined;
  const glyph = size === "sm" ? "size-3" : "size-4";
  return (
    <div
      className={cx("ds-checkbox", className)}
      data-size={size}
      data-disabled={disabled ? "" : undefined}
    >
      <CheckboxPrimitive.Root
        id={id}
        className="ds-checkbox__box"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      >
        <CheckboxPrimitive.Indicator asChild>
          <span className="inline-flex">
            {checked === "indeterminate" || defaultChecked === "indeterminate" ? (
              <MinusIcon className={glyph} />
            ) : (
              <CheckIcon className={glyph} />
            )}
          </span>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="flex min-w-0 flex-col">
        <label className="ds-checkbox__label" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="ds-field__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="ds-field__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
