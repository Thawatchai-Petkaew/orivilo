import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { commandById } from "../../commands/index";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";

const selectedFirst = {
  ...BOARD,
  nodes: BOARD.nodes.map((n) => (n.id === "brief" ? { ...n, selected: true } : n)),
};

const meta = {
  title: "Application/Node toolbar",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Actions for the one selected node (E4-3): the node-toolbar commands this story implements (duplicate, lock or unlock, collapse or expand, delete) from the registry, floating above the node without scaling with zoom. Hidden when several nodes are selected and in the present variant; disabled while the node runs. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: selectedFirst, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const nodeByTitle = (root: HTMLElement, title: string) =>
  within(root).getByRole("group", { name: new RegExp(`^${title},`) });
const toolbarOf = (root: HTMLElement, title: string) =>
  within(root).getByRole("toolbar", { name: `เครื่องมือของ ${title}` });

/** One node selected: the toolbar floats above it with four named buttons and their shortcuts (AC 5). */
export const Visible: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const toolbar = await waitFor(() => toolbarOf(canvasElement, "บรีฟ"));
    const buttons = within(toolbar).getAllByRole("button");
    await expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      commandById("selection.duplicate").label.th,
      "ล็อก",
      "ย่อ",
      commandById("selection.delete").label.th,
    ]);
    await expect(buttons[0]).toHaveAttribute("aria-keyshortcuts", "Mod+D");
    const brief = nodeByTitle(region, "บรีฟ");
    await expect(toolbar.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      brief.getBoundingClientRect().top + 1,
    );
    await userEvent.click(buttons[0] as HTMLElement);
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await expect(within(region).getByRole("status")).toHaveTextContent("ทำซ้ำ 1 node แล้ว");
  },
};

/** Several nodes selected: no toolbar; the actions live in the context menu (catalog rule). */
export const MultiSelect: Story = {
  args: {
    initial: {
      ...BOARD,
      nodes: BOARD.nodes.map((n) =>
        n.id === "brief" || n.id === "note" ? { ...n, selected: true } : n,
      ),
    },
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(region.querySelectorAll(".react-flow__node.selected")).toHaveLength(2);
    await expect(
      within(canvasElement).queryByRole("toolbar", { name: /เครื่องมือของ/ }),
    ).toBeNull();
  },
};

/** The running node: its toolbar shows but every button is disabled (AC 5). */
export const DisabledWhileRunning: Story = {
  args: {
    initial: {
      ...BOARD,
      nodes: BOARD.nodes.map((n) => (n.id === "logo" ? { ...n, selected: true } : n)),
    },
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const toolbar = await waitFor(() => toolbarOf(canvasElement, "โลโก้"));
    await expect(toolbar).toHaveAttribute("data-running");
    for (const b of within(toolbar).getAllByRole("button")) await expect(b).toBeDisabled();
  },
};

/** The locked node reads "ปลดล็อก"; pressing it unlocks and the word flips back (AC 13). */
export const LockedNode: Story = {
  args: {
    initial: {
      ...BOARD,
      nodes: BOARD.nodes.map((n) => (n.id === "profile" ? { ...n, selected: true } : n)),
    },
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const toolbar = await waitFor(() => toolbarOf(canvasElement, "โปรไฟล์ว่าที่ลูกค้า"));
    await userEvent.click(within(toolbar).getByRole("button", { name: "ปลดล็อก" }));
    await waitFor(() =>
      expect(within(toolbar).getByRole("button", { name: "ล็อก" })).toBeInTheDocument(),
    );
    await expect(within(region).getByRole("status")).toHaveTextContent("ปลดล็อก 1 node แล้ว");
  },
};

/** The toolbar under every profile in both modes; glass over the board, solid under reduced transparency. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={320} fitView={false} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await waitFor(() => expect(toolbarOf(cell, "บรีฟ")).toBeInTheDocument());
    }
  },
};
