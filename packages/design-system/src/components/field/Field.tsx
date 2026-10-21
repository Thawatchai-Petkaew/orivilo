"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { cx } from "../cx";

/** What a control inside a Field reads to wire itself: ids, validity, requiredness. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  "aria-required": true | undefined;
  disabled: boolean;
}

const FieldContext = createContext<FieldControlProps | null>(null);

/** Merges a control's own props with the nearest Field's wiring. Own values win where both exist. */
export function useFieldControl<
  T extends {
    id?: string | undefined;
    "aria-describedby"?: string | undefined;
    "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling" | undefined;
    disabled?: boolean | undefined;
  },
>(
  props: T,
  invalid: boolean | undefined,
): {
  id: string | undefined;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
} {
  const field = useContext(FieldContext);
  const describedBy =
    [props["aria-describedby"], field?.["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return {
    id: props.id ?? field?.id,
    describedBy,
    invalid:
      invalid ??
      (props["aria-invalid"] === true ||
        props["aria-invalid"] === "true" ||
        field?.["aria-invalid"] === true),
    required: field?.["aria-required"] === true,
    disabled: props.disabled ?? field?.disabled ?? false,
  };
}

export interface FieldProps {
  /** Always visible; a placeholder is never the label (catalog rule). */
  label: ReactNode;
  /** Help that reads before the user types, linked by `aria-describedby`. */
  description?: ReactNode | undefined;
  /** Says what went wrong and how to fix it; sets `aria-invalid` on the control. */
  error?: ReactNode | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Own id for the control; generated when absent. */
  id?: string | undefined;
  className?: string | undefined;
  /** One control: Input, Textarea or Select. */
  children: ReactNode;
}

/**
 * Label, description and error around one control. The control reads the wiring through context,
 * so the label is linked by `for`/`id`, the description and error by `aria-describedby`, and an
 * error sets `aria-invalid` (DESIGN.md §7 invalid, catalog rules for Input, Textarea, Select).
 */
export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  id: ownId,
  className,
  children,
}: FieldProps) {
  const generated = useId();
  const id = ownId ?? generated;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const value: FieldControlProps = {
    id,
    "aria-describedby": [errorId, descriptionId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
    disabled,
  };
  return (
    <div className={cx("ds-field", className)} data-disabled={disabled ? "" : undefined}>
      <label className="ds-field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="ds-field__required" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>
      {description ? (
        <p className="ds-field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
      {error ? (
        <p className="ds-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
