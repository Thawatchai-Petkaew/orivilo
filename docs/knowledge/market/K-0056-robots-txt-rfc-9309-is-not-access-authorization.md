---
id: K-0056
topic: market
claim: RFC 9309 (September 2022) standardises robots.txt, says its rules are not a form of access authorization, tells crawlers not to rely on a cached copy for more than 24 hours and to assume complete disallow when the file is unreachable, asks for a product token matched case-insensitively, and before comparing a rule path with a URI has non-ASCII and reserved-range octets percent-encoded and percent-encoded unreserved ASCII octets in the URI unencoded, with an asterisk matching any run of characters and a dollar sign ending the pattern, and says crawlers SHOULD impose a parsing limit that MUST be at least 500 kibibytes; common website terms separately forbid bots and scraping.
source: "https://www.rfc-editor.org/rfc/rfc9309.html (#section-2.5 among others); https://www.rfc-editor.org/rfc/rfc9309.txt; https://www.linkedin.com/legal/user-agreement; https://www.rfc-editor.org/rfc/rfc3986.html; docs/specs/ORV-128/spec.md (v1.18: lines 158 to 161, line 165, lines 391 and 392, lines 397 to 399, line 550)"
retrieved: 2026-10-27
confidence: 0.8
applies_to: [ORV-127, ORV-128, ORV-133]
license: own-words
---

## Evidence

Not legal advice. RFC 9309 is a Standards Track IETF document, read directly. The website-terms part is one example read, not a survey.

From RFC 9309:

> These rules are not a form of access authorization.

> Crawlers SHOULD NOT use the cached version for more than 24 hours, unless the robots.txt file is unreachable.

On a server or network error the file is "unreachable" and "the crawler MUST assume complete disallow"; on a 4xx status the crawler may access the site. The product token "SHOULD be a substring of the identification string that the crawler sends to the service", and crawlers "MUST use case-insensitive matching to find the group that matches the product token."

The first two quotes are in section 1 and section 2.4. The sections below were read on 2026-10-27 for ORV-128 spec v1.12 and ORV-133, from the same RFC (the `.html` page cited in `source:`, checked against the `.txt` rendering of the same RFC).

### Product token grammar (sections 2.2 and 2.2.1)

The ABNF in section 2.2:

```text
product-token = identifier / "*"
identifier = 1*(%x2D / %x41-5A / %x5F / %x61-7A)
```

`%x2D` is the hyphen, `%x41-5A` is A to Z, `%x5F` is the underscore and `%x61-7A` is a to z. The range `%x30-39` (the digits 0 to 9) is not in `identifier`. Section 2.2.1 says the same in words:

> The product token MUST contain only uppercase and lowercase letters ("a-z" and "A-Z"), underscores ("_"), and hyphens ("-").

### Which group applies (section 2.2.1)

> Crawlers MUST use case-insensitive matching to find the group that matches the product token and then obey the rules of the group.

> If there is more than one group matching the user-agent, the matching groups' rules MUST be combined into one group and parsed according to Section 2.2.2.

> If no matching group exists, crawlers MUST obey the group with a user-agent line with the "*" value, if present.

> If no group matches the product token and there is no group with a user-agent line with the "*" value, or no groups are present at all, no rules apply.

Read together: when one or more groups match the product token, the crawler obeys those groups, combined; the `*` group is obeyed when no group matches; with neither, no rules apply. The RFC text does not tell a crawler to obey the matching group and the `*` group together.

### Allow and Disallow matching (sections 2.2.2 and 2.2.3)

Read on 2026-10-27 for ORV-128 spec v1.14, from the `.html` page cited in `source:`; the "case sensitive", "Octets in the URI", "If a percent-encoded" and "The match evaluates positively" sentences of section 2.2.2 below, and rows 3 to 5 of Figure 4, were checked against the `.txt` rendering. Each quote block is one sentence or one run of sentences as found; quote blocks are not claimed to be adjacent in the RFC.

Section 2.2.2, how a rule path is compared with a URI:

> The matching MUST start with the first octet of the path.

> The matching SHOULD be case sensitive.

> The most specific match found MUST be used.

> The most specific match is the match that has the most octets.

> If an "allow" rule and a "disallow" rule are equivalent, then the "allow" rule SHOULD be used.

> If no match is found amongst the rules in a group for a matching user-agent or there are no rules in the group, the URI is allowed.

Section 2.2.2, percent-encoding before the comparison:

> Octets in the URI and robots.txt paths outside the range of the ASCII coded character set, and those in the reserved range defined by [RFC3986], MUST be percent-encoded as defined by [RFC3986] prior to comparison.

