/**
 * ESLint rule: no raw colour, radius, shadow, or font classes in components and pages.
 * DESIGN.md §5: Tailwind is for layout and composition; visual values come from semantic tokens
 * (`bg-surface-canvas`, `rounded-control`, `font-body`, `text-display-md`). Checks every string literal and template
 * chunk, so a class list built with cn() or cva() is covered as well as a plain className.
 */

const COLOUR_PREFIX =
  "(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|accent|caret|decoration|placeholder|shadow)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)";

const PATTERNS = [
  { re: new RegExp(`(?<![\\w-])${COLOUR_PREFIX}-\\[`), why: "an arbitrary colour or shadow value" },
  {
    re: new RegExp(`(?<![\\w-])${COLOUR_PREFIX}-${PALETTE}(?:-\\d{2,3})?(?![\\w-])`),
    why: "a raw Tailwind palette colour",
  },
  {
    re: /(?<![\w-])rounded(?:-[trblse]{1,2})?-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|\[)/,
    why: "a raw radius",
  },
  { re: /(?<![\w-])shadow-(?:none|2xs|xs|sm|md|lg|xl|2xl|inner|\[)/, why: "a raw shadow" },
  { re: /(?<![\w-])font-(?:sans|serif|\[)/, why: "a raw font family" },
];

function check(context, node, text) {
  for (const { re, why } of PATTERNS) {
    const match = re.exec(text);
    if (match) {
      context.report({
        node,
        messageId: "raw",
        data: { cls: match[0], why },
      });
      return;
    }
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow raw colour, radius, shadow, and font classes (DESIGN.md §5)." },
    messages: {
      raw: 'Class "{{cls}}" is {{why}}. Use a semantic token utility instead (DESIGN.md §5, §3).',
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") check(context, node, node.value);
      },
      TemplateElement(node) {
        check(context, node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

export const orivilo = { rules: { "no-raw-style-classes": rule } };

/** Flat-config block to spread into any ESLint config that lints UI code. */
export const noRawStyleClasses = {
  plugins: { orivilo },
  rules: { "orivilo/no-raw-style-classes": "error" },
};

export default rule;
