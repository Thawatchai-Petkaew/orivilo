import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectCoversInk,
  expectEdgeInk,
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectPillsClear,
  inVitest,
} from "../../testing/visual-asserts";
import { atWindow } from "../../testing/window";
import { Button } from "../button/Button";
import { fixtureManyJobs, fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { TaskBar } from "../task-bar/TaskBar";
import { CanvasBoard, GRID_UNIT } from "./CanvasBoard";
import { layoutPills } from "./pill-layout";
import type { BoardNode, Graph } from "./graph";
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

/** The computed colour of a token, read through a probe, so both sides use one serialisation. */
function colourOf(root: HTMLElement, cssVar: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${cssVar})`;
  root.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

/** The zoom the viewport has, read from its transform. */
const viewportZoom = (board: Element) =>
  parseFloat(
    /scale\(([\d.]+)\)/.exec(
      board.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform ?? "",
    )?.[1] ?? "NaN",
  );

/** The pitch of the board's dots as drawn: the width of React Flow's pattern cell, in screen px. */
const dotPitch = (board: Element) =>
  Number(board.querySelector(".react-flow__background pattern")?.getAttribute("width"));

/** A child of the board that hands the story React Flow's instance, to set the zoom. */
let boardFlow: ReactFlowInstance | undefined;
function ZoomHandle() {
  const flow = useReactFlow();
  useEffect(() => {
    boardFlow = flow;
    return () => {
      boardFlow = undefined;
    };
  }, [flow]);
  return null;
}

/** Sets the zoom and waits until the viewport holds it. */
const zoomTo = (board: Element, zoom: number) =>
  waitFor(async () => {
    await boardFlow?.zoomTo(zoom, { duration: 0 });
    expect(viewportZoom(board)).toBeCloseTo(zoom, 3);
  });

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
    // An edit board keeps its own ground (`surface.board`, spec row 7), the grid pitch of one
    // grid unit in the world, and the arrow head on its edges.
    await expect(getComputedStyle(region).backgroundColor).toBe(colourOf(region, "--cmp-board-bg"));
    await expect(getComputedStyle(region).borderTopWidth).toBe("0px");
    await expect(dotPitch(region)).toBeCloseTo(GRID_UNIT * viewportZoom(region), 2);
    for (const path of region.querySelectorAll(".ds-edge__path")) {
      await expect(path).toHaveAttribute("marker-end");
    }
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
  const form = part(board, ".ds-board__overlay .ds-empty-state");
  const tile = part(form, ".ds-featured-icon");
  const action = within(form).getByRole("button", { name: actionName });
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

/** The bar's mock action (D10): it names its outcome and starts nothing. */
const startFirst = (label: string) => (
  <Button variant="secondary" size="sm">
    {label}
  </Button>
);

/** The action answers a hit test at its own centre. */
async function expectAnswers(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  await expect(hit !== null && el.contains(hit)).toBe(true);
}

/**
 * Rows 47 and 48: the form clears the open bar as it clears the toolbar, no ink is cut, and closing
 * the panel gives the form back to the toolbar's rule (ORV-223 D16).
 */
async function expectFormClearOfOpenBar(root: HTMLElement, actionName: string) {
  const board = part(root, ".ds-board");
  const form = part(board, ".ds-board__overlay .ds-empty-state");
  const action = within(form).getByRole("button", { name: actionName });
  const clear = resolvedLength(board, "--ds-space-inset-md");
  await expectFormClearOfToolbar(root, actionName);
  await expect(
    part(board, ".ds-taskbar").getBoundingClientRect().top - action.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(clear - HALF_PX);
  await expectAnswers(action);
  if (inVitest) {
    await expectFrameCutsNoInk(form, board);
    await expectLabelInkWhole(part(form, ".ds-empty-state__title"));
  }
  await userEvent.click(part(board, ".ds-taskbar button[aria-expanded='true']"));
  await waitFor(() =>
    expect(part(board, ".ds-taskbar button[aria-expanded='false']")).toBeVisible(),
  );
  await expectFormClearOfToolbar(root, actionName);
  await expectAnswers(action);
}

/**
 * The empty board with the task bar's panel open, 900 px wide and 420 tall: the form stands above
 * the bar's card, not on it (`empty-board-1`, ORV-223 D16), and goes back to the toolbar's rule
 * when the panel closes.
 */
export const EmptyBarOpen: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <Stateful {...args} height={420} fill={false}>
        <TaskBar jobs={[]} defaultExpanded emptyAction={startFirst("เริ่มงานแรก")} />
      </Stateful>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectFormClearOfOpenBar(canvasElement, "เพิ่ม node แรก");
  },
};

/** The same board with the open bar, in English. */
export const EmptyBarOpenInEnglish: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("Add your first node"),
  },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <Stateful {...args} height={420} fill={false}>
        <TaskBar jobs={[]} defaultExpanded emptyAction={startFirst("Start the first job")} />
      </Stateful>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectFormClearOfOpenBar(canvasElement, "Add your first node");
  },
};

/**
 * A list that fills the board: the action stops one inset under the board's top, whole and
 * pressable, though it then stands on the card (ORV-223 D16, row 49).
 */
export const EmptyJobsOpen: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
  },
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <Stateful {...args} height={420} fill={false}>
        <TaskBar jobs={fixtureManyJobs} defaultExpanded />
      </Stateful>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const board = part(canvasElement, ".ds-board");
    const form = part(board, ".ds-board__overlay .ds-empty-state");
    const action = within(form).getByRole("button", { name: "เพิ่ม node แรก" });
    const clear = resolvedLength(board, "--ds-space-inset-md");
    await expect(
      action.getBoundingClientRect().top - board.getBoundingClientRect().top,
    ).toBeGreaterThanOrEqual(clear - HALF_PX);
    await expectAnswers(action);
  },
};

/**
 * Row 50: with the panel open a status adds nothing to the clear, because the pill stands at the
 * board's top; the action stays one inset above the higher of the bar and the toolbar.
 */
export const EmptyBarOpenWithStatus: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: addFirst("เพิ่ม node แรก"),
    status: "ซูมเข้า",
  },
  render: (args) => (
    <div className="w-[900px] max-w-full">
      <Stateful {...args} height={420} fill={false}>
        <TaskBar jobs={[]} defaultExpanded emptyAction={startFirst("เริ่มงานแรก")} />
      </Stateful>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const board = part(canvasElement, ".ds-board");
    const form = part(board, ".ds-board__overlay .ds-empty-state");
    const action = within(form).getByRole("button", { name: "เพิ่ม node แรก" });
    const clear = resolvedLength(board, "--ds-space-inset-md");
    const bar = part(board, ".ds-taskbar").getBoundingClientRect();
    const toolbar = part(board, ".ds-controls").getBoundingClientRect();
    await expect(
      Math.abs(Math.min(bar.top, toolbar.top) - action.getBoundingClientRect().bottom - clear),
    ).toBeLessThanOrEqual(HALF_PX);
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

/**
 * The ring turns even under reduced motion (`spin-motion-1`), so two shots of one frame differ by
 * the ring's angle. `expectFrameCutsNoInk` compares two shots, so the ring is held still (inline
 * `animation: none`, put back after) for the call; the label and the clips are what it checks.
 */
async function withRingsStill(scope: ParentNode, run: () => Promise<void>) {
  const rings = Array.from(scope.querySelectorAll<SVGElement>(".ds-spin"));
  const before = rings.map((ring) => ring.style.animation);
  for (const ring of rings) ring.style.animation = "none";
  try {
    await run();
  } finally {
    rings.forEach((ring, i) => {
      ring.style.animation = before[i] ?? "";
    });
  }
}

/** The board's loading words are a Thai catalog value. */
const LOADING_TH = "กำลังโหลดกระดาน";

/** The overlay's label, which is the one place the loading words show. */
const overlayLabel = (root: HTMLElement) =>
  part(root, ".ds-board__overlay .ds-loading-state__label");

/**
 * The wait on its plate (ORV-250 rows 35 and 36, D17 to D20): the form's centre is the board's
 * centre to half a pixel on both axes, and the ring and the label stand at least `space.inset.md`
 * less half a pixel inside the form's padding box above and below, so the plate wraps them.
 */
async function expectOnPlate(board: HTMLElement) {
  const root = part(board, ".ds-board__overlay .ds-loading-state");
  const at = root.getBoundingClientRect();
  const on = board.getBoundingClientRect();
  await expect(
    Math.abs(at.left + at.width / 2 - (on.left + on.width / 2)),
    "the form's centre across the board's centre",
  ).toBeLessThanOrEqual(HALF_PX);
  await expect(
    Math.abs(at.top + at.height / 2 - (on.top + on.height / 2)),
    "the form's centre down the board's centre",
  ).toBeLessThanOrEqual(HALF_PX);
  const inset = resolvedLength(root, "--ds-space-inset-md");
  const top = at.top + root.clientTop;
  const bottom = top + root.clientHeight;
  for (const [name, el] of [
    ["ring", part(root, ".ds-spinner__ring")],
    ["label", part(root, ".ds-loading-state__label")],
  ] as const) {
    const box = el.getBoundingClientRect();
    await expect(box.top - top, `${name} clear of the plate's top`).toBeGreaterThanOrEqual(
      inset - HALF_PX,
    );
    await expect(bottom - box.bottom, `${name} clear of the plate's bottom`).toBeGreaterThanOrEqual(
      inset - HALF_PX,
    );
  }
}

