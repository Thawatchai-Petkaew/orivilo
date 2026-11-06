import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type ReactNode } from "react";
import { expect, fn, spyOn, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  cssColorToHex,
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectLinesClear,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { confirmFixtures, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import {
  ConfirmDialog,
  type ConfirmCloseOutcome,
  type ConfirmDialogProps,
  type ConfirmResult,
} from "./ConfirmDialog";

const body = () => within(document.body);
const rect = (el: Element) => el.getBoundingClientRect();

type Kind = "delete" | "accept";
type Lang = "th" | "en";

/** The props of a story for one kind and language, from the MOCK fixtures. */
function copyFor(kind: Kind, lang: Lang = "th") {
  const c = confirmFixtures[lang][kind];
  return {
    variant: kind === "delete" ? "destructive" : "default",
    title: c.title,
    impact: c.impact,
    confirmLabel: c.confirm,
    cancelLabel: c.cancel,
    pendingLabel: c.pending,
  } as const satisfies Partial<ConfirmDialogProps>;
}

const triggerOf = (kind: Kind, lang: Lang = "th") => (
  <Button variant="secondary">{confirmFixtures[lang][kind].confirm}</Button>
);

/**
 * A promise the play settles, so no play waits on a timer. `onConfirm` is a spy that returns a
 * promise held until `settle` or `fail`; `reset` forgets the calls of an earlier run.
 */
function gate() {
  type Held = { resolve: (result: ConfirmResult) => void; reject: (error: unknown) => void };
  let waiting: Held[] = [];
  const onConfirm = fn(
    () =>
      new Promise<ConfirmResult>((resolve, reject) => {
        waiting.push({ resolve, reject });
      }),
  );
  return {
    onConfirm,
    /** How many presses wait for an answer: a story that lands on pending leaves them all waiting. */
    held: () => waiting.length,
    settle: (result: ConfirmResult) => waiting.shift()?.resolve(result),
    fail: (error: unknown) => waiting.shift()?.reject(error),
    reset: () => {
      waiting = [];
      onConfirm.mockClear();
    },
  };
}

const held = gate();

const failed = (kind: Kind): ConfirmResult => ({
  status: "failed",
  message: confirmFixtures.th[kind].failed,
});

/** The parts of an open panel. The footer buttons carry `data-confirm-part`. */
function partsOf(panel: HTMLElement) {
  const q = (selector: string) => {
    const el = panel.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`the panel has no ${selector}`);
    return el;
  };
  return {
    title: q(".ds-dialog__title"),
    impact: q(".ds-dialog__description"),
    footer: q(".ds-dialog__footer"),
    close: q(".ds-dialog__close"),
    cancel: q('[data-confirm-part="cancel"]'),
    confirm: q('[data-confirm-part="confirm"]'),
    status: q('.ds-dialog__footer > [role="status"]'),
  };
}

/** The panel scales in; measure once its animations have finished. */
async function settled<T extends HTMLElement>(panel: T): Promise<T> {
  await Promise.all(panel.getAnimations().map((a) => a.finished));
  return panel;
}

/** True when `focus` was called on `el` with `preventScroll: true`: a panel that scrolls must open at its title (A4). */
const focusedWithoutScroll = (
  spy: { mock: { calls: unknown[][]; contexts: unknown[] } },
  el: Element,
) =>
  spy.mock.calls.some(
    (args, i) =>
      spy.mock.contexts[i] === el && (args[0] as FocusOptions | undefined)?.preventScroll === true,
  );

const openPanel = async (root: ReturnType<typeof within> = body()): Promise<HTMLElement> =>
  settled(await root.findByRole("alertdialog"));

/**
 * A frame the panel mounts into through `container`. `contain: layout` makes it the containing
 * block of the fixed scrim and panel, so a story can show a phone or a matrix cell.
 */
function Frame({
  className,
  children,
}: {
  className: string;
  children: (container: HTMLElement) => ReactNode;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setNode}
      data-frame=""
      className={`relative isolate shrink-0 overflow-hidden rounded-container bg-surface-canvas [contain:layout] ${className}`}
    >
      {node ? children(node) : null}
    </div>
  );
}

/** An open, non-modal panel in a frame of the given size classes. */
function Framed({
  className,
  ...props
}: { className: string } & Omit<ConfirmDialogProps, "container" | "modal" | "defaultOpen">) {
  return (
    <Frame className={className}>
      {(container) => <ConfirmDialog {...props} defaultOpen modal={false} container={container} />}
    </Frame>
  );
}

/** Frames wider than the story viewport sit in a box that holds them and 8 px around them, for the ink shots. */
function Frames({ children }: { children: ReactNode }) {
  return <div className="flex w-max flex-col gap-4 p-2">{children}</div>;
}

