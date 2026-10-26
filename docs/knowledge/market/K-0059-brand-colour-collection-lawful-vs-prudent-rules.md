---
id: K-0059
topic: market
claim: Research judgment, not a legal opinion, that recording a brand's hex colours with its name, category, source URL and date is likely lawful in Thailand as a record of facts, and that the remaining risk lies in how the colours are collected, which a short list of collection rules per channel can keep low.
source: "docs/knowledge/market/K-0052-thai-copyright-excludes-facts-ideas-and-protects-compilation-selection.md; docs/knowledge/market/K-0053-thai-trademark-mark-includes-group-of-colours.md; docs/knowledge/market/K-0054-thai-computer-crime-act-access-and-disruption-offences.md; docs/knowledge/market/K-0055-thai-pdpa-covers-natural-persons-not-companies.md; docs/knowledge/market/K-0056-robots-txt-rfc-9309-is-not-access-authorization.md; docs/knowledge/market/K-0057-eu-database-terms-and-tdm-opt-out.md; docs/knowledge/market/K-0058-us-facts-free-and-scraping-cases.md"
retrieved: 2026-10-26
confidence: 0.5
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice, and confidence 0.5: this entry is our reading across [[K-0052-thai-copyright-excludes-facts-ideas-and-protects-compilation-selection]] to [[K-0058-us-facts-free-and-scraping-cases]]. It is a lead for the architect and the owner, not grounds for a decision. Each point marked "lawyer" should be checked by a Thai lawyer before the automated channel goes live.

### What looks lawful (inferred)

- **The record itself.** A hex value tied to a brand name, category, URL and date is a fact (K-0052, section 7(1)), not trademark use (K-0053), and not personal data when the brand is a company (K-0055).
- **Hand collection** by a person who opens a public page and notes the colour, as any visitor can.
- **Reading public, logged-out pages** with no block to get past (K-0054, sections 5 and 7).

### Where the risk is (inferred)

- Copying a logo, screenshot, photo or stylesheet into storage: those can be works (K-0052).
- Getting past a login, paywall, CAPTCHA or IP block (K-0054); reading while logged into an account bound by terms (K-0058).
- Load that slows a site (K-0054, section 10).
- Ignoring a site's terms or machine-readable opt-out, which counts in the EU and in US contract claims (K-0056, K-0057, K-0058). Whether Thai courts enforce terms a visitor never accepted: lawyer.
- Sole-trader brands and personal social accounts as sources, which bring in the PDPA (K-0055). Lawful basis and notice: lawyer.
- Publishing the lineup in a way that implies a brand endorses ORIVILO, or showing logos next to it.
- Whether one colour alone is registrable in Thailand, which matters for advice to customers, not for collection: lawyer (K-0053).

### Collection rules ORIVILO could adopt (options, not decided)

Lineage: the owner adopted rules based on this list as ORV-127 R1 to R15 under decision D1 (ORV-127 comment 10201; `docs/specs/ORV-127/spec.md`). The adopted text lives in the spec; this list stays the research lead it came from, at 0.5.

For every channel:

1. Store the hex value, its role if known (primary, secondary, background), brand name, category code, source URL, the date read, the channel, and who or what read it. No logo, image, screenshot or page copy is stored.
2. Store whether the brand is a juristic person; store no names of natural persons, and skip personal social accounts as sources.
3. A removal path: a brand can ask for its record to be removed or corrected, with a recorded outcome and date.
4. Show lineups as facts with their source and date, with no logos and no wording that suggests endorsement.

For hand collection (curated):

5. The curator reads the official site or the brand's own official channel, notes the URL and date, and records nothing behind a login.

For automated reading of official websites:

6. Read robots.txt first, honour disallow for the reader's own product token and for `*`, re-read it at most every 24 hours, and stop on a 5xx (K-0056).
7. Name the reader in its user agent with a contact URL.
8. Rate-limit per host (for example one request every few seconds and a small cap per site per day; the number is a design choice, not from a source) and back off on 429 or 503.
9. Read logged-out public pages only. Never log in, make an account, solve a CAPTCHA or rotate IPs to avoid a block.
10. Skip a site whose terms forbid automated access or whose machine-readable opt-out reserves text and data mining (K-0057). Checking terms by hand for the largest sites, or a deny list, are both options.
11. Read the page or stylesheet in memory, keep only the extracted values, and discard the rest.

For user-named competitors:

12. The user names a brand or URL; ORIVILO reads it under rules 6 to 11, so a user cannot steer the reader around them.
13. Treat the user's text as untrusted input (AGENTS.md); validate the URL and never fetch private or internal addresses.
14. Keep records from this channel tied to the requesting workspace unless the same fact is confirmed by another channel; whether to share them across customers is a decision for the owner.

## Why it matters for ORIVILO

ORV-127 wants lineups gathered as widely as possible through three channels. The law seems to allow the record; the collection rules above are what make the automated and user channels defensible, and they are cheap to build in from the start.