/**
 * Loading: the region is busy and says so (AC 12, ORV-223 row 35). The ring and the words show
 * once, in the overlay, on the plate; the status line holds the same words in a 1 by 1 px box and
 * is the one status in the region (`load-board-1`).
 */
export const Loading: Story = {
  args: { initial: { nodes: [], edges: [] }, loading: true },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await expect(region).toHaveAttribute("aria-busy", "true");
    const statuses = within(region).getAllByRole("status");
    await expect(statuses).toHaveLength(1);
    await expect(statuses[0]).toHaveTextContent(LOADING_TH);
    const box = (statuses[0] as HTMLElement).getBoundingClientRect();
    await expect(box.width).toBe(1);
    await expect(box.height).toBe(1);
    await expect(overlayLabel(canvasElement)).toHaveTextContent(LOADING_TH);
    await expect(overlayLabel(canvasElement)).toBeVisible();
    await expect(region.querySelector(".ds-board__overlay .ds-spinner__ring")).not.toBeNull();
    await expectOnPlate(part(canvasElement, ".ds-board"));
    if (inVitest) {
      // Row 35's "once": the line's box is 1 by 1 px whether or not its words paint, so the words
      // themselves are asked. A Range over the text has the words' layout box, which no clip
      // narrows, and hiding the line must change nothing in that region.
      const line = statuses[0] as HTMLElement;
      const words = document.createRange();
      words.selectNodeContents(line);
      await withRingsStill(canvasElement, () =>
        expectCoversInk(part(canvasElement, ".ds-board"), [words], line),
      );
    }
  },
};

