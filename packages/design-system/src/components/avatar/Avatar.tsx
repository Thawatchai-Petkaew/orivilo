"use client";

import { Avatar as AvatarPrimitive } from "radix-ui";
import { useMessages } from "../../i18n/LocaleProvider";
import { cx } from "../cx";
import { PersonIcon } from "../icons";
import { initialsOf } from "./initials";

export type AvatarSize = "sm" | "md";

export interface AvatarProps {
  /**
   * The person's name as the caller may show it. It makes the initials and, in the named form,
   * the accessible name.
   */
  name?: string | undefined;
  /** The picture URL. `null` passes through because a stored user image is nullable. */
  src?: string | null | undefined;
  /** The disc at 32 or 40 px (`size.control.sm`, `.md`). */
  size?: AvatarSize | undefined;
  /**
   * Hidden from assistive technology, for a disc beside the visible name or inside a control that
   * names itself. The default named form carries the name as an accessible label.
   */
  decorative?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
}

/**
 * A person's disc (catalog `base/avatar`): the picture once it has loaded, else the initials of
 * `name` (rule-based), else a person glyph. The name sits on the root, so it survives a failed
 * picture. No status, no tick and no count: the repo holds no data for them.
 */
export function Avatar({ name, src, size = "md", decorative = false, className }: AvatarProps) {
  const m = useMessages();
  const initials = name ? initialsOf(name) : "";
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": name?.trim() || m.avatar.noName } as const);
  return (
    <AvatarPrimitive.Root className={cx("ds-avatar", className)} data-size={size} {...a11y}>
      <AvatarPrimitive.Image className="ds-avatar__image" src={src ?? undefined} alt="" />
      <AvatarPrimitive.Fallback className="ds-avatar__fallback">
        {initials ? <span className="ds-avatar__initials">{initials}</span> : <PersonIcon />}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
