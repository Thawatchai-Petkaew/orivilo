/**
 * Names of the semantic colour tokens in DESIGN.md §3 and the pairs whose contrast the
 * Foundations page reports. Values are never listed here: the page reads them from the token
 * CSS at render time, so this file cannot drift from `src/tokens/orivilo.css`.
 */

export interface ColourToken {
  /** Token path, e.g. `surface.canvas`. */
  name: string;
  /** Token this one is measured against for contrast, or null for surfaces. */
  against: string | null;
  /** WCAG floor for the pair: 4.5 for text, 3 for UI edges, null when the pair is informational. */
  floor: 4.5 | 3 | null;
  note: string;
}

export const COLOUR_TOKENS: readonly ColourToken[] = [
  { name: "surface.canvas", against: null, floor: null, note: "Page background" },
  { name: "surface.card", against: null, floor: null, note: "Content containers, inputs, menus" },
  {
    name: "surface.selected",
    against: null,
    floor: null,
    note: "Selected row, chosen option, active nav item",
  },
  { name: "surface.inverse", against: null, floor: null, note: "Inverse blocks, tooltips" },
  { name: "text.primary", against: "surface.canvas", floor: 4.5, note: "Body, headings, values" },
  {
    name: "text.secondary",
    against: "surface.canvas",
    floor: 4.5,
    note: "Supporting text, meta, placeholders",
  },
  {
    name: "text.on-action",
    against: "action.primary",
    floor: 4.5,
    note: "Text and icons on action surfaces",
  },
  {
    name: "action.primary",
    against: "surface.canvas",
    floor: 4.5,
    note: "One primary action per view; links as text",
  },
  {
    name: "action.primary-hover",
    against: "surface.canvas",
    floor: null,
    note: "Hover of action.primary",
  },
  {
    name: "action.primary-press",
    against: "surface.canvas",
    floor: null,
    note: "Pressed of action.primary",
  },
  {
    name: "selection.fg",
    against: "surface.selected",
    floor: 4.5,
    note: "Text and icon on surface.selected",
  },
  {
    name: "focus.ring",
    against: "surface.canvas",
    floor: 3,
    note: "2 px ring with a 2 px gap, any ground",
  },
  {
    name: "border.control",
    against: "surface.card",
    floor: 3,
    note: "Inputs, checkboxes, outlined buttons",
  },
  {
    name: "border.subtle",
    against: "surface.card",
    floor: null,
    note: "Dividers, card edges; decorative only",
  },
  {
    name: "brand.signature",
    against: "text.primary",
    floor: 4.5,
    note: "Mark dot, one highlight plane; ink on it",
  },
  {
    name: "feedback.success",
    against: "surface.canvas",
    floor: 4.5,
    note: "Success text, icon, border",
  },
  {
    name: "feedback.warning",
    against: "surface.canvas",
    floor: 4.5,
    note: "Warning text, icon, border",
  },
  {
    name: "feedback.danger",
    against: "surface.canvas",
    floor: 4.5,
    note: "Errors, destructive actions",
  },
  {
    name: "feedback.info",
    against: "surface.canvas",
    floor: 3,
    note: "Info at 18 px+ or bold; below that, ink plus icon",
  },
];

/** `group.role` to `--ds-group-role`. */
export function cssVar(name: string): string {
  return `--ds-${name.replaceAll(".", "-")}`;
}
