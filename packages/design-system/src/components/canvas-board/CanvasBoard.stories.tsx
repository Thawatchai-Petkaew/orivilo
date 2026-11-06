import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { CanvasBoard, GRID_UNIT } from "./CanvasBoard";
import type { Graph } from "./graph";
import { BOARD, BOARD_NODES, LONG_NODE } from "./fixtures";
import { MatrixBoard, Stateful } from "./story-shell";
import { MOD } from "../story-keys";

const meta = {
  title: "Application/Canvas board",
  component: Stateful,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Intent Studio board on React Flow (ADR 0004, E4-2): every visual value from the board, node, port and edge tokens, every key from the command registry. Fixture board, labelled as such; the stories' shell keeps the graph in state and adds a note on board.add-node.",
      },
    },
  },
  args: { initial: BOARD, label: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)" },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__node");
const edgeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__edge");
/**
 * React Flow hides a node until it is measured and draws edges after that. Stories start once every
 * node is measured and every fixture edge is drawn; node elements alone were not enough, so a loaded
 * machine looked for a handle or an edge that was not there yet.
 */
const ready = async (root: HTMLElement) => {
  await waitFor(() => expect(nodeEls(root)).toHaveLength(BOARD_NODES.length));
  await waitFor(() => {
    expect(edgeEls(root)).toHaveLength(BOARD.edges.length);
    for (const n of nodeEls(root)) expect(n.style.visibility).not.toBe("hidden");
  });
};
/**
 * Focus is real browser state: it lands only once the element is mounted and the page is in front,
 * and a re-render can replace the element. A story that presses keys next waits until the element
 * has focus, looking it up again each try, instead of assuming focus() took.
 */
const focusOn = (get: () => HTMLElement) =>
  waitFor(() => {
    const el = get();
    el.focus();
    expect(el).toHaveFocus();
  });
const status = (root: HTMLElement) => within(root).getByRole("status");
// React Flow hides a node until it is measured, so a node's accessible name can lag its element;
// stories look a node up inside waitFor the first time.
const nodeByTitle = (root: HTMLElement, title: string) =>
  within(root).getByRole("group", { name: (name: string) => name.startsWith(`${title},`) });
const handleOf = (root: HTMLElement, nodeId: string, handleId: string) =>
  root.querySelector<HTMLElement>(
    `.react-flow__node[data-id="${nodeId}"] .ds-port__handle[data-handleid="${handleId}"]`,
  ) as HTMLElement;
