import { Children, type ReactNode } from "react";
import { cx } from "../cx";
import type { HeadingLevel } from "../page-header/PageHeader";

export interface SectionHeaderProps {
  /** The block's name, set as a heading. Required. */
  title: ReactNode;
  /** One line of secondary text under the title. */
  description?: ReactNode | undefined;
  /** Buttons at the end of the row; under 480 px they sit under the title on the same start edge. */
  actions?: ReactNode | undefined;
  /**
   * The heading element, 2 to 6, default 2. It changes the element only, never the size. The
   * caller picks it so a page keeps no skipped level (`heading-level-1`).
   */
  level?: Exclude<HeadingLevel, 1> | undefined;
  /** Goes on the heading, so the caller's region can name itself with `aria-labelledby`. */
  id?: string | undefined;
  /**
   * Draws one line under the block. It does not draw when `children` render, because Tabs draws its
   * own line and an edge takes one line.
   */
  divider?: boolean | undefined;
  /** Rendered after the title row as a following sibling, the place for `Tabs`. */
  children?: ReactNode | undefined;
  /** Layout only. */
  className?: string | undefined;
}

const HEADINGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

/**
 * The title of one block of a screen: a heading, a line of description, the block's actions and,
 * optionally, a line under it (catalog `application/section-header`). The root is a `div`, so the
 * caller decides which landmark or region the block belongs to. A missing slot renders no node.
 */
export function SectionHeader({
  title,
  description,
  actions,
  level = 2,
  id,
  divider = false,
  children,
  className,
}: SectionHeaderProps) {
  const Heading = HEADINGS[level];
  const hasChildren = Children.toArray(children).length > 0;
  return (
    <div
      className={cx("ds-section-header", className)}
      data-divider={divider && !hasChildren ? "" : undefined}
    >
      <div className="ds-section-header__row">
        <div className="ds-section-header__text">
          <Heading id={id} className="ds-section-header__title">
            {title}
          </Heading>
          {description ? <p className="ds-section-header__description">{description}</p> : null}
        </div>
        {actions ? <div className="ds-section-header__actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
