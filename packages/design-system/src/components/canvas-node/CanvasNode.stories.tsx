import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import { type ReactNode, useEffect, useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { NODE_KINDS } from "../../tokens/canvas";
import {
  expectEdgeInk,
  expectLabelInkWhole,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import { blockNode, feed } from "../block-library/fixtures";
import { LONG_NODE } from "../canvas-board/fixtures";
import {
  type BoardNode,
  type Graph,
  type NodeContent,
  nodeLabel,
  nodeOpenLabel,
} from "../canvas-board/graph";
import { fixtures } from "../fixtures";
import { fillHeight, Matrix, Narrow } from "../matrix";

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
    <div style={{ height: fillHeight(height) }}>
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
          "Anything placed on the board (ADR 0004): an inset header frame with kind icon, kind, status, run time and title, a body per variant, run steps, missing inputs, an error, and the ports in the footer. Renders only inside CanvasBoard, which gives it focus, selection and the accessible name. Every state here is a story (DESIGN.md §7).",
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

/**
 * Hover shows an edge, focus the ring outside the node, selected the violet edge; all three differ
 * (DESIGN.md §7). A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the hover look
 * on the hover node (spec ORV-84, `hover-force-1`); the default node sits beside it.
 */
export const InteractionStates: Story = {
  parameters: {
    pseudo: { rootSelector: "body", hover: ['.react-flow__node[data-id="n1"] .ds-node'] },
  },
  render: () => {
    const graph = row([
      { title: "default" },
      { title: "hover" },
      { title: "focus" },
      { title: "selected" },
    ]);
    return (
      <NodeBoard
        initial={{ ...graph, nodes: graph.nodes.map((n, i) => ({ ...n, selected: i === 3 })) }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ready(canvasElement, 4);
    await userEvent.hover(canvas.getByText("hover"));
    const focus = canvas.getByRole("group", { name: "focus, ความรู้" });
    focus.focus();
    await expect(focus).toHaveFocus();
    const selected = canvasElement.querySelector(".ds-node[data-selected]") as HTMLElement;
    await expect(within(selected).getByText("selected")).toBeVisible();
    const rest = nodeEls(canvasElement)[0] as HTMLElement;
    await expect(getComputedStyle(selected).borderColor).not.toBe(
      getComputedStyle(rest).borderColor,
    );
    // The forced hover look: the hover node's border differs from the default node's.
    const hover = nodeEls(canvasElement)[1] as HTMLElement;
    await waitFor(() =>
      expect(getComputedStyle(hover).borderColor).not.toBe(getComputedStyle(rest).borderColor),
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

/**
 * Running (ORV-57): the AI gradient turns around the edge, the run time ticks, and the steps the
 * engine reports show with their icons in the gradient. A running node without steps or a start
 * time shows neither; a node at rest has no ring.
 */
export const RunningWithSteps: Story = {
  render: () => (
    <NodeBoard
      height={380}
      initial={row([
        {
          title: "โลโก้",
          kind: "artifact",
          status: "running",
          startedAt: new Date(Date.now() - 12_000).toISOString(),
          steps: [
            { id: "s1", label: "อ่านชุดสีจากโปรไฟล์", task: "read", state: "done" },
            { id: "s2", label: "ร่างโลโก้ 3 แบบ", task: "draft", state: "current" },
            { id: "s3", label: "เทียบกับบรีฟ", task: "compare", state: "pending" },
          ],
        },
        { title: "แคปชั่น", kind: "artifact", status: "running" },
        { title: "โปรไฟล์ที่อนุมัติ", kind: "knowledge", status: "locked" },
      ])}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 3);
    const [withSteps, bare, rest] = [...nodeEls(canvasElement)];
    if (!withSteps || !bare || !rest) throw new globalThis.Error("three nodes expected");
    const steps = within(withSteps).getByRole("list", { name: "ขั้นตอน" });
    await expect(within(steps).getAllByRole("listitem")).toHaveLength(3);
    await expect(within(steps).getByText("กำลังทำ")).toBeInTheDocument();
    await expect(withSteps.querySelector(".ds-node__elapsed")?.textContent).toMatch(/^0:1\d$/);
    for (const icon of withSteps.querySelectorAll(".ds-node__step svg")) {
      await expect(getComputedStyle(icon).stroke).toMatch(/url\(/);
    }
    await expect(getComputedStyle(withSteps, "::before").animationName).toBe("ds-node-ring");
    await expect(bare.querySelector(".ds-node__steps")).toBeNull();
    await expect(bare.querySelector(".ds-node__elapsed")).toBeNull();
    await expect(getComputedStyle(bare, "::before").animationName).toBe("ds-node-ring");
    await expect(getComputedStyle(rest, "::before").content).toBe("none");
    await expect(rest.querySelector(".ds-node__chip svg")).not.toBeNull();
    // ORV-59: the header is a glass frame 4 px inside the edge, its corners concentric.
    const header = rest.querySelector<HTMLElement>(".ds-node__header");
    if (!header) throw new globalThis.Error("header expected");
    const frame = getComputedStyle(header);
    await expect(frame.marginLeft).toBe("4px");
    const outer = Number.parseFloat(getComputedStyle(rest).borderTopLeftRadius);
    await expect(Number.parseFloat(frame.borderTopLeftRadius)).toBe(outer - 4);
    await expect(frame.backgroundImage).toMatch(/linear-gradient/);
    await expect(frame.backdropFilter).toMatch(/blur/);
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

/**
 * Block nodes (ORV-44 part 2): a node made from a registry block derives its fill state from its
 * answers and edges. Empty: dashed frame, "ยังว่าง", and its first question as the body.
 */
export const Empty: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{ nodes: [blockNode("mood", "mood-theme", { x: 0, y: 0 })], edges: [] }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 1);
    const node = nodeEls(canvasElement)[0] as HTMLElement;
    await expect(node).toHaveAttribute("data-fill", "empty");
    await expect(within(node).getByText("ยังว่าง")).toBeVisible();
    await expect(within(node).getByText("ต่อสายจากบุคลิกแบรนด์ หรือบอกบุคลิกสามคำ")).toBeVisible();
    await expect(getComputedStyle(node).borderTopStyle).toBe("dashed");
    await expect(within(node).queryByText("ตามกฎ")).toBeNull();
  },
};

/** Partial: some required answers; the header counts what is left and the body shows the summary so far. */
export const Partial: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          blockNode("brief", "brief", { x: 0, y: 0 }, { product: "แอปออมเงินสำหรับคนทำงาน" }),
          blockNode("audience", "audience", { x: 400, y: 0 }),
        ],
        edges: [feed("brief", "audience", "brief")],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 2);
    const brief = nodeEls(canvasElement)[0] as HTMLElement;
    await expect(brief).toHaveAttribute("data-fill", "partial");
    await expect(within(brief).getByText("ถามอีก 1 ข้อ")).toBeVisible();
    await expect(within(brief).getByText("ผลิตภัณฑ์: แอปออมเงินสำหรับคนทำงาน")).toBeVisible();
    await expect(within(brief).getByText("ตามกฎ")).toBeVisible();
    await expect(getComputedStyle(brief).borderTopStyle).toBe("solid");
  },
};

/**
 * Summarized: every required input, by answer or by an edge from a complete node. The summary
 * names its source and shows a swatch row when it holds colours.
 */
export const Summarized: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          blockNode(
            "colours",
            "typed-colours",
            { x: 0, y: 0 },
            { colours: ["#7a22c7", "#c6f432"] },
          ),
          blockNode("starter", "starter-colours", { x: 400, y: 0 }),
        ],
        edges: [feed("colours", "starter", "primary")],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 2);
    const [colours, starter] = [...nodeEls(canvasElement)] as [HTMLElement, HTMLElement];
    for (const node of [colours, starter]) {
      await expect(node).toHaveAttribute("data-fill", "summarized");
      await expect(within(node).getByText("สรุปแล้ว")).toBeVisible();
      await expect(node.querySelectorAll(".ds-node__swatch")).toHaveLength(2);
    }
    await expect(within(colours).getByText("สี: #7a22c7, #c6f432")).toBeVisible();
    await expect(within(starter).getByText("สีหลัก: จาก สีที่พิมพ์มา")).toBeVisible();
  },
};

