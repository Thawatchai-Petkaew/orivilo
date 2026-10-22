import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { GRID_UNIT } from "./CanvasBoard";
import { BOARD, BOARD_NODES, LONG_NODE } from "./fixtures";
import { MatrixBoard, Stateful } from "./story-shell";

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
const status = (root: HTMLElement) => within(root).getByRole("status");
const nodeByTitle = (root: HTMLElement, title: string) =>
  within(root).getByRole("group", { name: new RegExp(`^${title},`) });
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(edgeEls(region)).toHaveLength(BOARD.edges.length);
    await expect(nodeByTitle(region, "บรีฟ")).toHaveAttribute(
      "aria-label",
      "บรีฟ, บล็อกป้อนข้อมูล",
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

/** No node: the empty text and the consumer's action; nothing else claims content (AC 12). */
export const Empty: Story = {
  args: {
    initial: { nodes: [], edges: [] },
    emptyAction: <Button variant="secondary">เพิ่ม node แรก</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("กระดานยังว่าง")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "เพิ่ม node แรก" })).toBeVisible();
    await expect(nodeEls(canvasElement)).toHaveLength(0);
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(canvas.getByText("ดูอย่างเดียว")).toBeVisible();
    await expect(canvas.getAllByRole("img", { name: /แก้ไขไม่ได้$/ }).length).toBeGreaterThan(5);
    const logo = nodeByTitle(region, "โลโก้");
    logo.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await userEvent.keyboard("c");
    await expect(nodeEls(region)).toHaveLength(BOARD_NODES.length);
    await expect(status(region)).toHaveTextContent("");
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect(nodeByTitle(region, "บรีฟ")).toHaveFocus();
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const before = edgeEls(region).length;
    const brief = nodeByTitle(region, "บรีฟ");
    brief.focus();
    await userEvent.keyboard("c");
    // Text goes to the two unconnected text inputs: the note (nearest) and the palette.
    await expect(status(region)).toHaveTextContent("ต่อสายจาก บรีฟ: เป้าหมาย โน้ต (1 จาก 2)");
    await expect(region.querySelectorAll('.ds-port[data-state="connecting"]')).toHaveLength(1);
    await expect(region.querySelectorAll('.ds-port[data-state="valid-target"]')).toHaveLength(1);
    await userEvent.keyboard("{ArrowRight}");
    await expect(status(region)).toHaveTextContent(`เป้าหมาย ${fixtures.mixed} (2 จาก 2)`);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(status(region)).toHaveTextContent("เป้าหมาย โน้ต (1 จาก 2)");
    await userEvent.keyboard("{Escape}");
    await expect(status(region)).toHaveTextContent("ยกเลิกการต่อสาย");
    await expect(edgeEls(region)).toHaveLength(before);
    await userEvent.keyboard("c");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(edgeEls(region)).toHaveLength(before + 1));
    await expect(status(region)).toHaveTextContent("เชื่อม บรีฟ ไป โน้ต แล้ว");
    await expect(
      canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โน้ต" }),
    ).toBeInTheDocument();
    await expect(brief).toHaveFocus();
    // A node without an output port says so.
    nodeByTitle(region, "โน้ต").focus();
    await userEvent.keyboard("c");
    await expect(status(region)).toHaveTextContent("โน้ต ไม่มีพอร์ตส่ง");
  },
};

/** Enter selects, an arrow moves one grid unit, Shift and an arrow ten, the move is announced (AC 7). */
export const KeyboardNudge: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const brief = nodeByTitle(region, "บรีฟ");
    brief.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(brief).toHaveClass("selected"));
    const x = translateX(brief);
    const y = translateY(brief);
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(translateX(brief)).toBe(x + GRID_UNIT));
    await expect(status(region)).toHaveTextContent("ขยับ 1 node ไปขวา 1 หน่วยกริด");
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await waitFor(() => expect(translateY(brief)).toBe(y + 10 * GRID_UNIT));
    await expect(status(region)).toHaveTextContent("ขยับ 1 node ไปลง 10 หน่วยกริด");
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(translateY(brief)).toBe(y + 9 * GRID_UNIT));
  },
};

