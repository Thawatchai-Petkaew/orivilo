---
issue: ORV-135 (https://tpetkaew.atlassian.net/browse/ORV-135), slice 1d of ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128)
parent: docs/specs/ORV-128/spec.md v1.29
lane: L (a server-only package that reaches the network and launches a browser; two dev dependencies, `playwright` and `tsx`; a new engine contract, `reportSchema`; the parent's lane, decision D7)
version: 1.2
---

# ORV-135: the page reader package, the local renderer, `pnpm analyse:url` and the report schema (ORV-128 slice 1d)

## Why

Slices 1a to 1c gave the engine the evidence schema, the safe read over injected ports and the URL analyser; nothing yet reads a live page or renders one. This slice wires them to Node and to a local browser, so the owner can run one command on one URL and read what was measured, read by rule and not measured, in Thai and English (parent "The owner's acceptance test"). It is the parent's slice 1d (L-0016), one PR, written short under the owner's lean mode for the POC (ORV-137). The reasoning is the parent's [Why](../ORV-128/spec.md#why).

**Frame.** This spec is not a guard: it judges no tool call's text. Rule `competitor-not-read-1` stays a check in our own code that a rule-following caller meets (parent); `cli.ts` reaches the read only through `readUrlInput` (tech notes §13, "The role gate"). Nothing outside the session enforces it.

**What is real, rule-based and simulated.**

- **Real (once built):** the Node read ports, the Playwright render of the read bytes, the command, `reportSchema` and the rules `terminal-escape-1` and `report-outcome-1`.
- **Rule-based, not AI:** every reading the report prints is slice 1c's (`lexicon-1`, `value-to-lean-1`, `measure-to-lean-1`). No model is called (D2 (a)).
- **Simulated in tests:** the network (a fake that logs every request), the clock and the pages (local fixtures and the recorded site `clinic-th`); no test reaches the internet (ADR 0009 point 8). The live run on a real URL is a manual smoke in the G3 packet, outside `pnpm test` (parent "The owner's acceptance test").
- **Local only:** the renderer runs on the machine that runs the command; no deployed route reads or renders (ADR 0019 decision 3).

## Story

The parent's story holds. This slice's part: as the owner, I want to run `pnpm analyse:url <url> --role own|reference|competitor` and read the report in Thai and English, or as JSON with `--json`, so that I can check the engine on real pages before any screen exists.

## What this slice uses (linked, not copied)

- **Parent spec** v1.29: "The owner's acceptance test"; "Reading a page the person submits" (Bounded, "Where it runs", rule `competitor-not-read-1`); "Strings"; "Delivery: vertical slices", row 1d; "Hypotheses", the Work bound (F30); "Open questions", "A TypeScript runner for the command" and "A report for a refused read".
- **G1 and G2:** ORV-128 comment 10209 (D1 (a), D2 (a)); the G2 packet in comment 10226, passed in 10227 under the owner's delegation (ADR 0012 decision 4), with slice 1 split into 1a to 1d.
- **Slice 1d decisions:** ORV-135 comment 10243, the orchestrator's five decisions under ADR 0012 decision 4, and ORV-135 comment 10244, its round-2 decisions 3a, 6, 7 and 8 ("Decisions recorded here").
- **Tech notes** `docs/specs/ORV-128/tech.md`: §1 (the `report.ts` row, "Server-only modules"); §6, Requests (`resolve(host, budgetMs)`, SEC-133-7) and `ReadResult`; §7, "The competitor gate" (the role as the person gave it) and "The report schema" (F44, F56); §12, row 1d; §13; §14, the rows whose Slice column says 1d.
- **ADR 0019** (proposed) decisions 1 to 4, accepted when this slice merges with rows 34, 35 and 37 green in `packages/page-reader` (its Status and Confirmation line).
- **Slice 1c:** ORV-134 spec v1.4 (table "Which slice carries which test", the 1d lines), merged into `develop` as fe31b33; its G3 packet is ORV-134 comment 10242.

## Deliverables in one PR, in build order

About 210 production lines (tech notes §12, row 1d), plus the rules `terminal-escape-1` and `report-outcome-1`. The order of commits inside the PR is not a requirement.

<!-- prettier-ignore -->
| Step | File | Holds (source) | Tests |
| --- | --- | --- | --- |
| first | `packages/intent-engine/src/report.ts`, exported from `index.ts` | `reportSchema` with its three members `analysed`, `not-read` and `refused` (rule `report-outcome-1`), `Report`, `REPORT_SCHEMA_VERSION` 1.0 and `REPORT_LINES`, with the cap and the order refine on `lines` (tech notes §7, "The report schema"; F44, review g2-3 S9; F56) | `report.test.ts` › "report lines are unique and in REPORT_LINES order" (row 38) |
| first | `packages/intent-engine/src/evidence-strings.ts` | The four keys under "Strings this slice adds" (decision 6) | row 29 |
| second | `packages/page-reader/package.json` | `@orivilo/page-reader`, private, Node only, with its own lint, typecheck and test tasks (ADR 0019 decision 1); dev dependencies `playwright` exactly `1.56.1` (ADR 0019 decision 3) and `tsx` pinned exactly (decision 1 below) | row 31 |
| third | `packages/page-reader/src/node-ports.ts` | `ReadPorts` on Node (ADR 0019 decision 1), with `resolve` answering within `budgetMs` (tech notes §6, Requests) | through rows 34 and 38 |
| fourth | `packages/page-reader/src/render-playwright.ts` | The POC `Renderer` (ADR 0019 decisions 2 and 3; tech notes §13) | rows 34, 35 and 37 |
| last | `packages/page-reader/src/cli.ts`; root script `analyse:url` | Wires `readUrlInput`, the renderer and `analyseUrl` (ADR 0019 decision 1); passes `--role` as given (tech notes §7, "The competitor gate") and one `notRendered` reason of parent "Where it runs"; `--fixture <name>` for the recorded sites of rows 34 and 38; prints the report in English and Thai, and the `reportSchema` object with `--json`; writes every string through `terminal-escape-1`; writes one report and exits under `report-outcome-1` | rows 34 and 38; rows D-1 to D-4 |

Reused read-only from slices 1a to 1c: `readUrlInput`, `analyseUrl`, `readPage`'s `ReadResult`, `notMeasuredSchema`, `renderSnapshotSchema`, the `Renderer` port, `rendererBuildSchema`, `inputEvidenceSchema`, `EVIDENCE_STRINGS` and the two maps of tech notes §9.

## Acceptance criteria

Rows 34, 35, 37, 38 and 29 to 31 are copied from parent v1.27 with their numbers and wording (v1.28 and v1.29 change no row). Decision 6 amends row 29 for this slice only: its Given also takes the four keys under "Strings this slice adds"; the row's text below stays as copied. The 1c halves of rows 34, 35 and 38 are green on fe31b33; this slice adds their 1d tests and all of row 37. Rows D-1 to D-4 are not parent rows: D-1 and D-2 test decision 2; D-3 tests decisions 3, 3a, 7 and 8; D-4 tests decisions 3, 3a and 6. In the POC the person sees the result on standard output; no row renders a screen.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test | Slice |
| --- | --- | --- | --- | --- | --- | --- |
| 34 | A recorded read with stylesheets and no snapshot; then a snapshot with an extra key; then a render past the 30 s budget on a fake clock | `analyseUrl(read, null, ctx)`, then with each snapshot case; the CLI on the first | `colour-declared` items, `font-family` items with `sheet:` locators, text spans and `lexicon-1` readings; no `colour-area`, `contrast-pair` or `density`; every item `source.renderer: null`; `notMeasured` lists colour areas, contrast, density and text visibility with reason `no-renderer`, then `snapshot-invalid`, then `render-budget`; nothing repaired, no error; the CLI prints one `read.notMeasured` line per entry with its reason string | None | `url-analyser.test.ts` › "no snapshot: declared colours and the page text", "a bad snapshot runs as option D"; `packages/page-reader` › "out of budget falls back to declared colours" | 1c, 1d |
| 35 | The same bytes and two recorded snapshots that differ only in `renderer`; a local fixture rendered by Playwright 1.56.1 | The URL analyser on each; the local renderer | Every `colour-area` id differs between the two runs and every `colour-declared` id is equal; each rendered item's `source.renderer` equals its snapshot's; the local render names driver `playwright` `1.56.1` and a four-part Chromium version read from the running browser, and every text box path names an element of the tokenized document | None | `url-analyser.test.ts` › "the renderer build is part of the source"; `packages/page-reader` › "the renderer's paths match the tokenizer" | 1c, 1d |
| 37 | Local fixtures: a page with an outside image, font, script and iframe URL; a page whose inline script repaints the background; two renders in a row, the first setting a cookie | The local renderer | Zero requests leave the process and only the read URLs are answered; the snapshot keeps the CSS colour; the cookie is absent in the second render | None | `packages/page-reader` › "no request leaves the renderer", "scripts never run", "fresh context per analysis" | 1d |
| 38 | The recorded fixture site `clinic-th` and a fake network that logs every request | The URL analyser with `role` `competitor` over the fake ports; then `pnpm analyse:url --fixture clinic-th --role competitor`, and with `--json` | Zero requests in the fake network log (no robots.txt, no page, no stylesheet); no evidence item rests on the page; the URL recorded as text; the `read.notRead.competitor` line in Thai and English; the JSON parses with `reportSchema` (tech notes §7, "The report schema"); exit 0 | None | `url-analyser.test.ts` › "a competitor URL is not read"; `analyse-url.test.ts` › "a competitor URL is not read" | 1c, 1d |
| 29 | Every key listed under "Strings", the four `{what}` labels once slice 1c names them, and the question keys `evidence.conflict`, `evidence.toolDefault`, `evidence.similarTo`, `culture.yellow`, `culture.political` and `industry.confirm` | Reading their text | Each has non-empty `th` and `en`; neither holds an em dash or a middot | None | `evidence.test.ts` › "every string is Thai and English" | each |
| 30 | The engine modules `evidence`, `confidence`, `evidence-strings`, `leans`, `read-page`, `page-text`, `render-snapshot`, `measures/colour`, `measures/page`, `url-analyser`, `industry` and `evidence-feed` (names suggested) | Scanning their source | None imports `openrouter`, `llm-interpreter`, `@orivilo/page-reader` or a `node:` module, or calls `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers | None | `evidence.test.ts` › "measures never call a model" | each |
| 31 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | Quality gate output in each G3 packet | each |
| D-1 | A fake network that logs every request; the URL `https://rival.example/` followed by a newline, `ESC[2J`, `ESC[31m` and `FAKE LINE` (the first URL of ORV-134-SEC-6's probe) | `pnpm analyse:url <that URL> --role competitor`, then with `--json` | The printed URL reads `https://rival.example/\u000A\u001B[2J\u001B[31mFAKE LINE`; no U+001B anywhere in either output; the printed report has as many lines as for `https://rival.example/`; the `read.notRead.competitor` line in Thai and English; the JSON parses with `reportSchema` and its `url` equals the URL as given; zero requests in the log; exit 0 | None | `analyse-url.test.ts` › "a newline and ESC in a URL print escaped" | 1d |
| D-2 | The same fake network; the URL `https://rival.example/` followed by U+202E and `gnp.exe`; then the URL `https://rival.example/` followed by U+007F and `x` | `pnpm analyse:url <each URL> --role competitor`, then with `--json` | The printed URLs read `https://rival.example/\u202Egnp.exe` and `https://rival.example/\u007Fx`; no U+202E and no U+007F anywhere in any output; each JSON parses with `reportSchema` and its `url` equals the URL as given; zero requests in the log; exit 0 | None | `analyse-url.test.ts` › "a bidi control or DEL in a URL prints escaped" | 1d |
| D-3 | The same fake network; the URL `http://127.0.0.1/` (from parent row 5); the URL `http://user:secret@example.test/` (from parent row 5); the URL `https://rival.example/` followed by 2,027 `a` characters, 2,049 characters in all | `pnpm analyse:url <the first or second URL> --role own` and `pnpm analyse:url <the third URL> --role competitor`, each then with `--json` | Each run prints its URL as stored and the `read.refused.address` line: en "We can read only public web addresses."; th "เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น". Each JSON parses with `reportSchema` as the `refused` member with `key` and `line` `read.refused.address`. The first: `url` `http://127.0.0.1/`, `urlCut` false. The second: printed URL and `url` `http://example.test/`, `urlCut` false, and the text `user:secret` in neither output. The third: printed URL and `url` `https://rival.example/` followed by 2,026 `a` characters, 2,048 in all, `urlCut` true. Zero requests in the log for each; exit 2 for each | None | `analyse-url.test.ts` › "a refused read writes a refused report" | 1d |
| D-4 | The same fake network, whose resolver maps the host `nowhere.example` to no address (parent row 7's last case) | `pnpm analyse:url https://nowhere.example/ --role own`, then with `--json` | The printed URL `https://nowhere.example/` and the `read.failed.network` line: en "We could not get this page. The site did not answer or sent an error."; th "เราดึงหน้านี้ไม่ได้ เว็บไซต์ไม่ตอบหรือส่งข้อผิดพลาดกลับมา"; the JSON parses with `reportSchema` as the `refused` member with `key` `network`, `line` `read.failed.network`, `url` `https://nowhere.example/` and `urlCut` false; zero requests in the log (robots.txt included); exit 2 | None | `analyse-url.test.ts` › "a failed read writes a refused report" | 1d |

**Tests this slice adds**, from tech notes §14, the rows whose Slice column says 1d (what each asserts beyond its row, and its "break it" check, are there): row 34, `packages/page-reader` › "out of budget falls back to declared colours"; row 35, `packages/page-reader` › "the renderer's paths match the tokenizer"; row 37, the three tests the row names; row 38, `analyse-url.test.ts` › "a competitor URL is not read" and `report.test.ts` › "report lines are unique and in REPORT_LINES order" (beyond the row, F56). Row 30 runs unchanged. Row 29's test runs unchanged in name and also reads the four keys under "Strings this slice adds" (decision 6). Row 31 is the G3 packet's gate output. Rows D-1 to D-4 are this spec's.

## Rules and bounds

The parent's "Rules and bounds" apply unchanged. Each rule or bound this slice implements keeps its one home in the parent, named here only: `competitor-not-read-1` (after "Another brand's page"); option D and its reasons ("Where it runs"); the renderer never fetches ("Where it runs", ADR 0019 decision 2); the 30 s budget ("Bounded"); Kept only as evidence; Untrusted input; Nothing persisted in the POC.

**Rule `terminal-escape-1`** (decision 2; this spec is its home). Every string value the command writes to standard output, in the printed report and in `--json`, writes each of these characters escaped, never raw: the C0 controls U+0000 to U+001F, DEL U+007F, the C1 controls U+0080 to U+009F, and the twelve bidi controls U+061C, U+200E, U+200F, U+202A to U+202E and U+2066 to U+2069 (the Unicode property Bidi_Control). In the printed report the escape is `\u` and four upper-case hex digits. In `--json` it is a JSON escape (`JSON.stringify`'s own, such as `\n` or `\u001b`, or `\u` and four upper-case hex digits for the others), so the parsed report holds each value exactly as it was, the URL as given among them. The line breaks the printer writes between lines are its own and are not escaped.

**Rule `report-outcome-1`** (decisions 3, 3a, 7 and 8; this spec is its home). Each run of the command on one URL that ends in one of the four outcomes below writes one report that parses with `reportSchema`, printed or with `--json`, and exits with the code of its outcome. The outcomes are four, from `readUrlInput` and `readPage`'s `ReadResult` (tech notes §6):

- the read reached `analyseUrl`: member `analysed`; exit 0;
- a competitor URL recorded as text (rule `competitor-not-read-1`): member `not-read`; exit 0;
- a refused read, `ReadResult` status `refused` or a competitor URL `readUrlInput` refuses: member `refused`, `key` the refusal key, `read.refused.robots` or `read.refused.address`, and `line` equal to `key`; exit 2;
- a failed read, `ReadResult` status `failed`: member `refused`, `key` the failure reason, `timeout`, `network`, `redirects` or `not-html`, and `line` the key that names that reason under "Strings this slice adds"; exit 2.

A usage error or an unexpected error is none of the four outcomes: exit 1, and this rule promises no report for it (decision 3a).

The `refused` member holds `version`, `status` `refused`, `url`, `urlCut`, `key` and `line`, the strings key of the line the command prints; it holds no evidence, no `notMeasured` and no personality. The printed report shows `url` and that line in Thai and English. `url` is the URL as given after two steps, in this order, taken before it is stored or printed:

1. **Userinfo dropped** (decision 7). Where the URL as given reads, after any run of U+0000 to U+0020, a scheme (a letter, then letters, digits, `+`, `-`, `.`, tab, line feed or carriage return), a `:`, any run of `/`, `\`, tab, line feed and carriage return, and then a run of characters other than `/`, `?`, `#` and `\` that holds an `@`, the part of that run up to and including its last `@` is removed. This covers the userinfo the WHATWG URL parser reads in an `http` or `https` URL (it drops tab, line feed and carriage return anywhere, and reads `\` as `/`). On a URL that is not `http` or `https` the same text is removed, which errs toward removing.
2. **Cut** (decision 8). If the result is longer than 2,048 characters (`URL_MAX_CHARS`, the evidence schema's `source.ref` bound, counted as JavaScript string length), `url` holds its first 2,048 characters and `urlCut` is true; otherwise `url` holds it whole and `urlCut` is false.

`url` is then written under `terminal-escape-1`, so a printed `url` may run past 2,048 characters. The `analysed` and `not-read` members take neither step (the Address check; rule `competitor-not-read-1`).

## Strings this slice adds

Decision 6. Data in the engine's `EVIDENCE_STRINGS`, drafts for the designer's and the owner's copy review, as the parent's "Strings" are. Each names the failed read's reason it prints for (rule `report-outcome-1`):

- `read.failed.timeout` (reason `timeout`): en "The page took too long to read, so we stopped."; th "หน้านี้ใช้เวลาอ่านนานเกินไป เราจึงหยุดอ่าน"
- `read.failed.network` (reason `network`): en "We could not get this page. The site did not answer or sent an error."; th "เราดึงหน้านี้ไม่ได้ เว็บไซต์ไม่ตอบหรือส่งข้อผิดพลาดกลับมา"
- `read.failed.redirects` (reason `redirects`): en "This address sent us on to other addresses too many times, so we stopped."; th "ที่อยู่นี้ส่งต่อไปยังที่อยู่อื่นหลายครั้งเกินไป เราจึงหยุดอ่าน"
- `read.failed.notHtml` (reason `not-html`): en "This address is not a web page we can read."; th "ที่อยู่นี้ไม่ใช่หน้าเว็บที่เราอ่านได้"

The copy names no number, so it stays true if the read's time budget or its redirect bound (parent "Bounded" and Address check) changes. `network` also covers a document answered with a status outside 2xx (`read-page.ts` line 612), which the en copy calls an error.

## Worked examples

`terminal-escape-1` maps input to output. The inputs of the first two URLs are copied from ORV-134-SEC-6's evidence command (`.orivilo/runs/ORV-134/ORV-134-security-3/result.json`); the DEL URL is row D-2's. The author had no shell and ran neither line; the builder runs both and records the output and the Node version. No rounding: a character map.

```sh
node -e 'const esc=s=>s.replace(/[\u0000-\u001F\u007F-\u009F\p{Bidi_Control}]/gu,c=>"\\u"+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,"0"));for(const u of ["https://rival.example/\n\u001b[2J\u001b[31mFAKE LINE","https://rival.example/\u202Egnp.exe","https://rival.example/\u007Fx"])console.log(esc(u))'
```

```text
https://rival.example/\u000A\u001B[2J\u001B[31mFAKE LINE
https://rival.example/\u202Egnp.exe
https://rival.example/\u007Fx
```

```sh
node -e 'const esc=s=>s.replace(/[\u0000-\u001F\u007F-\u009F\p{Bidi_Control}]/gu,c=>"\\u"+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,"0"));const u="https://rival.example/\n\u001b[2J\u202Egnp.exe";const j=esc(JSON.stringify({url:u}));console.log(j);console.log(JSON.parse(j).url===u)'
```

```text
{"url":"https://rival.example/\n\u001b[2J\u202Egnp.exe"}
true
```

`report-outcome-1` maps a read outcome to a member, a key, a line and an exit code. The inputs are copied from `packages/intent-engine/src/url-analyser.ts` (lines 106 and 108, the `not-read` URL being row 38's form) and `packages/intent-engine/src/read-page.ts` (lines 68 and 69); the four `read.failed.*` keys are this spec's ("Strings this slice adds"). Not run (no shell); the builder runs it. No rounding: a lookup.

```sh
node -e 'const F={timeout:"read.failed.timeout",network:"read.failed.network",redirects:"read.failed.redirects","not-html":"read.failed.notHtml"};const out=r=>r.status==="read"?["analysed","-",0]:r.status==="not-read"?["not-read",r.line,0]:["refused",r.status==="refused"?r.reason:F[r.reason],2];for(const r of [{status:"read"},{status:"not-read",url:"https://rival.example/",line:"read.notRead.competitor"},{status:"refused",reason:"read.refused.address"},{status:"refused",reason:"read.refused.robots"},{status:"failed",reason:"timeout"},{status:"failed",reason:"network"},{status:"failed",reason:"redirects"},{status:"failed",reason:"not-html"}]){const [m,l,x]=out(r);console.log(r.status,m,r.reason??"-",l,x)}'
```

```text
read analysed - - 0
not-read not-read - read.notRead.competitor 0
refused refused read.refused.address read.refused.address 2
refused refused read.refused.robots read.refused.robots 2
failed refused timeout read.failed.timeout 2
failed refused network read.failed.network 2
failed refused redirects read.failed.redirects 2
failed refused not-html read.failed.notHtml 2
```

`report-outcome-1`'s two steps on the `refused` member's `url` map a URL as given to `url` and `urlCut`. The inputs: `http://127.0.0.1/` and `http://user:secret@example.test/` from parent row 5; `https://user:secret@rival.example/` and `https://:secret@rival.example/` from `packages/intent-engine/src/url-analyser.test.ts` lines 1469 and 1471; `https://rival.example/a@b`, made up here, an `@` after the host that the step keeps; row D-3's URL of 2,049 characters. Each line prints the length as given, the length of `url`, `urlCut` and the first 40 characters of `url`. Not run (no shell); the builder runs it. No rounding: a text map and a count.

```sh
node -e 'const strip=u=>{const m=/^([\x00-\x20]*[A-Za-z][A-Za-z0-9+.\x09\x0A\x0D-]*:[\/\\\x09\x0A\x0D]*)[^\/?#\\]*@/.exec(u);return m?m[1]+u.slice(m[0].length):u};const cut=u=>u.length>2048?[u.slice(0,2048),true]:[u,false];for(const g of ["http://127.0.0.1/","http://user:secret@example.test/","https://user:secret@rival.example/","https://:secret@rival.example/","https://rival.example/a@b","https://rival.example/"+"a".repeat(2027)]){const [u,c]=cut(strip(g));console.log(g.length,u.length,c,u.slice(0,40))}'
```

```text
17 17 false http://127.0.0.1/
32 20 false http://example.test/
34 22 false https://rival.example/
30 22 false https://rival.example/
25 25 false https://rival.example/a@b
2049 2048 true https://rival.example/aaaaaaaaaaaaaaaaaa
```

## Decisions recorded here

All are the orchestrator's under ADR 0012 decision 4 and open for the owner, numbered as their comments number them: decisions 1 to 3 in ORV-135 comment 10243, decisions 3a, 6, 7 and 8 in ORV-135 comment 10244. Comment 10243's decisions 1, 4 and 5 confirm this spec's defaults (decision 1 below, and the two confirmations under "Open questions").

1. **The TypeScript runner.** The command runs TypeScript through `tsx`, pinned exactly as a dev dependency of `packages/page-reader`. This answers the parent's open question "A TypeScript runner for the command" (parent v1.28 records the answer) and tech notes §13's point for the slice 1d implementer; the engine's import style does not change. Default version: 4.23.15, which `pnpm-lock.yaml` already resolves, so the lockfile gains no new `tsx` version. `security` reviews it with `playwright` (ADR 0015 decision 2), and that review stands in for the research entry the parent's default named.
2. **ORV-134-SEC-6 is closed in this slice** by the report printer, under rule `terminal-escape-1` ("Rules and bounds"), with one test for a newline plus ESC URL (row D-1) and one for a U+202E URL and a DEL URL (row D-2). Comment 10243 decision 2 adds DEL (U+007F) to the rule's set. The competitor branch still records the URL as given; rule `competitor-not-read-1` does not change.
3. **A report for a refused or failed read** is the third `reportSchema` member, `refused`, with the outcomes and exit codes of rule `report-outcome-1` ("Rules and bounds"), so `--json` always writes a report. Rows D-3 and D-4 test it. This answers the parent's open question "A report for a refused read" (comment 10243 decision 3; parent v1.29 records the answer).

- **3a. The exit codes** (comment 10244 decision 3a). The rule `report-outcome-1` now gives a failed read the exit code of a refused read and keeps exit 1 for a usage or unexpected error, where v1.1 gave a failed read exit 1. Row D-4 follows.
- **6. Strings for a failed read** (comment 10244 decision 6). The four keys under "Strings this slice adds", `read.failed.timeout`, `read.failed.network`, `read.failed.redirects` and `read.failed.notHtml`, with draft Thai and English copy. This amends parent row 29 for this slice only ("Acceptance criteria"); the parent's "Strings" does not list them. Row D-4 prints `read.failed.network`.
- **7. No userinfo in a refused URL** (comment 10244 decision 7). The `refused` member's `url` drops the userinfo before it is stored or printed: rule `report-outcome-1`, step 1. Row D-3 tests it.
- **8. A bound on a refused URL** (comment 10244 decision 8). The `refused` member's `url` is cut, with `urlCut` true: rule `report-outcome-1`, step 2. Row D-3 tests it.

## What waits, and on what

- **`security` review** (parent "Delivery", row 1d; ADR 0015 decision 2): `playwright` and `tsx` (licence, exact pin, install scripts, what each reaches at run time), the Node ports, the renderer's interception, `terminal-escape-1`, and the `refused` member's `url` (rule `report-outcome-1`, its two steps). G3 waits on it.
- **`qa`** walks every row of this spec on the final head; screenshots of test runs are labelled as test output.
- **The live smoke:** one `pnpm analyse:url` run on a public URL, recorded in the G3 packet (parent "The owner's acceptance test").
- **CI:** the renderer tests need the Chromium CI installs for Playwright 1.56.1; if they cannot find it, the install step gains the page-reader filter (ADR 0019 Consequences).
- **Follow-ups outside this PR:** ADR 0019's Status records the POC part accepted once this PR merges green; `.claude/rules/security.md` gains `packages/page-reader/**` (ADR 0019 Consequences).

## Out of scope

The parent's "Out of scope", and its other slices: 2 (industry, rows 13 to 17, 33, `reportSchema` 1.1), 3 (model readings and mood, the acceptance test passing), 4 to 7. The Vercel route and ADR 0019 decision 5. Any screen. Fetching images, fonts or scripts.

## Open questions (with the default used until answered)

- **A report for a refused read.** Answered by decisions 3 and 3a (comments 10243 and 10244).
- **The function memory** (parent "Delivery" row 1d; "Hypotheses", the Work bound; F30). The POC deploys no function (ADR 0019 decision 3); the command runs under Node's own heap limit, and the setting waits for the Vercel route slice. Confirmed in comment 10243.
- **A research entry for `tsx`.** Answered by decision 1 (comment 10243).
- **`report` in row 30's scan.** Row 30's list is "names suggested" and does not name `report`; the scan reads `report.ts`, as slice 1c's scan reads `measures/wu.ts`, and the row's wording does not change. Confirmed in comment 10243.
- **The escape form and its set.** Answered by decision 2 (comment 10243): rule `terminal-escape-1`.
- **What decision 3 left open.** Answered by decisions 6 and 8 (comment 10244): a failed read prints a key under "Strings this slice adds", and the `refused` member's `url` is cut under rule `report-outcome-1`, step 2. Decision 7 adds the userinfo step, a point task `ORV-135-product-2` raised.
- **A cut marker in the printed report.** Decision 8 names `urlCut` in the report; no string says that a printed URL was cut. Default: the printed report shows `url` as stored, with no marker, and `--json` carries `urlCut`; a marker would be a new string key for copy review.

## Depends on

- [ORV-128 spec](../ORV-128/spec.md) v1.29 and its [tech notes](../ORV-128/tech.md); ORV-128 comments 10209, 10226 and 10227.
- ORV-135 comments 10243 and 10244: the orchestrator's decisions for slice 1d.
- `packages/intent-engine/src/read-page.ts` (`ReadResult`, lines 68 and 69) and `evidence.ts` (`URL_MAX_CHARS`), shipped in slices 1b and 1a.
- [ORV-134 spec](../ORV-134/spec.md) v1.4 (slice 1c), fe31b33, ORV-134 comment 10242; ORV-134-SEC-6 in `.orivilo/runs/ORV-134/ORV-134-security-3/result.json`.
- [ADR 0019](../../adr/0019-page-renderer-placement.md) decisions 1 to 4; ADR 0009 point 8; ADR 0012 decision 4; ADR 0015 decision 2.
- ORV-137: the owner's lean mode for the POC.

## Downstream review if this spec changes

- Decision 1 answers text outside this spec: parent spec lines 317, 996 and 1007 (updated in parent v1.28); tech notes lines 913, 1231 and 1254; ADR 0019 line 93 (Consequences), for the main session.
- Decision 3 answers text outside this spec: parent spec line 1008 (open question "A report for a refused read", updated in parent v1.29); for the main session, tech notes §7, "The report schema" (the `reportSchema` code with two members) and "What it does not hold" (line 880), and §11's `reportSchema` row (line 1172).
- Decisions 3a, 6, 7 and 8 change text outside this spec, for the main session: tech notes §7, "The report schema" (the `refused` member's `urlCut` field and its `url` steps) and §9 (the four `read.failed.*` keys); the parent's "Strings" and row 29, which this spec amends for slice 1d only.
- The ORV-135 Jira issue acceptance (rows 34, 35, 37, 38, 29 to 31, D-1 to D-4); the PR body (this spec's version).
- The designer and the owner: the copy of the four `read.failed.*` keys.
- The slice 2 spec, when written: `reportSchema` 1.1 keeps the `refused` member.

## Changelog

- v1.0 (2026-10-29): split from ORV-128 spec v1.27 as slice 1d (L-0016), under the owner's lean mode (ORV-137). Rows 34, 35, 37, 38, 29, 30 and 31 copied with their numbers and wording; the 1d tests from tech notes §14. Two orchestrator decisions under ADR 0012 decision 4: `tsx` as the TypeScript runner, and ORV-134-SEC-6 closed by rule `terminal-escape-1` with rows D-1 and D-2. Two worked examples, not run (no shell). Review: the ORV-135 Jira acceptance; the slice 1d builder; `security` and `qa` on the PR; the parent, tech notes and ADR 0019 lines named under "Downstream review".
- v1.1 (2026-10-29): the orchestrator's decisions in ORV-135 comment 10243 (task `ORV-135-product-2`). Decision 2: rule `terminal-escape-1` adds DEL (U+007F); row D-2 gains a DEL URL and its test name says so. Decision 3: new rule `report-outcome-1`, the `refused` member for a refused or failed read, with exit 0, 2 and 1; new decision 3, rows D-3 and D-4, a third worked example, and the first and last deliverable steps name the rule. Decisions 1, 4 and 5 confirm the defaults; each answered open question points to its decision, and one open question, "What decision 3 leaves open", is new. The decisions now cite comment 10243 in place of task `ORV-135-product-1`. Fix: v1.0 held raw U+202E characters in row D-2 and the worked examples, the character the rule bans; they are now written `\u202E`, and the examples' character class names the bidi controls as `\p{Bidi_Control}`, the property the rule names. Parent cited at v1.28. Review: the ORV-135 Jira acceptance (rows D-2 to D-4); the slice 1d builder (`report.ts`, `cli.ts`, `analyse-url.test.ts`); `security` (exit codes, the `refused` member's URL); tech notes §7 and §11 and parent line 1008, named under "Downstream review".
- v1.2 (2026-10-29): the orchestrator's round-2 decisions in ORV-135 comment 10244 (task `ORV-135-product-3`). Decision 3a: rule `report-outcome-1` gives every refused or failed read exit 2 and keeps exit 1 for a usage or unexpected error, which writes no report the rule promises; row D-4 expects exit 2 and the third worked example says so. Decision 6: new section "Strings this slice adds" with `read.failed.timeout`, `read.failed.network`, `read.failed.redirects` and `read.failed.notHtml`, draft Thai and English copy; a failed read's `line` is the key of its reason; this amends parent row 29 for this slice only; a deliverable row for `evidence-strings.ts`; row D-4 prints `read.failed.network`. Decision 7: the `refused` member's `url` drops its userinfo (rule `report-outcome-1`, step 1). Decision 8: that `url` is cut at `URL_MAX_CHARS`, with the new field `urlCut` (step 2). Row D-3 gains the userinfo URL and the URL of 2,049 characters; a fourth worked example for the two steps, not run (no shell). The open question "What decision 3 leaves open" is answered; a new open question on a cut marker in the printed report. "Decisions recorded here" adds 3a, 6, 7 and 8. Parent cited at v1.29, which answers its open question "A report for a refused read". Review: the ORV-135 Jira acceptance (rows 29, D-3 and D-4); the slice 1d builder (`report.ts`'s `refused` member and `urlCut`, `evidence-strings.ts`, `cli.ts`'s exit codes and `url` steps, `analyse-url.test.ts`); `security` (the userinfo step and the cut); the designer and the owner (the four strings); tech notes §7, §9 and §11 and the parent's "Strings", named under "Downstream review".
