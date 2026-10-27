---
id: K-0056
topic: market
claim: RFC 9309 (September 2022) standardises robots.txt, says its rules are not a form of access authorization, tells crawlers not to rely on a cached copy for more than 24 hours and to assume complete disallow when the file is unreachable, and asks for a product token matched case-insensitively; common website terms separately forbid bots and scraping.
source: "https://www.rfc-editor.org/rfc/rfc9309.html; https://www.linkedin.com/legal/user-agreement"
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

### Website terms (one example)

LinkedIn's User Agreement, section 8.2 (Don'ts), forbids, among others:

> Use bots or other unauthorized automated methods to access the Services

How binding such terms are depends on whether the reader agreed to them (see [[K-0058-us-facts-free-and-scraping-cases]] for a US court's distinction between account holders and logged-out readers). Thai law on terms a visitor never clicked was not researched; that needs a lawyer.

## Why it matters for ORIVILO

robots.txt is a convention, not a lock, but it is the site owner's stated wish and the standard tells a crawler how to honour it. An ORIVILO reader that names itself, re-reads robots.txt daily and stops on errors follows the standard.
