---
issue: ORV-281 (https://tpetkaew.atlassian.net/browse/ORV-281)
lane: L (risk flags: auth and data access, a new tenant table set behind the authorization helper; a change to the evidence contract every brand node reads; a new pinned model job with its prompt and answer schema)
version: 1.3
---

# ORV-281: business first, the first real stage of the board

## The whole structure

The story is counted on one base: what the person gives, what ORIVILO makes of it, and where the person sees it.

<!-- prettier-ignore -->
| Level | Count | Members | Source of the set |
| --- | --- | --- | --- |
| Business inputs | 7 | the six inputs of the brief's stage 1 (idea, industry, customers, problem, value, competitors) and one optional website address | `docs/context/orivilo-brief.md`, "The ten stages", row 1; default 1 of the envelope |
| Project input | 1 | the project name, which names the saved project and is not a business fact | `project.name` in `packages/db/src/schema/workspace.ts` is required |
| Business nodes | 5 | `situation` (1), `business-core` (3), `audience` (4), `competitive-frame` (5), `positioning` (6), the gate | ORV-126 "The node graph", nodes 1 to 6 without node 2, `audit`, which is out of the POC (ORV-126 decision D3) |
| Edges | 6 | the `requires` links among the five nodes | ORV-126 nodes 1, 3, 4, 5 and 6 ("Worked examples", W2) |
| Fields | 10 | 3, 2, 2, 2 and 1 per node, in node order | rule `business-fields-1` ("Worked examples", W1) |
| Fields read by the model | 7 of the 10 | the other 3 show the person's words only | rule `business-read-1` ("Worked examples", W4) |
| Screens | 3 | the project list, the intake form, the project board | rule `business-board-1` and section "Screens" |
| Slices | 3 | intake saved; business nodes on the board; ORIVILO reads the business | section "Delivery" |

What is excluded, and why: node 2 `audit` (out of the POC, ORV-126 D3); every node from 7 `identity-frame` on (brand stages, after the positioning gate, which is where the brief's stage 2 "Brand strategy" starts); the brief's stage 1 saved result "product goals", which no ORV-126 node holds (open question 10). The order inside each level is ORV-126's node number and fill order (ORV-126 "Fill order", rule 3).

## Why

The owner asked on 2026-11-18, after the concept prototype (ORV-274) was bought in a sales pitch, that the real work starts and that the analysis starts from the business before the brand (ORV-281). The prototype shows the whole path with hand-copied data, and no engine function runs on it (ORV-274, "What is real and what is simulated"). This story makes the first stage of that path real: a person gives ORIVILO the facts of their business, ORIVILO places and reads them, and the result is saved and shown as the business nodes at the start of the board.

Business before brand is how practice works. Across the methods read, the minimum input before identity design is a short strategic core (who the organisation is, what it does, why it matters, for whom and against whom), and practitioners produce it when it is missing rather than fill defaults (K-0036, 0.75; Wheeler, K-0028, 0.8; Neumeier, K-0030, 0.8). ORV-126 orders the graph the same way: `situation`, then `business-core`, `audience` and `competitive-frame`, then the `positioning` gate (K-0044, 0.75).

What exists today: the evidence contract and the URL reader of ORV-128 (`packages/intent-engine/src/evidence.ts`), whose reading targets cover `situation` only among the business nodes; the website report of ORV-266, which reads looks and personality signals and stores nothing; the shared canvas components of PR 211 (ORV-274). No brand graph code exists in `packages` or `apps`, nothing in `apps/web` takes a business fact, and the `project` table has no screen.

This spec is not a guard. It describes an intake, a reading and a board.

### What is real, rule-based and simulated

- **Real (once built):** the intake form and its checks, the saving per project behind the authorization helper, the placement of each answer on its node, the board and its node views, the span checks on every model reading, the confidence numbers by ORV-128's method.
- **Rule-based, not AI:** the placement of answers on nodes (`intake-place-1`), the node states (`node-state-1`), the website check (`website-input-1`), and everything shown when the model is not used (`honest-business-1`).
- **Read by a model, labelled (slice 3 only):** the seven fields of `business-read-1`. Each reading is a proposal with its quotes, never a value, and the board says so. Until slice 3 ships, nothing in the product says ORIVILO reads a business with AI.
- **Hypothesis-grade:** the confidence bases and factors (ORV-128 "Hypotheses"); the proxy questions the intake asks, which have no source (ORV-126 "Hypotheses").
- **Not done, and said so on the board:** the business type code (TSIC), because the code list of ORV-127 is not in the repo; the website, which is kept and not read; competitor colours; the positioning gate, which waits for the person; confirming or editing any field.
- **Simulated:** nothing in the product. Storybook stories run on labelled fixture projects.

## Story

As a founder or product owner who is signed in, I want to tell ORIVILO about my business in my own words, the idea, the type of business, my customers and their problem, my alternatives and what only I give, and see it saved as the first nodes of my board, with each field showing my words, what AI read from them and the exact words each reading rests on, so that the brand work that follows starts from my real business and I can check every reading against what I said.

## Departures from ORV-126, ORV-128, ORV-266 and the brief

This story builds on those sources and redefines none of their nodes, inputs or analysers. Where it does something they do not, the departure is listed here, once.

<!-- prettier-ignore -->
| No. | Source and what it says | This story | Why |
| --- | --- | --- | --- |
| 1 | ORV-126 "Rules and bounds", State: node states live in memory, nothing is persisted. ORV-128 "Rules and bounds": nothing persisted in the POC. ORV-266 `report-not-kept-1`: nothing from a read is stored | The intake and the reading are saved per project (`business-saved-1`) | Envelope default 3; a business the person cannot come back to is not a first stage |
| 2 | ORV-126 slices 1 to 4: the graph as data (`BRAND_GRAPH`), the classifier, the sequencer and the propagation rule | None of them is built. The five nodes use ORV-126's ids and `requires` links as fixed data on the board; no node status comes from the propagation rule; `situation` shows no entry group and asks no `situation.start` | No brand graph code exists; this story shows the business stage without waiting on the whole graph. A later slice 1 of ORV-126 takes the same ids |
| 3 | ORV-126 harness part 1: the intake classifier reads a structured inventory (concept, name, live brand, structural change, expression references, sub-brands); strategic nodes ask their proxy questions one by one | One intake form of the brief's six inputs and a website (`intake-fields-1`). Five of the six map to ORV-126 proxy question ids and use their copy word for word; the industry question is new. Live brand, structural change, expression references and sub-brands are not asked | Envelope default 1; the brief names these six inputs for stage 1 |
| 4 | The brief, "The board is a presentation": input and interpretation must work as blocks on a canvas with a drill-down conversation per element, not as a single form | A single form | The brief contradicts envelope default 1. Kept as the default under the POC focus on function; open question 1 asks the owner |
| 5 | The brief lists the stage 1 inputs as idea, industry, customers, problem, value, competitors | The form asks competitors before value | ORV-126's `positioning.proxy.only` says "those alternatives", which refers back to the competitors question |
| 6 | ORV-128 analyser 5 (`brief-text`): one text of 1 to 2,000 characters; reading targets for `situation` only among the business nodes; model job `interpret` | Seven answers, each its own source text with the same bound; new reading targets for `business-core`, `audience`, and the category and the alternatives of `competitive-frame`: a short text value for each, except the alternatives, which take a name for each alternative, one reading per alternative; a new pinned job | The six answers are separate inputs the person gave; ADR 0009 keeps prompts and evaluation sets per job (open question 2) |
| 7 | ORV-128 "How evidence feeds the node graph": `situation.competitors` proposes an inventory fact on `situation` | Competitor names show on `competitive-frame`, field `alternatives` | The intake asks them with `competitive-frame.proxy.instead` |
| 8 | ORV-128 "Industry": a TSIC code is read only against the ORV-127 code list; with no list, `awaiting-taxonomy` | The same rule holds: the industry field shows the person's words and `business.industry.awaitingTaxonomy`; the model is not asked for a code | The ORV-127 code list is not in `packages` |
| 9 | ORV-266: the website report reads looks and personality signals from a page | The website the person gives is checked and kept as an address, not read (`website-input-1`) | A page read gives no business fact today: ORV-128 keeps no page text, and its model readings are slice 3 of ORV-128 (open question 6) |
| 10 | ORV-126 "Out of scope": any ORIVILO screen or canvas node. ORV-128 "Out of scope": any screen | Three screens in `apps/web` | The owner asked for the real work; the board is the output (envelope default 4) |
| 11 | ORV-126 proxy question copy: "for review by the designer and the owner", data in the engine, not rendered | Rendered on the intake form as written | Open question 12 |

What does not depart: a proxy answer is evidence on its node, not its value (ORV-126 D1 step 1); a model reading never becomes a value until the person confirms it (ORV-128 feed rule 1), and this story confirms nothing; a reading below the floor stays visible and counts as no support (ORV-128 feed rule 2); confidence is computed by ORV-128's "Confidence" unchanged; industry is context and feeds no colour, type or logo rule (ORV-126 "Rules and bounds").

## Rules

### intake-fields-1

The intake has eight fields, in this order. Each answer is trimmed; an answer that is empty after the trim is not given. The bound of each business answer is ORV-126's proxy answer bound (ORV-126 "Rules and bounds", Inventory: 1 to 2,000 characters). The project name takes the bound of a saved direction's name, 1 to 120 characters (`directionFileSchema` in `packages/intent-engine/src/saved.ts`).

<!-- prettier-ignore -->
| No. | Field | Brief input | Question key and copy home | Required | Node, field |
| --- | --- | --- | --- | --- | --- |
| 1 | Project name | none | `business.intake.projectName` ("Strings") | yes | none: names the project |
| 2 | Idea | idea | `business.question.offer`, copy of `business-core.proxy.offer` (ORV-126) | yes | `business-core`, `offer` |
| 3 | Industry | industry | `business.intake.industry` ("Strings") | no | `situation`, `industry` |
| 4 | Customers | customers | `business.question.bestCustomer`, copy of `audience.proxy.best-customer` (ORV-126) | no | `audience`, `customers` |
| 5 | Problem | problem | `business.question.problem`, copy of `audience.proxy.problem` (ORV-126) | no | `audience`, `problem` |
| 6 | Competitors | competitors | `business.question.instead`, copy of `competitive-frame.proxy.instead` (ORV-126) | no | `competitive-frame`, `alternatives` |
| 7 | Value | value | `business.question.only`, copy of `positioning.proxy.only` (ORV-126) | no | `positioning`, `value` |
| 8 | Website | the optional website of envelope default 1 | `business.intake.website` ("Strings") | no | `situation`, `website`, checked by `website-input-1` |

An answer left empty is a skip in ORV-126's sense (D1 step 3) for fields 4 to 7: no value, the node shows it (`node-state-1`). A form with an unknown field fails the check; no other field is written (`.claude/rules/security.md` rule 3).

### website-input-1

The website text is trimmed. Empty means not given. Otherwise `https://` is put in front when the text does not start with a scheme and `://`, as ORV-266 `url-input-1` does. The result is kept only when it is at most 2,048 characters (`URL_MAX_CHARS`), the URL parser reads it, its scheme is `http` or `https`, and its username and password are both empty. What is kept is the parser's serialisation (`href`). Anything else is refused with `business.intake.websiteInvalid`, and the form keeps the text. Nothing is fetched ("Worked examples", W6).

### intake-place-1

Each given answer of fields 2 to 8 of `intake-fields-1` is placed, as written, on the node and field its row names, and nowhere else. Placement is code, not AI, and it is the whole result when the model is not used. Each placed answer keeps which intake field it came from, so the board can name its source. The same intake gives the same placement ("Worked examples", W3).

### business-fields-1

The five nodes and their ten fields. "From" names where a field's content can come from: the person's answer (`intake-place-1`), a model reading (`business-read-1`), or both.

<!-- prettier-ignore -->
| Node | Field | Label key | From | ORV-126 input it serves |
| --- | --- | --- | --- | --- |
| `situation` | `industry` | `business.field.industry` | answer | the TSIC section of `situation` (ORV-128 "Industry") |
| `situation` | `name` | `business.field.name` | reading | `name` in the inventory |
| `situation` | `website` | `business.field.website` | answer | the starting inventory (brief, "Starting assets vary") |
| `business-core` | `offer` | `business.field.offer` | both | what, and for whom |
| `business-core` | `why` | `business.field.why` | reading | why |
| `audience` | `customers` | `business.field.customers` | both | target audience |
| `audience` | `problem` | `business.field.problem` | both | insight (its shape is a hypothesis, ORV-126 node 4) |
| `competitive-frame` | `category` | `business.field.category` | reading | category |
| `competitive-frame` | `alternatives` | `business.field.alternatives` | both | the lineup's names; never a colour |
| `positioning` | `value` | `business.field.value` | answer | the proxy answer of the gate; no reading drafts positioning |

A field holds no value of its own. It shows the person's answer and the readings on it, each with its label (`honest-business-1`).

### node-state-1

Each node shows one state, set from the answers alone (readings never change a state, ORV-128 feed rule 1):

- **Skipped** (`business.state.skipped`): `audience`, `competitive-frame` or `positioning` when every intake field placed on it is empty. `business-core` is never skipped, because field 2 is required.
- **Nothing given yet** (`business.state.empty`): `situation` when fields 3 and 8 are both empty. `situation` is not a strategic node, so it is never skipped.
- **Not confirmed yet** (`business.state.proposed`): every other case.

`positioning` also shows `business.state.gate` in every state, because it is a gate (ORV-126 node 6).

Each node lists under `business.stillToAsk` the ORV-126 proxy questions it has that the intake left unanswered: the question of each empty field among 4 to 7 of `intake-fields-1`, and, on `business-core`, always `business-core.proxy.why` (copy `business.question.why`), which the intake does not ask. `situation` lists none ("Worked examples", W7).

### business-read-1

Slice 3. After the answers are saved, one model call reads the six business answers (fields 2 to 7 of `intake-fields-1`) into readings on the seven fields marked "reading" or "both" in `business-fields-1`: `situation.name`, `business-core.offer`, `business-core.why`, `audience.customers`, `audience.problem`, `competitive-frame.category`, `competitive-frame.alternatives`.

- **Spans.** Each reading quotes at least one span of the answers, and each quote equals the answer text at its place (ADR 0008 decision 2). A reading may quote any of the six answers, so a customer named inside the idea can land on `audience.customers`.
- **What it may not read.** No reading on `situation.industry` (no code list, departure 8), on `situation.website` (not read, departure 9) or on `positioning.value` (no drafting of the gate). No reading on any node outside the five.
- **Checks.** The answer is parsed strictly. An unknown key, a quote that is not in the answers, a reading on a field outside the seven, or a value past its bound refuses the whole answer, and the placement of `intake-place-1` stands alone, labelled (`honest-business-1`), as ORV-128 row 18 does for the URL analyser.
- **Evidence.** Each reading is an ORV-128 evidence item: `fromModel` true, the pinned model id, the adapter id and version, `basedOn` its spans, and a confidence by ORV-128 "Confidence" (base `model-reading`; factor `few-words` when the answers its spans sit in hold fewer than 20 words together by `word-count-1`; factor `single-signal` when it names one span only). Below the floor it stays shown and counts as no support ("Worked examples", W5).
- **Prompt.** The six answers go only in the user message, never in the instructions. The project name, the website, the person's id and email and the workspace are never sent (ADR 0009 point 4). The request keeps zero data retention and denies data collection, as `interpret` does (ADR 0009 point 4 and its Addition of 2026-10-23).
- **No fallback model.** When the call fails, times out, has no key, or is stopped by the limit or the spend cap (`business-door-1`), no other model is tried (ADR 0009 point 3), and the reason is saved with the result.
- **The job.** A new pinned job in ADR 0009's addition of 2026-11-18, named by the architect (`business-read` is a suggestion), with a Thai and English evaluation set recorded as fixtures before it ships (ADR 0009 point 2). Tests replay recordings and never call a model (ADR 0009 point 8).

### business-door-1

The order the server checks a submission in, for a person with a session:

1. the session (Better Auth, on the server);
2. the approved list of `read-allow-list-1` (ORV-268), the same variable and the same match;
3. the `write` limit (`LIMITS` in `packages/auth/src/rate-limit.ts`);
4. the intake check (`intake-fields-1`, `website-input-1`);
5. the save of the project and the answers, through `withWorkspace` in the person's active workspace;

and, from slice 3, after the save:

6. the `ai-read` limit;
7. the workspace spend cap (ORV-121);
8. the model call and its checks (`business-read-1`);
9. the save of the reading, or of the reason there is none.

A refusal at steps 1 to 4 saves nothing. A stop at steps 6 to 8 never undoes step 5. Without a session the answer is the existing `saved.errors.signed-out`, and the `signed-out` limit counts by IP as on `/read`. A person refused at step 2 gets the error `forbidden` with no address in it, as ORV-268 `read-door-1` gives it.

### business-saved-1

Per project, in the person's workspace: the project (its name, who made it, when), the intake answers as checked, and, from slice 3, the reading: its evidence items, the model id, the adapter id and version, the prompt version, and the method, `model` or `rule-based`, with the reason when rule-based. Every read and write goes through `withWorkspace`; every new table carries `workspace_id`, joins `TENANT_TABLES` and has row security (ADR 0002; `.claude/rules/security.md` rules 2 and 4). A project outside the caller's workspace answers 404 with the same body as one that does not exist (rule 9). Opening a project replays what was saved and never calls the model again (the pattern of `snapshotSchema` in `saved.ts`). No answer text, quote, website or project name reaches a log line (rules 8 and 15). Editing, deleting and re-reading a saved project are out of scope.

### business-board-1

The project screen shows a read-only board made of the shared canvas components of PR 211, in the present look: `CanvasBoard`, `CanvasNode`, `NodePort`, `CanvasEdge` and `CanvasControls` with `position="center"`, whose dock shows `board.readOnly`. It holds the five nodes and the six edges of "The whole structure", and reads left to right in ORV-126's fill order: `situation`, then `business-core`, `audience` and `competitive-frame`, then `positioning`. Opening a node (`onNodeOpen`, by pointer or keyboard) shows that node's view in `Dialog` with `size="viewer"`: its state, its fields with their content and labels, and its still-to-ask list. Nothing can be dragged, connected or edited. Positions, the node card at rest and the open label are the designer's at G2.

### honest-business-1

The one home of the labels. Each kind of content carries its label wherever it shows, on a node card or in a node view:

<!-- prettier-ignore -->
| Content | Label | When |
| --- | --- | --- |
| A person's answer placed by `intake-place-1` | `business.label.yourWords` | always |
| A model reading | `evidence.fromModel` with the saved model id, `business.state.proposed`, the confidence through `business.reading.confidence`, and `business.label.confidence` once per view | slice 3 |
| A model reading below the floor | `evidence.belowFloor` with its `quality.*` reasons joined by a comma | slice 3 |
| A result with no reading | `business.label.aiUnavailable` and the saved reason: `business.errors.aiNotConfigured`, `business.errors.aiFailed`, `business.errors.aiRateLimited` or `business.errors.aiSpendCap` | slice 3, when step 8 of `business-door-1` did not give a reading |
| The industry field | `business.industry.awaitingTaxonomy` | until the ORV-127 code list is in the repo |
| The website field | `business.website.notRead` | when a website is given |
| `competitive-frame` | `business.competitors.coloursNotRead` | always |
| `positioning` | `business.state.gate` | always (`node-state-1`) |

No text says that a field is confirmed, decided, verified or accurate, and no score shows except a reading's confidence with its label.

## Screens

Three screens, each composed in `packages/design-system/src/examples` (the place `BrandReportScreen` uses) so its stories show every state, and rendered by a page in `apps/web`. Route names are suggestions.

1. **Project list** (`/business`): `business.list.heading`, the workspace's projects by name, newest first, each a link to its board, and the link `business.list.new` to the intake. Empty: `business.list.empty`. The home page links here with `home.openBusiness`.
2. **Intake** (`/business/new`): `business.intake.heading`, `business.intake.lede`, the eight fields of `intake-fields-1` with `business.intake.optional` on the optional ones, and the button `business.intake.submit`.
3. **Project board** (`/business/[projectId]`): the project name as the `h1`, `business.board.lede`, `business.board.savedAt`, then the board (`business-board-1`). In slice 1, before the board, the five node views are stacked on the page in node order.

Signed out, a screen shows its heading, `business.signedOut` and the sign-in link `business.signInLink`, and no form. Not on the approved list: `business.notAllowed`, no form. No database set up: `business.notConfigured`. Every value from the person or the model renders as plain text, never as HTML or a link.

## Strings

New keys live in the design-system catalog (`packages/design-system/src/i18n`), except `home.openBusiness`, which lives in `apps/web/i18n/messages.ts`. Each is the copy of record and a draft for the owner's copy review. None has a middot or an em dash.

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `business.list.heading` | Your businesses | ธุรกิจของคุณ |
| `business.list.new` | Tell us about a business | เล่าเรื่องธุรกิจใหม่ |
| `business.list.empty` | No businesses yet. Tell us about one to start your board. | ยังไม่มีธุรกิจ เล่าเรื่องธุรกิจหนึ่งเพื่อเริ่มกระดานของคุณ |
| `home.openBusiness` | Your businesses | ธุรกิจของคุณ |
| `business.intake.heading` | Tell us about your business | เล่าเรื่องธุรกิจของคุณ |
| `business.intake.lede` | Answer in your own words. Only the first question is required. Leave any other empty and the board shows it as skipped. | ตอบด้วยคำของคุณเอง บังคับตอบเฉพาะข้อแรก ข้ออื่นเว้นว่างได้ และกระดานจะแสดงว่าข้ามไว้ |
| `business.intake.projectName` | Project name | ชื่อโปรเจกต์ |
| `business.intake.industry` | What kind of business is it? A few words is enough. | ธุรกิจของคุณเป็นธุรกิจประเภทไหน ตอบไม่กี่คำก็พอ |
| `business.intake.website` | Your website, if you have one | เว็บไซต์ของคุณ ถ้ามี |
| `business.intake.optional` | Optional | ไม่บังคับ |
| `business.intake.submit` | Save and show the board | บันทึกและแสดงกระดาน |
| `business.intake.pending` | Saving your answers | กำลังบันทึกคำตอบ |
| `business.intake.offerRequired` | Tell us what you sell or offer. | บอกเราว่าคุณขายหรือให้บริการอะไร |
| `business.intake.nameRequired` | Give the project a name. | ตั้งชื่อโปรเจกต์ |
| `business.intake.tooLong` | Use {max} characters or fewer. | ใช้ไม่เกิน {max} ตัวอักษร |
| `business.intake.websiteInvalid` | This is not a web address we can keep. Check it, or leave it empty. | ที่อยู่เว็บนี้เก็บไว้ไม่ได้ ตรวจสอบอีกครั้ง หรือเว้นว่างไว้ |
| `business.question.offer` | What do you sell or offer, and to whom? | คุณขายหรือให้บริการอะไร และให้ใคร |
| `business.question.bestCustomer` | Describe one customer you would like ten more of. | เล่าถึงลูกค้าหนึ่งคนที่คุณอยากได้แบบนี้เพิ่มอีกสิบคน |
| `business.question.problem` | What problem were they trying to solve when they found you? | ตอนที่เขาเจอคุณ เขากำลังพยายามแก้ปัญหาอะไรอยู่ |
| `business.question.instead` | When a customer does not choose you, who or what do they choose instead? | เมื่อลูกค้าไม่เลือกคุณ เขาเลือกใครหรืออะไรแทน |
| `business.question.only` | What does a customer get from you that they cannot get from those alternatives? | ลูกค้าได้อะไรจากคุณที่หาไม่ได้จากตัวเลือกอื่นเหล่านั้น |
| `business.question.why` | Why did you start this? One or two sentences is enough. | ทำไมคุณถึงเริ่มทำสิ่งนี้ ตอบสั้น ๆ หนึ่งหรือสองประโยคก็พอ |
| `business.node.situation` | Situation | สถานการณ์ตั้งต้น |
| `business.node.businessCore` | Business core | แก่นธุรกิจ |
| `business.node.audience` | Audience | กลุ่มลูกค้า |
| `business.node.competitiveFrame` | Competitive frame | ตลาดและคู่แข่ง |
| `business.node.positioning` | Positioning | จุดยืน |
| `business.field.industry` | Business type | ประเภทธุรกิจ |
| `business.field.name` | Business name | ชื่อธุรกิจ |
| `business.field.website` | Website | เว็บไซต์ |
| `business.field.offer` | What you offer | สิ่งที่คุณขายหรือให้บริการ |
| `business.field.why` | Why it exists | เหตุผลที่เริ่มทำ |
| `business.field.customers` | Customers | ลูกค้า |
| `business.field.problem` | Their problem | ปัญหาของลูกค้า |
| `business.field.category` | Category | หมวดตลาด |
| `business.field.alternatives` | What customers choose instead | สิ่งที่ลูกค้าเลือกแทน |
| `business.field.value` | What only you give | สิ่งที่ลูกค้าได้จากคุณเท่านั้น |
| `business.state.proposed` | Not confirmed yet | ยังไม่ได้ยืนยัน |
| `business.state.skipped` | Skipped for now | ข้ามไว้ก่อน |
| `business.state.empty` | Nothing given yet | ยังไม่มีข้อมูล |
| `business.state.gate` | A gate: nothing builds on this until you agree to it. | จุดตัดสินใจ: ยังไม่มีขั้นใดต่อยอดจากตรงนี้จนกว่าคุณจะเห็นชอบ |
| `business.stillToAsk` | Still to ask | ยังต้องถาม |
| `business.label.yourWords` | Your words, placed here by fixed rules. Not read by AI. | คำของคุณเอง วางไว้ตรงนี้ด้วยกฎที่กำหนดไว้ ไม่ได้ให้ AI อ่าน |
| `business.label.aiUnavailable` | AI did not read these answers, so only your own words are shown. | AI ไม่ได้อ่านคำตอบเหล่านี้ จึงแสดงเฉพาะคำของคุณเอง |
| `business.label.confidence` | Confidence numbers come from fixed rules, not from a test of accuracy. | ตัวเลขความมั่นใจมาจากกฎที่กำหนดไว้ ไม่ได้มาจากการทดสอบความแม่นยำ |
| `business.reading.confidence` | Confidence {value} | ความมั่นใจ {value} |
| `business.industry.awaitingTaxonomy` | The business type code (TSIC) is not matched yet: ORIVILO does not hold the code list yet. | ยังไม่ได้จับคู่รหัสประเภทธุรกิจ (TSIC) เพราะ ORIVILO ยังไม่มีรายการรหัส |
| `business.website.notRead` | Kept as an address. Not read in this version. | เก็บไว้เป็นที่อยู่เว็บ ยังไม่ได้อ่านในเวอร์ชันนี้ |
| `business.competitors.coloursNotRead` | Competitors' colours are not part of this step. | ขั้นนี้ยังไม่รวมสีของคู่แข่ง |
| `business.board.lede` | What you told us, placed on the first nodes of your board. Nothing here is confirmed yet. | สิ่งที่คุณเล่า วางไว้บนโหนดแรกของกระดาน ยังไม่มีข้อใดได้รับการยืนยัน |
| `business.board.savedAt` | Saved {date} | บันทึกเมื่อ {date} |
| `business.board.label` | Business board | กระดานธุรกิจ |
| `business.signedOut` | Sign in to tell us about your business. | ลงชื่อเข้าใช้ก่อน แล้วจึงเล่าเรื่องธุรกิจของคุณได้ |
| `business.signInLink` | Go to sign in | ไปหน้าลงชื่อเข้าใช้ |
| `business.notAllowed` | This is open only to approved accounts for now, and this account is not one of them. | ตอนนี้ส่วนนี้เปิดให้เฉพาะบัญชีที่ได้รับอนุมัติ และบัญชีนี้ยังไม่อยู่ในรายชื่อ |
| `business.notConfigured` | Businesses cannot be saved in this environment yet: the database is not set up. | ยังบันทึกธุรกิจในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่าฐานข้อมูล |
| `business.errors.aiNotConfigured` | AI is not set up in this environment, so only your own words are shown. | สภาพแวดล้อมนี้ยังไม่ได้ตั้งค่า AI จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiFailed` | AI could not read your answers, so only your own words are shown. | AI อ่านคำตอบของคุณไม่สำเร็จ จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiRateLimited` | You have reached the limit for AI readings, so only your own words are shown. | ใช้ AI อ่านครบจำนวนที่กำหนดแล้ว จึงแสดงเฉพาะคำของคุณเอง |
| `business.errors.aiSpendCap` | This workspace has used its AI budget for this month, so only your own words are shown. | เวิร์กสเปซนี้ใช้งบ AI ของเดือนนี้ครบแล้ว จึงแสดงเฉพาะคำของคุณเอง |

Reused as they are: `board.readOnly` (PR 211), `evidence.fromModel`, `evidence.belowFloor` and `quality.fewWords` (ORV-128 "Strings"), `saved.errors.signed-out`, `saved.errors.rate-limited` and `saved.errors.failed` (`apps/web/i18n/messages.ts`). The six `business.question.*` texts are ORV-126's proxy question copy word for word; ORV-126 is their home, and a test pins each to it. `business.signInLink` is the text of the sign-in link on a signed-out screen ("Screens"), the copy of `brandReport.signInLink`. `business.board.label` is the accessible name of the board region, the `label` of `CanvasBoard` (`business-board-1`).

## Acceptance criteria

Tests use fixtures, a fake network and recorded model answers; none reaches the internet or a model (ADR 0009 point 8). Screen rows are proven on stories of the three screens on labelled fixture projects, in both languages, and on page tests in `apps/web`. Test names are suggested. A row states the values its test asserts; the rule that makes them is defined once, in the section its name points to.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | An intake at each bound: a project name of 120 characters; an idea of 2,000; the five optional answers empty; then each optional answer at 1 and at 2,000 characters; a website of `example.com` | The intake check runs (`intake-fields-1`, `website-input-1`) | No UI | Each parses; the website is kept as `https://example.com/`; a JSON round trip is deep-equal | `intake.test.ts` "bounds" |
| 2 | In turn: an empty idea; an idea of white space only; an idea of 2,001 characters; a project name of 121 characters; an unknown key `role`; the websites `https://user:secret@example.com/`, `ftp://example.com/` and `javascript:alert(1)` | The intake check runs | No UI | Each fails at the path of its field; no website with `user:secret` is kept (W6) | `intake.test.ts` "refused" |
| 3 | A Thai intake with all seven business fields given, and the same intake twice | `intake-place-1` runs | No UI | Each answer sits on the node and field of its `intake-fields-1` row, as written, with its intake field named; `positioning.value` holds the value answer and no other field holds it; the two runs are deep-equal (W3) | `place.test.ts` "each answer on its node" |
| 4 | An intake with only the project name, the idea and the customers | `node-state-1` runs | No UI | `situation` empty with no question; `business-core` proposed with `business-core.proxy.why`; `audience` proposed with `audience.proxy.problem`; `competitive-frame` skipped with `competitive-frame.proxy.instead`; `positioning` skipped with `positioning.proxy.only` and the gate (W7) | `place.test.ts` "states and still to ask" |
| 5 | A person who is not signed in | They open the intake | `business.intake.heading` and "Sign in to tell us about your business." ("ลงชื่อเข้าใช้ก่อน แล้วจึงเล่าเรื่องธุรกิจของคุณได้") with the sign-in link; no form | None | Page test "signed out"; story `SignedOut` |
| 6 | A signed-in person whose email is not on the approved list | They open the intake; then the action is called directly | `business.notAllowed`, no form; the action answers `forbidden` with no address | Nothing saved; no limit consumed (`business-door-1`) | Page test; `actions.test.ts` "not approved" |
| 7 | An environment with no database set up | They open any of the three screens | `business.notConfigured` ("Businesses cannot be saved in this environment yet: the database is not set up."); no form | None | Page tests "not configured" |
| 8 | The intake, signed in and approved | They submit with no project name, with no idea, with an answer of 2,001 characters, and with the website `ftp://example.com/` | `business.intake.nameRequired`, `business.intake.offerRequired`, "Use 2000 characters or fewer." ("ใช้ไม่เกิน 2000 ตัวอักษร") and `business.intake.websiteInvalid` on their fields; the text stays in each field | No server call for the first three; the server refuses the fourth at step 4 of `business-door-1` and saves nothing | Story `Invalid`, play; `actions.test.ts` "website refused" |
| 9 | The intake, signed in and approved, filled with a valid Thai intake | They press "Save and show the board" ("บันทึกและแสดงกระดาน") | The project board of that project | One project row and its answers in the person's active workspace, written inside `withWorkspace`, with `created_by` the session's user; the log line holds the route and outcome and no answer text, website or project name | `actions.test.ts` "saves in the workspace", with a spy on the logger |
| 10 | A save is running | They press the button again | The button is disabled and `business.intake.pending` shows | One action call | Story `Pending`, play |
| 11 | The session ended while the form was open | They submit | "Your session has ended. Sign in again and retry." (`saved.errors.signed-out`); the answers stay in the fields | Nothing saved | `actions.test.ts` "signed out" |
| 12 | The `write` limit is used up | They submit | `saved.errors.rate-limited` with the wait | Nothing saved; answer code `RATE_LIMITED` with `retryAfter` | `actions.test.ts` "write limit" |
| 13 | A project of workspace A; a signed-in member of workspace B only; a project id that does not exist | The member of B opens A's project; then the unknown id | The same not-found page both times | Both answer 404 with the same body (`business-saved-1`) | Page test "another workspace"; `access.test.ts` policy walk includes the new tables |
| 14 | A saved project from row 9, slice 1 | They open its board | The project name as `h1`, `business.board.lede`, `business.board.savedAt` in the page's locale, then five node views in the order Situation, Business core, Audience, Competitive frame, Positioning, each with its state, its fields' labels, the person's words with `business.label.yourWords`, and its still-to-ask list in the question copy, such as "Why did you start this? One or two sentences is enough." ("ทำไมคุณถึงเริ่มทำสิ่งนี้ ตอบสั้น ๆ หนึ่งหรือสองประโยคก็พอ") | No model call (none exists in slice 1) | Story `Saved`, play; page test |
| 15 | The same project | They read Situation, Competitive frame and Positioning | `business.industry.awaitingTaxonomy`, the website as text with `business.website.notRead` and no link, `business.competitors.coloursNotRead`, and on Positioning "A gate: nothing builds on this until you agree to it." ("จุดตัดสินใจ: ยังไม่มีขั้นใดต่อยอดจากตรงนี้จนกว่าคุณจะเห็นชอบ") | None | Story `Saved`, play reads the text |
| 16 | A project whose idea is `<img src=x onerror=alert(1)>` and whose website is `https://example.com/"><script>` as kept by `website-input-1` | They open its board | Both as literal text; no image, no script, no link | None | Story `UntrustedText`, play |
| 17 | Two projects in the person's workspace and one in another workspace; then a workspace with none | They open the project list | The two by name, newest first, each linking to its board; not the third. Then `business.list.empty` and the link `business.list.new` | Read through `withWorkspace` only | Page test; stories `List` and `ListEmpty` |
| 18 | The home page | It loads | A link "Your businesses" ("ธุรกิจของคุณ") to the project list | None | Home page test |
| 19 | The intake and a saved board | They switch the language in the header | Labels, states and questions in the other language; the person's answers as typed; Thai text with no letter spacing | No second save | Stories in both languages; page client test with a spy on the action |
| 20 | A 360 px viewport, a long Thai answer with no spaces, a 2,048-character website | The intake and the board render, light and dark | Every line wraps; no horizontal scroll | None | Story `Narrow`, play: `scrollWidth` at most 360 |
| 21 | The slice 1 head | The gate runs | No UI | The new tables are in `TENANT_TABLES` with row security; each new column carries one classification tag (rule 11); check-i18n and `apps/web/i18n/messages.test.ts` pass; no middot or em dash in new copy; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass | Gate output |
| 22 | A saved project, slice 2 | They open its board | The read-only present board under `business.board.lede`: five nodes titled Situation, Business core, Audience, Competitive frame and Positioning (สถานการณ์ตั้งต้น, แก่นธุรกิจ, กลุ่มลูกค้า, ตลาดและคู่แข่ง, จุดยืน), six edges, and the dock with "View only" ("ดูอย่างเดียว") | The edges are exactly the six of W2; nothing can be dragged or connected | Story `Board`, play; page test |
| 23 | The board | They click a node; then Tab to another and press Enter, then Space; then Escape | The node's view in the viewer dialog, with the content row 14 names for that node; Escape closes it. Each node's title row ends with the open glyph and no page count, and its accessible name is `graph.nodeLabel` with no page count (`CanvasNode` open without a count, "Impact on contracts", UI) | `onNodeOpen` once per gesture with that node's id; focus returns to the node; the viewport does not move | Story `Board`, play |
| 24 | A board whose project skipped audience, competitors and value | It renders | `business.state.skipped` on Audience, Competitive frame and Positioning, Positioning with its gate line | None | Story `Skipped`, play |
| 25 | The board, keyboard only, light and dark, a 360 px viewport | They Tab through it | Focus visible on the dock and each node in fill order; no horizontal scroll | Zero a11y violations | Stories `Board` and `Narrow`; a11y addon |
| 26 | The slice 2 head | The gate runs | No UI | No new shared component; every story of the canvas components PR 211 changed still passes its play; gate as row 21; `pnpm contrast` unchanged from `develop` | Gate output |
| 27 | A Thai fixture intake and a recorded answer of the new job | `business-read-1` runs on it | No UI | Readings on the seven fields only, each `fromModel` true with the pinned model id, the adapter id and version; every quote equals its answer text at its place; a customer named in the idea lands on `audience.customers` quoting the idea; no reading on industry, website or value | `business-read.test.ts` "readings quote the answers" |
| 28 | Recorded answers with, in turn: an extra key `confidence`; a quote not in the answers; a reading on `positioning.value`; a reading on `situation.industry` | `business-read-1` runs | No UI | The whole answer is refused each time; the result is method `rule-based` with the reason that gives `business.errors.aiFailed`; the placement stands | `business-read.test.ts` "refused answers" |
| 29 | A reading with one span in an answer of fewer than 20 words; a reading with one span in an answer of 20 words or more | Confidence is computed | No UI | 0.392 with `belowFloor` true; 0.56 with `belowFloor` false (W5) | `business-read.test.ts` "confidence by ORV-128" |
| 30 | A spy on the model request | The read runs | No UI | The system prompt holds no answer text; the user message holds the six answers and nothing else of the intake; no project name, website, user id, email or workspace in the request; zero retention on and data collection denied | `business-read.test.ts` "untrusted input" |
| 31 | In turn: no key; a call that fails; a call that times out; the `ai-read` limit used up; the spend cap reached | They submit a valid intake | The board with `business.label.aiUnavailable` and, in that order, "AI is not set up in this environment, so only your own words are shown.", "AI could not read your answers, so only your own words are shown." twice, `business.errors.aiRateLimited`, `business.errors.aiSpendCap` (Thai in the Thai stories) | The project and answers are saved each time; the reading record is method `rule-based` with its reason; no model call in the last two; no other model tried | `actions.test.ts` "no reading", one case each; story `AiUnavailable` |
| 32 | A saved project with a reading | They open its board twice, a day apart on a fake clock | The same readings both times | No model call on opening; the record holds the model id, adapter id and version and prompt version | `actions.test.ts` "replay, never re-read" |
| 33 | The fixture of row 27 on the board | They open Audience | Under Customers: the person's words with `business.label.yourWords`; then each reading with "Read by AI (anthropic/claude-sonnet-5.5). Check it before you use it." (the saved model id; Thai from `evidence.fromModel`), "Not confirmed yet" ("ยังไม่ได้ยืนยัน"), its quote through `EvidenceSpan`, `business.reading.confidence`; one `business.label.confidence` in the view; a reading below the floor under `evidence.belowFloor` with "the text has fewer than 20 words" ("ข้อความมีไม่ถึง 20 คำ") | None | Story `Readings`, play |
| 34 | The evaluation set: Thai and English intakes covering each of the seven read fields, and intakes whose answers carry instructions to the model | Recorded answers are replayed | No UI | Each recording parses or is refused by `business-read-1`; no recorded answer that follows an instruction from an answer is accepted; the G3 packet reports, per field and language, how many readings a person marked as right, without a pass claim | `business-read-eval.test.ts`; G3 packet |
| 35 | The slice 3 head | The gate runs | No UI | Gate as row 21; the model is imported only by the read's adapter module; ADR 0009's addition of 2026-11-18 and `AI_MODELS` name the new job; `MODEL_JOBS` and the evidence schema version are bumped with their tests | Gate output |

## Rows per PR

This section lists the PR of slice 1 only. Rows 22 to 26 are walked under the slice spec `docs/specs/ORV-282/spec.md` and rows 27 to 35 under `docs/specs/ORV-283/spec.md`, each on its own issue's PR.

- PR 214: rows 1-21

## Rows that render nothing

- Rows: 1-4, 13, 21, 26-30, 32, 34, 35

## Delivery: three slices

Each slice closes a whole piece the owner can open. Function and file names are suggestions; the tech notes may rename them, and each named test keeps its name.

1. **Slice 1, intake saved (PR A).** The intake contract and its checks, `intake-place-1`, `node-state-1`, the tables and migration, the save through `withWorkspace` with steps 1 to 5 of `business-door-1`, the three screens with the board screen showing the five node views stacked, the copy. Done: a person can tell ORIVILO about a business, find it again, and read each answer on its node. Likely past 400 changed lines (open question 13).
2. **Slice 2, business nodes on the board (PR B).** `business-board-1`: the five node views move into the viewer, opened from a read-only present board. Done: the business stage is the start of a board.
3. **Slice 3, ORIVILO reads the business (PR C).** The new job, its prompt and answer schema, its evaluation set, the evidence contract change, steps 6 to 9 of `business-door-1`, the saved reading, the labels. Done: each field shows what AI read and the words it rests on, or why AI did not read.

Slice 2 waits on slice 1. Slice 3 waits on slice 1 and on the ADR 0009 addition; it may land before or after slice 2, and rows 31 and 33 name the screen they use.

## Impact on contracts

- **Schema, engine.** A new intake contract (`intake-fields-1`, `website-input-1`). The evidence contract (`inputEvidenceSchema`, ORV-128 "Evidence first"): new reading targets for the fields of `business-read-1` that `READING_TARGETS` lacks (all but `situation.name`), a short text value shape for them, and the new job in `MODEL_JOBS`, as one minor version bump of `EVIDENCE_SCHEMA_VERSION`. ORV-128 slice 3 plans its own minor bump for `mood-1`; the architect orders the two. Readers to re-check: `evidence.test.ts`, `report.ts` and `reportSchema`, `report-view.ts`, `EvidenceSpan` and `EvidenceList` (`brief-text` items only).
- **Model job.** An addition to ADR 0009: the new job's row (model, price, why), its retention, its exit test by the evaluation set; `AI_MODELS` in `openrouter.ts`. Changing its model later is a contract change (ADR 0009 point 2).
- **Storage.** New tenant tables for the intake and the reading, joined to `project`; a migration with row security; `TENANT_TABLES`; classification tags in `packages/db/src/schema/classification.ts`. `project` gets its first writer. No Supabase Storage object. Table shapes are the architect's.
- **Auth and limits.** New server actions behind `withWorkspace`; the approved list of ORV-268 reused; the `write` and `ai-read` limits reused with no new numbers; the spend cap charge recorded as ORV-121 does; new route names in `ROUTES` (`packages/auth/src/log.ts`). `security` reviews slices 1 and 3 (ADR 0015 decision 2: `packages/intent-engine/**` and the server actions).
- **UI.** New catalog keys ("Strings"); three example screens with stories; no new shared component; no token change.
- **UI, `CanvasNode` open without a count (slice 2, a component public API change, lane L flag).** One additive change to the shared `CanvasNode`: `NodeContent.open` (`packages/design-system/src/components/canvas-board/graph.ts`) becomes `{ count?: number }`. With no `count`, the title row ends with the open glyph only, with no pages word (`node.pages`), and the accessible name is `graph.nodeLabel` in place of `graph.nodeOpenLabel` (`nodeOpenLabel` returns `nodeLabel`); `aria-haspopup="dialog"`, the zoom-in cursor and `onNodeOpen` stay. A business node opens with no page count, because it opens one view, not pages (decision N1 option (a) of the design's section 11, ORV-281 comment 10673; option (b) would show "3 pages" and "1 pages", a false label, AGENTS.md rule 4). The catalog entry `packages/design-system/catalog/application/canvas-node.yaml` changes its `NodeContent.open` rule to say `count` is optional and what shows without it, and the change brings one story in `CanvasNode.stories.tsx`, `OpenWithoutCount` (name a suggestion), in Thai and English, which asserts the glyph, no pages word and the `graph.nodeLabel` name. Every existing caller of `open` passes a count (the `CanvasNode` and `CanvasBoard` stories, among them `OpenNode`, and `graph.test.ts`) and renders as before: the same pages word, glyph and `graph.nodeOpenLabel`. No new copy, no token change.

## Out of scope

- Confirming, editing, skipping later, or re-reading a field or a project; deleting a project.
- Drafting options for any strategic node (ORV-126 D1 step 2) and drafting positioning.
- The graph as code, the classifier, the sequencer, the propagation rule and the guidebook (ORV-126 slices 1 to 4); any node from `identity-frame` on.
- Reading the website, reading competitor pages or colours, the colour lineup and `auditLineup`.
- The TSIC code list and any industry code (ORV-127; ORV-128 slice 2).
- Product goals (open question 10).
- Uploads, photos, documents, voice and chat.
- The final look of the three screens (POC focus is function); the designer's G2 notes set the layout.

## Open questions for the owner (one round, with defaults)

Defaults 1 to 4 are the envelope's; where a source pulls against one, it says so.

1. **Input: a form or canvas blocks.** The brief says input must work as blocks on a canvas with a drill-down per element, not as a single form, so it contradicts default 1. Options: (a) one intake form (default 1); (b) each input as a block on the board, filled in place; (c) ORV-126's proxy questions asked one at a time. Impact: (b) and (c) need an editable board and a question flow. Default: (a), because the POC is about function and each form field already maps to one node field, so a later block takes the same input without a contract change.
2. **The model job.** ADR 0009 names `interpret` for "brief and Studio answers to structured facts", and ORV-128 puts brief text on `interpret`, which pulls against default 2's new job. ADR 0009 also keeps prompts and evaluation sets per job. Options: (a) a new pinned job with its own evaluation set (default 2); (b) a new prompt under `interpret`, sharing its model and its rate of change. Impact: (a) adds an ADR 0009 row; (b) mixes two prompts on one job's evaluation set. Default: (a), on the same model as `interpret` unless the evaluation set shows otherwise.
3. **Saving.** Options: (a) save per project behind `withWorkspace` (default 3); (b) keep nothing, as ORV-266 does. Default: (a); it departs from ORV-126, ORV-128 and ORV-266 (departure 1).
4. **The output.** Options: (a) a read-only board from PR 211's components (default 4); (b) a page of node sections only. Default: (a), reached in slice 2.
5. **How a project starts.** Options: (a) a required project name on the intake; (b) a name taken from the business name the model reads, which puts model output in a stored name and fails when the model does not read. Default: (a).
6. **The website.** Options: (a) checked and kept, not read; (b) read through the `/read` path and its page text sent to the model, which needs ORV-128 slice 3's rules and a new kind of quote check; (c) no website field. Default: (a).
7. **Confidence on short answers.** ORV-128's `few-words` factor puts a one-quote reading of an answer under 20 words below the floor (0.392), and intake answers are often that short, so many readings will show as too uncertain. Options: (a) ORV-128 unchanged; (b) intake answers exempt from `few-words`, an ORV-128 and ADR 0008 Addition change. Default: (a); the person's own words still show on every field.
8. **Who may use it.** Options: (a) the approved list of ORV-268; (b) any signed-in person within the limits. Default: (a), because slice 3 spends AI budget.
9. **Required answers.** Options: (a) only the idea is required, others may be skipped (ORV-126 D1 skip); (b) all six required. Default: (a).
10. **Product goals.** The brief's stage 1 saves "business brief, audience, product goals"; no ORV-126 node holds product goals. Options: (a) out of this story; (b) a sixth node, which is new graph work. Default: (a).
11. **The evaluation bar.** No source gives a pass rate for this reading. Options: (a) the G3 packet reports per field and language how many readings a person marked right, with no pass claim; (b) a threshold the owner sets. Default: (a).
12. **ORV-126 question copy on screen.** It is marked for review and was never rendered. Options: (a) render it as written; (b) the designer rewrites it first, which changes ORV-126. Default: (a).
13. **PR size.** Slice 1 holds a migration, an action and three screens, likely past 400 changed lines. Options: (a) accept it for slice 1; (b) a fourth slice, past the envelope's bound of three. Default: (a).

## Gap list

- **Business:** closed by the owner's request on ORV-281, the brief's stage 1 and K-0036. Assumed: open questions 1, 9 and 10.
- **Functional:** specified above. Assumed: open questions 5, 6, 7 and 12; the copy.
- **Technical:** must be designed at G2 by the architect: the table shapes, the answer schema and prompt of the new job, the evidence targets and value shape, the action split and route names. Assumed: open questions 2 and 13.
- **UX:** must be designed at G2 by the designer: the board layout, the node card at rest, the node view, the intake form layout. Assumed: open questions 1 and 4.
- **Data and security:** assumed: `business-door-1`, `business-saved-1`, the reuse of ORV-268's list and existing limits (open question 8). Classification of the answer columns is the architect's under rule 11; answers are customer content and may hold personal data, so they never reach a log or a prompt beyond the six answers.
- **Risk:** model readings may be wrong and are labelled; confidence numbers are hypotheses; the form departs from the brief's canvas line; single-page website reads are not added.

## Worked examples

Not run: this role has no shell. Each line runs from the repo root with `node -e`. Inputs are copied from the source each example names; outputs are integers or strings unless stated.

W1. Nodes and fields per node, from `business-fields-1`. Expected `5 10 3,2,2,2,1`.

```bash
node -e 'const f={situation:["industry","name","website"],"business-core":["offer","why"],audience:["customers","problem"],"competitive-frame":["category","alternatives"],positioning:["value"]};console.log(Object.keys(f).length,Object.values(f).flat().length,Object.values(f).map(a=>a.length).join(","))'
```

W2. Edges from the `requires` lines of ORV-126 nodes 1, 3, 4, 5 and 6. Expected `6 situation>business-core situation>audience situation>competitive-frame business-core>positioning audience>positioning competitive-frame>positioning`.

```bash
node -e 'const r={situation:[],"business-core":["situation"],audience:["situation"],"competitive-frame":["situation"],positioning:["business-core","audience","competitive-frame"]};const e=Object.entries(r).flatMap(([n,q])=>q.map(s=>s+">"+n));console.log(e.length,e.join(" "))'
```

W3. `intake-place-1`, from the table of `intake-fields-1`: seven business inputs, and how many land on each node. Expected `7 {"business-core":1,"situation":2,"audience":2,"competitive-frame":1,"positioning":1}`.

```bash
node -e 'const p={idea:"business-core.offer",industry:"situation.industry",customers:"audience.customers",problem:"audience.problem",competitors:"competitive-frame.alternatives",value:"positioning.value",website:"situation.website"};const by={};for(const t of Object.values(p)){const n=t.split(".")[0];by[n]=(by[n]||0)+1}console.log(Object.keys(p).length,JSON.stringify(by))'
```

W4. The fields `business-read-1` reads: the ten of `business-fields-1` less the three it may not read. Expected `7 situation.name business-core.offer business-core.why audience.customers audience.problem competitive-frame.category competitive-frame.alternatives`.

```bash
node -e 'const all=["situation.industry","situation.name","situation.website","business-core.offer","business-core.why","audience.customers","audience.problem","competitive-frame.category","competitive-frame.alternatives","positioning.value"];const no=["situation.industry","situation.website","positioning.value"];const r=all.filter(x=>!no.includes(x));console.log(r.length,r.join(" "))'
```

W5. Confidence of a model reading by ORV-128 `thousandths-1`: base 0.7, factors in id order (`few-words` 0.7, then `single-signal` 0.8), rounded to 3 decimals, compared in whole thousandths with the floor of 500. The short text is the brief of ORV-128 row 21, counted by `word-count-1`. Expected `true 0.392 true 0.56 false`: the text is under 20 words at any ICU split; one quote in it gives 0.392, below the floor; one quote in a text of 20 words or more gives 0.56.

```bash
node -e 'const t="ORIVILO helps Thai founders build a brand. Competitors: Brand X (https://x.example), Brand Y";const w=[...new Intl.Segmenter("th",{granularity:"word"}).segment(t)].filter(s=>s.isWordLike).length;const c=(...f)=>Math.round(f.reduce((a,b)=>a*b,0.7)*1000);console.log(w<20,c(0.7,0.8)/1000,c(0.7,0.8)<500,c(0.8)/1000,c(0.8)<500)'
```

W6. `website-input-1` on forms copied from ORV-266's `url-input-1` and `report-outcome-1` examples, plus an empty field. Expected, one per line: `https://example.com/`, `https://clinic.example/`, `refused`, `refused`, `refused`, `empty`.

```bash
node -e 'const k=s=>{const t=s.trim();if(t==="")return "empty";const v=/^[a-z][a-z0-9+.-]*:\/\//i.test(t)?t:"https://"+t;if(v.length>2048)return "refused";let u;try{u=new URL(v)}catch{return "refused"}return (u.protocol==="https:"||u.protocol==="http:")&&u.username===""&&u.password===""?u.href:"refused"};for(const s of ["example.com","  https://clinic.example/  ","https://user:secret@example.com/","ftp://example.com/","javascript:alert(1)",""])console.log(k(s))'
```

W7. `node-state-1` on row 4's intake (idea and customers given), with the proxy question ids of `intake-fields-1`. Expected, one per line: `situation empty -`, `business-core proposed business-core.proxy.why`, `audience proposed audience.proxy.problem`, `competitive-frame skipped competitive-frame.proxy.instead`, `positioning skipped positioning.proxy.only`.

```bash
node -e 'const m={situation:["industry","website"],"business-core":["idea"],audience:["customers","problem"],"competitive-frame":["competitors"],positioning:["value"]};const s=["audience","competitive-frame","positioning"];const q={customers:"audience.proxy.best-customer",problem:"audience.proxy.problem",competitors:"competitive-frame.proxy.instead",value:"positioning.proxy.only"};const g={idea:"x",customers:"y"};for(const [n,i] of Object.entries(m)){const has=i.some(x=>g[x]);const st=has?"proposed":s.includes(n)?"skipped":n==="situation"?"empty":"proposed";const a=i.filter(x=>!g[x]&&q[x]).map(x=>q[x]);if(n==="business-core")a.push("business-core.proxy.why");console.log(n,st,a.join(",")||"-")}'
```

## Depends on

- [ORV-126 spec](../ORV-126/spec.md) v1.4: nodes 1, 3, 4, 5 and 6, their `requires` links, the fill order, decision D1 (proxy answers are evidence, skips stay visible, no defaults), the proxy question copy, D3 (the POC node set).
- [ORV-128 spec](../ORV-128/spec.md) v1.27: "Evidence first", "Confidence" (`thousandths-1`, the floor), `word-count-1`, "How evidence feeds the node graph" (feed rules 1 and 2), "Industry" (`awaiting-taxonomy`), analyser 5, row 18 (a refused model answer), "Strings".
- [ORV-266 spec](../ORV-266/spec.md) v1.5: `url-input-1`, `report-not-kept-1`, the screen pattern in `packages/design-system/src/examples`.
- [ORV-268 spec](../ORV-268/spec.md) v1.0: `read-allow-list-1`, `read-door-1`.
- [ORV-274 spec](../ORV-274/spec.md) v2.5 and PR 211: the present board, `onNodeOpen`, `CanvasControls` `position="center"`, `Dialog` `size="viewer"`, `board.readOnly`.
- ORV-35 (`saved.ts`): a model reading is saved and replayed, never read again.
- ORV-112 (`LIMITS`) and ORV-121 (the spend cap).
- ADR 0002 (auth and data access), ADR 0004 (canvas), ADR 0008 (adapters and evidence spans), [ADR 0009](../../adr/0009-ai-through-openrouter.md) (one pinned model per job, no fallback, recorded tests, an addition for the new job), ADR 0012 (gates: lane L, G1 and G2), ADR 0015 (controls, decisions 2, 4, 6 to 11).
- Knowledge: K-0036 (0.75), K-0028 (0.8), K-0030 (0.8), K-0044 (0.75).
- `docs/context/orivilo-brief.md`: stage 1, "The board is a presentation, entry is dynamic", "Every node carries a knowledge base".
- G2: the architect's tech notes and the designer's notes for the three screens and the board.

## Downstream review if this spec changes

- ORV-126 spec: its "Out of scope" line on screens and its in-memory State, for the business nodes (departures 1, 10); a later slice 1 takes the node ids this story uses.
- ORV-128 spec: the reading targets and value shape added to the evidence contract; the feed table line for `situation.competitors` (departure 7); "Nothing persisted in the POC".
- ADR 0009: the addition for the new job.
- `.claude/rules/security.md` rule 6 names the limits; no new number, so no change unless open question 8 changes.
- The brief: its line "not as a single form", if the owner keeps the form (open question 1).

## Changelog

- v1 (2026-11-18): first version, from the owner's request on ORV-281, the envelope's four defaults, and a read of the brief, ORV-126 v1.4, ORV-128 v1.27, ORV-266 v1.5, ORV-268, ORV-274 v2.5, ADR 0009, `evidence.ts`, `workspace.ts`, `access.ts` and `rate-limit.ts`. No Jira tool and no shell in this role, so ORV-281 was not read directly and no worked example was run. Downstream to review: the G1 packet (open questions 1 to 13), the architect's and the designer's G2 tasks, the builder envelopes for PRs A, B and C, the `security` envelopes for A and C, the qa envelopes (Rows per PR once the PRs exist).
- v1.1 (2026-11-18, task ORV-281-spec-v11): six changes, no row added, removed or renumbered. (1) Departure 6 names the alternatives of `competitive-frame` among the new reading targets, with a name for each alternative, because "Impact on contracts" already counted them and the tech notes section 16 read departure 6 that way. (2) `business-read-1` "The job" and row 35 say ADR 0009's addition of 2026-11-18 in place of its table, because the job row sits in that addition and a decided ADR's table is never rewritten. (3) "Strings" gains `business.signInLink` and "Screens" names it on the signed-out state, because the sign-in link had no key (design section 10). (4) "Strings" gains `business.board.label`, because `CanvasBoard` requires a `label` as the board region's accessible name (design section 10). (5) Slice 2 records one additive change to the shared `CanvasNode` ("Impact on contracts", UI, and row 23): `NodeContent.open`'s `count` becomes optional and a business node opens with no page count, because a business node opens one view and a page count would be a false label (design N1 option (a), ORV-281 comment 10673). (6) "Rows per PR" names PR 214 for rows 1-21, because the slice 1 PR takes that number. Downstream to review: the tech notes sections 9 and 14 ("No shared component changes" now has one exception in slice 2), the design section 11 (N1 decided), the builder envelopes for PR A and PR B, the qa envelope for PR 214.
- v1.2 (2026-11-18, task ORV-281-spec-rows-fix): "Rows per PR" keeps one list line, `PR 214: rows 1-21`, and drops the placeholder lines for PR B and PR C, because the qa result recorder refused the record of PR 214 with "malformed line" on both (qa finding QA1-1 of task ORV-281-pr214-qa-1). A prose sentence above the list says rows 22 to 26 are walked under `docs/specs/ORV-282/spec.md` and rows 27 to 35 under `docs/specs/ORV-283/spec.md`, each on its own issue's PR. No acceptance row, rule or string changed. Downstream to review: the qa envelope for PR 214, and the qa envelopes of the ORV-282 and ORV-283 PRs (they read their slice spec's rows).
- v1.3 (2026-11-18, task ORV-281-spec-table-fix): the first header cell of the Departures table and of the `intake-fields-1` table changes from `#` to `No.`, so the acceptance table is the first table whose header starts with a `#` cell, because the qa result recorder took the Departures table as the acceptance table, read its rows 1 to 11 and refused the qa record of PR 214 (qa finding QA-1 of task ORV-281-pr214-qa-2). No other cell, row, rule or string changed, and text that names a departure or an intake field by number keeps its number. Downstream to review: the qa envelope for PR 214.
