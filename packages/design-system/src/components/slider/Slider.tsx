"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import { useId, useState, type ReactNode } from "react";
import { cx } from "../cx";

export interface SliderProps {
  /** Visible label; it names the thumb. */
  label: ReactNode;
  value?: number | undefined;
  defaultValue?: number | undefined;
  onValueChange?: ((value: number) => void) | undefined;
  /** Fires once when the user lets go, for work too costly to run on every step. */
  onValueCommit?: ((value: number) => void) | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  /** How the value reads, shown beside the track and announced as `aria-valuetext`. */
  format?: ((value: number) => string) | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * A bounded number with an immediate visible effect: density, strength, zoom (catalog
 * `base/slider`). Radix Slider gives the keyboard model: arrows step, Page keys step by ten, Home
 * and End jump to the bounds. The current value always shows as text beside the track, so the
 * thumb's position is never the only way to read it.
 */
export function Slider({
  label,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  disabled = false,
  name,
  id: ownId,
  className,
}: SliderProps) {
  const generated = useId();
  const id = ownId ?? generated;
  const labelId = `${id}-label`;
  const [own, setOwn] = useState(defaultValue ?? min);
  const current = value ?? own;
  const text = format(current);
  return (
    <div className={cx("ds-slider", className)} data-disabled={disabled ? "" : undefined}>
      <div className="ds-slider__header">
        <span id={labelId} className="ds-slider__label">
          {label}
        </span>
        <output className="ds-slider__value" htmlFor={id} aria-hidden>
          {text}
        </output>
      </div>
      <SliderPrimitive.Root
        className="ds-slider__root"
        value={[current]}
        onValueChange={([next]) => {
          if (next === undefined) return;
          if (value === undefined) setOwn(next);
          onValueChange?.(next);
        }}
        onValueCommit={([next]) => {
          if (next !== undefined) onValueCommit?.(next);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        name={name}
      >
        <SliderPrimitive.Track className="ds-slider__track">
          <SliderPrimitive.Range className="ds-slider__range" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          id={id}
          className="ds-slider__thumb"
          aria-labelledby={labelId}
          aria-valuetext={text}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
