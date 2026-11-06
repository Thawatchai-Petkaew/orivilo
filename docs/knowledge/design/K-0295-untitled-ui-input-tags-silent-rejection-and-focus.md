---
id: K-0295
topic: design
claim: Untitled UI's InputTags adds a tag on Enter and refuses an empty value, an exact duplicate, a tag past maxTags or one failing validate by returning false with no message, leaving the text in the input; it moves focus to the input only when a removal leaves no tags, and Backspace on an empty input or Left Arrow at the start moves to the last tag.
source: "https://www.untitledui.com/react/components/inputs; https://raw.githubusercontent.com/untitleduico/react/main/components/base/input/input-tags.tsx; https://github.com/untitleduico/react/tree/main/components/base/input; docs/specs/ORV-64/audit.md; DESIGN.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; the source file is read on `main`, not pinned to a commit. The Inputs page has the examples "Tag input" and "Tag input outer" and no text on their props or behaviour; its API reference is an embedded placeholder. `input-tags-outer.tsx` is listed in the folder and was not read. Nothing here was run in a browser or with a screen reader.

```tsx
if (!allowDuplicates && tags.includes(trimmed)) return false;
```

```tsx
if (maxTags && tags.length >= maxTags) return false;
```

```tsx
if (validate && !validate(trimmed)) return false;
```

```tsx
setTimeout(() => inputRef.current?.focus(), 0);
```

- Props read: `size` (default `"md"`), `allowDuplicates` (default `false`), `maxTags`, `validate`, `value`, `defaultValue`, `label`, `onTagRemoved`.
- Add: Enter in the input calls `addTag(inputValue)` and clears the input only when it returns true. `addTag` trims the text and refuses an empty string.
- Duplicates: exact and case-sensitive after trimming. `maxTags={0}` counts as no limit, since the check is truthy.
- Refusal: no message, and the typed text stays. `validate` runs only inside `addTag`, not on blur or render.
- Remove: `onRemove={handleRemove}` on `TagGroup`, which removes every key it gets in one update. `onTagRemoved` fires once per label. The file renders no remove button itself.
- Focus: only the empty-list case above is handled here.
- ARIA: `TagGroup` takes `label={label || "Tags"}`; `focusLastTag` finds tags with `querySelectorAll('[role="row"]')`; the input has no explicit `aria-label` or `aria-invalid`.

## Why it matters for ORIVILO

Row 25 of the ORV-64 build order names tag entry and audit B.2 lists a tag input after Tag. A refused tag with no message is the behaviour to read against `DESIGN.md` section 10, which asks an error to say what went wrong and how to fix it.
