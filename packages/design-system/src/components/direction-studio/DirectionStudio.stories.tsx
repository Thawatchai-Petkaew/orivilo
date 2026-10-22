import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { PROJECTS, WorkspaceScreen } from "../../examples/workspace";
import { messagesFor } from "../../i18n/messages/index";
import { Under } from "../matrix";
import { DirectionStudio } from "./DirectionStudio";

const th = messagesFor("th").direction;
const en = messagesFor("en").direction;

const meta = {
  title: "Application/Direction studio",
  component: DirectionStudio,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two directions on the same task (ORV-34 part 2, handoff §17.3): a brief or a sample brief, what the rules read from it (labelled as rules, not AI), the profile the engine chose and the one that differs most with the brief's words behind each decision, and one live preview of the reference screen under the direction being viewed. Switching keeps what the person typed or selected in the preview. Part 3 adds Refine (shape, type and motion, borrowed from a hand-made profile) and Trace (brief, decisions, tokens, components).",
      },
    },
  },
  args: {
    preview: <WorkspaceScreen latency={0} />,
    defaultBrief: th.preset1Text,
  },
} satisfies Meta<typeof DirectionStudio>;

export default meta;
type Story = StoryObj<typeof meta>;

const cards = (root: HTMLElement) => [
  ...root.querySelectorAll<HTMLElement>(".ds-direction__cards > .ds-card"),
];
const cardOf = (root: HTMLElement, name: string) =>
  within(root)
    .getByRole("heading", { level: 4, name })
    .closest<HTMLElement>(".ds-card") as HTMLElement;
const previewScope = (root: HTMLElement) =>
  within(root)
    .getByRole("region", { name: th.preview })
    .querySelector<HTMLElement>("[data-design-profile]");

/** A finance brief: the reading quotes the brief, สุขุม is recommended with its reasons, เป็นมิตร is the contrast (AC 1 to 3). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reading = within(canvas.getByRole("region", { name: new RegExp(th.reading) }));
    await expect(reading.getByText(th.byRules)).toBeVisible();
    await expect(reading.getByText("เป็นระเบียบ: ต้องการ")).toBeVisible();
    await expect(reading.getByText("พรีเมียม: ต้องการ")).toBeVisible();
    await expect(reading.getByText("จากคำว่า หรูหรา")).toBeVisible();
    await expect(reading.getByText("สนุก: พอประมาณ")).toBeVisible();

    const recommended = within(cardOf(canvasElement, "สุขุม"));
    await expect(recommended.getByText(th.recommended)).toBeVisible();
    await expect(
      recommended.getByText("ตรงกับบรีฟ: รูปทรง เหลี่ยมคม, การเคลื่อนไหว นิ่ง"),
    ).toBeVisible();
    await expect(recommended.getByText("รูปทรง เหลี่ยมคม เพราะ เป็นระเบียบ")).toBeVisible();
    await expect(recommended.getByText("การเคลื่อนไหว นิ่ง เพราะ หรูหรา")).toBeVisible();
    await expect(recommended.getByRole("img", { name: "ตัวอย่างย่อของ สุขุม" })).toBeVisible();

    const contrast = within(cardOf(canvasElement, "เป็นมิตร"));
    await expect(contrast.getByText(th.contrast)).toBeVisible();
    await expect(contrast.getByText(th.matchesNone)).toBeVisible();
    await expect(
      contrast.getByText(
        "ต่างจากบรีฟ: รูปทรง เป็นมนนุ่ม แทนเหลี่ยมคม, การเคลื่อนไหว เป็นปกติ แทนนิ่ง",
      ),
    ).toBeVisible();

    await expect(canvas.getByText("ยังไม่มีกฎตัดสิน: พื้นผิว, การเน้น, ตัวอักษร")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ดูทิศทางนี้ สุขุม" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe("professional");
  },
};

/** Switching direction changes the preview's profile only: a selected row and the screen stay (AC 4). */
export const SwitchKeepsWork: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = within(canvas.getByRole("region", { name: th.preview }));
    const row = PROJECTS[1]?.name ?? "";
    await userEvent.click(preview.getByRole("checkbox", { name: `เลือก ${row}` }));
    await expect(preview.getByText("เลือกอยู่ 1 โปรเจกต์")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "ดูทิศทางนี้ เป็นมิตร" }));
    await waitFor(() =>
      expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe("friendly"),
    );
    await expect(canvas.getByText(/ในทิศทาง เป็นมิตร/)).toBeVisible();
    await expect(preview.getByRole("checkbox", { name: `เลือก ${row}` })).toBeChecked();
    await expect(preview.getByText("เลือกอยู่ 1 โปรเจกต์")).toBeVisible();
    await expect(cardOf(canvasElement, "เป็นมิตร")).toHaveAttribute("data-selected");
    await expect(within(cardOf(canvasElement, "เป็นมิตร")).getByText(th.inUse)).toBeVisible();
    await expect(cardOf(canvasElement, "สุขุม")).not.toHaveAttribute("data-selected");

    // The radius really changes with the direction, so the two are visibly different.
    const radius = () =>
      getComputedStyle(previewScope(canvasElement) as HTMLElement)
        .getPropertyValue("--ds-shape-control-radius")
        .trim();
    const friendly = radius();
    await userEvent.click(canvas.getByRole("button", { name: "ดูทิศทางนี้ สุขุม" }));
    await waitFor(() => expect(radius()).not.toBe(friendly));
    await expect(preview.getByRole("checkbox", { name: `เลือก ${row}` })).toBeChecked();
  },
};

