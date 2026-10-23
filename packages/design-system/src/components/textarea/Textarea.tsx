"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type InputEvent,
} from "react";
import { formatNumber } from "../../i18n/format";
import { LOCALE_TAGS } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { cx } from "../cx";
import { useFieldControl } from "../field/Field";
import { countGraphemes } from "./graphemes";

export interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  size?: "sm" | "md" | "lg" | undefined;
  invalid?: boolean | undefined;
  /** Rows shown before any content; the control never shrinks below them. */
  rows?: number | undefined;
  /** Rows the control grows to before it scrolls. */
  maxRows?: number | undefined;
  /**
   * A soft limit in graphemes, not UTF-16 units (ORV-72): typing past it is allowed and shown as
   * invalid; the native `maxlength` is never set, because it cuts Thai mid-cluster. Shows the counter.
   */
  maxLength?: number | undefined;
  /**
   * Shows the grapheme counter under the box, with or without `maxLength`. With a counter the
   * textarea sits in a full-width column wrapper; `className` stays on the textarea itself.
   */
  showCount?: boolean | undefined;
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
  maxLength,
  showCount = false,
  className,
  onInput,
  value,
  defaultValue,
  ...rest
}: TextareaProps) {
  const field = useFieldControl(rest, invalid);
  const ref = useRef<HTMLTextAreaElement>(null);
  const m = useMessages();
  const locale = useLocale();
  const counterId = useId();
  const counted = showCount || maxLength !== undefined;
  const [ownText, setOwnText] = useState(() => String(defaultValue ?? ""));
  const text = value !== undefined ? String(value) : ownText;
  const count = counted ? countGraphemes(text, LOCALE_TAGS[locale]) : 0;
  const over = maxLength !== undefined && count > maxLength ? count - maxLength : 0;
  const isInvalid = field.invalid || over > 0;

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
    if (counted && value === undefined) setOwnText(event.currentTarget.value);
    onInput?.(event);
  };

  const describedBy = counted
    ? [field.describedBy, counterId].filter(Boolean).join(" ")
    : field.describedBy;

  const control = (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      id={field.id}
      disabled={field.disabled}
      aria-describedby={describedBy}
      aria-invalid={isInvalid || undefined}
      aria-required={field.required || rest["aria-required"] || undefined}
      className={cx("ds-control", className)}
      data-size={size}
      data-multiline=""
      onInput={handleInput}
    />
  );
  if (!counted) return control;

  const n = (x: number) => formatNumber(x, locale);
  const shown =
    maxLength === undefined
      ? n(count)
      : fill(m.textarea.ratio, { count: n(count), max: n(maxLength) });
  const spoken =
    maxLength === undefined
      ? fill(m.textarea.count, { count: n(count) })
      : over > 0
        ? fill(m.textarea.countOver, { count: n(count), max: n(maxLength), over: n(over) })
        : fill(m.textarea.countOf, { count: n(count), max: n(maxLength) });

  return (
    <div className="ds-textarea">
      {control}
      <p className="ds-textarea__counter" id={counterId} data-over={over > 0 ? "" : undefined}>
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{spoken}</span>
      </p>
    </div>
  );
}
