---
issue: ORV-39 (draft key E2-16; https://tpetkaew.atlassian.net/browse/ORV-39)
lane: L (component public API: every component that shows text, the graph label helpers, the board props)
version: 1
---

## Why

Every string the design system shows today is Thai and lives inside the component that shows it (about 150 sites across 20 files, plus the three pages of `apps/web`). The owner's rule (2026-10-22): the structure supports several languages, Thai and English first, more later. Without one place for copy, a second language means touching every component, the copy check cannot see a hard-coded string, and a later story (the Inspector, the chat, the task bar) would add more Thai in place. This story moves every UI string into a message catalog, puts the locale on a provider the app and Storybook both set, and adds a guard that fails the build on a hard-coded string, so the next UI story writes its copy in the catalog from day one.

## Story

As the Studio implementer, I want every UI string of the design system and the web app to come from a locale catalog with Thai and English, switchable at runtime by the app and by the Storybook toolbar, so that a Thai user and an English user see the same product in their language, a third language is one catalog file, and no component ever carries copy again.

## Rules and bounds

- **One catalog per package.** `packages/design-system/src/i18n/messages/th.ts` is the source of truth and defines the type `Messages`; `en.ts` is typed against it, so a missing key is a type error. `apps/web/i18n/messages.ts` holds the web app's own copy the same way. A third locale is one more file in each place plus one entry in `LOCALES`.
- **The locale is context, not a prop.** `LocaleProvider` (client) carries `locale`; `useLocale()`, `useMessages()` and `useWord()` read it. Outside any provider the default is Thai, so an existing story or page keeps working. Pure modules (`graph.ts`, `Kbd`'s `shortcutWords`) take a `locale` argument with the same default and read the catalog through `messagesFor(locale)` without React.
- **Placeholders are named.** A message with a value spells it as `{name}`; `fill(template, params)` replaces every placeholder and throws on one it was not given, so a missing value fails a test instead of showing braces to a user.
- **Pairs stay pairs.** `CANVAS_WORDS`, command labels and profile names already carry `{ th, en }`; they stay, and a component picks the word for the current locale with `useWord()` or `pick(words, locale)`. The registry's `label` shape does not change.
- **Numbers and order follow the locale.** `formatNumber`, `formatPercent` and `collatorFor` in `src/i18n/format.ts` wrap `Intl` with the locale's tag; the Table sorts with `collatorFor(locale)`.
- **Defaults come from the catalog.** A prop such as `closeLabel`, `loadingLabel`, `placeholder`, `emptyText`, `missingLabel` keeps its name and stays optional; its default is the catalog word for the current locale, not a literal.
- **The guard is strict.** `tests/check-i18n.test.ts` fails on any Thai character in `src/components`, `src/boundary`, `src/commands/index.ts`, `src/i18n/*.tsx` and `apps/web/app`, comments included (a comment that needs a Thai word quotes the catalog key instead). Stories, tests, fixtures, the story shell and `src/examples` are demo content and are excluded (see Out of scope). The guard also fails when `th` and `en` differ in key paths, when a leaf is empty, or when the placeholder sets of a key differ.
- **The app chooses the locale server-side.** `apps/web` reads the `orv-locale` cookie (default `th`) in the root layout, sets `<html lang>` and the provider, and offers a switch that posts a server action setting the cookie; no client state, no flash. A URL prefix per locale is a later story (routing is E4-0's shell).
- **Honest UI.** The switch shows the two locales that exist; the home page's status list says the Thai-only example screens are fixture pages. No translation is machine-made at runtime; every English string is written in the catalog.
- **Copy rules per locale.** The middot and em dash check already scans `src`, so both catalogs are covered. English copy follows the same voice as DESIGN.md §10: plain words, no jargon the user did not type, sentence case.

## Design (G2, walked by the implementer under the owner's 2026-10-22 policy)

```
packages/design-system/src/i18n/
  locale.ts          LOCALES, Locale, DEFAULT_LOCALE, LOCALE_TAGS, isLocale, Localized<T>, pick
  messages/th.ts     the catalog (type Messages = typeof th), grouped by component
  messages/en.ts     const en: Messages
  messages/index.ts  messagesFor(locale), fill(template, params)      (no React)
  format.ts          formatNumber, formatPercent, collatorFor          (no React)
  LocaleProvider.tsx "use client": LocaleProvider, useLocale, useMessages, useWord
  index.ts           barrel; src/index.ts re-exports it
apps/web/i18n/
  messages.ts        th and en for the home page, the layout and the workspace metadata
  locale.ts          getLocale() from the cookie (server only)
  actions.ts         "use server" setLocale(formData)
  LocaleSwitch.tsx   a form with one button per locale, aria-pressed on the current one
```

Catalog groups: `button`, `dialog`, `select`, `table`, `kbd`, `sheet`, `commandMenu`, `contextMenu`, `controls`, `nodeToolbar`, `node`, `port`, `group`, `minimap`, `graph`, `board`. The board group holds the live-region messages, the React Flow `ariaLabelConfig` strings and the direction and alignment words; the board builds the `ariaLabelConfig` object from the catalog in a `useMemo` keyed by locale.

Storybook: a `locale` toolbar global (globe icon, Thai and English) and a decorator that wraps every story in `LocaleProvider` and sets `document.documentElement.lang`. Three `English` stories with play tests (CanvasBoard, CommandMenu, Table) prove the switch reaches a live region, a dialog and a sort announcement; every existing play test keeps asserting Thai under the default.

## Acceptance criteria

| #   | Given                                                                  | When                                                                                           | Then                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | the package                                                            | it is imported                                                                                 | `LocaleProvider`, `useLocale`, `useMessages`, `useWord`, `LOCALES`, `DEFAULT_LOCALE`, `messagesFor`, `fill`, `pick`, `formatNumber`, `formatPercent`, `collatorFor` are exported |
| 2   | `en.ts`                                                                | a key of `th.ts` is missing or extra                                                           | `pnpm typecheck` fails                                                                                                                                                           |
| 3   | the catalogs                                                           | a key differs in placeholders, or a leaf is empty                                              | `check-i18n.test.ts` fails and names the key                                                                                                                                     |
| 4   | a component, the boundary, `commands/index.ts` or `apps/web/app`       | it contains a Thai character outside the catalog                                               | `check-i18n.test.ts` fails and names the file and line                                                                                                                           |
| 5   | `fill("{n} node", {})`                                                 | called                                                                                         | it throws naming `n`; `fill("{n} node", { n: 3 })` is `"3 node"`                                                                                                                 |
| 6   | any story                                                              | the toolbar locale is English                                                                  | every label, placeholder, status message and accessible name on screen is English; Thai under Thai                                                                               |
| 7   | the board under English                                                | a command runs (zoom, group, delete, connect)                                                  | the live region announces the English message; node and edge accessible names are English                                                                                        |
| 8   | the command menu, context menu, controls, toolbar, sheet under English | opened                                                                                         | command labels show the registry's `en` label; scope headings and the sheet's title, description and "arrives in" line are English                                               |
| 9   | the Table under English                                                | a column is sorted, rows are empty, loading, missing                                           | the announcement, the empty title, the loading label and the missing cell are English and the sort uses the English collator                                                     |
| 10  | `graph.ts`                                                             | `nodeLabel`, `edgeLabel`, `connectionProblem` are called with `"en"`                           | they return English; without a locale they return Thai (existing tests unchanged)                                                                                                |
| 11  | `apps/web`                                                             | no cookie                                                                                      | the page is Thai with `<html lang="th">`; the switch marks Thai as current                                                                                                       |
| 12  | `apps/web`                                                             | the English button is pressed                                                                  | the cookie `orv-locale=en` is set, the page re-renders in English with `<html lang="en">`, the title and description metadata are English, the switch marks English              |
| 13  | the home page                                                          | rendered in either locale                                                                      | the status list says the example screens at /workspace are Thai fixture pages until the Studio shell (E4-0, E4-8) replaces them                                                  |
| 14  | the repo                                                               | `pnpm format:check && pnpm lint && pnpm typecheck && pnpm contrast && pnpm test && pnpm build` | all pass; the Storybook build and the Next build succeed                                                                                                                         |
| 15  | DESIGN.md and AGENTS.md                                                | read                                                                                           | DESIGN.md v1.15 §10 states the catalog rule and §12 lists the locale structure as real; AGENTS.md's design-system rules carry the one-line rule                                  |

## Impact (public API, AGENTS.md rule 2)

- New module `src/i18n` and its exports (AC 1). `Kbd` becomes a client component. `shortcutWords(shortcut, apple, locale)` gains a third argument. `nodeLabel`, `edgeLabel`, `edgeStateWord`, `connectionProblem` gain a trailing `locale` argument with default `th`. `addNoteNext` takes its title from the caller (the board passes the catalog word).
- No prop is removed or renamed; the defaults of `closeLabel`, `loadingLabel`, `placeholder`, `emptyText`, `missingLabel`, `loadingLabel` (Table) move to the catalog.
- No token, recipe or catalog entry changes. No new dependency.
- `apps/web`: the root layout becomes dynamic (reads a cookie); a `LocaleSwitch` appears in a small header above every page.

## Out of scope

- `src/examples` (settings form, decision record, landing, workspace) stay Thai fixture pages and are excluded from the guard; E4-8 replaces /workspace with the real shell and the fixtures go with it. The home page says so (AC 13).
- Locale-prefixed routes, locale detection from `Accept-Language`, right-to-left scripts, pluralisation rules beyond `{count}` substitution, dates (no component shows a date yet; `format.ts` grows when one does).
- Translating catalog YAML descriptions and the Foundations spec sheet (documentation, not UI).

## Depends on

E4-3 (ORV-43). Unblocks E4-4 (ORV-44) and every later UI story.

## Changelog

- v1 (2026-10-22): written after the owner's rule "โครงสร้างรองรับหลายภาษานะครับ"; G1 and G2 walked by the implementer under the owner's policy of the same day (the owner reviews at G5), packets posted on ORV-39.
