---
id: K-0057
topic: market
claim: In the EU, the CJEU held in Ryanair v PR Aviation (C-30/14, 15 January 2015) that the Database Directive does not stop a site from limiting use of an unprotected database by contract, and the DSM Directive 2019/790 lets rightholders opt out of the general text and data mining exception by an express reservation, such as machine-readable means for content online.
source: "https://www.medialaws.eu/ecj-clarifies-database-directive-scope-in-screen-scraping-case/; https://legalblogs.wolterskluwer.com/copyright-blog/the-new-copyright-directive-text-and-data-mining-articles-3-and-4/; https://www.garrigues.com/en_GB/garrigues-digital/ai-and-copyright-machine-readable-machine-actionable-opt-out-tdm-question"
retrieved: 2026-10-26
confidence: 0.7
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice. EUR-Lex returned an empty page here, so the directives and the judgment were read through commentary only; confidence 0.7. Thai sources are silent on these points, which is why the EU is recorded as a comparison. Whether any of it applies to ORIVILO (a Thai service that may read EU brands' sites) needs a lawyer.

### Ryanair v PR Aviation

A commentary (Federica De Santis, 5 March 2015) reports the CJEU held that "the Database Directive is not applicable to databases which are not protected either by copyright" or by the sui generis right. Search results describe the facts: Ryanair's terms, accepted by ticking a box, forbade screen scraping for commercial purposes, and the Court left the site free to enforce such terms by contract.

### Text and data mining (DSM Directive)

P. Bernt Hugenholtz (IViR, 24 July 2019) quotes the definition in Article 2(2):

> any automated analytical technique aimed at analysing text and data in digital form in order to generate information

and the Article 4(3) condition that rights are not reserved "in an appropriate manner, such as machine-readable means in the case of content made publicly available online". Search results report that what counts as machine-readable (robots.txt, metadata, terms in prose) is being argued in German courts (the LAION case) and that a CJEU reference, C-250/25, is pending; these were not read.

### Inference, below 0.7

- Reading a hex value off a brand page is close to text and data mining. Where it is, an EU site's machine-readable opt-out (for example in robots.txt) is a reason to skip that site.
- The sui generis right protects the maker of a database with substantial investment; a single brand's colour palette on its own site is unlikely to be such a database, but this was not checked.

## Why it matters for ORIVILO

The EU treats a site's terms and machine-readable opt-outs as meaningful even for unprotected data. Honouring robots.txt and terms that forbid automated reading costs ORIVILO little and covers the stricter regime.
