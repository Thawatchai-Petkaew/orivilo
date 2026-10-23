import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { commandById, surfaceCommands } from "../../commands/index";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";
import { MOD } from "../story-keys";

const meta = {
  title: "Application/Command menu",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Search and run any command, or jump to a node by title (E4-3, Mod+K). A dialog with combobox semantics: every available command-menu command grouped by scope plus one entry per node on the board; substring search over Thai and English labels and titles; arrows move, Enter runs, Escape closes. The one glass palette the direction allows. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const ready = async (root: HTMLElement) => {
  await waitFor(() => expect(nodeEls(root)).toHaveLength(BOARD_NODES.length));
};
const open = async (region: HTMLElement, title = "ค้นหาคำสั่ง") => {
  region.focus();
  await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
  const dialog = await body().findByRole("dialog", { name: title });
  return dialog;
};

/** Mod+K: the dialog, the combobox focused, every available command grouped by scope and one entry per node (AC 9). */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const dialog = await open(region);
    const input = within(dialog).getByRole("combobox");
    await expect(input).toHaveFocus();
    const options = within(dialog).getAllByRole("option");
    const commands = surfaceCommands("command-menu");
    await expect(options).toHaveLength(commands.length + BOARD_NODES.length);
    await expect(within(dialog).getByRole("group", { name: "กระดาน" })).toBeInTheDocument();
    await expect(within(dialog).getByRole("group", { name: "ไปที่ node" })).toBeInTheDocument();
    await expect(options[0]).toHaveAttribute("aria-selected", "true");
    await expect(dialog.querySelector('[data-command="selection.group"]')).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(dialog.querySelector('[data-command="board.undo"]')).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Typing filters by substring in Thai or English; no match says so (AC 9). */
export const Search: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const dialog = await open(region);
    await userEvent.keyboard("ซูม");
    await waitFor(() => expect(within(dialog).getAllByRole("option").length).toBe(5));
    await userEvent.clear(within(dialog).getByRole("combobox"));
    await userEvent.keyboard("zoom");
    await waitFor(() => expect(within(dialog).getAllByRole("option").length).toBe(5));
    await userEvent.clear(within(dialog).getByRole("combobox"));
    await userEvent.keyboard("ไม่มีคำนี้แน่");
    await expect(within(dialog).getByText(/ไม่พบคำสั่งหรือ node/)).toBeVisible();
    await expect(within(dialog).queryAllByRole("option")).toHaveLength(0);
    await expect(within(dialog).getByRole("status")).toHaveTextContent("0 ผลลัพธ์");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Arrow to a command and Enter runs it through the board's runner; the dialog closes (AC 9). */
export const RunCommand: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const dialog = await open(region);
    await userEvent.keyboard(commandById("board.zoom-in").label.th);
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(1));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(within(region).getByRole("status")).toHaveTextContent("ซูมเข้า");
  },
};

/** Mod+F opens on the node search: nodes first; Enter on a node jumps to it and focuses it (AC 9). */
export const JumpToNode: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    region.focus();
    await userEvent.keyboard(`{${MOD}>}f{/${MOD}}`);
    const dialog = await body().findByRole("dialog", { name: "ค้นหาคำสั่ง" });
    await expect(within(dialog).getByRole("combobox")).toHaveAttribute(
      "placeholder",
      "ค้นหา node บนกระดาน",
    );
    await expect(within(dialog).getAllByRole("option")[0]).toHaveTextContent("ไปที่ บรีฟ");
    await userEvent.keyboard("โปรไฟล์");
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(1));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(within(region).getByRole("group", { name: /^โปรไฟล์ว่าที่ลูกค้า,/ })).toHaveFocus(),
    );
    await expect(within(region).getByRole("status")).toHaveTextContent("ไปที่ โปรไฟล์ว่าที่ลูกค้า");
  },
};

/** Present: only the viewing and finding commands are listed (AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const dialog = await open(region);
    await expect(dialog.querySelector('[data-command="selection.duplicate"]')).toBeNull();
    await expect(dialog.querySelector('[data-command="board.zoom-to-fit"]')).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};

/** Boards under every profile in both modes; the play opens and closes the palette in each cell. */
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
      await ready(region);
      const dialog = await open(region);
      await expect(within(dialog).getAllByRole("option").length).toBeGreaterThan(0);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    }
  },
};

/** Under the English locale the palette lists the registry's English labels and English headings (spec ORV-39 AC 8). */
export const English: Story = {
  globals: { locale: "en" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const dialog = await open(region, "Find a command");
    await expect(within(dialog).getByRole("combobox")).toHaveAttribute(
      "placeholder",
      "Type a command or a node name",
    );
    await expect(within(dialog).getByRole("group", { name: "Board" })).toBeInTheDocument();
    await expect(within(dialog).getByRole("group", { name: "Jump to node" })).toBeInTheDocument();
    await expect(
      within(dialog.querySelector('[data-command="board.zoom-in"]') as HTMLElement).getByText(
        commandById("board.zoom-in").label.en,
      ),
    ).toBeInTheDocument();
    await userEvent.keyboard("nothing matches this");
    await expect(within(dialog).getByText(/No command or node matches/)).toBeVisible();
    await expect(within(dialog).getByRole("status")).toHaveTextContent("0 results");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
  },
};
