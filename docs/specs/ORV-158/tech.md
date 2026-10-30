---
issue: ORV-158 (https://tpetkaew.atlassian.net/browse/ORV-158)
spec: docs/specs/ORV-158/spec.md v1.0
task: ORV-158-tech-1
author: ds-architect
date: 2026-10-30
---

# ORV-158 tech notes: the field classification map

These notes turn the spec's "Rules and bounds" into files, code, tests and a build order. They use the spec's rule names (`orv158-closed`, `orv158-keys`, `orv158-basis`, `orv158-tags`, `orv158-type`, `orv158-walk`, `orv158-pins`, `orv158-export`, `orv158-rebase`, `orv158-no-migration`) and do not restate their tables or clause texts; a change to a rule is made in the spec first. "Row n" is a row of the spec's "Acceptance criteria".

Sources read, as they read in this checkout at `eeb2e71`: the spec; ADR 0015 decision 9 (lines 139 to 145) and "Not done yet" (lines 180 to 191); `.claude/rules/security.md` rule 11 (line 26); `.claude/rules/testing.md` (lines 11, 16, 18 to 29 and 32 to 34); `packages/db/src/schema/index.ts` (4 lines), `auth.ts`, `direction.ts`, `workspace.ts`, `rate-limit.ts`; `packages/db/src/index.ts` (5 lines), `client.ts` line 5, `env.ts`, `boundary.test.ts` line 3; `packages/db/tsconfig.json`, `package.json`, `drizzle.config.ts`, `vitest.config.ts`, `eslint.config.mjs`; `tsconfig.base.json`; `.prettierrc.json`; drizzle-orm 0.45.4 declarations (`utils.d.ts` line 37 `getTableColumns<T extends Table>(table: T): T['_']['columns']`, `entity.d.ts` line 7 `is`, `pg-core/table.d.ts` line 15 `class PgTable<T extends TableConfig = TableConfig>`).

**What was run for this design.** A prototype in a scratch directory outside the repo, against this checkout's schema barrel, with `packages/db`'s TypeScript 6.0.3, its ESLint config (through `--stdin-filename src/schema/...`) and the root `.prettierrc.json`. The prototype held §2's type and the full map of `orv158-tags` and §3's fixture file verbatim. Results quoted below are from those runs; nothing was written under `packages/`. The builder repeats each run in the tree (§7, §8).

## 1. Decisions in short

### Open questions

Open question 1 is taken at its default (a) by the main session: the typed value is one of the four tags of `orv158-closed`, and each line's basis comment of `orv158-basis` carries the parent category (the last column of that rule's table). No second typed field, no change to `.claude/rules/security.md` rule 11. Questions 2 to 8 are taken at their defaults under the owner's delegation (ADR 0012 decision 4), as the spec's "Gates" says.

### Design decisions

<!-- prettier-ignore -->
| # | Decision | Section | Confirmation |
| --- | --- | --- | --- |
| D1 | `Classification` is derived from the barrel's own type through a type-only namespace import (`import type * as barrel from "./index.ts"`), filtered to the keys whose value extends `PgTable`, with columns from `["_"]["columns"]`. No table is listed by hand in the type | §2 | Prototype: tsc exit 0 on the full map; T4 and T5 fixtures fail; row 8's `phone` fails |
| D2 | The five fixtures live in one file, `packages/db/src/schema/classification.fixtures.ts`. Each `// @ts-expect-error` sits on the line above the defect's own property (T1, T2, T3, T5) or above a one-line statement (T4), so prettier never moves the error off the directive's next line | §3 | Prototype: prettier check passes; each mutation gives TS2578 at its own directive and no other |
| D3 | The walk is one function in `classification.test.ts`, not exported. `classification.ts` holds only `TAGS`, `Tag`, `Classification` and `CLASSIFICATION`, so the root's export surface stays the three names of `orv158-export` | §4, §6 | Row 17 test; `git diff` on `package.json` empty |
| D4 | The test reads `CLASSIFICATION`, `TAGS` and `Tag` through the package root (`../index.ts`), so the test itself is the module of row 17 whose import must compile | §5, §6 | Removing the root export line fails typecheck (TS2305) and the test |
| D5 | "Pins the secret and personal columns" also asserts the `public` set is empty (`orv158-closed`: no column is `public`). With the secret and personal sets pinned and every value a member of `TAGS`, that makes every other column `internal`, which is row 1's "no more and no fewer" for tags | §5 | Mutation: retag `rateLimitCounter.count` `public`, red |

