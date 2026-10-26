---
id: L-0032
date: 2026-10-26
issue: [ORV-126]
what_happened: All 27 ORV-126 tasks ran in the one main checkout while the main session switched it between 8 branches of 5 issues, so 8 tasks started on another issue's branch and 2 had the branch switched while they ran.
cause: An envelope's worktree must be the session's own checkout, so one session serving several issues switches branches in it, and the envelope guard checks the branch key only for builder, reviewer, qa, designer and security, never for the roles that write docs.
rule: The branch check covers every role with a non-empty `write_set`, the main session never switches branch while an envelope is bound with no result, and a second issue runs in its own `claude --worktree` session.
---

## What happened

- `jq -r .worktree .orivilo/runs/ORV-126/*/envelope.json | sort -u` gives one line, the main checkout. `git worktree list` shows no other worktree.
- From 08:20 to 14:47 UTC on 2026-10-26, the span of the 27 ORV-126 tasks, `git reflog` shows 17 checkouts across 8 branches: `docs/ORV-126-ci-research`, `docs/ORV-126-touchpoints`, `docs/ORV-109-ai-architecture-knowledge`, `chore/ORV-109-retro-lessons`, `feature/ORV-20-color-node-knowledge`, `docs/ORV-127-category-lineups`, `docs/ORV-128-input-analysers` and `develop`.
- Comparing each task's `started_at` and `ended_at` in `.orivilo/metrics/ORV-126.json` with the reflog times, 8 of 27 tasks started while the checkout was on another issue's branch. On `feature/ORV-20-color-node-knowledge`: `arch-image-provider-1`, `product-ci-graph-1`, `product-ci-graph-2`, `research-ci-1`, `research-guidebook-refs-1` and `research-behance-observed-2`. On `docs/ORV-127-category-lineups`: `research-openrouter-images-1` and `research-touchpoints-1` (4,476,475 tokens, the four touchpoint entries of PR 117). The branch was switched under 2 running tasks: `research-behance-observed-2` (to ORV-127) and `research-openrouter-images-1` (to ORV-126, then ORV-109).
- The writes of those tasks sat uncommitted in a tree checked out on another issue's branch, and they reached the right branch only because the checkouts carried them along. The records do not show whether a switch failed or work was lost; a refused checkout leaves no reflog line.
- `.claude/skills/ovl/SKILL.md` ("Issue") and `ISSUE_ROLES` at `scripts/ovl/envelope-guard.mjs:50` check the branch key for builder, reviewer, qa, designer and security only. Product, architect, research and ds-architect envelopes pass on any branch. This retro's own envelope, `ORV-126-retro-1`, runs on `chore/ORV-20-retro-lessons`.
- AGENTS.md already says "Run each issue in its own worktree (`claude --worktree`)". The skill's rule that `cwd` equals the envelope worktree, which must be the session's checkout, means one session can serve one checkout at a time.

Related: [[L-0003-squash-reset-reverted-a-merged-pr]], [[L-0027-stalled-reviewer-went-unnoticed]].

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `.claude/skills/ovl/SKILL.md`, the "Issue" bullet:

```diff
-- **Issue.** For builder, reviewer, qa, designer and security, the envelope `issue` must equal the key in the checkout's branch name (`<type>/ORV-<n>-<slug>`); a branch without a key blocks.
+- **Issue.** For every role with a non-empty `write_set`, and for reviewer, qa, designer and security, the envelope `issue` must equal the key in the checkout's branch name (`<type>/ORV-<n>-<slug>`); a branch without a key blocks (L-0032).
```

In the same file, step 2, a new bullet:

```diff
+- **One issue per checkout at a time.** Do not run `git checkout` or `git switch` in the session's
+  checkout while any envelope there is bound with no `result.json` and no `closed.json` (the stall list
+  above shows them). To work on a second issue at the same time, start a `claude --worktree` session
+  for it (L-0032).
```

In `scripts/ovl/envelope-guard.mjs`, under the builder story ORV-130: extend `ISSUE_ROLES` to the roles above, with a test per role that a mismatched branch blocks.

Open point, resolved at promotion: the after-merge retro envelope names the slice's issue (ovl skill, after-merge step 2), while lessons from several slices collected on one retro branch, so under this rule either a retro gets a `chore/<slice key>-retro-lessons` branch or the after-merge step names the retro branch's key. The answer: a retro runs on a `chore/<slice key>-retro-lessons` branch, so the retro branch carries the slice's key, which is what the after-merge step 2 of the ovl skill already does by naming the slice's issue.

Status: promoted 2026-10-26, into `.claude/skills/ovl/SKILL.md` (section 2, the "Issue" bullet and the new "One issue per checkout at a time" bullet; section 5, step 2, the retro branch carries the slice's key); no hook enforces it for product, architect, research or ds-architect. The `scripts/ovl/envelope-guard.mjs` change (`ISSUE_ROLES` for every role with a `write_set`, with a test per role) is not applied: it is a guard file and is the follow-up builder issue ORV-130
