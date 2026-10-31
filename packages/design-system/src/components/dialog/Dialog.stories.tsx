import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Input } from "../input/Input";
import { expectTitleOverText } from "../../testing/visual-asserts";
import { Matrix } from "../matrix";
import {
  Dialog,
  DialogClose,
  DialogContent,
  type DialogContentProps,
  DialogTrigger,
} from "./Dialog";

const body = () => within(document.body);

interface RenameProps extends Omit<DialogContentProps, "title" | "footer" | "children"> {
  title?: ReactNode;
  description?: ReactNode;
  onSubmit?: () => void;
  body?: ReactNode;
}

/** The rename task: a form in the body, cancel and submit in the footer, ids from `useId` so several may coexist. */
function RenameContent({
  title = "เปลี่ยนชื่อโปรเจกต์",
  description = "ชื่อใหม่จะแสดงทุกที่ที่อ้างถึงโปรเจกต์นี้",
  pending = false,
  onSubmit,
  body: extra,
  ...rest
}: RenameProps) {
  const formId = useId();
  return (
    <DialogContent
      {...rest}
      title={title}
      description={description}
      pending={pending}
      footer={
        <>
          <DialogClose>
            <Button variant="ghost" disabled={pending}>
              ยกเลิก
            </Button>
          </DialogClose>
          <Button variant="primary" type="submit" form={formId} loading={pending}>
            บันทึกชื่อ
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <Field label="ชื่อใหม่">
          <Input defaultValue={fixtures.mixed} disabled={pending} />
        </Field>
        {extra}
      </form>
    </DialogContent>
  );
}

const trigger = (
  <DialogTrigger>
    <Button variant="secondary">เปลี่ยนชื่อ</Button>
  </DialogTrigger>
);

const meta = {
  title: "Application/Dialog",
  component: Dialog,
  parameters: { layout: "padded" },
  args: {
    children: (
      <>
        {trigger}
        <RenameContent />
      </>
    ),
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Closed until the trigger opens it. The play proves AC 2: focus moves inside, Tab never leaves
 * while open, Escape closes and returns focus to the trigger.
 */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "เปลี่ยนชื่อ" });
    await userEvent.click(button);
    const dialog = await body().findByRole("dialog", { name: "เปลี่ยนชื่อโปรเจกต์" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(button).toHaveFocus();
  },
};

/**
 * Open with first focus on the name field. The play proves the focus ring is whole: the scrolling
 * body is a scroll container, which clips what draws outside a control, so the body bleeds the
 * reach (the 1 px line plus the 3 px halo, ORV-192 row 9) on every side.
 */
export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const input = await body().findByRole("textbox", { name: "ชื่อใหม่" });
    await waitFor(() => expect(input).toHaveFocus());
    const scroller = input.closest<HTMLElement>(".ds-dialog__body");
    await expect(scroller).not.toBeNull();
    if (!scroller) return;
    // The panel scales in; measure once its animations have finished.
    await Promise.all(scroller.getAnimations({ subtree: true }).map((a) => a.finished));
    const dialog = scroller.closest<HTMLElement>(".ds-dialog");
    await Promise.all((dialog?.getAnimations() ?? []).map((a) => a.finished));
    const ring = 4;
    const inner = input.getBoundingClientRect();
    const outer = scroller.getBoundingClientRect();
    await expect(outer.left).toBeLessThanOrEqual(inner.left - ring);
    await expect(outer.right).toBeGreaterThanOrEqual(inner.right + ring);
    await expect(outer.top).toBeLessThanOrEqual(inner.top - ring);
    await expect(outer.bottom).toBeGreaterThanOrEqual(inner.bottom + ring);
    // ORV-192 row 17: the header pair, 20 / 500 title over 16 / 400 description, 8 px apart.
    const title = dialog?.querySelector(".ds-dialog__title");
    const text = dialog?.querySelector(".ds-dialog__description");
    if (!title || !text) throw new Error("the dialog has no title or description");
    expectTitleOverText(title, text, { gap: 8, header: true });
  },
};

export const Medium: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        {trigger}
        <RenameContent
          size="md"
          description="ชื่อใหม่จะแสดงทุกที่ที่อ้างถึงโปรเจกต์นี้ รวมถึงลิงก์ที่แชร์ไปแล้ว"
        />
      </>
    ),
  },
};