/**
 * A host outside the region starts with `loading` and ends it: the overlay goes, the fixture
 * nodes show, and the status line is the same node throughout, holding the loading words and then
 * nothing (`load-board-1`, W6).
 */
function LoadingHost({ copy = "กำลังโหลดกระดาน", status }: { copy?: string; status?: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <div>
      <div className="p-2">
        <Button variant="secondary" size="sm" onClick={() => setLoading(false)}>
          โหลดเสร็จ
        </Button>
      </div>
      <Stateful
        initial={BOARD}
        loading={loading}
        status={status}
        label={copy}
        height={520}
        fill={false}
      />
    </div>
  );
}

export const LoadingFinishes: Story = {
  render: () => <LoadingHost copy="กระดานแบรนด์ (ข้อมูลตัวอย่าง)" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)" });
    const line = status(region);
    await expect(region).toHaveAttribute("aria-busy", "true");
    await expect(line).toHaveTextContent(LOADING_TH);
    await expect(overlayLabel(canvasElement)).toBeVisible();
    // The wait sits over live nodes (ORV-250 row 36): a node's box meets the form's, and nothing of
    // the nodes' layer shows through the ring or the words.
    await ready(region);
    const board = part(canvasElement, ".ds-board");
    const form = part(board, ".ds-board__overlay .ds-loading-state").getBoundingClientRect();
    await expect(
      Array.from(nodeEls(region)).some((n) => {
        const box = n.getBoundingClientRect();
        return (
          box.left < form.right &&
          box.right > form.left &&
          box.top < form.bottom &&
          box.bottom > form.top
        );
      }),
      "a node lies under the form",
    ).toBe(true);
    if (inVitest) {
      const viewport = part(board, ".react-flow__viewport");
      await withRingsStill(board, () =>
        expectCoversInk(
          board,
          [
            part(board, ".ds-board__overlay .ds-spinner__ring"),
            part(board, ".ds-board__overlay .ds-loading-state__label"),
          ],
          viewport,
        ),
      );
      // The helper put the layer back: its inline opacity is as it was, none.
      await expect(viewport.style.opacity).toBe("");
    }
    await userEvent.click(canvas.getByRole("button", { name: "โหลดเสร็จ" }));
    await waitFor(() => expect(region).not.toHaveAttribute("aria-busy"));
    await expect(status(region)).toBe(line);
    await expect(line.textContent).toBe("");
    await expect(region.querySelector(".ds-loading-state")).toBeNull();
    await ready(region);
  },
};

/**
 * The shell has a status to show when the wait starts (`load-board-1`, W6's line true and line false
 * rows): while `loading` is true the one status holds the loading words and not the shell's; when
 * it ends the same node holds the shell's status.
 */
const SHELL_STATUS = "กำลังสร้างโลโก้ รอบที่ 2 (จำลอง)";
export const LoadingOverStatus: Story = {
  render: () => <LoadingHost copy="กระดานแบรนด์ (ข้อมูลตัวอย่าง)" status={SHELL_STATUS} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "กระดานแบรนด์ (ข้อมูลตัวอย่าง)" });
    const line = status(region);
    await expect(line.textContent, "the line holds the wait ahead of the status").toBe(LOADING_TH);
    await userEvent.click(canvas.getByRole("button", { name: "โหลดเสร็จ" }));
    await waitFor(() => expect(region).not.toHaveAttribute("aria-busy"));
    await expect(status(region)).toBe(line);
    await expect(line.textContent, "the line holds the status once the wait ends").toBe(
      SHELL_STATUS,
    );
  },
};

/** The loading board in English: "Loading the board" once under the ring, and in the status line. */
export const LoadingInEnglish: Story = {
  args: { initial: { nodes: [], edges: [] }, loading: true },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await expect(region).toHaveAttribute("aria-busy", "true");
    await expect(within(region).getAllByRole("status")).toHaveLength(1);
    await expect(status(region)).toHaveTextContent("Loading the board");
    await expect(overlayLabel(canvasElement)).toHaveTextContent("Loading the board");
    await expect(overlayLabel(canvasElement)).toBeVisible();
  },
};

/**
 * The loading board in a 360 px frame: the ring and the words centred, nothing cut. The board root
 * is the one clip inside the frame; the overlay's own parts clip nothing (ORV-223 row 38).
 */
export const LoadingAt360: Story = {
  args: { initial: { nodes: [], edges: [] }, loading: true },
  render: (args) => (
    <div data-testid="frame" className="w-[360px] max-w-full">
      <Stateful {...args} height={420} fill={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const root = part(frame, ".ds-board");
    const label = overlayLabel(canvasElement);
    await expect(label).toBeVisible();
    for (let el: HTMLElement | null = label; el && el !== root; el = el.parentElement) {
      const style = getComputedStyle(el);
      await expect(style.overflowX, `${el.className || el.localName} clips on x`).toBe("visible");
      await expect(style.overflowY, `${el.className || el.localName} clips on y`).toBe("visible");
    }
    // The root clips: the label's box lies inside its padding box.
    await expect(getComputedStyle(root).overflowX).toBe("hidden");
    const inner = root.getBoundingClientRect();
    const box = label.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(inner.left + root.clientLeft);
    await expect(box.right).toBeLessThanOrEqual(inner.left + root.clientLeft + root.clientWidth);
    await expect(box.top).toBeGreaterThanOrEqual(inner.top + root.clientTop);
    await expect(box.bottom).toBeLessThanOrEqual(inner.top + root.clientTop + root.clientHeight);
    // Centred across the frame, and on one line at this width.
    await expect(
      Math.abs(box.left + box.width / 2 - (inner.left + inner.width / 2)),
    ).toBeLessThanOrEqual(HALF_PX);
    if (inVitest) {
      await expectLabelInkWhole(label);
      await withRingsStill(root, () => expectFrameCutsNoInk(label, root));
    }
  },
};

/** The loading board under the three profiles in both modes, one board per cell. */
export const LoadingRecipesAndModes: Story = {
  args: { initial: { nodes: [], edges: [] }, loading: true },
  render: (args) => (
    <Matrix>
      <MatrixBoard {...args} height={360} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("status")).toHaveLength(6);
    await expect(
      canvasElement.querySelectorAll(".ds-board__overlay .ds-spinner__ring"),
    ).toHaveLength(6);
  },
};

