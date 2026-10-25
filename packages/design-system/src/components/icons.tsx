import type { SVGProps } from "react";
import {
  Activity,
  ArrowUp,
  AtSign,
  Book,
  BookOpen,
  Check,
  Clock,
  Compass,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleSmall,
  CircleDashed,
  CircleDotDashed,
  Copy,
  Eye,
  EyeOff,
  Group,
  Hand,
  History,
  Keyboard,
  Link,
  LoaderCircle,
  Lock,
  LocateFixed,
  LockOpen,
  Map as MapGlyph,
  Maximize,
  MessageSquare,
  Minus,
  PenLine,
  MousePointer2,
  PanelLeftOpen,
  PanelRightOpen,
  Plus,
  Redo2,
  RotateCcw,
  Scale,
  Search,
  Shapes,
  Sparkles,
  Square,
  StickyNote,
  TextCursorInput,
  Trash,
  TriangleAlert,
  Undo2,
  Unlink,
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
 * All 46 glyphs are Lucide today. A glyph Lucide lacks is drawn here as inline SVG on a 20 grid,
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
/** The chosen radio item in a menu (ORV-78): a small disc in the current ink. */
export const RadioDotIcon = lucide(CircleSmall, "RadioDotIcon");
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
/** The password is hidden; pressing reveals it. */
export const EyeIcon = lucide(Eye, "EyeIcon");
/** The password is shown; pressing hides it. */
export const EyeOffIcon = lucide(EyeOff, "EyeOffIcon");
export const KeyboardIcon = lucide(Keyboard, "KeyboardIcon");
export const CopyIcon = lucide(Copy, "CopyIcon");
export const TrashIcon = lucide(Trash, "TrashIcon");
export const CollapseIcon = lucide(ChevronUp, "CollapseIcon");
export const ExpandIcon = lucide(ChevronDown, "ExpandIcon");

// Task bar (ORV-100)
export const QueuedIcon = lucide(Clock, "QueuedIcon");
export const RunningIcon = lucide(Activity, "RunningIcon");
export const RetryIcon = lucide(RotateCcw, "RetryIcon");
export const JumpIcon = lucide(LocateFixed, "JumpIcon");

// Board chat (ORV-105 slice C): the button that opens the node picker.
export const MentionIcon = lucide(AtSign, "MentionIcon");
export const SendIcon = lucide(ArrowUp, "SendIcon");
export const StopIcon = lucide(Square, "StopIcon");
export const ChatIcon = lucide(MessageSquare, "ChatIcon");

/* Node kinds: the icon in a node's top row (ORV-57). */
export const InputBlockIcon = lucide(TextCursorInput, "InputBlockIcon");
export const KnowledgeIcon = lucide(Book, "KnowledgeIcon");
export const ArtifactIcon = lucide(Shapes, "ArtifactIcon");
export const ReferenceIcon = lucide(Link, "ReferenceIcon");
export const DirectionIcon = lucide(Compass, "DirectionIcon");
export const NoteIcon = lucide(StickyNote, "NoteIcon");
export const GroupIcon = lucide(Group, "GroupIcon");

/* Run steps: what the engine is doing in each step of a running node (ORV-57). */
export const ReadStepIcon = lucide(BookOpen, "ReadStepIcon");
export const DraftStepIcon = lucide(PenLine, "DraftStepIcon");
export const CompareStepIcon = lucide(Scale, "CompareStepIcon");
export const GenerateStepIcon = lucide(Sparkles, "GenerateStepIcon");
export const ReviewStepIcon = lucide(Eye, "ReviewStepIcon");

// Side panels (E4-4): the reopen control of a collapsed panel, pointing into the board.
export const PanelStartOpenIcon = lucide(PanelLeftOpen, "PanelStartOpenIcon");
export const PanelEndOpenIcon = lucide(PanelRightOpen, "PanelEndOpenIcon");

// Fill states of a block node (ORV-44 part 2): a mark beside the word, never colour alone.
export const FillEmptyIcon = lucide(CircleDashed, "FillEmptyIcon");
export const FillPartialIcon = lucide(CircleDotDashed, "FillPartialIcon");
export const FillSummarizedIcon = lucide(CircleCheck, "FillSummarizedIcon");
export const FillUnlinkedIcon = lucide(Unlink, "FillUnlinkedIcon");
