---
id: K-0106
topic: design
claim: Lead, not grounds for a decision: an informal 2017 browser test on the SuttaCentral forum found clipping at line-height 1.1 in seven tall scripts, Thai among them, and that a minimum of 1.6 solved it, with fonts as the biggest cause of variation; Thai was not reported separately.
source: "https://discourse.suttacentral.net/t/testing-for-line-height-with-tall-scripts/6196 (sujato, 2017-08-15)"
retrieved: 2026-10-31
confidence: 0.5
applies_to: [ORV-192]
license: link-only
---

## Evidence

> "In the cases I have tested, all of these scripts display clipping problems at a line height of 1.1."
> "Setting line-height to a minimum of 1.6 solves this."

The author calls the test "by no means authoritative", used texts at hand, says results may vary by browser and OS but that fonts are the biggest source of variation, and suggests using @font-face to be sure. With Noto Sans, Roman descenders also clipped at 1.1.

Confidence 0.5: one forum post by its author's own account informal, with no font named per script, no Thai result on its own, and no test of values between 1.1 and 1.6. It is a lead for a rendered test of Sarabun, not a figure.

## Why it matters for ORIVILO

It points at what to test: whether Sarabun's above-base vowel and tone-mark stacks clip or touch the line above at the line heights ORIVILO sets.