const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
};
const translateX = (el: HTMLElement) =>
  Number(/translate\(([-\d.]+)px/.exec(el.style.transform)?.[1]);
const translateY = (el: HTMLElement) =>
  Number(/translate\([-\d.]+px,\s*([-\d.]+)px/.exec(el.style.transform)?.[1]);

/** Six fixture nodes, five edges, the region named, the grid painted from the board tokens (AC 2). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)" });
    await ready(region);
    await expect(edgeEls(region)).toHaveLength(BOARD.edges.length);
    await waitFor(() =>
      expect(nodeByTitle(region, "บรีฟ")).toHaveAttribute("aria-label", "บรีฟ, บล็อกป้อนข้อมูล"),
    );
    await expect(
      canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โลโก้" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("group", {
        name: `ป้อนเข้า จาก ${fixtures.mixed} ไป โปรไฟล์ว่าที่ลูกค้า, ล้าสมัย`,
      }),
    ).toBeInTheDocument();
    await expect(getComputedStyle(region).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(region.querySelector(".react-flow__background")).not.toBeNull();
    await expect(canvas.getByText("กำลังทำงาน")).toBeVisible();
    await expect(canvas.getByText("ล็อกแล้ว")).toBeVisible();
    await expect(canvas.getByText("ขาดข้อมูล: สีหลัก, สีรอง")).toBeVisible();
  },
};

/** The empty board's mock action: it names its outcome and starts nothing. */
const addFirst = (label: string) => <Button variant="secondary">{label}</Button>;

/** The length a token resolves to at `el`, in px, as the browser computes it. */
function resolvedLength(el: Element, token: string): number {
  const probe = document.createElement("span");
  probe.style.display = "block";
  probe.style.width = `var(${token})`;
  el.append(probe);
  const px = parseFloat(getComputedStyle(probe).width);
  probe.remove();
  return px;
}

/** The first match of `selector` under `root`; a missing part fails the play with its name. */
function part(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (el === null) throw new Error(`No element matches ${selector}`);
  return el;
}

/** Half a pixel: the browser lays boxes on a 1/64 px grid and the form is centred by halves. */
const HALF_PX = 0.5;

/**
 * The empty form on a board with a toolbar (ORV-223 D15, rows 22, 44 and 45): the form's centre is
 * on the board's centre line across, the action stands at least `space.inset.md` above the toolbar,
 * and the tile is inside the board. Lengths are the resolved tokens, so the play holds under any
 * profile the boundary sets.
 */
async function expectFormClearOfToolbar(root: HTMLElement, actionName: string) {
  const board = part(root, ".ds-board");
  const bar = part(board, ".ds-controls");
  const form = part(board, ".ds-empty-state");
  const tile = part(form, ".ds-featured-icon");
  const action = within(root).getByRole("button", { name: actionName });
  const clear = resolvedLength(board, "--ds-space-inset-md");
  const b = board.getBoundingClientRect();
  const f = form.getBoundingClientRect();
  await expect(Math.abs(f.left + f.width / 2 - (b.left + b.width / 2))).toBeLessThanOrEqual(
    HALF_PX,
  );
  await expect(
    bar.getBoundingClientRect().top - action.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(clear - HALF_PX);
  await expect(tile.getBoundingClientRect().top).toBeGreaterThanOrEqual(b.top);
}

/**
 * Rows 44 and 45: a 294 px board 360 tall wraps its toolbar, and the form still clears it, every
 * button of the toolbar answers a hit test at its own centre, and a status from the first command
 * leaves the pill 8 px under the form. Each button is scrolled into view first, because
 * `elementFromPoint` returns null outside the viewport.
 */
async function expectShortBoardClear(root: HTMLElement, actionName: string, statusText: string) {
  const board = part(root, ".ds-board");
  const bar = part(board, ".ds-controls");
  const buttonHeight = resolvedLength(board, "--cmp-button-height-sm");
  await expect(bar.getBoundingClientRect().height).toBeGreaterThan(2 * buttonHeight);
  await expectFormClearOfToolbar(root, actionName);
  const buttons = [...bar.querySelectorAll<HTMLElement>("button")];
  await expect(buttons).toHaveLength(14);
  for (const button of buttons) {
    button.scrollIntoView({ block: "center", inline: "center" });
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    await expect(hit !== null && button.contains(hit)).toBe(true);
  }
  await userEvent.click(part(bar, '[data-command="board.zoom-in"]'));
  await waitFor(() => expect(within(root).getByRole("status")).toHaveTextContent(statusText));
  const pill = part(board, ".ds-board__status");
  const action = within(root).getByRole("button", { name: actionName });
  const stack = resolvedLength(board, "--ds-space-stack-sm");
  await expect(
    pill.getBoundingClientRect().top - action.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(stack - HALF_PX);
  await expectFormClearOfToolbar(root, actionName);
}

/** No node: a tile, the empty title as a level 2 heading and the consumer's action; nothing else claims content (AC 12). */
export const Empty: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("กระดานยังว่าง")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "เพิ่ม node แรก" })).toBeVisible();
    await expect(nodeEls(canvasElement)).toHaveLength(0);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("กระดานยังว่าง");
    await expect(status(canvasElement)).toHaveTextContent("");
    // Row 19: on a board at least 520 px tall the form's centre is the board's centre.
    const board = part(canvasElement, ".ds-board").getBoundingClientRect();
    await expect(board.height).toBeGreaterThanOrEqual(520);
    const form = part(canvasElement, ".ds-empty-state").getBoundingClientRect();
    await expect(
      Math.abs(form.left + form.width / 2 - (board.left + board.width / 2)),
    ).toBeLessThanOrEqual(HALF_PX);
    await expect(
      Math.abs(form.top + form.height / 2 - (board.top + board.height / 2)),
    ).toBeLessThanOrEqual(HALF_PX);
  },
};

/**
 * The last node is deleted by keyboard: the status line says what went, the region keeps the
 * keyboard (focus does not fall to the body) and Tab reaches the empty form's action after the
 * toolbar.
 */
export const TurnsEmpty: Story = {
  args: {
    initial: { nodes: [BOARD_NODES[0] as (typeof BOARD_NODES)[number]], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(1));
    const node = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => node);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(0));
    await waitFor(() => expect(status(region)).toHaveTextContent("ลบ 1 node"));
    await waitFor(() => expect(canvas.getByRole("heading", { level: 2 })).toBeVisible());
    await waitFor(() => expect(document.activeElement).toBe(region));
    // The toolbar and the attribution link come first in the page order, so the action is the
    // twelfth stop from the region, not the first: Tab until it, with a bound.
    const action = canvas.getByRole("button", { name: "เพิ่ม node แรก" });
    for (let i = 0; i < 14 && document.activeElement !== action; i++) await userEvent.tab();
    await expect(document.activeElement).toBe(action);
  },
};

