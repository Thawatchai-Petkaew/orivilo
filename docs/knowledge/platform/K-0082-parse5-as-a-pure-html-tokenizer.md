---
id: K-0082
topic: platform
claim: parse5 8.0.1 (MIT, npm latest, published 2026-04-19) has one runtime dependency, entities ^8.0.0 (BSD-2-Clause, latest 8.1.0, no dependencies), no install scripts, and no Node built-in import in any of its 15 published JavaScript files or the entities files it reaches; its scriptingEnabled option defaults to true, which reads noscript content as raw text, while false parses it as elements, and its sourceCodeLocationInfo option (default false) records zero-based start and end offsets per node and per start tag, end tag and attribute, but no element path.
source: "https://registry.npmjs.org/parse5/latest; https://registry.npmjs.org/parse5/8.0.1; https://registry.npmjs.org/parse5; https://registry.npmjs.org/entities/latest; https://registry.npmjs.org/entities/8.1.0; https://data.jsdelivr.com/v1/packages/npm/parse5@8.0.1?structure=flat; https://data.jsdelivr.com/v1/packages/npm/entities@8.1.0?structure=flat; https://cdn.jsdelivr.net/npm/parse5@8.0.1/ (dist/index.js, dist/index.d.ts, dist/parser/index.js, dist/parser/open-element-stack.js, dist/parser/formatting-element-list.js, dist/tokenizer/index.js, dist/tokenizer/preprocessor.js, dist/serializer/index.js, dist/tree-adapters/default.js, dist/tree-adapters/interface.js, dist/common/html.js, dist/common/foreign-content.js, dist/common/doctype.js, dist/common/token.js, dist/common/token.d.ts, dist/common/unicode.js, dist/common/error-codes.js, LICENSE); https://cdn.jsdelivr.net/npm/entities@8.1.0/ (dist/decode.js, dist/escape.js, dist/decode-codepoint.js, dist/generated/decode-data-html.js, dist/generated/decode-data-xml.js, dist/internal/bin-trie-flags.js, dist/internal/decode-shared.js); https://parse5.js.org/interfaces/parse5.ParserOptions.html; https://github.com/inikulin/parse5 (README.md)"
retrieved: 2026-10-27
confidence: 0.8
applies_to: [ORV-128, ORV-133, ADR 0019]
license: own-words
---

## Evidence

parse5 is MIT and entities is BSD-2-Clause by their registry records. This file states facts in our own words with short quotes. Confidence is 0.8: each fact comes from one publisher's own record (the npm registry record, or the package files as published and served by jsDelivr), read and quoted once. The source files were read through a fetch tool that answered questions about each file. No file was opened byte by byte, and no code was run.

### 1. Version, licence and install scripts (registry records)

- `parse5` `latest`: version `8.0.1`, `"license":"MIT"`, `"type":"module"`, `exports` `{".":{"default":"./dist/index.js"}}`, `dist.fileCount` 33, `dist.unpackedSize` 337099, `dist.integrity` `sha512-z1e/HMG90obSGeidlli3hj7cbocou0/wa5HacvI3ASx34PecNjNQeaHNo5WIZpWofN9kgkqV1q5YvXe3F0FoPw==`. The record has no `engines` field.
- `dist-tags`: `{"test":"4.0.0-test","latest":"8.0.1"}`. The `time` field gives `8.0.0` as `2025-07-09T21:02:26.323Z` and `8.0.1` as `2026-04-19T20:16:16.612Z`. Those are the only 8.x versions.
- The `8.0.1` record has `scripts` `{}`, so there is no `preinstall`, `install` or `postinstall`.
- The published `LICENSE` begins: "Copyright (c) 2013-2019 Ivan Nikulin". The GitHub repo shows "MIT license".

### 2. Runtime dependencies: one, not none

```json
"dependencies": { "entities": "^8.0.0" }
```

- `entities` `latest` is `8.1.0`, with `"license":"BSD-2-Clause"`, `"type":"module"` and `engines.node` `>=20.19.0`. Its record has no `dependencies` field, so it has no dependencies of its own. Its scripts include `prepublishOnly` (`npm run build`), which runs when the package is published, not when it is installed. It has no install script.
- The range `^8.0.0` is a caret range. Pinning `parse5` exactly does not pin `entities`; only the lockfile does. Neither package appears in this repo's `pnpm-lock.yaml` today (grep for `parse5` and `entities@`: no match).

### 3. No Node built-in import

The package listing for `parse5@8.0.1` has 33 files: 15 `.js`, 15 `.d.ts`, `LICENSE`, `package.json` and `README.md`. All 15 `.js` files were read. Their only imports are relative (`./` or `../`), plus two subpaths of `entities`:

```js
import { htmlDecodeTree, EntityDecoder, DecodingMode } from "entities/decode";
import { escapeText, escapeAttribute } from "entities/escape";
```

The first import is in `dist/tokenizer/index.js` and the second in `dist/serializer/index.js`. None of the 15 files contains `node:`, `Buffer`, `process.`, `Math.random` or `Date.now`. The string `require(` appears once in `dist/index.js`, inside a JSDoc example (`const parse5 = require('parse5');`), not in code.

