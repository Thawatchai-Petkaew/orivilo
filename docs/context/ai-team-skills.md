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

Analysis on Opus (lead, product, ds-architect, designer, reviewer). Execution on Sonnet (builder, release). The reviewer finds, the builder fixes, the reviewer re-verifies. Owner decision, 2026-10-21.
