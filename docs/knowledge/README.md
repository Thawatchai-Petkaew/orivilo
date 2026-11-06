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

| Field        | Meaning                                                                                                                                                                                                                                                                                                                                                             | In `knowledgeEntrySchema` (ADR 0005) |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `id`         | `K-NNNN`, unique across topics                                                                                                                                                                                                                                                                                                                                      | `id` (a slug there)                  |
| `topic`      | The folder the file sits in                                                                                                                                                                                                                                                                                                                                         | `appliesTo.topics`                   |
| `claim`      | One sentence, one fact, in our own words                                                                                                                                                                                                                                                                                                                            | `statement`                          |
| `source`     | Where the evidence is: a repo-relative path that exists, or an https URL. An external repo is cited by its https URL plus the path inside it. A file the owner hands over is cited by title, edition, page count and pages, "owner-held, not in the repo", plus a public URL when one is found. Never an absolute path; `pnpm check:knowledge` refuses one (L-0031) | `sources[].url` or `title`           |
| `retrieved`  | ISO date the source was read                                                                                                                                                                                                                                                                                                                                        | `sources[].retrievedAt`              |
| `confidence` | 0 to 1. See the rule below                                                                                                                                                                                                                                                                                                                                          | `confidence`                         |
| `applies_to` | Jira keys, ADRs or plans the entry informs                                                                                                                                                                                                                                                                                                                          | (no equivalent)                      |
| `license`    | How we may reuse the source: `internal`, `own-words`, `link-only`, `MIT`, `CC-BY-4.0`, `CC0-1.0`                                                                                                                                                                                                                                                                    | `sources[].license`                  |

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

