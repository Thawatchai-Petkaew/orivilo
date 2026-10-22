import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Page, Section, Table, Cell, Swatch, chainText, varOf } from "./shared";
import {
  CANVAS_WORDS,
  EDGE_MEANINGS,
  NODE_STATUSES,
  PORT_KINDS,
  type PortShape,
  portShape,
} from "../tokens/canvas";
import { type Mode, tokens } from "../tokens/index";

const token = (path: string) => {
  const t = tokens.get("semantic", path);
  if (!t) throw new Error(`${path} missing`);
  return t;
};

/** The five port shapes, 16 px, filled with the kind's colour and ringed with the node colour. */
function PortGlyph({ shape, colour, label }: { shape: PortShape; colour: string; label: string }) {
  const paths: Record<PortShape, string> = {
    circle: "M8 1.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13z",
    square: "M2 2h12v12H2z",
    diamond: "M8 1l7 7l-7 7l-7-7z",
    triangle: "M8 1.5l7 13H1z",
    hexagon: "M4.5 1.5h7l3.5 6.5l-3.5 6.5h-7L1 8z",
  };
  return (
    <svg
      role="img"
      aria-label={label}
      data-port-shape={shape}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="shrink-0"
    >
      <path
        d={paths[shape]}
        fill={`var(${colour})`}
        stroke="var(--cmp-port-ring)"
        strokeWidth="var(--cmp-port-ring-width)"
      />
    </svg>
  );
}

