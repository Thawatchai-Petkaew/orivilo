# UI direction for the Studio shell (proposal, 2026-10-21)

Status: decided 2026-10-21. The owner chose mood E (airy bento, from the Docuverse reference) over A to D; the decisions are in `DESIGN.md` v1.1 §2, §3.1, §3.2, §3.3, §8. This file keeps the study and the reasons.

Correction 2026-10-21 (DESIGN.md v1.6): the ink primary action that v1.1 bundled with the bento layout was not part of the brand case study, which keeps Orbit violet for buttons, links and selection (boards 06, 08, 09). `action.primary` is violet again; the bento layout, lime `action.intent` and pill controls stand.

Original status: proposal for the owner's decision. Visual version with references and a shell mock: the "ORIVILO UI direction" artifact. Once the owner agrees, the decisions below move into `DESIGN.md` (v1.1) and the open tests into Storybook stories.

## The feeling

A calm studio with one living signal. The shell is quiet and precise so the customer's brand in the preview is the subject; ORIVILO itself shows as a single lime dot that moves when the system is thinking or has answered.

Five words: calm, precise, alive (one point), direct, neutrally warm.
Avoid: loud, cold developer-tool, "AI vibe" (violet-blue gradients, sparkles), the SaaS card kit, emptiness that does not say what to do next.

## Why, from our own product

1. The main screen shows someone else's brand. Colourful or glassy chrome steals attention and distorts colour comparison (Figma and Framer keep chrome grey and quiet for the same reason).
2. Intent Engine decides and explains. The UI always has a place for "because…", so type and tables matter more than effects.
3. Users are young makers. Google's expressive-design research (46 studies, 18,000+ participants) found 18–24-year-olds prefer expressive designs most (up to 87%) and find key actions up to 4× faster, while removing labels or loosening layout hurt usability. Our reading: calm shell, heavy and obvious primary action.
4. Thai and Latin on one line is our tested advantage; type carries the page, not icons.

## Decisions proposed

| Topic           | Proposal                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Light / dark    | Both; default follows the system; dark designed as its own set (remap by role, border one step lighter than surface, violet desaturated to #B07FEE).                                                                                  |
| Glass           | Only on three floating layers: toolbar over the canvas, command palette, toasts. Default 72% surface + 14 px blur. Solid fallback always; off under reduce-transparency. Never on cards, forms, long text, or inside a preview frame. |
| Depth           | Flat foundation; 1 px `border.subtle` separates sections; shadow only on overlays and floating bars; in dark, `surface.card` lighter than canvas replaces shadow.                                                                     |
| Shape           | Existing scale (control 6, container 10, media 14, overlay 22). Primary action gets weight from size and colour, not a different shape. Test control radius 6 vs 10 in Storybook at E2-4.                                             |
| Brand signal    | One lime dot per view: beside the selected nav item, in loading (dot runs the ring), in empty states. Violet is action only. No gradients.                                                                                            |
| Motion          | Feedback only (120/200/320 ms, one ease-out). Spring allowed on toggle, sheet, drag. No fade-in per section. One orchestrated moment: when a resolve completes, the dot closes the loop.                                              |
| Type            | Anuphan 600/700 leads; Plex Sans and Plex Sans Thai 400–600 for UI; no caps tracking; Thai never smaller than Latin.                                                                                                                  |
| Density         | `comfortable` default; `compact` at profile level; a node's first view shows only what must be filled.                                                                                                                                |
| AI in the UI    | Inline where the work is (node, inspector), no separate "AI" panel; every result has a "because…" and undo; rule-based is labelled rule-based.                                                                                        |
| Command palette | Cmd+K from the MVP for node navigation and actions; the one place glass is expected.                                                                                                                                                  |

## Open tests before locking

- Control radius 6 vs 10 on Button and Input (Storybook, E2-4).
- Glass toolbar over a preview with real photography: icon contrast still ≥ 3.0.
- Dark `surface.selected` and feedback values stay placeholders until E0-5 computes them.
- Lineup: our shell next to Linear, Figma, Framer for three outsiders; must not be picked as "the AI one".

## Sources

- Google Design, Expressive Material Design research: https://design.google/library/expressive-material-design-google-research
- Setproduct, glassmorphism vs liquid glass vs flat in 2026: https://www.setproduct.com/blog/liquid-glass-vs-glassmorphism
- Gleam Studio, UI design trends 2026: https://www.gleamstudio.design/blog-post/ui-design-trends-2026
- SaaS UI, 7 SaaS UI design trends 2026: https://www.saasui.design/blog/7-saas-ui-design-trends-2026
- Aufait UX, Gen Z UI (vendor blog; dark-mode figures 73% and 82% conflict, used as direction only): https://www.aufaitux.com/blog/tactile-maximalism-gen-z-ui/
- Ours: `docs/context/brand/orivilo-brand-spec-v1.1.md`, `DESIGN.md`, ADR 0003, handoff §10, §16, §17.