The `entities@8.1.0` files that these subpaths reach are `dist/decode.js`, `dist/escape.js`, `dist/decode-codepoint.js`, `dist/generated/decode-data-html.js`, `dist/generated/decode-data-xml.js`, `dist/internal/bin-trie-flags.js` and `dist/internal/decode-shared.js`. All seven were read. Every import in them is relative, and none contains `node:`, `require(`, `process.`, `Buffer`, `atob`, `Math.random` or `Date.now`.

The README calls parse5 an "HTML parsing/serialization toolset for Node.js" and says "It parses HTML the way the latest version of your browser does". The code read above reaches no Node API.

### 4. `scriptingEnabled` and `noscript`

The parser's default options in `dist/parser/index.js`:

```js
const defaultParserOptions = {
  scriptingEnabled: true,
  sourceCodeLocationInfo: false,
  treeAdapter: defaultTreeAdapter,
  onParseError: null,
};
```

The API docs say: "The scripting flag. If set to `true`, `noscript` element content will be parsed as text."

In the code, two branches handle `noscript`:

- **In `body` (`startTagInBody`):** with scripting on, `rawTextStartTagInBody(p, token)` switches the tokenizer to `TokenizerMode.RAWTEXT`, so everything up to `</noscript>` becomes one text node. With scripting off, `genericStartTagInBody(p, token)` inserts `noscript` as an ordinary element, and the tags inside it become elements.
- **In `head` (`startTagInHead`):** with scripting on, the same RAWTEXT switch applies. With scripting off, the parser inserts the element and sets `p.insertionMode = InsertionMode.IN_HEAD_NO_SCRIPT`.

So with the default (`true`), a `<noscript><p>...</p></noscript>` in the body yields no `p` element. The engine must pass `scriptingEnabled: false` to get the `p`. That is what rule `html-text-1` (`docs/specs/ORV-128/spec.md`, line 181) and finding F16 assume.

### 5. Source positions (`sourceCodeLocationInfo`)

The API docs describe it as "Enables source code location information." The default is `false`. When it is on, the parser hands each element's location to the tree adapter (`this.treeAdapter.setNodeSourceCodeLocation(element, loc)`) and sets the end location when the element is popped (`this._setEndLocation(node, this.currentToken)`).

The location types in `dist/common/token.d.ts`:

- `Location`: `startLine`, `startCol`, `startOffset`, `endLine`, `endCol` and `endOffset`. `startOffset` is the "Zero-based first character index"; `endOffset` "Points directly _after_ the last character."
- `LocationWithAttributes` adds `attrs?: Record<string, Location>` ("Start tag attributes' location info").
- `ElementLocation` adds `startTag?: Location` and `endTag?: Location`. `endTag` "is undefined, if the element has no closing tag."

`parse` takes `html: string` ("@param html Input HTML string."), so the offsets index the decoded string, not the raw bytes. parse5 gives no element path such as a CSS selector or `:nth-of-type` chain. The engine would build one by walking the tree, and could use the offsets as the character span of each element.

### What the sources read do not say

- **What the offsets count.** The docs say "character index" and do not say whether that means UTF-16 code units (a JavaScript string index) or code points. For Thai text in the Basic Multilingual Plane the two agree; they differ for characters outside it, such as emoji.
- **Where `head` content goes with scripting off.** The `IN_HEAD_NO_SCRIPT` handlers (`startTagInHeadNoScript`, `endTagInHeadNoScript`) were seen by name only. Their code was not read, so which tags stay inside a `noscript` in `head` is not recorded here.
- **The property name on the node.** The default tree adapter's `setNodeSourceCodeLocation` was not read, so this entry does not record the field name that holds the location on a node.
- **Byte decoding.** parse5 takes a string. Choosing a character encoding for the document bytes (header, BOM, `meta charset`) happens before parsing and is not covered by the pages read.
- **Supply-chain review.** Maintainer history, provenance attestations and advisories were not checked; ADR 0019 leaves that to `security`.

### Options this evidence supports (not a decision)

- **A. `parse5` 8.0.1 pinned exactly, with `entities` held by the lockfile.** Backed by: MIT and BSD-2-Clause licences, no install scripts, and no Node built-in in any file read. Gap: `entities` follows a caret range, so a lockfile refresh can move it.
- **B. As A, plus `entities` pinned exactly as a direct dependency of the engine, or through a pnpm override.** Backed by: the same evidence. Gap: one more pinned entry to keep in step with what parse5 accepts.
- **C. Another tokenizer.** No other parser was researched in this entry.

## Why it matters for ORIVILO

ADR 0019 decision 6 holds parse5 back from the engine until a research entry records its licence, version and dependencies. This entry records them. It also notes a fact that differs from the envelope's expectation: parse5 has one runtime dependency, `entities`, though neither package imports a Node built-in in the files read. Whether to pin it, and how to treat `entities`, is for the architect and `security`.
