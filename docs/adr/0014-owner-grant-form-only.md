# ADR 0014: The owner grants a rework round only in the question form

- Status: accepted
- Date: 2026-10-23
- Decided by: the owner, in a question form on 2026-10-23, after the third spec review of ORV-81: "กดเลือกในแบบฟอร์มเท่านั้น" (count only answers clicked in the question form). Jira ORV-85 comment 10063.
- Builds on: ADR 0013 (the `/ovl` orchestrator), ADR 0012 (who passes each gate). Neither is superseded.
- Amends: ADR 0013 decision 5 (the `owner-grant` bullet) and decision 7 (how the owner grants a round after round 2). ADR 0013 is merged and is not rewritten; its Status line points here.

## Context

ADR 0013 decision 7 lets the owner grant a rework round after round 2 "by answering in chat", and decision 5 has `owner-grant` record a grant phrase with the issue key from a prompt whose `source` is `user`, or from the owner's answer to a question form. Spec ORV-81 v1.3 (R3-3) kept that rule and left one question for slice A2: does a typed prompt carry `source: "user"`?

Slice A2 (ORV-85) recorded real hook input from Claude Code 2.1.282 (`docs/specs/ORV-85/stdin-samples.md`, `scripts/ovl/fixtures/hook-stdin/`). Two facts came out of it:

1. A UserPromptSubmit in a headless run has no `source` field at all (`UserPromptSubmit-headless.json`).
2. When a background agent finishes, its report reaches the main session as a UserPromptSubmit whose `prompt` is a `<task-notification>` block, also with no `source` (`UserPromptSubmit-task-notification.json`).

Whether an interactive typed prompt carries `source: "user"` cannot be recorded headless, so it is unconfirmed. With what we can prove, a hook cannot tell text the owner typed from a prompt Claude Code built itself, or from text pasted into chat. A grant read from UserPromptSubmit would rest on a field we have never seen.

## Decision

1. **Only a clicked option in a question form grants a round.** `owner-grant` runs on PostToolUse with matcher `AskUserQuestion`, and on no other event. No hook reads UserPromptSubmit for a grant. Text typed or pasted into chat never grants a round, in English or in Thai, and neither does a prompt Claude Code builds itself.
2. **What the hook checks.** While an issue is escalated (its rounds used equal its allowance and its latest verdict requests changes), `owner-grant` writes one record only when all of these hold:
   - The hook input has no `agent_id`, so the main session asked the form, not a subagent.
   - The answer is the label of one of the options the question offered. A free-text answer, such as text typed under Other, grants nothing.
   - The label contains a grant phrase (`อนุญาตรอบ` or `grant round`, case-insensitive) and the key `ORV-<n>` of an escalated issue. The key is always required, so the issue is never guessed.
   - Every field the hook reads is present: the question, its option labels and the chosen answer.
3. **Fails closed.** Malformed input, a missing field, an error or a missing interpreter writes no record and exits 2, like every other hook in ADR 0013 decision 5. Exit 2 after PostToolUse erases nothing; it tells the main session why no grant was written.
4. **The record** quotes the question, the options, the answer and the time. Each record adds one round to the issue's allowance, as ADR 0013 decision 7 already says.
5. **How the form is asked.** The `ovl` skill offers the grant as `อนุญาตรอบ ORV-<n>` or `Grant round ORV-<n>`, next to a decline option.

Spec ORV-81 holds the details and the acceptance rows (Hooks, `owner-grant`; AC 14, 47, 48, 64, 72, 73, 78, 79; the v1.3 change-log line "Post-review owner decision").

## Consequences

- An owner who types "อนุญาตรอบ ORV-81" in chat is refused and must answer the form. That costs one more step; it is the owner's choice.
- The record is still weaker than one written from the owner's terminal. The main session writes the question and its options, so the owner's click is the only proof. The spec's Honest limits say so.
- The `owner-grant` fixture is built from a real answered form: the `toolUseResult` of an `AskUserQuestion` call the owner answered in a Claude Code 2.1.308 session transcript, excerpt at `docs/specs/ORV-85/askuserquestion-transcript-excerpt.json`. It is not recorded hook stdin. A live PostToolUse(`AskUserQuestion`) hook delivery is still unconfirmed, so a missing or differently shaped field fails closed.
- The samples come from Claude Code 2.1.282, the `claude` on PATH, while the owner's IDE session runs 2.1.308. The hook does not assume the newer shape; the samples are re-recorded when the guards must target 2.1.308.
- The `owner-grant` test checks that `.claude/settings.json` registers it on no event other than PostToolUse(`AskUserQuestion`), and feeds it the recorded UserPromptSubmit samples, which must write nothing.

## What this changes in earlier docs

- **ADR 0013, decision 5, `owner-grant` bullet.** Read it as decision 2 above: the hook runs on PostToolUse(`AskUserQuestion`) from the main session only, and a prompt's `source` grants nothing.
- **ADR 0013, decision 7.** "By answering in chat" now means "by clicking a grant option in a question form the main session asks". The record quotes the question, the options and the answer, not the owner's free words.
- **ADR 0013, Status.** Gains one sentence that points here.
- **Spec ORV-81 v1.3.** Already records the decision in its change log, without a version bump; its references to the grant rule cite this ADR.
- **`ovl` skill** (slice D): asks the grant form as decision 5 says.
