---
id: K-0051
topic: market
claim: Recommendation, not a measured fact, that the ISIC Rev.4 class level read through TSIC 2009 (408 classes after the three exclusions) is the nearest standard level to where customers compare competitors, and that DBD new registrations can rank it by counting the first four digits of each objective code.
source: "docs/knowledge/market/K-0047-isic-rev4-and-rev5-counts-per-level.md; docs/knowledge/market/K-0048-tsic-2009-is-isic-rev4-based-at-five-digits.md; docs/knowledge/market/K-0049-dbd-new-registrations-open-data-by-objective-code.md; docs/knowledge/market/K-0050-gics-classifies-companies-for-investors.md; https://unstats.un.org/unsd/classifications/Econ/Download/In Text/ISIC_Rev_4_english_structure.Txt"
retrieved: 2026-10-26
confidence: 0.6
applies_to: [ORV-127]
license: own-words
---

Superseded by ORV-127 comments 10199 and 10200 and the ORV-127 spec (`docs/specs/ORV-127/spec.md`). The text below is kept as the earlier lead; three statements in it were corrected on 2026-10-26 to match [[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]].

## Evidence

This entry is research judgment built on [[K-0047-isic-rev4-and-rev5-counts-per-level]], [[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]], [[K-0049-dbd-new-registrations-open-data-by-objective-code]] and [[K-0050-gics-classifies-companies-for-investors]]. Confidence is 0.6: it rests on an inference about where customers compare. K-0048, at 0.8, gives the TSIC counts. It is a lead for the architect, not grounds for a decision. The counts are exact; the choice among them is not.

### The counts per option (from K-0047 and K-0050)

- ISIC Rev.4, after excluding public administration (O), households (T) and extraterritorial bodies (U): 18 sections, 84 divisions, 231 groups, 408 classes.
- TSIC 2009 after the same exclusions: 18 sections, 84 divisions, 236 groups, 430 classes, and about 1,065 five-digit subclasses (K-0048; the NSO standard states 1,091 subclasses in all, and the NSO workbook lists 1,089).
- ISIC Rev.5 after the same exclusions (P, U, V): 19 sections, 83 divisions, 251 groups, 451 classes.
- GICS, whole scheme: 11 sectors, 25 industry groups, 74 industries, 163 sub-industries; no exclusion applies.

### How the levels behave, using rows from the Rev.4 structure file

These are our readings of example rows, to show the grain; they are not a full audit.

- Division is too coarse for retail and food: "Retail trade, except of motor vehicles and motorcycles" (47) is one division and "Food and beverage service activities" (56) is one division, while a customer compares a pharmacy with a pharmacy and a cafe with a cafe.
- Group still mixes unlike consumer categories in places: group 477 "Retail sale of other goods in specialized stores" holds 4771 (clothing, footwear and leather articles), 4772 (pharmaceutical and medical goods, cosmetic and toilet articles), 4773 (other new goods) and 4774 (second-hand goods).
- Class separates most of these, but some classes stay broad, for example 1079 "Manufacture of other food products n.e.c." and 4773 "Other retail sale of new goods in specialized stores". Restaurants (5610) and beverage serving (5630) are each one class, so a cafe and a bar share a class. The TSIC 5th digit is the documented place to split such classes, once its subclass list is read.
- The Rev.4 class 4791 "Retail sale via mail order houses or via Internet" matches what DBD's own releases track as "ขายปลีกทางอินเทอร์เน็ต" (K-0049), though DBD's mapping is not stated. UNSD material reported by search says Rev.5 removes the in-store versus online split (not checked; K-0047).

### Why Rev.4 class through TSIC, as a recommendation (below 0.7)

- It joins Thai data: if the DBD code is a TSIC 2009 subclass, its first four digits are the TSIC class (inferred, K-0048 and K-0049). TSIC has 441 classes against 419 in ISIC Rev.4, so TSIC adds classes of its own, and a join on Rev.4 classes needs a TSIC to ISIC correspondence at the class level (K-0048).
- 408 classes is a count the phase can plan against; Rev.5 class (451) is the current international standard but needs a Rev.4 to Rev.5 mapping before Thai data ranks it.
- GICS (163 sub-industries) is smaller and recognisable to investors, but it is trademarked, groups many small consumer services together, and has no Thai formation data keyed to it (K-0050).

### How a ranking could be counted (method, not run)

For each monthly DBD file over a chosen window (for example the last 12 months), take `รหัสวัตถุประสงค์`, keep the first four digits, drop codes in the excluded divisions (84, 97, 98, 99), and count rows per class. This was not run; no ranking exists yet. The limits in K-0049 apply: juristic persons only, one code per company, and a registration is not always a new brand.

### Other options a decision-maker may weigh (not ranked)

- Rev.4 group level (231) for fewer lineups, splitting only the groups that mix consumer categories.
- A hybrid: class level in consumer-facing sections (for example C food, beverages, apparel, cosmetics; G retail; I accommodation and food; P education; Q health; R, S personal and leisure services) and division level elsewhere. Not counted here.
- Further exclusions beyond the three in the envelope (for example mining support or sewerage), which this entry does not make.

## Why it matters for ORIVILO

ORV-127 phase 0 needs a taxonomy, its size and a ranking source. This entry lays out the counts per level and one recommended combination with its reasons, so the architect or owner can pick the level knowing what each costs in lineups and whether Thai data can rank it.
