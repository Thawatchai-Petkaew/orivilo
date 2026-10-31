import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { type Answer, placeBlock } from "../../blocks/index";
import { BlockLibrary } from "../block-library/BlockLibrary";
import { blockNode, feed, MIDWAY } from "../block-library/fixtures";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import type { Graph } from "../canvas-board/graph";
import { fillHeight, Matrix, Narrow } from "../matrix";
import { Resizable } from "../resizable/Resizable";
import { Sheet, SheetContent } from "../sheet/Sheet";
import { Inspector } from "./Inspector";
import { MOD } from "../story-keys";

function select(graph: Graph, ids: readonly string[]): Graph {
  return {
    nodes: graph.nodes.map((n) => ({ ...n, selected: ids.includes(n.id) })),
    edges: graph.edges.map((e) => ({ ...e, selected: false })),
  };
}

function answer(graph: Graph, nodeId: string, inputId: string, value: Answer): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, answers: { ...n.data.answers, [inputId]: value } } }
        : n,
    ),
  };
}

const PLAIN: Graph = {
  nodes: [
    {
      id: "note",
      type: "orivilo",
      position: { x: 0, y: 0 },
      selected: true,
      data: {
        title: "โน้ตจากการประชุม",
        kind: "note",
        summary: "ลูกค้าอยากให้แอปดูอบอุ่นแต่ยังน่าเชื่อถือ",
        missing: ["กลุ่มผู้ใช้"],
        inputs: [],
        outputs: [],
      },
    },
  ],
  edges: [],
};

/** The Inspector alone over a graph in state, the way a shell keeps it. */
function Panel({ initial, label }: { initial: Graph; label?: string }) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div
      style={{ height: fillHeight(520) }}
      className="max-w-sm rounded-container border border-border-card"
    >
      <Inspector
        label={label ?? (scope ? `แผงรายละเอียด, ${id} ${scope.mode}` : undefined)}
        graph={graph}
        onAnswer={(node, input, value) => setGraph((g) => answer(g, node, input, value))}
        onJumpToNode={(node) => setGraph((g) => select(g, [node]))}
      />
    </div>
  );
}

/**
 * The Studio as a shell would lay it out: the board with the shelf, the Inspector in a Resizable
 * panel. `node.open` shows the node and moves focus to the panel; Mod+I and Mod+B toggle the
 * panel and the shelf; Escape in the panel hides it and returns focus to the board.
 */
function Studio({ initial = MIDWAY }: { initial?: Graph }) {
  const [graph, setGraph] = useState(initial);
  const [inspector, setInspector] = useState(true);
  const [library, setLibrary] = useState(true);
  const [focusPanel, setFocusPanel] = useState(0);
  const panel = useRef<HTMLElement>(null);
  const area = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusPanel > 0) panel.current?.focus();
  }, [focusPanel]);
  return (
    <div ref={area} style={{ height: fillHeight(640) }} className="flex min-w-0">
      <div className="min-w-0 flex-1">
        <CanvasBoard
          label="กระดาน Intent Studio"
          graph={graph}
          onChange={setGraph}
          onCommand={(command) => {
            if (command === "node.open") {
              setInspector(true);
              setFocusPanel((n) => n + 1);
            }
            if (command === "panel.toggle-inspector") setInspector((v) => !v);
            if (command === "panel.toggle-library") setLibrary((v) => !v);
          }}
        >
          {library ? (
            <BlockLibrary
              onPlace={(block, position) =>
                setGraph((g) =>
                  placeBlock(g, block, `${block.id}-${g.nodes.length + 1}`, position, "th"),
                )
              }
            />
          ) : null}
        </CanvasBoard>
      </div>
      {inspector ? (
        <Resizable side="end" label="แผงด้านข้าง" collapsible={false}>
          <Inspector
            ref={panel}
            graph={graph}
            onAnswer={(node, input, value) => setGraph((g) => answer(g, node, input, value))}
            onJumpToNode={(node) => setGraph((g) => select(g, [node]))}
            onClose={() => {
              setInspector(false);
              area.current?.querySelector<HTMLElement>(".ds-board")?.focus();
            }}
          />
        </Resizable>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Application/Inspector",
  component: Inspector,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The panel beside the board for the selected node (ORV-44 part 3): summary, missing inputs and sources, derived from the board by the same rules as the node and the shelf. Works by rules and says so. A Resizable side panel on wide screens, a Sheet on narrow ones.",
      },
    },
  },
  args: { graph: MIDWAY, onAnswer: () => undefined },
} satisfies Meta<typeof Inspector>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelOf = (root: HTMLElement) =>
  within(within(root).getByRole("region", { name: /แผงรายละเอียด/ }));