/** A sample brief replaces the text; a travel brief recommends เป็นมิตร with its words (AC 5). */
export const SampleBriefs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: th.preset2 }));
    await expect(canvas.getByRole("textbox", { name: new RegExp(th.brief) })).toHaveValue(
      th.preset2Text,
    );
    await expect(canvas.getByRole("button", { name: th.preset2 })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const recommended = within(cardOf(canvasElement, "เป็นมิตร"));
    await expect(recommended.getByText(th.recommended)).toBeVisible();
    await expect(recommended.getByText("การเน้น โดดเด่น เพราะ โดดเด่น")).toBeVisible();
    await waitFor(() =>
      expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe("friendly"),
    );
  },
};

/** Rules that disagree stay a conflict in words; both directions are still offered (AC 6). */
export const Tie: Story = {
  args: { defaultBrief: th.preset3Text },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("ยังตัดสินไม่ได้: รูปทรง ระหว่าง เหลี่ยมคม หรือ มนนุ่ม"),
    ).toBeVisible();
    await expect(cards(canvasElement)).toHaveLength(2);
  },
};

/** Nothing read: no direction is invented, the clause is named and the preview stays in the base set (AC 7). */
export const NotRead: Story = {
  args: { defaultBrief: "ฟ้าใส" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(th.unread)).toBeVisible();
    await expect(canvas.getByText("ยังไม่เข้าใจ: ฟ้าใส")).toBeVisible();
    await expect(canvas.queryByRole("region", { name: th.directions })).toBeNull();
    await expect(canvas.getByText(th.previewNeutral)).toBeVisible();
    await expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe("neutral");
  },
};

/** A brand lock holds and says so; the brief's other wish is listed as a conflict (AC 8). */
export const Locked: Story = {
  args: { defaultBrief: th.preset2Text, locked: { emphasis: "restrained" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("การเน้น ล็อกไว้เป็นสุขุม แต่บรีฟเสนอโดดเด่น")).toBeVisible();
    await expect(canvas.getAllByText("การเน้น สุขุม ล็อกโดยแบรนด์").length).toBeGreaterThan(0);
  },
};

/** English, dark, at 360 wide: the cards stack and the copy comes from the catalog. */
export const EnglishDarkNarrow: Story = {
  globals: { locale: "en" },
  args: { defaultBrief: en.preset1Text },
  render: (args) => (
    <Under profile="neutral" mode="dark">
      <div style={{ width: 360 }}>
        <DirectionStudio {...args} />
      </div>
    </Under>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(en.byRules)).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 4, name: "Professional" })).toBeVisible();
    const [a, b] = cards(canvasElement);
    await expect(
      a && b ? b.getBoundingClientRect().top > a.getBoundingClientRect().bottom : false,
    ).toBe(true);
  },
};

const refineRegion = (root: HTMLElement) =>
  within(within(root).getByRole("region", { name: th.refine }));
const radiusOf = (root: HTMLElement) =>
  getComputedStyle(previewScope(root) as HTMLElement)
    .getPropertyValue("--ds-shape-control-radius")
    .trim();
const anyVisible = (els: HTMLElement[]) => els.some((el) => el.checkVisibility());