/**
 * A host that does not write the board's change at once: `apply` decides when the graph the board
 * emitted reaches the `graph` prop. `late` writes a deletion in a later task, after the board's own
 * commit; `refuse` never writes it; `swap` refuses it, then the host puts another node on the
 * board and later takes it away on its own.
 */
function ControlledHost({ apply }: { apply: "late" | "refuse" | "swap" }) {
  const [graph, setGraph] = useState<Graph>({
    nodes: [BOARD_NODES[0] as (typeof BOARD_NODES)[number]],
    edges: [],
  });
  // A parent's effect runs after its child's in the same commit: once this is set, the board's own
  // effect for the empty graph has run, so a play can assert on what it did or did not do.
  const [emptied, setEmptied] = useState(false);
  useEffect(() => {
    if (graph.nodes.length === 0) setEmptied(true);
  }, [graph]);
  return (
    <div style={{ height: 520 }} className="relative" data-emptied={emptied}>
      <CanvasBoard
        graph={graph}
        label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)"
        emptyAction={addFirst("เพิ่ม node แรก")}
        onChange={(next) => {
          // Selection and moves are written at once; only a change that drops a node is held.
          if (next.nodes.length >= graph.nodes.length) setGraph(next);
          else if (apply === "late") setTimeout(() => setGraph(next), 50);
          else if (apply === "swap") {
            const other = BOARD_NODES[1] as (typeof BOARD_NODES)[number];
            setTimeout(() => setGraph({ nodes: [other], edges: [] }), 50);
            setTimeout(() => setGraph({ nodes: [], edges: [] }), 400);
          }
        }}
      />
    </div>
  );
}

/**
 * `empty-focus-1` and `empty-board-1` for a host that applies the delete after the board's own
 * commit (a save, a transition): the board's status line renders first with the node still in the
 * graph, the node leaves later, and the region still takes the keyboard.
 */
export const TurnsEmptyLater: Story = {
  render: () => <ControlledHost apply="late" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    const node = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => node);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    // The status line comes first, with the node still on the board: the host has not written yet.
    await waitFor(() => expect(status(region)).toHaveTextContent("ลบ 1 node"));
    await waitFor(() => expect(nodeEls(region)).toHaveLength(0));
    await waitFor(() => expect(canvas.getByRole("heading", { level: 2 })).toBeVisible());
    await waitFor(() => expect(document.activeElement).toBe(region));
  },
};

/** A delete the host refuses leaves the node and the keyboard where they were. */
export const DeleteRefused: Story = {
  render: () => <ControlledHost apply="refuse" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    const node = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => node);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");

    await waitFor(() => expect(status(region)).toHaveTextContent("ลบ 1 node"));
    await expect(nodeEls(region)).toHaveLength(1);
    await expect(canvas.queryByRole("heading", { level: 2 })).toBeNull();
    await expect(document.activeElement).not.toBe(region);
    await expect(document.activeElement).not.toBe(document.body);
    await expect(node.contains(document.activeElement)).toBe(true);
  },
};

/**
 * A refused delete is over once the host changes the graph: the later empty graph is the host's
 * own doing, so focus is not moved by the stale delete.
 */
export const DeleteRefusedThenSwapped: Story = {
  render: () => <ControlledHost apply="swap" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    const node = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => node);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-emptied="true"]')).not.toBeNull(),
    );
    await expect(canvas.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(document.activeElement).toBe(document.body);
  },
};

/** The empty board in English. */
export const EmptyInEnglish: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("Add your first node"),
  },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { level: 2, name: "The board is empty" }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Add your first node" })).toBeVisible();
  },
};

/** The empty board in a 360 px frame: the form is centred across, clear of the toolbar, and nothing is cut. */
export const EmptyAt360: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  render: (args) => (
    <div data-testid="frame" className="w-[360px] max-w-full">
      <Stateful {...args} height={420} fill={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const frameBox = frame.getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "เพิ่ม node แรก" }).getBoundingClientRect();
    await expect(action.left).toBeGreaterThanOrEqual(frameBox.left);
    await expect(action.right).toBeLessThanOrEqual(frameBox.right);
    const title = canvas.getByRole("heading", { level: 2 }).getBoundingClientRect();
    await expect(title.left).toBeGreaterThanOrEqual(frameBox.left);
    await expect(title.right).toBeLessThanOrEqual(frameBox.right);
    await expectFormClearOfToolbar(canvasElement, "เพิ่ม node แรก");
  },
};

