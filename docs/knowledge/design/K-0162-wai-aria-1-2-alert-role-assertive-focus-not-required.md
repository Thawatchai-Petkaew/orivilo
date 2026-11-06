---
id: K-0162
topic: design
claim: In WAI-ARIA 1.2, role alert is an assertive, atomic live region for important and usually time-sensitive information; focus need not move to it, authors should not require users to close it, and an author who wants focus to move to the message should use alertdialog, which can take a response and should be modal.
source: "https://www.w3.org/TR/wai-aria-1.2/; docs/specs/ORV-64/audit.md"
retrieved: 2026-11-06
confidence: 0.8
applies_to: [ORV-222]
license: link-only
---

## Evidence

Read on 2026-11-06 through a fetch tool, from the `alert` and `alertdialog` definitions, returned in pieces and joined below with `...` where a break fell. Confidence 0.8: the W3C Recommendation, one source. Role status and `aria-live` are in K-0114.

### alert

> A type of live region with important, and usually time-sensitive, information.

> An alert is a specialized form of the status role, which is processed as an atomic live region.

> Alerts are assertive live regions, which means they cause immediate notification ... for assistive technology users.

> Neither authors nor user agents are required to set or manage focus to an alert ... in order for it to be processed.

> Since alerts are not required to receive focus, authors SHOULD NOT require users to close an alert.

> If an author desires focus to move to a message when it is conveyed, the author ... SHOULD use alertdialog instead of alert.

Implicit values: "Elements with the role alert have an implicit aria-live value of assertive," and "an implicit aria-atomic value of true." Superclass: section. Name from: author. The tool found no "accessible name required" row in the table.

### alertdialog

> A type of dialog that contains an alert message, where initial focus goes to an element within the dialog.

> Unlike alert, alertdialog can receive a response from the user.

> Content authors SHOULD make alert dialogs modal by ensuring that, while the alertdialog is shown, ... keyboard and mouse interactions only operate within the dialog.

## Why it matters for ORIVILO

An inline alert with a dismiss button stays within role alert as long as nobody has to press it. A message that must move focus or wait for an answer is a dialog, and `docs/specs/ORV-64/audit.md` already lists ConfirmDialog as a separate story.