/** Destructive: a danger glyph before the title, impact in the description, the confirming action is a destructive Button named after the outcome. */
export const Destructive: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        <DialogTrigger>
          <Button variant="secondary">ลบโปรเจกต์</Button>
        </DialogTrigger>
        <DialogContent
          variant="destructive"
          title="ลบโปรเจกต์นี้ถาวร"
          description="สมาชิก 4 คนจะเข้าถึงไม่ได้อีก และลิงก์ที่แชร์ไปจะใช้ไม่ได้ การลบย้อนกลับไม่ได้"
          footer={
            <>
              <DialogClose>
                <Button variant="ghost">เก็บไว้</Button>
              </DialogClose>
              <Button variant="destructive">ลบโปรเจกต์</Button>
            </>
          }
        />
      </>
    ),
  },
};

function PendingDialog() {
  const [pending, setPending] = useState(false);
  return (
    <Dialog defaultOpen>
      {trigger}
      <RenameContent pending={pending} onSubmit={() => setPending(true)} />
    </Dialog>
  );
}

/** Pending: the save is running; Escape, the scrim and the close control do nothing (AC 4). */
export const Pending: Story = {
  render: () => <PendingDialog />,
  play: async () => {
    const save = await body().findByRole("button", { name: "บันทึกชื่อ" });
    await userEvent.click(save);
    await expect(save).toHaveAttribute("aria-busy", "true");
    await expect(body().getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    await userEvent.keyboard("{Escape}");
    const dialog = body().getByRole("dialog");
    // The panel scales and fades in; judge visibility once that has finished (the spinner loops).
    await Promise.all(dialog.getAnimations().map((a) => a.finished));
    await expect(dialog).toBeVisible();
    await expect(body().getByRole("button", { name: "ปิด" })).toBeDisabled();
  },
};

/** Error: the message says what went wrong and how to fix it, above the actions, announced (AC 5). */
export const ErrorState: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        {trigger}
        <RenameContent error="บันทึกไม่สำเร็จ เพราะมีโปรเจกต์ชื่อนี้อยู่แล้ว ลองใช้ชื่ออื่น" />
      </>
    ),
  },
  play: async () => {
    const alert = await body().findByRole("alert");
    await expect(alert).toHaveTextContent("บันทึกไม่สำเร็จ");
  },
};

/**
 * A frame the dialog mounts into through `container`. `contain: layout` makes the frame the
 * containing block of the fixed scrim and panel, so a story can show a phone or a matrix cell.
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
      className={`relative isolate overflow-hidden rounded-container bg-surface-canvas [contain:layout] ${className}`}
    >
      {node ? children(node) : null}
    </div>
  );
}

/**
 * 360 px with long Thai content: the panel fills the width minus the gutter, the body scrolls, the
 * actions stack (AC 7). The 360 x 560 frame is a phone, not a board or a panel, so it keeps its
 * height (spec ORV-189, `exempt-1`).
 */
export const LongContentAt360: Story = {
  render: () => (
    <Frame className="h-[560px] w-[360px] max-w-full">
      {(container) => (
        <Dialog defaultOpen modal={false}>
          {trigger}
          <RenameContent
            container={container}
            title={fixtures.longThai}
            description={`${fixtures.longThai} ${fixtures.longLatin}`}
            body={
              <div className="flex flex-col gap-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <p key={i}>{fixtures.longThai}</p>
                ))}
              </div>
            }
          />
        </Dialog>
      )}
    </Frame>
  ),
};

/** The content is rendered in a portal and still carries the trigger's profile and mode (AC 3). */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="professional" mode="light">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Dialog {...args} defaultOpen />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    // The modal hides the page behind it from assistive tech, so the trigger is queried as hidden.
    const button = within(canvasElement).getByRole("button", { name: "เปลี่ยนชื่อ", hidden: true });
    const dialog = await body().findByRole("dialog");
    const scope = dialog.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(dialog)).toBe(read(button));
  },
};

/**
 * Six boundaries at once; each dialog is non-modal and mounted in its own cell, with the error
 * state so every slot shows. A non-modal dialog still dismisses when focus or a pointer lands
 * outside it, and six opening at once would dismiss each other, so the preview prevents
 * `onInteractOutside`; the play asserts all six stay open.
 */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Frame className="h-96">
        {(container) => (
          <Dialog defaultOpen modal={false}>
            {trigger}
            <RenameContent
              container={container}
              error="บันทึกไม่สำเร็จ เพราะมีโปรเจกต์ชื่อนี้อยู่แล้ว ลองใช้ชื่ออื่น"
              onInteractOutside={(event) => event.preventDefault()}
            />
          </Dialog>
        )}
      </Frame>
    </Matrix>
  ),
  play: async () => {
    await waitFor(() => expect(body().getAllByRole("dialog")).toHaveLength(6));
  },
};