const meta = {
  title: "Application/Confirm dialog",
  component: ConfirmDialog,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Confirms a step that deletes something or takes on proposed changes (ORV-226). It runs the flow: an alertdialog with the impact in plain words, first focus by variant, no close on an outside press, pending while the action runs, the failure above the actions with the same button as the retry, and a close only when the action reports done. It never shows a success state. The project, the three changes and the failures in these stories are mock: nothing is deleted, accepted or proposed by a model or a rule, and no server answers.",
      },
    },
  },
  args: {
    ...copyFor("delete"),
    trigger: triggerOf("delete"),
    onConfirm: fn(async (): Promise<ConfirmResult> => ({ status: "done" })),
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed: only the trigger, named after the outcome (AC 1). */
export const Closed: Story = {
  play: async ({ canvasElement, args }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: confirmFixtures.th.delete.confirm }),
    ).toBeVisible();
    await expect(body().queryByRole("alertdialog")).toBeNull();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/**
 * Destructive: a danger glyph on its own row before the title, the impact under it, the ghost
 * cancel and the destructive confirm. One start edge for glyph, title and impact; the actions sit
 * under the text; first focus is the cancel and Tab runs cancel, confirm, close, cancel (AC 2, 3).
 */
export const Destructive: Story = {
  play: async ({ canvasElement, args }) => {
    const copy = confirmFixtures.th.delete;
    await userEvent.tab();
    const trigger = within(canvasElement).getByRole("button", { name: copy.confirm });
    await expect(trigger).toHaveFocus();
    const focus = spyOn(HTMLElement.prototype, "focus");
    await userEvent.keyboard("{Enter}");
    const panel = await body().findByRole("alertdialog", { name: copy.title });
    await settled(panel);
    await expect(focusedWithoutScroll(focus, partsOf(panel).cancel)).toBe(true);
    focus.mockRestore();
    await expect(panel).toHaveAccessibleDescription(copy.impact);
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(body().queryByRole("dialog")).toBeNull();
    await expect(panel).toHaveAttribute("data-variant", "destructive");
    await expect(args.onConfirm).not.toHaveBeenCalled();
    const { title, impact, footer, close, cancel, confirm } = partsOf(panel);
    await expect(within(panel).getByRole("button", { name: copy.cancel })).toBe(cancel);
    await expect(within(panel).getByRole("button", { name: "ปิด" })).toBe(close);
    const glyph = panel.querySelector(".ds-dialog__glyph");
    if (!glyph) throw new Error("the destructive panel has no glyph");
    const left = rect(title).left;
    await expect(Math.abs(rect(glyph).left - left)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(rect(impact).left - left)).toBeLessThanOrEqual(0.5);
    const centre = (el: Element) => rect(el).top + rect(el).height / 2;
    await expect(Math.abs(centre(glyph) - centre(close))).toBeLessThanOrEqual(0.5);
    // The sticky padding fault of the recipe: the footer pushed up over the impact's last line.
    await expect(rect(footer).top).toBeGreaterThanOrEqual(rect(impact).bottom);
    // D4 at rest: 16 from the text to the buttons, and the footer ends flush with the panel's border,
    // so its own padding is the only room under the buttons.
    await expect(Math.abs(rect(cancel).top - rect(impact).bottom - 16)).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs(
        rect(panel).bottom -
          rect(footer).bottom -
          parseFloat(getComputedStyle(panel).borderBottomWidth),
      ),
    ).toBeLessThanOrEqual(0.5);
    // First focus is the cancel, drawn as a line and halo (AC 3), and Tab wraps through the three.
    await waitFor(() => expect(cancel).toHaveFocus());
    await expect(cancel.matches(":focus-visible")).toBe(true);
    for (const next of [confirm, close, cancel]) {
      await userEvent.tab();
      await expect(next).toHaveFocus();
    }
  },
};

