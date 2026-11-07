import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Badge } from "../badge/Badge";
import type { CurrentMark } from "./current";

/** One link of a navigation (`nav-item-1`). */
export interface NavLinkItem {
  /** The caller's text; the caller takes it from the locale catalog. */
  label: string;
  href: string;
  /** A 16 px glyph before the label. A missing icon renders no node. */
  icon?: ReactNode | undefined;
  /** A short string from the caller's data, shown as a small badge after the label. Never made up here. */
  badge?: string | undefined;
  /** `true` marks the item when the path does not, `false` never marks it (`nav-current-1`). */
  current?: boolean | undefined;
}

/** What a navigation renders each link with: a tag or a router's link, taking an `href`. */
export type NavLinkComponent = ElementType<ComponentPropsWithoutRef<"a"> & { href: string }>;

export interface NavItemProps {
  item: NavLinkItem;
  mark: CurrentMark | null;
  /** `sm` is the one-line pill of Top navigation; `md` is the wrapping drawer row. */
  size: "sm" | "md";
  linkComponent?: NavLinkComponent | undefined;
  /** Runs on a press of the link, before the router's own. */
  onNavigate?: (() => void) | undefined;
}

/**
 * The link row of Top navigation and its drawer (internal: not in the public index, so it has no
 * catalog entry; its states show in the stories of its parents). A marked row has `aria-current`
 * and a bead, and the bead is drawn only then. Colours, focus and sizes come from the `ds-nav-item`
 * recipe.
 */
export function NavItem({ item, mark, size, linkComponent: Link = "a", onNavigate }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className="ds-nav-item"
      data-size={size}
      aria-current={mark ?? undefined}
      onClick={onNavigate}
    >
      {mark ? <span className="ds-nav-item__bead" aria-hidden="true" /> : null}
      {item.icon ? (
        <span className="ds-nav-item__icon" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span className="ds-nav-item__label">{item.label}</span>
      {item.badge ? (
        <span className="ds-nav-item__badge">
          <Badge size="sm">{item.badge}</Badge>
        </span>
      ) : null}
    </Link>
  );
}
