---
issue: ORV-224 (https://tpetkaew.atlassian.net/browse/ORV-224)
lane: as set on ORV-224 in Jira (not read in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 21 ("Avatar")
version: 1.2
---

# ORV-224: Avatar (base)

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247), plus a Radix row and a Standards row as ORV-203 has. Every cell is from K-0185 to K-0203 (read 2026-11-06); the Ours row is the code in this worktree, as K-0203 records it. The Add and Do not copy rows are this spec's choices; each points to the rule in "Rules" that holds it.

### Avatar

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | Page: <https://www.untitledui.com/react/components/avatars.md>. Not read: its rendered API table. Both page URLs returned the raw MDX source, which holds only the placeholder `<ApiReference slug="avatars" />`, so the facts here come from `avatar.tsx` on `main` and are not filled from memory (K-0185). Also not read: `AvatarCompanyIcon`, `avatar.demo.tsx`, `avatar.story.tsx`, the `base-components` index and `@untitledui/icons` `User01` (K-0203). Variants: no variant prop. Sizes `xs`, `sm`, `md` (default), `lg`, `xl`, `2xl`, classes `size-6` to `size-16`; `AvatarLabelGroup` and `AvatarProfilePhoto` take `sm`, `md`, `lg` (K-0185). Slots `src`, `initials`, `placeholderIcon`, `placeholder`, `status`, `verified`, `count`, `badge`; options `border`, `rounded`, `focusable` (K-0185). States: no disabled, loading or selected state named; a failed image falls back and stays failed for the instance (K-0185, K-0186). One indicator at a time, in the order `status`, `verified`, `count`, `badge` (K-0187). Focus ring only through a parent link (K-0188). `alt` repeats the visible name in samples; no `aria-*` or `role` in `avatar.tsx` (K-0188). |
| shadcn/ui | Page: <https://ui.shadcn.com/docs/components/radix/avatar>. No variant prop. Sizes `default`, `sm`, `lg` (K-0189). Parts `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` (K-0189). The fallback holds what the caller writes; samples hold text, none an icon (K-0190). `AvatarBadge` is an empty bottom-right span, green only by the caller's class, with no status meaning (K-0191). No disabled, loading or selected state named; load behaviour is Radix's (K-0189, K-0190). Samples pass a handle as `alt` (K-0190). No `aria-*` or `role` in the registry file (K-0189). |
| Radix (primitive) | Parts Root, Image, Fallback; `onLoadingStatusChange` on Image, `delayMs` on Fallback; no sizes, variants, data attributes or status element, and the words alt, aria and initials do not occur on the page (K-0192). Version 1.3.1 preloads `src`, mounts the `img` only once loaded, shows Fallback in every other status, resets on a new `src`, and passes `alt` only to the `img`, so the text leaves the page while Fallback shows (K-0193). |
| Standards | SC 1.1.1 gives a picture two outcomes, a text alternative or a way to be ignored, and names neither a portrait nor an avatar (K-0195). Described by adjacent text: `alt=""`, and the fit to a name is an inference (K-0196). Image and text in one link: empty `alt`, or one that supplements the text (K-0197). A face beside text is an authoring decision with `alt=""` as the shown form; a caption giving the title needs a non-empty `alt`; alone in a link or button the text conveys the purpose (K-0198). Role `img` needs a name and its children are presentational; label text in the DOM goes through `aria-labelledby` (K-0199). `alt=""` allows no `aria-*` except `aria-hidden="true"` (K-0200). A dot told apart by colour alone falls under 1.4.1, and a status graphic with no text under the 3:1 of 1.4.11 (K-0201). No source read gives a rule for Thai initials (K-0202). |
| Ours | No Avatar: `coverage.md` line 24 says `none`, `catalog/base/` has no entry, `audit.md` line 50 says build. `Skeleton` has a `circle` shape for an avatar (`Skeleton.tsx` line 11). The primitive is installed: `radix-ui` 1.8.1 (`package.json` line 29), `@radix-ui/react-avatar@1.3.1` (K-0193). `icons.tsx` imports no person glyph. `Badge` has a `dot` that is `aria-hidden`, and its word carries the meaning (K-0203). Data: `user.name` required and `user.image` nullable (`auth.ts` lines 7, 10), both tagged `personal` (`classification.ts` lines 24, 27). No presence field in `.ts` or `.tsx` under `apps/web` and `packages` (K-0203). |
| Add | The chain image, initials, icon on the Radix primitive, with a story for empty `src`, slow load and failed load (K-0186, K-0192, K-0193): `avatar-chain-1`. A person glyph for the last step (K-0186): `avatar-chain-1`. Sizes from the Studio's need (K-0185, K-0189): `avatar-size-1`. A named form for each use, and a person's name that survives a failed image (K-0188, K-0193, K-0195 to K-0198): `avatar-name-1`. A stated rule for Thai initials (K-0202): `avatar-initials-1`. |
| Do not copy | `status` online or offline: the repo has no presence data, and audit D.3 row 21 says no status dot without data (K-0187): `avatar-none-1`. A dot told apart by colour alone with no text: `Badge.tsx` line 33 says colour never carries meaning alone (K-0187, K-0201). `bg-green-600` by caller class: audit B.3 says a dot colour must be a feedback token name, and our components take no colour class (K-0191). `verified` tick: AGENTS.md forbids trust badges without backing data (K-0187). `count` on `bg-fg-error-primary`: DESIGN.md section 8 keeps danger colour for wrong or dangerous (K-0187). A handle as `alt`, or the name in `alt` beside the same visible name: K-0196 to K-0198 show the empty form for repeated text (K-0188, K-0190). A failed flag that never clears: an image that returns would not show (K-0186). `charAt(0)` initials: one UTF-16 code unit, no account of Thai (K-0202, W4). shadcn's classes: the repo keeps no shadcn class (ADR 0003, K-0189). |

## Goal

Two Studio needs show who did something: Members, and review comments (audit D.3 row 21). Today the design system has nothing for that, so the first screen would hand-build a round picture, and it would meet what the benchmark records: a failed picture paints a broken-image mark (K-0194), a Thai name makes a wrong initial (K-0202), and the person's name leaves with the picture (K-0193).

This story gives the design system one `Avatar` on the Radix primitive: a picture, then initials, then an icon, in that order, and a stated way to name it. Done when, by audit D.3 row 21: a fallback chain (image, initials, icon) story exists and no status dot ships without data.

What is simulated: the people, names and pictures in the stories are mock fixtures, labelled as mock; no real person's data or photo reaches this story. Initials are rule-based (`avatar-initials-1`), not read by a model. No screen in `apps/web` uses Avatar yet (`avatar-data-1`).

## Story

As a person in a workspace, when I look at who is on a team or who wrote a comment, I see that person's picture; if there is no picture or it cannot load, I still see something that tells people apart, and a screen reader gives me the person's name once, not twice and not a stray letter.

## Rules

### avatar-api-1

One new public component, `Avatar`, in `src/components/avatar/Avatar.tsx`, with the contract type `AvatarProps` and the type `AvatarSize`, exported from `@orivilo/design-system`:

- `name`: `string | undefined`. The person's name as the caller may show it. It makes the initials and, in the named form, the accessible name.
- `src`: `string | null | undefined`. The picture URL. `null` passes through because `user.image` is nullable.
- `size`: `AvatarSize`, default `md` (`avatar-size-1`).
- `decorative`: `boolean | undefined`, default `false` (`avatar-name-1`). The prop name follows `Spinner`'s (`Spinner.tsx` line 20).
- `className`: layout only.

Behaviour comes from `Avatar` in the `radix-ui` package, imported as `import { Avatar as AvatarPrimitive } from "radix-ui"` (`radix-ui` `dist/index.d.ts` lines 9 and 10 export it). The component takes no children, no `asChild`, no event handler and no `delayMs`.

### avatar-chain-1

What the disc shows, in order:

1. The picture, once it has loaded. Radix mounts the `img` only then (K-0193).
2. Otherwise the initials of `name`, if `avatar-initials-1` gives any.
3. Otherwise the person glyph `PersonIcon` (Lucide `UserRound`, `src/components/icons.tsx`).

"Otherwise" covers a missing, `null` or empty `src`, a picture still loading, and a failed load. While a picture loads the fallback shows at once, with no `delayMs`, and the picture takes its place when it has loaded. A new `src` starts over from step 1 (Radix resets on a new `src`, K-0193), so an expired signed URL replaced by a fresh one shows the picture. Avatar never retries a failed `src` itself.

### avatar-initials-1

Rule-based, pure, and internal: `initialsOf(name: string): string` in `src/components/avatar/initials.ts`, not exported from the package. An empty string means no initials.

1. Split the name on whitespace and keep the words that hold a letter (`\p{L}`). The split and the letter filter already drop the empty word a leading or trailing space leaves, so no separate trim is needed. No word kept: no initials.
2. Take the first grapheme cluster that holds a letter in the first kept word (`Intl.Segmenter` with `granularity: "grapheme"`, as `fixtures.ts` line 214 does).
3. If that cluster is Thai script (`\p{Script=Thai}`): the result is the first Thai consonant of that word (U+0E01 to U+0E2E), alone and with no vowel or mark, so a leading vowel such as โ is passed over. One letter, never two. A word with no consonant gives no initials.
4. Otherwise: the result is that cluster, plus the first such cluster of the last kept word when there are two or more kept words and that cluster is not Thai, upper-cased with `toUpperCase()` in code, never by CSS.

`initials.ts` writes Thai ranges as `\u` escapes, since `check-i18n` fails on a Thai character outside the catalog. Worked example W1 maps real input to output. No read source gives this rule (K-0202): it is this spec's default, and open question 2 holds the choice.

### avatar-name-1

Two forms, set by `decorative`:

- Named (the default): the root has `role="img"` and `aria-label` set to the trimmed `name`, or to `avatar.noName` when `name` is missing or blank. The label stays the same through each step of `avatar-chain-1`, so the name survives a failed picture, which `alt` does not (K-0188, K-0193).
- Decorative: the root has `aria-hidden="true"`, no `role` and no `aria-label`.

In both forms the `img` has `alt=""` and no `title`, and the initials and the glyph carry no label of their own. Which form each use takes:

<!-- prettier-ignore -->
| Use | Form | Who names it |
| --- | --- | --- |
| Beside a visible name, also inside one link or row button with that name | Decorative | The visible text (K-0196, K-0197, K-0198) |
| Alone as a control | Decorative | The control: a `Button` with `iconOnly`, whose type makes `aria-label` mandatory (`Button.tsx` line 36), states the action and the person (K-0195, K-0197, K-0198) |
| Alone with no control | Named | Avatar (K-0195, K-0199) |

The named form is the default because a forgotten prop then reads a name twice, where the other way round a person has no name at all. `aria-label` is right here since the name text is not in the DOM in that use (K-0199). Avatar takes no focus and has no focus style; a ring is the control's (K-0188).

### avatar-size-1

<!-- prettier-ignore -->
| `size` | Disc | Glyph | Initials |
| --- | --- | --- | --- |
| `sm` | `size.control.sm` | `size.icon.sm` | `type.control.md` |
| `md` (default) | `size.control.md` | `size.icon.md` | `type.control.md` |

Worked example W2 gives the pixels. The initials take one type token at both sizes (`design.md` D5). The disc never shrinks in a flex row (`flex: none`). No other size ships (open question 4).

### avatar-look-1

The root is round under each profile by `clip-path: circle(50%)`, the form Skeleton's `circle` uses (`recipes.css` line 1494), so a loading shape and the Avatar that replaces it match. The root also has `overflow: hidden`, which adds no look: `expectNoGlyphClip` counts `overflow` and not `clip-path` as a clip, so AC 2 needs it (`design.md` D2). The picture fills the disc with `object-fit: cover`. The root's ground is `avatar.bg`, which references `border.subtle`, so a transparent picture still sits on a disc and the disc has the colour of `skeleton.bg` (`design.md` D3). The ink is `avatar.fg`, which references `text.primary`, for the initials and the glyph alike (`design.md` D4). The initials sit in their own line box, `.ds-avatar__initials`, inside `.ds-avatar__fallback`, which centres its one child (`design.md` D6). No border, no shadow, no hover style, no transition, no animation (DESIGN.md section 9 item 6). The initials take no letter-spacing and no `text-transform` (DESIGN.md section 4).

### avatar-none-1

No `status`, `verified`, `count` or `badge` prop, no slot for one, and no group part. Reason: the repo has no presence field (K-0203), audit D.3 row 21 says no status dot without data, AGENTS.md forbids trust badges without backing data, and no story needs a count (open question 5). A later story that holds the data adds one with its own spec.

### avatar-data-1

Avatar renders what it is given and decides nothing about who may see what: no permission check, no `masked` prop, no read of a session. Masking happens on the server before props are built (`.claude/rules/security.md` rule 13; AGENTS.md: permissions come from the domain). A person the viewer may not see reaches Avatar with no `name` and no `src`, and reads as `avatar.noName` with the glyph. Initials derive from a `personal` field, so they count as `personal` too. Avatar logs nothing, and writes `name` and `src` to no `title` or `data-*` attribute. Its stories use `avatarFixtures` only. This story adds Avatar to no `apps/web` screen; open question 3 says what the first screen needs.

### avatar-stories-1

Story file `Avatar.stories.tsx`, title `Base/Avatar` (id `base-avatar`), these twelve stories:

<!-- prettier-ignore -->
| Story | Shows |
| --- | --- |
| `Picture` | Step 1, named |
| `Initials` | Step 2, named, Thai and Latin names |
| `NoName` | Step 3, named, a missing name and a name with no letter |
| `FailedPicture` | A failed load falling back to step 2 |
| `SlowPicture` | The loading state, one Thai and one English Avatar |
| `NewPicture` | A failed `src` replaced by a good one, one Thai and one English Avatar |
| `Sizes` | `sm` and `md` at the three steps |
| `BesideName` | Decorative, beside a name and in one link with a name |
| `AsControl` | Decorative in a `Button` with `iconOnly` |
| `InEnglish` | `Picture`, `Initials`, `NoName`, `FailedPicture`, `Sizes`, `BesideName` and `AsControl` under `LocaleProvider locale="en"` with the English fixtures |
| `At360` | A long Thai name beside a disc in `Narrow` |
| `RecipesAndModes` | The three steps through `Matrix` |

Together these give Thai and English for each size (`sm`, `md`), each state (picture, initials, icon, failed, loading) and each form (named, decorative). Plays run in Thai unless the table says otherwise. Avatar has no variant prop. Of DESIGN.md section 7, default, dark mode and profile B apply; Avatar is not interactive, so hover, focus-visible, pressed, disabled, selected, invalid, empty and read-only do not, and `AsControl` shows Button's own.

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| ------ | ----- | ------ |
| `Avatar`, `AvatarProps`, `AvatarSize` (`avatar-api-1`) | Component API | New exports in `src/components/index.ts`; new catalog entry `catalog/base/avatar.yaml` (story `base-avatar`, status `draft`, sizes `sm`, `md`, states `picture`, `initials`, `icon`, `failed`, `loading`, recipes neutral, professional, friendly, with the table of `avatar-name-1` under `rules` or `a11y`); `catalog/coverage.md` line 24 becomes `draft`, `base-avatar` |
| `initialsOf` (`avatar-initials-1`) | Internal helper | `src/components/avatar/initials.ts` and `initials.test.ts`; not public, so no other caller |
| Component tokens `avatar.bg` and `avatar.fg`, with the references `avatar-look-1` names | Component token | `component.json`, then `pnpm --filter @orivilo/design-system tokens` and the regenerated `generated.css`. No primitive, semantic or profile change. Reason: a recipe slot reads its own name; the ground of `skeleton.bg` (`component.json` lines 2152 to 2158), and the ink that clears 4.5 on it (`design.md` D3, D4) |
| Recipe classes `ds-avatar`, `ds-avatar__image`, `ds-avatar__fallback`, `ds-avatar__initials` (`avatar-look-1`) | Recipe | `recipes.css`, `data-size` for `sm` and `md`; sizes read `--ds-size-control-*` and `--ds-size-icon-*`, initials read `--ds-type-control-md-*`. `pairs.ts` gains one row: recipe `avatar`, slot `fallback`, fg `avatar.fg`, bg `avatar.bg`, floor `TEXT`, which also covers the glyph at the lower UI floor |
| `PersonIcon` | Icon set | `icons.tsx`: one Lucide import (`UserRound`, in `lucide-react` 1.52.0) and one export. Its line 62 says 46 glyphs while the import list has 49; the builder sets it to 50 |
| `avatar.noName` | Locale catalog | `src/i18n/messages/th.ts` and `en.ts` (see "Copy") |
| `avatarFixtures` | Fixture | `src/components/fixtures.ts` only; no component reads it |

Not changed: no primitive or semantic token, no profile, `Skeleton`, `Button`, `Badge`, `apps/web`, `packages/db`, `packages/auth`, `DESIGN.md`.

## Copy

One catalog key, read by the named form with no name (`avatar-name-1`):

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | ---- | ------- |
| `avatar.noName` | ไม่แสดงชื่อ | Name not shown |

It says "not shown" and not "unknown" so it stays true for a missing name and for a masked one.

Fixture copy for the stories, labelled mock in a comment, not catalog keys (`avatar-data-1`). The names are invented.

<!-- prettier-ignore -->
| Fixture key | Thai | English |
| ----------- | ---- | ------- |
| `avatarFixtures.name`, `.nameEn` | สมชาย ใจดี | Anong Srisuk |
| `avatarFixtures.namePreBase` | ไพลิน ศรีสุข | Not used |
| `avatarFixtures.menuLabel`, `.menuLabelEn` | เปิดเมนูบัญชีของสมชาย ใจดี | Open the account menu for Anong Srisuk |
| `avatarFixtures.newPicture`, `.newPictureEn` | โหลดรูปใหม่ | Load a new picture |

`avatarFixtures.picture` is an inline SVG `data:` URI, a drawn stand-in and no real person's photo. `avatarFixtures.brokenPicture` is `data:image/png;base64,AAAA`, which cannot decode, so the failure needs no network. Both pass the CSP's `img-src` (`data:`, `apps/web/security-headers.ts` line 27). `At360` uses `fixtures.longThai`, and `Initials` also uses `fixtures.thaiMarks` and `fixtures.longThai`. `NoName` uses `fixtures.missing` and the name `2026`.

## Acceptance criteria

Story file and story names per `avatar-stories-1`. `T` is the Storybook test project under neutral, light, Thai.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | `T` | `Picture` renders with `avatarFixtures.picture` and `avatarFixtures.name` | The mock picture in a round disc, no initials | None. Root is `role="img"` named "สมชาย ใจดี"; the `img` has `alt=""` and no `title`; `.ds-avatar__fallback` is gone after load (`avatar-chain-1`, `avatar-name-1`) | `Picture` play: `findByRole("img", { name: "สมชาย ใจดี" })`, attribute asserts on `canvasElement.querySelector("img")` |
| 2 | `T` | `Initials` renders five Avatars with no `src`: `avatarFixtures.name`, `avatarFixtures.namePreBase`, `fixtures.thaiMarks`, `fixtures.longThai`, `avatarFixtures.nameEn` | Five discs reading ส, พ, ป, บ and AS, each centred in its disc, no letter clipped | None. Each root is named by its full name (W1) | `Initials` play: text and `getByRole` asserts; `expectNoGlyphClip` on each `.ds-avatar` root, whose `overflow: hidden` is the clip it reads (its box is square, so the fit inside the circle is AC 19's); under `inVitest`, `expectInkCentred` with `.ds-avatar__initials` as its boxes, not `.ds-avatar__fallback`, `measure: "body"` on the Thai spans and `"ink"` on the Latin one |
| 3 | `T` | `NoName` renders one Avatar with `fixtures.missing` and one with the name `2026`, neither with a `src` | Two discs with the person glyph, no text inside | None. Roots named "ไม่แสดงชื่อ" and "2026"; the glyph `svg` is `aria-hidden` (`avatar-chain-1`, `avatar-name-1`) | `NoName` play: `getByRole` by each name; `textContent` of each root is empty |
| 4 | `T` | `FailedPicture` renders with `avatarFixtures.brokenPicture` and `avatarFixtures.name` | The disc reads ส; no broken-image mark | None. No `img` in the canvas; the root keeps the name "สมชาย ใจดี" (`avatar-chain-1`, K-0193) | `FailedPicture` play: `findByText("ส")`, `querySelector("img")` is null, `getByRole` by name |
| 5 | `T`, `window.Image` replaced in the story's `beforeEach` by a stub the play releases (Radix reads `complete` and `naturalWidth`, `dist/index.mjs` lines 99 to 112 and 122 to 124) and restored after | `SlowPicture` renders one Thai and one English Avatar, then the play releases the load | First the discs read ส and AS; then the picture replaces each | None. No `img` before release, one per Avatar after; each root's name is the same before and after | `SlowPicture` play |
| 6 | `T` | `NewPicture` renders one Thai and one English Avatar with `avatarFixtures.brokenPicture`, then the button "โหลดรูปใหม่" and then "Load a new picture" are pressed, each setting `avatarFixtures.picture` | First the discs read ส and AS; after each press that Avatar shows the picture | None. An `img` is mounted after each press with `src` equal to the fixture, which Untitled's flag would not do (K-0186) | `NewPicture` play: `userEvent.click`, `findBy` asserts |
| 7 | `T` | `Sizes` renders `sm`, `md` and no `size`, at the picture, initials and glyph steps | Discs at two sizes, the one with no `size` matching `md`; Thai initials centred at both | None. Root width and height 32 at `sm`, 40 at `md` and with no `size`; glyph 16 and 20 (W2); root computed `clipPath` is `circle(50%)` (`avatar-size-1`, `avatar-look-1`) | `Sizes` play: `getBoundingClientRect`, `getComputedStyle`; under `inVitest`, `expectInkCentred` with the Thai `.ds-avatar__initials` spans as its boxes, not `.ds-avatar__fallback`, and `measure: "body"` |
| 8 | `T` | `BesideName` renders a decorative Avatar with visible text "สมชาย ใจดี", once with the picture and once with no `src`, and a third inside one link with that text | The disc beside the name in three rows | None. Roots `aria-hidden="true"`; `queryByRole("img")` is null in the canvas; each row holds the name once; the link's name is exactly "สมชาย ใจดี", no ส before it (`avatar-name-1`) | `BesideName` play: `getByRole("link", { name: "สมชาย ใจดี" })`, `getAllByText("สมชาย ใจดี")` has length 3 |
| 9 | `T` | `AsControl` renders a ghost `Button` with `size="md"`, `iconOnly` and `aria-label={avatarFixtures.menuLabel}` holding a decorative `sm` Avatar, once with the picture and once with `avatarFixtures.brokenPicture`; the play tabs to each | The disc inside the button; the focus line and halo on the button, none on the disc | None. Both buttons are named "เปิดเมนูบัญชีของสมชาย ใจดี", also after the failed load; the Avatar root has no `tabindex` (`avatar-name-1`) | `AsControl` play: `getAllByRole("button", { name })` has length 2, `userEvent.tab()`, `toHaveFocus()` |
| 10 | Storybook test project, neutral, light, English | `InEnglish` renders its contents per `avatar-stories-1` | Picture, AS, the person glyph, the failed load reading AS, both sizes, "Anong Srisuk" beside a disc, a button | None. Roots named "Anong Srisuk" and "Name not shown"; button named "Open the account menu for Anong Srisuk" | `InEnglish` play |
| 11 | Storybook, a 360 px frame (`data-testid="frame"`, inside `Narrow`) | `At360` renders a `md` decorative Avatar beside `fixtures.longThai` | The long name wraps inside the frame; the disc keeps its width; no horizontal scroll; no clipped Thai marks | None. Root width stays 40 | `At360` play: frame `scrollWidth` not above 360; `getBoundingClientRect`; computed `overflowX` and `overflowY` are `visible` on the name and on each ancestor up to the frame, the frame included, so nothing clips the name; under `inVitest`, `expectLinesClear` on the name, which wraps |
| 12 | Storybook test project | `RecipesAndModes` renders through `Matrix` | In six boundaries (neutral, professional, friendly, each light and dark) a picture, initials and a glyph; round under each | None. 6 cells and 18 Avatars (W3); root computed `clipPath` is `circle(50%)` in each cell | `RecipesAndModes` play counts by `[data-matrix-cell]` and `.ds-avatar` |
| 13 | Storybook test project | The a11y addon runs on the twelve stories of `avatar-stories-1` | Not a screen | Zero violations (DESIGN.md section 11) | Vitest Storybook project output |
| 14 | `initials.test.ts` | The nine inputs of W1 run through `initialsOf` | Not a screen | Each gives the W1 output | `pnpm --filter @orivilo/design-system exec vitest run src/components/avatar` output |
| 15 | `src/components/avatar/Avatar.fixtures.tsx`, a type fixture in the form of `packages/db/src/schema/classification.fixtures.ts` | `<Avatar status="online" />`, `verified`, `count={3}` and `badge` each sit under `// @ts-expect-error` | Not a screen | The type rejects each (`avatar-none-1`); the builder confirms the file is inside the package's typecheck | `pnpm --filter @orivilo/design-system typecheck` output, and with one directive removed, its failure |
| 16 | The PR head | The source and the diff are searched | Not a screen | `grep -n -e "console\." -e "title=" -e "data-name" -e "data-src" packages/design-system/src/components/avatar/Avatar.tsx` prints nothing; `git diff --name-only origin/develop...HEAD -- apps/web packages/db packages/auth` prints nothing (`avatar-data-1`) | Both outputs in the builder's `verified` |
| 17 | The PR head | `check-catalog`, `check-i18n` and the copy check run | Not a screen | `catalog/base/avatar.yaml` resolves to `base-avatar`; `coverage.md` line 24 reads `draft`; `avatar.noName` is in both locales; no middot or em dash in the new files | `pnpm --filter @orivilo/design-system test` output |
| 18 | The PR head | `recipes.test.ts`, `tokens.test.ts` and `pnpm contrast` run | Not a screen | The `avatar` `fallback` pair passes floor 4.5 under neutral, professional, friendly and orivilo (`CONTRAST_SETS`) in both modes; `generated.css` is not stale | `recipes.test.ts` output proves the pair under neutral, professional and friendly in both modes (its `sets`, lines 21 to 24). Orivilo is not in those `sets`, so its two values rest on the reading at `design.md` line 181, with no test. `pnpm contrast` reads semantic pairs only, so it proves nothing of this pair, and its output is the check that no semantic pair moved. `tokens.test.ts` output shows `generated.css` is not stale |
| 19 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Picture`, `Initials`, `NoName`, `Sizes`, `BesideName`, `AsControl`, `At360`, `RecipesAndModes` | The three steps read as one component; initials sit centred at both sizes; the disc holds on `surface.canvas` and `surface.card` | None | Designer visual sign-off, with the PNG paths of its `checks_run` posted on ORV-224 as a Jira comment, since a sign-off has an empty `write_set` and cannot write `design.md`. The answers to open questions 1, 2, 4, 6 and 7 stay in `docs/specs/ORV-224/design.md` |
| 20 | The PR head | The affected suites run | Every play and test passes | None | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/avatar src/components/button` and `pnpm --filter @orivilo/design-system exec vitest run src/components/avatar src/recipes src/i18n`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |

## Rows that render nothing

- Rows: 13, 14, 15, 16, 17, 18, 20

## Rows per PR

One PR is planned for rows 1 to 20, because a catalog entry, its story and its code land in the same PR. Own estimate: about 430 changed lines (stories 170, component 60, tests 50, recipe 40, helper 30, catalog 30, fixtures 20, the rest 30), near the 400-line guide. The line below is in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`).

- PR 188: rows 1-20

## Out of scope

- Any screen: the Members screen, review comments, an account menu and the `/account` page. Avatar lands in the design system only (`avatar-data-1`).
- The mask helper, the unmask permission and its log line (ORV-113, ADR 0015 decision 8).
- Picture upload, storage, signed URLs and the picture's host. The CSP's `img-src 'self' blob: data:` (`apps/web/security-headers.ts` line 27, report-only by line 14) has no remote host, so the first screen with a remote picture changes that line under `security` review, and sets a `referrerPolicy` if it needs one. Google is the configured sign-in (`packages/auth/src/config.ts` line 38); whether it fills `user.image` with a Google URL was not checked.
- Each item of `avatar-none-1`.
- Sizes above `md`, and `AvatarLabelGroup`, `AvatarProfilePhoto`, `AvatarAddButton`, a company logo avatar, a square form and a `border` option (K-0185, K-0187).
- Removing titles from a name: `initialsOf` reads นาย or คุณ as the first word, so a stored title makes the initial. No fixture or schema field shows titles are stored.
- The Members example on `feature/ORV-37-agent-catalog-exercise`, which is not on this branch. That branch and this one both touch `catalog/coverage.md`, on different lines by this spec's reading of its plan.
- Visual regression baselines (`.claude/rules/testing.md`).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`. A run that differs from the expected output is a finding, reported before code.

W1. The method of `avatar-initials-1`. Input: the fixtures `thaiMarks`, `thaiMarks2`, `longThai`, `mixed`, `latin`, `longLatin` copied from `src/components/fixtures.ts` lines 12 to 19, then the mixed name `Brand แคนวาส`, the name `2026` and three spaces. Expected output, one JSON string per line in this order, no rounding: `"ป"`, `"ล"`, `"บ"`, `"ป"`, `"SC"`, `"A"`, `"B"`, `""`, `""`.

```bash
node -e 'const seg=new Intl.Segmenter("th",{granularity:"grapheme"});const first=w=>[...seg.segment(w)].map(s=>s.segment).find(g=>/\p{L}/u.test(g));const thai=g=>/\p{Script=Thai}/u.test(g);const f=n=>{const ws=n.split(/\s+/).filter(w=>/\p{L}/u.test(w));if(!ws.length)return "";const a=first(ws[0]);if(thai(a))return (ws[0].match(/[ก-ฮ]/)??[""])[0];const b=ws.length>1?first(ws[ws.length-1]):"";return (a+(b&&!thai(b)?b:"")).toUpperCase()};for(const n of ["ปิ่นโต้","โลโก้","บริษัทพัฒนาซอฟต์แวร์เพื่อการออกแบบอัตลักษณ์แบรนด์และผลิตภัณฑ์ดิจิทัลจำกัดมหาชน","โปรเจกต์ Brand Canvas ของทีม","Save changes","Anuphan-and-Plex-mixed-identifier-that-never-breaks-on-its-own-2026","Brand แคนวาส","2026","   "])console.log(JSON.stringify(f(n)))'
```

W2. The pixels of `avatar-size-1` (AC 7, 11). Input: `size.control.sm` and `.md`, `size.icon.sm` and `.md` (`semantic.json` lines 851 to 858 and 875 to 882), which reference `size.8`, `size.10`, `size.icon-4` and `size.icon-5` (`primitives.json` lines 521, 529, 557 and 561). Expected output, px, no rounding: `sm 32px 16px`, then `md 40px 20px`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const px=t=>p.size[t.$value.replace(/[{}]/g,"").split(".")[1]].$value;for(const k of ["sm","md"])console.log(k,px(s.size.control[k]),px(s.size.icon[k]))'
```

W3. The count of AC 12. Input: the three profiles and two modes of `Matrix` (`src/components/matrix.tsx` lines 10, 29 and 30; ids as in ORV-203 AC 12), and the three steps of `avatar-chain-1`. Expected output, no rounding: `6 18`.

```bash
node -e 'const profiles=["neutral","professional","friendly"],modes=["light","dark"],steps=["picture","initials","glyph"];const cells=profiles.length*modes.length;console.log(cells,cells*steps.length)'
```

W4. Why `charAt(0)` and a plain first grapheme fall short (open question 2). Input: `fixtures.thaiMarks2` and `fixtures.thaiMarks`. Expected output, `charAt(0)` then the first grapheme, no rounding: `โ โ`, then `ป ปิ่`. So both give a vowel for a name that opens with one, and the grapheme brings stacked marks into a small disc. The expected grapheme line rests on the current Unicode rule that Thai leading vowels stand alone, which the run confirms.

```bash
node -e 'for(const n of ["โลโก้","ปิ่นโต้"])console.log(n.charAt(0),[...new Intl.Segmenter("th",{granularity:"grapheme"}).segment(n)][0].segment)'
```

## Open questions (with defaults)

Each default is what the Rules above state, so the builder has one reading. The designer answered 1, 2, 4, 6 and 7 in `design.md`, section "Answers to the open questions", and each keeps its default; the owner holds 2 (the Thai reader at sign-off) and 3.

1. Which form a person's picture takes beside a visible name, alone as a control, and alone with no control. Options: (a) the table of `avatar-name-1`; (b) the name in `alt` everywhere, as Untitled's samples: repeated beside the name and lost on a failed load (K-0188, K-0193); (c) a supplementing `alt` beside the name, H2's second branch and WHATWG's other case, which needs a description of the picture that the data does not hold (K-0197, K-0198); (d) a required prop with three values, one per use: the same output with a wider API. Default: (a) (K-0195 to K-0200). The fit of K-0196 to a name is an inference, and no page read speaks of an avatar. Answered: (a), `design.md` answer 1.
2. How Thai initials are made, and whether Thai uses them. Options: (a) the steps of `avatar-initials-1`; (b) the first grapheme, which gives a bare vowel for โลโก้ and brings stacked marks into a small disc (W4, K-0202); (c) two consonants, one from each of the first and last words, such as สจ, which reads as an abbreviation of no name (own reading); (d) no initials for Thai: a Thai name goes straight to the glyph, so Thai people lose a step Latin names keep; (e) the caller writes the initials, as the libraries read do (K-0186, K-0190, K-0192), which repeats the question at each caller. Default: (a). No source supports it (K-0202), and that Thai readers take one consonant as an initial is this role's reading, not evidence, so a Thai reader confirms it at sign-off. Answered for the look: (a), `design.md` answer 2. Open for the owner: the Thai reader at sign-off.
3. How name, initials and image sit with security rule 13. Facts: `user.name` and `user.image` are `personal` (`classification.ts` lines 24, 27); rule 13 masks a `personal` field in UI lists unless the viewer holds the unmask permission; ADR 0015 decision 8 gives masked forms for an email, a phone number and a national id, and none for a name or a picture; the mask helper and the permission are not built (ADR 0015 decisions 8 and 9). Options: (a) `avatar-data-1` as written; (b) a `masked` prop that hides what it was given: the value still reaches the client, against the intent of rule 13; (c) a masked name string such as a first letter and stars, from which Avatar makes an initial: it needs a masked form the ADR does not have. Default: (a), which holds now because this story puts no real data on a screen. Not answered here, and needed before the first real screen: whether names and pictures in Members and review comments are masked from fellow members at all, and what a masked name looks like. That is an owner decision and an ADR 0015 addition, and it may depend on ORV-113.
4. Which sizes the Studio needs. Options: (a) the table of `avatar-size-1`, one size for each need audit D.3 names; (b) shadcn's three, adding a size no story uses (K-0189); (c) Untitled's six and its profile-photo sizes (K-0185). Default: (a). `md` is the 40 px circle ORV-201 already draws (`docs/specs/ORV-201/design.md` line 63). `sm` for a comment row is an assumption, since neither screen exists yet, and the designer confirms it. Answered: (a), `design.md` answer 4, and `sm` stays an assumption until a comment screen exists.
5. Whether group and count ship now. Options: (a) `avatar-none-1` as written; (b) a group with no count; (c) a group and a count, which needs a real total from the caller (K-0185, K-0189). Default: (a): audit D.3 asks for neither, no Members screen exists to need them (K-0203), and AGENTS.md rule 6 adds nothing a story does not need.
6. The fallback while a picture loads. Options: (a) `avatar-chain-1` as written, which can flash the initials on a fast load; (b) a `delayMs`: an empty disc until the timer ends, also after an early failure, and a new time value (K-0192, K-0193). Default: (a). Answered: (a), `design.md` answer 6.
7. The shape under a profile. Options: (a) `avatar-look-1` as written; (b) follow `shape.control.radius`, so a profile with square controls squares the faces and the loading circle no longer matches; (c) Untitled's `rounded` prop (K-0185). Default: (a). Answered: (a), `design.md` answer 7.

## Depends on

- `docs/knowledge/design/K-0185` to `K-0203` (benchmark and standards, 2026-11-06).
- `docs/specs/ORV-64/audit.md` section B (table form), section A.1 line 50, section D.3 row 21 (the story and its done-when).
- `DESIGN.md` section 3.3, section 4, section 6 (icons), section 7, section 8, section 9, section 10, section 11.
- `.claude/rules/design-system.md` ("Components", "Tokens and layers"); `.claude/rules/security.md` rules 5, 8, 11 and 13.
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates), ADR 0015 decisions 8 and 9.
- ORV-137 comment 10247 (the benchmark table in POC mode), as stated in `.claude/rules/design-system.md` and `docs/specs/ORV-137/spec.md` row 4; ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms).
- ORV-113 (mask helper, unmask permission), for the first real screen and not for this story.
- `docs/specs/ORV-203/spec.md` (the spec shape), `docs/specs/ORV-201/spec.md` (Skeleton's `circle`).

## Changelog

- v1.0 (2026-11-06): first version, from K-0185 to K-0203 and audit D.3 row 21. The Jira issue was not read (no Jira tool in this role). Downstream to review: the designer envelope (`design.md`, open questions 1, 2, 4, 6, 7, and `type.label.sm` at `sm` against AC 7), the owner (open questions 2 and 3), the builder envelope (rows 1 to 20, one PR), the qa envelope (the Rows per PR line once the PR exists), and `catalog/coverage.md`.
- v1.1 (2026-11-06): the six amendments of `design.md`, accepted under delegation (ORV-224 comment 10521): `avatar-look-1`, `avatar-size-1`, the contract rows Component tokens and Recipe classes, and AC 2, 7, 9 and 11; AC 11 proves the name by visible overflow and `expectLinesClear` in place of amendment 4's clipping frame; open questions 1, 2, 4, 6 and 7 answered, the Thai reader of question 2 open for the owner. Downstream to review: `design.md` (amendment 4 on AC 11, the `spec:` line), the builder envelope (`component.json`, `recipes.css`, rows 2, 7, 9, 11), the qa envelope (the same rows), the owner (open questions 2 and 3).
- v1.2 (2026-11-06): from the deviations of ORV-224-build-1 (L-0025). AC 18: `recipes.test.ts` proves the `avatar` `fallback` pair and `pnpm contrast` checks that no semantic pair moved, and the sets are listed, with orivilo resting on the `design.md` reading since `recipes.test.ts` does not read it. AC 19: the sign-off's PNG paths go on the issue as a Jira comment. Rows per PR: the line for PR 188. `avatar-initials-1` clause 1: no separate trim. Downstream to review: `design.md` (the `spec:` line), the designer sign-off envelope (row 19), the qa envelope (rows 18 and 19 and the PR line), the main session (the Jira comment of row 19, and whether `recipes.test.ts` reads orivilo). The builder has nothing to change for clause 1: `initials.ts` line 24 already has this form.
