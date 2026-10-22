import type { SVGProps } from "react";

/**
 * The glyphs the first components need, inline so no icon library ships before a story needs
 * one (AGENTS.md rule 6). All are decorative: `aria-hidden` and `currentColor`; the control that
 * shows one carries the accessible name.
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function base(props: IconProps): IconProps {
  return {
    "aria-hidden": true,
    focusable: false,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props,
  };
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5 8 14.5 16 6" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 10h10" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

/** A three-quarter ring; the `ds-spin` recipe class turns it. */
export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3a7 7 0 1 1-7 7" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3.5 2.5 16.5h15L10 3.5Z" />
      <path d="M10 8v4M10 14.5h.01" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="9" width="12" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

export function StaleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10a6.5 6.5 0 1 1 1.9 4.6" />
      <path d="M3.5 15v-4h4" />
      <path d="M10 6.5V10l2.5 1.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function FitIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" />
    </svg>
  );
}

export function HandIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 11V4.5a1.5 1.5 0 0 1 3 0V10M10 9.5V3.5a1.5 1.5 0 0 1 3 0V10M13 9.5V5.5a1.5 1.5 0 0 1 3 0V12c0 3.5-2 5.5-5.5 5.5S5 15 5 12v-1.5a1.5 1.5 0 0 1 2-1.4" />
    </svg>
  );
}

export function CursorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 3l13 6.5-5.5 1.5L10 16.5 4 3Z" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 5.5 8 3.5l4 2 5-2v11l-5 2-4-2-5 2v-11ZM8 3.5v11M12 5.5v11" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 5 3 9l4 4" />
      <path d="M3 9h9a4 4 0 0 1 0 8H8" />
    </svg>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m13 5 4 4-4 4" />
      <path d="M17 9H8a4 4 0 0 0 0 8h4" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5.5" width="15" height="9" rx="1.5" />
      <path d="M5.5 8.5h.01M8.5 8.5h.01M11.5 8.5h.01M14.5 8.5h.01M6.5 11.5h7" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 6h13M8 6V4h4v2M5 6l1 11h8l1-11" />
    </svg>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12 5-5 5 5" />
    </svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

export function UnlockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="9" width="12" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 5.8-1" />
    </svg>
  );
}