/** A window wide enough for the fixture board to fit at zoom 1 or more (ORV-280 D11). */
const FIT_WINDOW = { width: 1920, height: 1200 };

/** Present: read-only, ports disabled, Delete and the editing shortcuts do nothing, Tab still moves (E4-2 AC 11, E4-3 AC 17). */
export const Present: Story = {
  args: { variant: "present" },
  render: (args) => (
    <Stateful {...args}>
      <ZoomHandle />
    </Stateful>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await ready(region);
    // The fit zoom at load, before any zoom key: outside Vitest the window is the viewer's, so the
    // pill check runs only when this fit is at zoom 1 or more.
    const fitZoomAtLoad = viewportZoom(region);
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
    // The calm ground (spec row 7): `surface.canvas` with a `border.subtle` hairline, and sparse
    // `border.subtle` dots 24 px apart on screen at every zoom, 1 px across. No arrow heads.
    const ground = getComputedStyle(region);
    await expect(ground.backgroundColor).toBe(colourOf(region, "--ds-surface-canvas"));
    await expect(ground.borderTopWidth).toBe("1px");
    await expect(ground.borderTopColor).toBe(colourOf(region, "--ds-border-subtle"));
    // The hairline is 1 px of ink, read from the pixels. The story fills the window, so only the
    // top edge has ground outside it to read; `Present Recipes And Modes` of Canvas edge reads all
    // four sides in six boundaries.
    if (inVitest) await expectEdgeInk(region, "top", 1);
    for (const zoom of [0.5, 1]) {
      await zoomTo(region, zoom);
      await waitFor(() => expect(dotPitch(region)).toBeCloseTo(24, 2));
      const dot = region.querySelector(".react-flow__background circle");
      await expect(Number(dot?.getAttribute("r"))).toBeCloseTo(0.5, 2);
      await expect(getComputedStyle(dot as Element).fill).toBe(
        colourOf(region, "--ds-border-subtle"),
      );
    }
    await waitFor(() => expect(viewportZoom(region)).toBeCloseTo(1, 3));
    await waitFor(() => expect(expectPillsClear(region)).toBeGreaterThan(0));
    // No card or port dot covers an edge pill at the fit view (sign-off 2 R1). It runs last, because
    // the fit command says its count in the status line, which the keys above leave empty. The
    // window decides the fit zoom: in Vitest's 1200 px frame it is 0.88, where a full-size pill is
    // the accepted residual below zoom 1. So the fit view is read in a window wide enough for a fit
    // at zoom 1 or more, and the zoom is asserted before the pills are read (ORV-280 D11).
    const readFit = async () => {
      await focusOn(() => region);
      await userEvent.keyboard("{Shift>}1{/Shift}");
      await waitFor(() => expect(viewportZoom(region)).toBeGreaterThanOrEqual(1));
      await waitFor(() => expect(expectPillsClear(region)).toBeGreaterThan(0));
    };
    if (inVitest) await atWindow(FIT_WINDOW.width, FIT_WINDOW.height, readFit);
    else if (fitZoomAtLoad >= 1) await readFit();
    for (const path of region.querySelectorAll(".ds-edge__path")) {
      await expect(path).not.toHaveAttribute("marker-end");
    }
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
      expect(status(region)).toHaveTextContent(`พอดีจอ ${BOARD_NODES.length} โหนด`),
    );
    await focusOn(() => nodeByTitle(region, "บรีฟ"));
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Shift>}2{/Shift}");
    await waitFor(() => expect(status(region)).toHaveTextContent("พอดีจอกับ 1 โหนดที่เลือก"));
    // Every node selected: the general form, with the count.
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await userEvent.keyboard("{Shift>}2{/Shift}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`พอดีจอกับ ${BOARD_NODES.length} โหนดที่เลือก`),
    );
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

const ONE_NODE: Graph = { nodes: [BOARD_NODES[0] as BoardNode], edges: [] };

/** A board of one node: fit all and fit selection say "1 node" in the singular (ORV-280 B16). */
async function playFitOneNode(root: HTMLElement, lang: "th" | "en") {
  const region = within(root).getByRole("region");
  await waitFor(() => {
    expect(nodeEls(region)).toHaveLength(1);
    expect((nodeEls(region)[0] as HTMLElement).style.visibility).not.toBe("hidden");
  });
  const words = {
    th: { all: "พอดีจอ 1 โหนด", picked: "พอดีจอกับ 1 โหนดที่เลือก" },
    en: { all: "Fitted 1 node to the view", picked: "Fitted 1 selected node to the view" },
  }[lang];
  await focusOn(() => region);
  await userEvent.keyboard("{Shift>}1{/Shift}");
  await waitFor(() => expect(status(region)).toHaveTextContent(words.all));
  await focusOn(() => nodeByTitle(region, "บรีฟ"));
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("{Shift>}2{/Shift}");
  await waitFor(() => expect(status(region)).toHaveTextContent(words.picked));
}

