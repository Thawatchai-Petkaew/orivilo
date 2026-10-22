import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MINIMAP_FROM } from "../canvas-board/CanvasBoard";
import { BIG_BOARD, BOARD, BOARD_NODES, GROUPED_BOARD } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";

const meta = {
  title: "Application/Mini map",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The board's overview, bottom-right (E4-3): node fills from the minimap tokens, the viewport in canvas.selection, pannable and zoomable with a pointer. Shown on its own from ten nodes; Shift+M and the control toggle it. Named for screen readers, no keyboard path: the same navigation lives in CanvasControls. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BIG_BOARD, label: "กระดานใหญ่ (ข้อมูลตัวอย่าง)" },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const map = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-minimap");

/** Twelve nodes: the minimap shows with one rectangle per node and the viewport mask (AC 7). */
export const Shown: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BIG_BOARD.nodes.length));
    await expect(BIG_BOARD.nodes.length).toBeGreaterThanOrEqual(MINIMAP_FROM);
    const mini = await waitFor(() => map(region) as HTMLElement);
    await expect(within(region).getByRole("img", { name: "แผนที่ย่อของกระดาน" })).toBeVisible();
    await waitFor(() =>
      expect(mini.querySelectorAll(".react-flow__minimap-node")).toHaveLength(
        BIG_BOARD.nodes.length,
      ),
    );
    await expect(mini.querySelector(".react-flow__minimap-mask")).not.toBeNull();
    await expect(getComputedStyle(mini).borderColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};

/** Six nodes: hidden; Shift+M shows it and the control reads pressed; Shift+M again hides (AC 7). */
export const Hidden: Story = {
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(map(region)).toBeNull();
    region.focus();
    await userEvent.keyboard("{Shift>}m{/Shift}");
    await waitFor(() => expect(map(region)).not.toBeNull());
    await expect(within(region).getByRole("status")).toHaveTextContent("แสดงแผนที่ย่อ");
    const toggle = region.querySelector('[data-command="board.toggle-minimap"]');
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Shift>}m{/Shift}");
    await waitFor(() => expect(map(region)).toBeNull());
  },
};

/** A selected node and a group take their own fills (AC 7). */
export const SelectedAndGroup: Story = {
  args: {
    initial: {
      ...GROUPED_BOARD,
      nodes: GROUPED_BOARD.nodes.map((n) => (n.id === "brief" ? { ...n, selected: true } : n)),
    },
    minimap: true,
    label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)",
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    const mini = await waitFor(() => map(region) as HTMLElement);
    await waitFor(() => expect(mini.querySelector(".ds-minimap__group")).not.toBeNull());
    const group = mini.querySelector(".ds-minimap__group") as SVGElement;
    const selected = mini.querySelector(".ds-minimap__node-selected") as SVGElement;
    const plain = mini.querySelector(".ds-minimap__node") as SVGElement;
    await expect(getComputedStyle(group).fill).not.toBe(getComputedStyle(plain).fill);
    await expect(getComputedStyle(selected).fill).not.toBe(getComputedStyle(plain).fill);
  },
};

/** The minimap under every profile in both modes. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={300} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await waitFor(() => expect(map(cell)).not.toBeNull());
  },
};