> If a percent-encoded ASCII octet is encountered in the URI, it MUST be unencoded prior to comparison, unless it is a reserved character in the URI as defined by [RFC3986] or the character is outside the unreserved character range.

> The match evaluates positively if and only if the end of the path from the rule is reached before a difference in octets is encountered.

> Implementors MAY bridge encoding mismatches if they detect that the robots.txt file is not UTF-8 encoded.

The section then gives Figure 4, "Examples of matching percent-encoded URI components", introduced by "For example:". Its rows, with each cell the RFC wraps over two lines joined here:

```text
Path                          | Encoded Path                        | Path to Match
/foo/bar?baz=quz              | /foo/bar?baz=quz                    | /foo/bar?baz=quz
/foo/bar?baz=https://foo.bar  | /foo/bar?baz=https%3A%2F%2Ffoo.bar  | /foo/bar?baz=https%3A%2F%2Ffoo.bar
/foo/bar/U+E38384             | /foo/bar/%E3%83%84                  | /foo/bar/%E3%83%84
/foo/bar/%E3%83%84            | /foo/bar/%E3%83%84                  | /foo/bar/%E3%83%84
/foo/bar/%62%61%7A            | /foo/bar/%62%61%7A                  | /foo/bar/baz
```

Section 2.2.3, special characters:

> Crawlers MUST support the following special characters:

Two of the three rows of Figure 5, "List of special characters in robots.txt files" (the third, `#`, "Designates a line comment."):

```text
Character | Description                                       | Example
$         | Designates the end of the match pattern.          | allow: /this/path/exactly$
*         | Designates 0 or more instances of any character.  | allow: /this/*/exactly
```

> If crawlers match special characters verbatim in the URI, crawlers SHOULD use "%" encoding. For example:

Figure 6, "Example of percent-encoding":

```text
Percent-encoded Pattern     | URI
/path/file-with-a-%2A.html  | https://www.example.com/path/file-with-a-*.html
/path/foo-%24               | https://www.example.com/path/foo-$
```

Neither section says whether the hex digits of a percent-encoding are upper or lower case, or how they compare; Figure 4 writes them in upper case without a sentence that requires it. Section 2.2.2 states the unencoding for "the URI" only and says nothing in words about unencoding the rule path.

In our own words, not the RFC's, against rule `robots-match-1` of spec ORV-128 v1.18 (`docs/specs/ORV-128/spec.md`, lines 158 to 161: its parts Normalisation, Matching and Caps; and "Hypotheses", lines 397 to 399). This paragraph was first written against v1.14, the rule as it stood when section 2.2.2 was read; v1.15 split the rule into those three parts, and v1.16 changed Matching (F22). The rule takes from section 2.2.2 the percent-encoding of octets outside ASCII (it applies this to the pattern, "as UTF-8"; the spec says the URL's path arrives percent-encoded) and the decoding of percent-encoded unreserved characters, and from section 2.2.3 the `*` and `$` of its matcher, which starts at the path's first character. Three parts of the rule are not in the RFC text read here: it decodes on the pattern side as well as the path (the RFC sentence names the URI; Figure 4's last row shows `%62%61%7A` matched as `baz` without saying which side its Path column is); it writes and compares hex digits case-insensitively (neither section speaks to hex case; what RFC 3986, to which the RFC defers, says on it is in the next subsection); and its list of unreserved characters is RFC 3986's (next subsection). v1.18 records the first two as readings of the RFC, grounded on RFC 3986 for URIs ("Hypotheses", line 397, "Hex case and decoding in `robots-match-1`"), and names the six unreserved kinds in Normalisation.

When this paragraph compared v1.14, the RFC said four things the rule did not state. Against v1.18:

1. **Reserved characters.** The RFC says octets "in the reserved range" MUST be percent-encoded before comparison. Normalisation now states the other choice in words: "a reserved character written as itself stays as written and is not percent-encoded". "Hypotheses" (line 398) records it as a reading of Figure 4 row 1 (row 2 encodes `:` and `/` in a query, row 1 leaves `/`, `?` and `=` unencoded, so the figure does not encode every reserved character either). Now stated, as a reading that departs from the MUST.
2. **`%2A` and `%24`.** A pattern holding `%2A` or `%24` matches a literal `*` or `$` in the URI (Figure 6). Matching now states it, and since v1.16 (F22) also lets the pattern match the percent-encoding `%2A` or `%24` in the path; "Hypotheses" (line 399) records that second half as a reading. Now stated.
3. **A robots.txt that is not UTF-8.** An implementor MAY bridge encoding mismatches in a robots.txt that is not UTF-8. Spec v1.18 "Hypotheses" (line 392) says a robots.txt is decoded as UTF-8, each invalid sequence replaced by U+FFFD, and no encoding mismatch is bridged (ours, POC). Stated, outside the rule.
4. **Most octets, allow on a tie.** Matching now states it: "the most specific match is used: the rule whose normalised pattern has the most octets; an allow and a disallow of equal length give allow". The worked example for `robots-group-1` (line 550) points to this part of the rule. Now stated.

