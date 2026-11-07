"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { MouseEvent } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { Spinner } from "../spinner/Spinner";

export interface SwitchProps {
  /** Controlled state. Two states only, no mixed. */
  checked?: boolean | undefined;
  defaultChecked?: boolean | undefined;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** The form field name; a form submits `value` (default `on`) under it while the switch is on. */
  name?: string | undefined;
  value?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** `sm` for tables and dense lists; it keeps a 24 px target. */
  size?: "sm" | "md" | undefined;
  /** The error look when no `Field` sets it (switch-api-1). */
  invalid?: boolean | undefined;
  /**
   * A save is in flight (switch-save-1): a ring turns in the thumb, a click and a key are stopped,
   * and focus stays. The caller owns the request and sets `checked`; `disabled` wins over `saving`.
   */
  saving?: boolean | undefined;
  /** The status text while `saving`; the catalog's `switch.saving` by default. */
  savingLabel?: string | undefined;
  id?: string | undefined;
  /** A switch outside a `Field` needs `aria-label` or `aria-labelledby` (switch-api-1). */
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
  "aria-describedby"?: string | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * An on/off setting that applies at once (DESIGN.md §6). Radix Switch gives the switch role, Space
 * and Enter. It has no label of its own: inside a `Field orientation="horizontal"` it reads the
 * label, description, error, requiredness and disabled from the Field, and outside a Field it
 * names itself with `aria-label` or `aria-labelledby`. The label never changes with the state.
 * It makes no request and prints no saved word: the caller owns the save (switch-save-1).
 */
export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  value,
  required,
  disabled,
  size = "md",
  invalid,
  saving = false,
  savingLabel,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  className,
}: SwitchProps) {
  const m = useMessages();
  const field = useFieldControl({ id, "aria-describedby": ariaDescribedby, disabled }, invalid);
  const isRequired = required ?? field.required;
  // `disabled` wins over `saving`: a disabled switch shows no ring, no status and no busy state.
  const busy = saving && !field.disabled;
  // preventDefault makes Radix's composed handler skip the toggle, for a pointer, the label, Space
  // and Enter alike, while the native `disabled` stays off so focus stays on the switch.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) event.preventDefault();
  };
  return (
    <span className={cx("ds-switch", className)} data-size={size}>
      <SwitchPrimitive.Root
        id={field.id}
        className="ds-switch__track"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        name={name}
        value={value}
        required={isRequired || undefined}
        disabled={field.disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid ? true : undefined}
        aria-busy={busy || undefined}
        aria-disabled={busy || undefined}
        onClick={handleClick}
      >
        <SwitchPrimitive.Thumb className="ds-switch__thumb">
          {busy ? <Spinner decorative /> : null}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
      {busy ? (
        <span role="status" className="sr-only">
          {savingLabel ?? m.switch.saving}
        </span>
      ) : null}
    </span>
  );
}
