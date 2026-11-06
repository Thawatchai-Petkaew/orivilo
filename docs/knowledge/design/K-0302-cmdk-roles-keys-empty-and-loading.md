---
id: K-0302
topic: design
claim: cmdk's input has role combobox with aria-expanded fixed to true, its list is a listbox and its items are options, its Empty part has role presentation and its Loading part role progressbar, it handles ArrowDown, ArrowUp, Home, End and Enter and skips them during IME composition, and its README does not mention multiple selection.
source: "https://raw.githubusercontent.com/pacocoursey/cmdk/main/README.md; https://raw.githubusercontent.com/pacocoursey/cmdk/main/cmdk/src/index.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; files are read on `main`, not pinned to a commit. The license file was not read, so this entry is `link-only`. Nothing here was run in a browser or with a screen reader.

> ⌘K is a command menu React component that can also be used as an accessible combobox.

> Automatically renders when there are no results for the search query.

> You should conditionally render this with `progress` while loading asynchronous items.

> Render the items as they become available. Filtering and sorting will happen automatically.

```tsx
aria-expanded={true}
```

```ts
const isComposing = e.nativeEvent.isComposing || e.keyCode === 229;
```

- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-controls={context.listId}`, `aria-activedescendant={selectedItemId}`, `aria-labelledby={context.labelId}`.
- List: `role="listbox"`, `aria-label` default `'Suggestions'`. Item: `role="option"`, `aria-selected={Boolean(selected)}`, `aria-disabled={Boolean(disabled)}`.
- Empty: `role="presentation"`. Loading: `role="progressbar"`, `aria-valuenow={progress}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label` default `'Loading...'`.
- Group: root `role="presentation"`, items container `role="group"` with `aria-labelledby`, heading `aria-hidden`.
- Keys: `ArrowDown`, `ArrowUp`, `Home`, `End`, `Enter`; `n` and `j` move down and `p` and `k` up with Control when `vimBindings` is on. The handler returns early on `e.defaultPrevented || isComposing`.
- Filtering: `shouldFilter={false}` turns it off; a custom `filter` ranks each item.
- Multiple selection: not mentioned in the README.
- `Command.Dialog`: "Composes Radix UI's Dialog component."

Own reading: `presentation` is not a live region role, so this Empty part announces nothing by itself; compare [[K-0303-base-ui-combobox-status-and-empty-are-live-regions]].

## Why it matters for ORIVILO

cmdk is what a Radix Popover route would add. Its fixed `aria-expanded` and non-live Empty sit against [[K-0310-wai-aria-apg-combobox-roles-states-and-aria-busy]] and [[K-0314-wcag-2-2-status-message-result-count]], and it has no multiple selection for the second component.