/** Unlinked: content but no edge on a board with other nodes; the summary stays. */
export const Unlinked: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          blockNode(
            "personality",
            "brand-personality",
            { x: 0, y: 0 },
            {
              traits: "อบอุ่น จริงใจ ชัดเจน",
            },
          ),
          blockNode("mood", "mood-theme", { x: 400, y: 0 }),
        ],
        edges: [],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 2);
    const node = nodeEls(canvasElement)[0] as HTMLElement;
    await expect(node).toHaveAttribute("data-fill", "unlinked");
    await expect(within(node).getByText("ยังไม่เชื่อม")).toBeVisible();
    await expect(within(node).getByText("บุคลิก: อบอุ่น จริงใจ ชัดเจน")).toBeVisible();
  },
};

/**
 * Suggested (ORV-61): a font node fed by a mood names its top suggestion by rules until something
 * is picked; the node stays labelled as made by rules.
 */
export const Suggested: Story = {
  render: () => (
    <NodeBoard
      height={320}
      initial={{
        nodes: [
          blockNode(
            "mood",
            "mood-theme",
            { x: 0, y: 0 },
            { personality: "อบอุ่น เป็นมิตร", feeling: "สนุก" },
          ),
          blockNode("font", "font", { x: 400, y: 0 }, { languages: "th-en" }),
        ],
        edges: [feed("mood", "font", "mood")],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 2);
    const font = nodeEls(canvasElement)[1] as HTMLElement;
    await expect(within(font).getByText("ฟอนต์ที่อยากใช้: แนะนำ Mali")).toBeVisible();
    await expect(within(font).getByText("ตามกฎ")).toBeVisible();
  },
};

/** Tall enough that the board toolbar, wrapped or not, covers no part of the three nodes (ORV-107 row 31). */
const HEIGHT = 520;

/**
 * Basis (ORV-106): a node made from a chat reply names how it was made after the kind word, by
 * rules or from mock data. A node without a basis shows no word. The word follows the kind word by
 * one text space and no margin (ORV-107 row 29). Checked in every cell, both modes; in each, the
 * board toolbar meets none of the nodes.
 */
export const Basis: Story = {
  render: () => (
    <Matrix>
      <NodeBoard
        height={HEIGHT}
        initial={row([
          { title: "ตามกฎ node", kind: "artifact", size: "sm", basis: "rules" },
          { title: "จำลอง node", kind: "artifact", size: "sm", basis: "mock" },
          { title: "ไม่มี basis node", kind: "artifact", size: "sm" },
        ])}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement, 18);
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const canvas = within(cell);
      const nodeOf = (title: string) =>
        canvas.getByText(title).closest<HTMLElement>(".ds-node") as HTMLElement;
      const basisOf = (title: string) => nodeOf(title).querySelector(".ds-node__basis");
      await expect(basisOf("ตามกฎ node")).toHaveTextContent("ตามกฎ");
      await expect(basisOf("จำลอง node")).toHaveTextContent("ข้อมูลจำลอง");
      await expect(basisOf("ไม่มี basis node")).toBeNull();
      await expect(basisOf("ตามกฎ node")).toBeVisible();
      const kind = nodeOf("ตามกฎ node").querySelector(".ds-node__kind") as HTMLElement;
      await expect(kind.textContent).toBe("ชิ้นงาน ตามกฎ");
      await expect(getComputedStyle(basisOf("ตามกฎ node") as Element).marginInlineStart).toBe(
        "0px",
      );
      const bar = canvas.getByRole("toolbar", { name: "เครื่องมือกระดาน" }).getBoundingClientRect();
      for (const title of ["ตามกฎ node", "จำลอง node", "ไม่มี basis node"]) {
        const r = nodeOf(title).getBoundingClientRect();
        await expect(
          r.left < bar.right && r.right > bar.left && r.top < bar.bottom && r.bottom > bar.top,
        ).toBe(false);
      }
    }
  },
};

/* The present look (ORV-274): the name above one card, the ports as dots on its edge. ---------- */

type Lang = "th" | "en";

