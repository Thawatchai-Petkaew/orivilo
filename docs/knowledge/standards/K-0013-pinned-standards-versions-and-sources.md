---
id: K-0013
topic: standards
claim: As read on 2026-10-25, ASVS 5.0.0 (30 May 2025), the OWASP LLM Top 10 2025 (17 November 2024, now followed by a 2026 edition), WCAG 2.2 (Recommendation 5 October 2023, current text 12 December 2024), the Core Web Vitals good thresholds at p75 (LCP 2.5 s, INP 200 ms, CLS 0.1) and Thailand's PDPA B.E. 2562 (Gazette 27 May 2019, fully in force 1 June 2022) have the versions, dates and URLs below.
source: "https://asvs.owasp.org/; https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x03-What-is-the-ASVS.md; https://genai.owasp.org/llm-top-10/; https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/; https://www.w3.org/TR/WCAG22/; https://web.dev/articles/vitals; https://www.pdpc.or.th/3442/; https://ratchakitcha.soc.go.th/documents/17082307.pdf"
retrieved: 2026-10-25
confidence: 0.75
applies_to: [ORV-108, ADR-0015]
license: own-words
---

## Evidence

Each part below gives the source, its licence, what it says and its own confidence. The `license: own-words` above covers this file: every fact is in our words, and each quote is a short phrase. The sources' licences (CC BY-SA 4.0, CC BY 4.0, the W3C Document License, Thai government text) are not on the README list, so none of their text is copied beyond those phrases.

### 1. OWASP ASVS: 5.0.0, Level 2 (confidence 0.8)

- Source: <https://asvs.owasp.org/> (licence shown as CC BY-SA 4.0). The URL in ADR 0015, <https://owasp.org/www-project-application-security-verification-standard/>, now redirects through `https://owasp.org/asvs` (308) to `https://asvs.owasp.org/`.
- Latest stable release: 5.0.0, published 30 May 2025, marked a "Stable release".
- Level 2, from the 5.0.0 text in OWASP's own repo (`0x03-What-is-the-ASVS.md`, tag `v5.0.0`):

> Most applications should be striving to achieve this level of security.

- In our words: Level 1 is the minimum first layer; Level 2 adds defences against less common attacks and harder protections against common ones; Level 3 is for the highest assurance. Level 2 means meeting every Level 1 and Level 2 requirement. The text puts the total at about 350 requirements, about 20% at Level 1 and about 50% at Level 2 (so about 70% for Level 2 in all). No exact count per level is given.

### 2. OWASP Top 10 for LLM Applications: 2025 edition (confidence 0.8)

- Source: <https://genai.owasp.org/llm-top-10/> (licence on the site footer: CC BY-SA 4.0). Announced in the post "OWASP Reveals Updated 2025 Top 10 Risks for LLMs", dated 17 November 2024 on genai.owasp.org (the press release dateline inside it says 19 November 2024).
- Items, as named on the page: LLM01:2025 Prompt Injection; LLM02:2025 Sensitive Information Disclosure; LLM03:2025 Supply Chain; LLM04:2025 Data and Model Poisoning; LLM05:2025 Improper Output Handling; LLM06:2025 Excessive Agency; LLM07:2025 System Prompt Leakage; LLM08:2025 Vector and Embedding Weaknesses; LLM09:2025 Misinformation; LLM10:2025 Unbounded Consumption. These match the names ADR 0015 "Not done yet" uses.
- **Newer edition exists.** OWASP published "OWASP GenAI LLM Top 10 2026", version 1.0, dated 3 August 2026, at <https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/>, and announced it in a post of 1 September 2026. The resource page does not list the 2026 item names, and the site menu still shows "LLM TOP 10 FOR 2025". The 2026 names were not read and are not confirmed here. So the 2025 edition is no longer the latest; whether to stay pinned to it is not a research call.

### 3. WCAG 2.2, Level AA (confidence 0.8)

- Source: <https://www.w3.org/TR/WCAG22/> (W3C Document License, <https://www.w3.org/copyright/document-license/>).
- Status: W3C Recommendation. The current dated version is `REC-WCAG22-20241212` (12 December 2024), a republication with errata. The change log counts changes "since its original publication on 05 October 2023", which is the first Recommendation date.
- Level AA, from conformance requirement 5.2.1:

> For Level AA conformance, the web page satisfies all the Level A and Level AA success criteria, or a Level AA conforming alternate version is provided.

### 4. Core Web Vitals good thresholds (confidence 0.8)

- Source: <https://web.dev/articles/vitals> (content CC BY 4.0, code Apache 2.0), last updated 31 October 2024.
- LCP: "LCP should occur within 2.5 seconds" of the page starting to load. INP: "200 milliseconds or less". CLS: "pages should maintain a CLS of 0.1" or less.
- In our words: each is judged at the 75th percentile of page loads, measured separately for mobile and desktop. The page gives one threshold for both device types, not one each.
- These match ADR 0015 decision 5.

### 5. Thailand PDPA B.E. 2562 (confidence 0.75 for the dates; below 0.7 for the parts marked)

- Source read: the Personal Data Protection Committee office (PDPC, the regulator) page <https://www.pdpc.or.th/3442/>, dated 28 January 2567 (2024). It says the Act was published in the Royal Gazette ("ลงประกาศในราชกิจจานุเบกษา วันที่ 27 พฤษภาคม 2562") and came into force in every section on 1 June 2565, that is 2022 ("ครบทุกมาตราในวันที่ 1 มิถุนายน 2565"). ETDA's article (<https://www.etda.or.th/th/Useful-Resource/knowledge-sharing/articles/Digital-Law/PDPA.aspx>) also names 1 June 2565. Thai government text; we take facts, not text.
- Gazette text: the Act is in Royal Gazette volume 136, part 69 Gor (เล่ม ๑๓๖ ตอนที่ ๖๙ ก). Copies: <https://ratchakitcha.soc.go.th/documents/17082307.pdf> and <https://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF> (the URL in ADR 0015). The second returned 403 to our fetcher; the first downloaded but its text could not be extracted. The volume and part come from search result titles on ratchakitcha.soc.go.th and mdes.go.th, not from reading the page. **Not confirmed by reading (below 0.7).**
- Section 2 (the one-year delay for some chapters, and the decrees that moved full force to 1 June 2022): **not confirmed from a primary source.** Secondary copies (university-hosted translations, iLaw, Thairath) say most of the Act took force the day after publication, Chapters II, III, V, VI, VII and sections 95 and 96 a year later, and two Royal Decrees moved that date to 1 June 2022. Treat this as a lead to check, not a fact.
- English translation: the PDPC lists "Personal Data Protection Act B.E. 2562 (2019)" at <https://www.pdpc.or.th/en/23134/>, with the PDF <https://www.pdpc.or.th/wp-content/uploads/2023/12/2_Personal-Data-Protection-Act-2019.pdf>. The PDPC page does not say whether it is official. The Ministry of Digital Economy and Society copy (<https://mdes.go.th/law/detail/1905-Personal-Data-Protection-Act--B-E--2562--2019->) is titled "(Unofficial Translation)" in search results; its PDF text could not be read. No official English translation was found. The Thai Gazette text is the binding one.

## Why it matters for ORIVILO

ADR 0015 waits on this entry for its versions, URLs, thresholds and PDPA source. ASVS, WCAG and the Core Web Vitals match what the ADR says, but the ASVS URL redirects now. The LLM Top 10 2025 names match too, yet a 2026 edition came out on 3 August 2026, and the PDPA Gazette text and section 2 could not be read here. Those last two are for the architect or the owner to weigh. This entry does not decide them.
