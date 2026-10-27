---
id: K-0082
topic: platform
claim: parse5 8.0.1 (MIT, npm latest, published 2026-04-19) has one runtime dependency, entities ^8.0.0 (BSD-2-Clause, latest 8.1.0, no dependencies), no install scripts, and no Node built-in import in any of its 15 published JavaScript files or the entities files it reaches; its scriptingEnabled option defaults to true, which reads noscript content as raw text, while false parses it as elements, and its sourceCodeLocationInfo option (default false) records zero-based start and end offsets per node and per start tag, end tag and attribute, but no element path; its tree adapter interface declares two optional hooks, onItemPush and onItemPop, which the parser calls when an element enters or leaves its stack of open elements and which the default tree adapter does not set.
source: "https://registry.npmjs.org/parse5/latest; https://registry.npmjs.org/parse5/8.0.1; https://registry.npmjs.org/parse5; https://registry.npmjs.org/entities/latest; https://registry.npmjs.org/entities/8.1.0; https://data.jsdelivr.com/v1/packages/npm/parse5@8.0.1?structure=flat; https://data.jsdelivr.com/v1/packages/npm/entities@8.1.0?structure=flat; https://cdn.jsdelivr.net/npm/parse5@8.0.1/ (dist/index.js, dist/index.d.ts, dist/parser/index.js, dist/parser/open-element-stack.js, dist/parser/open-element-stack.d.ts, dist/parser/formatting-element-list.js, dist/tokenizer/index.js, dist/tokenizer/preprocessor.js, dist/serializer/index.js, dist/tree-adapters/default.js, dist/tree-adapters/interface.js, dist/tree-adapters/interface.d.ts, dist/common/html.js, dist/common/foreign-content.js, dist/common/doctype.js, dist/common/token.js, dist/common/token.d.ts, dist/common/unicode.js, dist/common/error-codes.js, LICENSE); https://cdn.jsdelivr.net/npm/entities@8.1.0/ (dist/decode.js, dist/escape.js, dist/decode-codepoint.js, dist/generated/decode-data-html.js, dist/generated/decode-data-xml.js, dist/internal/bin-trie-flags.js, dist/internal/decode-shared.js); https://parse5.js.org/interfaces/parse5.ParserOptions.html; https://parse5.js.org/interfaces/parse5.TreeAdapter.html; https://github.com/inikulin/parse5 (README.md, docs/version-history.md); https://github.com/inikulin/parse5/releases/tag/v7.0.0; https://github.com/inikulin/parse5/pull/385"
retrieved: 2026-10-27
confidence: 0.8
applies_to: [ORV-128, ORV-133, ADR 0019]
license: own-words
---

## Evidence

parse5 is MIT and entities is BSD-2-Clause by their registry records. This file states facts in our own words with short quotes. Confidence is 0.8: each fact comes from one publisher's own record (the npm registry record, or the package files as published and served by jsDelivr), read and quoted once. For sections 1 to 5, the source files were read through a fetch tool that answered questions about each file; no file was opened byte by byte. For section 6, the repo's installed copy of the same files was read line by line, and the lines quoted were looked for again on jsDelivr through the fetch tool; the few not found there are listed under "Claims that did not re-check". No code was run.

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

### 6. Observing the open element stack (tree adapter hooks)

Read on 2026-10-27, in the repo's installed copy of parse5 8.0.1 and in the same files on jsDelivr (the call lines below were found in both). Paths are relative to the package root; line numbers are from the installed copy.

**The declarations.** `dist/tree-adapters/interface.d.ts`, lines 243 to 248 and 249 to 254, the last two members of `interface TreeAdapter`:

```text
/**
 * Optional callback for elements being pushed to the stack of open elements.
 *
 * @param element The element being pushed to the stack of open elements.
 */
onItemPush?: (item: T['element']) => void;
```

```text
/**
 * Optional callback for elements being popped from the stack of open elements.
 *
 * @param item The element being popped.
 */
onItemPop?: (item: T['element'], newTop: T['parentNode']) => void;
```

`dist/parser/open-element-stack.d.ts`, lines 3 to 6 (the parser's side, not the tree adapter's) and lines 21 to 22:

```text
export interface StackHandler<T extends TreeAdapterTypeMap> {
    onItemPush: (node: T['parentNode'], tid: number, isTop: boolean) => void;
    onItemPop: (node: T['parentNode'], isTop: boolean) => void;
}
...
    push(element: T['element'], tagID: $): void;
    pop(): void;
```

**The documentation.** The API page for `TreeAdapter` gives the same two sentences, "Optional callback for elements being pushed to the stack of open elements." and "Optional callback for elements being popped from the stack of open elements.", marks both `Optional`, and describes `item` as "The element being popped." It does not describe `newTop`, does not say when the hooks run, and says nothing about a hook that throws or about stopping a parse. That page shows no version number, and it lists a third optional member, `onElementCreated`, which the installed 8.0.1 `interface.d.ts` does not declare. The repository's `docs/version-history.md` says only "See GitHub Releases for the changelog." The v7.0.0 release lists "add hooks for stack events to tree adapter interface" (PR #385), and PR #385 ("feat(parser): Add hooks for stack events", merged Feb 12, 2022) gives its reason as "JSDOM currently monkey-patches parse5 to get these events. With this change, that is no longer necessary." Neither the release nor the PR mentions throwing from a hook or stopping a parse. The README read does not mention the hooks.

