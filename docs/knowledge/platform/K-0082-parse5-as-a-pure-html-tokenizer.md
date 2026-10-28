---
id: K-0082
topic: platform
claim: parse5 8.0.1 (MIT, npm latest, published 2026-04-19) has one runtime dependency, entities ^8.0.0 (BSD-2-Clause, latest 8.1.0, no dependencies), no install scripts, and no Node built-in import in any of its 15 published JavaScript files or the entities files it reaches; its scriptingEnabled option defaults to true, which reads noscript content as raw text, while false parses it as elements, and its sourceCodeLocationInfo option (default false) records zero-based start and end offsets per node and per start tag, end tag and attribute, but no element path; its tree adapter interface declares two optional hooks, onItemPush and onItemPop, which the parser calls when an element enters or leaves its stack of open elements and which the default tree adapter does not set; in its code, work that grows with attributes sits in the tokenizer's duplicate-name scan of each tag (no option caps the attributes of a tag) and in the tree adapter's adoptAttributes, which the parser calls only for html and body start tags handled as in body, active formatting elements are re-opened through the same push and onItemPush as an element from a start tag, with that first tag's location and attributes, the Noah's Ark limit of 3 drops only entries equal in name and attributes, and no parser option bounds the elements a parse creates; and the default tree adapter's insertBefore, insertTextBefore and detachNode walk or move a parent's child list with indexOf and splice, reached through foster parenting and the adoption agency, with no count, constant or option bounding the length of that list.
source: "https://registry.npmjs.org/parse5/latest; https://registry.npmjs.org/parse5/8.0.1; https://registry.npmjs.org/parse5; https://registry.npmjs.org/entities/latest; https://registry.npmjs.org/entities/8.1.0; https://data.jsdelivr.com/v1/packages/npm/parse5@8.0.1?structure=flat; https://data.jsdelivr.com/v1/packages/npm/entities@8.1.0?structure=flat; https://cdn.jsdelivr.net/npm/parse5@8.0.1/ (dist/index.js, dist/index.d.ts, dist/parser/index.js, dist/parser/index.d.ts, dist/parser/open-element-stack.js, dist/parser/open-element-stack.d.ts, dist/parser/formatting-element-list.js, dist/parser/formatting-element-list.d.ts, dist/tokenizer/index.js, dist/tokenizer/preprocessor.js, dist/serializer/index.js, dist/tree-adapters/default.js, dist/tree-adapters/interface.js, dist/tree-adapters/interface.d.ts, dist/common/html.js, dist/common/foreign-content.js, dist/common/doctype.js, dist/common/token.js, dist/common/token.d.ts, dist/common/unicode.js, dist/common/error-codes.js, LICENSE); https://cdn.jsdelivr.net/npm/entities@8.1.0/ (dist/decode.js, dist/escape.js, dist/decode-codepoint.js, dist/generated/decode-data-html.js, dist/generated/decode-data-xml.js, dist/internal/bin-trie-flags.js, dist/internal/decode-shared.js); node_modules/.pnpm/parse5@8.0.1/node_modules/parse5/ (the installed copy, section 7: dist/index.js, dist/tokenizer/index.js, dist/tokenizer/index.d.ts, dist/common/token.js, dist/common/foreign-content.js, dist/tree-adapters/interface.d.ts, dist/tree-adapters/default.js, dist/parser/index.js, dist/parser/index.d.ts, dist/parser/formatting-element-list.js, dist/parser/open-element-stack.js; section 8: dist/tree-adapters/default.js, dist/tree-adapters/interface.d.ts, dist/parser/index.js, dist/parser/formatting-element-list.js, dist/parser/open-element-stack.js, dist/tokenizer/index.js, dist/tokenizer/preprocessor.js, dist/index.d.ts, dist/index.js, dist/parser/index.d.ts, dist/parser/formatting-element-list.d.ts); packages/intent-engine/src/page-text.ts (section 8: lines 5, 61 to 62, 150 to 197, 214 to 254); https://parse5.js.org/interfaces/parse5.ParserOptions.html; https://parse5.js.org/interfaces/parse5.TreeAdapter.html; https://github.com/inikulin/parse5 (README.md, docs/version-history.md); https://github.com/inikulin/parse5/releases/tag/v7.0.0; https://github.com/inikulin/parse5/pull/385; docs/specs/ORV-128/spec.md (v1.17: line 167, line 192, line 797; v1.19: line 167, line 192, line 325, line 354, line 798 (F23), line 800, line 805 (GATE-133-1), line 887; v1.21: lines 170 to 173 (Work bound), line 840 (F27), line 844 (F31), section 7; v1.22: line 167 (Nesting count), lines 170 to 173 (Work bound), line 936 (changelog), section 8); docs/specs/ORV-128/tech.md (line 512, line 515, line 519, line 524, line 541, line 996; section 8: line 540, lines 542 to 545, line 547, line 548, line 564 (table The List steps, measured), line 1281 (F37))"
retrieved: 2026-10-28
confidence: 0.8
applies_to: [ORV-128, ORV-133, ADR 0019]
license: own-words
---

## Evidence

parse5 is MIT and entities is BSD-2-Clause by their registry records. This file states facts in our own words with short quotes. Confidence is 0.8: each fact comes from one publisher's own record (the npm registry record, or the package files as published and served by jsDelivr), read and quoted once. For sections 1 to 5, the source files were read through a fetch tool that answered questions about each file; no file was opened byte by byte. For section 6, the repo's installed copy of the same files was read line by line, and the lines quoted were looked for again on jsDelivr through the fetch tool; the few not found there are listed under "Claims that did not re-check". For section 7, the installed copy is the source: it was read line by line and searched with the patterns named there, and the lines marked "re-checked" were looked for again on jsDelivr through the fetch tool and found. For section 8 (read 2026-10-28), the same holds: the installed copy was read line by line and searched with the patterns named there, and the lines marked "re-checked" were found again on jsDelivr. No code was run, so no time in section 8 is this entry's own.

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

So with the default (`true`), a `<noscript><p>...</p></noscript>` in the body yields no `p` element. The engine must pass `scriptingEnabled: false` to get the `p`. That is what rule `html-text-1` (`docs/specs/ORV-128/spec.md` v1.17, line 192: "parses the document with scripting off") and finding F16 assume.

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