/** Refining shape on สุขุม changes the preview at once and keeps the work; rounded has no tokens; reset returns the hand-made profile (part 3, AC 1 to 3 and 5). */
export const Refine: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = within(canvas.getByRole("region", { name: th.preview }));
    const refine = refineRegion(canvasElement);
    const row = PROJECTS[1]?.name ?? "";
    await userEvent.click(preview.getByRole("checkbox", { name: `เลือก ${row}` }));

    await expect(refine.getByRole("radio", { name: "เหลี่ยมคม" })).toBeChecked();
    await expect(refine.getByRole("radio", { name: "แบบเดียว" })).toBeChecked();
    await expect(refine.getByRole("radio", { name: "นิ่ง" })).toBeChecked();
    await expect(refine.getByRole("radio", { name: "มนเล็กน้อย" })).toBeDisabled();
    await expect(
      refine.getByText("มนเล็กน้อย ยังไม่มีโปรไฟล์ไหนที่มีค่านี้ จึงยังเลือกไม่ได้"),
    ).toBeVisible();
    await expect(refine.getAllByText(/ยังปรับไม่ได้ เพราะเปลี่ยนสีด้วย/)).toHaveLength(2);
    await expect(refine.getByRole("button", { name: th.reset })).toBeDisabled();

    const handMade = radiusOf(canvasElement);
    await userEvent.click(refine.getByRole("radio", { name: "มนนุ่ม" }));
    await waitFor(() => expect(radiusOf(canvasElement)).not.toBe(handMade));
    await expect(refine.getByRole("radio", { name: "มนนุ่ม" })).toBeChecked();
    await expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe(
      "professional-refined",
    );
    await expect(preview.getByRole("checkbox", { name: `เลือก ${row}` })).toBeChecked();
    await expect(
      anyVisible(canvas.getAllByText("รูปทรง มนนุ่ม ปรับเอง: เลือกในส่วนปรับละเอียด")),
    ).toBe(true);

    await userEvent.click(refine.getByRole("button", { name: th.reset }));
    await waitFor(() => expect(radiusOf(canvasElement)).toBe(handMade));
    await expect(previewScope(canvasElement)?.dataset["designProfile"]).toBe("professional");
    await expect(refine.getByRole("radio", { name: "เหลี่ยมคม" })).toBeChecked();
    await expect(preview.getByRole("checkbox", { name: `เลือก ${row}` })).toBeChecked();
  },
};

/** A brand lock on shape: the shape group cannot be changed and says why; the preview keeps its shape (part 3, AC 4). */
export const RefineLocked: Story = {
  args: { locked: { shape: "crisp" } },
  play: async ({ canvasElement }) => {
    const refine = refineRegion(canvasElement);
    const before = radiusOf(canvasElement);
    for (const name of ["เหลี่ยมคม", "มนเล็กน้อย", "มนนุ่ม"]) {
      await expect(refine.getByRole("radio", { name })).toBeDisabled();
    }
    await expect(refine.getByText("รูปทรง เหลี่ยมคม ล็อกโดยแบรนด์")).toBeVisible();
    await userEvent.click(refine.getByRole("radio", { name: "มนนุ่ม" }), {
      pointerEventsCheck: 0,
    });
    await expect(radiusOf(canvasElement)).toBe(before);
    // Other decisions stay refinable under a shape lock.
    await expect(refine.getByRole("radio", { name: "ปกติ" })).toBeEnabled();
  },
};

/** The trace opens in four steps, from the brief's words to the components (part 3, AC 6). */
export const Trace: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trace = canvas.getByRole("region", { name: th.trace });
    const summaries = [...trace.querySelectorAll("summary")];
    await expect(summaries.map((s) => s.textContent)).toEqual([
      th.traceBrief,
      th.traceDecisions,
      th.traceTokens,
      th.traceComponents,
    ]);
    for (const summary of summaries) await userEvent.click(summary);
    const t = within(trace);
    await expect(t.getByText("จากคำว่า หรูหรา")).toBeVisible();
    await expect(t.getByText("รูปทรง เหลี่ยมคม เพราะ เป็นระเบียบ")).toBeVisible();
    await expect(t.getByText("พื้นผิว มีเส้นขอบ: ค่าของ สุขุม บรีฟไม่ได้ขอ")).toBeVisible();
    await expect(t.getByText("ค่าในโหมดสว่าง")).toBeVisible();
    await expect(t.getByText(/^shape\.control\.radius: .+ เป็น .+$/)).toBeVisible();
    await expect(t.getByText(/button/)).toBeVisible();
    await expect(t.getByText(/input/)).toBeVisible();
  },
};