/** Delete removes the selected node and its edges; downstream nodes stay and read stale (AC 8). */
export const KeyboardDelete: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const logo = nodeByTitle(region, "โลโก้");
    logo.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length - 1));
    await expect(canvas.queryByRole("group", { name: /^โลโก้,/ })).toBeNull();
    // The palette and the profile are downstream of the logo: both read stale now.
    await expect(nodeByTitle(region, fixtures.mixed)).toHaveTextContent("ล้าสมัย");
    await expect(nodeByTitle(region, "โปรไฟล์ว่าที่ลูกค้า")).toHaveTextContent("ล้าสมัย");
    await expect(nodeByTitle(region, "บรีฟ")).not.toHaveTextContent("ล้าสมัย");
    await expect(edgeEls(region)).toHaveLength(BOARD.edges.length - 2);
    await expect(status(region)).toHaveTextContent("ลบ 1 node และ 2 สาย");
    await expect(status(region)).toHaveTextContent("node ปลายทางล้าสมัย");
    // An edge alone: Tab to it, Delete, the nodes stay.
    const edge = canvas.getByRole("group", { name: "อ้างอิง จาก บรีฟ ไป Type direction" });
    edge.focus();
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
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
    await expect(status(region)).toHaveTextContent("พอร์ตภาพรับได้เฉพาะภาพ แต่สายนี้ส่งข้อความ");
    await user.pointer([
      { keys: "[MouseLeft>]", target: from, coords: center(from) },
      { target: region, coords: { x: center(from).x + 40, y: center(from).y + 10 } },
      { target: right, coords: center(right) },
      { keys: "[/MouseLeft]", target: right, coords: center(right) },
    ]);
    await waitFor(() => expect(edgeEls(region)).toHaveLength(before + 1));
    await expect(status(region)).toHaveTextContent(`เชื่อม บรีฟ ไป ${fixtures.mixed} แล้ว`);
    await expect(from.closest(".ds-port")).toHaveAttribute("data-state", "connected");
  },
};

/** Dragging on empty board draws the selection rectangle and selects what it touches (AC 13). */
export const BoxSelecting: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const pane = region.querySelector<HTMLElement>(".react-flow__pane") as HTMLElement;
    const brief = nodeByTitle(region, "บรีฟ");
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const brief = nodeByTitle(region, "บรีฟ");
    brief.focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    await waitFor(() =>
      expect(region.querySelectorAll(".react-flow__node.selected")).toHaveLength(
        BOARD_NODES.length,
      ),
    );
    await expect(status(region)).toHaveTextContent(`เลือกทั้งหมด ${BOARD_NODES.length} node`);
    await userEvent.keyboard("{Escape}");
    // Alt+ArrowRight goes downstream, Alt+ArrowLeft back.
    brief.focus();
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await expect(nodeByTitle(region, "โลโก้")).toHaveFocus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect(brief).toHaveFocus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect(status(region)).toHaveTextContent("ไม่มี node ต้นทาง");
    // 2 on a focused edge sets it to reference.
    const edge = canvas.getByRole("group", { name: "ป้อนเข้า จาก บรีฟ ไป โลโก้" });
    edge.focus();
    await userEvent.keyboard("2");
    await waitFor(() =>
      expect(canvas.getByRole("group", { name: "อ้างอิง จาก บรีฟ ไป โลโก้" })).toBeInTheDocument(),
    );
    await expect(status(region)).toHaveTextContent("ตั้งสายเป็นอ้างอิง");
    // F2 asks the shell to rename; N asks it to add a node, which the story's shell does.
    brief.focus();
    await userEvent.keyboard("{F2}");
    await expect(args.onCommand).toHaveBeenCalledWith("node.rename", { nodeId: "brief" });
    region.focus();
    await userEvent.keyboard("n");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await expect(args.onCommand).toHaveBeenCalledWith(
      "board.add-node",
      expect.objectContaining({ position: expect.anything() }),
    );
    // Mod+Shift+X cuts every edge of the focused node.
    nodeByTitle(region, "โลโก้").focus();
    await userEvent.keyboard("{Control>}{Shift>}x{/Shift}{/Control}");
    await waitFor(() => expect(edgeEls(region)).toHaveLength(BOARD.edges.length - 2));
    await expect(status(region)).toHaveTextContent("ตัดสาย 2 เส้นของ โลโก้");
  },
};

