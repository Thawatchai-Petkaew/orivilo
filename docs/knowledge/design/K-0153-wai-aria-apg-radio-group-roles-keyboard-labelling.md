---
id: K-0153
topic: design
claim: The WAI-ARIA APG Radio Group pattern asks for role radiogroup holding role radio with `aria-checked`, a label on the group and on each radio, Tab into and out of the group, Space to check, and arrow keys that move focus, check the new button and wrap; a radio group in a toolbar instead moves focus without checking, and the page does not mention `aria-required`, `aria-invalid` or `aria-orientation`.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-221]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns short quotes.

### Keyboard, not in a toolbar

> Tab and Shift + Tab: Move focus into and out of the radio group.

> If a radio button is checked, focus is set on the checked button.

> If none of the radio buttons are checked, focus is set on the first radio button in the group.

> Space: checks the focused radio button if it is not already checked.

> Right Arrow and Down Arrow: move focus to the next radio button in the group,

> uncheck the previously focused button, and check the newly focused button.

- Left Arrow and Up Arrow do the same in reverse, with the same "uncheck ... and check" wording.
- Wrap: "If focus is on the last button, focus moves to the first button." and "If focus is on the first button, focus moves to the last button."
- A note says the first-focus rule differs slightly from some browsers' native radio groups, where Shift + Tab can land on the last button when none is checked.

### Keyboard, in a toolbar

- Space checks the focused radio; arrow keys move focus without changing which button is checked.
- "Enter (optional): If the focused radio button is not checked," is listed in this section only.
- Note: "Radio buttons in a toolbar are frequently styled in a manner that appears more like toggle buttons."

### Roles, states and properties

> The radio buttons are contained in or owned by an element with role radiogroup.

> Each radio button element has role radio.

> The `radiogroup` element has a visible label referenced by aria-labelledby or has a label specified with aria-label.

- Each `radio`: "labelled by its content, has a visible label referenced by aria-labelledby," or has `aria-label`.
- Checked radios have `aria-checked` `true`, unchecked `false`.
- Additional information is referenced with `aria-describedby` from the `radiogroup` or `radio` elements.

### Also on the page

- About: some implementations start with nothing checked "in order to force the user to check one of the buttons before moving past a certain point in the workflow."
- Examples: Radio Group Example Using Roving tabindex, Radio Group Example Using aria-activedescendant, Rating Radio Group Example. These were not read.
- `aria-required`, `aria-invalid` and `aria-orientation` are not mentioned.

## Why it matters for ORIVILO

This is the behaviour Radix says it follows. The page also gives a toolbar a different arrow key rule from a form, which matters beside our ToggleGroup, whose catalog entry claims radio semantics in single mode.
