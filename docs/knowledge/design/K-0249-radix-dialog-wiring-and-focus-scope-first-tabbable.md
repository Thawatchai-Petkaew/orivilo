---
id: K-0249
topic: design
claim: In the Radix Dialog 1.3.1 and FocusScope 1.3.1 builds the repo's lockfile pins, the content sets role dialog before the spread of content props so a caller's role wins, labels from the title and description when present, sets no aria-modal and hides the rest with hideOthers, returns focus to the trigger on close, and on open focuses the first tabbable candidate that is not a link, skipping disabled, hidden and negative tabIndex elements, falling back to the tabIndex -1 container, which also takes focus if the focused element is removed.
source: "https://unpkg.com/@radix-ui/react-dialog@1.3.1/dist/index.mjs; https://unpkg.com/@radix-ui/react-focus-scope@1.3.1/dist/index.mjs; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/dialog/src/dialog.tsx; https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/focus-scope/src/focus-scope.tsx; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool. `pnpm-lock.yaml` lines 1760 and 1817 pin `@radix-ui/react-dialog` 1.3.1 and `@radix-ui/react-focus-scope` 1.3.1. The code quoted is the compiled 1.3.1 build; the comment is from `main`, because the build strips comments.

```js
focusFirst(removeLinks(getTabbableCandidates(container)), { select: true });
if (document.activeElement === previouslyFocusedElement) {
  focus(container);
if (node.disabled || node.hidden || isHiddenInput) {
return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
if (mutation.removedNodes.length > 0) focus(container);
```

```tsx
// aria-hide everything except the content (better supported equivalent to setting aria-modal)
```

In Dialog 1.3.1: `role: "dialog"` comes before `...contentProps`; `if (content) return hideOthers(content);`; the modal content's `onCloseAutoFocus` calls `context.triggerRef.current?.focus();`; `trapFocus: context.open`. The trigger has `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls` while open (read on `main`). No line sets `aria-modal`.

## Why it matters for ORIVILO

Our Dialog is this primitive (`packages/design-system/src/components/dialog/Dialog.tsx`). First focus in a confirm is whichever non-link control comes first in the DOM, and a disabled control is passed over.
