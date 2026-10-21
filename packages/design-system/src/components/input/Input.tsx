"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { ControlSize } from "../button/Button";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  size?: ControlSize | undefined;
  /** Sets `aria-invalid` and the error edge; the message itself comes from the Field. */
  invalid?: boolean | undefined;
}

/**
 * Single-line text. A native input with the control recipe; inside a Field it takes the Field's
 * id, description, error and required wiring. Read-only renders as text, not as a disabled control.
 */
export function Input({ size = "md", invalid, className, ...rest }: InputProps) {
  const field = useFieldControl(rest, invalid);
  return (
    <input
      {...rest}
      id={field.id}
      disabled={field.disabled}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-required={field.required || rest["aria-required"] || undefined}
      className={cx("ds-control", className)}
      data-size={size}
    />
  );
}
