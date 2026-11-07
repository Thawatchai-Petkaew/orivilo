---
id: K-0386
topic: design
claim: Untitled UI React is MIT and declares `react-aria-components` ^1.21.1, `react-aria` ^3.52.1 and `@internationalized/date` ^3.12.4; on `main` of its own repository `react-aria-components` reads 1.22.1 under Apache-2.0 and `@internationalized/date` reads 3.12.4 under Apache-2.0, and the install step names `@react-aria/i18n` while Untitled's package.json does not list it.
source: "https://raw.githubusercontent.com/untitleduico/react/main/package.json; https://raw.githubusercontent.com/untitleduico/react/main/LICENSE; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/package.json; https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/%40internationalized/date/package.json; https://www.untitledui.com/react/components/date-pickers.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-231]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, each from the project's own repository on `main`, no commit hash shown. A version on `main` may be ahead of what is published; npm was not read for these two.

Untitled's `package.json`: `@untitledui/react` 0.0.0, MIT. It declares `react-aria-components` ^1.21.1, `react-aria` ^3.52.1, `@internationalized/date` ^3.12.4 and `@react-stately/utils` ^3.12.1.

Each project's own `package.json`: `react-aria-components` 1.22.1, Apache-2.0; `@internationalized/date` 3.12.4, Apache-2.0.

> MIT License

> Copyright (c) 2025 Untitled UI

`react-aria-components` 1.22.1 depends on `@internationalized/date` ^3.12.4, `@internationalized/string` ^3.2.10, `@react-types/shared` ^3.37.0, `@swc/helpers` ^0.5.0, `client-only` ^0.0.1, `react-aria` 3.53.1, `react-stately` 3.51.0 and `use-sync-external-store` ^1.6.0. `@internationalized/date` depends on `@swc/helpers` ^0.5.0.

The page's manual install names `@internationalized/date` and `@react-aria/i18n`; Untitled's `package.json` lists `@react-aria/utils` and no `@react-aria/i18n`.

## Why it matters for ORIVILO

This is the dependency cost of the React Aria route. None of these packages is in our `pnpm-lock.yaml` (K-0394), and our behaviour layer today is `radix-ui`.
