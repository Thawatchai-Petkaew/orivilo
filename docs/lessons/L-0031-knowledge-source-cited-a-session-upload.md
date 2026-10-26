---
id: L-0031
date: 2026-10-26
issue: [ORV-126]
what_happened: Five knowledge entries, K-0060, K-0061, K-0064, K-0065 and K-0066, cited a PDF in the owner's session upload folder as their source, which no reviewer, CI run or later session can open.
cause: The knowledge format allows an absolute path in `source:` as long as it exists when the entry is written, and `pnpm check:knowledge` never reads source paths, so a path that lives only for one session met both.
rule: In an entry written or changed from 2026-10-26 on, `source:` is a repo-relative path or an https URL (an external repo by its https URL plus the path inside it); an owner-held file is cited by title, edition, page count and pages with the words "owner-held, not in the repo", plus a public URL when one is found; the main session greps the knowledge files each research task changed for absolute paths until `check:knowledge` refuses them (ORV-129).
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
+source: "repo-relative path or https URL; for an external repo, its https URL plus the path inside it (with a line); never an absolute path"
```

```diff
-| `source`     | Where the evidence is. A path must exist when the entry is written; a line number helps the next reader | `sources[].url` or `title`           |
+| `source`     | Where the evidence is: a repo-relative path that exists, or an https URL. An external repo is cited by its https URL plus the path inside it. A file the owner hands over is cited by title, edition, page count and pages, "owner-held, not in the repo", plus a public URL when one is found. Never an absolute path, for entries written or changed from 2026-10-26 on; the entries numbered 0001 to 0012 cite `~/` paths and are known exceptions, rewritten under ORV-129 (L-0031) | `sources[].url` or `title` |
```

In `.claude/agents/research.md`, under "What you do":

```diff
+- Never cite an absolute path (`/Users/`, `/home/`, `/private/`, `/tmp/`, `~/`) in `source:` of an
+  entry you write or change. An external repo is cited by its https URL plus the path inside it. A file
+  the owner uploads is cited by title, edition, page count and pages with "owner-held, not in the repo",
+  and you search for a public copy to cite beside it (L-0031). The entries numbered 0001 to 0012 cite `~/` paths and are
+  known exceptions until ORV-129 rewrites them.
```

In `.claude/skills/ovl/SKILL.md`, the "Research envelope that adds a knowledge entry" bullet: until `check:knowledge` refuses absolute paths, the main session runs this from the repo root after every research task, on the knowledge files the task changed or added (a new entry is untracked, so `git diff` alone misses it), and expects no output:

```bash
{ git diff --name-only --diff-filter=d HEAD -- docs/knowledge; git ls-files -o --exclude-standard -- docs/knowledge; } | xargs grep -n -E '^source: "?([^"]*; )?(/Users/|/home/|/private/|/tmp/|~/)'
```

The pattern matches a path prefix only at the start of the `source:` value or after a semicolon and space separator, so a URL such as `https://mt.mahidol.ac.th/wp-content/uploads/home/...` (the brand entry numbered 0067) does not match. It runs on the changed files, not the whole tree, because 12 existing entries cite `~/` paths into the allkons and CAMPVIBE checkouts and would always match: 0001, 0002, 0003, 0004, 0005, 0006, 0007, 0008, 0009, 0010, 0011 and 0012 (written without the K prefix here, because `pnpm check:knowledge` reads a written id as a citation and some of these sit below confidence 0.7) (`git grep -n -E '^source:.*~/' -- docs/knowledge`). They predate this rule and are known exceptions; ORV-129 rewrites each as the repository's https URL plus the path inside it.

In `scripts/check-knowledge.mjs`: fail on a `source:` value that holds an absolute path. ORV-129, filed for the README Index check of L-0020, had its scope widened to this refusal and to the rewrite of the 12 entries (ORV-129 comment 10221).

Status: promoted 2026-10-26, into `docs/knowledge/README.md` (the `source:` line of the entry format and the `source` row of the field table), `.claude/agents/research.md` (What you do, the absolute path bullet) and `.claude/skills/ovl/SKILL.md` (the "Research envelope that adds a knowledge entry" bullet, the interim grep); no hook enforces it. The rule covers entries written or changed from 2026-10-26 on; the entries numbered 0001 to 0012 are known exceptions. The `scripts/check-knowledge.mjs` refusal of an absolute `source:` path and the rewrite of the 12 entries are not applied: the first is a guard file, and both sit under ORV-129, whose scope was widened to them (ORV-129 comment 10221). Until it ships, the main session runs the grep above on each research task's changed files and expects no output