**The default tree adapter does not set them.** Neither `onItemPush` nor `onItemPop` appears in `dist/tree-adapters/default.js`. `dist/index.d.ts`, line 4, exports it: `export { type DefaultTreeAdapterMap, defaultTreeAdapter } from './tree-adapters/default.js';`.

**When the parser calls them.** The stack starts empty with the document as its current node (`this.stackTop = -1;`, `this.current = document;`, `dist/parser/open-element-stack.js` lines 44 and 47), so the document is not one of its items. In the same file:

- `push` (lines 62 to 72) stores the element and then calls `this.handler.onItemPush(element, tagID, true);` (line 71).
- `insertAfter` (lines 89 to 100) calls `this.handler.onItemPush(this.current, this.currentTagId, insertionIdx === this.stackTop);` (line 98), inside `if (this.current && this.currentTagId !== undefined)`. It passes `this.current`, the top of the stack, which is the inserted element only when that element went in at the top. `openElements.insertAfter(` appears once in `dist/parser/index.js`, in the adoption agency algorithm (`aaReplaceFormattingElement`, `dist/parser/index.js` line 1277), right after removing the old formatting element (line 1276).
- `pop` (lines 73 to 81) calls `this.handler.onItemPop(popped, true);` (line 80). `shortenToLength` (lines 108 to 118), which the `popUntil...` and `clearBackTo...` methods use, calls `this.handler.onItemPop(popped, this.stackTop < idx);` once per element removed (line 116). `remove` (lines 160 to 174) calls `pop()` for the top element and otherwise `this.handler.onItemPop(element, false);` (line 171).
- `replace` (lines 82 to 88) puts one element in another's place and calls neither.

The handler is the parser. In `dist/parser/index.js`, its `onItemPush(node, tid, isTop)` (lines 167 to 172) calls the tree adapter's hook only when it is set:

```text
(_b = (_a = this.treeAdapter).onItemPush) === null || _b === void 0 ? void 0 : _b.call(_a, node);
```

Its `onItemPop(node, isTop)` (lines 174 to 192) first sets the element's end location when `sourceCodeLocationInfo` is on (`this._setEndLocation(node, this.currentToken);`) and then calls:

```text
(_b = (_a = this.treeAdapter).onItemPop) === null || _b === void 0 ? void 0 : _b.call(_a, node, this.openElements.current);
```

So each hook runs after the stack has changed: `newTop` is the stack's new current element. Neither call is inside a `try` block, and the jsDelivr copy of `dist/parser/index.js`, read in two parts, has no `try` or `catch`.

**The start offset at `onItemPush`.** `_insertElement` (lines 302 to 306) creates the element, calls `this._attachElementToTree(element, token.location);` and only then `this.openElements.push(element, token.tagID);`. `_attachElementToTree` (lines 276 to 291) sets the location before it attaches the element to the tree:

```text
if (this.options.sourceCodeLocationInfo) {
    const loc = location && {
        ...location,
        startTag: location,
    };
    this.treeAdapter.setNodeSourceCodeLocation(element, loc);
```

The default tree adapter stores it as `node.sourceCodeLocation = location;` (`dist/tree-adapters/default.js`, lines 164 to 166). So with `sourceCodeLocationInfo: true` and the default adapter, an element made from a start tag reaches `onItemPush` with `sourceCodeLocation.startOffset` set, and `sourceCodeLocation.startTag` is the same `Location`. It is already a child in the tree by then. The code read has these exceptions:

- `_insertFakeElement` (lines 308 to 312) calls `this._attachElementToTree(element, null);`, so the location is `null`. `p._insertFakeElement(` appears seven times in `dist/parser/index.js` (a search of the installed copy; the jsDelivr copy gave the same seven), for `TN.HEAD`, `TN.BODY`, `TN.COLGROUP`, `TN.TBODY`, `TN.TR`, `TN.P` and `TN.BR`: elements the parser adds without a start tag of their own in the text. `_insertFakeRootElement` (lines 324 to 330) also sets `null`, for an implied `html`.
- `_reconstructActiveFormattingElements` (lines 475 to 486) re-opens a formatting element with `this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));`, the token of the earlier start tag, so the new element's `startOffset` points at that earlier tag.
- The adoption agency creates elements with `p.treeAdapter.createElement(...)` (lines 1247 and 1271) and sets no location on them, and the default `createElement` (`default.js` lines 17 to 26) returns no `sourceCodeLocation`. The one that enters the stack goes in through `insertAfter`, so the hook may be passed a different element (above).
- `startTagAfterHead` pushes the already-made `head` element again (`p.openElements.push(p.headElement, $.HEAD);`, line 1589) and removes it two lines later: one push and one pop.

