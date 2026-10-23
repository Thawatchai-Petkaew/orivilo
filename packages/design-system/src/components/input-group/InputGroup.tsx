"use client";

import { useId, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { isApplePlatform } from "../../commands/index";
import type { ControlSize } from "../button/Button";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { Kbd } from "../kbd/Kbd";

export interface InputGroupProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "size" | "prefix"
> {
  size?: ControlSize | undefined;
  /** Sets `aria-invalid` and the error edge on the whole group; the message comes from the Field. */
  invalid?: boolean | undefined;
  /**
   * Before the input. An icon element, a Button, or a string: a string is a text addon (a unit, a
   * protocol) that the input reads through `aria-describedby`.
   */
  start?: ReactNode | undefined;
  /** After the input; same kinds as `start`. */
  end?: ReactNode | undefined;
  /**
   * A shortcut as the command registry spells it (`Mod+K`). Shows a Kbd at the very end,
   * `aria-hidden`, and sets the input's `aria-keyshortcuts`.
   */
  shortcut?: string | undefined;
  /** The input element, for focus. */
  ref?: Ref<HTMLInputElement> | undefined;
  /** Class for the group; `className` of a plain input would land on the inner input instead. */
  groupClassName?: string | undefined;
}

/** A registry shortcut in the ARIA spelling: Mod is Control, or Meta on Apple. */
function ariaShortcut(shortcut: string, apple: boolean): string {
  return shortcut
    .split("+")
    .map((key) => (key === "Mod" ? (apple ? "Meta" : "Control") : key))
    .join("+");
}

/**
 * An input with slots (catalog `base/input-group`): one outline, one focus ring, one invalid and
 * one disabled state for the whole group. Inside a Field it takes the Field's id, description,
 * error and required wiring exactly as Input does. An addon never carries the error message.
 */
export function InputGroup({
  size = "md",
  invalid,
  start,
  end,
  shortcut,
  ref,
  className,
  groupClassName,
  ...rest
}: InputGroupProps) {
  const field = useFieldControl(rest, invalid);
  const own = useId();
  const startId = typeof start === "string" ? `${field.id ?? own}-start` : undefined;
  const endId = typeof end === "string" ? `${field.id ?? own}-end` : undefined;
  const describedBy = [field.describedBy, startId, endId].filter(Boolean).join(" ") || undefined;
  const slot = (name: "start" | "end", node: ReactNode, id: string | undefined) =>
    node ? (
      <span className="ds-input-group__slot" data-slot={name} id={id}>
        {node}
      </span>
    ) : null;
  const apple = isApplePlatform();
  return (
    <div
      className={cx("ds-input-group", groupClassName)}
      data-size={size}
      data-invalid={field.invalid ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
      // Disabled text is exempt from contrast (WCAG 1.4.3); this tells checkers about the addons too.
      aria-disabled={field.disabled || undefined}
    >
      {slot("start", start, startId)}
      <input
        {...rest}
        ref={ref}
        id={field.id}
        disabled={field.disabled}
        aria-describedby={describedBy}
        aria-invalid={field.invalid || undefined}
        aria-required={field.required || rest["aria-required"] || undefined}
        aria-keyshortcuts={shortcut ? ariaShortcut(shortcut, apple) : rest["aria-keyshortcuts"]}
        className={cx("ds-input-group__input", className)}
      />
      {slot("end", end, endId)}
      {shortcut ? (
        <span className="ds-input-group__slot" data-slot="shortcut" aria-hidden="true">
          <Kbd shortcut={shortcut} apple={apple} />
        </span>
      ) : null}
    </div>
  );
}
