import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { placeBlock } from "../../blocks/index";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import type { Graph } from "../canvas-board/graph";
import { fixtureJobs } from "../fixtures";
import { fillHeight, Matrix, Narrow as NarrowFrame } from "../matrix";
import { TaskBar } from "../task-bar/TaskBar";
import { BlockLibrary } from "./BlockLibrary";
import { MIDWAY } from "./fixtures";

/** The shell's side for stories: the graph in state, and `placeBlock` for each placed tile. */
function ShelfBoard({
  initial = MIDWAY,
  height = 640,
  children,
}: {
  initial?: Graph;
  height?: number;
  children?: ReactNode;
}) {
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
        {children}
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

const SHELF = ".react-flow__panel.ds-shelf";
const part = (board: HTMLElement, selector: string) =>
  (board.querySelector(selector) as HTMLElement).getBoundingClientRect();

/**
 * shelf-gap-1 and shelf-edge-1 (ORV-190): the gap from the shelf to the board's left edge equals
 * the gap to its right edge, and the shelf starts on the canvas controls' start edge. xyflow's
 * centring shift left the shelf 15 px left of centre (gaps 1 and 31).
 */
const expectCentred = (board: HTMLElement) => {
  const b = board.getBoundingClientRect();
  const s = part(board, SHELF);
  const c = part(board, ".react-flow__panel.ds-controls");
  expect(Math.abs(s.left - b.left - (b.right - s.right))).toBeLessThanOrEqual(1);
  expect(Math.abs(s.left - c.left)).toBeLessThanOrEqual(1);
};

/** shelf-rise-1: the shelf's bottom edge sits this far above the board's bottom edge (neutral profile). */
const expectRise = (board: HTMLElement, rise: number) => {
  const b = board.getBoundingClientRect();
  const s = part(board, SHELF);
  expect(Math.abs(b.bottom - s.bottom - rise)).toBeLessThanOrEqual(1);
};

const boardOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-board") as HTMLElement;

const FIRST_TILE = "โลโก้ที่มีอยู่";
const LAST_TILE = "สองทิศทาง";

/** The 2 px outline and the 2 px offset of `:focus-visible` (orivilo.css). */
const RING_REACH = 4;

/**
 * shelf-ring-1: the tile has keyboard focus and its whole ring, four sides, fits inside the
 * scrolling row's box. Focus scrolls the tile into view, so the check waits for the scroll.
 */
const expectRingWhole = async (root: HTMLElement, name: string) => {
  const t = tile(root, name);
  const g = root.querySelector(".ds-shelf__groups") as HTMLElement;
  await waitFor(() => {
    expect(t).toHaveFocus();
    expect(t.matches(":focus-visible")).toBe(true);
    const tb = t.getBoundingClientRect();
    const gb = g.getBoundingClientRect();
    expect(tb.left - RING_REACH).toBeGreaterThanOrEqual(gb.left - 0.01);
    expect(tb.right + RING_REACH).toBeLessThanOrEqual(gb.right + 0.01);
    expect(tb.top - RING_REACH).toBeGreaterThanOrEqual(gb.top - 0.01);
    expect(tb.bottom + RING_REACH).toBeLessThanOrEqual(gb.bottom + 0.01);
  });
};

/** From the search field, Tab lands on the shelf's one tab stop, the first tile; End goes to the last. */
const focusFirstTile = async (root: HTMLElement) => {
  within(shelf(root)).getByRole("searchbox", { name: "ค้นหาบล็อก" }).focus();
  await userEvent.tab();
};

/** The ring of the first and then the last tile is whole; the first tile has not moved for the row. */
const expectRings = async (root: HTMLElement) => {
  await focusFirstTile(root);
  await expectRingWhole(root, FIRST_TILE);
  // The row adds no offset: the tile starts the 1 px border plus --cmp-shelf-padding (16) inside the shelf.
  expect(
    Math.abs(tile(root, FIRST_TILE).getBoundingClientRect().left - part(root, SHELF).left - 17),
  ).toBeLessThanOrEqual(0.5);
  await userEvent.keyboard("{End}");
  await expectRingWhole(root, LAST_TILE);
};

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
    // ORV-190: the shelf is centred on the board, on the controls' start edge, at its old height.
    expectCentred(boardOf(canvasElement));
    expectRise(boardOf(canvasElement), 88);
    await expectRings(canvasElement);
  },
};

/** ORV-190: a 360 px board. The shelf is centred with the same gaps, its title and search stay inside, the rings are whole. */
export const Narrow: Story = {
  render: () => (
    <NarrowFrame>
      <ShelfBoard />
    </NarrowFrame>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const board = boardOf(canvasElement);
    await expect(Math.round(board.getBoundingClientRect().width)).toBe(360);
    expectCentred(board);
    const s = part(board, SHELF);
    const inShelf = within(shelf(canvasElement));
    for (const el of [
      inShelf.getByRole("heading", { name: "คลังบล็อก" }),
      inShelf.getByRole("searchbox", { name: "ค้นหาบล็อก" }),
    ]) {
      const box = el.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(s.left);
      await expect(box.right).toBeLessThanOrEqual(s.right);
    }
    await expectRings(canvasElement);
  },
};

/** ORV-190: with the collapsed task bar (mock jobs) the shelf shares both edges with the bar and keeps its lift above it. */
export const WithTaskBar: Story = {
  render: () => (
    <ShelfBoard>
      <TaskBar
        jobs={[fixtureJobs.failed, fixtureJobs.running, fixtureJobs.done, fixtureJobs.longName]}
        defaultExpanded={false}
      />
    </ShelfBoard>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement);
    const board = boardOf(canvasElement);
    expectCentred(board);
    expectRise(board, 162);
    const s = part(board, SHELF);
    const bar = part(board, ".ds-taskbar");
    await expect(Math.abs(s.left - bar.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(s.right - bar.right)).toBeLessThanOrEqual(1);
    await expect(s.bottom).toBeLessThanOrEqual(bar.top);
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
    // ORV-190: each shelf is centred in its own board, under every profile and mode.
    // ORV-189 (`matrix-keep-1`): a board in a Matrix cell keeps its 520 px.
    const boards = [...canvasElement.querySelectorAll<HTMLElement>(".ds-board")];
    await expect(boards).toHaveLength(6);
    for (const board of boards) {
      const b = board.getBoundingClientRect();
      await expect(b.height).toBe(520);
      const s = part(board, SHELF);
      await expect(Math.abs(s.left - b.left - (b.right - s.right))).toBeLessThanOrEqual(1);
    }
  },
};
