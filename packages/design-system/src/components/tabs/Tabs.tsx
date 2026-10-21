"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../cx";

export type TabsProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

/**
 * Sections of one object the user switches between (DESIGN.md §6). Radix Tabs: arrow keys move
 * between tabs, the panel is labelled by its tab. The selected tab shows `selection.fg` ink and a
 * 2 px edge under it, distinct from the focus ring.
 */
export function Tabs({ className, ...rest }: TabsProps) {
  return <TabsPrimitive.Root {...rest} className={cx("flex flex-col", className)} />;
}

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  size?: "sm" | "md" | undefined;
}

export function TabsList({ size = "md", className, ...rest }: TabsListProps) {
  return (
    <TabsPrimitive.List {...rest} className={cx("ds-tabs__list", className)} data-size={size} />
  );
}

export type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

export function TabsTrigger({ className, ...rest }: TabsTriggerProps) {
  return <TabsPrimitive.Trigger {...rest} className={cx("ds-tabs__trigger", className)} />;
}

export type TabsContentProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export function TabsContent({ className, ...rest }: TabsContentProps) {
  return <TabsPrimitive.Content {...rest} className={cx("ds-tabs__panel", className)} />;
}
