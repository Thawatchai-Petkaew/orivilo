"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { RadioDotIcon } from "../icons";

export interface RadioGroupProps {
  /** Items: `RadioGroupItem` only. */
  children: ReactNode;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /** The form field name; the checked item's `value` is submitted under it. */
  name?: string | undefined;
  required?: boolean | undefined;
  /** Disables every item. One item can also be disabled alone. */
  disabled?: boolean | undefined;
  /** The group's size wins; an item has no size prop. `sm` for dense lists. */
  size?: "sm" | "md" | undefined;
  /**
   * Layout only: a row that wraps instead of a column. It is not passed to the Radix root, because
   * Radix would then drop two of the four arrow keys (radio-keys-1).
   */
  orientation?: "vertical" | "horizontal" | undefined;
  /** The error look when no `Field` sets it (radio-invalid-1). */
  invalid?: boolean | undefined;
  id?: string | undefined;
  /** A group outside a `Field group` needs `aria-label` or `aria-labelledby` (field-group-1). */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-describedby"?: string | undefined;
  /** Layout only. */
  className?: string | undefined;
}

export interface RadioGroupItemProps {
  value: string;
  /** Part of the hit area; the circle alone is never the control. */
  label: ReactNode;
  /** A line under the label. A click on it does not select. */
  description?: ReactNode | undefined;
  disabled?: boolean | undefined;
  id?: string | undefined;
  /** Layout only. */
  className?: string | undefined;
}

interface GroupContext {
  size: "sm" | "md";
  disabled: boolean;
}

const GroupContext = createContext<GroupContext>({ size: "md", disabled: false });

/**
 * Exactly one of a short list where every option shows (DESIGN.md §6; six or more go to Select).
 * Radix Radio Group gives the radiogroup role, roving focus and the four arrow keys. Inside a
 * `Field group` the group reads its name, description, error, requiredness and disabled from the
 * Field; `aria-invalid` and `aria-required` sit on the group, never on an item (radio-invalid-1).
 */
export function RadioGroup({
  children,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  size = "md",
  orientation = "vertical",
  invalid,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  className,
}: RadioGroupProps) {
  const field = useFieldControl({ id, "aria-describedby": ariaDescribedby, disabled }, invalid);
  const isRequired = required ?? field.required;
  return (
    <GroupContext.Provider value={{ size, disabled: field.disabled }}>
      <RadioGroupPrimitive.Root
        id={field.id}
        className={cx("ds-radio-group", className)}
        data-size={size}
        data-layout={orientation}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        required={isRequired || undefined}
        disabled={field.disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby ?? field.labelledBy}
        aria-describedby={field.describedBy}
        aria-disabled={field.disabled ? true : undefined}
        aria-invalid={field.invalid ? true : undefined}
      >
        {children}
      </RadioGroupPrimitive.Root>
    </GroupContext.Provider>
  );
}

/**
 * One option: the circle (the Radix item), a real `<label for>` that is part of the hit area, and
 * an optional description tied by `aria-describedby`. The description sits outside the label, so a
 * click on it does not select.
 */
export function RadioGroupItem({
  value,
  label,
  description,
  disabled = false,
  id: ownId,
  className,
}: RadioGroupItemProps) {
  const group = useContext(GroupContext);
  const generated = useId();
  const id = ownId ?? generated;
  const descriptionId = description ? `${id}-description` : undefined;
  const off = disabled || group.disabled;
  return (
    <div
      className={cx("ds-radio", className)}
      data-disabled={off ? "" : undefined}
      // Marks the row's label and description as belonging to a disabled control, so the a11y
      // addon reads their disabled ink (text.disabled, 3.0 or more, DESIGN.md §7) as exempt.
      aria-disabled={off ? true : undefined}
    >
      <RadioGroupPrimitive.Item
        id={id}
        value={value}
        disabled={off}
        className="ds-radio__control"
        aria-describedby={descriptionId}
      >
        <RadioGroupPrimitive.Indicator asChild>
          <span className="inline-flex">
            <RadioDotIcon
              className={group.size === "sm" ? "size-3" : "size-4"}
              fill="currentColor"
            />
          </span>
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      <div className="flex min-w-0 flex-col">
        <label className="ds-radio__label" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="ds-field__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
