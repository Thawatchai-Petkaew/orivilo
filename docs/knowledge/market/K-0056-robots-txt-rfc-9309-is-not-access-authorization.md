---
id: K-0056
topic: market
claim: RFC 9309 (September 2022) standardises robots.txt, says its rules are not a form of access authorization, tells crawlers not to rely on a cached copy for more than 24 hours and to assume complete disallow when the file is unreachable, and asks for a product token matched case-insensitively; common website terms separately forbid bots and scraping.
source: "https://www.rfc-editor.org/rfc/rfc9309.html; https://www.linkedin.com/legal/user-agreement"
retrieved: 2026-10-26
confidence: 0.8
applies_to: [ORV-127]
license: own-words
---

## Evidence

Not legal advice. RFC 9309 is a Standards Track IETF document, read directly. The website-terms part is one example read, not a survey.

From RFC 9309:

> These rules are not a form of access authorization.

> Crawlers SHOULD NOT use the cached version for more than 24 hours, unless the robots.txt file is unreachable.

On a server or network error the file is "unreachable" and "the crawler MUST assume complete disallow"; on a 4xx status the crawler may access the site. The product token "SHOULD be a substring of the identification string that the crawler sends to the service", and crawlers "MUST use case-insensitive matching to find the group that matches the product token."

### Website terms (one example)

LinkedIn's User Agreement, section 8.2 (Don'ts), forbids, among others:

> Use bots or other unauthorized automated methods to access the Services

How binding such terms are depends on whether the reader agreed to them (see [[K-0058-us-facts-free-and-scraping-cases]] for a US court's distinction between account holders and logged-out readers). Thai law on terms a visitor never clicked was not researched; that needs a lawyer.

## Why it matters for ORIVILO

robots.txt is a convention, not a lock, but it is the site owner's stated wish and the standard tells a crawler how to honour it. An ORIVILO reader that names itself, re-reads robots.txt daily and stops on errors follows the standard.
