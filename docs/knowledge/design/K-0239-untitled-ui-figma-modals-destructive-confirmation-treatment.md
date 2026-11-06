---
id: K-0239
topic: design
claim: Untitled UI's Figma modals page describes simple confirmations in standard, warning and destructive versions, says a destructive confirmation takes a red primary button, a warning icon treatment and a title that names the consequence ("Delete 3 projects?"), gives action rows in horizontal, vertical and full-width arrangements with an optional leading checkbox ("Don't ask me again"), sets each layout at 1,440px and 375px, and lists 3 components and 252 variants (company-reported).
source: "https://www.untitledui.com/components/modals"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-226]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns quotes in short pieces. This is Untitled UI's own page about its Figma set; the figure "3 components + 252 variants" is the company's and was not counted here.

> Modals earn their interruption in two cases: a decision that can't wait (usually confirming something destructive)

> The set covers an unreasonable amount of ground: simple confirmations in standard, warning, and destructive versions,

> The destructive versions matter most: a red primary action and a distinct icon treatment make
> "Delete project" feel different from "Save changes" before anyone reads a word.

> Yes. A destructive confirmation should look different before it reads different: red primary button,
> warning icon treatment, and a title that names the consequence
> ("Delete 3 projects?").

> The modal header comes in left-aligned, center-aligned, and horizontal versions,
> the actions row handles the button arrangements: horizontal, vertical, full-width fills,
> an optional leading checkbox ("Don't ask me again"), and destructive variants of each,
> with separate desktop and mobile alignments.

> Every layout exists in a 1,440px desktop context and a 375px mobile version,

On behaviour the page says only this; it does not say where focus lands first, and it names no pending or failure state:

> In production the same dialog needs a focus trap and Escape-to-close, per the W3C dialog pattern,

## Why it matters for ORIVILO

This is the one Untitled page read that speaks to a confirmation directly: impact goes in the title, and the destructive path must look different from the safe one. The audit's row for ConfirmDialog says Untitled has none, which this page does not match (open point in K-0259).