**What the Nesting count takes from this (our own words, not parse5's).** The Nesting count of spec ORV-128 v1.17 (Depth bound, Nesting count, `docs/specs/ORV-128/spec.md` line 167; finding F20 of the ORV-133 tech notes, with the bound lowered from 512 to 128 elements by finding F23, spec line 797) adds one at each `onItemPush` call and takes one away at each `onItemPop` call. In the code read, that number equals the stack's length: the document is not an item, every push and `insertAfter` raises the length by one and calls the push hook, every `pop`, `shortenToLength` step and `remove` lowers it by one and calls the pop hook, and `replace` changes neither. The count itself does not use the element passed to the push hook, so the `insertAfter` case does not change it; the cut of the tech notes (§6, line 515) does read the offset of each element pushed, and says how the `insertAfter` case falls. Because the hook runs after the push, the count reaches 129, one more than `MAX_DEPTH` (128 elements, `html` counting 1; tech notes line 512), inside the hook of the push that makes the stack 129 deep, when that element is already in the stack and in the tree. This paragraph was first written for spec v1.16, whose bound of 512 put that push at 513. To stop there, code would have to leave `parse()` from inside the hook. The only way in the code read is to throw, which no code in `dist/parser/index.js` catches, so it would reach the caller of `parse()`. To re-parse the text before that element's start tag, the parse needs `sourceCodeLocationInfo: true`, and the element must have come from a start tag. For the seven implied elements and an implied `html` the location is `null`. For a re-opened formatting element the offset is that of an earlier tag. The design had to say what it cuts in those cases; the tech notes (§6, line 515) now say it: the cut is the greatest `sourceCodeLocation.startOffset` among the elements pushed in the parse. The offset indexes the decoded string (section 5).

**What is not documented.** No source read says whether throwing from `onItemPush` or `onItemPop` is a supported way to stop a parse. None says what state the parser or the tree is left in after such a throw, or whether a later version will keep calling the hooks at the same points. The parser options read (section 4: `scriptingEnabled`, `sourceCodeLocationInfo`, `treeAdapter`, `onParseError`) include no option to stop a parse or to cap its depth. The hooks' timing above comes from the published code, not from documentation.

### 7. Work that grows with attributes or with active formatting elements

Read on 2026-10-27 in the repo's installed copy, `node_modules/.pnpm/parse5@8.0.1/node_modules/parse5/`. Paths are relative to that package root; line numbers are from it. Where this section says a cost grows with the square of a number, that is our reading of the loops quoted, not a measurement.

**(a) The tokenizer checks each attribute name against the tag's earlier names.** `dist/tokenizer/index.js`, `_leaveAttrName` (lines 332 to 348; lines 336, 337 and 346 re-checked):

```text
const token = this.currentToken;
if (getTokenAttr(token, this.currentAttr.name) === null) {
    token.attrs.push(this.currentAttr);
...
else {
    this._err(ERR.duplicateAttribute);
```

`getTokenAttr`, `dist/common/token.js` lines 13 to 20 (the loop header re-checked), walks the token's list from the end:

```text
export function getTokenAttr(token, attrName) {
    for (let i = token.attrs.length - 1; i >= 0; i--) {
        if (token.attrs[i].name === attrName) {
            return token.attrs[i].value;
...
    return null;
```

The attribute name state calls `_leaveAttrName` when a name ends (lines 1489 and 1495). So each new name is compared with every name the tag already kept, and a tag with n distinct names costs 0 + 1 + ... + (n - 1) comparisons. A repeated name is not kept and is reported as `duplicateAttribute`, but the scan still runs until it meets the earlier copy. End tags take the same path: `_createEndTagToken` (lines 289 to 299) gives the token `attrs: []`, an end tag goes to `State.TAG_NAME` (lines 949 to 951), whose whitespace case moves to `State.BEFORE_ATTRIBUTE_NAME` (line 983), and `emitCurrentTagToken` reports `ERR.endTagWithAttributes` (lines 376 to 378) only after the attributes were read.

No option caps the attributes of one tag. `TokenizerOptions` (`dist/tokenizer/index.d.ts` lines 88 to 90) has one member, `sourceCodeLocationInfo?: boolean;`. The parser passes its own options object to the tokenizer (`this.tokenizer = new Tokenizer(this.options, this);`, `dist/parser/index.js` line 107). `ParserOptions` (`dist/parser/index.d.ts` lines 33 to 64) has four members: `scriptingEnabled`, `sourceCodeLocationInfo`, `treeAdapter` and `onParseError`. Asked the same of the jsDelivr copy of `dist/tokenizer/index.js`, the fetch tool named `sourceCodeLocationInfo` as the one option the tokenizer reads and found no option or constant limiting the attributes of a tag.

**(b) `adoptAttributes`, a required tree adapter method.** `dist/tree-adapters/interface.d.ts` declares it without `?`, unlike the two hooks of section 6 (lines 24 and 29):

```text
* Copies attributes to the given element. Only attributes that are not yet present in the element are copied.
...
adoptAttributes(recipient: T['element'], attrs: Attribute[]): void;
```

The default, `dist/tree-adapters/default.js` lines 107 to 114 (lines 108 and 110 re-checked):

```text
adoptAttributes(recipient, attrs) {
    const recipientAttrsMap = new Set(recipient.attrs.map((attr) => attr.name));
    for (let j = 0; j < attrs.length; j++) {
        if (!recipientAttrsMap.has(attrs[j].name)) {
            recipient.attrs.push(attrs[j]);
        }
```

Each call builds a new `Set` of every name the recipient already holds. One call's work grows with the recipient's attributes plus the offered ones, and a run of calls that each add new names grows with the square of the names merged.

A search of every file under `dist/` for `adoptAttributes` finds four lines: the declaration (`interface.d.ts` line 29), the default (`default.js` line 107), and two calls, both in `dist/parser/index.js` (both re-checked, with their function names; the jsDelivr copy was read in two parts, and the second part has no `adoptAttributes`). Lines 1666 to 1668:

```text
function htmlStartTagInBody(p, token) {
    if (p.openElements.tmplCount === 0) {
        p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
```

Lines 1671 to 1675:

```text
function bodyStartTagInBody(p, token) {
    const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
    if (bodyElement && p.openElements.tmplCount === 0) {
        p.framesetOk = false;
        p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
```

So an `html` start tag merges into the bottom item of the stack, and a `body` start tag into the `body` element, and neither merges while a `template` is open. The first `html` start tag is not a merge: in the before-html mode it creates the element (`p._insertElement(token, NS.HTML);`, line 1358). Each function is called once, from `startTagInBody` (`case $.HTML:` lines 2024 to 2025, `case $.BODY:` lines 2040 to 2041). `startTagInBody(p, token);` is called at 15 lines of `dist/parser/index.js` (pattern `(^|[^A-Za-z])startTagInBody\(p, token\);`). Among them, `case $.HTML:` routes an `html` start tag there from the before-head, in-head, in-head-noscript, after-head, in-column-group, in-select, in-frameset, after-frameset and after-after-frameset modes (lines 1380, 1414, 1513, 1563, 2610, 2864, 3103, 3136 and 3171), `startTagAfterBody` and `startTagAfterAfterBody` do so for an `html` tag (lines 3067 to 3068 and 3156 to 3157), and the in-body mode reaches it for every start tag (`modeInBody`, lines 1641 to 1642), as do the in-caption and in-cell modes for start tags other than table parts (lines 2569 and 2820) and the in-template mode's default case (line 3043). `tokenInTable` (lines 2523 to 2529) also runs `modeInBody`.

**(c) Active formatting elements.** `_reconstructActiveFormattingElements`, `dist/parser/index.js` lines 475 to 486 (lines 482 and 483 re-checked):

```text
const endIndex = this.activeFormattingElements.entries.findIndex((entry) => entry.type === EntryType.Marker || this.openElements.contains(entry.element));
const unopenIdx = endIndex === -1 ? listLength - 1 : endIndex - 1;
for (let i = unopenIdx; i >= 0; i--) {
    const entry = this.activeFormattingElements.entries[i];
    this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
    entry.element = this.openElements.current;
```

- **One element per entry not open.** The loop re-opens every entry newer than the last marker or the last entry still open, and `contains` is a `lastIndexOf` over the stack (`dist/parser/open-element-stack.js` lines 50 to 52 and 180 to 182). `p._reconstructActiveFormattingElements();` is called at 17 lines of `dist/parser/index.js`, among them `whitespaceCharacterInBody` and `characterInBody` (lines 1657 to 1665), so a character token in body runs it.
- **The same push as a start tag.** The element is made by `_insertElement` (lines 302 to 306), the method an element from a start tag goes through: `createElement`, then `_attachElementToTree(element, token.location)`, then `this.openElements.push(element, token.tagID);`. That push calls the parser's `onItemPush`, which calls the tree adapter's hook (section 6).
- **The first start tag's location and attributes.** `entry.token` is the token stored with the entry: `pushElement(p.openElements.current, token)` at lines 1772, 1777 and 1786 (the `a`, `b` group and `nobr` start tags), and the formatting entry's own token in the adoption agency (lines 1270 and 1274). So with `sourceCodeLocationInfo: true` the re-created element gets that tag's location, as section 6 says, and `createElement(token.tagName, namespaceURI, token.attrs)` (line 303) gets that tag's attribute list. The default `createElement` keeps the array as given (`attrs,`, `default.js` line 21; its first line re-checked), so a re-created element shares the earlier token's array rather than a copy.
- **Re-opening adds no entry.** Line 483 points the existing entry at the new element. The list grows only through `pushElement` and `insertElementAfterBookmark` (`dist/parser/formatting-element-list.js` lines 66 to 81).

**The Noah's Ark clause.** `dist/parser/formatting-element-list.js`, `const NOAH_ARK_CAPACITY = 3;` (line 2, re-checked). `pushElement` (lines 66 to 73) calls `this._ensureNoahArkCondition(element);` (line 67, re-checked) before it adds the entry; `insertElementAfterBookmark` (lines 74 to 81), which the adoption agency uses, does not call it, and neither does reconstruction. The candidates are entries above the last marker with the same tag name, namespace and number of attributes (lines 24 to 34):

```text
if (entry.type === EntryType.Marker) {
    break;
...
if (this.treeAdapter.getTagName(element) === neTagName &&
    this.treeAdapter.getNamespaceURI(element) === neNamespaceURI) {
...
    if (elementAttrs.length === neAttrsLength) {
```

and a candidate counts only when every one of its attributes has the same name and value on the new element (lines 54 to 57):

```text
if (candidate.attrs.every((cAttr) => neAttrsMap.get(cAttr.name) === cAttr.value)) {
    validCandidates += 1;
    if (validCandidates >= NOAH_ARK_CAPACITY) {
        this.entries.splice(candidate.idx, 1);
```

So entries are removed only when three already match the new element in tag name, namespace and every attribute name and value. Entries whose attributes differ, such as `b` elements with distinct `id` values, are never candidates that count, and the list keeps them all until a marker clears it (`clearToLastMarker`, lines 93 to 101). The check itself costs work on every `pushElement` once the list holds three entries (line 41): a pass over the entries above the last marker, and, when three or more candidates have the same name and attribute count, a `Map` of the new element's attributes and a comparison of each candidate's attributes (lines 47 to 60).

**Elements made outside the push.** The adoption agency is bounded per call by `const AA_OUTER_LOOP_ITER = 8;` and `const AA_INNER_LOOP_ITER = 3;` (lines 14 and 15, re-checked). By our reading of `aaInnerLoop` (lines 1217 to 1243) and `callAdoptionAgency` (lines 1280 to 1298), each outer pass re-creates at most three elements (`aaRecreateElementFromEntry`, lines 1245 to 1251, only while `i` is below 3) and makes one more (`aaReplaceFormattingElement`, lines 1268 to 1278), so one call makes at most 32 elements. The re-created ones replace an item in the stack (`p.openElements.replace(elementEntry.element, newElement);`, line 1248), which calls no hook (section 6); the one made at line 1271 enters through `insertAfter` (line 1277), whose hook is passed the stack's top (section 6). `_appendElement` (lines 297 to 300) attaches an element to the tree without a push; `p._appendElement(` appears at 12 lines of `dist/parser/index.js` (void elements such as `br`, `img`, `input` and `hr`, and self-closing tags in foreign content, line 3217).

**Another path that reads all of an element's attributes.** The parser's `onItemPush` and `onItemPop` call `_setContextModes` after the tree adapter's hook when the change is at the top (lines 167 to 172 and 174 to 191). For an element outside the HTML namespace it calls `_isIntegrationPoint` (lines 193 to 198 and 468 to 471), which passes the element's attribute list to `isHtmlIntegrationPoint` (`dist/common/foreign-content.js` lines 214 to 224); for a MathML `annotation-xml` that loop reads the attributes until it meets `encoding`. By our reading, each time such an element without `encoding` becomes the current node again, all its attributes are read once. Not measured. The foreign-content adjustments (lines 177 to 202) and `causesExit` (lines 170 to 175) make one pass over a start tag's attributes.

**(d) No option bounds the elements of a parse.** `parse(html, options)` in `dist/index.js` (lines 30 to 31) returns `Parser.parse(html, options)`, and the parser's options are the four of `ParserOptions` above, with the defaults of section 4 (`defaultParserOptions`, `dist/parser/index.js` lines 52 to 57). None counts elements, attributes or time. The limits seen in the code read are constants: `NOAH_ARK_CAPACITY` bounds entries equal in name and attributes, and the two adoption agency constants bound one call of that algorithm. None of them bounds the elements a parse creates, and none is an option.

**What the Work bound takes from this (our own words, not parse5's).** Spec ORV-128 v1.21 holds the Work bound (`docs/specs/ORV-128/spec.md` lines 170 to 173, read 2026-10-27), with three counts. The Element count stops the parse at the push that would be the 1,048,577th, counted at the same `onItemPush` hook as the Nesting count (line 171). The Attribute count cuts the text at a tag, start or end, that holds more than 256 attributes, found by a scan of the decoded text before the parse (line 172; the end tag came in with finding F27, line 840). The Attribute merge stops the parse when a later `html` or `body` start tag would make that element hold more than 256 attributes, counted in the tree adapter's `adoptAttributes` (line 173). This section was first written before the spec held the Work bound, from three counts the task named; the spec now holds the same three. What follows is what the code read gives each, not what the spec says.

- **An Element count at `onItemPush`.** It sees every element that enters the stack through `push` or `insertAfter`: an element from a start tag, a `template` (`_insertTemplate`, line 319), the implied elements of section 6, and each re-created formatting element, one call per entry re-opened. In the shape of reviewer finding R2-1 (120 `b` elements with distinct `id` values, then `<p>x` repeated), by our reading the `<p>` closes the previous `p` and the `b` elements inside it (`addressStartTagInBody`, lines 1687 to 1692), and the `x` re-opens every entry the list still holds, so each `<p>x` gives one push for the `p` and one per entry. It also counts one implied `p` per `</p>` when no `p` is in button scope (`pEndTagInBody`, lines 2184 to 2189), which is how the held-depth document of section 6 is built. At the end of the text, a `template` open in `head` is popped and the after-head mode pushes an implied `body`, a push no earlier token made, so the parse of the text before a cut can make one push more than the first parse did before it (ORV-128 tech notes §6, F31). In the installed `dist/parser/index.js`, by our reading: a `template` start tag in head adds the in-template mode to the template mode stack (`p.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);`, line 1455). At the end of the text, `onEof` sends the in-body, table and select modes to `eofInBody` and the in-template mode to `eofInTemplate` (lines 1088 to 1111), and `eofInBody` goes to `eofInTemplate` while that stack is not empty (lines 2343 to 2350). `eofInTemplate` (lines 3052 to 3063) runs `p.openElements.popUntilTagNamePopped($.TEMPLATE);` (line 3054), resets the insertion mode and then `p.onEof(token);` (line 3058). The reset gives the in-head mode when `head` is open above the bottom of the stack (`_resetInsertionMode`, `case $.HEAD:` with `if (i > 0)`, lines 556 to 560). In head, the end of the text reaches `tokenInHead` (`onEof`, lines 1076 to 1078), which pops `head`, sets the after-head mode and processes the end of the text again (lines 1504 to 1508); in after head it reaches `tokenAfterHead` (lines 1084 to 1086), whose first line is `p._insertFakeElement(TN.BODY, $.BODY);` (line 1621), and `_insertFakeElement` ends with `this.openElements.push(element, tagID);` (line 311), the push that calls `onItemPush` (section 6). That this push can be the 1,048,577th is the tech notes' finding; this entry did not run it. It does not see elements made by `_appendElement`, which match one tag each in the text, nor the adoption agency's re-created elements, which enter by `replace`; by our reading those are at most three per outer pass, 24 per call. Since the parser calls the tree adapter's hook before `_setContextModes`, a throw from the hook comes before the attribute read above for that push.
- **An Attribute count by a text scan before the parse.** The tokenizer work in (a) is set, per tag, by the attribute names written in that tag, end tags included, so a scan of the text sees what drives it, provided it splits tags and attributes as the tokenizer does. It does not see work the tree builder repeats without new text: a re-created element reuses the earlier token's attribute list, which the Noah's Ark compare may read again on a later `pushElement`. A cap per tag also does not bound (b), where each `html` or `body` tag may add one new name while each call reads all names merged before it; a cap on the total names in the text bounds that to the square of the total.
- **An Attribute merge count in an `adoptAttributes` override.** A custom tree adapter's `adoptAttributes` replaces the default at both call sites in (b). It receives the recipient and the tag's whole list, so it can count the names offered per call and in all, and stop at a bound the way the hooks can. The default's `Set` is not built unless the override calls the default. Neither call (lines 1668 and 1675) is inside a `try` (section 6).

**What is not documented.** No source read states the cost of any path above; the growth stated is our reading of the loops. The interface's comment describes `adoptAttributes` only as a copy and says nothing about an adapter that refuses or throws there, as section 6 found for the hooks. No source read says whether a later version keeps these call sites or the Noah's Ark rule as they are. Whether a text scan that does not follow the tokenizer's states (raw text, RCDATA, script data, comments, CDATA) counts the same attributes as the tokenizer was not checked.

### 8. Work that grows with a list the four counts do not cap

Read on 2026-10-28 in the repo's installed copy, `node_modules/.pnpm/parse5@8.0.1/node_modules/parse5/`. Paths are relative to that package root; line numbers are from it. Lines marked "re-checked" were found again on jsDelivr through the fetch tool, in `dist/tree-adapters/default.js`, `dist/parser/formatting-element-list.js`, `dist/parser/open-element-stack.js` and the first 100,000 of the 107,124 characters of `dist/parser/index.js`. Where this section says a cost grows with a length, or with its square, that is our reading of what `indexOf`, `lastIndexOf`, `find`, `findIndex`, `splice` and `unshift` walk or move in the code quoted, not a measurement.

**Times.** This entry ran no code, so each row below names its document and leaves its own time open. The times of these documents through `stylesheetLinksOf` and `pageTextOf`, at the head and with the List steps, are in the table "The List steps, measured" of the ORV-133 tech notes (`docs/specs/ORV-128/tech.md` §6, line 564, task `ORV-133-design-tech-r3-1`). They are the tech notes' report, not this entry's, and carry none of its confidence. The earlier times of finding SEC-133-R3-1, taken through `stylesheetLinksOf` only, stay under "Claims that did not re-check".

**The four counts, as the code has them.** `parseText` (`packages/intent-engine/src/page-text.ts` lines 214 to 254) builds its tree adapter as `...defaultTreeAdapter` plus three members of its own, `onItemPush`, `onItemPop` and `adoptAttributes` (lines 219 to 245), so every other tree adapter method in its parse is the default's. The Nesting count and the Element count throw from `onItemPush` (line 226, `depth > MAX_DEPTH || pushes > MAX_ELEMENT_PUSHES`), the Attribute merge from `adoptAttributes` (line 239), and the Attribute count cuts the text before the parse (`attributeCut`, lines 150 to 197), as spec ORV-128 v1.22 has them (line 167 and lines 171 to 173). An element made by `_appendElement` (`dist/parser/index.js` lines 297 to 300: `createElement`, then `_attachElementToTree`, and no push) never reaches `onItemPush`, and neither does a text node or a comment. The ORV-133 tech notes judge those elements "Bounded by the document bound; no count" (`docs/specs/ORV-128/tech.md` line 541), a judgement of how many there are, not of the lists they join.

**How the routines were found.**

- A search of `dist/` for calls of the tree adapter's tree methods (pattern `treeAdapter\.(insertBefore|insertTextBefore|detachNode|appendChild|insertText|getChildNodes|getFirstChild|getParentNode|adoptAttributes|getAttrList)\(`): 30 lines, 25 in `dist/parser/index.js`, 2 in `dist/parser/formatting-element-list.js` and 3 in `dist/serializer/index.js`. `page-text.ts` imports only `defaultTreeAdapter`, `parse` and two types from parse5 (line 5), and `Parser.parse` (`dist/parser/index.js` lines 114 to 118) writes the text to the tokenizer and returns the document, so the serializer lines are not reached.
- A search of `dist/parser/index.js` for array walks and string appends (pattern `\.(indexOf|lastIndexOf|splice|find|findIndex|unshift|shift|includes|some|every|filter|map|slice|concat|reverse)\(|\+=[ ]`): 7 lines, 133, 269, 359, 478, 1455, 1497 and 3056, none of them a `+=`.
- The same pattern with `substring` and `startsWith` added, over `dist/tokenizer/`: string appends to a token's name, value, data or characters, `startsWith` in the preprocessor and tokenizer, and `substring` at `dist/tokenizer/preprocessor.js` lines 84 and 103.
- `dist/tree-adapters/default.js`, `dist/parser/formatting-element-list.js`, `dist/parser/open-element-stack.js` and `dist/tokenizer/preprocessor.js` were read whole.

The other tree mutation methods of the default adapter walk no list: `appendChild` is a `push` (`default.js` lines 42 to 45, re-checked), and `insertText` reads only the last child (lines 88 to 97, re-checked).

**Row 1. The adoption agency's move of the furthest block's children (SEC-133-R3-1, first document).**

- Routine: `detachNode`, `default.js` lines 81 to 87 (lines 83 and 84 re-checked): `const idx = node.parentNode.childNodes.indexOf(node);` then `node.parentNode.childNodes.splice(idx, 1);`.
- List: the furthest block's `childNodes`. `_adoptNodes` (`dist/parser/index.js` lines 372 to 377, re-checked) takes `getFirstChild(donor)` each time (`default.js` line 117, `node.childNodes[0]`), detaches it and appends it to the new element. The child is always at index 0, so `indexOf` stops at once, but `splice(0, 1)` moves every child after it down one place: N children cost (N - 1) + (N - 2) + ... + 0 moves, about the square of N over 2.
- Called from: `_adoptNodes` is called at two lines, 144 (`getFragment`, the fragment API, which `parse` does not call) and 1272 (`aaReplaceFormattingElement`, re-checked). That runs once per outer pass of the adoption agency that finds a furthest block (`callAdoptionAgency`, lines 1280 to 1298), at most 8 passes per call (`AA_OUTER_LOOP_ITER`). `callAdoptionAgency(p, token)` is called at three lines: 2257, for the end tags of the formatting elements in body (the `case` list ending `case $.STRONG:`, line 2256); 1766, for an `a` start tag while an `a` entry is in the list above the last marker (line 1764); and 1782, for a `nobr` start tag while a `nobr` is in scope (line 1781).
- Capped by one of the four: no. The children may be void elements made by `_appendElement`, text or comments; none is pushed, and the list's length is not an attribute.
- Document: `<body><b><div>` + `<br>` times 524,283 + `</b>`, 2,097,150 bytes (the shape of SEC-133-R3-1). Time through `pageTextOf`: not run.

**Row 2. Foster-parented elements (SEC-133-R3-1, second document).**

- Routine: `insertBefore`, `default.js` lines 46 to 50 (lines 47 and 48 re-checked): `indexOf(referenceNode)` walks from the first child to the reference, and `splice(insertionIdx, 0, newNode)` moves every child after the insertion point.
- List: the foster parent's `childNodes`. `_findFosterParentingLocation` (lines 595 to 617) walks the stack from the top and, at the first `table`, returns that table's parent with the table as the reference (lines 605 to 609). Each node goes in right before the table, so the children before the reference grow by one per node, and each `indexOf` walks all of them: N nodes cost about the square of N over 2 comparisons.
- Called from: `_fosterParentElement` (lines 619 to 627, line 622 re-checked), which is called from two lines. It is called at line 285, in `_attachElementToTree`, for every element made while `_shouldFosterParentOnInsertion()` holds (lines 589 to 593: foster parenting is on and the current node is a table structure element; `tokenInTable`, lines 2523 to 2529, turns it on while it hands a token to the in-body rules), whether that element is then pushed (`_insertElement`) or not (`_appendElement`). Line 1257, in `aaInsertLastNodeInCommonAncestor`, when the common ancestor is a table structure element. `insertTextBefore` also calls `insertBefore` (row 3).
- Capped by one of the four: no. A `br` in the in-table mode goes through `tokenInTable` to `startTagInBody` (`case $.BR:` line 1988), whose `areaStartTagInBody` makes it with `_appendElement` (lines 1802 to 1807), so it is never pushed. A foster-parented element that is pushed is counted by the Element count, which caps how many there are (1,048,576), not the length of the list each walks.
- Document: `<body><table>` + `<br>` times 524,284, 2,097,149 bytes (the shape of SEC-133-R3-1). Time through `pageTextOf`: not run.

**Row 3. Foster-parented text (SEC-133-R3-1, third document).**

- Routine: `insertTextBefore`, `default.js` lines 98 to 106 (line 99 re-checked): `parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1]`, a walk from the first child to the reference. When the node before the reference is text, the token is appended to it (`prevNode.value += text;`, line 101) and the list does not grow; otherwise it calls `insertBefore` (line 104), row 2. After it, `_insertCharacters` reads `siblings.lastIndexOf(beforeElement)` (`dist/parser/index.js` line 359, re-checked) on the array `getChildNodes(parent)` returns (line 358): a walk from the last child back to the reference, over the children after the table.
- List: the foster parent's `childNodes`, as in row 2.
- Called from: `_insertCharacters` (lines 340 to 370; the call at line 346 re-checked), when `_shouldFosterParentOnInsertion()` holds and the location has a reference. In body, `whitespaceCharacterInBody` and `characterInBody` (lines 1657 to 1665) call it for each character token. In the in-table mode a character token while a table structure element is current moves to the in-table-text mode (`characterInTable`, lines 2369 to 2386), which holds the tokens in `pendingCharacterTokens` (pushed at lines 2533 and 2536). At the next other token, `tokenInTableText` (lines 2539 to 2553) hands each held token, one by one, to `tokenInTable` when any of them is not whitespace (lines 2541 to 2545), so each becomes one foster-parented call. The tokenizer makes one character token per run of the same group (whitespace, null, other; comment at `dist/tokenizer/index.js` lines 434 to 441), so `a` followed by a space, repeated, gives two tokens per two bytes.
- Capped by one of the four: no. Text is never pushed and carries no attribute.
- Document: `<body>` + `<br>` times 349,520 + `<table>` + (`a` and one space) times 349,520 + `<tr>`, 2,097,137 bytes (the shape of SEC-133-R3-1). Time through `pageTextOf`: not run.

**Row 4. The adoption agency's detach of its last element.**

- Routine: `detachNode` (row 1), at `dist/parser/index.js` line 1237 (`aaInnerLoop`) and line 1293 (`callAdoptionAgency`), both re-checked.
- List: the `childNodes` of the parent of `lastElement`; `indexOf` walks from the first child to it, and `splice` moves the children after it. `lastElement` starts as the furthest block (line 1218). An element the inner loop re-creates (`aaRecreateElementFromEntry`, lines 1245 to 1251) comes from `createElement`, whose `parentNode` is `null` (`default.js` line 24), and only receives the previous `lastElement` as a child (line 1238), so detaching it returns at `if (node.parentNode)` (line 82) without a walk. By our reading, then, each outer pass walks one list: that of the furthest block's parent.
- Called from: `callAdoptionAgency` (row 1).
- Capped by one of the four: no. The furthest block's parent can hold many unpushed children before it: in `<b>` + `<br>` times n + `<div></b>`, the `b` holds n `br` and then the `div`.
- Document: none found by our reading that makes these lines walk one long list more than once; each list read here is the parent of the furthest block, which the pass then moves out (`aaInsertLastNodeInCommonAncestor`, lines 1253 to 1266). Not run.

**Row 5. The `frameset` detach of `body`.**

- Routine: `detachNode(bodyElement)` (`dist/parser/index.js` line 1681, re-checked), in `framesetStartTagInBody` (lines 1678 to 1686).
- List: the `childNodes` of the `html` element.
- Called from: a `frameset` start tag in body while `framesetOk` is true and `body` is the second item of the stack (`tryPeekProperlyNestedBodyElement`, `open-element-stack.js` lines 176 to 179). It then pops to `html`, pushes the `frameset` and sets the in-frameset mode (lines 1682 to 1684), after which the second stack item is the `frameset`, not `body`. By our reading it runs at most once per parse.
- Capped by one of the four: once per parse, not by a count. Not run.

**Row 6. The DOCTYPE lookup in the document's children.**

- Routine: `setDocumentType`, `default.js` lines 57 to 74 (`document.childNodes.find(...)`, line 58), and `_setDocumentType`, `dist/parser/index.js` lines 262 to 274 (`documentChildren.find(...)`, line 269).
- List: the document's `childNodes` (comments before the DOCTYPE go there).
- Called from: `doctypeInInitialMode` (lines 1339 to 1347), which `onDoctype` calls only in the initial mode (lines 812 to 816) and which sets the before-html mode (line 1346). Once per parse.
- Capped by one of the four: once per parse, not by a count. Not run.

**Row 7. The list of active formatting elements.**

- Routines, `dist/parser/formatting-element-list.js` (each body re-checked): `pushElement` (lines 66 to 73) and `insertMarker` (lines 63 to 65) add at the front with `unshift`, which moves every entry; `insertElementAfterBookmark` (lines 74 to 81) and `removeEntry` (lines 82 to 87) run `indexOf` from the front and `splice`, which moves the entries after the index; `clearToLastMarker` (lines 93 to 101) runs `indexOf(MARKER)` and stops at the newest marker; `getElementEntryInScopeWithTagName` (lines 103 to 106) runs `find` and stops at the first marker; `getElementEntry` (lines 107 to 109) runs `find` and does not stop at a marker; `_ensureNoahArkCondition` (lines 40 to 61) walks the entries up to the first marker (section 7). In `dist/parser/index.js`, `_reconstructActiveFormattingElements` runs `findIndex` (line 478), which stops at the first marker or open entry, and calls `contains` (a `lastIndexOf` over the stack, `open-element-stack.js` lines 50 to 52 and 180 to 182) for each entry it passes.
- List: `entries`.
- Called from: `pushElement` at lines 1772, 1777 and 1786 (`a`, the `b` group and `nobr` start tags); `insertMarker` at lines 1452 (`template`), 1791 (`appletStartTagInBody`), 2393 (`caption`) and 2741 (`td` and `th`); `removeEntry` at lines 1185, 1212, 1228, 1275 and 1768; `getElementEntry` at line 1223, once per inner loop step of the adoption agency; `getElementEntryInScopeWithTagName` at lines 1182 and 1764; `clearToLastMarker` at lines 492, 1496, 2214, 2563, 2580, 2831 and 3055; reconstruction at 17 lines (section 7).
- Capped by one of the four: not directly. By our reading the entries above the last marker are held near the Nesting count: each formatting start tag (lines 1763 to 1787) runs `_reconstructActiveFormattingElements` before it adds its entry, which pushes every entry above the last marker newer than the newest open one, and open entries are on the stack, which holds at most 128. Entries below a marker are not limited by that argument; a marker comes with a `template`, `applet`, `object`, `marquee`, `caption`, `td` or `th` that is on the stack when it is added. Whether the whole list can grow past a few thousand entries, and what the walks that pass markers (`unshift`, the `splice` calls, `getElementEntry`) then cost, was not established.
- Document: none built. A candidate to measure is nested `<table><tr><td>` levels, each holding about 100 formatting entries closed by `</p>`, then `<b></b>` repeated. Not run.

**Row 8. The stack of open elements.** `open-element-stack.js` walks `items` and `tagIDs` in `_indexOf` (`lastIndexOf`, line 51, re-checked), `insertAfter` and `remove` (`splice`, lines 91, 92, 167 and 168, re-checked), the scope checks (lines 191 to 305) and `_indexOfTagNames` (lines 139 to 146); `dist/parser/index.js` walks it in `_resetInsertionMode` (lines 502 to 566), `_findFosterParentingLocation` (lines 595 to 617), `aaObtainFurthestBlock` (lines 1198 to 1215) and `listItemStartTagInBody` (lines 1727 to 1741). Capped: the Nesting count stops the parse at the push that would make it 129 items, so each walk passes at most 128 items.

**Row 9. The template insertion mode stack.** `tmplInsertionModeStack.unshift` at line 1455 (and 133, fragment parsing only) and `.shift()` at lines 1497 and 3056, each moving every item. One item is added per `template` start tag in head rules (lines 1450 to 1456) and one removed when that `template` is popped (`templateEndTagInHead`, lines 1489 to 1503; `eofInTemplate`, lines 3052 to 3063). Capped, by our reading: its length is the number of `template` elements open, each on the stack, so at most 128.

**Row 10. Pending character tokens.** `pendingCharacterTokens` (row 3) is emptied when the in-table-text mode starts (line 2371), filled one token at a time (lines 2533 and 2536) and walked once when the mode ends (lines 2542 and 2547). Its own walk is one pass per token held; what each held token costs is row 3.

**Row 11. A token's attribute list.** `getTokenAttr`, `adoptAttributes`, `_isIntegrationPoint` and the Noah's Ark compare (section 7). Capped by the Attribute count (256 names per tag) and the Attribute merge (256 names on `html` or `body`).

**Row 12. The tokenizer's input and strings.** `dropParsedChunk` (`dist/tokenizer/preprocessor.js` lines 82 to 91) replaces the input with `this.html.substring(this.pos)` once `pos` passes `bufferWaterline`, 65,536 (`DEFAULT_BUFFER_WATERLINE = 1 << 16`, line 4; lines 79 to 81), and sets `pos` to 0, so by our reading it cuts at most once per 65,536 characters read, 32 times for 2,097,152 characters. Whether the engine copies the rest at each cut is not stated by any source read. The tokenizer calls it after each tag, comment, DOCTYPE and character token (`dist/tokenizer/index.js` lines 384, 389, 394 and 451). `retreat` (preprocessor lines 188 to 195) pops `gapStack`, which the cut empties (line 89). `handleSpecialEndTag` (tokenizer lines 1035 to 1042) compares `lastStartTagName`, the name of the start tag that set the raw text state. The tokenizer appends to a token's name, value, data or characters one code point at a time (`+=`, for example line 445). No list in this row is walked once per token from its start; the cost of a string append in the JavaScript engine is not stated by any source read and was not measured.

**One quantity over the rows (our reading, not a decision).**

- Rows 1 to 6 walk or move a parent's `childNodes`, and each such walk runs inside, or right after, a tree adapter method handed that list's owner: `insertBefore(parentNode, ...)` and `insertTextBefore(parentNode, ...)` receive the parent (`dist/tree-adapters/interface.d.ts` lines 163 and 181); `detachNode(node)` reads `node.parentNode` (line 70); `setDocumentType(document, ...)` receives the document (line 223); the `lastIndexOf` at `dist/parser/index.js` line 359 and the `find` at line 269 run on the array `getChildNodes` returns (line 83; called at lines 358 and 268). `indexOf`, `lastIndexOf` and `find` stop within the array, and `splice` moves at most the items after its index, so the elements one call walks or moves are at most that array's length at the call. The sum of those lengths, over every call of `insertBefore`, `insertTextBefore`, `detachNode`, `getChildNodes` and `setDocumentType`, is therefore at least the list work of rows 1 to 6. These five are members of the `TreeAdapter` interface, as `adoptAttributes` is, which `parseText` already replaces with its own ("The four counts" above).
- That sum also counts calls that walk nothing: `_insertCharacters` calls `getChildNodes` for every character token while locations are on (line 358, after `if (!token.location) return;`, line 356), and when there is no reference it reads only `siblings.length` (line 359). So on a flat page whose text tokens fall in a parent with many children, the sum grows with tokens times children though no list is walked. Not measured.
- Row 7's walks run inside `FormattingElementList` and `_reconstructActiveFormattingElements`. `unshift`, `indexOf`, `splice`, `getElementEntry`'s `find` and the `findIndex` at line 478 call no tree adapter method per entry, so a sum kept in the tree adapter does not see them. `getElementEntryInScopeWithTagName` calls `getTagName` once per entry it passes (line 104), and the Noah's Ark scan calls `getTagName` and `getNamespaceURI` once per entry (lines 30 and 31).
- Rows 8, 9 and 11 are within the Nesting count, the Attribute count or the Attribute merge, as each row says.
- The overhead of keeping such a sum on a plain 2 MB page was not measured.

**The count the design chose (the ORV-133 tech notes' design, in our words, not parse5's).** The tech notes chose one count, the List steps (`docs/specs/ORV-128/tech.md` §6, "The List steps", line 540): one counter per parse, bounded by `MAX_LIST_STEPS` (268,435,456), that adds the list positions `insertBefore`, `insertTextBefore` and `detachNode` walk (lines 542 to 544: the first two, overridden to find the reference from the end with `lastIndexOf`, add the child list's length minus the index found; `detachNode` adds its parent's child count) and, at each push, the length of the list of active formatting elements (`onItemPush`, line 545). To read that length, the parse runs through parse5's `Parser` rather than `parse` (line 547), so the count reads two names parse5 8.0.1 marks internal (line 548; finding F37, line 1281). `Parser` is exported from the package root but declared `@internal` there (`dist/index.d.ts` line 20: `export { type ParserOptions, /** @internal */ Parser } from './parser/index.js';`, re-checked; `dist/index.js` line 3 carries the same comment on the runtime export), and its `activeFormattingElements` is marked `/** @internal */` in the type declarations (`dist/parser/index.d.ts` lines 98 to 99, re-checked), while `entries` is a public field of `FormattingElementList`, with no marker (`dist/parser/formatting-element-list.d.ts` line 18, re-checked). Those three lines were re-checked on jsDelivr in `dist/index.d.ts`, `dist/parser/index.d.ts` and `dist/parser/formatting-element-list.d.ts`. Both names hold under the exact pin of option A below, and an upgrade of `parse5` re-checks them (tech notes line 548). The tech notes' times for each row's document, at the head and with the List steps, are in their table "The List steps, measured" (§6, line 564).

### What the sources read do not say

- **What the offsets count.** The docs say "character index" and do not say whether that means UTF-16 code units (a JavaScript string index) or code points. For Thai text in the Basic Multilingual Plane the two agree; they differ for characters outside it, such as emoji.
- **Where `head` content goes with scripting off.** The `IN_HEAD_NO_SCRIPT` handlers (`startTagInHeadNoScript`, `endTagInHeadNoScript`) were seen by name only. Their code was not read, so which tags stay inside a `noscript` in `head` is not recorded here.
- **The property name on the node.** Answered in section 6: the default tree adapter's `setNodeSourceCodeLocation` stores the location as `node.sourceCodeLocation`.
- **Byte decoding.** parse5 takes a string. Choosing a character encoding for the document bytes (header, BOM, `meta charset`) happens before parsing and is not covered by the pages read.
- **Supply-chain review.** Maintainer history, provenance attestations and advisories were not checked; ADR 0019 leaves that to `security`.

### Claims that did not re-check

These carry no confidence and are not grounds for a decision.

- **The measured cost of the stack count.** The run record of the ORV-133 tech notes task (`ORV-133-design-tech-r1-1`) reports that counting the stack through `onItemPush` and `onItemPop` cut every 2 MB hostile document it tried in 2 to 14 ms, on Node 22.23.0 arm64 with the repo's parse5 8.0.1, at the bound of spec v1.16 (512 elements). This entry did not run it.
- **The measured cost at the lowered bound, sketch.** The ORV-133 tech notes (`docs/specs/ORV-128/tech.md`, §6 line 519 and §14 row 7, line 996) report that a sketch of the count outside the repo, task `ORV-133-design-tech-r1-3`, took 488 to 500 ms in five runs on the held-depth document (`<body>`, 125 nested `div`, then `</p>` repeated to 2 MB), on Node 22.23.0 arm64. This entry did not run it.
- **The measured cost on the final code.** The run record of builder task `ORV-133-build-rework-2` (a local run record under `.orivilo/runs`, which git ignores, so not in the repo) reports vitest per-test durations on its final tree: the held-depth 2 MB document 581 ms in `pageText` (the record's word for `pageTextOf`), 557 ms in `stylesheetLinksOf` and 559 ms in a read, against a limit of 2 s, the limit of spec v1.17 and v1.18 when the record was made (2026-10-27); the five 2 MB Nesting documents 1 to 2 ms each in `pageText` and `stylesheetLinksOf`, and 1 to 16 ms in a read. The record names no Node version or machine for these durations. This entry did not run them. Spec ORV-128 v1.19 (`docs/specs/ORV-128/spec.md`, "Owner decisions", table "Gate findings on round 2", finding GATE-133-1, line 805; changelog line 887) moved the time guard on the held-depth document from within 2 s to within 10 s, for that document only (rows 7 and 36, lines 325 and 354). The spec gives as its reason that the quality gate's test step on commit e0ffacc, which runs the three packages' test tasks at once, took that case past 2 s twice (`page-text.test.ts`, the `pageTextOf` and `stylesheetLinksOf` cases), while the five cut documents take 1 to 16 ms and keep within 2 s. That is the spec's report; this entry did not run the gate.
- **No other change to the stack's length.** A search of the installed `dist/parser/open-element-stack.js` and `dist/parser/index.js` for changes to `stackTop` and to `items` (pattern `stackTop\s*(=|\+\+|--|-=|\+=)|items\.(splice|push|pop|length\s*=)|items\[[^\]]+\]\s*=[^=]`) found them only at the start (line 44) and in `push`, `pop`, `replace`, `insertAfter`, `shortenToLength` and `remove`. The jsDelivr copy was read for those six methods, not searched as a whole.
- **Lines read only in the installed copy.** The jsDelivr fetches did not quote these back: `this.stackTop = -1;` and `this.current = document;` (`open-element-stack.js` lines 44 and 47), the `if (this.options.sourceCodeLocationInfo) {` line of `_attachElementToTree`, the `this._attachElementToTree(element, token.location);` line of `_insertElement`, and the `createElement` call at `dist/parser/index.js` line 1247. The fetch did confirm that `_attachElementToTree` spreads `...location` and adds `startTag: location`, and that `_insertElement` ends with the push.
- **The measured cost of attribute work.** Security finding SEC-133-R2-1 (run record `ORV-133-security-4`, a local record under `.orivilo/runs`, which git ignores) reports, on commit 3274e52, a page of `<html aN>` tags inside body at 118,896 bytes taking 1,071 ms in `stylesheetLinksOf`, at 248,896 bytes 6,469 ms and at 508,896 bytes 29,133 ms; one `p` tag with distinct attribute names at 58,900 bytes 210 ms, 128,900 bytes 662 ms and 268,900 bytes 2,501 ms; `<body aN>` tags at 248,896 bytes 5,105 ms; and `readPage` on the 508,896-byte page at 33,630 ms against a 30,000 ms budget. It estimates several minutes at the 2 MB document bound. The record names no Node version or machine. This entry did not run them.
- **The measured cost of re-opened formatting elements.** Reviewer finding R2-1 (run record `ORV-133-review-code-4`, local and git-ignored) reports that 120 `b` elements with distinct `id` values followed by `<p>x` repeated gave about 121 elements per 4 bytes, with `stylesheetLinksOf` at 590 ms and 628 MB of added heap for 50 KB, 1,140 ms and 1,465 MB for 100 KB and 2,961 ms and 2,918 MB for 200 KB, and that `readPage` on the 2 MB page ran out of a 4 GB heap. It also reports that the held-depth document pushes about 524,000 implied `p` elements. The per-`<p>x` count agrees with our reading in section 7; the figures were not run by this entry.
- **The measured cost of the child-list work (section 8, rows 1 to 3).** Security finding SEC-133-R3-1 (run record `ORV-133-security-5`, a local record under `.orivilo/runs`, which git ignores, on commit 0f32d79) reports times through `stylesheetLinksOf`, not `pageTextOf`: the adoption move document at 100,018 bytes 76 ms, 200,018 bytes 2,120 ms and 400,018 bytes 4,683 ms; the foster-parented `br` document at 100,013 bytes 86 ms, 200,013 bytes 232 ms and 400,013 bytes 815 ms; and at the 2 MB document bound, the adoption move at 2,097,150 bytes 87,703 ms, the foster-parented `br` at 2,097,149 bytes 19,746 ms and the foster-parented text at 2,097,137 bytes 35,116 ms, each with `incomplete` false. It also reports `readPage` with fake ports on the adoption move page returning status read after 91,714 ms against a 30,000 ms budget. The record names no Node version or machine. This entry did not run them.
- **No `try` or `catch` in the package.** A search of the installed copy for `catch|try \{` over the 15 `.js` files under `dist/` found no match. Only `dist/parser/index.js` was read for this on jsDelivr.

### Options this evidence supports (not a decision)

- **A. `parse5` 8.0.1 pinned exactly, with `entities` held by the lockfile.** Backed by: MIT and BSD-2-Clause licences, no install scripts, and no Node built-in in any file read. Gap: `entities` follows a caret range, so a lockfile refresh can move it.
- **B. As A, plus `entities` pinned exactly as a direct dependency of the engine, or through a pnpm override.** Backed by: the same evidence. Gap: one more pinned entry to keep in step with what parse5 accepts.
- **C. Another tokenizer.** No other parser was researched in this entry.

## Why it matters for ORIVILO

ADR 0019 decision 6 holds parse5 back from the engine until a research entry records its licence, version and dependencies. This entry records them. It also notes a fact that differs from the envelope's expectation: parse5 has one runtime dependency, `entities`, though neither package imports a Node built-in in the files read. Whether to pin it, and how to treat `entities`, is for the architect and `security`.