/**
 * The empty board in a 294 px frame, 360 tall: the toolbar wraps and the form rises clear of it,
 * every button stays reachable, and a status from the first command stands under the form
 * (`empty-board-1`, ORV-223 D15).
 */
export const EmptyShort: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  render: (args) => (
    <div className="w-[294px]">
      <Stateful {...args} height={360} fill={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectShortBoardClear(canvasElement, "เพิ่ม node แรก", "ซูมเข้า");
  },
};

/** The short empty board in English. */
export const EmptyShortInEnglish: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("Add your first node"),
  },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: (args) => (
    <div className="w-[294px]">
      <Stateful {...args} height={360} fill={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("heading", { level: 2, name: "The board is empty" }),
    ).toBeVisible();
    await expectShortBoardClear(canvasElement, "Add your first node", "Zoomed in");
  },
};

/** The empty board under the three profiles in both modes, one board per cell. */
export const EmptyRecipesAndModes: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={360} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("heading", { level: 2 })).toHaveLength(6);
  },
};

/** Loading: the region is busy and says so (AC 12). */
export const Loading: Story = {
  args: { initial: { nodes: [], edges: [] }, loading: true },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await expect(region).toHaveAttribute("aria-busy", "true");
    await expect(within(region).getByText("กำลังโหลดกระดาน")).toBeVisible();
  },
};

/** Present: read-only, ports disabled, Delete and the editing shortcuts do nothing, Tab still moves (E4-2 AC 11, E4-3 AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    await expect(canvas.getByText("ดูอย่างเดียว")).toBeVisible();
    await expect(canvas.getAllByRole("img", { name: /แก้ไขไม่ได้$/ }).length).toBeGreaterThan(5);
    const logo = await waitFor(() => nodeByTitle(region, "โลโก้"));
    await focusOn(() => logo);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await userEvent.keyboard("c");
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length);
    await waitFor(() => expect(status(region)).toHaveTextContent(""));
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await waitFor(() => expect(nodeByTitle(region, "บรีฟ")).toHaveFocus());
    // E4-3: no node toolbar, no context menu, controls keep only the viewport commands.
    await userEvent.click(nodeByTitle(region, "บรีฟ"));
    await expect(canvas.queryByRole("toolbar", { name: /เครื่องมือของ/ })).toBeNull();
    const bar = canvas.getByRole("toolbar", { name: "เครื่องมือกระดาน" });
    await expect(bar.querySelector('[data-command="board.add-node"]')).toBeNull();
    await expect(bar.querySelector('[data-command="board.zoom-to-fit"]')).not.toBeNull();
  },
};

/** C on a focused node, arrows to pick, Enter to connect, Escape to cancel (AC 6). */
export const KeyboardConnect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const before = edgeEls(region).length;
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("c");
    // Text goes to the two unconnected text inputs: the note (nearest) and the palette.
    await waitFor(() =>
      expect(status(region)).toHaveTextContent("ต่อสายจาก บรีฟ: เป้าหมาย โน้ต (1 จาก 2)"),
    );
    await expect(region.querySelectorAll('.ds-port[data-state="connecting"]')).toHaveLength(1);
    await expect(region.querySelectorAll('.ds-port[data-state="valid-target"]')).toHaveLength(1);
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`เป้าหมาย ${fixtures.mixed} (2 จาก 2)`),
    );
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(status(region)).toHaveTextContent("เป้าหมาย โน้ต (1 จาก 2)"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(status(region)).toHaveTextContent("ยกเลิกการต่อสาย"));
    await expect(edgeEls(region)).toHaveLength(before);
    await userEvent.keyboard("c");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(edgeEls(region)).toHaveLength(before + 1));
    await waitFor(() => expect(status(region)).toHaveTextContent("เชื่อม บรีฟ ไป โน้ต แล้ว"));
    await expect(
      canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โน้ต" }),
    ).toBeInTheDocument();
    await expect(brief).toHaveFocus();
    // A node without an output port says so.
    await focusOn(() => nodeByTitle(region, "โน้ต"));
    await userEvent.keyboard("c");
    await waitFor(() => expect(status(region)).toHaveTextContent("โน้ต ไม่มีพอร์ตส่ง"));
  },
};

