---
id: K-0203
topic: design
claim: Across K-0185 to K-0202, Untitled UI builds the chain from image through initials and a placeholder to an icon into one component with a status prop, shadcn/ui and Radix give one fallback the caller fills and no status element, the standards read leave a picture beside a visible name to the author with alt="" as the shown form, and no source read gives a rule for Thai initials.
source: "docs/knowledge/design/K-0185-untitled-ui-avatar-sizes-props-and-slots.md; docs/knowledge/design/K-0186-untitled-ui-avatar-fallback-chain-and-sticky-load-failure.md; docs/knowledge/design/K-0187-untitled-ui-avatar-one-indicator-and-unnamed-status-dot.md; docs/knowledge/design/K-0188-untitled-ui-avatar-alt-repeats-visible-name-no-aria.md; docs/knowledge/design/K-0189-shadcn-ui-avatar-parts-sizes-and-classes.md; docs/knowledge/design/K-0190-shadcn-ui-avatar-fallback-text-children-no-icon-example.md; docs/knowledge/design/K-0191-shadcn-ui-avatar-badge-empty-span-no-status-meaning.md; docs/knowledge/design/K-0192-radix-avatar-three-parts-no-accessibility-text.md; docs/knowledge/design/K-0193-radix-avatar-source-preload-fallback-and-lost-alt.md; docs/knowledge/design/K-0194-base-ui-avatar-keep-mounted-and-broken-image-note.md; docs/knowledge/design/K-0195-wcag-2-2-non-text-content-decoration-and-null-alt.md; docs/knowledge/design/K-0196-wai-images-tutorial-image-described-by-adjacent-text.md; docs/knowledge/design/K-0197-wcag-2-2-h2-image-and-text-in-one-link.md; docs/knowledge/design/K-0198-whatwg-html-alt-for-a-face-beside-text.md; docs/knowledge/design/K-0199-wai-aria-1-2-img-name-presentation-and-aria-label.md; docs/knowledge/design/K-0200-aria-in-html-img-rows.md; docs/knowledge/design/K-0201-wcag-2-2-use-of-color-and-non-text-contrast-for-a-dot.md; docs/knowledge/design/K-0202-initials-for-thai-silence-and-charat.md; docs/specs/ORV-64/audit.md; AGENTS.md; DESIGN.md; .claude/rules/design-system.md; .claude/rules/security.md; packages/design-system/catalog/coverage.md; packages/design-system/package.json; packages/design-system/src/components/badge/Badge.tsx; packages/design-system/src/components/icons.tsx; packages/design-system/src/components/skeleton/Skeleton.tsx; packages/db/src/schema/auth.ts; packages/db/src/schema/classification.ts; pnpm-lock.yaml"
retrieved: 2026-11-06
confidence: 0.75
applies_to: [ORV-224]
license: own-words
---

## Evidence

A synthesis of the entries in `source:`, each at 0.8 except K-0202 (0.75, mostly an absence). It lists what the sources show and what the repo holds, not what ORV-224 should do. The Add row holds candidates and the Do not copy row holds items that meet a repo rule already written; the choice stays with the designer and the owner.

### Benchmark, in the form of audit section B

| Item        | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Untitled UI | Page: <https://www.untitledui.com/react/components/avatars.md>. No variant prop. Sizes `xs`, `sm`, `md` (default), `lg`, `xl`, `2xl`; `AvatarLabelGroup` and `AvatarProfilePhoto` `sm`, `md`, `lg` (K-0185). Slots `src`, `initials`, `placeholderIcon`, `placeholder`, `status`, `verified`, `count`, `badge`; options `border`, `rounded`, `focusable` (K-0185). States: failed image falls back, stays failed for the instance; no loading state named (K-0186). One indicator at a time, in the order `status`, `verified`, `count`, `badge` (K-0187). Focus ring only through a parent link (K-0188). `alt` repeats the visible name in samples; no `aria-*` or `role` in `avatar.tsx` (K-0188).                                                                                                                                                                      |
| shadcn/ui   | Page: <https://ui.shadcn.com/docs/components/radix/avatar>. No variant prop. Sizes `default`, `sm`, `lg` (K-0189). Parts `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` (K-0189). Fallback holds what the caller writes; samples hold text, none an icon (K-0190). `AvatarBadge` is an empty bottom-right span, green only by the caller's class, with no status meaning (K-0191). Load behaviour is Radix's: preload, resets on a new `src`, `delayMs` for the fallback (K-0192, K-0193). No `aria-*` or `role` in the registry file (K-0189).                                                                                                                                                                                                                                                                               |
| Ours        | No Avatar: `coverage.md` line 24 says `none`, `catalog/base/` has no entry, `audit.md` line 50 says build. `Skeleton` has a `circle` shape for an avatar (`Skeleton.tsx` line 11). The primitive is installed: `radix-ui` 1.8.1 (`package.json` line 29), `@radix-ui/react-avatar@1.3.1` (`pnpm-lock.yaml` line 1677, K-0193). `icons.tsx` imports no person glyph (import list, lines 2 to 53). `Badge` has a `dot` that is `aria-hidden`, and its word carries the meaning (`Badge.tsx` lines 14, 33, 47). Data: `user.name` required and `user.image` nullable (`auth.ts` lines 7, 10), both tagged `personal` (`classification.ts` lines 24, 27). No presence field: `presence`, `isOnline`, `lastSeen` and `last_seen` have one hit in `.ts` and `.tsx` under `apps/web` and `packages`, a comment at `Badge.tsx` line 24.                                            |
| Add         | Candidates, not decisions. The chain image, initials, icon on the Radix primitive, with a story for empty `src`, slow load and failed load (K-0186, K-0192, K-0193); a person glyph for the last step (K-0186, Ours). Sizes from the Studio's need, with shadcn's three and Untitled's six (own counts of the `size` values) as the benchmarks (K-0185, K-0189). A named form for each use: beside a visible name, alone as a control, alone with no control (K-0195 to K-0198). A way for the person's name to survive a failed image, as `alt` does not (K-0188, K-0193). A stated rule for Thai initials (K-0202). Group and count only if Members needs them (K-0185, K-0189).                                                                                                                                                                                         |
| Do not copy | `status` online or offline: the repo has no presence data, and audit D.3 row 21 says no status dot without data (K-0187, Ours). A dot told apart by colour alone with no text: `Badge.tsx` line 33 says colour never carries meaning alone (K-0187, K-0201). `bg-green-600` by caller class: audit B.3 says a dot colour must be a feedback token name (K-0191). `verified` tick: AGENTS.md forbids trust badges without backing data (K-0187). `count` on `bg-fg-error-primary`: DESIGN.md section 8 keeps danger colour for wrong or dangerous (K-0187). Handle-style `alt` and a name repeated in `alt` beside the same visible name: K-0196 to K-0198 show the empty form for repeated text (K-0188, K-0190). A failed flag that never clears: an image that returns would not show (K-0186). `charAt(0)` initials: one UTF-16 code unit, no account of Thai (K-0202). |

