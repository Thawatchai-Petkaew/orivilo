---
id: K-0232
topic: design
claim: WCAG 2.2 SC 2.4.1 Bypass Blocks (Level A) asks for a way past blocks repeated on multiple pages; sufficient techniques include a skip link (G1, G123, G124) and, for grouping, ARIA landmarks (ARIA11), headings at section starts (H69) and an expandable and collapsible menu (SCR28).
source: "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html; apps/web/app/layout.tsx"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

> A mechanism is available to bypass blocks of content that are repeated on multiple web pages.

The intent is to:

> allow people who navigate sequentially through content more direct access to the primary content of the web page.

Sufficient techniques listed: G1 (a link near the top of each page straight to the main content), G123 (a link at the start of a repeated block to its end), G124 (links at the top to each content area); and to group repeated material, ARIA11, H69, PDF9, H64, SCR28.

The intent text does not discuss landmarks or headings directly; they appear in the techniques.

## Why it matters for ORIVILO

A sidebar is a repeated block. No fetched text from the library pages named a skip link, and the repo's `apps/web` has none (no match for `skip` or `main-content` in its `.tsx` files), so a `main` landmark and the h1 are what stand there now.
