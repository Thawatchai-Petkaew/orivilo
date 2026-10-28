---
id: K-0088
topic: platform
claim: "@material/material-color-utilities 0.4.0 (npm latest, published 2026-01-21, Apache-2.0, an ES module package whose exports map has one entry, with its own .d.ts types, no engines field, no runtime dependencies, 138 files and 1,064,332 bytes unpacked by its registry record, one registry signature and no provenance attestation found) exposes QuantizerCelebi.quantize(pixels: number[], maxColors: number): Map<number, number>, which runs QuantizerWu and then QuantizerWsmeans; in the TypeScript code of that version QuantizerWsmeans gives each distinct pixel a starting cluster from unseeded Math.random even when Wu supplies the starting clusters, and QuantizerCelebi run 20 times on one pixel array gave up to 20 different results (task ORV-134-design-quantiser-1, tech notes ORV-128 §8), while the Java port on main seeds its generator with 0x42688 and QuantizerWu calls no random source."
source: "https://registry.npmjs.org/@material/material-color-utilities/latest; https://registry.npmjs.org/@material/material-color-utilities; https://registry.npmjs.org/@material/material-color-utilities/0.4.0; https://registry.npmjs.org/-/npm/v1/keys; https://registry.npmjs.org/-/npm/v1/attestations/@material%2fmaterial-color-utilities@0.4.0 (HTTP 404); https://data.jsdelivr.com/v1/packages/npm/@material/material-color-utilities@0.4.0?structure=flat; https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.4.0/ (index.js, quantize/quantizer_celebi.js, quantize/quantizer_celebi.d.ts, quantize/quantizer_wsmeans.js, quantize/quantizer_wsmeans.d.ts, quantize/quantizer_wu.js, quantize/quantizer_wu.d.ts, quantize/quantizer_map.js, quantize/lab_point_provider.js, quantize/point_provider.js, utils/color_utils.js, utils/color_utils.d.ts, utils/string_utils.js, utils/string_utils.d.ts, utils/math_utils.js, utils/image_utils.js, dynamiccolor/dynamic_scheme.js, LICENSE, README.md); https://github.com/material-foundation/material-color-utilities (repo page); https://github.com/material-foundation/material-color-utilities/commits/main/typescript; https://github.com/material-foundation/material-color-utilities/issues/132; https://raw.githubusercontent.com/material-foundation/material-color-utilities/eeaf82b8e11bf20f6d8da7c76336575b69e79e01/typescript/tsconfig.json; https://raw.githubusercontent.com/material-foundation/material-color-utilities/eeaf82b8e11bf20f6d8da7c76336575b69e79e01/typescript/quantize/quantizer_wsmeans.ts; https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/quantize/quantizer_wsmeans.ts; https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/typescript/package.json; https://raw.githubusercontent.com/material-foundation/material-color-utilities/main/java/quantize/QuantizerWsmeans.java; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort; https://nodejs.org/api/packages.html; https://docs.npmjs.com/about-registry-signatures; https://docs.npmjs.com/generating-provenance-statements; docs/specs/ORV-128/tech.md (line 768 and line 980 before task ORV-134-design-quantiser-1; after it, §8 Colour lines 769 and 772 to 775, line 1005, line 1030 and Findings row F41 line 1323); docs/knowledge/architecture/K-0021-material-color-utilities-hct-deterministic-schemes.md"
retrieved: 2026-10-28
confidence: 0.8
applies_to: [ORV-134, ORV-128]
license: own-words
---

## Evidence

The package is Apache-2.0, which is not on this folder's licence list, so this file states facts in our own words with short quotes, as [[K-0021-material-color-utilities-hct-deterministic-schemes]] does. K-0021 is cited here, not changed. Confidence is 0.8: each fact comes from one publisher's own record (the npm registry record, the package files as published and served by jsDelivr, or the GitHub repo), read through a fetch tool that answered questions about each page or file and quoted lines from it; no file was opened byte by byte and no code was run for this entry's own reading. The run-to-run figures in the claim are not this entry's: they come from task ORV-134-design-quantiser-1, as the tech notes record it (ORV-128 §8, line 773). Where this entry says what the code does when run, that is our reading of the lines quoted, not a measurement.

### 1. Version, date and licence (registry records)

