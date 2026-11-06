---
id: K-0294
topic: design
claim: Untitled UI's TagCloseX is 14, 16 or 20 px square at sm, md and lg (own arithmetic from its padding and icon classes) and always carries the name "Remove this tag" whatever the tag says; its Tags page says a focused tag in a TagGroup can be removed with Backspace or Delete, and states neither focus after removal nor ARIA roles beyond the group label.
source: "https://www.untitledui.com/react/components/tags; https://raw.githubusercontent.com/untitleduico/react/main/components/base/tags/base-components/tag-close-x.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/tags/tags.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/select/tag-select.tsx; packages/design-system/src/components/tag/Tag.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-228]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit. The page's API reference is an empty `<ApiReference slug="tags" />`. Nothing here was run in a browser or with a screen reader.

> a focused tag can also be removed with Backspace or Delete.

```tsx
aria-label="Remove this tag"
```

```tsx
size={size === "sm" ? "sm" : "md"}
```

| Size | Button class | Icon class | Square (own arithmetic, Tailwind's 4 px step) |
| ---- | ------------ | ---------- | --------------------------------------------- |
| sm   | `p-0.5`      | `size-2.5` | 2 + 10 + 2 = 14 px                            |
| md   | `p-0.5`      | `size-3`   | 2 + 12 + 2 = 16 px                            |
| lg   | `p-0.75`     | `size-3.5` | 3 + 14 + 3 = 20 px                            |

- Those are the three rows the file lists. The last code line is from `tag-select.tsx`: TagSelect's `lg` also uses the `md` button, so TagSelect reaches 14 or 16 px only (own reading).
- Button: `slot="remove"`, `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring`.
- Tags page: `TagGroup` takes `size`, `onRemove`, `selectionMode`, `selectedKeys`, `onSelectionChange`, `disabledKeys`, and a required `label`; `Tag` takes `onClose`, `count`, `isDisabled`, `avatarSrc`, `dot`, `dotClassName`. Sizes `sm` (default), `md`, `lg`.
- `label` is not visible; `tags.tsx` passes it as `aria-label` on the group.
- Source: the close button renders when `onClose || allowsRemoving`, takes `excludeFromTabOrder={allowsRemoving}`, and calls `onClose` with the tag's `id`.
- The page calls the `onRemove` argument "the key of the tag" in one place and a `Set` of keys in the FAQ.

## Why it matters for ORIVILO

The size and name are the two facts a tag's remove control is checked on: SC 2.5.8 ([[K-0315-wcag-2-2-target-size-minimum-and-spacing]]) and one name per control. ORIVILO's `Tag` names each remove with its label; the comparison is in [[K-0319-synthesis-combobox-and-multi-select-benchmark]].