/** One node, in Thai: the singular fit lines carry no English word. */
export const FitOneNode: Story = {
  args: { initial: ONE_NODE },
  play: async ({ canvasElement }) => playFitOneNode(canvasElement, "th"),
};

/** One node, in English. */
export const FitOneNodeInEnglish: Story = {
  globals: { locale: "en" },
  args: { initial: ONE_NODE },
  play: async ({ canvasElement }) => playFitOneNode(canvasElement, "en"),
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
    await userEvent.keyboard("{Shift>}2{/Shift}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(
        `Fitted ${BOARD_NODES.length} selected nodes to the view`,
      ),
    );
    await userEvent.keyboard("{Shift>}1{/Shift}");
    await waitFor(() =>
      expect(status(region)).toHaveTextContent(`Fitted ${BOARD_NODES.length} nodes to the view`),
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

/* Open, levels of detail and the present matrix (ORV-274). --------------------------------------- */

type Lang = "th" | "en";

const OPEN_WORDS = {
  th: {
    logo: "โลโก้",
    brief: "บรีฟ",
    name: "โลโก้ 3 หน้า",
    present: "บอร์ดที่ดู",
    edit: "บอร์ดที่แก้",
    bare: "บอร์ดที่ไม่มีตัวเปิด",
  },
  en: {
    logo: "Logo",
    brief: "Brief",
    name: "Logo, 3 pages",
    present: "View board",
    edit: "Edit board",
    bare: "Board without opener",
  },
} as const;

/**
 * Two nodes on a short row: a result that opens (`open: { count: 3 }`) and a brief that does not,
 * joined by one input edge so the label pills of an edge show on the level-of-detail boards.
 */
function openGraph(lang: Lang): Graph {
  const w = OPEN_WORDS[lang];
  const node = (id: string, title: string, x: number, open: boolean): BoardNode => ({
    id,
    type: "orivilo",
    position: { x, y: 0 },
    data: {
      title,
      kind: open ? "artifact" : "input-block",
      size: "sm",
      inputs: open ? [{ id: "text", kind: "text", label: "text" }] : [],
      outputs: open ? [] : [{ id: "text", kind: "text", label: "text" }],
      ...(open ? { open: { count: 3 } } : {}),
    },
  });
  return {
    nodes: [node("brief", w.brief, 0, false), node("res", w.logo, 360, true)],
    edges: [
      {
        id: "e",
        type: "orivilo",
        source: "brief",
        sourceHandle: "text",
        target: "res",
        targetHandle: "text",
        data: { meaning: "input" },
      },
    ],
  };
}

const presentOpen = fn();
const editOpen = fn();
const editCommand = fn();

const nodeEl = (root: Element, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
/** The viewport's transform: a pan or a zoom changes it, so a gesture that must not move it reads it. */
const transformOf = (board: Element) =>
  board.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform;
/** Two frames after a gesture, a pan that animates has started; the transform must still be `before`. */
const expectStill = async (board: Element, before: string | undefined) => {
  for (let i = 0; i < 2; i++) await new Promise((done) => requestAnimationFrame(done));
  await expect(transformOf(board)).toBe(before);
};
const boardReady = (root: HTMLElement, nodes: number) =>
  waitFor(() => {
    expect(root.querySelectorAll(".react-flow__node")).toHaveLength(nodes);
    for (const n of root.querySelectorAll<HTMLElement>(".react-flow__node"))
      expect(n.style.visibility).not.toBe("hidden");
  });

async function playOpenNode(root: HTMLElement, lang: Lang) {
  const w = OPEN_WORDS[lang];
  presentOpen.mockClear();
  editOpen.mockClear();
  editCommand.mockClear();
  const canvas = within(root);
  const view = canvas.getByRole("region", { name: w.present });
  const edit = canvas.getByRole("region", { name: w.edit });
  const bare = canvas.getByRole("region", { name: w.bare });
  await boardReady(view, 2);
  await boardReady(edit, 2);
  await boardReady(bare, 2);
  // Without `onNodeOpen` the node still says what it holds but promises no dialog (ORV-280 D9).
  await expect(within(bare).getByRole("group", { name: w.name })).toBe(nodeEl(bare, "res"));
  await expect(nodeEl(bare, "res")).not.toHaveAttribute("aria-haspopup");
  // And it draws no open glyph on any node: nothing there opens, so the title row ends with the
  // page count and nothing after it (ORV-280 S3, option (a) of open question 8).
  for (const n of bare.querySelectorAll(".react-flow__node")) {
    await expect(n.querySelector(".ds-node__open")).toBeNull();
  }
  await expect(nodeEl(bare, "res").querySelector(".ds-node__pages")).toHaveTextContent(
    lang === "th" ? "3 หน้า" : "3 pages",
  );

  // An open node is named with its page count and takes the popup attribute; a plain one neither.
  for (const board of [view, edit]) {
    await waitFor(() => expect(within(board).getByRole("group", { name: w.name })).toBeVisible());
    await expect(nodeEl(board, "res")).toHaveAttribute("aria-haspopup", "dialog");
    await expect(nodeEl(board, "brief")).not.toHaveAttribute("aria-haspopup");
    // The title row of the open node ends with the pages word and the open glyph, on both boards.
    await expect(nodeEl(board, "res").querySelector(".ds-node__pages")).toHaveTextContent(
      lang === "th" ? "3 หน้า" : "3 pages",
    );
    await expect(nodeEl(board, "res").querySelector(".ds-node__open")).toBeVisible();
    await expect(nodeEl(board, "brief").querySelector(".ds-node__open")).toBeNull();
  }

  // Present board: Enter, Space and a single click each open once; the brief never does.
  // None of the open gestures moves the viewport: each is checked against the transform it began with.
  const viewStart = transformOf(view);
  const editStart = transformOf(edit);
  await expect(viewStart).toBeTruthy();
  await focusOn(() => nodeEl(view, "res"));
  await userEvent.keyboard("{Enter}");
  await expect(presentOpen).toHaveBeenCalledTimes(1);
  await expect(presentOpen).toHaveBeenLastCalledWith("res");
  await expectStill(view, viewStart);
  // A held Space opens too, and must not arm the pan key: the pane stays in selection mode.
  await userEvent.keyboard("[Space>]");
  await expect(presentOpen).toHaveBeenCalledTimes(2);
  const pane = view.querySelector(".react-flow__pane") as HTMLElement;
  await expect(pane).not.toHaveClass("draggable");
  await userEvent.keyboard("[/Space]");
  await expectStill(view, viewStart);
  await userEvent.click(nodeEl(view, "res"));
  await expect(presentOpen).toHaveBeenCalledTimes(3);
  await expectStill(view, viewStart);
  // The same keys on the brief open nothing; there Space does arm the pan key, which proves the
  // probe above can tell the two apart.
  await focusOn(() => nodeEl(view, "brief"));
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("[Space>]");
  await waitFor(() => expect(pane).toHaveClass("draggable"));
  await userEvent.keyboard("[/Space]");
  await userEvent.click(nodeEl(view, "brief"));
  await expect(presentOpen).toHaveBeenCalledTimes(3);

  // Edit board: a double click and Enter open an open node; a single click does not; Enter on a
  // node without `open` is still the `node.open` command.
  await userEvent.click(nodeEl(edit, "res"));
  await expect(editOpen).not.toHaveBeenCalled();
  await userEvent.dblClick(nodeEl(edit, "res"));
  await expect(editOpen).toHaveBeenCalledTimes(1);
  await expect(editOpen).toHaveBeenLastCalledWith("res");
  await expectStill(edit, editStart);
  await focusOn(() => nodeEl(edit, "res"));
  await userEvent.keyboard("{Enter}");
  await expect(editOpen).toHaveBeenCalledTimes(2);
  await expectStill(edit, editStart);
  await userEvent.keyboard(" ");
  await expect(editOpen).toHaveBeenCalledTimes(3);
  await expectStill(edit, editStart);
  await expect(editCommand).not.toHaveBeenCalledWith("node.open", expect.anything());
  await focusOn(() => nodeEl(edit, "brief"));
  await userEvent.keyboard("{Enter}");
  await waitFor(() =>
    expect(editCommand).toHaveBeenCalledWith(
      "node.open",
      expect.objectContaining({ nodeId: "brief" }),
    ),
  );
  await userEvent.dblClick(nodeEl(edit, "brief"));
  await expect(editOpen).toHaveBeenCalledTimes(3);
}

function OpenBoards({ lang }: { lang: Lang }) {
  const w = OPEN_WORDS[lang];
  return (
    <>
      <Stateful
        variant="present"
        initial={openGraph(lang)}
        label={w.present}
        height={260}
        fill={false}
        chrome={false}
        onNodeOpen={presentOpen}
      />
      <Stateful
        initial={openGraph(lang)}
        label={w.edit}
        height={260}
        fill={false}
        chrome={false}
        onNodeOpen={editOpen}
        onCommand={editCommand}
      />
      <Stateful
        variant="present"
        initial={openGraph(lang)}
        label={w.bare}
        height={260}
        fill={false}
        chrome={false}
      />
    </>
  );
}

/**
 * `onNodeOpen` (spec row 5): a node with `open` calls it on Enter, Space, a double click on an edit
 * board and a single click on a present board, once each; Space never starts a pan; a node without
 * `open` never calls it, and on an edit board its Enter is still `node.open`.
 */
export const OpenNode: Story = {
  render: () => <OpenBoards lang="th" />,
  play: async ({ canvasElement }) => playOpenNode(canvasElement, "th"),
};

/** The open node with English names ("Logo, 3 pages"), in dark mode. */
export const OpenNodeInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <OpenBoards lang="en" />,
  play: async ({ canvasElement }) => playOpenNode(canvasElement, "en"),
};

/** A story-local stand-in for the page's writer: sets `data-lod` on its closest `.ds-board`. */
function LodWriter({ lod }: { lod: "far" | "mid" | "near" }): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const board = ref.current?.closest<HTMLElement>(".ds-board");
    board?.setAttribute("data-lod", lod);
    return () => board?.removeAttribute("data-lod");
  }, [lod]);
  return <span ref={ref} hidden />;
}

