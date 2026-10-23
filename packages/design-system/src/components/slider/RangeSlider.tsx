"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { cx } from "../cx";
import { jumpRange } from "./range";

export type SliderRange = readonly [number, number];

export interface RangeSliderProps {
  /** Visible label; with "lower" and "upper" from the locale catalog it names each thumb. */
  label: ReactNode;
  value?: SliderRange | undefined;
  defaultValue?: SliderRange | undefined;
  onValueChange?: ((value: [number, number]) => void) | undefined;
  /** Fires once when the user lets go, for work too costly to run on every step. */
  onValueCommit?: ((value: [number, number]) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  /** Steps (not units) the thumbs keep between them; 0 lets them meet, never cross. */
  minGap?: number | undefined;
  /** How each value reads, in the text beside the label and as each thumb's `aria-valuetext`. */
  format?: ((value: number) => string) | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * A lower and an upper bound on one track (ORV-77, catalog `base/range-slider`). It shares the
 * `ds-slider` recipe with `Slider`. The thumbs meet but never cross; `minGap` keeps them
 * apart. Both values always show as text, never only as thumb position.
 */
export function RangeSlider({
  label,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  format = String,
  disabled = false,
  name,
  id: ownId,
  className,
}: RangeSliderProps) {
  const m = useMessages();
  const generated = useId();
  const id = ownId ?? generated;
  const labelId = `${id}-label`;
  const lowerId = `${id}-lower`;
  const upperId = `${id}-upper`;
  const [own, setOwn] = useState<SliderRange>(defaultValue ?? [min, max]);
  const [low, high] = value ?? own;
  const set = (next: readonly [number, number]) => {
    if (value === undefined) setOwn(next);
    onValueChange?.([next[0], next[1]]);
    onValueCommit?.([next[0], next[1]]);
  };
  // Radix keeps the thumb order and the gap for arrows, Page keys and pointer drags
  // (`preserveThumbOrder`). It sends Home to the first thumb and End to the last whatever has
  // focus, so each thumb handles those two keys itself.
  const jump = (thumb: 0 | 1) => (event: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || (event.key !== "Home" && event.key !== "End")) return;
    event.preventDefault();
    event.stopPropagation();
    const next = jumpRange([low, high], thumb, event.key === "Home" ? "home" : "end", {
      min,
      max,
      step,
      minGap,
    });
    if (next[0] !== low || next[1] !== high) set(next);
  };
  const pair = (next: number[]): [number, number] | undefined => {
    const [a, b] = next;
    return a === undefined || b === undefined ? undefined : [a, b];
  };
  return (
    <div className={cx("ds-slider", className)} data-disabled={disabled ? "" : undefined}>
      <div className="ds-slider__header">
        <span id={labelId} className="ds-slider__label">
          {label}
        </span>
        <output className="ds-slider__value" htmlFor={`${id} ${id}-high`} aria-hidden>
          {fill(m.slider.range, { min: format(low), max: format(high) })}
        </output>
      </div>
      <span id={lowerId} hidden>
        {m.slider.lower}
      </span>
      <span id={upperId} hidden>
        {m.slider.upper}
      </span>
      <SliderPrimitive.Root
        className="ds-slider__root"
        value={[low, high]}
        onValueChange={(next) => {
          const p = pair(next);
          if (!p) return;
          if (value === undefined) setOwn(p);
          onValueChange?.([p[0], p[1]]);
        }}
        onValueCommit={(next) => {
          const p = pair(next);
          if (p) onValueCommit?.([p[0], p[1]]);
        }}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={minGap}
        preserveThumbOrder
        disabled={disabled}
        name={name}
      >
        <SliderPrimitive.Track className="ds-slider__track">
          <SliderPrimitive.Range className="ds-slider__range" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          id={id}
          className="ds-slider__thumb"
          onKeyDown={jump(0)}
          aria-labelledby={`${lowerId} ${labelId}`}
          aria-valuetext={format(low)}
        />
        <SliderPrimitive.Thumb
          id={`${id}-high`}
          className="ds-slider__thumb"
          onKeyDown={jump(1)}
          aria-labelledby={`${upperId} ${labelId}`}
          aria-valuetext={format(high)}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
