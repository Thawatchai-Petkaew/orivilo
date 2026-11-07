import type { ReactNode } from "react";
import { cx } from "../cx";
import { FeaturedIcon, type FeaturedIconGlyph } from "../featured-icon/FeaturedIcon";

export interface EmptyStateProps {
  /** What is missing, in the caller's words and language. */
  title: string;
  /** The heading level of the title, 2 to 6: only the caller knows how deep the region sits. */
  level: 2 | 3 | 4 | 5 | 6;
  /** One line on why, or what the person can do. */
  description?: string | undefined;
  /** The caller's own Button, one at most, that names its outcome. Pass none for a read-only person. */
  action?: ReactNode;
  /** A glyph from `icons.tsx`, drawn on a neutral `FeaturedIcon` tile at the tile size of `size`. */
  icon?: FeaturedIconGlyph | undefined;
  /** `md` is a centred column for a board or a page; `sm` starts at the line's start, for a bar. */
  size?: "sm" | "md" | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A region with nothing in it (catalog `application/empty-state`): an optional tile, a title over
 * a description and the caller's action. It sets no role, never takes focus and never speaks: a
 * region that turns empty says so through a status container it owns and mounted earlier. The
 * words come from the caller, so there is no fixed text in any language.
 */
export function EmptyState({
  title,
  level,
  description,
  action,
  icon,
  size = "md",
  className,
}: EmptyStateProps) {
  const Title = `h${level}` as const;
  return (
    <div className={cx("ds-empty-state", className)} data-size={size}>
      {icon ? <FeaturedIcon variant="neutral" icon={icon} size={size} /> : null}
      <div className="ds-empty-state__body">
        <div className="ds-empty-state__text">
          <Title className="ds-empty-state__title">{title}</Title>
          {description ? <p className="ds-empty-state__description">{description}</p> : null}
        </div>
        {action ? <div className="ds-empty-state__action">{action}</div> : null}
      </div>
    </div>
  );
}