const LODS = ["far", "mid", "near"] as const;

function LodBoards({ lang }: { lang: Lang }) {
  return (
    <>
      {LODS.map((lod) => (
        <Stateful
          key={lod}
          variant="present"
          initial={openGraph(lang)}
          label={`${lod}, ${OPEN_WORDS[lang].present}`}
          height={240}
          fill={false}
          chrome={false}
          onNodeOpen={fn()}
        >
          <LodWriter lod={lod} />
        </Stateful>
      ))}
    </>
  );
}

async function playLevelsOfDetail(root: HTMLElement, lang: Lang) {
  const w = OPEN_WORDS[lang];
  const cs = (el: Element) => getComputedStyle(el);
  const board = (lod: string) => within(root).getByRole("region", { name: `${lod}, ${w.present}` });
  for (const lod of LODS) await boardReady(board(lod), 2);
  await waitFor(() => expect(root.querySelectorAll(".ds-edge__label")).toHaveLength(3));
  // Far: names and edge words are hidden, but the node keeps its accessible name.
  const far = board("far");
  await expect(far).toHaveAttribute("data-lod", "far");
  for (const el of far.querySelectorAll(".ds-node__label, .ds-edge__label"))
    await expect(cs(el).visibility).toBe("hidden");
  await expect(within(far).getByRole("group", { name: w.name })).toBeInTheDocument();
  // Mid: the label shows, the page count steps aside and the open glyph stays.
  const mid = board("mid");
  for (const el of mid.querySelectorAll(".ds-node__label, .ds-edge__label"))
    await expect(cs(el).visibility).toBe("visible");
  await expect(cs(mid.querySelector(".ds-node__pages") as Element).display).toBe("none");
  await expect(mid.querySelector(".ds-node__open")).toBeVisible();
  // Near: the page count shows as well.
  const near = board("near");
  await expect(cs(near.querySelector(".ds-node__pages") as Element).display).not.toBe("none");
  await expect(near.querySelector(".ds-node__pages")).toBeVisible();
  await expect(near.querySelector(".ds-node__open")).toBeVisible();
  for (const el of near.querySelectorAll(".ds-node__label, .ds-edge__label"))
    await expect(cs(el).visibility).toBe("visible");
}

