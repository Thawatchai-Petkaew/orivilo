---
id: K-0115
topic: design
claim: WCAG 2.2 SC 4.1.3 Status Messages (Level AA) requires a status message to be programmatically determinable through role or properties so assistive technologies can present it without focus, and its definition of a status message names the waiting state of an application and the progress of a process; its techniques for progress include role=status, role=log and a live region.
source: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html"
retrieved: 2026-11-01
confidence: 0.8
applies_to: [ORV-201]
license: link-only
---

## Evidence

Read on 2026-11-01 through a fetch tool. Confidence 0.8: the W3C Understanding document, one source. The tool returned the SC text in pieces, joined below with `...`.

> In content implemented using markup languages ... status messages can be programmatically determined through role or properties ... such that they can be presented to the user by assistive technologies without receiving focus.

Definition of status message:

> change in content that is not a change of context ... provides information to the user on the success or results of an action, on the waiting state of an application, on the progress of a process, or on the existence of errors

Examples on the page include "an icon symbolizing 'busy' appears on the screen. The screen reader announces "application busy"." For progress (Situation C) the techniques listed are "Using role=log to identify sequential information updates", "Using an ARIA live region to convey the status of a progress bar", "Using role=status to present status messages" and "Using ariaNotify to convey the status of a progress bar".

## Why it matters for ORIVILO

By our reading, a spinner or skeleton that tells a sighted user "loading" shows the waiting state this definition names, so a silent spinner (K-0108) would need a status element beside it under this AA criterion. The page does not name spinners or skeletons.
