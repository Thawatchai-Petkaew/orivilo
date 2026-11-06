---
id: K-0156
topic: design
claim: The HTML Standard says a label's `for` must be the ID of a labelable element, and that list holds button, input (not hidden), meter, output, progress, select, textarea and form-associated custom elements, so a `button` qualifies and a `div` does not.
source: "https://html.spec.whatwg.org/multipage/forms.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes.

> Some elements, not all of them form-associated, are categorized as labelable elements.

> the attribute's value must be the ID of a labelable element in the same tree as the label element.

- Labelable elements: `button`, `input` (if the `type` attribute is not in the Hidden state), `meter`, `output`, `progress`, `select`, `textarea`, form-associated custom elements.

## Why it matters for ORIVILO

`Field` renders `<label htmlFor={id}>` (`packages/design-system/src/components/field/Field.tsx`). Radix Switch is a `button` (K-0152), which that label can reach. The Radix radio group root is a `div` (K-0151), which it cannot, and K-0153 and K-0155 ask for a name on that group.
