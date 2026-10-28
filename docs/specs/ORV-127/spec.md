---
issue: ORV-127 (https://tpetkaew.atlassian.net/browse/ORV-127)
lane: L (data access: a shared library read by every workspace next to records owned by one workspace; collection from outside sites with legal exposure; decision D13)
version: 1.2
---

# ORV-127: category colour lineup library on TSIC 2009

## Structure first: the taxonomy and its counts

The library is a tree of brand categories on **TSIC 2009**, Thailand's industrial classification built on ISIC Rev.4 and extended to a 5-digit level, as the NSO documents for TSIC 2009 describe (K-0048). The owner chose TSIC 2009 and a top-down, breadth-first plan (ORV-127 comment 10199) and confirmed the classification and its counts at G1 (comments 10200 and 10201). Four divisions build no brands a customer compares: 84 (public administration, section O), 97 and 98 (households as employers, section T) and 99 (extraterritorial bodies, section U). They are excluded at every level; the 7 groups and 11 classes excluded at levels 3 and 4 are the rows UNSD lists under those divisions in ISIC Rev.4 (K-0047).

<!-- prettier-ignore -->
| Level | TSIC name | Code shape | Codes in TSIC 2009 | Excluded | Brand-relevant |
| --- | --- | --- | --- | --- | --- |
| 1 | Section | one letter, `A` to `U` | 21 | 3 (O, T, U) | 18 |
| 2 | Division | 2 digits | 88 | 4 (84, 97, 98, 99) | 84 |
| 3 | Group | 3 digits | 243 | 7 | 236 |
| 4 | Class | 4 digits | 441 | 11 | 430 |
| 5 | Subclass | 5 digits | 1,091 stated; 1,089 in the NSO workbook | 24 | 1,065 of 1,089 |

Counts per ORV-127 comments 10200 and 10207. Levels 3 and 4 hold more codes than ISIC Rev.4 (238 groups, 419 classes; K-0047) because TSIC adds Thai groups and classes. At level 5 both figures rest on one base, the NSO comparison workbook `SD08_08_47_18.xlsx`: it lists 1,089 five-digit codes, 24 of them under divisions 84, 97, 98 and 99 (division 99 holds `99001` and `99009`), which leaves 1,065.

**Open point: the two missing subclasses.** The NSO standard `SD08_08_47_12` states 1,091 subclasses; the workbook lists 1,089 (K-0048). Which two codes differ is not known. The code list is built from the workbook, so slice 1 ships 1,089. Before any level 5 collection starts, the two codes are resolved against another NSO source (the 2009 TSIC manual's detailed structure) and either added, with their source, or recorded as not present in the workbook's edition. Either outcome bumps this spec's version. Default until then: 1,089 in all and 1,065 brand-relevant.

A brand record carries the deepest TSIC code known for the brand. A record counts toward its own node and every node above it: a record at subclass `86202` counts for class `8620`, group `862`, division `86` and section `Q`. A record known only to section level counts for that section only.

## Why

The ORV-20 colour node audits a category lineup to find the crowded hues and the gaps (`auditLineup`, ORV-20 rows 1 to 4). Today the only lineup is a stand-in fixture (ORV-20 decision 3): hexes chosen to stand for the method's conclusion, not read from any brand. Without real lineups the node can only answer for ORIVILO's own worked example, and the brand CI phase (ORV-126) cannot audit a customer's category.

The owner wants lineups gathered as widely as possible, planned top-down on a standard taxonomy, with the order of work inside a level taken from data, not from a hand-picked list of categories (ORV-127). This spec turns that into a structure (the TSIC tree above), a method (breadth-first coverage with a measurable target per level), a priority source (DBD new registrations by objective code, K-0049), three collection channels with collection rules (the owner's decision D1, read against the statute and practice entries K-0052 to K-0058), one record shape, and one way for the colour node to take a lineup.

This spec is not a guard. It describes a data library and the code that reads it.

What is real and what is simulated, so nobody mistakes one for the other:

- **Real:** the taxonomy tree and its counts, the record schema, the coverage report, the ranking count, the lineup selection. All deterministic TypeScript with tests.
- **A proxy, not a measure:** the ranking counts new juristic-person registrations per objective code. That a registration is a new brand is an untested inference (K-0049): sole traders are missing, a holding company also registers, each company carries one code. Reading the DBD code as a TSIC 2009 subclass is an inference too; slice 3 measures the match rate and stops when it is low (row 19).
- **Rule-based, not AI:** no model reads a page, picks a colour or assigns a category in this story. Any later use of a model is its own spec.
- **Not legal advice:** the collection rules are the owner's decision (D1), drawn from our own reading of the statute and practice entries K-0052 to K-0058, not from a lawyer. The points marked "lawyer" need a Thai lawyer before the channel they belong to goes live (D2).
- **Facts only:** no logo, image, screenshot, stylesheet or page copy is stored. A record holds colour values, brand name, category code, source URL and dates.
- **Industry is context, not a colour formula:** the library supplies who is in a category and what colours they use. No rule maps a category to a colour; ORV-20 row 6 already forbids an `industry` condition in colour rules.

## Story

As the colour node, given a brand's TSIC code, I want a lineup of confirmed, unexpired competitor colours from the deepest covered category above that code, with each entry traceable to its source and date, so that the hue audit runs on real category data instead of a stand-in, and a category with too few records becomes a question instead of a guess.

As the owner, I want a coverage report per TSIC level and an order of work inside each level taken from Thai registration data, so that I can see how far the library reaches and know that no category was picked by taste.

## Method: top-down, breadth-first

1. **Covered node.** A node is covered when its lineup holds at least `min` distinct brands (D6: 5) whose records are confirmed, unexpired, not removed, and in the shared library. Brand names are compared trimmed and ignoring case. Workspace records never count toward coverage.
2. **Coverage per level.** Covered brand-relevant nodes at that level divided by the brand-relevant count in the structure table (18, 84, 236, 430, the confirmed subclass count).
3. **Target per level.** Each level has a target share (D5). For the POC the targets are level 1 at 18 of 18 and level 2 at 42 of 84 (50 percent) in rank order.
4. **Breadth-first.** Work on level n+1 opens only when level n has reached its target. The "next work" list is always the uncovered nodes of the lowest level under its target, in rank order (row 21). A record may still be stored at a deeper code at any time, because it rolls up; what breadth-first governs is which nodes the team sets out to fill.
5. **Rank order inside a level** comes from the DBD ranking (below). At level 1 the POC target is every section, so order does not change what is covered; slice 1 fills the 18 sections in code order, and that order is not a choice of categories.

## Ranking inside a level: DBD new registrations

Source: DBD dataset `dataset_11_01`, one CSV per month of every newly registered juristic person, open license "Open Data Common" (K-0049). The column `รหัสวัตถุประสงค์` holds a 5-digit objective code.

- **Window.** The last 12 complete monthly files at the time a level's ranking is made (D8). The ranking snapshot records the window, each file's URL, its row count and its SHA-256, and the date it was read.
- **Count.** For each row, take the code, find its node at the ranked level (first 2, 3, 4 or 5 digits; a section through its division), drop codes under the excluded divisions, and count rows per node. A row is an example of the data, not a pick: a row with `86202` (`กิจกรรมคลินิกโรคเฉพาะทาง`) adds one to subclass `86202`, class `8620`, group `862`, division `86` and section `Q`.
- **Unmatched codes.** A code not in the TSIC 2009 list is counted as unmatched and listed in the snapshot. When matched rows are under 90 percent of all rows, the ranking has status `unreliable` and returns no order (row 19), because reading the objective code as a TSIC 2009 subclass would then be in doubt.
- **File check.** A file whose header lacks the K-0049 columns, or whose URL is not a `registration` path (K-0049 found one month linked to a dissolution file), is rejected by name (row 20).
- **Order.** Count descending, then code ascending. A node with no registrations ranks last, in code order.
- **Limits stated in the snapshot:** juristic persons only, one code per company, a registration is not always a new brand.
- The ranking reads only the code column. Company names, addresses and registration numbers in the DBD files are not stored.

## Collection channels

<!-- prettier-ignore -->
| Channel | Value of `channel` | Who reads | Rules (below) | Goes live |
| --- | --- | --- | --- | --- |
| Curated | `curated` | A named person opens the brand's official site or official channel and notes the colours | R1 to R5, R15 | Slice 1, for the level 1 baseline |
| Automated reading of official websites | `automated` | A reader program fetches logged-out public pages and extracts colour values in memory | R1 to R4, R6 to R11, R15 | After the lawyer review (D2) and its own issue |
| User-named competitors | `user` | A user names a brand or URL in a workspace; the automated reader reads it | R1 to R4, R6 to R14 | After the automated reader, its own issue |

A program that fetches the page is the automated channel in law terms, even when an agent fetches one page at a time for a curator (D3). The record's `channel` says which channel read it; `curated` means a person read the page.

### Collection rules (adopted by the owner under D1, read against K-0052 to K-0058)

<!-- prettier-ignore -->
| Rule | Applies to | Proposal | Lawyer before go-live |
| --- | --- | --- | --- |
| R1 | All | Store hex values with their role if known (`primary`, `secondary`, `background`, `unknown`), brand name, category code, source URL, date read, channel, and who or what read it. No logo, image, screenshot or page copy | No |
| R2 | All | Store whether the brand is a juristic person; store no name of a natural person; skip personal social accounts as sources | Yes: lawful basis and notice if sole-trader brands are ever taken in (K-0055), see D10 |
| R3 | All | A removal path: a brand can ask for its record to be removed or corrected; the outcome and its date are recorded | No |
| R4 | All | Show lineups as facts with source and date, no logos, no wording that suggests a brand endorses ORIVILO | No |
| R5 | Curated | The curator reads the official site or the brand's own official channel, notes URL and date, records nothing behind a login | No |
| R6 | Automated, user | Read robots.txt first; honour disallow for the group that applies by rule `robots-group-1` (ORV-128 spec v1.12, "Reading a page the person submits"): the groups naming the reader's product token when any does, the `*` group only when none does; re-read at most every 24 hours; stop on a 5xx (K-0056) | No |
| R7 | Automated, user | Name the reader in its user agent with a contact URL | No |
| R8 | Automated, user | Rate-limit per host and back off on 429 or 503; the numbers are a design choice at G2 | Yes: whether the limits are enough against the Computer Crime Act's disruption offence (K-0054 section 10) |
| R9 | Automated, user | Logged-out public pages only; never log in, make an account, solve a CAPTCHA or rotate IPs | No |
| R10 | Automated, user | Skip a site whose terms forbid automated access or whose machine-readable opt-out reserves text and data mining (K-0057) | Yes: whether Thai courts enforce terms a visitor never accepted |
| R11 | Automated, user | Read the page or stylesheet in memory, keep only the extracted values, discard the rest | No |
| R12 | User | The user names a brand or URL; ORIVILO reads it under R6 to R11, so a user cannot steer the reader around them | No |
| R13 | User | The user's text is untrusted input (AGENTS.md); validate the URL and never fetch private or internal addresses | No |
| R14 | User | Records from this channel stay in the requesting workspace unless the same fact is confirmed by another channel (D4) | Yes: whether a fact a customer supplied may be shared with other customers |
| R15 | All | Never import another party's curated brand-colour list; each record comes from the brand's own page. This rule is ours: K-0052 reads section 12 as protecting a compilation's selection | No |

## Record data shape

One record is one brand's colours read from one source on one date. The schema is a strict zod object: an unknown key fails to parse, so a `logo`, `image`, `screenshot`, `html` or `css` field cannot be stored (row 5).

<!-- prettier-ignore -->
| Field | Type and bound | Note |
| --- | --- | --- |
| `id` | string, stable | Assigned on creation |
| `taxonomy` | `"tsic-2009"` | Lets a later taxonomy live beside this one |
| `categoryCode` | a brand-relevant TSIC 2009 code at any level | An excluded or unknown code fails at `categoryCode` |
| `brandName` | 1 to 60 characters, trimmed | The same bound as an ORV-20 lineup `name`; a label, never read as an instruction |
| `entity` | `"juristic"` or `"unknown"` | R2; D10 decides whether `"unknown"` may enter the shared library |
| `colours` | 1 to 6 entries `{ hex, role }` | `hex` is `#RRGGBB`, stored uppercase; `role` is `primary`, `secondary`, `background` or `unknown`; at most one `primary` |
| `sourceUrl` | absolute `https` or `http` URL, 2,048 characters at most | The page the values were read from |
| `retrievedAt` | ISO date | Not after the date of the check (the clock is passed in) |
| `expiresAt` | ISO date | `retrievedAt` plus the expiry period (D7) |
| `channel` | `"curated"`, `"automated"` or `"user"` | Which channel read it |
| `readBy` | a person's handle, or the reader's name and version | Who or what read it (R1) |
| `confirmation` | `"unconfirmed"`, `"confirmed"`, `"disputed"` or `"removed"` | See below |
| `workspaceId` | `null` for the shared library, or a workspace id | Channel `user` records always carry a workspace id until confirmed (R14) |
| `removal` | `null` or `{ requestedAt, outcome, decidedAt }` | R3; `outcome` is `removed` or `corrected` |

Confirmation (D11):

- `confirmed`: a person read it (`curated`), or two records from different channels name the same brand and code and their `primary` colours fall in the same ORV-20 hue family.
- `unconfirmed`: one automated or user read with no second read.
- `disputed`: two reads of the same brand disagree on the `primary` family, or the brand asked for a correction not yet decided.
- `removed`: the brand asked for removal and it was granted. The record keeps no colours (an empty `colours` list is allowed only here) and stays as proof of the removal.

Only `confirmed`, unexpired, shared-library records count toward coverage and enter a shared lineup.

## How the ORV-20 lineup audit consumes a category lineup

`lineupFor(code, records, { min, asOf, workspaceId, selfName })` is a pure function in `packages/intent-engine`. It does not change any ORV-20 contract: `auditLineup` keeps its input of 1 to 20 `{ name, hex }` entries, or `null`.

1. Start at the given TSIC code and walk up one level at a time to the section. The first node that is covered (Method item 1) is the lineup node.
2. The lineup's records are the shared-library records under that node that are `confirmed`, not expired at `asOf`, not `removed`; plus, when `workspaceId` is given, that workspace's own records under the node that are not expired or removed, whatever their confirmation.
3. One entry per brand (names compared trimmed, ignoring case): the newest record wins, and its `primary` colour is the hex, or its first colour when no colour is `primary`.
4. At most 20 entries: newest `retrievedAt` first, then brand name ascending (D12).
5. The result is `{ node, level, lineup, sources }`: `sources` lists, per entry, the record id, source URL and date, so a trace can name where each hue came from. When no node up to the section is covered, `lineup` is `null`, and `decideColor` then asks for `lineup` (ORV-20 row 12).

The brand's own records, when the library holds any, are left out of its own lineup and of the covered check for that call: records whose name equals `selfName` (trimmed, ignoring case) are dropped before step 1.

## Delivery: vertical slices, each one PR of about 400 changed lines

<!-- prettier-ignore -->
| Slice | Delivers | Rows | POC needs it |
| --- | --- | --- | --- |
| 1 | The record schema; the TSIC 2009 code list with its source, counts and exclusions; the coverage report and its `pnpm` script; the level 1 baseline (curated records for 18 of 18 sections) | 1 to 10 | Yes |
| 2 | `lineupFor` and the walk up the tree; an engine test that feeds its lineup to `auditLineup` and `decideColor` | 11 to 17 | Yes |
| 3 | The DBD ranking snapshot per level, the stop rule on unmatched codes, the "next work" list | 18 to 22 | Yes |
| 4 and on | Level 2 curated records in batches, in rank order, each a data PR that raises level 2 coverage | 23 | Yes, until the level 2 POC target (D5) |
| Later | The automated reader (own issue, after D2's lawyer review); the user-named channel with workspace records in the database (own issue, after the reader) | Written in their own specs | No |

The curated data counts against the 400-line budget like code: a level 2 batch is about 8 divisions at `min` 5.

## Acceptance criteria

No row shows UI text. The coverage report and the ranking snapshot are developer output on the command line in English, outside the locale catalog. When a later issue puts lineups or coverage on screen, its spec names the Thai and English copy. Test file names are suggested; G2 may move code, but each named test keeps its name.

<!-- prettier-ignore -->
| # | Given | When | Result | Data effect | Test |
| --- | --- | --- | --- | --- | --- |
| 1 | The TSIC 2009 code list built from the NSO workbook `SD08_08_47_18.xlsx`, with its URL and read date in the module header | Counting codes per level, with and without the exclusions | 21, 88, 243, 441 and 1,089 in all; 18, 84, 236, 430 and 1,065 brand-relevant; 24 subclasses excluded. A different count, including the two missing codes once resolved (open point above), bumps the spec version before the PR merges | None | `tsic.test.ts` › "counts per level" |
| 2 | The same list | Walking every code to its parent | Every division has a section, every group's first 2 digits are a division, every class's first 3 a group, every subclass's first 4 a class; no code appears twice | None | `tsic.test.ts` › "the tree holds" |
| 3 | Codes `O`, `T`, `U`, `84`, `970`, `9810`, `99001` and one code under each of them | `isBrandRelevant(code)` | `false` for each; `true` for `Q`, `86`, `862`, `8620`, `86202` | None | `tsic.test.ts` › "exclusions" |
| 4 | A record with every field valid at each bound (name of 1 and 60 characters, 1 and 6 colours, URL of 2,048 characters) | Parsing with `lineupRecordSchema`, then a JSON round trip | Parses; the round trip is deep-equal; lowercase hex is stored uppercase | None | `lineup-record.test.ts` › "a valid record" |
| 5 | A record with, in turn: an extra key `logo`, `image`, `screenshot`, `html` or `css`; hex `#FFF` or `red`; two `primary` colours; 7 colours; 0 colours while not `removed`; name of 61 characters; `sourceUrl` `ftp://a.b` or `javascript:x`; `retrievedAt` after the passed clock; `expiresAt` before `retrievedAt`; `categoryCode` `84` or `00000`; `entity` `natural-person`; channel `user` with `workspaceId` `null` | Parsing | Each fails with the path of the bad field (`logo`, `colours.0.hex`, `colours`, `brandName`, `sourceUrl`, `expiresAt`, `categoryCode`, `entity`, `workspaceId`) | None | `lineup-record.test.ts` › "bounds and forbidden fields" |
| 6 | Fixture records: 5 brands confirmed at `86202`, 1 at section `Q` only, 2 expired, 1 unconfirmed, 1 removed, 1 workspace record, `min` 5 | `coverageReport(records, { min, asOf })` | `86202`, `8620`, `862`, `86` covered; `Q` covered (6 brands); expired, unconfirmed, removed and workspace records counted nowhere | None | `coverage.test.ts` › "what counts" |
| 7 | Two records `Acme` and ` acme ` at the same node, 4 other brands, `min` 5 | `coverageReport` | The node is covered (5 distinct brands, names compared trimmed and ignoring case) | None | `coverage.test.ts` › "distinct brands" |
| 8 | Any record set | `coverageReport` | Per level: brand-relevant count, covered count, share to one decimal, target, uncovered codes; the same output for the same records in any order | None | `coverage.test.ts` › "same input, same report" |
| 9 | The shipped library after slice 1 | `pnpm lineups:coverage` | Prints one line per level, first `level 1 section: 18 of 18 covered (100.0%), target 18`; exit 0 | None | Run in the G3 packet |
| 10 | The shipped library after slice 1 | Parsing every record; `coverageReport` at the PR date | Every record parses, has channel `curated`, confirmation `confirmed`, `workspaceId` `null`, an `https` source URL and a `readBy` handle; all 18 sections covered at `min` | Curated records committed with their sources | `library.test.ts` › "level 1 baseline" |
| 11 | Fixture: 6 confirmed brands at `86202`, one named `Acme`, a request for `86202` | `lineupFor` | `node` `86202`, `level` 5, 6 entries, each with its record id, URL and date in `sources` | None | `lineup-for.test.ts` › "deepest covered node" |
| 12 | Fixture: 2 brands at `86202`, 3 more at `8620`, 6 more across group `862` | `lineupFor("86202")` | `node` `8620` (5 brands); the walk stopped at the first covered node | None | `lineup-for.test.ts` › "walks up" |
| 13 | An empty library; then a library with no covered node above `86202` | `lineupFor("86202")`, then `decideColor` with ORIVILO's vector and that lineup | `lineup` is `null`; `decideColor` lists `lineup` in `questions` and `status` is `needs-input` (ORV-20 row 12) | None | `lineup-for.test.ts` › "no coverage is a question" |
| 14 | 25 confirmed brands under one node with distinct dates; then two equal dates | `lineupFor` | 20 entries, newest first; equal dates in brand-name order; the same result for records in any order | None | `lineup-for.test.ts` › "at most 20, deterministic" |
| 15 | A brand with colours `secondary` then `primary`; a brand with no `primary`; a brand with two records, the newer one with a different hex; then the 6 brands of row 11 with `selfName` set to one of them as ` ACME ` | `lineupFor` | The `primary` hex; the first hex; the newer record's hex, once; with `selfName` the brand is absent and the node, now at 5 brands, is still covered | None | `lineup-for.test.ts` › "one colour per brand, never itself" |
| 16 | Workspace A holds an unconfirmed `user` record under a covered node; workspace B asks for the same code; then no workspace | `lineupFor` for A, for B, and with no `workspaceId` | A's lineup has the record; B's and the shared lineup do not; coverage is unchanged | None | `lineup-for.test.ts` › "workspace records stay in their workspace" |
| 17 | A covered node from fixture records | `auditLineup(lineupFor(code).lineup)` then `decideColor` | The audit parses the lineup with no error; the module imports neither `llm-interpreter` nor `openrouter`; `decideColor` keeps `method: "rule-based"` | None | `lineup-for.test.ts` › "feeds the colour node" |
| 18 | Fixture CSV rows with codes `86202` (3 rows), `56101` (2), `84110` (4), `46599` (2) | `rankLevel(files, 2)` | Order `86` (3), then `46` and `56` tied at 2 in code order; `84` absent; the snapshot lists each file's URL, row count and SHA-256 | None | `ranking.test.ts` › "count, exclude, order" |
| 19 | Fixture rows where 85 of 100 codes are not in TSIC 2009; then 95 of 100 matched | `rankLevel` | First: status `unreliable`, no order, the unmatched codes listed; second: status `ranked` with 5 unmatched listed | None | `ranking.test.ts` › "stop on a low match rate" |
| 20 | A file missing the `รหัสวัตถุประสงค์` column; a file URL with `dissolution` in its path | `rankLevel` | Each rejected, naming the file and the reason; no ranking returned | None | `ranking.test.ts` › "file checks" |
| 21 | Level 1 at 17 of 18 with target 18; then level 1 at 18 of 18 and level 2 at 10 of 84 with target 42 | `nextWork(report, ranking)` | First: the one uncovered section and no division; second: the 74 uncovered divisions in rank order | None | `ranking.test.ts` › "breadth-first next work" |
| 22 | The DBD rows read by the ranking | Inspecting the snapshot | It holds codes and counts only; no company name, address or registration number | Snapshot committed with the slice | `ranking.test.ts` › "no company data kept" |
| 23 | The shipped library after the last level 2 batch of the POC | `pnpm lineups:coverage` | Level 1 at 18 of 18; level 2 at its POC target or more (42 of 84 under D5), the covered divisions being the top of the level 2 ranking | Curated records committed | Run in each batch's G3 packet |

## Rules and bounds

- Only curated records enter the shared library until D2 and D3 are settled; slices 1 to 4 add no reader program and fetch no brand page in code.
- During the POC the shared library is a versioned data module in `packages/intent-engine`, reviewed in PRs like the knowledge entries (ADR 0005), not a database table (D9). Workspace records arrive with the user channel and live in the database behind the central authorization helper, default deny.
- The DBD files are fetched by a script run by hand; the committed snapshot is what the tests read. No test reaches the network.
- Every module is pure TypeScript: no `Date.now`, no `Math.random`, no network; the clock (`asOf`) is passed in.
- A brand name is a label for the trace. It is never put into a prompt or read as an instruction (AGENTS.md).
- No logo, image, screenshot, stylesheet or page copy is ever stored, in the repo or the database (R1, row 5).
- A record past `expiresAt` stays stored for history, leaves coverage and lineups, and is listed by the coverage report as due for a re-read.

## Out of scope

- Any UI: a lineup view, a coverage dashboard, a removal-request form, the user-named competitor input.
- The automated reader and the user-named channel: each gets its own issue and spec once D2 and D4 are decided.
- Sole-trader and other non-juristic brands, and personal social accounts as sources (R2, D10).
- Publishing lineups outside a signed-in workspace.
- ISIC Rev.5, GICS or any taxonomy other than TSIC 2009; a correspondence between them.
- Any model call: colour extraction, category assignment or brand matching by AI.
- Choosing a customer's TSIC code for them; the brief supplies it, or the lineup is `null`.
- Changing ORV-20's `auditLineup` input, `decideColor` output or its rules.

## Owner decisions (decided at G1)

The owner answered D1 to D13 at G1 (ORV-127 comment 10201). The "Decided" column records the option taken; a later change to any of them bumps this spec's version.

<!-- prettier-ignore -->
| # | Question | Options | Decided | Impact |
| --- | --- | --- | --- | --- |
| D1 | Which collection rules to adopt | (a) R1 to R15 as written; (b) a subset; (c) none until the lawyer review | (a), all fifteen | Slice 1 enforces R1, R2, R4, R5 and R15 in the schema and the curation note; the rest bind later slices |
| D2 | Lawyer review before automated collection | (a) a Thai lawyer reviews R2, R8, R10 and R14 before the automated reader or the user channel goes live; (b) go live on our own reading of the statutes | (a) | The reader and user channel wait; slices 1 to 4 do not |
| D3 | Does an agent fetching pages for a curator count as automated | (a) yes, it is automated in law terms and waits for D2; (b) no, treat it as curated at curated volume; (c) yes, but the owner accepts the risk for logged-out official pages under R6 to R11 now | (a) | Level 1 and level 2 baselines are read by a person, which takes longer; (c) would speed them at a risk the owner carries |
| D4 | User-named competitor records: workspace or shared | (a) stay in the workspace; join the shared library only when another channel confirms the same fact, without the workspace id; (b) join the shared library at once; (c) never join | (a) | Customers never see another customer's unconfirmed records |
| D5 | Coverage target per level for the POC | (a) level 1 18 of 18, level 2 42 of 84 in rank order; (b) level 1 and level 2 both full; (c) level 1 only | (a) | About 300 curated records at `min` 5; level 3 and deeper wait until after the POC |
| D6 | `min` brands for a covered node | 3, 5 or 8 | 5 | Two entries crowd a hue (ORV-20 decision 4), so 5 leaves room to show both crowds and gaps; 3 can crowd at most one family |
| D7 | Expiry period | 6, 12 or 24 months | 12 months | A yearly re-read of each record |
| D8 | Ranking window | (a) last 12 complete monthly files; (b) all files since January 2022; (c) last 6 | (a) | Recent formation drives order; one snapshot per level |
| D9 | Where the shared library lives in the POC | (a) a versioned data module in the repo; (b) a database table from slice 1 | (a) | Review in PRs, no migration; the database comes with the user channel |
| D10 | Non-juristic brands | (a) excluded until the lawyer review; (b) allowed with `entity` `unknown` | (a) | `entity` `unknown` records stay out of the shared library until decided |
| D11 | When two reads agree | (a) same ORV-20 hue family for `primary`; (b) same hex; (c) a colour distance bound | (a) | Small extraction differences do not block confirmation |
| D12 | Which 20 when more brands qualify | (a) newest `retrievedAt`, then name; (b) by DBD rank of each brand's subclass, then name; (c) name only | (a) | Fresh reads win; the choice is stated in the trace |
| D13 | Lane | L or M | L | G1 and G2 are passed by Claude under the owner's POC delegation (ADR 0012 decision 4) |

## Impact list

<!-- prettier-ignore -->
| Artifact | Change | Review needed |
| --- | --- | --- |
| `packages/intent-engine` (new lineup library modules and data) | New public functions `lineupFor`, `coverageReport`, `rankLevel`, `nextWork` and schema `lineupRecordSchema` | G2 design |
| ORV-20 `auditLineup`, `decideColor` | No change; row 17 proves they take the library's lineup | ORV-20, ORV-125 |
| ORV-126 brand CI phase | Gains a real lineup source for a customer's category | ORV-126 spec when written |
| A new ADR at G2 | TSIC 2009 as the category taxonomy and the shared library as a data module during the POC | G2 |

## Depends on

- Knowledge: K-0047 (ISIC Rev.4 counts and the excluded rows), K-0048 (the NSO documents that describe TSIC 2009), K-0049 (DBD new registrations by objective code), K-0052 to K-0058 (the statute and practice readings behind the collection rules).
- ORV-127 comments 10199 (TSIC 2009, top-down, breadth-first), 10200 (counts per level, confirmed from NSO sources), 10201 (the owner's G1 answers to D1 to D13) and 10207 (the corrected level 5 counts and the open two-code gap).
- [ORV-20 spec](../ORV-20/spec.md) v1.2: `auditLineup` bounds, the hue families, decision 3 (stand-in lineup) and decision 4 (crowd at two). [ORV-125 spec](../ORV-125/spec.md) for the palette that follows.
- [ORV-126](https://tpetkaew.atlassian.net/browse/ORV-126) (brand CI phase 1), the first consumer of a real lineup. It has no spec file in the repo yet.
- ADR 0005 (knowledge and curated data in code), ADR 0007 (curated values, determinism), ADR 0012 (gates), ADR 0017 (colour-scope rules).
- AGENTS.md: untrusted input, server-only data access, central authorization helper.

## Changelog

- v1 (2026-10-26): first spec. Downstream to review once G1 passes: the ORV-127 Jira description, the G2 design and its new ADR, and the ORV-126 spec when it is written.
- v1.1 (2026-10-26): no decision rests on a knowledge entry below confidence 0.7. The classification and counts cite K-0047 and ORV-127 comments 10199, 10200 and 10201; the collection rules cite the owner's D1 decision and K-0052 to K-0058; K-0048 is cited only where the NSO documents are named; the cut-off options entry is dropped, superseded by the owner's choice of TSIC 2009. D1 to D13 are recorded as decided (comment 10201). No row, rule, bound or slice changed. Downstream to review: the ORV-127 Jira description and the G2 design and its new ADR.
- v1.2 (2026-10-26): level 5 counts corrected to one base per ORV-127 comment 10207 (review findings F1, F2 and F5 on PR 115): 24 excluded subclasses and 1,065 brand-relevant of the 1,089 codes in the NSO workbook `SD08_08_47_18.xlsx`; the 1,089 versus 1,091 gap is named as an open point with a step to resolve the two codes before any level 5 collection; row 1 now names the workbook as the code list's source and asserts its counts; row 3 uses the real subclass `99001` instead of `99000`. Downstream to review: the ORV-127 Jira description, the G2 design and its new ADR, and K-0048 (its claim still says about 1,065 of 1,091).
- v1.2 note (2026-10-27): rule R6 points to rule `robots-group-1` in the ORV-128 spec v1.12, which narrows the old wording (disallow honoured for both the token and `*`) to the token groups when any group names the token and the `*` group only when none does (ORV-133 review round 0, R1 and SEC-133-2); no row is renumbered and the version stays 1.2.
