# AI team: skills adopted from Anthropic's catalog

Reviewed `github.com/anthropics/skills` on 2026-10-21 (19 skills). Decision rule: adopt only what makes an ORIVILO story better; adapt rather than copy; keep each skill short.

## Adopted (adapted into `.claude/skills/`)

| Skill                         | Why it helps ORIVILO                                                                                                                                        | What we changed                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `frontend-design`             | Its list of "tells of generated design" is exactly the anti-pattern catalog the resolver and reviewer need. Applies to Studio UI and to generated previews. | Trimmed to ORIVILO rules; tokens come from the profile, never ad-hoc; linked to the honesty rule.                  |
| `webapp-testing`              | Reconnaissance-then-action with Playwright gives gate packets real browser evidence.                                                                        | Rewritten in TypeScript; permanent e2e tests go in `apps/web/e2e/`.                                                |
| `skill-creator` (method only) | Its loop (draft, test prompts, evaluate, rewrite, improve the description) is how we should maintain our own skills.                                        | Not installed (485 lines, Python tooling). The `retro` skill follows the same loop when it proposes a rule change. |

## Later, when the story arrives

| Skill               | When                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-builder`       | Build module: the developer handoff includes an MCP server (brief, "What the developer receives"). Install then; it carries TypeScript SDK references.            |
| `discernment-nudge` | Candidate for the Studio's own UX: after a generated recommendation, ask the user 2 to 3 questions that test the key assumptions. Product idea, not a team skill. |

## Not adopted, and why

| Skill                                                  | Reason                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `theme-factory`                                        | Ten preset themes contradict intent-driven resolution. Industry is context, not a style lock.          |
| `brand-guidelines`                                     | Anthropic's brand, not ours. The pattern (one skill per brand) may return as a customer-facing export. |
| `canvas-design`, `algorithmic-art`                     | Static art generation; not on the roadmap.                                                             |
| `web-artifacts-builder`                                | For claude.ai artifacts, not a repo.                                                                   |
| `docx`, `pdf`, `pptx`, `xlsx`, `doc-coauthoring`       | Already available in Claude for documents; no code story needs them in the repo.                       |
| `internal-comms`, `slack-gif-creator`, `academy-guide` | Unrelated to delivery.                                                                                 |

## Also recommended: the `superpowers` plugin (community)

`obra/superpowers` is the most used skill set for Claude Code engineering loops. Our agent files already take three practices from it: review in two passes (spec, then quality), TDD in the builder, and verification before completion. Install it per developer with `/plugin` when wanted; we do not vendor it.

## Model policy

Analysis on Opus (product, ds-architect, architect, security, research, designer, reviewer, qa). Execution on Sonnet (builder, release). The main session runs the loop through the `ovl` skill. The reviewer finds, the builder fixes, the reviewer re-verifies; qa walks the acceptance criteria. Owner decision, 2026-10-21.

## Review: UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`, MIT, v2, last commit 2026-10-15)

What it is: a Python search script over CSV datasets (192 product types, 79 styles, 192 palettes, 74 font pairings, 34 landing patterns, 119 UX guidelines, 22 stack guides, motion and chart tables) plus a reasoning layer that turns "beauty spa landing page" into a design system (pattern, style, colors, typography, effects, anti-patterns, pre-delivery checklist). Owner asked on 2026-10-21 whether our team should improve anything from it.

### What we should take

| Their idea                                                                                                                                                                                                                | Why it matters to ORIVILO                                                                                                                       | What we do                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Knowledge as structured records, not prose: every row has keywords, do/don't, severity, status, `verifiedAt`, docs URL; `data-provenance.json` adds confidence, sources, and a freshness SLA (needs-review after 90 days) | This is the cheapest working version of "every node carries a knowledge base" (brief). Records can be searched, tested, versioned, and expired. | Model our knowledge record contract on it: `id`, `kind`, `appliesTo`, `status`, `verifiedAt`, `confidence`, `sources[]`, plus our own `industry`/`audience`/`personality` facets. zod schema in `intent-engine`, with data-quality tests like their `test_data_contracts.py`. |
| Closed, non-executable decision-rule grammar (`reasoning_contract.py`: fixed condition names such as `if_luxury`, fixed action prefixes `style:`/`pattern:`/`constraint:`)                                                | Rules stay data, never code. Matches our security rule that model output and knowledge are data, and keeps the resolver deterministic.          | Use the same shape for resolver rules: conditions from a fixed vocabulary, actions as typed references into the catalog.                                                                                                                                                      |
| Design dials: `--variance`, `--motion`, `--density` as 1 to 10 sliders layered over the query                                                                                                                             | Independent confirmation of the owner's two adjustment layers (intent words, then expert scales).                                               | Keep. Our expert layer maps to real token scales (radius, spacing, motion), not to a re-query.                                                                                                                                                                                |
| Master + page overrides, read before building each page                                                                                                                                                                   | Same idea as profile + surface override in the handoff.                                                                                         | Already in the profile schema (`context.surface`).                                                                                                                                                                                                                            |
| Pre-delivery checklist (no emoji icons, cursor on clickables, 4.5:1 contrast, visible focus, reduced motion, text reflow without clipping, 4 breakpoints)                                                                 | Concrete, checkable, cheap.                                                                                                                     | Fold into `quality-gate` design checks and the reviewer's pass 2.                                                                                                                                                                                                             |
| Stack guides with verified dates (`stacks/shadcn.csv`: OKLCH variables via `@theme inline`, CLI usage, path aliases)                                                                                                      | Directly our stack.                                                                                                                             | Builder reads it as reference when touching shadcn; no vendoring.                                                                                                                                                                                                             |

### Where it conflicts with ORIVILO, so we do not copy

- **Industry is a lookup there.** Product type maps 1:1 to a palette and a style priority. Our brief says industry is context, never a style lock; audience, positioning, and personality must weigh in. Their rows become one input with a confidence, never the decision.
- **Palettes are generic hex per product type.** For us the brand CI is an input and locked fields win. Their colors are at most a fallback for a brand with no CI yet, labelled as such.
- **Flat CSV, no graph.** Full Loop needs to know which decisions depend on which inputs so a change shows its impact. Our records need typed relations, not only keywords.
- **Python runtime.** We re-implement search and rules in TypeScript inside `intent-engine` so they run in the app, tests, and jobs.
- **Their premium tier covers brand identity, logo, CIP, iconography.** Same territory as ORIVILO's Brand module. Useful as a market signal; nothing to reuse.

### Concrete improvements for our team

1. **Knowledge epic, story 1:** knowledge record contract + provenance + freshness + data-quality tests in `intent-engine`, modelled on the above.
2. **Story 2:** seed the first corpus by importing their MIT-licensed `styles.csv`, `ux-guidelines.csv`, `motion.csv`, and `stacks/shadcn.csv` with provenance `derived: ui-ux-pro-max v2 (MIT)` and confidence capped at 0.7, so nodes are not empty on day one. Our own curation (Mobbin, Dribbble, team Storybooks, real brand books) layers on top with higher confidence.
3. **Resolver rules** use a closed grammar from the start.
4. **Quality gate** gains their pre-delivery checklist items.
5. **Do not install it as a team skill.** It would pull the builder toward product-type lookups. Developers may install it locally for the stack guides.
