import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import type { BoardEdge, BoardNode, EdgeContent, Graph } from "../canvas-board/graph";
import { Matrix } from "../matrix";

const text = { id: "text", kind: "text", label: "ข้อความ" } as const;

/** Pairs of nodes stacked, one edge per pair, so each story shows one edge per row. */
function pairs(contents: EdgeContent[], selected: number[] = []): Graph {
  const nodes: BoardNode[] = [];
  const edges: BoardEdge[] = [];
  contents.forEach((data, i) => {
    const y = i * 150;
    nodes.push(
      {
        id: `s${i}`,
        type: "orivilo",
        position: { x: 0, y },
        data: {
          title: `ต้นทาง ${i + 1}`,
          kind: "input-block",
          size: "sm",
          collapsed: true,
          inputs: [],
          outputs: [text],
        },
      },
      {
        id: `t${i}`,
        type: "orivilo",
        position: { x: 440, y },
        data: {
          title: `ปลายทาง ${i + 1}`,
          kind: "artifact",
          size: "sm",
          collapsed: true,
          inputs: [text],
          outputs: [],
        },
      },
    );
    edges.push({
      id: `e${i}`,
      type: "orivilo",
      source: `s${i}`,
      sourceHandle: "text",
      target: `t${i}`,
      targetHandle: "text",
      data,
      selected: selected.includes(i),
    });
  });
  return { nodes, edges };
}

function EdgeBoard({
  initial,
  height = 420,
  ...rest
}: Omit<CanvasBoardProps, "graph" | "onChange" | "label"> & { initial: Graph; height?: number }) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div style={{ height }}>
      <CanvasBoard
        label={`ตัวอย่างสาย${scope ? `, ${id} ${scope.mode}` : ""}`}
        {...rest}
        graph={graph}
        onChange={setGraph}
      />
    </div>
  );
}

const meta = {
  title: "Application/Canvas edge",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A link that means input, reference or derived-from: the meaning is the dash and the label word, the state is the stroke colour (E4-1). Renders inside CanvasBoard, which names it, makes it focusable and deletes it on Delete without touching a node.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const edgeEls = (root: HTMLElement) => root.querySelectorAll<HTMLElement>(".react-flow__edge");
const dash = (root: HTMLElement, meaning: string) =>
  getComputedStyle(
    root.querySelector(`.ds-edge[data-meaning="${meaning}"] .ds-edge__path`) as Element,
  ).strokeDasharray;

/** Input solid, reference dashed, derived dotted, each with its word; the names read meaning, source and target. */
export const Meanings: Story = {
  render: () => (
    <EdgeBoard
      initial={pairs([{ meaning: "input" }, { meaning: "reference" }, { meaning: "derived" }])}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(3));
    await expect(
      canvas.getByRole("group", { name: "ป้อนเข้า จาก ต้นทาง 1 ไป ปลายทาง 1" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("group", { name: "อ้างอิง จาก ต้นทาง 2 ไป ปลายทาง 2" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("group", { name: "สร้างจาก จาก ต้นทาง 3 ไป ปลายทาง 3" }),
    ).toBeInTheDocument();
    await expect(dash(canvasElement, "input")).toBe("none");
    await expect(dash(canvasElement, "reference")).not.toBe("none");
    await expect(dash(canvasElement, "derived")).not.toBe(dash(canvasElement, "reference"));
    await expect(canvas.getByText("ป้อนเข้า")).toBeInTheDocument();
    await expect(canvas.getByText("อ้างอิง")).toBeInTheDocument();
    await expect(canvas.getByText("สร้างจาก")).toBeInTheDocument();
  },
};

/**
 * Rest, hover, selected and focus-visible: hover darkens, selected and focus take the violet stroke
 * and the wider width. A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the hover
 * look on edge 2 (spec ORV-84, `hover-force-1`).
 */
export const InteractionStates: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: ['.react-flow__edge[data-id="e1"]'] } },
  render: () => (
    <EdgeBoard
      initial={pairs(
        [{ meaning: "input" }, { meaning: "input" }, { meaning: "input" }, { meaning: "input" }],
        [2],
      )}
      height={560}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(4));
    // React Flow renders a selected edge after the rest, so pick each edge by its name, not its order.
    const edge = (n: number) =>
      canvas.getByRole("group", { name: `ป้อนเข้า จาก ต้นทาง ${n} ไป ปลายทาง ${n}` });
    const [rest, hover, selected, focus] = [edge(1), edge(2), edge(3), edge(4)];
    const strokeOf = (g: HTMLElement) =>
      getComputedStyle(g.querySelector(".ds-edge__path") as Element).stroke;
    const widthOf = (g: HTMLElement) =>
      getComputedStyle(g.querySelector(".ds-edge__path") as Element).strokeWidth;
    await expect(selected).toHaveClass("selected");
    // The stroke transitions over the feedback duration once the class lands.
    await waitFor(() => expect(strokeOf(selected)).not.toBe(strokeOf(rest)));
    await expect(widthOf(selected)).not.toBe(widthOf(rest));
    await userEvent.hover(hover.querySelector(".react-flow__edge-interaction") as Element);
    focus.focus();
    await expect(focus).toHaveFocus();
    // The forced hover look: the hover edge strokes differently from the edge at rest.
    await waitFor(() => expect(strokeOf(hover)).not.toBe(strokeOf(rest)));
  },
};