/** Enter selects, an arrow moves one grid unit, Shift and an arrow ten, the move is announced (AC 7). */
export const KeyboardNudge: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(brief).toHaveClass("selected"));
    const x = translateX(brief);
    const y = translateY(brief);
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(translateX(brief)).toBe(x + GRID_UNIT));
    await waitFor(() => expect(status(region)).toHaveTextContent("ขยับ 1 node ไปขวา 1 หน่วยกริด"));
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await waitFor(() => expect(translateY(brief)).toBe(y + 10 * GRID_UNIT));
    await waitFor(() => expect(status(region)).toHaveTextContent("ขยับ 1 node ไปลง 10 หน่วยกริด"));
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(translateY(brief)).toBe(y + 9 * GRID_UNIT));
  },
};

/** Delete removes the selected node and its edges; downstream nodes stay and read stale (AC 8). */
export const KeyboardDelete: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const logo = await waitFor(() => nodeByTitle(region, "โลโก้"));
    await focusOn(() => logo);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length - 1));
    await expect(canvas.queryByRole("group", { name: /^โลโก้,/ })).toBeNull();
    // The palette and the profile are downstream of the logo: both read stale now.
    await waitFor(() => expect(nodeByTitle(region, fixtures.mixed)).toHaveTextContent("ล้าสมัย"));
    await waitFor(() =>
      expect(nodeByTitle(region, "โปรไฟล์ว่าที่ลูกค้า")).toHaveTextContent("ล้าสมัย"),
    );
    await waitFor(() => expect(nodeByTitle(region, "บรีฟ")).not.toHaveTextContent("ล้าสมัย"));
    await expect(edgeEls(region)).toHaveLength(BOARD.edges.length - 2);
    await waitFor(() => expect(status(region)).toHaveTextContent("ลบ 1 node และ 2 สาย"));
    await waitFor(() => expect(status(region)).toHaveTextContent("node ปลายทางล้าสมัย"));
    // An edge alone: Tab to it, Delete, the nodes stay.
    const edge = canvas.getByRole("group", { name: "อ้างอิง จาก บรีฟ ไป Type direction" });
    await focusOn(() => edge);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(edgeEls(region)).toHaveLength(BOARD.edges.length - 3));
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length - 1);
  },
};

/** Dragging a port: compatible targets light up, a wrong kind explains itself, a right one connects (AC 4, 9). */
export const PointerConnect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const before = edgeEls(region).length;
    const from = handleOf(region, "brief", "text");
    const wrong = handleOf(region, "palette", "image");
    const right = handleOf(region, "palette", "text");
    // One pointer across the whole drag, so the release is the press's release.
    const user = userEvent.setup();
    // Start on the text output, move over the image input: the drag shows which ports accept text.
    await user.pointer([
      { keys: "[MouseLeft>]", target: from, coords: center(from) },
      { target: region, coords: { x: center(from).x + 40, y: center(from).y + 10 } },
      { target: wrong, coords: center(wrong) },
    ]);
    await expect(from.closest(".ds-port")).toHaveAttribute("data-state", "connecting");
    await expect(right.closest(".ds-port")).toHaveAttribute("data-state", "valid-target");
    await expect(wrong.closest(".ds-port")).toHaveAttribute("data-state", "invalid-target");
    await user.pointer([{ keys: "[/MouseLeft]", target: wrong, coords: center(wrong) }]);
    await expect(edgeEls(region)).toHaveLength(before);
    await waitFor(() =>
      expect(status(region)).toHaveTextContent("พอร์ตภาพรับได้เฉพาะภาพ แต่สายนี้ส่งข้อความ"),
    );
    await user.pointer([
      { keys: "[MouseLeft>]", target: from, coords: center(from) },
      { target: region, coords: { x: center(from).x + 40, y: center(from).y + 10 } },
      { target: right, coords: center(right) },
      { keys: "[/MouseLeft]", target: right, coords: center(right) },
    ]);
    await waitFor(() => expect(edgeEls(region)).toHaveLength(before + 1));
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`เชื่อม บรีฟ ไป ${fixtures.mixed} แล้ว`),
    );
    await expect(from.closest(".ds-port")).toHaveAttribute("data-state", "connected");
  },
};

