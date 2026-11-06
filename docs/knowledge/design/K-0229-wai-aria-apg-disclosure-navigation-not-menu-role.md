---
id: K-0229
topic: design
claim: The WAI-ARIA APG's disclosure navigation examples show dropdowns of links as buttons with aria-expanded and aria-controls in a named navigation landmark, without the menu role because it does not give what assistive technologies expect of one; Escape closes and returns focus to the button, Tab moves through the links, arrow keys, Home and End are marked optional, and the current link has aria-current page.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/; https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/; https://www.w3.org/WAI/ARIA/apg/patterns/menubar/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The pattern itself is K-0123.

Disclosure Navigation Menu example:

> This is an illustrative example of one way of using ARIA that conforms with the ARIA specification.

> it does not use the WAI-ARIA menu role.

> it does not provide the complex functionality that assistive technologies expect in a widget that has the menu role.

> If a dropdown is open and focus is inside the navigation region, pressing Esc will close the dropdown.

Keyboard Support rows:

- Tab, Shift + Tab: "Move keyboard focus among top-level buttons, and if a dropdown is open, into and through links in the dropdown."
- Space or Enter: on a disclosure button, toggles the dropdown. On a link, "If any link has `aria-current` set, removes it", then sets `aria-current="page"` on the focused link and activates it.
- Escape: "If a dropdown is open, closes it and sets focus on the button that controls that dropdown."
- Down Arrow or Right Arrow, Up Arrow or Left Arrow, Home, End: each marked Optional. The page's checkbox reads "Include optional support for arrow keys, Home, and End."

Roles, properties and states:

- `button`, `aria-expanded="false"`: "Indicates that the container controlled by the disclosure button is hidden."
- `button`, `aria-expanded="true"`: "Indicates that the container controlled by the disclosure button is visible."
- `button`, `aria-controls="IDREF"`: "The disclosure button controls visibility of the container identified by the `IDREF` value."
- `a`, `aria-current="page"`: "Indicates that the page referenced by the link is currently displayed."

The list of buttons is "wrapped in a navigation landmark named Mythical University."

Hybrid example:

> this example includes top-level links alongside the disclosure buttons.

> The semantics of the list structure communicate the hierarchy of the navigation system to assistive technology users.

The Menu and Menubar pattern opens with "A menu is a widget that offers a list of choices to the user, such as a set of actions or functions." Its Note 4 advises against menu items that both act and open a submenu; no other note on that page separates menus from site navigation.

## Why it matters for ORIVILO

A nested sidebar group is this pattern, and Radix's and the native details route both sit near it (K-0220, K-0205). The hybrid example is the shape for an item that is a link and also has children; the example keeps them as two controls.
