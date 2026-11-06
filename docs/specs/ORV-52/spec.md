---
issue: ORV-52 (https://tpetkaew.atlassian.net/browse/ORV-52), backlog E3-4
lane: M (no risk flag on the default path; open questions 3, 4 and 5 turn it L if the owner picks their option b)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.2
depends on: ORV-32 (E2-9, the deterministic resolver, merged as `packages/intent-engine/src/resolver.ts`)
---

# ORV-52: ORIVILO's own brand as a third profile, chosen by the resolver from ORIVILO's vector

## Why

ORIVILO is its own first customer (DESIGN.md, "ORIVILO is its own first customer"). Its look today is the base token set (`neutral`, no file), written by hand from brand spec v1.1. The brand review asked that ORIVILO's brand go through the same resolver as every customer's (`docs/context/brand/brand-identity-v1-review.md` line 64). This story adds `orivilo` as a profile file and proves, by a test, that the resolver picks it from ORIVILO's personality vector, and lists every token that does not match brand spec v1.1 with its reason.

What the resolver does, read from the code, so nobody reads more into this story: `resolveProfile` (ORV-32) is rule-based. It turns brief facts into five decisions through the starter rules (`STARTER_RULES` in `packages/intent-engine/src/directions.ts`), then picks the curated profile whose decisions match most (`resolver.ts` lines 212 to 229). It does not compute token values. The `orivilo` token values are written by hand from the base set; the resolver chooses the profile, it does not generate it. No AI and no model call is involved anywhere in this story.

What the starter rules give for ORIVILO's vector, worked out (worked example 1): with no locks the shape decision is a rule tie (crisp from structured 80, soft from playful 65), and the profile with the most matches is `friendly`, not `orivilo`. ORIVILO reaches `orivilo` only through its brand locks, the decisions the owner already made (`orv52-locks-1`). The rules' disagreement with those locks is reported as conflicts, which is the resolver's design (ADR 0007): a locked field holds and every disagreement is shown, never dropped.

## Story

As the owner, I want ORIVILO's own brand to come out of the same resolver the Studio uses for customers, with every place it departs from brand spec v1.1 written down with its reason, so that the Studio's look is traceable to its intent like any customer's.

## Rules

- `orv52-vector-1`. ORIVILO's facts are the brand method's vector (`docs/context/brand/brand-ci-method.md` line 28): `personality` playful 65, expressive 70, structured 80, warm 70, premium 65; `industry` null; `audiences` and `avoid` empty. No starter rule reads industry, audience or avoid, so slugs are not invented for them here. The facts are a typed fixture; no interpreter reads them from text.
- `orv52-locks-1`. ORIVILO's brand locks are three, each from a recorded owner decision: `shape: rounded` (pill controls, mood E, owner 2026-10-21, DESIGN.md line 22), `surfaceTreatment: flat` (borderless cards, same line), `typeVoice: single` (display takes the body family, owner ORV-192 rows 15 and 16, `font.display` in `semantic.json`). `emphasis` and `motion` are not locked: the rules set emphasis to expressive, and motion stays open because premium 65 is under the 70 of `motion.premium-quiet`.
- `orv52-decisions-1`. `orivilo.json` declares `shape: rounded`, `surfaceTreatment: flat`, `emphasis: expressive`, `typeVoice: single`, `motion: standard`. Each must pass `Profile.validate()` against the tokens (`checkDecisions` in `model.ts`): control radius 999 and container 16 meet rounded, `border.card` light `transparent` meets flat.
- `orv52-tokens-1`. `orivilo.json` overrides exactly the ten identity-scoped tokens, each with the base set's own reference, so it renders the same values as the base set: `surface.selected`, `text.link`, `text.link-hover`, `text.brand`, `selection.bg`, `selection.fg`, `focus.ring`, `brand.signature`, `brand.ink`, `brand.dot-small`. No own primitives. `$name` is th `ORIVILO`, en `ORIVILO` (open question 6); `$description` says the values are hand-copied from the base set and are not generated.
- `orv52-scope-1`. `orivilo` is a brand profile, not a customer direction. It is exported in its own list, `BRAND_PROFILES` in `packages/design-system/src/profiles/index.ts`, and stays out of `profiles`, `PROFILE_IDS` and `CURATED_PROFILES`, so the Storybook toolbar, the `Matrix` cells, the Studio's directions and every saved snapshot's fingerprint are unchanged (open question 1). Neither `generated.css` changes: `scripts/build-tokens.ts` emits `src/profiles/generated.css` from `profiles` only (lines 5 and 15), so `orivilo` gets no CSS block and renders only as a runtime `Profile` object.
- `orv52-match-1`. A brand spec colour matches when the hex the profile resolves to for that token and mode equals the spec's hex, compared upper-case, no rounding. For a Studio-scoped token the rendered hex is that of its `STUDIO_REMAP` target (`action.intent` renders `action.primary`), because `Profile.tokens` still holds lime there and only `emitCss` remaps it. A spec token with no semantic token of that name does not match. The compared set is the 19 rows of brand spec §5 (light) and the 7 values of its dark set line, each mapped to one semantic token by `orv52-map-1`.

## Acceptance criteria

No UI changes in this story: no page, story or component shows `orivilo`, so no new copy. Every row is a Vitest check in `packages/design-system/src/profiles/orivilo.test.ts`.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `orivilo.json` per `orv52-tokens-1` and `orv52-decisions-1` | `new Profile(base, orivilo).validate()` runs | Nothing (no UI) | None | Returns `[]` |
| 2 | The `orivilo` profile | The contrast pairs `src/tokens/contrast-pairs.test.ts` checks for each profile (`checkContrast` in `src/tokens/contrast-pairs.ts`) run under `orivilo`, light and dark | Nothing | None | Every pair meets its floor in both modes |
| 3 | `orivilo` and the base set | The test resolves each of the ten tokens of `orv52-tokens-1` in light and dark under both | Nothing | None | All 20 values are equal (the profile renders the base look) |
| 4 | Facts per `orv52-vector-1`, no locks, `STARTER_RULES`, `STARTER_KNOWLEDGE_IDS`, profiles `[...CURATED_PROFILES, ...BRAND_PROFILES as curated]` | `resolveProfile` runs | Nothing | None | `status` `conflicted`; one `rule-tie` conflict on `shape` (crisp, soft); `decisions` emphasis expressive and typeVoice paired; `open` `["shape", "surfaceTreatment", "motion"]`, in `DECISION_KEYS` order; `profileId` `friendly` (worked example 1, first run) |
| 5 | Row 4's input with the locks of `orv52-locks-1` | `resolveProfile` runs | Nothing | None | `profileId` `orivilo`, `profileTies` `[]`, `unsupported` `[]`; three `locked` conflicts: shape against crisp, shape against soft, typeVoice against paired; `open` `["motion"]` (worked example 1, second run) |
| 6 | Row 5's input | `resolveProfile` runs twice | Nothing | None | The two fingerprints are equal (same input, same output) |
| 7 | `orivilo` and brand spec §5 and its dark set | The test applies `orv52-match-1` to each of the 26 mapped values | Nothing | None | The ids that do not match equal exactly the colour rows of the diff table: d-1, d-2, d-3, d-4 (worked example 3 shows the method on three of them) |
| 8 | The ORV-32 tests and `profiles.test.ts` | `pnpm test` | Nothing | None | Unchanged and green; `PROFILE_IDS` still `["neutral", "professional", "friendly"]` |

## Rows per PR

- PR 180: rows 1, 2, 3, 4, 5, 6, 7, 8

## Rows that render nothing

- Rows: 1, 2, 3, 4, 5, 6, 7, 8

## Diff against brand spec v1.1

The brand spec file keeps the name `orivilo-brand-spec-v1.1.md` and now holds v1.5; §5 to §7 are unchanged since v1.2 except as noted. Rows d-1 to d-4 are colour and row 7 checks them. Rows d-5 to d-10 are type, shape and space, which `orv52-match-1` does not cover; the test does not check them, this table is their record.

<!-- prettier-ignore -->
| Id | Token or rule | Brand spec v1.1 | What `orivilo` renders | Reason |
| --- | --- | --- | --- | --- |
| d-1 | `focus.ring` | #16151D, 2 px ring and 2 px white gap | #7A22C7 light (`violet.600`), #B07FEE dark (`violet.400`), a 1 px line with a 3 px halo | Owner, ORV-192 row 9 and comment 10403: focus takes the profile's brand hue (AGENTS.md, `focus.ring` description) |
| d-2 | `text.body-soft` | #3A394A | No such semantic token; no primitive holds #3A394A (`gray.700` is #2B2A36) | Never added to the contract. Adding it is a semantic token contract change (open question 3) |
| d-3 | `feedback.info` (as `feedback.info.fg`) | #1D6FD6 (`blue.600`), 4.4 on canvas, 18 px and up only | #0C55AB (`blue.700`) light | One token serves every size, so it must read at body size, 4.5 (`feedback.info.fg` description). `feedback` is a locked group: no profile may change it |
| d-4 | `action.intent` (dark set: lime #D9F66F is the intent action) | Lime #D9F66F | Inside an `orivilo` boundary it renders as `action.primary`, violet | `STUDIO_REMAP` (`model.ts`, DESIGN.md §9 item 10): a profile never carries a Studio token. The Studio shell itself (`neutral`) keeps lime (open question 4) |
| d-5 | Display family and weight | Anuphan 600 and 700 | `font.display` is the body family (IBM Plex Sans, Thai in Sarabun), weight 500 | Owner, ORV-192 rows 15 and 16 (family); mood E sets big numerals in the body face at 500 (DESIGN.md line 22) |
| d-6 | Thai body face | IBM Plex Sans Thai | Sarabun (looped), `font.family.plex-sans` | Owner, ORV-58 (`font.body` description) |
| d-7 | Type scale 20 / 1.5 | Line height 1.5 at 20 px | `type.heading.sm` and `type.body.lg` 20 / 1.7 | Not found in the token source or DESIGN.md (open question 2) |
| d-8 | Type scale 14 / 1.6 | Line height 1.6 at 14 px | `type.body.sm` 14 / 1.7; `type.control.md` and `type.field.sm` keep 14 / 1.6 | Not found for `body.sm` (open question 2); 1.6 on control and field is ORV-111 and ORV-199 |
| d-9 | Radius | s 6, m 10, l 14, xl 22 | Control 999 (pill), media 12, container 16, overlay 24, check 4 | Mood E pill controls, owner 2026-10-21. The v1.1 scale fits no `shape` value (worked example 2), and 10, 14 and 22 are not primitives (open question 5) |
| d-10 | Space | An 8 px scale | 4 px steps (`space.1` 4, `space.3` 12; `space.inline.sm` 4, `space.row-block.comfortable` 12) | Not found in the token source (open question 2) |

### Compared values (`orv52-map-1`)

`orv52-map-1`. The 26 values row 7 compares, each with the semantic token it reads. Light: the 19 rows of brand spec §5 (lines 44 to 62) by their own name, except that a `feedback.<kind>` row reads `feedback.<kind>.fg` (§5 names the hue, the contract splits it into fg, surface and border, and fg is the text and icon hue). Dark: the 7 values of the dark set line (line 64), by the role each names.

<!-- prettier-ignore -->
| Mode | Brand spec name | Hex | Semantic token |
| --- | --- | --- | --- |
| light | surface.canvas | #F4F4F0 | `surface.canvas` |
| light | surface.card | #FFFFFF | `surface.card` |
| light | surface.selected | #F4EEFD | `surface.selected` |
| light | surface.inverse | #16151D | `surface.inverse` |
| light | text.primary | #16151D | `text.primary` |
| light | text.secondary | #5B5A66 | `text.secondary` |
| light | text.body-soft | #3A394A | `text.body-soft` (no such token, d-2) |
| light | action.primary | #7A22C7 | `action.primary` |
| light | action.primary-hover | #6B22B0 | `action.primary-hover` |
| light | action.primary-press | #3F1366 | `action.primary-press` |
| light | selection.fg | #6B22B0 | `selection.fg` |
| light | focus.ring | #16151D | `focus.ring` |
| light | border.control | #85838F | `border.control` |
| light | border.subtle | #E3E2DC | `border.subtle` |
| light | brand.signature | #7A22C7 | `brand.signature` |
| light | feedback.success | #0B6E4F | `feedback.success.fg` |
| light | feedback.warning | #B54708 | `feedback.warning.fg` |
| light | feedback.danger | #B42318 | `feedback.danger.fg` |
| light | feedback.info | #1D6FD6 | `feedback.info.fg` |
| dark | surface | #16151D | `surface.canvas` |
| dark | card | #1E1D26 | `surface.card` |
| dark | text | #F2F1EC | `text.primary` |
| dark | secondary | #A9A7B3 | `text.secondary` |
| dark | action | #B07FEE | `action.primary` |
| dark | signature | #B07FEE | `brand.signature` |
| dark | lime (intent action) | #D9F66F | `action.intent` (renders its `STUDIO_REMAP` target, d-4) |

What matches, for the record: the other 16 light rows of §5 and 6 of the 7 dark values (all but lime), §2's dot colours through `brand.signature` and `brand.dot-small`, §6 display 56 / 1.2 and 32 / 1.25 and body 16 / 1.7, and §7 motion 120 / 200 / 320 with one ease-out. Brand spec §5 gives no dark value for `selection.fg`; that is a gap in the spec, not a diff.

## Worked examples

1. Resolver choice (rules `orv52-vector-1` and `orv52-locks-1`; thresholds copied from `STARTER_RULES` in `directions.ts`, decisions from `professional.json`, `friendly.json` and `orv52-decisions-1`; every starter rule has priority 50, so two values on one key is a tie). The first run has no locks, the second the three locks. No rounding: scores are counts.

   ```bash
   node -e 'const v={playful:65,expressive:70,structured:80,warm:70,premium:65};const R=[["structured",70,{shape:"crisp"}],["playful",60,{shape:"soft"}],["expressive",60,{emphasis:"expressive",typeVoice:"paired"}],["premium",70,{motion:"quiet"}]];const L=process.argv[1]?JSON.parse(process.argv[1]):{};const votes={};for(const[a,min,then]of R)if(v[a]>=min)for(const[k,x]of Object.entries(then))(votes[k]??=new Set()).add(x);const d={};const c=[];for(const k of["shape","surfaceTreatment","emphasis","typeVoice","motion"]){const s=votes[k]?[...votes[k]]:[];if(L[k]){d[k]=L[k];for(const x of s)if(x!==L[k])c.push(k+":"+x)}else if(s.length===1)d[k]=s[0];else if(s.length>1)c.push(k+":tie")}const P={friendly:{shape:"soft",surfaceTreatment:"flat",emphasis:"expressive",typeVoice:"paired",motion:"standard"},orivilo:{shape:"rounded",surfaceTreatment:"flat",emphasis:"expressive",typeVoice:"single",motion:"standard"},professional:{shape:"crisp",surfaceTreatment:"bordered",emphasis:"restrained",typeVoice:"single",motion:"quiet"}};console.log(JSON.stringify({d,c,score:Object.fromEntries(Object.entries(P).map(([id,p])=>[id,Object.entries(d).filter(([k,x])=>p[k]===x).length]))}))' '{"shape":"rounded","surfaceTreatment":"flat","typeVoice":"single"}'
   ```

   Without the last argument it prints `{"d":{"emphasis":"expressive","typeVoice":"paired"},"c":["shape:tie"],"score":{"friendly":2,"orivilo":1,"professional":0}}`: `friendly` wins (row 4). With it: `{"d":{"shape":"rounded","surfaceTreatment":"flat","emphasis":"expressive","typeVoice":"single"},"c":["shape:crisp","shape:soft","typeVoice:paired"],"score":{"friendly":2,"orivilo":4,"professional":1}}`: `orivilo` wins alone (row 5).

2. Shape check of the v1.1 radius scale (`checkDecisions` in `model.ts`; control taken as s 6 and container as l 14, since v1.1 names no roles), next to what ships (control 999, container 16). No rounding.

   ```bash
   node -e 'const t=(c,k)=>({crisp:c<=8&&k<=12,rounded:c>=999&&k>=12&&k<=16,soft:c>=999&&k>=20});console.log(JSON.stringify({v11:t(6,14),ships:t(999,16)}))'
   ```

   Expected: `{"v11":{"crisp":false,"rounded":false,"soft":false},"ships":{"crisp":false,"rounded":true,"soft":false}}` (d-9).

3. `orv52-match-1` on three rows, light mode (spec hexes from brand spec §5; rendered hexes from `semantic.json` refs resolved in `primitives.json`: `focus.ring` to `violet.600` #7A22C7, `action.primary` to `violet.600`, `feedback.info.fg` to `blue.700` #0C55AB). Exact string match after upper-casing, no rounding.

   ```bash
   node -e 'const s={"focus.ring":"#16151D","action.primary":"#7A22C7","feedback.info":"#1D6FD6"};const r={"focus.ring":"#7A22C7","action.primary":"#7a22c7","feedback.info":"#0C55AB"};console.log(JSON.stringify(Object.keys(s).map(k=>[k,s[k].toUpperCase()===r[k].toUpperCase()])))'
   ```

   Expected: `[["focus.ring",false],["action.primary",true],["feedback.info",false]]`.

## Out of scope

- Generating token values from the vector. The resolver chooses among profiles (see Why); a generator is a later resolver story.
- New or changed starter rules (for example a rule that breaks the shape tie or sets motion from premium 65). That is resolver logic, lane L.
- Showing `orivilo` in the Storybook toolbar, the `Matrix`, the Studio's directions or any page (`orv52-scope-1`).
- Changing the base set or brand spec v1.1 to close a diff. The brand book export (E3-5, ORV-53) reads this profile later.

## Open questions

1. Where `orivilo` is registered. (a) Its own `BRAND_PROFILES` list, out of the toolbar, `Matrix` and `CURATED_PROFILES`. (b) In `profiles`, so it shows in the toolbar and every `Matrix` (8 cells, not 6) and becomes a direction for customer briefs; this changes resolutions and saved snapshot fingerprints wherever it ties or wins, and every "Recipes and modes" play and baseline. Default (a).
2. Diffs d-7, d-8 and d-10 have no recorded reason. (a) Keep what ships and record "reason not found" as here; the owner confirms or asks for a change in a follow-up. (b) Change the base set to v1.1 in this story. Default (a): (b) changes every component's metrics and is not this story.
3. `text.body-soft` (d-2). (a) Leave it out; nothing reads it today. (b) Add it to `semantic.json` with a primitive for #3A394A, a semantic token contract change, lane L with an impact list. Default (a).
4. Lime inside an `orivilo` boundary (d-4). (a) Accept the remap: the Studio shell (`neutral`) shows lime, a preview under `orivilo` shows violet. (b) Let a brand profile carry Studio tokens, a profile model contract change, lane L. Default (a).
5. The v1.1 radius scale (d-9). (a) Keep mood E (pill, 16, 24). (b) Add a `shape` value and primitives 10, 14 and 22 so v1.1's scale is expressible, a profile schema change, lane L. Default (a): the owner chose mood E after v1.1 was written.
6. The Thai `$name`. (a) `ORIVILO` in both languages, as a brand name. (b) A Thai spelling such as `ออริวิโล`. Default (a). It shows nowhere in this story.

## Decisions this relies on

- ADR 0007 (`docs/adr/0007-resolver-precedence.md`): locked fields hold, conflicts are reported.
- ADR 0006 (`docs/adr/0006-decision-rule-grammar.md`): the rule form `STARTER_RULES` uses.
- DESIGN.md line 22: mood E, owner's choice 2026-10-21.
- Owner, ORV-192 row 9 and comment 10403 (focus); ORV-192 rows 15 and 16 (display family); ORV-58 (Thai body face); ORV-118 (violet signature, brand spec §10).
- DESIGN.md §9 item 10 and `STUDIO_REMAP` (Studio tokens never inside a profile).

## Changelog

- 1.0 (2026-11-02): first version.
- 1.1 (2026-11-02): lists the 26 compared values and their tokens as `orv52-map-1` (the builder's mapping in `orivilo.test.ts` `SPEC_VALUES`, checked against brand spec §5 lines 44 to 64); `orv52-scope-1` records that neither `generated.css` changes. No AC outcome changes. Review downstream: `packages/design-system/src/profiles/orivilo.test.ts` (matches as is).
- 1.1 (2026-11-02, PR line): adds `- PR 180: rows 1 to 8` and `## Rows that render nothing` (every row, no UI), with no row changed.
- 1.2 (2026-11-06): ORV-216 item 2 (reviewer R1-S2): row 2 names `src/tokens/contrast-pairs.test.ts` (`checkContrast`) as the source of the contrast pairs, in place of `profiles.test.ts`, which checks profile rules and no pairs. No AC outcome changes. Review downstream: `packages/design-system/src/profiles/orivilo.test.ts` row 2 (matches as is: it calls `checkContrast`).
