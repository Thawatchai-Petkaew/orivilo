import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { CANVAS_WORDS, PORT_KINDS, portShape } from "../../tokens/canvas";
import { CanvasBoard, type CanvasBoardProps } from "../canvas-board/CanvasBoard";
import type { Graph, PortSpec } from "../canvas-board/graph";
import { fillHeight, Matrix } from "../matrix";
import { PortGlyph, type PortState } from "./NodePort";

const ports: PortSpec[] = PORT_KINDS.map((kind) => ({
  id: kind,
  kind,
  label: CANVAS_WORDS.port[kind].th,
}));

/** One node with every kind in and out. */
const allKinds: Graph = {
  nodes: [
    {
      id: "all",
      type: "orivilo",
      position: { x: 0, y: 0 },
      data: { title: "ทุกชนิด", kind: "knowledge", inputs: ports, outputs: ports },
    },
  ],
  edges: [],
};

const connectedPair: Graph = {
  nodes: [
    {
      id: "a",
      type: "orivilo",
      position: { x: 0, y: 0 },
      data: {
        title: "ต้นทาง",
        kind: "input-block",
        size: "sm",
        inputs: [],
        outputs: [ports[0] as PortSpec, ports[1] as PortSpec],
      },
    },
    {
      id: "b",
      type: "orivilo",
      position: { x: 360, y: 0 },
      data: {
        title: "ปลายทาง",
        kind: "artifact",
        size: "sm",
        inputs: [ports[0] as PortSpec, ports[1] as PortSpec],
        outputs: [],
      },
    },
  ],
  edges: [
    {
      id: "e",
      type: "orivilo",
      source: "a",
      sourceHandle: "text",
      target: "b",
      targetHandle: "text",
      data: { meaning: "input" },
    },
  ],
};

function PortBoard({
  initial,
  height = 360,
  ...rest
}: Omit<CanvasBoardProps, "graph" | "onChange" | "label"> & { initial: Graph; height?: number }) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div style={{ height: fillHeight(height) }}>
      <CanvasBoard
        label={`ตัวอย่างพอร์ต${scope ? `, ${id} ${scope.mode}` : ""}`}
        {...rest}
        graph={graph}
        onChange={setGraph}
      />
    </div>
  );
}

const meta = {
  title: "Application/Node port",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A connection point typed by the data it carries: shape and colour per kind (E4-1), direction and kind in the accessible name. Renders inside a CanvasNode; the connecting, valid-target and invalid-target states appear while a connection is dragged or picked by keyboard (proven in Canvas board › Pointer connect and Keyboard connect).",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five kinds in, five out: five shapes, five colours, each named "พอร์ตรับ <kind>" or "พอร์ตส่ง <kind>". */
export const Kinds: Story = {
  render: () => <PortBoard initial={allKinds} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(10));
    const shapes = new Set(
      [...canvasElement.querySelectorAll("[data-port-shape]")].map((p) =>
        p.getAttribute("data-port-shape"),
      ),
    );
    await expect(shapes.size).toBe(5);
    for (const kind of PORT_KINDS) {
      const word = CANVAS_WORDS.port[kind].th;
      await expect(canvas.getByRole("img", { name: `พอร์ตรับ${word}` })).toBeInTheDocument();
      await expect(canvas.getByRole("img", { name: `พอร์ตส่ง${word}` })).toBeInTheDocument();
      await expect(canvas.getByRole("img", { name: `พอร์ตรับ${word}` })).toHaveAttribute(
        "data-port-shape",
        portShape(kind),
      );
    }
    const fills = new Set(
      [...canvasElement.querySelectorAll('.ds-port[data-direction="input"] .ds-port__glyph')].map(
        (g) => getComputedStyle(g).fill,
      ),
    );
    await expect(fills.size).toBe(5);
  },
};

/** Connected ports say so in their name; the unconnected pair stays idle. */
export const Connected: Story = {
  render: () => <PortBoard initial={connectedPair} height={300} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(4));
    await expect(
      canvas.getByRole("img", { name: "พอร์ตส่งข้อความ, เชื่อมอยู่" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("img", { name: "พอร์ตรับข้อความ, เชื่อมอยู่" }),
    ).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.ds-port[data-state="connected"]')).toHaveLength(
      2,
    );
    await expect(canvasElement.querySelectorAll('.ds-port[data-state="idle"]')).toHaveLength(2);
  },
};