- `latest`: `"version":"0.4.0"`, `"license":"Apache-2.0"`. `dist-tags` is `{"latest":"0.4.0"}`, the only tag.
- The `time` field gives `0.4.0` as `2026-01-21T18:35:58.484Z` and `0.3.0` as `2024-06-24T14:16:05.176Z`. The record lists 13 versions, `0.1.0` to `0.4.0`; `0.4.0` is the newest. The gap from 0.3.0 to 0.4.0 is about 19 months (own arithmetic from those two dates).
- The `0.4.0` record names `"gitHead":"eeaf82b8e11bf20f6d8da7c76336575b69e79e01"`, `repository.directory` `"typescript"`, and `_npmUser` `google-wombot`.
- The published `LICENSE` begins "Apache License", "Version 2.0, January 2004". Each source file read opens with "Copyright 2021 Google LLC" and "Licensed under the Apache License, Version 2.0".

### 2. Module format, Node version and types

- The record has `"type":"module"`, `"main":"index.js"`, `"module":"index.js"`, `"types":"index.d.ts"` and `exports` `{".":{"types":"./index.d.ts","import":"./index.js","default":"./index.js"}}`. There is no `require` condition, and the file listing (section 4) has no `.cjs` file. The Node docs (v26.12.1 page): "Files ending with `.js` are loaded as ES modules when the nearest parent `package.json` file contains a top-level field `"type"` with a value of `"module"`."
- The exports map has one entry, `"."`. The Node docs: "When the `"exports"` field is defined, all subpaths of the package are encapsulated and no longer available to importers. For example, `require('pkg/subpath.js')` throws an `ERR_PACKAGE_PATH_NOT_EXPORTED` error." So by those docs an import of a subpath such as `quantize/quantizer_celebi.js` is refused, and `QuantizerCelebi` is reached through the root `index.js`. That file has 34 `export * from` lines, among them `./quantize/quantizer_celebi.js`, `./utils/color_utils.js` and `./utils/string_utils.js`. By the tech notes (ORV-128 §8, task ORV-134-design-quantiser-1), the root `index.js` itself fails to load under plain Node 22.23.0 (`ERR_MODULE_NOT_FOUND`): ten files under `scheme/` and `dynamiccolor/` import `../dynamiccolor/dynamic_scheme` or `./dynamic_color` with no `.js` (upstream issue #195, open since 2026-01-29, of which the task read only the title); Vitest 5.0.5 loads it.
- The `0.4.0` record has no `engines` field, so the package states no Node version. The `tsconfig.json` at the gitHead commit has `"target": "es2020"`, `"module": "es2015"`, `"declaration": true`, `"importHelpers": true` and `"strictNullChecks": false`. The published `quantizer_map.js` uses `??` (`countByColor.set(pixel, (countByColor.get(pixel) ?? 0) + 1);`).
- Types ship in the package: 45 `.d.ts` files beside the 45 `.js` files (section 4). The `devDependencies` name `"typescript":"^4.5.5"`, which built them.

### 3. Runtime dependencies: none

- The `0.4.0` record has no `dependencies`, `peerDependencies`, `optionalDependencies` or `bundleDependencies` field. `devDependencies` are `wireit`, `jasmine`, `typescript`, `@types/node` and `@types/jasmine`. The `typescript/package.json` on `main` also has no `dependencies` field and gives `"version": "0.4.0"`.
- `importHelpers` is on in the tsconfig, which can make compiled files import `tslib`. In the files read, no import names `tslib`: every import line in `quantizer_celebi.js`, `quantizer_wsmeans.js`, `quantizer_wu.js`, `quantizer_map.js`, `lab_point_provider.js`, `color_utils.js`, `string_utils.js`, `image_utils.js` and `dynamiccolor/dynamic_scheme.js` is relative, `math_utils.js` and `point_provider.js` import nothing, and the 34 `export * from` lines of `index.js` all name `./` paths. The other 33 `.js` files were not read for imports.
- Scripts are `build`, `build:ts` and `prepublishOnly` (`npm run build`); there is no `preinstall`, `install` or `postinstall`.
- Neither this package nor any version of it appears in the repo's `pnpm-lock.yaml` or any `package.json` today (search for `material-color-utilities`: no match).

### 4. Size

- Registry record: `dist.fileCount` 138, `dist.unpackedSize` 1064332 (1,064,332 bytes). The registry record gives no packed tarball size.
- The jsDelivr listing for `0.4.0` has 138 files: 45 `.js`, 45 `.d.ts`, 45 `.js.map`, plus `LICENSE`, `README.md` and `package.json`.
- The 45 `.js` files total 330,260 bytes (own arithmetic, summing the sizes in that listing). The files the quantiser path imports, by the import lines read (`quantizer_celebi.js` 2,134, `quantizer_wsmeans.js` 9,034, `quantizer_wu.js` 15,917, `quantizer_map.js` 1,692, `lab_point_provider.js` 1,834, `color_utils.js` 7,905, `math_utils.js` 3,677 bytes), total 42,193 bytes, and 44,772 with `string_utils.js` (2,579) for the hex helpers (own arithmetic, same listing). Because of the exports map (section 2), Node loads them through `index.js`, which re-exports the other modules too.

### 5. Maintenance of the TypeScript port

- The repo page shows 287 commits, 91 open issues, 16 open pull requests and 2.3k stars (page-reported, read 2026-10-28). Its README table lists TypeScript as available. The package README: "This repo is not accepting external contributions, but feature requests and bug reports are welcome on GitHub."
- The commit list for `typescript/` on `main` shows its newest commit on Oct 15, 2026 ("Update Watch dynamic colors and SchemeContent across Java, Kotlin, and TypeScript."). Of the 30 commits on that page, 9 are dated after the 0.4.0 publish date (count over that page), and the registry has no version after 0.4.0. The commit of Jan 16, 2026 reads "Update MCU package version to v0.4.0 so a fresh version can be released on npm. The latest published 0.3.0 is from 2 years ago, very old." None of the 30 titles names a quantiser; the code of those commits was not read.

### 6. The public API of `QuantizerCelebi` (0.4.0)

`quantize/quantizer_celebi.d.ts` documents `pixels` as "Colors in ARGB format." and `maxColors` as "The number of colors to divide the image into. A lower number of colors may be returned." Then:

```ts
 * @return Map with keys of colors in ARGB format, and values of number of
 *     pixels in the original image that correspond to the color in the
 *     quantized image.
 */
static quantize(pixels: number[], maxColors: number): Map<number, number>;
```

It is a static method on a class used as a namespace. `quantizer_celebi.js` runs Wu first and gives its result to Wsmeans as the starting clusters:

```js
const wu = new QuantizerWu();
const wuResult = wu.quantize(pixels, maxColors);
return QuantizerWsmeans.quantize(pixels, wuResult, maxColors);
```

The library's own image path calls it with 128: `const result = QuantizerCelebi.quantize(pixels, 128);`, in `export function sourceColorFromImageBytes(imageBytes) {` (`utils/image_utils.js`). That function skips pixels with alpha below 255 before it quantises (`if (a < 255) {` then `continue;`). The file's one browser call, `const canvas = document.createElement('canvas');`, sits inside the other export, `sourceColorFromImage`, not at module top level.

What the output Map holds, by our reading of the end of `quantizer_wsmeans.js`:

```js
const count = pixelCountSums[i];
if (count === 0) {
    continue;
}
const possibleNewCluster = pointProvider.toInt(clusters[i]);
if (argbToPopulation.has(possibleNewCluster)) {
```

The next lines are `continue;` and then `argbToPopulation.set(possibleNewCluster, count);`.

- Keys are cluster centres turned back to ARGB (`toInt` is `utils.argbFromLab(point[0], point[1], point[2])`); values are the summed pixel counts of each cluster. A cluster with no pixels gives no key. When two clusters round to the same ARGB, the second one's count is skipped, so by our reading the values can sum to fewer than the pixels passed in.
- Keys go in cluster index order, and a `Map` iterates "in _insertion order_" (MDN).
- Alpha is handled in two ways inside the one call: Wu builds its histogram through `QuantizerMap`, which skips any pixel with `alpha < 255`, while Wsmeans counts every element of `inputPixels` (keyed by the full ARGB value) and converts it with `labFromArgb`, which reads only red, green and blue. By our reading, translucent pixels passed in add to the counts returned but not to Wu's starting clusters.

### 7. Helpers between hex or RGB and ARGB (0.4.0)

Declared in `utils/color_utils.d.ts` and `utils/string_utils.d.ts`, all exported from the root:

- `argbFromRgb(red: number, green: number, blue: number): number`, "Converts a color from RGB components to ARGB format.", implemented as `return (255 << 24 | (red & 255) << 16 | (green & 255) << 8 | blue & 255) >>>` then `0;`: alpha is always 255 and the result is unsigned.
- `alphaFromArgb`, `redFromArgb`, `greenFromArgb`, `blueFromArgb` (each `(argb: number): number`), for example `return argb >> 16 & 255;` for red; `isOpaque(argb: number): boolean` is `alphaFromArgb(argb) >= 255`.
- `labFromArgb(argb: number): number[]` and `argbFromLab(l: number, a: number, b: number): number`, which the quantiser's point provider uses.
- `hexFromArgb(argb: number): string`, "@return Hex string representing color, ex. #ff0000 for red.": it joins `'#'` with the three components in base 16, each padded to two digits, and drops alpha.
- `argbFromHex(hex: string): number`: "Accepts strings with or without leading #, and string representing the color using 3, 6, or 8 hex characters." Any other length throws (`throw new Error('unexpected hex ' + hex);`). For 8 characters it reads red, green and blue from `hex.slice(2, 4)`, `hex.slice(4, 6)` and `hex.slice(6, 8)`, and the result always has alpha 255 (`(255 << 24) | ...`, then `>>> 0`). The code quoted does not check that the characters are hex digits.

### 8. Is the result the same for the same input array?

**`QuantizerWsmeans` (TypeScript, 0.4.0).** The constants are `const MAX_ITERATIONS = 10;` and `const MIN_MOVEMENT_DISTANCE = 3.0;`. Random numbers enter in two places:

```js
if (startingClusters.length === 0 && additionalClustersNeeded > 0) {
    for (let i = 0; i < additionalClustersNeeded; i++) {
        const l = Math.random() * 100.0;
...
for (let i = 0; i < pointCount; i++) {
    clusterIndices.push(Math.floor(Math.random() * clusterCount));
```

- The first draws random centres only when no starting clusters are given; through `QuantizerCelebi` they are Wu's colours, so by our reading that branch is not taken unless Wu returns an empty array.
- The second runs on every call: each distinct pixel starts in a cluster picked by `Math.random`. No seed is passed or set: the 0.4.0 file, which the fetch tool returned whole, has no `seed`, and neither has `quantizer_wsmeans.ts` on `main` (searched for `seed`). MDN: "The implementation selects the initial seed to the random number generation algorithm; it cannot be chosen or reset by the user."
- A pixel leaves its starting cluster only when the closer cluster is better by more than `MIN_MOVEMENT_DISTANCE` (`if (distanceChange > MIN_MOVEMENT_DISTANCE) {`, where `distanceChange` is the difference of the square roots of the two squared L*a*b* distances). The centres are then recomputed from the assignments, for up to 10 iterations, stopping early when `pointsMoved === 0 && iteration !== 0`. By our reading, a pixel whose distance to its random start is within 3.0 of its distance to the nearest centre stays where `Math.random` put it, so the centres and counts returned can differ between runs on the same array. This entry ran no code. How much they differ was measured by task ORV-134-design-quantiser-1 (tech notes ORV-128 §8, line 773): `QuantizerCelebi.quantize(pixels, 8)` gave 20 different results in 20 calls at 320 x 200 and 14 in 20 at 320 x 2000, with the hex and the count both moving.
- The declaration says the opposite for the no-start case: "Passing an empty array is fine, the implementation will create its own initial state that leads to reproducible results for the same inputs." The code read draws from `Math.random` in that case too.
- The same four `Math.random` lines, the "reproducible" comment and `distanceToIndexMatrix[i].sort();` are in `quantizer_wsmeans.ts` both at the gitHead commit and on `main` (read 2026-10-28).
- Order: `distanceToIndexMatrix[i].sort();` passes no compare function. MDN: "If `compareFn` is not supplied, all non-`undefined` array elements are sorted by converting them to strings and comparing strings in UTF-16 code units order", and "Since version 10 (or ECMAScript 2019), the specification dictates that `Array.prototype.sort` is stable." The elements are `DistanceAndIndex` objects with no `toString` of their own in the file, so by our reading every one converts to the same string and the row keeps its order. Distinct pixels are kept in the order they first appear in the input (`points.push(...)` when `pixelToCount.get(inputPixel)` is `undefined`).

**The Java port (on `main`, not a versioned release).** `java/quantize/QuantizerWsmeans.java` has `// Uses a seeded random number generator to ensure consistent results.`, `Random random = new Random(0x42688);` and `clusterIndices[i] = random.nextInt(clusterCount);`, and sorts with `Arrays.sort(distanceToIndexMatrix[i]);`.

**`QuantizerWu` (TypeScript, 0.4.0).** The file contains no `Math.random`, `Date`, `sort`, `process.` or `require(`. Its constants are `const INDEX_BITS = 5;`, `const SIDE_LENGTH = 33;` and `const TOTAL_SIZE = 35937;`. Its histogram loop is `for (const [pixel, count] of countByColor.entries()) {` over the `Map` from `QuantizerMap.quantize(pixels)`, so it runs in the order colours first appear. The next box to cut is the one with the largest variance (`let temp = volumeVariance[0];`, `for (let j = 1; j <= i; j++) {`, `if (volumeVariance[j] > temp) {`); the comparison is strict, so by our reading a tie keeps the lower index. `createResult` keeps only boxes with `if (weight > 0) {` and returns a plain array, `quantize(pixels: number[], maxColors: number): number[];` ("@return Colors in ARGB format."), with alpha set to 255 and no counts.

**Reported behaviour.** Issue #132 on the official repo, "Image quantizer returns different results each time for the same image", opened December 3, 2023, is open (read 2026-10-28). It concerns the npm package. A commenter (observ33r, not marked as a maintainer on the page) replied "It's actual designed that way and work as expected (k-means initialization)." and "But in the end it has no (or very small) effect on generated theme." These are a user's statements, not Google's, and carry none of this entry's confidence.

### 9. Provenance and signatures

- The `0.4.0` record's `dist.signatures` holds one entry with `"keyid":"SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U"`. The registry's key list (`/-/npm/v1/keys`) has a key with that `keyid`, `keytype` `ecdsa-sha2-nistp256`, `expires` null. npm's docs: the registry signs "the package name, version and tarball sha integrity", and "Signatures are provided in the package's `packument` in each published version within the `dist` object". The signature was not verified here (no shell).
- `dist.integrity` is `sha512-dlq6VExJReb8dhjj3a/yTigr3ncNwoFmL5Iy2ENtbDX03EmNeOEdZ+vsaGrj7RTuO+mB7L58II4LCsl4NpM8uw==` and `dist.shasum` `bf7151aadf482a2534ac03c8e746e17625c0ec51`.
- No version in the record has a `dist.attestations` field, and a GET of the attestations endpoint for `0.4.0` returned HTTP 404. npm's docs say a provenance attestation is made by publishing from a supported cloud CI/CD provider with the `--provenance` flag or through trusted publishing, and is "established by publicly providing a link to a package's source code and build instructions." By our reading, 0.4.0 carries the registry signature but no provenance attestation.

### 10. The in-engine Wu alternative, as the tech notes state it

The ORV-128 tech notes, §8 "Colour" (`docs/specs/ORV-128/tech.md` line 768, before task ORV-134-design-quantiser-1 changed it), read: "The proposal is `QuantizerCelebi` from `@material/material-color-utilities`, pinned to an exact version: Apache-2.0, deterministic and model-free (K-0021). The alternative is an in-engine Wu quantiser of about 150 lines; the budget in §12 assumes the dependency." Line 980 lists the package as "pinned exact (slice 1c, if accepted)" for `security` review. This entry records that text only. It makes no comparison of the two and no recommendation. Since replaced: tech notes §8 now ports `QuantizerWu` into the engine as `measures/wu.ts` (line 769, Findings row F41 at line 1323), and the `package.json` row (line 1005) reads "The colour quantiser adds no dependency (F41)".

### Open points

- The tech notes call the proposal "deterministic" and cite K-0021; K-0021 rests on the repo README, which this entry did not find stating determinism. Section 8 reads the TypeScript `QuantizerWsmeans` of 0.4.0 as drawing unseeded random starts on every call through `QuantizerCelebi`. Closed for the tech notes: Findings row F41 (line 1323) replaces the package with Wu's quantiser ported into the engine, and §8 applies it as `quantizeWu(rgba, 8)` in `measures/wu.ts` (line 769), so nothing is pinned for the colour measure. F41's status column still leaves the spec text and the PR split open for the main session and the owner.
- Whether different random starts change the clusters for inputs of the size slice 1c will pass: measured by task ORV-134-design-quantiser-1 (tech notes ORV-128 §8), 20 results in 20 calls at 320 x 200 and 14 in 20 at 320 x 2000, with hex and counts both moving.
- Whether the 9 commits after the publish date touch the quantiser files was not read.

### Claims that did not re-check

- A line count for `quantizer_wu.js`. The fetch tool estimated one, but it is the tool's estimate, not a count from a page. Pages searched: `quantizer_wu.js` on jsDelivr and the jsDelivr flat listing, which gives 15,917 bytes and no line count. Not used anywhere above. The tech notes now give about 185 lines for the port (line 1030), from a sketch of 184 lines once Prettier formats it (line 774), in place of their earlier "about 150 lines". Task ORV-134-design-quantiser-1 states, in its report and not in the tech notes, that `quantizer_wu.js` in the tarball is 373 lines, 326 without comments and blank lines; not recounted here, and the jsDelivr flat listing, re-read 2026-10-28, still gives only `"size": 15917` for the file.

## Why it matters for ORIVILO

Slice 1c of ORV-134 waits on this entry before it pins the package for the colour measure (tech notes ORV-128 §8). The API, the zero-dependency record and the licence answer the supply-chain side. Section 8 bears on whether the same page gives the same clusters on every run, which the tech notes assume.