The Caps part (line 161) sets bounds of its own: a pattern over 1,000 characters after normalisation is ignored, and a file of more than 5,000 `allow` or `disallow` lines, or of more than 100,000 pattern characters, is complete disallow. No quote of sections 2.2.2 and 2.2.3 above sets a size or count bound; the RFC's one limit read here is section 2.5 (below).

### RFC 3986, the sets and the normalisation (sections 2.1 to 2.3 and 6.2.2)

Read on 2026-10-27 for ORV-133, from RFC 3986 (January 2005, Standards Track), the `https://www.rfc-editor.org/rfc/rfc3986.html` page cited in `source:`. RFC 9309 section 2.2.2 names it as `[RFC3986]`. The quotes from sections 2.1 to 2.3 were checked against the `.txt` rendering of the same RFC; the section 6.2.2 quotes were read on the `.html` page only. Each quote block is one sentence or one run of sentences as found; quote blocks are not claimed to be adjacent in the RFC.

Section 2.1, Percent-Encoding, the ABNF:

```text
pct-encoded = "%" HEXDIG HEXDIG
```

> The uppercase hexadecimal digits 'A' through 'F' are equivalent to the lowercase digits 'a' through 'f', respectively.

> If two URIs differ only in the case of hexadecimal digits used in percent-encoded octets, they are equivalent.

> For consistency, URI producers and normalizers should use uppercase hexadecimal digits for all percent-encodings.

Section 2.2, Reserved Characters, the ABNF (the RFC wraps `sub-delims` over two lines, kept here):

```text
reserved    = gen-delims / sub-delims
gen-delims  = ":" / "/" / "?" / "#" / "[" / "]" / "@"
sub-delims  = "!" / "$" / "&" / "'" / "(" / ")"
            / "*" / "+" / "," / ";" / "="
```

> URIs that differ in the replacement of a reserved character with its corresponding percent-encoded octet are not equivalent.

Section 2.3, Unreserved Characters, the ABNF:

```text
unreserved  = ALPHA / DIGIT / "-" / "." / "_" / "~"
```

> Characters that are allowed in a URI but do not have a reserved purpose are called unreserved. These include uppercase and lowercase letters, decimal digits, hyphen, period, underscore, and tilde.

> URIs that differ in the replacement of an unreserved character with its corresponding percent-encoded US-ASCII octet are equivalent: they identify the same resource.

> For consistency, percent-encoded octets in the ranges of ALPHA (%41-%5A and %61-%7A), DIGIT (%30-%39), hyphen (%2D), period (%2E), underscore (%5F), or tilde (%7E) should not be created by URI producers and, when found in a URI, should be decoded to their corresponding unreserved characters by URI normalizers.

Section 6.2.2.1, Case Normalization:

> For all URIs, the hexadecimal digits within a percent-encoding triplet (e.g., "%3a" versus "%3A") are case-insensitive and therefore should be normalized to use uppercase letters for the digits A-F.

Section 6.2.2.2, Percent-Encoding Normalization:

> These URIs should be normalized by decoding any percent-encoded octet that corresponds to an unreserved character, as described in Section 2.3.

"These URIs" are those of the sentence before it, URIs from producers that "percent-encode octets that do not require percent-encoding". Every "should" quoted in this subsection is in lower case in the RFC.

In our own words, not the RFC's: of the three parts of rule `robots-match-1` that the previous subsection found not in RFC 9309's text, RFC 3986 grounds two and does not ground the third. The unreserved list is grounded: section 2.3 names the same six kinds as the rule (letters, digits, hyphen, period, underscore, tilde), with their octet ranges. Hex compared case-insensitively, and written in upper case, is grounded for URIs: section 2.1 says two URIs differing only in hex case are equivalent and asks for upper case, and section 6.2.2.1 says the same. That this carries into a robots.txt match is our reading: RFC 9309 says paths are "percent-encoded as defined by [RFC3986]", and section 2.1 is where RFC 3986 defines it, but RFC 9309 itself says its matching "SHOULD be case sensitive" without excepting hex digits. Decoding on the pattern side is not grounded: sections 2.3 and 6.2.2.2 speak of URIs and URI normalizers, and neither RFC read here says a robots.txt rule path is a URI or is decoded; RFC 3986 grounds only that `/private` and `/%70rivate` are equivalent as URIs. Section 2.2 also bears on the rule's other half: a percent-encoded reserved character is not equivalent to the character, which fits the rule keeping every other percent-encoding encoded; and `*` and `$`, the two characters RFC 9309 Figure 6 escapes as `%2A` and `%24` to match them literally, are both in `sub-delims`. Since spec v1.16 (F22) Matching makes one exception: a pattern's `%2A` or `%24` matches both the written character and its percent-encoding in the path, which spec v1.18 "Hypotheses" (line 399) records as a reading, naming RFC 3986 section 2.2.

