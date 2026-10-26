---
id: K-0081
topic: platform
claim: A Vercel Node.js function can be given a headless Chromium through the community package @sparticuz/chromium (MIT, 153.0.0, Chromium 153.0.8010.36) or its -min variant with puppeteer-core, which Vercel's own guide names; the documented bounds are a 250 MB uncompressed bundle (5 GB in a Large functions beta), 300 s default and maximum duration on Hobby (800 s on Pro), and 2 GB / 1 vCPU memory on Hobby (up to 4 GB / 2 vCPU on Pro), while the package asks for at least 512 MB and recommends 1600 MB.
source: "https://vercel.com/docs/functions/limitations; https://vercel.com/docs/functions/configuring-functions/duration; https://vercel.com/docs/functions/configuring-functions/memory; https://vercel.com/docs/fluid-compute; https://vercel.com/docs/functions/runtimes/node-js/node-js-versions; https://vercel.com/kb/guide/deploying-puppeteer-with-nextjs-on-vercel; https://vercel.com/templates/next.js/puppeteer-on-vercel; https://github.com/gabenunez/puppeteer-on-vercel (README.md, package.json, scripts/postinstall.mjs, app/api/screenshot/route.ts); https://registry.npmjs.org/@sparticuz/chromium/latest; https://registry.npmjs.org/@sparticuz/chromium-min/latest; https://github.com/Sparticuz/chromium (README.md); https://github.com/Sparticuz/chromium/releases; https://registry.npmjs.org/puppeteer-core/latest; https://registry.npmjs.org/playwright-core/latest; https://pptr.dev/supported-browsers; https://playwright.dev/docs/release-notes; https://playwright.dev/docs/api/class-browsertype; https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-128]
license: own-words
---

## Evidence

Vercel's docs carry no reuse licence (as K-0015 notes), so this file is in our words with short quotes. The npm packages are MIT (`@sparticuz/chromium`) and Apache-2.0 (`puppeteer-core`, `playwright-core`) by their registry records; only facts are taken from them. Confidence is 0.8: the Vercel limits come from one publisher read on several pages, and the package facts from each package's own registry record and repo. **No source read here shows a page render measured on a Vercel deployment** (time to launch, memory used); that stays open until a staging run measures it.

### 1. Vercel function limits (limits page `last_updated: 2026-08-24`, duration page `2026-08-24`, memory page `2026-07-15`)

The limits page states its table applies to functions "with Fluid compute"; the fluid compute page says "As of April 23, 2025, fluid compute is enabled by default for new projects."

- **Bundle size, uncompressed:** 250 MB on every plan (limits page); up to 5 GB with Large functions, a beta (limits page).
- **Duration, default and maximum:** Hobby 300 s and 300 s; Pro 300 s and 800 s, with a 1800 s extended maximum in beta (limits page and duration page).
- **Memory and CPU:** Hobby 2 GB / 1 vCPU, not changeable; Pro 2 GB / 1 vCPU by default, 4 GB / 2 vCPU as "Performance" (memory page).
- **Request or response body:** 4.5 MB (limits page).
- **File descriptors:** 1,024 shared across concurrent executions (limits page).

Short quotes:

> For Vercel Functions, the maximum uncompressed size is **250 MB** including layers

> Large functions require fluid compute with Active CPU enabled. Fluid compute is enabled by default for new projects.

> Users on the Hobby plan can only use the default memory size of 2 GB (1 vCPU). **Hobby users cannot configure this size**.

> You cannot set your memory size using `vercel.json`.

In Next.js App Router the duration is set per route with `export const maxDuration = <seconds>` (duration page example). Large functions is a beta that new projects get by default, or that the `VERCEL_SUPPORT_LARGE_FUNCTIONS` environment variable switches on or off (limits page). The 1800 s extended maximum is listed for `nodejs22.x` and `nodejs24.x` on Pro and Enterprise only (duration page).

Fluid compute lets "multiple invocations to share a single function instance" on Node.js (fluid compute page), so a browser kept in module scope may be reused by later requests on the same instance; the page does not discuss a browser process.

### 2. Node.js runtime versions (versions page `last_updated: 2026-02-27`)

Available: "**24.x** (default)" and "**22.x**". "Only major versions are available. Vercel automatically rolls out minor and patch updates". The page names no operating system or CPU architecture.

### 3. Vercel's documented route: puppeteer-core with @sparticuz/chromium-min

Vercel's knowledge-base guide (`last_updated: 2025-11-10`) installs `puppeteer-core` and `@sparticuz/chromium-min`, with no version pinned, and says:

> To successfully run Puppeteer in a Vercel Function, you must address the function bundle size limitation (250MB).

Only part of the guide's text came back from the fetch: its code blocks were not returned, and the page as read does not mention Playwright, Hobby, Pro, memory or duration.

Vercel's template page "Puppeteer on Vercel" links the repo `gabenunez/puppeteer-on-vercel`, which says it "Uses @sparticuz/chromium-min with a pre-packaged Chromium binary". What its files show:

- `package.json`: runtime dependencies `@sparticuz/chromium-min`, `puppeteer-core` and Next.js 16.0.7; the full `@sparticuz/chromium` and `puppeteer` only as dev dependencies.
- `scripts/postinstall.mjs`: tars `node_modules/@sparticuz/chromium/bin/` into `public/chromium-pack.tar`, so the pack is served as a static file, not bundled into the function.
- `app/api/screenshot/route.ts`: `chromium.executablePath(CHROMIUM_PACK_URL)`, where the URL is built from `VERCEL_PROJECT_PRODUCTION_URL`, then `puppeteer.launch` with `args: chromium.args` and `headless: true`. No `maxDuration` or `runtime` export. Locally it imports full `puppeteer` instead.
- The repo shows no LICENSE file and no licence statement, so its code is link-only to us.

