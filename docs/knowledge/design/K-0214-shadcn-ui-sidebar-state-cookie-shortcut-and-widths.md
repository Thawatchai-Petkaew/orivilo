---
id: K-0214
topic: design
claim: shadcn/ui's sidebar source sets widths of 16rem, 18rem on mobile and 3rem as icons, keeps the open state in a cookie for seven days, toggles on Cmd or Ctrl plus b from a window key listener, and treats a viewport under 768 px as mobile.
source: "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx; https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/hooks/use-mobile.ts; https://ui.shadcn.com/docs/components/radix/sidebar; DESIGN.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

`sidebar.tsx`:

```ts
SIDEBAR_COOKIE_NAME = "sidebar_state";
SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
SIDEBAR_WIDTH = "16rem";
SIDEBAR_WIDTH_MOBILE = "18rem";
SIDEBAR_WIDTH_ICON = "3rem";
SIDEBAR_KEYBOARD_SHORTCUT = "b";
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
```

The listener is on `window`, runs on `event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)`, and calls `preventDefault()` first. The docs give the shortcut as `cmd+b` on Mac and `ctrl+b` on Windows, and name `--sidebar-width` and `--sidebar-width-mobile` for several sidebars.

`use-mobile.ts`:

```ts
const MOBILE_BREAKPOINT = 768`(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
```

## Why it matters for ORIVILO

Collapse here is a remembered, keyboard-reachable state. The file does not check whether focus is in a text field before it takes the key: the condition above is the whole test as read. ORIVILO's board already binds `panel.toggle-library` to Mod+B (DESIGN.md, Inspector row), so the same keys are taken.
