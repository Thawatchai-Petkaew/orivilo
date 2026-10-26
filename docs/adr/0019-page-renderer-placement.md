# ADR 0019: Where the page reader and the page renderer run

- Status: proposed. It becomes accepted in three steps. (1) Decision 6 (the tokenizer) is accepted when ORV-128 slice 1b merges into `develop` with the tokenizer pinned exactly, after its `research` entry records the licence, version and dependencies and `security` has reviewed the PR that adds it. (2) The POC part (decisions 1 to 4) is accepted when ORV-128 slice 1d merges into `develop` with rows 34, 35 and 37 of spec v1.4 green in `packages/page-reader` (row 34's budget test and the row 35 and 37 renderer tests named in the Confirmation line). Slice 1d is `packages/page-reader` as its own PR right after slice 1c, decided by the orchestrator at G2 under ADR 0012 decision 4 and open for the owner at G2 (ORV-128 comment 10209); slice 1c, the engine part, does not accept it. This settles finding F14 of the tech notes (applied by tasks `ORV-128-arch-renderer-2` and `ORV-128-arch-renderer-3`): the accepting PR is named, not left to the size of 1c's diff. (3) The Vercel part (decision 5) stays proposed until the staging measurement in the Confirmation line is recorded here as an addition; until then no Vercel route launches a browser.
- Date: 2026-10-26.
- Decided by: the ORV-128 spec leaves the renderer and the fetcher placement to the architect at G2 as a must-ask (`docs/specs/ORV-128/spec.md`, "Gap list", Technical). The owner decided D1 (a), one page the person submits is read before the lawyer review, and D2 (a), the first slice is the schema plus the URL analyser with no model (ORV-128 comment 10209). The `architect` role wrote this ADR (task `ORV-128-arch-renderer-1`).
- Builds on: ADR 0001 (Vercel, Next.js), ADR 0002 (only server code reaches outside data), ADR 0009 point 8 (tests never reach the network), ADR 0015 decision 2 (`security` reviews a diff that adds a runtime dependency) and decision 11 (a user's HTML is never rendered inline). None is superseded.

## Context

ORV-128 slice 1 reads one web page the person submits and measures it: colour area shares on the rendered first screen and full page, contrast pairs, text and element density, font families and the visible text. The engine (`packages/intent-engine`) is pure TypeScript and defines two contracts for the parts that touch the outside world (tech notes §6 and §7):

- `ReadPorts`: DNS resolution, an HTTP request pinned to a checked address, SHA-256 and a monotonic clock. `readPage` runs the address check, robots.txt and the bounds over these ports.
- `renderSnapshotSchema`: what a renderer hands back after it lays out the page, parsed by the engine as untrusted data.

Someone has to implement both, server-side, and decide where they run. The POC's acceptance test is a command, `pnpm analyse:url <url>`, run on the owner's machine, with no screen (spec, "The owner's acceptance test"; POC focus is function). A Vercel route that runs the same analysis for a signed-in person is a later slice; no story asks for it yet.

## Facts and how they were checked

| Fact                                                                                                                                                                                                                               | Entry        | State                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------- |
| A Vercel function has a 250 MB uncompressed bundle limit, 300 s default and maximum duration on Hobby (800 s maximum on Pro), and 2 GB / 1 vCPU memory on Hobby that cannot be changed (4 GB / 2 vCPU on Pro)                      | K-0081 (0.8) | Fact (Vercel docs, stated for fluid compute)    |
| Vercel's own guide and template give a function a Chromium through `puppeteer-core` and `@sparticuz/chromium-min`, with the Chromium pack served as a static file and fetched by URL at launch; the template code shows no licence | K-0081       | Fact (guide read in part, template read)        |
| `@sparticuz/chromium` 153.0.0 (MIT) ships Chromium 153.0.8010.36, x64 only, 70091665 bytes unpacked, needs Node `^22.17.0 \|\| >=24.0.0`, asks for at least 512 MB and recommends 1600 MB, and does not follow semantic versioning | K-0081       | Fact (registry and repo)                        |
| Puppeteer's supported-browsers table pairs `puppeteer-core` 25.11.0 with Chromium 153.0.8010.36; the latest `puppeteer-core` (25.16.0) expects 156                                                                                 | K-0081       | Fact (pptr.dev)                                 |
| Playwright 1.64 expects Chromium 156, and its docs say an outside Chromium is used "at your own risk"                                                                                                                              | K-0081       | Fact (playwright.dev)                           |
| Next.js opts `@sparticuz/chromium`, `puppeteer-core` and `playwright-core` out of bundling automatically                                                                                                                           | K-0081       | Fact (Next.js docs)                             |
| The time and memory of one page render in a Vercel function, the CPU architecture of a Vercel function, and whether the full package fits under 250 MB once the app is traced in                                                   | K-0081       | **Not documented.** Needs a staging measurement |
| Playwright 1.56.1 is already a pinned dev dependency of `packages/design-system`, and CI already installs its Chromium (`.github/workflows/ci.yml` line 57)                                                                        | repo         | Fact (`grep` in this repo)                      |

## Options

From K-0081, plus the POC shape the task set.

|                | A. `@sparticuz/chromium-min` + `puppeteer-core`, pack served by URL                                               | B. `@sparticuz/chromium` (full) + `puppeteer-core` 25.11.0                         | C. `@sparticuz/chromium` + `playwright-core`                  | D. No browser: the read bytes, labelled                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Runs on Vercel | Vercel's documented route                                                                                         | Likely (Next.js leaves both packages unbundled); fit under 250 MB unmeasured       | Likely; driver and browser versions unsupported               | Yes, no binary                                                   |
| Measures       | All of §8                                                                                                         | All of §8                                                                          | All of §8                                                     | No rendered measure; what it keeps is the spec's "Where it runs" |
| Supply chain   | A binary pack fetched by URL on a cold start, an input we would have to pin by hash; template code has no licence | Two MIT and Apache-2.0 packages, pinned exact; binary arrives through the lockfile | Same as B, plus a version pairing Playwright does not support | Nothing new                                                      |
| Version match  | Driver version not pinned by the guide                                                                            | Puppeteer's own table pairs the two                                                | 1.64 expects 156; the package ships 153                       | Not applicable                                                   |
| Cost known     | No (K-0081: no measured render)                                                                                   | No                                                                                 | No                                                            | Yes, a CSS parse                                                 |

For the POC command there is one more option, **P: Playwright 1.56.1 with its own bundled Chromium, on the machine that runs the command.** It is already installed and pinned in this repo, its driver and browser match by construction, and it needs no Vercel limit at all because no function runs.

## Decision

### 1. The reader and the renderer live in a new server-only package, `packages/page-reader`

`@orivilo/page-reader` (private, Node only, never imported by client code) holds:

- `src/node-ports.ts`: `ReadPorts` on `node:dns/promises`, `node:http` and `node:https` with the socket connected to the address `readPage` checked (a second DNS answer cannot swap it), `node:crypto` for SHA-256, and `performance.now()` for `elapsedMs`. No new runtime dependency.
- `src/render-playwright.ts`: a `Renderer` for the POC (decision 3).
- `src/cli.ts`: the `pnpm analyse:url` command. It wires `readUrlInput` (the gate of rule `competitor-not-read-1` in front of `readPage`, tech notes §7), the renderer and `analyseUrl`, prints the report in English and Thai, and prints JSON with `--json`.

The engine stays pure: it defines `ReadPorts`, the `Renderer` port (`render(read) => Promise<unknown>`, the result parsed with `renderSnapshotSchema`) and every measure, and never imports this package. A package, not a folder in `apps/web`, because the command must run without Next.js, and a later Vercel route imports the same ports from it. The package has its own lint, typecheck and test tasks under Turborepo.

### 2. The renderer never fetches

The renderer receives the bytes `readPage` already fetched (the document and at most 10 stylesheets) and nothing else reaches it:

- Every request the browser makes is intercepted. The document URL and each read stylesheet URL are answered from memory with the read bytes; every other request (images, fonts, scripts, frames, anything) is aborted. No request leaves the process, so the address check, robots.txt and the bounds of `readPage` are the only path to the network (spec, "Read": "every network request blocked").
- JavaScript is off for the page.
- One fresh browser context per analysis, closed in a `finally`. No cookie, storage or cache survives it.
- The viewport is 1280 x 800 (§7). The render runs within what is left of the read's 30 s budget, measured by the same `elapsedMs`. Past it, the render is abandoned and the analysis continues as option D (decision 4).
- The rendered raster and the DOM live in memory for the run only (spec, "Kept only as evidence").

### 3. In the POC the renderer is Playwright 1.56.1 on the local machine (option P)

`packages/page-reader` pins `playwright` at exactly `1.56.1`, the version `packages/design-system` already pins, so the lockfile gains no new version. It is a dev dependency: the command is a local tool and is never deployed. The browser is Playwright's own bundled Chromium, so driver and browser match. `apps/web` does not depend on `@orivilo/page-reader` in the POC, and no Vercel function launches a browser.

### 4. Option D is the fallback everywhere, and it is labelled

When the page is not rendered, the analysis does not stop: it runs on the read bytes and labels what it could not measure, and nothing derived from CSS alone is presented as a rendered measure. This holds in the POC command and in any later Vercel route. What option D keeps, what it lists as not measured and the reasons it gives are not restated here; their one home is the spec, section "Reading a page the person submits", paragraph "Where it runs" (`docs/specs/ORV-128/spec.md`, row 34), designed in the tech notes §7.

### 5. On Vercel, option B, behind a staging measurement

When a later slice adds a Vercel route, its renderer is `src/render-chromium.ts` in the same package, implementing the same `Renderer` port with:

- `@sparticuz/chromium` pinned exactly at `153.0.0` (full package, the binary inside the bundle);
- `puppeteer-core` pinned exactly at `25.11.0`, the version Puppeteer's table pairs with Chromium 153.0.8010.36;
- the Node.js runtime (never Edge) on Node 24.x, which meets the package's engine range, and `maxDuration` set on the route;
- decision 2 unchanged: intercept every request, JavaScript off, a fresh context per analysis. A browser kept in module scope between invocations is allowed only if the context is new each time.

The two packages move only together, and only to a pair Puppeteer's table lists. Until the staging measurement in the Confirmation line is recorded here, the Vercel route runs option D and says so.

### 6. Stylesheet links are read by a tokenizer in the engine

`readPage` (slice 1b) must find stylesheet links before any renderer exists, and option D has no browser at all. So the HTML tokenizer belongs in the engine, pure, with no Node import, pinned exactly. The candidate is `parse5` (tech notes §6). No knowledge entry yet records its licence, version or dependencies; slice 1b adds it only after a `research` entry does, and `security` reviews it.

## Consequences

- **Two renderers behind one port.** The POC renders with Playwright's Chromium, a later Vercel route with Chromium 153 through Puppeteer. Different builds may lay out a page slightly differently, so the same URL can give slightly different area shares between the command and the route. Evidence stays deterministic within one renderer; the snapshot should name the renderer build so a measure is traceable to it (raised for the `ds-architect`, see tech notes §13).
- **New dependencies, each reviewed.** POC: `playwright` 1.56.1 in a new package (version already in the lockfile), and `parse5` once researched. Vercel slice: `@sparticuz/chromium` 153.0.0 and `puppeteer-core` 25.11.0, both runtime. Each PR that adds one dispatches `security` (ADR 0015 decision 2) for the supply chain: licence, pinned exact version, install scripts and what the package reaches at run time.
- **The command needs a TypeScript runner.** The engine's imports are written without `.ts` extensions, so Node's type stripping alone does not run the command against it. Either the engine's import style changes, or a pinned runner is added; that runner is a new dev dependency that needs its own entry and review. Left open in tech notes §13.
- **CI.** The page-reader render tests need the Chromium CI already installs for Playwright 1.56.1 (`ci.yml` line 57). If they cannot find it, the install step gains the page-reader filter.
- **Security rules path.** `.claude/rules/security.md` loads for `apps/web/**/server/**` and `packages/db/**`, not for `packages/page-reader/**`. Adding that path is a follow-up for the rule owner.
- **No model.** Nothing here calls a model (D2 (a)); the renderer is code measuring a page.
- **One page only.** The reader reads the one URL the person submitted, its robots.txt and its stylesheets; it never follows links (D1 (a)).

## Not chosen

- **A. `chromium-min` with a pack served by URL.** Vercel's documented route, and the smallest bundle, but every cold start downloads a binary from a URL. That is a supply-chain input we would have to pin by hash and host, and the template code has no licence to copy. Revisit if B does not fit 250 MB.
- **C. `@sparticuz/chromium` with `playwright-core`.** It would keep one driver everywhere, but Playwright calls an outside Chromium "at your own risk" and the current versions do not match (156 against 153).
- **D as the only renderer.** Safe and cheap, but it loses every rendered measure the spec asks for (area share, contrast, density). It is the fallback, not the plan.
- **The renderer inside `apps/web/server`.** The command would need Next.js to run, and Playwright would join the web app's dependency tree.
- **The renderer fetching the page itself.** It would bypass the address check, robots.txt and the bounds of `readPage`.

## Impact list

- New package `packages/page-reader` (decision 1): `node-ports.ts`, `render-playwright.ts`, `cli.ts`, tests; root script `analyse:url`.
- `packages/intent-engine`: a `Renderer` port type beside `renderSnapshotSchema`; `analyseUrl` accepts "no snapshot" (decision 4); `parse5` pinned once researched (decision 6).
- `apps/web`: nothing in the POC. The Vercel slice adds a route on the Node.js runtime with `maxDuration`, the session check, the rate limit and the two pinned packages.
- `pnpm-lock.yaml`: a new importer for `packages/page-reader`; no new Playwright version.
- `.claude/rules/security.md`: path `packages/page-reader/**`, follow-up.

Confirmation: not confirmed yet. POC part (decisions 1 to 4): slice 1d, the `packages/page-reader` PR right after slice 1c (F14), carries rows 34, 35 and 37 of spec v1.4 and adds tests that fail `pnpm test` when a render of a local fixture lets any request leave the process (a fixture with an outside image, font, script and iframe URL records zero outgoing requests), when an inline script runs (a fixture whose script repaints the background must keep the CSS colour), when a context survives between two renders (a cookie set in the first is absent in the second), when a render past the budget does not fall back to option D as the spec's "Where it runs" defines it (row 34's budget test), and when a local render's text box paths do not match the tokenized document or its snapshot does not name the renderer build (row 35); the request, script and context tests are row 37; and `security` reviews slice 1d, which adds `playwright` to the package. Decision 6, at slice 1b: the tokenizer's `research` entry exists before 1b adds it, `security` reviews 1b, and row 36 (`html-text-1`) passes on it. Vercel part (decision 5), follow-up: the Vercel route slice records here, from the staging deployment, (a) the function bundle size from the build output, under 250 MB, (b) the render time and (c) the peak memory (`process.memoryUsage().rss`, logged by the route) of 20 analyses of one recorded page with 10 stylesheets, 10 of them on a cold start, each within the 30 s read budget and under 1600 MB, on the plan the project runs; K-0081 says no source gives these numbers. Until that addition, decision 5 is not confirmed and the Vercel route runs option D.
