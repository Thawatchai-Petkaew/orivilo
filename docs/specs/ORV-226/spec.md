---
issue: ORV-226 (https://tpetkaew.atlassian.net/browse/ORV-226)
lane: as set on ORV-226 in Jira (not read in this role); a new component public API is an L-lane risk flag (AGENTS.md, "Lanes and gates"), so G1 and G2 apply, passed by Claude under the owner's delegation during the POC (ADR 0012 decision 4)
mode: POC mode short spec (`.claude/skills/ovl/SKILL.md`, section "POC mode")
source_row: docs/specs/ORV-64/audit.md section D.3 row 23 ("ConfirmDialog pattern")
design: docs/specs/ORV-226/design.md (v1.0; its amendments A1 to A12 are taken here)
version: 1.3
---

# ORV-226: ConfirmDialog pattern

## Benchmark

The comparison table in the form of `docs/specs/ORV-64/audit.md` section B, with the rows `.claude/rules/design-system.md` names (owner, ORV-137 comment 10247). The Untitled UI, shadcn/ui and Ours cells are from K-0237 to K-0258 as K-0259 sums them up, read on 2026-11-06. The Add and Do not copy rows are this spec's choices at the defaults of "Open questions"; each points to the rule in "Rules" that holds it.

### ConfirmDialog

<!-- prettier-ignore -->
| Item | Detail |
| --- | --- |
| Untitled UI | Pages: <https://www.untitledui.com/react/components/modals> and <https://www.untitledui.com/components/modals> (K-0237, K-0239); no page named confirmation (K-0241). Variants: simple confirmations in standard, warning and destructive versions (K-0239); React lists Warning and Destructive forms of Stacked left aligned and Horizontal, PRO, not read (K-0238). Sizes: no size prop in `modal.tsx` (K-0237); Figma layouts at 1,440px and 375px (K-0239). States: none on the modal (K-0237, K-0238); loading sits on Button as `isLoading` (K-0240). Slots: ModalOverlay, Modal, Dialog, optional CloseButton (K-0237); header left, center or horizontal, action rows with an optional leading checkbox (K-0239). Destructive: red primary button, warning icon treatment (K-0239). Impact: a title that names the consequence, "Delete 3 projects?" (K-0239). Pending and failure: not stated, PRO source not read (K-0238). First focus: not stated (K-0237, K-0239). Role: none in `modal.tsx`; the React Aria prop admits alertdialog (K-0237, K-0242). Dismissal: backdrop off by default, Escape on unless disabled, CloseButton unaffected (K-0237). |
| shadcn/ui | Pages: <https://ui.shadcn.com/docs/components/radix/alert-dialog> and <https://www.radix-ui.com/primitives/docs/components/alert-dialog> (K-0243, K-0246). Variants: none on the dialog; Action takes Button variants, default by default and destructive in the example; Cancel outline (K-0243, K-0244). Sizes: default (`sm:max-w-lg`), sm (`max-w-xs`) (K-0243). States: open and closed through `data-state`; no pending or error (K-0243, K-0246, K-0248). Slots: Trigger, Content, Header, Media, Title, Description, Footer, Cancel, Action (K-0243). Destructive: `variant="destructive"` on Action, tinted Media (K-0244). Impact: free text in Description (K-0244). Pending: none; Radix Action closes on click unless prevented, and the docs' async example uses controlled open and a plain submit button (K-0248). Failure: none (K-0248). First focus: Cancel by ref in the Radix version (K-0247), first tabbable in the Base UI version (K-0245). Role: alertdialog, always modal (K-0247). Dismissal: outside press blocked, Esc closes back to the trigger (K-0246, K-0247). |
| Ours | Repo: `packages/design-system/src/components/dialog/Dialog.tsx`, `catalog/application/dialog.yaml`. ConfirmDialog is `none` in `catalog/coverage.md` line 66, named in `DESIGN.md` section 6 and audit D.3 row 23. Variants: default, destructive. Sizes: sm (`max-w-sm`), md (`max-w-lg`). States: closed, open, pending, error. Slots: title, description, body, error, footer, close control; a warning glyph before the title when destructive. Destructive: `feedback.danger` rule, destructive Button named after the outcome. Impact: free text in description (Destructive story). Pending: `pending` sets `aria-busy` and blocks Escape, scrim and close control; a `loading` Button is `aria-disabled` with a status line; the caller disables cancel. Failure: `error` renders role alert above the actions, with no focus move; the ErrorState story is a rename form and `ArchiveDialog` in `workspace.tsx` has no failure path. First focus: first tabbable in DOM order (K-0249), with cancel first in the footer and the close control last; the Destructive story has no play. Role: dialog (K-0249). `DialogContent` passes `role`, `onOpenAutoFocus` and `onCloseAutoFocus` to Radix through `rest` (`Dialog.tsx` line 108). Dismissal: outside press and Escape close unless pending. Strings: only `dialog.close` in the message catalogs. |
| Add | The alertdialog role with its name, its description and `aria-modal` (K-0250, K-0251): `confirm-role-1`. Impact as a named part (K-0239, K-0250, K-0251): `confirm-impact-1`. First focus stated and tested, not left to DOM order, with another target for a step that can be undone (K-0247, K-0252, K-0253): `confirm-focus-1`. No close on outside press (K-0247, K-0237): `confirm-dismiss-1`. One owner for the pending rules (K-0247, K-0248): `confirm-pending-1`. A result the caller must state before anything closes: `confirm-outcome-1`. A status line that no `aria-busy` covers (K-0113, K-0115): `confirm-status-1`. Failure and retry, which no source read states (K-0259): `confirm-failure-1`. A focus target for after a confirmed delete, when the trigger may be gone (K-0252): `confirm-return-1`. Destructive stories that show pending and failure: AC rows 7, 11. |
| Do not copy | Radix Action as the confirm of an async action: it closes on click (K-0248), and our failure state needs the dialog open (`DESIGN.md` section 6). Escape left live during pending: Radix does not block it (K-0247), and our `pending` contract does (`confirm-pending-1`). shadcn classes such as `bg-destructive/10` (K-0244): no shadcn class is kept (`.claude/rules/design-system.md`). "Continue" as a button name (K-0244): the primary is named after the outcome (`dialog.yaml`, `confirm-copy-1`). "Don't ask me again" (K-0239): G168's test wants the request presented for an action that cannot be undone (K-0256). Untitled Alerts `onConfirm` for a destructive step: inline and not blocking (K-0241), while an alert dialog is modal (K-0250, K-0251). A confirm on each save: not the intent of SC 3.3.4 (K-0254). A link inside the impact text, as in shadcn's example (K-0244): `confirm-impact-1`. |

Not read, so unknown rather than absent: Untitled UI's four PRO examples (Warning and Destructive forms of Stacked left aligned and Horizontal), their four previews (two returned no body, two were not tried) and its API table (K-0237, K-0238); the React Aria destructive dialog example (K-0242); shadcn/ui's React Aria version and Base UI's `useRenderDialogRoot` (K-0245). Nothing in this spec is filled from memory of those sources.

## Goal

ORIVILO asks people to make two kinds of decision that a stray key press must not make for them: delete something, and accept a set of changes someone else proposed. `DESIGN.md` section 6 sends both to one ConfirmDialog pattern and audit D.3 row 23 asks for its story: "Impact text, pending and failure states story". Today each caller builds it from Dialog by hand, and the one that exists (`ArchiveDialog`, `workspace.tsx` lines 255 to 310) has no failure path, leans on DOM order for focus, and closes on a scrim press. This story gives the design system one pattern, so the person always reads what will happen, a slow action never looks finished before it is, and a failed one leaves them where they were with the reason and the way forward.

What is simulated: the pattern is real markup over Dialog, but nothing it confirms is real here. Stories settle a fixture promise; nothing is deleted, no model or rule proposes the changes, and no server answers (`confirm-honest-1`).

## Story

As a person using ORIVILO, before a step that deletes something or takes on proposed changes, I read what it will do, then choose. While it runs I can see it running and cannot press it twice. If it fails I read why and can try again or walk away, and I only ever hear that it finished because it did.

## Rules

Rules are written at the defaults of "Open questions", with the amendments of `docs/specs/ORV-226/design.md` taken in v1.1, each named by its number where it lands (A1 to A12). A number such as D8 is a row of that file's "Numbered rows".

### confirm-api-1

One new public component, `ConfirmDialog`, in `src/components/confirm-dialog/ConfirmDialog.tsx`, exported from `@orivilo/design-system`. It composes our `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent` and `Button`; it does not add a primitive.

```ts
export type ConfirmResult = { status: "done" } | { status: "failed"; message: ReactNode };
export type ConfirmCloseOutcome = "cancelled" | "confirmed";

export interface ConfirmDialogProps {
  variant: DialogVariant;
  title: ReactNode;
  impact: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel?: string | undefined;
  onConfirm: () => Promise<ConfirmResult>;
  trigger?: ReactNode;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  returnFocus?: ((outcome: ConfirmCloseOutcome) => HTMLElement | null | undefined) | undefined;
  modal?: boolean | undefined;
  container?: HTMLElement | null | undefined;
}
```

`variant` has no default, so every caller chooses (`confirm-focus-1`). `title` and `impact`: `confirm-impact-1`. The two labels: `confirm-copy-1`. `pendingLabel` falls back to the catalog's `button.working`. `onConfirm`: `confirm-outcome-1`. `trigger` is wrapped in `DialogTrigger`; a caller with controlled `open` may omit it. `returnFocus`: `confirm-return-1`. `modal` and `container` keep Dialog's meaning: `modal={false}` for previews and the matrix only, `container` for a preview frame.

Fixed by the pattern, so not props: `size` is always `sm`, there is no `children` body, and the footer is always cancel then confirm. The cancel is a `ghost` Button in `DialogClose`; the confirm is a plain `Button`, `destructive` under the destructive variant and `primary` under the default one, and never sits in a `DialogClose`.

The look is one recipe block, `.ds-confirm`, which the pattern sets through `className="ds-confirm"` on `DialogContent` (A1; the block is `design.md` "The recipe block"). The panel is the one scroller and never scrolls sideways (D3). The actions stick to its foot, so they stay in reach at any zoom, and text passes under them (D4). The shape follows the panel and not the viewport: a content box at its cap of 334 takes one end-aligned row, and any narrower box stacks, cancel above confirm, 8 apart, both the full width (D5, D6, W7). A label past `confirm-copy-1` wraps inside the panel and never leaves it (D7). The confirm holds at rest the room its spinner takes, so a press changes no row and, in the row form, moves no button (D8, W8).

### confirm-role-1

`ConfirmDialog` passes `role="alertdialog"` to `DialogContent` (W5). It passes `aria-modal="true"` when `modal` is true and no `aria-modal` when `modal` is `false`. The title is the accessible name and the impact text the accessible description, both through Radix's existing wiring (K-0249). No Radix AlertDialog part appears in the tree (open question 1).

### confirm-impact-1

`title` names the consequence (K-0239) and `impact` says what will happen, in one or two sentences of plain text, with no list, no link and no other control (K-0244, K-0252). It is the Dialog `description`, so it is linked (K-0250, K-0251). When `impact` is `undefined`, `null` or an empty string, the panel shows `dialog.impactMissing`, so the description is never blank and the panel is never left without one.

### confirm-focus-1

On open, first focus goes by `variant`, set by the pattern in `onOpenAutoFocus` with `preventDefault`, never by DOM order (K-0249, W1). The focus call passes `preventScroll: true`, so a panel that scrolls opens at its title and not at its foot (A4, D15). A caller cannot change it.

<!-- prettier-ignore -->
| `variant` | Means | First focus | Why |
| --- | --- | --- | --- |
| `destructive` | The step is not easily reversed | Cancel | APG's least destructive action (K-0252, K-0253), Radix's target (K-0247) |
| `default` | The step can be undone | Confirm | APG's most used element for a dialog that continues processing (K-0252); no source names this case (K-0259) |

The catalog entry states the "Means" column, so a caller whose step cannot be undone takes `destructive`. In the DOM the footer stays cancel, confirm, then the close control, so Tab runs in that order and wraps. How the handler reaches the two buttons is the builder's choice; `ButtonProps` types no `ref` (`Button.tsx` line 12), and a change to it is a contract change that comes back to this spec.

### confirm-dismiss-1

An outside press never closes a confirm, in any state: the pattern prevents `onPointerDownOutside` and `onInteractOutside` (K-0247, K-0237). Cancel, Escape and the close control close it, with outcome `cancelled` and no call to `onConfirm` (K-0256), except while pending (`confirm-pending-1`). The close control stays, since Dialog renders it (open question 9).

### confirm-pending-1

A press of the confirm starts pending in that event: `onConfirm` is called once, `pending` goes to `DialogContent`, the confirm Button takes `loading` with `loadingLabel={pendingLabel}` and keeps its label, and the cancel Button takes `disabled`. Before the cancel is disabled, the pattern focuses the confirm if it is not the active element, with `preventScroll` (A2, D19, W9). Until the promise settles, Escape, the outside press, the cancel and the close control do nothing, and a further press of the confirm does nothing. Focus stays on the confirm, which `loading` keeps focusable (`Button.tsx` line 96), and it is the only Tab stop left, since FocusScope skips disabled controls (K-0249). The pattern is the only owner of this state; no caller sets it. It adds no time limit, so a caller's promise must settle: a server action that can hang brings its own timeout and returns `failed` (open question 4).

What A2 rests on: Safari and Firefox on macOS may not focus a clicked button, and disabling the cancel could then drop focus. That is general browser knowledge. The designer did not run it, no K entry holds it, and neither browser was run (`design.md`, "Bounds"). AC 7 names the test, story `PressFocus`: it proves the pattern's focus call in Chromium, by a click that moves no focus. It does not prove how Safari or Firefox behave.

### confirm-outcome-1

What the settled promise does, and nothing else closes the panel after a press (W2):

<!-- prettier-ignore -->
| `onConfirm` | Panel | Message | `onOpenChange` |
| --- | --- | --- | --- |
| Not settled | Open, pending | None | Not called with `false` |
| Resolves `{ status: "done" }` | Closes | None | Called once with `false` |
| Resolves `{ status: "failed", message }` | Open, not pending | The caller's `message` | Not called with `false` |
| Rejects or throws | Open, not pending | `dialog.confirmFailed`; the thrown text is never shown | Not called with `false` |

### confirm-failure-1

The message goes to `DialogContent`'s `error`, so it has role alert and sits above the actions. Focus does not move: it stays on the confirm, which keeps its name, so a press of the same button is the retry (`.claude/rules/design-system.md`, "a button names its outcome and keeps that name through the flow"). When the panel overflows, it scrolls to its end once the message has rendered, instantly and with no smooth scroll, and focus still does not move, so the message is never left under the sticky actions (A3, D22). The cancel and the close control work again. A new press removes the message at once, before pending starts, so a second failure is a new alert. Closing removes it, so the panel opens clean next time. The caller's `message` says what went wrong and how to fix it (`DESIGN.md` section 10), whether or not SC 3.3.1 and 3.3.3 reach a failed server action (K-0257).

### confirm-status-1

The pending state is exposed outside any `aria-busy`, because K-0113 lets assistive technologies wait on or ignore changes under it, and the Button's own status line sits under two: the panel's (`Dialog.tsx` line 113) and the Button's (`Button.tsx` lines 81 and 95).

- `ConfirmDialog` passes `aria-busy={false}` to `DialogContent`, and `DialogContent` lets a caller's `aria-busy` win over its `pending` default (W6). Every other caller keeps today's behaviour.
- `ConfirmDialog` renders one `<span role="status" className="sr-only">` as the last child of the footer, mounted for as long as the panel is, so the region exists before its text does. It is empty at rest and reads `pendingLabel` while pending (K-0115).
- The Button's own line stays, since Button is not changed. An assistive technology that ignores `aria-busy` may read the label twice; accepted for the POC.

### confirm-return-1

`returnFocus(outcome)` is called once per close, from `onCloseAutoFocus`, as CommandMenu does (`CommandMenu.tsx` line 147). An element it returns that is still in the document takes focus, with `preventDefault`, so Radix does not then focus the trigger (K-0249). With no `returnFocus`, or a return of `null`, `undefined` or a detached element, Radix's default stands: focus goes to the trigger. The outcome is `confirmed` from the press of the confirm until a `failed` result or a rejection, and `cancelled` otherwise, so a panel that unmounts with its row during a delete still reads `confirmed`. FocusScope fires the event in a `setTimeout` after unmount (`@radix-ui/react-focus-scope` 1.3.1 `dist/index.mjs` lines 109 to 118), so a removed row is gone by the time the caller chooses.

Bound: with no target and no trigger in the document, focus falls to `document.body` (K-0249; the trigger call in `@radix-ui/react-dialog` 1.3.1 `dist/index.mjs` line 176 is optional). The catalog entry tells a caller to pass `returnFocus` whenever the action removes the trigger or there is no trigger; the pattern cannot find a logical next place by itself (K-0252).

### confirm-copy-1

The pattern owns two keys in the existing `dialog` group of `src/i18n/messages/th.ts` and `en.ts` ("Copy", catalog table). Every other string is the caller's, passed as a prop, so the confirm names the outcome and the cancel names what stays. A `confirmLabel` is a short verb phrase that fits one line, and a name goes in `title` (A10, D26). Stories take theirs from a new `confirmFixtures` object in `src/components/fixtures.ts` ("Copy", fixture table).

### confirm-honest-1

- The pattern never shows a success state: no success text, tick or toast. Closing after `done` is its only signal, and any success message is the caller's, with backing data (`AGENTS.md` rule 4, `DESIGN.md` section 9 item 11).
- `confirmFixtures` carries a comment marking it MOCK, as `evidenceFixtures` does: the three changes, the version history the accept copy mentions, and the failures are story content. The pattern, the fixtures and the catalog entry do not use the word AI, because no AI is behind this story; a caller that accepts real AI changes labels them itself.
- No real screen reader was run. The AC rows prove the DOM (roles, attributes, focus), not what anyone hears, and the catalog's `a11y` lines say only that (`DESIGN.md` section 11, "Nothing claims ... accessibility ... beyond what is implemented and tested").

## Contract changes and impact

<!-- prettier-ignore -->
| Change | Layer | Impact |
| --- | --- | --- |
| `ConfirmDialog`, `ConfirmDialogProps`, `ConfirmResult`, `ConfirmCloseOutcome` (`confirm-api-1`) | Component API | New exports in `src/components/index.ts`; new catalog entry `catalog/application/confirm-dialog.yaml` (story `application-confirm-dialog`, status `draft`, recipes neutral, professional, friendly; `variants: [destructive, default]`, `sizes: [sm]`, `states: [closed, open, pending, failed]`, and a `rules` line with the `confirmLabel` sentence of `confirm-copy-1`, A10); `catalog/coverage.md` line 66 becomes `draft` with that story id |
| `DialogContent`: a caller's `aria-busy` wins over the `pending` default (`confirm-status-1`) | Component API, behaviour | `Dialog.tsx` line 113, one line, no type change (`DialogContentProps` already admits the prop, and today it is overwritten). No caller passes it: the files that use `DialogContent` are `Dialog.stories.tsx`, `ShortcutSheet.tsx`, `workspace.tsx`, `decision-log.tsx`. `Dialog.stories.tsx` lines 226 and 227 and the `aria-busy` lines of `workspace.stories.tsx` stay as they are. `Sheet.tsx` line 102 is not changed |
| The `.ds-confirm` block, with `className="ds-confirm"` on `DialogContent` (`confirm-api-1`, A1) | Recipe | `src/recipes/recipes.css`, after the dialog rules, as `design.md` "The recipe block" gives it. A new recipe class, with no new token, no new pair and no change to any `.ds-dialog` caller, since every selector starts at `.ds-confirm`. `recipes.test.ts` runs on it (AC 25); the designer did not run it, so the builder's run is the proof. Why the recipe could not stay: `design.md` "Before and after" |
| `dialog.confirmFailed`, `dialog.impactMissing` (`confirm-copy-1`) | Locale catalog | `th.ts`, `en.ts`; `check-i18n` and `i18n.test.ts` check key parity |
| `confirmFixtures` | Fixture | `src/components/fixtures.ts` only; no component reads it |
| `catalog/application/dialog.yaml` | Catalog | `useWhen` line 8 drops "or confirmation"; `avoidWhen` gains a line that sends a confirmation to ConfirmDialog. `DESIGN.md` is the contract this entry follows |
| `DESIGN.md` section 6 line 178 | Design contract | The task cell widens from "Confirm a destructive action" to "Confirm a destructive action, or accepting proposed changes", with the version line bumped |

Not changed: any token in any layer, `pairs.ts` (`dialog.error` and `dialog.destructive` on `dialog.bg` are declared, lines 484 to 490, and the footer's ground is `--cmp-dialog-bg`, D31), any existing rule of `recipes.css`, any profile, `Button`, `Sheet`, `ArchiveDialog`, `apps/web`.

## Copy

Catalog keys (`confirm-copy-1`).

<!-- prettier-ignore -->
| Key | Thai | English |
| --- | --- | --- |
| `dialog.confirmFailed` | ทำรายการนี้ไม่สำเร็จ ลองอีกครั้ง หรือปิดหน้าต่างนี้แล้วกลับมาทำภายหลัง | This did not go through. Try again, or close this and come back later |
| `dialog.impactMissing` | ไม่มีข้อมูลว่าการกระทำนี้มีผลกับอะไร ตรวจสอบก่อนยืนยัน | No details on what this affects. Check before you confirm |

Fixture copy for the stories, MOCK, not catalog keys (`confirm-honest-1`). The delete rows reuse the wording of the existing `Application/Dialog` `Destructive` story. The object is keyed by language first, as `featuredIconFixtures` is: in a key below, `<lang>` is `th` for the Thai column and `en` for the English column. `rows` is an array of the three names; `rowTrigger` and `opener` are one string per language.

<!-- prettier-ignore -->
| Fixture key | Thai | English |
| --- | --- | --- |
| `confirmFixtures.<lang>.delete.title` | ลบโปรเจกต์นี้ถาวร | Delete this project permanently |
| `confirmFixtures.<lang>.delete.impact` | สมาชิก 4 คนจะเข้าถึงไม่ได้อีก และลิงก์ที่แชร์ไปจะใช้ไม่ได้ การลบย้อนกลับไม่ได้ | 4 members lose access and shared links stop working. This cannot be undone |
| `confirmFixtures.<lang>.delete.confirm` (also the trigger) | ลบโปรเจกต์ | Delete project |
| `confirmFixtures.<lang>.delete.cancel` | เก็บไว้ | Keep project |
| `confirmFixtures.<lang>.delete.pending` | กำลังลบโปรเจกต์ | Deleting project |
| `confirmFixtures.<lang>.delete.failed` | ลบโปรเจกต์ไม่สำเร็จ เพราะการเชื่อมต่อขาดหาย ตรวจการเชื่อมต่อแล้วลองอีกครั้ง | Could not delete the project because the connection dropped. Check your connection and try again |
| `confirmFixtures.<lang>.accept.title` | ยอมรับการเปลี่ยนแปลงที่เสนอ 3 รายการ | Accept 3 proposed changes |
| `confirmFixtures.<lang>.accept.impact` | สีหลัก ฟอนต์หัวข้อ และระยะห่างจะเปลี่ยนตามที่เสนอ ย้อนกลับได้จากประวัติเวอร์ชัน | The primary colour, heading font and spacing change as proposed. You can undo this from version history |
| `confirmFixtures.<lang>.accept.confirm` (also the trigger) | ยอมรับการเปลี่ยนแปลง | Accept changes |
| `confirmFixtures.<lang>.accept.cancel` | คงแบบเดิมไว้ | Keep current version |
| `confirmFixtures.<lang>.accept.pending` | กำลังยอมรับการเปลี่ยนแปลง | Accepting changes |
| `confirmFixtures.<lang>.accept.failed` | ยอมรับการเปลี่ยนแปลงไม่สำเร็จ เพราะการเชื่อมต่อขาดหาย ตรวจการเชื่อมต่อแล้วลองอีกครั้ง | Could not accept the changes because the connection dropped. Check your connection and try again |
| `confirmFixtures.<lang>.rows` | แบรนด์หลัก, หน้าแลนดิ้ง, คู่มือสี | Main brand, Landing page, Colour guide |
| `confirmFixtures.<lang>.rowTrigger` | ลบ {name} | Delete {name} |
| `confirmFixtures.<lang>.opener` | ลบจากเมนู | Delete from menu |

`LongContentAt360` and `ShortPanel` use `fixtures.longThai` as the title and `${fixtures.longThai} ${fixtures.longLatin}` as the impact. `LongLabel` passes `fixtures.longThai` as `confirmLabel`. `MissingValue` passes `fixtures.missing` as the impact.

## Acceptance criteria

Story file: `Application/Confirm dialog` (id `application-confirm-dialog`), a new `ConfirmDialog.stories.tsx` beside the component. Plays run in Thai under neutral, light, unless a row says otherwise. In a story that presses the confirm, `onConfirm` is a `fn()` spy over a promise the play settles, so no play waits on a timer. "The confirm" and "the cancel" name the two footer buttons of the row's variant. Stories render the delete fixtures unless the row says accept.

<!-- prettier-ignore -->
| # | Given | When | User sees | Data effect | Check |
| --- | --- | --- | --- | --- | --- |
| 1 | Story `Closed` | Rendering | A secondary button "ลบโปรเจกต์"; no panel | `queryByRole("alertdialog")` is null; `onConfirm` not called | `Closed` play |
| 2 | Story `Destructive` | Tab to the trigger, press Enter | A panel with a danger glyph before "ลบโปรเจกต์นี้ถาวร", the impact sentence under it, ghost "เก็บไว้", destructive "ลบโปรเจกต์", and the close control "ปิด" | `findByRole("alertdialog", { name: "ลบโปรเจกต์นี้ถาวร" })`; `toHaveAccessibleDescription` with the impact text; `aria-modal` is `"true"`; no element has role dialog; `data-variant` is `destructive`; `onConfirm` not called; glyph, title and impact `left` edges equal within 0.5; the glyph's vertical centre equals the close control's within 0.5; the footer's `top` at or below the impact's `bottom` at rest, read from rects, which is the check that catches the sticky padding fault of D4 (`confirm-role-1`, `confirm-impact-1`, `confirm-api-1`, W5, A6) | `Destructive` play |
| 3 | Same, open | The panel has opened; then Tab three times | The focus line and halo on "เก็บไว้"; they move to "ลบโปรเจกต์", then "ปิด", then back to "เก็บไว้" | `toHaveFocus()` on each in that order; `matches(":focus-visible")` on "เก็บไว้" (`confirm-focus-1`, W1) | `Destructive` play step |
| 4 | Story `Accept`, accept fixtures | Tab to the trigger, press Enter | A panel with no glyph, "ยอมรับการเปลี่ยนแปลงที่เสนอ 3 รายการ", ghost "คงแบบเดิมไว้", primary "ยอมรับการเปลี่ยนแปลง", with the focus line and halo on "ยอมรับการเปลี่ยนแปลง" | Role alertdialog; `data-variant` is `default`; "ยอมรับการเปลี่ยนแปลง" `toHaveFocus()` though "คงแบบเดิมไว้" comes first in the DOM (`compareDocumentPosition`); `onConfirm` not called (`confirm-focus-1`, W1) | `Accept` play |
| 5 | Story `Dismiss`, opened from the trigger | Three rounds: press "เก็บไว้"; reopen, press Escape; reopen, press "ปิด" | Each round the panel goes and focus is back on the trigger | `onConfirm` not called; `onOpenChange` last called with `false`; `queryByRole("alertdialog")` null; trigger `toHaveFocus()` (`confirm-dismiss-1`, `confirm-return-1`) | `Dismiss` play |
| 6 | Same, open | A click on `.ds-dialog__scrim` | The panel stays | `onOpenChange` not called with `false`; alertdialog still in the document (`confirm-dismiss-1`) | `Dismiss` play step |
| 7 | Story `Pending`, promise held | Press "ลบโปรเจกต์", press it again, then Escape, a scrim click and Tab | A spinner on "ลบโปรเจกต์" with its label kept; "เก็บไว้" and "ปิด" in the disabled look; the panel stays through all of it | `onConfirm` called once; the confirm has `aria-disabled` and `aria-busy` `"true"` and keeps `toHaveFocus()`; "เก็บไว้" and "ปิด" `toBeDisabled()`; `onOpenChange` not called with `false`; panel height and footer height equal before and during pending, and `expectSameHeight` on the two buttons (A7; the row form is proved in row 30). In story `PressFocus`, promise held, first focus is on "เก็บไว้" and the play calls `confirm.click()`, which moves no focus, as a browser that does not focus a clicked button would: "ลบโปรเจกต์" `toHaveFocus()` during pending, and that assertion goes red with the pattern's focus call taken out (A2) (`confirm-pending-1`) | `Pending` play; `PressFocus` play |
| 8 | Stories `Pending` and `Failed` | In `Pending`: before the press and during pending; the play ends with the promise held, so the spinner is what the story shows when opened. In `Failed`: after the play settles the promise | Nothing new on screen | The `role="status"` element outside any button exists and is empty, then reads "กำลังลบโปรเจกต์"; in `Failed` it is empty after the promise settles; while it reads, its `closest('[aria-busy="true"]')` is null and the panel's `aria-busy` is not `"true"` (`confirm-status-1`, W6) | `Pending` play step; `Failed` play step |
| 9 | Story `AcceptPending`, accept fixtures, promise held | Press "ยอมรับการเปลี่ยนแปลง" | A spinner on "ยอมรับการเปลี่ยนแปลง"; "คงแบบเดิมไว้" and "ปิด" in the disabled look | As rows 7 and 8, with the heights and `expectSameHeight` of row 7 (A7), and with "กำลังยอมรับการเปลี่ยนแปลง"; the play ends with the promise held, and the check after the promise settles is in `AcceptFailed` (`confirm-pending-1`, `confirm-status-1`) | `AcceptPending` play; `AcceptFailed` play step |
| 10 | Story `Done`, promise held | Press "ลบโปรเจกต์"; the play confirms the panel is still open, then resolves `{ status: "done" }` | Until then the panel with its spinner; after it the panel is gone, focus is on the trigger, and nothing says it worked | `onOpenChange` not called with `false` before the resolve, called once with `false` after it; no `role="alert"`; `canvasElement.textContent` equals its text before the press (`confirm-outcome-1`, `confirm-honest-1`, W2) | `Done` play |
| 11 | Story `Failed`, promise held | Press "ลบโปรเจกต์"; the play resolves `{ status: "failed", message }` with `confirmFixtures.th.delete.failed` | "ลบโปรเจกต์ไม่สำเร็จ เพราะการเชื่อมต่อขาดหาย ตรวจการเชื่อมต่อแล้วลองอีกครั้ง" above the actions in the danger colour; the spinner gone; "ลบโปรเจกต์" still focused and still named so | Panel open; `findByRole("alert")` has that text; its `bottom` is at or above the footer's `top` within 0.5, where that `top` includes the footer's 16 padding (A8); its computed colour equals `cssColorToHex(resolvedColor(panel, "--cmp-dialog-error"))`; the confirm `toHaveFocus()` with no `aria-disabled`; "เก็บไว้" and "ปิด" `toBeEnabled()`; `onOpenChange` not called with `false` (`confirm-outcome-1`, `confirm-failure-1`, W2) | `Failed` play |
| 12 | Story `Retry`, failed as in row 11 | Press "ลบโปรเจกต์"; the play resolves `{ status: "done" }` | The message gone at once, the spinner back, then the panel closes | `queryByRole("alert")` null before the promise settles; `onConfirm` called twice in all (`confirm-failure-1`, `confirm-outcome-1`) | `Retry` play |
| 13 | Story `FailureClears`, failed as in row 11 | Press Escape, then reopen from the trigger | The panel closes; it reopens with no message | `queryByRole("alert")` null after reopening; "เก็บไว้" `toHaveFocus()` (`confirm-failure-1`, `confirm-focus-1`) | `FailureClears` play |
| 14 | Story `AcceptFailed`, accept fixtures, promise held | Press "ยอมรับการเปลี่ยนแปลง"; the play resolves `failed` with `confirmFixtures.th.accept.failed` | "ยอมรับการเปลี่ยนแปลงไม่สำเร็จ เพราะการเชื่อมต่อขาดหาย ตรวจการเชื่อมต่อแล้วลองอีกครั้ง" above the actions; focus still on "ยอมรับการเปลี่ยนแปลง" | As row 11, with its tolerance (A8) (`confirm-failure-1`) | `AcceptFailed` play |
| 15 | Story `ThrownFailure`, promise held | Press "ลบโปรเจกต์"; the play rejects with `new Error("secret-internal")` | "ทำรายการนี้ไม่สำเร็จ ลองอีกครั้ง หรือปิดหน้าต่างนี้แล้วกลับมาทำภายหลัง" above the actions | `findByRole("alert")` has that text; "secret-internal" is not in `document.body.textContent`; panel open (`confirm-outcome-1`, W2) | `ThrownFailure` play |
| 16 | Story `DeleteRow`: a list of `confirmFixtures.th.rows`, each row holding its own `ConfirmDialog` and trigger, `returnFocus` returning the next row's trigger | Press "ลบ หน้าแลนดิ้ง", press the confirm, the play resolves `done` after removing the row | The row is gone and focus is on "ลบ คู่มือสี" | Two list items left; "ลบ คู่มือสี" `toHaveFocus()`, not `document.body`; `returnFocus` called once with `"confirmed"` (`confirm-return-1`) | `DeleteRow` play |
| 17 | Story `Controlled`: no `trigger`, `open` in story state, a button "ลบจากเมนู" that sets it, `returnFocus` returning that button | Press "ลบจากเมนู", then Escape | The panel opens and closes; focus is back on "ลบจากเมนู" | `onOpenChange` called with `false`; `returnFocus` called once with `"cancelled"`; "ลบจากเมนู" `toHaveFocus()` (`confirm-return-1`, `confirm-api-1`) | `Controlled` play |
| 18 | Story `MissingValue`, `impact` is `fixtures.missing` | Open from the trigger | "ไม่มีข้อมูลว่าการกระทำนี้มีผลกับอะไร ตรวจสอบก่อนยืนยัน" where the impact goes | `toHaveAccessibleDescription` with that text (`confirm-impact-1`) | `MissingValue` play |
| 19 | Story `InEnglish` (`LocaleProvider locale="en"`): one closed trigger, then six frames with `modal={false}` and `container` | Rendering; the play presses the confirm in the four frames that show pending and failed | "Delete project" closed; both variants open, pending and failed, in English: "Delete this project permanently", "Keep project", "Accept 3 proposed changes", "Keep current version", and the failed lines of the Copy table | Six alertdialogs (W4); two status lines reading "Deleting project" and "Accepting changes"; two alerts with the English failed text; no Thai character in the frames | `InEnglish` play |
| 20 | Story `LongContentAt360`: a 360 by 560 frame, `modal={false}`, `container`, the failed state | Rendering, then the play presses the confirm and fails it | The panel fills the frame less the gutter; the long Thai title and impact wrap inside it; no Thai mark is clipped; both actions show; nothing scrolls sideways | Panel width 328 within 0.5 (W3); frame `scrollWidth` not above 360; the panel's rect lies inside the frame's rect; every ancestor of the title, the impact and the failure line, up to but not including the frame, has computed `overflow-x` and `overflow-y` of `visible`, except the panel, which is the scroller on purpose (`confirm-api-1`, A5): its computed `overflow-y` is `auto` and its `scrollHeight` is not above its `clientHeight` for this fixture, so at this size it clips nothing; both buttons 278 wide (W7), the cancel above the confirm, 8 apart | `LongContentAt360` play: the ancestor walk, then `if (inVitest)` `expectLinesClear` on the title and the impact (each wrapped), `expectLabelInkWhole` on the cancel and the confirm (each one line), and `expectNoInkCut(el, frame, panel)` on the title, the impact, the failure line, the cancel and the confirm. `expectLinesClear`, `expectLabelInkWhole` and `expectFrameCutsNoInk` are from `src/testing/visual-asserts.ts`, which is unchanged. `expectNoInkCut` is a wrapper local to `ConfirmDialog.stories.tsx` around `expectFrameCutsNoInk`, which sets the panel and the frame to `overflow: visible` in its second shot and so proves neither cuts ink, seen red through the wrapper on its own failure line. Why the wrapper: the panel is the scroller the sticky footer pins to, so with the panel at `overflow: visible` the footer pinned to the frame instead, moved up 32.5 px in the second shot (measured in the build) and the helper read that move as cut ink. The wrapper holds the footer at `position: static` through both shots and puts it back, which moves nothing, since this panel does not scroll at rest. Why `expectLinesClear` does not run on the failure line: on `.ds-dialog__error` it reads 0 px between the two lines, and that reading is not yet known to be a real touch of two lines, because another card measured 0 px from the shared helper at some sub-pixel positions at device pixel ratio 1 (ORV-234 comment 10539). The row leaves the check out until the helper is settled, and the failure line goes to a follow-up ("Out of scope"); the ancestor walk and `expectNoInkCut` still run on it |
| 21 | Story `InsideProfile`: a `DesignProfileBoundary` with professional, light | Open from the trigger | The panel in the professional look | The panel's `closest("[data-design-profile]")` is `professional`; `--ds-action-primary` reads the same on the panel and the trigger | `InsideProfile` play |
| 22 | Story `RecipesAndModes` through `Matrix`, a frame per cell, `modal={false}`, a failed `onConfirm` | The play presses the confirm in each cell | In each of six boundaries (neutral, professional, friendly, each light and dark) an open panel with its message in the danger colour | Six alertdialogs, six alerts (W4); no `aria-modal` on any of them (`confirm-role-1`); contrast from the declared pairs, proven by `recipes.test.ts` and `pnpm contrast` | `RecipesAndModes` play |
| 23 | `Application/Dialog` `Pending`, unchanged | Its play runs on the PR head | Not a screen | The panel still has `aria-busy="true"` while pending, so a caller that passes no `aria-busy` keeps today's behaviour (`confirm-status-1`, W6) | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/dialog` |
| 24 | Storybook test project | The a11y addon runs on every ConfirmDialog story | Not a screen | Zero violations (`DESIGN.md` section 11) | Vitest Storybook project output |
| 25 | The PR head | `check-catalog`, `check-i18n`, `i18n.test.ts`, `recipes.test.ts` and the copy check run | Not a screen | `catalog/application/confirm-dialog.yaml` resolves to story `application-confirm-dialog`; the `coverage.md` row matches; both keys exist in Thai and English; no middot or em dash in the new files; the `.ds-confirm` block reads only declared properties and carries no raw value (`confirm-copy-1`, A1); the entry's `rules` hold the `confirmLabel` line (A10) | `pnpm --filter @orivilo/design-system test` output; `grep -n "confirmLabel" packages/design-system/catalog/application/confirm-dialog.yaml` |
| 26 | Storybook at 360 and 1440 px, light and dark, Thai and English | The designer opens `Destructive`, `Accept`, `Pending`, `AcceptPending`, `Failed`, `AcceptFailed`, `MissingValue`, `MissingValueEn`, `LongContentAt360`, `InEnglish`, `RecipesAndModes`, `ShortPanel`, `LongLabel`, `ShapeHolds` | The destructive path looks different from the accept path before a word is read; the spinner keeps the label in place, which means the same words with no change of footer height or rows, the row form also holding the label's x and the stacked form re-centring it 12 (W8, A9); the failure reads as a failure above the actions; focus reads as focus, not selection | None | Designer visual sign-off; its PNG paths are posted as a Jira comment on ORV-226 |
| 27 | The PR head | The affected suites run, then the full gate | Not a screen | Every play and test passes | `pnpm --filter @orivilo/design-system exec vitest run --project storybook src/components/confirm-dialog src/components/dialog`, output in the builder's `verified`; `pnpm lint && pnpm typecheck && pnpm test && pnpm build` at the G3 gate |
| 28 | Story `ShortPanel`: a 640 by 360 frame, `modal={false}`, `container`, the long content of "Copy", promise held | Rendering; ArrowDown by a real key on the focused "เก็บไว้"; press "ลบโปรเจกต์"; the play resolves `failed` with `confirmFixtures.th.delete.failed` | The panel opens at its title; the text scrolls under the actions, which stay in reach; after the failure the message is whole above them | Panel `scrollHeight` above `clientHeight`; `scrollTop` 0 on open (`confirm-focus-1`, A4); after ArrowDown `scrollTop` above 0 and "เก็บไว้" still `toHaveFocus()`; on open, after ArrowDown and after the failure the footer's rect lies inside the panel's rect and the frame's; after the failure the alert's `top` is at or below the panel's `top`, its `bottom` is at or above the footer's `top` within 0.5, and "ลบโปรเจกต์" `toHaveFocus()` (`confirm-api-1`, `confirm-failure-1`, A3, A11) | `ShortPanel` play. The ArrowDown step runs `if (inVitest)` through `userEvent` from `vitest/browser`, since the synthetic key of `storybook/test` scrolls nothing. No ink helper here: at this size the panel cuts text on purpose, and row 20 holds the ink proof |
| 29 | Story `LongLabel`: two frames, 360 and 416 wide, each 560 high, `modal={false}`, `container`, `fixtures.longThai` as `confirmLabel` | Rendering | The long label wraps inside its button, the button stays inside the panel, and nothing scrolls sideways | In each frame: the confirm's rect lies inside the panel's rect; frame `scrollWidth` not above its width; the confirm is taller than the 40 of `--cmp-button-height-md`, so the label wraps; every ancestor of the confirm, up to but not including the frame, has computed `overflow-x` and `overflow-y` of `visible`, except the panel, as row 20 (`confirm-api-1`, `confirm-copy-1`, A12) | `LongLabel` play: the ancestor walk, then `if (inVitest)` `expectLabelInkWhole(confirm)` and `expectNoInkCut(confirm, frame, panel)`, the story-local wrapper around `expectFrameCutsNoInk`, used here because this panel has the same sticky footer; row 20 gives the reason in full. `expectLinesClear` is left out: footer type stays at 1.6, a deviation `design.md` "Bounds" records for a label past the contract |
| 30 | Story `ShapeHolds`: frames 412 and 416 wide among them (the build has three), each 560 high, ending with every panel open so the shape shows when the story is opened, `modal={false}`, `container`, `LocaleProvider locale="en"`, accept fixtures, promise held | Press "Accept changes" in each frame | At 412 the actions stack; at 416 they sit in one row; the press changes neither shape, and at 416 neither button moves | In each frame the number of button rows, the footer height and the panel height are the same at rest and pending; at 412 the confirm's `top` is below the cancel's `bottom`; at 416 the two buttons' `top` values are equal within 0.5, and the cancel's `left` and the confirm's `right` are unchanged within 0.5 (`confirm-api-1`, `confirm-pending-1`, W7, A7, A12) | `ShapeHolds` play |

## Rows that render nothing

- Rows: 23, 24, 25, 27

## Rows per PR

One PR holds rows 1 to 30, because the entry, the story and the code of a component land together (`.claude/rules/design-system.md`). The estimate is about 700 changed lines, over the 400-line guide, and most of it is stories: the 500 of v1.0, the 53 lines of the recipe block, and about 150 lines for rows 28 to 30 and `PressFocus` (open question 11). The line below is in the form `qa-scope-1` reads (`scripts/ovl/result-recorder.mjs`).

- PR 193: rows 1-30

## Out of scope

- Moving `ArchiveDialog` (`workspace.tsx`) or any other caller onto ConfirmDialog, and wiring it into `apps/web`. A follow-up card; the entry stays `draft`, which is usable inside the package only.
- A list of the changes inside the panel, a `children` body, a Media slot and a `size` prop (open question 10).
- A "Don't ask me again" checkbox, an undo or trash route (G99, K-0256), and a typed confirmation.
- A time limit or an abort on `onConfirm` (open question 4).
- Taking `aria-busy` off `Sheet` or off `Button`, or changing Dialog's default (open question 7, option c).
- A `ref` on `Button`.
- A test with a real screen reader (`confirm-honest-1`).
- `expectLinesClear` on the failure line, which row 20 leaves out and says why. A follow-up card, once the helper's reading is settled.
- Correcting `docs/specs/ORV-64/audit.md` A.2, which says Untitled has no ConfirmDialog while K-0238 and K-0239 show confirmation versions of its modals (K-0259, open points). Reported to the main session.
- Visual regression baselines (`.claude/rules/testing.md`).

## Worked examples

None is run here (no shell in this role); each runs from the repo root with `node -e`.

W1. The first focus of `confirm-focus-1` (AC 3, 4). Input: the two members of `DialogVariant` (`Dialog.tsx` line 49) and the footer's DOM order, cancel, confirm, close control. Expected output, as `variant target dom-first`: `destructive cancel cancel`, then `default confirm cancel`. The second line is why the target cannot be left to DOM order.

```bash
node -e 'const order=["cancel","confirm","close"];const first={destructive:"cancel",default:"confirm"};for(const v of ["destructive","default"])console.log(v,first[v],order[0])'
```

W2. The map of `confirm-outcome-1` (AC 10, 11, 15). Input: three `onConfirm` functions, the failed text from the Copy table, and the thrown text of AC 15. Expected output: `closed none`, then `open ลบโปรเจกต์ไม่สำเร็จ`, then `open dialog.confirmFailed`.

```bash
node -e 'const settle=async f=>{try{const r=await f();return r.status==="done"?"closed none":"open "+r.message}catch{return "open dialog.confirmFailed"}};(async()=>{for(const f of [()=>Promise.resolve({status:"done"}),()=>Promise.resolve({status:"failed",message:"ลบโปรเจกต์ไม่สำเร็จ"}),()=>Promise.reject(new Error("secret-internal"))])console.log(await settle(f))})()'
```

W3. The panel width of AC 20. Input: `.ds-dialog` `width: calc(100% - 2 * var(--ds-space-gutter))` (`recipes.css` line 1006), `space.gutter` referencing `{space.4}` (`semantic.json` line 825), whose value is `16px` (`primitives.json` line 477), and the `max-w-sm` cap of 24 rem at a 16 px root (`Dialog.tsx` line 110). Expected output, px, no rounding: `328`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const r=s.space.gutter.$value.replace(/[{}]/g,"").split(".");const g=parseFloat(p[r[0]][r[1]].$value);console.log(Math.min(360-2*g,24*16))'
```

W4. The counts of AC 19 and 22. Input: the three profiles and two modes `Matrix` renders (`matrix.tsx` lines 10 and 30; `.claude/rules/design-system.md`), and the two variants by three shown states (open, pending, failed) of `InEnglish`. Expected output, integers: `6 6`.

```bash
node -e 'const profiles=["neutral","professional","friendly"],modes=["light","dark"],variants=["destructive","default"],states=["open","pending","failed"];console.log(profiles.length*modes.length,variants.length*states.length)'
```

W5. The role of `confirm-role-1` (AC 2). Input: `@radix-ui/react-dialog` 1.3.1 `dist/index.mjs` lines 259 and 264, `role: "dialog"` before `...contentProps`, and the prop the pattern passes. Expected output: `alertdialog`.

```bash
node -e 'const contentProps={role:"alertdialog"};console.log({role:"dialog",...contentProps}.role)'
```

W6. The `aria-busy` of `confirm-status-1` (AC 8, 23). Input: a caller's `aria-busy` and `pending`, as `[undefined, true]` (a Dialog caller, pending), `[false, true]` (ConfirmDialog, pending), `[undefined, false]` (a Dialog caller at rest). Expected output: `true`, `false`, `undefined`.

```bash
node -e 'const busy=(own,pending)=>own??(pending||undefined);for(const [o,p] of [[undefined,true],[false,true],[undefined,false]])console.log(busy(o,p))'
```

W7. The content box and the shape of `confirm-api-1` (AC 20, 29, 30). Input: `space.gutter` and `space.inset.lg` (`semantic.json` lines 825 and 788, which `--cmp-dialog-padding` reads), the 1 px border (`recipes.css` line 1009), the 24 rem cap at a 16 px root (`Dialog.tsx` line 110), the 333 of the block's `@container` rule (`design.md`, "The recipe block"), and the frame widths 360, 412, 416. Expected output, as `frame panel box shape`, px, no rounding: `360 328 278 stacked`, `412 380 330 stacked`, `416 384 334 row`.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const v=t=>{const r=t.$value.replace(/[{}]/g,"").split(".");return parseFloat(p[r[0]][r[1]].$value)};const g=v(s.space.gutter),pad=v(s.space.inset.lg),border=1,cap=24*16;for(const f of [360,412,416]){const panel=Math.min(f-2*g,cap),box=panel-2*pad-2*border;console.log(f,panel,box,box<=333?"stacked":"row")}'
```

W8. The room the confirm holds (`confirm-api-1`, AC 26). Input: `--cmp-button-icon-size-md`, which reads `size.icon.sm` (`semantic.json` line 877), and `--cmp-button-gap` and the footer gap, which both read `space.inline.md` (`semantic.json` line 816). Expected output, as `held row-gap re-centre`, px, no rounding: `24 32 12`. The stacked label moves by half the held room.

```bash
node -e 'const s=require("./packages/design-system/src/tokens/source/semantic.json"),p=require("./packages/design-system/src/tokens/source/primitives.json");const v=t=>{const r=t.$value.replace(/[{}]/g,"").split(".");return parseFloat(p[r[0]][r[1]].$value)};const gap=v(s.space.inline.md),held=v(s.size.icon.sm)+gap;console.log(held,gap+held,held/2)'
```

W9. The focus on a press of `confirm-pending-1` (AC 7). Input: the active element at the press, as a pointer on Chromium leaves it (`confirm`), as `confirm.click()` leaves it after first focus (`cancel`), and as a dropped focus leaves it (`body`). Expected output, as `active call after`: `confirm no confirm`, `cancel yes confirm`, `body yes confirm`.

```bash
node -e 'const press=a=>a==="confirm"?["no",a]:["yes","confirm"];for(const a of ["confirm","cancel","body"])console.log(a,...press(a))'
```

## Open questions

The designer's answers, from `docs/specs/ORV-226/design.md` section "Answers to the open questions". None differs from its default:

- Question 2: (a), held in `confirm-focus-1` (D15).
- Question 3: (a), held in `confirm-focus-1` (D15).
- Question 5: (a), with one addition, A3, held in `confirm-failure-1` (D21, D22).
- Question 9: both defaults, held in `confirm-dismiss-1` and `confirm-pending-1` (D17, D18).

The designer did not answer the other questions, so they stay on their defaults, which the main session takes under the owner's POC delegation. "Rules" is written at the defaults.

1. How the pattern gets role alertdialog, and what that means for a pending or failed confirm. Options: (a) the `radix-ui` AlertDialog already in the lockfile (K-0247): it brings the role, Cancel by ref and the blocked outside press, but its Action closes on click (K-0248), so the confirm must be a plain button anyway; Escape stays live and must be blocked by hand (K-0247); its root forces `modal: true` (`@radix-ui/react-alert-dialog` 1.2.1 `dist/index.mjs` line 21), so the `modal={false}` the matrix and the 360 frame use is not available; and the header, glyph, error, footer and close control of `DialogContent` would be rebuilt beside it, with no `pending` or `error` to reuse. (b) A role passed to our content (K-0249, K-0250, K-0251): the role reaches Radix with no change to Dialog (W5), `pending` and `error` keep working, the confirm is never a close control, so nothing closes on click, and the three things AlertDialog gave are stated in `confirm-focus-1` and `confirm-dismiss-1`. Default: (b), which is `confirm-role-1`.
2. First focus for a delete. Options: (a) the cancel: APG's advice for a step that is not easily reversible and its worked example (K-0252, K-0253), Radix's target (K-0247); (b) the confirm: the ARIA 1.2 sentence gives a confirmation button as an example of an active element (K-0250), and K-0259 records the two as not reconciled. Default: (a), which is `confirm-focus-1`.
3. First focus for accepting AI changes. No page read names this case (K-0259). Options: (a) the confirm, on the APG note for a dialog that continues processing (K-0252), which holds only while the step can be undone; (b) the cancel, one rule for every confirm, safer against a stray Enter and one more key for the common path, in the spirit of SC 3.3.6 as we read it (K-0255); (c) a static element with `tabindex="-1"`, the APG advice for structured or long content (K-0252), which only applies if a list of the changes comes into the panel. Default: (a), which is `confirm-focus-1`; a caller whose accept cannot be undone takes `destructive`, and so gets the cancel.
4. Escape during pending. No source read speaks of a pending dialog (K-0259). Options: (a) blocked, as our `pending` contract does; the cost is a panel that holds until the promise settles, so a caller's promise must settle; (b) live, as Radix leaves it (K-0247) and as APG's plain sentence reads (K-0252): the panel closes while the action runs on, and the failure has nowhere to show; (c) Escape aborts, which needs an `AbortSignal` in `onConfirm` and a server that can stop; Untitled's switch shows the choice exists (K-0237). Default: (a), which is `confirm-pending-1`.
5. Focus after a failed confirm. No source read states it, nor whether a failed server action is an input error (K-0257, K-0259). Options: (a) stays on the confirm: no move to cut across the role alert (K-0115), and the retry is one key away, under a button the person already chose; (b) moves to the cancel, the least destructive action (K-0252), safer against a repeated Enter on a delete and a focus move that may talk over the alert; (c) moves to the message with `tabindex="-1"`, which reads it twice with its role alert. Default: (a), which is `confirm-failure-1`.
6. Focus after a confirmed delete, when the trigger may be gone. Radix's trigger call does nothing then, and focus falls to the page (K-0249). Options: (a) the caller names the target through `returnFocus`, since only it knows the next logical place (K-0252, K-0258); (b) a fallback the pattern picks, such as the first focusable element in a landmark, which can land anywhere; (c) leave it to the browser, which loses the person's place. Default: (a), which is `confirm-return-1`, with the bound stated there.
7. Whether `aria-busy` on the panel defers the loading Button's status line. K-0113 says assistive technologies may wait or ignore changes while it is true, and K-0259 left it untested. It is worse than the panel alone: the status line sits inside the Button, which has its own `aria-busy`, and it unmounts when pending ends, so by the reading ORV-217 takes (`aria-busy` defers until it clears) it may never be read, while SC 4.1.3 names the waiting state (K-0115). Options: (a) keep Dialog's behaviour and record the risk: no code, nothing proved; (b) for a confirm, take `aria-busy` off the panel and add one status line under no `aria-busy`, at the cost of one line in `Dialog.tsx` and a possible double reading; (c) drop `aria-busy` from `pending` and from loading everywhere: the same fix for every caller, but it changes `Sheet`, `Button` and their plays, which is not this story. Default: (b), which is `confirm-status-1`.
8. Who owns pending and failure. Options: (a) the pattern, from the promise `onConfirm` returns: one owner (K-0259, Add row), and no caller can repeat `ArchiveDialog`'s gap; a static pending or failed story needs a play to reach it; (b) `pending` and `error` as props the caller sets, as Dialog has: simple stories, and each caller writes the same state and can leave the failure out, since no outside dialog read has either prop to copy (K-0248, K-0259). Default: (a), which is `confirm-api-1` and `confirm-outcome-1`.
9. Two details of the controls. The close control: keep it, since Dialog renders it and APG wants a visible way to close in the Tab sequence (K-0252), or take it off as shadcn does (K-0243), which needs a new Dialog prop. The cancel during pending: `disabled`, as `workspace.tsx` does, skipped by FocusScope (K-0249), or `aria-disabled`, which stays in the Tab sequence as in APG's example (K-0253), though that sentence does not speak of a pending state. Default: keep the close control, and `disabled`, because focus is already on the confirm (`confirm-pending-1`).
10. Whether the panel lists the changes when accepting. Options: (a) no: `impact` is one or two sentences; (b) a `children` body with the list, which brings the static first focus of open question 3 and leaves `aria-describedby` a poor fit for structured content (K-0252). Default: (a), which is `confirm-impact-1`; a long review belongs on a page or a Sheet.
11. PR size. Options: (a) one PR at the estimate of "Rows per PR", most of it stories; (b) two vertical PRs, the first with open, cancel, pending and done, the second with failure, `returnFocus` and the English states, at the cost of a catalog entry that promises less for a while and a second review round. Default: (a), since the component is about 130 lines and the recipe block 53, and the owner's lean rule favours one review (ORV-146).

## Depends on

- `docs/specs/ORV-226/design.md` v1.0 (the answers, rows D1 to D31, "The recipe block", A1 to A12, "Bounds").
- `docs/knowledge/design/K-0237` to `K-0259` (benchmark, standards and the synthesis, 2026-11-06); K-0113 and K-0115 (`aria-busy`, status messages).
- `docs/specs/ORV-64/audit.md` section B (table form), section D.3 row 23 (the story and its done-when), section A.2 (the line reported under Out of scope).
- `DESIGN.md` section 6 (the pattern), 7 (states), 9 item 11 (fake evidence), 10 (writing), 11 (design gate).
- `.claude/rules/design-system.md` ("Components": benchmark table, Thai and English stories, Recipes and modes, sign-off) and `.claude/rules/testing.md` (visual checks).
- `packages/design-system/src/components/dialog/Dialog.tsx`, `button/Button.tsx`, `src/recipes/recipes.css`, `src/testing/visual-asserts.ts`, whose `expectFrameCutsNoInk` came to develop through PR 186 (ORV-222), so the build needs that head.
- ORV-137 comment 10247 (the benchmark table in POC mode); ORV-138 `qa-scope-1` and `qa-scope-2` (the Rows per PR and Rows that render nothing forms); ORV-146 (one review round); ORV-217 (the reading of `aria-busy` in its Standards row, the spec shape); ORV-234 comment 10539 (the helper's 0 px reading, row 20).
- ADR 0003 (Storybook and catalog, no shadcn classes), ADR 0012 (gates).

## Changelog

- v1.0 (2026-11-06): first version, from K-0237 to K-0259 and audit D.3 row 23, with a read of the installed Radix builds. Downstream to review: the designer envelope (`design.md`, open questions 1 to 11, row 26), the builder envelope (rows 1 to 27, the one line in `Dialog.tsx`, `DESIGN.md` line 178, `dialog.yaml`), the qa envelope (the Rows per PR line once the PR exists), `catalog/coverage.md`, and `docs/specs/ORV-64/audit.md` A.2 (reported, not edited here).
- v1.1 (2026-11-06): takes in A1 to A12 of `design.md` v1.0, with the designer's answers to open questions 2, 3, 5 and 9 at the top of "Open questions" and rows 28 to 30 added; rows 1 to 27 keep their numbers. `recipes.css` moves to changed; A2 is marked as unrun browser knowledge and row 7 names `PressFocus`. Row 20 differs from A5: it proves ink with `expectFrameCutsNoInk` in place of the glyph box helper A5 names, and its walk runs on past the panel to the frame. A10's `usage` lines are `rules` lines, since no catalog entry has a `usage` key. Row 26 posts its PNG paths as a Jira comment. W7 to W9 added; the PR estimate is now about 700 lines. Downstream to review: `design.md` (A5, A10, D19, D26 and the `spec:` line), the builder envelope (rows 2, 7, 9, 11, 14, 20, 25, 26, 28 to 30, the recipe block, the head with PR 186), the qa envelope (rows 1 to 30, the Rows per PR line once the PR exists), the designer sign-off (row 26), and `catalog/application/confirm-dialog.yaml`.
- v1.2 (2026-11-06): records the deviations of ORV-226-build-1, with no new requirement. Row 20 no longer runs `expectLinesClear` on the failure line and says why, and "Out of scope" sends that line to a follow-up. Rows 20 and 29 name `expectNoInkCut`, the story-local wrapper around `expectFrameCutsNoInk`, and why. The Copy table's keys and rows 11, 14, 16 and 28 take the built `th` and `en` shape of `confirmFixtures`; the wording does not change. "Rows per PR" names PR 193. "Depends on" adds ORV-234 comment 10539. AC row numbers are unchanged. Downstream to review: `design.md` (A5 and the `spec:` line), the comment above the row 20 ink checks in `ConfirmDialog.stories.tsx`, the qa envelope (rows 20 and 29, and the PR 193 line), and the follow-up card for the failure line.
- v1.3 (2026-11-06): by the main session, from findings F2, F3 and F4 of ORV-226-signoff-1. A story meant to show pending must land on it, so `Pending` and `AcceptPending` end with the promise held and the check after the promise settles moves to `Failed` and `AcceptFailed` (rows 8, 9). `ShapeHolds` ends with every panel open and row 30 no longer counts two frames, as the build has three. Row 26 adds `MissingValueEn`, the English twin the rule asks for. Downstream to review: the builder envelope, the qa envelope (rows 8, 9, 26, 30).