/** Accept: no glyph; first focus is the confirm although the cancel comes first in the DOM (AC 4). */
export const Accept: Story = {
  args: { ...copyFor("accept"), trigger: triggerOf("accept") },
  play: async ({ canvasElement, args }) => {
    const copy = confirmFixtures.th.accept;
    await userEvent.tab();
    await expect(within(canvasElement).getByRole("button", { name: copy.confirm })).toHaveFocus();
    const focus = spyOn(HTMLElement.prototype, "focus");
    await userEvent.keyboard("{Enter}");
    const panel = await body().findByRole("alertdialog", { name: copy.title });
    await settled(panel);
    await expect(focusedWithoutScroll(focus, partsOf(panel).confirm)).toBe(true);
    focus.mockRestore();
    await expect(panel).toHaveAttribute("data-variant", "default");
    await expect(panel.querySelector(".ds-dialog__glyph")).toBeNull();
    const { cancel, confirm } = partsOf(panel);
    await waitFor(() => expect(confirm).toHaveFocus());
    await expect(confirm.matches(":focus-visible")).toBe(true);
    await expect(
      cancel.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/**
 * What `returnFocus` gives back in each round of `Dismiss`: a detached element, then null, then
 * nothing. None of them takes focus, so Radix's own return to the trigger stands.
 */
let dismissRound = 0;
const dismissReturn = fn((outcome: ConfirmCloseOutcome): HTMLElement | null | undefined => {
  void outcome;
  return [document.createElement("button"), null, undefined][dismissRound++];
});

/**
 * Dismiss: the cancel, Escape and the close control each close the panel, call no `onConfirm` and
 * return focus to the trigger; a press on the scrim closes nothing (AC 5, 6).
 */
export const Dismiss: Story = {
  args: { returnFocus: dismissReturn },
  play: async ({ canvasElement, args }) => {
    dismissRound = 0;
    dismissReturn.mockClear();
    const copy = confirmFixtures.th.delete;
    const trigger = within(canvasElement).getByRole("button", { name: copy.confirm });
    const leave: Array<(panel: HTMLElement) => Promise<void>> = [
      async (panel) => void (await userEvent.click(partsOf(panel).cancel)),
      async () => void (await userEvent.keyboard("{Escape}")),
      async (panel) => void (await userEvent.click(partsOf(panel).close)),
    ];
    for (const close of leave) {
      await userEvent.click(trigger);
      const panel = await openPanel();
      await close(panel);
      await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
      await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
      await expect(args.onConfirm).not.toHaveBeenCalled();
      await waitFor(() => expect(trigger).toHaveFocus());
    }
    // Row 6: a press outside, on the scrim, closes nothing.
    await userEvent.click(trigger);
    const panel = await openPanel();
    const scrim = document.querySelector(".ds-dialog__scrim");
    if (!scrim) throw new Error("no scrim");
    (args.onOpenChange as ReturnType<typeof fn>).mockClear();
    await userEvent.click(scrim);
    await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
    await expect(body().getByRole("alertdialog")).toBe(panel);
    await expect(dismissReturn).toHaveBeenCalledTimes(3);
    for (const [outcome] of dismissReturn.mock.calls) await expect(outcome).toBe("cancelled");
  },
};

/** Measures the panel and footer, so a press can be shown to change neither. */
const sizesOf = (panel: HTMLElement) => ({
  panel: rect(panel).height,
  footer: rect(partsOf(panel).footer).height,
});

/**
 * The trigger behind an open panel is named after the outcome of the same kind (accept words behind
 * an accept panel, never "delete" behind it). The modal hides it from the tree, so `hidden` reads it.
 */
async function expectTriggerNamed(canvasElement: HTMLElement, name: string) {
  await expect(
    within(canvasElement).getByRole("button", { name, hidden: true }),
  ).toBeInTheDocument();
}

/** The status line outside every button and every `aria-busy` (AC 8). */
async function expectStatus(panel: HTMLElement, text: string) {
  const { status } = partsOf(panel);
  await expect(status).toHaveTextContent(text);
  await expect(status.closest('[aria-busy="true"]')).toBeNull();
  await expect(panel).not.toHaveAttribute("aria-busy", "true");
}

/**
 * Pending: a second press, Escape, the scrim and Tab change nothing while the action runs. The
 * spinner joins the kept label, the cancel and the close control are disabled, focus stays on the
 * confirm, and neither the panel nor the footer changes size (AC 7, 8).
 */
export const Pending: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async ({ args }) => {
    held.reset();
    const copy = confirmFixtures.th.delete;
    const panel = await openPanel();
    const { cancel, confirm, close, status } = partsOf(panel);
    const before = sizesOf(panel);
    await expect(status).toBeEmptyDOMElement();
    await userEvent.click(confirm);
    await userEvent.click(confirm);
    await userEvent.keyboard("{Escape}");
    const scrim = document.querySelector(".ds-dialog__scrim");
    if (!scrim) throw new Error("no scrim");
    await userEvent.click(scrim);
    await userEvent.tab();
    await expect(held.onConfirm).toHaveBeenCalledTimes(1);
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await expect(confirm).toHaveAttribute("aria-busy", "true");
    await expect(confirm).toHaveFocus();
    await expect(confirm).toHaveTextContent(copy.confirm);
    await expect(cancel).toBeDisabled();
    await expect(close).toBeDisabled();
    await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
    await expect(body().getByRole("alertdialog")).toBe(panel);
    await expect(sizesOf(panel)).toEqual(before);
    expectSameHeight(cancel, confirm);
    await expectStatus(panel, copy.pending);
    // The promise stays held: the spinner is what the story shows when it is opened. `Failed` checks
    // the status line after the promise settles.
    await expect(held.held()).toBe(1);
  },
};

/**
 * Pending after a press that moves no focus, as a browser that does not focus a clicked button
 * would: first focus is the cancel and `click()` leaves it there, so the pattern's own focus call
 * is what keeps focus on the confirm once the cancel is disabled (AC 7, A2). Proved in Chromium
 * only; it says nothing about how Safari or Firefox behave.
 */
export const PressFocus: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async () => {
    held.reset();
    const panel = await openPanel();
    const { cancel, confirm } = partsOf(panel);
    await waitFor(() => expect(cancel).toHaveFocus());
    const focus = spyOn(HTMLElement.prototype, "focus");
    confirm.click();
    await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
    await expect(confirm).toHaveFocus();
    await expect(focusedWithoutScroll(focus, confirm)).toBe(true);
    focus.mockRestore();
    held.settle(failed("delete"));
  },
};

/** Accept, pending: as `Pending`, with the accept words (AC 9). */
export const AcceptPending: Story = {
  args: {
    ...copyFor("accept"),
    trigger: triggerOf("accept"),
    defaultOpen: true,
    onConfirm: held.onConfirm,
  },
  play: async ({ canvasElement, args }) => {
    held.reset();
    const copy = confirmFixtures.th.accept;
    const panel = await openPanel();
    await expectTriggerNamed(canvasElement, copy.confirm);
    const { cancel, confirm, close, status } = partsOf(panel);
    const before = sizesOf(panel);
    await expect(status).toBeEmptyDOMElement();
    await userEvent.click(confirm);
    await userEvent.click(confirm);
    await userEvent.keyboard("{Escape}");
    await expect(held.onConfirm).toHaveBeenCalledTimes(1);
    await expect(confirm).toHaveAttribute("aria-disabled", "true");
    await expect(confirm).toHaveAttribute("aria-busy", "true");
    await expect(confirm).toHaveFocus();
    await expect(cancel).toBeDisabled();
    await expect(close).toBeDisabled();
    await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
    await expect(sizesOf(panel)).toEqual(before);
    expectSameHeight(cancel, confirm);
    await expectStatus(panel, copy.pending);
    // The promise stays held, as in `Pending`; `AcceptFailed` checks the status line after it settles.
    await expect(held.held()).toBe(1);
  },
};

/**
 * Done: the panel closes when the action reports done, focus returns to the trigger, and nothing
 * on the page says it worked (AC 10).
 */
export const Done: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async ({ canvasElement, args }) => {
    held.reset();
    const copy = confirmFixtures.th.delete;
    const panel = await openPanel();
    const text = canvasElement.textContent;
    await userEvent.click(partsOf(panel).confirm);
    await waitFor(() => expect(partsOf(panel).confirm).toHaveAttribute("aria-busy", "true"));
    await expect(body().getByRole("alertdialog")).toBe(panel);
    await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
    held.settle({ status: "done" });
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(document.querySelector('[role="alert"]')).toBeNull();
    await expect(canvasElement.textContent).toBe(text);
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: copy.confirm })).toHaveFocus(),
    );
  },
};

