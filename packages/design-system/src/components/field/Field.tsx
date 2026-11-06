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
  /** The id of the label element; set only with `group`, where the label cannot reach the control by `for`. */
  labelId: string | undefined;
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
  /** Set only inside a `Field group`: the id the group control names itself by (`aria-labelledby`). */
  labelledBy: string | undefined;
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
    labelledBy: field?.labelId,
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
  /**
   * The control is a group (a RadioGroup, a `div` that `for` cannot reach): the label renders as a
   * `span` with an id, and the control names itself with `aria-labelledby` (field-group-1).
   */
  group?: boolean | undefined;
  /**
   * One control: Input, Textarea, Select, or the file input inside FileUpload; with `group`, a
   * RadioGroup.
   */
  children: ReactNode;
}

/**
 * Label, description and error around one control. The control reads the wiring through context,
 * so the label is linked by `for`/`id`, the description and error by `aria-describedby`, and an
 * error sets `aria-invalid` (DESIGN.md §7 invalid, catalog rules for Input, Textarea, Select).
 * With `group` the label is a `span` the group control names itself by, not a `label` with `for`.
 */
export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  id: ownId,
  className,
  group = false,
  children,
}: FieldProps) {
  const generated = useId();
  const id = ownId ?? generated;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const labelId = group ? `${id}-label` : undefined;
  const value: FieldControlProps = {
    id,
    "aria-describedby": [errorId, descriptionId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
    disabled,
    labelId,
  };
  const labelContent = (
    <>
      {label}
      {required ? (
        <span className="ds-field__required" aria-hidden="true">
          {" *"}
        </span>
      ) : null}
    </>
  );
  return (
    <div className={cx("ds-field", className)} data-disabled={disabled ? "" : undefined}>
      {group ? (
        <span className="ds-field__label" id={labelId}>
          {labelContent}
        </span>
      ) : (
        <label className="ds-field__label" htmlFor={id}>
          {labelContent}
        </label>
      )}
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
