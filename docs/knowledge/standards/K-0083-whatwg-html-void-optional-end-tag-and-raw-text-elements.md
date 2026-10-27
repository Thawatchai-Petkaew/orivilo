---
id: K-0083
topic: standards
claim: The WHATWG HTML Living Standard, which has no version number (last updated 26 October 2026, read 2026-10-27), names 13 void elements, 19 elements whose end tag may be omitted under a condition set per element, script and style as raw text elements and textarea and title as escapable raw text elements, and its parser also reads xmp, iframe, noembed, noframes and plaintext as text, and noscript only when scripting mode is not Disabled; spec ORV-128 v1.14 lists the same void and optional end tag elements, and its nine text elements are the parser's list without noscript.
source: "https://html.spec.whatwg.org/multipage/syntax.html (#elements-2, #void-elements, #raw-text-elements, #escapable-raw-text-elements, #optional-tags); https://html.spec.whatwg.org/multipage/parsing.html (#parsing-elements-that-contain-only-text, #parsing-main-inhead, #parsing-main-inbody, #parsing-html-fragments, #rcdata-state, #rawtext-state, #script-data-state, #plaintext-state); https://html.spec.whatwg.org/multipage/acknowledgements.html (#ipr); https://html.spec.whatwg.org/multipage/; docs/specs/ORV-128/spec.md (line 164, line 189)"
retrieved: 2026-10-27
confidence: 0.8
applies_to: [ORV-128, ORV-133]
license: CC-BY-4.0
---

## Evidence

Source: HTML Standard, WHATWG, <https://html.spec.whatwg.org/multipage/>. Its Intellectual property rights section says: "Copyright © WHATWG (Apple, Google, Mozilla, Microsoft). This work is licensed under a Creative Commons Attribution 4.0 International License." The quotes below are reused under that licence, with this attribution.

Confidence is 0.8: one publisher's document, read and quoted once. The pages were read through a fetch tool that answers questions about a page and gives quotes of at most about 120 characters, so the longer sentences below are joined from consecutive pieces it returned. No page was opened byte by byte.

### A living document, no version number

Every page read carries the header "Living Standard [-] Last Updated 26 October 2026" (syntax, parsing and the multipage index). Asked whether the syntax page gives a version or edition number, the fetch found none. The IPR section ends: "This is the Living Standard. Those interested in the patent-review version should view the Living Standard Review Draft." The text below is the state on 26 October 2026 and may change.

### (a) Void elements (syntax page, 13.1.2 Elements, `#elements-2`, `#void-elements`)

> There are six different kinds of elements: void elements, the template element, raw text elements, escapable raw text elements, foreign elements, and normal elements.

The list under the term "Void elements":

> area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr

> Void elements only have a start tag; end tags must not be specified for void elements.

Counted by hand in the list above: 13 names.

### (b) Optional tags (syntax page, 13.1.2.4 Optional tags, `#optional-tags`)

The section opens "Certain tags can be omitted." and ends "However, a start tag must never be omitted if it has any attributes." Each end tag paragraph begins with the element's name and "end tag may be omitted if"; its condition, quoted from that point on:

- `html`: "the html element is not immediately followed by a comment."
- `head`: "the head element is not immediately followed by ASCII whitespace or a comment."
- `body`: "the body element is not immediately followed by a comment."
- `li`: "the li element is immediately followed by another li element or if there is no more content in the parent element."
- `dt`: "the dt element is immediately followed by another dt element or a dd element."
- `dd`: "the dd element is immediately followed by another dd element or a dt element, or if there is no more content in the parent element."
- `p`: "the p element is immediately followed by an address, article, aside, blockquote, details, dialog, div, dl, fieldset, figcaption, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, main, menu, nav, ol, p, pre, search, section, table, or ul element, or if there is no more content in the parent element and the parent element is an HTML element that is not an a, audio, del, ins, map, noscript, or video element, or an autonomous custom element."
- `rt`: "the rt element is immediately followed by an rt or rp element, or if there is no more content in the parent element."
- `rp`: "the rp element is immediately followed by an rt or rp element, or if there is no more content in the parent element."
- `optgroup`: "the optgroup element is immediately followed by another optgroup element, if it is immediately followed by an hr element, or if there is no more content in the parent element."
- `option`: "the option element is immediately followed by another option element, if it is immediately followed by an optgroup element, if it is immediately followed by an hr element, or if there is no more content in the parent element."
- `colgroup`: "the colgroup element is not immediately followed by ASCII whitespace or a comment."
- `caption`: "the caption element is not immediately followed by ASCII whitespace or a comment."
- `thead`: "the thead element is immediately followed by a tbody or tfoot element."
- `tbody`: "the tbody element is immediately followed by a tbody or tfoot element, or if there is no more content in the parent element."
- `tfoot`: "there is no more content in the parent element."
- `tr`: "the tr element is immediately followed by another tr element, or if there is no more content in the parent element."
- `td`: "the td element is immediately followed by a td or th element, or if there is no more content in the parent element."
- `th`: "the th element is immediately followed by a td or th element, or if there is no more content in the parent element."

Counted by hand in the list above: 19 elements. Asked to list every element with a "may be omitted" paragraph, the fetch returned these 19 for the end tag and no other element.

Five of them may also omit the start tag: `html` ("if the first thing inside the html element is not a comment"), `head` ("if the element is empty, or if the first thing inside the head element is an element"), `body` (if empty, or if the first thing inside is not ASCII whitespace or a comment, "except if the first thing inside the body element is a meta, noscript, link, script, style, or template element"), `colgroup` (the first thing inside is a `col`, and it is not preceded by a `colgroup` whose end tag was omitted; "It can't be omitted if the element is empty.") and `tbody` (the first thing inside is a `tr`, and it is not preceded by a `tbody`, `thead` or `tfoot` whose end tag was omitted; "It can't be omitted if the element is empty.").