/** Presses the confirm and fails it with `result`; returns the panel with its message shown. */
async function pressAndFail(kind: Kind, result: ConfirmResult) {
  const panel = await openPanel();
  const { confirm } = partsOf(panel);
  await userEvent.click(confirm);
  await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
  held.settle(result);
  await within(panel).findByRole("alert");
  await waitFor(() => expect(confirm).not.toHaveAttribute("aria-disabled"));
  await expect(confirm).toHaveTextContent(confirmFixtures.th[kind].confirm);
  return panel;
}

/** What a failed panel shows and keeps (AC 11, 14). */
async function expectFailed(panel: HTMLElement, text: string, args: { onOpenChange?: unknown }) {
  const { footer, cancel, confirm, close } = partsOf(panel);
  const alert = within(panel).getByRole("alert");
  await expect(alert).toHaveTextContent(text);
  // The footer's top includes its 16 of padding; the message ends above it (A8).
  await expect(rect(alert).bottom).toBeLessThanOrEqual(rect(footer).top + 0.5);
  await expect(cssColorToHex(getComputedStyle(alert).color)).toBe(
    cssColorToHex(resolvedColor(panel, "--cmp-dialog-error")),
  );
  await expect(confirm).toHaveFocus();
  await expect(confirm).not.toHaveAttribute("aria-disabled");
  await expect(cancel).toBeEnabled();
  await expect(close).toBeEnabled();
  await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
}

/**
 * Failed: the message sits above the actions in the danger colour, the spinner is gone and the
 * confirm keeps focus and its name, so a press of it is the retry (AC 11).
 */
export const Failed: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async ({ args }) => {
    held.reset();
    const panel = await pressAndFail("delete", failed("delete"));
    await expectFailed(panel, confirmFixtures.th.delete.failed, args);
    // Row 8: once the promise settles the status line is empty again.
    await waitFor(() => expect(partsOf(panel).status).toBeEmptyDOMElement());
  },
};

/** Retry: a new press takes the message away at once, then the panel closes on done (AC 12). */
export const Retry: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async ({ args }) => {
    held.reset();
    const panel = await pressAndFail("delete", failed("delete"));
    await userEvent.click(partsOf(panel).confirm);
    await waitFor(() => expect(within(panel).queryByRole("alert")).toBeNull());
    await expect(held.onConfirm).toHaveBeenCalledTimes(2);
    held.settle({ status: "done" });
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};

const afterFailure = fn((outcome: ConfirmCloseOutcome): HTMLElement | null => {
  void outcome;
  return null;
});

/** The message goes with the panel: after Escape and a reopen there is none, and first focus is the cancel (AC 13). */
export const FailureClears: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm, returnFocus: afterFailure },
  play: async ({ canvasElement }) => {
    held.reset();
    afterFailure.mockClear();
    await pressAndFail("delete", failed("delete"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
    // A press that failed no longer counts: the person left, so the outcome is `cancelled`.
    await waitFor(() => expect(afterFailure).toHaveBeenCalledTimes(1));
    await expect(afterFailure).toHaveBeenCalledWith("cancelled");
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: confirmFixtures.th.delete.confirm }),
    );
    const panel = await openPanel();
    await expect(within(panel).queryByRole("alert")).toBeNull();
    await waitFor(() => expect(partsOf(panel).cancel).toHaveFocus());
  },
};