## 2. `packages/db/src/schema/classification.ts`

### Place and imports

At the path ADR 0015 decision 9 names. It imports only types at the top: `PgTable` from `drizzle-orm/pg-core` and the schema barrel as a type namespace. `verbatimModuleSyntax` (`tsconfig.base.json`) erases both imports, so the file has no runtime import of the barrel and no cycle, whatever `orv158-export` later allows. The barrel (`schema/index.ts`) does not re-export this file (`orv158-export`).

### Surface

```ts
// The classification of every column of the schema (ADR 0015 decision 9, ORV-158).
// Each entry line ends with its basis (`orv158-basis` in docs/specs/ORV-158/spec.md).
import type { PgTable } from "drizzle-orm/pg-core";
import type * as barrel from "./index.ts";

/** The closed tag list, in decision 9's order. */
export const TAGS = ["public", "internal", "personal", "secret"] as const;
export type Tag = (typeof TAGS)[number];

type Barrel = typeof barrel;
/** The barrel's exports that are tables; relations objects and `TENANT_TABLES` drop out. */
type TableName = { [K in keyof Barrel]: Barrel[K] extends PgTable ? K : never }[keyof Barrel];
/** A table's column property names, the keys `getTableColumns` returns. */
type ColumnName<T extends TableName> = keyof Barrel[T]["_"]["columns"];

/** One required key per table, one required key per column, each a `Tag`. */
export type Classification = {
  readonly [T in TableName]: { readonly [C in ColumnName<T>]: Tag };
};

export const CLASSIFICATION = {
  // ... 11 tables, see below
  rateLimitCounter: {
    key: "personal", // hashed-subject
    windowStart: "internal", // record
    windowEnd: "internal", // record
    count: "internal", // record
  },
} as const satisfies Classification;
```

### The entry lines

- Tables in the barrel's order (`auth.ts` then `workspace.ts`, `direction.ts`, `rate-limit.ts`, as `schema/index.ts` lines 1 to 4 list them), which is also the order of the table in `orv158-tags`. Columns in the order of each table's builder object. Keys by `orv158-keys`.
- Each column is one line, `<key>: "<tag>", // <basis>`, with the tag and basis of its row in `orv158-tags`. Prettier keeps the trailing comma and the comment on that line (prototype: prettier check passes on the full map). No other line in the file ends with a basis id after `", // `, so the `orv158-basis` grep counts columns only.
- Table lines (`  user: {` and `  },`) carry no comment. The notes of `orv158-tags` (for example why `organization.name` is `personal`) stay in the spec; the code does not copy them.
- Prototype on the full map at `eeb2e71`: `tsc` exit 0, and the `orv158-basis` grep gives `80`.

### Which part of the type gives each clause

The clause texts are in `orv158-type`. Error codes are those the prototype printed with the directives removed.

