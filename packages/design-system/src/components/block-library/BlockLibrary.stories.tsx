import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { placeBlock } from "../../blocks/index";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import type { Graph } from "../canvas-board/graph";
import { fillHeight, Matrix } from "../matrix";
import { BlockLibrary } from "./BlockLibrary";
import { MIDWAY } from "./fixtures";

/** The shell's side for stories: the graph in state, and `placeBlock` for each placed tile. */
function ShelfBoard({ initial = MIDWAY, height = 640 }: { initial?: Graph; height?: number }) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div style={{ height: fillHeight(height) }}>
      <CanvasBoard
        label={`กระดาน Intent Studio${scope ? `, ${id} ${scope.mode}` : ""}`}
        graph={graph}
        onChange={setGraph}
      >
        <BlockLibrary
          onPlace={(block, position) =>
            setGraph((g) =>
              placeBlock(g, block, `${block.id}-${g.nodes.length + 1}`, position, "th"),
            )
          }
        />
      </CanvasBoard>
    </div>
  );
}

const meta = {
  title: "Application/Block library",
  component: BlockLibrary,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The shelf of every block the board can hold (ORV-44 part 2), glass at the bottom of the board, grouped by module. Each tile says in words and a mark whether its node is on the board and how full it is. Drag or press Enter to place; a block already on the board is selected instead.",
      },
    },
  },
  args: { onPlace: () => undefined },
} satisfies Meta<typeof BlockLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

const shelf = (root: HTMLElement) => within(root).getByRole("group", { name: "คลังบล็อก" });
const tile = (root: HTMLElement, name: string) =>
  within(shelf(root)).getByRole("button", {
    name: (accessible: string) => accessible.startsWith(name),
  });

/**
 * The board is usable once React Flow has measured every node (it hides a node until then). Tile
 * states, drops and the viewport centre all read the measured board, so a loaded machine looked
 * too early; each story that touches the board waits for it first.
 */
const ready = async (root: HTMLElement) => {
  await waitFor(() => {
    const nodes = root.querySelectorAll<HTMLElement>(".react-flow__node");
    expect(nodes).toHaveLength(MIDWAY.nodes.length);
    for (const n of nodes) expect(n.style.visibility).not.toBe("hidden");
  });
};

/** Every block by module, each with its state as a word and a mark: not on the board, empty, partial, summarized, unlinked. */
export const Default: Story = {
  render: () => <ShelfBoard />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    // The board fills the viewport and is never shorter than its 640 px (spec ORV-189, `fill-height-1`).
    const board = canvasElement.querySelector(".ds-board");
    await expect(board?.getBoundingClientRect().height).toBe(Math.max(640, window.innerHeight));
    const s = within(shelf(canvasElement));
    await expect(s.getByRole("heading", { name: "แบรนด์" })).toBeVisible();
    await expect(s.getByRole("heading", { name: "ระบบออกแบบ" })).toBeVisible();
    await expect(s.getAllByRole("button")).toHaveLength(16);
    const states: [string, string, string][] = [
      ["ฟอนต์", "absent", "ยังไม่วาง"],
      ["มู้ดและธีม", "empty", "ยังว่าง"],
      ["บรีฟ", "partial", "ถามอีก 1 ข้อ"],
      ["สีตั้งต้น", "summarized", "สรุปแล้ว"],
      ["บุคลิกแบรนด์", "unlinked", "ยังไม่เชื่อม"],
    ];
    for (const [name, state, word] of states) {
      const t = tile(canvasElement, name);
      await expect(t).toHaveAttribute("data-state", state);
      await expect(t).toHaveTextContent(word);
    }
    // A summarized colour block shows its swatches.
    await expect(
      tile(canvasElement, "สีตั้งต้น").querySelectorAll(".ds-node__swatch"),
    ).toHaveLength(2);
  },
};

