# Knowledge

What the team has learned from outside sources, one fact per file, each with its source and how sure we are. Decisions cite these entries by id, so a reader can follow a rule back to the evidence behind it.

This folder holds **process knowledge** for the team that builds ORIVILO (how agents are dispatched, checked and gated). It is not the product's knowledge corpus. Product knowledge entries (brand, colour, typography and so on) live in code under `packages/intent-engine` and follow `knowledgeEntrySchema` (ADR 0005). The two share their ideas on purpose: a source, a retrieval date, a confidence and a license on every record.

## Where entries live

```text
docs/knowledge/<topic>/K-NNNN-<kebab-slug>.md
```

- `<topic>` is a lowercase folder, such as `orchestration`, `verification` or `enforcement`. Add a topic when a new entry fits none of the existing ones.
- `K-NNNN` is four digits and unique across every topic. Take the next free number; never reuse a number, even after a file is retired.
- The slug says the fact in a few words.

## Entry format

```markdown
---
id: K-0001
topic: verification
claim: One sentence, the single fact.
source: "repo-relative path or https URL; for an external repo, its https URL plus the path inside it (with a line); never an absolute path"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

> A short quote or excerpt from the source, at most 6 lines, copied exactly.

## Why it matters for ORIVILO

One to three sentences.
```

| Field        | Meaning                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | In `knowledgeEntrySchema` (ADR 0005) |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`         | `K-NNNN`, unique across topics                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `id` (a slug there)                  |
| `topic`      | The folder the file sits in                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `appliesTo.topics`                   |
| `claim`      | One sentence, one fact, in our own words                                                                                                                                                                                                                                                                                                                                                                                                                                                | `statement`                          |
| `source`     | Where the evidence is: a repo-relative path that exists, or an https URL. An external repo is cited by its https URL plus the path inside it. A file the owner hands over is cited by title, edition, page count and pages, "owner-held, not in the repo", plus a public URL when one is found. Never an absolute path, for entries written or changed from 2026-10-26 on; the entries numbered 0001 to 0012 cite `~/` paths and are known exceptions, rewritten under ORV-129 (L-0031) | `sources[].url` or `title`           |
| `retrieved`  | ISO date the source was read                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `sources[].retrievedAt`              |
| `confidence` | 0 to 1. See the rule below                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `confidence`                         |
| `applies_to` | Jira keys, ADRs or plans the entry informs                                                                                                                                                                                                                                                                                                                                                                                                                                              | (no equivalent)                      |
| `license`    | How we may reuse the source: `internal`, `own-words`, `link-only`, `MIT`, `CC-BY-4.0`, `CC0-1.0`                                                                                                                                                                                                                                                                                                                                                                                        | `sources[].license`                  |

### Quoting

- Copy the source's words exactly, and use `...` where you leave words out.
- Our docs carry no em dash and no middot (AGENTS.md). Where the source has one, write `[-]` for an em dash and `[,]` for a middot. Nothing else changes.
- A quote that is code or a shell comment goes in a fenced code block, so a `#` is not read as a heading.

### Licenses

`internal` means a private repo of the owner or a team the owner works with (Camp Vibes, Allkons). We reuse the idea and a short quote for evidence; we never copy files from it.

## Confidence rule

- **Below 0.7, an entry may not be used for a decision.** It can be cited as a lead to check, never as the reason.
- Pick the number the way the product does (ADR 0005, `CONFIDENCE_CAP`): one source read and quoted, at most 0.8; two independent sources that agree, at most 0.9; checked by the owner, up to 1. A number copied from a source that does not show how it was measured stays below 0.7.
- If a quote can no longer be found at its source, lower the confidence below 0.7 and say why in the body. Do not delete the entry.

## How a decision cites knowledge

A decision (an ADR, a spec or a plan) that rests on knowledge adds a `## Knowledge` section listing the ids it relies on, one per line, with a few words on how each was used:

```markdown
## Knowledge

- K-0008: why a hook needs a heartbeat to prove it fires
- K-0007: the review cap of 2 rounds
```

The check (`pnpm check:knowledge`) reads citations in `docs/adr`, `docs/specs`, `docs/plans`, `docs/lessons`, `docs/context`, `.claude/rules`, `.claude/agents`, `.claude/skills` and `AGENTS.md`. A decision may cite only entries at 0.7 or above. When an entry changes or drops below 0.7, search for its id (`grep -rn "K-0001" docs`) and review every decision that cites it.

## Changing an entry

- Fix a typo in place.
- A new fact is a new entry. If it replaces an old one, the new entry says `Supersedes [[K-NNNN-...]]` in its body, and the old one gets a line `Superseded by [[K-NNNN-...]]` at the top of its body. The old file stays.