/** The author's words for the present fixtures; the catalog words (kind, ports) come from the board. */
const WORDS = {
  th: {
    rest: "ปกติ",
    hover: "โฮเวอร์",
    selected: "เลือกอยู่",
    focus: "โฟกัส",
    logo: "โลโก้",
    media: "มู้ดบอร์ด",
    missing: "ยังไม่ครบ",
    source: "ที่มา: บรีฟลูกค้า",
    summary: "ข้อความตัวอย่างในตัว node",
    pages: "3 หน้า",
    openName: "โลโก้ 3 หน้า",
    empty: "ยังไม่มีเนื้อหา",
    text: "ข้อความ",
    image: "ภาพ",
    readOnly: "แก้ไขไม่ได้",
  },
  en: {
    rest: "Rest",
    hover: "Hover",
    selected: "Selected",
    focus: "Focus",
    logo: "Logo",
    media: "Mood board",
    missing: "Incomplete",
    source: "Source: client brief",
    summary: "Sample text inside the node",
    pages: "3 pages",
    openName: "Logo, 3 pages",
    empty: "No content yet",
    text: "Text",
    image: "Image",
    readOnly: "read only",
  },
} as const;

/** The card of a node, by id, inside a board. */
const cardOf = (root: Element, id: string) =>
  root.querySelector(`.react-flow__node[data-id="${id}"] .ds-node`) as HTMLElement;
const wrapperOf = (root: Element, id: string) =>
  root.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement;

/** The media slot of the media node, filled by the board's `renderBody`. */
const presentBody = (node: BoardNode): ReactNode =>
  node.data.pad === "media" ? (
    <div className="ds-node__media h-20 bg-surface-sunken" data-testid="media" />
  ) : undefined;

/** Seven nodes on a grid, 100 px apart so the name pills of the ports have room. */
function presentStates(lang: Lang): Graph {
  const w = WORDS[lang];
  const ports = {
    inputs: [{ id: "text", kind: "text" as const, label: w.text }],
    outputs: [{ id: "image", kind: "image" as const, label: w.image }],
  };
  const spec: [id: string, data: Partial<NodeContent>, selected?: boolean][] = [
    ["n0", { title: w.rest, kind: "knowledge", summary: w.summary, source: w.source }],
    ["n1", { title: w.hover, kind: "direction", summary: w.summary, source: w.source }],
    ["n2", { title: w.selected, kind: "reference", summary: w.summary, source: w.source }, true],
    ["n3", { title: w.focus, kind: "knowledge", summary: w.summary, source: w.source }],
    [
      "n4",
      { title: w.logo, kind: "artifact", summary: w.summary, open: { count: 3 }, status: "stale" },
    ],
    ["n5", { title: w.media, kind: "direction", pad: "media", source: w.source }],
    ["n6", { title: fixtures.longThai, kind: "knowledge", missing: [w.missing], basis: "rules" }],
  ];
  return {
    nodes: spec.map(([id, data, selected], i) => ({
      id,
      type: "orivilo" as const,
      position: { x: (i % 4) * 360, y: Math.floor(i / 4) * 260 },
      ...(selected ? { selected: true } : {}),
      data: { size: "sm" as const, ...ports, ...data } as NodeContent,
    })),
    edges: [],
  };
}

const PRESENT_HEIGHT = 560;

async function playPresentStates(root: HTMLElement, lang: Lang) {
  const w = WORDS[lang];
  await ready(root, 7);
  const cs = (el: Element) => getComputedStyle(el);
  // Spec row 1: the name sits above the card, one surface with one hairline, no band, frame or footer.
  for (const id of ["n0", "n1", "n2", "n3", "n4", "n5", "n6"]) {
    const card = cardOf(root, id);
    const label = card.querySelector(".ds-node__label") as HTMLElement;
    await expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      card.getBoundingClientRect().top,
    );
    await expect(label.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    for (const part of [".ds-node__header", ".ds-node__meta", ".ds-node__kind", ".ds-node__chip"]) {
      await expect(card.querySelector(part), `${id} ${part}`).toBeNull();
    }
    await expect(cs(card).borderTopWidth).toBe("1px");
  }
  const rest = cardOf(root, "n0");
  await expect(cs(rest).borderTopColor).toBe(resolvedColor(rest, "--ds-border-subtle"));
  await expect(cs(rest).outlineStyle).toBe("none");
  // The label stays on one line: the long title is cut (it fades, no ellipsis, ORV-280 D4), and no taller than a short one.
  const long = cardOf(root, "n6");
  const title = long.querySelector(".ds-node__title") as HTMLElement;
  await expect(cs(title).textOverflow).toBe("clip");
  await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
  await expect(
    (long.querySelector(".ds-node__label") as HTMLElement).getBoundingClientRect().height,
  ).toBeCloseTo(
    (rest.querySelector(".ds-node__label") as HTMLElement).getBoundingClientRect().height,
    1,
  );
  // The kind word is not shown; the status and the basis follow the title.
  await expect(long.querySelector(".ds-node__basis")).toHaveTextContent(
    lang === "th" ? "ตามกฎ" : "By rules",
  );
  await expect(cardOf(root, "n4").querySelector(".ds-node__status")).toBeInTheDocument();
  // Spec row 4: hover takes the hover border, selected the border plus a 1 px inner outline.
  const hover = cardOf(root, "n1");
  // The probe colour is read once, outside `waitFor`: a probe node added inside it would trigger
  // the observer that `waitFor` runs on, and loop.
  const hoverBorder = resolvedColor(hover, "--cmp-node-border-hover");
  await waitFor(() => expect(cs(hover).borderTopColor).toBe(hoverBorder));
  await expect(cs(hover).borderTopColor).not.toBe(cs(rest).borderTopColor);
  const selected = cardOf(root, "n2");
  await expect(cs(selected).borderTopColor).toBe(
    resolvedColor(selected, "--cmp-node-border-selected"),
  );
  await expect(cs(selected).outlineStyle).toBe("solid");
  await expect(cs(selected).outlineWidth).toBe("1px");
  await expect(cs(selected).outlineOffset).toBe("-2px");
  await expect(cs(selected).outlineColor).toBe(
    resolvedColor(selected, "--cmp-node-border-selected"),
  );
  // Focus is the line and halo outside, never the selection look.
  const focus = within(root).getByRole("group", {
    name: `${w.focus}, ${lang === "th" ? "ความรู้" : "knowledge"}`,
  });
  focus.focus();
  await expect(focus).toHaveFocus();
  const ring = cs(focus);
  await expect(ring.outlineStyle).not.toBe("none");
  await expect(ring.outlineOffset).toBe("0px");
  await expect(ring.boxShadow).not.toBe("none");
  await expect(ring.outlineOffset).not.toBe(cs(selected).outlineOffset);
  await expect(ring.boxShadow).not.toBe(cs(selected).boxShadow);
  await expect(cs(cardOf(root, "n3")).outlineStyle).toBe("none");
  await expect(cs(cardOf(root, "n3")).borderTopColor).toBe(cs(rest).borderTopColor);
  // Spec row 3: the source pill is hidden at rest and shows on hover, on selection and on focus.
  const pill = (id: string) => cardOf(root, id).querySelector(".ds-node__source") as HTMLElement;
  await expect(pill("n0")).toHaveTextContent(w.source);
  await expect(cs(pill("n0")).visibility).toBe("hidden");
  await waitFor(() => expect(cs(pill("n1")).visibility).toBe("visible"));
  await expect(cs(pill("n2")).visibility).toBe("visible");
  await waitFor(() => expect(cs(pill("n3")).visibility).toBe("visible"));
  // Spec row 5: a node with `open` is named with its page count, takes the popup attribute and the
  // zoom-in cursor, and ends its title row with the pages word and the open glyph.
  const open = within(root).getByRole("group", { name: w.openName });
  await expect(open).toHaveAttribute("aria-haspopup", "dialog");
  await expect(wrapperOf(root, "n0")).not.toHaveAttribute("aria-haspopup");
  const result = cardOf(root, "n4");
  await expect(result).toHaveAttribute("data-open", "");
  await expect(result.querySelector(".ds-node__pages")).toHaveTextContent(w.pages);
  await expect(result.querySelector(".ds-node__pages")).toBeVisible();
  await expect(result.querySelector(".ds-node__open")).toBeVisible();
  await expect(result.querySelector(".ds-node__open")).toHaveAttribute("aria-hidden", "true");
  await expect(cs(result).cursor).toBe("zoom-in");
  await expect(cs(rest).cursor).toBe("default");
  // Spec row 2: media pad 8 and a slot rounded to the node radius less that; text pads 16.
  const media = cardOf(root, "n5");
  await expect(cs(media).paddingTop).toBe("8px");
  await expect(cs(rest).paddingTop).toBe("16px");
  await expect(cardOf(root, "n5")).toHaveAttribute("data-pad", "media");
  const slot = media.querySelector(".ds-node__media") as HTMLElement;
  await expect(parseFloat(cs(slot).borderTopLeftRadius)).toBeCloseTo(
    parseFloat(cs(media).borderTopLeftRadius) - 8,
    2,
  );
  await expect(cs(slot).overflow).toBe("hidden");
  // A node with a missing value says so; an empty body shows the catalog's empty word.
  await expect(within(long).getByText(w.missing, { exact: false })).toBeVisible();
  await expect(within(cardOf(root, "n5")).queryByText(w.empty)).toBeNull();
}