/** Enter on a tile not on the board places its node at the viewport centre, selected, and says so. */
export const PlaceByKeyboard: Story = {
  render: () => <ShelfBoard />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const font = tile(canvasElement, "ฟอนต์");
    await waitFor(() => {
      font.focus();
      expect(font).toHaveFocus();
    });
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-node")).toHaveLength(7));
    const placed = [...canvasElement.querySelectorAll<HTMLElement>(".ds-node")].at(
      -1,
    ) as HTMLElement;
    await expect(placed).toHaveAttribute("data-selected", "");
    await waitFor(() => expect(within(placed).getByText("ยังว่าง")).toBeVisible());
    await expect(within(shelf(canvasElement)).getByRole("status")).toHaveTextContent(
      "วาง ฟอนต์ บนกระดานแล้ว",
    );
    await waitFor(() =>
      expect(tile(canvasElement, "ฟอนต์")).toHaveAttribute("data-state", "empty"),
    );
  },
};

/** A tile already on the board selects and fits its node instead of adding a second one. */
export const SelectExisting: Story = {
  render: () => <ShelfBoard />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    await userEvent.click(tile(canvasElement, "บรีฟ"));
    await expect(canvasElement.querySelectorAll(".ds-node")).toHaveLength(6);
    await waitFor(() =>
      expect(document.activeElement?.closest(".react-flow__node")).toHaveAttribute(
        "data-id",
        "brief",
      ),
    );
  },
};

/** Dropping a dragged tile on the board places the node at the drop point. */
export const PlaceByDrag: Story = {
  render: () => <ShelfBoard />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const icon = tile(canvasElement, "ไอคอน");
    const pane = canvasElement.querySelector(".react-flow__pane") as HTMLElement;
    const data = new DataTransfer();
    icon.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: data }));
    const box = pane.getBoundingClientRect();
    const at = { clientX: box.left + 80, clientY: box.top + 80 };
    pane.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: data, ...at }),
    );
    pane.dispatchEvent(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data, ...at }),
    );
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-node")).toHaveLength(7));
    const placed = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id^="icon-"]');
    await expect(placed).not.toBeNull();
    const nodeBox = (placed as HTMLElement).getBoundingClientRect();
    await expect(Math.abs(nodeBox.left - at.clientX)).toBeLessThan(24);
    await expect(Math.abs(nodeBox.top - at.clientY)).toBeLessThan(24);
  },
};

/** Search by Thai or English name; no match says so; arrow keys move between the tiles left. */
export const Search: Story = {
  render: () => <ShelfBoard />,
  play: async ({ canvasElement }) => {
    const s = within(shelf(canvasElement));
    const search = s.getByRole("searchbox", { name: "ค้นหาบล็อก" });
    await userEvent.type(search, "colour");
    await expect(s.getAllByRole("button").map((b) => b.dataset["block"])).toEqual([
      "typed-colours",
      "starter-colours",
    ]);
    await userEvent.tab();
    await expect(document.activeElement).toHaveAttribute("data-block", "typed-colours");
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toHaveAttribute("data-block", "starter-colours");
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toHaveAttribute("data-block", "typed-colours");
    await userEvent.clear(search);
    await userEvent.type(search, "ฟอนต์");
    await expect(s.getAllByRole("button")).toHaveLength(1);
    await userEvent.clear(search);
    await userEvent.type(search, "โลโก้ใหม่");
    await expect(s.getByText('ไม่พบบล็อกที่ตรงกับ "โลโก้ใหม่"')).toBeVisible();
  },
};

/** An empty board: every tile is not on the board yet, each with a dashed edge. */
export const EmptyBoard: Story = {
  render: () => <ShelfBoard initial={{ nodes: [], edges: [] }} />,
  play: async ({ canvasElement }) => {
    const tiles = within(shelf(canvasElement)).getAllByRole("button");
    for (const t of tiles) await expect(t).toHaveAttribute("data-state", "absent");
    await expect(getComputedStyle(tiles[0] as HTMLElement).borderTopStyle).toBe("dashed");
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <ShelfBoard height={520} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-shelf")).toHaveLength(6));
    // A board in a Matrix cell keeps its 520 px (spec ORV-189, `matrix-keep-1`).
    const boards = [...canvasElement.querySelectorAll(".ds-board")];
    await expect(boards).toHaveLength(6);
    for (const board of boards) await expect(board.getBoundingClientRect().height).toBe(520);
  },
};
