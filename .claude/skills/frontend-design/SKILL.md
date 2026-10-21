---
name: frontend-design
description: Design critique and anti-template rules for any UI the team builds or generates (Studio screens, previews, directions, exports). Use before building new UI, when reviewing a visual direction, and when reviewing generated output for "looks AI-made" tells.
license: Adapted from anthropics/skills frontend-design (Apache 2.0, see LICENSE.txt)
---

# Frontend design

Adapted from Anthropic's `frontend-design` skill for ORIVILO. Two uses here: the **Studio's own UI**, and the **output ORIVILO generates** for customers. In both, the brief wins; where the brief leaves an axis free, do not spend it on a default.

## Ground every choice in the subject

Identify the product, its audience, and its primary job before designing. Industry, materials, and vernacular are where distinctive choices come from. Industry is context, never a style lock (brief, "Principles").

## Known tells of generated design

Treat each as a smell to justify or remove. ORIVILO's resolver and reviewer both check for them.

1. Warm cream background with a high-contrast serif display and a terracotta accent.
2. Near-black background with a single acid-green or vermilion accent.
3. Broadsheet layout: hairline rules, zero radius, dense columns.
4. The SaaS card kit: everything chopped into identical rounded cards, one radius for every hierarchy level, the same soft grey shadow under each, gradient washes as decoration.
5. Template chrome regardless of subject: tracked-out ALL-CAPS eyebrow above every heading, middle-dot meta strings, "WORD — fragment" labels, tinted near-black standing in for black, monospace for small data labels, an arrow appended to every link.
6. Typography tells: one accented word in a headline, all-caps labels, labels above content that add nothing.
7. Motion tells: fade-and-slide-up on every section, hover transitions on every card. One orchestrated moment beats scattered effects. Motion that answers a user action is welcome.
8. Numbered markers (01 / 02 / 03) on content that is not a sequence.

## Process

1. **Plan**: a compact token plan (4 to 6 named colors, typefaces and roles, a layout concept in one sentence plus an ASCII wireframe, alignment, principles). In ORIVILO this plan is the profile and its resolved tokens, never ad-hoc values.
2. **Review against the brief**: if any part is what you would produce for any similar brief, revise it and say why.
3. **Build**: semantic tokens only; watch CSS specificity; responsive to mobile; visible focus; reduced motion respected; contrast on real pairs in every mode.
4. **Critique**: screenshot and look. Spend boldness in one place; remove one accessory before shipping.

## Writing in the UI

Words are design content. Write from the user's view, in plain verbs and sentence case. A CTA says what happens ("Save changes"), and keeps its name through the flow. Errors say what went wrong and how to fix it; empty states invite action. Never render trust badges, ratings, or success states without backing data (AGENTS.md).
