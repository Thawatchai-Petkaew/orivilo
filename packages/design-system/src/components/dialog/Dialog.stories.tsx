import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { Input } from "../input/Input";
import { contrastRatio } from "../../foundations/contrast";
import {
  cssColorToHex,
  expectFocusBorderForm,
  expectLinesClear,
  expectTitleOverText,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
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
    // Border form (ORV-192 row 9): the panel's border turns focus.ring and its elevation stays.
    await expectFocusBorderForm(dialog);
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
    // ORV-194 row 9: selected text takes the selection pair and reads at 4.5 or more on its highlight.
    const selected = getComputedStyle(input, "::selection");
    const ink = cssColorToHex(selected.color);
    const highlight = cssColorToHex(selected.backgroundColor);
    await expect(ink).toBe(cssColorToHex(resolvedColor(scroller, "--ds-selection-fg")));
    await expect(highlight).toBe(cssColorToHex(resolvedColor(scroller, "--ds-selection-bg")));
    await expect(ink && highlight ? contrastRatio(ink, highlight) : null).toBeGreaterThanOrEqual(
      4.5,
    );
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
  play: async ({ canvasElement }) => {
    const panel = await within(canvasElement).findByRole("dialog");
    await Promise.all(panel.getAnimations().map((a) => a.finished));
    const title = panel.querySelector<HTMLElement>(".ds-dialog__title");
    if (!title) throw new Error("the dialog has no title");
    // ORV-194 row 6: the title's wrapped Thai lines keep 1.5 px of ground between them.
    if (inVitest) await expectLinesClear(title);
  },
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

type Lang = "th" | "en";

/** The viewer stories' words: story-local fixtures, one table per language. */
const VIEWER = {
  th: {
    open: "เปิดตัวดู",
    title: "ตัวอย่างหน้าแบรนด์",
    description: "หน้า 2 จาก 6 ของชุดภาพทิศทางแบรนด์ ดูได้อย่างเดียว",
    previous: "หน้าก่อนหน้า",
    next: "หน้าถัดไป",
    count: "2 / 6",
    stage: "พื้นที่แสดงหน้า ภาพจะขยายให้พอดีกับกรอบนี้",
    close: "ปิด",
  },
  en: {
    open: "Open the viewer",
    title: "Brand page preview",
    description: "Page 2 of 6 of the brand direction set, view only",
    previous: "Previous page",
    next: "Next page",
    count: "2 / 6",
    stage: "The page area. The picture scales to fit this frame",
    close: "Close",
  },
} as const;

/**
 * A viewer the way the page opens one: it has no `DialogTrigger`, so the story holds the open state
 * and sends focus itself. On open focus goes to Next page, and on close back to the opener.
 */
function ViewerDialog({ lang }: { lang: Lang }) {
  const words = VIEWER[lang];
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const pager = useRef<HTMLDivElement>(null);
  return (
    <>
      {/* The opener sits 16 px (space.inset-md) in from the page's edge, so its focus ring is whole. */}
      <div className="p-4">
        <Button
          variant="secondary"
          onClick={(event) => {
            opener.current = event.currentTarget;
            setOpen(true);
          }}
        >
          {words.open}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="viewer"
          // A caller's stray cap: the viewer's recipe still lets the panel fill the window less the gutters.
          className="max-w-xs"
          title={words.title}
          description={words.description}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            pager.current?.querySelector<HTMLElement>('[data-pager="next"]')?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus({ preventScroll: true });
          }}
          footer={
            <div ref={pager} className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" iconOnly aria-label={words.previous}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="text-text-secondary">{words.count}</span>
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                aria-label={words.next}
                data-pager="next"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          }
        >
          <div
            data-stage
            className="min-h-0 flex-1 rounded-container bg-surface-sunken p-6 text-text-secondary"
          >
            {words.stage}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const box = (el: Element) => el.getBoundingClientRect();
const px = (el: Element, property: string) =>
  parseFloat(getComputedStyle(el).getPropertyValue(property));

/**
 * Runs `check` with the browser at `width` by `height`, then puts the size back. The viewer is as
 * large as the window, and Vitest's browser iframe is 1200 by 900, so the size is set, not assumed.
 * The static Storybook has no `vitest/browser`; there the window is the size the toolbar chose and
 * `check` reads it.
 */
async function atWindow(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/** Opens the viewer, reads its size, focus and parts, closes it, and reads where focus went. */
async function checkViewer(
  root: HTMLElement,
  lang: Lang,
  size?: { width: number; height: number },
) {
  const words = VIEWER[lang];
  const opener = within(root).getByRole("button", { name: words.open });
  await userEvent.click(opener);
  const dialog = await body().findByRole("dialog", { name: words.title });
  // Focus lands on Next page, not on the first control the panel holds (Previous page).
  await waitFor(() =>
    expect(within(dialog).getByRole("button", { name: words.next })).toHaveFocus(),
  );
  // The panel is the window less one gutter (16) on each side, with no max width or height.
  const win = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
  if (size) await expect([win.width, win.height]).toEqual([size.width, size.height]);
  const panel = box(dialog);
  await expect(dialog).toHaveAttribute("data-size", "viewer");
  await expect(dialog.className).not.toMatch(/max-w-(sm|lg)/);
  await expect(getComputedStyle(dialog).maxWidth).toBe("none");
  await expect(getComputedStyle(dialog).maxHeight).toBe("none");
  await expect(Math.abs(panel.left - 16)).toBeLessThanOrEqual(1);
  await expect(Math.abs(panel.top - 16)).toBeLessThanOrEqual(1);
  await expect(Math.abs(win.width - 16 - panel.right)).toBeLessThanOrEqual(1);
  await expect(Math.abs(win.height - 16 - panel.bottom)).toBeLessThanOrEqual(1);
  if (size) {
    await expect(Math.abs(panel.width - (size.width - 32))).toBeLessThanOrEqual(1);
    await expect(Math.abs(panel.height - (size.height - 32))).toBeLessThanOrEqual(1);
  }
  // No entry animation: the panel is where it ends from the first frame.
  await expect(getComputedStyle(dialog).animationName).toBe("none");
  // Padding space.inset-md (16) and gap space.stack-sm (8).
  await expect(px(dialog, "padding-left")).toBe(16);
  await expect(px(dialog, "padding-top")).toBe(16);
  await expect(px(dialog, "row-gap")).toBe(8);
  // The body is a flex column that does not scroll, and the stage fills what it holds.
  const content = dialog.querySelector<HTMLElement>(".ds-dialog__body");
  const stage = dialog.querySelector<HTMLElement>("[data-stage]");
  if (!content || !stage) throw new Error("the viewer has no body or stage");
  await expect(getComputedStyle(content).display).toBe("flex");
  await expect(getComputedStyle(content).flexDirection).toBe("column");
  await expect(getComputedStyle(content).overflowY).toBe("hidden");
  const inner = {
    top: box(content).top + px(content, "padding-top"),
    bottom: box(content).bottom - px(content, "padding-bottom"),
  };
  await expect(Math.abs(box(stage).top - inner.top)).toBeLessThanOrEqual(1);
  await expect(Math.abs(box(stage).bottom - inner.bottom)).toBeLessThanOrEqual(1);
  await expect(box(stage).height).toBeGreaterThan(panel.height / 2);
  // Row 25 (D5): the stage is set into the panel 17 px in (1 border and the 16 padding), and its
  // corner runs parallel to the panel's: the panel's radius less that padding, never a fatter one.
  await expect(Math.abs(box(stage).left - (panel.left + 17))).toBeLessThanOrEqual(1);
  await expect(Math.abs(panel.right - 17 - box(stage).right)).toBeLessThanOrEqual(1);
  const panelRadius = px(dialog, "border-top-left-radius");
  await expect(panelRadius).toBeGreaterThan(16);
  for (const corner of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
    await expect(
      Math.abs(px(stage, `border-${corner}-radius`) - Math.max(0, panelRadius - 16)),
      `the stage's ${corner} corner`,
    ).toBeLessThanOrEqual(1);
  }
  // A panel less round than its padding gives a square stage: a radius that calc takes below zero
  // is drawn as zero.
  dialog.style.setProperty("--cmp-dialog-radius", "4px");
  await expect(px(stage, "border-top-left-radius"), "a panel of 4 px").toBe(0);
  dialog.style.removeProperty("--cmp-dialog-radius");
  // The footer's one child takes the whole row at every width, not its own width.
  const footer = dialog.querySelector<HTMLElement>(".ds-dialog__footer");
  const pager = footer?.firstElementChild;
  if (!footer || !pager) throw new Error("the viewer has no footer");
  await expect(Math.abs(box(pager).width - box(footer).width)).toBeLessThanOrEqual(1);
  // The close control stays last in the DOM and sits at the top end, an inset from the panel's edge.
  const close = within(dialog).getByRole("button", { name: words.close });
  await expect(dialog.lastElementChild).toBe(close);
  await expect(Math.abs(panel.right - 1 - 16 - box(close).right)).toBeLessThanOrEqual(1);
  await expect(Math.abs(box(close).top - (panel.top + 1 + 16))).toBeLessThanOrEqual(1);
  // Escape closes it and focus goes back to the opener.
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  await expect(opener).toHaveFocus();
  // The opener's focus ring is whole (S5): its left and top, less how far the ring reaches, are not
  // past the page's edge. The reach is the outline's width plus its offset, or the largest box-shadow
  // spread, whichever is larger.
  const ring = getComputedStyle(opener);
  const spreads = ring.boxShadow
    .replace(/(?:rgba?|color|oklch|oklab|lab|lch|hsla?|hwb)\([^)]*\)/g, "")
    .split(",")
    .map((layer) => parseFloat(layer.match(/-?[\d.]+px/g)?.[3] ?? "0"));
  const reach = Math.max(
    ring.outlineStyle === "none"
      ? 0
      : parseFloat(ring.outlineWidth) + parseFloat(ring.outlineOffset),
    ...spreads,
  );
  await expect(reach).toBeGreaterThan(0);
  await expect(box(opener).left - reach).toBeGreaterThanOrEqual(0);
  await expect(box(opener).top - reach).toBeGreaterThanOrEqual(0);
}

/**
 * The viewer at 1440 by 900: the window less 16 on each side, no entry animation, the body a flex
 * column the stage fills, the pager across the footer's row. Focus goes to Next page on open and
 * back to the opener on close (spec row 13).
 */
export const Viewer: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <ViewerDialog lang="th" />,
  play: async ({ canvasElement }) =>
    atWindow(1440, 900, () =>
      checkViewer(canvasElement, "th", inVitest ? { width: 1440, height: 900 } : undefined),
    ),
};

/** The same viewer with English words, in dark mode. */
export const ViewerInEnglish: Story = {
  parameters: { layout: "fullscreen" },
  globals: { locale: "en", mode: "dark" },
  render: () => <ViewerDialog lang="en" />,
  play: async ({ canvasElement }) =>
    atWindow(1440, 900, () =>
      checkViewer(canvasElement, "en", inVitest ? { width: 1440, height: 900 } : undefined),
    ),
};

/** The viewer at 360 by 760: 328 wide and 728 high, the pager still across the row. */
export const ViewerAt360: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <ViewerDialog lang="th" />,
  play: async ({ canvasElement }) =>
    atWindow(360, 760, () =>
      checkViewer(canvasElement, "th", inVitest ? { width: 360, height: 760 } : undefined),
    ),
};