| Entry                                                                                   | Confidence | In short                                                              |
| --------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| [[K-0001-prose-rules-vs-running-gates]]                                                 | 0.65       | Prose rules caught 0 of 83 gaps, running gates 7 of 7 (count unshown) |
| [[K-0002-atlas-orchestrates-from-the-main-loop]]                                        | 0.8        | The orchestrator is a main-loop skill; workers are agents             |
| [[K-0003-atlas-envelope-v2-and-checked-facts]]                                          | 0.8        | One envelope, one objective; every fact has `checked_by`              |
| [[K-0004-atlas-report-contracts]]                                                       | 0.8        | implementer.v1, reviewer.v1, explorer.v1: JSON only                   |
| [[K-0005-proof-must-match-the-claim]]                                                   | 0.8        | Visual claims need computed style or a looked-at screenshot           |
| [[K-0006-finding-without-evidence-is-dropped]]                                          | 0.8        | A finding without re-runnable evidence is dropped                     |
| [[K-0007-model-review-capped-at-two-rounds]]                                            | 0.8        | Model review stops at 2 rounds, then the human decides                |
| [[K-0008-hooks-fail-silently-without-a-heartbeat]]                                      | 0.85       | Hooks failed silently; a heartbeat proves they fire                   |
| [[K-0009-campvibe-envelope-done-when-is-an-outcome]]                                    | 0.8        | `done_when` is an outcome a command proves                            |
| [[K-0010-campvibe-done-needs-a-verify-role]]                                            | 0.8        | No Done without a QA or Security role in the history                  |
| [[K-0011-campvibe-circuit-breaker-and-stall-watchdog]]                                  | 0.8        | Back to Discovery after 2 rejections; stall after about 15 minutes    |
| [[K-0012-skill-use-per-role-is-prose-only]]                                             | 0.75       | Skill use per role is enforced in prose only                          |
| [[K-0013-pinned-standards-versions-and-sources]]                                        | 0.75       | ASVS 5.0.0, LLM Top 10 2025, WCAG 2.2, CWV, PDPA: versions and URLs   |
| [[K-0014-owasp-llm-top-10-2026-items-and-changes]]                                      | 0.8        | LLM Top 10 2026: same ten risks, one renamed, list reordered          |
| [[K-0015-vercel-client-ip-headers]]                                                     | 0.8        | Vercel overwrites x-forwarded-for; which IP header a proxy can't fake |
| [[K-0016-openui-litellm-generator-with-judge-model-evals]]                              | 0.8        | A second model judges screenshots on four 1 to 4 criteria             |
| [[K-0017-screenshot-to-code-variants-and-human-scored-evals]]                           | 0.8        | A person rates outputs 1 to 4, three runs per combination             |
| [[K-0018-tldraw-make-real-canvas-image-to-html-iframe]]                                 | 0.8        | Make Real sends a canvas image to a vision model, gets an iframe      |
| [[K-0019-v0-composite-model-and-ai-sdk-structured-output]]                              | 0.8        | v0 is a composite model around a swappable base model                 |
| [[K-0020-style-dictionary-dtcg-token-pipeline]]                                         | 0.8        | Style Dictionary builds tokens in a fixed, model-free pipeline        |
| [[K-0021-material-color-utilities-hct-deterministic-schemes]]                           | 0.8        | Material derives a whole scheme from one color, no model              |
| [[K-0022-adobe-leonardo-contrast-targeted-palettes]]                                    | 0.8        | Leonardo solves colors from target contrast ratios                    |
| [[K-0023-radix-colors-step-roles-and-apca-guarantee]]                                   | 0.8        | Radix: twelve steps with fixed roles; APCA on steps 11 and 12         |
| [[K-0024-huemint-ml-palettes-from-a-contrast-graph]]                                    | 0.8        | Huemint's own models make palettes; contrast is a loose target        |
| [[K-0025-penpot-mcp-model-runs-code-in-plugin]]                                         | 0.75       | Penpot MCP lets the model run code in a plugin                        |
| [[K-0026-hue-agent-skill-design-model-and-validator]]                                   | 0.8        | Hue: one design model, person approves, validator gates               |
| [[K-0027-synthesis-ai-design-system-architecture-patterns]]                             | 0.8        | Six recurring patterns; shipped color is rule-made except Huemint     |
| [[K-0028-wheeler-five-phase-identity-process]]                                          | 0.8        | Wheeler: research, strategy, identity, touchpoints, managing assets   |
| [[K-0029-ci-project-entry-points-and-initiative-types]]                                 | 0.8        | New, rename, merger, refresh, rebrand; existing brands audit first    |
| [[K-0030-neumeier-brand-gap-and-zag-checkpoints]]                                       | 0.8        | Five disciplines; 17 checkpoints, naming after onliness; swap test    |
| [[K-0031-kapferer-brand-identity-prism]]                                                | 0.7        | Prism: six facets on sender/receiver and external/internal axes       |
| [[K-0032-aaker-core-and-extended-identity]]                                             | 0.8        | Core and extended identity; product, organization, person, symbol     |
| [[K-0033-brand-archetypes-mark-pearson-weak-evidence]]                                  | 0.7        | Twelve archetypes are widely used; empirical support is thin          |
| [[K-0034-unilever-brand-key-one-page-positioning]]                                      | 0.65       | Brand Key: nine-part one-page positioning; no Unilever source found   |
| [[K-0035-agency-case-studies-idea-before-visuals]]                                      | 0.75       | Agencies set a core idea before visuals and deliver a system          |
| [[K-0036-minimum-inputs-and-what-practitioners-do-when-missing]]                        | 0.75       | Missing strategy is researched or asked, not defaulted                |
| [[K-0037-logo-types-and-when-a-symbol-is-justified]]                                    | 0.85       | Mark types; emphasise the name, add a symbol only with a reason       |
| [[K-0038-color-meaning-is-learned-and-culture-specific]]                                | 0.7        | Colour shifts brand personality; meanings are culture-bound           |
| [[K-0039-distinctive-assets-colour-uniqueness-against-category]]                        | 0.75       | Assets judged by fame and uniqueness; choose for contrast             |
| [[K-0040-thai-colour-culture-day-colours-royal-and-political]]                          | 0.7        | Thai day colours, royal yellow, political red and yellow              |
| [[K-0041-typeface-design-shapes-brand-impressions]]                                     | 0.6        | Typeface design shapes impressions; six dimensions (unread paper)     |
| [[K-0042-thai-latin-typography-looped-loopless-pairing]]                                | 0.85       | Thai looped for text, loopless for display; pairs with serif or sans  |
| [[K-0043-brand-guidebook-structure]]                                                    | 0.75       | Guidebook: foundation, verbal, visual, applications; last deliverable |
| [[K-0044-synthesis-ci-process-entry-points-and-node-graph]]                             | 0.75       | CI order, five entry groups, 22-node graph, compared with the method  |
| [[K-0045-wireflow-third-party-models-in-a-hosted-node-graph]]                           | 0.75       | Wireflow shows only third-party models behind a node graph            |
| [[K-0046-higgsfield-own-models-plus-resold-third-party-models]]                         | 0.8        | Higgsfield resells third-party models and runs its own                |
| [[K-0047-isic-rev4-and-rev5-counts-per-level]]                                          | 0.8        | ISIC classes: Rev.4 419, Rev.5 463; 408 and 451 after 3 exclusions    |
| [[K-0048-tsic-2009-is-isic-rev4-based-at-five-digits]]                                  | 0.8        | TSIC 2009 follows ISIC Rev.4; 5 levels, 1,091 five-digit industries   |
| [[K-0049-dbd-new-registrations-open-data-by-objective-code]]                            | 0.8        | DBD monthly open CSV of new registrations with 5-digit objective code |
| [[K-0050-gics-classifies-companies-for-investors]]                                      | 0.75       | GICS: 163 sub-industries, one code per company, built for investors   |
| [[K-0051-brand-category-cut-off-options]]                                               | 0.6        | Superseded lead: ISIC Rev.4 class level (408) as the category cut-off |
| [[K-0052-thai-copyright-excludes-facts-ideas-and-protects-compilation-selection]]       | 0.75       | Thai copyright: no ideas, no mere facts; compilation selection only   |
| [[K-0053-thai-trademark-mark-includes-group-of-colours]]                                | 0.7        | Thai trademark: a group of colours is a mark; registers if uncommon   |
| [[K-0054-thai-computer-crime-act-access-and-disruption-offences]]                       | 0.7        | Thai CCA: unauthorised access past a block, or disruption, is a crime |
| [[K-0055-thai-pdpa-covers-natural-persons-not-companies]]                               | 0.7        | PDPA covers natural persons only; brand colours are not personal data |
| [[K-0056-robots-txt-rfc-9309-is-not-access-authorization]]                              | 0.8        | robots.txt (RFC 9309) is not access authorization; 24 h cache limit   |
| [[K-0057-eu-database-terms-and-tdm-opt-out]]                                            | 0.7        | EU: terms can limit an unprotected database; TDM has an opt-out       |
| [[K-0058-us-facts-free-and-scraping-cases]]                                             | 0.75       | US: facts are free (Feist); scraping cases turn on contract terms     |
| [[K-0059-brand-colour-collection-lawful-vs-prudent-rules]]                              | 0.5        | Lead, not legal advice: hex records likely lawful; risk in collection |
| [[K-0060-tiktok-for-business-guidelines-sections]]                                      | 0.8        | TikTok guide: story, messaging, design system, imagery, advertising   |
| [[K-0061-tiktok-guidelines-page-layout-and-reasons]]                                    | 0.8        | TikTok pages: one 16:9 grid, rule and reason left, visual right       |
| [[K-0062-brand-guideline-projects-studied]]                                             | 0.75       | 38 projects: 20 from search summaries, 18 read in a browser           |
| [[K-0063-guidebook-section-frequency-in-the-sample]]                                    | 0.7        | Counts in two samples: logo, colour, type, applications seen most     |
| [[K-0064-mood-and-look-and-feel-section-contents]]                                      | 0.75       | Two guides: mood is rule pages (voice, photo, motion), not one board  |
| [[K-0065-how-guidelines-show-each-elements-reason]]                                     | 0.75       | Five kinds of reason, usually one line beside the element             |
| [[K-0066-guidebook-deliverable-formats-and-layout]]                                     | 0.75       | Paged book, web brand site, or Behance showcase case study            |
| [[K-0067-thai-and-southeast-asian-guideline-traits]]                                    | 0.6        | Lead: Thai and regional guides add bilingual type, cultural reasons   |
| [[K-0068-owner-reference-set-and-hedwig]]                                               | 0.8        | Owner's four references; only Hedwig goes on to app and web screens   |
| [[K-0069-logo-reason-as-an-equation-of-parts]]                                          | 0.75       | 6 of 18 state a logo reason; 4 as an equation of parts, 2 as text     |
| [[K-0070-mood-carried-by-applications-in-context]]                                      | 0.7        | No mood board page in 18 Behance; mood shown by identity in context   |
| [[K-0071-thai-and-regional-behance-projects]]                                           | 0.75       | Four Thai and regional projects; one states colour and type reasons   |
| [[K-0072-openrouter-image-api-request-and-response]]                                    | 0.8        | POST /api/v1/images: `b64_json` images, usage cost, no model field    |
| [[K-0073-openrouter-image-api-has-no-data-policy-fields]]                               | 0.8        | Image API provider options have no `zdr` or `data_collection`         |
| [[K-0074-gemini-nano-banana-2-1-endpoint-and-price]]                                    | 0.8        | Nano Banana 2.1: one endpoint, n=1, 0.00003 USD per image token       |
| [[K-0075-gemini-api-terms-on-generated-output]]                                         | 0.8        | Gemini: no ownership claim; paid prompts not trained on, but logged   |
| [[K-0076-openrouter-terms-on-outputs]]                                                  | 0.8        | OpenRouter defers output ownership to each model's terms              |
| [[K-0077-touchpoints-seen-tsic-sections-a-to-f]]                                        | 0.7        | Touchpoints named per TSIC section A to F; B thin, C mixed            |
| [[K-0078-touchpoints-seen-tsic-sections-g-to-l]]                                        | 0.75       | Touchpoints named per TSIC section G to L; L thin                     |
| [[K-0079-touchpoints-seen-tsic-sections-m-to-s]]                                        | 0.75       | Touchpoints named per TSIC section M to S; S thin, N and R mixed      |
| [[K-0080-proposed-touchpoint-sets-by-tsic-section]]                                     | 0.6        | Lead: up to four touchpoints and one screen for each of 18 sections   |
| [[K-0081-headless-chromium-in-a-vercel-function]]                                       | 0.8        | Headless Chromium on Vercel: 250 MB, Hobby 300 s and 2 GB; unmeasured |
| [[K-0082-parse5-as-a-pure-html-tokenizer]]                                              | 0.8        | parse5 8.0.1 MIT, one dep; hooks; attribute, re-open, sibling costs   |
| [[K-0083-whatwg-html-void-optional-end-tag-and-raw-text-elements]]                      | 0.8        | WHATWG 13 void, 19 optional end tags; record of the v1.14 pre-pass    |
| [[K-0084-wireflow-flat-credit-price-rollover-and-per-node-metering]]                    | 0.8        | Wireflow: flat $0.0135/credit (own arithmetic), rollover, 402 at zero |
| [[K-0085-higgsfield-tiered-credits-no-rollover-and-separate-api-wallet]]                | 0.8        | Higgsfield: tiered $0.075 to $0.043/credit (own arithmetic), expiring |
| [[K-0086-reseller-markup-over-model-list-prices]]                                       | 0.7        | Own arithmetic: 0.64 to 6.0 times Google list on Nano Banana images   |
| [[K-0087-synthesis-prepaid-credits-over-model-costs-and-breakage]]                      | 0.7        | Prepaid credits over bought-in models; plan plus top-ups; breakage    |
| [[K-0088-material-color-utilities-0-4-0-quantizer-api-and-determinism]]                 | 0.8        | MCU 0.4.0 Apache-2.0; TS Celebi: 20 results in 20 calls (ORV-134 run) |
| [[K-0089-ovl-qa-walk-refusal-routes]]                                                   | 0.8        | ORV-136 survey: qa refusal routes on f2f5fa2; 5 uncovered (own count) |
| [[K-0090-bash-forms-for-text-guards]]                                                   | 0.8        | Bash, zsh and git forms a guard reads; reader desyncs; runner options |
| [[K-0091-openrouter-chat-completions-usage-cost]]                                       | 0.8        | Chat `usage.cost`: number or null, credits (USD base); no flag needed |
| [[K-0092-better-auth-organization-not-found-vs-forbidden]]                              | 0.8        | Better Auth 1.7.12: get org 400 if missing, 403 if not a member       |
| [[K-0093-owasp-llm-top-10-2026-attack-classes-and-prevention]]                          | 0.75       | LLM Top 10 2026 attacks and fixes per entry; interpreter reading      |
| [[K-0094-untitled-ui-react-logo-components]]                                            | 0.8        | Untitled UI logo: 2 components, no props, className size, no name     |
| [[K-0095-open-ring-and-dot-marks-in-use]]                                               | 0.6        | Lead: ring and dot marks read; none upper right; registers unread     |
| [[K-0096-untitled-ui-title-and-supporting-text-pair]]                                   | 0.8        | Untitled: weight and colour step; gap 0 to 8 px (own arithmetic)      |
| [[K-0097-shadcn-ui-title-and-description-pair]]                                         | 0.8        | shadcn: 500 or 600 over muted text-sm; 2 or 8 px gap (own arithmetic) |
| [[K-0098-material-3-dialog-headline-and-supporting-text]]                               | 0.8        | M3 dialog: 24 over 14 on-surface-variant, no weight step, 16dp gap    |
| [[K-0099-apple-hig-headline-equals-body-size-weight-step]]                              | 0.8        | Apple: Headline and Body share size and leading; weight step only     |
| [[K-0100-carbon-notification-title-subtitle-and-body-sets]]                             | 0.8        | Carbon: 14/600 over 14/400, one colour; body 14/20, compact 14/18     |
| [[K-0101-atlassian-heading-body-pairing-and-paragraph-spacing]]                         | 0.8        | Atlassian: bold heading, body 14/20 and 16/24, paragraph gap 12, 16   |
| [[K-0102-wcag-2-2-text-spacing-and-line-spacing]]                                       | 0.8        | WCAG 2.2: survive 1.5 line height (AA); 1.5 floor at AAA (1.4.8)      |
| [[K-0103-ibm-type-scale-thai-at-95-percent-same-line-height]]                           | 0.8        | IBM: Thai at 95% on Latin line height; 1.50 to 1.58 (own arithmetic)  |
| [[K-0104-thai-is-a-tall-script-with-stacked-marks]]                                     | 0.8        | Thai is tall (Material, no values); W3C: up to 4 glyphs plus tone     |
| [[K-0105-thai-and-uk-readers-prefer-1-5-or-double-line-spacing]]                        | 0.7        | Thai and UK readers prefer 1.5 or double spacing (abstract only)      |
| [[K-0106-informal-test-tall-scripts-clip-at-1-1-line-height]]                           | 0.5        | Lead: tall scripts clip at 1.1, fixed at 1.6 (informal test)          |
| [[K-0107-synthesis-title-supporting-text-and-paragraph-line-height]]                    | 0.75       | Synthesis: weight step 13 of 14; body 1.29 to 1.625 (own arithmetic)  |
| [[K-0108-untitled-ui-loading-indicator-types-sizes-and-no-announcement]]                | 0.8        | Untitled spinner: 3 types, 32 to 64 px, label; silent, no role        |
| [[K-0109-untitled-ui-react-lists-no-skeleton-component]]                                | 0.75       | Untitled UI React lists no skeleton component                         |
| [[K-0110-shadcn-ui-spinner-status-role-on-the-icon]]                                    | 0.8        | shadcn Spinner: role status, aria-label Loading on the icon, size-4   |
| [[K-0111-shadcn-ui-skeleton-pulse-div-without-aria]]                                    | 0.8        | shadcn Skeleton: pulse div, className only, no aria                   |
| [[K-0112-tailwind-spin-and-pulse-ignore-reduced-motion-by-default]]                     | 0.8        | Tailwind spin 1s and pulse 2s loop; reduced motion left to the author |
| [[K-0113-wai-aria-1-2-aria-busy-defers-announcements]]                                  | 0.8        | aria-busy: assistive tech may wait; it does not announce              |
| [[K-0114-wai-aria-1-2-role-status-is-a-polite-live-region]]                             | 0.8        | role status: polite, atomic, takes no focus                           |
| [[K-0115-wcag-2-2-status-messages-cover-the-waiting-state]]                             | 0.8        | SC 4.1.3 (AA): the waiting state is a status message                  |
| [[K-0116-wcag-2-2-animation-from-interactions-and-c39]]                                 | 0.8        | SC 2.3.3 is AAA, interaction-started motion; C39 reduced motion       |
| [[K-0117-wcag-2-2-pause-stop-hide-and-loading-animations]]                              | 0.8        | SC 2.2.2 (A): over 5 s beside content; preload can be essential       |
| [[K-0118-synthesis-spinner-and-skeleton-benchmark]]                                     | 0.75       | Synthesis: spinner and skeleton benchmark table, audit B form         |
| [[K-0119-untitled-ui-react-has-no-collapsible-component]]                               | 0.75       | Untitled UI React: no collapsible; FAQ accordions, tree views nearest |
| [[K-0120-shadcn-ui-collapsible-three-parts-no-styles]]                                  | 0.8        | shadcn Collapsible: three parts, data-slot only, no class or motion   |
| [[K-0121-radix-collapsible-api-data-state-and-height-variable]]                         | 0.8        | Radix Collapsible: props, data-state, height variable, Space, Enter   |
| [[K-0122-radix-collapsible-source-aria-wiring-and-mount-animation]]                     | 0.8        | Radix source: aria-expanded; aria-controls only while open; hidden    |
| [[K-0123-wai-aria-apg-disclosure-button-expanded-enter-space]]                          | 0.8        | APG Disclosure: button, aria-expanded, optional aria-controls         |
| [[K-0124-wcag-2-2-motion-animation-excludes-opacity]]                                   | 0.8        | SC 2.3.3 motion animation excludes colour, blur and opacity           |
| [[K-0125-wcag-2-2-pause-stop-hide-starts-automatically-includes-hover]]                 | 0.8        | SC 2.2.2: a button press is not automatic; hover and focus are        |
| [[K-0126-synthesis-collapsible-benchmark]]                                              | 0.75       | Synthesis: Collapsible benchmark table, audit B form                  |
| [[K-0127-ai-elements-inline-citation-hover-card-badge-and-carousel]]                    | 0.8        | AI Elements citation: no-delay hover card, hostname +N pill, carousel |
| [[K-0128-ai-elements-sources-collapsible-count-trigger-and-links]]                      | 0.8        | AI Elements Sources: Collapsible, "Used {count} sources", no plural   |
| [[K-0129-radix-hover-card-sighted-users-only-no-keyboard-content]]                      | 0.8        | Hover Card: sighted users only; content out of tab order, no touch    |
| [[K-0130-radix-popover-dialog-pattern-trigger-wiring-and-focus]]                        | 0.8        | Radix Popover: dialog role, haspopup, Esc to trigger, non-modal       |
| [[K-0131-untitled-ui-react-has-no-citation-or-source-list-component]]                   | 0.75       | Untitled UI React: no citation, quote or source list; tooltip nearest |
| [[K-0132-wai-aria-apg-disclosure-and-button-for-a-popover-trigger]]                     | 0.8        | APG Disclosure and Button: what a panel-opening button follows        |
| [[K-0133-wai-aria-apg-no-non-modal-dialog-pattern-tooltip-note]]                        | 0.8        | APG: no popover pattern; focusable hover content: non-modal dialog    |
| [[K-0134-wcag-2-2-content-on-hover-or-focus-dismissible-hoverable-persistent]]          | 0.8        | SC 1.4.13 (AA): dismissible, hoverable, persistent on hover or focus  |
| [[K-0135-synthesis-evidence-span-and-evidence-list-benchmark]]                          | 0.75       | Synthesis: EvidenceSpan and EvidenceList benchmark, audit B form      |
| [[K-0136-untitled-ui-messaging-no-copy-action-no-scroll-button]]                        | 0.75       | Untitled Messaging: no copy action or scroll button; API table unread |
| [[K-0137-shadcn-ui-message-footer-holds-actions-icon-buttons-need-aria-label]]          | 0.8        | shadcn Message: actions in MessageFooter, ghost icon, aria-label Copy |
| [[K-0138-shadcn-ui-bubble-variants-and-no-action-slot]]                                 | 0.8        | shadcn Bubble: 7 variants (own count), no size, no action slot        |
| [[K-0139-shadcn-ui-message-scroller-button-docs-and-styled-registry]]                   | 0.8        | shadcn scroll button: inert, tabIndex -1 when caught up; sr-only name |
| [[K-0140-shadcn-react-message-scroller-primitive-smooth-default-8px-edge-blur]]         | 0.8        | @shadcn/react scroller: smooth default, 8 px edge, blur on press      |
| [[K-0141-ai-elements-message-action-label-tooltip-and-copy-without-result-state]]       | 0.8        | AI Elements MessageAction: ghost icon-sm, sr-only label; no copied UI |
| [[K-0142-ai-elements-conversation-scroll-button-unmounts-at-bottom-no-accessible-name]] | 0.8        | AI Elements scroll button: unmounts at bottom, smooth, no name        |
| [[K-0143-synthesis-chat-copy-action-and-scroll-to-latest-benchmark]]                    | 0.75       | Synthesis: chat copy action and scroll-to-latest benchmark table      |
| [[K-0158-untitled-ui-alerts-floating-full-width-no-size-no-role]]                       | 0.75       | Untitled alerts: floating, full-width; no size; no role on the page   |
| [[K-0159-untitled-ui-featured-icon-themes-colors-sizes-no-aria]]                        | 0.8        | Untitled FeaturedIcon: themes, colours, sizes sm to xl; sets no aria  |
| [[K-0160-shadcn-ui-alert-two-variants-role-alert-in-source-only]]                       | 0.8        | shadcn Alert: default, destructive; role alert in source, not docs    |
| [[K-0161-shadcn-ui-no-featured-icon-empty-and-item-media-nearest]]                      | 0.75       | shadcn lists no featured icon; EmptyMedia, ItemMedia are nearest      |
| [[K-0162-wai-aria-1-2-alert-role-assertive-focus-not-required]]                         | 0.8        | role alert: assertive, atomic; focus not required; no forced close    |
| [[K-0163-wai-aria-apg-alert-no-focus-no-auto-dismiss-load-silent]]                      | 0.8        | APG Alert: no focus change, no auto-dismiss, silent before load ends  |
| [[K-0164-wcag-2-2-status-messages-alert-for-errors-status-for-results]]                 | 0.8        | SC 4.1.3: status for results, alert for errors; dialogs excluded      |
| [[K-0165-wcag-aria19-empty-alert-container-before-the-error]]                           | 0.8        | ARIA19: empty role alert container present before the error           |
| [[K-0166-wcag-aria22-status-role-before-the-message]]                                   | 0.8        | ARIA22: role status set on the container before the message           |
| [[K-0167-wcag-2-2-use-of-color-visible-alternative]]                                    | 0.8        | SC 1.4.1 (A): colour needs a visible alternative; AT is out of scope  |
| [[K-0168-wcag-f81-error-fields-by-color-alone]]                                         | 0.8        | F81: error fields marked by colour alone fail SC 1.4.1                |
| [[K-0169-wcag-2-2-non-text-contrast-graphics-for-understanding]]                        | 0.8        | SC 1.4.11 (AA): 3:1 for graphics required for understanding           |
| [[K-0170-synthesis-alert-and-featured-icon-benchmark]]                                  | 0.75       | Synthesis: Alert and FeaturedIcon benchmark table, audit B form       |
| [[K-0237-untitled-ui-react-modal-parts-dismissal-and-focus]]                            | 0.8        | Untitled Modal: backdrop off by default; no size, role or state prop  |
| [[K-0238-untitled-ui-react-warning-and-destructive-modals-are-pro-examples]]            | 0.75       | Untitled React: warning and destructive modals are PRO, source unread |
| [[K-0239-untitled-ui-figma-modals-destructive-confirmation-treatment]]                  | 0.8        | Untitled Figma: red primary, icon, title naming the consequence       |
| [[K-0240-untitled-ui-button-destructive-colors-and-loading-state]]                      | 0.8        | Untitled Button: 3 destructive variants; isLoading stops presses      |
| [[K-0241-untitled-ui-alerts-confirm-action-and-no-confirmation-page]]                   | 0.75       | Untitled: no confirmation page; alerts take onConfirm, inline         |
| [[K-0242-react-aria-modal-dialog-role-prop-and-dismiss-defaults]]                       | 0.8        | React Aria: role alertdialog is a prop; no outside close by default   |
| [[K-0243-shadcn-ui-alert-dialog-parts-sizes-and-registry-classes]]                      | 0.8        | shadcn Alert Dialog: default and sm, Media slot, no aria or pending   |
| [[K-0244-shadcn-ui-alert-dialog-destructive-example-and-impact-text]]                   | 0.8        | shadcn Destructive: destructive action, outline cancel, tinted media  |
| [[K-0245-shadcn-ui-base-version-plain-action-and-base-ui-focus]]                        | 0.8        | shadcn Base UI: Action a plain Button; first tabbable gets focus      |
| [[K-0246-radix-alert-dialog-docs-parts-keyboard-and-api]]                               | 0.8        | Radix Alert Dialog: parts, API, Esc to trigger, alert pattern         |
| [[K-0247-radix-alert-dialog-source-cancel-first-no-outside-close]]                      | 0.8        | Radix source: Cancel takes focus; no outside close; Esc still closes  |
| [[K-0248-radix-alert-dialog-action-closes-on-click-no-pending-state]]                   | 0.8        | Radix Action closes on click; async needs controlled open             |
| [[K-0249-radix-dialog-wiring-and-focus-scope-first-tabbable]]                           | 0.8        | Radix Dialog 1.3.1: hideOthers, no aria-modal; first tabbable focus   |
| [[K-0250-wai-aria-1-2-alertdialog-role-focus-and-modality]]                             | 0.8        | ARIA 1.2 alertdialog: modal, focus inside, name required              |
| [[K-0251-wai-aria-apg-alert-dialog-pattern-roles-and-keyboard]]                         | 0.8        | APG Alert Dialog: confirmation prompts, aria-modal, describedby       |
| [[K-0252-wai-aria-apg-modal-dialog-initial-focus-and-return]]                           | 0.8        | APG Modal Dialog: least destructive action may take first focus       |
| [[K-0253-wai-aria-apg-alert-dialog-example-no-first-aria-disabled]]                     | 0.8        | APG example: focus on No; aria-disabled keeps buttons in Tab order    |
| [[K-0254-wcag-2-2-error-prevention-legal-financial-data-aa]]                            | 0.8        | SC 3.3.4 (AA): reversible, checked or confirmed; not every save       |
| [[K-0255-wcag-2-2-error-prevention-all-aaa]]                                            | 0.8        | SC 3.3.6 (AAA): the same three options for all submissions            |
| [[K-0256-wcag-2-2-g168-confirm-and-g99-recover-deleted]]                                | 0.8        | G168 confirm, then confirm or cancel; G99 recover deleted data        |
| [[K-0257-wcag-2-2-error-identification-and-suggestion-input-errors]]                    | 0.8        | SC 3.3.1 (A) and 3.3.3 (AA) cover input errors, failure unstated      |
| [[K-0258-wcag-2-2-focus-order-modal-dialog-example]]                                    | 0.8        | SC 2.4.3 (A) example: focus in dialog, back to button on dismiss      |
| [[K-0259-synthesis-confirm-dialog-benchmark]]                                           | 0.75       | Synthesis: ConfirmDialog benchmark table, audit B form                |
