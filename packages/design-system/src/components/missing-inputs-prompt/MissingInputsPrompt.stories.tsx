import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import type { Answer } from "../../blocks/index";
import { blockNode, feed } from "../block-library/fixtures";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import type { Graph } from "../canvas-board/graph";
import { Matrix } from "../matrix";
import { MissingInputsPrompt } from "./MissingInputsPrompt";

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

/** A board and the prompt for one of its nodes, sharing the graph as a shell would. */
function PromptBoard({
  initial,
  nodeId,
  board = true,
}: {
  initial: Graph;
  nodeId: string;
  board?: boolean;
}) {
  const [graph, setGraph] = useState(initial);
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return (
    <div className="grid items-start gap-4 md:grid-cols-[1fr_minmax(0,22rem)]">
      {board ? (
        <div style={{ height: 320 }}>
          <CanvasBoard
            label={`กระดาน${scope ? `, ${id} ${scope.mode}` : ""}`}
            graph={graph}
            onChange={setGraph}
            chrome={false}
          />
        </div>
      ) : null}
      <MissingInputsPrompt
        graph={graph}
        nodeId={nodeId}
        onAnswer={(node, input, value) => setGraph((g) => answer(g, node, input, value))}
      />
    </div>
  );
}

const BRIEF: Graph = {
  nodes: [
    blockNode("brief", "brief", { x: 0, y: 0 }),
    blockNode("audience", "audience", { x: 400, y: 0 }, { users: "คนทำงานอายุ 25 ถึง 35" }),
  ],
  edges: [feed("brief", "audience", "brief")],
};

const meta = {
  title: "Application/Missing inputs prompt",
  component: MissingInputsPrompt,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Asks a block node for its missing required inputs one at a time (ORV-44 part 2): k of n, the question as a labelled field of its answer type, skip and save. Each answer is written to the node at once; an edge from a complete node fills an input too.",
      },
    },
  },
  args: { graph: BRIEF, nodeId: "brief", onAnswer: () => undefined },
} satisfies Meta<typeof MissingInputsPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

const promptOf = (root: HTMLElement) => within(root).getByRole("group", { name: "คำถามของ บรีฟ" });

/**
 * Two questions: Enter saves the first, the node's count drops at once and the prompt moves on;
 * the last answer completes the brief and the audience downstream loses its missing mark.
 */
export const Default: Story = {
  render: () => <PromptBoard initial={BRIEF} nodeId="brief" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prompt = within(promptOf(canvasElement));
    await expect(prompt.getByText("ข้อ 1 จาก 2")).toBeVisible();
    await waitFor(() => expect(canvas.getAllByText("ยังว่าง")).toHaveLength(1));
    await userEvent.type(
      prompt.getByRole("textbox", { name: /ผลิตภัณฑ์นี้คืออะไร/ }),
      "แอปออมเงิน{Enter}",
    );
    await expect(prompt.getByText("ข้อ 1 จาก 1")).toBeVisible();
    await expect(prompt.getByRole("status")).toHaveTextContent("บันทึกผลิตภัณฑ์แล้ว");
    const [brief, audience] = [...canvasElement.querySelectorAll<HTMLElement>(".ds-node")] as [
      HTMLElement,
      HTMLElement,
    ];
    await waitFor(() => expect(within(brief).getByText("ถามอีก 1 ข้อ")).toBeVisible());
    await expect(within(brief).getByText("ผลิตภัณฑ์: แอปออมเงิน")).toBeVisible();
    await expect(within(audience).getByText("ถามอีก 1 ข้อ")).toBeVisible();
    await userEvent.type(
      prompt.getByRole("textbox", { name: /อยากให้ผลิตภัณฑ์นี้ช่วยใครทำอะไรได้/ }),
      "ช่วยคนทำงานเก็บเงินได้ทุกเดือน{Enter}",
    );
    await expect(prompt.getByText("บรีฟ มีข้อมูลที่ต้องใช้ครบแล้ว")).toBeVisible();
    await waitFor(() => expect(within(audience).getByText("สรุปแล้ว")).toBeVisible());
    await expect(within(audience).getByText("บรีฟ: จาก บรีฟ")).toBeVisible();
  },
};

