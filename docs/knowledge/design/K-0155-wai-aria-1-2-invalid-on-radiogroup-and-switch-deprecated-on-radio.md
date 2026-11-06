---
id: K-0155
topic: design
claim: WAI-ARIA 1.2 lists `aria-invalid` and `aria-required` as supported on radiogroup and inherited on switch, marks `aria-invalid` and `aria-errormessage` deprecated on radio, does not list `aria-required` on radio, requires an accessible name on radiogroup, radio and switch, and makes user agents treat a mixed `aria-checked` on a switch as false.
source: "https://www.w3.org/TR/wai-aria-1.2/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes, in parts of the page by character offset. The `aria-required` definition block was not read; the lists below come from the role tables.

### radio

> A checkable input in a group of elements with the same role, only one of which can be checked at a time.

> aria-invalid (state) (deprecated on this role in ARIA 1.2)

> aria-errormessage (deprecated on this role in ARIA 1.2)

- Required: `aria-checked`. Supported: `aria-posinset`, `aria-setsize`. Name From: contents, author. Accessible Name Required: True.
- `aria-required` is not in its inherited list.

### radiogroup

> A group of radio buttons.

- Supported States and Properties: `aria-errormessage`, `aria-invalid`, `aria-readonly`, `aria-required`.
- Required Owned Elements: radio. Name From: author. Accessible Name Required: True.

### switch

> A type of checkbox that represents on/off values, as opposed to checked/unchecked values.

> user agents MUST treat a `mixed` value as equivalent to `false` for this role.

- Superclass: checkbox. Required: `aria-checked`. Name From: contents, author. Accessible Name Required: True.
- Inherited list includes `aria-errormessage`, `aria-invalid (state)` and `aria-required`, none marked deprecated on this role.

### aria-invalid

> This state is being deprecated as a global state in ARIA 1.2.

- Used in Roles: application, checkbox, combobox, gridcell, listbox, radiogroup, slider, spinbutton, textbox, tree.
- Inherits into Roles: columnheader, rowheader, searchbox, switch, treegrid.

## Why it matters for ORIVILO

shadcn/ui puts `aria-invalid` on each radio item (K-0147, K-0149), which is the role this page marks deprecated, and the group is where 1.2 supports it. Radix writes `aria-required` to the group, which agrees (K-0151).