/** Accept, failed: as `Failed`, with the accept words (AC 14). */
export const AcceptFailed: Story = {
  args: {
    ...copyFor("accept"),
    trigger: triggerOf("accept"),
    defaultOpen: true,
    onConfirm: held.onConfirm,
  },
  play: async ({ canvasElement, args }) => {
    held.reset();
    const panel = await pressAndFail("accept", failed("accept"));
    await expectTriggerNamed(canvasElement, confirmFixtures.th.accept.confirm);
    await expectFailed(panel, confirmFixtures.th.accept.failed, args);
    // Row 9: once the promise settles the status line is empty again.
    await waitFor(() => expect(partsOf(panel).status).toBeEmptyDOMElement());
  },
};

/** A rejection shows the catalog's own words, never the thrown text (AC 15). */
export const ThrownFailure: Story = {
  args: { defaultOpen: true, onConfirm: held.onConfirm },
  play: async ({ args }) => {
    held.reset();
    const panel = await openPanel();
    const { confirm } = partsOf(panel);
    await userEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
    held.fail(new Error("secret-internal"));
    const alert = await within(panel).findByRole("alert");
    await expect(alert).toHaveTextContent(
      "ทำรายการนี้ไม่สำเร็จ ลองอีกครั้ง หรือปิดหน้าต่างนี้แล้วกลับมาทำภายหลัง",
    );
    await expect(document.body.textContent).not.toContain("secret-internal");
    await expect(body().getByRole("alertdialog")).toBe(panel);
    await expect(args.onOpenChange).not.toHaveBeenCalledWith(false);
  },
};

const returnToNext = fn((outcome: ConfirmCloseOutcome): HTMLElement | null => {
  void outcome;
  return null;
});

/**
 * A list of rows, each with its own confirm. When a delete is done the row goes with its trigger,
 * so `returnFocus` names the next row's trigger and focus lands there, not on the page (AC 16).
 */
function Rows() {
  const [names, setNames] = useState<readonly string[]>(confirmFixtures.th.rows);
  const items = useRef(new Map<string, HTMLLIElement>());
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {names.map((name, i) => (
        <li
          key={name}
          ref={(node) => {
            if (node) items.current.set(name, node);
            else items.current.delete(name);
          }}
          className="flex items-center gap-3"
        >
          <span>{name}</span>
          <ConfirmDialog
            {...copyFor("delete")}
            trigger={
              <Button variant="secondary">
                {confirmFixtures.th.rowTrigger.replace("{name}", name)}
              </Button>
            }
            onConfirm={async () => {
              const result = await held.onConfirm();
              if (result.status === "done") setNames((all) => all.filter((n) => n !== name));
              return result;
            }}
            returnFocus={(outcome) => {
              returnToNext(outcome);
              const next = names[i + 1];
              return next ? items.current.get(next)?.querySelector("button") : null;
            }}
          />
        </li>
      ))}
    </ul>
  );
}

export const DeleteRow: Story = {
  render: () => <Rows />,
  play: async ({ canvasElement }) => {
    held.reset();
    returnToNext.mockClear();
    const [, second, third] = confirmFixtures.th.rows;
    const canvas = within(canvasElement);
    const trigger = (name: string | undefined) =>
      canvas.getByRole("button", {
        name: confirmFixtures.th.rowTrigger.replace("{name}", name ?? ""),
      });
    await userEvent.click(trigger(second));
    const panel = await openPanel();
    await userEvent.click(partsOf(panel).confirm);
    await waitFor(() => expect(partsOf(panel).confirm).toHaveAttribute("aria-busy", "true"));
    held.settle({ status: "done" });
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    await waitFor(() => expect(trigger(third)).toHaveFocus());
    await expect(document.body).not.toHaveFocus();
    await expect(returnToNext).toHaveBeenCalledTimes(1);
    await expect(returnToNext).toHaveBeenCalledWith("confirmed");
  },
};

const returnToOpener = fn((outcome: ConfirmCloseOutcome): void => {
  void outcome;
});

function ControlledExample(props: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={opener}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {confirmFixtures.th.opener}
        </Button>
      </div>
      <ConfirmDialog
        {...props}
        trigger={undefined}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        returnFocus={(outcome) => {
          returnToOpener(outcome);
          return opener.current?.querySelector("button");
        }}
      />
    </>
  );
}

/** Controlled: no trigger, a menu item opens it, and `returnFocus` sends focus back to that item (AC 17). */
export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  play: async ({ canvasElement, args }) => {
    returnToOpener.mockClear();
    const opener = within(canvasElement).getByRole("button", {
      name: confirmFixtures.th.opener,
    });
    await userEvent.click(opener);
    await openPanel();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("alertdialog")).toBeNull());
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(returnToOpener).toHaveBeenCalledTimes(1);
    await expect(returnToOpener).toHaveBeenCalledWith("cancelled");
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** A missing impact shows the catalog's line where the impact goes, so the description is never blank (AC 18). */
export const MissingValue: Story = {
  args: { impact: fixtures.missing },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: confirmFixtures.th.delete.confirm }),
    );
    const panel = await openPanel();
    await expect(panel).toHaveAccessibleDescription(
      "ไม่มีข้อมูลว่าการกระทำนี้มีผลกับอะไร ตรวจสอบก่อนยืนยัน",
    );
  },
};

