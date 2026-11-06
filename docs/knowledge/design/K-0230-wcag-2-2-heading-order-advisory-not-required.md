---
id: K-0230
topic: design
claim: In the WCAG 2.2 pages read heading order is guidance, not a criterion: SC 1.3.1 (A) asks that headings be marked up and lists G141 as advisory, SC 2.4.6 (AA) asks only that headings present describe their topic, SC 2.4.10 (AAA) asks for section headings, and G141 and H69 say to nest headings; the APG pages read state nothing on heading order.
source: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html; https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html; https://www.w3.org/WAI/WCAG22/Understanding/section-headings.html; https://www.w3.org/WAI/WCAG22/Techniques/general/G141; https://www.w3.org/WAI/WCAG22/Techniques/html/H69; https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/; https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/; https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-225]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with short quotes.

SC 1.3.1 (Level A) lists as sufficient "H42: Using h1-h6 to identify headings" and "ARIA12: Using role=heading to identify headings". G141, "Organizing a page using headings", sits under Advisory Techniques there. The page does not address heading level order.

SC 2.4.6 (Level AA):

> Headings and labels describe topic or purpose.

The page says this applies only when headings or labels are present, and that it does not require them.

SC 2.4.10 (Level AAA):

> Section headings are used to organize the content.

Sufficient: G141, H69. The page does not discuss heading order.

G141:

> authors should use headings that are properly nested

> (e.g., `h1` followed by `h2`, `h2` followed by `h2` or `h3`, `h3` followed by `h3` or `h4`, etc.)

H69:

> Headings are designed to convey logical hierarchy.

> Skipping levels in the sequence of headings may create the impression that the structure of the document

> has not been properly thought through or that specific headings have been chosen for their visual rendering

> Authors are encouraged to nest headings hierarchically.

APG, the three practice pages searched: Structural Roles has the row "heading with aria-level="N" where N is 1, 2, 3, 4, 5, or 6", equal to `h1` to `h6`. Landmark Regions mentions a heading only as a possible label for an area (K-0224). Names and Descriptions states nothing on heading order. Other APG pages were not read.

## Why it matters for ORIVILO

A skipped level is not by itself an SC 1.3.1 failure in these pages; the order rule ORIVILO can lean on is WHATWG's (K-0231). Which of the two to treat as the bar is the designer's call.