/**
 * The present node (spec rows 1 to 5): the name above the card, one surface with a hairline, hover,
 * selected and keyboard focus each different, a result that opens, a media pad, a long title cut
 * off, a missing value and the source pill. Hover is forced by the pseudo-states addon.
 */
export const PresentStates: Story = {
  parameters: {
    pseudo: { rootSelector: "body", hover: ['.react-flow__node[data-id="n1"]'] },
  },
  render: () => (
    <NodeBoard
      variant="present"
      height={PRESENT_HEIGHT}
      renderBody={presentBody}
      chrome={false}
      onNodeOpen={fn()}
      initial={presentStates("th")}
    />
  ),
  play: async ({ canvasElement }) => playPresentStates(canvasElement, "th"),
};

/** The same present states with English names, in dark mode. */
export const PresentStatesInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  parameters: {
    pseudo: { rootSelector: "body", hover: ['.react-flow__node[data-id="n1"]'] },
  },
  render: () => (
    <NodeBoard
      variant="present"
      height={PRESENT_HEIGHT}
      renderBody={presentBody}
      chrome={false}
      onNodeOpen={fn()}
      initial={presentStates("en")}
    />
  ),
  play: async ({ canvasElement }) => playPresentStates(canvasElement, "en"),
};

/** The four kinds of a present board, each with its glyph and name above the card (spec row 1). */
function presentKinds(lang: Lang): Graph {
  const w = WORDS[lang];
  const kinds = ["knowledge", "direction", "artifact", "reference"] as const;
  return {
    nodes: kinds.map((kind, i) => ({
      id: `k${i}`,
      type: "orivilo" as const,
      position: { x: 32 + i * 340, y: 64 },
      data: {
        title: `${w.logo} ${i + 1}`,
        kind,
        size: "sm" as const,
        summary: w.summary,
        inputs: [{ id: "text", kind: "text" as const, label: w.text }],
        outputs: [{ id: "image", kind: "image" as const, label: w.image }],
      },
    })),
    edges: [],
  };
}

async function playPresentKinds(root: HTMLElement, lang: Lang) {
  await ready(root, 4);
  const names = (
    lang === "th"
      ? ["ความรู้", "ทิศทาง", "ชิ้นงาน", "อ้างอิง"]
      : ["knowledge", "direction", "artifact", "reference"]
  ).map((kind, i) => `${WORDS[lang].logo} ${i + 1}, ${kind}`);
  for (const name of names) await expect(within(root).getByRole("group", { name })).toBeVisible();
  // The first dot is whole (S6): the leftmost port starts inside the board, not over its edge.
  const flowBox = (root.querySelector(".react-flow") as Element).getBoundingClientRect();
  const lefts = [...root.querySelectorAll(".ds-port__handle")].map(
    (h) => h.getBoundingClientRect().left,
  );
  await expect(Math.min(...lefts) - flowBox.left).toBeGreaterThanOrEqual(23);
  // Each kind draws its own glyph in the label, and the kind word is not on the card.
  const glyphs = new Set(
    [...root.querySelectorAll(".ds-node__label > svg:first-child")].map((g) => g.innerHTML),
  );
  await expect(glyphs.size).toBe(4);
  for (const kind of ["ความรู้", "ทิศทาง", "knowledge", "direction"]) {
    await expect(within(root).queryByText(kind)).toBeNull();
  }
  // The card's hairline is 1 px of ink, read from the pixels at zoom 1 (the board does not fit the
  // view). Top and bottom only: the port dots sit on the side edges. Read in light mode only: in dark
  // the hairline is border.subtle on a card 1.1 from the ground by design, too faint for the pixel
  // reader's threshold, so the English twin asserts the computed border colour and width instead.
  // The third card is read, not the second: a ground dot 4 px above the second card's top centre
  // reads as a second line of ink there (the cards start at x = 32 since S6).
  if (inVitest && lang === "th") await expectEdgeInk(cardOf(root, "k2"), ["top", "bottom"], 1);
  const hairline = getComputedStyle(cardOf(root, "k1"));
  await expect(hairline.borderTopWidth).toBe("1px");
  await expect(hairline.borderTopColor).toBe(
    resolvedColor(cardOf(root, "k1"), "--ds-border-subtle"),
  );
}

