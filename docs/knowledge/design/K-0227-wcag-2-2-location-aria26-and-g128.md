---
id: K-0227
topic: design
claim: WCAG 2.2 SC 2.4.8 Location is AAA and lists breadcrumbs (G65), a site map (G63), current location in navigation bars (G128) and aria-current (ARIA26) as sufficient; ARIA26's test is that an item highlighted in a set has aria-current, and G128 says the indication may be an icon, text or a changed state.
source: "https://www.w3.org/WAI/WCAG22/Understanding/location.html; https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA26; https://www.w3.org/WAI/WCAG22/Techniques/general/G128"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

SC 2.4.8, Level AAA:

> Information about the user's location within a set of web pages is available.

Sufficient techniques listed: "G65: Providing a breadcrumb trail", "G63: Providing a site map", "G128: Indicating current location within navigation bars", "ARIA26: Using aria-current to identify the current item in a set", "G127: Identifying a web page's relationship to a larger collection of web pages".

ARIA26 (updated 09 March 2026):

> to programmatically indicate the current item in a user interface component

Example: `<a href="/food" aria-current="page">Food</a>`.

> For each component that contains a set of related elements where one element is visually highlighted

The test then checks that the highlighted item has an `aria-current` attribute with a suitable value.

G128:

> The location may be indicated by adding an icon or text, or by changing the state of the item.

> Check that the user is given an indication of the currently selected item within the navigational unit.

> Check that the selected item matches the content which is being displayed.

## Why it matters for ORIVILO

Location is AAA, so ARIA26 here is an available technique, not an AA requirement. The second G128 check is the one a Slim rail tracking a pressed item, or a drawer with no `activeUrl`, has to be read against (K-0206, K-0207, K-0209).
