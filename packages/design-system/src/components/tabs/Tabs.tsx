"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/** Counts above this show as "999+" with the full number in `title`. */
const COUNT_CAP = 999;

export type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

/**
 * Sections of one object the user switches between (DESIGN.md §6). Radix Tabs: arrow keys move
 * between tabs, the panel is labelled by its tab. The selected tab shows `selection.fg` ink and a
 * 2 px edge, distinct from the focus ring: under the tab in a row, on the side facing the panel
 * with `orientation="vertical"` (Up and Down move, Left and Right do not).
 */
export function Tabs({ className, ...rest }: TabsProps) {
  return <TabsPrimitive.Root {...rest} className={cx("ds-tabs", className)} />;
}

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  size?: "sm" | "md" | undefined;
}

export function TabsList({ size = "md", className, ...rest }: TabsListProps) {
  return (
    <TabsPrimitive.List {...rest} className={cx("ds-tabs__list", className)} data-size={size} />
  );
}

export interface TabsTriggerProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** An icon before the label, hidden from assistive tech; 14 px in a small list, 16 px otherwise. */
  icon?: ReactNode | undefined;
  /**
   * A number the caller passes, shown after the label and read with the tab ("Decisions 12").
   * 0 shows; leave it out to show none. Above 999 it shows "999+" with the full number in `title`.
   * A value that is not a whole number of 0 or more is ignored, never corrected.
   */
  count?: number | undefined;
}

export function TabsTrigger({ icon, count, className, children, ...rest }: TabsTriggerProps) {
  const hasCount = count !== undefined && Number.isInteger(count) && count >= 0;
  const shown = hasCount ? (count > COUNT_CAP ? `${COUNT_CAP}+` : String(count)) : undefined;
  return (
    <TabsPrimitive.Trigger
      {...rest}

      className={cx("ds-tabs__trigger", className)}
    >
      {icon ? (
        <span className="ds-tabs__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {hasCount ? (
        <span
          className="ds-tabs__count"
          title={count > COUNT_CAP ? String(count) : undefined}
          data-count=""
        >
          {shown}
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export function TabsContent({ className, ...rest }: TabsContentProps) {
  return <TabsPrimitive.Content {...rest} className={cx("ds-tabs__panel", className)} />;
}