/** Dragging on empty board draws the selection rectangle and selects what it touches (AC 13). */
export const BoxSelecting: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const pane = region.querySelector<HTMLElement>(".react-flow__pane") as HTMLElement;
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    const b = brief.getBoundingClientRect();
    const start = { x: Math.round(b.left - 8), y: Math.round(b.top - 8) };
    const end = { x: Math.round(b.left + 40), y: Math.round(b.top + 40) };
    const user = userEvent.setup();
    await user.pointer([
      { keys: "[MouseLeft>]", target: pane, coords: start },
      { target: pane, coords: { x: start.x + 10, y: start.y + 10 } },
      { target: pane, coords: end },
    ]);
    await expect(region.querySelector(".react-flow__selection")).not.toBeNull();
    const rect = region.querySelector(".react-flow__selection") as HTMLElement;
    await expect(getComputedStyle(rect).borderColor).not.toBe("rgba(0, 0, 0, 0)");
    await user.pointer([{ keys: "[/MouseLeft]", target: pane, coords: end }]);
    await waitFor(() => expect(brief).toHaveClass("selected"));
    await expect(region.querySelectorAll(".react-flow__node.selected")).toHaveLength(1);
  },
};

/** Select all, disconnect, set a meaning, jump along an edge, rename and add through the shell (AC 10). */
export const RegistryCommands: Story = {
  args: { onCommand: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await waitFor(() =>
      expect(region.querySelectorAll(".react-flow__node.selected")).toHaveLength(
        BOARD_NODES.length,
      ),
    );
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`เลือกทั้งหมด ${BOARD_NODES.length} node`),
    );
    await userEvent.keyboard("{Escape}");
    // React Flow blurs the node on Escape in the next animation frame; refocusing before that
    // frame gets undone, so wait for the blur first.
    await waitFor(() => expect(document.activeElement).toBe(document.body));
    // Alt+ArrowRight goes downstream, Alt+ArrowLeft back.
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await waitFor(() => expect(nodeByTitle(region, "โลโก้")).toHaveFocus());
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect(brief).toHaveFocus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await waitFor(() => expect(status(region)).toHaveTextContent("ไม่มี node ต้นทาง"));
    // 2 on a focused edge sets it to reference.
    const edge = canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โลโก้" });
    await focusOn(() => edge);
    await userEvent.keyboard("2");
    await waitFor(() =>
      expect(canvas.getByRole("group", { name: "อ้างอิง จาก บรีฟ ไป โลโก้" })).toBeInTheDocument(),
    );
    await waitFor(() => expect(status(region)).toHaveTextContent("ตั้งสายเป็นอ้างอิง"));
    // F2 asks the shell to rename; N asks it to add a node, which the story's shell does.
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{F2}");
    await expect(args.onCommand).toHaveBeenCalledWith("node.rename", { nodeId: "brief" });
    await focusOn(() => region);
    await userEvent.keyboard("n");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await expect(args.onCommand).toHaveBeenCalledWith(
      "board.add-node",
      expect.objectContaining({ position: expect.anything() }),
    );
    // Mod+Shift+X cuts every edge of the focused node.
    await focusOn(() => nodeByTitle(region, "โลโก้"));
    await userEvent.keyboard(`{${MOD}>}{Shift>}x{/Shift}{/${MOD}}`);
    await waitFor(() => expect(edgeEls(region)).toHaveLength(BOARD.edges.length - 2));
    await waitFor(() => expect(status(region)).toHaveTextContent("ตัดสาย 2 เส้นของ โลโก้"));
  },
};

/** The shell's generation status shows in the one status line (catalog a11y). */
export const WithStatus: Story = {
  args: { status: "กำลังสร้างโลโก้ รอบที่ 2 (จำลอง)" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent("กำลังสร้างโลโก้ รอบที่ 2 (จำลอง)"),
    );
  },
};

/** The same board under neutral, Professional and Friendly in both modes: the canvas groups are locked, only shared tokens change. */
export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={360} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await waitFor(() => expect(nodeEls(cell as HTMLElement)).toHaveLength(BOARD_NODES.length));
    }
  },
};

/** 360 px: a node with the long Thai title and the long Latin summary wraps inside its width. */
export const LongContentAt360: Story = {
  args: { initial: { nodes: [LONG_NODE], edges: [] } },
  render: (args) => (
    <Narrow>
      <Stateful {...args} height={420} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(1));
    const node = region.querySelector(".ds-node") as HTMLElement;
    const title = within(node).getByText(fixtures.longThai);
    await expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
      node.getBoundingClientRect().right + 1,
    );
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
  },
};

const selectedCount = (root: HTMLElement) =>
  root.querySelectorAll(".react-flow__node.selected").length;

