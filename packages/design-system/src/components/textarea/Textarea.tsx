"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type InputEvent,
} from "react";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";

export interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  size?: "md" | "lg" | undefined;
  invalid?: boolean | undefined;
  /** Rows shown before any content; the control never shrinks below them. */
  rows?: number | undefined;
  /** Rows the control grows to before it scrolls. */
  maxRows?: number | undefined;
}

function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Height for `rows` lines of this textarea, from its computed line height, padding and border. */
function rowsHeight(el: HTMLTextAreaElement, rows: number): number {
  const s = getComputedStyle(el);
  const line = px(s.lineHeight) || px(s.fontSize) * 1.5;
  return (
    rows * line +
    px(s.paddingTop) +
    px(s.paddingBottom) +
    px(s.borderTopWidth) +
    px(s.borderBottomWidth)
  );
}

/**
 * Multi-line text that grows with its content from `rows` up to `maxRows`, then scrolls
 * (catalog rule). Measured in script so it behaves the same in every browser; the recipe
 * disables manual resize because the bound is the contract.
 */
export function Textarea({
  size = "md",
  invalid,
  rows = 3,
  maxRows = 8,
  className,
  onInput,
  value,
  defaultValue,
  ...rest
}: TextareaProps) {
  const field = useFieldControl(rest, invalid);
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const min = rowsHeight(el, rows);
    const max = rowsHeight(el, Math.max(rows, maxRows));
    el.style.height = "auto";
    const wanted = Math.max(min, el.scrollHeight);
    el.style.height = `${Math.min(wanted, max)}px`;
    el.style.overflowY = wanted > max ? "auto" : "hidden";
  }, [rows, maxRows]);

  // Controlled value changes and font loading change the needed height without an input event.
  useLayoutEffect(() => {
    fit();
    if (typeof document === "undefined" || !("fonts" in document)) return;
    document.fonts.ready.then(fit, () => undefined);
  }, [fit, value]);

  const handleInput = (event: InputEvent<HTMLTextAreaElement>) => {
    fit();
    onInput?.(event);
  };

  return (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      id={field.id}
      disabled={field.disabled}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-required={field.required || rest["aria-required"] || undefined}
      className={cx("ds-control", className)}
      data-size={size}
      data-multiline=""
      onInput={handleInput}
    />
  );
}
