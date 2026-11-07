---
id: K-0283
topic: design
claim: In WAI-ARIA 1.2 role progressbar requires an accessible name, should carry aria-valuenow unless indeterminate, defaults aria-valuemin to 0 and aria-valuemax to 100, and, when describing a region's loading, should point to the status with aria-describedby while the region has aria-busy true.
source: "https://www.w3.org/TR/wai-aria-1.2/#progressbar"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-227]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool that returns a summary with quotes of at most 125 characters, in ranges of the 446,886 character page: 0 to 100,000 and 200,000 to 300,000 for this entry. K-0114 holds the role's purpose beside role status.

> An element that displays the progress status for tasks that take a long time.

> The author SHOULD supply a value for aria-valuenow unless the value is indeterminate, in which case the author SHOULD omit the aria-valuenow attribute.

> If aria-valuemin is missing or not a number, it defaults to 0 (zero).

> If aria-valuemax is missing or not a number, it defaults to 100.

> the author SHOULD use aria-describedby to point to the status,

> and set the aria-busy attribute to true on the region until it is finished loading.

Section 5.2.8.4 lists progressbar among the roles with "name required". The `aria-describedby` sentence opens "If the progressbar is describing the loading progress of a particular region of a page,".

## Why it matters for ORIVILO

Each row of an upload list has its own bar, so each bar needs its own name; the file name is the available text (own reading).