/** The shell's generation status shows in the one status line (catalog a11y). */
export const WithStatus: Story = {
  args: { status: "กำลังสร้างโลโก้ รอบที่ 2 (จำลอง)" },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await expect(status(region)).toHaveTextContent("กำลังสร้างโลโก้ รอบที่ 2 (จำลอง)");
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const brief = nodeByTitle(region, "บรีฟ");
    const x = translateX(brief);
    const y = translateY(brief);
    brief.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Control>}c{/Control}");
    await expect(status(region)).toHaveTextContent("คัดลอก 1 node ไว้บนกระดาน");
    await userEvent.keyboard("{Control>}v{/Control}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await expect(status(region)).toHaveTextContent("วาง 1 node แล้ว");
    const copies = canvas.getAllByRole("group", { name: /^บรีฟ,/ });
    await expect(copies).toHaveLength(2);
    const copy = copies.find((c) => c !== brief) as HTMLElement;
    await waitFor(() => expect(translateX(copy)).toBe(x + 2 * GRID_UNIT));
    await expect(translateY(copy)).toBe(y + 2 * GRID_UNIT);
    await expect(copy).toHaveClass("selected");
    await expect(brief).not.toHaveClass("selected");
    // Mod+D on the copy: a third brief, selected alone.
    copy.focus();
    await userEvent.keyboard("{Control>}d{/Control}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 2));
    await expect(selectedCount(region)).toBe(1);
    // Mod+X on the logo removes it; its downstream palette turns stale.
    const logo = nodeByTitle(region, "โลโก้");
    logo.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Control>}x{/Control}");
    await waitFor(() => expect(canvas.queryByRole("group", { name: /^โลโก้,/ })).toBeNull());
    await expect(status(region)).toHaveTextContent("ตัด 1 node ไว้บนกระดาน");
    await expect(region.querySelector('.ds-node[data-status="stale"]')).not.toBeNull();
    await userEvent.keyboard("{Control>}v{/Control}");
    await waitFor(() => expect(canvas.getByRole("group", { name: /^โลโก้,/ })).toBeInTheDocument());
  },
};