function CanvasPage({ mode }: { mode: Mode }) {
  return (
    <Page
      title={`Canvas tokens, ${mode} mode`}
      lead="The Studio board's vocabulary (ADR 0004, E4-1): the board and its grid, one colour and one shape per port kind, one dash pattern per edge meaning, and the status words. Studio chrome: locked against profile override, so nothing here changes inside a customer boundary. Values come from src/tokens/source/semantic.json."
    >
      <Section title="Board">
        <div
          data-board=""
          className="relative h-40 overflow-hidden rounded-container"
          style={{
            background: "var(--cmp-board-bg)",
            backgroundImage: "radial-gradient(var(--cmp-board-grid) 1px, transparent 1.5px)",
            backgroundSize: "var(--cmp-board-grid-gap) var(--cmp-board-grid-gap)",
          }}
        >
          <div
            className="absolute top-6 left-6 w-48 overflow-hidden"
            style={{
              background: "var(--cmp-node-bg)",
              color: "var(--cmp-node-fg)",
              border: "1px solid var(--cmp-node-border)",
              borderRadius: "var(--cmp-node-radius)",
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 text-label-md"
              style={{ background: "var(--cmp-node-header-bg)" }}
            >
              <span>บรีฟ</span>
              <span className="text-label-sm" style={{ color: "var(--cmp-node-kind-fg)" }}>
                input block
              </span>
            </div>
            <div className="px-3 py-2 text-body-sm">แอปสั่งอาหารสำหรับร้านกาแฟ</div>
          </div>
          <div
            className="absolute top-10 right-8 h-20 w-32"
            style={{
              border: "2px solid var(--cmp-board-selection)",
              background: `color-mix(in srgb, var(--cmp-board-selection) calc(var(--cmp-board-selection-opacity) * 100%), transparent)`,
              borderRadius: "var(--cmp-node-radius)",
            }}
            aria-label="box selection"
            role="img"
          />
        </div>
        <Table head={["Token", "Chain, light", "Chain, dark", "Use for"]}>
          {[
            "surface.board",
            "canvas.grid",
            "canvas.selection",
            "opacity.selection",
            "space.grid-gap",
          ].map((path) => {
            const t = token(path);
            return (
              <tr key={path}>
                <Cell>
                  <span className="inline-flex items-center gap-2">
                    {t.type === "color" ? (
                      <Swatch cssVar={varOf(t)} label={`${t.path} in ${mode} mode`} />
                    ) : null}
                    <span className="font-mono">{t.path}</span>
                  </span>
                </Cell>
                <Cell mono>{chainText(t, "light")}</Cell>
                <Cell mono>{chainText(t, "dark")}</Cell>
                <Cell>{t.description ?? ""}</Cell>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section title="Port kinds: shape and colour">
        <Table head={["Kind", "Shape", "Token", "Chain, light", "Chain, dark", "Use for"]}>
          {PORT_KINDS.map((kind) => {
            const t = token(`port.${kind}`);
            const shape = portShape(kind);
            return (
              <tr key={kind}>
                <Cell>
                  <span className="inline-flex items-center gap-2">
                    <PortGlyph
                      shape={shape}
                      colour={varOf(t)}
                      label={`${CANVAS_WORDS.port[kind].en} port, ${shape}`}
                    />
                    {CANVAS_WORDS.port[kind].th} ({CANVAS_WORDS.port[kind].en})
                  </span>
                </Cell>
                <Cell>{shape}</Cell>
                <Cell mono>{t.path}</Cell>
                <Cell mono>{chainText(t, "light")}</Cell>
                <Cell mono>{chainText(t, "dark")}</Cell>
                <Cell>{t.description ?? ""}</Cell>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section title="Edge meanings: dash pattern">
        <Table head={["Meaning", "Stroke", "Dash", "Use for"]}>
          {EDGE_MEANINGS.map((meaning) => {
            const dash = token(`edge.dash.${meaning}`);
            const value = String(tokens.resolve(dash, mode).value);
            return (
              <tr key={meaning}>
                <Cell>
                  {CANVAS_WORDS.edge[meaning].th} ({CANVAS_WORDS.edge[meaning].en})
                </Cell>
                <Cell>
                  <svg
                    role="img"
                    aria-label={`${meaning} edge`}
                    data-edge-meaning={meaning}
                    width="160"
                    height="12"
                    viewBox="0 0 160 12"
                  >
                    <path
                      d="M2 6h156"
                      fill="none"
                      stroke="var(--cmp-edge-stroke)"
                      strokeWidth="var(--cmp-edge-width)"
                      strokeLinecap="round"
                      strokeDasharray={value === "none" ? undefined : value}
                    />
                  </svg>
                </Cell>
                <Cell mono>{value}</Cell>
                <Cell>{dash.description ?? ""}</Cell>
              </tr>
            );
          })}
        </Table>
        <Table head={["State", "Token", "Chain, light", "Chain, dark", "Use for"]}>
          {["stroke", "stroke-hover", "stroke-selected", "stroke-invalid", "stroke-stale"].map(
            (s) => {
              const t = token(`edge.${s}`);
              return (
                <tr key={s}>
                  <Cell>
                    {s.replace("stroke-", "") === "stroke" ? "rest" : s.replace("stroke-", "")}
                  </Cell>
                  <Cell>
                    <span className="inline-flex items-center gap-2">
                      <Swatch cssVar={varOf(t)} label={`${t.path} in ${mode} mode`} />
                      <span className="font-mono">{t.path}</span>
                    </span>
                  </Cell>
                  <Cell mono>{chainText(t, "light")}</Cell>
                  <Cell mono>{chainText(t, "dark")}</Cell>
                  <Cell>{t.description ?? ""}</Cell>
                </tr>
              );
            },
          )}
        </Table>
      </Section>

      <Section title="Status words">
        <Table head={["Status", "Token", "Chain, light", "Chain, dark", "Use for"]}>
          {NODE_STATUSES.map((s) => {
            const t = token(`status.${s}`);
            return (
              <tr key={s}>
                <Cell>
                  <span className="text-label-md" style={{ color: `var(${varOf(t)})` }}>
                    {CANVAS_WORDS.status[s].th}
                  </span>
                </Cell>
                <Cell mono>{t.path}</Cell>
                <Cell mono>{chainText(t, "light")}</Cell>
                <Cell mono>{chainText(t, "dark")}</Cell>
                <Cell>{t.description ?? ""}</Cell>
              </tr>
            );
          })}
        </Table>
      </Section>
    </Page>
  );
}

const meta = {
  title: "Foundations/Canvas tokens",
  component: CanvasPage,
  tags: ["autodocs"],
  args: { mode: "light" },
  render: (_args, { globals }) => <CanvasPage mode={globals["mode"] as Mode} />,
} satisfies Meta<typeof CanvasPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five ports with five shapes, three edge patterns, three statuses, rendered from the tokens. */
export const Contract: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ports = canvasElement.querySelectorAll("[data-port-shape]");
    await expect(ports).toHaveLength(5);
    const shapes = new Set([...ports].map((p) => p.getAttribute("data-port-shape")));
    await expect(shapes.size).toBe(5);
    await expect(canvasElement.querySelectorAll("[data-edge-meaning]")).toHaveLength(3);
    await expect(canvas.getByText("กำลังทำงาน")).toBeVisible();
    const board = canvasElement.querySelector<HTMLElement>("[data-board]");
    await expect(getComputedStyle(board as Element).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};
