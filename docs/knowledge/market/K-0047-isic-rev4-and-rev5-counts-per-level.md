---
id: K-0047
topic: market
claim: UNSD lists ISIC Rev.4 at 21 sections, 88 divisions, 238 groups and 419 classes and its successor ISIC Rev.5 (adopted 2024) at 22 sections, 87 divisions, 258 groups and 463 classes; dropping public administration, households and extraterritorial bodies leaves 18, 84, 231 and 408 in Rev.4 and 19, 83, 251 and 451 in Rev.5.
source: "https://unstats.un.org/unsd/classifications/Family/Detail/27; https://unstats.un.org/unsd/classifications/Family/Detail/2095; https://unstats.un.org/unsd/classifications/Econ/Download/In Text/ISIC_Rev_4_english_structure.Txt; https://unstats.un.org/unsd/classifications/Econ/Download/In Text/ISIC_Rev_5_english_structure.csv; https://unstats.un.org/unsd/classifications/Econ/isic"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-127]
license: own-words
---

## Evidence

All figures come from one publisher, the UN Statistics Division (UNSD), read on its classification registry and in its structure files, so this counts as one source read and quoted (cap 0.8). The UNSD pages carry no reuse license, so the text is in our words with short quotes.

### Counts per level, as UNSD states them

ISIC Rev.4 registry page (Family/Detail/27), items per level:

> Section ... 21 items; Division ... 88 items; Group ... 238 items; Class ... 419 items

The same page marks Rev.4 as superseded: "The current version is ISIC Rev. 5."

ISIC Rev.5 registry page (Family/Detail/2095), "Year Adopted: 2024", items per level:

> Section ... "22"; Division ... "87"; Group ... "258"; Class ... "463"

The ISIC page (Econ/isic) says the Statistical Commission "endorsed revision 5 of ISIC" at its 54th session in 2023 and that "The ISIC Rev.5 publication is currently undergoing copyediting and preparation for publication." The structure is downloadable as CSV and as an XLSX with explanatory notes.

### What changed between the two, as the structure files show

- Rev.4 section J "Information and communication" is split in Rev.5 into J (publishing, broadcasting, content production and distribution; divisions 58 to 60) and K (telecommunications, computer programming, computing infrastructure; divisions 61 to 63). Every later section letter moves one step: Rev.4 K to U become Rev.5 L to V.
- Rev.5 section G "Wholesale and retail trade" holds divisions 46 and 47 only. Rev.4 G is "Wholesale and retail trade; repair of motor vehicles and motorcycles" with divisions 45, 46 and 47. UNSD workshop material (found by search, PDF not readable by our fetch tool) says Rev.5 removes the in-store versus online retail split; that point is not checked here.

### The three excluded sections, row by row

The envelope excludes public administration, households as employers and extraterritorial bodies. Their rows in each structure file:

- Rev.4 O (division 84): groups 841, 842, 843; classes 8411, 8412, 8413, 8421, 8422, 8423, 8430 (7).
- Rev.4 T (divisions 97, 98): groups 970, 981, 982; classes 9700, 9810, 9820 (3).
- Rev.4 U (division 99): group 990; class 9900 (1).
- Rev.5 P (division 84): groups 841, 842, 843; classes 8411, 8412, 8413, 8414, 8421, 8422, 8423, 8430 (8).
- Rev.5 U (divisions 97, 98): groups 970, 981, 982; classes 9700, 9810, 9820 (3).
- Rev.5 V (division 99): group 990; class 9900 (1).

### Counts after the exclusion (our arithmetic on the UNSD totals)

- Rev.4: 21 minus 3 is 18 sections; 88 minus 4 is 84 divisions; 238 minus 7 is 231 groups; 419 minus 11 is 408 classes.
- Rev.5: 22 minus 3 is 19 sections; 87 minus 4 is 83 divisions; 258 minus 7 is 251 groups; 463 minus 12 is 451 classes.

The subtraction is exact against the UNSD totals and the rows above. Our fetch tool also tallied 462 classes from the Rev.5 CSV by hand; the registry page states 463, and the registry figure is the one used here.

### What this entry does not settle

- Which level is the one where customers compare competitors. That is a judgment, recorded separately with low confidence in [[K-0051-brand-category-cut-off-options]].
- Other sections that build few consumer or B2B brands (for example 09 mining support, 37 sewerage) are not excluded here; only the three named in the envelope are.

## Why it matters for ORIVILO

ORV-127 needs a fixed list of brand categories and its size. These are the official counts per level for the international classification Thailand's TSIC follows, so any cut-off the architect picks can be counted from them rather than estimated.