### Fallback chain and load failure

- Untitled UI: `src`, `initials`, `placeholderIcon`, `placeholder`, `User01`. The `img` renders at once; `onError` sets a flag that is not cleared (K-0186).
- shadcn/ui: `AvatarImage`, then what `AvatarFallback` holds (K-0190).
- Radix: `Image` after preload, else `Fallback`, also while loading unless `delayMs` is set; a new `src` starts over (K-0192, K-0193).
- Base UI: `Fallback` on failure or no image; `data-error`; `keepMounted` (K-0194).

### A person's picture beside a visible name

- Image and name in one link: H2 gives an empty `alt`, or one that supplements the text and describes the image (K-0197).
- Face beside text, no caption: an authoring decision; the example has `alt=""` and "there might be no value in describing it" (K-0198).
- Described by surrounding text: decorative, `alt=""` (K-0196). The fit to a name is an inference (K-0196).
- With a caption giving the title: `alt` must not be empty (K-0198).
- Alone in a link or button: the text conveys the purpose (K-0195, K-0197, K-0198).
- Not in the output: `alt` while the fallback shows (K-0188, K-0193). Initials are then the only text. Only Base UI says this in prose (K-0194).
- `alt=""` allows no `aria-*` except `aria-hidden="true"` (K-0200). A wrapper with role `img` needs a name (K-0199). Label text in the DOM goes through `aria-labelledby`, not `aria-label` (K-0199).

### Statements scoped to the pages read

- All four libraries fall back on an empty or missing `src` as well as on a failed load: Untitled UI (K-0186), Radix (K-0193), shadcn/ui through Radix (K-0189, K-0190), Base UI (K-0194).
- Only Untitled UI builds an icon step in (K-0186). Base UI's description names a fallback icon, but its demo holds text and its source was not read (K-0194). shadcn/ui and Radix show none (K-0190, K-0192).
- Only Untitled UI has a status prop (K-0187). shadcn/ui's badge has no status meaning (K-0191); Radix has no such part (K-0192); in Base UI the word occurs only in `onLoadingStatusChange` (K-0194).
- Neither status dot read carries text, in code or sample (K-0187, K-0191).
- Of the two load paths read in code, only Untitled UI's does not recover on a new `src` (K-0186, K-0193). Base UI's source was not read.
- No avatar page states a rule for the `alt` value (K-0188, K-0190, K-0192, K-0194). Base UI's `keepMounted` sentence is the nearest and is about the fallback (K-0194).
- Only WHATWG speaks of a face beside text (K-0198). The Understanding page has a generic photograph of two leaders (K-0195); the tutorial's example is a dog (K-0196); H2's is an icon (K-0197); the WAI-ARIA sections read say nothing on it (K-0199).
- No page read gives a rule for initials in Thai (K-0202).

### Not read

- Untitled UI's rendered API table, `AvatarCompanyIcon`, `avatar.demo.tsx`, `avatar.story.tsx`, the `base-components` index (`index.ts` returned HTTP 404) and `@untitledui/icons` `User01` (K-0185, K-0187, K-0188).
- shadcn/ui's React Aria tab; Base UI's source (K-0189, K-0194).
- ARIA in HTML past character 100000 (K-0200). The `aria-hidden` text on focusable elements (K-0199). Accessible Name computation and WAI-ARIA APG, which the answer did not need.
- G196, a text alternative on one item in a group of images, named but not opened (K-0195).

## Why it matters for ORIVILO

Audit D.3 row 21 asks for the fallback chain and no status dot without data, and `.claude/rules/design-system.md` asks for this table before the story. Three points have no answer in the sources and stay open: which form a picture beside a name takes, how Thai initials are made, and how a name and picture tagged `personal` sit with the masking rule in `.claude/rules/security.md` rule 13.
