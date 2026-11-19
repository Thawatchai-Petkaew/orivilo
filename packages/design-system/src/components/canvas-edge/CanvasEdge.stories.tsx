import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactFlowInstance, useReactFlow } from "@xyflow/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useEffect, useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import type { BoardEdge, BoardNode, EdgeContent, Graph } from "../canvas-board/graph";
import type { PortKind } from "../../tokens/canvas";
import {
  colourRunsAcross,
  expectEdgeInk,
  expectPillsClear,
  inVitest,
} from "../../testing/visual-asserts";
import { fillHeight, Matrix } from "../matrix";

const text = { id: "text", kind: "text", label: "ข้อความ" } as const;

/** Node titles for the fixtures: the author's words, so the English stories show English ones. */
const TITLES = {
  th: { from: "ต้นทาง", to: "ปลายทาง" },
  en: { from: "Source", to: "Target" },
} as const;

/** Pairs of nodes stacked, one edge per pair, so each story shows one edge per row. */
function pairs(
  contents: EdgeContent[],
  selected: number[] = [],
  { lang = "th", gap = 150 }: { lang?: keyof typeof TITLES; gap?: number } = {},
): Graph {
  const nodes: BoardNode[] = [];
  const edges: BoardEdge[] = [];
  contents.forEach((data, i) => {
    const y = i * gap;
    nodes.push(
      {
        id: `s${i}`,
        type: "orivilo",
        position: { x: 0, y },
        data: {
          title: `${TITLES[lang].from} ${i + 1}`,
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
          title: `${TITLES[lang].to} ${i + 1}`,
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
  label = "ตัวอย่างสาย",
  ...rest
}: Omit<CanvasBoardProps, "graph" | "onChange" | "label"> & {
  initial: Graph;
  height?: number;
  /** The board's name; a story with two boards names each, so they are distinct landmarks. */
  label?: string;
}) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div style={{ height: fillHeight(height) }}>
      <CanvasBoard
        label={`${label}${scope ? `, ${id} ${scope.mode}` : ""}`}
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
      canvas.getByRole("group", { name: "สร้างจาก ต้นทาง 3 ไป ปลายทาง 3" }),
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
      height={900}
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
    // The focused edge draws the focus shape along its curve, no box (ORV-280 D5): its reach is half
    // the halo's width, and it ends above the controls bar (design.md row 1): the board is tall enough
    // that the fit leaves the bottom pair clear of the bar.
    await expect(getComputedStyle(focus).outlineStyle).toBe("none");
    const halo = focus.querySelector(".ds-edge__focus[data-part='halo']") as SVGPathElement;
    await expect(getComputedStyle(halo).display).not.toBe("none");
    const reach =
      (parseFloat(getComputedStyle(halo).strokeWidth) * (halo.getScreenCTM()?.a ?? 1)) / 2;
    const bar = canvasElement.querySelector(".ds-controls") as HTMLElement;
    await waitFor(() =>
      expect(focus.getBoundingClientRect().bottom + reach).toBeLessThanOrEqual(
        bar.getBoundingClientRect().top,
      ),
    );
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
      canvas.getByRole("group", { name: "สร้างจาก ต้นทาง 2 ไป ปลายทาง 2, เชื่อมต่อไม่ได้" }),
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

/* The present look (ORV-274): fixed width on screen, kind hues, chain highlight, hidden labels. ---- */

const KINDS: readonly PortKind[] = ["text", "image", "palette", "type", "profile"];
const MEANINGS = ["input", "reference", "derived"] as const;

/** The states that keep their own stroke over a kind hue (spec row 10), each on a kind that has a hue. */
const STATE_EDGES = [
  { kind: "image", state: "stale" },
  { kind: "palette", state: "invalid" },
  { kind: "image", state: "selected" },
] as const;

/** Every kind by every meaning: one row per kind, one pair of nodes per meaning. */
function kindGrid(lang: keyof typeof TITLES): Graph {
  const nodes: BoardNode[] = [];
  const edges: BoardEdge[] = [];
  KINDS.forEach((kind, row) => {
    MEANINGS.forEach((meaning, col) => {
      const id = `${kind}-${meaning}`;
      // The two ends name their ports apart, so an edge reads its hue from its source end.
      const out = { id: `${kind}-out`, kind, label: kind } as const;
      const into = { id: `${kind}-in`, kind, label: kind } as const;
      const y = row * 110;
      const x = col * 900;
      nodes.push(
        {
          id: `s-${id}`,
          type: "orivilo",
          position: { x, y },
          data: {
            title: `${TITLES[lang].from} ${id}`,
            kind: "input-block",
            size: "sm",
            collapsed: true,
            inputs: [],
            outputs: [out],
          },
        },
        {
          id: `t-${id}`,
          type: "orivilo",
          position: { x: x + 440, y },
          data: {
            title: `${TITLES[lang].to} ${id}`,
            kind: "artifact",
            size: "sm",
            collapsed: true,
            inputs: [into],
            outputs: [],
          },
        },
      );
      edges.push({
        id: `e-${id}`,
        type: "orivilo",
        source: `s-${id}`,
        sourceHandle: out.id,
        target: `t-${id}`,
        targetHandle: into.id,
        data: { meaning },
      });
    });
  });
  // Three more rows on the image and palette kinds, one edge each in a state that wins over the hue.
  STATE_EDGES.forEach(({ kind, state }, i) => {
    const out = { id: `${kind}-out`, kind, label: kind } as const;
    const into = { id: `${kind}-in`, kind, label: kind } as const;
    const y = (KINDS.length + i) * 110;
    nodes.push(
      {
        id: `s-${state}`,
        type: "orivilo",
        position: { x: 0, y },
        data: {
          title: `${TITLES[lang].from} ${state}`,
          kind: "input-block",
          size: "sm",
          collapsed: true,
          inputs: [],
          outputs: [out],
        },
      },
      {
        id: `t-${state}`,
        type: "orivilo",
        position: { x: 440, y },
        data: {
          title: `${TITLES[lang].to} ${state}`,
          kind: "artifact",
          size: "sm",
          collapsed: true,
          inputs: [into],
          outputs: [],
        },
      },
    );
    edges.push({
      id: `e-${state}`,
      type: "orivilo",
      source: `s-${state}`,
      sourceHandle: out.id,
      target: `t-${state}`,
      targetHandle: into.id,
      data: { meaning: "input", ...(state === "selected" ? {} : { [state]: true }) },
      selected: state === "selected",
    });
  });
  return { nodes, edges };
}

/** The boards a story zooms, by name: a child of the board hands over React Flow's instance. */
const flows = new Map<string, ReactFlowInstance>();

function FlowHandle({ name }: { name: string }) {
  const flow = useReactFlow();
  useEffect(() => {
    flows.set(name, flow);
    return () => {
      flows.delete(name);
    };
  }, [flow, name]);
  return null;
}

/** The zoom the viewport has, read from its transform. */
const viewportZoom = (board: Element) => {
  const transform = board.querySelector<HTMLElement>(".react-flow__viewport")?.style.transform;
  return parseFloat(/scale\(([\d.]+)\)/.exec(transform ?? "")?.[1] ?? "NaN");
};

/** Waits for every node to be measured and shown, then sets the zoom and waits until it holds. */
async function zoomTo(root: HTMLElement, name: string, zoom: number) {
  const board = root.querySelector(`[data-zoom-board="${name}"] .ds-board`) as HTMLElement;
  await waitFor(() => {
    for (const n of board.querySelectorAll<HTMLElement>(".react-flow__node")) {
      expect(n.style.visibility).not.toBe("hidden");
    }
    expect(board.querySelectorAll(".react-flow__edge").length).toBeGreaterThan(0);
  });
  await waitFor(async () => {
    await flows.get(name)?.zoomTo(zoom, { duration: 0 });
    expect(viewportZoom(board)).toBeCloseTo(zoom, 3);
  });
  return board;
}

/**
 * What an edge measures on screen: the computed lengths times the path's own screen scale. This is
 * the drawn width, not a style value, so a zoom that the board forgot to cancel shows here.
 */
function drawn(path: Element) {
  const style = getComputedStyle(path);
  const scale = (path as SVGGraphicsElement).getScreenCTM()?.a ?? NaN;
  const dashes = style.strokeDasharray === "none" ? [] : style.strokeDasharray.split(/[\s,]+/);
  return {
    scale,
    width: parseFloat(style.strokeWidth) * scale,
    dash: dashes.map((d) => parseFloat(d) * scale),
    cap: style.strokeLinecap,
    stroke: style.stroke,
  };
}

/**
 * The computed colour of a token at `root`, read through a probe so both sides use one
 * serialisation. The probe sits inside the board, in the story's own mode and profile.
 */
function colourOf(root: HTMLElement, cssVar: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${cssVar})`;
  root.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

const pathOf = (board: Element, id: string) =>
  board.querySelector(`.react-flow__edge[data-id="${id}"] .ds-edge__path`) as Element;

/**
 * Every pill of a board sits on its edge (ORV-274, F1). A pill's edge point is the cubic's t = 0.5
 * point, mapped to the screen with the path's own matrix; the pill has no edge id, so each is
 * matched to its nearest point with no point used twice. Returns each pill's rect height.
 */
function expectPillsOnEdges(board: Element, zoom: number) {
  const points: { x: number; y: number }[] = [];
  for (const path of board.querySelectorAll<SVGPathElement>(".ds-edge__path")) {
    const n = (path.getAttribute("d") ?? "").match(/-?[\d.]+(?:e-?\d+)?/g)?.map(Number) ?? [];
    // `M sx,sy C c1x,c1y c2x,c2y tx,ty`, as getBezierPath writes it.
    expect(n).toHaveLength(8);
    const [sx, sy, c1x, c1y, c2x, c2y, tx, ty] = n as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const ctm = path.getScreenCTM();
    const point = new DOMPoint(
      0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx,
      0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty,
    ).matrixTransform(ctm ?? undefined);
    points.push({ x: point.x, y: point.y });
  }
  const pills = [...board.querySelectorAll<HTMLElement>(".ds-edge__label")].map((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, height: r.height };
  });
  expect(pills.length).toBeGreaterThan(0);
  const pairs = pills
    .flatMap((pill, i) =>
      points.map((point, j) => ({ i, j, d: Math.hypot(pill.x - point.x, pill.y - point.y) })),
    )
    .sort((a, b) => a.d - b.d);
  const pillUsed = new Set<number>();
  const pointUsed = new Set<number>();
  for (const { i, j, d } of pairs) {
    if (pillUsed.has(i) || pointUsed.has(j)) continue;
    pillUsed.add(i);
    pointUsed.add(j);
    expect(
      d,
      `at zoom ${zoom}, pill ${i} is ${d.toFixed(1)} px from its edge point`,
    ).toBeLessThanOrEqual(1);
  }
  expect(pillUsed.size).toBe(pills.length);
  return pills.map((p) => p.height);
}

/**
 * Four kinds and text by three meanings on a present board, beside an edit board of the three
 * meanings, at zoom 0.25, 1 and 2 (spec rows 9 and 10). The width and the dash lengths on screen
 * are the same at every zoom; the hue follows the source port's kind.
 */
async function playKindsAndZoom(root: HTMLElement, lang: keyof typeof TITLES) {
  const pillHeights = new Map<number, number[]>();
  for (const zoom of [0.25, 0.5, 1, 2]) {
    const present = await zoomTo(root, "present", zoom);
    const edit = await zoomTo(root, "edit", zoom);
    // The pill sits on its edge at every zoom, on both boards (F1).
    pillHeights.set(zoom, expectPillsOnEdges(present, zoom));
    expectPillsOnEdges(edit, zoom);
    // Row 20: a pill is drawn only where it is whole and clear of every card, title line, dot and
    // pill drawn before it. At the 0.25 floor none is, and the board shows its lines only (D1); a
    // pill that is cut from the picture stays on its edge, so the check above still reads it.
    await waitFor(() => {
      const drawnPills = expectPillsClear(present);
      if (zoom === 0.25) expect(drawnPills, "pills drawn at the 0.25 floor").toBe(0);
    });
    // The edit board's nodes stand apart: no two cards overlap (ORV-280 D6).
    const cards = [...edit.querySelectorAll(".ds-node")].map((el) => el.getBoundingClientRect());
    await expect(cards.length).toBeGreaterThan(1);
    cards.forEach((a, i) =>
      cards.slice(i + 1).forEach((b, j) => {
        const apart =
          a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect(apart, `at zoom ${zoom}, cards ${i} and ${i + 1 + j} overlap`).toBe(true);
      }),
    );
    for (const kind of KINDS) {
      const input = drawn(pathOf(present, `e-${kind}-input`));
      const reference = drawn(pathOf(present, `e-${kind}-reference`));
      const derived = drawn(pathOf(present, `e-${kind}-derived`));
      await expect(input.scale).toBeCloseTo(zoom, 3);
      await expect(input.width).toBeCloseTo(1.5, 2);
      await expect(reference.width).toBeCloseTo(1.5, 2);
      await expect(input.dash).toEqual([]);
      await expect(reference.dash).toHaveLength(2);
      await expect(reference.dash[0]).toBeCloseTo(6, 2);
      await expect(reference.dash[1]).toBeCloseTo(5, 2);
      // Derived: round dots (a zero dash with a round cap) 5 apart, 2.5 across.
      await expect(derived.width).toBeCloseTo(2.5, 2);
      await expect(derived.dash).toHaveLength(2);
      await expect(derived.dash[0]).toBeCloseTo(0, 2);
      await expect(derived.dash[1]).toBeCloseTo(5, 2);
      await expect(derived.cap).toBe("round");
      const hue = colourOf(present, kind === "text" ? "--cmp-edge-stroke" : `--cmp-port-${kind}`);
      for (const edge of [input, reference, derived]) await expect(edge.stroke).toBe(hue);
    }
    // Stale, invalid and selected strokes still win over the kind hue, on an image and a palette
    // edge (spec row 10): each path draws its state's stroke token, and not its kind's hue.
    for (const { kind, state } of STATE_EDGES) {
      const stroke = drawn(pathOf(present, `e-${state}`)).stroke;
      await expect(stroke, `${state} ${kind} edge at zoom ${zoom}`).toBe(
        colourOf(present, `--cmp-edge-stroke-${state}`),
      );
      await expect(stroke, `${state} edge is not the ${kind} hue`).not.toBe(
        colourOf(present, `--cmp-port-${kind}`),
      );
    }
    // The five hues differ, so a kind is not only its dash (the glyph shape carries it too).
    const hues = new Set(KINDS.map((k) => drawn(pathOf(present, `e-${k}-input`)).stroke));
    await expect(hues.size).toBe(KINDS.length);
    // Edit boards stay gray at their own width: 2 px at rest, 3 px for the dots.
    const gray = colourOf(edit, "--cmp-edge-stroke");
    const [editInput, editReference, editDerived] = ["e0", "e1", "e2"].map((id) =>
      drawn(pathOf(edit, id)),
    );
    await expect(editInput?.width).toBeCloseTo(2, 2);
    await expect(editReference?.width).toBeCloseTo(2, 2);
    await expect(editDerived?.width).toBeCloseTo(3, 2);
    await expect(editReference?.dash[0]).toBeCloseTo(6, 2);
    await expect(editReference?.dash[1]).toBeCloseTo(5, 2);
    for (const e of [editInput, editReference, editDerived]) await expect(e?.stroke).toBe(gray);
  }
  // At the fit zoom, where the grid is smaller than the board, the pills that stay are clear; a state
  // pill keeps its place before a meaning pill does (row 20), so the stale and the invalid pill show.
  const present = await zoomTo(root, "present", 1);
  await flows.get("present")?.fitView({ duration: 0 });
  await waitFor(() => expect(viewportZoom(present)).toBeLessThan(1));
  await waitFor(() => expectPillsClear(present));
  await zoomTo(root, "present", 1);
  await waitFor(() => {
    expectPillsClear(present);
    for (const state of ["stale", "invalid"]) {
      const pill = present.querySelector(`.ds-edge__label[data-state="${state}"]`);
      expect(getComputedStyle(pill as Element).visibility, `the ${state} pill at zoom 1`).toBe(
        "visible",
      );
    }
  });
  // A present label pill stays as tall on screen when zoomed out (it grows by 1 / zoom, so the
  // zoom cancels), and grows with the board once the zoom is past 1. Each pill is compared with
  // the same pill at zoom 1 (the pills keep their DOM order at every zoom).
  const at1 = pillHeights.get(1) ?? [];
  expect(at1.length).toBeGreaterThan(0);
  for (const [zoom, factor] of [
    [0.25, 1],
    [0.5, 1],
    [2, 2],
  ] as const) {
    const heights = pillHeights.get(zoom) ?? [];
    expect(heights).toHaveLength(at1.length);
    heights.forEach((h, i) =>
      expect(Math.abs(h - factor * (at1[i] ?? NaN))).toBeLessThanOrEqual(0.5),
    );
  }
  // The names still read meaning, source and target in the author's words.
  const { from, to } = TITLES[lang];
  const name =
    lang === "th"
      ? `อ้างอิง จาก ${from} image-reference ไป ${to} image-reference`
      : `reference from ${from} image-reference to ${to} image-reference`;
  await expect(within(root).getByRole("group", { name })).toBeInTheDocument();
}

/** One name per board, so two boards on a page are two distinct landmarks. */
const LABELS = {
  th: { present: "กระดานนำเสนอ (ตัวอย่าง)", edit: "กระดานแก้ไข (ตัวอย่าง)" },
  en: { present: "Present board (sample)", edit: "Edit board (sample)" },
} as const;

function ZoomBoards({ lang }: { lang: keyof typeof TITLES }) {
  return (
    <div className="flex flex-col gap-4">
      <div data-zoom-board="present">
        <EdgeBoard
          variant="present"
          label={LABELS[lang].present}
          initial={kindGrid(lang)}
          height={520}
        >
          <FlowHandle name="present" />
        </EdgeBoard>
      </div>
      <div data-zoom-board="edit">
        <EdgeBoard
          label={LABELS[lang].edit}
          initial={pairs(
            [{ meaning: "input" }, { meaning: "reference" }, { meaning: "derived" }],
            [],
            { lang },
          )}
          height={420}
        >
          <FlowHandle name="edit" />
        </EdgeBoard>
      </div>
    </div>
  );
}

/**
 * A present board holds a thin edge on screen at every zoom (1.5 px, spec row 9) and takes its
 * source port's hue (spec row 10); an edit board beside it holds 2 px. The dash lengths hold too.
 */
export const KindsAndZoom: Story = {
  render: () => <ZoomBoards lang="th" />,
  play: async ({ canvasElement }) => playKindsAndZoom(canvasElement, "th"),
};

/** The same measurements with English names, in dark mode. */
export const KindsAndZoomInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <ZoomBoards lang="en" />,
  play: async ({ canvasElement }) => playKindsAndZoom(canvasElement, "en"),
};

/**
 * Three chains and two lone edges: a to b is input and b to c is reference, d to e is derived,
 * f to g is input. Selecting b chains its two edges; selecting d chains the dotted one.
 */
function chainGraph(lang: keyof typeof TITLES): Graph {
  const { from, to } = TITLES[lang];
  const spec: [id: string, title: string, x: number, y: number][] = [
    ["a", `${from} A`, 0, 0],
    ["b", `${to} B`, 440, 0],
    ["c", `${to} C`, 880, 0],
    ["d", `${from} D`, 0, 130],
    ["e", `${to} E`, 440, 130],
    ["f", `${from} F`, 0, 260],
    ["g", `${to} G`, 440, 260],
  ];
  const nodes: BoardNode[] = spec.map(([id, title, x, y]) => ({
    id,
    type: "orivilo",
    position: { x, y },
    data: {
      title,
      kind: "input-block",
      size: "sm",
      collapsed: true,
      inputs: [text],
      outputs: [text],
    },
  }));
  const link = (source: string, target: string, meaning: EdgeContent["meaning"]): BoardEdge => ({
    id: `${source}${target}`,
    type: "orivilo",
    source,
    sourceHandle: "text",
    target,
    targetHandle: "text",
    data: { meaning },
  });
  return {
    nodes,
    edges: [
      link("a", "b", "input"),
      link("b", "c", "reference"),
      link("d", "e", "derived"),
      link("f", "g", "input"),
    ],
  };
}

const opacityOf = (el: Element | null) => getComputedStyle(el as Element).opacity;

async function playChain(root: HTMLElement) {
  const board = await zoomTo(root, "chain", 1);
  const node = (id: string) => board.querySelector(`.react-flow__node[data-id="${id}"]`) as Element;
  const edge = (id: string) => board.querySelector(`.react-flow__edge[data-id="${id}"] .ds-edge`);
  await expect(board).not.toHaveAttribute("data-has-selection");
  await userEvent.click(node("b"));
  await waitFor(() => expect(board).toHaveAttribute("data-has-selection"));
  const chained = [...board.querySelectorAll(".ds-edge[data-chain]")]
    .map((g) => g.closest(".react-flow__edge")?.getAttribute("data-id"))
    .sort();
  await expect(chained).toEqual(["ab", "bc"]);
  // The chain draws at the selected width (2.5 on screen) and at full strength.
  for (const id of ["ab", "bc"]) {
    await expect(drawn(pathOf(board, id)).width).toBeCloseTo(2.5, 2);
    await expect(opacityOf(edge(id))).toBe("1");
  }
  // Every other edge steps back to opacity.disabled, and so does its label; their widths stay.
  await expect(opacityOf(edge("fg"))).toBe("0.4");
  await expect(opacityOf(edge("de"))).toBe("0.4");
  await expect(drawn(pathOf(board, "fg")).width).toBeCloseTo(1.5, 2);
  const labels = [...board.querySelectorAll(".ds-edge__label")];
  await expect(labels).toHaveLength(4);
  for (const l of labels) {
    await expect(opacityOf(l)).toBe(l.hasAttribute("data-chain") ? "1" : "0.4");
  }
  await expect(labels.filter((l) => l.hasAttribute("data-chain"))).toHaveLength(2);
  // Row 21: the pointer is still over b, so its port names are drawn and the edge words they meet
  // give way. No shown pill covers another.
  const shown = (el: Element) => getComputedStyle(el).visibility === "visible";
  const portNames = () => [...node("b").querySelectorAll(".ds-port__label")];
  await waitFor(() => {
    expectPillsClear(board);
    expect(portNames().length).toBeGreaterThan(0);
    for (const name of portNames()) expect(shown(name), "a port name of the pointed b").toBe(true);
    expect([...board.querySelectorAll(".ds-edge__label")].filter(shown).length).toBeLessThan(4);
  });
  // The pointer and the focus leave: b is selected and not pointed, so its names give way to the edge
  // words. All four edge pills are drawn, and at least one name is cut where it met one.
  await userEvent.unhover(node("b"));
  (node("b") as HTMLElement).blur();
  await waitFor(() => expect(node("b").matches(":hover, :focus-visible")).toBe(false));
  await waitFor(() => {
    expectPillsClear(board);
    expect([...board.querySelectorAll(".ds-edge__label")].filter(shown)).toHaveLength(4);
    expect(portNames().filter((el) => !shown(el)).length).toBeGreaterThan(0);
  });
  // A chained dotted edge is wider than a dotted edge at rest: 2 x 2.5 less 1.5 is 3.5.
  await userEvent.click(node("d"));
  await waitFor(() => expect(edge("de")).toHaveAttribute("data-chain"));
  await expect(drawn(pathOf(board, "de")).width).toBeCloseTo(3.5, 2);
  await expect(opacityOf(edge("ab"))).toBe("0.4");
}

function ChainBoard({ lang }: { lang: keyof typeof TITLES }) {
  return (
    <div data-zoom-board="chain">
      <EdgeBoard variant="present" initial={chainGraph(lang)} height={420}>
        <FlowHandle name="chain" />
      </EdgeBoard>
    </div>
  );
}

/**
 * Selecting a node on a present board chains its edges (spec row 11): they take the selected
 * width and full strength, and every other edge and label drops to `opacity.disabled`.
 */
export const ChainHighlight: Story = {
  render: () => <ChainBoard lang="th" />,
  play: async ({ canvasElement }) => playChain(canvasElement),
};

/** The chain highlight in English, in dark mode. */
export const ChainHighlightInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <ChainBoard lang="en" />,
  play: async ({ canvasElement }) => playChain(canvasElement),
};

/** Waits until the stroke's transition has run out, so a colour read is the one the edge ends on. */
const settled = (el: Element) =>
  Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));

/**
 * Row 25 (D5): a focused edge shows the focus shape, a line with a halo traced along its curve, and
 * never the selected look: its own stroke and width stay, and no box is drawn around it.
 */
async function playFocusedEdge(root: HTMLElement) {
  const board = await zoomTo(root, "chain", 1);
  const edgeEl = (id: string) =>
    board.querySelector(`.react-flow__edge[data-id="${id}"]`) as HTMLElement;
  const part = (id: string, name: string) =>
    edgeEl(id).querySelector(`.ds-edge__focus[data-part="${name}"]`) as SVGPathElement;
  const selectedStroke = colourOf(board, "--cmp-edge-stroke-selected");
  const parts = [
    ["halo", 10],
    ["line", 4],
    ["fill", 2],
  ] as const;
  const check = async (zoom: number) => {
    await waitFor(async () => {
      await flows.get("chain")?.zoomTo(zoom, { duration: 0 });
      expect(viewportZoom(board)).toBeCloseTo(zoom, 3);
    });
    // An edge at rest draws no focus part, and one edge of each meaning is focused in turn.
    for (const id of ["ab", "bc", "de"]) {
      for (const [name] of parts) {
        await expect(getComputedStyle(part(id, name)).display, `${id} ${name} at rest`).toBe(
          "none",
        );
      }
    }
    for (const id of ["ab", "bc", "de"]) {
      await settled(pathOf(board, id));
      const before = drawn(pathOf(board, id));
      edgeEl(id).focus();
      await waitFor(() => expect(edgeEl(id).matches(":focus-visible")).toBe(true));
      const at = `edge ${id} at zoom ${zoom}`;
      // The edge keeps its own stroke and width, and is not the selected look. A stroke that is
      // moving to another colour reads as the old one, so the read waits for the transition to end.
      await settled(pathOf(board, id));
      const after = drawn(pathOf(board, id));
      await expect(after.stroke, `${at}: its stroke`).toBe(before.stroke);
      await expect(after.width, `${at}: its width`).toBeCloseTo(before.width, 2);
      await expect(after.stroke, `${at}: not the selected stroke`).not.toBe(selectedStroke);
      await expect(
        edgeEl(id).querySelector(".ds-edge")?.hasAttribute("data-selected"),
        `${at}: not selected`,
      ).toBe(false);
      // No box around the edge's bounds.
      await expect(getComputedStyle(edgeEl(id)).outlineStyle, `${at}: no outline`).toBe("none");
      await expect(getComputedStyle(edgeEl(id)).boxShadow, `${at}: no box shadow`).toBe("none");
      // The three focus parts trace the same curve, a 1 px line on each side and a 3 px halo.
      const colours = {
        halo: colourOf(board, "--_focus-halo"),
        line: colourOf(board, "--ds-focus-ring"),
        fill: getComputedStyle(board).backgroundColor,
      };
      for (const [name, extra] of parts) {
        const el = part(id, name);
        const m = drawn(el);
        await expect(getComputedStyle(el).display, `${at}: ${name} shown`).not.toBe("none");
        await expect(el.getAttribute("d"), `${at}: ${name} traces the edge`).toBe(
          pathOf(board, id).getAttribute("d"),
        );
        await expect(m.width, `${at}: ${name} width`).toBeCloseTo(before.width + extra, 2);
        await expect(m.stroke, `${at}: ${name} colour`).toBe(colours[name]);
        await expect(m.cap, `${at}: ${name} cap`).toBe("round");
        await expect(getComputedStyle(el).pointerEvents, `${at}: ${name} pointer`).toBe("none");
      }
      // What the eye gets, read from a screenshot (zoom 1, a solid edge): from the page's ground in, a
      // 3 px halo, the 1 px line, then the 1 px fill, the edge's own stroke and the fill (together
      // the stroke's width plus 2), and the same back out. A shot has one pixel per CSS px here, so
      // the core is read as one piece.
      if (inVitest && zoom === 1 && id === "ab") {
        const runs = await colourRunsAcross(
          pathOf(board, id) as SVGGeometryElement,
          0.25,
          8,
          { ground: colours.fill, halo: colours.halo, line: colours.line, stroke: before.stroke },
          colours.fill,
          board,
        );
        const at4 = `${at}: runs ${JSON.stringify(runs)}`;
        const names = runs.map(([name]) => name);
        await expect(names.slice(0, 3), at4).toEqual(["ground", "halo", "line"]);
        await expect(names.slice(-3), at4).toEqual(["line", "halo", "ground"]);
        const outer = [...runs.slice(0, 3), ...runs.slice(-3)];
        const want = [2, 3, 1, 1, 3, 2];
        outer.forEach(([name, px], i) => {
          // The outer ground runs are the reach left over, so only the shape's own runs are held.
          if (name === "ground") return;
          expect(
            Math.abs(px - (want[i] ?? 0)),
            `${at4}: the ${name} run is ${px} px`,
          ).toBeLessThanOrEqual(0.75);
        });
        const core = runs.slice(3, -3).reduce((sum, [, px]) => sum + px, 0);
        await expect(
          Math.abs(core - (before.width + 2)),
          `${at4}: the core is ${core} px`,
        ).toBeLessThanOrEqual(1);
      }
      // The focus parts sit under the edge's own path.
      const own = pathOf(board, id);
      await expect(
        part(id, "fill").compareDocumentPosition(own) & Node.DOCUMENT_POSITION_FOLLOWING,
        `${at}: the focus parts are under the path`,
      ).toBeTruthy();
      edgeEl(id).blur();
      await waitFor(() => expect(edgeEl(id).matches(":focus-visible")).toBe(false));
      await expect(getComputedStyle(part(id, "halo")).display, `${at}: gone on blur`).toBe("none");
    }
  };
  await check(1);
  await check(0.5);
  await waitFor(async () => {
    await flows.get("chain")?.zoomTo(1, { duration: 0 });
    expect(viewportZoom(board)).toBeCloseTo(1, 3);
  });
  // The shape follows the width the edge draws at: a chained edge draws wider, and a chained derived
  // one wider still (a hovered one is in FocusedEdgeHovered).
  const node = (id: string) => board.querySelector(`.react-flow__node[data-id="${id}"]`) as Element;
  // A key press first, so the browser takes the focus that follows as keyboard focus.
  const focusByKey = async (id: string) => {
    await userEvent.keyboard("{Shift}");
    edgeEl(id).focus();
    await waitFor(() =>
      expect(edgeEl(id).matches(":focus-visible"), `focus-visible on ${id}`).toBe(true),
    );
  };
  const widthsHold = async (id: string, at: string) => {
    const own = drawn(pathOf(board, id)).width;
    await focusByKey(id);
    for (const [name, extra] of parts) {
      await expect(drawn(part(id, name)).width, `${at}: ${name} width`).toBeCloseTo(own + extra, 2);
    }
    edgeEl(id).blur();
    await waitFor(() => expect(edgeEl(id).matches(":focus-visible")).toBe(false));
    return own;
  };
  await userEvent.click(node("b"));
  await waitFor(() => expect(board).toHaveAttribute("data-has-selection"));
  await expect(await widthsHold("ab", "chained edge ab")).toBeCloseTo(2.5, 2);
  // An edge outside the chain has stepped back; focused, it is at full strength again.
  const own = (id: string) => edgeEl(id).querySelector(".ds-edge") as Element;
  await expect(getComputedStyle(own("de")).opacity).toBe("0.4");
  await focusByKey("de");
  await expect(getComputedStyle(own("de")).opacity, "a focused edge outside the chain").toBe("1");
  edgeEl("de").blur();
  await userEvent.click(node("d"));
  await waitFor(() => expect(own("de")).toHaveAttribute("data-chain"));
  await expect(await widthsHold("de", "chained derived edge de")).toBeCloseTo(3.5, 2);
  // A selected edge draws at the selected width, and its focus shape with it, still not the
  // selected look itself.
  await userEvent.click(board.querySelector(".react-flow__pane") as Element);
  await waitFor(() => expect(board).not.toHaveAttribute("data-has-selection"));
  await userEvent.click(edgeEl("bc").querySelector(".react-flow__edge-interaction") as Element);
  await waitFor(() => expect(edgeEl("bc")).toHaveClass("selected"));
  await expect(await widthsHold("bc", "selected edge bc")).toBeCloseTo(2.5, 2);
}

/** A focused edge shows the focus shape and keeps its own stroke (spec row 25). */
export const FocusedEdge: Story = {
  render: () => <ChainBoard lang="th" />,
  play: async ({ canvasElement }) => playFocusedEdge(canvasElement),
};

/** The focused edge in English, in dark mode. */
export const FocusedEdgeInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <ChainBoard lang="en" />,
  play: async ({ canvasElement }) => playFocusedEdge(canvasElement),
};

/**
 * A hovered edge on a present board draws at the chain width, and the focus shape follows it. The
 * addon imitates the hover in the styles, so this holds where no pointer is driven.
 */
export const FocusedEdgeHovered: Story = {
  parameters: {
    pseudo: {
      rootSelector: "body",
      hover: ['.react-flow__edge[data-id="fg"]', '.react-flow__edge[data-id="de"]'],
    },
  },
  render: () => <ChainBoard lang="th" />,
  play: async ({ canvasElement }) => {
    const board = await zoomTo(canvasElement, "chain", 1);
    // An input edge hovers at the chain width (2.5), a derived one at 2 x 2.5 less 1.5 (3.5).
    for (const [id, width] of [
      ["fg", 2.5],
      ["de", 3.5],
    ] as const) {
      const edge = board.querySelector(`.react-flow__edge[data-id="${id}"]`) as HTMLElement;
      await waitFor(() => expect(drawn(pathOf(board, id)).width).toBeCloseTo(width, 2));
      await userEvent.keyboard("{Shift}");
      edge.focus();
      await waitFor(() =>
        expect(edge.matches(":focus-visible"), `focus-visible on ${id}`).toBe(true),
      );
      for (const [name, extra] of [
        ["halo", 10],
        ["line", 4],
        ["fill", 2],
      ] as const) {
        const part = edge.querySelector(`.ds-edge__focus[data-part="${name}"]`) as Element;
        await expect(drawn(part).width, `hovered edge ${id}: ${name} width`).toBeCloseTo(
          width + extra,
          2,
        );
      }
      edge.blur();
      await waitFor(() => expect(edge.matches(":focus-visible")).toBe(false));
    }
  },
};

/**
 * Four edges, three labels: `label: false` hides the pill, a stale or invalid edge shows it
 * anyway because the pill carries the state, and an edge with no `label` field shows its pill
 * (spec row 11). Every edge keeps its name.
 */
function labelGraph(lang: keyof typeof TITLES): Graph {
  return pairs(
    [
      { meaning: "reference", label: false },
      { meaning: "input", label: false, stale: true },
      { meaning: "derived", label: false, invalid: true },
      { meaning: "input" },
    ],
    [],
    { lang, gap: 100 },
  );
}

async function playLabelHidden(root: HTMLElement, lang: keyof typeof TITLES) {
  const canvas = within(root);
  await waitFor(() => expect(edgeEls(root)).toHaveLength(4));
  const { from, to } = TITLES[lang];
  const words =
    lang === "th"
      ? {
          reference: "อ้างอิง",
          stale: "ป้อนเข้า, ล้าสมัย",
          invalid: "สร้างจาก, เชื่อมต่อไม่ได้",
          plain: "ป้อนเข้า",
        }
      : {
          reference: "reference",
          stale: "input, stale",
          invalid: "derived from, cannot connect",
          plain: "input",
        };
  const names =
    lang === "th"
      ? [
          `อ้างอิง จาก ${from} 1 ไป ${to} 1`,
          `ป้อนเข้า จาก ${from} 2 ไป ${to} 2, ล้าสมัย`,
          `สร้างจาก ${from} 3 ไป ${to} 3, เชื่อมต่อไม่ได้`,
          `ป้อนเข้า จาก ${from} 4 ไป ${to} 4`,
        ]
      : [
          `reference from ${from} 1 to ${to} 1`,
          `input from ${from} 2 to ${to} 2, stale`,
          `derived from ${from} 3 to ${to} 3, cannot connect`,
          `input from ${from} 4 to ${to} 4`,
        ];
  // Every edge keeps its accessible name from the board, hidden label or not.
  for (const name of names) await expect(canvas.getByRole("group", { name })).toBeInTheDocument();
  const pills = root.querySelectorAll(".ds-edge__label");
  await expect(pills).toHaveLength(3);
  for (const pill of pills) await expect(pill).toHaveAttribute("aria-hidden", "true");
  await expect(canvas.queryByText(words.reference)).toBeNull();
  await expect(canvas.getByText(words.stale)).toBeInTheDocument();
  await expect(canvas.getByText(words.invalid)).toBeInTheDocument();
  await expect(canvas.getByText(words.plain)).toBeInTheDocument();
}

function LabelBoard({ lang }: { lang: keyof typeof TITLES }) {
  return <EdgeBoard variant="present" initial={labelGraph(lang)} height={420} />;
}

/** A hidden label shows no pill; a stale or invalid edge shows it anyway (spec row 11). */
export const LabelHidden: Story = {
  render: () => <LabelBoard lang="th" />,
  play: async ({ canvasElement }) => playLabelHidden(canvasElement, "th"),
};

/** The hidden label in English, in dark mode. */
export const LabelHiddenInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  render: () => <LabelBoard lang="en" />,
  play: async ({ canvasElement }) => playLabelHidden(canvasElement, "en"),
};

/**
 * The present look under three profiles in both modes: the five hues, a chain from a selected
 * node, a hidden label and a stale edge. The Matrix puts six present boards on the page, so the
 * accessibility addon covers every boundary.
 */
function recipeGraph(): Graph {
  const graph = pairs(
    KINDS.map((): EdgeContent => ({ meaning: "input" })),
    [],
    { gap: 100 },
  );
  const kindOf = (i: number) => KINDS[i] ?? "text";
  graph.nodes = graph.nodes.map((n) => {
    const i = Number(n.id.slice(1));
    const port = { id: "text", kind: kindOf(i), label: kindOf(i) };
    return {
      ...n,
      selected: n.id === "s0",
      data: {
        ...n.data,
        inputs: n.data.inputs.length > 0 ? [port] : [],
        outputs: n.data.outputs.length > 0 ? [port] : [],
      },
    };
  });
  graph.edges = graph.edges.map((e, i) => ({
    ...e,
    data: { ...(e.data ?? { meaning: "input" }), ...(i === 2 ? { label: false as const } : {}) },
  }));
  const stale = pairs([{ meaning: "reference", stale: true, label: false }], [], { gap: 100 });
  const y = KINDS.length * 100;
  graph.nodes.push(
    ...stale.nodes.map((n) => ({ ...n, id: `x${n.id}`, position: { x: n.position.x, y } })),
  );
  graph.edges.push(...stale.edges.map((e) => ({ ...e, id: "ex", source: "xs0", target: "xt0" })));
  return graph;
}

export const PresentRecipesAndModes: Story = {
  render: () => (
    <Matrix>
      {/* No controls: the toolbar sits over the bottom edge at the middle, where the ink is read. */}
      <EdgeBoard variant="present" initial={recipeGraph()} height={600} chrome={false} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    await waitFor(() => {
      for (const cell of cells) {
        expect(cell.querySelectorAll('.ds-board[data-variant="present"]')).toHaveLength(1);
        expect(cell.querySelectorAll(".react-flow__edge")).toHaveLength(6);
      }
    });
    for (const cell of cells) {
      // Six edges, five pills: the label of edge three is hidden, the stale edge keeps its own.
      await expect(cell.querySelectorAll(".ds-edge__label")).toHaveLength(5);
      await expect(cell.querySelectorAll(".ds-edge[data-chain]")).toHaveLength(1);
      await expect(cell.querySelector(".ds-board")).toHaveAttribute("data-has-selection");
      await expect(cell.querySelectorAll(".ds-edge[data-stale]")).toHaveLength(1);
      // The ground's hairline (spec row 7) is 1 px of ink on every side in all six boundaries.
      if (inVitest) {
        await expectEdgeInk(
          cell.querySelector(".ds-board") as Element,
          ["top", "right", "bottom", "left"],
          1,
        );
      }
      const kinds = [...cell.querySelectorAll(".ds-edge")].map((g) => g.getAttribute("data-kind"));
      await expect(new Set(kinds)).toEqual(new Set(KINDS));
    }
  },
};
