---
id: K-0217
topic: design
claim: On mobile shadcn/ui's Sidebar renders a Sheet, which is the Radix Dialog primitive, with sr-only title "Sidebar" and description "Displays the mobile sidebar." and the class [&>button]:hidden on its content, and Radix states that a modal dialog traps focus and that Esc closes it and moves focus to the trigger.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sheet.tsx; https://www.radix-ui.com/primitives/docs/components/dialog; packages/design-system/catalog/application/sheet.yaml"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

`sidebar.tsx`:

```tsx
<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
  <SheetContent
    data-sidebar="sidebar"
    data-slot="sidebar"
    data-mobile="true"
    className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
```

```tsx
<SheetHeader className="sr-only">
  <SheetTitle>Sidebar</SheetTitle>
  <SheetDescription>Displays the mobile sidebar.</SheetDescription>
</SheetHeader>
```

`sheet.tsx`: `import { Dialog as SheetPrimitive } from "radix-ui"`; `side = "right"`, `showCloseButton = true`; `<span className="sr-only">Close</span>`. The class `[&>button]:hidden` on the sidebar's `SheetContent` targets a direct child button of the content; whether that is the Close button was not run in a browser.

Radix Dialog page:

> Focus is automatically trapped within modal.

> Esc closes the component automatically.

> Closes the dialog and moves focus to `Dialog.Trigger`.

> Adheres to the Dialog WAI-ARIA design pattern.

## Why it matters for ORIVILO

ORIVILO's Sheet is on the same behaviour (catalog `sheet.yaml`: focus trapped and returned, Escape closes). The hard-coded English title is what a Thai and English catalog cannot copy as it stands.