**Conflict:** the template README says "Vercel functions have a 10-second timeout on the Hobby plan", and the template page repeats it. The current limits and duration pages say 300 s default and maximum on Hobby with fluid compute. The docs pages are dated 2026-08-24; the template carries no date.

### 4. The package (registry `latest` records and repo)

- `@sparticuz/chromium`: version 153.0.0, licence MIT, `engines.node` `^22.17.0 || >=24.0.0`, `dist.unpackedSize` 70091665 bytes, description "Chromium Binary for Serverless Platforms".
- `@sparticuz/chromium-min`: version 153.0.0, licence MIT, same `engines.node`, `dist.unpackedSize` 46031 bytes.
- `puppeteer-core`: version 25.16.0, licence Apache-2.0, `engines.node` `>=22.12.0`.
- `playwright-core`: version 1.64.1, licence Apache-2.0, `engines.node` `>=20`.

Releases page: v153.0.0 is marked "Latest", with "chore: bump Chromium to 153.0.8010.36 (revision 1681091)". The release entry shows "11 Sep" without a year.

From the `Sparticuz/chromium` README:

> You should allocate at least 512 MB of RAM to your instance; however, 1600 MB (or more) is recommended.

> The npm package (`@sparticuz/chromium`) includes only x64 binaries.

> The -min package does NOT include the Chromium Brotli files.

> Because this package follows Chromium's release cycle, it does NOT follow semantic versioning.

The README gives the uncompressed Chromium binary as 130.62 MiB and the Brotli level 11 file as 33.21 MiB. It says the package "is not tied to specific `puppeteer` versions". It names AWS Lambda ("works with all currently supported AWS Lambda Node.js runtimes out of the box") and does not mention Vercel. It shows a Playwright launch with `args: chromium.args`, and warns that "Playwright does not automatically clean up its user data directory between invocations on a warm Lambda."

### 5. Version match with the drivers

- Puppeteer's supported-browsers page maps `v25.16.0` to Chrome for Testing `156.0.8078.47`, and `v25.11.0` to `153.0.8010.36`, the build in `@sparticuz/chromium` 153.0.0. The page says that for an unlisted version "the supported version of the browser is that for the immediately prior version."
- Playwright 1.64 release notes list "Chromium 156.0.8078.4". On `executablePath`, the `BrowserType` page says: "Note that Playwright only works with the bundled Chromium, Firefox or WebKit, use at your own risk."

So the latest `puppeteer-core` and `playwright-core` each expect Chromium 156, three majors past the 153 build in the latest `@sparticuz/chromium`. Puppeteer's own table pairs that build with 25.11.0; Playwright documents no supported pairing with an outside build.

### 6. Next.js bundling

The `serverExternalPackages` page (`lastUpdated: 2025-12-05`) lists `@sparticuz/chromium`, `@sparticuz/chromium-min`, `puppeteer-core`, `puppeteer`, `playwright` and `playwright-core` among the packages Next.js opts out of bundling automatically. The limits page says Next.js projects use `outputFileTracingIncludes`, not `includeFiles`, to bring extra files into a function.

### What the sources read do not say

- **The render cost on Vercel.** No page gives cold-start time, launch time or memory use of Chromium in a Vercel function. Whether one page render with 10 stylesheets fits the spec's 30 s budget and 2 GB on Hobby is not documented; it needs a staging measurement.
- **The limits without fluid compute.** The limits and duration tables read here are stated for fluid compute only; this project's fluid setting was not checked.
- **CPU architecture and OS of Vercel functions.** The pages read name neither. The npm package ships x64 only; arm64 comes as a separate pack in each GitHub release.
- **Where the binary is unpacked and how much `/tmp` space there is.** Not stated on the pages read.
- **The exact Node 22 minor on Vercel.** The package needs 22.17.0 or later on the 22 line; Vercel offers "22.x" and rolls minors itself. Node 24.x, the default, meets the range.
- **Whether a full `@sparticuz/chromium` bundle (about 70 MB unpacked in the registry) stays under 250 MB once Next.js and the app are traced in.** Our arithmetic only; the real function size shows in a build.

### Options this evidence supports (not a decision)

- **A. `@sparticuz/chromium-min` with `puppeteer-core`, the pack served from `public/` or a URL** (the Vercel template pattern). Backed by: Vercel's guide names these two packages; the template code shows the pattern; the function bundle stays small. Gap: the pack is fetched on a cold start; a pack URL is a supply-chain input to pin; the template code has no licence.
- **B. `@sparticuz/chromium` (full, 70091665 bytes unpacked) with `puppeteer-core` pinned to 25.11.0.** Backed by: MIT; Puppeteer's table pairs 25.11.0 with Chromium 153.0.8010.36; Next.js opts both packages out of bundling. Gap: fit under 250 MB not measured; five minors behind the latest `puppeteer-core`.
- **C. `@sparticuz/chromium` with `playwright-core`.** Backed by: the package README shows a Playwright launch. Gap: Playwright calls an outside Chromium "at your own risk"; 1.64 expects Chromium 156.
- **D. No browser in the function: the fallback the spec names** (declared colours measured from CSS, labelled as such; `docs/specs/ORV-128/spec.md`, section "Reading a page the person submits", paragraph "Where it runs"). Gap: no rendered measure.

## Why it matters for ORIVILO

ORV-128's spec leaves where the page renderer runs to the architect at G2, against Vercel function limits. The documented bounds (250 MB, 300 s and 2 GB on Hobby) do not by themselves rule out a headless Chromium for a read bounded at 30 s, and Vercel documents a route for it; what is not documented is the render's real time and memory on a function, and the version match between the Chromium build and the newest drivers. Which route to take is for the architect.
