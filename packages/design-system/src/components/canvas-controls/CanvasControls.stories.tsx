import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, surfaceCommands } from "../../commands/index";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";

const meta = {
  title: "Application/Canvas controls",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Zoom, fit, select or pan, minimap, undo, redo, add, find and the shortcut sheet (E4-3), bottom-left over the board on the glass toolbar. Every control is a registry command with its shortcut in the tooltip; undo and redo are offered only when the shell says it can. The present variant keeps what moves the viewport. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const controls = (root: HTMLElement) =>
  within(root).getByRole("toolbar", { name: "เครื่องมือกระดาน" });

/** Every canvas-controls command of this story has a button; undo and redo are disabled without a history (AC 6). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    const ids = surfaceCommands("canvas-controls").map((c) => c.id);
    for (const id of ids) {
      const control =
        bar.querySelector(`[data-command="${id}"]`) ??
        within(bar).queryByRole("radio", { name: new RegExp(commandById(id).label.th) });
      await expect(control, id).not.toBeNull();
    }
    await expect(within(bar).getByRole("button", { name: /ซูม 100/ })).toHaveTextContent("%");
    await expect(
      within(bar).getByRole("button", { name: commandById("board.undo").label.th }),
    ).toBeDisabled();
    await expect(
      within(bar).getByRole("button", { name: commandById("board.redo").label.th }),
    ).toBeDisabled();
    await expect(within(bar).getByRole("radio", { name: /โหมดเลือก/ })).toHaveAttribute(
      "data-state",
      "on",
    );
    const zoomIn = within(bar).getByRole("button", { name: commandById("board.zoom-in").label.th });
    await userEvent.hover(zoomIn);
    const tip = await within(document.body).findByRole("tooltip");
    await expect(tip).toHaveTextContent(commandById("board.zoom-in").label.th);
    await expect(tip.querySelectorAll("kbd")).toHaveLength(2);
  },
};

/** With a shell history: undo and redo are enabled and go to onCommand (AC 6). */
export const WithHistory: Story = {
  args: { canUndo: true, canRedo: true, onCommand: fn() },
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    const undo = within(bar).getByRole("button", { name: commandById("board.undo").label.th });
    await expect(undo).toBeEnabled();
    await userEvent.click(undo);
    await expect(args.onCommand).toHaveBeenCalledWith("board.undo", {});
    await userEvent.click(
      within(bar).getByRole("button", { name: commandById("board.redo").label.th }),
    );
    await expect(args.onCommand).toHaveBeenCalledWith("board.redo", {});
  },
};

/** The pan or select toggle changes the board's tool; the add button asks the shell for a node. */
export const ModesAndAdd: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    await userEvent.click(within(bar).getByRole("radio", { name: /โหมดเลื่อนกระดาน/ }));
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "pan");
    await expect(within(region).getByRole("status")).toHaveTextContent("โหมดเลื่อนกระดาน");
    await userEvent.click(
      within(bar).getByRole("button", { name: commandById("board.add-node").label.th }),
    );
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
  },
};

/** Present: only the viewport, search and sheet controls remain; no add, no undo (AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const bar = controls(region);
    await expect(bar.querySelector('[data-command="board.add-node"]')).toBeNull();
    await expect(bar.querySelector('[data-command="board.undo"]')).toBeNull();
    await expect(bar.querySelector('[data-command="board.zoom-in"]')).not.toBeNull();
    await expect(bar.querySelector('[data-command="board.shortcut-sheet"]')).not.toBeNull();
  },
};

/** The controls under every profile in both modes. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={300} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await expect(controls(cell)).toBeVisible();
  },
};
