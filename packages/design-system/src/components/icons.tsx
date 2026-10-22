import type { SVGProps } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Hand,
  History,
  Keyboard,
  LoaderCircle,
  Lock,
  LockOpen,
  Map as MapGlyph,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Search,
  Trash,
  TriangleAlert,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons, in the order DESIGN.md §6 sets (ORV-55): Lucide first, a glyph drawn here second,
 * a new drawing only when neither has one. Every icon is decorative: `aria-hidden` and
 * `currentColor`; the control that shows one carries the accessible name. Components import
 * icons from this file only, never from `lucide-react` directly (lint), so the defaults below
 * hold everywhere and only the named glyphs reach the bundle.
 *
 * All 22 glyphs are Lucide today. A glyph Lucide lacks is drawn here as inline SVG on a 20 grid,
 * stroke 2, round caps and joins, `currentColor`, `aria-hidden`.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

/**
 * Lucide draws on a 24 grid; ours used a 20 grid at stroke 2. Stroke 2.4 on 24 keeps the same
 * weight relative to the icon's size, so a 16 px icon still reads at about 1.6 px.
 */
const STROKE = 2.4;

function lucide(Glyph: LucideIcon, name: string) {
  function Icon(props: IconProps) {
    return <Glyph aria-hidden focusable={false} strokeWidth={STROKE} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

export const CheckIcon = lucide(Check, "CheckIcon");
export const MinusIcon = lucide(Minus, "MinusIcon");
export const ChevronDownIcon = lucide(ChevronDown, "ChevronDownIcon");
/** A three-quarter ring; the `ds-spin` recipe class turns it. */
export const SpinnerIcon = lucide(LoaderCircle, "SpinnerIcon");
export const CloseIcon = lucide(X, "CloseIcon");
export const WarningIcon = lucide(TriangleAlert, "WarningIcon");
export const LockIcon = lucide(Lock, "LockIcon");
export const UnlockIcon = lucide(LockOpen, "UnlockIcon");
/** A clock turning back: a result older than its source. */
export const StaleIcon = lucide(History, "StaleIcon");
export const PlusIcon = lucide(Plus, "PlusIcon");
/** Four corners: fit the board to the view. */
export const FitIcon = lucide(Maximize, "FitIcon");
export const HandIcon = lucide(Hand, "HandIcon");
export const CursorIcon = lucide(MousePointer2, "CursorIcon");
export const MapIcon = lucide(MapGlyph, "MapIcon");
export const UndoIcon = lucide(Undo2, "UndoIcon");
export const RedoIcon = lucide(Redo2, "RedoIcon");
export const SearchIcon = lucide(Search, "SearchIcon");
export const KeyboardIcon = lucide(Keyboard, "KeyboardIcon");
export const CopyIcon = lucide(Copy, "CopyIcon");
export const TrashIcon = lucide(Trash, "TrashIcon");
export const CollapseIcon = lucide(ChevronUp, "CollapseIcon");
export const ExpandIcon = lucide(ChevronDown, "ExpandIcon");