<!-- prettier-ignore -->
| Clause | Part of the type that catches it | Error seen | Mutation that weakens it (one per clause) |
| --- | --- | --- | --- |
| T1 | The column key is required: `[C in ColumnName<T>]: Tag` | TS2741 "Property 'count' is missing" | `[C in ColumnName<T>]?: Tag` (column key optional) |
| T2 | `satisfies` checks excess properties of the fresh literal against the closed column keys | TS2353 "'hits' does not exist" | `{ readonly [C in ColumnName<T>]: Tag } & Readonly<Record<string, Tag>>` (an index signature opens the column keys) |
| T3 | The value type is `Tag` | TS2322 "Type '\"confidential\"' is not assignable" | `[C in ColumnName<T>]: string` (value widened) |
| T4 | The table key is required: `[T in TableName]: ...` | TS1360 "Property 'rateLimitCounter' is missing" | `[T in TableName]?: ...` (table key optional) |
| T5 | `satisfies` checks excess properties against the closed table keys | TS2353 "'ghost' does not exist in type 'Classification'" | `Classification = { ... } & Readonly<Record<string, unknown>>` (an index signature opens the table keys) |

Each mutation was applied alone to the prototype's type: `tsc` then printed exactly one error, TS2578 "Unused '@ts-expect-error' directive", at that clause's directive line, and the real map still compiled. Restored, `tsc` exit 0.

**Row 8 (a regeneration that adds a column).** On a copy of the schema with `phone: text("phone"),` added after `image` in `user`, the prototype printed `classification.ts(16,3): error TS2741: Property 'phone' is missing in type '{ readonly id: "personal"; ...` at the `user: {` line of the map: the error names `phone`, in `classification.ts`. A dropped column is T2 on the real map in the same way.

## 3. The type fixtures: `packages/db/src/schema/classification.fixtures.ts`

Under `src`, so `packages/db/tsconfig.json` (`"include": ["src", "*.config.ts"]`) and `pnpm typecheck` check it. Not a `*.test.ts` file, so `vitest run` does not collect it; nothing imports it. ESLint lints it with the package config (prototype: exit 0); `@ts-expect-error` with a description is already used in the package (`boundary.test.ts` line 3), and no script in `scripts/` or `.github/` bans it.

