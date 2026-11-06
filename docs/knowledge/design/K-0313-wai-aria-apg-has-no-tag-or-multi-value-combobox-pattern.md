---
id: K-0313
topic: design
claim: The WAI-ARIA APG patterns list has no pattern for tags, chips, a token field or a multi-select combobox, and the Combobox pattern text read describes one value, so how chips are reached and removed has no APG rule in what was read.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/; https://www.w3.org/WAI/ARIA/apg/patterns/combobox/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/combobox/combobox-pattern.html"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. Confidence 0.75, not 0.8: the claim is an absence, and the Combobox page was searched by prompt rather than read line by line.

> A combobox is an input widget that has an associated popup.

> The tree allows only one suggested value to be selected at a time for the combobox value.

- Patterns list, with the page's longer brackets left out for Accordion, Carousel, Disclosure and Grid: Accordion, Alert, Alert and Message Dialogs, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Landmarks, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter.
- The Combobox text speaks of the combobox's value in the singular. The quoted line is the only one the search returned on selecting more than one value, and it is about a tree popup.
- Multiple selection is covered by the Listbox pattern ([[K-0311-wai-aria-apg-listbox-multi-select-keys-and-state]]), which is not about a combobox or a token input.

## Why it matters for ORIVILO

The chip keys in [[K-0293-untitled-ui-tag-select-removal-keys-and-focus]] and [[K-0305-base-ui-combobox-chip-keys-and-focus-after-removal]] are library choices, not a standard. A spec that picks one has no APG line to cite for it.
