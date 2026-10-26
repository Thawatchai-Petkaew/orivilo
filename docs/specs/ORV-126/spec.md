---
issue: ORV-126 (https://tpetkaew.atlassian.net/browse/ORV-126), under epic ORV-109
lane: L (a new engine contract every brand node will depend on: the node graph, the entry classifier and the fill order; it wraps the ORV-20 resolver logic)
version: 1.1
---

# ORV-126: phase 1 CI guidebook, entry points and the brand node graph

## Why

The owner set phase 1 on 2026-10-26: ORIVILO should first produce a CI guidebook, the kind of artifact the ORIVILO brand identity case study is (a brand concept, a logo and how it was derived, brand colours, typography, each with its reasons). This is not the design system; tokens, UI role palettes and components come later.

The owner also asked how CI is really made, where projects start, how the starting points group, which to support first, and what to fill first when a user brings only part of the input. The owner's own list (business concept, name, vibe, mood) was a starting thought, not the answer. The research is in `docs/knowledge/brand/` (K-0028 to K-0044), summed up in K-0044 (confidence 0.75): practice follows one dependency order (situation and audit, strategy, naming and verbal identity, a core idea, visual elements, then touchpoints, tests and guidelines); projects enter it at one of five points; and when strategy is missing, practitioners ask, research or run a short workshop instead of filling defaults (K-0036, 0.75).

The brief makes knowledge the moat and asks that every node "collect before generating" and that a user may jump to any node while the graph tracks what is still missing (brief, "Every node carries a knowledge base" and "The board is a presentation, entry is dynamic"). This spec turns the research into a harness the engine can run: an entry catalog, a node graph with dependencies and knowledge, a fill order, and a guidebook assembled with a trace. The owner picked the patterns at G1 (section "Owner decisions (decided at G1)") before any node beyond ORV-20 is built.

### What is real, rule-based and simulated

- **Real (once built):** the graph as data, its integrity check, the entry classifier, the fill planner (including skips and provisional marks) and the guidebook assembly. All are deterministic TypeScript in `packages/intent-engine` with tests.
- **Rule-based, not AI:** no slice in this spec calls a model. Every result says `method: "rule-based"`. The intake classifier reads a structured inventory, not free text, in the POC.
- **Given by a person in these slices:** strategic values are written by the person, helped by proxy questions (decision D1), or skipped. The logo mark has no value until its image story ships (decision D8).
- **Drafted by AI, in later stories and always labelled:** options for strategic nodes drafted from the person's proxy answers (D1 step 2), and logo image drafts inside the decided frame (D8). Each is its own story with its own eval set (ADR 0008, ADR 0009); until a story ships, nothing may say ORIVILO drafts that value. A logo image is a draft for exploring a direction: nothing says it is trademark cleared, unique, registrable or owned.
- **Hypothesis-grade:** every node and number that rests on a knowledge entry below confidence 0.7, or on no entry at all, carries `hypothesis: true` and names the low source (section "Hypotheses").
- **Not done, and said so:** the guidebook states that the name and mark are not IP screened and the identity is not validated by tests, because those nodes are not in the POC, and it lists every strategic step the person skipped together with every decision that rests on it.

## Story

As a founder, designer or product manager who brings whatever I have (an idea, a name, an existing brand, a merger, or only a feeling), I want ORIVILO to recognise where I am starting, ask me only for what the next step truly needs, in the order practitioners work, in questions I can answer even when I have no strategy written down, and assemble a CI guidebook in which every element names the inputs, rules and sources it came from, so that I get a brand concept, logo direction, colour and type with reasons, an unanswered question stays a visible question instead of a silent default, a step I skip stays visible as unconfirmed together with everything that rests on it, and I can jump to any element and see what it still waits on.

## The harness (six parts)

The graph is built from these parts. A model only interprets input and drafts options; rules decide; checks gate; the person confirms at gates.

1. **Intake classifier.** Reads the starting inventory and decides the entry group (A to E) by rules, places given inputs as fixed nodes, and asks one question when nothing is given. POC: structured inventory only. Later: a model reads free text and documents into inventory facts with evidence spans (ADR 0008 pattern); the rules still decide the group.
2. **Sequencer (fill planner).** From the graph and the node states, returns the next nodes in fill order, the questions to ask (proxy questions first for strategic nodes), and for a target node the chain it still needs. It records skips and marks what rests on them provisional. Never fills a value.
3. **Knowledge.** Each node cites research entries (K-ids in `docs/knowledge/`) and engine knowledge entries (ADR 0005 shape, for example ORV-20's `color.*`). A node's rules may cite only engine entries; engine entries cite K-ids as sources.
4. **Decision rules.** Closed rules per node (ADR 0006, scoped per node as ADR 0017 set for colour). In the POC: `color` (ORV-20 slice A), and later `logo-type` and `typography` in their own stories.
5. **Checks.** Deterministic checks after a node decides: graph integrity, contrast (E0-5), and later the Thai colour culture flag (K-0040) and Thai script coverage for type.
6. **Model calls.** Interpret input and draft options only: intake free text, options for strategic nodes from proxy answers (D1), and logo image drafts inside the decided frame (D8). None in this spec's slices; each arrives as its own story with its own eval set (ADR 0009). The logo image story also waits on an architect ADR that settles the image provider (D8).

## Entry-point catalog

Five groups, from K-0044 §1 and K-0029 (0.8). The owner's "vibe" and "mood" merge into group E; C and D are added because the sources show them and the owner's list did not.

### A. New brand from a concept

- **The user brings:** a business idea or offer; no name, no identity.
- **Classifier signal:** concept given; no live brand, no structural change.
- **Fixed nodes:** none.
- **First node:** `business-core`.
- **Evidence:** Wheeler "Creating the New" (K-0028, 0.85); Zag checkpoints 1 to 6 (K-0030, 0.8).

### B. Name given first

- **The user brings:** a chosen or registered name, usually with a concept.
- **Classifier signal:** name given; no live brand, no structural change.
- **Fixed nodes:** `name` (given). The name constrains strategy and drives the logo type (wordmark by default, K-0037); it skips nothing upstream.
- **First node:** `business-core`.
- **Evidence:** Wheeler "Name Change" (K-0028); Haviv on emphasising the name (K-0037, 0.85).

### C. Existing brand to change

- **The user brings:** a live brand to refresh (evolution) or rebrand (revolution).
- **Classifier signal:** live brand; no structural change.
- **Fixed nodes:** whatever the audit keeps.
- **First node:** `audit` (equity decides what is kept, K-0029, K-0039).
- **POC:** not supported (decision D2); the classifier says so and fills nothing.

### D. Structural change

- **The user brings:** a merger, a new parent, a portfolio or several brands to unite.
- **Classifier signal:** structural change, with or without a live brand.
- **First nodes:** `audit`, then `architecture` before any mark (K-0028); many units to unite justify a symbol (K-0037).
- **POC:** not supported (decision D2).

### E. Expression first

- **The user brings:** a vibe, a mood, a look or reference images.
- **Classifier signal:** expression references only; no name, no live brand.
- **Fixed nodes:** none. The references are stored as **evidence** on `identity-frame` and `look-feel`, not as decisions; no method read starts here (K-0029), and the sources place look and feel after the brief (K-0028).
- **First node:** `business-core`. If the person insists a reference is a constraint, it becomes a given input and is checked against strategy later.

### Precedence and the sixth trigger

- When signals combine, the classifier takes the first match in this order: D, C, B, E, A. Expression references in a B, C or D inventory are kept as evidence the same way as in E.
- New leadership or a new strategic plan (NYBG, K-0035) is not a separate group: it classifies as C when a brand exists and as A when it does not.

### The start question (copy for review by the designer and the owner)

When the inventory is empty the classifier asks `situation.start`, the only question it asks before a group exists:

- en "What are you starting from?"; th "คุณเริ่มต้นจากอะไร"
- A: en "A business idea, no name yet"; th "ไอเดียธุรกิจ ยังไม่มีชื่อ"
- B: en "A name we already chose"; th "ชื่อที่เลือกไว้แล้ว"
- C: en "A brand that already exists"; th "แบรนด์ที่มีอยู่แล้ว"
- D: en "A merger, a new parent, or several brands to bring together"; th "การควบรวม บริษัทแม่ใหม่ หรือหลายแบรนด์ที่ต้องรวมกัน"
- E: en "A look or a feeling we have in mind"; th "ภาพหรือความรู้สึกที่มีอยู่ในใจ"

And `situation.sub-brands`, used to derive `architecture` in groups A and B: en "Does this brand sit above or below other brands?"; th "แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่"

This copy is data in the engine and is not rendered in any slice of this spec.

## The node graph

Twenty-two nodes from K-0044 §2 (a candidate graph, confidence 0.75). Each node lists its harness part, inputs, output, dependencies, knowledge, and what the harness does when an input is missing.

Dependencies come in two kinds:

- **requires:** the node cannot run until the dependency is done (given, kept, derived, decided or confirmed) or skipped by the person (see "Missing strategy" below). The sequencer asks for it first.
- **informs:** the node may run without it; its record lists the dependency under `madeWithout`, and the guidebook shows that.

A node that is **given** by the person does not need its own requires to be done; its record lists the open requires under `unchecked` (K-0044 §3: keep what the client insists on and check it against strategy, never overrule it silently).

When an input is missing, each input names one behaviour, `onMissing`:

- **ask:** a question to the person, with a question id and Thai and English text.
- **proxy:** for strategic inputs only, the ladder in "Missing strategy" below: proxy questions, then drafted options to pick, then an allowed skip.
- **draft:** a model drafts options from given material and the person confirms; until the drafting story ships, this behaves as ask.
- **derive:** computed by a deterministic function from other inputs (for example `crowded` from the lineup).
- **open:** the input stays open and the node stays open; nothing is filled.

There is no `default` behaviour (decision D1). "Gate" marks a point where the person must agree before downstream nodes count it as done (Wheeler's "achieve agreement", K-0028).

### Missing strategy: proxy questions, drafted options, or a skip (decision D1)

The six strategic nodes are `business-core`, `audience`, `competitive-frame`, `positioning`, `identity-frame` and `core-idea`. Their inputs use `onMissing: "proxy"`, which runs three steps in order:

1. **Proxy questions.** Instead of asking "what is your positioning?", the node asks questions a person without a written strategy can answer. The answers are stored as evidence on the node, not as its value.
2. **Drafted options to pick.** A model drafts two or three options for the node's value from the proxy answers and the given material; the person picks one, edits one, or writes their own. A picked option is `confirmed`; a draft not picked is never a value (row 19). Until the drafting story for a node ships, this step is skipped and the person writes the value from their own proxy answers. A drafted lineup for `competitive-frame` may suggest a category and competitor names; it never drafts a competitor's colour.
3. **Skip.** The person may skip the node. A skipped node stays `open` with `skipped: true` and no value. Its dependents are not blocked by it: they may run, and every record derived, decided or confirmed downstream of it, directly or through the chain, carries `provisional: true` and names it in `provisionalOn`. A given record downstream keeps `given` and lists the skipped node in `unchecked`. An input whose value can come only from the skipped node stays open, and the rule that needs it returns its question; a skip never becomes a value, a default or a neutral middle. The guidebook lists every skipped node and every record provisional on it under `unconfirmed` (row 24). The person can come back to a skipped node at any time; answering it clears the provisional marks it caused.

A required input that was never answered and never skipped still blocks its dependents (row 16).

The proxy questions (copy for review by the designer and the owner; question ids are `<node>.proxy.<slug>`):

- `business-core.proxy.offer`: en "What do you sell or offer, and to whom?"; th "คุณขายหรือให้บริการอะไร และให้ใคร"
- `business-core.proxy.why`: en "Why did you start this? One or two sentences is enough."; th "ทำไมคุณถึงเริ่มทำสิ่งนี้ ตอบสั้น ๆ หนึ่งหรือสองประโยคก็พอ"
- `audience.proxy.best-customer`: en "Describe one customer you would like ten more of."; th "เล่าถึงลูกค้าหนึ่งคนที่คุณอยากได้แบบนี้เพิ่มอีกสิบคน"
- `audience.proxy.problem`: en "What problem were they trying to solve when they found you?"; th "ตอนที่เขาเจอคุณ เขากำลังพยายามแก้ปัญหาอะไรอยู่"
- `competitive-frame.proxy.instead`: en "When a customer does not choose you, who or what do they choose instead?"; th "เมื่อลูกค้าไม่เลือกคุณ เขาเลือกใครหรืออะไรแทน"
- `positioning.proxy.only`: en "What does a customer get from you that they cannot get from those alternatives?"; th "ลูกค้าได้อะไรจากคุณที่หาไม่ได้จากตัวเลือกอื่นเหล่านั้น"
- `identity-frame.proxy.person`: en "If your brand were a person, which three words would people use to describe them?"; th "ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา"
- `identity-frame.proxy.never`: en "How should your brand never feel?"; th "แบรนด์ของคุณไม่ควรให้ความรู้สึกแบบไหน"
- `core-idea.proxy.remember`: en "After someone meets your brand, what one thing should they remember?"; th "หลังจากได้รู้จักแบรนด์ของคุณ คุณอยากให้คนจำอะไรได้หนึ่งอย่าง"

And the strings around them, with their meaning (data in the engine; a screen later takes them through the locale catalog):

- `strategy.skip`: en "Skip for now"; th "ข้ามไปก่อน"
- `strategy.draftedOptions`: en "Drafted by AI from your answers. Pick one, edit it, or write your own."; th "AI ร่างจากคำตอบของคุณ เลือกหนึ่งข้อ แก้ไข หรือเขียนเอง"
- `strategy.provisional`: en "Provisional. This rests on a step you skipped."; th "ชั่วคราว เพราะอิงกับขั้นตอนที่คุณข้ามไว้"
- guidebook section `unconfirmed`: en "Not yet confirmed"; th "ยังไม่ได้ยืนยัน"

### 1. Situation and initiative type (`situation`)

- **Part:** intake classifier.
- **Inputs:** the starting inventory (concept, name, live brand, structural change, expression references, sub-brands).
- **Output:** entry group, fixed nodes, the node set in scope.
- **Requires:** none.
- **Knowledge:** K-0029 (0.8), K-0044 (0.75).
- **When missing:** ask `situation.start`; never assume group A.
- **POC:** yes.

### 2. Research and audits (`audit`)

- **Part:** model (reads existing material, drafts the audit readout), checks, person confirms.
- **Inputs:** existing assets, stakeholder answers, market, visual, verbal, legal and language audits.
- **Output:** audit readout and the list of kept elements.
- **Requires:** `situation`.
- **Knowledge:** K-0028 (0.85), K-0029 (0.8), K-0039 (0.75).
- **When missing:** ask for the assets; draft from them; never assume nothing is worth keeping.
- **POC:** no. The competitor lineup the POC needs lives in `competitive-frame`.

### 3. Business core (`business-core`)

- **Part:** proxy questions; drafted options from the answers later; person picks or skips.
- **Inputs:** who, what, why; vision; values.
- **Output:** a stated core.
- **Requires:** `situation`. **Informs:** `audit`.
- **Knowledge:** K-0030 (0.8), K-0028 (0.85), K-0036 (0.75).
- **When missing:** proxy (`business-core.proxy.offer`, `business-core.proxy.why`), then options to pick, or skip.
- **POC:** yes, as given answers or a skip.

### 4. Audience and insight (`audience`)

- **Part:** proxy questions; drafted options later; person picks or skips.
- **Inputs:** target audience; insight.
- **Output:** target and insight.
- **Requires:** `situation`. **Informs:** `audit`.
- **Knowledge:** K-0028 (0.85); K-0034 (0.65) for the insight field.
- **When missing:** proxy (`audience.proxy.best-customer`, `audience.proxy.problem`), then options to pick, or skip.
- **POC:** yes. **Hypothesis:** the insight field's shape rests on K-0034 at 0.65.

### 5. Competitive frame and lineup (`competitive-frame`)

- **Part:** proxy questions, then a deterministic audit (`auditLineup`, ORV-20).
- **Inputs:** category; a lineup of competitors with each one's dominant colour.
- **Output:** category set, crowded and open colour families.
- **Requires:** `situation`. **Informs:** `audit`.
- **Knowledge:** K-0028 (0.85), K-0039 (0.75); engine entries `color.audit-the-category` (0.8) and `color.hue-families` (0.4).
- **When missing:** proxy (`competitive-frame.proxy.instead`), then options to pick (category and names only), or skip; `crowded` is derived; a lineup colour is never invented. When skipped, `color` runs with no lineup and ORV-20 returns its `lineup` question, so the signature stays open.
- **POC:** yes. **Hypothesis:** the hue bands and the crowd threshold (`color.hue-families`, 0.4).

### 6. Positioning, gate (`positioning`)

- **Part:** proxy questions; drafted options later; person agrees or skips.
- **Inputs:** nodes 3, 4, 5.
- **Output:** onliness statement and brand brief.
- **Requires:** `business-core`, `audience`, `competitive-frame`.
- **Knowledge:** K-0028 (0.85), K-0030 (0.8).
- **When missing:** proxy (`positioning.proxy.only`), then options to pick, or skip.
- **POC:** yes, as a given statement or a skip.

### 7. Identity frame (`identity-frame`)

- **Part:** proxy questions, then the vocabulary of decision D6.
- **Inputs:** positioning; in the POC, the five-axis personality vector ORV-20 reads (playful, expressive, structured, warm, premium, 0 to 100).
- **Output:** personality and attributes.
- **Requires:** `positioning`. **Informs:** `business-core`, `audience`.
- **Knowledge:** K-0031 (0.7), K-0032 (0.8), K-0033 (0.7, archetype effects weak).
- **When missing:** proxy (`identity-frame.proxy.person`, `identity-frame.proxy.never`), then options to pick, or skip; each axis is asked; never 50 on every axis. When skipped, ORV-20 returns its `personality.<axis>` questions and the decisions that need them stay open.
- **POC:** yes. **Hypothesis:** no source read uses the five axes (K-0044 §4); archetype effects are weak (K-0033).

### 8. Brand architecture (`architecture`)

- **Part:** derive in groups A and B; questions and audit in D.
- **Inputs:** `situation.sub-brands`; existing brands and portfolio.
- **Output:** master brand, endorsed, or house of brands; the number of units to unite.
- **Requires:** `situation`, `positioning`. **Informs:** `audit`.
- **Knowledge:** K-0028 (0.85).
- **When missing:** ask `situation.sub-brands`; when the answer is no, derive "single brand, one unit".
- **POC:** derive only.

### 9. Name (`name`)

- **Part:** given input; naming as a strategy output is a later story.
- **Inputs:** positioning, architecture, trademark screening.
- **Output:** the name.
- **Requires:** `positioning`, `architecture`.
- **Knowledge:** K-0028 (0.85), K-0030 (0.8).
- **When missing:** group B has it; group A asks for a working name (decision D9).
- **POC:** given only, marked "working name, not screened" until `ip-screen` exists.

### 10. Verbal identity (`verbal`)

- **Part:** questions and model drafting.
- **Inputs:** nodes 6, 7, 9.
- **Output:** key message, voice, tagline.
- **Requires:** `positioning`, `identity-frame`, `name`.
- **Knowledge:** K-0028 (0.85), K-0043 (0.75).
- **When missing:** ask; draft later.
- **POC:** no (decision D4); listed in `notInThisGuidebook`.

### 11. Core idea, gate (`core-idea`)

- **Part:** proxy questions; drafted options later; person agrees or skips.
- **Inputs:** positioning, identity frame.
- **Output:** one theme the visuals express.
- **Requires:** `positioning`, `identity-frame`.
- **Knowledge:** K-0028 (0.85), K-0035 (0.75).
- **When missing:** proxy (`core-idea.proxy.remember`), then options to pick, or skip.
- **POC:** yes, as a given statement or a skip.

### 12. Look and feel (`look-feel`)

- **Part:** model drafting and image work; person agrees.
- **Inputs:** nodes 5, 7, 11; group E references as evidence.
- **Output:** mood direction.
- **Requires:** `competitive-frame`, `identity-frame`, `core-idea`.
- **Knowledge:** K-0028 (0.85).
- **When missing:** draft.
- **POC:** no. It informs `logo-mark`, `color` and `typography`, which run without it and say so.

### 13. Logo type decision (`logo-type`)

- **Part:** decision rules.
- **Inputs:** name and its length, units to unite (from `architecture`), app-icon need, trademark crowding.
- **Output:** wordmark, letterform mark, symbol plus name, emblem or dynamic mark, with the reason.
- **Requires:** `architecture`, `name`.
- **Knowledge:** K-0037 (0.85): emphasise the name by default; a symbol needs a reason (a long name, many units, a need for a shorthand).
- **When missing:** ask `logo-type.app-icon`; without a name the node is blocked; trademark crowding is open until `ip-screen` exists.
- **POC:** yes, in its own story. **Hypothesis:** what counts as a long name is ours; no source gives a number.

### 14. Logo concept and mark (`logo-mark`)

- **Part:** model image drafts inside the decided frame (decision D8); person picks; checks on the image files.
- **Inputs:** the frame: `logo-type` (decided), `name` (given), `core-idea` (given, confirmed or skipped); `color` and `typography` when decided; `look-feel` when it exists; an optional concept note written by the person.
- **Output:** a round of image drafts, then the draft the person picks, with the frame it was drawn in, the model id and the label. A chosen draft is a direction for the mark, not the delivered logo file (ADR 0009 point 6: raster images are concepts only; the vector mark, lockups, construction and variants are later stories).
- **Requires:** `core-idea`, `logo-type`. **Informs:** `look-feel`, `color`, `typography`. Without a decided colour the drafts are one colour (black on white) and the record lists `color` under `madeWithout`.
- **Knowledge:** K-0037 (0.85), K-0035 (0.75).
- **When missing:** blocked until `logo-type` is decided and `name` is given; no image is drawn outside the frame. When `core-idea` was skipped, the drafts and the pick are provisional on it.
- **POC:** image drafts in their own story (decision D8), after the architect's image provider ADR. Until that story ships the node stays `open` with its reason `awaiting-image-drafts`, and the guidebook says so.

### 15. Colour (`color`)

- **Part:** derive (`auditLineup`), decision rules (`decideColor`), checks (contrast; the Thai culture flag later).
- **Inputs:** crowded families from `competitive-frame`; the personality vector from `identity-frame`.
- **Output:** in phase 1, the signature, neutral and canvas decisions with their reasons. The UI role palette with hex per role (ORV-125) is design-system work and stays parked.
- **Requires:** `competitive-frame`, `identity-frame`. **Informs:** `look-feel`.
- **Knowledge:** K-0039 (0.75), K-0038 (0.7), K-0040 (0.7); engine entries from ORV-20, five of them at 0.4.
- **When missing:** ORV-20 already returns `questions` (`lineup`, `personality.<axis>`) and leaves the signature open; the harness maps each to its node.
- **POC:** yes (ORV-20 slice A). **Hypothesis:** the thresholds and candidate families (ORV-20 decision 8, 0.4).

### 16. Typography, Thai and Latin (`typography`)

- **Part:** decision rules over a curated family list; checks (Thai script coverage).
- **Inputs:** scripts and languages, personality, the roles text plays.
- **Output:** families, roles (looped for reading, loopless for display), pairing, with reasons.
- **Requires:** `identity-frame`. **Informs:** `look-feel`, `logo-mark`.
- **Knowledge:** K-0042 (0.85); K-0041 (0.6) for any link from personality to type.
- **When missing:** ask `typography.scripts`. Scripts are not strategy, so D1 does not cover them; whether the user's locale may be shown as a visible assumption the person can change is decided in the `typography` story.
- **POC:** yes, in its own story. **Hypothesis:** every link from personality to a typeface rests on K-0041 at 0.6; the method's 24 px switch and 1.6 to 1.7 Thai line height have no source.

### 17. Imagery, icons, graphic elements, motion, sound (`expression-kit`)

- **Requires:** `core-idea`, `look-feel`, `color`, `typography`.
- **Knowledge:** K-0028 (0.85), K-0035 (0.75), K-0043 (0.75).
- **When missing:** draft.
- **POC:** no.

### 18. IP and similarity screening, gate (`ip-screen`)

- **Requires:** `name`, `logo-mark`.
- **Knowledge:** K-0028 (0.85), K-0037 (0.85).
- **When missing:** open; the guidebook says "not screened".
- **POC:** no.

### 19. Trial applications and touchpoints (`touchpoints`)

- **Requires:** `logo-mark`, `color`, `typography`, `expression-kit`.
- **Knowledge:** K-0028 (0.85).
- **POC:** no.

### 20. Validation tests (`validation`)

- **Requires:** `logo-mark`, `color`, `typography`, `expression-kit`, `ip-screen`, `touchpoints`.
- **Knowledge:** K-0030 (0.8), K-0039 (0.75).
- **When missing:** open; the guidebook says "not tested".
- **POC:** no.

### 21. Guidelines and brand book (`guidebook`)

- **Part:** assembly (deterministic).
- **Inputs:** every node's record.
- **Output:** the CI guidebook as structured data: `foundation` and `visual` sections (decision D4), the `unconfirmed` list (decision D1), open items and the nodes not in this guidebook, each with a reason.
- **Requires:** `positioning`, `core-idea`, `logo-type`, `logo-mark`, `color`, `typography`. **Informs:** every other node.
- **Knowledge:** K-0043 (0.75).
- **When missing:** an item whose node is open is shown open with its question id; nothing is filled. A skipped node counts as done for assembly and is shown in `unconfirmed`, never with a value.
- **POC:** yes.

### 22. Launch and governance (`launch`)

- **Requires:** `guidebook`.
- **Knowledge:** K-0028 (0.85).
- **POC:** no.

## Fill order

The sequencer follows K-0044 §3, written as rules:

1. Classify the entry (`situation`). Given inputs become fixed nodes; nothing else is assumed.
2. Groups C and D start with `audit` and mark kept elements as fixed (not in the POC).
3. Strategic core in the order `business-core`, `audience`, `competitive-frame`, then `positioning`. Each runs the D1 ladder (proxy questions, drafted options to pick once the drafting story ships, or a skip); none is defaulted. A given name (B) or expression evidence (E) does not skip them.
4. Then `identity-frame` and `architecture`, then `name` if not given, then `verbal` and `core-idea`.
5. Then expression: `look-feel`, then `logo-type` before `logo-mark`, then `color` and `typography`, then `expression-kit`.
6. Then `ip-screen` before final vectors, `touchpoints`, `validation`, and last `guidebook` and `launch`.

Ties inside a step are broken by the node number above, so the plan is deterministic.

With the POC set and group A, the plan is: `business-core`, `audience`, `competitive-frame`, `positioning`, `identity-frame`, `architecture`, `name`, `core-idea`, `logo-type`, `logo-mark`, `color`, `typography`, `guidebook`.

**Jumping to a node.** When the person goes straight to a node, the sequencer returns only that node's requires chain, in fill order, with its questions. Informs are listed as `madeWithout`, not asked. A node given by the person is done for planning purposes and lists its open requires as `unchecked`. A skipped node in the chain does not block; the target runs provisional on it.

## Where ORV-20 sits and what it must change

- **Position:** ORV-20 slice A is node 15 (`color`), and its `auditLineup` is the derive step of node 5 (`competitive-frame`). It consumes node 7's personality vector.
- **Already aligned:** it returns `undecided` with `questions` and leaves the signature open instead of guessing, which matches decision D1 (a skipped input never becomes a value); it is rule-based with sources; it cites K-level reasoning through its own engine entries.
- **What changes in its code: nothing.** The harness wraps it with an adapter that maps its `questions` to graph nodes (`lineup` to `competitive-frame`, `personality.<axis>` to `identity-frame`). Row 15 holds ORV-20's tests unchanged. Provisional marks live on the node record the harness writes, not in ORV-20's result.
- **What changes around it:**
  - Its personality vector rests on the method's five axes, which no source read uses (K-0044 §4). It stays as the POC vocabulary of `identity-frame`, marked hypothesis (decision D6).
  - It skips `look-feel` and the Thai culture check (K-0040). In the graph, `look-feel` is an informs dependency recorded as `madeWithout`; the culture check is a later check, not a rule. All four ORV-20 signature candidates (lime, cyan, magenta, teal) already sit outside yellow and red, the families K-0040 flags.
  - `color.audit-the-category` cites only the method and a blog; K-0039 (0.75) is a stronger source for it. Adding it is an entry version change, proposed for ORV-20's next spec version, not this spec.
  - Slice B (ORV-125, a UI role palette per mode) is design-system scope and stays parked under phase 1.
- **Merge:** slice A merges into `develop` with no code change (decision D7, decided).

## Hypotheses (below confidence 0.7, or no source)

- K-0034 Brand Key (0.65): the shape of `audience` insight.
- K-0033 archetype effects (weak evidence, K-0044 marks them below 0.7): any archetype vocabulary in `identity-frame`.
- The five personality axes (no source): `identity-frame` and every ORV-20 rule that reads them.
- K-0041 typeface impressions (0.6): any personality to typeface link in `typography`.
- ORV-20 engine entries at 0.4 (`color.hue-families`, `color.expressive-signature`, `color.warm-leans-hue`, `color.premium-canvas`, `color.action-is-functional`): `competitive-frame` bands and `color` thresholds.
- The long-name threshold in `logo-type` (no source).
- The proxy questions (no source): ours, written to reach the inputs the methods need (K-0036's table) without strategy vocabulary. No source tests that their answers lead to the same strategy a workshop would. Each proxy question carries `hypothesis: true`.
- The method's numbers with no source (K-0044 §4): personality 50 on every axis (§2), five to seven colours (§5.2), 60/30/10 (§5.3), the 24 px switch (§6.2), 1.6 to 1.7 Thai line height (§6.3). None is used by any slice here (decision D5).
- The graph itself is a candidate (K-0044, 0.75): small, hand-picked sample, no Thai agency process read, no low-budget practice surveyed.

## Delivery: four vertical slices

Each slice is one PR of about 400 changed lines and is usable through the engine API. Slices 2 to 4 get their own Jira issues (L-0016), each with a spec that links back here.

1. **Slice 1, the graph:** `BRAND_GRAPH` as data (22 nodes, inputs with `onMissing`, question ids with Thai and English text including the proxy questions and the D1 strings, sources, hypothesis flags, `skippable` on the six strategic nodes) and `checkGraph`. Rows 1 to 4, 20, 21, 22, 25.
2. **Slice 2, the classifier:** `classifyEntry(inventory)`. Rows 5 to 11, 21, 22.
3. **Slice 3, the sequencer:** node states, skips and provisional marks, `planFill(state, target?)`, the ORV-20 adapter. Rows 12 to 17, 21, 22, 23, 27.
4. **Slice 4, the guidebook:** `assembleGuidebook(state)` with the `unconfirmed` list and labelled drafts. Rows 18, 19, 21, 22, 24, 26.

Function and file names are suggested; the G2 design may rename them, and each named test keeps its name so the G3 packet can point at it. The node stories are separate issues created after G1 in the order the owner picks: `logo-type` rules, `typography` rules, model drafting of options from proxy answers (one per strategic node, D1 step 2), logo image drafts (D8, lane L, after the image provider ADR), and the free-text intake.

## Acceptance criteria

In the POC the person sees the engine's result through its API; no row renders a screen. Question text and section titles are Thai and English data (row 20); the start question copy is in the entry catalog above and the proxy question copy is under "Missing strategy".

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | The graph as shipped | `checkGraph(BRAND_GRAPH)` | `[]`; 22 nodes with the ids in "The node graph"; every `requires` and `informs` names a node in the graph; no cycle; every node cites at least one source; every cited K-id has a file under `docs/knowledge/` | None (the graph is code data) | `brand-graph.test.ts` › "the graph holds together" |
| 2 | Fixture graphs: `positioning` requiring `identity-frame`; a node requiring `mood`; two nodes with the id `color` | `checkGraph` | Issues `cycle` naming `identity-frame` and `positioning`; `unknown-node` naming `mood`; `duplicate-id` naming `color` | None | `brand-graph.test.ts` › "broken graphs are reported" |
| 3 | Every input of every node, and a fixture input with `onMissing: "default"` | Parsing with the graph schema | Every shipped input has `onMissing` of `ask`, `proxy`, `draft`, `derive` or `open`; `proxy` appears only on the six strategic nodes; the fixture fails at its input's path | None | `brand-graph.test.ts` › "no input falls back to a default" |
| 4 | The sources each node cites and their confidence | Reading each node's `hypothesis` | True for exactly `audience`, `identity-frame`, `competitive-frame`, `logo-type`, `color`, `typography`; each lists its low sources as in "Hypotheses"; false for every other node | None | `brand-graph.test.ts` › "low-confidence nodes are marked" |
| 5 | An inventory with a concept text only | `classifyEntry(inventory)` | Group `A`; no fixed nodes; next node `business-core` | None | `brand-entry.test.ts` › "a concept starts at A" |
| 6 | A concept and the name "ORIVILO" | `classifyEntry` | Group `B`; `name` is `given` with the value "ORIVILO"; next node `business-core` (nothing upstream is skipped) | None | `brand-entry.test.ts` › "a name is fixed, not a shortcut" |
| 7 | A live brand flag | `classifyEntry` | Group `C`; status `not-in-poc` naming `audit`; no node is filled | None | `brand-entry.test.ts` › "existing brands wait for the audit" |
| 8 | A structural change flag, once with and once without a live brand | `classifyEntry` | Group `D` both times; status `not-in-poc` naming `audit` and `architecture` | None | `brand-entry.test.ts` › "structural change is D" |
| 9 | Only expression references (three links and the words "calm, premium") | `classifyEntry` | Group `E`; the references are on `identity-frame` and `look-feel` with status `evidence`, not `given`; next node `business-core` | None | `brand-entry.test.ts` › "a mood is evidence, not a decision" |
| 10 | A name and expression references; then every pair of signals | `classifyEntry` | `B` with the references as evidence; across all pairs the group follows D, C, B, E, A | None | `brand-entry.test.ts` › "precedence" |
| 11 | An empty inventory | `classifyEntry` | Status `needs-input` with the one question `situation.start` and five choices; no group | None | `brand-entry.test.ts` › "nothing given, one question" |
| 12 | A group A state after classification, POC node set | `planFill(state)` | `next` equals the POC plan in "Fill order"; the first questions are the proxy questions of `business-core` (`business-core.proxy.offer`, `business-core.proxy.why`) with a skip allowed; out-of-POC nodes are in `notInPoc`, never in `open` | None | `brand-plan.test.ts` › "group A follows the fill order" |
| 13 | A group A state with nothing answered | `planFill(state, "color")` | `next` is `business-core`, `audience`, `competitive-frame`, `positioning`, `identity-frame`, `color`; no node outside that chain; `look-feel` in `madeWithout` | None | `brand-plan.test.ts` › "jumping asks only the chain" |
| 14 | `identity-frame` given (ORIVILO vector) and `competitive-frame` given (category and the ORV-20 stand-in lineup); `positioning` open | `planFill(state, "color")`, then running the colour node | `color` is ready; after the run its record has the ORV-20 decisions, `unchecked` `["positioning"]` and `madeWithout` `["look-feel"]`; `positioning` stays open | Node record held in memory only | `brand-plan.test.ts` › "a given input runs and stays unchecked" |
| 15 | ORV-20's `decideColor` returning `questions` `lineup` and `personality.expressive` | The colour adapter inside `planFill` | `lineup` is listed under `competitive-frame` and `personality.expressive` under `identity-frame`; ORV-20's `color-audit.test.ts` and `color-rules.test.ts` pass with no edit; no ORV-20 colour source file changes | None | `brand-plan.test.ts` › "colour questions map to their nodes" |
| 16 | A required input never answered and never skipped (`positioning`) | `planFill`, then `assembleGuidebook` | `positioning` is `open` with `skipped: false`; every node requiring it, directly or through the chain, is `blocked` naming `positioning`; the guidebook item is `open` with its question ids and no value | None | `brand-plan.test.ts` › "open stays open" |
| 17 | The same state twice, and the same given values supplied in another order | `planFill` | Results deep-equal, with an equal `fingerprint` (FNV-1a over canonical JSON, ADR 0007 decision 5) | None | `brand-plan.test.ts` › "same input, same plan" |
| 18 | An ORIVILO fixture state with every POC node done and nothing skipped; `logo-mark` holds a fixture chosen draft | `assembleGuidebook(state)` | Sections in order `foundation`, `visual`; `unconfirmed` is empty; each item has its value, provenance (`given`, `derived`, `decided` or `confirmed`), the method that made it (`person`, `rule-based` or `ai-draft`), rule ids, source ids and hypothesis flag; `notInThisGuidebook` lists every out-of-POC node with a reason key, `verbal` among them, `ip-screen` as `not-screened` and `validation` as `not-tested`; `method` is `rule-based` | None | `brand-guidebook.test.ts` › "every item carries its reasons" |
| 19 | A fixture node with a drafted option not yet chosen | `assembleGuidebook` | The item is `awaiting-choice`; the draft is never shown as a decision | None | `brand-guidebook.test.ts` › "a draft is not a decision" |
| 20 | Every question (including the proxy questions), every D1 string and every section title in the graph and the guidebook | Reading their text | Each has non-empty `th` and `en`; neither contains an em dash or a middot | None | `brand-graph.test.ts` › "every string is Thai and English" |
| 21 | The graph, classifier, planner and guidebook modules | Scanning their source | None imports `llm-interpreter` or `openrouter`, `Date` or `Math.random`; every result says `method: "rule-based"` | None | `brand-graph.test.ts` › "rule-based, no model" |
| 22 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output is unchanged from `develop` | None | Quality gate output in each G3 packet |
| 23 | A group A state where `business-core`, `audience` and `competitive-frame` are given, `positioning` is skipped, `identity-frame` and `core-idea` are given, and the name "ORIVILO" is given | `planFill(state)`, then running `architecture` and `color` | `positioning` is `open` with `skipped: true` and no value; no node is `blocked` by it; `architecture` (derived) and `color` (decided) carry `provisional: true` and `provisionalOn` `["positioning"]`; `identity-frame`, `name` and `core-idea` stay `given` and list `positioning` in `unchecked`; no input holds a value the person did not give | Node records held in memory only | `brand-plan.test.ts` › "a skip stays open and makes dependents provisional" |
| 24 | The state from row 23 with every other POC node done | `assembleGuidebook(state)` | `unconfirmed` lists `positioning` with its proxy question id `positioning.proxy.only` and every item provisional on it; each of those items in `foundation` and `visual` shows `provisional` naming `positioning`; the `positioning` item shows no value; answering `positioning` and assembling again empties `unconfirmed` and clears every provisional mark | None | `brand-guidebook.test.ts` › "skipped strategy is listed as unconfirmed" |
| 25 | The six strategic nodes and every other node | Reading the graph | Each strategic node has `skippable: true` and at least one proxy question with an id `<node>.proxy.<slug>`, the Thai and English text under "Missing strategy" and `hypothesis: true`; no other node is skippable or has a proxy question | None | `brand-graph.test.ts` › "strategy asks by proxy and may be skipped" |
| 26 | A fixture `logo-mark` record with four image drafts made by `ai-draft`, each with a model id, the frame it was drawn in (logo type, name, core idea) and a file reference; one draft chosen | `assembleGuidebook` | The logo item is `confirmed` from the chosen draft and carries the label key `logo-mark.draftLabel`, the model id and the frame; the three not chosen are not shown as decisions; no field says the mark is trademark cleared, screened, unique, registrable or owned; `ip-screen` stays `not-screened` | None | `brand-guidebook.test.ts` › "a chosen logo draft stays a labelled draft" |
| 27 | A group A state where `core-idea` is given and `logo-type` is not decided; then the same state with `logo-type` decided and no image drafts | `planFill(state, "logo-mark")` | First: `logo-mark` is `blocked` naming `logo-type`. Second: `logo-mark` is `open` with the reason `awaiting-image-drafts`; no value is filled | None | `brand-plan.test.ts` › "no logo draft outside the frame" |

## Rules and bounds

- **Purity.** All slices are pure TypeScript in `packages/intent-engine`: no framework, design-system, network, `Date` or `Math.random`. Every list in a result is sorted or in fill order.
- **State.** Node states live in memory and are passed in; nothing is persisted (E2-12 owns persistence). A state holds per node: status (`not-started`, `open`, `blocked`, `given`, `kept`, `derived`, `decided`, `awaiting-choice`, `confirmed`, `not-in-poc`), the value, evidence (including proxy answers), `skipped`, `provisional` and `provisionalOn`, `unchecked` and `madeWithout`.
- **Inventory.** Structured fields only in the POC: `concept` (text, 1 to 2000 characters), `name` (1 to 60 characters, trimmed), `liveBrand` and `structuralChange` (booleans), `expressionRefs` (0 to 20 items, each a URL or 1 to 200 characters of words), `subBrands` (boolean or not given). Proxy answers are text of 1 to 2000 characters. User text is a value for the trace and is never read as an instruction (AGENTS.md, untrusted input).
- **No defaults for strategy.** No node fills a strategic input (business core, audience, competitive frame, positioning, identity frame, core idea) with a value the person did not give or confirm (decision D1). A skip is not a value: it leaves the node open, never becomes a default or a neutral middle, and is visible on every dependent record and in the guidebook.
- **Provisional is visible everywhere.** Every record downstream of a skip, directly or through the chain, carries `provisionalOn`; the guidebook shows the mark on each item and lists them under `unconfirmed`. Answering the skipped node clears the marks it caused and nothing else.
- **Given beats planned, never silently.** A given value is kept; the harness never overwrites it and lists what it was not checked against.
- **AI drafts are labelled, never final.** A drafted option is `awaiting-choice` until the person picks it. A logo image draft carries its label, the model id and its frame even after it is chosen, and nothing says it is trademark cleared, unique, registrable or owned (ADR 0009 point 6).
- **Industry is context.** No node rule reads industry to pick a colour, a typeface or a logo type.
- **Bilingual data.** Every question and section title carries `th` and `en`. No em dash and no middot in either.
- **Honesty in the output.** The guidebook says which items are hypotheses, which are provisional on a skipped step, which nodes did not run, and that the name and mark are not screened and the identity is not tested.

## Out of scope

- Any screen, canvas node, board preview or presentation layout (POC focus is function).
- Tokens, UI role palettes, components and the design system (ORV-125 stays parked).
- Model calls of any kind in these slices: drafting options from proxy answers (D1 step 2) and logo image drafts (D8) come in their own stories.
- Choosing the image provider or model for logo drafts; the architect's ADR does that (D8).
- Groups C and D beyond classification; the audit and architecture nodes.
- Naming as a strategy output, verbal identity (decision D4), look and feel, mood boards, the vector logo and its lockups, the expression kit, touchpoints, validation tests, IP screening and launch.
- Persistence, export, PDF or print layout of the guidebook.
- Editing `docs/context/brand/brand-ci-method.md`; decision D5 is carried out in its own docs task.

## Owner decisions (decided at G1)

The owner answered at G1 and the orchestrator recorded the D1 answer, all on [ORV-126](https://tpetkaew.atlassian.net/browse/ORV-126) (comment 10198). D1 and D8 differ from the v1 recommendations; D2 to D7 and D9 take the option v1 recommended.

### D1. Missing strategy: proxy questions, drafted options, or a skip

- **Decided:** a three-step ladder for the six strategic nodes, as set out under "Missing strategy". (1) Proxy questions a person without a written strategy can answer. (2) Options drafted by a model from the answers, which the person picks, edits or replaces (its own story per node; until it ships, the person writes the value). (3) An allowed skip: the node stays open with no value, dependents run provisional on it, and the guidebook lists it with everything that rests on it under `unconfirmed`.
- **Not chosen:** neutral defaults, labelled or not (v1 options b and c). A skip is the honest form of "I do not know yet": nothing is filled, and the gap stays visible.
- **Why:** it keeps K-0036's finding (practitioners produce missing strategy rather than default it) while letting a person who cannot answer move on.
- **Impact:** rows 3, 12, 16, 20, 23, 24 and 25; the `proxy` behaviour, the `skippable`, `skipped`, `provisional` and `provisionalOn` fields, the `unconfirmed` guidebook section; the brand graph ADR at G2; the drafting stories, one per strategic node.

### D2. Which entry groups ship first

- **Decided: (a).** A and B, with E handled as evidence inside them; C and D classified but not supported. No audit or architecture node is needed.
- **Impact:** rows 7 and 8, and which node stories come next.

### D3. Which nodes are in the POC

- **Decided: (a).** Thirteen nodes: `situation`, `business-core`, `audience`, `competitive-frame`, `positioning`, `identity-frame`, `architecture` (derive only), `name` (given), `core-idea`, `logo-type`, `logo-mark` (image drafts per D8), `color`, `typography`, plus `guidebook` assembly.
- **Impact:** rows 12 and 18, and the follow-up issues.

### D4. Foundation and verbal sections in the guidebook

- **Decided: (a).** Foundation in (positioning, identity frame, core idea); verbal out of the POC and listed in `notInThisGuidebook`.
- **Impact:** row 18's section list.

### D5. The unsourced numbers in `brand-ci-method.md`

- **Decided: (a), with (c) scheduled before the `typography` story.** Keep them in the method, marked hypothesis with a note pointing to K-0044 §4; research them before any node uses them. No slice here uses them; ORV-20's own thresholds stay at 0.4.
- **Impact:** a docs task on the method, and the evidence bar for the `typography` story.

### D6. Personality vocabulary for `identity-frame`

- **Decided: (a).** Keep the five axes for the POC, marked hypothesis, because ORV-20's rules read them; revisit with a research task.
- **Impact:** ORV-20 rules and row 14's fixture.

### D7. ORV-20 slice A

- **Decided: (a).** Merge as is, wrapped by the adapter (row 15); ORV-125 stays parked.
- **Impact:** `color` is available for slice 3's tests.

### D8. The logo mark in the POC: AI image drafts inside the decided frame

- **Decided:** a model draws image drafts of the logo inside the frame the harness has decided, and the person picks one. Not chosen: concept text only (v1 option a) and drafted concept text (v1 option b).
- **The frame.** The prompt is built by deterministic code from the node records only: the logo type decided by `logo-type`'s rules, the given name, the core idea, and colour and typography when decided (one colour otherwise). The model does not choose the logo type, the name or the colours. No draft is drawn while `logo-type` or `name` is missing (row 27). The prompt builder refuses brand names and artist names typed into a concept note (ADR 0009 point 6). When a frame input is provisional, the drafts are too.
- **What the person gets.** A round of four drafts, each stored with the model id, its frame and the label. The person picks one, asks for another round within the limits, or leaves the node open. A chosen draft is a direction for the mark, not the delivered logo file (ADR 0009 point 6: raster images are concepts; the vector logo is a later story).
- **The label** (key `logo-mark.draftLabel`, shown on every draft and on the chosen one, through the locale catalog when a screen exists). Its meaning: en "AI draft for exploring a direction. Not a final logo. Not checked for trademarks, not shown to be unique, and ownership is not guaranteed."; th "ภาพร่างจาก AI สำหรับสำรวจแนวทาง ยังไม่ใช่โลโก้จริง ยังไม่ได้ตรวจสอบเครื่องหมายการค้า ไม่ได้ยืนยันว่าไม่ซ้ำกับใคร และไม่รับประกันความเป็นเจ้าของ". Nothing in the product says a draft is trademark cleared, unique, registrable or owned; a trademark search is the person's step before registering (ADR 0009 point 6).
- **Cost estimate (to confirm in the ADR).** About 4 US cents an image, if the provider is ADR 0009's pinned `logo-image` model at its listed image price of 30 US dollars per million image tokens and an image is about 1,300 output tokens (the token count is an assumption, not measured). A round of four is about 16 US cents. Under the limits below, one person can spend at most about 80 US cents a day.
- **Rate limits (proposed; decided at the logo image story's G1).** A new limit `logo-image`, counted per person through ORV-112's shared helper: 2 rounds per hour and 5 rounds per day, a round being four images, refused rounds not counted, failing closed when the store fails. The per-key credit limit (ADR 0009 point 7) still applies, and the workspace spend cap is ORV-121.
- **Dependency: an architect ADR on the image provider.** ADR 0009 pins `logo-image` to `google/gemini-nano-banana-2.1` on OpenRouter and calls it the only OpenRouter model that returns images, but no story has called it, recorded an eval set or checked its terms, and K-0046 records that whether OpenRouter covers image models was not checked. The architect's ADR confirms that path or chooses another provider, with its price, its data retention (ADR 0009 addition on Google safety retention), its terms on ownership of outputs, and the image checks (format, size, stored in the workspace's private bucket). The logo image story starts only after that ADR is accepted.
- **Lane.** The logo image story is lane L (asset licensing risk flag, ADR 0009 point 6).
- **Impact:** node 14, rows 18, 26 and 27, the Out of scope list, the logo image story and its G1, the architect ADR, `.claude/rules/security.md` rule 6 and ADR 0015 decision 4 (a new limit, at that story).

### D9. Group A without a name

- **Decided: (a).** Ask for a working name, labelled "working name, not screened"; naming as a strategy output is a later story.
- **Impact:** rows 12 and 18 for group A.

## Gap list

- **Business:** closed by K-0044, the owner's phase 1 direction and the G1 decisions D1 to D9.
- **Functional:** the graph, classifier, planner, skip and provisional rules, and guidebook are specified. Assumed: the proxy question copy (for review by the designer and the owner); the `typography` locale assumption is left to its story.
- **Technical:** assumed: a new ADR for the brand graph (dependency kinds, `onMissing` including `proxy`, node states, skip and provisional), written by the architect at G2; ADR 0017's per-node scope pattern applies to `logo-type` and `typography`. Must-ask before the logo image story, not before these slices: the image provider ADR (D8).
- **UX:** not applicable in the POC; the start question, the proxy questions and the D1 strings are drafted above for review.
- **Data and security:** assumed: in memory, no persistence, user text and proxy answers treated as data. The logo image story adds a rate limit and stored files, handled in its own spec.
- **Risk:** the graph is a candidate from a small sample (0.75); the proxy questions have no source; hypotheses are listed and flagged in data. Logo drafts carry a licensing and similarity risk, bounded by the label and the lane L story.

## Depends on

- Research: K-0044 (synthesis), K-0036, K-0043, K-0037, K-0029, K-0028, and the other brand entries it cites, in `docs/knowledge/brand/`; K-0027 (architecture patterns: model at the edge, deterministic core) and K-0046 (image providers, OpenRouter image coverage unchecked) in `docs/knowledge/architecture/`.
- [ORV-20 spec](../ORV-20/spec.md) v1.2 (slice A is node 15) and [ADR 0017](../../adr/0017-node-scoped-color-decisions.md) (node-scoped decisions, the pattern later node stories follow).
- ADR 0005 (knowledge entries), ADR 0006 (rule grammar), ADR 0007 (status words, fingerprint), ADR 0008 (model interpreters, later drafting stories), [ADR 0009](../../adr/0009-ai-through-openrouter.md) (one pinned model per job, the `logo-image` job, point 6 on generated logos, point 7 on keys and spend, the addition on Google safety retention), ADR 0012 (gates), ADR 0015 decision 4 (rate limits).
- [ORV-112 spec](../ORV-112/spec.md) (the shared rate limit helper the `logo-image` limit uses) and ORV-121 (workspace spend cap).
- The architect ADR on the image provider (D8), not yet written.
- `docs/context/orivilo-brief.md` (nodes carry knowledge, collect before generating, dynamic entry); `docs/context/brand/brand-ci-method.md` (compared in K-0044 §4).

## Downstream review if this spec changes

- ORV-20 spec: a graph-position note and the K-0039 source for `color.audit-the-category` at its next version.
- `docs/context/brand/brand-ci-method.md`: per decision D5.
- ORV-19 (E1-4 brand node) and ORV-21 (E1-6 type node): may be reshaped or replaced by the node stories this graph names.
- ORV-125: stays parked; review if phase 1 scope changes.
- ADR 0009: the image provider ADR may confirm or supersede its `logo-image` row.

## Changelog

- v1 (2026-10-26): first spec. Entry catalog A to E, 22-node graph with harness parts, fill order, ORV-20's position, hypotheses, four slices, rows 1 to 22, owner decisions D1 to D9.
- v1.1 (2026-10-26): G1 decisions applied (ORV-126 comment 10198). D1 becomes proxy questions, then AI-drafted options to pick, then an allowed skip that leaves the node open and marks dependents provisional, listed under the guidebook's new `unconfirmed` section: new `onMissing` value `proxy`, state fields `skipped`, `provisional`, `provisionalOn`, proxy question copy, D1 strings, rows 3, 12, 16, 20 changed and rows 23, 24, 25 added. D8 becomes AI image drafts of the logo inside the decided frame, with a label, a cost estimate, proposed rate limits and an architect ADR on the image provider as a dependency: node 14 rewritten (`color` added to its informs), rows 18 changed and rows 26, 27 added. D2 to D7 and D9 recorded as decided (the v1 recommendations). Typography's locale assumption moves to its own story. Rows 1 to 22 keep their numbers. Downstream to review: the brand graph ADR and G2 design (new `onMissing` value and state fields), the slice 1, 3 and 4 Jira issues and their specs (new rows), the test plan for rows 3, 12, 16, 18, 20 and 23 to 27, the architect task for the image provider ADR, ADR 0009 (`logo-image` row), the logo image story's G1 (limit numbers, cost), `.claude/rules/security.md` rule 6 and ADR 0015 decision 4 (a `logo-image` limit when that story lands), ORV-121 (spend cap covers image drafts).
