---
id: K-0054
topic: market
claim: The Thai Computer Crime Act B.E. 2550 makes it an offence to access without right a computer system or computer data that has an access-prevention measure not meant for the accessor (sections 5 and 7), and to act without right so that another's system is suspended, slowed, obstructed or disturbed (section 10).
source: "https://legardy.com/thai-law/computer-crime-act/computer-law-newest"
retrieved: 2026-10-26
confidence: 0.7
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice. One unofficial consolidation of the Act as amended by Act No. 2 B.E. 2560 was read; it showed no amendment footnote on these three sections and says to check krisdika.go.th. Confidence stays at 0.7 for that reason. A lawyer should confirm the text and how courts read "มาตรการป้องกันการเข้าถึงโดยเฉพาะ".

> ผู้ใดเข้าถึงโดยมิชอบซึ่งระบบคอมพิวเตอร์ที่มีมาตรการป้องกันการเข้าถึงโดยเฉพาะและมาตรการนั้นมิได้มีไว้สำหรับตน

That is section 5 (up to six months or 10,000 baht). Section 7 has the same words for "ข้อมูลคอมพิวเตอร์" (up to two years or 40,000 baht). Section 10:

> ผู้ใดกระทำด้วยประการใดโดยมิชอบ เพื่อให้การทำงานของระบบคอมพิวเตอร์ของผู้อื่นถูกระงับ ชะลอ ขัดขวาง หรือรบกวนจนไม่สามารถทำงานตามปกติได้

(up to five years or 100,000 baht).

### Inference, below 0.7

- A public page that anyone can open without a login, password or paywall has no "specific access-prevention measure", so reading it once is unlikely to fall under section 5 or 7. Getting past a login, a paywall, a CAPTCHA or an IP block would be the risky case.
- Whether robots.txt counts as an access-prevention measure was not found in any Thai source. RFC 9309 says it is not access authorization ([[K-0056-robots-txt-rfc-9309-is-not-access-authorization]]), which points to no, but this is untested in Thai courts.
- Section 10 is the one an automated reader could trip by volume: a crawler that slows a small brand's site is the risk, which a rate limit addresses.

## Why it matters for ORIVILO

Automated reading of official websites is the channel the Act touches. Reading only public pages, never getting around a block, and keeping request rates low keeps the reader far from sections 5, 7 and 10.
