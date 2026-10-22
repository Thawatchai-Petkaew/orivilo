import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BOARD, BOARD_NODES, COLLAPSED_BOARD, GROUPED_BOARD } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import type { Graph } from "../canvas-board/graph";
import { Matrix } from "../matrix";

const meta = {
  title: "Application/Node group",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A named frame around related nodes (E4-3): a React Flow parent node, so children move with it and keep positions relative to it; a child dragged out leaves it. Collapsed, it hides its children and says how many nodes and crossing edges it holds. Deleting a group ungroups it and loses nothing. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: GROUPED_BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const groupEl = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-group");
const nodeByTitle = (root: HTMLElement, title: string) =>
  within(root).getByRole("group", { name: new RegExp(`^${title},`) });

/** The group frames the logo and palette nodes; its header names it and its kind (AC 11). */
export const Grouped: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(GROUPED_BOARD.nodes.length));
    const group = groupEl(region) as HTMLElement;
    await expect(within(group).getByText("งานภาพ")).toBeVisible();
    await expect(within(group).getByText("กลุ่ม")).toBeVisible();
    await expect(nodeByTitle(region, "งานภาพ")).toHaveAttribute("aria-label", "งานภาพ, กลุ่ม");
    const g = nodeByTitle(region, "งานภาพ").getBoundingClientRect();
    const logo = nodeByTitle(region, "โลโก้").getBoundingClientRect();
    await expect(logo.left).toBeGreaterThanOrEqual(g.left);
    await expect(logo.top).toBeGreaterThanOrEqual(g.top);
    await expect(logo.right).toBeLessThanOrEqual(g.right + 1);
  },
};

/** Collapsed: children hidden, the frame says 2 node and 2 crossing edges (AC 11). */
export const Collapsed: Story = {
  args: { initial: COLLAPSED_BOARD },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(groupEl(region)).not.toBeNull());
    const group = groupEl(region) as HTMLElement;
    await expect(group).toHaveAttribute("data-collapsed");
    await expect(within(group).getByText("2 node, 2 สายเข้าออก")).toBeVisible();
    await expect(within(region).queryByRole("group", { name: /^โลโก้,/ })).toBeNull();
  },
};

/** Mod+G on two selected nodes makes a group; Mod+Shift+G takes it apart again (AC 11). */
export const GroupAndUngroup: Story = {
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
    nodeByTitle(region, "บรีฟ").focus();
    await userEvent.keyboard("{Control>}g{/Control}");
    await waitFor(() => expect(groupEl(region)).not.toBeNull());
    await expect(within(region).getByRole("status")).toHaveTextContent(
      "จัดกลุ่ม 2 node เป็น กลุ่ม 1",
    );
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1);
    const group = nodeByTitle(region, "กลุ่ม 1");
    await expect(group).toHaveClass("selected");
    group.focus();
    await userEvent.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");
    await waitFor(() => expect(groupEl(region)).toBeNull());
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length);
    await expect(within(region).getByRole("status")).toHaveTextContent("แยกกลุ่มแล้ว");
  },
};

/** Delete on a selected group ungroups it: the frame goes, every node inside stays (AC 11). */
export const DeleteKeepsChildren: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(GROUPED_BOARD.nodes.length));
    const group = nodeByTitle(region, "งานภาพ");
    group.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(groupEl(region)).toBeNull());
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length);
    await expect(nodeByTitle(region, "โลโก้")).toBeInTheDocument();
    await expect(within(region).getByRole("status")).toHaveTextContent("แยกกลุ่ม งานภาพ แล้ว");
  },
};

/** The collapse button on the group's toolbar hides the children and shows the summary (AC 11). */
export const CollapseFromToolbar: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(GROUPED_BOARD.nodes.length));
    await userEvent.click(nodeByTitle(region, "งานภาพ"));
    const toolbar = await within(canvasElement).findByRole("toolbar", {
      name: "เครื่องมือของ งานภาพ",
    });
    await userEvent.click(within(toolbar).getByRole("button", { name: "ย่อ" }));
    await waitFor(() => expect(groupEl(region)).toHaveAttribute("data-collapsed"));
    await expect(within(region).getByText("2 node, 2 สายเข้าออก")).toBeVisible();
    await userEvent.click(within(toolbar).getByRole("button", { name: "ขยาย" }));
    await waitFor(() => expect(groupEl(region)).not.toHaveAttribute("data-collapsed"));
  },
};

/** A selected group and a collapsed one under every profile in both modes. */
export const RecipesAndModes: Story = {
  render: (args) => {
    const selected: Graph = {
      ...GROUPED_BOARD,
      nodes: GROUPED_BOARD.nodes.map((n) =>
        n.id === "group-visual" ? { ...n, selected: true } : n,
      ),
    };
    return (
      <Matrix>
        <MatrixBoard {...args} initial={selected} height={320} />
      </Matrix>
    );
  },
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await waitFor(() => expect(groupEl(cell)).toHaveAttribute("data-selected"));
    }
  },
};