/**
 * Levels of detail (spec row 8): three present boards stacked, written `far`, `mid` and `near` by a
 * story-local writer as the page will. Far hides the names, mid the page count, near shows all.
 */
export const LevelsOfDetail: Story = {
  render: () => <LodBoards lang="th" />,
  play: async ({ canvasElement }) => playLevelsOfDetail(canvasElement, "th"),
};

/** The three levels with English names, in dark mode. */
export const LevelsOfDetailInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <LodBoards lang="en" />,
  play: async ({ canvasElement }) => playLevelsOfDetail(canvasElement, "en"),
};

/** The window the label clause of the present matrix reads the fit in (ORV-298 design 2.6 row c). */
const LABEL_WINDOW = { width: 1440, height: 900 };
/** The least a card label's top may sit under the board's top at the fit, in px (row c, measured 25.5 to 29.5). */
const LABEL_TOP_MIN = 16;

/**
 * Zoom to fit on one board, read once the viewport has stopped moving (the same transform on three
 * reads, a frame apart), then the top of every card label against the board's top. A label above the
 * board's top is clipped by it and a Thai title loses its tone marks (ORV-298 sign-off R1).
 */
async function expectLabelsUnderTop(cell: HTMLElement) {
  const board = cell.querySelector<HTMLElement>(".ds-board") as HTMLElement;
  await focusOn(() => board);
  await userEvent.keyboard("{Shift>}1{/Shift}");
  const transform = () =>
    board.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform ?? "";
  const frame = () => new Promise((done) => requestAnimationFrame(done));
  await waitFor(async () => {
    const first = transform();
    await frame();
    const second = transform();
    await frame();
    expect(transform()).toBe(first);
    expect(second).toBe(first);
  });
  for (const label of cell.querySelectorAll(".ds-node__label")) {
    const top = label.getBoundingClientRect().top - board.getBoundingClientRect().top;
    await expect(top).toBeGreaterThanOrEqual(LABEL_TOP_MIN);
  }
}

/** The present board under three profiles in both modes, with one node that opens. */
export const PresentRecipesAndModes: Story = {
  render: (args) => {
    const initial: Graph = {
      ...BOARD,
      nodes: BOARD.nodes.map((n) =>
        n.id === "logo" ? { ...n, data: { ...n.data, open: { count: 3 } } } : n,
      ),
    };
    return (
      <Matrix>
        <MatrixBoard {...args} initial={initial} variant="present" height={360} onNodeOpen={fn()} />
      </Matrix>
    );
  },
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      await waitFor(() => expect(nodeEls(cell)).toHaveLength(BOARD_NODES.length));
      await expect(cell.querySelectorAll('.ds-board[data-variant="present"]')).toHaveLength(1);
      await expect(cell.querySelectorAll(".ds-node__label")).toHaveLength(BOARD_NODES.length);
      await expect(cell.querySelectorAll(".ds-node__open")).toHaveLength(1);
      await expect(cell.querySelectorAll(".ds-node[data-open]")).toHaveLength(1);
      await expect(getComputedStyle(cell.querySelector(".ds-node") as Element).borderTopColor).toBe(
        colourOf(cell, "--ds-border-subtle"),
      );
    }
    // The fit leaves the top label whole (row c): read in a window wide enough for the matrix, as
    // `Present` reads its fit; outside Vitest the window is the reader's own.
    const readLabels = async () => {
      for (const cell of cells) await expectLabelsUnderTop(cell);
    };
    if (inVitest) await atWindow(LABEL_WINDOW.width, LABEL_WINDOW.height, readLabels);
    else if (window.innerWidth >= LABEL_WINDOW.width && window.innerHeight >= LABEL_WINDOW.height)
      await readLabels();
  },
};

