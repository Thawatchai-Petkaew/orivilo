import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { NODE_KINDS } from "../../tokens/canvas";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import { LONG_NODE } from "../canvas-board/fixtures";
import type { BoardNode, Graph, NodeContent } from "../canvas-board/graph";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";

const text = { id: "text", kind: "text", label: "ข้อความ" } as const;
const image = { id: "image", kind: "image", label: "ภาพ" } as const;

/** Nodes in a row, 24 px apart, so each story shows one state per node. */
function row(contents: Partial<NodeContent>[], extra: Partial<BoardNode> = {}): Graph {
  let x = 0;
  const nodes = contents.map((c, i) => {
    const node: BoardNode = {
      id: `n${i}`,
      type: "orivilo",
      position: { x, y: 0 },
      ...extra,
      data: { title: fixtures.thai, kind: "knowledge", inputs: [text], outputs: [image], ...c },
    };
    x += (c.size === "sm" ? 240 : c.size === "lg" ? 480 : 320) + 48;
    return node;
  });
  return { nodes, edges: [] };
}

/** A board that keeps the graph in state, sized for a row of nodes. */
function NodeBoard({
  initial,
  height = 300,
  ...rest
}: Omit<CanvasBoardProps, "graph" | "onChange" | "label"> & {
  initial: Graph;
  height?: number;
  label?: string;
}) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div style={{ height }}>
      <CanvasBoard
        label={`${rest.label ?? "ตัวอย่าง node"}${scope ? `, ${id} ${scope.mode}` : ""}`}
        {...rest}
        graph={graph}
        onChange={setGraph}
      />
    </div>
  );
}

const meta = {
  title: "Application/Canvas node",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Anything placed on the board (ADR 0004): header with title, kind and status, a body per variant, missing inputs, an error, and the ports in the footer. Renders only inside CanvasBoard, which gives it focus, selection and the accessible name. Every state here is a story (DESIGN.md §7).",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".ds-node");
/** React Flow keeps a node hidden until it is measured; stories wait for that before they read it. */
const ready = async (root: HTMLElement, count: number) => {
  await waitFor(() => {
    expect(nodeEls(root)).toHaveLength(count);
    for (const n of root.querySelectorAll<HTMLElement>(".react-flow__node")) {
      expect(n.style.visibility).not.toBe("hidden");
    }
  });
};

/** The six kinds, each named by its Thai word in the header and in the accessible name. */
export const Variants: Story = {
  render: () => (
    <NodeBoard
      height={360}
      initial={row(
        // A group is its own component (NodeGroup, E4-3); the six kinds with ports render here.
        NODE_KINDS.filter((kind) => kind !== "group").map((kind, i) => ({
          kind,
          size: "sm",
          title:
            ["บรีฟ", "โปรไฟล์ลูกค้า", "โลโก้", "มู้ดบอร์ด", "Type direction", "โน้ต"][i] ?? kind,
          ...(i === 5 ? {} : { summary: "ข้อความตัวอย่างในตัว node" }),
        })),
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, 6);
    for (const word of ["บล็อกป้อนข้อมูล", "ความรู้", "ชิ้นงาน", "อ้างอิง", "ทิศทาง", "โน้ต"]) {
      await expect(canvas.getAllByText(word).length).toBeGreaterThan(0);
    }
    await expect(canvas.getByRole("group", { name: "โน้ต, โน้ต" })).toBeInTheDocument();
    await expect(canvas.getByText("ยังไม่มีเนื้อหา")).toBeVisible();
  },
};

/**
 * A note is glass (owner's choice, ORV-56): it lies over a knowledge node here so the blur shows.
 * Every other kind stays solid; under reduced transparency the note turns solid too.
 */
export const NoteGlass: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          {
            id: "under",
            type: "orivilo",
            position: { x: 0, y: 0 },
            data: {
              title: "โปรไฟล์ลูกค้า",
              kind: "knowledge",
              summary: fixtures.thai,
              inputs: [text],
              outputs: [image],
            },
          },
          {
            id: "note",
            type: "orivilo",
            position: { x: 160, y: 40 },
            data: {
              title: "โน้ต",
              kind: "note",
              size: "sm",
              summary: "จดไว้ก่อน ยังไม่ส่งให้ระบบ",
              inputs: [],
              outputs: [],
            },
          },
        ],
        edges: [],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 2);
    const [solid, note] = [...nodeEls(canvasElement)] as HTMLElement[];
    const glass = getComputedStyle(note as HTMLElement);
    await expect(glass.backdropFilter).toMatch(/blur\(\d+px\)/);
    await expect(glass.backgroundColor).toMatch(/^(rgba|color)\(.*(0\.\d+)\)$/);
    await expect(getComputedStyle(solid as HTMLElement).backdropFilter).toBe("none");
  },
};