/** The English twin of `MissingValue`: the same state, the English line in the description (AC 18, 19). */
export const MissingValueEn: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  args: {
    ...copyFor("delete", "en"),
    trigger: triggerOf("delete", "en"),
    impact: fixtures.missing,
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: confirmFixtures.en.delete.confirm }),
    );
    const panel = await openPanel();
    await expect(panel).toHaveAccessibleDescription(
      "No details on what this affects. Check before you confirm",
    );
    await expect(panel.textContent).not.toMatch(/[฀-๿]/);
  },
};

const ENGLISH = [
  ["delete", "open"],
  ["delete", "pending"],
  ["delete", "failed"],
  ["accept", "open"],
  ["accept", "pending"],
  ["accept", "failed"],
] as const;

/** English: one closed trigger, then both variants open, pending and failed, in six frames (AC 19). */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex flex-col gap-4">
      <ConfirmDialog
        {...copyFor("delete", "en")}
        trigger={triggerOf("delete", "en")}
        onConfirm={async () => ({ status: "done" })}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {ENGLISH.map(([kind, state]) => (
          <Framed
            key={`${kind}-${state}`}
            className="h-96"
            {...copyFor(kind, "en")}
            onConfirm={
              state === "pending"
                ? () => new Promise<ConfirmResult>(() => undefined)
                : async () => ({ status: "failed", message: confirmFixtures.en[kind].failed })
            }
          />
        ))}
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Delete project", expanded: false }),
    ).toBeVisible();
    const panels = await canvas.findAllByRole("alertdialog");
    await expect(panels).toHaveLength(6);
    await Promise.all(panels.map((panel) => settled(panel)));
    for (const [i, panel] of panels.entries()) {
      const [kind, state] = ENGLISH[i] ?? ENGLISH[0];
      if (state !== "open") await userEvent.click(partsOf(panel).confirm);
      await expect(panel).toHaveAccessibleName(confirmFixtures.en[kind].title);
      await expect(within(panel).getByText(confirmFixtures.en[kind].cancel)).toBeVisible();
    }
    await waitFor(() => expect(canvas.getAllByRole("alert")).toHaveLength(2));
    const lines = panels.map((panel) => partsOf(panel).status.textContent).filter(Boolean);
    await expect(lines).toEqual(["Deleting project", "Accepting changes"]);
    await expect(canvas.getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
      confirmFixtures.en.delete.failed,
      confirmFixtures.en.accept.failed,
    ]);
    for (const frame of canvasElement.querySelectorAll("[data-frame]")) {
      await expect(frame.textContent).not.toMatch(/[฀-๿]/);
    }
  },
};

/** The ancestors of `el`, up to but not including `frame`, clip nothing: the panel is the one scroller on purpose (A5). */
async function expectNoClipUpTo(el: Element, frame: Element, panel: Element) {
  for (let node = el.parentElement; node && node !== frame; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node === panel) continue;
    await expect(
      [style.overflowX, style.overflowY],
      `<${node.localName}.${String(node.className)}> clips`,
    ).toEqual(["visible", "visible"]);
  }
}

/**
 * `expectFrameCutsNoInk` forces `overflow: visible` on the panel, and the panel is the scroller the
 * sticky footer pins to. Without it the footer pins to the frame instead, measured from the
 * panel's untransformed box, which reaches 33.5 px past a 560 px frame, so the whole footer moves
 * up 32.5 px in the second shot and the helper reads that move as cut ink. At rest the panel does
 * not scroll and the sticky footer sits where a static one does, so the probe holds the footer
 * static in both shots and puts it back after.
 */
async function expectNoInkCut(el: HTMLElement, frame: HTMLElement, panel: HTMLElement) {
  const { footer } = partsOf(panel);
  footer.style.position = "static";
  try {
    await expectFrameCutsNoInk(el, frame);
  } finally {
    footer.style.position = "";
  }
}

const LONG_IMPACT = `${fixtures.longThai} ${fixtures.longLatin}`;

/**
 * 360 px with long Thai content, failed: the panel fills the frame less the gutter, the title,
 * impact and failure wrap inside it with no mark cut, both actions show full width, the cancel
 * above the confirm, and nothing scrolls sideways (AC 20).
 */
