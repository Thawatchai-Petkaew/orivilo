---
name: webapp-testing
description: Drive the local app with Playwright to verify a flow, capture screenshots for a gate packet, or read console errors. Use when an acceptance criterion needs the browser, when visual QA is required, and before raising G3 or G4 with UI changes.
license: Adapted from anthropics/skills webapp-testing (Apache 2.0, see LICENSE.txt)
---

# Web app testing

Adapted from Anthropic's `webapp-testing` skill, in TypeScript to match the repo.

## Reconnaissance, then action

1. Start the app (`pnpm dev`, or `pnpm build && pnpm --filter @orivilo/web start` for production behavior).
2. Navigate and wait for `networkidle` before reading the DOM. Inspecting earlier is the common mistake.
3. Screenshot or list elements (`page.getByRole(...)`) to find selectors from the rendered state.
4. Act with the discovered selectors. Prefer role and text selectors over CSS paths.

```ts
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors: string[] = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto("http://localhost:3000");
await page.waitForLoadState("networkidle");
await page.screenshot({ path: "artifacts/home.png", fullPage: true });
await browser.close();
```

## Rules

- Wait for conditions, never fixed timeouts (`.claude/rules/testing.md`).
- Always close the browser.
- Attach screenshots and the console error list to the gate packet. A visual check the owner must confirm is reported as "owner-verify", never as passed.
- Permanent e2e tests live in `apps/web/e2e/` with `@playwright/test`; this skill is for exploration and evidence.