/** sm 240, md 320, lg 480 from the node tokens; custom takes `node.width`. */
export const Sizes: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          ...row([{ size: "sm" }, { size: "md" }, { size: "lg" }]).nodes,
          {
            id: "custom",
            type: "orivilo",
            position: { x: 1200, y: 0 },
            width: 400,
            data: {
              title: "กว้าง 400 (custom)",
              kind: "knowledge",
              size: "custom",
              inputs: [text],
              outputs: [],
            },
          },
        ],
        edges: [],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 4);
    const widths = [...canvasElement.querySelectorAll<HTMLElement>(".react-flow__node")].map(
      (n) => n.getBoundingClientRect().width,
    );
    // fitView scales the row; the ratios hold: sm : md : lg : custom = 240 : 320 : 480 : 400.
    const [sm, md, lg, custom] = widths as [number, number, number, number];
    await expect(md / sm).toBeCloseTo(320 / 240, 1);
    await expect(lg / sm).toBeCloseTo(480 / 240, 1);
    await expect(custom / sm).toBeCloseTo(400 / 240, 1);
  },
};

/** Hover shows an edge, focus the ring outside the node, selected the violet edge; all three differ (DESIGN.md §7). */
export const InteractionStates: Story = {
  render: () => (
    <NodeBoard
      initial={{
        ...row([{ title: "hover" }, { title: "focus" }, { title: "selected" }]),
        nodes: row([{ title: "hover" }, { title: "focus" }, { title: "selected" }]).nodes.map(
          (n, i) => ({
            ...n,
            selected: i === 2,
          }),
        ),
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, 3);
    await userEvent.hover(canvas.getByText("hover"));
    const focus = canvas.getByRole("group", { name: "focus, ความรู้" });
    focus.focus();
    await expect(focus).toHaveFocus();
    const selected = canvasElement.querySelector(".ds-node[data-selected]") as HTMLElement;
    await expect(within(selected).getByText("selected")).toBeVisible();
    await expect(getComputedStyle(selected).borderColor).not.toBe(
      getComputedStyle(nodeEls(canvasElement)[1] as HTMLElement).borderColor,
    );
  },
};

/** While dragging the node lifts with the overlay shadow and the pane shows the grab cursor. */
export const Dragging: Story = {
  render: () => <NodeBoard initial={row([{ title: "ลากฉัน" }])} />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    const node = canvasElement.querySelector(".ds-node") as HTMLElement;
    const header = within(node).getByText("ลากฉัน");
    const r = header.getBoundingClientRect();
    const start = { x: Math.round(r.left + 10), y: Math.round(r.top + 5) };
    const user = userEvent.setup();
    await user.pointer([
      { keys: "[MouseLeft>]", target: header, coords: start },
      { target: header, coords: { x: start.x + 30, y: start.y + 30 } },
      { target: header, coords: { x: start.x + 60, y: start.y + 60 } },
    ]);
    await waitFor(() => expect(node).toHaveAttribute("data-dragging"));
    await user.pointer([
      { keys: "[/MouseLeft]", target: header, coords: { x: start.x + 60, y: start.y + 60 } },
    ]);
    await waitFor(() => expect(node).not.toHaveAttribute("data-dragging"));
  },
};

