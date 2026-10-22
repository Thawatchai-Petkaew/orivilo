---
issue: ORV-34 (draft key E2-11; https://tpetkaew.atlassian.net/browse/ORV-34)
lane: M
version: 3
---

## Why

The handoff (§17.3, §19, §22) asks for two directions that really differ, on the same task and content, read from the user's brief. Every part exists:

- the rule-based interpreter (E2-10),
- the resolver (E2-9),
- two hand-made profiles (E2-2),
- the reference screen (E2-8),
- profile boundaries (E2-3).

Nothing joins them yet. This story joins them, and shows the reading and the reasons honestly.

## Decisions this spec relies on

- ADR 0007 (resolver precedence) and ADR 0008 (interpreter adapters; the UI says "rule-based").
- The brand method's axis map (`docs/context/brand/brand-ci-method.md` §3). It is the only rule set with a written source today. Its rules ship as the starter set.
- The owner said to go on ("ดำเนินการต่อ", 2026-10-22).

## Parts

| Part | Content                                                                                                        | Status    |
| ---- | -------------------------------------------------------------------------------------------------------------- | --------- |
| 1    | Engine: starter rules and `recommendDirections` (brief to interpretation, resolution, two directions, reasons) | Merged    |
| 2    | Studio UI: brief with presets, the reading, two direction cards with mini previews, the shared live preview    | Merged    |
| 3    | Refinement controls (§17.4) and the trace inspector (§17.5)                                                    | This spec |

## Story (part 1)

As the Studio, I want one call that takes a brief and returns two directions. Each direction names its profile, the decisions it honours and the ones it cannot, and the words in the brief behind each decision. The UI can then show why the directions differ without inventing reasons.

## Acceptance criteria (part 1)

| #   | Given                                                  | When         | Then                                                                                                                                                                                          | Evidence             |
| --- | ------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | A brief with known words, such as "เป็นระเบียบ หรูหรา" | Recommending | Method "rule-based". Two directions: first the profile the resolver chose ("recommended"), then the profile that differs most from it ("contrast")                                            | `directions.test.ts` |
| 2   | Each direction                                         | Reading it   | Its decisions; which of them match the resolved decisions; which differ, with the wanted value; for each rule-made decision, the rule ids and the brief's words for the axes those rules read | Tests                |
| 3   | A brief with no known word                             | Recommending | No direction. The resolution says needs-input, and the open questions are listed                                                                                                              | Tests                |
| 4   | A brief whose rules tie (shape crisp against soft)     | Recommending | Both directions are still offered. The tie is listed as a conflict, never settled silently                                                                                                    | Tests                |
| 5   | Locks and adjustments                                  | Passed in    | They reach the resolver unchanged. A lock always holds                                                                                                                                        | Tests                |
| 6   | The same brief twice                                   | Recommending | An equal result and fingerprint                                                                                                                                                               | Tests                |
| 7   | The starter rules                                      | Checked      | `checkRuleSet` reports no issue against the starter knowledge ids                                                                                                                             | Tests                |

## Rules

- Pure TypeScript in `packages/intent-engine`. It takes the curated profiles as input and never imports the design system.
- Two directions at most in part 1. A third waits until there is a third hand-made profile that differs for a reason (handoff §19).
- A reason quotes the brief's own words, taken from the interpretation's evidence. A decision that comes from a lock or an adjustment says so instead.

## Out of scope (part 1)

- Any UI. That is part 2.
- New rules beyond the axis map. They come with E1-4 to E1-6.

## Story (part 2)

As a person with a brief, I want to write it or pick a sample, see what the rules read from it, and see two directions with the words behind each, on the same screen and data. Then I can tell why they differ and switch between them without losing what I did in the preview.

## Acceptance criteria (part 2)

| #   | Given                                      | When                        | Then                                                                                                                                                                    | Evidence                         |
| --- | ------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | The finance sample brief                   | The studio opens            | "สิ่งที่อ่านได้จากบรีฟ" with the badge "อ่านตามกฎ ยังไม่ใช้ AI"; each axis read as a level word with the brief's words ("พรีเมียม: ต้องการ", "จากคำว่า หรูหรา")         | Story Default                    |
| 2   | The same                                   | Reading the directions      | สุขุม marked "แนะนำ", เป็นมิตร marked "ทางเลือกที่ต่าง"; each says what it matches and what it differs on, in words                                                     | Story Default                    |
| 3   | The recommended card                       | Reading it                  | One reason per matching decision: "รูปทรง เหลี่ยมคม เพราะ เป็นระเบียบ"; decisions no rule settles are listed ("ยังไม่มีกฎตัดสิน: ...")                                  | Story Default                    |
| 4   | A row selected in the preview              | Viewing the other direction | The preview's profile changes (its radius differs), the row stays selected and the screen keeps its state; the card shows "กำลังดู" and the button reports aria-pressed | Story SwitchKeepsWork            |
| 5   | A sample brief button                      | Pressed                     | The brief text is replaced, the button is pressed, and the directions follow (family travel recommends เป็นมิตร)                                                        | Story SampleBriefs               |
| 6   | Rules that tie                             | Recommending                | "ยังตัดสินไม่ได้: รูปทรง ระหว่าง เหลี่ยมคม หรือ มนนุ่ม", and both directions are still shown                                                                            | Story Tie                        |
| 7   | A brief with no known word                 | Recommending                | No direction; the clause is named as not understood; the preview stays in the base set and says why                                                                     | Story NotRead                    |
| 8   | A brand lock that the brief disagrees with | Recommending                | The lock holds ("การเน้น สุขุม ล็อกโดยแบรนด์") and the disagreement is listed                                                                                           | Story Locked                     |
| 9   | English, dark, 360 px wide                 | Rendered                    | Copy from the catalog; the cards stack                                                                                                                                  | Story EnglishDarkNarrow          |
| 10  | The app                                    | Opening /directions         | The studio with the finance sample and the reference screen as the preview, linked from the home page                                                                   | `pnpm build`, the Vercel preview |

## Rules (part 2)

- The reading runs in the browser with the rule interpreter; nothing is sent or stored.
- The live preview stays at one place in the React tree. Only the profile of its boundary changes.
- Each direction's small sample is inert and named as an image, so it adds no focus stop.
- Every string comes from the catalog (`direction.*`), Thai and English.

## Out of scope (part 2)

- Refinement controls and the trace inspector (part 3).
- Saving a chosen direction, which needs the database (E2-15).
- An AI reading. That waits for the OpenRouter ADR the owner has not confirmed yet.

## Story (part 3)

As a person comparing directions, I want to change the shape, the type voice and the motion of the direction I am viewing and see the same screen change at once. I also want to open a trace that goes from my brief to the decisions, the tokens and the components, so I can see what changed, what is locked, and why.

## Decisions (part 3)

- **Only decisions without colour can be refined now.** `shape`, `typeVoice` and `motion` change radius, type and duration tokens only, so every contrast pair stays proven. `surfaceTreatment` and `emphasis` change colours. They are shown read-only, with the reason, until a refined profile can be contrast-checked at runtime.
- **A refined value is borrowed from the hand-made profile that already expresses it.** For example, shape `soft` on สุขุม takes เป็นมิตร's shape tokens. A value no profile expresses yet, such as shape `rounded`, is offered disabled, and the page says why. No new token values are invented in the browser.
- **A refinement is the expert layer of ADR 0007.** It is passed to the engine as an adjustment with the reason "เลือกในส่วนปรับละเอียด", so the reasons, the matches and the trace show it. A brand lock still wins: its group is disabled and says it is locked. Refining keeps the viewed direction in view, even when the adjustment changes which direction is recommended.
- **Refinements belong to the person, not to a direction.** They apply to whichever direction is viewed, and "ล้างการปรับ" clears them.

## Acceptance criteria (part 3)

| #   | Given                                            | When                        | Then                                                                                                                                                                                                                                                                            | Evidence           |
| --- | ------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | สุขุม is viewed                                  | Choosing shape มนนุ่ม       | The preview's radius changes at once, a selected row stays selected, and the reason "รูปทรง มนนุ่ม ปรับเอง: เลือกในส่วนปรับละเอียด" appears                                                                                                                                     | Story Refine       |
| 2   | Any direction                                    | Opening the refine controls | Shape, type and motion are toggle groups showing the current value; colour-bearing decisions are listed read-only with the reason                                                                                                                                               | Story Refine       |
| 3   | A value no hand-made profile expresses (rounded) | Shown                       | The option is disabled, and a note says it has no tokens yet                                                                                                                                                                                                                    | Story Refine       |
| 4   | A brand lock on shape                            | Trying another shape        | The shape options are disabled with "รูปทรง เหลี่ยมคม ล็อกโดยแบรนด์"; the preview does not change; type and motion stay refinable                                                                                                                                               | Story RefineLocked |
| 5   | Refinements made                                 | Pressing "ล้างการปรับ"      | The preview returns to the hand-made profile                                                                                                                                                                                                                                    | Story Refine       |
| 6   | A viewed direction                               | Opening "ดูที่มา"           | Four disclosures, in this order: the brief's words per axis, decisions with their source (brief words, lock, refinement, or the profile's own choice), tokens this direction changes from the base set with their values in the current mode, and the components that read them | Story Trace        |
| 7   | Any refined profile                              | Built                       | It validates with no error, and its colour tokens equal the hand-made profile's                                                                                                                                                                                                 | `refine.test.ts`   |

## Out of scope (part 3)

- Refining colour-bearing decisions (`surfaceTreatment`, `emphasis`) and a new `rounded` shape. Both need new token values and a contrast check.
- Saving refinements. That needs E2-12 and E2-15.

## Changelog

- v1 (2026-10-22): parts split; part 1 written.
- v2 (2026-10-22): part 2 written.
- v3 (2026-10-22): part 3 written.
- v3.1 (2026-10-22): AC 1 reason text and AC 4 match the build: a locked group is disabled rather than accepting a choice that would then conflict.
