"use client";

import { ToggleGroup as Primitive } from "radix-ui";
import type { ReactNode } from "react";
import type { ControlSize } from "../button/Button";
import { cx } from "../cx";

interface ToggleGroupBase {
  size?: Exclude<ControlSize, "lg"> | undefined;
  disabled?: boolean | undefined;
  /** Names the group; required because its items are usually icons. */
  "aria-label": string;
  className?: string | undefined;
  children: ReactNode;
}

export type ToggleGroupProps = ToggleGroupBase &
  (
    | {
        type: "single";
        value?: string | undefined;
        defaultValue?: string | undefined;
        onValueChange?: ((value: string) => void) | undefined;
      }
    | {
        type: "multiple";
        value?: string[] | undefined;
        defaultValue?: string[] | undefined;
        onValueChange?: ((value: string[]) => void) | undefined;
      }
  );

/**
 * One of a few modes (single) or any of a few switches (multiple): pan or select, grid on or
 * off. Radix gives roving tabindex and the pressed semantics; the pressed item takes the
 * selection tokens and a border change, never a tint alone (catalog rule).
 */
export function ToggleGroup({ size = "md", className, children, ...rest }: ToggleGroupProps) {
  return (
    <Primitive.Root {...rest} className={cx("ds-toggle", className)} data-size={size}>
      {children}
    </Primitive.Root>
  );
}

export interface ToggleGroupItemProps {
  value: string;
  disabled?: boolean | undefined;
  /** Required for an icon-only item. */
  "aria-label"?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function ToggleGroupItem({ className, ...rest }: ToggleGroupItemProps) {
  return <Primitive.Item {...rest} className={cx("ds-toggle__item", className)} />;
}