/** Mod+C then Mod+V adds a copy two grid units away and selects it; Mod+D duplicates; Mod+X removes the original and marks downstream stale (AC 12). */
export const Clipboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    const x = translateX(brief);
    const y = translateY(brief);
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(`{${MOD}>}c{/${MOD}}`);
    await waitFor(() => expect(status(region)).toHaveTextContent("คัดลอก 1 node ไว้บนกระดาน"));
    await userEvent.keyboard(`{${MOD}>}v{/${MOD}}`);
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await waitFor(() => expect(status(region)).toHaveTextContent("วาง 1 node แล้ว"));
    const copies = canvas.getAllByRole("group", { name: /^บรีฟ,/ });
    await expect(copies).toHaveLength(2);
    const copy = copies.find((c) => c !== brief) as HTMLElement;
    await waitFor(() => expect(translateX(copy)).toBe(x + 2 * GRID_UNIT));
    await expect(translateY(copy)).toBe(y + 2 * GRID_UNIT);
    await expect(copy).toHaveClass("selected");
    await expect(brief).not.toHaveClass("selected");
    // Mod+D on the copy: a third brief, selected alone.
    await focusOn(() => copy);
    await userEvent.keyboard(`{${MOD}>}d{/${MOD}}`);
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 2));
    await expect(selectedCount(region)).toBe(1);
    // Mod+X on the logo removes it; its downstream palette turns stale.
    const logo = await waitFor(() => nodeByTitle(region, "โลโก้"));
    await focusOn(() => logo);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(`{${MOD}>}x{/${MOD}}`);
    await waitFor(() => expect(canvas.queryByRole("group", { name: /^โลโก้,/ })).toBeNull());
    await waitFor(() => expect(status(region)).toHaveTextContent("ตัด 1 node ไว้บนกระดาน"));
    await expect(region.querySelector('.ds-node[data-status="stale"]')).not.toBeNull();
    await userEvent.keyboard(`{${MOD}>}v{/${MOD}}`);
    await waitFor(() => expect(canvas.getByRole("group", { name: /^โลโก้,/ })).toBeInTheDocument());
  },
};

/** Align, distribute, order, lock and collapse on a selection (AC 13). */
export const Arrange: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    const note = await waitFor(() => nodeByTitle(region, "โน้ต"));
    const type = await waitFor(() => nodeByTitle(region, "Type direction"));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await waitFor(() => expect(selectedCount(region)).toBe(BOARD_NODES.length));
    // Alt+A: every node's left edge moves to the leftmost (brief and note at x 0).
    await userEvent.keyboard("{Alt>}a{/Alt}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`จัดแนวซ้าย ${BOARD_NODES.length} node`),
    );
    await waitFor(() => expect(translateX(type)).toBe(translateX(brief)));
    // Alt+V: equal gaps top to bottom; the first and last stay where they were.
    const topBefore = Math.min(...Array.from(nodeEls(region)).map(translateY));
    await userEvent.keyboard("{Alt>}v{/Alt}");
    await waitFor(() => expect(status(region)).toHaveTextContent("กระจายแนวตั้ง"));
    await waitFor(() =>
      expect(Math.min(...Array.from(nodeEls(region)).map(translateY))).toBe(topBefore),
    );
    // ] brings the selection to the front: a zIndex above every other node.
    await userEvent.keyboard("]");
    await waitFor(() => expect(status(region)).toHaveTextContent("ย้ายมาหน้าสุด"));
    await waitFor(() => expect(Number(brief.style.zIndex)).toBeGreaterThan(0));
    // Mod+Shift+L locks the selection; the status word appears on the note.
    await userEvent.keyboard(`{${MOD}>}{Shift>}l{/Shift}{/${MOD}}`);
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`ล็อก ${BOARD_NODES.length} node แล้ว`),
    );
    await waitFor(() =>
      expect(note.querySelector(".ds-node")).toHaveAttribute("data-status", "locked"),
    );
    await userEvent.keyboard(`{${MOD}>}{Shift>}l{/Shift}{/${MOD}}`);
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`ปลดล็อก ${BOARD_NODES.length} node แล้ว`),
    );
    // Mod+. collapses the selection.
    await userEvent.keyboard(`{${MOD}>}.{/${MOD}}`);
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`ย่อ ${BOARD_NODES.length} node แล้ว`),
    );
    await waitFor(() =>
      expect(region.querySelectorAll(".ds-node[data-collapsed]")).toHaveLength(BOARD_NODES.length),
    );
  },
};

