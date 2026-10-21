"use client";

import {
  createContext,
  createElement,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cx } from "../cx";

export type CardStaticTag = "div" | "article" | "section" | "li";

export interface CardStaticProps extends ComponentPropsWithoutRef<"div"> {
  /** The element; `div` by default, `li` inside a list, `article` for a self-contained unit. */
  as?: CardStaticTag | undefined;
  interactive?: false | undefined;
  href?: undefined;
  /** Shows `surface.selected` and a `selection.fg` edge; the consumer labels what it means. */
  selected?: boolean | undefined;
}

export interface CardButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "type"> {
  /** The whole card is one button; it must contain no other control (catalog rule). */
  interactive: true;
  href?: undefined;
  as?: undefined;
  /** Rendered as `aria-pressed`. */
  selected?: boolean | undefined;
}

export interface CardLinkProps extends ComponentPropsWithoutRef<"a"> {
  /** The whole card is one link; it must contain no other control (catalog rule). */
  interactive: true;
  href: string;
  as?: undefined;
  /** Rendered as `aria-current="true"`. */
  selected?: boolean | undefined;
}

export type CardProps = CardStaticProps | CardButtonProps | CardLinkProps;

const CardContext = createContext<{ interactive: boolean }>({ interactive: false });

const OWN_KEYS = ["as", "interactive", "selected", "className"] as const;

/** The element's own props: everything the card does not consume itself. */
function elementProps(props: CardProps, drop: readonly string[] = OWN_KEYS) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !drop.includes(key)));
}

/**
 * A self-contained unit the user acts on or compares with its siblings (DESIGN.md §6). On the
 * light canvas a card has no edge (`border.card` is transparent); in dark mode the same token marks
 * it. Hover on an interactive card shows an edge, never a tint alone; selected shows
 * `surface.selected` and a `selection.fg` edge, distinct from the focus ring.
 */
export function Card(props: CardProps) {
  const selected = props.selected ?? false;
  const className = cx("ds-card", props.className);
  if (props.interactive && typeof props.href === "string") {
    return (
      <CardContext.Provider value={{ interactive: true }}>
        <a
          {...(elementProps(props) as ComponentPropsWithoutRef<"a">)}
          className={className}
          data-interactive=""
          data-selected={selected ? "" : undefined}
          aria-current={selected ? "true" : undefined}
        />
      </CardContext.Provider>
    );
  }
  if (props.interactive) {
    return (
      <CardContext.Provider value={{ interactive: true }}>
        <button
          {...(elementProps(props, [...OWN_KEYS, "href"]) as ComponentPropsWithoutRef<"button">)}
          type="button"
          className={className}
          data-interactive=""
          data-selected={selected ? "" : undefined}
          aria-pressed={selected}
        />
      </CardContext.Provider>
    );
  }
  // `createElement` because a union of tag names does not type-check as a JSX element under
  // exactOptionalPropertyTypes.
  return (
    <CardContext.Provider value={{ interactive: false }}>
      {createElement(props.as ?? "div", {
        ...elementProps(props, [...OWN_KEYS, "href"]),
        className,
        ...(selected ? { "data-selected": "" } : {}),
      })}
    </CardContext.Provider>
  );
}

export type CardTitleTag = "h2" | "h3" | "h4" | "p" | "span";

export interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {
  /** Heading level from the page outline; `h3` by default. Inside an interactive card it is a `span`, because a heading cannot sit inside a button or link. */
  as?: CardTitleTag | undefined;
}

export function CardTitle({ as, className, ...rest }: CardTitleProps) {
  const { interactive } = useContext(CardContext);
  const Tag = as ?? (interactive ? "span" : "h3");
  return <Tag {...rest} className={cx("ds-card__title", className)} />;
}

export interface CardValueProps extends ComponentPropsWithoutRef<"p"> {
  /** Digits, a unit and a sign only; the numeral tracking is never applied to Thai text (DESIGN.md §3.3). */
  children: ReactNode;
}

/** The big figure of a bento tile: body face at weight 600, tight tracking on digits. */
export function CardValue({ className, ...rest }: CardValueProps) {
  const { interactive } = useContext(CardContext);
  const Tag = interactive ? "span" : "p";
  return <Tag {...rest} className={cx("ds-card__value", className)} />;
}

/** Actions or meta at the bottom of a static card; never inside an interactive card. */
export function CardFooter({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div {...rest} className={cx("ds-card__footer", className)} />;
}
