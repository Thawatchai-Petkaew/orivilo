import type { ReactNode } from "react";
import { cx } from "../cx";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface PageHeaderProps {
  /** The page's name, set as a heading. Required. */
  title: ReactNode;
  /** One line of secondary text under the title. */
  description?: ReactNode | undefined;
  /** A row under the description for labels, such as a sample-data badge and its sentence. */
  meta?: ReactNode | undefined;
  /** Buttons at the end of the row; under 480 px they sit under the title on the same start edge. */
  actions?: ReactNode | undefined;
  /**
   * The heading element, 1 to 6, default 1. It changes the element only, never the size. The
   * caller picks it so a page keeps one `h1` and no skipped level (`heading-level-1`).
   */
  level?: HeadingLevel | undefined;
  /** Layout only. */
  className?: string | undefined;
}

const HEADINGS = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

/**
 * The opening of a page: its title, a line of description, a row of labels and the page's
 * actions (catalog `application/page-header`). The root is a `div`, never a `header`: outside
 * `main`, `article`, `aside`, `nav` and `section` a `header` is a banner, and the part may sit
 * anywhere (`page-header-root-1`). A missing slot renders no node.
 */
export function PageHeader({
  title,
  description,
  meta,
  actions,
  level = 1,
  className,
}: PageHeaderProps) {
  const Heading = HEADINGS[level];
  return (
    <div className={cx("ds-page-header", className)}>
      <div className="ds-page-header__row">
        <div className="ds-page-header__text">
          <Heading className="ds-page-header__title">{title}</Heading>
          {description ? <p className="ds-page-header__description">{description}</p> : null}
          {meta ? <div className="ds-page-header__meta">{meta}</div> : null}
        </div>
        {actions ? <div className="ds-page-header__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
