"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { Fragment, type ReactNode, useId } from "react";
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
  /** An icon before the label, 16 px, hidden from assistive tech. It also shows in the trigger after a choice. */
  icon?: ReactNode | undefined;
  /** A second line under the label in `text.secondary`, read as the option's description. Never shown in the trigger. */
  description?: string | undefined;
  disabled?: boolean | undefined;
}

export interface SelectGroup {
  /** The heading that labels the group (`role="group"`, `aria-labelledby`). */
  label: string;
  options: readonly SelectOption[];
}

/** The list is either flat (`options`) or grouped (`groups`), never both. */
type SelectItems =
  | {
      /** The whole list; an empty array renders the empty line instead of a blank listbox. */
      options: readonly SelectOption[];
      groups?: undefined;
    }
  | {
      /** Headed groups; a group with no options is not rendered, and none left shows the empty line. */
      groups: readonly SelectGroup[];
      options?: undefined;
    };

export type SelectProps = SelectItems & {
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
};

/**
 * Pick one of six or more known options (DESIGN.md §6). Radix Select gives the keyboard path,
 * type-ahead and the portal; the listbox re-opens the trigger's profile through `PortalScope`.
 * A selected option shows `surface.selected` and `selection.fg` plus a check glyph; the
 * highlighted one shows `surface.hover`, so selection and focus never share a colour.
 */
export function Select({
  options,
  groups,
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
  const visibleGroups = (groups ?? []).filter((group) => group.options.length > 0);
  const isEmpty = groups ? visibleGroups.length === 0 : (options?.length ?? 0) === 0;
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
              {isEmpty ? (
                <div className="ds-menu__empty" role="presentation">
                  {emptyText ?? m.select.empty}
                </div>
              ) : null}
              {groups
                ? visibleGroups.map((group, index) => (
                    <Fragment key={`${index}:${group.label}`}>
                      {index > 0 ? (
                        <SelectPrimitive.Separator className="ds-menu__separator" />
                      ) : null}
                      <SelectPrimitive.Group>
                        <SelectPrimitive.Label className="ds-menu__label">
                          {group.label}
                        </SelectPrimitive.Label>
                        {group.options.map((option) => (
                          <SelectOptionItem key={option.value} option={option} />
                        ))}
                      </SelectPrimitive.Group>
                    </Fragment>
                  ))
                : options?.map((option) => <SelectOptionItem key={option.value} option={option} />)}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </PortalScope>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectOptionItem({ option }: { option: SelectOption }) {
  const descriptionId = useId();
  const { icon, description } = option;
  // The icon rides inside ItemText so the trigger shows icon and label after a choice; the
  // description stays outside it, so the trigger keeps one line.
  const text = (
    <SelectPrimitive.ItemText>
      {icon ? (
        <span className="ds-menu__option-line">
          <span className="ds-menu__option-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="ds-menu__option-label">{option.label}</span>
        </span>
      ) : (
        option.label
      )}
    </SelectPrimitive.ItemText>
  );
  return (
    <SelectPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      className="ds-menu__option"
      data-described={description ? "" : undefined}
      data-icon={icon ? "" : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {description ? (
        <span className="ds-menu__option-body">
          {text}
          <span id={descriptionId} className="ds-menu__option-description">
            {description}
          </span>
        </span>
      ) : (
        text
      )}
      <SelectPrimitive.ItemIndicator asChild>
        <CheckIcon className="size-4 shrink-0" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
