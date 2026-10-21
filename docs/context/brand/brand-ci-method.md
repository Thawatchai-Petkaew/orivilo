# How ORIVILO designs a brand CI (method and knowledge structure)

Written 2026-10-21 as the first dry run of the question the product has to answer: given a brief for a product like ORIVILO, how do we get from intent to logo, color, mood board, Thai and Latin typography, and a presentation a client would recognize as a brand identity? The structure below is what the Intent Engine's brand nodes will encode. The ORIVILO case study on the canvas is the worked example. Every number in it is a hypothesis until the tests in §7 have run.

## 1. The process (five phases, in order)

Adapted from Alina Wheeler's identity process; each phase ends with agreement before the next starts.

| Phase         | Question answered                                                             | Output                                                                   |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1 Research    | Who are you? Who needs to know? How will they find out? Why should they care? | Audit readout: stakeholders, competitors, category cues, legal, language |
| 2 Strategy    | What is the one thing only this brand is?                                     | Brand brief (positioning, attributes, "onliness" line) + creative brief  |
| 3 Identity    | What is the big idea, and what does it look like?                             | Mood direction, mark, color, type, motion; tested, not just shown        |
| 4 Touchpoints | Where does it have to work?                                                   | Applications in priority order; trademark search started                 |
| 5 Guidelines  | How does everyone else use it without us?                                     | Tokens, rules, do/don't, assets; launch inside first                     |

In ORIVILO terms: phase 1–2 are the Discover and Brand modules, phase 3 is the Intent Studio, phase 4–5 are the Design System and Build modules. The case study follows the same order.

## 2. Inputs a brand node needs (the brief)

A brand cannot be designed from a name. The minimum brief, and the default the resolver uses when a field is empty:

| Input                       | Example for ORIVILO                                                                          | Default when missing                                               |
| --------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Category and lineup         | AI design and brand tools; Figma, Framer, Canva, Lovable, v0, Relume                         | ask; a brand without a lineup cannot be tested for distinctiveness |
| Audience                    | founders and small teams in Thailand and SEA, designers who advise them                      | ask                                                                |
| Onliness line               | the only brand platform that keeps every artifact traceable to the business reason behind it | ask                                                                |
| Personality (5 axes, 0–100) | Playful 65 · Expressive 70 · Structured 80 · Warm 70 · Premium 65                            | 50 on every axis                                                   |
| Avoid list                  | sparkles, robots, infinity, rainbow gradients, dashboards-as-tech                            | the generated-design tells in `frontend-design`                    |
| Scripts and languages       | Thai first, English parallel                                                                 | the user's locale                                                  |
| Constraints                 | WCAG AA, dark mode later, must survive at 16 px, no trademark risk                           | AA, light mode, 16 px                                              |

## 3. Strategy to design attributes (the mapping the resolver owns)

Personality axes map to a small set of design attributes. The map is a closed rule set, not free text, so the same brief resolves the same way twice.

| Axis       | Low end                             | High end                                     | What it moves                             |
| ---------- | ----------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Playful    | geometric, closed forms, single hue | organic terminals, open forms, a second hue  | mark geometry, illustration, motion ease  |
| Expressive | neutral palette, quiet type         | one high-chroma signature, display contrast  | signature color weight, display face      |
| Structured | loose grid, mixed radii             | strict grid, one radius scale, mono for data | layout, spacing, radius, data type        |
| Warm       | cool neutrals, blue-leaning         | warm neutrals, red-leaning accents           | neutral hue, accent temperature           |
| Premium    | bright, saturated, dense            | restrained, deep, generous space             | canvas value, density, chroma of neutrals |

ORIVILO's vector (65/70/80/70/65) resolves to: open-form mark, one signature color at high chroma, a strict grid with one radius scale, warm-leaning neutrals kept close to neutral, generous space.

## 4. Logo

Principles and tests, in the order they are applied:

1. **One idea.** The mark carries one idea that comes from the onliness line. For ORIVILO: a loop that does not close, with a dot at the open end: a decision that is still becoming, and the source reason it stays connected to.
2. **Simplicity test.** Remove each element; if the idea survives, the element goes.
3. **Construction.** Draw on a grid; define clear space as X, the height of the smallest internal element; define minimum sizes (favicon 16 px, app icon 48 px, print 8 mm).
4. **Variants.** Primary lockup, stacked, mark alone, monochrome positive and negative, dark and light. Grayscale must keep its impact.
5. **Versatility test.** 16/24/48 px, billboard, embroidery (one color), reversed, on a photo.
6. **Lineup test.** Mark next to the category at app-icon size. If a stranger picks it as "the AI tool", go back to 1.
7. **Similarity pre-screen.** Trademark databases (DIP Thailand, WIPO Global Brand Database, TESS) plus a visual search, before any vector refinement. This is a gate.
8. **Misuse list.** Stretching, recoloring, effects, rotation, placing on low-contrast ground.

## 5. Color