**What the Nesting count takes from this (our own words, not parse5's).** The Nesting count this task names for spec ORV-128 v1.16 (finding F20 of the ORV-133 tech notes) adds one at each `onItemPush` call and takes one away at each `onItemPop` call. In the code read, that number equals the stack's length: the document is not an item, every push and `insertAfter` raises the length by one and calls the push hook, every `pop`, `shortenToLength` step and `remove` lowers it by one and calls the pop hook, and `replace` changes neither. The count does not use the element passed to the push hook, so the `insertAfter` case does not change it. Because the hook runs after the push, the count reaches 513 inside the hook of the push that makes the stack 513 deep, when that element is already in the stack and in the tree. To stop there, code would have to leave `parse()` from inside the hook. The only way in the code read is to throw, which no code in `dist/parser/index.js` catches, so it would reach the caller of `parse()`. To re-parse the text before that element's start tag, the parse needs `sourceCodeLocationInfo: true`, and the element must have come from a start tag. For the seven implied elements and an implied `html` the location is `null`. For a re-opened formatting element the offset is that of an earlier tag. The design has to say what it cuts in those cases. The offset indexes the decoded string (section 5).

**What is not documented.** No source read says whether throwing from `onItemPush` or `onItemPop` is a supported way to stop a parse. None says what state the parser or the tree is left in after such a throw, or whether a later version will keep calling the hooks at the same points. The parser options read (section 4: `scriptingEnabled`, `sourceCodeLocationInfo`, `treeAdapter`, `onParseError`) include no option to stop a parse or to cap its depth. The hooks' timing above comes from the published code, not from documentation.

### What the sources read do not say

- **What the offsets count.** The docs say "character index" and do not say whether that means UTF-16 code units (a JavaScript string index) or code points. For Thai text in the Basic Multilingual Plane the two agree; they differ for characters outside it, such as emoji.
- **Where `head` content goes with scripting off.** The `IN_HEAD_NO_SCRIPT` handlers (`startTagInHeadNoScript`, `endTagInHeadNoScript`) were seen by name only. Their code was not read, so which tags stay inside a `noscript` in `head` is not recorded here.
- **The property name on the node.** Answered in section 6: the default tree adapter's `setNodeSourceCodeLocation` stores the location as `node.sourceCodeLocation`.
- **Byte decoding.** parse5 takes a string. Choosing a character encoding for the document bytes (header, BOM, `meta charset`) happens before parsing and is not covered by the pages read.
- **Supply-chain review.** Maintainer history, provenance attestations and advisories were not checked; ADR 0019 leaves that to `security`.

### Claims that did not re-check

These carry no confidence and are not grounds for a decision.

- **The measured cost of the stack count.** The run record of the ORV-133 tech notes task (`ORV-133-design-tech-r1-1`) reports that counting the stack through `onItemPush` and `onItemPop` cut every 2 MB hostile document it tried in 2 to 14 ms, on Node 22.23.0 arm64 with the repo's parse5 8.0.1. This entry did not run it.
- **No other change to the stack's length.** A search of the installed `dist/parser/open-element-stack.js` and `dist/parser/index.js` for changes to `stackTop` and to `items` (pattern `stackTop\s*(=|\+\+|--|-=|\+=)|items\.(splice|push|pop|length\s*=)|items\[[^\]]+\]\s*=[^=]`) found them only at the start (line 44) and in `push`, `pop`, `replace`, `insertAfter`, `shortenToLength` and `remove`. The jsDelivr copy was read for those six methods, not searched as a whole.
- **Lines read only in the installed copy.** The jsDelivr fetches did not quote these back: `this.stackTop = -1;` and `this.current = document;` (`open-element-stack.js` lines 44 and 47), the `if (this.options.sourceCodeLocationInfo) {` line of `_attachElementToTree`, the `this._attachElementToTree(element, token.location);` line of `_insertElement`, and the `createElement` call at `dist/parser/index.js` line 1247. The fetch did confirm that `_attachElementToTree` spreads `...location` and adds `startTag: location`, and that `_insertElement` ends with the push.
- **No `try` or `catch` in the package.** A search of the installed copy for `catch|try \{` over the 15 `.js` files under `dist/` found no match. Only `dist/parser/index.js` was read for this on jsDelivr.

### Options this evidence supports (not a decision)

- **A. `parse5` 8.0.1 pinned exactly, with `entities` held by the lockfile.** Backed by: MIT and BSD-2-Clause licences, no install scripts, and no Node built-in in any file read. Gap: `entities` follows a caret range, so a lockfile refresh can move it.
- **B. As A, plus `entities` pinned exactly as a direct dependency of the engine, or through a pnpm override.** Backed by: the same evidence. Gap: one more pinned entry to keep in step with what parse5 accepts.
- **C. Another tokenizer.** No other parser was researched in this entry.

## Why it matters for ORIVILO

ADR 0019 decision 6 holds parse5 back from the engine until a research entry records its licence, version and dependencies. This entry records them. It also notes a fact that differs from the envelope's expectation: parse5 has one runtime dependency, `entities`, though neither package imports a Node built-in in the files read. Whether to pin it, and how to treat `entities`, is for the architect and `security`.