/** Skip moves to the next question without writing; an empty answer is not saved. */
export const SkipAndRequired: Story = {
  render: () => <PromptBoard initial={BRIEF} nodeId="brief" board={false} />,
  play: async ({ canvasElement }) => {
    const prompt = within(promptOf(canvasElement));
    await userEvent.click(prompt.getByRole("button", { name: "บันทึก" }));
    await expect(prompt.getByText("ตอบข้อนี้ก่อนบันทึก")).toBeVisible();
    await expect(prompt.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(prompt.getByRole("button", { name: "ข้ามไปก่อน" }));
    await expect(prompt.getByText("ข้อ 2 จาก 2")).toBeVisible();
    await expect(
      prompt.getByRole("textbox", { name: /อยากให้ผลิตภัณฑ์นี้ช่วยใครทำอะไรได้/ }),
    ).toHaveValue("");
    await userEvent.click(prompt.getByRole("button", { name: "ข้ามไปก่อน" }));
    await expect(prompt.getByText("ข้อ 1 จาก 2")).toBeVisible();
  },
};

/** Colours: hex codes separated by commas; a code that is not a colour is named in the error. */
export const Colours: Story = {
  render: () => (
    <PromptBoard
      initial={{ nodes: [blockNode("c", "typed-colours", { x: 0, y: 0 })], edges: [] }}
      nodeId="c"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prompt = within(
      within(canvasElement).getByRole("group", { name: "คำถามของ สีที่พิมพ์มา" }),
    );
    const field = prompt.getByRole("textbox", { name: /รหัสสี/ });
    await userEvent.type(field, "#7A22C7, ม่วง{Enter}");
    await expect(prompt.getByText("อ่านรหัสสีนี้ไม่ได้: ม่วง")).toBeVisible();
    await userEvent.clear(field);
    await userEvent.type(field, "#7A22C7, c6f432{Enter}");
    await waitFor(() => expect(canvas.getByText("สรุปแล้ว")).toBeVisible());
    await expect(canvas.getByText("สี: #7a22c7, #c6f432")).toBeVisible();
    await expect(canvasElement.querySelectorAll(".ds-node__swatch")).toHaveLength(2);
  },
};

/** A choice is a Select of the registry's options; the summary words it by its option. */
export const Choice: Story = {
  render: () => (
    <PromptBoard
      initial={{ nodes: [blockNode("p", "platform-languages", { x: 0, y: 0 })], edges: [] }}
      nodeId="p"
    />
  ),
  play: async ({ canvasElement }) => {
    const prompt = within(
      within(canvasElement).getByRole("group", { name: "คำถามของ แพลตฟอร์มและภาษา" }),
    );
    await userEvent.click(prompt.getByRole("combobox", { name: /ใช้บนแพลตฟอร์มไหน/ }));
    await userEvent.click(
      await within(document.body).findByRole("option", { name: "ทั้งเว็บและแอป" }),
    );
    await userEvent.click(prompt.getByRole("button", { name: "บันทึก" }));
    await waitFor(() =>
      expect(within(canvasElement).getByText("แพลตฟอร์ม: ทั้งเว็บและแอป")).toBeVisible(),
    );
    await expect(prompt.getByText("ข้อ 1 จาก 1")).toBeVisible();
  },
};

/** An image input says uploads come later and offers skip only; nothing pretends to upload. */
export const ImagesLater: Story = {
  render: () => (
    <PromptBoard
      initial={{ nodes: [blockNode("r", "sample-website", { x: 0, y: 0 })], edges: [] }}
      nodeId="r"
      board={false}
    />
  ),
  play: async ({ canvasElement }) => {
    const prompt = within(
      within(canvasElement).getByRole("group", { name: "คำถามของ เว็บไซต์ตัวอย่าง" }),
    );
    await expect(prompt.getByText("การอัปโหลดภาพมาในงานถัดไป ข้ามข้อนี้ไปก่อนได้")).toBeVisible();
    await expect(prompt.queryByRole("button", { name: "บันทึก" })).toBeNull();
  },
};

/** Nothing missing: the prompt says so, with the mark and the word, never colour alone. */
export const Complete: Story = {
  render: () => (
    <PromptBoard
      initial={{
        nodes: [blockNode("c", "typed-colours", { x: 0, y: 0 }, { colours: ["#7a22c7"] })],
        edges: [],
      }}
      nodeId="c"
      board={false}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("สีที่พิมพ์มา มีข้อมูลที่ต้องใช้ครบแล้ว"),
    ).toBeVisible();
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <PromptBoard initial={BRIEF} nodeId="brief" board={false} />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText("ข้อ 1 จาก 2")).toHaveLength(6);
  },
};
