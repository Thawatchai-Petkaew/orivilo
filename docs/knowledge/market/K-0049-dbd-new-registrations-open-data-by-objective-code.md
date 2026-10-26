---
id: K-0049
topic: market
claim: DBD publishes, under an open license, a monthly CSV of every newly registered juristic person since January 2022 with a 5-digit objective code and its text, so new registrations can be counted per business type; its summary dataset is by province only, and its own releases rank only a few headline business types.
source: "https://opendata.dbd.go.th/en/dataset/dataset_11_01; https://opendata.dbd.go.th/en/dataset/dataset_11_01/resource/b7670279-5a85-48b5-9cc0-93c77dac4ee5; https://openapi.dbd.go.th/juristic_person/registration/99_202501_1.csv; https://opendata.dbd.go.th/en/dataset/dataset_12_01; https://opendata.dbd.go.th/en/dataset/dataset_11_03; https://www.thaipost.net/economy-news/1000452/"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-127]
license: own-words
---

## Evidence

Every DBD fact comes from one publisher (the Department of Business Development, กรมพัฒนาธุรกิจการค้า) read on its open-data portal and in one of its files, so this is one source read and quoted (cap 0.8). The portal license is "Open Data Common", which is not on the README list, so this file is in our words with short quotes. **Using new registrations as a measure of new-brand formation is an inference, below 0.7** (see the last section).

### The record-level dataset: นิติบุคคลจดทะเบียนตั้งใหม่ (`dataset_11_01`)

The description opens:

> รายชื่อนิติบุคคลที่จดทะเบียนตั้งใหม่ประจำเดือน เป็นข้อมูลจากการรับจดทะเบียนตั้งใหม่ของนิติบุคคลทั่วประเทศ

- One CSV per month, January 2022 to September 2026 (57 monthly resources when read), updated monthly. Access is unrestricted; license "Open Data Common".
- The data dictionary of the January 2568 resource lists the columns `เลขทะเบียน`, `ชื่อนิติบุคคล`, `วันที่จดทะเบียน`, `ทุนจดทะเบียน`, `รหัสวัตถุประสงค์` (numeric), `วัตถุประสงค์`, `ที่ตั้งสำนักงานใหญ่`, `ตำบล`, `อำเภอ`, `จังหวัด`, `รหัสไปรษณีย์`.
- The file downloads from `openapi.dbd.go.th/juristic_person/registration/99_202501_1.csv` (about 4.4 MB for that month). Sample rows: `86202` with `กิจกรรมคลินิกโรคเฉพาะทาง`; `46599` with `การขายส่งเครื่องจักรและอุปกรณ์อื่นๆซึ่งมิได้จัดประเภทไว้ในที่อื่น`; `46319` with a free-text objective about selling fresh and dried food. So the code is standard-shaped while the text is sometimes the registrant's own words.
- The page never says the code is TSIC. Reading it as a TSIC 2009 subclass is an inference ([[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]]). The June 2569 resource link on the dataset page points to a "dissolution" path instead of "registration"; check each month's file before counting.

### The summary dataset is by province, not business type (`dataset_12_01`)

จำนวนการจดทะเบียนนิติบุคคลตั้งใหม่ is described as monthly new-registration statistics "แยกเป็นรายจังหวัด", CSV per year 2563 to 2569, unit "ราย". The page names no business-type or TSIC breakdown. So a ranking by business type has to be counted from the record-level files above.

### The register dataset (`dataset_11_03`)

ข้อมูลทะเบียนนิติบุคคล is the full register (JSON, "ตามเวลาจริง") with registration number, status, entity type, capital, name, location, registration date and objectives. It could rank by objective over any window, but its field list names objectives, not a code; whether it carries `รหัสวัตถุประสงค์` was not checked.

### What DBD itself publishes as a ranking

DBD's monthly releases, as reported in the press, name a few business types, not a full table. A report on January to April 2569 quotes the Director-General on three growing types, for example:

> ธุรกิจภัตตาคาร/ร้านอาหาร จำนวน 1,408 ราย เพิ่มขึ้น 171 ราย คิดเป็น 13.82%

Older DBD monthly PDFs (2022 to 2023, `www2.dbd.go.th/download/article/`) are reported by search to carry a "top 3 business types" table; those PDFs were not read here. DBD's own groupings ("ภัตตาคาร/ร้านอาหาร", "ขายปลีกทางอินเทอร์เน็ต") are not defined on the pages read, so their mapping to codes is unknown.

### Gaps and inferences (below 0.7)

- **Coverage.** The datasets cover juristic persons registered with DBD (companies and partnerships). Sole traders and shops registered under the Commercial Registration Act at local offices are not in them, and they likely found many small consumer brands. No source read gives that share.
- **One company, one brand.** A new registration is a new legal entity, not necessarily a new brand; holding companies and second entities of existing brands also register. Counting registrations ranks business formation, which we take as a proxy for brand formation, untested.
- **One code per company.** Each row shows one objective code. Whether DBD keeps further objectives elsewhere was not checked.

If the record-level files ever stop being downloadable, the alternatives named in sources are DBD DataWarehouse+ (per-company lookup with a business-type code, reported by a third-party site, not checked) and the NSO business and industry census (TSIC-coded counts of establishments, not of new ones).

## Why it matters for ORIVILO

ORV-127 wants to rank brand categories by how many new brands form in Thailand. DBD's monthly record files are public and carry a code per new company, so a ranking can be counted from them without scraping; the province-only summary cannot do it. Whether the count measures brands, and how DBD codes map to the chosen taxonomy, are open for the architect.
