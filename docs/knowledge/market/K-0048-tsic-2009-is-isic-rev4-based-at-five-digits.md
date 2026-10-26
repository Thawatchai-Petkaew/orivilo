---
id: K-0048
topic: market
claim: Thailand's industrial classification TSIC 2009 follows ISIC Rev.4 and has 5 levels; the NSO standard states 21 sections, 88 divisions, 243 groups, 441 classes and 1,091 five-digit industries. Leaving out divisions 84, 97, 98 and 99 leaves 18, 84, 236, 430 and about 1,065.
source: "https://catalogapi.nso.go.th/api/doc/department/D08/SD08_08/SD08_08_47_12.pdf; https://catalogapi.nso.go.th/api/doc/department/D08/SD08_08/SD08_08_47_18.xlsx; https://catalog.nso.go.th/en/dataset/0210_12_0009; https://catalogapi.nso.go.th/api/doc/department/D08/SD08_08/SD08_08_56_1.pdf; https://worldoftaxonomy.com/system/tsic_2009; https://openapi.dbd.go.th/juristic_person/registration/99_202501_1.csv; https://unstats.un.org/unsd/classifications/Econ/Download/In Text/ISIC_Rev_4_english_structure.Txt"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-127]
license: own-words
---

## Evidence

Confidence is 0.8 for the per-level counts and the ISIC Rev.4 basis: both are read from the text of an NSO standard (document `SD08_08_47_12`), and the five-digit list was counted from an NSO workbook. The standard and the workbook have one publisher, NSO, so they count as one source, which the README caps at 0.8; worldoftaxonomy.com confirms only the ISIC Rev.4 basis and the section count, not the counts below it. The workbook count (1,089) and the stated count (1,091) also differ by two, and the brand-relevant five-digit count is approximate. The point on ISIC Rev.5 and the DBD code reading stay inferences, below 0.7, in the last section.

### What the NSO standard states (read directly)

NSO document `SD08_08_47_12` is the statistical production standard for the variable "industry" (อุตสาหกรรม), owned by the NSO statistical standards group. Its text was extracted from the PDF on 2026-10-26 (ORV-127 comment 10200). In our words:

- The classification it references is the Thailand Standard Industrial Classification of 2552 (2009), and the international standard it references is ISIC Rev.4 of UNSD. The description sheet gives its latest revision as 2561 (2018), version 1.0.
- The code has the form "12345": five digits for five levels, with the top level shown as a letter.
- Level 1, section: 21 sections, letters A to U.
- Level 2, division: 88 divisions, digits 1 to 2.
- Level 3, group: 243 groups, digits 1 to 3.
- Level 4, class: 441 classes, digits 1 to 4.
- Level 5, industry: 1,091 industries, digits 1 to 5. The document says this level is defined by Thailand itself, below the class.

The same five counts appear twice in the document: on the description sheet (page 10 of the PDF) and in the body text on code structure (pages 39 to 40), where it also says TSIC uses the rules and structure of ISIC Rev.4.

Groups (243) and classes (441) are more than ISIC Rev.4 has (238 and 419; [[K-0047-isic-rev4-and-rev5-counts-per-level]]), so TSIC 2009 adds Thai groups and classes, not only a fifth digit. Sections and divisions match.

### Five-digit count from the NSO workbook (counted, open point)

The NSO comparison workbook `SD08_08_47_18.xlsx` lists 1,089 distinct five-digit codes when counted (ORV-127 comment 10200). That is two fewer than the 1,091 the standard states. The cause is not known: the workbook may omit codes, or the stated count may include codes the workbook drops. Open point; it was not resolved in this entry.

### Brand-relevant counts (derived)

Divisions 84 (public administration and defence, the whole of section O), 97 and 98 (households as employers and producers, section T) and 99 (extraterritorial organisations, section U) hold no brandable business. Taking them out gives 18 sections and 84 divisions. Taking out their groups and classes gives 236 groups and 430 classes, which matches 7 groups and 11 classes under those divisions in ISIC Rev.4; that TSIC does not split them further is an assumption checked only against the orchestrator's count on ORV-127 comment 10200. The five-digit figure is about 1,065, counted from the workbook, so it carries the same two-code gap as above.

### What the NSO catalog page states (read directly)

The NSO correspondence-table dataset (catalog `0210_12_0009`, publisher กองนโยบายและวิชาการสถิติ) describes itself as a table linking:

> (Thailand Standard Industrial Classification : TSIC 2009)

to ISIC Rev 3.0, in Thai. The catalog shows "Last Updated" June 9, 2026 and an update frequency of every 5 years. It gives no counts per level and does not mention ISIC Rev.4.

### What search excerpts of NSO PDFs say (not read directly)

- An NSO document (`SD08_08_56_1`, the 2009 TSIC manual, and a 2021 revised edition published by the NSO statistical standards group) names ISIC Rev.4 (2008) as the version used to build TSIC 2009, prepared with the Department of Employment.
- An NSO document is quoted in search results as saying TSIC is made at the 5-digit level, referencing ISIC Rev.4 of UNSD, adapted to Thai conditions.
- The revised manual's contents list a structure section (page 21) and a detailed structure (page 23); those pages were not read. The counts above come from `SD08_08_47_12` instead.

### Third-party page (read directly)

worldoftaxonomy.com lists TSIC 2009 as "ISIC Rev. 4 based", authority "National Statistical Office Thailand (NSO)", with 21 top-level sections. It shows no counts below the section level.

### DBD data uses 5-digit codes (read directly)

The DBD new-registration file for January 2568 (2025) has a numeric column `รหัสวัตถุประสงค์`. Every value our fetch tool saw had 5 digits, for example `86202` with the text `กิจกรรมคลินิกโรคเฉพาะทาง` and `55101` with `ประกอบกิจการโรงแรม ภัตตาคาร บาร์ ไนท์คลับ`. That the column holds TSIC 2009 subclass codes is an inference from the shape and the first four digits matching ISIC Rev.4 classes (UNSD Rev.4 structure file: 8620 "Medical and dental practice activities", 5510 "Short term accommodation activities"); the data page does not name TSIC. See [[K-0049-dbd-new-registrations-open-data-by-objective-code]].

### What we infer (below 0.7)

- An earlier version of this entry inferred that TSIC 2009 matches ISIC Rev.4 at the first four levels. The NSO counts above show that is wrong at the group and class levels (243 and 441 against 238 and 419).
- No TSIC version based on ISIC Rev.5 was found. Searches on 2026-10-26 found no NSO announcement, draft or timeline for a TSIC based on ISIC Rev.5. Absence in search results is weak evidence; NSO's statistical standards pages (statstd.nso.go.th) were not reached.

## Why it matters for ORIVILO

ORV-127 can only rank categories by Thai registrations if its taxonomy joins to the code DBD records. If DBD records TSIC 2009 codes, a taxonomy built on ISIC Rev.4 joins directly, while one built on ISIC Rev.5 needs a Rev.4 to Rev.5 correspondence first. Because TSIC adds groups and classes of its own, a join on ISIC Rev.4 codes needs a TSIC to ISIC correspondence at levels 3 and 4, not only at level 5. The TSIC reading of the DBD code still needs checking before a decision.
