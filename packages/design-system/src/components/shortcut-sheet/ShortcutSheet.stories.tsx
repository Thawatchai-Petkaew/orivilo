import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { COMMANDS, commandAvailable } from "../../commands/index";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";

const meta = {
  title: "Application/Shortcut sheet",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Every registry command with its keys, grouped by scope (E4-3, Shift+/). A command from a later story is listed with the story that brings it, never as something that works today. The list is the registry itself. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const openSheet = async (region: HTMLElement) => {
  region.focus();
  await userEvent.keyboard("{Shift>}/{/Shift}");
  return body().findByRole("dialog", { name: "คีย์ลัดทั้งหมด" });
};

/** Shift+/: every registry command is a row; later ones say which story brings them (AC 10). */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const dialog = await openSheet(region);
    const rows = dialog.querySelectorAll("[data-command]");
    await expect(rows).toHaveLength(COMMANDS.length);
    const later = COMMANDS.filter((c) => !commandAvailable(c));
    await expect(dialog.querySelectorAll("[data-command]:not([data-available])")).toHaveLength(
      later.length,
    );
    await expect(within(dialog).getAllByText(/^มาใน E4-[4-9]$/).length).toBe(later.length);
    await expect(within(dialog).queryByText("มาใน E4-3")).toBeNull();
    await expect(dialog.querySelector('[data-command="selection.nudge"] kbd')).not.toBeNull();
    await expect(
      dialog.querySelectorAll('[data-command="selection.nudge"] .ds-kbd-group'),
    ).toHaveLength(4);
    await expect(within(dialog).getAllByText("ไม่มีคีย์").length).toBeGreaterThan(0);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** The control opens the same sheet; it still opens in the present variant (AC 17). */
export const FromControl: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await userEvent.click(
      region.querySelector('[data-command="board.shortcut-sheet"]') as HTMLElement,
    );
    await body().findByRole("dialog", { name: "คีย์ลัดทั้งหมด" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Boards under every profile in both modes; the play opens and closes the sheet in each cell. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={300} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const region = within(cell).getByRole("region");
      await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
      const dialog = await openSheet(region);
      await expect(dialog.querySelectorAll("[data-command]")).toHaveLength(COMMANDS.length);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    }
  },
};
