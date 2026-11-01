"use client";

import type { ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";

export type SkeletonShape = "text" | "block" | "circle";

export interface SkeletonProps {
  /**
   * `text` is one line of body text, `block` a media area, `circle` an avatar. The caller sets the
   * width (all shapes) and the height (`block`; `circle` keeps a 1 to 1 aspect) with layout utilities.
   */
  shape?: SkeletonShape | undefined;
  /** Layout only: width and height. */
  className?: string | undefined;
}

/**
 * A static placeholder shape (catalog `base/skeleton`). It is hidden from assistive technology
 * and never moves: the state is spoken by the `SkeletonGroup` status, and a page waiting for data
 * is not the engine at work, so it has no pulse.
 */
export function Skeleton({ shape = "text", className }: SkeletonProps) {
  return <span className={cx("ds-skeleton", className)} data-shape={shape} aria-hidden="true" />;
}

export interface SkeletonGroupProps {
  /** The shapes of one loading region. */
  children: ReactNode;
  /** The status text; the catalog's `skeleton.loading` by default. */
  label?: string | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * One loading region: `aria-busy` on the group and one visually hidden status for however many
 * shapes it holds. Replacing the group with the content is the caller's.
 */
export function SkeletonGroup({ children, label, className }: SkeletonGroupProps) {
  const m = useMessages();
  return (
    <div className={cx("ds-skeleton-group", className)} aria-busy="true">
      <span role="status" className="sr-only">
        {label ?? m.skeleton.loading}
      </span>
      {children}
    </div>
  );
}
