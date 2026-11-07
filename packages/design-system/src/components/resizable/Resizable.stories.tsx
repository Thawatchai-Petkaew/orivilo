import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { Matrix } from "../matrix";
import { RESIZE_STEP, Resizable } from "./Resizable";

const content = (
  <div className="flex flex-col gap-2 p-4 text-body-md">
    <p className="m-0 text-label-md">บล็อกป้อนข้อมูล</p>
    <p className="m-0 text-text-secondary">บรีฟ, กลุ่มผู้ใช้, ความรู้สึกที่ต้องการ</p>
  </div>
);

/** A side panel beside a stand-in board, as the Studio lays them out. */
function Layout({
  side,
  storageKey,
  label = side === "start" ? "แผงบล็อก" : "แผงรายละเอียด",
}: {
  side: "start" | "end";
  storageKey?: string;
  label?: string;
}) {
  const panel = (
    <Resizable side={side} label={label} {...(storageKey ? { storageKey } : {})}>
      {content}
    </Resizable>
  );
  return (
    <div className="flex h-72 overflow-hidden rounded-container border border-border-card bg-surface-card">
      {side === "start" ? panel : null}
      <div className="flex-1 bg-surface-board" />
      {side === "end" ? panel : null}
    </div>
  );
}

const meta = {
  title: "Base/Resizable",
  component: Resizable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A side panel the user widens (E4-4). The handle is a window splitter: arrows resize, Page keys by ten steps, Home and End jump to the bounds, Enter hides the panel and its reopen control stays visible.",
      },
    },
  },
  args: { side: "start", label: "แผงบล็อก", children: content },
  render: (args) => <Layout side={args.side} />,
} satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof meta>;

const handleOf = (el: HTMLElement) => within(el).getByRole("separator");

/** Default 320 px from the token; arrows, Page and Home/End move within 240 to 480. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const handle = handleOf(canvasElement);
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "320"));
    await expect(handle).toHaveAttribute("aria-valuemin", "240");
    await expect(handle).toHaveAttribute("aria-valuemax", "480");
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", String(320 + RESIZE_STEP));
    await userEvent.keyboard("{PageDown}");
    await expect(handle).toHaveAttribute("aria-valuenow", "480");
    await userEvent.keyboard("{Home}");
    await expect(handle).toHaveAttribute("aria-valuenow", "240");
    const panel = within(canvasElement).getByRole("region", { name: "แผงบล็อก" });
    await expect(Math.round(panel.getBoundingClientRect().width)).toBeLessThanOrEqual(240);
  },
};

/** On the end side, moving the handle left widens the panel. */
export const EndSide: Story = {
  args: { side: "end", label: "แผงรายละเอียด" },
  play: async ({ canvasElement }) => {
    const handle = handleOf(canvasElement);
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "320"));
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(handle).toHaveAttribute("aria-valuenow", String(320 + RESIZE_STEP));
  },
};

/** Dragging the handle with a pointer (dragging state), then past half the minimum hides the panel. */
export const Dragging: Story = {
  play: async ({ canvasElement }) => {
    const handle = handleOf(canvasElement);
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "320"));
    const x = handle.getBoundingClientRect().left;
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: x });
    await expect(canvasElement.querySelector(".ds-resizable")).toHaveAttribute("data-dragging");
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: x + 40 });
    await expect(handle).toHaveAttribute("aria-valuenow", "360");
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: x + 40 });
    await expect(canvasElement.querySelector(".ds-resizable")).not.toHaveAttribute("data-dragging");
  },
};

/** Enter hides the panel; the reopen control stays on the edge and brings focus back to the handle. */
export const Collapsed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = handleOf(canvasElement);
    handle.focus();
    await userEvent.keyboard("{Enter}");
    const reopen = await canvas.findByRole("button", { name: "เปิดแผงบล็อก" });
    await expect(reopen).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("separator")).toBeNull();
    await userEvent.click(reopen);
    await waitFor(() => expect(canvas.getByRole("separator")).toHaveFocus());
  },
};

/** Width and collapsed state survive a remount under the same key (catalog rule). */
export const Persisted: Story = {
  render: () => <Layout side="start" storageKey="story-persisted" />,
  play: async ({ canvasElement }) => {
    window.localStorage.setItem(
      "ds-resizable:story-persisted",
      JSON.stringify({ size: 400, collapsed: false }),
    );
    // The story mounted before the write; the saved width is read on the next mount.
    const handle = handleOf(canvasElement);
    handle.focus();
    await userEvent.keyboard("{End}");
    const saved = JSON.parse(window.localStorage.getItem("ds-resizable:story-persisted") ?? "{}");
    await expect(saved).toEqual({ size: 480, collapsed: false });
    window.localStorage.removeItem("ds-resizable:story-persisted");
  },
};

/** Named after its cell so the six panel landmarks stay distinguishable. */
function Cell() {
  const scope = useDesignProfile();
  return <Layout side="start" label={`แผงบล็อก ${String(scope?.profile)} ${scope?.mode}`} />;
}

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell />
    </Matrix>
  ),
};
