"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { useMessages } from "../../i18n/LocaleProvider";
import type { ControlSize } from "../button/Button";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { CheckIcon, ChevronDownIcon } from "../icons";

export interface SelectOption {
  /** Non-empty; Radix reserves the empty string for "no value". */
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectProps {
  /** The whole list; an empty array renders the empty line instead of a blank listbox. */
  options: readonly SelectOption[];
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  /** Shown in the trigger before a choice; never the label (the Field carries that). `select.placeholder` by default. */
  placeholder?: string | undefined;
  /** Line shown when `options` is empty; `select.empty` by default. */
  emptyText?: string | undefined;
  size?: ControlSize | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name; Radix renders a hidden native select for it. */
  name?: string | undefined;
  id?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-describedby"?: string | undefined;
  className?: string | undefined;
}

/**
 * Pick one of six or more known options (DESIGN.md §6). Radix Select gives the keyboard path,
 * type-ahead and the portal; the listbox re-opens the trigger's profile through `PortalScope`.
 * A selected option shows `surface.selected` and `selection.fg` plus a check glyph; the
 * highlighted one shows `surface.hover`, so selection and focus never share a colour.
 */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyText,
  size = "md",
  disabled,
  invalid,
  required,
  name,
  id,
  className,
  ...aria
}: SelectProps) {
  const m = useMessages();
  const field = useFieldControl(
    { id, disabled, "aria-describedby": aria["aria-describedby"] },
    invalid,
  );
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={field.disabled}
      required={field.required || required || false}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={field.id}
        className={cx("ds-control", className)}
        data-size={size}
        data-trigger=""
        aria-label={aria["aria-label"]}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
      >
        <SelectPrimitive.Value placeholder={placeholder ?? m.select.placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="ds-control__icon size-5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <PortalScope>
          <SelectPrimitive.Content className="ds-menu" position="popper" sideOffset={4}>
            <SelectPrimitive.Viewport>
              {options.length === 0 ? (
                <div className="ds-menu__empty" role="presentation">
                  {emptyText ?? m.select.empty}
                </div>
              ) : null}
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="ds-menu__option"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator asChild>
                    <CheckIcon className="size-4 shrink-0" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </PortalScope>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