/** Nothing selected: pick a node, and the board's block nodes counted by state in words. */
export const NoSelection: Story = {
  render: () => <Panel initial={MIDWAY} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByRole("heading", { name: "เลือก node เพื่อดูรายละเอียด" })).toBeVisible();
    await expect(p.getByText("บนกระดานมี 6 node")).toBeVisible();
    const rows = p.getAllByRole("listitem").map((li) => li.textContent);
    await expect(rows).toEqual(["ยังว่าง2", "ตอบยังไม่ครบ1", "สรุปแล้ว2", "ยังไม่เชื่อม1"]);
  },
};

export const Several: Story = {
  render: () => <Panel initial={select(MIDWAY, ["brief", "mood"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByRole("heading", { name: "เลือกอยู่ 2 node" })).toBeVisible();
    await expect(p.queryByRole("tablist")).toBeNull();
  },
};

/** One block node: kind, title, fill word, the rule label, and every summary line with swatches. */
export const Selected: Story = {
  render: () => <Panel initial={select(MIDWAY, ["starter"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    // The panel fills the padded frame and is never shorter than its 520 px (spec ORV-189, `fill-height-1`).
    const wrapper = canvasElement.querySelector(".ds-inspector")?.parentElement;
    await expect(wrapper?.getBoundingClientRect().height).toBe(
      Math.max(520, window.innerHeight - 32),
    );
    await expect(p.getByRole("heading", { name: "สีตั้งต้น" })).toBeVisible();
    await expect(p.getByText("ทิศทาง")).toBeVisible();
    await expect(p.getByText("สรุปแล้ว")).toBeVisible();
    await expect(p.getByText("ตามกฎ ยังไม่ใช้ AI")).toBeVisible();
    await expect(p.getByRole("tab", { name: "สรุป" })).toHaveAttribute("aria-selected", "true");
    await expect(p.getByRole("tab", { name: "ข้อมูลที่ขาด" })).toBeVisible();
    await expect(p.getByText("สีหลัก: จาก สีที่พิมพ์มา")).toBeVisible();
    await expect(canvasElement.querySelectorAll(".ds-node__swatch")).toHaveLength(2);
  },
};

/** An empty node opens on its questions; its summary tab says what to do next. */
export const Empty: Story = {
  render: () => <Panel initial={select(MIDWAY, ["mood"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByRole("tab", { name: "ข้อมูลที่ขาด 2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(p.getByText("ข้อ 1 จาก 2")).toBeVisible();
    await userEvent.click(p.getByRole("tab", { name: "สรุป" }));
    await expect(p.getByText("ยังไม่มีสรุป ตอบคำถามในแท็บข้อมูลที่ขาดก่อน")).toBeVisible();
  },
};

/** Answering in the panel updates the header, the count and the node on the board at once. */
export const AnswerInPanel: Story = {
  render: () => <Studio initial={select(MIDWAY, ["brief"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByText("ถามอีก 1 ข้อ")).toBeVisible();
    await userEvent.click(p.getByRole("tab", { name: "ข้อมูลที่ขาด 1" }));
    await userEvent.type(
      p.getByRole("textbox", { name: /อยากให้ผลิตภัณฑ์นี้ช่วยใครทำอะไรได้/ }),
      "ช่วยคนทำงานเก็บเงินได้ทุกเดือน{Enter}",
    );
    await expect(p.getByText("สรุปแล้ว")).toBeVisible();
    await expect(p.getByRole("tab", { name: "ข้อมูลที่ขาด" })).toBeVisible();
    await expect(p.getByText("บรีฟ มีข้อมูลที่ต้องใช้ครบแล้ว")).toBeVisible();
    const node = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="brief"]');
    await waitFor(() => expect(within(node as HTMLElement).getByText("สรุปแล้ว")).toBeVisible());
  },
};

/** Sources: how each input is filled; a fed input names its node and selects it. */
export const Sources: Story = {
  render: () => <Panel initial={select(MIDWAY, ["starter"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await userEvent.click(p.getByRole("tab", { name: "ที่มา" }));
    await expect(p.getByText("ไม่บังคับ")).toBeVisible();
    await expect(p.getByText("ยังไม่ได้ส่งต่อให้ node ไหน")).toBeVisible();
    await userEvent.click(p.getByRole("button", { name: "จาก สีที่พิมพ์มา" }));
    await expect(p.getByRole("heading", { name: "สีที่พิมพ์มา" })).toBeVisible();
    await userEvent.click(p.getByRole("tab", { name: "ที่มา" }));
    await expect(p.getByText("คุณตอบเอง")).toBeVisible();
    await expect(p.getByRole("button", { name: "สีตั้งต้น" })).toBeVisible();
  },
};

/** A node outside the registry: its own summary and missing line, no tabs, no rule label. */
export const PlainNode: Story = {
  render: () => <Panel initial={PLAIN} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByRole("heading", { name: "โน้ตจากการประชุม" })).toBeVisible();
    await expect(p.getByText("ขาดข้อมูล: กลุ่มผู้ใช้")).toBeVisible();
    await expect(p.queryByRole("tablist")).toBeNull();
    await expect(p.queryByText("ตามกฎ ยังไม่ใช้ AI")).toBeNull();
  },
};

/** Enter on a node opens it here and moves focus; Mod+I and Mod+B toggle; Escape closes. */
export const StudioLayout: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <Studio />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const node = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="mood"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    node.focus();
    await userEvent.keyboard("{Enter}");
    const panel = canvas.getByRole("region", { name: "แผงรายละเอียด" });
    await waitFor(() => expect(panel).toHaveFocus());
    await expect(within(panel).getByRole("heading", { name: "มู้ดและธีม" })).toBeVisible();
    await expect(node).toHaveClass(/selected/);
    // Escape inside the panel hides it and returns focus to the board.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("region", { name: "แผงรายละเอียด" })).toBeNull());
    await expect(canvasElement.querySelector(".ds-board")).toHaveFocus();
    await userEvent.keyboard(`{${MOD}>}i{/${MOD}}`);
    await waitFor(() =>
      expect(canvas.getByRole("region", { name: "แผงรายละเอียด" })).toBeVisible(),
    );
    (canvasElement.querySelector(".ds-board") as HTMLElement).focus();
    await userEvent.keyboard(`{${MOD}>}b{/${MOD}}`);
    await waitFor(() => expect(canvas.queryByRole("group", { name: "คลังบล็อก" })).toBeNull());
  },
};

const MOODY: Graph = select(
  {
    nodes: [
      blockNode(
        "mood",
        "mood-theme",
        { x: 0, y: 0 },
        { personality: "อบอุ่น เป็นมิตร", feeling: "สนุก" },
      ),
      blockNode("font", "font", { x: 400, y: 0 }, { languages: "th-en" }),
      blockNode("shape", "shape-spacing", { x: 400, y: 260 }, { mood: "ฟ้าใส ทะเล" }),
    ],
    edges: [feed("mood", "font", "mood")],
  },
  ["font"],
);

/**
 * Suggestions by rules (ORV-61): the top three per kind with the mood's own words as the reason
 * and the licence; "Use this" writes the answer, and the pick shows on the node and here.
 */
export const Suggestions: Story = {
  render: () => <Studio initial={MOODY} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    const list = within(p.getByRole("region", { name: "ข้อเสนอตามกฎ" }));
    const rows = list.getAllByRole("listitem");
    await expect(rows).toHaveLength(3);
    await expect(within(rows[0] as HTMLElement).getByText("Mali")).toBeVisible();
    await expect(
      within(rows[0] as HTMLElement).getByText('เพราะ "สนุก", "อบอุ่น", "เป็นมิตร"'),
    ).toBeVisible();
    await expect(within(rows[0] as HTMLElement).getByText("สัญญาอนุญาต OFL-1.1")).toBeVisible();
    await expect(list.getByText("ยังไม่มีตัวอย่างฟอนต์และไอคอน แสดงเฉพาะชื่อ")).toBeVisible();
    await userEvent.click(list.getByRole("button", { name: "ใช้อันนี้ Mitr" }));
    await expect(within(rows[1] as HTMLElement).getByText("ใช้อยู่")).toBeVisible();
    await expect(p.getByText("ฟอนต์ที่อยากใช้: Mitr")).toBeVisible();
    const node = canvasElement.querySelector<HTMLElement>('.react-flow__node[data-id="font"]');
    await waitFor(() =>
      expect(within(node as HTMLElement).getByText("ฟอนต์ที่อยากใช้: Mitr")).toBeVisible(),
    );
  },
};

/** A mood with no word the rules know: no suggestion, and the panel says which words work. */
export const MoodNotRead: Story = {
  render: () => <Panel initial={select(MOODY, ["shape"])} />,
  play: async ({ canvasElement }) => {
    const p = panelOf(canvasElement);
    await expect(p.getByText("ยังอ่านมู้ดไม่ออก")).toBeVisible();
    const section = within(p.getByRole("region", { name: "ข้อเสนอตามกฎ" }));
    await expect(section.getByText(/ลองใช้คำอย่าง อบอุ่น/)).toBeVisible();
    await expect(section.queryByRole("button")).toBeNull();
  },
};

/** Narrow screens: the same content in a Sheet. */
export const InSheet: Story = {
  render: () => (
    <Narrow>
      <Sheet defaultOpen>
        <SheetContent title="สีตั้งต้น">
          <Inspector graph={select(MIDWAY, ["starter"])} onAnswer={() => undefined} />
        </SheetContent>
      </Sheet>
    </Narrow>
  ),
  play: async () => {
    const sheet = await within(document.body).findByRole("dialog", { name: "สีตั้งต้น" });
    await expect(within(sheet).getByText("ตามกฎ ยังไม่ใช้ AI")).toBeVisible();
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Panel initial={select(MIDWAY, ["starter"])} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText("ตามกฎ ยังไม่ใช้ AI")).toHaveLength(6);
  },
};
