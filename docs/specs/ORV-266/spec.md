---
issue: ORV-266 (https://tpetkaew.atlassian.net/browse/ORV-266)
lane: L (reads outside web pages from a deployed server route, a new member set on the report contract, and a session check on a new action)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
version: 1.1
---

# ORV-266: paste a website address, see a brand evidence report

## Goal

On 2026-11-07 the owner approved stopping foundation work: 17 days in, there is no product to open. The first product goal is one path that runs end to end, a brand's website address in and a brand evidence report out, that the owner can open on staging.

Today no part of `apps/web` takes an address. The engine can check an address, honour robots.txt and analyse the bytes (`readUrlInput`, `analyseUrl`), but nothing implements its network ports, nothing turns a read into a report, and nothing shows one. This story joins those parts into one path. It adds no analysis.

Done means both PRs are in `develop`, the main session has released them to `main`, and the G4 walk has signed in on staging and read one real public address. The owner then opens it there. Staging sign-in has not been checked yet, and `main` is behind `develop`, so the release is real work (see "Depends on").

This spec is not a guard. The address check and robots.txt are product rules already specified in ORV-128.

### What is real, rule-based and simulated

- **Real:** the read of one page, its robots.txt and its linked stylesheets, from the server, on the deployed route; the address check; the declared colours and fonts; the text counts.
- **Rule-based, not AI:** the personality leans (`lexicon-1`, `value-to-lean-1`). No model is called on this path. The page says so (`brandReport.ruleBased`). The confidence numbers are hypotheses from a fixed table (ORV-128, "Confidence"), not a measured accuracy, and the page says that too.
- **Not done, and shown as not done:** the list in rule `report-view-1`, section 7.
- **Simulated:** nothing in the product. The Storybook stories run on labelled fixture reports.

## Story

As a founder or designer who is signed in, I want to paste a brand's website address and see what its page declares and says, with where each value came from and what was not measured, so that I can trust a brand reading because I can check it.

## Rules

### url-input-1

The field is plain text, with `inputMode="url"` and no browser URL validation, which would block `example.com`. The text is trimmed. Text that does not start with a scheme and `://` gets `https://` in front. Nothing else is changed. The server applies this rule and gives the result to `readUrlInput`, whose checks decide the rest ("Worked examples"). Text longer than 2,048 characters (`URL_MAX_CHARS`) is not read, and the form shows `read.refused.address`.

### role-input-1

The form asks whose website this is: `own`, `reference` or `competitor`, with no option chosen first. ORV-128 says a role is what the person said, never a guess, and rule `competitor-not-read-1` hangs on it. The role goes to `readUrlInput` as given.

### report-outcome-1

Each read outcome gives one member of `reportSchema`. This carries the rule of the same name from the ORV-135 branch spec, without the command's exit codes, as read in `docs/specs/ORV-266/tech.md` section 7:

- A `not-read` result gives the `not-read` member.
- A `refused` or `failed` read gives the `refused` member, with its `read.refused.*` or `read.failed.*` key. Its `url` is the address as given, with any username and password dropped, then cut to fit the schema.
- A `read` gives the `analysed` member. An axis's leans are its readings that are not `belowFloor`.
- An `analyseUrl` result with `ok: false`, or a report that fails `reportSchema`, gives no report. The call ends as `failed`, never as a throw.

This settles ORV-128's open question "A report for a refused read" for this path.

### thin-page-1

A report is thin when the `word-count` measures of the `text-span` items whose subject is `heading` or `body` sum to under 20. The title and the meta description do not count, because a page built with JavaScript usually still has both. 20 is the `few-words` bound of ORV-128, a hypothesis here too.

### report-view-1

An `analysed` report shows these sections, in this order. A new read replaces the report on the page.

1. **Header.** `brandReport.ruleBased` (Alert `info`), `brandReport.notSaved`, `brandReport.pageRead` with the URL read after redirects, `brandReport.readAt` (the earliest `retrievedAt`, through `Intl.DateTimeFormat` for the page's locale, zone Asia/Bangkok), `brandReport.readAs` with the role.
2. **Notices.** `brandReport.incomplete` (Alert `warning`) when any item carries `quality.pageIncomplete`. `brandReport.thin` (Alert `warning`) under `thin-page-1`.
3. **Colours.** Heading, `brandReport.declaredNote`, then one entry per distinct `colour-declared` subject: the hex in upper case with `#`, its hue band label (`brandReport.hue.*`), and a source line per item. No swatch (open question 5). When there are none, `brandReport.coloursEmpty`.
4. **Fonts.** Heading, `brandReport.declaredNote`, then one entry per distinct declared `font-family` subject, shown as the subject without its `declared.` prefix ("Worked examples"), and a source line per item. When there are none, `brandReport.fontsEmpty`.
5. **Text.** Heading, `brandReport.textNote`, then one `brandReport.textLine` per block kind that has items, in the order title, meta, heading, body, with the number of items and the sum of their `word-count`. One `brandReport.sourcePage` line. When there are none, `brandReport.textEmpty`. Text spans hold no quote, because ORV-128 keeps only quotes a reading rests on, so the page text itself is not shown (open question 4).
6. **Personality.** Heading, `report.conflictsNotChecked`, then the five axes in `PERSONALITY_AXES` order. Under each axis, each lean of the report with its level, its quote, its source line, its rule ids (`brandReport.rules`) and `brandReport.confidence`. An axis with no lean shows `brandReport.noSignal`. Items of that axis with `belowFloor` true follow under `evidence.belowFloor`, with their `quality.*` reasons joined by a comma, and do not count as a lean. An item with `hypothesis` true adds `brandReport.hypothesis`; its `hypothesisNote` is English engine text and is never shown. Two opposite leans stand side by side; none is picked.
7. **Not measured.** Heading, then these lines, on every `analysed` report: one `read.notMeasured` line per `notMeasured` entry (colour areas, text and background contrast, content density, which text is visible), then `brandReport.notReadIndustryMood` (business type and mood), then `brandReport.notReadSources` (images, scripts, styles written inside the page).

The report makes no claim about industry, mood, colour area, contrast or density. No word on the page ranks a colour or a font: the list order carries no meaning, and nothing is called main, primary or dominant.

### report-source-1

Every value on the page carries its source, as text:

- A colour or a font: `brandReport.sourceSheet`, the stylesheet's `source.ref` and the offset from its `sheet:<offset>` locator.
- A personality lean: `brandReport.sourceBlock`, the page's `source.ref` and the locator's `path`.
- A text count: `brandReport.sourcePage`, the page's `source.ref`.

### report-list-1

What reaches the browser is bounded, so one report stays small whatever the page holds: at most 64 colour entries, 16 font entries, and per axis 6 leans and 6 readings below the floor, the first by report order. These are the caps of `docs/specs/ORV-266/tech.md` section 7. A section past its cap ends with `brandReport.more` and the number left out.

### report-text-1

Every value that came from the page (a quote, a URL, an element path, a font name) is rendered as plain text by React, never as HTML. A URL in a report is text, not a link.

### page-read-limit-1

A new entry in `LIMITS`, `page-read`: 10 per hour and 50 per day per person, day from 00:00 Asia/Bangkok, the numbers of `ai-read`, because a read costs the same kind of outbound work. The order is the existing door: session, then limit, then work. So every submission that reaches the server counts, whatever its result. A store failure fails closed.

### report-not-kept-1

Nothing from a read is stored: no table, no migration, no file, no cache across requests. The report lives in the page's client state and goes when the person leaves. The log line of the new route holds its allow-listed keys only, so no address, URL or page text reaches a log.

## Strings

Each key below is the copy of record. Rows name keys. New strings live in the design-system catalog (`packages/design-system/src/i18n`), except `brandReport.title`, `brandReport.description` and `home.openBrandReport`, which live in `apps/web/i18n/messages.ts`. Engine keys reach the page through the catalog, and a test pins them word for word to `EVIDENCE_STRINGS`.

Reused unchanged: `read.refused.address`, `read.refused.robots`, `read.notRead.competitor`, `read.notMeasured`, `read.notRendered.none`, the four `read.notMeasured.what.*`, `evidence.belowFloor`, `quality.fewWords`, `quality.pageIncomplete`, `report.conflictsNotChecked` (`packages/intent-engine/src/evidence-strings.ts`); `saved.errors.signed-out`, `saved.errors.rate-limited`, `saved.errors.failed`, `wait.*` (`apps/web/i18n/messages.ts`); `axes.*` and `levels.high`, `levels.low` (`packages/design-system/src/i18n/messages/en.ts` lines 387 to 400).

New (Thai and English are drafts for the designer's and the owner's copy review):

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `read.failed.timeout` | This page took too long to answer, so we stopped. Try again later. | หน้านี้ตอบช้าเกินไป เราจึงหยุดอ่าน ลองใหม่ภายหลัง |
| `read.failed.network` | We could not open this page. Check the address, then try again. | เราเปิดหน้านี้ไม่ได้ ตรวจที่อยู่เว็บแล้วลองใหม่ |
| `read.failed.redirects` | This address sends readers on through too many other addresses, so we stopped. | ที่อยู่นี้ส่งต่อไปยังที่อยู่อื่นหลายทอดเกินไป เราจึงหยุดอ่าน |
| `read.failed.notHtml` | This address is not a web page, so there is nothing for us to read. | ที่อยู่นี้ไม่ใช่หน้าเว็บ เราจึงไม่มีอะไรให้อ่าน |
| `home.openBrandReport` | Paste a website address and see a brand evidence report | วางที่อยู่เว็บไซต์ แล้วดูรายงานหลักฐานแบรนด์ |
| `brandReport.title` | Brand evidence report, ORIVILO | รายงานหลักฐานแบรนด์, ORIVILO |
| `brandReport.description` | Paste a website address and see what its page declares and says, read by rules. | วางที่อยู่เว็บไซต์ แล้วดูสิ่งที่หน้านั้นประกาศและเขียนไว้ อ่านตามกฎ ยังไม่ใช้ AI |
| `brandReport.heading` | Brand evidence report | รายงานหลักฐานแบรนด์ |
| `brandReport.signedOut` | Sign in to read a website. | ลงชื่อเข้าใช้ก่อน แล้วจึงอ่านเว็บไซต์ได้ |
| `brandReport.signInLink` | Go to sign in | ไปหน้าลงชื่อเข้าใช้ |
| `brandReport.notConfigured` | Reading a website is not set up in this environment yet. | สภาพแวดล้อมนี้ยังไม่ได้ตั้งค่าการอ่านเว็บไซต์ |
| `brandReport.unavailable` | We cannot read pages right now. Try again in a few minutes. | ตอนนี้ยังอ่านหน้าเว็บไม่ได้ ลองใหม่ในอีกสักครู่ |
| `brandReport.urlLabel` | Website address | ที่อยู่เว็บไซต์ |
| `brandReport.urlHint` | We read this one page once, as a visitor who is not logged in. | เราอ่านหน้านี้หน้าเดียว ครั้งเดียว โดยไม่ลงชื่อเข้าใช้เว็บนั้น |
| `brandReport.urlRequired` | Paste a website address. | วางที่อยู่เว็บไซต์ก่อน |
| `brandReport.roleLegend` | Whose website is this? | เว็บไซต์นี้เป็นของใคร |
| `brandReport.roleOwn` | My own brand | แบรนด์ของฉัน |
| `brandReport.roleReference` | A brand I look up to | แบรนด์ที่ฉันชื่นชอบ |
| `brandReport.roleCompetitor` | A competitor | คู่แข่ง |
| `brandReport.roleRequired` | Choose whose website this is. | เลือกก่อนว่าเว็บไซต์นี้เป็นของใคร |
| `brandReport.submit` | Read this page | อ่านหน้านี้ |
| `brandReport.pending` | Reading the page. This can take up to 30 seconds. | กำลังอ่านหน้าเว็บ อาจใช้เวลาถึง 30 วินาที |
| `brandReport.ruleBased` | Read by fixed rules, not by AI. Confidence numbers come from the same rules, not from a test of accuracy. | อ่านด้วยกฎที่กำหนดไว้ ไม่ได้ใช้ AI ตัวเลขความมั่นใจก็มาจากกฎเดียวกัน ไม่ได้มาจากการทดสอบความแม่นยำ |
| `brandReport.notSaved` | This report is not saved. It is gone when you leave this page. | รายงานนี้ไม่ถูกบันทึก เมื่อออกจากหน้านี้รายงานจะหายไป |
| `brandReport.pageRead` | Page read: {url} | หน้าที่อ่าน: {url} |
| `brandReport.address` | Address: {url} | ที่อยู่: {url} |
| `brandReport.readAt` | Read at {time}, Bangkok time | อ่านเมื่อ {time} เวลาไทย |
| `brandReport.readAs` | Read as: {role} | อ่านในฐานะ: {role} |
| `brandReport.incomplete` | Part of this page could not be read, so this report is incomplete and readings count for less. | อ่านหน้านี้ได้ไม่ครบ รายงานนี้จึงไม่ครบถ้วน และผลการอ่านมีน้ำหนักน้อยลง |
| `brandReport.thin` | We found very little text on this page. It may build its content with JavaScript, which we do not run, so this report may miss most of it. | เราพบข้อความในหน้านี้น้อยมาก เนื้อหาอาจสร้างด้วย JavaScript ซึ่งเราไม่ได้เรียกใช้ รายงานนี้จึงอาจตกหล่นไปมาก |
| `brandReport.coloursHeading` | Colours declared in stylesheets | สีที่ประกาศไว้ในสไตล์ชีต |
| `brandReport.fontsHeading` | Fonts declared in stylesheets | ฟอนต์ที่ประกาศไว้ในสไตล์ชีต |
| `brandReport.declaredNote` | Declared does not mean used. How much of the page each one covers was not measured. | ประกาศไว้ไม่ได้แปลว่าใช้จริง และเราไม่ได้วัดว่าแต่ละค่าครอบคลุมหน้าเว็บเท่าไร |
| `brandReport.coloursEmpty` | No colours found in linked stylesheets. | ไม่พบสีในสไตล์ชีตที่ลิงก์ไว้ |
| `brandReport.fontsEmpty` | No fonts found in linked stylesheets. | ไม่พบฟอนต์ในสไตล์ชีตที่ลิงก์ไว้ |
| `brandReport.more` | {count} more not shown. | ยังมีอีก {count} รายการที่ไม่ได้แสดง |
| `brandReport.sourceSheet` | Source: {url}, at character {offset} | ที่มา: {url} อักขระที่ {offset} |
| `brandReport.sourceBlock` | Source: {url}, block {path} | ที่มา: {url} ส่วน {path} |
| `brandReport.sourcePage` | Source: {url} | ที่มา: {url} |
| `brandReport.textHeading` | Text read on the page | ข้อความที่อ่านจากหน้านี้ |
| `brandReport.textNote` | Counts only. The page text itself is not kept. | แสดงเฉพาะจำนวน เราไม่ได้เก็บข้อความของหน้านี้ไว้ |
| `brandReport.textLine` | {kind}: blocks {blocks}, words {words} | {kind}: {blocks} ส่วน {words} คำ |
| `brandReport.kind.title` | Title | ชื่อหน้า |
| `brandReport.kind.meta` | Description | คำอธิบาย |
| `brandReport.kind.heading` | Headings | หัวข้อ |
| `brandReport.kind.body` | Body text | เนื้อหา |
| `brandReport.textEmpty` | No text found in the page's HTML. | ไม่พบข้อความใน HTML ของหน้านี้ |
| `brandReport.personalityHeading` | What the page's words suggest | คำในหน้านี้สื่อถึงอะไร |
| `brandReport.noSignal` | No signal | ไม่พบสัญญาณ |
| `brandReport.rules` | Rules: {rules} | กฎ: {rules} |
| `brandReport.confidence` | Confidence {value} | ความมั่นใจ {value} |
| `brandReport.hypothesis` | A working assumption: "not too" is read as low until evidence shows otherwise. | เป็นสมมติฐาน: คำว่า "ไม่...เกินไป" ถูกอ่านเป็นระดับน้อย จนกว่าจะมีหลักฐานอื่น |
| `brandReport.notMeasuredHeading` | Not measured or not read | สิ่งที่ไม่ได้วัดหรือไม่ได้อ่าน |
| `brandReport.notReadIndustryMood` | Not read: business type and mood. This version does not read them. | ไม่ได้อ่าน: ประเภทธุรกิจและอารมณ์ของแบรนด์ รุ่นนี้ยังไม่อ่านสองเรื่องนี้ |
| `brandReport.notReadSources` | Not read: images, scripts and styles written inside the page. Colours and fonts come from linked stylesheets only, and a font is the first family of each declaration. | ไม่ได้อ่าน: รูปภาพ สคริปต์ และสไตล์ที่เขียนไว้ในหน้าเว็บ สีและฟอนต์มาจากสไตล์ชีตที่ลิงก์ไว้เท่านั้น และฟอนต์คือชื่อแรกของแต่ละการประกาศ |

`brandReport.hue.*`, one per `hue-family` value (the ten of `CHROMATIC_FAMILIES`, then `ink` and `paper`):

<!-- prettier-ignore -->
| Key | English | Thai |
| --- | --- | --- |
| `red` | red | แดง |
| `orange` | orange | ส้ม |
| `yellow` | yellow | เหลือง |
| `lime` | lime | เขียวอ่อน |
| `green` | green | เขียว |
| `teal` | teal | เขียวอมน้ำเงิน |
| `cyan` | cyan | ฟ้า |
| `blue` | blue | น้ำเงิน |
| `violet` | violet | ม่วง |
| `magenta` | magenta | บานเย็น |
| `ink` | dark neutral | สีกลางโทนเข้ม |
| `paper` | light neutral | สีกลางโทนอ่อน |

## Acceptance criteria

A key in a row is in "Strings" or in the reused list above it, with its Thai and English. Tests use fake ports or a local server and never reach the internet (ADR 0009 point 8). The page rows are proven on stories `Examples/Application: Brand report` (names suggested), one story per state on a labelled fixture report, in both languages, because a signed-in page cannot be opened on a QA checkout without a Google session. Test names are suggested.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Fake ports answer with `HTML_A` and `CSS_A` (`url-analyser.test.ts` lines 122 to 130), role `own` | The report builder runs with no renderer | No UI | `reportSchema` parses a report with status `analysed`, `renderer` null, four `notMeasured` entries with reason `no-renderer`, five `personality` entries, `lines` holding `report.conflictsNotChecked`, and no item with `fromModel` true | `report.test.ts` "analysed" |
| 2 | Each of: `http://127.0.0.1/`, `http://169.254.169.254/latest/meta-data/`, `http://10.0.0.5/`, `http://[::1]/`, `https://example.com:8443/`, `https://user:secret@example.com/`, `ftp://example.com/`, a host that resolves to `10.0.0.5`, a public page that redirects to `http://10.0.0.5/` | The report builder runs | No UI | Status `refused` with `read.refused.address`; `user:secret` appears nowhere in the report; no `request` port call to the non-public address | `report.test.ts` "refused address", one case per address |
| 3 | robots.txt disallows `/` for `OriviloReader`; separately, robots.txt answers 503 | The report builder runs | No UI | Status `refused` with `read.refused.robots`; the only requests are for robots.txt | `report.test.ts` "refused robots" |
| 4 | Each of: the document request times out; a host with no address; the document answers 404; a chain of 4 redirects; an answer of type `application/pdf` | The report builder runs | No UI | Status `refused` with, in that order, `read.failed.timeout`, `read.failed.network`, `read.failed.network`, `read.failed.redirects`, `read.failed.notHtml`. A robots.txt that times out is row 3's fail-closed case, so the timeout case times out the document | `report.test.ts` "failed", one case per reason |
| 5 | A document of 2 MB plus 1 byte, with a block of 20 or more words holding `premium` before the cut | The report builder runs | No UI | Status `analysed`; each item carries `page-incomplete` and `quality.pageIncomplete`; a measure's confidence is 0.7; the `premium` reading's is 0.49 with `belowFloor` true, so the `premium` axis has no lean ("Worked examples") | `report.test.ts` "oversize", with `HEAVY_TIMEOUT` |
| 6 | A read that gives more than 5,000 evidence items; separately, an `analyseUrl` result with `ok: false` | The report builder runs | No UI | No report and no throw: `{ ok: false }` with `report-invalid`, then with the analyser's error (`report-outcome-1`) | `report.test.ts` "no report" |
| 7 | Role `competitor` and a valid address | The report builder runs | No UI | Status `not-read`, the address as given, line `read.notRead.competitor`, and no call to `resolve` or `request` | `report.test.ts` "competitor" |
| 8 | A local test server, and the read ports of `apps/web/server/read-ports.ts` | `request` is called with host `reader.test` and the server's address; with an answer past `maxBytes`; with a server that never answers within `timeoutMs`; with a redirect answer; over https with a certificate for another host | No UI | The call reaches the given address without trusting a new lookup of the host; the body is cut at `maxBytes` with `truncated` true; `{ ok: false, error: "timeout" }`; the redirect comes back as an answer and is not followed; `{ ok: false, error: "network" }`. No request carries a cookie or an authorization header | `read-ports.test.ts` |
| 9 | The PR head | The gate runs | No UI | No new runtime dependency and no browser package; `read-ports.ts` imports `server-only`, so no client file can reach it; no route is added yet | `git diff origin/develop -- apps/web/package.json packages/intent-engine/package.json` is empty; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
| 10 | A person who is not signed in | They open `/read` | `brandReport.heading`, the line `brandReport.signedOut` ("Sign in to read a website.", "ลงชื่อเข้าใช้ก่อน แล้วจึงอ่านเว็บไซต์ได้"), and the link `brandReport.signInLink` to `/account`. No form | None | `page.test.tsx` "signed out"; story `SignedOut` |
| 11 | An environment with no auth or database set up | They open `/read` | `brandReport.heading` and `brandReport.notConfigured`. No form | None | `page.test.tsx` "not configured"; `e2e/pages.a11y.spec.ts` gains the page |
| 12 | The form is open and the session has ended, or the action is called with no session | They submit | `saved.errors.signed-out` ("Your session has ended. Sign in again and retry."). The address stays in the field | No port is called | `actions.test.ts` "signed out"; story `SessionEnded` |
| 13 | The home page | It loads | A link `home.openBrandReport` to `/read` | None | `apps/web` home page test |
| 14 | The form, signed in | They submit with an empty field, or with no role chosen | `brandReport.urlRequired`, or `brandReport.roleRequired`, on that field | No call to the server, so no count | Story `Invalid`, play |
| 15 | The form, signed in | They paste ` example.com ` and choose `brandReport.roleOwn` | The report for `https://example.com/`, its `brandReport.pageRead` line naming that URL | `readUrlInput` gets `https://example.com` by `url-input-1` ("Worked examples") | `actions.test.ts` "url input" |
| 16 | A read is running | They press `brandReport.submit` again | The button is disabled, and `brandReport.pending` shows as a status line | One action call only | Story `Pending`, play |
| 17 | An `analysed` report | It shows | Header of `report-view-1`, section 1: the label "Read by fixed rules, not by AI. Confidence numbers come from the same rules, not from a test of accuracy." ("อ่านด้วยกฎที่กำหนดไว้ ไม่ได้ใช้ AI ตัวเลขความมั่นใจก็มาจากกฎเดียวกัน ไม่ได้มาจากการทดสอบความแม่นยำ"), `brandReport.notSaved`, the URL read, the read time and the role | None | Story `Analysed`, play |
| 18 | A report built from `HTML_A` and `CSS_A` | It shows | Colours and Fonts of `report-view-1`, sections 3 and 4: `#FF7A00` orange and `#0000FF` violet (the ORV-20 band, "Worked examples"), `inter`, each with a `brandReport.sourceSheet` line naming `https://clinic.example/a.css` (`report-source-1`); `brandReport.declaredNote`; no word that ranks them | None | Story `Analysed`, play reads the text |
| 19 | The same report | It shows | Text of `report-view-1`, section 5: one line each for title, description, headings and body with their counts, `brandReport.textNote`, and the `brandReport.sourcePage` line. No page text beyond the quotes of readings | None | Story `Analysed`, play |
| 20 | A report from the headings of `HTML_A` and two body blocks of 20 words or more, one holding `premium` and one holding `not too premium` | It shows | Personality of `report-view-1`, section 6: `report.conflictsNotChecked`; five axes; under `premium` the two body leans side by side, each with quote, source, rule ids and confidence; `brandReport.hypothesis` under the "not too premium" lean; the heading readings under `evidence.belowFloor` with "the text has fewer than 20 words" ("ข้อความมีไม่ถึง 20 คำ"); `brandReport.noSignal` under an axis with none; no English `hypothesisNote` text | None | Story `Personality`, play |
| 21 | The report of row 18 | It shows | Not measured of `report-view-1`, section 7: "Not measured: colour areas. The page was not rendered (no renderer is set up)." ("ไม่ได้วัด: สัดส่วนพื้นที่สี เพราะไม่ได้แสดงผลหน้าเว็บ (ยังไม่ได้ตั้งค่าตัวแสดงผล)"), the same for the other three, then `brandReport.notReadIndustryMood` and `brandReport.notReadSources`. Nothing on the page states a business type, a mood, a colour area, a contrast or a density | None | Story `Analysed`, play checks the six lines; the section is present on `Incomplete` and `ThinPage` too |
| 22 | A `refused` report with `read.refused.address` | It shows | Alert `warning`: "We can read only public web addresses." ("เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น"). No report sections. The address stays in the field | None | Story `RefusedAddress` |
| 23 | A `refused` report with `read.refused.robots` | It shows | Alert `warning`: "This site asks automated readers not to read this page, so we did not read it." ("เว็บไซต์นี้ขอไม่ให้โปรแกรมอัตโนมัติอ่านหน้านี้ เราจึงไม่ได้อ่าน"). No report sections | None | Story `RefusedRobots` |
| 24 | A report with `read.failed.timeout` | It shows | Alert `danger`: `read.failed.timeout` ("This page took too long to answer, so we stopped. Try again later.", "หน้านี้ตอบช้าเกินไป เราจึงหยุดอ่าน ลองใหม่ภายหลัง"). No report sections. The address stays in the field | None | Story `FailedTimeout` |
| 25 | A report of each of `read.failed.network`, `read.failed.redirects`, `read.failed.notHtml` | It shows | Alert `danger` with that line. No report sections | None | Story `FailedOther`, one state per key |
| 26 | The report of row 5 | It shows | `brandReport.incomplete` (Alert `warning`) above the sections, the sections still shown, and under `premium` the reading under `evidence.belowFloor` with "part of the page did not load", and `brandReport.noSignal` | None | Story `Incomplete`, play |
| 27 | `HTML_B` (`url-analyser.test.ts` line 708); heading and body text of 19 words; of 20 words; a page with only a title and a meta description | It shows | `brandReport.thin` (Alert `warning`) on the first, second and fourth, by `thin-page-1` ("Worked examples"), not on the third. The sections still show, with `brandReport.coloursEmpty`, `brandReport.fontsEmpty` or `brandReport.textEmpty` where a section has nothing | None | `report-view.test.ts` "thin page", one case each; story `ThinPage`, play |
| 28 | The person has used up the hourly window of `page-read-limit-1` | They submit, with `retryAfter` 1200 | "Too many requests in a short time, so this was not done. Try again in 20 minutes." ("ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที") | No port is called; the answer has code `RATE_LIMITED` and `retryAfter` | `actions.test.ts` "rate limit"; `limits.test.ts` pins `page-read-limit-1`; story `RateLimited` |
| 29 | The limit store fails; separately, the read gives no report (`report-outcome-1`) or the action call is rejected | They submit | `brandReport.unavailable`; separately `saved.errors.failed` ("That did not work. Try again.", "ทำไม่สำเร็จ ลองอีกครั้ง"), and the form works again | No port is called when the store fails | `actions.test.ts` "store fails closed" and "no report"; stories `Unavailable` and `Failed` |
| 30 | A `not-read` report | It shows | `brandReport.address` with the address as text, and `read.notRead.competitor`. No report sections | None | Story `NotRead` |
| 31 | A report with 300 distinct colours | It shows | The entries `report-list-1` allows, then `brandReport.more` with the number left out | The whole view stays under 256 KB (tech notes, test V1) | `report-view.test.ts`; story `LongLists`, play |
| 32 | A fixture report whose quote is `<img src=x onerror=alert(1)>` and whose URL ends in `"><script>` | It shows | Both as literal text; no image, no script, no link (`report-text-1`) | None | Story `UntrustedText`, play |
| 33 | An `analysed` report on the page | They press the other language in the header | The same report in the other language: headings, notices, hue labels, axis labels and not-measured lines. Values from the page stay as read. The Thai text has no letter spacing | No second read, no count | A test of the page's client part: a spy on the read action records no second call. Stories `Analysed` and `Incomplete` in both languages |
| 34 | A viewport 360 px wide, a report with a 2,048-character URL, a 500-character element path and a long Thai word with no spaces | It shows, in both languages, light and dark | Every line wraps inside the page; no horizontal scroll | None | Story `Narrow`, play: `document.documentElement.scrollWidth` is at most 360 |
| 35 | A read through the action | It ends, in each result | No UI | No table, migration or file is added by this story; the log line has route `read/analysePage` and outcome `ok`, `limited`, `unavailable` or `failed`, and it and the `page-read` step line hold no address (`report-not-kept-1`) | `actions.test.ts` "log line"; `git diff --stat origin/develop -- packages/db` is empty |
| 36 | The PR head | The gate runs | No UI | Thai and English keys match; no middot or em dash in the new copy; the route's duration limit is above the 30 s of `TOTAL_BUDGET_MS`; no model client is imported on this path | `check-i18n`; `apps/web/i18n/messages.test.ts`; a test on the duration limit; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |

## Rows per PR

Replace A and B with the PR numbers when each PR opens: the recorder reads digits only (`qa-scope-1`).

- PR 203: rows 1-9

Rows 10 to 36 moved to their own issue; they are in docs/specs/ORV-267/spec.md.

PR A is the engine and the read ports: `report.ts` and the `read.failed.*` strings from the ORV-135 branch, the report builder `reportOf`, and `apps/web/server/read-ports.ts`. It adds no route. PR B is the form and the report page: the limit, the log route, the action, the report view, the page and the copy. PR B needs PR A merged.

## Rows that render nothing

- Rows: 1-9, 35, 36

Rows 1 to 7 are engine tests, row 8 is a port test against a local server, row 9 and row 36 are gate runs, and row 35 is an action test and a diff.

## Worked examples

The main session ran these examples and they match after the row 9 fix.

**`url-input-1`.** Input: the forms a person pastes. Output: what `readUrlInput` gets, one line each, unrounded text.

```bash
node -e "for (const s of ['example.com','  https://clinic.example/  ','HTTP://clinic.example/','localhost:3000','javascript:alert(1)','ftp://example.com/']){const t=s.trim();console.log(/^[a-z][a-z0-9+.-]*:\/\//i.test(t)?t:'https://'+t)}"
```

Expected, then what the address check does with it: `https://example.com` (read), `https://clinic.example/` (read), `HTTP://clinic.example/` (read), `https://localhost:3000` (refused, a port), `https://javascript:alert(1)` (refused, does not parse), `ftp://example.com/` (refused, a scheme).

**`thin-page-1`.** Input: the body of `HTML_B` (`url-analyser.test.ts` line 708) and the heading and body blocks of `HTML_A` (lines 128 and 129). Word count by `word-count-1`. Whole numbers, no rounding.

```bash
node -e "const w=t=>[...new Intl.Segmenter('th',{granularity:'word'}).segment(t)].filter(s=>s.isWordLike).length;const sum=b=>b.reduce((n,t)=>n+w(t),0);const B=['Premium care for every family, open all week long.'];const A=['premium and calm','ไม่หรูหรา','not too premium','Opening hours are every day of the week, with walk in visits and check ups for the whole family at the clinic near the market.'];console.log(sum(B),sum(B)<20,sum(A),sum(A)<20)"
```

Expected: `9 true 33 false`. The 33 counts `ไม่หรูหรา` as 2 words, which depends on the ICU build; the result stays false at 32 or 34.

**Confidence on an incomplete page (row 5).** Base `rule-reading` 0.7 times `page-incomplete` 0.7, by `thousandths-1`: rounded to 3 decimals, compared in whole thousandths against the floor of 500.

```bash
node -e "const p=0.7*0.7;console.log(Math.round(p*1000)/1000,Math.round(p*1000)<500)"
```

Expected: `0.49 true`.

**Font name (`report-view-1`, section 4).** Input: `"Inter"` from `CSS_A`, which `familySubject("declared", '"Inter"')` turns into `declared.inter`; and `helvetica neue`, into `declared.helvetica-neue`.

```bash
node -e "for (const s of ['declared.inter','declared.helvetica-neue']) console.log(s.replace(/^declared\./,''))"
```

Expected: `inter`, then `helvetica-neue`.

**Hue band (row 18).** Input: the two colours of `CSS_A`. `classifyHex` (`color-audit.ts` lines 78 to 101) gives 28.7 degrees for `#FF7A00`, in the band from 10, and exactly 240 for `#0000FF`, where violet starts, so a pure blue reads as violet. Hue to 1 decimal.

```bash
node -e "console.log((60*(0x7a/255)).toFixed(1),(60*4).toFixed(1))"
```

Expected: `28.7 240.0`.

**The wait in row 28.** `formatWait` on 1,200 seconds: under 3,540, so whole minutes, rounded up.

```bash
node -e "console.log(Math.ceil(1200/60))"
```

Expected: `20`.

## Out of scope

- A browser on the route, or any rendered measure (ADR 0019 option D is the path; decision 5 stays proposed).
- A model call, industry (TSIC), mood, the node graph, the assembler, any feed into the brand graph.
- Saving, sharing, exporting or listing reports; a new table.
- `packages/page-reader`, the command `pnpm analyse:url` and `render-playwright.ts` of ORV-128 slice 1d.
- More than one page per read; following links; a crawl.
- A new shared component. The page composes `Alert`, `Button`, `Card`, `Field`, `Input` and `RadioGroup` from `packages/design-system`. The screen itself sits under `packages/design-system/src/examples`, the place `WorkspaceScreen` uses, so its stories can show every state. `EvidenceList` and `EvidenceSpan` take brief items only (`evidence-span/span.ts` lines 10 to 12), so they are not reused and not changed.
- Returning to `/read` after sign-in, and a nav entry.
- The final look. The POC proves the path; the screen flow waits (POC focus is function).

## Open questions (with defaults)

1. **The role field.** The objective says paste an address; `role-input-1` adds one required choice. Option: fix the role at `own` and drop the field, which saves a click but labels any brand's page as the person's own, and leaves `competitor-not-read-1` with no way to fire. Default: keep the field, no option chosen first.
2. **The limit numbers.** Default: `page-read-limit-1`. Option: reuse the `import` limit of 10 per hour, which has no day window.
3. **Who may read on staging.** Sign-in is Google only and creates a workspace for any account, so any such account can make our server read a public page. Default: any signed-in person, within the limit. This rests on ORV-128 decision D1 (a), and the owner has accepted that risk for a single page. Option: an allow-list of accounts for the POC.
4. **Showing the title and the description.** Evidence keeps no text-span quote, so the report cannot show the page's title. ORV-128 "Kept only as evidence" allows only quotes a reading rests on. Default: counts only. Option: quote the title and description (300 characters at most), which changes that rule and bumps `analyser.version`.
5. **A colour swatch.** Default: hex and hue band as text, as a swatch paints a colour from page data through an inline style. Option: a swatch beside each entry, with one row and a check that it paints only a validated `#RRGGBB`.
6. **The robots line when robots.txt fails.** A 5xx, no answer, or a compressed answer on robots.txt is complete disallow, and `read.refused.robots` then says the site "asks" when it may only be down. `ReadResult` does not tell the two apart. Default: keep the copy (ORV-128, word for word), an honest limit of this version. Option: a third refusal reason with its own line.
7. **`read.failed.*` copy.** The ORV-135 branch holds four strings under this prefix, which this role could not read, so their key names and words here may differ. Default: PR A keeps the branch's key names and takes the words in "Strings". If the branch's words are better, the spec changes first, with a version bump.
8. **The Node line.** ORV-128 asks the route's slice to re-run `word-count-1` on the Node line the route runs, as ICU may segment Thai differently. Default: the live check of tech notes section 10, and `thin-page-1` stands whatever it finds.
9. **PR size.** PR B holds the page, the action, the catalog copy and about 15 stories, likely past 400 changed lines. Default: accept that for this one PR, since the objective allows two PRs at most.
10. **Few leans on a real page.** Under ORV-128 "Confidence", a reading from a block under 20 words falls below the floor, and on an incomplete page so does every reading (row 5). Short headings carry most brand words, and one failed stylesheet makes a page incomplete, so many real pages will show `brandReport.noSignal` with their readings listed under the floor. Default: keep the numbers, because the page still shows each reading and why it does not count. Option: change the factor, which is an ORV-128 change.

## Depends on

- ORV-128: "Reading a page the person submits" (address check, robots.txt, bounds), rule `competitor-not-read-1`, "Confidence" (`thousandths-1`, the floor), "Page text" (`word-count-1`), and decision D1 (a). This spec changes none of those. Its line "No screen" is superseded for this path, listed in the task report for the owner of that document.
- ORV-128 tech notes §7, "The report schema", and open question "A report for a refused read".
- `origin/feature/ORV-135-page-reader` at `8845abe`: `report.ts`, its test and the `read.failed.*` strings, taken by cherry-pick (tech notes section 7).
- ADR 0019: decision 4 (option D) and decision 7 (the signed-in deployed route). ADR 0002 (only server code reaches outside data). ADR 0009 point 8 (tests never reach the network). ADR 0015 decisions 2, 6 and 7, and `.claude/rules/security.md` rules 1, 3, 6, 8, 14 and 15. `security` reviews both PRs.
- ORV-112 and `packages/auth/src/rate-limit.ts` (`LIMITS`); ORV-141 and `packages/auth/src/log.ts` (`ROUTES`).
- `docs/specs/ORV-266/tech.md`, the architect's notes on the ports, the report fields and the action.
- `DESIGN.md` §11, the design gate for PR B.
- The release: the main session's release PR from `develop` to `main`, which brings `main` up to date with its migrations, then the env check and the G4 walk.

## Changelog

- v1.1 (2026-11-07): the `thin-page-1` worked example now expects `9 true 33 false`, the line the main session printed when it ran the example; the first number was 10 in error, and the page is thin at either. No rule and no acceptance row changes. Task `ORV-266-arch-2`.
- v1.0 (2026-11-07): first version, from the envelope facts, the survey of `develop` at `e7c4b6d`, and a read of the analyser, the read, the strings and ORV-128. No Jira tool and no shell in this role, so ORV-266 and the ORV-135 branch were not read directly. Aligned with `tech.md` of task `ORV-266-arch-1` on the route, the ports, the limit and the caps. Downstream to review: `tech.md` (`url-input-1`, `report-source-1`, the view's language, the screen's place), the builder envelopes (PR A rows 1 to 9, PR B rows 10 to 36), the `security` envelopes, the qa envelopes (the Rows per PR lines once the PRs exist), ORV-128 lines "No screen", and rule 6 of `.claude/rules/security.md` (the new limit).