/** Mod+Shift+N on a node adds a note one grid unit to its right, selected alone (AC 14). */
export const AddNote: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    const brief = await waitFor(() => nodeByTitle(region, "บรีฟ"));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard(`{${MOD}>}{Shift>}n{/Shift}{/${MOD}}`);
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await waitFor(() => expect(status(region)).toHaveTextContent("เพิ่มโน้ตข้าง บรีฟ"));
    const notes = canvas.getAllByRole("group", { name: /^โน้ต,/ });
    const added = notes.find((n) => n.classList.contains("selected")) as HTMLElement;
    await expect(added).toBeDefined();
    await expect(selectedCount(region)).toBe(1);
    const right = translateX(brief) + brief.getBoundingClientRect().width / zoomOf(region);
    await waitFor(() => expect(translateX(added)).toBeCloseTo(right + GRID_UNIT, 0));
    await expect(translateY(added)).toBe(translateY(brief));
  },
};

const zoomOf = (root: HTMLElement) => {
  const viewport = root.querySelector<HTMLElement>(".react-flow__viewport") as HTMLElement;
  return Number(/scale\(([\d.]+)\)/.exec(viewport.style.transform)?.[1] ?? 1);
};

/** Zoom keys, 100 percent, fit, pan or select and snap, each said in the status line (AC 15). */
export const Viewport: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    await focusOn(() => region);
    const start = zoomOf(region);
    await userEvent.keyboard(`{${MOD}>}={/${MOD}}`);
    await waitFor(() => expect(status(region)).toHaveTextContent("ซูมเข้า"));
    await waitFor(() => expect(zoomOf(region)).toBeGreaterThan(start));
    await userEvent.keyboard(`{${MOD}>}0{/${MOD}}`);
    await waitFor(() => expect(status(region)).toHaveTextContent("ซูม 100%"));
    await waitFor(() => expect(zoomOf(region)).toBe(1));
    await expect(within(region).getByRole("button", { name: /ซูม 100/ })).toHaveTextContent("100%");
    await userEvent.keyboard(`{${MOD}>}-{/${MOD}}`);
    await waitFor(() => expect(status(region)).toHaveTextContent("ซูมออก"));
    await waitFor(() => expect(zoomOf(region)).toBeLessThan(1));
    await userEvent.keyboard("{Shift>}1{/Shift}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`พอดีจอ ${BOARD_NODES.length} node`),
    );
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Shift>}2{/Shift}");
    await waitFor(() => expect(status(region)).toHaveTextContent("พอดีจอกับ 1 node ที่เลือก"));
    await userEvent.keyboard("h");
    await waitFor(() => expect(status(region)).toHaveTextContent("โหมดเลื่อนกระดาน"));
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "pan");
    await expect(within(region).getByRole("radio", { name: /โหมดเลื่อนกระดาน/ })).toHaveAttribute(
      "data-state",
      "on",
    );
    await userEvent.keyboard("v");
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "select");
    await userEvent.keyboard("{Shift>}g{/Shift}");
    await waitFor(() => expect(status(region)).toHaveTextContent("ปิดการดูดเข้ากริด"));
    await expect(region).not.toHaveAttribute("data-snap");
  },
};

/** Without chrome: no controls, no menus, no sheet; the keyboard still works (shell-composed layouts). */
export const WithoutChrome: Story = {
  args: { chrome: false },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await ready(region);
    await expect(within(region).queryByRole("toolbar", { name: "เครื่องมือกระดาน" })).toBeNull();
    await focusOn(() => region);
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await expect(within(document.body).queryByRole("dialog")).toBeNull();
    await userEvent.keyboard(`{${MOD}>}={/${MOD}}`);
    await waitFor(() => expect(status(region)).toHaveTextContent("ซูมเข้า"));
  },
};

/**
 * The toolbar's English locale reaches the board through the provider (spec ORV-39 AC 6, 7):
 * accessible names, the live region and the chrome speak English; node titles stay the author's.
 */
export const English: Story = {
  globals: { locale: "en" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    await waitFor(() =>
      expect(nodeByTitle(region, "บรีฟ")).toHaveAttribute("aria-label", "บรีฟ, input block"),
    );
    await expect(
      canvas.getByRole("group", { name: "input from บรีฟ to โลโก้" }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("toolbar", { name: "Board tools" })).toBeInTheDocument();
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`Selected all ${BOARD_NODES.length} nodes`),
    );
    await userEvent.keyboard("{Escape}");
    // React Flow blurs the node on Escape in the next animation frame; refocusing before that
    // frame gets undone, so wait for the blur first.
    await waitFor(() => expect(document.activeElement).toBe(document.body));
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await waitFor(() => expect(status(region)).toHaveTextContent("No upstream node"));
    await expect(region.querySelector(".ds-node__kind")).toHaveTextContent("input block");
  },
};
