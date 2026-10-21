# ORIGO product brief

Source: the owner (GOLF), project chat, October 2026. This is the stable product context; change it only with the owner.

> **From business intent to living digital products.**
> เปลี่ยนเจตนาของธุรกิจ ให้เป็นแบรนด์ ระบบออกแบบ และผลิตภัณฑ์ดิจิทัลที่พัฒนาต่อได้

## Category

A **Brand-to-Product Platform**, not a UI generator or a design-system builder. Owners and teams work with AI from understanding the business through brand, visual direction, assets, design system, screens, frontend, review, and handoff. Every artifact links back to the reasons and requirements it came from.

## Modules

Discover → Brand → Design System → Product → Build → Review. The **Intent Engine** is the shared core that helps each module interpret, decide, and keep work continuous.

## The ten stages

| #   | Stage              | What the user and AI do                                                      | Saved result                                      |
| --- | ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | Business discovery | Describe idea, industry, customers, problem, value, competitors              | Business brief, audience, product goals           |
| 2   | Brand strategy     | Define positioning, personality, promise, voice                              | Brand strategy profile                            |
| 3   | Creative direction | Turn intent into options for mood, theme, color, typography, visual language | Direction boards, rationale, user choices         |
| 4   | Brand identity     | Explore name, logo, wordmark, symbol, usage                                  | Identity assets, usage rules                      |
| 5   | Brand CI           | Set palette, typography, imagery, iconography, motion                        | Brand guidelines, brand pack                      |
| 6   | Design system      | Turn CI into tokens, components, variants, patterns                          | Versioned design system, component contracts      |
| 7   | Product design     | Design flows and screens from business requirements                          | UX flows, editable designs, prototype             |
| 8   | Implementation     | Build the frontend from the system and screens                               | Code, asset integration, component mapping        |
| 9   | Review and handoff | Try flows, check visuals, behavior, consistency                              | Review results, approved release, handoff package |
| 10  | Evolution          | Take feedback and revise business, brand, design, or code                    | New revision with an impact list                  |

## Principles

- **Industry is context, not a style lock.** A finance product need not be blue. Options weigh audience, positioning, and personality together.
- **Full loop means you can go back and change things knowing the impact.** Example: the brand moves from "fun and approachable" to "calm and premium". ORIGO must show which creative directions need review, which colors, fonts, and graphic recipes change, which tokens and components change, which Figma screens and frontend views will differ, and which artifacts need re-review before a new version ships.
- **Figma and frontend sync is bounded.**

  | Linked     | Approach                                                            |
  | ---------- | ------------------------------------------------------------------- |
  | Tokens     | One central definition, generated into Figma and code               |
  | Components | Map each Figma component to a code component and its public API     |
  | Screens    | Record which component and token versions a screen uses             |
  | Edits      | Show diff and conflicts before applying changes from the other side |
  | Approval   | Record who approved what, and publish as a new version              |

  Never promise that free-form Figma edits round-trip into production code automatically. Define what syncs and what the team reviews.

- **The export is a working package**, not a pile of files: business and brand brief, editable logo and exports, CI guidelines, font references, token definitions, graphic assets, components, UX flows, Figma mappings, frontend code, and handoff docs, each with a version and asset usage rights.

## UX vision: from canvas toward Zero UI

Owner's direction, 2026-10-21. The target experience stays close to **Zero UI**: a familiar interface exists, chat exists, but the end state is **working by voice with interactive responses** that fit the task.

The path there, in order:

1. **Canvas first.** The user fills elements on a canvas. The left side holds input blocks (think ~100 of them) such as product goal, brand position, brand feeling, brand concept, colors, and desired emotions. Blocks can be filled before any research exists.
2. **Auto-generate groups on the canvas.** Filled blocks generate a new group, for example a mood board. The user points at any element (say, the logo) to go deeper: ORIGO asks until the logo, then the colors, are right, generating images along the way.
3. **Mood board → Digital Product Brand Book → tokens**, each through the same ask-and-refine process.
4. **Implement.** Set up or redesign a project, or connect to Figma to create matching local variables and tokens, so Figma design and the frontend team share one token set. From there, draw code straight from the frontend as a prototype, or build in Figma on the same tokens.
5. **Later layers:** image generation, and voice with rich interaction matched to the work at hand.

### Two adjustment layers (owner, 2026-10-21)

Besides the canvas and voice, the user can pick a **UI template**, state the intent ("how it should feel"), and get an analyzed result including color. After that the result stays adjustable on two layers:

| Layer  | Who                    | Controls                          | Example                                                                           |
| ------ | ---------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Intent | anyone                 | mood and tone words               | more minimal, more formal, friendlier                                             |
| Expert | people who know design | the underlying scales and presets | drag the border radius scale, drag the padding scale, pick or edit a color preset |

Both layers write to the same profile and resolve through the same deterministic path (handoff §12). The expert layer edits the values the intent layer would have chosen; it never bypasses the token contract.

### Every node carries a knowledge base (owner, 2026-10-21)

When the user asks (by voice or by clicking) for help with, say, a logo, a **logo node** appears on the canvas. Each node is a module that must be expert in its subject, because a correct digital product visual plus brand book draws on a large body of knowledge: digital and classic marketing, brand positioning, product positioning, product vision, user personas, and how each of these shapes design.

Rules for a node:

- **Collect before generating.** A node knows which inputs it needs. If the user mentions a topic that is not filled yet, the node asks for the missing pieces one by one, by voice or through UI controls, like collecting items in a game, until it can generate. Results are saved in that node.
- **Know-how, not a bare prompt.** A single prompt for "a logo" does not work. A node runs a process built on domain knowledge: for logos, the logo types that exist (wordmark, lettermark, iconic, combination, and so on), which type fits this product, and many reference examples from real brands for each type, so the generating team has enough references to produce what should be produced.
- **Map to the real business.** Knowledge comes from real brand books and brand guidelines, collected per industry: what a finance or accounting brand's logo tends to communicate, how formal it is, which colors, which fonts, rounded or square terminals, whether Thai and English both need support, and so on.
- **Node by node.** Every node on the path to a design system and brand book guideline (not only the logo) gets this treatment. Missing knowledge is a gap to fill, never something to improvise silently (ties to iron rule 4: be honest about what is real).

Implication: knowledge collection and curation (per node, per industry) is product work with its own stories, and the Intent Engine needs a place to hold and version that knowledge.

Implication for the Intent Studio MVP: input and interpretation must work as blocks on a canvas with a drill-down conversation per element, not as a single form.

## First milestone

The Design System module MVP (Intent Studio), scoped in `intent-studio-handoff.md` §19.