/** Disabled on a present board: the glyph keeps its full hue, the name says it cannot be edited. */
export const Disabled: Story = {
  render: () => <PortBoard initial={connectedPair} height={300} variant="present" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(4));
    await expect(canvasElement.querySelectorAll('.ds-port[data-state="disabled"]')).toHaveLength(4);
    await expect(within(canvasElement).getAllByRole("img", { name: /แก้ไขไม่ได้$/ })).toHaveLength(
      4,
    );
  },
};

const STATES: PortState[] = [
  "idle",
  "connecting",
  "valid-target",
  "invalid-target",
  "connected",
  "disabled",
];

/** A static lineup of the port recipe in every state, for the eye; the live states are proven on the board. */
export const StatesLineup: Story = {
  render: () => (
    <div className="ds-board p-6" style={{ height: "auto" }}>
      <p className="mb-4 text-label-md text-text-secondary">
        ตัวอย่างสถานะของพอร์ต (ภาพนิ่งจาก recipe)
      </p>
      <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2">
        {STATES.map((state) => (
          <li key={state} className="ds-node" data-size="sm" style={{ position: "relative" }}>
            <div className="ds-node__header">
              <span className="ds-node__title">{state}</span>
            </div>
            <div className="ds-node__ports">
              <ul
                className="ds-node__port-list"
                data-direction="input"
                aria-label={`พอร์ตรับ, ${state}`}
              >
                <li className="ds-port" data-kind="image" data-direction="input" data-state={state}>
                  <span
                    className="ds-port__handle react-flow__handle react-flow__handle-left"
                    data-port-shape="square"
                  >
                    <PortGlyph shape="square" />
                  </span>
                  <span className="ds-port__label">ภาพ</span>
                </li>
              </ul>
              <ul
                className="ds-node__port-list"
                data-direction="output"
                aria-label={`พอร์ตส่ง, ${state}`}
              >
                <li className="ds-port" data-kind="text" data-direction="output" data-state={state}>
                  <span
                    className="ds-port__handle react-flow__handle react-flow__handle-right"
                    data-port-shape="circle"
                  >
                    <PortGlyph shape="circle" />
                  </span>
                  <span className="ds-port__label">ข้อความ</span>
                </li>
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(12);
    const stroke = (state: PortState) =>
      getComputedStyle(
        canvasElement.querySelector(`.ds-port[data-state="${state}"] .ds-port__glyph`) as Element,
      ).stroke;
    await expect(stroke("valid-target")).not.toBe(stroke("idle"));
    await expect(stroke("connecting")).not.toBe(stroke("idle"));
  },
};

/** The ports under three profiles in both modes: the port tokens are locked, so the kinds keep their colours. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <PortBoard initial={allKinds} height={300} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(60));
  },
};

type Lang = "th" | "en";

/** Three present nodes in a row, 100 px apart: one at rest, one hovered, one selected. */
function presentNames(lang: Lang): Graph {
  const words = { th: ["ปกติ", "โฮเวอร์", "เลือกอยู่"], en: ["Rest", "Hover", "Selected"] }[lang];
  const pair: PortSpec[] = [0, 1].map((i) => ({
    id: PORT_KINDS[i] as string,
    kind: PORT_KINDS[i] as PortSpec["kind"],
    label: CANVAS_WORDS.port[PORT_KINDS[i] as PortSpec["kind"]][lang],
  }));
  return {
    nodes: words.map((title, i) => ({
      id: `p${i}`,
      type: "orivilo" as const,
      position: { x: i * 360, y: 0 },
      ...(i === 2 ? { selected: true } : {}),
      data: { title, kind: "knowledge" as const, size: "sm" as const, inputs: pair, outputs: pair },
    })),
    edges: [],
  };
}

async function playPresentNames(root: HTMLElement, lang: Lang) {
  await waitFor(() => expect(root.querySelectorAll(".ds-port")).toHaveLength(12));
  const node = (id: string) => root.querySelector(`.react-flow__node[data-id="${id}"]`) as Element;
  const pills = (id: string) => [...node(id).querySelectorAll<HTMLElement>(".ds-port__label")];
  const visibility = (el: Element) => getComputedStyle(el).visibility;
  // Hidden at rest, shown on hover (forced by the pseudo-states addon) and on selection.
  for (const pill of pills("p0")) await expect(visibility(pill)).toBe("hidden");
  await waitFor(() => {
    for (const pill of pills("p1")) expect(visibility(pill)).toBe("visible");
  });
  for (const pill of pills("p2")) await expect(visibility(pill)).toBe("visible");
  // Shown on keyboard focus too (spec row 3): the rest node takes focus and its pills show.
  const rest = node("p0") as HTMLElement;
  await waitFor(() => {
    rest.focus();
    expect(rest).toHaveFocus();
    expect(rest.matches(":focus-visible"), "the rest node's focus is a keyboard focus").toBe(true);
    for (const pill of pills("p0")) expect(visibility(pill)).toBe("visible");
  });
  rest.blur();
  for (const pill of pills("p0")) await waitFor(() => expect(visibility(pill)).toBe("hidden"));
  // A pill reads the port's own name; the input pill sits before the edge, the output pill after it.
  const input = node("p2").querySelector('.ds-port[data-direction="input"]') as Element;
  const output = node("p2").querySelector('.ds-port[data-direction="output"]') as Element;
  await expect(input.querySelector(".ds-port__label")).toHaveTextContent(
    CANVAS_WORDS.port[PORT_KINDS[0] as PortSpec["kind"]][lang],
  );
  const handle = (li: Element) =>
    (li.querySelector(".ds-port__handle") as Element).getBoundingClientRect();
  const pill = (li: Element) =>
    (li.querySelector(".ds-port__label") as Element).getBoundingClientRect();
  await expect(pill(input).right).toBeLessThanOrEqual(handle(input).left);
  await expect(pill(output).left).toBeGreaterThanOrEqual(handle(output).right);
  // The catalog name stays on the handle, read only on a present board, and the glyph is not faded.
  const names = [...root.querySelectorAll(".ds-port__handle")].map((h) =>
    h.getAttribute("aria-label"),
  );
  const suffix = lang === "th" ? "แก้ไขไม่ได้" : "read only";
  for (const name of names) await expect(name).toMatch(new RegExp(`, ${suffix}$`));
  await expect(names[0]).toContain(CANVAS_WORDS.port[PORT_KINDS[0] as PortSpec["kind"]][lang]);
  for (const h of root.querySelectorAll(".ds-port__handle")) {
    await expect(getComputedStyle(h).opacity).toBe("1");
  }
  // No side dot sits on the card's bend (ORV-274, S1): its top is at least the card's top plus the
  // corner radius on screen, and its bottom at most the card's bottom less it. The viewport's zoom
  // scales the radius, which is a world length.
  const viewport = root.querySelector<HTMLElement>(".react-flow__viewport");
  const zoom = parseFloat(/scale\(([\d.]+)\)/.exec(viewport?.style.transform ?? "")?.[1] ?? "NaN");
  const sideDots = root.querySelectorAll<HTMLElement>(".ds-port:not([data-row]) .ds-port__handle");
  await expect(sideDots.length).toBeGreaterThan(0);
  for (const dot of sideDots) {
    const card = dot.closest(".ds-node") as HTMLElement;
    const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) * zoom;
    const dotBox = dot.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    await expect(dotBox.top - (cardBox.top + radius)).toBeGreaterThanOrEqual(-0.5);
    await expect(cardBox.bottom - radius - dotBox.bottom).toBeGreaterThanOrEqual(-0.5);
  }
}

/**
 * The name pills of a present board (spec row 3): hidden at rest, shown when the node is hovered or
 * selected, on the outer side of each dot. The catalog name stays on the handle and the dot keeps
 * its full hue although the port is read only.
 */
export const PresentNames: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: ['.react-flow__node[data-id="p1"]'] } },
  render: () => <PortBoard initial={presentNames("th")} height={260} variant="present" />,
  play: async ({ canvasElement }) => playPresentNames(canvasElement, "th"),
};

/** The present pills in English, in dark mode. */
export const PresentNamesInEnglish: Story = {
  globals: { locale: "en", mode: "dark" },
  parameters: { pseudo: { rootSelector: "body", hover: ['.react-flow__node[data-id="p1"]'] } },
  render: () => <PortBoard initial={presentNames("en")} height={260} variant="present" />,
  play: async ({ canvasElement }) => playPresentNames(canvasElement, "en"),
};

/** All five kinds on a present board under three profiles in both modes: locked hues, full opacity. */
export const PresentRecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <PortBoard initial={allKinds} height={300} variant="present" />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-port")).toHaveLength(60));
    const cells = canvasElement.querySelectorAll("[data-matrix-cell]");
    await expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const fills = new Set(
        [...cell.querySelectorAll('.ds-port[data-direction="input"] .ds-port__glyph')].map(
          (g) => getComputedStyle(g).fill,
        ),
      );
      await expect(fills.size).toBe(5);
    }
    for (const h of canvasElement.querySelectorAll(".ds-port__handle")) {
      await expect(getComputedStyle(h).opacity).toBe("1");
    }
  },
};