/** The four kinds on a present board: a glyph and a title above each card, no kind word (spec row 1). */
export const Present: Story = {
  render: () => (
    <NodeBoard
      variant="present"
      height={320}
      chrome={false}
      fitView={false}
      initial={presentKinds("th")}
    />
  ),
  play: async ({ canvasElement }) => playPresentKinds(canvasElement, "th"),
};

/** The four kinds in English, in dark mode. */
export const PresentInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => (
    <NodeBoard
      variant="present"
      height={320}
      chrome={false}
      fitView={false}
      initial={presentKinds("en")}
    />
  ),
  play: async ({ canvasElement }) => playPresentKinds(canvasElement, "en"),
};

/* A node that opens one view, with no page count (ORV-282). ---------------------------------------- */

/** One node that opens with no `count`, one with a count, one with a count of 1, and a plain one. */
function openWithoutCount(lang: Lang): Graph {
  const title = lang === "th" ? "สถานการณ์ตั้งต้น" : "Situation";
  const base = { kind: "knowledge" as const, size: "sm" as const, inputs: [], outputs: [] };
  return {
    nodes: [
      { id: "view", type: "orivilo", position: { x: 0, y: 0 }, data: { ...base, title, open: {} } },
      {
        id: "pages",
        type: "orivilo",
        position: { x: 360, y: 0 },
        data: { ...base, title: `${title} 2`, open: { count: 3 } },
      },
      {
        id: "one",
        type: "orivilo",
        position: { x: 720, y: 0 },
        data: { ...base, title: `${title} 3`, open: { count: 1 } },
      },
      {
        id: "plain",
        type: "orivilo",
        position: { x: 1080, y: 0 },
        data: { ...base, title: `${title} 4` },
      },
    ],
    edges: [],
  };
}

/**
 * `open: {}` on both boards: the title row ends with the open glyph and no pages word, the name is
 * the plain "title, kind" and the node still takes the popup attribute. A node with a count keeps
 * its pages word and its page-count name, and a plain node has neither glyph nor popup.
 */
async function playOpenWithoutCount(root: HTMLElement, lang: Lang) {
  const w = {
    th: {
      name: "สถานการณ์ตั้งต้น, ความรู้",
      pages: "3 หน้า",
      pagesName: "สถานการณ์ตั้งต้น 2 3 หน้า",
      one: "1 หน้า",
      oneName: "สถานการณ์ตั้งต้น 3 1 หน้า",
    },
    en: {
      name: "Situation, knowledge",
      pages: "3 pages",
      pagesName: "Situation 2, 3 pages",
      one: "1 page",
      oneName: "Situation 3, 1 page",
    },
  }[lang];
  await ready(root, 8);
  const boards = [...root.querySelectorAll<HTMLElement>(".ds-board")];
  await expect(boards).toHaveLength(2);
  for (const [index, board] of boards.entries()) {
    const view = wrapperOf(board, "view");
    await expect(within(board).getByRole("group", { name: w.name })).toBe(view);
    // The first board has `onNodeOpen` and the popup attribute; the second has neither (ORV-280 D9).
    if (index === 0) await expect(view).toHaveAttribute("aria-haspopup", "dialog");
    else await expect(view).not.toHaveAttribute("aria-haspopup");
    await expect(view).toHaveAccessibleName(w.name);
    await expect(view.querySelector(".ds-node__pages")).toBeNull();
    // The glyph shows only where the board can open: the second board has no `onNodeOpen`, so its
    // node draws none (ORV-280 S3).
    if (index === 0) await expect(view.querySelector(".ds-node__open")).toBeVisible();
    else await expect(view.querySelector(".ds-node__open")).toBeNull();
    await expect(cardOf(board, "view")).toHaveAttribute("data-open", "");
    await expect(getComputedStyle(cardOf(board, "view")).cursor).toBe("zoom-in");
    // With a count the pages word and the page-count name stay, as they were.
    const pages = wrapperOf(board, "pages");
    await expect(pages.querySelector(".ds-node__pages")).toHaveTextContent(w.pages);
    await expect(pages).toHaveAccessibleName(w.pagesName);
    if (index === 0) await expect(pages.querySelector(".ds-node__open")).toBeVisible();
    else await expect(pages.querySelector(".ds-node__open")).toBeNull();
    // A count of 1 takes the singular form in the title row and in the name (ORV-280 D7).
    const one = wrapperOf(board, "one");
    await expect(one.querySelector(".ds-node__pages")).toHaveTextContent(new RegExp(`^${w.one}$`));
    await expect(one).toHaveAccessibleName(w.oneName);
    // A plain node has no glyph and no popup.
    const plain = wrapperOf(board, "plain");
    await expect(plain.querySelector(".ds-node__open")).toBeNull();
    await expect(plain).not.toHaveAttribute("aria-haspopup");
  }
}

/** A node that opens with no page count, on a present and an edit board, in Thai. */
export const OpenWithoutCount: Story = {
  render: () => (
    <>
      <NodeBoard
        variant="present"
        label="present"
        height={240}
        chrome={false}
        onNodeOpen={fn()}
        initial={openWithoutCount("th")}
      />
      <NodeBoard label="edit" height={300} chrome={false} initial={openWithoutCount("th")} />
    </>
  ),
  play: async ({ canvasElement }) => playOpenWithoutCount(canvasElement, "th"),
};

/** The same in English, in dark mode. */
export const OpenWithoutCountInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => (
    <>
      <NodeBoard
        variant="present"
        label="present"
        height={240}
        chrome={false}
        onNodeOpen={fn()}
        initial={openWithoutCount("en")}
      />
      <NodeBoard label="edit" height={300} chrome={false} initial={openWithoutCount("en")} />
    </>
  ),
  play: async ({ canvasElement }) => playOpenWithoutCount(canvasElement, "en"),
};

/* A present label never passes its card (ORV-274, F2). --------------------------------------------- */

