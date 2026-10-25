import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { commandById, surfaceCommands } from "../../commands/index";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import { BOARD, BOARD_NODES } from "../canvas-board/fixtures";
import { MatrixBoard, Stateful } from "../canvas-board/story-shell";
import { Matrix } from "../matrix";
import { MOD } from "../story-keys";

const meta = {
  title: "Application/Canvas context menu",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Right-click, long-press or Shift+F10 on the board, a node, an edge or a selection (E4-3): the context-menu commands of the scopes that apply, available ones only, grouped by scope with the destructive item last and shortcuts as key caps. Right-clicking an unselected node selects it first. Off in the present variant. Fixture board, labelled as such.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)", minimap: false },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const nodeByTitle = (root: HTMLElement, title: string) =>
  within(root).getByRole("group", { name: new RegExp(`^${title},`) });
/**
 * The board is usable once React Flow has measured every node (it hides a node until then) and has
 * drawn every edge; nodes in the DOM alone are not enough, so a fast machine passed and a loaded
 * one looked for an edge or a role that was not there yet.
 */
const ready = async (root: HTMLElement) => {
  await waitFor(() => expect(nodeEls(root)).toHaveLength(BOARD_NODES.length));
  await waitFor(() => {
    expect(root.querySelectorAll(".react-flow__edge")).toHaveLength(BOARD.edges.length);
    for (const n of nodeEls(root)) expect(n.style.visibility).not.toBe("hidden");
  });
};

/** On an unselected node: it becomes the selection; node and selection items, delete last (AC 8). */
export const OnNode: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const brief = nodeByTitle(region, "บรีฟ");
    await userEvent.pointer({ keys: "[MouseRight]", target: brief });
    const menu = await body().findByRole("menu");
    await waitFor(() => expect(brief).toHaveClass("selected"));
    const items = within(menu).getAllByRole("menuitem");
    const expected = surfaceCommands("context-menu", ["node", "selection"]).map((c) => c.label.th);
    const names = items.map((i) => i.getAttribute("data-command") ?? i.textContent ?? "");
    await expect(items.length).toBe(expected.length);
    await expect(items.at(-1)).toHaveAttribute("data-destructive");
    await expect(items.at(-1)).toHaveTextContent(commandById("selection.delete").label.th);
    // Group needs two nodes; ungroup needs a group: both present, both disabled.
    const group = within(menu).getByRole("menuitem", {
      name: new RegExp(commandById("selection.group").label.th),
    });
    await expect(group).toHaveAttribute("data-disabled");
    await expect(names.length).toBeGreaterThan(0);
    await userEvent.click(
      within(menu).getByRole("menuitem", {
        name: new RegExp(`^${commandById("selection.duplicate").label.th}`),
      }),
    );
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
  },
};

/** On the pane: board items; paste is disabled until something was copied (AC 8, AC 12). */
export const OnBoard: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const pane = region.querySelector(".react-flow__pane") as HTMLElement;
    await userEvent.pointer({ keys: "[MouseRight]", target: pane, coords: { x: 20, y: 20 } });
    const menu = await body().findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await expect(
      items.map((i) => i.textContent?.includes(commandById("board.add-node").label.th)),
    ).toContain(true);
    const paste = within(menu).getByRole("menuitem", {
      name: new RegExp(commandById("board.paste").label.th),
    });
    await expect(paste).toHaveAttribute("data-disabled");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    // Copy a node, then paste is offered.
    nodeByTitle(region, "บรีฟ").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(`{${MOD}>}c{/${MOD}}`);
    await expect(within(region).getByRole("status")).toHaveTextContent("คัดลอก 1 node");
    await userEvent.pointer({ keys: "[MouseRight]", target: pane, coords: { x: 20, y: 20 } });
    const again = await body().findByRole("menu");
    await expect(
      within(again).getByRole("menuitem", {
        name: new RegExp(commandById("board.paste").label.th),
      }),
    ).not.toHaveAttribute("data-disabled");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/** On an edge: the edge commands; 2 sets the meaning, delete last (AC 8). */
export const OnEdge: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const edge = canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โลโก้" });
    const path = edge.querySelector(".react-flow__edge-interaction, path") as SVGElement;
    await userEvent.pointer({ keys: "[MouseRight]", target: path });
    const menu = await body().findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.length).toBe(surfaceCommands("context-menu", ["edge"]).length);
    await userEvent.click(
      within(menu).getByRole("menuitem", {
        name: new RegExp(commandById("edge.kind-reference").label.th),
      }),
    );
    await waitFor(() =>
      expect(canvas.getByRole("group", { name: "อ้างอิง จาก บรีฟ ไป โลโก้" })).toBeInTheDocument(),
    );
  },
};

/** Shift+F10 on a focused node opens the same menu at it (AC 8). */
export const ShiftF10: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const logo = nodeByTitle(region, "โลโก้");
    logo.focus();
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await body().findByRole("menu");
    await expect(
      within(menu).getByRole("menuitem", { name: new RegExp(commandById("node.rename").label.th) }),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
  },
};

/**
 * "อ้างถึง node นี้ใน prompt" (node.mention, ORV-107): on a node it reaches the shell through
 * onCommand with the node's id; the board adds nothing and changes nothing itself.
 */
export const MentionItem: Story = {
  args: { onCommand: fn() },
  play: async ({ canvasElement, args }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeByTitle(region, "โลโก้") });
    const menu = await body().findByRole("menu");
    const item = within(menu).getByRole("menuitem", { name: "อ้างถึง node นี้ใน prompt" });
    await expect(item).not.toHaveAttribute("data-disabled");
    await userEvent.click(item);
    await expect(args.onCommand).toHaveBeenCalledWith("node.mention", { nodeId: "logo" });
    // Not on the board's own menu or an edge menu: it names a node.
    const pane = region.querySelector(".react-flow__pane") as HTMLElement;
    await userEvent.pointer({ keys: "[MouseRight]", target: pane, coords: { x: 20, y: 20 } });
    const boardMenu = await body().findByRole("menu");
    await expect(
      within(boardMenu).queryByRole("menuitem", { name: "อ้างถึง node นี้ใน prompt" }),
    ).toBeNull();
    await userEvent.keyboard("{Escape}");
  },
};

/** A board with no shell (no onCommand) cannot hand the mention on, so the item is not offered. */
export const MentionItemNoShell: Story = {
  render: () => (
    <div style={{ height: 520 }} className="relative">
      <CanvasBoard graph={BOARD} label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)" minimap={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeByTitle(region, "โลโก้") });
    const menu = await body().findByRole("menu");
    await expect(
      within(menu).queryByRole("menuitem", { name: "อ้างถึง node นี้ใน prompt" }),
    ).toBeNull();
    await expect(
      within(menu).getByRole("menuitem", { name: new RegExp(commandById("node.rename").label.th) }),
    ).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
  },
};

/** Present: right-click opens nothing (AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeByTitle(region, "บรีฟ") });
    await new Promise((r) => setTimeout(r, 150));
    await expect(body().queryByRole("menu")).toBeNull();
  },
};

/** Boards under every profile in both modes; the play opens and closes the menu in each cell. */
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
      await ready(cell);
      await userEvent.pointer({ keys: "[MouseRight]", target: nodeByTitle(cell, "บรีฟ") });
      const menu = await body().findByRole("menu");
      await expect(getComputedStyle(menu).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body().queryByRole("menu")).toBeNull());
    }
  },
};