/** Stale and invalid: their own stroke colours and the word after the meaning, in the label and in the name. */
export const StaleAndInvalid: Story = {
  render: () => (
    <EdgeBoard
      initial={pairs([
        { meaning: "input", stale: true },
        { meaning: "derived", invalid: true },
      ])}
      height={300}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(2));
    await expect(
      canvas.getByRole("group", { name: "ป้อนเข้า จาก ต้นทาง 1 ไป ปลายทาง 1, ล้าสมัย" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("group", { name: "สร้างจาก จาก ต้นทาง 2 ไป ปลายทาง 2, เชื่อมต่อไม่ได้" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("ป้อนเข้า, ล้าสมัย")).toBeInTheDocument();
    await expect(canvas.getByText("สร้างจาก, เชื่อมต่อไม่ได้")).toBeInTheDocument();
    const stroke = (sel: string) =>
      getComputedStyle(canvasElement.querySelector(`${sel} .ds-edge__path`) as Element).stroke;
    await expect(stroke(".ds-edge[data-stale]")).not.toBe(stroke(".ds-edge[data-invalid]"));
  },
};

/** Tab reaches the edge, Enter selects it, Delete removes it; both nodes stay (catalog rule). */
export const KeyboardDelete: Story = {
  render: () => <EdgeBoard initial={pairs([{ meaning: "reference" }])} height={240} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(1));
    const edge = canvas.getByRole("group", { name: "อ้างอิง จาก ต้นทาง 1 ไป ปลายทาง 1" });
    edge.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(edge).toHaveClass("selected"));
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(0));
    await expect(canvasElement.querySelectorAll(".react-flow__node")).toHaveLength(2);
    await expect(canvas.getByRole("status")).toHaveTextContent("ลบ 1 สาย");
  },
};

/**
 * Flowing (ORV-57): an edge into a running node takes the AI gradient and a travelling light; an
 * edge at rest stays plain. Dragging from a port draws the line in the same gradient.
 */
export const Flowing: Story = {
  render: () => {
    const graph = pairs([{ meaning: "input" }, { meaning: "input" }]);
    graph.nodes = graph.nodes.map((n) =>
      n.id === "t0" ? { ...n, data: { ...n.data, status: "running" } } : n,
    );
    return <EdgeBoard initial={graph} height={340} />;
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(2));
    const flowing = canvasElement.querySelector<SVGGElement>('[data-id="e0"] .ds-edge');
    const rest = canvasElement.querySelector<SVGGElement>('[data-id="e1"] .ds-edge');
    await expect(flowing).toHaveAttribute("data-flowing", "");
    await expect(flowing?.querySelector(".ds-edge__light")).not.toBeNull();
    await expect(flowing?.querySelector(".ds-edge__flow")?.getAttribute("stroke")).toMatch(
      /^url\(#/,
    );
    await expect(rest).not.toHaveAttribute("data-flowing");
    await expect(rest?.querySelector(".ds-edge__flow")).toBeNull();

    const handle = canvasElement.querySelector<HTMLElement>('[data-id="s1"] .react-flow__handle');
    if (!handle) throw new Error("no source handle");
    const box = handle.getBoundingClientRect();
    const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
    handle.dispatchEvent(new MouseEvent("mousedown", { ...at, bubbles: true, button: 0 }));
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: at.clientX + 120,
        clientY: at.clientY + 40,
        bubbles: true,
      }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".react-flow__connectionline .ds-edge[data-connecting]"),
      ).not.toBeNull(),
    );
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  },
};

/** The three meanings under three profiles in both modes: edge tokens are locked, so dash and colour hold. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <EdgeBoard
        initial={pairs([{ meaning: "input" }, { meaning: "reference" }, { meaning: "derived" }])}
        height={300}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(edgeEls(canvasElement)).toHaveLength(18));
  },
};
