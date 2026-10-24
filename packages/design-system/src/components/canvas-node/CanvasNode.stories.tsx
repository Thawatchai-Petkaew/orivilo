import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { NODE_KINDS } from "../../tokens/canvas";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import { blockNode, feed } from "../block-library/fixtures";
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

/**
 * Basis (ORV-106): a node made from a chat reply names how it was made after the kind word, by
 * rules or from mock data. A node without a basis shows no word. Checked in every cell, both modes.
 */
export const Basis: Story = {
  render: () => (
    <Matrix>
      <NodeBoard
        height={240}
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
    }
  },
};
