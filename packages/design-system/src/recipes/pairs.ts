/**
 * The colour pairs the recipes put together: a foreground on the ground it sits on. Text pairs
 * need 4.5, UI pairs (edges, glyphs, fills against the canvas) need 3.0 (DESIGN.md §11), under
 * every profile in both modes. `recipes.test.ts` resolves each pair from the token source; the
 * design gate reads this list as the "real pairs used" evidence.
 *
 * Not listed: `menu.border`, `tabs.border` and `dialog.border`, which are `border.subtle`
 * dividers, and `card.border`, which is transparent on the light canvas. A menu is identified by
 * its shadow and its options, a tab list by its tabs and the selected edge, a dialog by its scrim
 * and shadow, a card by its ground; the edge is decoration and WCAG 1.4.11 does not apply to it.
 *
 * Paths are component-token paths (`button.primary.fg`) or semantic paths prefixed `ds:` where a
 * recipe sits on a page ground rather than its own (`ds:surface.canvas`).
 */
export interface RecipePair {
  recipe: string;
  slot: string;
  fg: string;
  bg: string;
  floor: 4.5 | 3;
}

const TEXT = 4.5;
const UI = 3;

export const RECIPE_PAIRS: readonly RecipePair[] = [
  // Button
  {
    recipe: "button",
    slot: "primary",
    fg: "button.primary.fg",
    bg: "button.primary.bg",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "primary hover",
    fg: "button.primary.fg",
    bg: "button.primary.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "primary press",
    fg: "button.primary.fg",
    bg: "button.primary.bg-press",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "primary on canvas",
    fg: "button.primary.bg",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  {
    recipe: "button",
    slot: "primary disabled",
    fg: "button.primary.fg-disabled",
    bg: "button.primary.bg-disabled",
    floor: UI,
  },
  {
    recipe: "button",
    slot: "secondary",
    fg: "button.secondary.fg",
    bg: "button.secondary.bg",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "secondary hover",
    fg: "button.secondary.fg",
    bg: "button.secondary.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "secondary press",
    fg: "button.secondary.fg",
    bg: "button.secondary.bg-press",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "secondary edge",
    fg: "button.secondary.border",
    bg: "button.secondary.bg",
    floor: UI,
  },
  {
    recipe: "button",
    slot: "secondary disabled",
    fg: "button.secondary.fg-disabled",
    bg: "button.secondary.bg",
    floor: UI,
  },
  {
    recipe: "button",
    slot: "ghost on canvas",
    fg: "button.ghost.fg",
    bg: "ds:surface.canvas",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "ghost on card",
    fg: "button.ghost.fg",
    bg: "ds:surface.card",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "ghost hover",
    fg: "button.ghost.fg",
    bg: "button.ghost.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "ghost press",
    fg: "button.ghost.fg",
    bg: "button.ghost.bg-press",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "ghost disabled",
    fg: "button.ghost.fg-disabled",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  { recipe: "button", slot: "intent", fg: "button.intent.fg", bg: "button.intent.bg", floor: TEXT },
  {
    recipe: "button",
    slot: "intent hover",
    fg: "button.intent.fg",
    bg: "button.intent.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "intent press",
    fg: "button.intent.fg",
    bg: "button.intent.bg-press",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "destructive",
    fg: "button.destructive.fg",
    bg: "button.destructive.bg",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "destructive hover",
    fg: "button.destructive.fg",
    bg: "button.destructive.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "destructive press",
    fg: "button.destructive.fg",
    bg: "button.destructive.bg-press",
    floor: TEXT,
  },
  {
    recipe: "button",
    slot: "destructive on canvas",
    fg: "button.destructive.bg",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  {
    recipe: "button",
    slot: "destructive disabled",
    fg: "button.destructive.fg-disabled",
    bg: "button.destructive.bg-disabled",
    floor: UI,
  },
  // Text controls (Input, Textarea, Select trigger)
  { recipe: "control", slot: "text", fg: "input.fg", bg: "input.bg", floor: TEXT },
  { recipe: "control", slot: "placeholder", fg: "input.placeholder", bg: "input.bg", floor: TEXT },
  { recipe: "control", slot: "edge", fg: "input.border", bg: "input.bg", floor: UI },
  {
    recipe: "control",
    slot: "edge on canvas",
    fg: "input.border",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  { recipe: "control", slot: "edge hover", fg: "input.border-hover", bg: "input.bg", floor: UI },
  { recipe: "control", slot: "edge focus", fg: "input.border-focus", bg: "input.bg", floor: UI },
  { recipe: "control", slot: "edge error", fg: "input.border-error", bg: "input.bg", floor: UI },
  { recipe: "control", slot: "icon", fg: "input.icon", bg: "input.bg", floor: UI },
  {
    recipe: "control",
    slot: "disabled text",
    fg: "input.fg-disabled",
    bg: "input.bg-disabled",
    floor: UI,
  },
  {
    recipe: "control",
    slot: "read-only on canvas",
    fg: "input.fg",
    bg: "ds:surface.canvas",
    floor: TEXT,
  },
  // Menu (Select listbox)
  { recipe: "menu", slot: "option", fg: "menu.option.fg", bg: "menu.bg", floor: TEXT },
  {
    recipe: "menu",
    slot: "option highlighted",
    fg: "menu.option.fg",
    bg: "menu.option.bg-hover",
    floor: TEXT,
  },
  {
    recipe: "menu",
    slot: "option selected",
    fg: "menu.option.fg-selected",
    bg: "menu.option.bg-selected",
    floor: TEXT,
  },
  { recipe: "menu", slot: "empty line", fg: "menu.empty", bg: "menu.bg", floor: TEXT },
  // Checkbox
  {
    recipe: "checkbox",
    slot: "glyph",
    fg: "checkbox.fg-checked",
    bg: "checkbox.bg-checked",
    floor: UI,
  },
  { recipe: "checkbox", slot: "edge", fg: "checkbox.border", bg: "checkbox.bg", floor: UI },
  {
    recipe: "checkbox",
    slot: "edge on canvas",
    fg: "checkbox.border",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  {
    recipe: "checkbox",
    slot: "filled on canvas",
    fg: "checkbox.bg-checked",
    bg: "ds:surface.canvas",
    floor: UI,
  },
  {
    recipe: "checkbox",
    slot: "edge error",
    fg: "checkbox.border-error",
    bg: "checkbox.bg",
    floor: UI,
  },
  {
    recipe: "checkbox",
    slot: "disabled glyph",
    fg: "checkbox.fg-disabled",
    bg: "checkbox.bg-disabled",
    floor: UI,
  },
  { recipe: "checkbox", slot: "label", fg: "field.label", bg: "ds:surface.canvas", floor: TEXT },
  // Field
  { recipe: "field", slot: "label", fg: "field.label", bg: "ds:surface.canvas", floor: TEXT },
  { recipe: "field", slot: "label on card", fg: "field.label", bg: "ds:surface.card", floor: TEXT },
  {
    recipe: "field",
    slot: "description",
    fg: "field.description",
    bg: "ds:surface.canvas",
    floor: TEXT,
  },
  { recipe: "field", slot: "error", fg: "field.error", bg: "ds:surface.canvas", floor: TEXT },
  { recipe: "field", slot: "error on card", fg: "field.error", bg: "ds:surface.card", floor: TEXT },
  // Tooltip
  { recipe: "tooltip", slot: "text", fg: "tooltip.fg", bg: "tooltip.bg", floor: TEXT },
  { recipe: "tooltip", slot: "on canvas", fg: "tooltip.bg", bg: "ds:surface.canvas", floor: UI },
  // Badge
  { recipe: "badge", slot: "neutral", fg: "badge.neutral.fg", bg: "badge.neutral.bg", floor: TEXT },
  { recipe: "badge", slot: "success", fg: "badge.success.fg", bg: "badge.success.bg", floor: TEXT },
  { recipe: "badge", slot: "warning", fg: "badge.warning.fg", bg: "badge.warning.bg", floor: TEXT },
  { recipe: "badge", slot: "danger", fg: "badge.danger.fg", bg: "badge.danger.bg", floor: TEXT },
  { recipe: "badge", slot: "info", fg: "badge.info.fg", bg: "badge.info.bg", floor: TEXT },
  { recipe: "badge", slot: "brand", fg: "badge.brand.fg", bg: "badge.brand.bg", floor: TEXT },
  // Popover
  { recipe: "popover", slot: "text", fg: "popover.fg", bg: "popover.bg", floor: TEXT },
  {
    recipe: "popover",
    slot: "control in popover",
    fg: "input.border",
    bg: "popover.bg",
    floor: UI,
  },
  // Tabs
  { recipe: "tabs", slot: "tab", fg: "tabs.fg", bg: "ds:surface.canvas", floor: TEXT },
  { recipe: "tabs", slot: "tab on card", fg: "tabs.fg", bg: "ds:surface.card", floor: TEXT },
  { recipe: "tabs", slot: "tab hover", fg: "tabs.fg-hover", bg: "tabs.bg-hover", floor: TEXT },
  {
    recipe: "tabs",
    slot: "tab selected",
    fg: "tabs.fg-selected",
    bg: "ds:surface.canvas",
    floor: TEXT,
  },
  {
    recipe: "tabs",
    slot: "tab selected on card",
    fg: "tabs.fg-selected",
    bg: "ds:surface.card",
    floor: TEXT,
  },
  { recipe: "tabs", slot: "indicator", fg: "tabs.indicator", bg: "ds:surface.canvas", floor: UI },
  // Dialog
  { recipe: "dialog", slot: "text", fg: "dialog.fg", bg: "dialog.bg", floor: TEXT },
  { recipe: "dialog", slot: "description", fg: "dialog.description", bg: "dialog.bg", floor: TEXT },
  { recipe: "dialog", slot: "error", fg: "dialog.error", bg: "dialog.bg", floor: TEXT },
  {
    recipe: "dialog",
    slot: "destructive glyph",
    fg: "dialog.destructive",
    bg: "dialog.bg",
    floor: UI,
  },
  {
    recipe: "dialog",
    slot: "control in dialog",
    fg: "ds:border.control",
    bg: "dialog.bg",
    floor: UI,
  },
  // Card
  { recipe: "card", slot: "text", fg: "card.fg", bg: "card.bg", floor: TEXT },
  { recipe: "card", slot: "value", fg: "card.value-fg", bg: "card.bg", floor: TEXT },
  { recipe: "card", slot: "secondary text", fg: "ds:text.secondary", bg: "card.bg", floor: TEXT },
  { recipe: "card", slot: "hover edge", fg: "card.border-hover", bg: "card.bg", floor: UI },
  { recipe: "card", slot: "selected text", fg: "card.fg", bg: "card.bg-selected", floor: TEXT },
  {
    recipe: "card",
    slot: "selected edge",
    fg: "card.border-selected",
    bg: "card.bg-selected",
    floor: UI,
  },
  {
    recipe: "card",
    slot: "selected secondary text",
    fg: "ds:text.secondary",
    bg: "card.bg-selected",
    floor: TEXT,
  },
];