/** The board's React Flow instance, handed over by a child of the board, so a play can zoom it. */
let flow: ReactFlowInstance | undefined;
function FlowHandle() {
  const instance = useReactFlow();
  useEffect(() => {
    flow = instance;
    return () => {
      flow = undefined;
    };
  }, [instance]);
  return null;
}

/**
 * Three `sm` cards in a row: a long title with a basis, a status and a page count; a short title with
 * a status and a page count; a short title alone.
 */
function narrowLabels(lang: Lang): Graph {
  const w = WORDS[lang];
  const spec: Partial<NodeContent>[] = [
    {
      title: lang === "th" ? fixtures.longThai : fixtures.longLatin,
      kind: "knowledge",
      basis: "rules",
      status: "stale",
      open: { count: 3 },
    },
    { title: w.logo, kind: "artifact", status: "stale", open: { count: 3 } },
    { title: w.rest, kind: "direction" },
  ];
  return {
    nodes: spec.map((data, i) => ({
      id: `l${i}`,
      type: "orivilo" as const,
      position: { x: 32 + i * 340, y: 64 },
      data: { size: "sm" as const, inputs: [], outputs: [], ...data } as NodeContent,
    })),
    edges: [],
  };
}

/** The zoom the viewport has, read from its transform. */
const viewportZoom = (root: Element) =>
  parseFloat(
    /scale\(([\d.]+)\)/.exec(
      root.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform ?? "",
    )?.[1] ?? "NaN",
  );

/** Sets the zoom and waits until the viewport and the labels' own scale both hold it. */
async function zoomBoard(root: HTMLElement, zoom: number) {
  await waitFor(async () => {
    await flow?.zoomTo(zoom, { duration: 0 });
    expect(viewportZoom(root)).toBeCloseTo(zoom, 3);
    for (const label of root.querySelectorAll(".ds-node__label")) {
      const scale = getComputedStyle(label).scale;
      expect(scale === "none" ? 1 : parseFloat(scale)).toBeCloseTo(Math.max(1, 1 / zoom), 2);
    }
  });
}

/** The parts of a label in DOM order, each with its rect: the status's glyph and its word are two. */
function labelParts(label: Element) {
  const parts: { name: string; rect: DOMRect }[] = [];
  const text = (node: Node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  };
  for (const child of label.children) {
    if (child.classList.contains("ds-node__status")) {
      for (const inner of child.childNodes) {
        const name = inner.nodeType === Node.TEXT_NODE ? "status-word" : "status-glyph";
        parts.push({
          name,
          rect: inner instanceof Element ? inner.getBoundingClientRect() : text(inner),
        });
      }
    } else {
      const name = child.classList.contains("ds-node__title")
        ? "title"
        : child.classList.contains("ds-node__basis")
          ? "basis"
          : child.classList.contains("ds-node__pages")
            ? "pages"
            : child.classList.contains("ds-node__open")
              ? "open"
              : "kind";
      parts.push({ name, rect: child.getBoundingClientRect() });
    }
  }
  return parts;
}

/** What a label shows: each part's name, in DOM order, whether it lies inside the label's box. */
function shownParts(label: Element) {
  const box = label.getBoundingClientRect();
  return labelParts(label).map(({ name, rect }) => ({
    name,
    rect,
    shown:
      rect.left >= box.left - 0.5 &&
      rect.right <= box.right + 0.5 &&
      // A part is on the first line when its middle is: the title's rect is its padded clip box (4 px
      // taller each way), and a taller part (the pages word) moves it a pixel past the label's edge.
      // A part on the wrapped line is 24 px lower, so its middle is far outside.
      (rect.top + rect.bottom) / 2 >= box.top &&
      (rect.top + rect.bottom) / 2 <= box.bottom,
  }));
}