## Reading in Obsidian

Open `docs/` (or the repo root) as a vault. The frontmatter reads as Obsidian properties, and the folders show as a tree.

- Link entries with wikilinks by file name: `[[K-0005-proof-must-match-the-claim]]`. Wikilinks are allowed in this folder and in `docs/lessons/`.
- Do not use Dataview or any other plugin query. Every file must read correctly as plain markdown on GitHub, where a wikilink shows as text.

## Index

Keep this table in step with the folder when you add an entry.

| Entry                                                                             | Confidence | In short                                                              |
| --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| [[K-0001-prose-rules-vs-running-gates]]                                           | 0.65       | Prose rules caught 0 of 83 gaps, running gates 7 of 7 (count unshown) |
| [[K-0002-atlas-orchestrates-from-the-main-loop]]                                  | 0.8        | The orchestrator is a main-loop skill; workers are agents             |
| [[K-0003-atlas-envelope-v2-and-checked-facts]]                                    | 0.8        | One envelope, one objective; every fact has `checked_by`              |
| [[K-0004-atlas-report-contracts]]                                                 | 0.8        | implementer.v1, reviewer.v1, explorer.v1: JSON only                   |
| [[K-0005-proof-must-match-the-claim]]                                             | 0.8        | Visual claims need computed style or a looked-at screenshot           |
| [[K-0006-finding-without-evidence-is-dropped]]                                    | 0.8        | A finding without re-runnable evidence is dropped                     |
| [[K-0007-model-review-capped-at-two-rounds]]                                      | 0.8        | Model review stops at 2 rounds, then the human decides                |
| [[K-0008-hooks-fail-silently-without-a-heartbeat]]                                | 0.85       | Hooks failed silently; a heartbeat proves they fire                   |
| [[K-0009-campvibe-envelope-done-when-is-an-outcome]]                              | 0.8        | `done_when` is an outcome a command proves                            |
| [[K-0010-campvibe-done-needs-a-verify-role]]                                      | 0.8        | No Done without a QA or Security role in the history                  |
| [[K-0011-campvibe-circuit-breaker-and-stall-watchdog]]                            | 0.8        | Back to Discovery after 2 rejections; stall after about 15 minutes    |
| [[K-0012-skill-use-per-role-is-prose-only]]                                       | 0.75       | Skill use per role is enforced in prose only                          |
| [[K-0013-pinned-standards-versions-and-sources]]                                  | 0.75       | ASVS 5.0.0, LLM Top 10 2025, WCAG 2.2, CWV, PDPA: versions and URLs   |
| [[K-0014-owasp-llm-top-10-2026-items-and-changes]]                                | 0.8        | LLM Top 10 2026: same ten risks, one renamed, list reordered          |
| [[K-0015-vercel-client-ip-headers]]                                               | 0.8        | Vercel overwrites x-forwarded-for; which IP header a proxy can't fake |
| [[K-0016-openui-litellm-generator-with-judge-model-evals]]                        | 0.8        | A second model judges screenshots on four 1 to 4 criteria             |
| [[K-0017-screenshot-to-code-variants-and-human-scored-evals]]                     | 0.8        | A person rates outputs 1 to 4, three runs per combination             |
| [[K-0018-tldraw-make-real-canvas-image-to-html-iframe]]                           | 0.8        | Make Real sends a canvas image to a vision model, gets an iframe      |
| [[K-0019-v0-composite-model-and-ai-sdk-structured-output]]                        | 0.8        | v0 is a composite model around a swappable base model                 |
| [[K-0020-style-dictionary-dtcg-token-pipeline]]                                   | 0.8        | Style Dictionary builds tokens in a fixed, model-free pipeline        |
| [[K-0021-material-color-utilities-hct-deterministic-schemes]]                     | 0.8        | Material derives a whole scheme from one color, no model              |
| [[K-0022-adobe-leonardo-contrast-targeted-palettes]]                              | 0.8        | Leonardo solves colors from target contrast ratios                    |
| [[K-0023-radix-colors-step-roles-and-apca-guarantee]]                             | 0.8        | Radix: twelve steps with fixed roles; APCA on steps 11 and 12         |
| [[K-0024-huemint-ml-palettes-from-a-contrast-graph]]                              | 0.8        | Huemint's own models make palettes; contrast is a loose target        |
| [[K-0025-penpot-mcp-model-runs-code-in-plugin]]                                   | 0.75       | Penpot MCP lets the model run code in a plugin                        |
| [[K-0026-hue-agent-skill-design-model-and-validator]]                             | 0.8        | Hue: one design model, person approves, validator gates               |
| [[K-0027-synthesis-ai-design-system-architecture-patterns]]                       | 0.8        | Six recurring patterns; shipped color is rule-made except Huemint     |
| [[K-0028-wheeler-five-phase-identity-process]]                                    | 0.8        | Wheeler: research, strategy, identity, touchpoints, managing assets   |
| [[K-0029-ci-project-entry-points-and-initiative-types]]                           | 0.8        | New, rename, merger, refresh, rebrand; existing brands audit first    |
| [[K-0030-neumeier-brand-gap-and-zag-checkpoints]]                                 | 0.8        | Five disciplines; 17 checkpoints, naming after onliness; swap test    |
| [[K-0031-kapferer-brand-identity-prism]]                                          | 0.7        | Prism: six facets on sender/receiver and external/internal axes       |
| [[K-0032-aaker-core-and-extended-identity]]                                       | 0.8        | Core and extended identity; product, organization, person, symbol     |
| [[K-0033-brand-archetypes-mark-pearson-weak-evidence]]                            | 0.7        | Twelve archetypes are widely used; empirical support is thin          |
| [[K-0034-unilever-brand-key-one-page-positioning]]                                | 0.65       | Brand Key: nine-part one-page positioning; no Unilever source found   |
| [[K-0035-agency-case-studies-idea-before-visuals]]                                | 0.75       | Agencies set a core idea before visuals and deliver a system          |
| [[K-0036-minimum-inputs-and-what-practitioners-do-when-missing]]                  | 0.75       | Missing strategy is researched or asked, not defaulted                |
| [[K-0037-logo-types-and-when-a-symbol-is-justified]]                              | 0.85       | Mark types; emphasise the name, add a symbol only with a reason       |
| [[K-0038-color-meaning-is-learned-and-culture-specific]]                          | 0.7        | Colour shifts brand personality; meanings are culture-bound           |
| [[K-0039-distinctive-assets-colour-uniqueness-against-category]]                  | 0.75       | Assets judged by fame and uniqueness; choose for contrast             |
| [[K-0040-thai-colour-culture-day-colours-royal-and-political]]                    | 0.7        | Thai day colours, royal yellow, political red and yellow              |
| [[K-0041-typeface-design-shapes-brand-impressions]]                               | 0.6        | Typeface design shapes impressions; six dimensions (unread paper)     |
| [[K-0042-thai-latin-typography-looped-loopless-pairing]]                          | 0.85       | Thai looped for text, loopless for display; pairs with serif or sans  |
| [[K-0043-brand-guidebook-structure]]                                              | 0.75       | Guidebook: foundation, verbal, visual, applications; last deliverable |
| [[K-0044-synthesis-ci-process-entry-points-and-node-graph]]                       | 0.75       | CI order, five entry groups, 22-node graph, compared with the method  |
| [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]]                     | 0.75       | Wireflow shows only third-party models behind a node graph            |
| [[K-0046-higgsfield-own-models-plus-resold-third-party-models]]                   | 0.8        | Higgsfield resells third-party models and runs its own                |
| [[K-0047-isic-rev4-and-rev5-counts-per-level]]                                    | 0.8        | ISIC classes: Rev.4 419, Rev.5 463; 408 and 451 after 3 exclusions    |
| [[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]]                            | 0.8        | TSIC 2009 follows ISIC Rev.4; 5 levels, 1,091 five-digit industries   |
| [[K-0049-dbd-new-registrations-open-data-by-objective-code]]                      | 0.8        | DBD monthly open CSV of new registrations with 5-digit objective code |
| [[K-0050-gics-classifies-companies-for-investors]]                                | 0.75       | GICS: 163 sub-industries, one code per company, built for investors   |
| [[K-0051-brand-category-cut-off-options]]                                         | 0.6        | Superseded lead: ISIC Rev.4 class level (408) as the category cut-off |
| [[K-0052-thai-copyright-excludes-facts-ideas-and-protects-compilation-selection]] | 0.75       | Thai copyright: no ideas, no mere facts; compilation selection only   |
| [[K-0053-thai-trademark-mark-includes-group-of-colours]]                          | 0.7        | Thai trademark: a group of colours is a mark; registers if uncommon   |
| [[K-0054-thai-computer-crime-act-access-and-disruption-offences]]                 | 0.7        | Thai CCA: unauthorised access past a block, or disruption, is a crime |
| [[K-0055-thai-pdpa-covers-natural-persons-not-companies]]                         | 0.7        | PDPA covers natural persons only; brand colours are not personal data |
| [[K-0056-robots-txt-rfc-9309-is-not-access-authorization]]                        | 0.8        | robots.txt (RFC 9309) is not access authorization; 24 h cache limit   |
| [[K-0057-eu-database-terms-and-tdm-opt-out]]                                      | 0.7        | EU: terms can limit an unprotected database; TDM has an opt-out       |
| [[K-0058-us-facts-free-and-scraping-cases]]                                       | 0.75       | US: facts are free (Feist); scraping cases turn on contract terms     |
| [[K-0059-brand-colour-collection-lawful-vs-prudent-rules]]                        | 0.5        | Lead, not legal advice: hex records likely lawful; risk in collection |
| [[K-0060-tiktok-for-business-guidelines-sections]]                                | 0.8        | TikTok guide: story, messaging, design system, imagery, advertising   |
| [[K-0061-tiktok-guidelines-page-layout-and-reasons]]                              | 0.8        | TikTok pages: one 16:9 grid, rule and reason left, visual right       |
| [[K-0062-brand-guideline-projects-studied]]                                       | 0.75       | 38 projects: 20 from search summaries, 18 read in a browser           |
| [[K-0063-guidebook-section-frequency-in-the-sample]]                              | 0.7        | Counts in two samples: logo, colour, type, applications seen most     |
| [[K-0064-mood-and-look-and-feel-section-contents]]                                | 0.75       | Two guides: mood is rule pages (voice, photo, motion), not one board  |
| [[K-0065-how-guidelines-show-each-elements-reason]]                               | 0.75       | Five kinds of reason, usually one line beside the element             |
| [[K-0066-guidebook-deliverable-formats-and-layout]]                               | 0.75       | Paged book, web brand site, or Behance showcase case study            |
| [[K-0067-thai-and-southeast-asian-guideline-traits]]                              | 0.6        | Lead: Thai and regional guides add bilingual type, cultural reasons   |
| [[K-0068-owner-reference-set-and-hedwig]]                                         | 0.8        | Owner's four references; only Hedwig goes on to app and web screens   |
| [[K-0069-logo-reason-as-an-equation-of-parts]]                                    | 0.75       | 6 of 18 state a logo reason; 4 as an equation of parts, 2 as text     |
| [[K-0070-mood-carried-by-applications-in-context]]                                | 0.7        | No mood board page in 18 Behance; mood shown by identity in context   |
| [[K-0071-thai-and-regional-behance-projects]]                                     | 0.75       | Four Thai and regional projects; one states colour and type reasons   |
| [[K-0072-openrouter-image-api-request-and-response]]                              | 0.8        | POST /api/v1/images: `b64_json` images, usage cost, no model field    |
| [[K-0073-openrouter-image-api-has-no-data-policy-fields]]                         | 0.8        | Image API provider options have no `zdr` or `data_collection`         |
| [[K-0074-gemini-nano-banana-2-1-endpoint-and-price]]                              | 0.8        | Nano Banana 2.1: one endpoint, n=1, 0.00003 USD per image token       |
| [[K-0075-gemini-api-terms-on-generated-output]]                                   | 0.8        | Gemini: no ownership claim; paid prompts not trained on, but logged   |
| [[K-0076-openrouter-terms-on-outputs]]                                            | 0.8        | OpenRouter defers output ownership to each model's terms              |
| [[K-0077-touchpoints-seen-tsic-sections-a-to-f]]                                  | 0.7        | Touchpoints named per TSIC section A to F; B thin, C mixed            |
| [[K-0078-touchpoints-seen-tsic-sections-g-to-l]]                                  | 0.75       | Touchpoints named per TSIC section G to L; L thin                     |
| [[K-0079-touchpoints-seen-tsic-sections-m-to-s]]                                  | 0.75       | Touchpoints named per TSIC section M to S; S thin, N and R mixed      |
| [[K-0080-proposed-touchpoint-sets-by-tsic-section]]                               | 0.6        | Lead: up to four touchpoints and one screen for each of 18 sections   |
| [[K-0081-headless-chromium-in-a-vercel-function]]                                 | 0.8        | Headless Chromium on Vercel: 250 MB, Hobby 300 s and 2 GB; unmeasured |
| [[K-0082-parse5-as-a-pure-html-tokenizer]]                                        | 0.8        | parse5 8.0.1 MIT, one dep; stack hooks; attribute and re-open costs   |
| [[K-0083-whatwg-html-void-optional-end-tag-and-raw-text-elements]]                | 0.8        | WHATWG 13 void, 19 optional end tags; record of the v1.14 pre-pass    |