1. **Audit the category.** Record the dominant hue of each competitor. The gap is where distinctiveness is cheap; the crowd is what to avoid. Today the AI-tool category sits on 250–265° violet, black, and cream-with-clay.
2. **Roles before values.** Canvas, ink, one signature, one action color, two or three neutrals, four feedback colors. Five to seven colors in total; more weakens recognition.
3. **Proportion.** 60 canvas, 30 ink and neutrals, 10 signature. The signature is rare on purpose; rarity is what makes it a distinctive asset.
4. **Semantics stay separate.** Success, warning, danger, info, selection, and focus are never the brand accent. Focus is visibly different from selection.
5. **Contrast is computed, not eyeballed.** Text 4.5:1, large text and UI parts 3:1, in both modes. Every pair in the guideline carries its ratio.
6. **Dark mode is part of the palette**, not a later inversion: lighter tints of the action color on ink, same signature.
7. **Specify exactly.** HEX and OKLCH for screens, CMYK or Pantone only when print exists.
8. **Distinctive-asset plan.** Pick three to five assets to make famous (for ORIVILO: lime, the open loop, the dot, the Thai/Latin pairing). Measure fame and uniqueness with unbranded recognition tests once there is an audience.

## 6. Typography, Thai and Latin together

Thai has two styles: looped (traditional, better at small sizes and for older readers) and loopless (contemporary, closer in rhythm to Latin sans, best for display). Rules we apply:

1. **Pair by skeleton.** Choose a Thai and a Latin drawn to the same construction, or a Thai family that ships both styles. For ORIVILO: IBM Plex Sans Thai (looped) for body and UI, Anuphan (the loopless cut of the same skeleton) for display, IBM Plex Sans for Latin, IBM Plex Mono for tokens and code. One family tree, two registers.
2. **Looped for reading, loopless for headlines.** Switch at roughly 24 px.
3. **Line-height per script.** Thai carries vowels and tone marks above and below the line; body Thai needs about 1.6–1.7 where Latin takes 1.5. Never set Thai with Latin tracking or all-caps rules.
4. **Weight parity.** Match named weights across scripts, and check that the Thai at the same weight is not heavier on the page.
5. **Size parity.** Thai at the same nominal size often reads smaller; test mixed lines at every scale step and adjust the Thai size, not the line-height, if it does.
6. **Fallback stack declared**, never implied: `"Anuphan", "IBM Plex Sans Thai", system-ui` and so on, so a missing font degrades to a Thai-capable face.
7. **Specimen before approval.** Every type decision is shown as a mixed Thai and English paragraph, a numeral run, and a UI label row.

## 7. Tests before a brand is "real"

| Test                     | Pass condition                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- |
| Lineup (app icon + hero) | 3 outsiders do not pick ORIVILO first as "the AI tool"                          |
| Small size               | mark readable at 16 px, mono, reversed                                          |
| Contrast                 | every text pair ≥ 4.5:1, every UI pair ≥ 3:1, both modes                        |
| Mixed-script specimen    | Thai and Latin on one line at 14/16/20/32/56 px with no clipping or weight jump |
| Similarity               | no conflicting mark in DIP / WIPO / visual search                               |
| Avoid list               | none of the tells in `frontend-design` present                                  |

## 8. The presentation (Behance-style case study order)

Context → direction → core identity → system in action → brand in context. Concretely: cover · brief and method · strategy · mood board · logo (idea, construction, clear space, sizes, variants, misuse) · color (roles, proportion, contrast, modes) · typography (pairing, scale, specimen) · applications (product UI, social, print, environment) · system and next steps. Eight to fifteen boards; process before finals; mockups last.

## 9. What this tells the product

- The brand node needs a brief with a lineup and a personality vector; without them it can only generate a generic look, which is exactly tell #1.
- Rules in §3–§6 are closed mappings and can be encoded as decision rules with provenance (source, verifiedAt, confidence). Taste is in the mood direction and the mark idea; those stay human-in-the-loop.
- Every output carries its tests (§7) as acceptance criteria, so a brand is "approved" only when its tests have passed, the same way a profile is.

## Sources

- Alina Wheeler, Designing Brand Identity, five-phase process (summaries at logodesignlove.com/brand-identity-process and raleigh.aiga.org/?p=11474).
- Ehrenberg-Bass Institute, Distinctive Brand Assets (fame/uniqueness grid; summary at umbrex.com).
- Logo principles and construction rules: cieden.com/book/atoms/logo/principles-of-logo-design.
- Color roles, proportion, category audit: madegooddesigns.com/how-to-choose-brand-colors.
- IBM Plex Thai (looped and loopless) by Fontpad for IBM; Anuphan by Cadson Demak as the loopless cut on Google Fonts; Proxima Nova Thai notes on looped-for-text, loopless-for-display.
- Presentation order: wannathis.one on presenting a brand identity; unil.ink on Behance case-study structure.
- Owner-provided direction: `orivilo-brand-identity-v1.md` and its review.
