---
issue: ORV-133 (https://tpetkaew.atlassian.net/browse/ORV-133), slice 1b of ORV-128 (https://tpetkaew.atlassian.net/browse/ORV-128)
parent: docs/specs/ORV-128/spec.md v1.13
lane: L (server-side reads of outside web pages with legal exposure, and a new runtime dependency in the engine; the parent's lane, decision D7)
version: 1.6
---

# ORV-133: the safe single-page read, the pinned HTML tokenizer and the page text (ORV-128 slice 1b)

## Why

A person who brings their website needs ORIVILO to read that one page safely, politely and within bounds, and to turn its bytes into the text every later reading quotes. This slice builds that read and that text as pure engine code over injected ports, so slices 1c and 1d measure and render only what a checked, bounded, logged-out read returned.

The full reasoning is in [ORV-128's Why](../ORV-128/spec.md#why) and its section "Reading a page the person submits". This story is that spec's slice 1b (L-0016).

**Frame.** This spec is not a guard: it judges no tool call's text. The address check, robots.txt and the bounds are checks in our own engine code that a rule-following caller meets. What holds the connection to the checked address (so a second DNS answer cannot swap it) is the request port, which `packages/page-reader` implements in slice 1d (tech notes §6, "Requests"); this slice defines the port and tests `readPage` against a fake one.

**What is real, rule-based and simulated in this slice.**

- **Real (once built):** `checkAddress`, `parseRobots`, `robotsAllows` and `readPage` over injected ports; `pageTextOf` by `html-text-1`; the word count by `word-count-1`. Deterministic TypeScript in `packages/intent-engine/src` with tests.
- **Simulated in tests:** the network, DNS and the clock. Every test runs over a fake network and recorded answers (ADR 0009 point 8); no test reaches the internet.
- **Not wired yet:** nothing in this slice reads a live page. The Node ports that do (`node:dns`, `node:http`, `node:https`) and the command that calls the read land in slice 1d; the role gate `competitor-not-read-1` in front of `readPage` lands in slice 1c. Nothing in this slice may be described as reading a website for a person, and nothing calls a model.

## Story

The parent's story holds unchanged ([ORV-128 "Story"](../ORV-128/spec.md#story)).

This slice's part of it: as the builder of the URL analyser and of the command, I want one engine function that reads a submitted page only at a public address, after robots.txt, logged out and within its bounds, and one function that turns the document bytes into the page text and its word count, so that every later measure and quote rests on bytes that were read safely and on text that can be checked.

## What this slice uses from ORV-128 (linked, not copied)

- **Spec** `docs/specs/ORV-128/spec.md` v1.13: "Reading a page the person submits" (Address check, robots.txt with rules `robots-token-1`, `robots-group-1` and `robots-match-1`, Logged out, Named reader, Bounded, Depth bound, Kept only as evidence; "Where it runs", the tokenizer sentence; "How this differs from bulk collection in ORV-127"; "What stays the same"); "Page text" (rules `html-text-1` and `word-count-1`); "Strings" (`read.refused.robots`, `read.refused.address`); "Worked examples"; "Delivery", row 1b; "Open questions" ("The reader's contact URL", "Images on a read page", "The HTML tokenizer", "The Node line").
- **G1 decisions**, ORV-128 comment 10209: the owner decided D1 to D7. This slice rests on D1 (a): a single page the person submits is read before the ORV-127 lawyer review, for their own brand and for references, and the owner carries the remaining risk for single pages. D1 (a) holds a competitor URL back; that gate (`competitor-not-read-1`) is slice 1c's, in front of `readPage`. D2 (a) keeps this slice free of any model call.
- **G2**, the packet in ORV-128 comment 10226, passed in comment 10227 under the owner's delegation (ADR 0012 decision 4), with slice 1 split into 1a to 1d.
- **Tech notes** `docs/specs/ORV-128/tech.md`: §1 (the `read-page.ts` and `page-text.ts` rows), §6 (`ReadPorts`, `ReadResult`, `Fetched`, `checkAddress` with its IPv4 list, the IPv6 ranges refused outright and those judged by the IPv4 they embed, the parse order, zone ids and unparsable literals; requests to the checked address; bounds; headers; stylesheet links by the tokenizer; order), §8 ("Page text": `pageTextOf`, `TextBlock`, scripting off; "Page": `word-count`), §12 (row 1b of the budget), §13 ("Tokenizer"), §14 (the tests whose Slice column says 1b, and rows 29 and 30).
- **ADR 0019 decision 6**: the HTML tokenizer lives in the engine, pure, with no Node import, pinned exactly; the candidate is `parse5`. Its Status, step (1): decision 6 is accepted when this slice merges into `develop` with the tokenizer pinned exactly, after its `research` entry records the licence, version and dependencies and `security` has reviewed the PR that adds it. Its Confirmation line: the research entry exists before 1b adds the tokenizer, `security` reviews 1b, and row 36 passes on it.

## Deliverables in build order

Each module is pure TypeScript in `packages/intent-engine/src`: no framework import, no `node:` module, no `Math.random` or `Date.now` (row 30). Bytes, a clock reading and port answers come in as arguments (parent "Rules and bounds", Purity). The order is the tech notes' order; a builder may write the parts of `read-page.ts` that need no tokenizer (`checkAddress`, `parseRobots`, `robotsAllows`) before K-0082 lands, and the order of the commits is not a requirement.

<!-- prettier-ignore -->
| Step | File | Holds (tech notes) | Rules and sections it implements, by name (home in the parent spec) | Tests |
| --- | --- | --- | --- | --- |
| first | `read-page.ts` | `ReadPorts` (its `resolve` takes `(host, budgetMs)`, the time left in the read's budget; SEC-133-7), `ReadResult`, `Fetched`, `checkAddress`, `parseRobots`, `robotsAllows`, `readPage` (§6); the stylesheet link extraction on the pinned tokenizer (§6, "Stylesheet links") | "Reading a page the person submits": Address check, robots.txt (`robots-token-1`, `robots-group-1`, `robots-match-1`), Logged out, Named reader, Bounded, Depth bound | `read-page.test.ts` › "public addresses only" (row 5, with the `checkAddress` unit table of tech notes §14); "robots.txt first" (row 6); "one page, logged out, bounded" (row 7) |
| second | `page-text.ts` | `pageTextOf(documentBytes)` returning `{ blocks, incomplete }` (`blocks` the `TextBlock[]`), and `stylesheetLinksOf(documentBytes)` returning `{ hrefs, incomplete }`, on the same parse (§8); `incomplete` is how the Heading bound of `html-text-1` and the Depth bound report `page-incomplete`; the word count, one `Intl.Segmenter` built once (§8, "Page") | `html-text-1` and `word-count-1` ("Page text") | `page-text.test.ts` › "html-text-1" (row 36) |
| third | `packages/intent-engine/package.json` | The tokenizer pinned exactly (no range), as K-0082 names it: `parse5` 8.0.1, with `entities` 8.1.0 held by the lockfile (K-0082 option A) (ADR 0019 decision 6; tech notes §11, the `package.json` row) | None | `security` review of the PR (ADR 0015 decision 2); row 31 |
| fourth | Root `package.json` `engines.node` and `.nvmrc` | One Node line, the same in both (parent open question "The Node line"); CI reads `.nvmrc` (`.github/workflows/ci.yml` line 39) | Determinism ("Rules and bounds"), for `word-count-1` | `page-text.test.ts` › "html-text-1" (row 36) runs on that line; the G3 packet records `process.versions.node` and `process.versions.icu` beside row 36's count |
| fifth | `evidence.test.ts` | The source scan of row 30 gains `read-page` and `page-text` (ORV-132 open question "Row 30 before the other modules exist") | None | `evidence.test.ts` › "measures never call a model" (row 30); "every string is Thai and English" (row 29) runs unchanged |
| last | `index.ts` | The new exports (§1), under the open question "What `index.ts` exports in 1b" | None | Rows 30 and 31 |

Reused read-only, unchanged: `EVIDENCE_STRINGS` (`evidence-strings.ts`), which already holds `read.refused.robots` and `read.refused.address` from slice 1a.

## Acceptance criteria

Rows copied from ORV-128 spec with their numbers and wording: rows 5, 6, 7 and 36 from v1.12, which adds the review round 0 cases to them; rows 29, 30 and 31 from v1.9. This slice adds no row. In the POC the person sees the result through the engine API; no row renders a screen. Every test uses recorded inputs and a fake network; none reaches the internet or a model (ADR 0009 point 8).

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Test | Slice |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | URLs `ftp://a.b`, `javascript:x`, `http://127.0.0.1/`, `http://10.0.0.5/`, `http://169.254.169.254/`, `http://[::1]/`, `http://[::]/`, `http://[64:ff9b::a00:5]/`, a host the fake resolver maps to `192.168.1.2`, a public page that redirects to a private address, `http://user:secret@example.test/`, `https://example.com:6379/`, `http://example.com:443/`, `http://240.0.0.1/`, `http://198.18.0.1/`, `http://192.0.0.170/`, `http://[fec0::1]/`, `http://[::ffff:0:a00:5]/`, a public page that redirects to `http://user:secret@example.test/`, one that redirects to `https://example.com:6379/`, a public page whose stylesheet link is `https://user:secret@example.test/a.css`, and one whose stylesheet link is `https://example.test:8080/a.css`; then `http://[64:ff9b::808:808]/` and `https://example.com:443/`, each serving a public page | `readPage(url)` | Each of the first twenty-two refused with `read.refused.address` and no evidence; the fake network records no request to a non-public address, no request URL holding a username or password, and no request on a port other than 80 or 443; `http://[64:ff9b::808:808]/` is read (its IPv4, `8.8.8.8`, is public) and `https://example.com:443/` is read | None | `read-page.test.ts` › "public addresses only" | 1b |
| 6 | robots.txt that disallows the path for `*`; one that disallows it for `oriviloreader` in lower case; one answering 503; one answering 404; `User-agent: oriviloreader` `Disallow: /`, then `User-agent: *` `Allow: /public`, for the page `/public`; `User-agent: OriviloReader/1` `Disallow: /`; `User-agent: oriviloreader` `Allow: /`, then `User-agent: *` `Disallow: /`; `http://example.test/robots.txt` answering 301 to `https://example.test/robots.txt`, which answers 200 with `User-agent: *` `Allow: /`; a robots.txt answering 301 to `http://10.0.0.5/robots.txt`; `User-agent: *` with `Disallow: /` followed by `*a` 12 times and `b$`, for the page `/` followed by 38 `a` and a `b`, and then for the page `/` followed by 38 `a`; a `Disallow` pattern of 1,001 characters that matches the page path | `readPage` | Refused with `read.refused.robots` and no request for the page: the `*` disallow, the lower-case token, the 503, the token group over the `*` allow, `OriviloReader/1`, and the pattern ending in `b`. Refused with `read.refused.address` and no request to `10.0.0.5`: the robots.txt redirect to it. The page is read: the 404, the token group's allow over the `*` disallow, the robots.txt redirect to `https`, the path of 38 `a`, and the 1,001-character pattern. Each of the two hostile-pattern cases returns within 1 s | None | `read-page.test.ts` › "robots.txt first" | 1b |
| 7 | A recorded page with 12 linked stylesheets, a 3 MB document, links to other pages and a 4-step redirect chain; then a document of `<body>` and 5,000 nested `div` elements, with a stylesheet link inside the 600th `div` | `readPage`, inspecting the fake network log | No request carries a cookie or authorization header; every request's user agent holds `OriviloReader/1` and the contact URL; no request URL and no result URL holds a username or password; at most 10 stylesheets fetched; the document cut at 2 MB with `page-incomplete`; no other page and no image, font or script fetched; the fourth redirect refused. The nested document: `readPage` resolves with status `read` and `page-incomplete`, never rejects, and the stylesheet below the depth bound is not fetched | None | `read-page.test.ts` › "one page, logged out, bounded" | 1b |
| 36 | A fixture document with a title, a meta description, an `h1`, a `p`, a `script`, a `style`, a `template`, an `svg`, an element with `hidden`, one with `aria-hidden="true"`, a `noscript` holding a `p` (`<noscript><p>Enable JavaScript</p></noscript>`), and body text over 5,000 characters; then the Thai text "อยากให้สนุก"; then a document of `<body>` and 40,000 `<h2>heading text here</h2>`; then a document of `<body>` and 5,000 nested `div` elements whose innermost holds `<p>deep</p>` | `pageTextOf(bytes)`, then the word count | Blocks for the title, the meta description, the `h1`, the `p` and the `p` inside the `noscript` ("Enable JavaScript") only, in document order, whitespace runs as one space; body text cut on whitespace within 5,000 characters; equal bytes give deep-equal blocks; "อยากให้สนุก" counts 3 words, where splitting on spaces gives 1. The heading page: 294 heading blocks of 4,998 characters in all, the cut reported as `page-incomplete`, returned within 2 s. The nested page: no block for "deep", the cut reported as `page-incomplete`, no exception | None | `page-text.test.ts` › "html-text-1" | 1b |
| 29 | Every key listed under "Strings", the four `{what}` labels once slice 1c names them, and the question keys `evidence.conflict`, `evidence.toolDefault`, `evidence.similarTo`, `culture.yellow`, `culture.political` and `industry.confirm` | Reading their text | Each has non-empty `th` and `en`; neither holds an em dash or a middot | None | `evidence.test.ts` › "every string is Thai and English" | each |
| 30 | The engine modules `evidence`, `confidence`, `evidence-strings`, `leans`, `read-page`, `page-text`, `render-snapshot`, `measures/colour`, `measures/page`, `url-analyser`, `industry` and `evidence-feed` (names suggested) | Scanning their source | None imports `openrouter`, `llm-interpreter`, `@orivilo/page-reader` or a `node:` module, or calls `Math.random` or `Date.now`; only the model-reading adapters import `openrouter`; tests use a fake network and recorded answers | None | `evidence.test.ts` › "measures never call a model" | each |
| 31 | The repo after each slice | `pnpm lint && pnpm typecheck && pnpm test && pnpm build`, and CI | All pass; `pnpm contrast` output unchanged from `develop` | None | Quality gate output in each G3 packet | each |

"Strings" in row 29 is the parent's section "Strings". The tests each row names, what each asserts beyond the row (the `checkAddress` unit table, the `remoteAddress` re-check, robots.txt before the page) and the "break it" check for each are in tech notes §14. The Node and ICU versions row 36 ran on are recorded beside its count in the G3 packet (parent open question "The Node line"). Recorded by the build: row 36 ran on Node 22.23.0 with ICU 78.2, and "อยากให้สนุก" counts 3 segments.

## Rules and bounds

The parent's "Rules and bounds" apply unchanged, in particular "Purity", "Untrusted input" and "Determinism". This spec defines no rule. Each rule or bound this slice implements keeps its one home in the parent spec, and this spec points to it by name only:

<!-- prettier-ignore -->
| Rule or bound | Home in `docs/specs/ORV-128/spec.md` v1.13 | Implemented in |
| --- | --- | --- |
| Address check (scheme, ports, username and password, ranges, every request) | "Reading a page the person submits", Address check (R13 of ORV-127; finding F15; review round 0 R4, SEC-133-6, SEC-133-7) | `read-page.ts` (`checkAddress`, the URL checks and the re-check in `readPage`) |
| robots.txt, its answers and redirects | "Reading a page the person submits", robots.txt (R6), Answers | `read-page.ts` (`readPage`) |
| `robots-token-1` | "Reading a page the person submits", robots.txt | `read-page.ts` (`parseRobots`) |
| `robots-group-1` | "Reading a page the person submits", robots.txt | `read-page.ts` (`robotsAllows`) |
| `robots-match-1` | "Reading a page the person submits", robots.txt | `read-page.ts` (`robotsAllows`) |
| Logged out and named reader | "Reading a page the person submits", Logged out (R9) and Named reader (R7) | `read-page.ts` (the request headers) |
| The read bounds | "Reading a page the person submits", Bounded | `read-page.ts` (`readPage`) |
| Depth bound | "Reading a page the person submits", Depth bound | `page-text.ts` (the tree walks), `read-page.ts` (`readPage`) |
| `html-text-1`, its heading bound among its clauses | "Page text" | `page-text.ts` (`pageTextOf`) |
| `word-count-1` | "Page text" | `page-text.ts` (the word count) |

`page-incomplete` is a factor of the parent's "Confidence"; this slice only reports the cut (`incomplete` in `ReadResult`), and slice 1c puts the factor on items. A change to a range, a bound, a block kind or a count method is made in the parent spec first, with its version bump and impact list; this spec then follows. A range added to the address check later is reviewed by `security` (tech notes §6).

## Worked examples

Copied as is from the parent's "Worked examples" (v1.11), the two lines that belong to the rules this slice implements. The parent records that the main session ran the first on Node 22.23.0 with ICU 78.2 and the second, the decoding sentence of `html-text-1`, on Node 22.23.0 (both 2026-10-27), and that each printed the output shown. The author of this spec had no shell and ran neither. The slice 1b builder runs both again on the Node line this slice pins, and records the outputs and the versions; a different output is a finding against the parent spec, and row 36 takes the recorded number (parent "Worked examples").

**`html-text-1` whitespace, then `word-count-1`** (section "Page text"). The Thai text is copied from `packages/intent-engine/src/interpreter.test.ts` line 42, wrapped in the whitespace a page would carry; `html-text-1` folds it, and `word-count-1` counts the word-like segments.

```sh
node -e 'const t=(" \n  "+"อยากให้สนุก"+"  ").replace(/[\t\n\f\r ]+/g," ").trim();const w=[...new Intl.Segmenter("th",{granularity:"word"}).segment(t)].filter(s=>s.isWordLike).map(s=>s.segment);console.log(JSON.stringify(t), t.split(" ").length, w.length, w.join("/"))'
```

```text
"อยากให้สนุก" 1 3 อยาก/ให้/สนุก
```

The segment count comes from the ICU data of the Node build (3 on Node 22.23.0, ICU 78.2); if the pinned line splits the text differently, slice 1b records the output and the versions, and row 36 takes the recorded number.

No rounding applies: both outputs are whole counts.

**`html-text-1` decoding** (section "Page text"). The bytes are `<p>`, then E0 B8 AD, the UTF-8 of the first letter of the Thai text at `packages/intent-engine/src/interpreter.test.ts` line 42, then FF, an invalid sequence, then `</p>`. The global `TextDecoder` decodes them as UTF-8; the invalid byte becomes U+FFFD, printed below as the replacement character itself, and the decode does not throw.

```sh
node -e 'console.log(JSON.stringify(new TextDecoder().decode(new Uint8Array([0x3c,0x70,0x3e,0xe0,0xb8,0xad,0xff,0x3c,0x2f,0x70,0x3e]))))'
```

```text
"<p>อ�</p>"
```

No rounding applies: the output is text.

**The lines added in parent v1.12.** The parent's "Worked examples" holds six more lines for rules and checks this slice implements: `robots-token-1`, `robots-group-1`, `robots-match-1`, the address ranges added in v1.12, the port and userinfo checks, and the heading bound of `html-text-1`. They are not copied here (one home, L-0039). They were written without a shell and not run; the slice 1b fix runs each on the pinned Node line and records its output, and a different output is a finding against the parent spec.

## What waits, and on what

- **K-0082, the tokenizer's research entry.** Done: `research` committed it as `docs/knowledge/platform/K-0082-parse5-as-a-pure-html-tokenizer.md`. It records the licence, the version and the dependencies of `parse5` (ADR 0019 decision 6; parent open question "The HTML tokenizer"), and this slice took its option A (the pin is in "Deliverables in build order", step third).
- **The `security` review** (parent "Delivery", row 1b; ADR 0015 decision 2). It reviews the PR head for the address check and its IPv6 cases, robots.txt, the bounds and headers, and the supply chain of the tokenizer (licence, exact pin, install scripts, what it reaches at run time; ADR 0019 Consequences). G3 waits on it; a `request_changes` forces rework.
- **ADR 0019 decision 6 accepted.** When this slice merges into `develop` with the tokenizer pinned, K-0082 present and the `security` review done, step (1) of ADR 0019's Status is met. Recording it in the ADR is bookkeeping after the merge, by the `architect`.

## Out of scope

Everything in the parent's "Out of scope", and the other slices of the parent's "Delivery", each with its own issue and spec:

- **1a (ORV-132, merged as a0f67a2):** the evidence schema, confidence, the strings and the lean rules (rows 1, 2, 3, 32).
- **1c:** the render snapshot contract and the `Renderer` port, the measures, the URL analyser with option D, the role gate `competitor-not-read-1` with `readUrlInput`, the `page-incomplete` and `few-words` factors on items, and the four `{what}` label keys (rows 4, 8 to 12, 34, 35, 38).
- **1d:** `packages/page-reader` with the Node ports on `node:dns`, `node:http`, `node:https` and `node:crypto`, the local renderer, the command `pnpm analyse:url` and `report.ts` (rows 34, 35, 37, 38).
- **2:** industry, `tsic-terms-1`, `industry-level-1` and `readIndustry` (rows 13 to 17, 33).
- **3:** model readings and `mood-1` (rows 17, 18, 20).
- **4:** the brief text analyser, `detectConflicts`, the culture flags and `feedEvidence` (rows 19, 21 to 24).
- **5, 6 and 7:** the photo, user HTML and other brand's CI analysers and `similarityCheck` (rows 25 to 28).
- Adding `packages/page-reader/**` to `.claude/rules/security.md` (a follow-up for the rule owner, parent "Gap list").

Slices 1c to 7 also carry rows 29 to 31 again, as the parent's "Delivery" says.

## Open questions (with the default used until answered)

- **Which Node line.** Settled by the build: root `package.json` `engines.node` is `>=22.23.0 <23` and `.nvmrc` is `22`. The question as asked: the parent asks for one line in both `engines` and `.nvmrc` and leaves the line open. Default: the 22 line the worked examples ran on, with `engines.node` held to that line (no later major) and `.nvmrc` naming the same line, so CI and a local run use one ICU; the G3 packet records the exact `process.versions.node` and `process.versions.icu`. Impact: root `package.json`, `.nvmrc`, CI (reads `.nvmrc`); the later Vercel route on Node 24.x re-runs row 36 there (parent "The Node line").
- **What `index.ts` exports in 1b.** Settled by the build: `index.ts` exports `page-text` whole, the `read-page` types (`ReadPorts`, `ReadResult`, `Fetched`, `RobotsRules`, `RobotsCache`) and its checks (`checkAddress`, `parseRobots`, `robotsAllows`), and not `readPage`. This exports the checks where the default below did not; `readPage` stays out, so row 38 holds. The question as asked: the engine's `index.ts` re-exports whole modules (`export * from`), and tech notes §14, row 38 (slice 1c) asserts that `index.ts` exports `readUrlInput` and not `readPage`. Default: 1b exports `page-text` whole and only the types `ReadPorts`, `ReadResult` and `Fetched` from `read-page`, not `readPage`, `checkAddress` or the robots functions; tests import them from `./read-page`. So 1c adds `readUrlInput` without removing an export. Impact: tech notes §1 ("`index.ts` gains the new exports") and §14 row 38.
- **The bytes' character encoding.** Settled by the parent v1.10: rule `html-text-1` ("Page text") now says how `pageTextOf` decodes the document bytes, and "Hypotheses" there lists the decoding bound. Nothing stays open here. Impact: `page-text.ts` follows the rule; tech notes §8 ("Page text") is reviewed against it; row 9's quote check in slice 1c reads the same decoded text.
- **The reader's contact URL.** Row 7 asserts "the contact URL" in the user agent. Default: the parent's, the repository URL until the ORIVILO page exists (parent open question "The reader's contact URL").
- **Size.** Tech notes §12 estimates about 420 production lines for 1b, over the 400 line guide. Default: one PR, as G2 split it (comment 10227); if the diff runs well past the estimate, the G3 packet says so and the orchestrator decides a vertical split (`read-page` with rows 5 to 7, `page-text` with row 36), never one by layer.

## Depends on

- [ORV-128 spec](../ORV-128/spec.md) v1.13 (its "Owner decisions" records review round 0, R1 to R8 and SEC-133-1 to SEC-133-7, and the RFC 9309 check, RFC-1 to RFC-4) and its [tech notes](../ORV-128/tech.md) (G2 design, findings F1 to F19; F13, F15 and F16 land in this slice's rows).
- ORV-128 comments 10209 (G1 decisions D1 to D7; D1 (a) governs the single-page read), 10226 (the G2 packet) and 10227 (G2 passed under the owner's delegation, slice split 1a to 1d).
- [ORV-132 spec](../ORV-132/spec.md) v1.2, slice 1a, merged into `develop` as a0f67a2: `EVIDENCE_STRINGS`, and row 30's scan, which this slice extends.
- [ADR 0019](../../adr/0019-page-renderer-placement.md) (proposed) decision 6 and its Status step (1); ADR 0015 decision 2 (`security` on a new runtime dependency); ADR 0009 point 8 (recorded tests); ADR 0012 decision 4 (the delegated G2).
- [K-0082](../../knowledge/platform/K-0082-parse5-as-a-pure-html-tokenizer.md) (`parse5`: licence, version, dependencies; option A, `parse5` 8.0.1 pinned exactly with `entities` 8.1.0 held by the lockfile); K-0056 (robots.txt) and K-0054 (access offences), as the parent cites them.
- [ORV-127 spec](../ORV-127/spec.md) v1.2: rules R6, R7, R9 and R13, which the read follows.

## Downstream review if this spec changes

- ORV-128 spec, "Delivery" row 1b (the rows and deliverables this spec copies), and its open questions "The HTML tokenizer" and "The Node line".
- ORV-128 tech notes §1 and §14 row 38, against the open question on `index.ts`; §8 "Page text" against the decoding sentence of `html-text-1` (parent v1.10) and its heading bound (parent v1.12); §6 against the parent v1.12 Address check, robots rules and Depth bound.
- ADR 0019 Status step (1) and Confirmation (decision 6).
- K-0082, against the pin this slice adds.
- The ORV-133 Jira issue acceptance (rows 5, 6, 7, 36, 29, 30, 31).

## Changelog

- v1 (2026-10-27): split from ORV-128 spec v1.9 as slice 1b (L-0016). Rows 5, 6, 7, 36, 29, 30 and 31 copied with their numbers and wording; the address check, robots.txt, logged out, named reader, the read bounds, `html-text-1` and `word-count-1` pointed to by name in the parent; the deliverables `read-page.ts`, `page-text.ts`, the exact tokenizer pin, the Node line in `engines` and `.nvmrc`, the row 30 scan and `index.ts`, from tech notes §1, §6, §8, §12 to §14; the `html-text-1` and `word-count-1` worked example copied as is. What waits on K-0082 and on the `security` review. Five open questions with defaults: the Node line, the 1b exports, the bytes' encoding, the contact URL, the size. Downstream to review: the ORV-133 Jira issue acceptance, tech notes §1 and §14 row 38, the parent's "Page text" (encoding), ADR 0019 Status step (1), K-0082, the slice 1b builder.
- v1.1 (2026-10-27): the open question on the bytes' character encoding is settled by ORV-128 spec v1.10, which adds the decoding sentence to `html-text-1` and lists the decoding bound under its "Hypotheses" (accepted by the orchestrator under ADR 0012 decision 4, open for the owner); the open question now points there. The parent is cited at v1.10 in the front matter, "What this slice uses", "Rules and bounds" and "Depends on"; rows stay as copied from v1.9, which v1.10 does not change. No row, number or deliverable changes. Review: tech notes §8 ("Page text", the `pageTextOf(documentBytes)` bullet); the slice 1b builder (`page-text.ts` decodes as the rule says); the slice 1c builder (row 9's quote check); K-0082 ("Byte decoding").
- v1.2 (2026-10-27): "Worked examples" copies as is the parent v1.11 line for the decoding sentence of `html-text-1`, run by the main session on Node 22.23.0; the section's opening paragraph says so. No row, number or deliverable changes. Review: the slice 1b builder (runs the line again on the pinned Node line).
- v1.3 (2026-10-27): bookkeeping. The parent is cited at v1.11 in the front matter, "What this slice uses", "Rules and bounds" and "Depends on" (history at v1.10 kept); K-0082 is committed, so "What waits" and "Depends on" say so; the pin `parse5` 8.0.1 with `entities` 8.1.0 held by the lockfile (K-0082 option A) is named in deliverable step third; row 36's run on Node 22.23.0 with ICU 78.2 and its count of 3 recorded; the open questions "Which Node line" and "What `index.ts` exports in 1b" marked settled by the build (`>=22.23.0 <23`, `.nvmrc` 22; the checks exported, `readPage` not). No row, rule or number changes. Review: tech notes §1 (`index.ts` exports) and §14 row 38; the G3 packet.
- v1.4 (2026-10-27): follows ORV-128 spec v1.12, the review round 0 changes on PR 130 at e21b10a (R1 to R8, SEC-133-1 to SEC-133-7, decided by the orchestrator under ADR 0012 decision 4, open for the owner). Rows 5, 6, 7 and 36 copied again from v1.12 with their numbers and test names: userinfo, ports, the new address ranges and IPv4-translated addresses (row 5); the robots.txt group and token cases, the robots.txt redirect and the hostile patterns (row 6); no credential in any request or result URL, and a deeply nested document (row 7); a heading-heavy page and a deeply nested document (row 36). "Rules and bounds" points by name to `robots-token-1`, `robots-group-1`, `robots-match-1` and the Depth bound, and the Address check row names its new parts; deliverable step first names them; "What this slice uses" and "Depends on" cite v1.12; "Worked examples" points to the parent's six new lines without copying them. No rule is defined here. Review: tech notes §6, §8 and §14 rows 5, 6, 7 and 36; `read-page.ts`, `read-page.test.ts`, `page-text.ts`, `page-text.test.ts` (the slice 1b fix); the `security` and reviewer re-review of PR 130; the ORV-133 Jira issue acceptance.
- v1.5 (2026-10-27): bookkeeping after the slice 1b rework (f07bb5d). Deliverable steps first and second name the shapes as built: `pageTextOf` returns `{ blocks, incomplete }` and `stylesheetLinksOf` returns `{ hrefs, incomplete }` (the Heading bound and the Depth bound report `page-incomplete` through `incomplete`), and `ReadPorts.resolve` takes `(host, budgetMs)`. The parent stays cited at v1.12; no row, rule or number changes. Review: tech notes §6 (`resolve(host)`, the second resolve per robots.txt origin) and §8 (`pageTextOf` returning `TextBlock[]`).
- v1.6 (2026-10-27): follows ORV-128 spec v1.13, the RFC 9309 check (RFC-1 to RFC-4, decided by the orchestrator under ADR 0012 decision 4, open for the owner). The parent is cited at v1.13 in the front matter, "What this slice uses", "Rules and bounds" and "Depends on". The parent's robots.txt Answers now says the rules of a robots.txt reached through a redirect apply in the context of the initial authority, and its "Hypotheses" record the digits in `robots-token-1` and the robots.txt redirect bound; this spec points to them by name and restates neither. Rows stay as copied from v1.12, which v1.13 does not change. Review: `read-page.ts` and `read-page.test.ts` row 6 (the robots.txt redirect case against the initial authority); the slice 1b fix runs the parent's `robots-token-1` line with its new value.