### (c) Elements whose content is read as text

**The kinds of element (syntax page, `#raw-text-elements`, `#escapable-raw-text-elements`).** The list under "Raw text elements":

> script, style

The list under "Escapable raw text elements":

> textarea, title

The section on their content is "13.1.2.6 Restrictions on the contents of raw text and escapable raw text elements" (`#cdata-rcdata-restrictions`); its text was not read for this entry.

**The two generic algorithms (parsing page, 13.2.6.2 Parsing elements that contain only text, `#parsing-elements-that-contain-only-text`):**

> The generic raw text element parsing algorithm and the generic RCDATA element parsing algorithm consist of the following steps.

Step 2: "If the algorithm that was invoked is the generic raw text element parsing algorithm, switch the tokenizer to the RAWTEXT state"; otherwise the tokenizer is switched to the RCDATA state.

**Where the tree builder uses them (parsing page):**

- "in head" (13.2.6.4.4, `#parsing-main-inhead`): `A start tag whose tag name is "title"`: "Follow the generic RCDATA element parsing algorithm." `A start tag whose tag name is "noscript", if scripting mode is not Disabled` and `A start tag whose tag name is one of: "noframes", "style"`: "Follow the generic raw text element parsing algorithm." For `script`, step 7: "Switch the tokenizer to the script data state."
- "in body" (13.2.6.4.7, `#parsing-main-inbody`): `textarea`: "Switch the tokenizer to the RCDATA state". `xmp`, `iframe`, `noembed`, and `noscript` "if scripting mode is not Disabled": "Follow the generic raw text element parsing algorithm." `plaintext`: "Switch the tokenizer to the PLAINTEXT state." `A start tag whose tag name is one of: "base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title"`: "Process the token using the rules for the "in head" insertion mode."

**The fragment parsing algorithm (parsing page, `#parsing-html-fragments`, step 10)** sets the tokenizer state from the context element:

- `title`, `textarea`: "Switch the tokenizer to the RCDATA state."
- `style`, `xmp`, `iframe`, `noembed`, `noframes`: "Switch the tokenizer to the RAWTEXT state."
- `script`: "Switch the tokenizer to the script data state."
- `noscript`: the RAWTEXT state if the scripting mode is not Disabled, otherwise "leave the tokenizer in the data state".
- `plaintext`: "Switch the tokenizer to the PLAINTEXT state."
- Any other element: "Leave the tokenizer in the data state."

So, from the parser text read: RCDATA for `title` and `textarea`; RAWTEXT for `style`, `xmp`, `iframe`, `noembed`, `noframes`, and `noscript` only when scripting mode is not Disabled; script data for `script`; PLAINTEXT for `plaintext`. Ten names, one of them conditional. The tokenizer state sections (13.2.5.2 RCDATA, 13.2.5.3 RAWTEXT, 13.2.5.4 Script data, 13.2.5.5 PLAINTEXT) each begin "Consume the next input character:" and name no element.

### Comparison with spec ORV-128 v1.14 (our own words, not the standard's)

Spec ORV-128 v1.14, Depth bound, Nesting pre-pass (`docs/specs/ORV-128/spec.md`, line 164) names 13 void elements, 19 elements whose end tag is optional and 9 elements read as text (counted by hand on that line). The void list is the standard's list, name for name, and so is the optional end tag list: no element is in one and not the other. The text list (`script`, `style`, `textarea`, `title`, `xmp`, `iframe`, `noembed`, `noframes`, `plaintext`) is wider than the standard's two named kinds, which hold only `script`, `style`, `textarea` and `title`; the other five, `xmp`, `iframe`, `noembed`, `noframes` and `plaintext`, come from the parser's rules, not from 13.1.2. Against the parser's rules the spec lacks one element, `noscript`, which the standard reads as raw text only when scripting mode is not Disabled; spec rule `html-text-1` (line 189) parses with scripting off, the setting under which the standard leaves `noscript` in the data state. The spec lists no element that the standard does not. Two further gaps between the texts: the standard lets an end tag be omitted only under the condition in its line of the list above (for `p`, the next element or the parent), while the pre-pass treats these 19 elements as never opening a level whatever follows; and the standard's raw text rules are stated per insertion mode, while the pre-pass sentence names no insertion mode or namespace. Whether either gap matters is for the architect and `security`; this entry does not decide it.

### What the sources read do not say

- **How the parser closes an element whose end tag is omitted.** Optional tags is an authoring rule ("may be omitted"). The tree builder steps that close an open `p`, `li` or table cell, and any other element the parser closes without an end tag, were not read.
- **What ends a PLAINTEXT, RAWTEXT, RCDATA or script data run.** The tokenizer state sections were seen only by their opening line; their end tag handling was not read.
- **The restrictions in 13.1.2.6.** Not read.

### Claims that did not re-check

- Asked about the "in foreign content" rules (inside `svg` or `math`), the fetch tool answered that no rule there switches the tokenizer to the RCDATA, RAWTEXT, script data or PLAINTEXT state. It returned no quote for this, so it is not recorded as a fact and carries no confidence.

## Why it matters for ORIVILO

The Nesting pre-pass of spec ORV-128 (slice 1b of ORV-133) cites "the WHATWG HTML standard's lists" without a knowledge entry. This entry records those lists with their anchors and the date read, shows that the void and optional end tag lists match, and names the one element, `noscript`, that the parser reads as text under a condition and that the spec's text list leaves out.
