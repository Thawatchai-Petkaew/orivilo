---
id: K-0264
topic: design
claim: Untitled UI's drop zone uses native drag events on an element with no role, tabIndex or ARIA, offers a sr-only file input and a "Click to upload" Button inside its label as the non-drag route, and its source file has no focus class and no aria-live; the page states no keyboard or screen reader behaviour.
source: "https://www.untitledui.com/react/components/file-uploaders; https://raw.githubusercontent.com/untitleduico/react/main/components/application/file-upload/file-upload-base.tsx; https://raw.githubusercontent.com/untitleduico/react/main/components/base/buttons/button-utility.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters; source files are read on `main`, not pinned to a commit. Nothing here was run in a browser or with a screen reader.

> `FileUpload.DropZone` handles the native drag events itself and shows a brand-colored ring while a file is dragged over it.

```tsx
<label htmlFor={id} className="flex cursor-pointer">
```

- Page: the "Click to upload" button opens the standard file picker, and both routes use the same validation before `onDropFiles`. The page has no text on keyboard, focus or ARIA; its only accessibility reference is the "built using React Aria" sentence (K-0260).
- Source, drag: `onDragOver` and `onDragEnter` call `handleDragIn`, `onDragLeave` and `onDragEnd` call `handleDragOut`, `onDrop` calls `handleDrop`; each returns early when `isDisabled` is set. While dragging the zone adds `ring-2 ring-brand`.
- Source, input: `<input>` with `id`, `type="file"`, `className="peer sr-only"`, `disabled`, `accept`, `multiple` and `onChange`. No `tabIndex` and no `aria-hidden`. It comes before the label in the DOM.
- Source, button: `color="link-color" size="md"`, `onClick={() => inputRef.current?.click()}`, with no `preventDefault` or `stopPropagation`, inside the `<label>`.
- Source, text: "Click to upload", then "and attach files" in a `md:hidden` span; "or drag and drop" sits in a `max-md:hidden` span, so narrow screens do not offer the drag wording.
- Source, absent from this file: `tabIndex`, `peer-focus` or any `focus` or `focus-visible` class, `role` and `aria-*` on the zone and the input, `aria-live` anywhere. The only ARIA is on the fill item's progress element (K-0265).
- Source, delete: `ButtonUtility` carries `focus-visible:outline-2` in its own file and the name from `tooltip` (K-0262).

Own reading, not run: the sr-only input has no `tabIndex`, so it should be a second tab stop beside the Button, and this file gives it no visible focus style. Whether the Button's own file adds one to the Button was not read.

## Why it matters for ORIVILO

The question asks how drag and drop reaches keyboard and screen reader users. For Untitled UI the answer is a picker route beside the zone; the zone itself and its rejection state say nothing to assistive technology.
