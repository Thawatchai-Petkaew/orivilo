---
id: K-0154
topic: design
claim: The WAI-ARIA APG Switch pattern gives role switch with `aria-checked` true or false, Space to change state and Enter as optional, a name from visible content, `aria-labelledby` or `aria-label`, a group by role group with `aria-labelledby` or by fieldset and legend, and a label that must not change with the state; the page mentions no `aria-required` or `aria-invalid`.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/switch/switch-pattern.html"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes.

> A switch is an input widget that allows users to choose one of two values: on or off.

> it is critical the label on a switch does not change when its state changes.

> Space: When focus is on the switch, changes the state of the switch.

> The switch has role switch.

> When on, the switch element has state aria-checked set to true.

> When off, the switch element has state aria-checked set to false.

- Enter (Optional): "When focus is on the switch, changes the state of the switch."
- Accessible label, one of: "Visible text content contained within the element with role switch."; "A visible label referenced by the value of aria-labelledby set on the element with role switch."; "aria-label set on the element with role switch."
- With a native `input[type="checkbox"]`, "it uses the HTML checked attribute instead of the aria-checked property."
- A set of switches with a visible label: "an element with role group that has the property aria-labelledby", or "The set is contained in an HTML fieldset and the label for the set is contained in an HTML legend element."
- Description: "the switch or switch group has the property aria-describedby set to the ID of the element containing the description."
- "switches can only be used for binary input"; the About section sets this against checkboxes and toggle buttons, which can have a third state, and advises choosing the role that fits the visual design and meaning.
- Examples: Switch Example, Switch Example Using HTML Button, Switch Example Using HTML Checkbox Input. These were not read.
- `aria-required`, `aria-invalid` and a mixed state are not mentioned as switch features.

## Why it matters for ORIVILO

The fixed label is the rule that a Switch's text names the setting, never the current state. A settings list of switches also has a sourced group shape here.
