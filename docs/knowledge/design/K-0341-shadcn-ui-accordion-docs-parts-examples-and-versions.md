---
id: K-0341
topic: design
claim: shadcn/ui's Accordion is four parts (Accordion, AccordionItem, AccordionTrigger, AccordionContent) with six examples (Basic, Multiple, Disabled, Borders, Card, RTL); its docs offer Base UI, React Aria and Radix UI versions whose open-state props differ (type and collapsible on Radix, multiple on Base UI, defaultExpandedKeys on React Aria), send the API to each library, and name no size, variant or keyboard behaviour.
source: "https://ui.shadcn.com/docs/components/radix/accordion; https://ui.shadcn.com/docs/components/accordion; https://ui.shadcn.com/docs/components/aria/accordion; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. Confidence 0.8: one project, three docs pages that agree on the parts; nothing was rendered. The page text was cut in the example code blocks, so the example bodies were not read.

> A vertically stacked set of interactive headings that each reveal a section of content.

```text
Accordion
├── AccordionItem
│   ├── AccordionTrigger
│   └── AccordionContent
└── AccordionItem
```

### Radix version

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
```

Example notes as the fetch tool gave them: Multiple uses `type="multiple"`; Disabled sets `disabled` on `AccordionItem`; Borders adds `border` to `Accordion` and `border-b last:border-b-0` to `AccordionItem`; Card wraps it in a `Card`. The only accessibility text is the sample answer "Yes. It adheres to the WAI-ARIA design pattern." The page has no keyboard section. API reference: "See the Radix UI documentation for more information."

### Default page (Base UI) and React Aria page

Default page: `<Accordion defaultValue={["item-1"]}>` and "Use the `multiple` prop to allow multiple items to be open at the same time". Its API sentence points at Base UI. React Aria page: `<Accordion defaultExpandedKeys={["item-1"]}>`, "See the React Aria documentation for more information.", and the same six example names.

## Why it matters for ORIVILO

The rule in `.claude/rules/design-system.md` puts behaviour on the `radix-ui` package, so the Radix page is the one that matches the repo. The shadcn page itself adds no size or variant to benchmark.
