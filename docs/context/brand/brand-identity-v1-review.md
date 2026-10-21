# Review: ORIVILO brand identity v1 (three routes)

Reviewed 2026-10-21 against `AGENTS.md`, ADR 0003, the handoff (§9, §10, §17, §23), and the `frontend-design` skill. Source: `orivilo-brand-identity-v1.md` (owner-provided). Verdict: strong foundation; pick Route 01 as the base with the changes below, and treat the palette as v1 primitives, not the final identity.

## What is right and should stay

- Feedback colors are separate from brand accents (lime is not success, coral is not error). This is our rule verbatim.
- Contrast pairs are computed and honest. Re-verified: white/violet 5.78, violet/canvas 5.34, ink/lime 12.99, ink/coral 9.12, muted ink/canvas 5.30, control border/white 4.24 (passes the 3:1 UI-component floor). All match the document.
- The user's brand gets its own token namespace; the app shell stays ORIVILO. This is `DesignProfileBoundary` in words.
- Thai and Latin typography are treated separately (line-height per script, no tracking copied from Latin).
- Motion has durations, one easing, and reduced-motion behavior.
- The document labels its own hypotheses as hypotheses (personality numbers, raster logos, no trademark clearance). This is iron rule 4 applied to a brand doc.
- The "avoid" list (sparkles, robots, infinity, rainbow gradients, dense dashboards-as-tech) overlaps with our generated-design tells.

## What to change

### 1. Route 01's palette sits on two known "AI-made" tells

Measured hues: canvas #F7F6F2 is a warm cream (hue 48), coral #FFB39E is a warm clay (hue 13), violet #6D3DF5 is a 256° violet. The `frontend-design` skill lists "warm cream background with a terracotta or warm-clay accent" as tell #1, and 250–265° violet is the default primary of a large share of AI and SaaS products launched since 2023. Route 01 as written would read as "another AI tool" in a lineup, which is the opposite of the brief's goal.

Keep Route 01's ideas (loop ribbon, editorial composition, lime as a discovery signal) and change the palette:

- Make **lime the signature** and violet the structure. Lime #D9F66F against ink is distinctive and already has the best contrast in the set.
- Move the primary off the 250–265° band. Test two candidates: a blue-violet near 245° and a red-violet near 275–280°, both at the same lightness so contrast pairs survive. Decide with a lineup test (below).
- Cool the canvas slightly (toward hue 60–80, lower chroma) or go neutral, so the cream-plus-clay pairing disappears. Keep coral for illustration only, never as a UI accent.

### 2. Route 02 and Route 03 are weaker than their summaries suggest

- Route 02 (orange on cream, clay forms): the document's own warning is right, and claymorphism is a 2023–2024 trend that will date the brand. Also tell #1 again (cream plus warm clay).
- Route 03 (cobalt, open frame): cobalt-on-chalk is the default of B2B productivity tools, and the mark is one proportion away from the "open in new" icon. Fixable, but it would need the most work to feel owned.

Recommendation: Route 01 revised, with Route 03's restraint applied to the workspace.

### 3. Token mapping uses the shadcn variable set, which ADR 0003 removes

§11 maps onto `--primary`, `--card`, `--ring`, `--muted`, `--destructive`. We do not use that set. Keep the primitives (`--ori-*`) and map to our semantic layer (handoff §9.2):

```
surface.canvas, surface.card, surface.raised, surface.selected
text.primary, text.secondary, text.on-action, text.on-selected
action.primary, action.primary-hover, action.secondary
border.subtle, border.control
selection.bg, selection.fg
focus.ring
feedback.success / warning / danger / info (+ on-*)
brand.highlight (lime), brand.warmth (coral, illustration only)
```

`--radius-control / card / hero` are component tokens; put a radius scale in primitives (`radius.s/m/l/xl`) and let component tokens reference it.

### 4. Missing pieces that block use as a profile

- **Dark mode.** The profile schema requires a complete token set per declared mode. Define `supportedModes: ["light"]` honestly until dark exists, or add dark now (violet needs a lighter tint on ink to keep 4.5:1).
- **Focus is not selection.** Both are violet. Define `focus.ring` as a distinct treatment (2px ring with 2px offset, or a different hue) so keyboard users can tell focus from selected.
- **Font fallback stack.** Manrope has no Thai glyphs. Declare `Manrope, "IBM Plex Sans Thai", system-ui` and test mixed-script lines at every scale step; the document only says "adjust after testing".
- **Hover and pressed values** for action.primary (the doc lists violet-600 for hover; add pressed and disabled).

### 5. Logo: pre-screen all three before any vector work

The Becoming Loop (open O with an upturned terminal) sits near many loop and O marks; the Growing Origin reads as seed/leaf; the Open Frame reads as an icon. Run a similarity search (TESS/WIPO plus a visual search) before redrawing. The document says this; make it a gate, not a note.

### 6. Make ORIVILO its own first customer

The personality sliders (Playful 65, Expressive 70, Structured 80, Warm 70, Premium 65) are already an intent vector. When the resolver exists, ORIVILO's brand should be produced through it: brief → direction → identity → profile. That proves the product and keeps the Studio's own profile under the same rules as every customer's.

Until then, the Studio shell uses a **neutral profile** (handoff §17): canvas, ink, one violet for selection and primary action, no lime or coral in the workspace. Lime and coral live in marketing and onboarding only.

## Decision test before locking

1. Build the lineup: ORIVILO's revised mark and palette next to 10 current AI and design tools at app-icon size and on a landing hero.
2. Ask three people outside the team which one is "the AI tool"; if ORIVILO is picked first, the palette is still on a tell.
3. Run the small-size tests the document lists (16/24/48 px, monochrome, reverse) on the revised mark.

## Proposed v1.1 edits to the source document

- §5: add the lineup test as an exit criterion.
- §6: replace the primary with the chosen off-band violet, cool the canvas, demote coral to illustration, add hover/pressed/disabled and a dark set.
- §7: add the fallback stack and the mixed-script test.
- §11: rewrite the mapping onto our semantic layer and a radius scale.
- §12: insert "similarity pre-screen" before "redraw vector".