async function playNarrowLabels(root: HTMLElement, lang: Lang) {
  await ready(root, 3);
  const labels = () => [...root.querySelectorAll<HTMLElement>(".ds-node__label")];
  const checkStep = (zoom: number) => {
    for (const label of labels()) {
      const card = label.closest(".ds-node") as HTMLElement;
      const box = label.getBoundingClientRect();
      // Never wider than its card.
      expect(
        box.width,
        `at zoom ${zoom}, a label is ${box.width} px in a ${card.getBoundingClientRect().width} px card`,
      ).toBeLessThanOrEqual(card.getBoundingClientRect().width + 0.5);
      const parts = shownParts(label);
      // The shown parts are a prefix of the DOM order.
      const firstHidden = parts.findIndex((p) => !p.shown);
      if (firstHidden >= 0) {
        for (const p of parts.slice(firstHidden)) {
          expect(p.shown, `at zoom ${zoom}, ${p.name} shows after a hidden part`).toBe(false);
          // A hidden part is on the wrapped line, at or below the label's bottom.
          expect(
            p.rect.top,
            `at zoom ${zoom}, hidden ${p.name} sits inside the label`,
          ).toBeGreaterThanOrEqual(box.bottom - 0.5);
        }
      }
      // The title always keeps a stub: 4em of the label type, or the line after the kind glyph, or
      // its whole text when that is shorter (it never grows past its text).
      const title = parts.find((p) => p.name === "title");
      const text = label.querySelector(".ds-node__title") as HTMLElement;
      expect(title?.shown, `at zoom ${zoom}, the title is hidden`).toBe(true);
      expect(title?.rect.width ?? 0).toBeGreaterThanOrEqual(
        Math.min(52, box.width - 18, text.scrollWidth) - 0.5,
      );
    }
    // Every label is the same height whatever wraps.
    const [first, ...rest] = labels();
    if (first) expectSameHeight(first, ...rest);
  };
  // Row 23 (D4): a cut title has no ellipsis, so no empty run follows its last mark. It fades out and
  // keeps `space.inline-sm` (4) before the next part that shows; a title that fits is plain.
  let cutBeforeAPart = 0;
  const checkCut = async (zoom: number) => {
    await waitFor(() => {
      let cuts = 0;
      for (const label of labels()) {
        const title = label.querySelector<HTMLElement>(".ds-node__title") as HTMLElement;
        const cut = title.scrollWidth > title.clientWidth;
        const style = getComputedStyle(title);
        expect(title.hasAttribute("data-cut"), `at zoom ${zoom}, data-cut follows the clip`).toBe(
          cut,
        );
        expect(style.textOverflow, `at zoom ${zoom}, a title shows no ellipsis`).toBe("clip");
        expect(style.maskImage !== "none", `at zoom ${zoom}, a cut title fades out`).toBe(cut);
        if (!cut) continue;
        cuts++;
        // The fade runs over the title's last 2em: its transparent stop sits 2em from the end.
        const stop = /calc\(100% - ([\d.]+)px\)/.exec(style.maskImage)?.[1];
        expect(
          Number(stop),
          `at zoom ${zoom}, the fade starts ${stop} px from the end of ${style.maskImage}`,
        ).toBeCloseTo(2 * parseFloat(style.fontSize), 0);
        const parts = shownParts(label);
        const next = parts[parts.findIndex((p) => p.name === "title") + 1];
        if (next?.shown) {
          cutBeforeAPart++;
          const gap = next.rect.left - title.getBoundingClientRect().right;
          expect(
            Math.abs(gap - 4),
            `at zoom ${zoom}, ${gap} px between a cut title and ${next.name}`,
          ).toBeLessThanOrEqual(0.5);
        }
      }
      expect(cuts, `at zoom ${zoom}, a title is cut`).toBeGreaterThan(0);
    });
  };
  for (const zoom of [1, 0.8, 0.6, 0.4, 0.25]) {
    await zoomBoard(root, zoom);
    checkStep(zoom);
    await checkCut(zoom);
    const shown = labels().map((label) =>
      shownParts(label)
        .filter((p) => p.shown)
        .map((p) => p.name),
    );
    if (zoom === 1) {
      // At 1 the two short cards show every part they have.
      await expect(shown[1]).toEqual([
        "kind",
        "title",
        "status-glyph",
        "status-word",
        "pages",
        "open",
      ]);
      await expect(shown[2]).toEqual(["kind", "title"]);
    }
    if (zoom === 0.25) for (const parts of shown) await expect(parts).toEqual(["kind", "title"]);
  }
  await expect(cutBeforeAPart, "a cut title with a part after it").toBeGreaterThan(0);
  // The mark is read again when the title's box changes and when a font loads, with no render in
  // between. A label that is given room makes its title whole, and takes it back when the room goes.
  await zoomBoard(root, 1);
  const cutLabel = labels().find((l) =>
    l.querySelector(".ds-node__title")?.hasAttribute("data-cut"),
  );
  const cutTitle = cutLabel?.querySelector(".ds-node__title") as HTMLElement;
  if (!cutLabel) return expect(cutLabel, "a cut title at zoom 1").toBeDefined();
  const width = cutLabel.style.width;
  cutLabel.style.width = "900px";
  await waitFor(() => expect(cutTitle.hasAttribute("data-cut"), "a title with room").toBe(false));
  cutLabel.style.width = width;
  await waitFor(() => expect(cutTitle.hasAttribute("data-cut"), "the room taken back").toBe(true));
  // A font that loads changes the text and not the box: the title keeps its box, its text is
  // swapped for a short one, and nothing re-reads it until the font set says a load is done.
  const words = cutTitle.firstChild as Text;
  const full = words.data;
  const w0 = cutTitle.getBoundingClientRect().width;
  cutTitle.style.flex = "none";
  cutTitle.style.maxInlineSize = "none";
  cutTitle.style.width = `${w0}px`;
  // Its own first mark, so no new font subset is asked for.
  words.data = full.slice(0, 1);
  // Two frames let a resize observer speak if it is going to; the box must not give it a reason to.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await expect(cutTitle.getBoundingClientRect().width, "the box is the one it was").toBe(w0);
  await expect(cutTitle.scrollWidth).toBeLessThanOrEqual(cutTitle.clientWidth);
  await expect(cutTitle.hasAttribute("data-cut"), "no font event yet").toBe(true);
  document.fonts.dispatchEvent(new Event("loadingdone"));
  await waitFor(() =>
    expect(cutTitle.hasAttribute("data-cut"), "after the font event").toBe(false),
  );
  words.data = full;
  document.fonts.dispatchEvent(new Event("loadingdone"));
  await waitFor(() => expect(cutTitle.hasAttribute("data-cut"), "the text back").toBe(true));
  cutTitle.style.flex = "";
  cutTitle.style.maxInlineSize = "";
  cutTitle.style.width = "";
  // The long card gives its parts up from the end: a fine sweep finds a step where the status glyph
  // shows and its word does not (where the word leaves depends on the font's width).
  let between = false;
  for (let zoom = 0.8; zoom >= 0.2499; zoom -= 0.05) {
    await zoomBoard(root, Number(zoom.toFixed(2)));
    const long = shownParts(labels()[0] as Element);
    const glyph = long.find((p) => p.name === "status-glyph")?.shown;
    const word = long.find((p) => p.name === "status-word")?.shown;
    if (glyph && !word) between = true;
  }
  await expect(between, "no zoom step shows the status glyph without its word").toBe(true);
  // The status keeps its word in the text, and each card keeps its name.
  await expect(root.querySelector(".ds-node__status")).toHaveTextContent(/\S/);
  const named = [
    nodeOpenLabel(narrowLabels(lang).nodes[0]?.data as NodeContent, lang),
    nodeOpenLabel(narrowLabels(lang).nodes[1]?.data as NodeContent, lang),
    nodeLabel(narrowLabels(lang).nodes[2]?.data as NodeContent, lang),
  ];
  for (const name of named) await expect(within(root).getByRole("group", { name })).toBeVisible();
  // The third card's title stack of Thai marks is whole.
  await zoomBoard(root, 1);
  if (inVitest) {
    await expectLabelInkWhole(
      cardOf(root, "l2").querySelector(".ds-node__title") as HTMLElement,
      "ปี๊ฟื้ ฎุฐู",
    );
  }
}

/** The labels of three cards at five zooms: none passes its card, parts leave from the end, whole. */
export const PresentNarrowLabels: Story = {
  render: () => (
    <NodeBoard
      variant="present"
      height={320}
      chrome={false}
      fitView={false}
      onNodeOpen={fn()}
      initial={narrowLabels("th")}
    >
      <FlowHandle />
    </NodeBoard>
  ),
  play: async ({ canvasElement }) => playNarrowLabels(canvasElement, "th"),
};

/** The same labels in English, in dark mode. */
export const PresentNarrowLabelsInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => (
    <NodeBoard
      variant="present"
      height={320}
      chrome={false}
      fitView={false}
      onNodeOpen={fn()}
      initial={narrowLabels("en")}
    >
      <FlowHandle />
    </NodeBoard>
  ),
  play: async ({ canvasElement }) => playNarrowLabels(canvasElement, "en"),
};

