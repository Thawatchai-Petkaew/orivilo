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
