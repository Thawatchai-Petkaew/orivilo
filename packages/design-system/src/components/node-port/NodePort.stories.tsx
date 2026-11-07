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

/** Disabled on a present board: the glyph fades, the name says it cannot be edited. */
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