The file, verbatim (the prototype's file; line numbers below are its lines):

```ts
// Type fixtures for `orv158-type` (ORV-158): each value has one defect, and its directive fails
// `pnpm typecheck` as unused (TS2578) if the type stops catching that defect. Never imported.
import { CLASSIFICATION as C, type Classification } from "./classification.ts";

/** A copy without one key, typed as such. */
const omit = <T extends object, K extends keyof T>(value: T, key: K) =>
  Object.fromEntries(Object.entries(value).filter(([name]) => name !== key)) as Omit<T, K>;

export const t1 = {
  ...C,
  // @ts-expect-error T1: a column of a table has no entry
  rateLimitCounter: omit(C.rateLimitCounter, "count"),
} satisfies Classification;

export const t2 = {
  ...C,
  rateLimitCounter: {
    ...C.rateLimitCounter,
    // @ts-expect-error T2: an entry names a column the table does not have
    hits: "internal",
  },
} satisfies Classification;

export const t3 = {
  ...C,
  rateLimitCounter: {
    ...C.rateLimitCounter,
    // @ts-expect-error T3: an entry's value is not in the closed tag list
    count: "confidential",
  },
} satisfies Classification;

// @ts-expect-error T4: a table exported by the barrel has no entry
export const t4 = omit(C, "rateLimitCounter") satisfies Classification;

export const t5 = {
  ...C,
  // @ts-expect-error T5: an entry names a table the barrel does not export
  ghost: { id: "internal" },
} satisfies Classification;
```

Why this shape:

- **Directive on the defect.** An error must start on the line after its directive. Prettier (`printWidth` 100) breaks a long one-line literal, which would move a T2, T3 or T5 error to a later line. The directive above the defective property keeps the pair together under any wrapping.
- **Fresh literals for T2 and T5.** Excess property checks apply only to an object literal written in place, so the extra key is written inside the literal, never through a `const` built first.
- **`omit` for T1 and T4.** A destructured, unused binding fails `@typescript-eslint/no-unused-vars` (prototype: two errors), so the copy without a key comes from a typed helper. The cast is in the fixture only.
- **The exports.** `t1` to `t5` are exported so no statement is an unused expression; nothing imports them.

<!-- prettier-ignore -->
| Clause | Directive line | Mutation (in `classification.ts`) | Red seen in the prototype |
| --- | --- | --- | --- |
| T1 | 11 | Column key optional (§2 table) | `classification.fixtures.ts(11,3): error TS2578` |
| T2 | 19 | Column index signature (§2 table) | `(19,5): error TS2578` |
| T3 | 28 | Value widened to `string` | `(28,5): error TS2578` |
| T4 | 33 | Table key optional | `(33,1): error TS2578` |
| T5 | 38 | Table index signature | `(38,3): error TS2578` |

If the builder's file differs from this one, the `verified` rows quote the builder's line numbers, not these.

## 4. The walk (`orv158-walk`)

### Where it lives

In `packages/db/src/schema/classification.test.ts`, as two module-level functions that the file does not export (D3). The file imports the schema barrel (`import * as schema from "./index.ts"`), `getTableColumns` and `is` from `drizzle-orm`, `PgTable` (and, for fixture tables, `pgTable` and `text`) from `drizzle-orm/pg-core`, and `CLASSIFICATION`, `TAGS`, `type Tag` from `../index.ts` (D4). No database, no environment variable.

### Signature

```ts
/** Export name to column property names, for the exports that are tables. */
type Columns = Readonly<Record<string, readonly string[]>>;
/** Table to column to value; values are plain strings so a W5 input needs no cast. */
type Entries = Readonly<Record<string, Readonly<Record<string, string>>>>;

function tablesOf(module: Readonly<Record<string, unknown>>): Columns;
/** `orv158-walk`: one problem per defect, `W<n> <table>` or `W<n> <table>.<column>`. */
function classificationProblems(tables: Columns, map: Entries, tags: readonly string[]): string[];
```

### Body

```ts
function tablesOf(module: Readonly<Record<string, unknown>>): Columns {
  return Object.fromEntries(
    Object.entries(module)
      .filter((entry): entry is [string, PgTable] => is(entry[1], PgTable))
      .map(([name, table]) => [name, Object.keys(getTableColumns(table))]),
  );
}

function classificationProblems(tables: Columns, map: Entries, tags: readonly string[]) {
  const problems: string[] = [];
  for (const table of Object.keys(tables)) if (!(table in map)) problems.push(`W1 ${table}`);
  for (const table of Object.keys(map)) if (!(table in tables)) problems.push(`W2 ${table}`);
  for (const [table, columns] of Object.entries(tables)) {
    const entries = map[table];
    if (entries === undefined) continue;
    for (const column of columns) if (!(column in entries)) problems.push(`W3 ${table}.${column}`);
    for (const [column, tag] of Object.entries(entries)) {
      if (!columns.includes(column)) problems.push(`W4 ${table}.${column}`);
      else if (!tags.includes(tag)) problems.push(`W5 ${table}.${column}`);
    }
  }
  return problems;
}
```

This is the logic of the spec's worked example "The walk", which the main session ran (real `[]`, then exactly one problem per clause). Prototype at runtime on this checkout: the barrel has 18 exports; `is(value, PgTable)` keeps 11 with 80 columns; the 7 dropped are `TENANT_TABLES` and the 6 relations objects.

### Fixture inputs and mutations (rows 10 to 14)

Each case starts from the real `rateLimitCounter`: `tables = tablesOf({ rateLimitCounter: schema.rateLimitCounter })` and `entries = CLASSIFICATION.rateLimitCounter`, and adds one defect. Expected lists are exact (`toEqual`).

<!-- prettier-ignore -->
| Clause | Input | Expected | Mutation (in the walk) | Red |
| --- | --- | --- | --- | --- |
| W1 | `tablesOf({ rateLimitCounter, ghostTable: pgTable("ghost_table", { id: text("id") }) })` with the real entries | `["W1 ghostTable"]` | Delete the W1 `push` | W1 case gets `[]` |
| W2 | Real tables; map `{ rateLimitCounter: entries, ghostEntry: { id: "internal" } }` | `["W2 ghostEntry"]` | Delete the W2 `push` | W2 case gets `[]` |
| W3 | Real tables; `rateLimitCounter` entries without `count` | `["W3 rateLimitCounter.count"]` | Delete the W3 `push` | W3 case gets `[]` |
| W4 | Real tables; entries plus `hits: "internal"` | `["W4 rateLimitCounter.hits"]` | Delete the W4 `push` | W4 case gets `[]` |
| W5 | Real tables; entries with `count: "confidential"` | `["W5 rateLimitCounter.count"]` | Delete the W5 `push` | W5 case gets `[]` |

The W1 input goes through `tablesOf` with a real `pgTable`, so the case also proves an in-test table passes the `is` filter. Row 1's filter mutation: replace `is(entry[1], PgTable)` with `true`; `getTableColumns` on a relations object returns `undefined` and `Object.keys` throws, so "every exported table and column has one tag" goes red.

## 5. The rest of `classification.test.ts`

<!-- prettier-ignore -->
| Test name | Row | Asserts | Mutation, red, restored |
| --- | --- | --- | --- |
| "every exported table and column has one tag" | 1 | `classificationProblems(tablesOf(schema), CLASSIFICATION, TAGS)` equals `[]` | Drop the `is` filter (§4) |
| W1 to W5, one case each (`it.each` over §4's table is allowed) | 10 to 14 | §4 | §4 |
| "the tag list is the closed list" | 15 | `TAGS` equals `["public", "internal", "personal", "secret"]` | Add `"restricted"` to `TAGS`. Not `"confidential"`: that would also make the T3 fixture compile, two reds for one mutation |
| "pins the secret and personal columns" | 16 | The sorted `table.column` keys tagged `secret` equal the 6 of `orv158-tags`; those tagged `personal` equal its 20; those tagged `public` equal `[]` (D5). Each list is written out in the test, not derived | `session.token` to `internal`, red; `account.accountId` to `internal`, red; `rateLimitCounter.count` to `public`, red |
| "keeps decision 9's examples" | 16 | The seven keys of `orv158-pins`' second sentence, each with its tag, one `expect` each | `session.token` to `internal`, red here and in the pins test. No map mutation reddens this test alone, as its keys are a subset of the pins; it guards decision 9's examples if a later edit changes a pin list and the map together |
| "the schema barrel does not carry the map" | 17 | `Object.keys(schema)` contains neither `CLASSIFICATION` nor `TAGS` | Add `export * from "./classification.ts";` to `schema/index.ts`, red (typecheck may also fail on the cycle; the test is the check) |

Rules for the file:

- No line of the file may contain `runIf` or `TEST_DATABASE_URL`, comments included: row 9 counts them with `grep -c` and expects 0 each.
- The `Tag` import is used (for example `const secret: Tag = "secret"` in the pins test), so the type half of row 17 is a real use, not an unused import.
- Wall-clock: every test is a pure in-memory comparison; no heavy input, no `HEAVY_TIMEOUT` (`.claude/rules/testing.md` lines 18 to 29). The builder still runs `pnpm --filter @orivilo/db exec vitest run --testTimeout=400 src/schema/classification.test.ts` and quotes the count.

## 6. The export line (`orv158-export`)

`packages/db/src/index.ts` gains one line after line 2:

```ts
export { CLASSIFICATION, TAGS, type Tag } from "./schema/classification.ts";
```

The inline `type` modifier is allowed under `verbatimModuleSyntax`. Unchanged: `schema/index.ts`, `client.ts` (its `import * as schema from "./schema/index.ts"`, line 5, stays tables and relations), `drizzle.config.ts` (`schema: "./src/schema/index.ts"`), `package.json` `exports`. The `Classification` type is not exported from the root; the masking item adds it if it needs it.

Mutation for row 17's root half: delete the line; `tsc` fails in `classification.test.ts` with TS2305 (no exported member), and the test file fails to load. Restored, green.

## 7. Tests by acceptance row

<!-- prettier-ignore -->
| Row | Proof | Where |
| --- | --- | --- |
| 1 | "every exported table and column has one tag"; `pnpm --filter @orivilo/db typecheck` and `test` pass | §5 |
| 2 | The `orv158-basis` grep on the built file: `80` at `eeb2e71`, `88` after `orv158-rebase` | §2 |
| 3 to 7 | The T1 to T5 fixtures; one `verified` row per clause with the mutation and the TS2578 line | §3 |
| 8 | Scratch `phone: text("phone"),` in `user` of `auth.ts`; `tsc` error TS2741 in `classification.ts` naming `phone`; restored | §2 |
| 9 | `pnpm --filter @orivilo/db exec vitest run src/schema/classification.test.ts` with `TEST_DATABASE_URL` unset: summary line, no skipped; both `grep -c` give 0 | §5 |
| 10 to 14 | The W1 to W5 cases and their mutations | §4 |
| 15 | "the tag list is the closed list" | §5 |
| 16 | "pins the secret and personal columns", "keeps decision 9's examples" | §5 |
| 17 | "the schema barrel does not carry the map"; the test's root import compiles; `git diff --stat origin/develop... -- packages/db/src/client.ts packages/db/drizzle.config.ts packages/db/src/schema/index.ts packages/db/package.json` empty | §5, §6 |
| 18 | `orv158-rebase`: the second PR's `pnpm typecheck` and test run, quoted in its G3 packet | §8, B1 note |
| 19 | The `git diff --stat` of row 19 empty; `pnpm --filter @orivilo/db generate` writes no file | §8, B4 |
| 20 | `pnpm quality-gate` on a clean tree with `TEST_DATABASE_URL` and `REQUIRE_DB_TESTS=1` exported, in the foreground; the gate record quoted | §8, B4 |
| 21 | `grep -n '^Addition, .*(ORV-158)' docs/adr/0015-standards-and-required-controls.md` gives two lines | §8, B4 |

## 8. Build order

One code PR into `develop` (the spec's "Impact list", Slices (2)), branch `feature/ORV-158-field-classification`, built in four builder tasks, one deliverable each, in this order. Each task runs only its affected checks (`.claude/rules/testing.md` line 16); B4 runs the full gate once.

<!-- prettier-ignore -->
| Task | Deliverable | Done when |
| --- | --- | --- |
| B1 | `classification.ts` (§2) with the 80 entry lines of `orv158-tags`, and the export line in `src/index.ts` (§6) | `pnpm --filter @orivilo/db typecheck` passes; the `orv158-basis` grep gives 80; row 8's scratch `phone` red then restored, one `verified` row with the error line. If PR 141 has merged into `develop` first, rebase before B1 and write 88 lines with the 8 `aiUsage` entries (`orv158-rebase`); the grep then gives 88 |
| B2 | `classification.fixtures.ts` (§3) | Typecheck passes; T1 to T5 each mutated alone, TS2578 at its own directive, restored; five `verified` rows (rows 3 to 7) |
| B3 | `classification.test.ts` (§4, §5) | `vitest run src/schema/classification.test.ts` passes with no skip and `TEST_DATABASE_URL` unset (row 9); every mutation of §4 and §5 seen red and restored, one `verified` row each; the 400 ms run's count |
| B4 | The docs of the spec's "Impact list", "Docs" (below), then the gate | Row 21's grep gives 2; row 19's diff empty and `generate` writes nothing; `pnpm quality-gate` passes in the foreground on a clean tree (row 20); `pnpm lint && pnpm typecheck && pnpm test && pnpm build` output quoted |

B4's documents, each a dated paragraph, never a rewrite:

- ADR 0015, after line 145 (decision 9's Confirmation): `Addition, <date> (ORV-158).` The map exists at `packages/db/src/schema/classification.ts`; the type fixtures in `classification.fixtures.ts` make `pnpm typecheck` fail on each of the five defects of `orv158-type`, and `classification.test.ts` walks every exported table with `getTableColumns` and pins the `secret` and `personal` columns. The Confirmation line above stays as the record.
- ADR 0015 "Not done yet", after the list (after line 191 at `eeb2e71`; re-read the merged file first, as the spec's "Impact list" says for ORV-144 and PR 141): `Addition, <date> (ORV-158).` Classification tags now have code and checks (decision 9); the bullet's other items keep the state the merged file gives them.
- `docs/specs/ORV-112/tech.md` line 149: a dated note after the paragraph that ORV-158 tagged `key` `personal` and the other three columns `internal`, as that line asked.
- ORV-121's notes (on PR 141's branch): only by `orv158-rebase`, in the PR that lands second.

## 9. Size

<!-- prettier-ignore -->
| File | Lines (prototype or estimate) |
| --- | --- |
| `classification.ts` | 118 in the prototype at 80 entries; about 130 with doc comments and the 8 `aiUsage` lines and their 2 table lines |
| `classification.fixtures.ts` | 40 (§3 verbatim) |
| `classification.test.ts` | about 130 (the spec's estimate; the pin lists are 26 lines of it) |
| `src/index.ts` and the B4 documents | about 10 |
| Total | about 310 |

About 310 changed lines with tests, under the 400 line mark. The spec's "The size" counts 12 table lines for `classification.ts`; each table has an opening and a closing line, 24 at 12 tables, so that file is about 130, not 120. The total stays "about 300" in the spec's sense; see "Findings for the spec".

## 10. Impact list

As the spec's "Impact list", with the fixture file now named:

- **New:** `packages/db/src/schema/classification.ts` (`TAGS`, `Tag`, `Classification`, `CLASSIFICATION`), `classification.fixtures.ts` (T1 to T5), `classification.test.ts` (the walk, W1 to W5, the closed list, the pins, the barrel check).
- **Changed:** `packages/db/src/index.ts`, one line. ADR 0015, two Additions. `docs/specs/ORV-112/tech.md`, one dated note.
- **Unchanged:** `schema/index.ts`, `auth.ts`, `workspace.ts`, `direction.ts`, `rate-limit.ts`, `client.ts`, `drizzle.config.ts`, `package.json`, `packages/db/migrations/**` (`orv158-no-migration`). No table, column, SQL or data change.
- **Consumers:** none in code yet. The masking item (ADR 0015 decision 8) and the log and prompt rules (decisions 6 and 3) read `CLASSIFICATION` from `@orivilo/db` later.
- **Later schema changes:** a new table or column fails `pnpm typecheck` (T4 or T1) until it has an entry line with its basis, and joins `orv158-tags` in the same PR. PR 141 is the first such change (`orv158-rebase`).
- **Profiles, recipes, components, screens:** none. No design token, profile or UI changes.

## 11. Is an ADR needed?

No. ADR 0015 decision 9 already decides the tags, the file, the `satisfies` typing and the walk. The choices here (type-only derivation from the barrel, the fixture file, the walk inside the test, the root export without a subpath) implement that decision and the spec's `orv158-export`; none changes architecture. The two dated Additions record the state.

## Findings for the spec

- F1 (size, minor). The spec's worked example "The size" and "Impact list", "Size", estimate `classification.ts` at 120 with "12 table lines"; it has 24 table lines (open and close), so about 130, and the total is about 310 instead of 300. Still under 400. Listed in the report's `needs_decision`; no acceptance row depends on it.
