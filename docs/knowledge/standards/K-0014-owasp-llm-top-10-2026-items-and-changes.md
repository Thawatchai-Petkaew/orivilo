---
id: K-0014
topic: standards
claim: The OWASP GenAI LLM Top 10 2026, published in August 2026, keeps the same ten risks as the 2025 list but renames System Prompt Leakage to Hidden Context Exposure, widens four entries and reorders the list, with Excessive Agency moving up to third and Improper Output Handling down to tenth.
source: "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/; https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/README.md; https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM00_Preface.md; https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM08_HiddenContextExposure.md; https://github.com/OWASP/www-project-top-10-for-large-language-model-applications"
retrieved: 2026-10-25
confidence: 0.8
applies_to: [ORV-108, ADR-0015]
license: own-words
---

## Evidence

The sources are licensed CC BY-SA 4.0 (the genai.owasp.org footer and the GenAI-LLM-Top10 README), which is not on the README list. So this file is in our words, and the quotes are short phrases only. Confidence is 0.8: every fact comes from one publisher (the OWASP GenAI Security Project), read on its site and in its source repo, so it counts as one source read and quoted.

### Where the official text lives

- Resource page: <https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/>, titled "OWASP GenAI LLM Top 10 2026". It does not list the items or the changes; it links a PDF download (<https://genai.owasp.org/download/56857/>). The PDF downloaded, but its text could not be extracted here, so it was not read.
- Source repo: <https://github.com/GenAI-Security-Project/GenAI-LLM-Top10>. Its README calls it "the official source repository for the OWASP Top 10 for Large Language Model Applications". The folder `2026/final/` is the canonical source of the published release.
- OWASP's own GitHub repo, <https://github.com/OWASP/www-project-top-10-for-large-language-model-applications>, says active development "has moved to" the GenAI-Security-Project repo, and names the 2026 edition as the current release. This ties the second repo back to OWASP.

### Version and date (not fully confirmed)

- Date: the genai.owasp.org resource page shows 3 August 2026. The repo's `2026/README.md` and the OWASP repo both say published 4 August 2026. The two OWASP sources differ by one day; we could not settle which is the formal date.
- Version 1.0: only the cover image file name on the resource page says it (`2026-OWASP-GenAI-LLM-Top-10-v1.0.jpg`). No page text read here states a version number, and the preface gives none. **Version 1.0 is not confirmed from text (below 0.7 for this point alone).**
- Status: `2026/README.md` marks the release "Published". The announcement post on genai.owasp.org is dated 1 September 2026 (its press release dateline says 2 September 2026).

### The ten items, as named in `2026/README.md` and `2026/final/`

| Id         | Name                             | 2025 position and name                    |
| ---------- | -------------------------------- | ----------------------------------------- |
| LLM01:2026 | Prompt Injection                 | LLM01:2025, same name                     |
| LLM02:2026 | Sensitive Information Disclosure | LLM02:2025, same name                     |
| LLM03:2026 | Excessive Agency                 | LLM06:2025, same name                     |
| LLM04:2026 | Supply Chain                     | LLM03:2025, same name                     |
| LLM05:2026 | Data and Model Poisoning         | LLM04:2025, same name                     |
| LLM06:2026 | Unbounded Consumption            | LLM10:2025, same name                     |
| LLM07:2026 | Misinformation                   | LLM09:2025, same name                     |
| LLM08:2026 | Hidden Context Exposure          | LLM07:2025 System Prompt Leakage, renamed |
| LLM09:2026 | Vector and Embedding Weaknesses  | LLM08:2025, same name                     |
| LLM10:2026 | Improper Output Handling         | LLM05:2025, same name                     |

The 2025 column comes from K-0013 section 2 (read on genai.owasp.org/llm-top-10/). The mapping is ours, made by matching names.

### What changed from 2025, from the 2026 preface (`LLM00_Preface.md`)

- **Added:** no new entry. The preface says new thin categories "would have splintered the list".
- **Removed:** none. All ten 2025 risks are still on the list, one under a new name.
- **Renamed:** System Prompt Leakage is now Hidden Context Exposure, described as "a broader framework for the same failure". The LLM08 entry defines it as extracting, inferring or rebuilding hidden system instructions or operational context in a model's context, which matters when that context reveals secrets, policy logic, tools or trust boundaries.
- **Widened in scope:** Prompt Injection now covers cross-modal attacks; Supply Chain covers a promoted model artifact that is not what it claims to be; Data and Model Poisoning absorbs fine-tuning subversion; Improper Output Handling covers insecure code that assistants generate.
- **Reordered:** Excessive Agency climbed to third, called "the most consequential move on the list"; Unbounded Consumption rose four places; Improper Output Handling fell from fifth to tenth; Prompt Injection and Sensitive Information Disclosure kept first and second. The table above agrees with each of these.

## Why it matters for ORIVILO

ADR 0015 lists the 2025 names. If it pins the 2026 edition, the ids change for eight of the ten items and LLM07 System Prompt Leakage becomes LLM08 Hidden Context Exposure, so any control or test that cites an LLM Top 10 id needs the new number. Whether to pin 2026, and which date to cite, is for the architect or the owner. This entry does not decide it. Builds on [[K-0013-pinned-standards-versions-and-sources]].