export const LongContentAt360: Story = {
  render: () => (
    <Frames>
      <Framed
        className="h-[560px] w-[360px]"
        {...copyFor("delete")}
        title={fixtures.longThai}
        impact={LONG_IMPACT}
        onConfirm={held.onConfirm}
      />
    </Frames>
  ),
  play: async ({ canvasElement }) => {
    held.reset();
    const frame = canvasElement.querySelector<HTMLElement>("[data-frame]");
    if (!frame) throw new Error("no frame");
    const panel = await openPanel(within(frame));
    const { title, impact, cancel, confirm } = partsOf(panel);
    await userEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
    held.settle({ status: "failed", message: fixtures.longThai });
    const alert = await within(panel).findByRole("alert");
    await waitFor(() => expect(confirm).not.toHaveAttribute("aria-disabled"));
    await expect(Math.abs(rect(panel).width - 328)).toBeLessThanOrEqual(0.5);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const f = rect(frame);
    const p = rect(panel);
    await expect(p.left).toBeGreaterThanOrEqual(f.left);
    await expect(p.right).toBeLessThanOrEqual(f.right);
    await expect(p.top).toBeGreaterThanOrEqual(f.top);
    await expect(p.bottom).toBeLessThanOrEqual(f.bottom);
    for (const el of [title, impact, alert]) await expectNoClipUpTo(el, frame, panel);
    await expect(getComputedStyle(panel).overflowY).toBe("auto");
    await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);
    await expect(Math.abs(rect(cancel).width - 278)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(rect(confirm).width - 278)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(rect(confirm).top - rect(cancel).bottom - 8)).toBeLessThanOrEqual(0.5);
    await expect(Math.abs(rect(confirm).left - rect(cancel).left)).toBeLessThanOrEqual(0.5);
    if (inVitest) {
      // Not the failure line: `expectLinesClear` reads the Thai stacks of `.ds-dialog__error` (14 / 1.7)
      // as 0 px apart, but the designer's ink probe (ORV-226-signoff-1, DPR 1, 2 and 4) found at least
      // 5.5 px clear between its two lines. The touch is a reading of the helper, not shown in ink,
      // so the line is left out here and not claimed as a defect.
      for (const el of [title, impact]) await expectLinesClear(el);
      for (const el of [cancel, confirm]) await expectLabelInkWhole(el);
      for (const el of [title, impact, alert, cancel, confirm]) {
        await expectNoInkCut(el, frame, panel);
      }
    }
  },
};

/** The content is rendered in a portal and still carries the trigger's profile and mode (AC 21). */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="professional" mode="light">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <ConfirmDialog {...args} />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: confirmFixtures.th.delete.confirm,
    });
    await userEvent.click(trigger);
    const panel = await openPanel();
    const scope = panel.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(panel)).toBe(read(trigger));
  },
};

/**
 * Six boundaries at once; each panel is non-modal, mounted in its own cell and failed, so every
 * slot shows. Contrast of the declared pairs is proven by `recipes.test.ts` and `pnpm contrast`
 * (AC 22).
 */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Framed
        className="h-96"
        {...copyFor("delete")}
        trigger={undefined}
        onConfirm={async () => failed("delete")}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const panels = await within(canvasElement).findAllByRole("alertdialog");
    await expect(panels).toHaveLength(6);
    for (const panel of panels) {
      await settled(panel);
      await expect(panel).not.toHaveAttribute("aria-modal");
      await userEvent.click(partsOf(panel).confirm);
    }
    await waitFor(() => expect(within(canvasElement).getAllByRole("alert")).toHaveLength(6));
  },
};

/** Sets the viewport-bound window from `scrollHeight` / `clientHeight` readings. */
const overflows = (panel: HTMLElement) => panel.scrollHeight > panel.clientHeight;

/**
 * A short window (640 by 360) with long content: the panel opens at its title, the text scrolls
 * under the actions, which stay in reach, and after a failure the message is whole above them
 * (AC 28). No ink helper here: at this size the panel cuts text on purpose.
 */
export const ShortPanel: Story = {
  render: () => (
    <Frames>
      <Framed
        className="h-[360px] w-[640px]"
        {...copyFor("delete")}
        title={fixtures.longThai}
        impact={LONG_IMPACT}
        onConfirm={held.onConfirm}
      />
    </Frames>
  ),
  play: async ({ canvasElement }) => {
    held.reset();
    const frame = canvasElement.querySelector<HTMLElement>("[data-frame]");
    if (!frame) throw new Error("no frame");
    const panel = await openPanel(within(frame));
    const { footer, cancel, confirm } = partsOf(panel);
    const inside = async () => {
      await expect(rect(footer).top).toBeGreaterThanOrEqual(rect(panel).top);
      await expect(rect(footer).bottom).toBeLessThanOrEqual(rect(panel).bottom + 0.5);
      await expect(rect(footer).bottom).toBeLessThanOrEqual(rect(frame).bottom + 0.5);
      await expect(rect(footer).top).toBeGreaterThanOrEqual(rect(frame).top);
    };
    await expect(overflows(panel)).toBe(true);
    await waitFor(() => expect(cancel).toHaveFocus());
    await expect(panel.scrollTop).toBe(0);
    await inside();
    if (inVitest) {
      const { userEvent: real } = await import("vitest/browser");
      await real.keyboard("{ArrowDown}");
      await waitFor(() => expect(panel.scrollTop).toBeGreaterThan(0));
      await expect(cancel).toHaveFocus();
      await inside();
    }
    await userEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
    held.settle(failed("delete"));
    const alert = await within(panel).findByRole("alert");
    await waitFor(() => expect(confirm).not.toHaveAttribute("aria-disabled"));
    await inside();
    await expect(rect(alert).top).toBeGreaterThanOrEqual(rect(panel).top);
    await expect(rect(alert).bottom).toBeLessThanOrEqual(rect(footer).top + 0.5);
    await expect(confirm).toHaveFocus();
  },
};

