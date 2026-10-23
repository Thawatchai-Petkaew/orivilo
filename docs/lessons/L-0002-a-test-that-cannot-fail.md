---
id: L-0002
date: 2026-10-23
issue: [ORV-78]
what_happened: The first DropdownMenu focus-ring check, and a pointer-hover version after it, both passed with the ring rule removed.
cause: In the vitest-browser runner, script focus matched the global :focus-visible ring (outline 2px, offset +2px), so asserting outlineStyle "solid" was true with or without the item's own ring rule.
rule: A new test that guards a visual or accessibility property is run once against a deliberately broken version, and the PR records the red result before the test counts as evidence.
---

## What happened

In ORV-78 a highlighted checked item gets its own focus ring, drawn inside the selected fill. The first check was `minimap.focus(); expect(outlineStyle).toBe("solid")`. With the ring rule removed it still passed ("ring removed only: Tests 2 passed"). Script focus had matched the global `:focus-visible` ring (outline 2px, offset +2px), which is also solid. A version that hovered with the pointer also passed with the rule removed.

The merged test asserts the property only the item's rule sets, `outlineOffset === "-2px"`. Without the rule it goes red ("Expected: -2px, Received: 2px").

## Rule

- Before a guard test counts, break the thing it guards (remove the rule, change the token), run the test, and paste the failing line in the PR. Then restore.
- Assert the value that only the rule under test produces, not one a global or default style can also produce.
- QA checks for the red run when it accepts the story.

Status: proposed (targets `.claude/rules/testing.md` and `.claude/agents/reviewer.md`, or the QA role ORV-81 adds)
