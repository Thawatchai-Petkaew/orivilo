---
id: K-0296
topic: design
claim: Untitled UI's Command menu page is the only Untitled page read that describes async search, as filter={false} with inputValue and onInputChange feeding items, and it renders an emptyState node when results are empty; it states no loading prop or pending state.
source: "https://www.untitledui.com/react/components/command-menus"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters. Confidence 0.75, not 0.8: the claim's last part is an absence and the API reference renders only as a placeholder. No source file was read for this page. Nothing here was run in a browser or with a screen reader.

> Pass any React node to the `emptyState` prop on the command menu root.

> focuses the search input of an already-open menu

- Examples: Users, Users stacked, Actions, Actions stacked, Empty state, Users menu and its stacked form, Integrations menu and its stacked form.
- Parts named: `CommandMenu.List`, `.Section`, `.Item`, `.Footer`, `.Preview`, `.Trigger`.
- Props named: `shortcut` (default `"⌘/"`, `null` registers nothing), `isOpen`, `onOpenChange`, `items`, `defaultItems`, `placeholder` (default `"Search"`), `filter`, `inputValue`, `onInputChange`, `sensitivity` (default `"base"`), `emptyState`, `onSelectionChange`.
- Item: `id`, `label` (required), `description`, `shortcutKeys`, `stacked`, `type` (`"default"`, `"icon"`, `"avatar"`, `"dot"`), `icon`, `src`, `alt`, `dotColor`.
- Search: React Aria's `contains` matcher on `label`, or a custom `filter`; `filter={false}` for custom or server-side filtering.
- Not stated: a loading prop or how to show a pending query; arrow keys, Escape and focus handling.

## Why it matters for ORIVILO

ORIVILO's CommandMenu is a separate component; this page matters as the one Untitled source for the async question, and it gives a data route without a pending state.