/**
 * A confirm label past the contract (a name, not a verb phrase) wraps inside its button, the
 * button stays inside the panel and nothing scrolls sideways, at 360 and at 416 (AC 29).
 */
export const LongLabel: Story = {
  render: () => (
    <Frames>
      {/* Tailwind reads whole class names, so each width is written out. */}
      {["h-[560px] w-[360px]", "h-[560px] w-[416px]"].map((className) => (
        <Framed
          key={className}
          className={className}
          {...copyFor("delete")}
          confirmLabel={fixtures.longThai}
          onConfirm={async () => ({ status: "done" })}
        />
      ))}
    </Frames>
  ),
  play: async ({ canvasElement }) => {
    const frames = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-frame]"));
    await expect(frames).toHaveLength(2);
    for (const frame of frames) {
      const panel = await openPanel(within(frame));
      const { confirm } = partsOf(panel);
      const f = rect(frame);
      const c = rect(confirm);
      const p = rect(panel);
      await expect(c.left).toBeGreaterThanOrEqual(p.left);
      await expect(c.right).toBeLessThanOrEqual(p.right);
      await expect(c.top).toBeGreaterThanOrEqual(p.top);
      await expect(c.bottom).toBeLessThanOrEqual(p.bottom);
      await expect(frame.scrollWidth).toBeLessThanOrEqual(f.width);
      // One line is the height of `--cmp-button-height-md`, 40; a wrapped label is taller.
      await expect(c.height).toBeGreaterThan(40);
      await expectNoClipUpTo(confirm, frame, panel);
      if (inVitest) {
        await expectLabelInkWhole(confirm);
        await expectNoInkCut(confirm, frame, panel);
      }
    }
  },
};

/**
 * The shape follows the panel and a press changes none of it: at 412 the actions stack, at 416
 * they sit in one row, and at 416 neither button moves (AC 30). English, accept words. A third
 * frame at 412 with the short delete labels shows that the panel decides the shape, not the fit.
 */
export const ShapeHolds: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <Frames>
      <Framed
        className="h-[560px] w-[412px]"
        {...copyFor("accept", "en")}
        trigger={undefined}
        onConfirm={held.onConfirm}
      />
      <Framed
        className="h-[560px] w-[416px]"
        {...copyFor("accept", "en")}
        trigger={undefined}
        onConfirm={held.onConfirm}
      />
      {/* Short labels that would fit one row at 412: the panel, not the labels, decides the shape. */}
      <Framed
        className="h-[560px] w-[412px]"
        {...copyFor("delete", "en")}
        trigger={undefined}
        onConfirm={held.onConfirm}
      />
    </Frames>
  ),
  play: async ({ canvasElement }) => {
    held.reset();
    const frames = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-frame]"));
    await expect(frames).toHaveLength(3);
    const shape = (panel: HTMLElement) => {
      const { cancel, confirm, footer } = partsOf(panel);
      const rows = new Set([cancel, confirm].map((b) => Math.round(rect(b).top))).size;
      return {
        rows,
        footer: rect(footer).height,
        panel: rect(panel).height,
        cancelLeft: rect(cancel).left,
        confirmRight: rect(confirm).right,
      };
    };
    const rest = [];
    for (const frame of frames) {
      const panel = await openPanel(within(frame));
      rest.push(shape(panel));
    }
    for (const [i, frame] of frames.entries()) {
      const panel = await openPanel(within(frame));
      const { cancel, confirm } = partsOf(panel);
      await userEvent.click(confirm);
      await waitFor(() => expect(confirm).toHaveAttribute("aria-busy", "true"));
      const before = rest[i];
      const during = shape(panel);
      await expect(during.rows).toBe(before?.rows);
      await expect(Math.abs(during.footer - (before?.footer ?? 0))).toBeLessThanOrEqual(0.5);
      await expect(Math.abs(during.panel - (before?.panel ?? 0))).toBeLessThanOrEqual(0.5);
      if (i !== 1) {
        await expect(rect(confirm).top).toBeGreaterThan(rect(cancel).bottom);
      } else {
        await expect(Math.abs(rect(confirm).top - rect(cancel).top)).toBeLessThanOrEqual(0.5);
        await expect(Math.abs(during.cancelLeft - (before?.cancelLeft ?? 0))).toBeLessThanOrEqual(
          0.5,
        );
        await expect(
          Math.abs(during.confirmRight - (before?.confirmRight ?? 0)),
        ).toBeLessThanOrEqual(0.5);
      }
    }
    // The promises stay held: every panel is open and pending when the story is opened, so the
    // shape shows. Settling them done would close all three.
    await expect(held.held()).toBe(frames.length);
    for (const frame of frames) {
      const panel = within(frame).getByRole("alertdialog");
      await expect(panel).toBeVisible();
      await expect(partsOf(panel).confirm).toHaveAttribute("aria-busy", "true");
    }
  },
};