/** Align, distribute, order, lock and collapse on a selection (AC 13). */
export const Arrange: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const brief = nodeByTitle(region, "บรีฟ");
    const note = nodeByTitle(region, "โน้ต");
    const type = nodeByTitle(region, "Type direction");
    brief.focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    await waitFor(() => expect(selectedCount(region)).toBe(BOARD_NODES.length));
    // Alt+A: every node's left edge moves to the leftmost (brief and note at x 0).
    await userEvent.keyboard("{Alt>}a{/Alt}");
    await expect(status(region)).toHaveTextContent(`จัดแนวซ้าย ${BOARD_NODES.length} node`);
    await waitFor(() => expect(translateX(type)).toBe(translateX(brief)));
    // Alt+V: equal gaps top to bottom; the first and last stay where they were.
    const topBefore = Math.min(...Array.from(nodeEls(region)).map(translateY));
    await userEvent.keyboard("{Alt>}v{/Alt}");
    await expect(status(region)).toHaveTextContent("กระจายแนวตั้ง");
    await waitFor(() =>
      expect(Math.min(...Array.from(nodeEls(region)).map(translateY))).toBe(topBefore),
    );
    // ] brings the selection to the front: a zIndex above every other node.
    await userEvent.keyboard("]");
    await expect(status(region)).toHaveTextContent("ย้ายมาหน้าสุด");
    await waitFor(() => expect(Number(brief.style.zIndex)).toBeGreaterThan(0));
    // Mod+Shift+L locks the selection; the status word appears on the note.
    await userEvent.keyboard("{Control>}{Shift>}l{/Shift}{/Control}");
    await expect(status(region)).toHaveTextContent(`ล็อก ${BOARD_NODES.length} node แล้ว`);
    await waitFor(() =>
      expect(note.querySelector(".ds-node")).toHaveAttribute("data-status", "locked"),
    );
    await userEvent.keyboard("{Control>}{Shift>}l{/Shift}{/Control}");
    await expect(status(region)).toHaveTextContent(`ปลดล็อก ${BOARD_NODES.length} node แล้ว`);
    // Mod+. collapses the selection.
    await userEvent.keyboard("{Control>}.{/Control}");
    await expect(status(region)).toHaveTextContent(`ย่อ ${BOARD_NODES.length} node แล้ว`);
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    const brief = nodeByTitle(region, "บรีฟ");
    brief.focus();
    await userEvent.keyboard("{Control>}{Shift>}n{/Shift}{/Control}");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length + 1));
    await expect(status(region)).toHaveTextContent("เพิ่มโน้ตข้าง บรีฟ");
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    region.focus();
    const start = zoomOf(region);
    await userEvent.keyboard("{Control>}={/Control}");
    await expect(status(region)).toHaveTextContent("ซูมเข้า");
    await waitFor(() => expect(zoomOf(region)).toBeGreaterThan(start));
    await userEvent.keyboard("{Control>}0{/Control}");
    await expect(status(region)).toHaveTextContent("ซูม 100%");
    await waitFor(() => expect(zoomOf(region)).toBe(1));
    await expect(within(region).getByRole("button", { name: /ซูม 100/ })).toHaveTextContent("100%");
    await userEvent.keyboard("{Control>}-{/Control}");
    await expect(status(region)).toHaveTextContent("ซูมออก");
    await waitFor(() => expect(zoomOf(region)).toBeLessThan(1));
    await userEvent.keyboard("{Shift>}1{/Shift}");
    await expect(status(region)).toHaveTextContent(`พอดีจอ ${BOARD_NODES.length} node`);
    nodeByTitle(region, "บรีฟ").focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Shift>}2{/Shift}");
    await expect(status(region)).toHaveTextContent("พอดีจอกับ 1 node ที่เลือก");
    await userEvent.keyboard("h");
    await expect(status(region)).toHaveTextContent("โหมดเลื่อนกระดาน");
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "pan");
    await expect(within(region).getByRole("radio", { name: /โหมดเลื่อนกระดาน/ })).toHaveAttribute(
      "data-state",
      "on",
    );
    await userEvent.keyboard("v");
    await expect(region.querySelector(".ds-board__flow")).toHaveAttribute("data-tool", "select");
    await userEvent.keyboard("{Shift>}g{/Shift}");
    await expect(status(region)).toHaveTextContent("ปิดการดูดเข้ากริด");
    await expect(region).not.toHaveAttribute("data-snap");
  },
};

/** Without chrome: no controls, no menus, no sheet; the keyboard still works (shell-composed layouts). */
export const WithoutChrome: Story = {
  args: { chrome: false },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(within(region).queryByRole("toolbar", { name: "เครื่องมือกระดาน" })).toBeNull();
    region.focus();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect(within(document.body).queryByRole("dialog")).toBeNull();
    await userEvent.keyboard("{Control>}={/Control}");
    await expect(status(region)).toHaveTextContent("ซูมเข้า");
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
    await waitFor(() => expect(nodeEls(region)).toHaveLength(BOARD_NODES.length));
    await expect(nodeByTitle(region, "บรีฟ")).toHaveAttribute("aria-label", "บรีฟ, input block");
    await expect(
      canvas.getByRole("group", { name: "input from บรีฟ to โลโก้" }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("toolbar", { name: "Board tools" })).toBeInTheDocument();
    const brief = nodeByTitle(region, "บรีฟ");
    brief.focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    await expect(status(region)).toHaveTextContent(`Selected all ${BOARD_NODES.length} nodes`);
    await userEvent.keyboard("{Escape}");
    brief.focus();
    await userEvent.keyboard("{Alt>}{ArrowLeft}{/Alt}");
    await expect(status(region)).toHaveTextContent("No upstream node");
    await expect(region.querySelector(".ds-node__kind")).toHaveTextContent("input block");
  },
};
