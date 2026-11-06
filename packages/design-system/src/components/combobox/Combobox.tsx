"use client";

import { Popover as PopoverPrimitive, ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import {
  type ChangeEvent,
  Fragment,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { useMessages } from "../../i18n/LocaleProvider";
import { fill, type Messages } from "../../i18n/messages/index";
import { Button, type ControlSize } from "../button/Button";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { CheckIcon, ChevronDownIcon, CloseIcon } from "../icons";
import { InputGroup } from "../input-group/InputGroup";
import type { SelectGroup, SelectOption } from "../select/Select";
import { filterGroups, filterOptions, statusKey, type StatusKey } from "./options";
import { useComboboxList } from "./useComboboxList";

export type ComboboxOption = SelectOption;
export type ComboboxGroup = SelectGroup;

/** The list is flat (`options`) or grouped (`groups`), never both. */
type ComboboxItems =
  | {
      /** The whole list; an empty array shows the empty line when the list opens. */
      options: readonly ComboboxOption[];
      groups?: undefined;
    }
  | {
      /** Headed groups; a group with no option left after the filter is not rendered. */
      groups: readonly ComboboxGroup[];
      options?: undefined;
    };

export type ComboboxProps = ComboboxItems & {
  /** The chosen option, or `null` for none. Pass it with `onValueChange` to control the field. */
  value?: ComboboxOption | null | undefined;
  defaultValue?: ComboboxOption | null | undefined;
  /** Called once per choice, and with `null` when the clear button empties the field. */
  onValueChange?: ((option: ComboboxOption | null) => void) | undefined;
  /** Shown while the input is empty; never the label (the Field carries that). `combobox.prompt` by default. */
  placeholder?: string | undefined;
  /** The line shown when the list has no option and the text is blank; `select.empty` by default. */
  emptyText?: string | undefined;
  size?: ControlSize | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name; one hidden input carries the chosen option's `value`. */
  name?: string | undefined;
  id?: string | undefined;
  /** Shows a button that empties the choice, while there is one. */
  clearable?: boolean | undefined;
  "aria-label"?: string | undefined;
  "aria-describedby"?: string | undefined;
  /** Layout only, on the field's root. */
  className?: string | undefined;
};

const keepFocus = (event: MouseEvent) => event.preventDefault();

/** The text for a status key (`cbx-status-1`); the phases of an async search arrive with `search`. */
function statusText(
  key: StatusKey,
  m: Messages,
  emptyText: string | undefined,
  query: string,
  count: number,
): string {
  switch (key) {
    case "emptyText":
      return emptyText ?? m.select.empty;
    case "combobox.prompt":
      return m.combobox.prompt;
    case "combobox.empty":
      return fill(m.combobox.empty, { query: query.trim() });
    case "combobox.countOne":
      return m.combobox.countOne;
    case "combobox.count":
      return fill(m.combobox.count, { count });
    default:
      return "";
  }
}

/**
 * Pick one of a long list by typing to filter it (catalog `base/combobox`, DESIGN.md §6). The
 * editable kind with list autocomplete and manual selection: DOM focus stays in the input, no
 * option is active until a key or the pointer says so, and the typed text is never the value.
 * The popup is Radix Popover (positioning, portal, Escape), the keys and attributes are ours;
 * the filter is a rule-based substring match, not a semantic search.
 */
export function Combobox({
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
  clearable = false,
  className,
  ...aria
}: ComboboxProps) {
  const m = useMessages();
  const field = useFieldControl({ id, disabled }, invalid);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [own, setOwn] = useState<ComboboxOption | null>(defaultValue ?? null);
  const current = value === undefined ? own : value;
  /** What the person typed; `null` shows the chosen label. */
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? "";

  const visibleGroups = groups ? filterGroups(groups, query) : undefined;
  const visible = visibleGroups
    ? visibleGroups.flatMap((group) => group.options)
    : filterOptions(options ?? [], query);

  const commit = (option: ComboboxOption | null) => {
    if (value === undefined) setOwn(option);
    setDraft(null);
    onValueChange?.(option);
  };
  const list = useComboboxList({ options: visible, onChoose: commit });

  const count = visible.length;
  const listboxShown = list.open && count > 0;
  const key = statusKey({ open: list.open, async: false, phase: "idle", query, count });
  const text = statusText(key, m, emptyText, query, count);

  const revert = () => {
    setDraft(null);
    list.setOpen(false);
  };
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
    list.clearActive();
    list.openList();
  };
  const clear = () => {
    commit(null);
    list.setOpen(false);
    inputRef.current?.focus();
  };
  const toggle = () => {
    inputRef.current?.focus();
    list.setOpen(!list.open);
  };

  const renderOption = (option: ComboboxOption, at: number): ReactNode => (
    <OptionRow
      key={option.value}
      option={option}
      id={list.optionId(at)}
      active={list.index === at}
      chosen={current?.value === option.value}
      onPointerMove={(event) => list.onOptionPointerMove(option, event)}
      onChoose={() => list.choose(option)}
    />
  );
  let start = 0;

  return (
    <PopoverPrimitive.Root
      open={list.open}
      onOpenChange={(next) => {
        if (!next) list.setOpen(false);
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div ref={rootRef} className={cx("ds-combobox", className)}>
          <InputGroup
            ref={inputRef}
            size={size}
            invalid={invalid}
            id={id}
            disabled={disabled}
            aria-describedby={aria["aria-describedby"]}
            aria-label={aria["aria-label"]}
            aria-required={required || undefined}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={listboxShown}
            aria-controls={listboxShown ? list.listId : undefined}
            aria-activedescendant={listboxShown ? list.activeId : undefined}
            autoComplete="off"
            placeholder={placeholder ?? m.combobox.prompt}
            value={draft ?? current?.label ?? ""}
            onChange={onChange}
            onKeyDown={list.onKeyDown}
            onBlur={revert}
            {...list.compositionProps}
            end={
              <>
                {clearable && current && !field.disabled ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    aria-label={m.combobox.clear}
                    onClick={clear}
                  >
                    <CloseIcon className="size-4" />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  tabIndex={-1}
                  aria-label={list.open ? m.combobox.close : m.combobox.open}
                  disabled={field.disabled}
                  onMouseDown={keepFocus}
                  onClick={toggle}
                >
                  <ChevronDownIcon className="size-5" />
                </Button>
              </>
            }
          />
          {name && current ? <input type="hidden" name={name} value={current.value} /> : null}
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {text}
          </p>
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PortalScope>
          <PopoverPrimitive.Content
            className="ds-menu ds-combobox__popup"
            side="bottom"
            align="start"
            sideOffset={4}
            // A list never touches the screen edge: Radix lets it end a fraction of a pixel past it.
            collisionPadding={8}
            // Focus stays in the input and the popup is not a dialog (cbx-base-1).
            role="presentation"
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (event.target instanceof Node && rootRef.current?.contains(event.target)) {
                event.preventDefault();
              }
            }}
            onMouseDown={keepFocus}
          >
            {listboxShown ? (
              <ScrollAreaPrimitive.Root type="auto" className="ds-combobox__scroll">
                <ScrollAreaPrimitive.Viewport
                  role="listbox"
                  id={list.listId}
                  aria-label={m.combobox.list}
                  className="ds-combobox__list"
                >
                  {visibleGroups
                    ? visibleGroups.map((group, groupIndex) => {
                        const first = start;
                        start += group.options.length;
                        const headingId = `${list.listId}-g${groupIndex}`;
                        return (
                          <Fragment key={`${groupIndex}:${group.label}`}>
                            {groupIndex > 0 ? (
                              <div className="ds-menu__separator" aria-hidden="true" />
                            ) : null}
                            <div role="group" aria-labelledby={headingId}>
                              <div className="ds-menu__label" id={headingId}>
                                {group.label}
                              </div>
                              {group.options.map((option, k) => renderOption(option, first + k))}
                            </div>
                          </Fragment>
                        );
                      })
                    : visible.map((option, at) => renderOption(option, at))}
                </ScrollAreaPrimitive.Viewport>
                <ScrollAreaPrimitive.Scrollbar className="ds-scroll__bar" orientation="vertical">
                  <ScrollAreaPrimitive.Thumb className="ds-scroll__thumb" />
                </ScrollAreaPrimitive.Scrollbar>
              </ScrollAreaPrimitive.Root>
            ) : null}
            {count === 0 ? (
              <div className="ds-menu__empty">
                <span>{text}</span>
              </div>
            ) : null}
          </PopoverPrimitive.Content>
        </PortalScope>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

interface OptionRowProps {
  option: ComboboxOption;
  id: string;
  active: boolean;
  chosen: boolean;
  onPointerMove: (event: PointerEvent) => void;
  onChoose: () => void;
}

/** One option, marked up as `Select`'s are so the same recipe classes draw it. A chosen option shows a check. */
function OptionRow({ option, id, active, chosen, onPointerMove, onChoose }: OptionRowProps) {
  const { icon, description } = option;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const text = icon ? (
    <span>
      <span className="ds-menu__option-line">
        <span className="ds-menu__option-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="ds-menu__option-label" id={labelId}>
          {option.label}
        </span>
      </span>
    </span>
  ) : (
    <span id={labelId}>{option.label}</span>
  );
  return (
    <div
      role="option"
      id={id}
      className="ds-menu__option"
      aria-selected={chosen}
      aria-disabled={option.disabled ? true : undefined}
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      data-highlighted={active ? "" : undefined}
      data-state={chosen ? "checked" : undefined}
      data-disabled={option.disabled ? "" : undefined}
      data-described={description ? "" : undefined}
      data-icon={icon ? "" : undefined}
      onPointerMove={onPointerMove}
      onMouseDown={keepFocus}
      onClick={onChoose}
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
      {chosen ? <CheckIcon className="size-4 shrink-0" /> : null}
    </div>
  );
}
