---
id: K-0272
topic: design
claim: Radix Primitives has no file input, upload or dropzone primitive; none of the 54 @radix-ui/react-* dependencies of the radix-ui package (own count) names one, and its nearest parts are Progress and Form.
source: "https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/radix-ui/package.json; https://www.radix-ui.com/primitives/docs/components/progress; https://www.radix-ui.com/primitives/docs/components/form; .claude/rules/design-system.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: MIT
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes. The package file is read on `main`, not pinned to a commit.

Count: 54 entries matching `@radix-ui/react-` under `dependencies` in `packages/react/radix-ui/package.json`, counted from the list the fetch returned. The one name holding "drop" is `@radix-ui/react-dropdown-menu`; no name holds "file" or "upload". The list holds `@radix-ui/react-form`, `@radix-ui/react-progress`, `@radix-ui/react-label`, `@radix-ui/react-toast` and `@radix-ui/react-visually-hidden`.

The Form page does not mention file inputs (K-0274).

Unread: `https://www.radix-ui.com/llms.txt` returned 404, and the docs overview page came back without its sidebar, so the claim rests on the package file, not on a docs component list.

## Why it matters for ORIVILO

`.claude/rules/design-system.md` says behaviour comes from the `radix-ui` package. For file picking and dropping it has none, so that behaviour would come from the browser's input or from code written here.