/**
 * The layout pass on a hand-built page of boxes (ORV-280 rows 20 and 21), so each rule shows alone:
 * an edge pill under a card, a title line or a port dot is hidden; between a meaning pill and a
 * state pill the state pill stays whichever comes first; a node's own pills never hide each other
 * while another node's pill that overlaps one does; a pill that is not drawn takes no one's place.
 */
export const PillLayoutPass: Story = {
  render: () => {
    const at = (left: number, top: number, width: number, height: number) => ({
      position: "absolute" as const,
      left,
      top,
      width,
      height,
      visibility: "visible" as const,
    });
    return (
      <div data-pill-fixture="" style={{ position: "relative", width: 640, height: 270 }}>
        <div className="ds-node" style={at(0, 0, 100, 60)} />
        <div data-case="under-card" className="ds-edge__label" style={at(20, 20, 60, 20)}>
          ล้าสมัย
        </div>
        <div className="ds-node__label" style={at(200, 0, 100, 20)} />
        <div data-case="under-title" className="ds-edge__label" style={at(210, 5, 60, 10)}>
          อ้างอิง
        </div>
        <div className="ds-port__handle" style={at(400, 0, 10, 10)} />
        <div data-case="under-dot" className="ds-edge__label" style={at(402, 2, 40, 6)}>
          อ้างอิง
        </div>
        <div data-case="meaning-first" className="ds-edge__label" style={at(0, 100, 80, 20)}>
          ป้อนเข้า
        </div>
        <div
          data-case="state-second"
          data-state="stale"
          className="ds-edge__label"
          style={at(10, 100, 80, 20)}
        >
          ป้อนเข้า, ล้าสมัย
        </div>
        <div
          data-case="edge-invisible"
          className="ds-edge__label"
          style={{ ...at(0, 170, 80, 20), visibility: "hidden" }}
        >
          ป้อนเข้า
        </div>
        <div
          data-case="edge-no-box"
          className="ds-edge__label"
          style={{ ...at(0, 170, 80, 20), display: "none" }}
        >
          ป้อนเข้า
        </div>
        <div data-case="edge-over-unseen" className="ds-edge__label" style={at(10, 170, 80, 20)}>
          ป้อนเข้า
        </div>
        <div data-case="gap-45-first" className="ds-edge__label" style={at(300, 200, 60, 20)}>
          ป้อนเข้า
        </div>
        <div data-case="gap-45-second" className="ds-edge__label" style={at(364.5, 200, 60, 20)}>
          ป้อนเข้า
        </div>
        <div data-case="gap-35-first" className="ds-edge__label" style={at(300, 230, 60, 20)}>
          ป้อนเข้า
        </div>
        <div data-case="gap-35-second" className="ds-edge__label" style={at(363.5, 230, 60, 20)}>
          ป้อนเข้า
        </div>
        <div className="react-flow__node" data-id="n1" style={{ position: "static" }}>
          <div data-case="own-first" className="ds-port__label" style={at(200, 100, 60, 20)}>
            ภาพ
          </div>
          <div data-case="own-second" className="ds-port__label" style={at(210, 100, 60, 20)}>
            สี
          </div>
        </div>
        <div className="react-flow__node" data-id="n2" style={{ position: "static" }}>
          <div data-case="other-node" className="ds-port__label" style={at(205, 100, 60, 20)}>
            ฟอนต์
          </div>
        </div>
        <div className="react-flow__node" data-id="n3" style={{ position: "static" }}>
          <div
            data-case="not-drawn"
            className="ds-port__label"
            style={{ ...at(400, 100, 60, 20), visibility: "hidden" }}
          >
            ข้อความ
          </div>
        </div>
        <div className="react-flow__node" data-id="n4" style={{ position: "static" }}>
          <div data-case="under-the-hidden" className="ds-port__label" style={at(410, 100, 60, 20)}>
            ข้อความ
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-pill-fixture]");
    if (!root) throw new Error("the fixture did not render");
    await waitFor(() => expect(root.querySelectorAll("[data-case]")).toHaveLength(17));
    layoutPills(root);
    const hidden = (name: string) =>
      (root.querySelector(`[data-case="${name}"]`) as Element).hasAttribute("data-hidden");
    await expect(hidden("under-card"), "under a card").toBe(true);
    await expect(hidden("under-title"), "under a title line").toBe(true);
    await expect(hidden("under-dot"), "under a port dot").toBe(true);
    await expect(hidden("meaning-first"), "a meaning pill under a state pill").toBe(true);
    await expect(hidden("state-second"), "the state pill").toBe(false);
    await expect(hidden("own-first"), "a node's first pill").toBe(false);
    await expect(hidden("own-second"), "a node's second pill over the first").toBe(false);
    await expect(hidden("other-node"), "another node's pill over them").toBe(true);
    await expect(hidden("not-drawn"), "a pill that is not drawn is not marked").toBe(false);
    await expect(hidden("under-the-hidden"), "a pill over one that is not drawn").toBe(false);
    await expect(hidden("edge-invisible"), "an invisible edge pill is not marked").toBe(false);
    await expect(hidden("edge-no-box"), "an edge pill with no box is not marked").toBe(false);
    await expect(hidden("edge-over-unseen"), "an edge pill over ones not drawn").toBe(false);
    // The clearance is 4 px: a pill 4.5 px from another stays, one 3.5 px from it gives way.
    await expect(hidden("gap-45-second"), "a pill 4.5 px from another").toBe(false);
    await expect(hidden("gap-35-second"), "a pill 3.5 px from another").toBe(true);
  },
};
