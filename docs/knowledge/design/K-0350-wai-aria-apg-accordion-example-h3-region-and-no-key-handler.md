---
id: K-0350
topic: design
claim: The APG Accordion example is a form in 3 sections built from h3 headings, each holding a button with aria-expanded and aria-controls, and a region panel labelled by that button; its keyboard table lists Space or Enter, Tab and Shift + Tab, it has no arrow, Home, End or aria-disabled line, and its script listens only for click, so a panel can be closed and activation comes from the native button.
source: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/accordion/examples/accordion.html; https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/accordion/examples/js/accordion.js"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-230]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool: the published page, its HTML and its script in `w3c/aria-practices` (`main`, no commit hash shown). Confidence 0.8: one publisher, page, markup and script agree; not run.

> The below example section contains a simple personal information input form divided into 3 sections

### Markup and table rows

```html
<button
  type="button"
  aria-expanded="true"
  class="accordion-trigger"
  aria-controls="sect1"
  id="accordion1id"
></button>
```

- `h3`: "Element that serves as an accordion header."
- `aria-expanded="true"`: "Set to true when the Accordion panel is expanded, otherwise set to false."
- `aria-controls="ID"`: "Points to the ID of the panel which the header controls."
- `region`: "Creates a landmark region that contains the currently expanded accordion panel."
- `aria-labelledby="IDREF"`: "Defines the accessible name for the region element."

Keyboard rows: Space or Enter "When focus is on the accordion header of a collapsed section, expands the section."; Tab and Shift + Tab, each with "All focusable elements in the accordion are included in the page Tab sequence."

### Script

```js
this.buttonEl.addEventListener("click", this.onButtonClick.bind(this));
this.toggle(!this.open);
this.buttonEl.setAttribute("aria-expanded", `${open}`);
this.contentEl.setAttribute("hidden", "");
```

The fetch tool found no key handler, no `aria-disabled` line and nothing that keeps a panel open.

## Why it matters for ORIVILO

The example sets `aria-controls` on an open button; the closed state's markup was not read for each panel. It shows the plain form of the pattern, with `hidden` panels and native button keys, beside Radix's fuller key set (K-0344).
