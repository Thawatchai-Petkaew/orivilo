---
id: K-0052
topic: market
claim: The Thai Copyright Act B.E. 2537 does not protect ideas, systems or methods (section 6) or facts that are mere information (section 7(1)), and protects a compilation only for a selection or arrangement that is not an imitation of another's (section 12).
source: "https://en.wikisource.org/wiki/Translation:Copyright_Act,_2537_BE; https://www.tilleke.com/wp-content/uploads/2013/06/2013_Jun_International_Copyright-Law_Thailand_Excerpt.pdf; https://www.wipo.int/wipolex/zh/legislation/details/15713"
retrieved: 2026-10-26
confidence: 0.75
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice. This entry records what the statute text says, read through an unofficial English translation, and one law-firm summary that agrees on section 12. The official Thai text in the Royal Gazette was not read; a lawyer should confirm the current wording, since the Act has been amended several times (WIPO Lex lists the Copyright Act (No. 2) B.E. 2558 among them).

From the Wikisource translation (released by its translator into the public domain):

> Copyright protection does not extend to ideas; or procedures, processes, or systems;

> The following things are not deemed copyrighted works under this Act:

Item (1) of section 7 is "news of the day and facts characteristic of mere information", unless they are literary, scientific or artistic works. Section 12 begins "When any work bears a characteristic of having been compiled or assembled from copyrighted works", and gives the compiler copyright only in a selection or arrangement that does not imitate another's, without affecting the underlying authors' rights. The Tilleke and Gibbins excerpt reads section 12 as the route for "collections or compilations of data, whether in machine-readable form or on other devices".

No source read names a Thai database right separate from copyright (like the EU sui generis right in [[K-0057-eu-database-terms-and-tdm-opt-out]]). That absence is not confirmed; it needs a lawyer.

### Inference, below 0.7

- A record "brand X uses hex #RRGGBB, category C, seen at URL U on date D" reads as a fact in the sense of section 7(1), not a work. We infer it is free of copyright; no Thai court decision on colour values was found.
- The page, CSS file, logo or photo the value was read from can be a work. Copying it into storage is a different act from recording the value.
- ORIVILO's own lineup database could gain section 12 protection through its selection and arrangement; the same rule means a competitor's curated colour list is protected in its selection, though not in its single facts.

## Why it matters for ORIVILO

ORV-127 wants to store brand colours as facts. The statute separates facts from works, so the safe line is to store the value and its source, and never the page, logo or image it came from.
