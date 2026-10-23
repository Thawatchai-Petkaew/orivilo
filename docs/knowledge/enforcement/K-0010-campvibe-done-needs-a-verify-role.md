---
id: K-0010
topic: enforcement
claim: In Camp Vibes, complete() refuses to move a story to Done unless a QA or Security role appears in the ticket's role history, so the Verify stage is code, not convention.
source: "~/Claude/Projects/CAMPVIBE/lib/delivery/tickets.ts:345-359 (hasPassedVerify in lib/delivery/verify-stage.ts)"
retrieved: 2026-10-23
confidence: 0.8
applies_to: [ORV-81]
license: internal
---

## Evidence

```ts
  // Verify-coverage guard: a STORY cannot reach Done unless it passed through a
  // Verify-stage role (QA or Security). Role rotation was previously pure
  // convention [-] a solo, frontend-only run could complete without QA/Security ever
  // appearing on the board or in Telegram. This makes the Verify stage enforceable.
  ...
  if (ticket.type === "STORY" && !hasPassedVerify(ticket.roleHistory)) {
    throw new TicketTransitionError(
```

## Why it matters for ORIVILO

ORV-81 asks for QA acceptance on every story ([[L-0006-main-session-worked-solo]]). Camp Vibes found that a written rotation was skipped by solo runs until the terminal transition refused it. Our equivalent would be a check that blocks the Done transition, or the G3 packet, without a QA agent's report.
