---
id: K-0058
topic: market
claim: In the US, facts cannot be copyrighted and raw facts in a compilation may be copied (Feist, 1991), yet scraping cases turn on contract, as hiQ was found in breach of LinkedIn's User Agreement in 2022 while Meta v. Bright Data (2024) found no breach by logged-off scraping of public data.
source: "https://www.law.cornell.edu/supremecourt/text/499/340; https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn; https://www.fbm.com/technology/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/; https://www.lowenstein.com/media/gikmre11/20240215-im-meta-v-bright-data-ruling-has-important-implications-for-webscraping-activities-by-investment-advisers.pdf"
retrieved: 2026-10-26
confidence: 0.75
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice. Feist was read in the opinion text. The two scraping cases were read through an encyclopedia page and law-firm summaries, not the rulings; they are trial and appeal-level US decisions, recorded only because Thai sources are silent on scraping public sites.

### Feist Publications v. Rural Telephone, 499 U.S. 340 (27 March 1991)

> That there can be no valid copyright in facts is universally understood.

The opinion adds that in a factual compilation "the raw facts may be copied at will", as long as the selection and arrangement are not copied.

### hiQ Labs v. LinkedIn

The Ninth Circuit affirmed its earlier ruling in April 2022 (the 2019 injunction had barred LinkedIn from denying hiQ access to public profile data). In November 2022 the district court "ruled that hiQ had breached LinkedIn's User Agreement", and the parties settled.

### Meta Platforms v. Bright Data (N.D. Cal., 23 January 2024)

Summaries report the court held that Bright Data did not "use" Facebook or Instagram under Meta's terms when it scraped public data while logged off, so there was no breach. One summary notes Bright Data had accounts bound by those terms, and the ruling does not cover scraping while logged in. Whether an appeal changed the outcome was not checked.

### Inference, below 0.7

The US pattern is: a fact is free, but how you got it can still breach a contract you accepted. A reader that never logs in, never makes an account on the target site and never accepts its terms is on the safer side of these cases.

## Why it matters for ORIVILO

It confirms from a second legal system that a colour value is a free fact, and shows the live risk is contract and access, not copyright. The automated channel should read only logged-out public pages.
