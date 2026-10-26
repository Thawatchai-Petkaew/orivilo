---
id: L-0031
date: 2026-10-26
issue: [ORV-126]
what_happened: Five knowledge entries, K-0060, K-0061, K-0064, K-0065 and K-0066, cited a PDF in the owner's session upload folder as their source, which no reviewer, CI run or later session can open.
cause: The knowledge format allows an absolute path in `source:` as long as it exists when the entry is written, and `pnpm check:knowledge` never reads source paths, so a path that lives only for one session met both.
rule: `source:` is a repo-relative path or an https URL; an owner-held file is cited by title, edition, page count and pages with the words "owner-held, not in the repo", plus a public URL when one is found; the main session greps `docs/knowledge` for absolute paths after every research task until `check:knowledge` refuses them.
---

## What happened

`ORV-126-research-guidebook-refs-1` (4,289,130 tokens) wrote eight brand entries, numbered from K-0060 on. Five of them draw on a TikTok For Business guidelines PDF the owner uploaded in chat, and they gave the uploaded file's path, a folder under the owner's `~/.claude/uploads/<session id>/`, as `source:`, with confidence 0.75 to 0.8 and `license: link-only`.

- `ORV-126-review-docs-1` finding F8 (Important, `docs/knowledge/brand/K-0060-tiktok-for-business-guidelines-sections.md:5`): the file is outside the repo and exists only on the owner's machine for that session.
- `docs/knowledge/README.md` line 24 allows "repo-relative path, absolute path or URL" and line 45 says "A path must exist when the entry is written". The path existed at write time, so the entries met the format.
- `scripts/check-knowledge.mjs` checks fields, confidence and citations, and never opens a `source:` path (`grep -n existsSync scripts/check-knowledge.mjs` shows it only on the license file, the entry folder and AGENTS.md).
- `ORV-126-research-fix-review-1` (1,072,673 tokens, shared with F5, S1 and S3) rewrote the five sources as the owner-held PDF by title, slide count and pages, "not in the repo", plus a public third-party copy URL (K-0060 line 5 at head).
- [[L-0022-press-figures-with-no-url-in-source]] asks for a URL in `source:` behind every body fact. It was promoted into `.claude/agents/research.md` in PR 116, after these tasks, and it does not say how to cite a file the owner hands over, which has no URL.

## Rule

Proposed diffs, for the owner to approve. No file below is edited in this retro.

In `docs/knowledge/README.md`, line 24 and the `source` row at line 45:

```diff
-source: "repo-relative path, absolute path or URL; for an external repo, the path inside it (with a line)"
+source: "repo-relative path or https URL; for an external repo, the path inside it (with a line); never an absolute path"
```

```diff
-| `source`     | Where the evidence is. A path must exist when the entry is written; a line number helps the next reader | `sources[].url` or `title`           |
+| `source`     | Where the evidence is: a repo-relative path that exists, or an https URL. A file the owner hands over is cited by title, edition, page count and pages, "owner-held, not in the repo", plus a public URL when one is found | `sources[].url` or `title` |
```

In `.claude/agents/research.md`, under "What you do":

```diff
+- Never cite an absolute path (`/Users/`, `/home/`, `/private/`, `/tmp/`, `~/`) in `source:`. A file
+  the owner uploads is cited by title, edition, page count and pages with "owner-held, not in the repo",
+  and you search for a public copy to cite beside it (L-0031).
```

In `scripts/check-knowledge.mjs`, under its own Jira issue (a builder story, like ORV-129 for L-0020): fail on a `source:` value that holds an absolute path. Until that ships, the main session adds `grep -rn -E '^source:.*(/Users/|/home/|/private/|/tmp/|~/)' docs/knowledge` to the research `done_when` run (L-0023) and expects no output.

Status: promoted 2026-10-26, into `docs/knowledge/README.md` (the `source:` line of the entry format and the `source` row of the field table) and `.claude/agents/research.md` (What you do, the absolute path bullet); no hook enforces it. The `scripts/check-knowledge.mjs` refusal of an absolute `source:` path is not applied: it is a guard file and is the follow-up builder issue ORV-129. Until it ships, the main session runs the `grep -rn` above after every research task and expects no output