### Redirects (section 2.3.1.2)

> The crawlers SHOULD follow at least five consecutive redirects, even across authorities (for example, hosts in the case of HTTP).

> If a robots.txt file is reached within five consecutive redirects, the robots.txt file MUST be fetched, parsed, and its rules followed in the context of the initial authority. If there are more than five consecutive redirects, crawlers MAY assume that the robots.txt file is unavailable.

The section opens with the example of "HTTP 301 or HTTP 302 in the case of HTTP". "Unavailable" is the section 2.3.1.3 status below, under which a crawler may access any resource.

### Unavailable, 4xx (section 2.3.1.3)

> "Unavailable" means the crawler tries to fetch the robots.txt file and the server responds with status codes indicating that the resource in question is unavailable. For example, in the context of HTTP, such status codes are in the 400-499 range.

> If a server status code indicates that the robots.txt file is unavailable to the crawler, then the crawler MAY access any resources on the server.

### Unreachable, 5xx (section 2.3.1.4)

> If the robots.txt file is unreachable due to server or network errors, this means the robots.txt file is undefined and the crawler MUST assume complete disallow. For example, in the context of HTTP, server errors are identified by status codes in the 500-599 range.

> If the robots.txt file is undefined for a reasonably long period of time (for example, 30 days), crawlers MAY assume that the robots.txt file is unavailable as defined in Section 2.3.1.3 or continue to use a cached copy.

### Limits (section 2.5)

Read on 2026-10-27 for ORV-133, from the RFC Editor's `.html` page (heading "2.5. Limits", anchors `#section-2.5` and `#name-limits`, <https://www.rfc-editor.org/rfc/rfc9309.html#section-2.5>), and checked against the `.txt` rendering, which gave the same two sentences. The fetch tool answers questions about a page and gives its quotes in pieces; no page was opened byte by byte.

> Crawlers SHOULD impose a parsing limit to protect their systems; see Section 3. The parsing limit MUST be at least 500 kibibytes [KiB].

The `[KiB]` reference, from the `.txt` rendering: "Kibibyte", Simple English Wikipedia, the free encyclopedia, 17 September 2020, <https://simple.wikipedia.org/wiki/Kibibyte>.

Section 3, the "Memory management" item, returned by the fetch in two pieces, joined here:

> Section 2.5 defines the lower limit of bytes that must be processed, which inherently also protects the parser from out-of-memory scenarios.

Asked whether any sentence says what a crawler does with the part of a file past its parsing limit, or with a file larger than the limit, the fetch of the `.html` page found none. The same answer quoted section 2.3.1.5, on parsing errors: "Crawlers MUST try to parse each line of the robots.txt file." That quote came from one fetch of the `.html` page only.

In our own words, not the RFC's: spec ORV-128 v1.18, Bounded (line 165), caps each robots.txt answer at 500 KiB and treats a longer one as complete disallow, failing closed, with no part of it parsed (FU-4); "Hypotheses" (line 391) cites section 2.5 for the 500 KiB as the RFC floor, and keeps failing closed past it as its own choice (spec v1.18). The cap equals the lower limit section 2.5 sets, so it is at least 500 kibibytes as the MUST asks. What the spec does past the cap is not in the RFC text read here, which says nothing on a file past the limit. The main session decided (task ORV-133-research-bookkeeping-2) that no further reading is recorded in the spec for the section 3 sentence "Section 2.5 defines the lower limit of bytes that must be processed", since complete disallow is the more restrictive result and overrides no site owner's wish; that sentence stays quoted above as the record.

### Website terms (one example)

LinkedIn's User Agreement, section 8.2 (Don'ts), forbids, among others:

> Use bots or other unauthorized automated methods to access the Services

How binding such terms are depends on whether the reader agreed to them (see [[K-0058-us-facts-free-and-scraping-cases]] for a US court's distinction between account holders and logged-out readers). Thai law on terms a visitor never clicked was not researched; that needs a lawyer.

## Why it matters for ORIVILO

robots.txt is a convention, not a lock, but it is the site owner's stated wish and the standard tells a crawler how to honour it. An ORIVILO reader that names itself, re-reads robots.txt daily and stops on errors follows the standard.