/**
 * Ports with a `row` (spec row 3): each sits at the middle of its body row. A second node has none,
 * so its two ports stay a group centred on the card.
 */
function rowPorts(lang: Lang): Graph {
  const w = WORDS[lang];
  const port = (id: string, kind: "text" | "image", row?: string) => ({
    id,
    kind,
    label: id,
    ...(row ? { row } : {}),
  });
  return {
    nodes: [
      {
        id: "rows",
        type: "orivilo",
        position: { x: 0, y: 0 },
        data: {
          title: w.logo,
          kind: "knowledge",
          inputs: [port("brief", "text", "brief"), port("logo", "image", "logo")],
          outputs: [port("out", "text", "logo")],
        },
      },
      {
        id: "plain",
        type: "orivilo",
        position: { x: 480, y: 0 },
        data: {
          title: w.rest,
          kind: "artifact",
          size: "sm",
          summary: w.summary,
          inputs: [port("a", "text"), port("b", "image")],
          outputs: [],
        },
      },
    ],
    // One edge from the row port, so the play can read where React Flow thinks the handle is.
    edges: [
      {
        id: "e",
        type: "orivilo",
        source: "rows",
        sourceHandle: "out",
        target: "plain",
        targetHandle: "a",
        data: { meaning: "input" },
      },
    ],
  };
}

const rowBody = (node: BoardNode): ReactNode =>
  node.id === "rows" ? (
    <div>
      <p data-port-row="brief" className="m-0">
        {fixtures.latin}
      </p>
      <p data-port-row="logo" className="m-0 mt-6">
        {fixtures.mixed} {fixtures.mixed} {fixtures.mixed}
      </p>
    </div>
  ) : undefined;

async function playRowPorts(root: HTMLElement) {
  await ready(root, 2);
  const middle = (el: Element) => {
    const r = el.getBoundingClientRect();
    return (r.top + r.bottom) / 2;
  };
  const handle = (nodeId: string, handleId: string) =>
    root.querySelector(
      `.react-flow__node[data-id="${nodeId}"] .ds-port__handle[data-handleid="${handleId}"]`,
    ) as HTMLElement;
  const row = (name: string) => root.querySelector(`[data-port-row="${name}"]`) as HTMLElement;
  await waitFor(() => {
    expect(Math.abs(middle(handle("rows", "brief")) - middle(row("brief")))).toBeLessThanOrEqual(1);
    expect(Math.abs(middle(handle("rows", "logo")) - middle(row("logo")))).toBeLessThanOrEqual(1);
    expect(Math.abs(middle(handle("rows", "out")) - middle(row("logo")))).toBeLessThanOrEqual(1);
  });
  // React Flow reads the moved handle: the edge leaves the output where its dot is drawn, and enters
  // the plain node's first input where that dot is.
  const end = (nodeId: string, handleId: string, at: "start" | "end") => {
    const path = root.querySelector(".ds-edge__path") as SVGPathElement;
    const point = path.getPointAtLength(at === "start" ? 0 : path.getTotalLength());
    const screen = point.matrixTransform(path.getScreenCTM() as DOMMatrix);
    const r = handle(nodeId, handleId).getBoundingClientRect();
    return Math.abs(screen.y - (r.top + r.bottom) / 2);
  };
  await waitFor(() => {
    expect(end("rows", "out", "start")).toBeLessThanOrEqual(1.5);
    expect(end("plain", "a", "end")).toBeLessThanOrEqual(1.5);
  });
  // The two rows are different heights, so the ports are not just spaced evenly.
  await expect(middle(handle("rows", "logo")) - middle(handle("rows", "brief"))).toBeGreaterThan(
    24,
  );
  // Inputs sit on the start edge, outputs on the end edge, centred on it.
  const card = cardOf(root, "rows").getBoundingClientRect();
  const input = handle("rows", "brief").getBoundingClientRect();
  const output = handle("rows", "out").getBoundingClientRect();
  await expect(Math.abs((input.left + input.right) / 2 - card.left)).toBeLessThanOrEqual(2);
  await expect(Math.abs((output.left + output.right) / 2 - card.right)).toBeLessThanOrEqual(2);
  // Without a row the two ports stay a group centred on the card, 24 apart before the zoom.
  const plain = cardOf(root, "plain").getBoundingClientRect();
  const a = handle("plain", "a");
  const b = handle("plain", "b");
  await expect(
    Math.abs((middle(a) + middle(b)) / 2 - (plain.top + plain.bottom) / 2),
  ).toBeLessThanOrEqual(1);
  await expect(middle(b) - middle(a)).toBeGreaterThan(0);
}

export const PresentRowPorts: Story = {
  render: () => (
    <NodeBoard
      variant="present"
      height={360}
      chrome={false}
      renderBody={rowBody}
      initial={rowPorts("th")}
    />
  ),
  play: async ({ canvasElement }) => playRowPorts(canvasElement),
};

/** The row ports in English, in dark mode. */
export const PresentRowPortsInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => (
    <NodeBoard
      variant="present"
      height={360}
      chrome={false}
      renderBody={rowBody}
      initial={rowPorts("en")}
    />
  ),
  play: async ({ canvasElement }) => playRowPorts(canvasElement),
};

/**
 * The present node under three profiles in both modes: four kinds, a result that opens, a media
 * node and a selected node. Six present boards on the page, so the accessibility addon covers every
 * boundary.
 */
function recipeNodes(): Graph {
  const graph = presentStates("th");
  return { nodes: graph.nodes, edges: [] };
}

export const PresentRecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <NodeBoard
        variant="present"
        height={520}
        chrome={false}
        renderBody={presentBody}
        onNodeOpen={fn()}
        initial={recipeNodes()}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    await waitFor(() => {
      for (const cell of cells) {
        expect(cell.querySelectorAll('.ds-board[data-variant="present"]')).toHaveLength(1);
        expect(cell.querySelectorAll(".ds-node")).toHaveLength(7);
        expect(cell.querySelectorAll(".ds-port")).toHaveLength(14);
        expect(cell.querySelectorAll(".ds-node__open")).toHaveLength(1);
        expect(cell.querySelectorAll('.ds-node[data-pad="media"]')).toHaveLength(1);
        expect(cell.querySelectorAll(".ds-node[data-selected]")).toHaveLength(1);
        expect(cell.querySelectorAll(".ds-node__label")).toHaveLength(7);
      }
    });
  },
};