/** Running, stale and locked: a word and a glyph in the status colour; a locked node cannot move or connect. */
export const Statuses: Story = {
  render: () => (
    <NodeBoard
      initial={row([
        { title: "กำลังสร้างโลโก้", kind: "artifact", status: "running" },
        { title: "ชุดสีรอบแรก", kind: "artifact", status: "stale" },
        { title: "โปรไฟล์ที่อนุมัติ", kind: "knowledge", status: "locked" },
      ])}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, 3);
    await expect(canvas.getByText("กำลังทำงาน")).toBeVisible();
    await expect(canvas.getByText("ล้าสมัย")).toBeVisible();
    await expect(canvas.getByText("ล็อกแล้ว")).toBeVisible();
    await expect(canvasElement.querySelector('.ds-node[data-status="running"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );
    const locked = canvas.getByRole("group", { name: "โปรไฟล์ที่อนุมัติ, ความรู้" });
    await expect(locked).not.toHaveClass("draggable");
    await expect(within(locked).getAllByRole("img", { name: /แก้ไขไม่ได้$/ })).toHaveLength(2);
  },
};

/** Error: the danger edge and a message that says what went wrong and how to fix it. */
export const Error: Story = {
  render: () => (
    <NodeBoard
      initial={row([
        {
          title: "โลโก้",
          kind: "artifact",
          error: "สร้างไม่สำเร็จ เพราะไม่ได้รับภาพอ้างอิง ต่อสายจากมู้ดบอร์ดแล้วลองอีกครั้ง",
        },
      ])}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    const node = canvasElement.querySelector(".ds-node") as HTMLElement;
    await expect(node).toHaveAttribute("data-error");
    await expect(within(node).getByText(/สร้างไม่สำเร็จ/)).toBeVisible();
  },
};

/** Missing inputs: the lime row lists the words; asking for them is the Inspector's job (E4-4). */
export const MissingInputs: Story = {
  render: () => (
    <NodeBoard
      initial={row([{ title: "ชุดสี", kind: "artifact", missing: ["สีหลัก", "อารมณ์ของแบรนด์"] }])}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    await expect(
      within(canvasElement).getByText("ขาดข้อมูล: สีหลัก, อารมณ์ของแบรนด์"),
    ).toBeVisible();
  },
};

/** Collapsed: header and ports only; the body is hidden, the name and the handles stay. */
export const Collapsed: Story = {
  render: () => (
    <NodeBoard
      initial={row([
        { title: "พับแล้ว", summary: "ข้อความนี้ซ่อนอยู่", collapsed: true },
        { title: "ไม่พับ", summary: "ข้อความนี้แสดง" },
      ])}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, 2);
    await expect(canvas.queryByText("ข้อความนี้ซ่อนอยู่")).toBeNull();
    await expect(canvas.getByText("ข้อความนี้แสดง")).toBeVisible();
    await expect(canvasElement.querySelector("[data-collapsed] .ds-port__handle")).not.toBeNull();
  },
};

/** Read-only (present board): no hover edge, ports disabled, nothing drags. */
export const ReadOnly: Story = {
  render: () => <NodeBoard variant="present" initial={row([{ title: "ดูอย่างเดียว" }])} />,
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    const node = canvasElement.querySelector(".ds-node") as HTMLElement;
    await expect(node).toHaveAttribute("data-readonly");
    await expect(within(node).getAllByRole("img", { name: /แก้ไขไม่ได้$/ })).toHaveLength(2);
    await expect(node.closest(".react-flow__node")).not.toHaveClass("draggable");
  },
};

/** A rich body through the board's `renderBody` slot; `summary` is the fallback. */
export const RenderBody: Story = {
  render: () => (
    <NodeBoard
      initial={row([{ title: "ชุดสี", kind: "artifact", outputs: [] }])}
      renderBody={(node) => (
        <ul className="m-0 flex list-none gap-2 p-0" aria-label={`ชุดสีของ ${node.data.title}`}>
          {["bg-action-primary", "bg-action-intent", "bg-feedback-info-fg"].map((cls) => (
            <li key={cls} className={`size-8 rounded-control ${cls}`} />
          ))}
        </ul>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    await expect(within(canvasElement).getByRole("list", { name: "ชุดสีของ ชุดสี" })).toBeVisible();
  },
};

/** One node per cell under three profiles in both modes: the node tokens are locked, so it keeps its look. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <NodeBoard
        height={240}
        initial={row([{ title: fixtures.mixed, kind: "artifact", status: "running" }])}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 6);
  },
};

/** 360 px: the long Thai title and the long Latin summary wrap inside the node. */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <NodeBoard height={420} initial={{ nodes: [LONG_NODE], edges: [] }} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    const node = canvasElement.querySelector(".ds-node") as HTMLElement;
    for (const t of [fixtures.longThai, fixtures.longLatin]) {
      await expect(within(node).getByText(t).getBoundingClientRect().right).toBeLessThanOrEqual(
        node.getBoundingClientRect().right + 1,
      );
    }
  },
};
